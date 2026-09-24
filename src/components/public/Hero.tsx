'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Calendar, Tag, ShieldCheck, Zap, TrendingUp, CheckCircle2, ArrowRight, Coins } from 'lucide-react';
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
              <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                {/* Background Festival Image with cinematic dark lighting */}
                <img
                  src={FALLBACK_BANNERS[1]}
                  alt="Metix Festival Showcase"
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 brightness-[0.35] contrast-125 saturate-150"
                />

                {/* Animated Glowing Mesh Aurora Blobs */}
                <div className="absolute -top-24 -left-20 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-600/35 rounded-full blur-3xl animate-pulse [animation-duration:5s]" />
                <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-400/25 rounded-full blur-3xl animate-pulse [animation-duration:7s]" />

                {/* Cyber Stage Perspective Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />

                {/* Diagonal Light Beam Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-indigo-500/20 pointer-events-none" />

                {/* Floating Interactive Visual Showcase on Desktop/Tablet (Right Side) */}
                <div className="hidden lg:flex flex-col items-end justify-center absolute right-8 top-1/2 -translate-y-1/2 z-10 space-y-3 pointer-events-none select-none">
                  {/* Floating Pill: 0% Platform Fee */}
                  <div className="animate-bounce [animation-duration:3.5s] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.3)] text-white">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                      0%
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Bebas Potongan</p>
                      <p className="text-xs font-black text-white">Platform Fee Rp 0</p>
                    </div>
                  </div>

                  {/* Floating Card: Live Revenue Simulator */}
                  <div className="w-68 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-indigo-400/30 shadow-[0_15px_35px_rgba(0,0,0,0.6)] space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Hasil Penjualan Tiket
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% Bersih
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black text-white tracking-tight">100% Milik Promotor</span>
                      <span className="text-[11px] text-emerald-400 font-extrabold">Biaya Admin: Rp 0</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 h-1 rounded-full w-full animate-pulse" />
                    </div>
                  </div>

                  {/* Floating Pill: Scanner & Analytics */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/20 text-slate-200 text-xs shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold">QR Scanner Mobile & Real-Time Data</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
                {/* Background Stage Image with deep dark purple overlay */}
                <img
                  src="/hero/metix_mascot_concert.jpg"
                  alt="Metix Concert Mascot"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_BANNERS[0];
                  }}
                  className="w-full h-full object-cover object-right sm:object-center opacity-30 blur-[2px] scale-110"
                />

                {/* Animated Glowing Mesh Aurora in Instagram Colors */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/35 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-pink-500/25 rounded-full blur-3xl animate-pulse [animation-duration:5s]" />
                <div className="absolute top-1/2 left-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl animate-pulse [animation-duration:7s]" />

                {/* Soft Cyber Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

                {/* Prominent 3D Cartoon Mascot Card on the Right (Tablet & Desktop) */}
                <div className="hidden md:flex items-center justify-center absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
                  <div className="relative group">
                    {/* Glowing Aura Behind Character */}
                    <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-400 rounded-3xl blur-xl opacity-60 animate-pulse [animation-duration:4s]" />

                    {/* Character Card Frame */}
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-3xl overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-900/60 backdrop-blur-xl animate-bounce [animation-duration:6s]">
                      <img
                        src="/hero/metix_mascot_concert.jpg"
                        alt="Metix 3D Mascot Festival"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_BANNERS[0];
                        }}
                        className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Floating Mini Badge on Character */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                        <span className="flex items-center gap-1 text-pink-300">
                          <InstagramIcon className="w-3 h-3 text-pink-400" />
                          @metix.id
                        </span>
                        <span className="text-[9px] text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-md font-extrabold">
                          VIP VIBE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Overlays (Ensures high contrast legibility like YesPlis) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent z-10" />

            {/* Top Bar Badges */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex items-center justify-end pointer-events-none">
              <div className="flex items-center gap-2">
                {currentIndex === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs shadow-md animate-pulse">
                    <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>0% Komisi • Organizer Special</span>
                  </span>
                ) : currentIndex === 2 ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white font-black text-xs shadow-md">
                    <InstagramIcon className="w-3.5 h-3.5 text-white" />
                    <span>Official Instagram Community</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Featured Event</span>
                  </span>
                )}
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
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/25 to-teal-500/25 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-lg">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Layanan Promotor & Event Organizer</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    Buat Event & Jual Tiket{' '}
                    <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                      Bebas Biaya Komisi
                    </span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-normal leading-relaxed">
                    100% omzet tiket milik promotor tanpa potongan biaya komisi platform. Nikmati dashboard analisis penjualan real-time dan sistem QR check-in pintu gratis.
                  </p>

                  {/* Benefit Quick Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-slate-200">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Omzet Milik Organizer
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Dashboard Analitik Real-Time
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Scanner Tiket QR Gratis
                    </span>
                  </div>

                  <div className="pt-2 flex items-center">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 shadow-xl max-w-full">
                      <Link
                        href="/dashboard/events"
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 transition-all cursor-pointer shrink-0 flex items-center gap-2 group"
                      >
                        <span>Buat Event Sekarang</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 backdrop-blur-md border border-pink-400/30 text-pink-300 text-xs font-bold shadow-lg">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Komunitas Konser & Festival Musik</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    Join the Vibe on{' '}
                    <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Instagram @metix.id
                    </span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-normal leading-relaxed">
                    Dapatkan update jadwal konser tercepat, bocoran lineup musisi eksklusif, dan giveaway tiket gratis setiap minggunya.
                  </p>

                  <div className="pt-2 flex items-center">
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-xl p-1.5 rounded-full border border-white/20 shadow-2xl max-w-full">
                      <a
                        href="https://www.instagram.com/metix.id/"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 transition-all cursor-pointer shrink-0 flex items-center gap-2 group"
                      >
                        <InstagramIcon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Follow @metix.id</span>
                      </a>
                      <span className="px-4 py-2 text-xs sm:text-sm font-bold text-white/90 tracking-wide truncate hidden sm:inline">
                        Info Resmi Konser
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
                  className={`h-2 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
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
