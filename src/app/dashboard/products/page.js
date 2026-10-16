'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct, updateProduct, getCategories, addCategory, deleteCategory } from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { 
  Plus, Trash2, Package, Search, BarChart3, Tag, ChevronRight, Check, Pencil, X, 
  AlertCircle, Camera, ImageIcon, Loader2, MessageSquare, Sparkles, Eye, EyeOff, 
  Inbox, Layers, FolderPlus, HelpCircle, Download, Upload, Globe, FileText, CheckCircle2
} from 'lucide-react';
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

// CSV Parser utility respecting quotes
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const fields = [];
    let insideQuote = false;
    let currentField = '';

    for (let j = 0; j < rawLine.length; j++) {
      const char = rawLine[j];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    const item = {};
    headers.forEach((h, idx) => {
      const val = (fields[idx] || '').replace(/^["']|["']$/g, '');
      if (h.includes('name') || h === 'title') item.name = val;
      else if (h.includes('price') && !h.includes('cost')) item.price = parseFloat(val) || 0;
      else if (h.includes('cost')) item.costPrice = parseFloat(val) || 0;
      else if (h.includes('stock') || h.includes('qty')) item.stock = parseInt(val, 10) || 50;
      else if (h.includes('category') && !h.includes('sub')) item.category = val;
      else if (h.includes('subcat')) item.subCategory = val;
      else if (h.includes('image') || h.includes('photo')) item.imageUrl = val;
      else if (h.includes('sku')) item.sku = val;
      else if (h.includes('desc')) item.description = val;
    });

    if (item.name) {
      items.push(item);
    }
  }
  return items;
}

export default function ProductsPage() {
  const { user, activeShopId } = useAuth();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Category management state
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newSubcat, setNewSubcat] = useState({});
  const [isQuickCatModalOpen, setIsQuickCatModalOpen] = useState(false);

  // Bulk Import & Competitor Cloner state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('csv'); // 'csv' | 'clone'
  const [csvFile, setCsvFile] = useState(null);
  const [parsedCsvProducts, setParsedCsvProducts] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloning, setCloning] = useState(false);

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

  const fetchCategoriesData = useCallback(async () => {
    if (!activeShopId) return;
    setCatLoading(true);
    try {
      const data = await getCategories(activeShopId);
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCatLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesData();
  }, [fetchProducts, fetchCategoriesData]);

  const handleUpdate = async (productId, field, value) => {
    const parsed = field === 'price' ? parseFloat(value) : field === 'stock' ? parseInt(value) : value;
    await updateProduct(activeShopId, productId, { [field]: parsed });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: parsed } : p));
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('আপনি কি এই প্রোডাক্টটি ডিলিট করতে চান?')) return;
    try {
      await deleteProduct(activeShopId, productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('প্রোডাক্ট ডিলিট করা হয়েছে');
    } catch {
      toast.error('ডিলিট ব্যর্থ হয়েছে');
    }
  };

  const [updatingImageId, setUpdatingImageId] = useState(null);

  const handleImageUpdate = async (productId, file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('পণ্যের ইমেজের সাইজ ৩ মেগাবাইটের বেশি হওয়া যাবে না।');
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

  // Category Actions
  const handleAddCategorySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCat.trim()) {
      setCatError('অনুগ্রহ করে ক্যাটাগরির নাম লিখুন!');
      toast.error('অনুগ্রহ করে ক্যাটাগরির নাম লিখুন!');
      return;
    }
    setCatError('');
    if (!activeShopId) return;

    setAddingCat(true);
    try {
      await addCategory(activeShopId, { name: newCat.trim() });
      toast.success('ক্যাটাগরি সফলভাবে যুক্ত হয়েছে! ✨');
      setNewCat('');
      setIsQuickCatModalOpen(false);
      await fetchCategoriesData();
    } catch (err) {
      console.error(err);
      toast.error('ক্যাটাগরি সেভ করতে সমস্যা হয়েছে');
    } finally {
      setAddingCat(false);
    }
  };

  const handleAddSubcat = async (e, catId, existingSubcats = []) => {
    e.preventDefault();
    const sub = newSubcat[catId]?.trim();
    if (!sub) return;
    try {
      const catRef = doc(db, 'shops', activeShopId, 'categories', catId);
      const updatedSubcats = [...(existingSubcats || []), sub];
      await updateDoc(catRef, { subcategories: updatedSubcats });
      toast.success('সাবক্যাটাগরি যুক্ত হয়েছে!');
      setNewSubcat({...newSubcat, [catId]: ''});
      fetchCategoriesData();
    } catch (err) {
      toast.error('ব্যর্থ হয়েছে!');
    }
  };

  const handleRemoveSubcat = async (catId, subToRemove, existingSubcats = []) => {
    try {
      const catRef = doc(db, 'shops', activeShopId, 'categories', catId);
      const updatedSubcats = existingSubcats.filter(s => s !== subToRemove);
      await updateDoc(catRef, { subcategories: updatedSubcats });
      toast.success('রিমুভ করা হয়েছে!');
      fetchCategoriesData();
    } catch (err) {
      toast.error('ব্যর্থ হয়েছে!');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) return;
    try {
      await deleteCategory(activeShopId, id);
      toast.success('ক্যাটাগরি ডিলিট করা হয়েছে');
      fetchCategoriesData();
    } catch (err) {
      toast.error('ক্যাটাগরি ডিলিট ব্যর্থ হয়েছে');
    }
  };

  const uniqueCategories = [...new Set([
    ...categories.map(c => c.name),
    ...products.map(p => p.category).filter(Boolean)
  ])];

  let filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === '' || p.category === selectedCategory)
  );

  filteredProducts.sort((a, b) => {
    if (sortBy === 'price_asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sortBy === 'price_desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === 'oldest') return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
    if (sortBy === 'latest') return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'bn');
    return a.name.localeCompare(b.name, 'bn');
  });

  const totalValue = products.reduce((acc, p) => acc + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0), 0);

  const exportProductsToCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো প্রোডাক্ট পাওয়া যায়নি।');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Subcategory',
      'Price (BDT)',
      'Cost Price (BDT)',
      'Stock Quantity',
      'SKU',
      'Status',
      'Image URL'
    ];

    const rows = filteredProducts.map(p => [
      `"${p.id}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.subCategory || '').replace(/"/g, '""')}"`,
      p.price || 0,
      p.costPrice || 0,
      p.stock || 0,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      p.hidden ? 'Hidden' : 'Active',
      `"${(p.imageUrl || p.images?.[0] || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredProducts.length} টি প্রোডাক্ট সফলভাবে CSV ফাইলে ডাউনলোড হয়েছে! 📥`);
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const parsed = parseCSV(text);
        setParsedCsvProducts(parsed);
        if (parsed.length === 0) {
          toast.error('CSV ফাইলে কোনো ভ্যালিড প্রোডাক্ট পাওয়া যায়নি');
        } else {
          toast.success(`${parsed.length} টি প্রোডাক্ট শনাক্ত হয়েছে!`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async () => {
    if (parsedCsvProducts.length === 0) {
      toast.error('ইমপোর্ট করার মতো কোনো প্রোডাক্ট নেই');
      return;
    }
    setImportingCsv(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: activeShopId,
          products: parsedCsvProducts
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ইমপোর্ট ব্যর্থ হয়েছে');

      toast.success(data.message || 'প্রোডাক্ট সফলভাবে ইমপোর্ট হয়েছে! 🎉');
      setIsImportModalOpen(false);
      setParsedCsvProducts([]);
      setCsvFile(null);
      fetchProducts();
      fetchCategoriesData();
    } catch (err) {
      toast.error(err.message || 'সমস্যা হয়েছে');
    } finally {
      setImportingCsv(false);
    }
  };

  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    if (!cloneUrl.trim()) {
      toast.error('ওয়েবসাইট লিংক দিন');
      return;
    }
    setCloning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/products/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: activeShopId,
          url: cloneUrl.trim(),
          autoSave: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'কপি করা ব্যর্থ হয়েছে');

      toast.success(data.message || 'প্রোডাক্ট সফলভাবে কপি হয়েছে! 🚀');
      setIsImportModalOpen(false);
      setCloneUrl('');
      fetchProducts();
      fetchCategoriesData();
    } catch (err) {
      toast.error(err.message || 'সমস্যা হয়েছে');
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">পণ্য ও ক্যাটাগরি ব্যবস্থাপনা (Inventory & Categories)</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">প্রোডাক্ট স্টক, মূল্য ও ক্যাটাগরি একসাথে সহজভাবে পরিচালনা করুন</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-sm shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
            title="CSV বা প্রতিযোগী ওয়েবসাইট থেকে প্রোডাক্ট ইমপোর্ট করুন"
          >
            <Upload size={15} />
            <span>ইমপোর্ট ও অটো-সেটআপ</span>
          </button>
          <button
            type="button"
            onClick={exportProductsToCSV}
            className="px-4 py-3 bg-white hover:bg-slate-50 text-purple-700 font-black rounded-2xl text-xs flex items-center gap-1.5 border border-purple-200 transition-all shadow-xs cursor-pointer active:scale-95"
            title="প্রোডাক্ট তালিকা CSV/Excel এ ডাউনলোড করুন"
          >
            <Download size={15} />
            <span>CSV এক্সপোর্ট</span>
          </button>
          <button
            type="button"
            onClick={() => setIsQuickCatModalOpen(true)}
            className="px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black rounded-2xl text-xs flex items-center gap-1.5 border border-purple-200 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <FolderPlus size={16} />
            <span>+ দ্রুত ক্যাটাগরি তৈরি</span>
          </button>
          <Link href="/dashboard/products/new">
            <Button variant="primary" icon={Plus} className="px-6 h-12 shadow-lg shadow-purple-500/20 font-black text-xs">
              + নতুন প্রোডাক্ট যোগ
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Unified Tab Switcher ── */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3.5 px-3 font-black text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Package size={17} />
          <span>সকল প্রোডাক্ট ইনভেন্টরি ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-3.5 px-3 font-black text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Tag size={17} />
          <span>ক্যাটাগরি ও সাবক্যাটাগরি ({categories.length})</span>
        </button>
      </div>

      {/* ── TAB 1: PRODUCTS INVENTORY ── */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card title={products.length} subtitle="Live Products" icon={Package} className="border-l-4 border-l-purple-500 shadow-sm" />
            <Card title={products.filter(p => p.stock > 0).length} subtitle="In Stock" icon={BarChart3} className="border-l-4 border-l-blue-500 shadow-sm" />
            <Card title={`৳${totalValue.toLocaleString()}`} subtitle="Inventory Value" icon={Tag} className="border-l-4 border-l-green-500 shadow-sm" />
          </div>

          {/* Inline Edit Info Banner */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3 flex items-center gap-3 text-xs sm:text-sm text-purple-700 font-medium">
            <Pencil size={16} className="text-purple-500 shrink-0" />
            <span>নামের, দামের বা স্টকের ঘরে <strong>ক্লিক করুন</strong> এবং সরাসরি এডিট করুন। ফোকাস সরলেই অটো-সেভ হয়ে যাবে।</span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="bg-white border border-slate-100 p-2 rounded-2xl flex-1 flex items-center gap-3 shadow-sm">
              <div className="pl-4 text-slate-400"><Search size={18} /></div>
              <input
                type="text"
                placeholder="Search by name or category..."
                className="bg-transparent border-none outline-none w-full py-2 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-sm outline-none cursor-pointer"
              >
                <option value="">সকল ক্যাটাগরি</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-sm outline-none cursor-pointer min-w-[130px]"
              >
                <option value="name_asc">নাম (A→Z)</option>
                <option value="name_desc">নাম (Z→A)</option>
                <option value="price_asc">মূল্য (কম থেকে বেশি)</option>
                <option value="price_desc">মূল্য (বেশি থেকে কম)</option>
                <option value="latest">সর্বশেষ যুক্ত</option>
                <option value="oldest">পুরাতন আগে</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white py-20 text-center border-dashed border-2 border-slate-100 rounded-3xl">
              <Package size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-lg font-black text-slate-900">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-1 mb-6">নতুন প্রোডাক্ট আপলোড করতে উপরের বাটনে ক্লিক করুন</p>
              <Link href="/dashboard/products/new">
                <Button variant="primary" icon={Plus}>+ Add First Product</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price (৳)</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ImageIcon size={18} />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera size={14} />
                                <input type="file" accept="image/*" className="sr-only" onChange={e => handleImageUpdate(p.id, e.target.files?.[0])} />
                              </label>
                            </div>
                            <div className="min-w-0">
                              <EditableCell
                                value={p.name}
                                onSave={(val) => handleUpdate(p.id, 'name', val)}
                                className="text-slate-900 font-bold"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            {p.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <EditableCell
                            type="number"
                            prefix="৳"
                            value={p.price}
                            onSave={(val) => handleUpdate(p.id, 'price', val)}
                            className="text-slate-900 font-black text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <EditableCell
                            type="number"
                            value={p.stock}
                            onSave={(val) => handleUpdate(p.id, 'stock', val)}
                            className={`font-black text-sm ${p.stock <= 0 ? 'text-red-500' : 'text-slate-800'}`}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/products/edit/${p.id}`} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                              <Pencil size={15} />
                            </Link>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CATEGORY MANAGEMENT ── */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FolderPlus size={18} className="text-purple-600" />
              <span>নতুন ক্যাটাগরি যুক্ত করুন (Add New Category)</span>
            </h3>
            <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="যেমন: স্মার্টফোন, শাড়ি, কসমেটিকস..."
                  value={newCat}
                  onChange={e => { setNewCat(e.target.value); setCatError(''); }}
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold text-slate-800 outline-none transition-all ${
                    catError ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
                  }`}
                />
                {catError && <p className="text-xs text-red-500 font-bold mt-1.5">{catError}</p>}
              </div>
              <Button type="submit" loading={addingCat} variant="primary" className="px-6 h-12 shadow-md">
                + সেভ করুন
              </Button>
            </form>
          </div>

          {/* Category List */}
          {catLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 border-4 border-purple-600 rounded-full animate-spin mx-auto text-purple-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white py-16 text-center border-dashed border-2 border-slate-100 rounded-3xl">
              <Tag size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="text-base font-black text-slate-900">এখনো কোনো ক্যাটাগরি তৈরি করা হয়নি</p>
              <p className="text-xs text-slate-400 mt-1">উপরের বক্সে নাম লিখে ক্যাটাগরি যোগ করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-purple-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black">
                        <Tag size={15} />
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">{cat.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {(cat.subcategories || []).map((sub, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcat(cat.id, sub, cat.subcategories)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <form onSubmit={e => handleAddSubcat(e, cat.id, cat.subcategories)} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="+ সাবক্যাটাগরি লিখুন..."
                        value={newSubcat[cat.id] || ''}
                        onChange={e => setNewSubcat({...newSubcat, [cat.id]: e.target.value})}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-purple-400"
                      />
                      <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold transition-colors">
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Category Modal ── */}
      {isQuickCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus size={20} className="text-purple-600" />
                <h3 className="text-lg font-black text-slate-900">দ্রুত ক্যাটাগরি তৈরি</h3>
              </div>
              <button onClick={() => setIsQuickCatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1.5 uppercase tracking-wider">ক্যাটাগরির নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: ইলেকট্রনিক্স, পাঞ্জাবি, ব্যাগ..."
                  value={newCat}
                  onChange={e => { setNewCat(e.target.value); setCatError(''); }}
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold text-slate-800 outline-none ${
                    catError ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 focus:border-purple-500'
                  }`}
                  autoFocus
                />
                {catError && <p className="text-xs text-red-500 font-bold mt-1">{catError}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCatModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <Button type="submit" loading={addingCat} variant="primary" className="px-6">
                  তৈরি করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Product Import & Competitor Cloner Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload size={20} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900">প্রোডাক্ট ইমপোর্ট ও অটো-সেটআপ</h3>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setParsedCsvProducts([]); setCsvFile(null); }} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setImportTab('csv')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'csv'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={15} />
                <span>CSV / Excel ফাইল আপলোড</span>
              </button>
              <button
                type="button"
                onClick={() => setImportTab('clone')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'clone'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={15} className="text-yellow-500" />
                <span>প্রতিযোগী লিংক থেকে অটো কপি (REA)</span>
              </button>
            </div>

            {/* Tab 1: CSV Upload */}
            {importTab === 'csv' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    💡 সহজ নিয়ম:
                  </p>
                  <p className="text-[11px] text-purple-800">
                    আপনার CSV ফাইলে <strong>Product Name, Price, Category, Stock, Image URL</strong> হেডার থাকলেই আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে সব ডাটা ও ক্যাটাগরি তৈরি করে নেবে।
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-200 hover:border-purple-500 rounded-3xl p-6 text-center space-y-3 transition-colors bg-slate-50/50">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <div>
                    <label className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm">
                      <span>ফাইল বেছে নিন (.csv)</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                      {csvFile ? csvFile.name : 'কম্পিউটার থেকে যেকোনো প্রোডাক্ট CSV ফাইল সিলেক্ট করুন'}
                    </p>
                  </div>
                </div>

                {parsedCsvProducts.length > 0 && (
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-black">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{parsedCsvProducts.length} টি প্রোডাক্ট সফলভাবে প্রস্তুত হয়েছে</span>
                    </div>
                    <Button
                      onClick={handleBulkImportSubmit}
                      loading={importingCsv}
                      className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-black text-xs cursor-pointer"
                    >
                      ইনভেন্টরিতে সেভ করুন
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Competitor Link Cloner */}
            {importTab === 'clone' && (
              <form onSubmit={handleCloneSubmit} className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" /> REA Reverse Engineering AI Cloner:
                  </p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    প্রতিযোগী বা সাপ্লায়ারের যেকোনো ই-কমার্স সাইট (Daraz, Chaldal, Rokomari, Shajgoj, Shopify বা কোনো লোকাল স্টোর)-এর লিংক দিলে AI স্বয়ংক্রিয়ভাবে পণ্যের নাম, দাম, ছবি ও বিবরণ এক্সট্র্যাক্ট করে আপনার দোকানে যুক্ত করে দিবে!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    প্রতিযোগী পণ্য / ওয়েবসাইটের URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/product/..."
                    value={cloneUrl}
                    onChange={e => setCloneUrl(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  loading={cloning}
                  className="w-full !bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs h-12 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <Sparkles size={16} className="mr-2" /> পণ্য সংগ্রহ ও স্বয়ংক্রিয়ভাবে আমদানি করুন
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
