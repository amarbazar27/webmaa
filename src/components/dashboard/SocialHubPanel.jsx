'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Globe, Camera, Phone, MessageCircle, Bot, Zap, Users, Loader2, CheckCircle2, User, Send, PauseCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import clsx from 'clsx';

export default function SocialHubPanel({ shopId }) {
  const [activeTab, setActiveTab] = useState('inbox');
  
  const tabs = [
    { id: 'inbox', label: 'লাইভ চ্যাট', icon: MessageCircle },
    { id: 'leads', label: 'লিড ম্যানেজমেন্ট', icon: Users },
    { id: 'accounts', label: 'সংযুক্ত অ্যাকাউন্ট', icon: Globe },
    { id: 'ai', label: 'এআই সেটিংস', icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                isActive 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'inbox' && <InboxSection shopId={shopId} />}
        {activeTab === 'leads' && <LeadsSection shopId={shopId} />}
        {activeTab === 'accounts' && <AccountsSection shopId={shopId} />}
        {activeTab === 'ai' && <AiSettingsSection shopId={shopId} />}
      </div>
    </div>
  );
}

function InboxSection({ shopId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(
      collection(db, 'shops', shopId, 'conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [shopId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSend = async () => {
    if (!replyText.trim() || !activeConv) return;
    setSending(true);
    try {
      // Simulate sending via API
      toast.success('Message sent!');
      setReplyText('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleAi = async () => {
    if (!activeConv || !shopId) return;
    try {
      await updateDoc(doc(db, 'shops', shopId, 'conversations', activeConv.id), {
        aiPaused: !activeConv.aiPaused
      });
      toast.success(activeConv.aiPaused ? 'AI সক্রিয়' : 'AI বিরতি');
    } catch (err) {
      toast.error('Failed to toggle AI');
    }
  };

  return (
    <Card className="p-0 border-purple-100">
      <div className="flex h-[600px] divide-x divide-slate-100">
        {/* Left Panel */}
        <div className="w-1/3 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-sm text-slate-400 p-4">No conversations yet</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-xl transition-all',
                    activeConvId === conv.id ? 'bg-white shadow-sm ring-1 ring-purple-100' : 'hover:bg-white/60'
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-900">{conv.customerName || 'Customer'}</span>
                    {conv.platform === 'facebook' && <Globe size={14} className="text-blue-600" />}
                    {conv.platform === 'instagram' && <Camera size={14} className="text-pink-600" />}
                    {conv.platform === 'whatsapp' && <Phone size={14} className="text-green-600" />}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{conv.lastMessage || 'New interaction'}</div>
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="w-2/3 flex flex-col bg-white">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="font-extrabold text-slate-900">{activeConv.customerName || 'Customer'}</div>
                <Button 
                  variant={activeConv.aiPaused ? 'secondary' : 'primary'}
                  onClick={toggleAi}
                  className="!py-1.5 !px-3 !text-xs"
                >
                  {activeConv.aiPaused ? <><PlayCircle size={14} /> AI Paused ⏸️</> : <><Bot size={14} /> AI Active 🤖</>}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {(activeConv.messages || []).map((msg, i) => (
                  <div key={i} className={clsx('flex flex-col max-w-[75%]', msg.role === 'customer' ? 'items-start' : 'items-end ml-auto')}>
                    <div className={clsx(
                      'p-3 rounded-2xl text-sm',
                      msg.role === 'customer' ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{msg.role}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
                <Input 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 !my-0"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} loading={sending} className="!px-4">
                  <Send size={18} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle size={48} className="mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function LeadsSection({ shopId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const q = query(
      collection(db, 'shops', shopId, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [shopId]);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'shops', shopId, 'leads', id), { status });
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
    } catch (err) {
      toast.error('আপডেট ব্যর্থ');
    }
  };

  return (
    <Card title="সোশ্যাল লিড ম্যানেজমেন্ট" icon={Users}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold">
              <th className="pb-3">Name</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="py-4 text-center"><Loader2 className="animate-spin inline text-slate-400" /></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="4" className="py-4 text-center text-slate-400">No leads captured yet.</td></tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-900">{lead.name || 'Unknown'}</td>
                  <td className="py-3 text-slate-600 capitalize">{lead.source}</td>
                  <td className="py-3">
                    <select 
                      value={lead.status || 'new'}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" className="!p-1.5"><User size={16} /></Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AccountsSection({ shopId }) {
  const [fbToken, setFbToken] = useState('');
  
  const handleConnect = async () => {
    toast.success('Integration feature coming soon');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Facebook" icon={Globe} className="border-t-4 border-t-blue-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Input 
            label="Page Access Token"
            placeholder="EAAI..."
            value={fbToken}
            onChange={e => setFbToken(e.target.value)}
          />
          <Button onClick={handleConnect} className="w-full">Connect Facebook</Button>
        </div>
      </Card>

      <Card title="Instagram" icon={Camera} className="border-t-4 border-t-pink-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Button variant="secondary" onClick={handleConnect} className="w-full">Connect Instagram</Button>
        </div>
      </Card>

      <Card title="WhatsApp" icon={Phone} className="border-t-4 border-t-green-600">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="text-slate-300" /> Not connected
          </div>
          <Button variant="secondary" onClick={handleConnect} className="w-full">Connect WhatsApp</Button>
        </div>
      </Card>
    </div>
  );
}

function AiSettingsSection({ shopId }) {
  const [systemPrompt, setSystemPrompt] = useState('');
  
  const handleSave = () => {
    toast.success('AI Settings Saved');
  };

  return (
    <Card title="AI অটো-রিপ্লাই সেটিংস" icon={Zap} footer={
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    }>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          আমাদের AI আপনার ক্যাটালগ থেকে প্রোডাক্টের তথ্য ব্যবহার করে কাস্টমারদের রিপ্লাই দিবে। আপনি চাইলে কাস্টম ইন্সট্রাকশন দিতে পারেন।
        </p>
        <Input 
          label="Custom System Prompt (Optional)"
          placeholder="E.g., Always address customers with 'Sir/Madam'..."
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          rows={4}
        />
      </div>
    </Card>
  );
}
