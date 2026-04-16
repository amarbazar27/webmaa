'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, updateShop } from '@/lib/firestore';
import { uploadShopLogo } from '@/lib/storage';
import { 
  Store, Globe, Phone, Text, Save, Image as ImageIcon, ShieldCheck, 
  Info, Link2, AlertTriangle, Check, Sparkles, MessageSquare, Truck, Users, Gift, X,
  MapPin, Clock, Plus
} from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';

// Bangladesh Districts (partial list — key ones)
const BD_DISTRICTS = [
  'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ',
  'কুমিল্লা', 'নারায়ণগঞ্জ', 'গাজীপুর', 'জামালপুর', 'নোয়াখালী', 'ফেনী', 'বিক্রমপুর',
  'মাদারীপুর', 'গোপালগঞ্জ', 'কিশোরগঞ্জ', 'হবিগঞ্জ', 'মৌলভীবাজার', 'সুনামগঞ্জ',
  'পঞ্চগড়', 'ঠাকুরগাঁও', 'দিনাজপুর', 'নীলফামারী', 'কুড়িগ্রাম', 'লালমনিরহাট',
  'বগুড়া', 'জয়পুরহাট', 'চাঁপাইনবাবগঞ্জ', 'রাজবাড়ী', 'রাঙামাটি', 'খাগড়াছড়ি',
  'বান্দরবান', 'চাঁদপুর', 'লক্ষ্মীপুর', 'শরীয়তপুর', 'পিরোজপুর', 'খুলনা', 'সাতক্ষীরা', 'বাগেরহাট',
  'নাটোর', 'পাবনা', 'সিরাজগঞ্জ', 'মানিকগঞ্জ', 'মুন্শীগঞ্জ', 'শরিয়তপুর', 'ককসবাজার', 'টাঙ্গাইল',
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Narayanganj', 'Gazipur', 'Jamalpur', 'Noakhali', 'Feni'
];

export default function SettingsPage() {
  const { user, userData, activeShopId } = useAuth();
  const [shop, setShop] = useState({ shopName: '', slogan: '', notices: '', welcomeMessage: '', subdomainSlug: '', banners: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugError, setSlugError] = useState('');
  
  const [staffEmails, setStaffEmails] = useState([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');

  // Complex substates to prevent null referencing
  const [socialLinks, setSocialLinks] = useState({ fb: '', insta: '', yt: '', wa: '' });
  const [authSettings, setAuthSettings] = useState({ emailAuth: false, actionPin: '' });
  const [promoSettings, setPromoSettings] = useState({ seventhDayFree: false });
  const [deliveryConfig, setDeliveryConfig] = useState({ advanceFee: '', methods: '', isCOD: true });
  const [aiConfig, setAiConfig] = useState({ apiKey: '', botName: '', botTone: 'funny' });
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newServiceArea, setNewServiceArea] = useState('');
  const [isStrictLocation, setIsStrictLocation] = useState(false);
  
  const [geoData, setGeoData] = useState({ divisions: [], districts: [], upazilas: [], unions: [] });
  const [geoSelections, setGeoSelections] = useState({ division: '', district: '', upazila: '', union: '' });
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getShop(user.uid).then(data => {
      if (data) {
        setShop({
          shopName: data.shopName || '',
          slogan: data.slogan || '',
          notices: data.notices || '',
          welcomeMessage: data.welcomeMessage || '',
          subdomainSlug: data.subdomainSlug || '',
          banners: data.banners || [],
          ...data
        });
      }
      setLogoPreview(data?.logoUrl || null);
      setSlugInput(data?.subdomainSlug || '');
      
      setSocialLinks({
        fb: data?.socialLinks?.fb || '', 
        insta: data?.socialLinks?.insta || '', 
        yt: data?.socialLinks?.yt || '',
        wa: data?.socialLinks?.wa || ''
      });
      setAuthSettings({
        emailAuth: data?.authSettings?.emailAuth || false, 
        actionPin: data?.authSettings?.actionPin || ''
      });
      setPromoSettings({
        seventhDayFree: data?.promoSettings?.seventhDayFree || false
      });
      setDeliveryConfig({ 
        advanceFee: data?.deliveryConfig?.advanceFee || '', 
        methods: data?.deliveryConfig?.methods || '', 
        isCOD: data?.deliveryConfig?.isCOD ?? true 
      });
      setAiConfig({ 
        apiKey: data?.aiConfig?.apiKey || '', 
        botName: data?.aiConfig?.botName || 'বজার এআই', 
        botTone: data?.aiConfig?.botTone || 'funny' 
      });
      setStaffEmails(data?.staffEmails || []);
      setServiceAreas(data?.serviceAreas || []);
      setIsStrictLocation(data?.isStrictLocation || false);
      
      setLoading(false);
    });
  }, [user]);

  // Geo Data Fetching Logic
  useEffect(() => {
    setGeoLoading(true);
    fetch('/api/geo?type=divisions').then(r => r.json()).then(data => {
      setGeoData(prev => ({ ...prev, divisions: data }));
      setGeoLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!geoSelections.division) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=districts`).then(r => r.json()).then(data => {
      const filtered = data.filter(d => d.division_id === geoSelections.division);
      setGeoData(prev => ({ ...prev, districts: filtered, upazilas: [], unions: [] }));
      setGeoSelections(prev => ({ ...prev, district: '', upazila: '', union: '' }));
      setGeoLoading(false);
    });
  }, [geoSelections.division]);

  useEffect(() => {
    if (!geoSelections.district) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=upazilas`).then(r => r.json()).then(data => {
      const filtered = data.filter(d => d.district_id === geoSelections.district);
      setGeoData(prev => ({ ...prev, upazilas: filtered, unions: [] }));
      setGeoSelections(prev => ({ ...prev, upazila: '', union: '' }));
      setGeoLoading(false);
    });
  }, [geoSelections.district]);

  useEffect(() => {
    if (!geoSelections.upazila) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=unions`).then(r => r.json()).then(data => {
      const filtered = data.filter(d => d.upazilla_id === geoSelections.upazila);
      setGeoData(prev => ({ ...prev, unions: filtered }));
      setGeoSelections(prev => ({ ...prev, union: '' }));
      setGeoLoading(false);
    });
  }, [geoSelections.upazila]);

  const addGeoArea = () => {
    const { division, district, upazila, union } = geoSelections;
    if (!division) return;
    
    const divName = geoData.divisions.find(d => d.id === division)?.bn_name;
    const distName = geoData.districts.find(d => d.id === district)?.bn_name;
    const upaName = geoData.upazilas.find(d => d.id === upazila)?.bn_name;
    const uniName = geoData.unions.find(d => d.id === union)?.bn_name;
    
    let areaString = divName;
    if (distName) areaString += ` > ${distName}`;
    if (upaName) areaString += ` > ${upaName}`;
    if (uniName) areaString += ` > ${uniName}`;
    
    if (!serviceAreas.includes(areaString)) {
      setServiceAreas([...serviceAreas, areaString]);
    }
  };


  // Protect page from staff users just in case they land here
  if (userData?.role === 'staff') {
     return <div className="p-20 text-center font-black text-slate-400">Settings restricted to Store Owner.</div>;
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateSlug = (val) => {
    if (!val) return 'URL cannot be empty';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (val.length < 3) return 'Minimum 3 characters';
    return '';
  };

  const handleSlugSave = async () => {
    const err = validateSlug(slugInput);
    if (err) { setSlugError(err); return; }
    setSlugError('');
    setSaving(true);
    try {
      await updateShop(user.uid, { subdomainSlug: slugInput, shopSlug: slugInput });
      setShop(s => ({ ...s, subdomainSlug: slugInput, shopSlug: slugInput }));
      toast.success('Store URL updated! 🔗');
      setSlugEditing(false);
    } catch (err) {
      toast.error('Failed to update URL');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ব্যানার সাইজ ৫ মেগাবাইটের বেশি হওয়া যাবে না।');
      return;
    }
    if ((shop.banners?.length || 0) >= 5) {
      toast.error('আপনি সর্বোচ্চ ৫টি ব্যানার আপলোড করতে পারবেন।');
      return;
    }
    
    const { uploadImage } = await import('@/lib/storage');
    setSaving(true);
    try {
      const url = await uploadImage(file);
      const newBanners = [...(shop.banners || []), url];
      await updateShop(user.uid, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('ব্যানার আপলোড সফল হয়েছে! 🖼️');
    } catch (err) {
      toast.error(err.message || 'ব্যানার আপলোড ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (index) => {
    const newBanners = shop.banners.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await updateShop(user.uid, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('ব্যানার সরানো হয়েছে');
    } catch (err) {
      toast.error('ব্যানার সরাতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !shop) return;
    setSaving(true);
    try {
      let logoUrl = shop.logoUrl || '';
      if (logoFile) {
        logoUrl = await uploadShopLogo(user.uid, logoFile);
      }
      
      await updateShop(user.uid, { 
        shopName: shop.shopName,
        slogan: shop.slogan,
        notices: shop.notices,
        welcomeMessage: shop.welcomeMessage,
        bannerInterval: shop.bannerInterval || 4,
        logoUrl,
        socialLinks,
        authSettings,
        promoSettings,
        deliveryConfig,
        aiConfig,
        staffEmails,
        serviceAreas,
        isStrictLocation
      });
      toast.success('All settings synchronized! ✨');
    } catch (err) {
      console.error(err);
      toast.error('Settings update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading configurations...</p>
      </div>
    );
  }

  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://webmaa.cloud'}/shop/${shop?.subdomainSlug}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Customizer</h1>
          <p className="text-sm text-slate-500 font-medium">Configure deep integrations, auth, AI, and visuals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Identity & Left Col */}
        <div className="lg:col-span-4 space-y-8">
          <Card title="Store Public URL" subtitle="Your live shop link" icon={Link2} className="border-2 border-slate-100 shadow-xl bg-white">
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner relative">
                {slugEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">/shop/</span>
                      <input
                        type="text"
                        value={slugInput}
                        onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(''); }}
                        className="flex-1 bg-white border-2 border-purple-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-purple-600 transition-all text-slate-900"
                      />
                    </div>
                    {slugError && <p className="text-[10px] text-red-500 font-bold">{slugError}</p>}
                    <div className="flex gap-2">
                       <button onClick={handleSlugSave} disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Save</button>
                       <button onClick={() => setSlugEditing(false)} className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 active:scale-95 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <a href={storeUrl} target="_blank" rel="noreferrer" className="text-sm font-black text-purple-600 hover:text-purple-700 underline truncate block tracking-tight">{storeUrl}</a>
                    <button onClick={() => setSlugEditing(true)} className="mt-3 w-full py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                       Set Custom Subdomain
                    </button>
                  </div>
                )}

              </div>
            </div>
          </Card>

          <Card title="Brand Assets" subtitle="Visual Logo" icon={ImageIcon} className="shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative group w-32 h-32 mb-4">
                <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-3">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <Store size={40} className="text-slate-200"/>}
                </div>
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer rounded-3xl border-2 border-white border-dashed">
                  <span className="text-[10px] text-white font-black uppercase">Upload</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
          </Card>
          
          <Card title="Loyalty & Promo" subtitle="Customer Retention" icon={Gift} className="border-l-4 border-l-emerald-400">
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                   <p className="text-xs font-black text-slate-900">7th Day Special Hero</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">6 days streak = Free Delivery</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={promoSettings.seventhDayFree} onChange={e => setPromoSettings({...promoSettings, seventhDayFree: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
             </div>
          </Card>

          <Card title="Customer Auth" subtitle="Sign-in Options" icon={Users}>
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                   <p className="text-xs font-black text-slate-900">Email & Password Auth</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Allow custom registration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={authSettings.emailAuth} onChange={e => setAuthSettings({...authSettings, emailAuth: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
             </div>
          </Card>
        </div>

        {/* Configurations Col */}
        <div className="lg:col-span-8 space-y-8">
          
          <form onSubmit={handleSave} className="space-y-8">
            <Card title="Staff Management" subtitle="Multi-Tenant Isolation" icon={Users} className="border-l-4 border-l-blue-500">
               <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    Add email addresses of users who can manage your inventory and orders. Staff will have a fully isolated dashboard.
                  </p>
                  
                  <div className="flex gap-2">
                     <Input 
                       placeholder="staff@gmail.com" 
                       type="email"
                       value={newStaffEmail}
                       onChange={e => setNewStaffEmail(e.target.value)}
                       className="flex-1"
                     />
                     <Button type="button" onClick={() => {
                        if (newStaffEmail && !staffEmails.includes(newStaffEmail.toLowerCase())) {
                           setStaffEmails([...staffEmails, newStaffEmail.toLowerCase()]);
                           setNewStaffEmail('');
                        }
                     }} className="h-[52px]">Add Staff</Button>
                  </div>
                  
                  {staffEmails.length > 0 && (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {staffEmails.map(email => (
                           <div key={email} className="flex justify-between items-center p-3 px-4 text-sm font-bold text-slate-800">
                              {email}
                              <button type="button" onClick={() => setStaffEmails(staffEmails.filter(e => e !== email))} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded">Remove</button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </Card>
            
            <Card title="Security Preferences" subtitle="Action Authorization" icon={ShieldCheck}>
               <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="max-w-[70%]">
                     <p className="text-xs font-black text-slate-900">4-Digit Security PIN</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Requires PIN when changing order status</p>
                  </div>
                  <Input 
                     type="password"
                     maxLength={4}
                     placeholder="****"
                     className="w-24 text-center font-black tracking-widest text-lg"
                     value={authSettings.actionPin}
                     onChange={e => setAuthSettings({...authSettings, actionPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  />
               </div>
            </Card>

            <Card title="Checkout & Delivery" subtitle="Payments & COD" icon={Truck}>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                 <div>
                    <p className="text-xs font-black text-slate-900">Cash on Delivery (COD)</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">If off, full payment is required via TxnID</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={deliveryConfig.isCOD} onChange={e => setDeliveryConfig({...deliveryConfig, isCOD: e.target.checked})} />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                 </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                 <Input
                   label={deliveryConfig.isCOD ? "Advance Delivery Fee (৳)" : "Flat Delivery Fee (৳)"}
                   type="number"
                   value={deliveryConfig.advanceFee}
                   onChange={e => setDeliveryConfig({...deliveryConfig, advanceFee: e.target.value})}
                   placeholder="e.g. 100"
                 />
                 <Input
                   label="Accepted Payment Numbers"
                   value={deliveryConfig.methods}
                   onChange={e => setDeliveryConfig({...deliveryConfig, methods: e.target.value})}
                   placeholder="bKash: 017.., Nagad.."
                 />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                 {deliveryConfig.isCOD 
                   ? "If advance fee is set, customers must provide a Transaction ID to clear the advance fee before ordering. The rest will be Cash on Delivery."
                   : "Cash on delivery is disabled. Customers must pay the Total Value + Delivery Fee entirely before placing the order."
                 }
              </p>
            </Card>

            <Card title="Store AI Companion" subtitle="Smart Assistant" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="LLM API Key (Gemini/OpenAI)"
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})}
                    placeholder="Enter your private API key"
                  />
                  <Input
                    label="AI Avatar Name"
                    value={aiConfig.botName}
                    onChange={e => setAiConfig({...aiConfig, botName: e.target.value})}
                    placeholder="e.g. Bazar Bot"
                  />
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Conversation Tone</label>
                     <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                           <input type="radio" name="tone" value="funny" checked={aiConfig.botTone === 'funny'} onChange={e => setAiConfig({...aiConfig, botTone: e.target.value})} className="peer sr-only"/>
                           <div className="p-4 border-2 border-slate-100 rounded-2xl text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all">
                              <p className="font-black text-slate-900 text-sm">Funny & Witty 🎭</p>
                           </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                           <input type="radio" name="tone" value="formal" checked={aiConfig.botTone === 'formal'} onChange={e => setAiConfig({...aiConfig, botTone: e.target.value})} className="peer sr-only"/>
                           <div className="p-4 border-2 border-slate-100 rounded-2xl text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all">
                              <p className="font-black text-slate-900 text-sm">Strictly Formal 👔</p>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </Card>

            <Card title="Display & Branding" subtitle="Marquee and text" icon={Text}>
              <div className="space-y-6">
                <Input
                  label="Display Name"
                  value={shop.shopName || ''}
                  onChange={e => setShop({ ...shop, shopName: e.target.value })}
                />
                <Input
                  label="Slogan"
                  value={shop.slogan || ''}
                  onChange={e => setShop({ ...shop, slogan: e.target.value })}
                  placeholder="Your catchy brand slogan"
                />
                <Input
                  label="Store Notice (Marquee)"
                  value={shop.notices || ''}
                  onChange={e => setShop({ ...shop, notices: e.target.value })}
                  placeholder="Top scrolling notice (e.g. Eid Discount!!!)"
                />
                <Input
                  label="Welcome Heading"
                  value={shop.welcomeMessage || ''}
                  onChange={e => setShop({ ...shop, welcomeMessage: e.target.value })}
                  placeholder="Welcome message if no banner is set"
                />

                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Banners (Max 5, 5MB each)</label>
                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {shop.banners?.map((url, i) => (
                         <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={url} className="w-full h-full object-cover" alt="" />
                            <button 
                              type="button" 
                              onClick={() => removeBanner(i)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                               <X size={14} />
                            </button>
                         </div>
                      ))}
                      {(shop.banners?.length || 0) < 5 && (
                         <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors group">
                            <ImageIcon size={20} className="text-slate-300 group-hover:text-purple-500" />
                            <span className="text-[10px] font-black text-slate-400">Add Slide</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                         </label>
                      )}
                   </div>
                   {/* Banner Auto-slide Interval */}
                   <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mt-3">
                     <Clock size={18} className="text-purple-500 shrink-0" />
                     <div className="flex-1">
                       <p className="text-xs font-black text-slate-900">Auto-slide Interval</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Seconds per banner (default: 4s)</p>
                     </div>
                     <input
                       type="number" min="1" max="60"
                       value={shop.bannerInterval || 4}
                       onChange={e => setShop({ ...shop, bannerInterval: parseInt(e.target.value) || 4 })}
                       className="w-20 text-center font-black text-lg bg-white border-2 border-slate-200 rounded-xl py-2 outline-none focus:border-purple-600 text-slate-900"
                     />
                   </div>
                </div>
              </div>
            </Card>

            {/* Service Area Location */}
            <Card title="সার্ভিস এলাকা" subtitle="কোথায় ডেলিভারি করেন তা সেট করুন" icon={MapPin} className="border-l-4 border-l-emerald-500">
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                       <ShieldCheck size={16} className="text-emerald-600" /> স্ট্রিক্ট লোকেশন ম্যাচ (Strict Match)
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">লোকেশনের বাইরে কেউ অর্ডার করতে পারবে না</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isStrictLocation} onChange={e => setIsStrictLocation(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    বাংলাদেশ জিও-ডেটা অনুযায়ী সার্ভিস এলাকা বেছে নিন (বিভাগ {' > '} জেলা {' > '} উপজেলা {' > '} ইউনিয়ন/সিটি)। কাস্টমাররা অর্ডারের সময় এই এলাকার সাথে লোকেশন ম্যাচিং হবে।
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Division */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">বিভাগ</label>
                      <select
                        value={geoSelections.division}
                        onChange={e => setGeoSelections({ ...geoSelections, division: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 appearance-none cursor-pointer"
                      >
                        <option value="">বিভাগ সিলেক্ট করুন</option>
                        {geoData.divisions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* District */}
                    <div className="space-y-1.5 opacity-0 animate-in fade-in slide-in-from-top-1 duration-300 fill-mode-forwards" style={{ opacity: geoSelections.division ? 1 : 0.5 }}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">জেলা</label>
                      <select
                        disabled={!geoSelections.division}
                        value={geoSelections.district}
                        onChange={e => setGeoSelections({ ...geoSelections, district: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                      >
                        <option value="">জেলা সিলেক্ট করুন</option>
                        {geoData.districts.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* Upazila */}
                    <div className="space-y-1.5" style={{ opacity: geoSelections.district ? 1 : 0.5 }}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">উপজেলা</label>
                      <select
                        disabled={!geoSelections.district}
                        value={geoSelections.upazila}
                        onChange={e => setGeoSelections({ ...geoSelections, upazila: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                      >
                        <option value="">উপজেলা সিলেক্ট করুন</option>
                        {geoData.upazilas.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* Union */}
                    <div className="space-y-1.5" style={{ opacity: geoSelections.upazila ? 1 : 0.5 }}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">ইউনিয়ন / সিটি</label>
                      <select
                        disabled={!geoSelections.upazila}
                        value={geoSelections.union}
                        onChange={e => setGeoSelections({ ...geoSelections, union: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-purple-600 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                      >
                        <option value="">ইউনিয়ন সিলেক্ট করুন</option>
                        {geoData.unions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!geoSelections.division || geoLoading}
                    onClick={addGeoArea}
                    className="w-full py-4 bg-slate-900 lg:bg-purple-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {geoLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                    সার্ভিস এরিয়া হিসেবে যোগ করুন
                  </button>
                </div>

                {/* Selected areas */}
                {serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map(area => (
                      <div key={area} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-sm font-black">
                        <MapPin size={12} className="text-emerald-600" />
                        {area}
                        <button type="button" onClick={() => setServiceAreas(serviceAreas.filter(a => a !== area))} className="text-emerald-600 hover:text-red-600 transition-colors ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {serviceAreas.length === 0 && (
                  <p className="text-center text-slate-400 text-xs font-bold py-4 border-2 border-dashed border-slate-100 rounded-xl">কোনো সার্ভিস এলাকা সেট করা হয়নি। সব জায়গায় সার্ভিস দেখানো হবে।</p>
                )}
              </div>
            </Card>

            <Card title="Social Ecosystem" subtitle="Connect Audiences" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <Input label="Facebook" placeholder="Facebook URL" value={socialLinks.fb} onChange={e => setSocialLinks({...socialLinks, fb: e.target.value})} />
                   <Input label="Instagram" placeholder="Instagram URL" value={socialLinks.insta} onChange={e => setSocialLinks({...socialLinks, insta: e.target.value})} />
                   <Input label="YouTube" placeholder="YouTube URL" value={socialLinks.yt} onChange={e => setSocialLinks({...socialLinks, yt: e.target.value})} />
                   <Input label="WhatsApp (Number)" placeholder="e.g. 01700000000" value={socialLinks.wa} onChange={e => setSocialLinks({...socialLinks, wa: e.target.value})} />
                </div>
             </Card>

            <Button
              variant="primary"
              loading={saving}
              icon={Save}
              className="w-full h-16 text-lg tracking-widest font-black uppercase shadow-xl shadow-purple-500/20"
              type="submit"
            >
              Commit Changes Over Network
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
