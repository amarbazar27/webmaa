'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct, updateProduct } from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { Plus, Trash2, Package, Search, BarChart3, Tag, ChevronRight, Check, Pencil, X, AlertCircle, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Inline editable cell that auto-saves on blur/Enter
function EditableCell({ value, onSave, type = 'text', prefix = '', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (val === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(val);
      toast.success('Auto-saved ✓');
    } catch {
      setVal(value);
      toast.error('Save failed');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
        className={`bg-purple-50 border border-purple-300 rounded-lg px-2 py-1 text-slate-900 font-bold outline-none w-full min-w-0 ${className}`}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group/cell flex items-center gap-1.5 hover:text-purple-600 transition-colors ${className}`}
      title="Click to edit"
    >
      {saving ? <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : null}
      <span className="font-bold">{prefix}{val}</span>
      <Pencil size={12} className="opacity-0 group-hover/cell:opacity-60 transition-opacity shrink-0 text-purple-500" />
    </button>
  );
}

export default function ProductsPage() {
  const { user, activeShopId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!activeShopId) return;
    setLoading(true);
    try {
      const data = await getProducts(activeShopId);
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error('Inventory load failed');
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleUpdate = async (productId, field, value) => {
    const parsed = field === 'price' ? parseFloat(value) : field === 'stock' ? parseInt(value) : value;
    await updateProduct(activeShopId, productId, { [field]: parsed });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: parsed } : p));
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(activeShopId, productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product removed');
    } catch {
      toast.error('Operation failed');
    }
  };

  const [updatingImageId, setUpdatingImageId] = useState(null);

  const handleImageUpdate = async (productId, file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('ইমেজের সাইজ ১ মেগাবাইটের বেশি হওয়া যাবে না।');
      return;
    }
    setUpdatingImageId(productId);
    try {
      const url = await uploadProductImage(activeShopId, file);
      await updateProduct(activeShopId, productId, { imageUrl: url });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, imageUrl: url } : p));
      toast.success('Image updated! ✨');
    } catch (err) {
      toast.error(err.message || 'Image update failed');
    } finally {
      setUpdatingImageId(null);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((acc, p) => acc + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0), 0);

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Stock Inventory</h1>
          <p className="text-sm text-slate-500 font-medium">Click any cell to edit — saves automatically</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button variant="primary" icon={Plus} className="px-8 h-12 shadow-lg shadow-purple-500/20">
            Post New Item
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title={products.length} subtitle="Live Products" icon={Package} className="border-l-4 border-l-purple-500 shadow-sm" />
        <Card title={products.filter(p => p.stock > 0).length} subtitle="In Stock" icon={BarChart3} className="border-l-4 border-l-blue-500 shadow-sm" />
        <Card title={`৳${totalValue.toLocaleString()}`} subtitle="Inventory Value" icon={Tag} className="border-l-4 border-l-green-500 shadow-sm" />
      </div>

      {/* Inline Edit Info Banner */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl px-6 py-3 flex items-center gap-3 text-sm text-purple-700 font-medium">
        <Pencil size={16} className="text-purple-500 shrink-0" />
        <span>নামের, দামের বা স্টকের ঘরে <strong>ক্লিক করুন</strong> এবং সরাসরি এডিট করুন। ফোকাস সরলেই অটো-সেভ হয়ে যাবে।</span>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 p-2 rounded-2xl flex items-center gap-3 shadow-sm">
        <div className="pl-4 text-slate-400"><Search size={18} /></div>
        <input
          type="text"
          placeholder="Search by name or category..."
          className="bg-transparent border-none outline-none w-full py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white py-24 text-center border-dashed border-2 border-slate-100 rounded-3xl">
          <Package size={48} className="mx-auto mb-6 text-slate-200" />
          <p className="text-xl font-black text-slate-900">No Products Found</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Your digital warehouse is empty. Add products to start selling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-center">Price (৳)</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-4 lg:grid lg:grid-cols-12 items-center gap-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all group flex flex-col lg:flex-row">

              {/* Product Info */}
              <div className="col-span-4 flex items-center gap-4 w-full">
                <div className="relative group/img w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                  {updatingImageId === product.id ? (
                     <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-purple-600" size={16} />
                     </div>
                  ) : (
                     <>
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={20} /></div>
                        }
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                           <Camera size={16} className="text-white" />
                           <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleImageUpdate(product.id, e.target.files[0])} 
                           />
                        </label>
                     </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <EditableCell
                    value={product.name}
                    onSave={v => handleUpdate(product.id, 'name', v)}
                    className="text-slate-900 text-sm"
                  />
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">ID: {product.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <EditableCell
                  value={product.category || '—'}
                  onSave={v => handleUpdate(product.id, 'category', v)}
                  className="text-[10px] text-purple-600"
                />
              </div>

              {/* Price */}
              <div className="col-span-2 text-center">
                <EditableCell
                  value={product.price}
                  type="number"
                  prefix="৳"
                  onSave={v => handleUpdate(product.id, 'price', v)}
                  className="text-slate-900 text-lg font-black justify-center"
                />
              </div>

              {/* Stock */}
              <div className="col-span-2 text-center">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black ${(parseInt(product.stock) || 0) > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  <EditableCell
                    value={product.stock || 0}
                    type="number"
                    onSave={v => handleUpdate(product.id, 'stock', v)}
                    className=""
                  />
                  <span className="text-[9px] font-black uppercase opacity-50">pcs</span>
                </div>
              </div>

              {/* Delete */}
              <div className="col-span-2 flex justify-end">
                <Button
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => handleDelete(product.id)}
                  className="px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 opacity-40 group-hover:opacity-100 transition-all"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
