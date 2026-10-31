'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getProducts, deleteProduct, updateProduct, getCategories, addCategory, deleteCategory,
  bulkDeleteProducts, bulkUpdateProductsCategory, bulkUpdateProductsStock, bulkDeleteCategories
} from '@/lib/firestore';
import { uploadProductImage } from '@/lib/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/auth';
import { 
  Plus, Trash2, Package, Search, BarChart3, Tag, ChevronRight, ChevronLeft, Check, Pencil, X, 
  AlertCircle, Camera, ImageIcon, Loader2, MessageSquare, Sparkles, Eye, EyeOff, 
  Inbox, Layers, FolderPlus, HelpCircle, Download, Upload, Globe, FileText, CheckCircle2,
  CheckSquare, Square, RefreshCw, SlidersHorizontal
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

  // ── Multi-select, Pagination & Bulk Actions State ──
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [bulkStockModalOpen, setBulkStockModalOpen] = useState(false);
  const [targetStock, setTargetStock] = useState(50);
  
  // Category management & bulk state
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newSubcat, setNewSubcat] = useState({});
  const [isQuickCatModalOpen, setIsQuickCatModalOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
  const [bulkCatDeleteModalOpen, setBulkCatDeleteModalOpen] = useState(false);
  const [deleteCatWithProducts, setDeleteCatWithProducts] = useState(false);
  const [isBulkCatLoading, setIsBulkCatLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategorySubs, setEditCategorySubs] = useState('');
  const [isEditCatLoading, setIsEditCatLoading] = useState(false);

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

  // ── Pagination & Multi-Selection Calculations ──
  const totalFiltered = filteredProducts.length;
  const isPageSizeAll = pageSize === 'all';
  const effectivePageSize = isPageSizeAll ? totalFiltered : Number(pageSize);
  const totalPages = isPageSizeAll ? 1 : Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedProducts = isPageSizeAll 
    ? filteredProducts 
    : filteredProducts.slice((safeCurrentPage - 1) * effectivePageSize, safeCurrentPage * effectivePageSize);

  const isAllVisibleSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id));
  const isAllFilteredSelected = totalFiltered > 0 && filteredProducts.every(p => selectedIds.has(p.id));

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllVisibleSelected) {
        paginatedProducts.forEach(p => next.delete(p.id));
      } else {
        paginatedProducts.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredProducts.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDeleteConfirm = async () => {
    if (!activeShopId || selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    setIsBulkLoading(true);
    try {
      await bulkDeleteProducts(activeShopId, idsToDelete);
      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      toast.success(`সফলভাবে ${idsToDelete.length}টি পণ্য ডিলিট করা হয়েছে! 🗑️`);
    } catch (err) {
      console.error(err);
      toast.error('বাল্ক ডিলিট ব্যর্থ হয়েছে');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkCategoryConfirm = async () => {
    const finalCat = (customCategory.trim() || targetCategory.trim());
    if (!finalCat) {
      toast.error('ক্যাটাগরি নির্বাচন করুন বা নতুন ক্যাটাগরির নাম দিন');
      return;
    }
    const idsToUpdate = Array.from(selectedIds);
    setIsBulkLoading(true);
    try {
      await bulkUpdateProductsCategory(activeShopId, idsToUpdate, finalCat);
      setProducts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, category: finalCat } : p));
      setSelectedIds(new Set());
      setBulkCategoryModalOpen(false);
      setCustomCategory('');
      setTargetCategory('');
      toast.success(`${idsToUpdate.length}টি পণ্যের ক্যাটাগরি "${finalCat}" এ আপডেট হয়েছে! 🏷️`);
      fetchCategoriesData();
    } catch (err) {
      console.error(err);
      toast.error('ক্যাটাগরি আপডেট ব্যর্থ হয়েছে');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkStockConfirm = async () => {
    const stockVal = parseInt(targetStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      toast.error('সঠিক স্টক সংখ্যা দিন');
      return;
    }
    const idsToUpdate = Array.from(selectedIds);
    setIsBulkLoading(true);
    try {
      await bulkUpdateProductsStock(activeShopId, idsToUpdate, stockVal);
      setProducts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, stock: stockVal } : p));
      setSelectedIds(new Set());
      setBulkStockModalOpen(false);
      toast.success(`${idsToUpdate.length}টি পণ্যের স্টক ${stockVal} এ সেট করা হয়েছে! 📦`);
    } catch (err) {
      console.error(err);
      toast.error('স্টক আপডেট ব্যর্থ হয়েছে');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name || '');
    setEditCategorySubs(Array.isArray(cat.subcategories) ? cat.subcategories.join(', ') : '');
  };

  const handleSaveEditCategory = async (e) => {
    e?.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) {
      toast.error('ক্যাটাগরির নাম দিন');
      return;
    }
    const oldName = editingCategory.name;
    const newName = editCategoryName.trim();
    const subs = editCategorySubs
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    setIsEditCatLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          shopId: activeShopId,
          categoryId: editingCategory.id,
          name: newName,
          oldName,
          subcategories: subs
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newName, subcategories: subs } : c));
        if (oldName.toLowerCase() !== newName.toLowerCase()) {
          setProducts(prev => prev.map(p => (p.category || '').toLowerCase() === oldName.toLowerCase() ? { ...p, category: newName } : p));
        }
        toast.success(data.message || 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে! ✨');
        setEditingCategory(null);
        return;
      }

      // Direct Firestore fallback
      await updateDoc(doc(db, 'shops', activeShopId, 'categories', editingCategory.id), {
        name: newName,
        subcategories: subs
      });
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newName, subcategories: subs } : c));
      if (oldName.toLowerCase() !== newName.toLowerCase()) {
        const matchingIds = products
          .filter(p => (p.category || '').toLowerCase() === oldName.toLowerCase())
          .map(p => p.id);
        if (matchingIds.length > 0) {
          await bulkUpdateProductsCategory(activeShopId, matchingIds, newName);
          setProducts(prev => prev.map(p => matchingIds.includes(p.id) ? { ...p, category: newName } : p));
        }
      }
      toast.success('ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে! ✨');
      setEditingCategory(null);
    } catch (err) {
      console.error('[Save Category Edit Error]:', err);
      toast.error('ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsEditCatLoading(false);
    }
  };

  const handleDeleteCategoryWithProducts = async (cat) => {
    const matching = products.filter(p => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase());
    const proceed = window.confirm(`⚠️ সতর্কতা: আপনি কি "${cat.name}" ক্যাটাগরি এবং এর অন্তর্ভুক্ত সকল ${matching.length}টি প্রোডাক্ট স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`);
    if (!proceed) return;
    setIsBulkLoading(true);
    try {
      if (matching.length > 0) {
        await bulkDeleteProducts(activeShopId, matching.map(p => p.id));
        setProducts(prev => prev.filter(p => (p.category || '').toLowerCase() !== (cat.name || '').toLowerCase()));
      }
      await deleteCategory(activeShopId, cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      toast.success(`"${cat.name}" ক্যাটাগরি ও ${matching.length}টি প্রোডাক্ট সফলভাবে মুছে ফেলা হয়েছে! 🗑️`);
    } catch (err) {
      console.error(err);
      toast.error('ক্যাটাগরি মুছতে সমস্যা হয়েছে');
    } finally {
      setIsBulkLoading(false);
    }
  };

  // ── Category Multi-Select & Bulk Handlers ──
  const isAllCategoriesSelected = categories.length > 0 && categories.every(c => selectedCategoryIds.has(c.id));

  const handleToggleCategorySelect = (id) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllCategories = () => {
    setSelectedCategoryIds(prev => {
      if (isAllCategoriesSelected) {
        return new Set();
      } else {
        return new Set(categories.map(c => c.id));
      }
    });
  };

  const handleClearCategorySelection = () => {
    setSelectedCategoryIds(new Set());
  };

  const handleBulkCategoryDeleteConfirm = async () => {
    if (!activeShopId || selectedCategoryIds.size === 0) return;
    const selectedCats = categories.filter(c => selectedCategoryIds.has(c.id));
    const selectedCatNames = selectedCats.map(c => (c.name || '').toLowerCase());
    const catIdsToDelete = Array.from(selectedCategoryIds);

    const matchingProducts = products.filter(p => selectedCatNames.includes((p.category || '').toLowerCase()));
    const matchingProductIds = matchingProducts.map(p => p.id);

    setIsBulkCatLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          shopId: activeShopId,
          categoryIds: catIdsToDelete,
          categoryNames: selectedCatNames,
          deleteWithProducts: deleteCatWithProducts
        })
      });

      if (res.ok) {
        if (deleteCatWithProducts) {
          setProducts(prev => prev.filter(p => !matchingProductIds.includes(p.id)));
        } else {
          setProducts(prev => prev.map(p => matchingProductIds.includes(p.id) ? { ...p, category: 'Uncategorized' } : p));
        }
        setCategories(prev => prev.filter(c => !selectedCategoryIds.has(c.id)));
        setSelectedCategoryIds(new Set());
        setBulkCatDeleteModalOpen(false);
        toast.success(`সফলভাবে ${catIdsToDelete.length}টি ক্যাটাগরি মুছে ফেলা হয়েছে! 🗑️`);
        return;
      }
    } catch (_) {}
    try {
      if (deleteCatWithProducts && matchingProductIds.length > 0) {
        // Cascade delete products
        await bulkDeleteProducts(activeShopId, matchingProductIds);
        setProducts(prev => prev.filter(p => !matchingProductIds.includes(p.id)));
      } else if (!deleteCatWithProducts && matchingProductIds.length > 0) {
        // Safe reassign products to Uncategorized
        await bulkUpdateProductsCategory(activeShopId, matchingProductIds, 'Uncategorized');
        setProducts(prev => prev.map(p => matchingProductIds.includes(p.id) ? { ...p, category: 'Uncategorized' } : p));
      }

      await bulkDeleteCategories(activeShopId, catIdsToDelete);
      setCategories(prev => prev.filter(c => !selectedCategoryIds.has(c.id)));
      setSelectedCategoryIds(new Set());
      setBulkCatDeleteModalOpen(false);
      toast.success(`সফলভাবে ${catIdsToDelete.length}টি ক্যাটাগরি মুছে ফেলা হয়েছে! 🗑️`);
    } catch (err) {
      console.error(err);
      toast.error('ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setIsBulkCatLoading(false);
    }
  };

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

  // Dynamic SheetJS loader for native Excel (.xlsx, .xls) support without bundling overhead
  const loadSheetJS = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.XLSX) return resolve(window.XLSX);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('Excel ফাইল রিডার লোড করতে ব্যর্থ হয়েছে।'));
      document.head.appendChild(script);
    });
  };

  const handleCsvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);

    if (isExcel) {
      const loadToast = toast.loading('এক্সেল ফাইল (.xlsx/.xls) বিশ্লেষণ করা হচ্ছে...');
      try {
        const XLSX = await loadSheetJS();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsed = rawJson.map(row => {
          const item = {};
          Object.keys(row).forEach(key => {
            const h = key.toLowerCase().trim();
            const val = row[key];
            if (h.includes('name') || h === 'title') item.name = String(val).trim();
            else if (h.includes('price') && !h.includes('cost')) item.price = parseFloat(val) || 0;
            else if (h.includes('cost')) item.costPrice = parseFloat(val) || 0;
            else if (h.includes('stock') || h.includes('qty')) item.stock = parseInt(val, 10) || 50;
            else if (h.includes('category') && !h.includes('sub')) item.category = String(val).trim();
            else if (h.includes('subcat')) item.subCategory = String(val).trim();
            else if (h.includes('image') || h.includes('photo')) item.imageUrl = String(val).trim();
            else if (h.includes('sku')) item.sku = String(val).trim();
            else if (h.includes('desc')) item.description = String(val).trim();
          });
          return item;
        }).filter(item => item.name);

        setParsedCsvProducts(parsed);
        toast.dismiss(loadToast);
        if (parsed.length === 0) {
          toast.error('এক্সেল ফাইলে কোনো ভ্যালিড প্রোডাক্ট ডাটা পাওয়া যায়নি');
        } else {
          toast.success(`${parsed.length} টি প্রোডাক্ট সফলভাবে এক্সেল ফাইল থেকে শনাক্ত হয়েছে! 🎉`);
        }
      } catch (err) {
        toast.dismiss(loadToast);
        console.error('Excel parse error:', err);
        toast.error('এক্সেল ফাইল পড়তে সমস্যা: ' + err.message);
      }
      return;
    }

    // CSV text processing
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const parsed = parseCSV(text);
        setParsedCsvProducts(parsed);
        if (parsed.length === 0) {
          toast.error('CSV ফাইলে কোনো ভ্যালিড প্রোডাক্ট পাওয়া যায়নি');
        } else {
          toast.success(`${parsed.length} টি প্রোডাক্ট শনাক্ত হয়েছে! 🎉`);
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

          {/* Sticky Bulk Action Toolbar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-4 mb-4 shadow-xl ring-2 ring-purple-500/20 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  {selectedIds.size}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {selectedIds.size}টি পণ্য নির্বাচিত
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBulkCategoryModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Tag size={14} />
                  <span>ক্যাটাগরি পরিবর্তন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkStockModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Package size={14} />
                  <span>স্টক পরিবর্তন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-red-600/30"
                >
                  <Trash2 size={14} />
                  <span>মুছে ফেলুন ({selectedIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="নির্বাচন বাতিল"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-0">
              {/* Filter Selection Banner */}
              {isAllVisibleSelected && totalFiltered > paginatedProducts.length && (
                <div className="bg-purple-50 border-b border-purple-100 px-6 py-2.5 text-xs text-purple-900 font-bold flex items-center justify-between">
                  <span>
                    এই পেজের {paginatedProducts.length}টি পণ্য নির্বাচিত হয়েছে।
                    {!isAllFilteredSelected ? (
                      <button 
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="ml-2 text-purple-700 underline font-black hover:text-purple-900 cursor-pointer"
                      >
                        ফিল্টার করা সকল {totalFiltered}টি পণ্য নির্বাচন করুন
                      </button>
                    ) : (
                      <span className="ml-2 font-black text-emerald-700">✓ ফিল্টারের সকল {totalFiltered}টি পণ্য নির্বাচিত!</span>
                    )}
                  </span>
                  <button type="button" onClick={handleClearSelection} className="text-purple-600 hover:text-purple-800 underline cursor-pointer">
                    সিলেকশন ক্লিয়ার করুন
                  </button>
                </div>
              )}

              <div className="overflow-x-auto flat-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-4 w-10 text-center">
                        <input 
                          type="checkbox"
                          checked={isAllVisibleSelected}
                          onChange={handleToggleSelectAllVisible}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          title="এই পেজের সব সিলেক্ট করুন"
                        />
                      </th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price (৳)</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map(p => (
                      <tr key={p.id} className={`hover:bg-slate-50/60 transition-colors ${selectedIds.has(p.id) ? 'bg-purple-50/40' : ''}`}>
                        <td className="px-4 py-4 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => handleToggleSelect(p.id)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
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
                            <Link 
                              href={`/dashboard/products/edit/${p.id}`} 
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95" 
                              title="পণ্য এডিট করুন"
                            >
                              <Pencil size={13} />
                              <span className="hidden sm:inline">এডিট</span>
                            </Link>
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/80 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer" 
                              title="পণ্য মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">মুছুন</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <span>প্রতি পেজে:</span>
                  <select 
                    value={pageSize}
                    onChange={e => {
                      setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={25}>২৫টি</option>
                    <option value={50}>৫০টি</option>
                    <option value={100}>১০০টি</option>
                    <option value={250}>২৫০টি</option>
                    <option value="all">সবগুলো ({totalFiltered})</option>
                  </select>
                  <span className="ml-2">
                    মোট {totalFiltered} টির মধ্যে {isPageSizeAll ? `১-${totalFiltered}` : `${(safeCurrentPage - 1) * effectivePageSize + 1}-${Math.min(safeCurrentPage * effectivePageSize, totalFiltered)}`} দেখাচ্ছে
                  </span>
                </div>

                {!isPageSizeAll && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="পূর্ববর্তী পেজ"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 text-xs font-black text-slate-700">
                      পেজ {safeCurrentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="পরবর্তী পেজ"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
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
            <div className="space-y-4">
              {/* Category Select All Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <button
                  type="button"
                  onClick={handleToggleSelectAllCategories}
                  className="flex items-center gap-2.5 text-xs font-black text-slate-700 hover:text-purple-600 transition-colors cursor-pointer select-none"
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isAllCategoriesSelected
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : selectedCategoryIds.size > 0
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span>
                    {isAllCategoriesSelected ? 'সবগুলো সিলেক্ট করা হয়েছে' : 'সকল ক্যাটাগরি সিলেক্ট করুন'} ({selectedCategoryIds.size}/{categories.length})
                  </span>
                </button>

                {selectedCategoryIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                      {selectedCategoryIds.size}টি ক্যাটাগরি নির্বাচিত
                    </span>
                    <button
                      type="button"
                      onClick={handleClearCategorySelection}
                      className="text-xs text-slate-400 hover:text-red-500 font-bold px-2 py-1 cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky Bulk Category Action Toolbar */}
              {selectedCategoryIds.size > 0 && (
                <div className="sticky top-4 mb-4 shadow-xl ring-2 ring-purple-500/20 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      {selectedCategoryIds.size}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedCategoryIds.size}টি ক্যাটাগরি নির্বাচিত
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const firstCat = categories.find(c => selectedCategoryIds.has(c.id));
                        if (firstCat) setSelectedCategory(firstCat.name);
                        setActiveTab('products');
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Search size={14} />
                      <span>পণ্যসমূহ দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkCatDeleteModalOpen(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-red-600/30"
                    >
                      <Trash2 size={14} />
                      <span>ক্যাটাগরি মুছুন ({selectedCategoryIds.size})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearCategorySelection}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="নির্বাচন বাতিল"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => {
                  const isCatSelected = selectedCategoryIds.has(cat.id);
                  const matchingCount = products.filter(p => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase()).length;

                  return (
                    <div 
                      key={cat.id} 
                      className={`bg-white p-5 rounded-2xl border transition-all ${
                        isCatSelected ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/20' : 'border-slate-100 hover:border-purple-200'
                      } shadow-sm space-y-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCategorySelect(cat.id);
                            }}
                            className="shrink-0 p-0.5 rounded-lg cursor-pointer"
                            title={isCatSelected ? "আনসিলেক্ট করুন" : "সিলেক্ট করুন"}
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              isCatSelected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 bg-white text-transparent hover:border-purple-400'
                            }`}>
                              <Check size={13} strokeWidth={3} />
                            </div>
                          </button>
                          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black shrink-0">
                            <Tag size={15} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">{cat.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {matchingCount} টি পণ্য
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setActiveTab('products');
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="এই ক্যাটাগরির পণ্যসমূহ দেখুন"
                          >
                            <Search size={12} />
                            <span>পণ্যসমূহ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            title="ক্যাটাগরির নাম ও সাবক্যাটাগরি সম্পাদনা করুন"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryWithProducts(cat)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="ক্যাটাগরি ও এর সকল পণ্য মুছুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
                  );
                })}
              </div>

              
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
                    আপনার CSV বা Excel ফাইলে <strong>Product Name, Price, Category, Stock, Image URL</strong> হেডার থাকলেই আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে সব ডাটা ও ক্যাটাগরি তৈরি করে নেবে (একবারে সর্বোচ্চ ৫,০০০ প্রোডাক্ট পর্যন্ত)।
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-200 hover:border-purple-500 rounded-3xl p-6 text-center space-y-3 transition-colors bg-slate-50/50">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <div>
                    <label className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm">
                      <span>ফাইল বেছে নিন (.csv বা .xlsx / .xls)</span>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                      {csvFile ? csvFile.name : 'কম্পিউটার থেকে যেকোনো প্রোডাক্ট CSV বা Excel (.xlsx / .xls) ফাইল সিলেক্ট করুন'}
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
                    প্রতিযোগী বা সাপ্লায়ারের যেকোনো একক পণ্য, **পুরো ক্যাটাগরি / সাবক্যাটাগরি** (যেমন: themallbd.com/category/skin-care-bath) অথবা পুরো সাইটের লিংক দিলে REA হান্টার বট স্বয়ংক্রিয়ভাবে আসল পণ্যের নাম, সঠিক দাম, ছবি, বিবরণ ও ক্যাটাগরি তৈরি করে আপনার স্টোরে যুক্ত করে দিবে!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    প্রতিযোগী পণ্য / ওয়েবসাইটের URL *
                  </label>
                  <input
                    type="url"
                    placeholder="যেমন: https://themallbd.com/category/skin-care-bath বা https://site.com/product/xyz"
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

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {selectedIds.size}টি পণ্য ডিলিট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                আপনি কি নিশ্চিত যে নির্বাচিত <strong>{selectedIds.size}</strong> টি প্রোডাক্ট চিরতরে মুছে ফেলতে চান? একবার মুছে ফেললে এটি আর ফিরিয়ে আনা সম্ভব হবে না।
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isBulkLoading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Change Category Modal ── */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Tag size={28} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {selectedIds.size}টি পণ্যের ক্যাটাগরি পরিবর্তন
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                বিদ্যমান কোনো ক্যাটাগরি বেছে নিন অথবা নতুন ক্যাটাগরির নাম লিখুন:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">বিদ্যমান ক্যাটাগরি:</label>
                <select
                  value={targetCategory}
                  onChange={e => {
                    setTargetCategory(e.target.value);
                    if (e.target.value) setCustomCategory('');
                  }}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none"
                >
                  <option value="">-- ক্যাটাগরি বেছে নিন --</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <span className="bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">অথবা</span>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">নতুন ক্যাটাগরির নাম লিখুন:</label>
                <input
                  type="text"
                  placeholder="যেমন: স্কিন কেয়ার, কসমেটিকস..."
                  value={customCategory}
                  onChange={e => {
                    setCustomCategory(e.target.value);
                    if (e.target.value) setTargetCategory('');
                  }}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkCategoryModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleBulkCategoryConfirm}
                disabled={isBulkLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isBulkLoading ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Stock Update Modal ── */}
      {bulkStockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Package size={28} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {selectedIds.size}টি পণ্যের স্টক পরিবর্তন
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                নির্বাচিত সকল পণ্যের নতুন স্টক সংখ্যা নির্ধারণ করুন:
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetStock(50)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${Number(targetStock) === 50 ? 'bg-purple-50 border-purple-300 text-purple-700 font-black' : 'border-slate-200 text-slate-600'}`}
                >
                  স্টক ৫০ (In Stock)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStock(0)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${Number(targetStock) === 0 ? 'bg-red-50 border-red-300 text-red-700 font-black' : 'border-slate-200 text-slate-600'}`}
                >
                  স্টক ০ (Out of Stock)
                </button>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">কাস্টম স্টক সংখ্যা:</label>
                <input
                  type="number"
                  min="0"
                  value={targetStock}
                  onChange={e => setTargetStock(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkStockModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleBulkStockConfirm}
                disabled={isBulkLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isBulkLoading ? 'আপডেট হচ্ছে...' : 'স্টক পরিবর্তন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Category Modal ── */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">ক্যাটাগরি সম্পাদনা</h3>
                  <p className="text-[11px] text-slate-400 font-bold">নাম ও সাবক্যাটাগরি পরিবর্তন করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  ক্যাটাগরির নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="যেমন: Skin Care, Electronics..."
                  className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-600 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  সাবক্যাটাগরি সমূহ (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  value={editCategorySubs}
                  onChange={(e) => setEditCategorySubs(e.target.value)}
                  placeholder="যেমন: Serum, Toner, Cream"
                  className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-600 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  একাধিক সাবক্যাটাগরি কমা (,) দিয়ে আলাদা করে লিখুন
                </p>
              </div>

              {(() => {
                const affectedCount = products.filter(
                  p => (p.category || '').toLowerCase() === (editingCategory.name || '').toLowerCase()
                ).length;
                return (
                  <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                      এই ক্যাটাগরিতে বর্তমানে <strong>{affectedCount}টি পণ্য</strong> রয়েছে। নাম পরিবর্তন করলে সংশ্লিষ্ট সকল পণ্যের ক্যাটাগরি স্বয়ংক্রিয়ভাবে আপডেট হবে।
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isEditCatLoading || !editCategoryName.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isEditCatLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk Category Delete Modal (Strict Database Protection Compliant) ── */}
      {bulkCatDeleteModalOpen && (() => {
        const selectedCats = categories.filter(c => selectedCategoryIds.has(c.id));
        const selectedCatNames = selectedCats.map(c => (c.name || '').toLowerCase());
        const totalAffectedProducts = products.filter(p => selectedCatNames.includes((p.category || '').toLowerCase())).length;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={28} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-slate-900">
                  {selectedCategoryIds.size}টি ক্যাটাগরি ডিলিট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  নির্বাচিত ক্যাটাগরিগুলোর অধীনে বর্তমানে মোট <strong className="text-purple-600 font-black">{totalAffectedProducts}</strong> টি পণ্য রয়েছে। নিচের অ্যাকশনটি বেছে নিন:
                </p>
              </div>

              {/* Radio Choices */}
              <div className="space-y-3 pt-1">
                <label 
                  onClick={() => setDeleteCatWithProducts(false)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    !deleteCatWithProducts 
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="cat_delete_mode"
                    checked={!deleteCatWithProducts}
                    onChange={() => setDeleteCatWithProducts(false)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      শুধুমাত্র ক্যাটাগরি ডিলিট করুন (প্রস্তাবিত ও নিরাপদ)
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      ক্যাটাগরি মুছে যাবে কিন্তু পণ্যগুলো ডিলিট হবে না। পণ্যগুলো সুরক্ষিত থাকবে এবং 'Uncategorized' হিসেবে সংরক্ষিত হবে।
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => setDeleteCatWithProducts(true)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    deleteCatWithProducts 
                      ? 'border-red-600 bg-red-50/50 ring-2 ring-red-100' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="cat_delete_mode"
                    checked={deleteCatWithProducts}
                    onChange={() => setDeleteCatWithProducts(true)}
                    className="mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-red-600">
                      ক্যাটাগরি এবং এর আওতাধীন সকল ({totalAffectedProducts}টি) পণ্য একসাথে মুছুন
                    </div>
                    <p className="text-[11px] text-red-500 font-medium mt-0.5">
                      ⚠️ সতর্কতা: নির্বাচিত ক্যাটাগরির সাথে সাথে ডেটাবেজের সকল {totalAffectedProducts}টি পণ্য চিরতরে মুছে যাবে।
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBulkCatDeleteModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBulkCategoryDeleteConfirm}
                  disabled={isBulkCatLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isBulkCatLoading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত মুছে ফেলুন'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
