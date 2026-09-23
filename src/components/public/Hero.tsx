'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import Link from 'next/link';

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

interface HeroProps {
  lang?: 'id' | 'en';
  events?: ApiEvent[];
}

const FALLBACK_BANNERS = [
  '/hero/hero_concert_banner.png',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
];

export const Hero: React.FC<HeroProps> = ({ lang = 'id', events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = 3;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  const currentEvent = events && events.length > 0 ? events[0] : null;

  const minPrice = useMemo(() => {
    if (!currentEvent || !currentEvent.ticket_types || currentEvent.ticket_types.length === 0) {
      return 'Rp 80.000';
    }
    const validPrices = currentEvent.ticket_types
      .map((t) => Number(t.price))
      .filter((p) => !isNaN(p) && p > 0);

    if (validPrices.length === 0) return 'Rp 80.000';
    const lowest = Math.min(...validPrices);
    return `Rp ${lowest.toLocaleString('id-ID')}`;
  }, [currentEvent]);

  const dateFormatted = useMemo(() => {
    const startStr = currentEvent?.start_at || currentEvent?.event_start_at || currentEvent?.start_time;
    if (!startStr) return '7 SEP 2026';
    try {
      const d = new Date(startStr);
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return '7 SEP 2026';
    }
  }, [currentEvent, lang]);

  const venueFormatted = useMemo(() => {
    if (!currentEvent) return 'Medan';
    if (currentEvent.venue) {
      if (typeof currentEvent.venue === 'object') {
        const name = currentEvent.venue.name || '';
        const city = currentEvent.venue.city || '';
        if (name && city && name.toLowerCase() !== city.toLowerCase()) {
          return `${name}, ${city}`;
        }
        return name || city || 'Medan';
      }
      return String(currentEvent.venue);
    }
    return currentEvent.location || 'Medan';
  }, [currentEvent]);

  const bannerUrl = useMemo(() => {
    const photo = currentEvent ? getPhotoUrl(currentEvent.banner, currentEvent.id) : null;
    if (photo) return photo;
    return FALLBACK_BANNERS[0];
  }, [currentEvent]);

  const eventLink = currentEvent ? `/events/${currentEvent.slug || currentEvent.id}` : '#events';

  return (
    <section className="relative overflow-hidden bg-slate-50/50 pt-3 sm:pt-5 pb-4 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative group space-y-3"
        >
          {/* Main Hero Card Container (YesPlis Style Boxed Landscape Banner) */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/50 min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] flex flex-col justify-end">
            
            {/* Background Image Carousel Slider */}
            {currentIndex === 0 ? (
              <div className="absolute inset-0 z-0">
                <img
                  src={bannerUrl}
                  alt={currentEvent?.title || 'Metix Event'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_BANNERS[0];
                  }}
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 brightness-[0.85]"
                />
              </div>
            ) : currentIndex === 1 ? (
              <div className="absolute inset-0 z-0">
                <img
                  src={FALLBACK_BANNERS[1]}
                  alt="Metix Festival Showcase"
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 brightness-[0.85]"
                />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_60%)]" />
              </div>
            )}

            {/* Gradient Overlays (Ensures high contrast legibility like YesPlis) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent z-10" />

            {/* Top Bar Badges */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex items-center justify-end pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Featured Event</span>
                </span>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-20 p-5 sm:p-8 lg:p-10 text-white space-y-4 max-w-3xl">
              {currentIndex === 0 ? (
                <>
                  {/* Event Metadata Pill Tags */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-blue-200">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{dateFormatted}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-blue-200 truncate max-w-[200px] sm:max-w-xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span className="truncate">{venueFormatted}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mulai {minPrice}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                    {currentEvent?.title || 'Konser Musik & Event Spesial Medan'}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-2xl font-normal leading-relaxed">
                    Dapatkan tiket resmi event favoritmu dengan transaksi instan, garansi keamanan 100%, dan e-ticket langsung terkirim.
                  </p>

                  {/* YesPlis Dual-Pill CTA Button */}
                  <div className="pt-2 flex items-center">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 shadow-xl max-w-full">
                      <Link
                        href={eventLink}
                        className="px-6 py-2.5 rounded-full bg-white text-blue-900 font-black text-xs sm:text-sm shadow-md hover:bg-amber-300 hover:text-slate-950 transition-all cursor-pointer shrink-0"
                      >
                        Beli Tiket
                      </Link>
                      <span className="px-4 py-2 text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                        metix.id
                      </span>
                    </div>
                  </div>
                </>
              ) : currentIndex === 1 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Layanan Promotor & Organizer</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    Buat Event Bebas Komisi Penjualan Tiket
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-normal leading-relaxed">
                    100% omzet tiket milik promotor. Nikmati dashboard analisis penjualan real-time dan sistem QR check-in pintu gratis.
                  </p>

                  <div className="pt-2 flex items-center">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 shadow-xl max-w-full">
                      <Link
                        href="/dashboard/events"
                        className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:bg-amber-300 transition-all cursor-pointer shrink-0"
                      >
                        Buat Event Sekarang
                      </Link>
                      <span className="px-4 py-2 text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                        backstage.metix.id
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/20 backdrop-blur-md border border-pink-400/30 text-pink-300 text-xs font-semibold">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Komunitas & Info Konser</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    Ikuti Instagram Resmi @metixofficial
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-normal leading-relaxed">
                    Dapatkan update lineup konser terbaru, kode promo diskon spesial, dan giveaway tiket konser setiap minggunya.
                  </p>

                  <div className="pt-2 flex items-center">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 shadow-xl max-w-full">
                      <a
                        href="https://www.instagram.com/metix.id?stkn=MWZ1bjhjYmx2M3RxeA%3D%3D&utm_source=qr"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs sm:text-sm shadow-md hover:brightness-110 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <InstagramIcon className="w-4 h-4" />
                        <span>Follow Instagram</span>
                      </a>
                      <span className="px-4 py-2 text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                        @metixofficial
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Nav Arrows Floating Right */}
            <div className="absolute bottom-6 right-6 z-30 hidden sm:flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))}
                className="p-2.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-lg"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % totalSlides)}
                className="p-2.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all cursor-pointer shadow-lg"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Dot Indicators */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="sm:hidden flex items-center gap-1.5">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % totalSlides)}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
