'use client';
import { useState, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import useLocation from '@/lib/useLocation';

/**
 * ServiceBanner — Handles area check + selection
 */
export default function ServiceBanner({ 
  shop, 
  status, 
  setStatus, 
  manualInput, 
  setManualInput, 
  detectedLocation, 
  setDetectedLocation 
}) {
  const serviceAreas = shop.serviceAreas || [];
  
  const [geoData, setGeoData] = useState({ divisions: [], districts: [], upazilas: [], unions: [], unionsType: 'unions' });
  const [geoSelections, setGeoSelections] = useState({ division: '', district: '', upazila: '', upazilaName: '', union: '' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load divisions once
  useEffect(() => {
    fetch('/api/geo?type=divisions').then(r => r.json()).then(data => {
      setGeoData(prev => ({ ...prev, divisions: Array.isArray(data) ? data : [] }));
    });
  }, []);

  // Districts
  useEffect(() => {
    if (!geoSelections.division) return;
    const fetchGeo = async () => {
      fetch(`/api/geo?type=districts&division_id=${geoSelections.division}`)
        .then(r => r.json()).then(data => {
          setGeoData(prev => ({ ...prev, districts: Array.isArray(data) ? data : [], upazilas: [], unions: [], unionsType: 'unions' }));
          setGeoSelections(prev => ({ ...prev, district: '', upazila: '', upazilaName: '', union: '' }));
          setGeoLoading(false);
        });
    };
    fetchGeo();
  }, [geoSelections.division]);

  // Upazilas
  useEffect(() => {
    if (!geoSelections.district) return;
    const fetchGeo = async () => {
      fetch(`/api/geo?type=upazilas&district_id=${geoSelections.district}`)
        .then(r => r.json()).then(data => {
          setGeoData(prev => ({ ...prev, upazilas: Array.isArray(data) ? data : [], unions: [], unionsType: 'unions' }));
          setGeoSelections(prev => ({ ...prev, upazila: '', upazilaName: '', union: '' }));
          setGeoLoading(false);
        });
    };
    fetchGeo();
  }, [geoSelections.district]);

  // Unions/Wards
  useEffect(() => {
    if (!geoSelections.upazila) return;
    const fetchGeo = async () => {
      fetch(`/api/geo?type=unions&upazila_id=${geoSelections.upazila}&upazila_name=${geoSelections.upazilaName}`)
        .then(r => r.json()).then(res => {
          setGeoData(prev => ({ ...prev, unions: res.data || [], unionsType: res.type || 'unions' }));
          setGeoSelections(prev => ({ ...prev, union: '' }));
          setGeoLoading(false);
        });
    };
    fetchGeo();
  }, [geoSelections.upazila]);

  const { location: autoLoc, loading: autoLoading } = useLocation();

  useEffect(() => {
    if (serviceAreas.length === 0) return;
    
    if (autoLoading) {
      setStatus('checking');
      return;
    }

    if (autoLoc) {
      if (autoLoc.method === 'fallback') {
        setStatus('unavailable');
        return;
      }

      if (autoLoc.district) {
         setDetectedLocation(`${autoLoc.district}${autoLoc.isSadar ? ' সদর' : ''} (${autoLoc.method.toUpperCase()})`);
      }
      
      let isMatch = false;
      const districtName = autoLoc.district || '';
      
      isMatch = serviceAreas.some(sa => {
        if (!sa) return false;
        const normalizedSa = sa.toLowerCase().trim();
        const distMatched = districtName && normalizedSa.includes(districtName.toLowerCase());
        
        if (distMatched) {
           const requiresSadar = normalizedSa.includes('সদর') || normalizedSa.includes('sadar');
           if (requiresSadar && !autoLoc.isSadar) {
              return false; // Retailer set Sadar, but user is outside Sadar
           }
           return true;
        }
        return false;
      });
      
      // Removed: no longer auto-approve non-matching locations

      setStatus(isMatch ? 'available' : 'unavailable');
    } else {
      setStatus('unavailable');
    }
  }, [autoLoc, autoLoading, serviceAreas.length, shop.showLocationSelector, shop.isStrictLocation, setStatus, setDetectedLocation]);

  const checkUnifiedLocation = () => {
    const { division, district, upazila, upazilaName, union } = geoSelections;
    if (!division || !district || !upazila) return;

    const divName = geoData.divisions.find(d => d.id === division)?.bn_name;
    const distName = geoData.districts.find(d => d.id === district)?.bn_name;
    const upaName = upazilaName || geoData.upazilas.find(u => u.id === upazila)?.bn_name;
    const uniItem = geoData.unions.find(u => u.id === union);
    const uniName = uniItem?.bn_name || uniItem?.name;

    const parts = [divName, distName, upaName, uniName].filter(Boolean);
    const userAreaString = parts.join(' > ');
    setManualInput(userAreaString);

    const isAvailable = serviceAreas.some(sa => {
      if (!sa) return false;
      if (userAreaString.startsWith(sa)) return true;
      if (sa === userAreaString) return true;
      return false;
    });

    setStatus(isAvailable ? 'available' : 'unavailable');

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'location_manual_select', { area_name: userAreaString, available: isAvailable });
    }
  };

  if (dismissed || serviceAreas.length === 0 || status === 'idle') return null;

  const showDropdowns = shop.showLocationSelector !== false;
  const customAreas = shop.customAreas || [];
  const allUnions = [
    ...customAreas.map((name, i) => ({ id: `custom-${i}`, bn_name: `📍 ${name}`, name, _isCustom: true })),
    ...geoData.unions,
  ];

  if (status === 'checking') return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center justify-between gap-2 text-blue-700 text-xs font-bold animate-pulse">
      <div className="flex items-center gap-2">
        <Loader2 size={12} className="animate-spin" /> আপনার এলাকায় সার্ভিস আছে কিনা যাচাই করা হচ্ছে...
      </div>
      <button onClick={() => setDismissed(true)} className="text-blue-500 hover:text-blue-700 p-1 rounded-lg transition-colors">
        <X size={14} />
      </button>
    </div>
  );

  if (status === 'denied' || status === 'unavailable') return (
    <div className={`border-b px-4 py-2.5 relative ${shop.isStrictLocation ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
      <button 
        onClick={() => setDismissed(true)} 
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors"
        title="বন্ধ করুন"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
      <div className="max-w-7xl mx-auto space-y-2 pr-8">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
           <MapPin size={12} className={shop.isStrictLocation ? 'text-red-600' : 'text-purple-600'} /> 
           {shop.isStrictLocation ? '🚨 সার্ভিস এরিয়া যাচাই করুন (অর্ডার করতে অবশ্যই এরিয়া সিলেক্ট করতে হবে)' : 'সার্ভিস এরিয়া যাচাই করুন'}
        </div>
        
        {showDropdowns && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             <select 
               value={geoSelections.division} 
               onChange={e => {
                 setGeoLoading(true);
                 setGeoSelections({...geoSelections, division: e.target.value});
               }}
               className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:border-purple-500"
             >
               <option value="">-- বিভাগ --</option>
               {geoData.divisions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
             </select>

             <select 
               disabled={!geoSelections.division}
               value={geoSelections.district} 
               onChange={e => {
                 setGeoLoading(true);
                 setGeoSelections({...geoSelections, district: e.target.value});
               }}
               className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:border-purple-500 disabled:opacity-50"
             >
               <option value="">-- জেলা --</option>
               {geoData.districts.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
             </select>

             <select 
               disabled={!geoSelections.district}
               value={geoSelections.upazila} 
               onChange={e => {
                 setGeoLoading(true);
                 const sel = geoData.upazilas.find(u => u.id === e.target.value);
                 setGeoSelections({...geoSelections, upazila: e.target.value, upazilaName: sel?.bn_name || ''});
               }}
               className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:border-purple-500 disabled:opacity-50"
             >
               <option value="">-- উপজেলা --</option>
               {geoData.upazilas.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
             </select>

             <select 
               disabled={!geoSelections.upazila}
               value={geoSelections.union} 
               onChange={e => setGeoSelections({...geoSelections, union: e.target.value})}
               className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:border-purple-500 disabled:opacity-50"
             >
               <option value="">-- {geoData.unionsType === 'wards' ? 'ওয়ার্ড' : 'ইউনিয়ন'} (ঐচ্ছিক) --</option>
               {allUnions.map(d => <option key={d.id} value={d.id}>{d.bn_name || d.name}</option>)}
             </select>
          </div>
        )}

        {showDropdowns && (
          <button 
             onClick={checkUnifiedLocation}
             disabled={!geoSelections.upazila || geoLoading}
             className={`w-full py-1.5 rounded-xl text-[11px] font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${shop.isStrictLocation ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}
          >
             {geoLoading ? <Loader2 size={12} className="animate-spin" /> : 'সার্ভিস যাচাই করুন'}
          </button>
        )}

        {!showDropdowns && (
          <p className="text-[11px] font-bold text-slate-400 text-center py-1">
            সার্ভিস এরিয়া অটোমেটিকভাবে যাচাই হয়েছে।
          </p>
        )}

        {manualInput && (
           <div className="bg-red-100/50 border border-red-200 rounded-xl p-2.5 text-center">
              <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">
                আফসোস! {manualInput} এ আমাদের সার্ভিস নেই।
              </p>
              {shop.isStrictLocation && <p className="text-[9px] font-bold text-red-500 mt-0.5">দুঃখিত, আপনি অর্ডার করতে পারবেন না।</p>}
           </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`sticky top-0 z-[60] border-b px-4 py-1.5 text-xs font-black shadow-sm ${status === 'available' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {status === 'available' ? '✅ আপনি সার্ভিস এরিয়ার ভেতরে আছেন' : '❌ আপনি সার্ভিস এরিয়ার বাইরে আছেন'}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setStatus('unavailable')} className="text-[9px] uppercase bg-white/60 px-2 py-0.5 rounded border border-black/5 hover:bg-white transition-all">পরিবর্তন করুন</button>
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-700 p-0.5 rounded transition-colors" title="বন্ধ করুন">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
