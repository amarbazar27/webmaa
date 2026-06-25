'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, updateShop, saveUserData, getShopProducts } from '@/lib/firestore';
import { uploadShopLogo, uploadImage } from '@/lib/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Store, Globe, Phone, Text, Save, Image as ImageIcon, ShieldCheck, 
  Info, Link2, AlertTriangle, Check, Sparkles, MessageSquare, Truck, Users, Gift, X,
  MapPin, Clock, Plus, ChevronDown, LayoutTemplate, Sliders, Palette,
  Smartphone, FileText, ExternalLink, HelpCircle, CheckCircle2, Download
} from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';
import DesignThemeSelector from '@/components/dashboard/DesignThemeSelector';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components (SSR-safe)
const TemplateMarketplace = dynamic(() => import('@/components/dashboard/TemplateMarketplace'), { ssr: false, loading: () => <div className="py-12 text-center text-slate-400 text-sm font-bold">টেমপ্লেট লোড হচ্ছে...</div> });
const StoreCustomizationPanel = dynamic(() => import('@/components/dashboard/StoreCustomizationPanel'), { ssr: false, loading: () => <div className="py-12 text-center text-slate-400 text-sm font-bold">কাস্টমাইজার লোড হচ্ছে...</div> });

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

const RANGPUR_WARDS = [
  { id: '1', name: 'ওয়ার্ড ১ (ধাপ, কেরানীপাড়া)', areas: ['ধাপ', 'কেরানীপাড়া'] },
  { id: '2', name: 'ওয়ার্ড ২ (মুন্সিপাড়া, সেনপাড়া)', areas: ['মুন্সিপাড়া', 'সেনপাড়া'] },
  { id: '3', name: 'ওয়ার্ড ৩ (কলেজ রোড, ধাপ রোড)', areas: ['কলেজ রোড', 'ধাপ রোড'] },
  { id: '4', name: 'ওয়ার্ড ৪ (লালকুঠি, স্টেশন রোড)', areas: ['লালকুঠি', 'স্টেশন রোড'] },
  { id: '5', name: 'ওয়ার্ড ৫ (মেডিকেল মোড়, সেন্ট্রাল রোড)', areas: ['মেডিকেল মোড়', 'সেন্ট্রাল রোড'] },
  { id: '6', name: 'ওয়ার্ড ৬ (লালবাগ, নিউ লালবাগ)', areas: ['লালবাগ', 'নিউ লালবাগ'] },
  { id: '7', name: 'ওয়ার্ড ৭ (মাহিগঞ্জ রোড, লালবাগ বাজার)', areas: ['মাহিগঞ্জ রোড', 'লালবাগ বাজার'] },
  { id: '8', name: 'ওয়ার্ড ৮ (আলমনগর আংশিক)', areas: ['আলমনগর'] },
  { id: '9', name: 'ওয়ার্ড ৯ (মাস্টারপাড়া, খলিফাপাড়া)', areas: ['মাস্টারপাড়া', 'খলিফাপাড়া'] },
  { id: '10', name: 'ওয়ার্ড ১০ (পায়রাচত্বর)', areas: ['পায়রাচত্বর'] },
  { id: '11', name: 'ওয়ার্ড ১১ (রাজারহাট)', areas: ['রাজারহাট'] },
  { id: '12', name: 'ওয়ার্ড ১২ (শালবন)', areas: ['শালবন'] },
  { id: '13', name: 'ওয়ার্ড ১৩ (কুঠিবাড়ি)', areas: ['কুঠিবাড়ি'] },
  { id: '14', name: 'ওয়ার্ড ১৪ (মডার্ন মোড়)', areas: ['মডার্ন মোড়'] },
  { id: '15', name: 'ওয়ার্ড ১৫ (আবাসিক এলাকা)', areas: ['আবাসিক এলাকা'] },
  { id: '16', name: 'ওয়ার্ড ১৬ (আলমনগর)', areas: ['আলমনগর'] },
  { id: '17', name: 'ওয়ার্ড ১৭ (জুম্মাপাড়া)', areas: ['জুম্মাপাড়া'] },
  { id: '18', name: 'ওয়ার্ড ১৮ (ইসলামবাগ)', areas: ['ইসলামবাগ'] },
  { id: '19', name: 'ওয়ার্ড ১৯ (মডেল কলোনি)', areas: ['মডেল কলোনি'] },
  { id: '20', name: 'ওয়ার্ড ২০ (স্যাটেলাইট টাউন)', areas: ['স্যাটেলাইট টাউন'] },
  { id: '21', name: 'ওয়ার্ড ২১ (স্যাটেলাইট এক্সটেনশন)', areas: ['স্যাটেলাইট এক্সটেনশন'] },
  { id: '22', name: 'ওয়ার্ড ২২ (ইঞ্জিনিয়ারিং কলেজ)', areas: ['ইঞ্জিনিয়ারিং কলেজ'] },
  { id: '23', name: 'ওয়ার্ড ২৩ (মেডিকেল কলেজ)', areas: ['মেডিকেল কলেজ'] },
  { id: '24', name: 'ওয়ার্ড ২৪ (চৌধুরীপাড়া)', areas: ['চৌধুরীপাড়া'] },
  { id: '25', name: 'ওয়ার্ড ২৫ (তাজহাট)', areas: ['তাজহাট'] },
  { id: '26', name: 'ওয়ার্ড ২৬ (হরিদেবপুর)', areas: ['হরিদেবপুর'] },
  { id: '27', name: 'ওয়ার্ড ২৭ (বাহিরের আবাসিক)', areas: ['বাহিরের আবাসিক'] },
  { id: '28', name: 'ওয়ার্ড ২৮ (নতুন কলোনি)', areas: ['নতুন কলোনি'] },
  { id: '29', name: 'ওয়ার্ড ২৯ (গ্রোথ এরিয়া)', areas: ['গ্রোথ এরিয়া'] },
  { id: '30', name: 'ওয়ার্ড ৩০ (আউটার রিং)', areas: ['আউটার রিং'] },
  { id: '31', name: 'ওয়ার্ড ৩১ (পল্লী এলাকা)', areas: ['পল্লী এলাকা'] },
  { id: '32', name: 'ওয়ার্ড ৩২ (শহরতলী এলাকা)', areas: ['শহরতলী এলাকা'] },
  { id: '33', name: 'ওয়ার্ড ৩৩ (এক্সটেন্ডেড সিটি)', areas: ['এক্সটেন্ডেড সিটি'] }
];

const getCityWards = (district) => {
  if (district === 'রংপুর' || district === 'Rangpur') return RANGPUR_WARDS;
  
  const cityWardsCount = {
    'ঢাকা': 129, 'Dhaka': 129,
    'চট্টগ্রাম': 41, 'Chittagong': 41,
    'রাজশাহী': 30, 'Rajshahi': 30,
    'খুলনা': 31, 'Khulna': 31,
    'বরিশাল': 30, 'Barishal': 30,
    'সিলেট': 42, 'Sylhet': 42,
    'ময়মনসিংহ': 33, 'Mymensingh': 33,
    'কুমিল্লা': 27, 'Comilla': 27,
    'নারায়ণগঞ্জ': 27, 'Narayanganj': 27,
    'গাজীপুর': 57, 'Gazipur': 57
  };
  
  const count = cityWardsCount[district] || 0;
  if (count === 0) return null;
  
  const wards = [];
  for (let i = 1; i <= count; i++) {
    wards.push({ id: `ward_${i}`, name: `ওয়ার্ড ${i}` });
  }
  return wards;
};

export default function SettingsPage() {
  const { user, userData, activeShopId } = useAuth();
  const [shop, setShop] = useState({ 
    shopName: '', 
    slogan: '', 
    notices: '', 
    welcomeMessage: '', 
    bannerDescription: '', 
    subdomainSlug: '', 
    banners: [],
    couponCode: '',
    couponDiscount: 0,
    enableCommonOrder: false,
    enableSmartMeal: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // ── Settings Tab (must be at top, before any conditional returns) ──
  const [settingsTab, setSettingsTab] = useState('general');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [userPhotoFile, setUserPhotoFile] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [showAiKey, setShowAiKey] = useState(false);

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length < 15) return '*'.repeat(key.length);
    return `${key.substring(0, 5)}**********${key.substring(key.length - 5)}`;
  };
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugError, setSlugError] = useState('');
  
  const [staffEmails, setStaffEmails] = useState([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customDomainEditing, setCustomDomainEditing] = useState(false);
  const [domainStatus, setDomainStatus] = useState(''); // '', 'pending_dns', 'connected', 'pending_manual'

  // Complex substates to prevent null referencing
  const [socialLinks, setSocialLinks] = useState({ fb: '', insta: '', yt: '', wa: '', linkedin: '', tiktok: '' });
  const [authSettings, setAuthSettings] = useState({ emailAuth: false, actionPin: '', requireLoginBeforeOrder: true });
  const [promoSettings, setPromoSettings] = useState({ seventhDayFree: false });
  const [deliveryConfig, setDeliveryConfig] = useState({ advanceFee: '', methods: '', isCOD: true, contactEmail: '', minOrderAmount: '', deliveryDays: '', deliveryHours: '', deliveryMinutes: '', requirePaymentScreenshot: false });
  const [aiConfig, setAiConfig] = useState({ apiKey: '', botName: '', botTone: 'funny', enableAiShoppingList: true, smartCalcEnabled: true });
  const [piprapayEnabled, setPiprapayEnabled] = useState(false);
  const [piprapayBkash, setPiprapayBkash] = useState('');
  const [piprapayNagad, setPiprapayNagad] = useState('');
  const [piprapayRocket, setPiprapayRocket] = useState('');
  const [manualPaymentEnabled, setManualPaymentEnabled] = useState(true);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newServiceArea, setNewServiceArea] = useState('');
  const [isStrictLocation, setIsStrictLocation] = useState(false);
  const [requireLocationForOrder, setRequireLocationForOrder] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(true);
  const [disableServiceBanner, setDisableServiceBanner] = useState(false);
  const [customAreas, setCustomAreas] = useState([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [trackingConfig, setTrackingConfig] = useState({ ga4Id: '', clarityId: '' });
  const [loadingMedia, setLoadingMedia] = useState({ type: 'default', imageUrl: '', posters: [], texts: [] });
  const [newLoadingText, setNewLoadingText] = useState('');
  const [shopProducts, setShopProducts] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  
  const [geoData, setGeoData] = useState({ divisions: [], districts: [], upazilas: [], unions: [], unionsType: 'unions' });
  const [geoSelections, setGeoSelections] = useState({ division: '', district: '', upazila: '', upazilaName: '', union: '' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [showAppInstructions, setShowAppInstructions] = useState(false);

  useEffect(() => {
    if (!activeShopId) return;
    getShop(activeShopId).then(data => {
      if (data) {
        const rawBanners = data.banners || [];
        const normalizedBanners = rawBanners.map(b => {
          if (typeof b === 'string') {
            return { url: b, title: '', description: '', linkUrl: '', buttonText: '' };
          }
          return {
            url: b?.url || '',
            title: b?.title || '',
            description: b?.description || '',
            linkUrl: b?.linkUrl || '',
            buttonText: b?.buttonText || ''
          };
        });
        setShop({
          shopName: data.shopName || '',
          slogan: data.slogan || '',
          notices: data.notices || '',
          welcomeMessage: data.welcomeMessage || '',
          subdomainSlug: data.subdomainSlug || '',
          couponCode: data.couponCode || '',
          couponDiscount: data.couponDiscount || 0,
          enableCommonOrder: data.enableCommonOrder || false,
          enableSmartMeal: data.enableSmartMeal || false,
          ...data,
          banners: normalizedBanners
        });
      }
      setLogoPreview(data?.logoUrl || null);
      setUserPhotoPreview(userData?.photoURL || null);
      setSlugInput(data?.subdomainSlug || '');
      setCustomDomainInput(data?.customDomain || '');
      
      setSocialLinks({
        fb: data?.socialLinks?.fb || '', 
        insta: data?.socialLinks?.insta || '', 
        yt: data?.socialLinks?.yt || '',
        wa: data?.socialLinks?.wa || '',
        linkedin: data?.socialLinks?.linkedin || '',
        tiktok: data?.socialLinks?.tiktok || '',
        twitter: data?.socialLinks?.twitter || '',
        telegram: data?.socialLinks?.telegram || '',
        threads: data?.socialLinks?.threads || '',
        pinterest: data?.socialLinks?.pinterest || ''
      });
      setAuthSettings({
        emailAuth: data?.authSettings?.emailAuth || false, 
        actionPin: data?.authSettings?.actionPin || '',
        requireLoginBeforeOrder: data?.authSettings?.requireLoginBeforeOrder ?? true
      });
      setPromoSettings({
        seventhDayFree: data?.promoSettings?.seventhDayFree || false
      });
      setDeliveryConfig({ 
        advanceFee: data?.deliveryConfig?.advanceFee || '', 
        methods: data?.deliveryConfig?.methods || '', 
        isCOD: data?.deliveryConfig?.isCOD ?? true,
        contactEmail: data?.deliveryConfig?.contactEmail || '',
        contactWhatsapp: data?.deliveryConfig?.contactWhatsapp || '',
        minOrderAmount: data?.deliveryConfig?.minOrderAmount || '',
        deliveryDays: data?.deliveryConfig?.deliveryDays ?? '',
        deliveryHours: data?.deliveryConfig?.deliveryHours ?? '',
        deliveryMinutes: data?.deliveryConfig?.deliveryMinutes ?? '',
        requirePaymentScreenshot: data?.deliveryConfig?.requirePaymentScreenshot ?? false
      });
      setAiConfig({
        apiKey: data?.aiConfig?.apiKey || '',
        botName: data?.aiConfig?.botName || '',
        botTone: data?.aiConfig?.botTone || 'funny',
        enableAiShoppingList: data?.aiConfig?.enableAiShoppingList !== false,
        smartCalcEnabled: data?.aiConfig?.smartCalcEnabled || false
      });
      setStaffEmails(data?.staffEmails || []);
      setAdminEmails(data?.adminEmails || []);
      setServiceAreas(data?.serviceAreas || []);
      setIsStrictLocation(data?.isStrictLocation || false);
      setRequireLocationForOrder(data?.requireLocationForOrder !== false);
      setShowLocationSelector(data?.showLocationSelector !== false);
      setDisableServiceBanner(data?.disableServiceBanner || false);
      setCustomAreas(data?.customAreas || []);
      setTrackingConfig({
        ga4Id: data?.trackingConfig?.ga4Id || '',
        clarityId: data?.trackingConfig?.clarityId || ''
      });
      setLoadingMedia({
        type: data?.loadingMedia?.type || 'default',
        imageUrl: data?.loadingMedia?.imageUrl || '',
        posters: data?.loadingMedia?.posters || (data?.loadingMedia?.imageUrl ? [data.loadingMedia.imageUrl] : []),
        texts: data?.loadingMedia?.texts || []
      });
      setFeaturedProductIds(data?.featuredProductIds || []);
      
      // Load products for featured selection
      getShopProducts(activeShopId).then(prods => {
        setShopProducts(prods || []);
      }).catch(err => console.error("Error loading products for settings:", err));

      setFaqItems(data?.faqItems || []);
      setDomainStatus(data?.domainStatus || '');
      
      setPiprapayEnabled(data?.piprapayEnabled || false);
      setPiprapayBkash(data?.piprapayBkash || '');
      setPiprapayNagad(data?.piprapayNagad || '');
      setPiprapayRocket(data?.piprapayRocket || '');
      setManualPaymentEnabled(data?.manualPaymentEnabled !== false);
      setLoading(false);
    });
  }, [user, activeShopId]);

  // ── Geo: load divisions once ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/geo?type=divisions').then(r => r.json()).then(data => {
      setGeoData(prev => ({ ...prev, divisions: Array.isArray(data) ? data : [] }));
    });
  }, []);

  // ── Geo: load districts when division changes ────────────────────────────
  useEffect(() => {
    if (!geoSelections.division) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=districts&division_id=${geoSelections.division}`)
      .then(r => r.json()).then(data => {
        setGeoData(prev => ({ ...prev, districts: Array.isArray(data) ? data : [], upazilas: [], unions: [], unionsType: 'unions' }));
        setGeoSelections(prev => ({ ...prev, district: '', upazila: '', upazilaName: '', union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.division]);

  // ── Geo: load upazilas when district changes ─────────────────────────────
  useEffect(() => {
    if (!geoSelections.district) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=upazilas&district_id=${geoSelections.district}`)
      .then(r => r.json()).then(data => {
        setGeoData(prev => ({ ...prev, upazilas: Array.isArray(data) ? data : [], unions: [], unionsType: 'unions' }));
        setGeoSelections(prev => ({ ...prev, upazila: '', upazilaName: '', union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.district]);

  // ── Geo: load unions OR wards based on upazila type ──────────────────────
  useEffect(() => {
    if (!geoSelections.upazila) return;
    setGeoLoading(true);
    const params = new URLSearchParams({
      type: 'unions',
      upazila_id: geoSelections.upazila,
      upazila_name: geoSelections.upazilaName || '',
    });
    fetch(`/api/geo?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        // New API returns { data: [...], type: 'wards'|'unions' }
        const items = Array.isArray(res) ? res : (res.data || []);
        const resType = res.type || 'unions';
        setGeoData(prev => ({ ...prev, unions: items, unionsType: resType }));
        setGeoSelections(prev => ({ ...prev, union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.upazila]);

  const addGeoArea = () => {
    const { division, district, upazila, upazilaName, union } = geoSelections;
    if (!division) return;
    
    const divName = geoData.divisions.find(d => d.id === division)?.bn_name;
    const distName = geoData.districts.find(d => d.id === district)?.bn_name;
    const upaName = upazilaName || geoData.upazilas.find(d => d.id === upazila)?.bn_name;
    const uniItem = geoData.unions.find(d => d.id === union);
    const uniName = uniItem?.bn_name || uniItem?.name;
    
    const parts = [divName, distName, upaName, uniName].filter(Boolean);
    const areaString = parts.join(' > ');
    
    if (areaString && !serviceAreas.includes(areaString)) {
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

  const handleUserPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPhotoFile(file);
      setUserPhotoPreview(URL.createObjectURL(file));
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

  const handleCustomDomainSave = async () => {
    const rawInput = customDomainInput.trim();
    if (!rawInput) { toast.error('Custom domain cannot be empty.'); return; }
    const cleanDomain = rawInput.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Basic format check
    if (!/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z]{2,})+$/.test(cleanDomain)) {
      toast.error('Invalid domain. Example: rahimshop.com');
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const vercelRes = await fetch('/api/domain', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain: cleanDomain, shopId: user.uid })
      });
      const vercelData = await vercelRes.json();

      if (!vercelRes.ok) {
        // 409 = duplicate domain
        toast.error(vercelData.error || 'Could not register domain.');
        setSaving(false);
        return;
      }

      const newStatus = vercelData.status || 'pending_dns';
      await updateShop(user.uid, { customDomain: cleanDomain, domainStatus: newStatus });
      setShop(s => ({ ...s, customDomain: cleanDomain, domainStatus: newStatus }));
      setDomainStatus(newStatus);
      setCustomDomainEditing(false);

      if (newStatus === 'pending_manual') {
        toast('Domain saved. Add the domain manually in Vercel dashboard.', { icon: '⚠️' });
      } else {
        toast.success('Domain registered! Now configure DNS below.');
      }
    } catch (err) {
      toast.error('Failed to save custom domain.');
    } finally {
      setSaving(false);
    }
  };

  // Poll Vercel every 30s to see if custom domain DNS has been verified
  useEffect(() => {
    if (!shop?.customDomain || domainStatus === 'connected') return;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/domain?domain=${encodeURIComponent(shop.customDomain)}`);
        const data = await res.json();
        if (data.status === 'connected') {
          setDomainStatus('connected');
          await updateShop(user.uid, { domainStatus: 'connected' });
          setShop(s => ({ ...s, domainStatus: 'connected' }));
          toast.success(`✅ ${shop.customDomain} is now live!`);
        }
      } catch (e) { /* silent */ }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.customDomain, domainStatus]);

  const cropTo169 = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const targetAspectRatio = 16 / 9;
        const currentAspectRatio = img.width / img.height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (currentAspectRatio > targetAspectRatio) {
          sourceWidth = img.height * targetAspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else if (currentAspectRatio < targetAspectRatio) {
          sourceHeight = img.width / targetAspectRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        canvas.width = 1600;
        canvas.height = 900;

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, 1600, 900
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const croppedFile = new File([blob], file.name || 'banner.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => {
        resolve(file);
      };
    });
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
    
    setSaving(true);
    try {
      const croppedFile = await cropTo169(file);
      const { uploadImage } = await import('@/lib/storage');
      const url = await uploadImage(croppedFile);
      const newBannerObj = { url, title: '', description: '', linkUrl: '', buttonText: '' };
      const newBanners = [...(shop.banners || []), newBannerObj];
      await updateShop(activeShopId, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('ব্যানার আপলোড সফল হয়েছে (১৬:৯ মাপে ক্রপ করা হয়েছে)! 🖼️');
    } catch (err) {
      toast.error(err.message || 'ব্যানার আপলোড ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const replaceBanner = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ব্যানার সাইজ ৫ মেগাবাইটের বেশি হওয়া যাবে না।');
      return;
    }
    setSaving(true);
    try {
      const croppedFile = await cropTo169(file);
      const { uploadImage } = await import('@/lib/storage');
      const url = await uploadImage(croppedFile);
      const newBanners = [...(shop.banners || [])];
      const existing = newBanners[index];
      if (typeof existing === 'string') {
        newBanners[index] = { url, title: '', description: '', linkUrl: '', buttonText: '' };
      } else {
        newBanners[index] = { ...existing, url };
      }
      await updateShop(activeShopId, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('ব্যানার পরিবর্তন সফল হয়েছে (১৬:৯ মাপে ক্রপ করা হয়েছে)! 🔄');
    } catch (err) {
      toast.error(err.message || 'ব্যানার পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (index) => {
    const newBanners = shop.banners.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await updateShop(activeShopId, { banners: newBanners });
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
        logoUrl = await uploadShopLogo(activeShopId, logoFile);
      }

      if (userPhotoFile) {
        const uploadedUrl = await uploadImage(userPhotoFile);
        await saveUserData(user.uid, { photoURL: uploadedUrl });
        toast.success('Profile photo updated!');
      }
      
      await updateShop(activeShopId, { 
        shopName: shop.shopName,
        couponCode: shop.couponCode || '',
        couponDiscount: Number(shop.couponDiscount) || 0,
        enableCommonOrder: shop.enableCommonOrder || false,
        enableSmartMeal: shop.enableSmartMeal || false,
        piprapayEnabled, // Save public flag for UI checks
        piprapayBkash,
        piprapayNagad,
        piprapayRocket,
        manualPaymentEnabled,
        slogan: shop.slogan,
        notices: shop.notices,
        welcomeMessage: shop.welcomeMessage,
        bannerDescription: shop.bannerDescription || '',
        bannerInterval: shop.bannerInterval || 4,
        howToOrderVideo: shop.howToOrderVideo || '',
        logoUrl,
        socialLinks,
        authSettings,
        promoSettings,
        deliveryConfig,
        aiConfig,
        staffEmails,
        adminEmails,
        serviceAreas,
        isStrictLocation,
        requireLocationForOrder,
        showLocationSelector,
        disableServiceBanner,
        customAreas,
        trackingConfig,
        loadingMedia,
        featuredProductIds,
        faqItems,
        banners: shop.banners || []
      });
      if (shop.subdomainSlug) {
        fetch(`/api/revalidate?slug=${shop.subdomainSlug}&domain=${shop.customDomain || ''}`).catch(e => console.error(e));
      }
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

  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://daripallah.com'}/shop/${shop?.subdomainSlug}`;

  // ── Tabs config (plain object, NOT state — safe to define here) ──
  const SETTINGS_TABS = [
    { id: 'general', label: 'সাধারণ', icon: Store },
    { id: 'templates', label: 'টেমপ্লেট', icon: LayoutTemplate },
    { id: 'customizer', label: 'কাস্টমাইজার', icon: Sliders },
    { id: 'theme', label: 'থিম', icon: Palette },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">স্টোর কাস্টমাইজার</h1>
          <p className="text-sm text-slate-500 font-medium">টেমপ্লেট, থিম, AI এবং সব সেটিং এক জায়গায়।</p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black transition-all border-b-2 ${
              settingsTab === tab.id
                ? 'border-purple-600 text-purple-700 bg-purple-50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── Template Marketplace Tab ── */}
      {settingsTab === 'templates' && (
        <TemplateMarketplace
          shopId={activeShopId}
          shopSlug={shop?.subdomainSlug}
          shopDomain={shop?.customDomain}
          activeTemplateId={shop?.templateId || 'modern-commerce'}
          onTemplateApplied={(tid) => setShop(s => ({ ...s, templateId: tid }))}
        />
      )}

      {/* ── Customization Panel Tab ── */}
      {settingsTab === 'customizer' && (
        <div className="max-w-2xl">
          <StoreCustomizationPanel
            shopId={activeShopId}
            shopSlug={shop?.subdomainSlug}
            shopDomain={shop?.customDomain}
            templateId={shop?.templateId || 'modern-commerce'}
            currentOverrides={shop?.themeOverrides || {}}
            onSave={({ theme }) => setShop(s => ({ ...s, themeOverrides: theme }))}
          />
        </div>
      )}

      {/* ── Theme Tab (existing DesignThemeSelector) ── */}
      {settingsTab === 'theme' && (
        <div className="max-w-4xl">
          <Card title="স্টোর ডিজাইন থিম" subtitle="রঙ প্রিসেট" icon={Palette} className="border-l-4 border-l-purple-500">
            <DesignThemeSelector shopId={activeShopId} />
          </Card>
        </div>
      )}

      {/* ── General Settings Tab ── */}
      {settingsTab === 'general' && (<>
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

            {/* Custom Domain Management UI */}
            <div>
              <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Globe size={14}/> Custom Domain Mapping (Pro)</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Connect your own .com / .shop domain</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-inner relative">
                {customDomainEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. rahimshop.com"
                      value={customDomainInput}
                      onChange={e => setCustomDomainInput(e.target.value.toLowerCase())}
                      className="w-full bg-white border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-emerald-600 transition-all text-slate-900"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleCustomDomainSave} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Save Domain</button>
                       <button onClick={() => setCustomDomainEditing(false)} className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 active:scale-95 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shop?.customDomain ? (
                      <div className="space-y-3">
                        {/* Domain + Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={`https://${shop.customDomain}`} target="_blank" rel="noreferrer" className="text-sm font-black text-emerald-700 hover:text-emerald-800 underline truncate tracking-tight">
                            {shop.customDomain}
                          </a>
                          {/* Status Badge */}
                          {domainStatus === 'connected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                            </span>
                          )}
                          {(domainStatus === 'pending_dns' || domainStatus === '') && shop?.customDomain && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pending DNS
                            </span>
                          )}
                          {domainStatus === 'pending_manual' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Manual Required
                            </span>
                          )}
                        </div>

                        {/* DNS Instructions — only show when not yet connected */}
                        {domainStatus !== 'connected' && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs">
                            <p className="font-bold text-slate-800 mb-2">DNS Instructions (Add in your Domain Panel):</p>
                            <div className="space-y-2 font-mono text-[10px]">
                              <div className="flex justify-between bg-slate-50 p-2 rounded">
                                 <span className="text-slate-500 font-bold">Type: A</span>
                                 <span className="text-slate-500 font-bold">Name: @</span>
                                 <span className="text-emerald-700 font-black select-all">76.76.21.21</span>
                              </div>
                              <div className="flex justify-between bg-slate-50 p-2 rounded">
                                 <span className="text-slate-500 font-bold">Type: CNAME</span>
                                 <span className="text-slate-500 font-bold">Name: www</span>
                                 <span className="text-emerald-700 font-black select-all">cname.vercel-dns.com</span>
                              </div>
                            </div>
                            <p className="text-[9px] text-amber-600 font-bold mt-2">
                              ⏱ DNS changes take 10–30 minutes. This page auto-checks every 30 seconds.
                            </p>
                          </div>
                        )}
                        {domainStatus === 'connected' && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] font-bold text-emerald-700">
                            ✅ Your custom domain is live with SSL! Customers can now access your store via <span className="underline">{shop.customDomain}</span>.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400">No custom domain linked. Connect your own .com or .shop domain below.</p>
                    )}
                    <button onClick={() => setCustomDomainEditing(true)} className="mt-1 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                       {shop?.customDomain ? 'Change Domain' : 'Connect Custom Domain'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 📱 Android App Integration Card */}
          <Card title="Android App Integration" subtitle="অ্যান্ড্রয়েড মোবাইল অ্যাপ" icon={Smartphone} className="border-2 border-purple-100 bg-purple-50/5">
            <div className="space-y-4 text-xs font-medium text-slate-700">
              <p className="leading-relaxed">
                আপনার ই-কমার্স স্টোরের জন্য গুগল প্লে স্টোর রেডি অ্যান্ড্রয়েড অ্যাপ্লিকেশন (APK & AAB ফাইল)।
              </p>

              {shop?.appBuildStatus === 'completed' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={13} /> অ্যাপ ফাইল প্রস্তুত!
                    </p>
                    <p className="text-[10px] text-emerald-600 leading-relaxed">
                      সুপার এডমিন আপনার স্টোরের জন্য অ্যান্ড্রয়েড অ্যাপ জেনারেট করেছেন।
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono text-[10px] space-y-1">
                    <p className="font-sans text-[10px] font-black text-slate-400 uppercase">Package Name</p>
                    <p className="font-bold text-slate-700 truncate">{shop.appBuildPackageName}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {shop.appBuildApkUrl && (
                      <a 
                        href={shop.appBuildApkUrl} 
                        download
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-center flex items-center justify-center gap-2 hover:bg-black transition-all"
                      >
                        <Download size={14} /> Download APK (Direct Install)
                      </a>
                    )}
                    {shop.appBuildAabUrl && (
                      <a 
                        href={shop.appBuildAabUrl} 
                        download
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-black text-center flex items-center justify-center gap-2 hover:bg-purple-700 shadow-md shadow-purple-500/10 transition-all"
                      >
                        <Smartphone size={14} /> Download AAB (Play Store Bundle)
                      </a>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowAppInstructions(true)}
                    className="w-full py-2 bg-white text-purple-700 border border-purple-200 rounded-xl font-bold text-center flex items-center justify-center gap-1.5 hover:bg-purple-50 transition-all"
                  >
                    <FileText size={13} /> Play Store Upload Checklist
                  </button>
                </div>
              ) : shop?.appBuildStatus === 'building' ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <div>
                    <p className="font-bold text-purple-900">অ্যাপ ফাইল জেনারেট হচ্ছে...</p>
                    <p className="text-[10px] text-purple-700 mt-0.5">সুপার এডমিন আপনার অ্যাপ প্রসেস করছেন। এটি শেষ হলে ডাউনলোড বাটন সক্রিয় হবে।</p>
                  </div>
                </div>
              ) : shop?.appBuildStatus === 'failed' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-red-900">অ্যাপ জেনারেশন ব্যর্থ হয়েছে</p>
                    <p className="text-[10px] text-red-700 mt-0.5 leading-relaxed">
                      বিল্ড করতে সমস্যা হয়েছে। দয়া করে সুপার এডমিনের সাথে যোগাযোগ করুন।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <HelpCircle className="text-slate-400 mx-auto mb-2" size={24} />
                  <p className="font-bold text-slate-800">অ্যাপ জেনারেট করা হয়নি</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    আপনার স্টোরের মোবাইল অ্যাপ সংস্করণটি তৈরি করার জন্য অনুগ্রহ করে সুপার এডমিনের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              )}
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

          <Card title="Account Profile" subtitle="Your Identity" icon={Users} className="shadow-sm border-l-4 border-l-purple-500">
            <div className="flex flex-col items-center">
              <div className="relative group w-24 h-24 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center">
                  {userPhotoPreview ? (
                    <img src={userPhotoPreview} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-2xl font-black text-purple-600 uppercase">{userData?.name?.[0] || 'U'}</div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-purple-700 transition-all border-2 border-white">
                  <ImageIcon size={14} />
                  <input type="file" accept="image/*" onChange={handleUserPhotoChange} className="hidden" />
                </label>
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 text-sm">{userData?.name || 'Retailer'}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{userData?.role}</p>
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
             <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-xs font-black text-slate-900">Email & Password Auth</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Allow custom registration</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={authSettings.emailAuth} onChange={e => setAuthSettings({...authSettings, emailAuth: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
               </div>
               
               <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div>
                     <p className="text-xs font-black text-slate-900 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google Login Auth</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">1-tap login without password</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={authSettings.googleAuth !== false} onChange={e => setAuthSettings({...authSettings, googleAuth: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
               </div>
               
               <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div>
                     <p className="text-xs font-black text-slate-900">Require Login Before Order</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Only logged in users can order</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={authSettings.requireLoginBeforeOrder} onChange={e => setAuthSettings({...authSettings, requireLoginBeforeOrder: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
               </div>
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
                     <div className="flex-1">
                        <Input 
                          placeholder="staff1@gmail.com, staff2@gmail.com" 
                          type="text"
                          value={newStaffEmail}
                          onChange={e => setNewStaffEmail(e.target.value)}
                          className="w-full"
                        />
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">কমা (,) দিয়ে একাধিক ইমেইল একসাথে যোগ করতে পারেন।</span>
                     </div>
                     <Button type="button" onClick={() => {
                        if (newStaffEmail) {
                           const parsed = newStaffEmail.split(',').map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
                           const updated = [...staffEmails];
                           parsed.forEach(email => {
                              if (!updated.includes(email)) updated.push(email);
                           });
                           setStaffEmails(updated);
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
            
            <Card title="Admin Management" subtitle="Full Dashboard Access" icon={Users} className="border-l-4 border-l-purple-500">
               <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    Add email addresses of users who will be Administrators. Admins will have the exact same dashboard capabilities as the owner.
                  </p>
                  
                  <div className="flex gap-2">
                     <div className="flex-1">
                        <Input 
                          placeholder="admin1@gmail.com, admin2@gmail.com" 
                          type="text"
                          value={newAdminEmail}
                          onChange={e => setNewAdminEmail(e.target.value)}
                          className="w-full"
                        />
                        <span className="text-[10px] font-black text-slate-400 mt-1 block">কমা (,) দিয়ে একাধিক ইমেইল একসাথে যোগ করতে পারেন।</span>
                     </div>
                     <Button type="button" onClick={() => {
                        if (newAdminEmail) {
                           const parsed = newAdminEmail.split(',').map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
                           const updated = [...adminEmails];
                           parsed.forEach(email => {
                              if (!updated.includes(email)) updated.push(email);
                           });
                           setAdminEmails(updated);
                           setNewAdminEmail('');
                        }
                     }} className="h-[52px]">Add Admin</Button>
                  </div>
                  
                  {adminEmails.length > 0 && (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {adminEmails.map(email => (
                           <div key={email} className="flex justify-between items-center p-3 px-4 text-sm font-bold text-slate-800">
                              {email}
                              <button type="button" onClick={() => setAdminEmails(adminEmails.filter(e => e !== email))} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded">Remove</button>
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

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                 <div>
                    <p className="text-xs font-black text-slate-900">ম্যানুয়াল পেমেন্ট পদ্ধতি চালু রাখুন (Enable Manual Payment)</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">কাস্টমাররা ট্রানজেকশন আইডি এবং স্ক্রিনশট দিয়ে ম্যানুয়ালি অর্ডার করতে পারবে</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={manualPaymentEnabled} onChange={e => setManualPaymentEnabled(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                 </label>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                 <div>
                    <p className="text-xs font-black text-slate-900">পেমেন্ট স্ক্রিনশট আপলোড আবশ্যক (Require Screenshot)</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">গ্রাহকদের পেমেন্ট প্রমাণ হিসেবে স্ক্রিনশট আপলোড করতে হবে</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={deliveryConfig.requirePaymentScreenshot || false} onChange={e => setDeliveryConfig({...deliveryConfig, requirePaymentScreenshot: e.target.checked})} />
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
                 <div className="flex flex-col">
                    <Input
                      label="📧 Ruflo Alert Email (New Orders)"
                      type="text"
                      value={deliveryConfig.contactEmail || ''}
                      onChange={e => setDeliveryConfig({...deliveryConfig, contactEmail: e.target.value})}
                      placeholder="your@gmail.com, staff@gmail.com"
                    />
                    <span className="text-[10px] font-black text-slate-400 mt-1 block">কমা (,) দিয়ে একাধিক ইমেইল একসাথে যোগ করতে পারেন।</span>
                 </div>
                 <Input
                   label="Minimum Order Amount (৳)"
                   type="number"
                   value={deliveryConfig.minOrderAmount}
                   onChange={e => setDeliveryConfig({...deliveryConfig, minOrderAmount: e.target.value})}
                   placeholder="0 = no limit"
                 />
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Delivery Time (Live Countdown)</label>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" placeholder="দিন" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={deliveryConfig.deliveryDays ?? ''} onChange={e => setDeliveryConfig({...deliveryConfig, deliveryDays: e.target.value})} />
                       <input type="number" placeholder="ঘণ্টা" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={deliveryConfig.deliveryHours ?? ''} onChange={e => setDeliveryConfig({...deliveryConfig, deliveryHours: e.target.value})} />
                       <input type="number" placeholder="মিনিট" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={deliveryConfig.deliveryMinutes ?? ''} onChange={e => setDeliveryConfig({...deliveryConfig, deliveryMinutes: e.target.value})} />
                    </div>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                 {deliveryConfig.isCOD 
                   ? "If advance fee is set, customers must provide a Transaction ID to clear the advance fee before ordering. The rest will be Cash on Delivery."
                   : "Cash on delivery is disabled. Customers must pay the Total Value + Delivery Fee entirely before placing the order."
                 }
              </p>
            </Card>

            <Card title="PipraPay Automated Payment (পিপরাপেই অটো পেমেন্ট)" subtitle="bKash/Nagad/Rocket API Integration" icon={Smartphone} className="border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                 <div>
                    <p className="text-xs font-black text-slate-900">অটোমেটেড পেমেন্ট গেটওয়ে চালু করুন (Enable PipraPay)</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">গ্রাহকরা সরাসরি বিকাশ, নগদ, রকেটে অটো পেমেন্ট করতে পারবে</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={piprapayEnabled} onChange={e => setPiprapayEnabled(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                 </label>
              </div>

              {piprapayEnabled && (
                <div className="space-y-6 border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Input
                       label="বিকাশ পার্সোনাল নম্বর"
                       value={piprapayBkash}
                       onChange={e => setPiprapayBkash(e.target.value.replace(/\D/g, '').slice(0, 11))}
                       placeholder="017XXXXXXXX"
                     />
                     <Input
                       label="নগদ পার্সোনাল নম্বর"
                       value={piprapayNagad}
                       onChange={e => setPiprapayNagad(e.target.value.replace(/\D/g, '').slice(0, 11))}
                       placeholder="017XXXXXXXX"
                     />
                     <Input
                       label="রকেট পার্সোনাল নম্বর"
                       value={piprapayRocket}
                       onChange={e => setPiprapayRocket(e.target.value.replace(/\D/g, '').slice(0, 12))}
                       placeholder="017XXXXXXXXX"
                     />
                  </div>

                  <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 space-y-4">
                     <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                       📱 PipraPay Companion App Setup Guide
                     </h3>
                     <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                       স্বয়ংক্রিয় পেমেন্ট ভেরিফিকেশনের জন্য আপনার ফোনে <strong>Enterprise Companion (PipraPay)</strong> অ্যাপটি ইনস্টল করে সার্ভারের সাথে সংযুক্ত করতে হবে:
                     </p>
                     
                     <div className="space-y-3 pl-1 text-[11px] text-slate-600 font-medium">
                       <div className="flex gap-2">
                         <span className="text-purple-600 font-bold">১.</span>
                         <p>
                           আপনার ব্যবহৃত অ্যান্ড্রোয়েড ফোনে আপনার বিকাশ/নগদ/রকেট সিম কার্ডটি সচল রাখুন।
                         </p>
                       </div>
                       <div className="flex gap-2">
                         <span className="text-purple-600 font-bold">২.</span>
                         <p>
                           Google Play Store-এ <strong>"Enterprise Companion"</strong> লিখে সার্চ করুন অথবা সরাসরি এই লিংকের মাধ্যমে <a href="https://play.google.com/store/apps/details?id=com.qubeplug.billpax_tools&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline font-bold hover:text-purple-900">Enterprise Companion App ডাউনলোড করুন</a>।
                         </p>
                       </div>
                       <div className="flex gap-2">
                          <span className="text-purple-600 font-bold">৩.</span>
                          <p>
                            অ্যাপটি ওপেন করে ডানদিকের সেটিংস আইকনে ক্লিক করুন। সেখানে একটি মাত্র কনফিগারেশন ইনপুট ফিল্ড (<strong>"Enter Webhook URL"</strong>) দেখতে পাবেন।
                          </p>
                        </div>
                       <div className="flex gap-2">
                          <span className="text-purple-600 font-bold">৪.</span>
                          <p>
                            আপনার PipraPay প্যানেল থেকে সম্পূর্ণ Webhook URL টি কপি করে এই বক্সে পেস্ট করুন।
                             <br />
                             <span className="text-[10px] text-slate-400 block mt-1">
                               (Webhook URL পেতে: PipraPay এডমিন প্যানেলে লগইন করুন &rarr; ডানপাশের <strong>Connect Android App</strong> এ ক্লিক করুন &rarr; সম্পূর্ণ <strong>Webhook URL</strong> যেমন <code className="bg-slate-100 px-1 text-slate-700 rounded font-mono font-normal">https://piprapay-server-1.onrender.com/?webhook=YOUR_KEY</code> কপি করে অ্যাপের বক্সে পেস্ট করে Save করুন। সরাসরি QR কোড স্ক্যান না করে এই উপায়ে ম্যানুয়ালি পেস্ট করা সবচেয়ে নিরাপদ। <strong>গুরুত্বপূর্ণ:</strong> অ্যাপের ভেতর URL টি পেস্ট করার সময় অবশ্যই শেষে একটি স্ল্যাশ <code>/</code> দিতে হবে (যেমন: <code>https://piprapay-server-1.onrender.com/api/</code> অথবা <code>https://piprapay-server-1.onrender.com/api/?webhook=...</code>), নাহলে কানেক্ট করার সময় "Network Error" দেখাবে।)
                             </span>
                          </p>
                        </div>
                       <div className="flex gap-2">
                         <span className="text-purple-600 font-bold">৫.</span>
                         <p>
                           অ্যাপটিকে <strong>Read SMS & Receive SMS</strong> পারমিশন দিন এবং ফোনের <strong>Battery Optimization</strong> বন্ধ করুন (যাতে ব্যাকগ্রাউন্ডে অ্যাপটি সচল থাকে)।
                         </p>
                       </div>
                     </div>
                  </div>
                 </div>
               )}
            </Card>

            <Card title="Coupon & Bulk Order Settings (কুপন ও বাল্ক অর্ডার সেটিং)" subtitle="Discount coupon and Common Order Sheet" icon={Gift} className="border-l-4 border-l-emerald-500">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Promo Coupon Code (কুপন কোড)"
                    value={shop.couponCode || ''}
                    onChange={e => setShop({ ...shop, couponCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. EID2026"
                  />
                  <Input
                    label="Discount Percentage (ডিসকাউন্ট %)"
                    type="number"
                    value={shop.couponDiscount || 0}
                    onChange={e => setShop({ ...shop, couponDiscount: Number(e.target.value) })}
                    placeholder="e.g. 10"
                    min={0}
                    max={100}
                  />
                </div>
                
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div>
                      <p className="text-xs font-black text-slate-900">Enable Common Order Sheet (কমন অর্ডার শিট চালু করুন)</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">If enabled, user site will show a clickable bulk spreadsheet order button</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={shop.enableCommonOrder || false} onChange={e => setShop({...shop, enableCommonOrder: e.target.checked})} />
                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                   <div>
                      <p className="text-xs font-black text-slate-900">Enable Smart Meal Planner (স্মার্ট মিল প্ল্যানার চালু করুন)</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">If enabled, user site will show the AI Smart Meal Planner component at the top</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={shop.enableSmartMeal || false} onChange={e => setShop({...shop, enableSmartMeal: e.target.checked})} />
                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                </div>
              </div>
            </Card>

            <Card title="Store AI Companion" subtitle="Smart Assistant" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                     <Input
                       label="LLM API Key (Gemini/OpenAI)"
                       type={showAiKey ? "text" : "text"}
                       value={showAiKey ? aiConfig.apiKey : maskKey(aiConfig.apiKey)}
                       onChange={e => {
                         // Only allow change if showing key or it's empty, otherwise they might edit the masked version
                         if (showAiKey || !aiConfig.apiKey) {
                           setAiConfig({...aiConfig, apiKey: e.target.value});
                         }
                       }}
                       onFocus={() => setShowAiKey(true)}
                       onBlur={() => setShowAiKey(false)}
                       placeholder="Enter your private API key"
                     />
                     <button
                       type="button"
                       onClick={() => setShowAiKey(!showAiKey)}
                       className="absolute right-4 top-10 text-xs font-bold text-purple-600 hover:text-purple-800"
                     >
                       {showAiKey ? 'Hide' : 'Show'}
                     </button>
                  </div>
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
                  label="Banner Description (ব্যানারের নিচে বিবরণ)"
                  value={shop.bannerDescription || ''}
                  onChange={e => setShop({ ...shop, bannerDescription: e.target.value })}
                  placeholder="স্টোরের সংক্ষিপ্ত বিবরণ যা ব্যানারের নিচে সুন্দর একটি বক্সে দেখাবে..."
                  rows={3}
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
                <Input
                  label="How to Order Video URL (YouTube)"
                  value={shop.howToOrderVideo || ''}
                  onChange={e => setShop({ ...shop, howToOrderVideo: e.target.value })}
                  placeholder="e.g. https://youtube.com/watch?v=..."
                />

                 <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Banners (Max 5, 5MB each)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {shop.banners?.map((banner, i) => {
                          const bannerUrl = typeof banner === 'string' ? banner : (banner?.url || '');
                          const bannerTitle = typeof banner === 'string' ? '' : (banner?.title || '');
                          const bannerDesc = typeof banner === 'string' ? '' : (banner?.description || '');
                          const bannerLink = typeof banner === 'string' ? '' : (banner?.linkUrl || '');
                          const bannerBtn = typeof banner === 'string' ? '' : (banner?.buttonText || '');
                          
                          return (
                             <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4 shadow-sm hover:shadow-md transition-all">
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                                   <img src={bannerUrl} className="w-full h-full object-cover" alt="" />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                     {/* Replace Banner */}
                                     <label className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-purple-100 transition-colors shadow-lg">
                                       🔄 পরিবর্তন
                                       <input type="file" accept="image/*" className="hidden" onChange={(e) => replaceBanner(e, i)} />
                                     </label>
                                     {/* Delete Banner */}
                                     <button 
                                       type="button" 
                                       onClick={() => removeBanner(i)}
                                       className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors shadow-lg"
                                     >
                                       ✕ মুছুন
                                     </button>
                                   </div>
                                   <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-md">{i+1}/{shop.banners.length}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                   <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Title (টাইটেল)</label>
                                      <input 
                                         type="text" 
                                         placeholder="উদা: ঈদের বিশেষ অফার!" 
                                         value={bannerTitle}
                                         onChange={(e) => {
                                            const updated = [...shop.banners];
                                            updated[i] = { ...updated[i], title: e.target.value };
                                            setShop({ ...shop, banners: updated });
                                         }}
                                         className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-slate-900"
                                      />
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Button Text (বাটন টেক্সট)</label>
                                      <input 
                                         type="text" 
                                         placeholder="উদা: কেনাকাটা করুন" 
                                         value={bannerBtn}
                                         onChange={(e) => {
                                            const updated = [...shop.banners];
                                            updated[i] = { ...updated[i], buttonText: e.target.value };
                                            setShop({ ...shop, banners: updated });
                                         }}
                                         className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-slate-900"
                                      />
                                   </div>
                                   <div className="space-y-1 sm:col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Redirect Link / Action URL</label>
                                      <input 
                                         type="text" 
                                         placeholder="উদা: https://messerbazar.com/category/সবজি অথবা #marketplace" 
                                         value={bannerLink}
                                         onChange={(e) => {
                                            const updated = [...shop.banners];
                                            updated[i] = { ...updated[i], linkUrl: e.target.value };
                                            setShop({ ...shop, banners: updated });
                                         }}
                                         className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-slate-900"
                                      />
                                   </div>
                                   <div className="space-y-1 sm:col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Description (সংক্ষিপ্ত বিবরণ)</label>
                                      <textarea 
                                         rows={2}
                                         placeholder="উদা: সব পণ্যে ২০% পর্যন্ত বিশাল ছাড়!" 
                                         value={bannerDesc}
                                         onChange={(e) => {
                                            const updated = [...shop.banners];
                                            updated[i] = { ...updated[i], description: e.target.value };
                                            setShop({ ...shop, banners: updated });
                                         }}
                                         className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-slate-900 resize-none"
                                      />
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                       {(shop.banners?.length || 0) < 5 && (
                          <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group">
                             <ImageIcon size={24} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                             <span className="text-[10px] font-black text-slate-400 group-hover:text-purple-600">+ নতুন ব্যানার</span>
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

                 {/* ── Loading Screen Customization ── */}
                 <div className="border-t border-slate-100 pt-6 mt-2 space-y-4">
                    <div>
                       <p className="text-xs font-black text-slate-900 flex items-center gap-2"><Clock size={14} /> লোডিং স্ক্রিন কাস্টমাইজেশন</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">শপ লোড হওয়ার সময় কি দেখাবে তা বেছে নিন</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       {[
                         { v: 'default', label: 'ডিফল্ট', desc: 'শপ লোগো' },
                         { v: 'image', label: 'কাস্টম ছবি', desc: 'নিজের ছবি' },
                         { v: 'text', label: 'কাস্টম টেক্সট', desc: 'ঘূর্ণায়মান লেখা' },
                       ].map(opt => (
                         <label key={opt.v} className="cursor-pointer">
                           <input type="radio" name="loadingType" value={opt.v} checked={loadingMedia.type === opt.v} onChange={() => setLoadingMedia({...loadingMedia, type: opt.v})} className="peer sr-only" />
                           <div className="p-3 border-2 border-slate-100 rounded-2xl text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all">
                             <p className="font-black text-slate-900 text-xs">{opt.label}</p>
                             <p className="text-[9px] text-slate-500 font-bold mt-0.5">{opt.desc}</p>
                           </div>
                         </label>
                       ))}
                    </div>
                     {loadingMedia.type === 'image' && (
                       <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-500 uppercase">লোডিং স্ক্রিনের জন্য কাস্টম পোস্টার/ছবি যোগ করুন (সর্বোচ্চ ৫টি):</p>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             id="newPosterUrl"
                             placeholder="ছবির URL দিন বা ডান পাশের আপলোড বাটনে ক্লিক করুন"
                             className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-purple-600 text-slate-900"
                             onKeyDown={e => {
                               if (e.key === 'Enter' && e.target.value.trim() && (loadingMedia.posters?.length || 0) < 5) {
                                 setLoadingMedia(prev => ({...prev, posters: [...(prev.posters || []), e.target.value.trim()]}));
                                 e.target.value = '';
                               }
                             }}
                           />
                           <label className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-purple-700 transition-all whitespace-nowrap flex items-center gap-1">
                             📷 আপলোড
                             <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                               const file = e.target.files[0];
                               if (!file) return;
                               const { uploadImage } = await import('@/lib/storage');
                               try {
                                 const url = await uploadImage(file);
                                 setLoadingMedia(prev => ({...prev, posters: [...(prev.posters || []), url]}));
                                 toast.success('পোস্টার আপলোড হয়েছে!');
                               } catch { toast.error('আপলোড ব্যর্থ'); }
                             }} />
                           </label>
                         </div>
                         {(loadingMedia.posters?.length || 0) > 0 && (
                           <div className="grid grid-cols-5 gap-3 mt-2">
                             {loadingMedia.posters.map((url, i) => (
                               <div key={i} className="relative aspect-[9/16] rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg group">
                                 <img src={url} alt={`Poster ${i + 1}`} className="w-full h-full object-cover" />
                                 <button type="button" onClick={() => setLoadingMedia(prev => ({...prev, posters: prev.posters.filter((_, j) => j !== i)}))} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer shadow-md">✕</button>
                                 <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] font-black text-center py-1">পোস্টার {i + 1}</div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    )}
                    {loadingMedia.type === 'text' && (
                       <div className="space-y-3">
                         <p className="text-[10px] font-black text-slate-500 uppercase">লোডিং স্ক্রিনে ঘুরে ঘুরে দেখাবে (max 6টি):</p>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             placeholder="যেমন: আমাদের সেরা পণ্য দেখুন!"
                             value={newLoadingText}
                             onChange={e => setNewLoadingText(e.target.value)}
                             className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-purple-600 text-slate-900"
                             onKeyDown={e => {
                               if (e.key === 'Enter' && newLoadingText.trim() && (loadingMedia.texts?.length || 0) < 6) {
                                 setLoadingMedia(prev => ({...prev, texts: [...(prev.texts || []), newLoadingText.trim()]}));
                                 setNewLoadingText('');
                               }
                             }}
                           />
                           <button type="button" onClick={() => {
                             if (newLoadingText.trim() && (loadingMedia.texts?.length || 0) < 6) {
                               setLoadingMedia(prev => ({...prev, texts: [...(prev.texts || []), newLoadingText.trim()]}));
                               setNewLoadingText('');
                             }
                           }} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all">+ যোগ</button>
                         </div>
                         {(loadingMedia.texts?.length || 0) > 0 && (
                           <div className="flex flex-wrap gap-2">
                             {loadingMedia.texts.map((t, i) => (
                               <div key={i} className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-black">
                                 {t}
                                 <button type="button" onClick={() => setLoadingMedia(prev => ({...prev, texts: prev.texts.filter((_, j) => j !== i)}))} className="text-purple-400 hover:text-red-500 ml-1"><X size={10} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                     )}

                     {/* ── Featured Products Highlight Selection ── */}
                     <div className="border-t border-slate-100 pt-6 space-y-4">
                        <div>
                           <p className="text-xs font-black text-slate-900 flex items-center gap-2"><Sparkles size={14} /> লোডিং স্ক্রিন হাইলাইট পণ্য</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">লোডিং পেজে কোন পণ্যগুলো হাইলাইট হিসেবে ঘুরবে তা সিলেক্ট করুন (সর্বোচ্চ ৫টি)</p>
                        </div>
                        {shopProducts.length === 0 ? (
                          <p className="text-xs text-slate-400 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">আপনার শপে কোনো পণ্য নেই। প্রথমে পণ্য যোগ করুন।</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                            {shopProducts.map(p => {
                              const isChecked = featuredProductIds.includes(p.id);
                              return (
                                <label key={p.id} className="relative flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-purple-300 transition-all cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setFeaturedProductIds(featuredProductIds.filter(id => id !== p.id));
                                      } else {
                                        if (featuredProductIds.length >= 5) {
                                          toast.error('সর্বোচ্চ ৫টি পণ্য সিলেক্ট করতে পারবেন');
                                          return;
                                        }
                                        setFeaturedProductIds([...featuredProductIds, p.id]);
                                      }
                                    }}
                                    className="accent-purple-600 rounded"
                                  />
                                  {p.imageUrl && <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-slate-200" />}
                                  <span className="text-[10px] font-black text-slate-700 truncate">{p.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                     </div>
                 </div>

                <div className="md:col-span-2 border-t border-purple-100 pt-6 mt-2">
                   <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                      <div>
                         <p className="text-xs font-black text-slate-900">Enable AI Shopping List (Vision)</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Allows users to upload photos of hand-written lists</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={aiConfig.enableAiShoppingList} onChange={e => setAiConfig({...aiConfig, enableAiShoppingList: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                   </div>
                </div>

                <div className="md:col-span-2 border-t border-purple-100 pt-6 mt-2">
                   <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                      <div>
                         <p className="text-xs font-black text-slate-900">Enable Smart Inventory (Auto Calculator)</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Replace AI prompt with instant auto-calculator for quantities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={aiConfig.smartCalcEnabled} onChange={e => setAiConfig({...aiConfig, smartCalcEnabled: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                   </div>
                </div>
              </div>
            </Card>

            <Card title="Design System" subtitle="10 Premium Themes" icon={Sparkles}>
              <DesignThemeSelector shopId={activeShopId} />
            </Card>

            {/* Service Area Location */}
            <Card title="সার্ভিস এলাকা" subtitle="কোথায় ডেলিভারি করেন তা সেট করুন" icon={MapPin} className="border-l-4 border-l-emerald-500">
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div>
                    <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
                       <MapPin size={16} className="text-purple-600" /> অর্ডারে লোকেশন বাধ্যতামূলক?
                    </h4>
                    <p className="text-[10px] font-bold text-purple-600 uppercase mt-1">অফ করলে লোকেশন ছাড়াই অর্ডার করা যাবে</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={requireLocationForOrder} onChange={e => setRequireLocationForOrder(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

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

                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div>
                    <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
                       <MapPin size={16} className="text-blue-600" /> কাস্টমারকে লোকেশন বক্স দেখাবেন?
                    </h4>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">অফ থাকলে শুধু GPS দিয়ে অটোমেটিক চেক হবে</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={showLocationSelector} onChange={e => setShowLocationSelector(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                       <MapPin size={16} className="text-emerald-600" /> সার্ভিস এরিয়া ব্যানার দেখান (Enable Service Banner)
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">অন করলে স্টোরে লাল/সবুজ লোকেশন ব্যানারটি দেখাবে</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={!disableServiceBanner} onChange={e => setDisableServiceBanner(!e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">কাস্টম এলাকা যোগ করুন</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">যে এলাকার নাম অটোমেটিক লিস্টে নেই (ঐচ্ছিক)</p>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="যেমন: নতুন বাজার, ব্লক সি" 
                      value={newCustomArea}
                      onChange={e => setNewCustomArea(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={() => {
                      if (newCustomArea.trim() && !customAreas.includes(newCustomArea.trim())) {
                         setCustomAreas([...customAreas, newCustomArea.trim()]);
                         setNewCustomArea('');
                      }
                    }} className="h-[52px]">যোগ করুন</Button>
                  </div>
                  {customAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customAreas.map(area => (
                        <div key={area} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-sm font-black">
                          {area}
                          <button type="button" onClick={() => setCustomAreas(customAreas.filter(a => a !== area))} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    বাংলাদেশ জিও-ডেটা অনুযায়ী সার্ভিস এলাকা বেছে নিন (বিভাগ {' > '} জেলা {' > '} উপজেলা {' > '} ইউনিয়ন/সিটি)। কাস্টমাররা অর্ডারের সময় এই এলাকার সাথে লোকেশন ম্যাচিং হবে।
                  </p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Division */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">বিভাগ</label>
                      <select
                        value={geoSelections.division}
                        onChange={e => setGeoSelections({ ...geoSelections, division: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer"
                      >
                        <option value="">-- বিভাগ --</option>
                        {geoData.divisions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 2. District */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">জেলা</label>
                      <select
                        disabled={!geoSelections.division || !geoData.districts.length}
                        value={geoSelections.district}
                        onChange={e => setGeoSelections({ ...geoSelections, district: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">-- জেলা --</option>
                        {geoData.districts.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 3. Upazila */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">উপজেলা</label>
                      <select
                        disabled={!geoSelections.district || !geoData.upazilas.length}
                        value={geoSelections.upazila}
                        onChange={e => {
                          const sel = geoData.upazilas.find(u => u.id === e.target.value);
                          setGeoSelections({ ...geoSelections, upazila: e.target.value, upazilaName: sel?.bn_name || '', union: '' });
                        }}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">-- উপজেলা --</option>
                        {geoData.upazilas.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 4. Ward / Union — label changes based on type returned by API */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                        {geoData.unionsType === 'wards' ? 'সিটি ওয়ার্ড' : 'ইউনিয়ন'}
                      </label>
                      <select
                        disabled={!geoSelections.upazila || geoLoading}
                        value={geoSelections.union}
                        onChange={e => setGeoSelections({ ...geoSelections, union: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">{geoLoading ? 'লোড হচ্ছে...' : `-- ${geoData.unionsType === 'wards' ? 'ওয়ার্ড' : 'ইউনিয়ন'} (ঐচ্ছিক) --`}</option>
                        {geoData.unions.map(d => <option key={d.id} value={d.id}>{d.bn_name || d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!geoSelections.division || geoLoading}
                    onClick={addGeoArea}
                    className="w-full py-3.5 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {geoLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                    এলাকা যোগ করুন
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

            {/* FAQ Section */}
            <Card title="FAQ / প্রশ্ন-উত্তর" subtitle="কাস্টমারদের জন্য সাধারণ প্রশ্ন ও উত্তর" icon={MessageSquare} className="border-l-4 border-l-amber-500">
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  কাস্টমারদের কাছে শো হবে এমন প্রশ্ন ও উত্তর যোগ করুন। এগুলো শপ পেজে FAQ সেকশনে দেখা যাবে।
                </p>
                <div className="space-y-3">
                  <Input placeholder="প্রশ্ন লিখুন (যেমন: ডেলিভারি কতক্ষণ লাগে?)" value={newFaqQ} onChange={e => setNewFaqQ(e.target.value)} />
                  <textarea
                    placeholder="উত্তর লিখুন..."
                    rows={2}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-600 text-slate-900 resize-none"
                    value={newFaqA}
                    onChange={e => setNewFaqA(e.target.value)}
                  />
                  <Button type="button" onClick={() => {
                    if (newFaqQ.trim() && newFaqA.trim()) {
                      setFaqItems([...faqItems, { q: newFaqQ.trim(), a: newFaqA.trim() }]);
                      setNewFaqQ(''); setNewFaqA('');
                    }
                  }} className="h-[44px]">+ প্রশ্ন যোগ করুন</Button>
                </div>
                {faqItems.length > 0 && (
                  <div className="space-y-2">
                    {faqItems.map((faq, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                        <button type="button" onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X size={14} /></button>
                        <p className="text-sm font-black text-slate-900 mb-1">❓ {faq.q}</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}
                {faqItems.length === 0 && (
                  <p className="text-center text-slate-400 text-xs font-bold py-4 border-2 border-dashed border-slate-100 rounded-xl">কোনো FAQ যোগ করা হয়নি।</p>
                )}
              </div>
            </Card>

            <Card title="Social Ecosystem" subtitle="Connect Audiences" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <Input label="💙 Facebook" placeholder="https://facebook.com/yourpage" value={socialLinks.fb} onChange={e => setSocialLinks({...socialLinks, fb: e.target.value})} />
                   <Input label="💜 Instagram" placeholder="https://instagram.com/yourpage" value={socialLinks.insta} onChange={e => setSocialLinks({...socialLinks, insta: e.target.value})} />
                   <Input label="📧 YouTube" placeholder="https://youtube.com/yourchannel" value={socialLinks.yt} onChange={e => setSocialLinks({...socialLinks, yt: e.target.value})} />
                   <Input label="📱 WhatsApp (Number)" placeholder="e.g. 01700000000" value={socialLinks.wa} onChange={e => setSocialLinks({...socialLinks, wa: e.target.value})} />
                   <Input label="💼 LinkedIn" placeholder="https://linkedin.com/in/yourprofile" value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} />
                   <Input label="🎙️ TikTok" placeholder="https://tiktok.com/@yourpage" value={socialLinks.tiktok} onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})} />
                   <Input label="💠 Twitter / X" placeholder="https://x.com/yourhandle" value={socialLinks.twitter || ''} onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})} />
                   <Input label="✈️ Telegram" placeholder="https://t.me/yourchannel" value={socialLinks.telegram || ''} onChange={e => setSocialLinks({...socialLinks, telegram: e.target.value})} />
                   <Input label="🧵 Threads" placeholder="https://threads.net/@yourpage" value={socialLinks.threads || ''} onChange={e => setSocialLinks({...socialLinks, threads: e.target.value})} />
                   <Input label="📌 Pinterest" placeholder="https://pinterest.com/yourpage" value={socialLinks.pinterest || ''} onChange={e => setSocialLinks({...socialLinks, pinterest: e.target.value})} />
                </div>
             </Card>

            <Card title="User Tracking (Analytics)" subtitle="Track User Behavior" icon={Users} className="border-2 border-slate-100 shadow-xl bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <Input 
                     label="Google Analytics 4 (GA4) ID" 
                     placeholder="G-XXXXXXX" 
                     value={trackingConfig.ga4Id} 
                     onChange={e => setTrackingConfig({...trackingConfig, ga4Id: e.target.value})} 
                   />
                   <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                     Tracks product clicks, add to cart, and checkout funnel. Enter your GA4 measurement ID.
                   </p>
                </div>
                <div>
                   <Input 
                     label="Microsoft Clarity Project ID" 
                     placeholder="a1b2c3d4e5" 
                     value={trackingConfig.clarityId} 
                     onChange={e => setTrackingConfig({...trackingConfig, clarityId: e.target.value})} 
                   />
                   <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                     Insanely powerful free tool. Provides session recordings and user heatmaps on your storefront.
                   </p>
                </div>
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

      {/* Play Store Submission Instructions Modal */}
      {showAppInstructions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-2xl p-6 md:p-8 max-w-xl w-full relative animate-slide-in max-h-[80vh] overflow-y-auto scrollbar-thin">
            
            {/* Close */}
            <button 
              type="button"
              onClick={() => setShowAppInstructions(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 border-b pb-5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Google Play Store Upload Checklist</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{shop?.shopName || 'App Details'}</p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 text-slate-800 text-xs font-medium">
              
              {/* keystore */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-black text-slate-900 mb-2 flex justify-between items-center">
                  <span>১. Keystore Command (অ্যান্ড্রয়েড সাইনিং)</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`keytool -genkey -v -keystore ${(shop?.subdomainSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${(shop?.subdomainSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-key`);
                      toast.success('কমান্ড কপি হয়েছে!');
                    }} 
                    className="text-purple-600 font-bold hover:underline"
                  >
                    কপি
                  </button>
                </p>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[9px] p-3 rounded-xl overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                  keytool -genkey -v -keystore {(shop?.subdomainSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias {(shop?.subdomainSlug || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '')}-key
                </pre>
              </div>

              {/* listing */}
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-900">২. স্টোর লিস্টিং মেটাডাটা (Listing Info)</p>
                
                <div className="border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">App Name (Max 30 chars)</span>
                    <span className="text-xs font-bold text-slate-800">{shop?.shopName || 'Daripallah Store'}</span>
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(shop?.shopName || ''); toast.success('কপি হয়েছে!'); }} className="text-purple-600 font-bold hover:underline shrink-0">কপি</button>
                </div>

                <div className="border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Short Description (Max 80 chars)</span>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(`Official Android App for ${shop?.shopName}. Shop online with fast delivery, reviews, and secure checkout.`); toast.success('কপি হয়েছে!'); }} className="text-purple-600 font-bold hover:underline">কপি</button>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Official Android App for {shop?.shopName}. Shop online with fast delivery, reviews, and secure checkout.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Privacy Policy URL</span>
                    <span className="text-xs font-bold text-slate-800">
                      https://daripallah.com/{(shop?.subdomainSlug || 'shop')}/privacy-policy
                    </span>
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`https://daripallah.com/${(shop?.subdomainSlug || 'shop')}/privacy-policy`); toast.success('কপি হয়েছে!'); }} className="text-purple-600 font-bold hover:underline shrink-0">কপি</button>
                </div>
              </div>

              {/* Data safety */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-black text-amber-950 mb-2">৩. Data Safety ডিক্লেয়ারেশন (প্লে কনসোল)</p>
                <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-amber-900 leading-relaxed font-bold">
                  <li><strong>Location</strong>: Collected - ডেলিভারি ট্র্যাকিং ও অ্যাড্রেসের জন্য।</li>
                  <li><strong>Personal Info</strong>: Name, Email, Phone, Address collected - অ্যাকাউন্ট রেজিস্ট্রেশনের জন্য।</li>
                  <li><strong>Financial Info</strong>: Secure payment gateway integration. No credit card records stored in-app.</li>
                  <li><strong>Security</strong>: Data encrypted in transit via HTTPS. User request account deletion supported.</li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 border-t pt-5 flex justify-end">
              <button 
                type="button"
                onClick={() => setShowAppInstructions(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}
      </>)} {/* end general tab */}
    </div>
  );
}
