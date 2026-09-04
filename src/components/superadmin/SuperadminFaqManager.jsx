'use client';

import { useState, useEffect } from 'react';
import { 
  HelpCircle, Plus, Trash2, Edit2, Check, X, 
  ArrowUp, ArrowDown, Save, RotateCcw, Sparkles, 
  ChevronDown, ChevronUp, CheckCircle2 
} from 'lucide-react';
import { updateGlobalConfig } from '@/lib/firestore';
import toast from 'react-hot-toast';

const DEFAULT_FAQS_LIST = [
  {
    id: 'faq-1',
    question: 'BDRetailers এ কীভাবে অনলাইন স্টোর খুলব?',
    answer: 'মার্চেন্ট হতে "Become Retailer" বাটনে ক্লিক করে আপনার নাম, দোকানের নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে মাত্র ১ মিনিটেই ফ্রি রেজিস্ট্রেশন সম্পন্ন করতে পারেন। এরপর সাথে সাথেই আপনার স্টোর লাইভ হয়ে যাবে।'
  },
  {
    id: 'faq-2',
    question: 'স্টার্টার প্ল্যানে কি আসলেই কোনো অগ্রিম ফি নেই?',
    answer: 'হ্যাঁ, আমাদের স্টার্টার প্ল্যানে কোনো মাসিক ফি বা অগ্রিম খরচ নেই (০৳ আপফ্রন্ট ফি)। শুধুমাত্র আপনার পণ্য সফলভাবে বিক্রয় হলে একটি ক্ষুদ্র রেভিনিউ শেয়ার প্রযোজ্য হবে। অর্থাৎ নো সেল = নো ফি!'
  },
  {
    id: 'faq-3',
    question: 'Steadfast কুরিয়ার ও পেমেন্ট গেটওয়ে কীভাবে কাজ করে?',
    answer: 'আমাদের সিস্টেমে Steadfast কুরিয়ার অটোমেটেড API সম্পূর্ণ ফ্রি ইন্টিগ্রেটেড রয়েছে। বিকাশ, নগদ, রকেট ও অনলাইন কার্ড পেমেন্ট সরাসরি আপনার অ্যাকাউন্টে জমা হবে।'
  },
  {
    id: 'faq-4',
    question: 'আমি কি আমার নিজস্ব কাস্টম ডোমেইন (.com বা .shop) ব্যবহার করতে পারব?',
    answer: 'অবশ্যই! আমাদের মান্থলি, কোয়ার্টারলি ও ইয়ারলি প্যাকেজে সম্পূর্ণ ফ্রি কাস্টম ডোমেইন কানেক্টিভিটি ও আজীবন ফ্রি SSL সার্টিফিকেটের সুবিধা অন্তর্ভুক্ত রয়েছে।'
  },
  {
    id: 'faq-5',
    question: 'আমার ব্র্যান্ডের নামে কি নিজস্ব অ্যান্ড্রয়েড মোবাইল অ্যাপ তৈরি হবে?',
    answer: 'হ্যাঁ! BDRetailers এর আধুনিক হোয়াইট-লেবেল টেকনোলজির মাধ্যমে আপনার নিজস্ব ব্র্যান্ডের নামে ডেডিকেটেড Android অ্যাপ (.aab / .apk) তৈরি ও Google Play Store এ পাবলিশ করার ব্যবস্থা রয়েছে।'
  },
  {
    id: 'faq-6',
    question: 'আমার কোনো প্রযুক্তিগত বা কোডিং জ্ঞান না থাকলে কি আমি চালাতে পারব?',
    answer: 'একদমই কোনো কোডিং বা টেকনিক্যাল জ্ঞানের প্রয়োজন নেই। সম্পূর্ণ ইউজার-ফ্রেন্ডলি বাংলা ও ইংরেজি ইন্টারফেসে পণ্য যোগ করা, অর্ডার প্রসেসিং ও স্টক ম্যানেজমেন্ট খুব সহজেই মোবাইল দিয়ে পরিচালনা করতে পারবেন।'
  }
];

export default function SuperadminFaqManager({ globalConfig = {} }) {
  const [faqs, setFaqs] = useState(() => {
    return (globalConfig?.faqs && globalConfig.faqs.length > 0)
      ? globalConfig.faqs
      : DEFAULT_FAQS_LIST;
  });

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);
  const [previewOpenIndex, setPreviewOpenIndex] = useState(null);

  useEffect(() => {
    if (globalConfig?.faqs && globalConfig.faqs.length > 0) {
      setFaqs(globalConfig.faqs);
    }
  }, [globalConfig?.faqs]);

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('প্রশ্ন এবং উত্তর উভয়ই পূরণ করুন');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('FAQ যোগ হচ্ছে...');
    try {
      const entry = {
        id: `faq-${Date.now()}`,
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim()
      };
      const updated = [...faqs, entry];
      setFaqs(updated);
      await updateGlobalConfig({ faqs: updated });
      setNewFaq({ question: '', answer: '' });
      toast.success('নতুন FAQ সফলভাবে যুক্ত হয়েছে! 🎉', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('যোগ করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ question: item.question, answer: item.answer });
  };

  const handleSaveEdit = async () => {
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      toast.error('প্রশ্ন ও উত্তর ফাঁকা রাখা যাবে না');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('আপডেট করা হচ্ছে...');
    try {
      const updated = faqs.map(f => f.id === editingId ? { ...f, ...editForm } : f);
      setFaqs(updated);
      await updateGlobalConfig({ faqs: updated });
      setEditingId(null);
      toast.success('FAQ সফলভাবে আপডেট হয়েছে!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('আপডেট ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (item) => {
    if (!confirm(`আপনি কি এই FAQ টি মুছে ফেলতে চান?\n\nপ্রশ্ন: "${item.question}"`)) return;

    setSaving(true);
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      const updated = faqs.filter(f => f.id !== item.id);
      setFaqs(updated);
      await updateGlobalConfig({ faqs: updated });
      toast.success('FAQ মুছে ফেলা হয়েছে', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('মুছতে ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveFaq = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const copy = [...faqs];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setFaqs(copy);
    await updateGlobalConfig({ faqs: copy }).catch(() => {});
  };

  const handleResetFaqs = async () => {
    if (!confirm('আপনি কি সমস্ত FAQ ডিফল্ট সেটিংসে ফিরিয়ে নিতে চান?')) return;
    setSaving(true);
    try {
      setFaqs(DEFAULT_FAQS_LIST);
      await updateGlobalConfig({ faqs: DEFAULT_FAQS_LIST });
      toast.success('ডিফল্ট FAQs সফলভাবে রিস্টোর হয়েছে!');
    } catch (err) {
      console.error(err);
      toast.error('রিস্টোর ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 border border-purple-400/20">
              <HelpCircle size={13} />
              <span>নলেজবেস ও প্রশ্নোত্তর</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ) কন্ট্রোল</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              হোমপেজের FAQ একর্ডিয়নে প্রদর্শিত প্রশ্ন ও উত্তরসমূহ ইচ্ছেমতো তৈরি করুন, এডিট করুন ও ক্রম পরিবর্তন করুন।
            </p>
          </div>

          <button
            onClick={handleResetFaqs}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center gap-2 border border-white/10 shrink-0"
          >
            <RotateCcw size={14} />
            <span>ডিফল্ট FAQs রিস্টোর</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add New FAQ Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus size={16} className="text-purple-600" />
              <span>নতুন প্রশ্ন ও উত্তর যোগ করুন</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              কাস্টমার ও মার্চেন্টদের সাধারণ জিজ্ঞাসার সহজ সমাধান লিখুন।
            </p>
          </div>

          <form onSubmit={handleAddFaq} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">প্রশ্ন (Question) *</label>
              <input
                type="text"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="যেমন: কীভাবে বিকাশ দিয়ে পেমেন্ট করব?"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">উত্তর (Answer) *</label>
              <textarea
                rows={6}
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="প্রশ্নের সুস্পষ্ট উত্তর লিখুন..."
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              <Plus size={15} />
              <span>{saving ? 'যোগ হচ্ছে...' : 'FAQ যোগ করুন'}</span>
            </button>
          </form>
        </div>

        {/* Right: Existing FAQs List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle size={18} className="text-purple-600" />
                <span>বর্তমান FAQ তালিকা</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                  {faqs.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">হোমপেজে এই প্রশ্নগুলো ক্রমানুসারে দেখা যাবে।</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {faqs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                কোনো FAQ নেই। বামদিকের ফর্ম থেকে নতুন প্রশ্ন যোগ করুন।
              </div>
            ) : (
              faqs.map((item, idx) => {
                const isEditing = editingId === item.id;
                const isPreviewOpen = previewOpenIndex === idx;

                return (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">প্রশ্ন</label>
                          <input
                            type="text"
                            value={editForm.question}
                            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">উত্তর</label>
                          <textarea
                            rows={4}
                            value={editForm.answer}
                            onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-purple-500 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            বাতিল
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Save size={12} />
                            <span>সংরক্ষণ</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div 
                            onClick={() => setPreviewOpenIndex(isPreviewOpen ? null : idx)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.question}</h4>
                            {isPreviewOpen ? (
                              <ChevronUp size={14} className="text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown size={14} className="text-slate-400 shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveFaq(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                              title="উপরে নিন"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              onClick={() => handleMoveFaq(idx, 'down')}
                              disabled={idx === faqs.length - 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                              title="নিচে নিন"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="সম্পাদনা"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(item)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {isPreviewOpen && (
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
