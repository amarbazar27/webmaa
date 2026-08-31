'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  MapPin, X, Navigation, Loader2, Search, AlertCircle, Compass, 
  Layers, Check, ChevronRight, Building2, Map as MapIcon, Globe,
  Crosshair, LocateFixed, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Bangladesh Bounds Check (approx Lat: 20.4 to 26.8, Lng: 88.0 to 92.9)
function isWithinBangladesh(lat, lng) {
  return lat >= 20.4 && lat <= 26.8 && lng >= 88.0 && lng <= 92.9;
}

// Distance calculation utility
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Bangladesh District centroids for nearest name resolver fallback
const BD_DISTRICT_CENTROIDS = [
  { name: 'রংপুর', lat: 25.7439, lng: 89.2752 },
  { name: 'ঢাকা', lat: 23.8103, lng: 90.4125 },
  { name: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832 },
  { name: 'রাজশাহী', lat: 24.3636, lng: 88.6241 },
  { name: 'খুলনা', lat: 22.8456, lng: 89.5403 },
  { name: 'বরিশাল', lat: 22.7010, lng: 90.3535 },
  { name: 'সিলেট', lat: 24.8949, lng: 91.8687 },
  { name: 'ময়মনসিংহ', lat: 24.7471, lng: 90.4203 },
  { name: 'কুমিল্লা', lat: 23.4607, lng: 91.1809 },
  { name: 'বগুড়া', lat: 24.8465, lng: 89.3773 },
  { name: 'দিনাজপুর', lat: 25.6279, lng: 88.6332 },
  { name: 'গাজীপুর', lat: 24.0023, lng: 90.4264 },
  { name: 'নারায়ণগঞ্জ', lat: 23.6238, lng: 90.5000 },
];

function getNearestDistrictName(lat, lng) {
  let nearest = BD_DISTRICT_CENTROIDS[0];
  let minDist = Infinity;
  for (const d of BD_DISTRICT_CENTROIDS) {
    const dist = getDistanceInKm(lat, lng, d.lat, d.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = d;
    }
  }
  return nearest.name;
}

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates, shop }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'geodata'
  const [address, setAddress] = useState('রংপুর, বাংলাদেশ');
  const [specificDetails, setSpecificDetails] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Safe default: Rangpur / Dhaka center inside BD
  const defaultBdCoords = { lat: 25.7439, lng: 89.2752 };
  const safeInitialCoords = initialCoordinates && isWithinBangladesh(initialCoordinates.lat, initialCoordinates.lng)
    ? initialCoordinates
    : defaultBdCoords;

  const [selectedCoords, setSelectedCoords] = useState(safeInitialCoords);
  const [outOfRadius, setOutOfRadius] = useState(false);
  const [distanceFromShop, setDistanceFromShop] = useState(null);

  // ── BD Geo-Data Cascading Dropdowns ──
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedUnion, setSelectedUnion] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Shop delivery config parameters
  const shopLat = parseFloat(shop?.deliveryConfig?.shopLat);
  const shopLng = parseFloat(shop?.deliveryConfig?.shopLng);
  const radiusLimit = parseFloat(shop?.deliveryConfig?.radiusLimit); // In KM

  // 1. Load Divisions for Geo-Data Tab
  useEffect(() => {
    fetch('/api/geo?type=divisions')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) setDivisions(list);
      })
      .catch(err => console.error('Failed to load divisions:', err));
  }, []);

  // When Division changes -> Load Districts
  useEffect(() => {
    if (!selectedDivision) {
      setDistricts([]);
      setUpazilas([]);
      setUnions([]);
      return;
    }
    fetch(`/api/geo?type=districts&division_id=${selectedDivision}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setDistricts(list);
        setSelectedDistrict('');
        setUpazilas([]);
        setSelectedUpazila('');
        setUnions([]);
        setSelectedUnion('');
      })
      .catch(err => console.error(err));
  }, [selectedDivision]);

  // When District changes -> Load Upazilas
  useEffect(() => {
    if (!selectedDistrict) {
      setUpazilas([]);
      setUnions([]);
      return;
    }
    fetch(`/api/geo?type=upazilas&district_id=${selectedDistrict}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setUpazilas(list);
        setSelectedUpazila('');
        setUnions([]);
        setSelectedUnion('');
      })
      .catch(err => console.error(err));
  }, [selectedDistrict]);

  // When Upazila changes -> Load Unions / Wards (Supports both raw array & { data: [...] })
  useEffect(() => {
    if (!selectedUpazila) {
      setUnions([]);
      return;
    }
    const upazilaObj = upazilas.find(u => u.id === selectedUpazila);
    const upazilaNameParam = upazilaObj?.bn_name ? `&upazila_name=${encodeURIComponent(upazilaObj.bn_name)}` : '';
    fetch(`/api/geo?type=unions&upazila_id=${selectedUpazila}${upazilaNameParam}`)
      .then(res => res.json())
      .then(data => {
        // Robust extraction: supports { data: [...] } and raw [...]
        const list = Array.isArray(data) ? data : (data?.data || []);
        setUnions(list);
        setSelectedUnion('');
      })
      .catch(err => console.error(err));
  }, [selectedUpazila, upazilas]);

  // 2. Reverse Geocoding with Multi-Engine Fallback (NEVER returns raw numbers)
  const reverseGeocode = useCallback(async (lat, lng) => {
    // Check BD boundary
    if (!isWithinBangladesh(lat, lng)) {
      setAddress('রংপুর / ঢাকা, বাংলাদেশ');
      return;
    }

    setGeocoding(true);
    try {
      // Primary: OpenStreetMap Nominatim with Bengali language support
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=bn,en`
      );
      if (response.ok) {
        const data = await response.json();
        let displayName = data.display_name || '';
        const parts = displayName.split(', ');
        if (parts.length > 2) {
          displayName = parts.slice(0, parts.length - 1).join(', ');
        }
        if (displayName && isNaN(Number(displayName))) {
          setAddress(displayName);
          return;
        }
      }
      
      // Secondary Fallback: BigDataCloud
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=bn`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const fullAddr = [bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.countryName]
          .filter(Boolean)
          .join(', ');
        if (fullAddr) {
          setAddress(fullAddr);
          return;
        }
      }

      // Tertiary Fallback: Nearest District Name (Never raw coords)
      const nearestDist = getNearestDistrictName(lat, lng);
      setAddress(`${nearestDist}, বাংলাদেশ`);
    } catch {
      const nearestDist = getNearestDistrictName(lat, lng);
      setAddress(`${nearestDist}, বাংলাদেশ`);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // 3. Initialize Local Leaflet Map on Mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initLeaflet() {
      try {
        const L = (await import('leaflet')).default;

        if (!isMounted || !mapContainerRef.current) return;

        // Custom High-Res SVG Marker Pin
        const customPinSvg = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9333ea" width="42" height="42" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div style="width:10px;height:4px;background:rgba(0,0,0,0.3);border-radius:50%;margin-top:-3px;"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: customPinSvg,
          className: 'custom-leaflet-pin',
          iconSize: [42, 46],
          iconAnchor: [21, 42],
        });

        // Destroy prior map instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const validLat = isWithinBangladesh(selectedCoords?.lat, selectedCoords?.lng) 
          ? selectedCoords.lat 
          : 25.7439;
        const validLng = isWithinBangladesh(selectedCoords?.lat, selectedCoords?.lng) 
          ? selectedCoords.lng 
          : 89.2752;

        const map = L.map(mapContainerRef.current, {
          center: [validLat, validLng],
          zoom: 15,
          zoomControl: false,
        });

        // Zoom Control top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        // Draggable Marker
        const marker = L.marker([validLat, validLng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        // Radius circle if shop has delivery radius limit
        if (!isNaN(shopLat) && !isNaN(shopLng) && !isNaN(radiusLimit) && radiusLimit > 0) {
          L.circle([shopLat, shopLng], {
            radius: radiusLimit * 1000,
            color: '#9333ea',
            fillColor: '#c084fc',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '4, 8',
          }).addTo(map);
        }

        // On Marker Drag
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (isWithinBangladesh(pos.lat, pos.lng)) {
            const newCoords = { lat: pos.lat, lng: pos.lng };
            setSelectedCoords(newCoords);
            reverseGeocode(pos.lat, pos.lng);
          } else {
            toast.error('অনুগ্রহ করে বাংলাদেশের সীমানার ভেতর পিন রাখুন।');
            marker.setLatLng([validLat, validLng]);
          }
        });

        // On Map Click
        map.on('click', (e) => {
          if (isWithinBangladesh(e.latlng.lat, e.latlng.lng)) {
            marker.setLatLng(e.latlng);
            const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
            setSelectedCoords(newCoords);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
          }
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Invalidate map size after animation frames
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);

      } catch (err) {
        console.error('Leaflet initialization error:', err);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, reverseGeocode, shopLat, shopLng, radiusLimit]);

  // Radius verification
  useEffect(() => {
    if (!isNaN(shopLat) && !isNaN(shopLng) && !isNaN(radiusLimit) && radiusLimit > 0) {
      const dist = getDistanceInKm(shopLat, shopLng, selectedCoords.lat, selectedCoords.lng);
      setDistanceFromShop(dist);
      setOutOfRadius(dist > radiusLimit);
    } else {
      setOutOfRadius(false);
      setDistanceFromShop(null);
    }
  }, [selectedCoords, shopLat, shopLng, radiusLimit]);

  // 4. GPS / GEO Location Detection with Bangladesh Validation
  const getGpsPosition = useCallback((showToast = false) => {
    setLocating(true);

    const handleSuccessPosition = (latitude, longitude, source = 'GPS') => {
      // Validate if inside Bangladesh
      if (!isWithinBangladesh(latitude, longitude)) {
        // Detected outside BD (e.g. overseas ISP IP/China)
        toast.error('ডিভাইসের ইন্টারনেট আইপি বাংলাদেশের বাইরে দেখাচ্ছে। বাংলাদেশের লোকেশন সেট করা হলো।');
        latitude = 25.7439; // Rangpur
        longitude = 89.2752;
      }

      const newCoords = { lat: latitude, lng: longitude };
      setSelectedCoords(newCoords);
      setLocating(false);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 16);
      }
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
      }
      reverseGeocode(latitude, longitude);
      if (showToast) toast.success(`বর্তমান অবস্থান চিহ্নিত হয়েছে! 📍 (${source})`);
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleSuccessPosition(position.coords.latitude, position.coords.longitude, 'GPS');
        },
        async (err) => {
          // Hardware GPS failed -> Try Server / IP Geolocation
          try {
            const ipRes = await fetch('/api/location?auto=true');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.coordinates?.lat && ipData.coordinates?.lon) {
                handleSuccessPosition(ipData.coordinates.lat, ipData.coordinates.lon, 'IP Geolocation');
                return;
              }
            }
          } catch (_) {}

          setLocating(false);
          if (showToast) {
            toast.error('GPS পাওয়া যায়নি। নিচের তালিকা থেকে আপনার জেলা ও এলাকা সিলেক্ট করুন।');
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
      if (showToast) toast.error('GPS পাওয়া যায়নি। তালিকা থেকে জেলা ও এলাকা সিলেক্ট করুন।');
    }
  }, [reverseGeocode]);

  // 5. Search Location via OpenStreetMap Nominatim
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=bd&limit=5&accept-language=bn,en`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        if (data.length === 0) {
          toast.error('উক্ত নামের কোনো এলাকা খুঁজে পাওয়া যায়নি।');
        }
      }
    } catch {
      toast.error('সার্চ করতে সমস্যা হয়েছে।');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!isWithinBangladesh(lat, lng)) {
      toast.error('নির্বাচিত এলাকা বাংলাদেশের বাইরে।');
      return;
    }
    const newCoords = { lat, lng };
    setSelectedCoords(newCoords);
    setAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // 6. Apply Selected Cascading Geo-Data
  const handleApplyGeoData = async () => {
    const divObj = divisions.find(d => d.id === selectedDivision);
    const distObj = districts.find(d => d.id === selectedDistrict);
    const upazilaObj = upazilas.find(u => u.id === selectedUpazila);
    const unionObj = unions.find(u => (u.id === selectedUnion || u.bn_name === selectedUnion || u === selectedUnion));

    const unionTitle = unionObj?.bn_name || (typeof unionObj === 'string' ? unionObj : '');
    const upazilaTitle = upazilaObj?.bn_name || '';
    const districtTitle = distObj?.bn_name || '';
    const divisionTitle = divObj?.bn_name || '';

    const geoParts = [unionTitle, upazilaTitle, districtTitle, divisionTitle].filter(Boolean);

    if (geoParts.length === 0) {
      toast.error('অনুগ্রহ করে অন্তত জেলা ও উপজেলা নির্বাচন করুন।');
      return;
    }

    const fullGeoText = geoParts.join(', ');
    setAddress(fullGeoText);

    // Geocode to center map on selected upazila/union
    setGeocoding(true);
    try {
      const searchQueryText = [unionTitle, upazilaTitle, districtTitle].filter(Boolean).join(', ') + ', Bangladesh';
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQueryText)}&countrycodes=bd&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (isWithinBangladesh(lat, lng)) {
            const newCoords = { lat, lng };
            setSelectedCoords(newCoords);

            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([lat, lng], 15);
            }
            if (markerInstanceRef.current) {
              markerInstanceRef.current.setLatLng([lat, lng]);
            }
          }
        }
      }
    } catch (_) {
      // Keep existing
    } finally {
      setGeocoding(false);
      setActiveTab('map');
      toast.success('এলাকা সফলভাবে নির্বাচিত হয়েছে! 📍');
    }
  };

  // 7. Confirm & Submit
  const handleConfirmLocation = () => {
    if (outOfRadius) {
      toast.error(`এই শপটি ${radiusLimit} কিমির বাইরে ডেলিভারি করে না। আপনার দূরত্ব: ${distanceFromShop?.toFixed(1)} কিমি।`);
      return;
    }

    // Clean address format
    const cleanAddress = address.replace(/^[\d\s,.-]+$/, '').trim() || 'রংপুর, বাংলাদেশ';
    const finalAddress = specificDetails.trim() 
      ? `${specificDetails.trim()}, ${cleanAddress}` 
      : cleanAddress;

    onConfirm(selectedCoords, finalAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // ── Highest Z-Index (z-[99999]) to guarantee display OVER checkout modal ──
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-100 flex flex-col max-h-[94vh] relative z-[100000]">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shadow-inner">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">ডেলিভারি লোকেশন নির্বাচন</h2>
              <p className="text-[10px] text-slate-500 font-bold">সঠিক ঠিকানায় দ্রুত ডেলিভারি নিশ্চিত করতে এলাকা বেছে নিন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Mode Switcher Tabs ── */}
        <div className="flex bg-slate-100/90 p-1.5 border-b border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('map');
              setTimeout(() => {
                if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
              }, 100);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapIcon size={15} />
            <span>লাইভ ম্যাপ ও GPS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('geodata')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'geodata'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={15} />
            <span>বিভাগ ও জেলা ভিত্তিক তালিকা</span>
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: Live Interactive Leaflet Map */}
          {activeTab === 'map' && (
            <div className="space-y-3">
              
              {/* Search Bar on Map */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-xs">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ম্যাপে এলাকা বা রোড খুঁজুন (যেমন: ধানমন্ডি, লালবাগ, মিঠাপুকুর, রংপুর)..."
                    className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 py-1"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {searching ? <Loader2 size={13} className="animate-spin" /> : 'খুঁজুন'}
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[1000] mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left p-3 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-2"
                      >
                        <MapPin size={14} className="shrink-0 text-purple-600" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {/* Map Canvas Container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100 h-64 sm:h-72 w-full">
                <div ref={mapContainerRef} className="w-full h-full z-10" />

                {/* Floating GPS Button */}
                <button
                  type="button"
                  onClick={() => getGpsPosition(true)}
                  disabled={locating}
                  className="absolute bottom-4 right-4 z-[400] px-4 py-2.5 bg-white/95 hover:bg-white text-purple-700 rounded-2xl shadow-xl border-2 border-purple-200 font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
                  title="আমার বর্তমান অবস্থান"
                >
                  <Crosshair size={16} className={`text-purple-600 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'GPS খোঁজা হচ্ছে...' : 'আমার অবস্থান'}</span>
                </button>

                {/* Map helper tooltip */}
                <div className="absolute top-3 left-3 z-[400] bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-bold pointer-events-none">
                  👆 ম্যাপে ক্লিক করে বা পিন ড্র্যাগ করে স্থান চিহ্নিত করুন
                </div>
              </div>

              {/* Out of Radius Warning */}
              {outOfRadius && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-black text-red-700">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>
                    দুঃখিত! এই শপ থেকে আপনার দূরত্ব ({distanceFromShop?.toFixed(1)} কিমি) তাদের সর্বোচ্চ ডেলিভারি রেঞ্জ ({radiusLimit} কিমি) এর বাইরে।
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Cascading BD Geo-Data Dropdowns */}
          {activeTab === 'geodata' && (
            <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                বাংলাদেশ জিও-ডেটা অনুযায়ী আপনার এলাকা নির্বাচন করুন (বিভাগ ➔ জেলা ➔ উপজেলা ➔ ইউনিয়ন/ওয়ার্ড):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Division */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    ১. বিভাগ (Division) *
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  >
                    <option value="">-- বিভাগ নির্বাচন করুন --</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.bn_name || d.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. District */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    ২. জেলা (District) *
                  </label>
                  <select
                    value={selectedDistrict}
                    disabled={!selectedDivision}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 disabled:opacity-50"
                  >
                    <option value="">-- জেলা নির্বাচন করুন --</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.bn_name || d.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Upazila */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    ৩. উপজেলা / থানা (Upazila/Thana) *
                  </label>
                  <select
                    value={selectedUpazila}
                    disabled={!selectedDistrict}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 disabled:opacity-50"
                  >
                    <option value="">-- উপজেলা/থানা নির্বাচন করুন --</option>
                    {upazilas.map(u => (
                      <option key={u.id} value={u.id}>{u.bn_name || u.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Union / Ward (Supports both unions and city wards) */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    ৪. ইউনিয়ন / ওয়ার্ড / এলাকা (Union/Ward)
                  </label>
                  <select
                    value={selectedUnion}
                    disabled={!selectedUpazila || unions.length === 0}
                    onChange={(e) => setSelectedUnion(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 disabled:opacity-50"
                  >
                    <option value="">
                      {unions.length > 0 ? `-- এলাকা/ইউনিয়ন নির্বাচন করুন (${unions.length} টি প্রাপ্ত) --` : '-- ইউনিয়ন লোড হচ্ছে/উপজেলা বেছে নিন --'}
                    </option>
                    {unions.map((u, i) => {
                      const val = typeof u === 'string' ? u : u.bn_name || u.name || u.id;
                      const label = typeof u === 'string' ? u : u.bn_name || u.name;
                      return <option key={i} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyGeoData}
                disabled={!selectedDistrict}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-purple-500/25 active:scale-[0.99]"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>নির্বাচিত এলাকা ম্যাপে নিশ্চিত করুন</span>
              </button>
            </div>
          )}

          {/* ── Address Confirmation Box ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            
            {/* Detected Address Display */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 flex items-center justify-between">
                <span>চিহ্নিত লোকেশন (লোকেশন নাম)</span>
                {geocoding && <span className="text-purple-600 flex items-center gap-1 font-bold"><Loader2 size={11} className="animate-spin"/> লোড হচ্ছে...</span>}
              </label>
              <div className="p-3.5 bg-purple-50/60 border-2 border-purple-200 rounded-2xl text-xs font-black text-slate-900 flex items-start gap-2.5 shadow-xs">
                <MapPin size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <span className="flex-1 break-words">{address}</span>
              </div>
            </div>

            {/* Specific House / Road Details Input */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                নির্দিষ্ট বাসা, রোড বা ল্যান্ডমার্ক (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={specificDetails}
                onChange={(e) => setSpecificDetails(e.target.value)}
                placeholder="যেমন: বাসা নং ১২, রোড নং ৪, ফ্ল্যাট ৩বি বা মসজিদের পাশে"
                className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>

          </div>

        </div>

        {/* ── Modal Footer ── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-black rounded-2xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            বাতিল
          </button>
          
          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={outOfRadius}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>লোকেশন নিশ্চিত করুন (Confirm Location)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
