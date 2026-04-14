'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { addProduct, getCategories } from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { Camera, ArrowLeft, Loader2, Save, Tag, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCustomCat, setShowCustomCat] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    if (!user) return;
    getCategories(user.uid).then(cats => {
      setCategories(cats);
    }).catch(err => console.error('Failed to load categories:', err));
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategorySelect = (catName) => {
    if (catName === '__custom__') {
      setShowCustomCat(true);
      setForm({...form, category: ''});
    } else {
      setShowCustomCat(false);
      setForm({...form, category: catName});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
           imageUrl = await uploadProductImage(user.uid, imageFile);
        } catch (uploadErr) {
           console.error("Image Upload Failed:", uploadErr);
           toast.error(uploadErr.message || 'Image upload failed. Product will be saved without image.');
           // Proceed without image if it fails so users aren't blocked from adding products
        }
      }

      await addProduct(user.uid, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        imageUrl,
        ownerId: user.uid,
      });

      toast.success('Product indexed successfully! 🚀');
      router.push('/dashboard/products');
    } catch (err) {
      console.error("Database save failed:", err);
      toast.error('Failed to add product database entry. Please try again.');
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
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center min-h-[250px] relative group cursor-pointer hover:border-purple-300 transition-colors shadow-sm">
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
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 border border-purple-100 shadow-sm">
                <Camera size={32} />
              </div>
              <p className="font-bold text-slate-700 text-sm">Upload Product Image</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Recommended: 800 x 800px</p>
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
