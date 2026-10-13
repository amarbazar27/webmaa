import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'bdretailers_meta_webhook_secret_2026';

// GET: Meta Webhook Verification Challenge
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook] Successfully verified with challenge token!');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[Meta Webhook] Verification token mismatch. Expected:', VERIFY_TOKEN, 'Received:', token);
  return new NextResponse('Forbidden', { status: 403 });
}

// Helper: Send Facebook Messenger private message
async function sendFacebookMessage(recipientId, text, pageAccessToken) {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
        access_token: pageAccessToken
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Facebook Messenger Send Error]:', err.message);
    return null;
  }
}

// Helper: Reply publicly to a Facebook Post Comment
async function sendFacebookCommentReply(commentId, text, pageAccessToken) {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        access_token: pageAccessToken
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Facebook Comment Reply Error]:', err.message);
    return null;
  }
}

// Helper: Dual-engine AI generator (Groq Llama 3.3 70B primary for flawless standard Bangla, Vyce AI fallback)
async function getAiReply(messages, shopContext) {
  // 1. Primary: Groq LPU (Llama 3.3 70B Versatile — Ultra-fluent standard Bangla, zero hallucinations, 300 tps)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: shopContext },
            ...messages
          ],
          max_tokens: 450,
          temperature: 0.35
        })
      });
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const reply = groqData.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch (groqErr) {
      console.warn('[Facebook Webhook Groq Warning, falling back to Vyce AI]:', groqErr.message);
    }
  }

  // 2. Fallback: Vyce AI (Agnes 3.0 Flash)
  const vyceKey = process.env.VYCE_AI_API_KEY;
  if (vyceKey) {
    try {
      const res = await fetch('https://vyceai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${vyceKey}` 
        },
        body: JSON.stringify({
          model: 'agnes-3.0-flash',
          messages: [
            { role: 'system', content: shopContext },
            ...messages
          ],
          max_tokens: 450,
          temperature: 0.4
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error('[Facebook Webhook Vyce AI Error]:', err.message);
    }
  }
  return null;
}

import crypto from 'crypto';

function verifySignature(payload, signature) {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret || !signature) return true; // bypass if secret not set
  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const incoming = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(Buffer.from(incoming, 'hex'), Buffer.from(expected, 'hex'));
  } catch (err) {
    return false;
  }
}

export async function POST(request) {
  try {
    const rawText = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    if (process.env.FACEBOOK_APP_SECRET && !verifySignature(rawText, signature)) {
      console.warn('[Meta Webhook] Invalid HMAC SHA256 signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = JSON.parse(rawText || '{}');

    if (body.object === 'page') {
      for (const entry of (body.entry || [])) {
        const pageId = entry.id;

        // Lookup shop connection (check doc ID first, then field pageId)
        let shopId = null;
        let pageAccessToken = null;

        const connectionDoc = await adminDb.collection('social_connections').doc(pageId).get();
        if (connectionDoc.exists) {
          const connData = connectionDoc.data();
          shopId = connData.shopId;
          pageAccessToken = connData.pageAccessToken;
        } else {
          const querySnap = await adminDb.collection('social_connections').where('pageId', '==', pageId).limit(1).get();
          if (!querySnap.empty) {
            const connData = querySnap.docs[0].data();
            shopId = connData.shopId;
            pageAccessToken = connData.pageAccessToken;
          }
        }

        if (!shopId || !pageAccessToken) {
          console.warn('[Meta Webhook] No matching shop connection found for pageId:', pageId);
          continue;
        }

        // Fetch shop details and automation settings
        const shopDoc = await adminDb.collection('shops').doc(shopId).get();
        const shopData = shopDoc.exists ? shopDoc.data() : {};
        const shopName = shopData.shopName || shopData.name || 'Store';
        let commentSettings = shopData.commentAutomation;
        if (!commentSettings) {
          const sDoc = await adminDb.collection('shops').doc(shopId).collection('settings').doc('socialAutomation').get();
          if (sDoc.exists) {
            commentSettings = sDoc.data()?.commentAutomation;
          }
        }
        commentSettings = commentSettings || {};

        // ── 1. Handle Messenger Messages ──────────────────────────
        if (entry.messaging) {
          for (const event of entry.messaging) {
            const senderId = event.sender?.id;
            if (!senderId || senderId === pageId) continue;

            if (event.message && !event.message.is_echo) {
              const text = event.message.text;
              if (!text) continue;

              const conversationRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(senderId);
              const conversationDoc = await conversationRef.get();
              let conversationData = conversationDoc.exists ? conversationDoc.data() : {
                platform: 'facebook',
                senderName: 'Facebook User',
                senderPsid: senderId,
                messages: [],
                aiPaused: false,
                shopId
              };

              // Human Takeover via '.' command
              if (text.trim() === '.') {
                conversationData.aiPaused = !conversationData.aiPaused;
                await conversationRef.set({
                  aiPaused: conversationData.aiPaused,
                  lastMessageAt: FieldValue.serverTimestamp()
                }, { merge: true });
                continue;
              }

              // Append user message
              conversationData.messages.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
              await conversationRef.set({
                ...conversationData,
                lastMessage: text,
                lastMessageAt: FieldValue.serverTimestamp()
              }, { merge: true });

              // Record Lead
              await adminDb.collection('shops').doc(shopId).collection('leads').doc(senderId).set({
                name: 'Facebook User',
                source: 'facebook_message',
                fbId: senderId,
                message: text,
                status: 'new',
                createdAt: FieldValue.serverTimestamp(),
                shopId
              }, { merge: true });

              // Generate AI reply if AI is active
              if (!conversationData.aiPaused && !shopData?.aiSettings?.globallyPaused) {
                // Load products for RAG context
                const productsSnapshot = await adminDb.collection('shops').doc(shopId).collection('products').limit(30).get();
                let productList = '';
                productsSnapshot.forEach(doc => {
                  const p = doc.data();
                  productList += `- ${p.name || ''}: ৳${p.price || ''}\n`;
                });

                const customPrompt = shopData.aiSettings?.customPrompt || '';
                const deliveryInfo = shopData.aiSettings?.deliveryInfo || '';
                const knowledgeBase = shopData.knowledgeBase || '';
                const shopContext = `তুমি "${shopName}"-এর অফিসিয়াল কাস্টমার সাপোর্ট এবং সেলস এক্সিকিউটিভ।

গুরুত্বপূর্ণ নির্দেশনা (কঠোরভাবে মানতে হবে):
১. ভাষা: সর্বদা অত্যন্ত মার্জিত, প্রমিত এবং ভদ্র বাংলায় কথা বলবে। কাস্টমারকে শ্রদ্ধার সাথে 'আপনি' বা মার্জিতভাবে 'ভাইয়া/আপু' সম্বোধন করবে।
২. নিষিদ্ধ: কখনোই অপভ্রংশ, অশুদ্ধ বা অদ্ভুত আঞ্চলিক শব্দ (যেমন: 'দাদু', 'আউদি', 'দোস্ত' ইত্যাদি) ব্যবহার করবে না।
৩. সত্যনিষ্ঠ তথ্য: তালিকার বাইরের কোনো কাল্পনিক পণ্যের নাম বা মিথ্যা দাম বানিয়ে বলবে না। যদি কোনো তথ্য তালিকায় না থাকে, তবে বিনয়ের সাথে বলবে যে আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবে।
৪. দাম ও সংখ্যা: প্রমিত বাংলায় বা স্পষ্ট সংখ্যায় (যেমন: ৳৫০০ বা ৫০০ টাকা) লিখবে।
৫. উত্তর শৈলী: উত্তর হবে স্পষ্ট, সংক্ষিপ্ত (১-৩ বাক্য) এবং সরাসরি কাস্টমারের প্রশ্নের সমাধানকেন্দ্রিক।

দোকানের পণ্য তালিকা:
${productList || 'পণ্য তালিকা লোড করা হচ্ছে'}
ডেলিভারি সংক্রান্ত তথ্য:
${deliveryInfo || 'সারাদেশে হোম ডেলিভারি সুবিধা রয়েছে।'}
দোকানের পলিসি ও নিয়মাবলী:
${knowledgeBase}
${customPrompt ? `বিশেষ নির্দেশনা:\n${customPrompt}` : ''}`;

                const aiMessages = conversationData.messages.slice(-8).map(m => ({
                  role: m.role === 'retailer' ? 'assistant' : m.role,
                  content: m.content
                }));

                const reply = await getAiReply(aiMessages, shopContext);
                if (reply) {
                  await sendFacebookMessage(senderId, reply, pageAccessToken);
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

        // ── 2. Handle Feed Events (Comments, Likes) ───────────────
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'feed') {
              const item = change.value?.item;
              const verb = change.value?.verb;
              const senderId = change.value?.from?.id;
              const senderName = change.value?.from?.name || 'Facebook User';
              const commentId = change.value?.comment_id;

              if (!senderId || senderId === pageId) continue;

              if (item === 'comment' && verb === 'add') {
                const commentText = change.value?.message || '';

                // Capture Lead
                await adminDb.collection('shops').doc(shopId).collection('leads').doc(senderId).set({
                  name: senderName,
                  source: 'facebook_comment',
                  fbId: senderId,
                  message: commentText,
                  status: 'new',
                  createdAt: FieldValue.serverTimestamp(),
                  shopId
                }, { merge: true });

                // Check comment automation settings
                const isAutoReplyEnabled = commentSettings.enabled !== false;
                if (isAutoReplyEnabled) {
                  // A. Send Public Comment Reply if configured
                  const publicReply = commentSettings.publicReply || 'ধন্যবাদ আপনার কমেন্টের জন্য ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে 😊';
                  if (commentId) {
                    await sendFacebookCommentReply(commentId, publicReply, pageAccessToken);
                  }

                  // B. Send Private DM to the commenter
                  const privateDm = commentSettings.privateDm || 'আসসালামু আলাইকুম! আমাদের সাথে যোগাযোগ করার জন্য ধন্যবাদ। কোনো পণ্য সম্পর্কে জানতে চাইলে এখনই মেসেজ দিন।';
                  await sendFacebookMessage(senderId, privateDm, pageAccessToken);

                  // Create/Update Conversation
                  const conversationRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(senderId);
                  await conversationRef.set({
                    platform: 'facebook',
                    senderName,
                    senderPsid: senderId,
                    lastMessage: privateDm,
                    lastMessageAt: FieldValue.serverTimestamp(),
                    aiPaused: false,
                    shopId,
                    messages: [
                      { role: 'user', content: `[Post Comment]: ${commentText}`, timestamp: new Date().toISOString() },
                      { role: 'assistant', content: `[Auto DM]: ${privateDm}`, timestamp: new Date().toISOString() }
                    ]
                  }, { merge: true });
                }
              } else if (item === 'like' || item === 'follow') {
                await adminDb.collection('shops').doc(shopId).collection('leads').doc(`${senderId}_${Date.now()}`).set({
                  name: senderName,
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
    console.error('[Meta Webhook Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
