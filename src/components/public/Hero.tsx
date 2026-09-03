'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Globe, MapPin, Sparkles, Search, ChevronLeft, ChevronRight, Ticket, Flame, ShieldCheck, Star } from 'lucide-react';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import Link from 'next/link';

interface HeroProps {
  lang?: 'id' | 'en';
  events?: ApiEvent[];
}

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', // Live DJ Lightshow Concert
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', // Outdoor Music Festival Stage Crowd
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', // Neon Stage Concert
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80', // Festival Crowd Lights
];

export const Hero: React.FC<HeroProps> = ({ lang = 'id', events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide timer (exactly 5 seconds)
  useEffect(() => {
    if (!events || events.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events, isPaused]);

  // Handle array index safety
  useEffect(() => {
    if (events && events.length > 0 && currentIndex >= events.length) {
      setCurrentIndex(0);
    }
  }, [events, currentIndex]);

  const currentEvent = events && events.length > 0 ? events[currentIndex] : null;

  // Calculate minimum price for current event
  const minPrice = useMemo(() => {
    if (!currentEvent || !currentEvent.ticket_types || currentEvent.ticket_types.length === 0) {
      return 'Rp 150.000';
    }
    const validPrices = currentEvent.ticket_types
      .map((t) => Number(t.price))
      .filter((p) => !isNaN(p) && p > 0);

    if (validPrices.length === 0) return 'Rp 150.000';
    const lowest = Math.min(...validPrices);
    return `Rp ${lowest.toLocaleString('id-ID')}`;
  }, [currentEvent]);

  // Date badge formatting
  const dateFormatted = useMemo(() => {
    const startStr = currentEvent?.start_at || currentEvent?.event_start_at || currentEvent?.start_time;
    if (!startStr) return { month: 'SEP', day: '14' };
    try {
      const d = new Date(startStr);
      const month = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString();
      return { month, day };
    } catch {
      return { month: 'SEP', day: '14' };
    }
  }, [currentEvent, lang]);

  const venueFormatted = useMemo(() => {
    if (!currentEvent) return 'Stadion Gelora Bung Karno (GBK)';
    if (currentEvent.venue) {
      if (typeof currentEvent.venue === 'object') {
        const name = currentEvent.venue.name || '';
        const city = currentEvent.venue.city || '';
        if (name && city && name.toLowerCase() !== city.toLowerCase()) {
          return `${name}, ${city}`;
        }
        return name || city || 'Venue Utama';
      }
      return String(currentEvent.venue);
    }
    return currentEvent.location || 'Venue Utama';
  }, [currentEvent]);

  const organizerFormatted = useMemo(() => {
    if (!currentEvent) return 'Metix Official Organizer';
    if (currentEvent.organizer) {
      if (typeof currentEvent.organizer === 'object') {
        return currentEvent.organizer.organization_name || currentEvent.organizer.name || 'Metix Official Organizer';
      }
      return String(currentEvent.organizer);
    }
    return 'Metix Official Organizer';
  }, [currentEvent]);

  // Image URL logic with high-res music festival fallback for map/placeholder images
  const bannerUrl = useMemo(() => {
    const photo = currentEvent ? getPhotoUrl(currentEvent.banner, currentEvent.id) : null;
    if (photo) return photo;
    if (typeof window !== 'undefined' && currentEvent?.id) {
      const cached = localStorage.getItem(`metix_banner_preview_${currentEvent.id}`);
      if (cached) return cached;
    }
    if (typeof window !== 'undefined') {
      const lastUploaded = localStorage.getItem('metix_last_uploaded_banner');
      if (lastUploaded) return lastUploaded;
    }
    return FALLBACK_BANNERS[currentIndex % FALLBACK_BANNERS.length];
  }, [currentEvent, currentIndex]);

  const eventLink = currentEvent ? `/events/${currentEvent.slug || currentEvent.id}` : '#';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 pt-4 sm:pt-6 pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl shadow-blue-900/10 group"
        >
          {/* Ambient Lighting Glow Background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* 5-Second Progress Line at the Top Edge */}
          {events.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden z-20">
              <div
                key={currentIndex + (isPaused ? '-paused' : '-active')}
                className={`h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all ${
                  isPaused ? 'w-full opacity-30' : 'animate-[progress_5s_linear]'
                }`}
                style={{
                  animation: !isPaused ? 'heroProgress 5s linear infinite' : 'none',
                }}
              />
            </div>
          )}

          {currentEvent ? (
            /* ================= ULTRA-PREMIUM HERO CAROUSEL SLIDE ================= */
            <div className="relative z-10 space-y-6">
              
              {/* Slide Content Grid */}
              <div
                key={currentEvent.id || currentIndex}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-in fade-in duration-500"
              >
                {/* Left Column: Event Metadata & CTA */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs tracking-tight shadow-md shadow-blue-600/25 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      {dateFormatted.month} {dateFormatted.day}
                    </span>

                    <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/80">
                      {currentEvent.category || 'Music Concert'}
                    </span>

                    <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Event
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] line-clamp-2">
                    {currentEvent.title}
                  </h1>

                  {/* Metadata Row: Time & Organizer */}
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-semibold pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>19:00 WIB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{organizerFormatted}</span>
                    </div>
                  </div>

                  {/* Location Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate font-semibold">
                      {venueFormatted}
                    </span>
                  </div>

                  {/* Primary CTA Button & Price Tag */}
                  <div className="pt-3 flex flex-wrap items-center gap-4">
                    <Link
                      href={eventLink}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.03] transition-all cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-amber-300 -rotate-12" />
                      <span>{lang === 'en' ? 'Book Tickets Now' : 'Beli Tiket Sekarang'}</span>
                    </Link>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mulai Dari</span>
                      <span className="text-base font-black text-blue-700">{minPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Visual Feature Banner */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl h-64 sm:h-96 w-full bg-slate-950 flex flex-col justify-between p-6 sm:p-8">
                    <img
                      src={bannerUrl}
                      alt={currentEvent.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_BANNERS[currentIndex % FALLBACK_BANNERS.length];
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-black/20" />

                    {/* Top Right Live Badge */}
                    <div className="relative z-10 flex justify-end">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-black text-slate-900 border border-white/50 shadow-xl">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>LIVE ON STAGE</span>
                      </span>
                    </div>

                    {/* Bottom Left Glassmorphism Price Pill */}
                    <div className="relative z-10 flex items-end justify-between gap-3">
                      <div className="space-y-1 bg-slate-900/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-xs shadow-2xl">
                        <span className="text-[10px] text-blue-300 uppercase tracking-widest font-black block">
                          {lang === 'en' ? 'STARTING FROM' : 'MULAI DARI'}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {minPrice}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold">
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Metix Guaranteed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Carousel Controls & Indicators Bar */}
              {events.length > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {events.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          idx === currentIndex
                            ? 'w-10 bg-blue-600 shadow-sm shadow-blue-600/30'
                            : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Arrow Nav Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1))}
                      className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % events.length)}
                      className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ================= HERO EMPTY STATE ================= */
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4 sm:space-y-6 py-6 sm:py-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === 'en' ? 'Official Ticket Platform' : 'Platform Tiket Resmi Metix'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {lang === 'en'
                  ? 'Discover Featured Concerts & Experiences'
                  : 'Temukan Konser & Event Seru Pilihan'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto font-medium">
                {lang === 'en'
                  ? 'There are currently no active public events published. Check back soon for upcoming ticket releases!'
                  : 'Belum ada jadwal event yang dipublikasikan saat ini. Jelajahi berbagai kategori event menarik atau kembali lagi secara berkala!'}
              </p>

              <div className="pt-2 flex justify-center">
                <a
                  href="#categories"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Explore Event Categories' : 'Jelajahi Kategori Event'}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
