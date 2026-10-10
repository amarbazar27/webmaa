import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

// GET: Webhook verification
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

async function sendFacebookMessage(recipientId, text, pageAccessToken) {
  await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
      access_token: pageAccessToken
    })
  });
}

async function getAiReply(messages, shopContext) {
  const apiKey = process.env.VYCE_AI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch('https://vyceai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'agnes-3.0-flash',
      messages: [
        { role: 'system', content: shopContext },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const pageId = entry.id;

        // Lookup shop connection
        const connectionDoc = await adminDb.collection('social_connections').doc(pageId).get();
        if (!connectionDoc.exists) continue;

        const connection = connectionDoc.data();
        const shopId = connection.shopId;
        const pageAccessToken = connection.pageAccessToken;

        // Handle Messaging Events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            const senderId = event.sender.id;
            
            // Handle Message
            if (event.message && !event.message.is_echo) {
              const text = event.message.text;
              if (!text) continue;

              const conversationRef = adminDb.collection(`shops/${shopId}/conversations`).doc(senderId);
              const conversationDoc = await conversationRef.get();
              let conversationData = conversationDoc.exists ? conversationDoc.data() : {
                platform: 'facebook',
                senderName: 'Facebook User',
                senderPsid: senderId,
                messages: [],
                aiPaused: false,
                shopId
              };

              // Check for human handoff toggle
              if (text === '.') {
                conversationData.aiPaused = !conversationData.aiPaused;
                await conversationRef.set({
                  aiPaused: conversationData.aiPaused,
                  lastMessageAt: FieldValue.serverTimestamp()
                }, { merge: true });
                continue;
              }

              // Update conversation
              conversationData.messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
              
              await conversationRef.set({
                ...conversationData,
                lastMessage: text,
                lastMessageAt: FieldValue.serverTimestamp()
              }, { merge: true });

              // Save Lead
              const leadsRef = adminDb.collection(`shops/${shopId}/leads`).doc(senderId);
              await leadsRef.set({
                name: 'Facebook User',
                source: 'facebook_message',
                fbId: senderId,
                message: text,
                status: 'new',
                createdAt: FieldValue.serverTimestamp(),
                shopId
              }, { merge: true });

              // AI Reply
              if (!conversationData.aiPaused) {
                // Get shop context
                const productsSnapshot = await adminDb.collection(`shops/${shopId}/products`).limit(50).get();
                let productList = '';
                productsSnapshot.forEach(doc => {
                  const p = doc.data();
                  productList += `${p.name} - ${p.price}\n`;
                });
                
                // Get shop doc
                const shopDoc = await adminDb.collection('shops').doc(shopId).get();
                const shopName = shopDoc.exists ? shopDoc.data().name : 'Store';

                const shopContext = `তুমি ${shopName}-এর AI সেলসম্যান। বাংলায় উত্তর দাও। পণ্য:\n${productList}`;
                
                // Format messages for AI
                const aiMessages = conversationData.messages.map(m => ({
                  role: m.role === 'retailer' ? 'assistant' : m.role,
                  content: m.content
                }));

                const reply = await getAiReply(aiMessages, shopContext);
                if (reply) {
                  await sendFacebookMessage(senderId, reply, pageAccessToken);
                  
                  // Save AI reply to conversation
                  conversationData.messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString() });
                  await conversationRef.set({
                    messages: conversationData.messages,
                    lastMessage: reply,
                    lastMessageAt: FieldValue.serverTimestamp()
                  }, { merge: true });
                }
              }
            }
          }
        }

        // Handle Feed Events (Comments/Likes)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'feed') {
              const item = change.value.item;
              const verb = change.value.verb;
              const senderId = change.value.from?.id;
              if (!senderId || senderId === pageId) continue; // Skip own actions

              if (item === 'comment' && verb === 'add') {
                const text = change.value.message;
                
                // Save Lead
                const leadsRef = adminDb.collection(`shops/${shopId}/leads`).doc(senderId);
                await leadsRef.set({
                  name: change.value.from.name || 'Facebook User',
                  source: 'facebook_comment',
                  fbId: senderId,
                  message: text,
                  status: 'new',
                  createdAt: FieldValue.serverTimestamp(),
                  shopId
                }, { merge: true });

                // Auto-send a DM reply via Vyce AI
                const productsSnapshot = await adminDb.collection(`shops/${shopId}/products`).limit(50).get();
                let productList = '';
                productsSnapshot.forEach(doc => {
                  const p = doc.data();
                  productList += `${p.name} - ${p.price}\n`;
                });
                
                const shopDoc = await adminDb.collection('shops').doc(shopId).get();
                const shopName = shopDoc.exists ? shopDoc.data().name : 'Store';

                const shopContext = `তুমি ${shopName}-এর AI সেলসম্যান। বাংলায় উত্তর দাও। পণ্য:\n${productList}`;
                
                const reply = await getAiReply([{ role: 'user', content: `Commented: ${text}` }], shopContext);
                
                if (reply) {
                  await sendFacebookMessage(senderId, reply, pageAccessToken);
                  
                  const conversationRef = adminDb.collection(`shops/${shopId}/conversations`).doc(senderId);
                  await conversationRef.set({
                    platform: 'facebook',
                    senderName: change.value.from.name || 'Facebook User',
                    senderPsid: senderId,
                    lastMessage: reply,
                    lastMessageAt: FieldValue.serverTimestamp(),
                    aiPaused: false,
                    shopId,
                    messages: [
                      { role: 'user', content: `[Comment]: ${text}`, timestamp: new Date().toISOString() },
                      { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
                    ]
                  }, { merge: true });
                }
              } else if (item === 'like' || item === 'follow') {
                // Save Lead for Like/Follow
                const leadId = `${senderId}_${Date.now()}`;
                const leadsRef = adminDb.collection(`shops/${shopId}/leads`).doc(leadId);
                await leadsRef.set({
                  name: change.value.from?.name || 'Facebook User',
                  source: `facebook_${item}`,
                  fbId: senderId,
                  message: `User ${verb}ed`,
                  status: 'new',
                  createdAt: FieldValue.serverTimestamp(),
                  shopId
                }, { merge: true });
              }
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
