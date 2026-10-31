'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Calendar, Tag, ShieldCheck, Zap, TrendingUp, CheckCircle2, ArrowRight, Coins } from 'lucide-react';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import { computeEventPricing } from '@/lib/ticketUtils';
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
  const [currentIndex, setCurrentIndex] = useState(2);
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
    if (!currentEvent) return 'Rp 80.000';
    const pricing = computeEventPricing(currentEvent.ticket_types, currentEvent.status);
    return pricing.priceStr !== 'Coming Soon' ? pricing.priceStr : 'Rp 80.000';
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
                {/* Background Concert Stage Image with soft deep ambiance */}
                <img
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80"
                  alt="Metix Concert Atmosphere"
                  className="w-full h-full object-cover object-center opacity-25 blur-xs scale-105"
                />

                {/* Gentle Ambient Glows (Soft Rose, Violet, Warm Indigo) */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Subtle perspective grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

                {/* Right Side: Realistic Aesthetic Instagram Post Mockup Card */}
                <div className="hidden md:flex items-center justify-center absolute right-6 lg:right-14 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
                  <div className="relative group">
                    {/* Soft Glow behind card */}
                    <div className="absolute -inset-3 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/10 rounded-3xl blur-2xl opacity-60" />

                    {/* The Instagram Mockup Card */}
                    <div className="relative w-64 sm:w-72 rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-3 p-3.5 text-white transition-all duration-500">
                      {/* Header: Profile info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar with Instagram story gradient ring */}
                          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
                            <img
                              src="/icon.svg"
                              alt="Metix Logo"
                              className="w-7 h-7 rounded-full object-cover bg-white"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white tracking-tight">metix.id</span>
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Official Ticketing Platform</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-bold">•••</span>
                      </div>

                      {/* Post Image: Real concert stage with lighting */}
                      <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-slate-800 border border-white/10">
                        <img
                          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80"
                          alt="Concert Lineup Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        
                        {/* Floating Live Tag inside post */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span>Live Concert Experience</span>
                        </div>
                      </div>

                      {/* Action Bar (Heart, Comment, Share) */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                            ❤️ <span>2.8k</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                            💬 <span>342</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-pink-300 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-full">
                          @metix.id
                        </span>
                      </div>

                      {/* Post Caption Snippet */}
                      <p className="text-[11px] text-slate-300 line-clamp-1 leading-relaxed">
                        <span className="font-bold text-white mr-1">metix.id</span>
                        Siap seru-seruan di konser berikutnya? Cek tiket sekarang! 🎟️✨
                      </p>
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-xs shadow-sm">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Official Community</span>
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-xs font-medium shadow-sm">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Komunitas Musik & Festival</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    Dekat dengan Konser & Musik Favoritmu di{' '}
                    <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                      @metix.id
                    </span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg font-normal leading-relaxed">
                    Dapatkan bocoran lineup musisi, jadwal tur terkini, dan info giveaway tiket resmi setiap minggunya.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <a
                      href="https://www.instagram.com/metix.id/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:via-pink-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/25 hover:shadow-lg hover:shadow-pink-600/35 active:scale-95 transition-all cursor-pointer group"
                    >
                      <InstagramIcon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Ikuti @metix.id</span>
                    </a>

                    {/* Subtle Community Social Proof */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-slate-300">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <span className="inline-flex h-5 w-5 rounded-full ring-1 ring-slate-900 bg-purple-500 text-[8px] font-bold text-white items-center justify-center">🎧</span>
                        <span className="inline-flex h-5 w-5 rounded-full ring-1 ring-slate-900 bg-pink-500 text-[8px] font-bold text-white items-center justify-center">🎤</span>
                        <span className="inline-flex h-5 w-5 rounded-full ring-1 ring-slate-900 bg-rose-500 text-[8px] font-bold text-white items-center justify-center">🎸</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-200">15.000+ Penikmat Konser</span>
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
