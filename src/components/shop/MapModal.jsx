'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin, X, Navigation, Loader2 } from 'lucide-react';

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('লোকেশন খোঁজা হচ্ছে...');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null); // exact GPS position
  const [selectedCoords, setSelectedCoords] = useState(initialCoordinates || { lat: 23.8103, lng: 90.4125 });

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const pinkMarkerRef = useRef(null);
  const gpsMarkerRef = useRef(null);

  // 1. Dynamic CDN script injection
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        // Load Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (isMounted) resolve(window.L);
        };
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      if (isMounted) setMapLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Reverse Geocoding Helper
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=bn`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
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
        setGpsCoords(newCoords);
        setSelectedCoords(newCoords);
        setLocating(false);

        const L = window.L;
        if (leafletMapRef.current && L) {
          leafletMapRef.current.setView([latitude, longitude], 17);
          
          // Update pink pin
          if (pinkMarkerRef.current) {
            pinkMarkerRef.current.setLatLng([latitude, longitude]);
          }

          // Add/Update blue GPS circle
          if (gpsMarkerRef.current) {
            gpsMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const blueGpsIcon = L.divIcon({
              html: `
                <div class="relative w-5 h-5 flex items-center justify-center">
                  <div class="absolute w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                  <div class="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
                </div>
              `,
              className: 'gps-dot-icon',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            gpsMarkerRef.current = L.marker([latitude, longitude], { icon: blueGpsIcon, interactive: false }).addTo(leafletMapRef.current);
          }
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setLocating(false);
        // Fallback: reverse geocode default
        reverseGeocode(selectedCoords.lat, selectedCoords.lng);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // 4. Initialize Map
  useEffect(() => {
    if (!mapLoaded || !isOpen || !mapContainerRef.current) return;
    const L = window.L;
    if (!L) return;

    // Destroy existing map instance to prevent double-initialization errors
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      pinkMarkerRef.current = null;
      gpsMarkerRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // We'll place it elegantly
      attributionControl: false
    }).setView([selectedCoords.lat, selectedCoords.lng], 16);

    leafletMapRef.current = map;

    // CartoDB Voyager Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Pink Marker Icon (Foodpanda style)
    const pinkMarkerIcon = L.divIcon({
      html: `
        <div class="relative flex flex-col items-center">
          <svg class="w-10 h-10 drop-shadow-md filter animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#db2777" stroke="#ffffff" stroke-width="1.5"/>
          </svg>
          <div class="w-2.5 h-1 bg-black/30 rounded-full blur-[1px] -mt-1.5"></div>
        </div>
      `,
      className: 'custom-pin-icon',
      iconSize: [40, 48],
      iconAnchor: [20, 48]
    });

    // Create marker
    const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
      icon: pinkMarkerIcon,
      draggable: true
    }).addTo(map);

    pinkMarkerRef.current = marker;

    // Drag end listener
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    // Map Click listener
    map.on('click', (e) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    // Get current GPS coords on initial map load
    getGpsPosition();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapLoaded, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full h-full sm:max-w-xl sm:h-[85vh] bg-white rounded-none sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors pointer-events-auto border border-slate-100"
          >
            <X size={20} className="text-slate-700" />
          </button>
          <div className="px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur shadow text-white text-[11px] font-black tracking-widest uppercase border border-slate-800">
            মানচিত্র পিন করুন
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full bg-slate-100 relative min-h-[300px]">
          {!mapLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-pink-600" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">মানচিত্র লোড হচ্ছে...</p>
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
              className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-white text-slate-700 shadow-xl border border-slate-100 flex items-center justify-center hover:text-pink-600 transition-colors active:scale-95 disabled:opacity-75"
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
        <div className="bg-white border-t border-slate-100 px-6 py-6 space-y-5 shadow-2xl z-30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0 mt-0.5 border border-pink-100/50">
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
                className="w-full text-xs sm:text-sm font-extrabold text-slate-900 leading-snug mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none h-16"
                placeholder="বাসার নম্বর, রোড নম্বর বা হোল্ডিং নম্বর সহ বিস্তারিত ঠিকানা লিখুন..."
              />
            </div>
          </div>

          <div className="bg-pink-50/40 border border-pink-100/40 rounded-xl p-3 flex gap-2 items-center">
            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-pink-700 font-bold leading-none">
              রাইডার আপনার পিন করা লোকেশনে ডেলিভারি পৌঁছে দেবে।
            </p>
          </div>

          <button
            type="button"
            onClick={() => onConfirm(selectedCoords, address)}
            className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black text-sm hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            লোকেশন নিশ্চিত করুন (Confirm Location)
          </button>
        </div>

      </div>
    </div>
  );
}
