'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCategories, addCategory, deleteCategory } from '@/lib/firestore';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tag, Plus, Trash2, Search, Loader2, LayoutGrid } from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const { user, activeShopId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newSubcat, setNewSubcat] = useState({});

  const fetchCategories = async () => {
    if (!activeShopId) return;
    setLoading(true);
    try {
      const data = await getCategories(activeShopId);
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeShopId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    if (!activeShopId) {
      toast.error('শপ আইডি পাওয়া যাচ্ছে না। পেজ রিফ্রেশ করুন।');
      return;
    }
    setAdding(true);
    try {
      await addCategory(activeShopId, { name: newCat.trim() });
      toast.success('Category saved successfully! ✨');
      setNewCat('');
      fetchCategories();
    } catch (err) {
      console.error('Category add error:', err);
      if (err?.code === 'permission-denied') {
        toast.error('অনুমতি নেই (permission-denied)। অ্যাডমিনকে জানান।');
      } else {
        toast.error(`ক্যাটাগরি যোগ ব্যর্থ: ${err?.code || err?.message || 'Unknown error'}`);
      }
    } finally {
      setAdding(false);
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
      fetchCategories();
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
      fetchCategories();
    } catch (err) {
      toast.error('ব্যর্থ হয়েছে!');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(activeShopId, id);
      toast.success('Category removed');
      fetchCategories();
    } catch (err) {
      console.error('Category delete error:', err);
      if (err?.code === 'permission-denied') {
        toast.error('অনুমতি নেই (permission-denied)।');
      } else {
        toast.error(`ডিলিট ব্যর্থ: ${err?.code || err?.message || 'Unknown'}`);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Taxonomy</h1>
          <p className="text-sm text-slate-500 font-medium">Organize your store catalog into logical groups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Creation Hub */}
        <Card title="Management Console" subtitle="Define new taxonomy classes" icon={LayoutGrid} className="shadow-sm">
           <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
              <Input 
                placeholder="e.g. Premium Electronics, Summer Wear..." 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="flex-1"
                icon={Tag}
              />
              <Button 
                type="submit" 
                icon={Plus} 
                loading={adding} 
                className="md:w-64 h-[52px] shadow-lg shadow-purple-500/20"
              >
                Create Category
              </Button>
           </form>
        </Card>

        {/* Existing List */}
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Active Classifications ({categories.length})</p>
            {loading ? (
               <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl animate-pulse">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating Taxonomy Feed...</p>
               </div>
            ) : categories.length === 0 ? (
               <div className="bg-white py-20 text-center border-dashed border-2 border-slate-100 rounded-3xl">
                  <Tag size={40} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-extrabold text-slate-900">Zero Categories Found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">Categories help customers navigate your shop more efficiently.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-white p-5 flex flex-col group rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-lg transition-all">
                       <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs border border-slate-100 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                               {cat.name[0]?.toUpperCase()}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 tracking-tight text-sm uppercase">{cat.name}</p>
                               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Asset Group</p>
                            </div>
                         </div>
                         <Button 
                           variant="ghost" 
                           icon={Trash2} 
                           onClick={() => handleDelete(cat.id)}
                           className="px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all scale-90"
                         />
                       </div>
                       
                       <div className="mt-4 pt-4 border-t border-slate-100 w-full space-y-3">
                         <div className="flex flex-wrap gap-2">
                           {(cat.subcategories || []).map((sub, i) => (
                             <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                               {sub}
                               <button onClick={() => handleRemoveSubcat(cat.id, sub, cat.subcategories)} className="hover:text-red-500 font-black">&times;</button>
                             </span>
                           ))}
                         </div>
                         <form onSubmit={(e) => handleAddSubcat(e, cat.id, cat.subcategories)} className="flex items-center gap-2">
                           <input type="text" placeholder="Add Subcategory..." className="flex-1 text-[11px] font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500" value={newSubcat[cat.id] || ''} onChange={e => setNewSubcat({...newSubcat, [cat.id]: e.target.value})} />
                           <button type="submit" className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-purple-600"><Plus size={14}/></button>
                         </form>
                       </div>
                    </div>
                  ))}
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
