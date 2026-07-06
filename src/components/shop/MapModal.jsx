'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin, X, Navigation, Loader2, Search } from 'lucide-react';

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

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates, shop }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('লোকেশন খোঁজা হচ্ছে...');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(initialCoordinates || { lat: 23.8103, lng: 90.4125 });
  const [outOfRadius, setOutOfRadius] = useState(false);
  const [distanceFromShop, setDistanceFromShop] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Shop delivery config parameters
  const shopLat = parseFloat(shop?.deliveryConfig?.shopLat);
  const shopLng = parseFloat(shop?.deliveryConfig?.shopLng);
  const radiusLimit = parseFloat(shop?.deliveryConfig?.radiusLimit); // In KM

  // 1. Dynamic Leaflet Assets Loader
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadLeaflet = () => {
      return new Promise((resolve, reject) => {
        // Load CSS first
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Check if Leaflet is already loaded in window
        if (window.L) {
          resolve(window.L);
          return;
        }

        const scriptId = 'leaflet-script';
        let script = document.getElementById(scriptId);

        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          document.head.appendChild(script);
        }

        script.onload = () => {
          if (isMounted) resolve(window.L);
        };

        script.onerror = () => {
          reject(new Error('Failed to load Leaflet script.'));
        };
      });
    };

    loadLeaflet()
      .then(() => {
        if (isMounted) setMapLoaded(true);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Check radius constraints
  useEffect(() => {
    if (!isNaN(shopLat) && !isNaN(shopLng) && !isNaN(radiusLimit)) {
      const dist = getDistanceInKm(shopLat, shopLng, selectedCoords.lat, selectedCoords.lng);
      setDistanceFromShop(dist);
      setOutOfRadius(dist > radiusLimit);
    } else {
      setOutOfRadius(false);
      setDistanceFromShop(null);
    }
  }, [selectedCoords, shopLat, shopLng, radiusLimit]);

  // 2. Reverse Geocoding via OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=bn,en`
      );
      if (response.ok) {
        const data = await response.json();
        let displayName = data.display_name || '';
        const parts = displayName.split(', ');
        if (parts.length > 2) {
          displayName = parts.slice(0, parts.length - 2).join(', ');
        }
        setAddress(displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (error) {
      console.error(error);
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  // 3. Center on user current GPS position
  const getGpsPosition = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setSelectedCoords(newCoords);
        setLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setLocating(false);
        reverseGeocode(selectedCoords.lat, selectedCoords.lng);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !isOpen || !mapContainerRef.current) return;

    const L = window.L;
    if (!L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([selectedCoords.lat, selectedCoords.lng], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="display:flex; justify-content:center; align-items:center; width:40px; height:40px;">
        <svg viewBox="0 0 24 24" width="38" height="38" fill="#db2777" stroke="#ffffff" stroke-width="2" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.3));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-12-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      className: 'custom-leaflet-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 38]
    });

    const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerInstanceRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newCoords = { lat: pos.lat(), lng: pos.lng() };
      setSelectedCoords(newCoords);
      reverseGeocode(newCoords.lat, newCoords.lng);
    });

    map.on('click', (e) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      const newCoords = { lat: pos.lat(), lng: pos.lng() };
      setSelectedCoords(newCoords);
      reverseGeocode(newCoords.lat, newCoords.lng);
    });

    getGpsPosition();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, isOpen]);

  const handleAddressSearch = async () => {
    if (!searchQuery.trim() || !window.L) return;

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Bangladesh'
        )}&countrycodes=bd&limit=1&accept-language=bn,en`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const item = data[0];
          const newCoords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
          setSelectedCoords(newCoords);
          
          let displayName = item.display_name || '';
          const parts = displayName.split(', ');
          if (parts.length > 2) {
            displayName = parts.slice(0, parts.length - 2).join(', ');
          }
          setAddress(displayName);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 17);
          }
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([newCoords.lat, newCoords.lng]);
          }
        } else {
          setAddress('লোকেশনটি খুঁজে পাওয়া যায়নি');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeocoding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full sm:max-w-xl sm:h-[85vh] bg-white rounded-none sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col cursor-default"
      >
        
        {/* Header (Contains Close Button and Search Input) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none">
          <div className="flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors pointer-events-auto border border-slate-100"
              title="বন্ধ করুন"
            >
              <X size={20} className="text-slate-700 font-bold" />
            </button>
            
            <div className="px-4 py-2 rounded-full bg-purple-600/90 backdrop-blur shadow-md text-white text-[11px] font-black tracking-widest uppercase border border-purple-500 pointer-events-auto">
              ডেলিভারি লোকেশন
            </div>
          </div>

          {/* Place Search Bar */}
          {mapLoaded && (
            <div className="flex items-center bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 pointer-events-auto w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="ম্যাপে এলাকা বা রোড খুঁজুন (যেমন: হাতিরঝিল)..."
                className="flex-1 bg-transparent px-3 py-2 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all shrink-0"
              >
                <Search size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full bg-slate-100 relative min-h-[300px]">
          {!mapLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-purple-600" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ম্যাপ লোড হচ্ছে...</p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full z-10" />
          )}

          {/* Floating Current Location Button */}
          {mapLoaded && (
            <button
              type="button"
              onClick={getGpsPosition}
              disabled={locating}
              className="absolute bottom-6 right-6 z-[1000] w-12 h-12 rounded-full bg-white text-slate-700 shadow-xl border border-slate-100 flex items-center justify-center hover:text-purple-600 transition-colors active:scale-95 disabled:opacity-75"
              title="আমার অবস্থান চিহ্নিত করুন"
            >
              {locating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Navigation size={20} className="fill-current" />
              )}
            </button>
          )}
        </div>

        {/* Bottom Address details card */}
        <div className="bg-white border-t border-slate-100 px-6 py-6 space-y-4 shadow-2xl z-30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 border border-purple-100/50">
              <MapPin size={20} className="fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">চিহ্নিত ঠিকানা (আপনি চাইলে এডিট করতে পারেন)</span>
                {geocoding && <Loader2 className="animate-spin text-slate-400" size={10} />}
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs sm:text-sm font-extrabold text-slate-900 leading-snug mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-14"
                placeholder="বাসার নম্বর, রোড নম্বর বা হোল্ডিং নম্বর সহ বিস্তারিত ঠিকানা লিখুন..."
              />
            </div>
          </div>

          {/* Delivery radius alert constraint */}
          {outOfRadius && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
              <p className="text-[10px] text-red-700 font-bold leading-tight">
                দুঃখিত! পিন করা লোকেশনটি আমাদের স্ট্যান্ডার্ড ডেলিভারি রেডিয়াসের ({radiusLimit} কি.মি.) বাইরে অবস্থিত (দূরত্ব: {distanceFromShop?.toFixed(1)} কি.মি.)।
              </p>
            </div>
          )}

          {!outOfRadius && distanceFromShop !== null && (
            <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-2.5 flex gap-2 items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
              <p className="text-[10px] text-green-700 font-bold leading-none">
                লোকেশনটি ডেলিভারি সীমার ভিতরে রয়েছে (দূরত্ব: {distanceFromShop?.toFixed(1)} কি.মি.)।
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={outOfRadius}
            onClick={() => onConfirm(selectedCoords, address)}
            className="w-full py-4 bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            লোকেশন নিশ্চিত করুন (Confirm Location)
          </button>
        </div>

      </div>
    </div>
  );
}
