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

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates, shop, googleMapsApiKey: propApiKey }) {
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
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Shop delivery config parameters
  const shopLat = parseFloat(shop?.deliveryConfig?.shopLat);
  const shopLng = parseFloat(shop?.deliveryConfig?.shopLng);
  const radiusLimit = parseFloat(shop?.deliveryConfig?.radiusLimit); // In KM

  // Google Maps API Key: check prop, config, or fallback
  const googleMapsApiKey = propApiKey || shop?.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. Dynamic Script Loader
  useEffect(() => {
    if (!isOpen || !googleMapsApiKey) return;

    let isMounted = true;

    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
          return;
        }

        const scriptId = 'google-maps-script';
        let script = document.getElementById(scriptId);

        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&language=bn`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        script.onload = () => {
          if (isMounted) resolve(window.google.maps);
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script.'));
        };
      });
    };

    loadGoogleMaps()
      .then(() => {
        if (isMounted) setMapLoaded(true);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, googleMapsApiKey]);

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

  // 2. Reverse Geocoding via Google Geocoder
  const reverseGeocode = (lat, lng) => {
    if (!geocoderRef.current) return;
    setGeocoding(true);

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
      setGeocoding(false);
    });
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
          mapInstanceRef.current.setCenter(newCoords);
          mapInstanceRef.current.setZoom(17);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition(newCoords);
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

  // 4. Initialize Map
  useEffect(() => {
    if (!mapLoaded || !isOpen || !mapContainerRef.current) return;

    const maps = window.google.maps;
    if (!maps) return;

    geocoderRef.current = new maps.Geocoder();
    autocompleteServiceRef.current = new maps.places.AutocompleteService();

    // Map Options
    const mapOptions = {
      center: selectedCoords,
      zoom: 16,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    // Create Map Instance
    const map = new maps.Map(mapContainerRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Create Marker
    const marker = new maps.Marker({
      position: selectedCoords,
      map: map,
      draggable: true,
      animation: maps.Animation.DROP,
      icon: {
        path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#db2777', // pink
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 7
      }
    });
    markerInstanceRef.current = marker;

    // Drag event listeners
    maps.event.addListener(marker, 'dragend', () => {
      const pos = marker.getPosition();
      const newCoords = { lat: pos.lat(), lng: pos.lng() };
      setSelectedCoords(newCoords);
      reverseGeocode(newCoords.lat, newCoords.lng);
    });

    // Map click repositioning
    maps.event.addListener(map, 'click', (e) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      const newCoords = { lat: pos.lat(), lng: pos.lng() };
      setSelectedCoords(newCoords);
      reverseGeocode(newCoords.lat, newCoords.lng);
    });

    // Run initial GPS centering
    getGpsPosition();

    return () => {
      // Clean up map events if any
    };
  }, [mapLoaded, isOpen]);

  // Autocomplete address search handler
  const handleAddressSearch = () => {
    if (!searchQuery.trim() || !window.google || !window.google.maps) return;

    const maps = window.google.maps;
    const geocoder = geocoderRef.current || new maps.Geocoder();

    geocoder.geocode({ address: searchQuery + ', Bangladesh' }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        const newCoords = { lat: loc.lat(), lng: loc.lng() };
        setSelectedCoords(newCoords);
        setAddress(results[0].formatted_address);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newCoords);
          mapInstanceRef.current.setZoom(17);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition(newCoords);
        }
      }
    });
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
        
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-40 flex flex-col gap-3 pointer-events-none">
          <div className="flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors pointer-events-auto border border-slate-100"
            >
              <X size={20} className="text-slate-700" />
            </button>
            <div className="px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur shadow text-white text-[11px] font-black tracking-widest uppercase border border-slate-800">
              মানচিত্র পিন করুন (Google Maps)
            </div>
          </div>

          {/* Search bar */}
          {mapLoaded && (
            <div className="flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 p-1.5 pointer-events-auto w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="এলাকা বা রোড খুঁজুন..."
                className="flex-1 bg-transparent px-3 py-2 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition-all shrink-0"
              >
                <Search size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full bg-slate-100 relative min-h-[300px]">
          {!googleMapsApiKey ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-2">
              <MapPin className="text-red-500" size={32} />
              <p className="text-sm font-black text-slate-800">Google Maps API Key missing</p>
              <p className="text-xs text-slate-400">দয়া করে এডমিন ড্যাশবোর্ড থেকে Google Maps API Key সেট করুন।</p>
            </div>
          ) : !mapLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-pink-600" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">গুগল ম্যাপ লোড হচ্ছে...</p>
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
        <div className="bg-white border-t border-slate-100 px-6 py-6 space-y-4 shadow-2xl z-30">
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
                className="w-full text-xs sm:text-sm font-extrabold text-slate-900 leading-snug mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none h-14"
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
            className="w-full py-4 bg-pink-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            লোকেশন নিশ্চিত করুন (Confirm Location)
          </button>
        </div>

      </div>
    </div>
  );
}
