'use client';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProduct, updateProduct, getCategories } from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { Camera, ArrowLeft, Loader2, Save, Tag, ChevronDown, Sparkles, Plus, Trash2, MessageSquare, X, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditProductPage({ params }) {
  // Use React.use() to unwrap params
  const unwrappedParams = use(params);
  const { productId } = unwrappedParams;

  const { user, activeShopId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // Multi-image state: existing saved URLs + newly added files
  const [savedImages, setSavedImages] = useState([]); // string[] — already-uploaded URLs
  const [newImageFiles, setNewImageFiles] = useState([]); // { file, preview }[] — newly picked
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [showCustomCat, setShowCustomCat] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    unit: '',
    description: '',
    allowCustomize: false,
    allowNote: false,
    allowRequest: false,
    variants: [], 
  });

  // Fetch product data and categories
  useEffect(() => {
    if (!activeShopId || !productId) return;

    const loadData = async () => {
      try {
        const cats = await getCategories(activeShopId);
        setCategories(cats);

        const product = await getProduct(activeShopId, productId);
        if (product) {
          setForm({
            name: product.name || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            price: product.price?.toString() || '',
            stock: product.stock?.toString() || '',
            unit: product.unit || '',
            description: product.description || '',
            allowCustomize: product.allowCustomize || false,
            allowNote: product.allowNote || false,
            allowRequest: product.allowRequest || false,
            variants: product.variants || [],
          });
          // Load saved images: prefer images[] array, fall back to imageUrl
          const existingImages = Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.imageUrl ? [product.imageUrl] : []);
          setSavedImages(existingImages);
          
          // Check if product category is in existing categories
          if (product.category && cats.length > 0) {
            const isExisting = cats.some(c => c.name === product.category);
            if (!isExisting) {
              setShowCustomCat(true);
            }
          }
        } else {
          toast.error('Product not found.');
          router.push('/dashboard/products');
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        toast.error('Failed to load product data.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [activeShopId, productId, router]);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const total = savedImages.length + newImageFiles.length;
    const remaining = 10 - total;
    if (remaining <= 0) {
      toast.error('সর্বোচ্চ ১০টি ছবি যোগ করা যাবে।');
      return;
    }
    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > 3 * 1024 * 1024);
    if (oversized.length) {
      toast.error('প্রতিটি ছবির সাইজ ৩ মেগাবাইটের বেশি হওয়া যাবে না।');
    }
    const valid = toAdd.filter(f => f.size <= 3 * 1024 * 1024);
    const newItems = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setNewImageFiles(prev => [...prev, ...newItems]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveSaved = (idx) => {
    if (!window.confirm('আপনি কি এই ছবিটি ডিলিট করতে চান?')) return;
    setSavedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNew = (idx) => {
    if (!window.confirm('আপনি কি এই ছবিটি ডিলিট করতে চান?')) return;
    setNewImageFiles(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
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
      let updateData = {
        ...form,
        price: price,
        stock: stock,
        variants: form.variants.map(v => ({
           name: v.name,
           options: v.options.map(opt => ({ 
             ...opt, 
             price: parseFloat(opt.price) || 0,
             stock: opt.stock !== '' && opt.stock != null ? parseInt(opt.stock) : null
           }))
        }))
      };

      if (newImageFiles.length > 0) {
        setUploadingImages(true);
        try {
          const newUrls = await Promise.all(
            newImageFiles.map(({ file }) => uploadProductImage(activeShopId, file))
          );
          // Merge saved + newly uploaded, keep max 10
          const allImages = [...savedImages, ...newUrls].slice(0, 10);
          updateData.images = allImages;
          updateData.imageUrl = allImages[0] || '';
        } catch (uploadErr) {
          console.error('Image Upload Failed:', uploadErr);
          toast.error('কিছু ছবি আপলোড ব্যর্থ হয়েছে।');
        } finally {
          setUploadingImages(false);
        }
      } else {
        // No new files — just save the current saved list (user may have removed some)
        updateData.images = savedImages;
        updateData.imageUrl = savedImages[0] || '';
      }

      await updateProduct(activeShopId, productId, updateData);

      toast.success('Product updated successfully! ✅');
      router.push('/dashboard/products');
    } catch (err) {
      console.error("Database update failed:", err);
      toast.error(`আপডেট ব্যর্থ: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Product...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Product</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Multi-Image Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              পণ্যের ছবি (সর্বোচ্চ ১০টি, প্রতিটি ৩ মেগাবাইট পর্যন্ত)
            </label>
            <span className="text-[10px] font-black text-purple-600 uppercase">{savedImages.length + newImageFiles.length}/10</span>
          </div>

          {/* Image Grid */}
          {(savedImages.length > 0 || newImageFiles.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {/* Saved images */}
              {savedImages.map((url, idx) => (
                <div key={`saved-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-purple-200 shadow-sm group">
                  <img src={url} alt={`saved-${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && newImageFiles.length === 0 && (
                    <span className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">মেইন</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSaved(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-100 shadow hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* New images */}
              {newImageFiles.map((img, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-sm group">
                  <img src={img.preview} alt={`new-${idx}`} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">নতুন</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-100 shadow hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* Add More Button */}
              {savedImages.length + newImageFiles.length < 10 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                  <input type="file" accept="image/*" multiple ref={imageInputRef} onChange={handleImageAdd} className="hidden" />
                  <ImagePlus size={20} className="text-slate-400 mb-1" />
                  <span className="text-[9px] font-black text-slate-400 uppercase">যোগ করুন</span>
                </label>
              )}
            </div>
          )}

          {/* Empty State */}
          {savedImages.length === 0 && newImageFiles.length === 0 && (
            <label className="bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center py-12 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors group">
              <input type="file" accept="image/*" multiple ref={imageInputRef} onChange={handleImageAdd} className="hidden" />
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-purple-600 border border-purple-100 shadow-sm group-hover:bg-purple-100 transition-colors">
                <Camera size={32} />
              </div>
              <p className="font-bold text-slate-700 text-sm">পণ্যের ছবি আপলোড করুন</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">একসাথে একাধিক ছবি বেছে নিন</p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">সর্বোচ্চ ১০টি ছবি • প্রতিটি ৩MB পর্যন্ত</p>
            </label>
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

            {/* Category Selector */}
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

            <div className="flex items-center gap-2 pt-1 pb-2">
              <input 
                type="checkbox" 
                id="allowRequest"
                checked={form.allowRequest || false}
                onChange={(e) => setForm({...form, allowRequest: e.target.checked})}
                className="w-4 h-4 text-purple-600 border-slate-350 rounded focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="allowRequest" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                স্টক শেষ হলেও অনুরোধ (Request Product) করার সুযোগ দিন
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Unit / পরিমাপের একক (যেমন: কেজি, লিটার, পিস)</label>
              <input 
                type="text" 
                placeholder="যেমন: কেজি, লিটার, গ্রাম, পিস"
                className="input-field w-full px-4 py-3.5 rounded-xl text-slate-900 font-medium"
                value={form.unit}
                onChange={(e) => setForm({...form, unit: e.target.value})}
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
              <><Loader2 className="animate-spin" size={24} /> Updating Product...</>
            ) : (
              <><Save size={24} /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
