'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Search, Loader2 } from 'lucide-react';

interface VenueMapPickerProps {
  initialLat?: number | string | null;
  initialLng?: number | string | null;
  cityValue?: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onCityChange?: (city: string) => void;
  className?: string;
}

export function VenueMapPicker({
  initialLat,
  initialLng,
  cityValue,
  onLocationSelect,
  onCityChange,
  className = '',
}: VenueMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const defaultLat = initialLat ? parseFloat(String(initialLat)) || -6.2088 : -6.2088;
  const defaultLng = initialLng ? parseFloat(String(initialLng)) || 106.8456 : 106.8456;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [searchQuery, setSearchQuery] = useState<string>(cityValue || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (initialLat && !isNaN(parseFloat(String(initialLat)))) {
      setCurrentLat(parseFloat(String(initialLat)));
    }
    if (initialLng && !isNaN(parseFloat(String(initialLng)))) {
      setCurrentLng(parseFloat(String(initialLng)));
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (cityValue !== undefined) {
      setSearchQuery(cityValue);
    }
  }, [cityValue]);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let isSubscribed = true;
    const initLeaflet = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Force Leaflet to re-calculate container dimensions
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 250);

      // Custom Pin Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: #2563eb;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        const newLat = parseFloat(position.lat.toFixed(6));
        const newLng = parseFloat(position.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onLocationSelect(newLat, newLng);
      });

      map.on('click', (e: any) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onLocationSelect(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    };

    if ((window as any).L) {
      initLeaflet();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (isSubscribed) initLeaflet();
      };
      document.body.appendChild(script);
    }

    // ResizeObserver to continuously trigger map.invalidateSize when tab becomes visible
    let observer: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      observer = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      observer.observe(mapContainerRef.current);
    }

    return () => {
      isSubscribed = false;
      if (observer) observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    const timer = setTimeout(() => {
      handleSearchLocation(searchQuery);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const jumpToLocation = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    onLocationSelect(lat, lng);
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 13);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // Perform OpenStreetMap Geocoding Search
  const handleSearchLocation = async (query: string) => {
    if (!query || query.trim().length < 2) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        jumpToLocation(foundLat, foundLng);
      } else {
        setSearchError('Kota / lokasi tidak ditemukan. Coba kata kunci lain.');
      }
    } catch {
      setSearchError('Gagal mencari koordinat lokasi.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-600" />
          Peta Lokasi Venue & Geocoding Search (Otomatis)
        </label>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Ketik lokasi untuk auto-search & auto-pin lokasi</span>
        </div>
      </div>

      {/* City / Venue Geocoding Automatic Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            if (onCityChange) onCityChange(val);
          }}
          placeholder="Ketik nama kota atau tempat (e.g. GBK Senayan, Surabaya, Bandung)..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
        />
        {isSearching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
        )}
      </div>

      {searchError && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-bold">
          ⚠️ {searchError}
        </p>
      )}

      {/* Map Display Box */}

      {/* Map Display Box */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-64 z-10" />

        {/* Selected Coordinates Overlay Box */}
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Koordinat Terpilih (Auto Sync)</span>
              <span className="font-extrabold text-slate-900">
                Lat: <strong className="text-blue-600">{currentLat}</strong>, Lng: <strong className="text-blue-600">{currentLng}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
