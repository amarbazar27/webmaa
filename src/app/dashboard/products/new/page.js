'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { addProduct, getCategories } from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { Camera, ArrowLeft, Loader2, Save, Tag, ChevronDown, Sparkles, Plus, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const { user, activeShopId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCustomCat, setShowCustomCat] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    description: '',
    allowCustomize: false,
    allowNote: false,
    variants: [], // Array of { name: 'Size', options: [{ label: 'S', price: 0 }] }
  });

  // Fetch categories on mount
  useEffect(() => {
    if (!activeShopId) return;
    getCategories(activeShopId).then(cats => {
      setCategories(cats);
    }).catch(err => console.error('Failed to load categories:', err));
  }, [activeShopId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('ইমেজের সাইজ ১ মেগাবাইটের বেশি হওয়া যাবে না।');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategorySelect = (catName) => {
    if (catName === '__custom__') {
      setShowCustomCat(true);
      setForm({...form, category: '', subcategory: ''});
    } else {
      setShowCustomCat(false);
      setForm({...form, category: catName, subcategory: ''});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('লগইন সেশন শেষ হয়ে গেছে। পুনরায় লগইন করুন।');
      return;
    }
    if (!activeShopId) {
      toast.error('শপ আইডি পাওয়া যাচ্ছে না। পেজ রিফ্রেশ করুন।');
      return;
    }
    
    // Validation
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock);
    
    if (isNaN(price) || price < 0) {
      toast.error('দয়া করে সঠিক মূল্য দিন।');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error('দয়া করে সঠিক স্টকের পরিমাণ দিন।');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
           imageUrl = await uploadProductImage(activeShopId, imageFile);
        } catch (uploadErr) {
           console.error("Image Upload Failed:", uploadErr);
           toast.error('Image upload failed. Product will be saved without image.');
        }
      }

      await addProduct(activeShopId, {
        ...form,
        price: price,
        stock: stock,
        variants: form.variants.map(v => ({
           name: v.name,
           options: v.options.map(opt => ({ 
             ...opt, 
             price: parseFloat(opt.price) || 0,
             stock: opt.stock !== '' ? parseInt(opt.stock) : null
           }))
        })),
        imageUrl,
        ownerId: activeShopId, // Correctly using activeShopId as the logical owner
      });

      toast.success('Product indexed successfully! 🚀');
      router.push('/dashboard/products');
    } catch (err) {
      console.error("Database save failed:", err);
      if (err?.code === 'permission-denied') {
        toast.error('অনুমতি নেই (permission-denied)। অ্যাডমিনকে জানান।');
      } else if (err?.code === 'unavailable') {
        toast.error('ইন্টারনেট সংযোগ নেই। আবার চেষ্টা করুন।');
      } else {
        toast.error(`প্রোডাক্ট যোগ ব্যর্থ: ${err?.code || err?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">New Product Listing</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Expand your digital inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center aspect-[9/16] w-full max-w-[320px] mx-auto relative group cursor-pointer hover:border-purple-300 transition-colors shadow-sm bg-slate-50/30">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />
          {imagePreview ? (
            <div className="w-full h-full absolute inset-0">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                 <Camera className="text-white" size={32} />
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 border border-purple-100 shadow-sm">
                <Camera size={32} />
              </div>
              <p className="font-bold text-slate-700 text-sm">Upload Product Image</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Portrait (9:16) Recommended</p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">Max 1MB</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Premium Wireless Headphones"
                className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            {/* Category Selector - shows saved categories in a dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag size={12} /> Category
              </label>
              {categories.length > 0 && !showCustomCat ? (
                <>
                <div className="relative">
                  <select
                    required
                    className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium appearance-none cursor-pointer"
                    value={form.category}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__custom__">+ Type custom...</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
                {form.category && categories.find(c => c.name === form.category)?.subcategories?.length > 0 && (
                  <div className="relative mt-2">
                    <select
                      className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium appearance-none cursor-pointer border-t-2 border-purple-100"
                      value={form.subcategory}
                      onChange={(e) => setForm({...form, subcategory: e.target.value})}
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {categories.find(c => c.name === form.category).subcategories.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </>
              ) : (
                <div className="space-y-2">
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Electronics, Clothing..."
                    className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                  />
                  {categories.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setShowCustomCat(false)}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-widest transition-colors"
                    >
                      ← Back to saved categories
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (৳)</label>
              <input 
                required
                type="number" 
                placeholder="0.00"
                className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium"
                value={form.price}
                onChange={(e) => setForm({...form, price: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
              <input 
                required
                type="number" 
                placeholder="0"
                className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium"
                value={form.stock}
                onChange={(e) => setForm({...form, stock: e.target.value})}
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Tell your customers about this product..."
                className="input-field w-full px-4 py-3.5 rounded-xl resize-none text-slate-900 font-medium"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
            </div>

            {/* Sizes & Customization */}
            <div className="col-span-1 md:col-span-2 space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <div>
                  <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" /> এআই কাস্টমাইজেশন (AI Customization)
                  </h4>
                  <p className="text-[10px] font-bold text-purple-600 uppercase mt-1">ইউজার কাস্টম সাইজ বা পরিমাণ চেয়ে প্রাইস জেনারেট করতে পারবে</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.allowCustomize} onChange={e => setForm({...form, allowCustomize: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <MessageSquare size={16} className="text-slate-500" /> কাস্টমার নোট (Customer Note)
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">অর্ডারের সময় ইউজার স্পেশাল রিকোয়েস্ট লিখতে পারবে</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.allowNote} onChange={e => setForm({...form, allowNote: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">প্রোডাক্ট ভ্যারিয়েন্ট (Variants)</label>
                    <p className="text-[10px] text-slate-500 font-bold ml-1">যেমন: Size, Color, Weight ইত্যাদি</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setForm({...form, variants: [...form.variants, { name: '', options: [{ label: '', price: '', stock: '' }] }]})}
                    className="text-[10px] font-black uppercase text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-3 py-2 rounded-lg"
                  >
                    <Plus size={12} /> ভ্যারিয়েন্ট যোগ করুন
                  </button>
                </div>

                {form.variants.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    কোনো ভ্যারিয়েন্ট সেট করা নেই (ডিফল্ট প্রাইস ব্যবহার হবে)
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.variants.map((variant, vIdx) => (
                      <div key={vIdx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Variant Name (e.g. Size, Color)"
                            className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 font-black text-slate-900"
                            value={variant.name}
                            onChange={(e) => {
                              const newVariants = [...form.variants];
                              newVariants[vIdx].name = e.target.value;
                              setForm({...form, variants: newVariants});
                            }}
                          />
                          <button type="button" onClick={() => {
                            const newVariants = form.variants.filter((_, i) => i !== vIdx);
                            setForm({...form, variants: newVariants});
                          }} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* Variant Options */}
                        <div className="pl-4 border-l-2 border-purple-200 space-y-2">
                           {variant.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Option (e.g. Small, Red)"
                                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 font-bold text-slate-700"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const newVariants = [...form.variants];
                                    newVariants[vIdx].options[oIdx].label = e.target.value;
                                    setForm({...form, variants: newVariants});
                                  }}
                                />
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-xs font-black text-slate-400">৳</span>
                                  <input
                                    type="number"
                                    placeholder="Price (absolute)"
                                    className="w-24 pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 font-black text-purple-700"
                                    value={opt.price}
                                    onChange={(e) => {
                                      const newVariants = [...form.variants];
                                      newVariants[vIdx].options[oIdx].price = e.target.value;
                                      setForm({...form, variants: newVariants});
                                    }}
                                  />
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Stock"
                                    className="w-20 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 font-bold text-slate-700"
                                    value={opt.stock}
                                    onChange={(e) => {
                                      const newVariants = [...form.variants];
                                      newVariants[vIdx].options[oIdx].stock = e.target.value;
                                      setForm({...form, variants: newVariants});
                                    }}
                                  />
                                </div>
                                <button type="button" onClick={() => {
                                  const newVariants = [...form.variants];
                                  newVariants[vIdx].options = newVariants[vIdx].options.filter((_, i) => i !== oIdx);
                                  setForm({...form, variants: newVariants});
                                }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                           ))}
                           <button 
                             type="button" 
                             onClick={() => {
                               const newVariants = [...form.variants];
                               newVariants[vIdx].options.push({ label: '', price: '', stock: '' });
                               setForm({...form, variants: newVariants});
                             }}
                             className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 mt-2"
                           >
                             <Plus size={12} /> অপশন যোগ করুন
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4.5 rounded-xl font-black flex items-center justify-center gap-3 text-lg disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={24} /> Indexing Product...</>
            ) : (
              <><Save size={24} /> Publish to Store</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
