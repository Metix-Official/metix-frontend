'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Globe, MapPin, Search, ChevronLeft, ChevronRight, Ticket, Flame, ShieldCheck, Star, Zap, Percent, Sparkles, ExternalLink, Share2 } from 'lucide-react';

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import Link from 'next/link';

interface HeroProps {
  lang?: 'id' | 'en';
  events?: ApiEvent[];
}

const FALLBACK_BANNERS = [
  '/hero/hero_concert_banner.png', // Ultra High-Res Generated Music Festival Concert Stage
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', // Live DJ Lightshow Concert
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', // Outdoor Music Festival Stage Crowd
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', // Neon Stage Concert
];

const EXTRA_SLIDES = [
  {
    id: 'slide-2',
    title: 'METIX - Digital Ticketing Platform',
    image: '/hero/slide-2.png',
    alt: 'METIX - Your Event. Your Ticket. Your Experience',
  },
  {
    id: 'slide-3',
    title: 'Profile Perusahaan & Tentang Kami',
    image: '/hero/slide-3.png',
    alt: 'Profile Perusahaan Metix',
  },
];

export const Hero: React.FC<HeroProps> = ({ lang = 'id', events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = 1 + EXTRA_SLIDES.length; // Slide 0 = Main Event, Slide 1-3 = Showcase Images

  // Auto slide timer (exactly 5 seconds)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  // Handle array index safety
  useEffect(() => {
    if (currentIndex >= totalSlides) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  const currentEvent = events && events.length > 0 ? events[0] : null;

  // Calculate minimum price for current event
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

  // Date badge formatting
  const dateFormatted = useMemo(() => {
    const startStr = currentEvent?.start_at || currentEvent?.event_start_at || currentEvent?.start_time;
    if (!startStr) return { month: 'SEP', day: '7' };
    try {
      const d = new Date(startStr);
      const month = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString();
      return { month, day };
    } catch {
      return { month: 'SEP', day: '7' };
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

  // Image URL logic with high-res music festival fallback
  const bannerUrl = useMemo(() => {
    const photo = currentEvent ? getPhotoUrl(currentEvent.banner, currentEvent.id) : null;
    if (photo) return photo;
    return FALLBACK_BANNERS[0];
  }, [currentEvent]);

  const eventLink = currentEvent ? `/events/${currentEvent.slug || currentEvent.id}` : '#events';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/90 via-white to-slate-50/60 pt-4 sm:pt-6 pb-8 sm:pb-12">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative group space-y-4"
        >
          {/* Top Progress Line Indicator */}
          <div className="h-1 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div
              key={currentIndex + (isPaused ? '-paused' : '-active')}
              className={`h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-400 transition-all ${isPaused ? 'w-full opacity-30' : 'animate-[progress_5s_linear]'
                }`}
              style={{
                animation: !isPaused ? 'heroProgress 5s linear infinite' : 'none',
              }}
            />
          </div>

          {/* Carousel Slide Container */}
          <div className="relative z-10">
            {currentIndex === 0 ? (
              /* ================= SLIDE 0: MAIN FEATURED EVENT SLIDE ================= */
              <div
                key="slide-0"
                className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-blue-950/5 ring-1 ring-black/[0.03] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-in fade-in duration-500 overflow-hidden"
              >
                {/* Subtle Interior Atmospheric Glow */}
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 right-1/3 w-72 h-72 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

                {/* Left Column: Event Metadata & CTA */}
                <div className="lg:col-span-6 space-y-6 relative z-10">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs tracking-tight shadow-md shadow-blue-600/30 flex items-center gap-1.5 ring-2 ring-blue-500/20">
                      <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                      {dateFormatted.month} {dateFormatted.day}
                    </span>

                    <span className="px-3.5 py-1.5 rounded-full bg-blue-50/90 text-blue-700 font-bold text-xs border border-blue-200/80 shadow-xs">
                      {currentEvent?.category || 'Music Concert'}
                    </span>

                    <span className="px-3.5 py-1.5 rounded-full bg-slate-100/90 text-slate-700 font-extrabold text-xs border border-slate-200/90 flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Event</span>
                    </span>

                    <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50/90 text-amber-800 font-extrabold text-[11px] border border-amber-200/80">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>Trending #1</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight leading-[1.12] line-clamp-2 drop-shadow-xs">
                    {currentEvent?.title || 'RAME-RAME IN FESTIVAL 2026'}
                  </h1>

                  {/* Metadata Cards Micro-Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-slate-700">
                      <div className="w-8 h-8 rounded-xl bg-blue-100/80 flex items-center justify-center shrink-0 text-blue-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Acara</p>
                        <p className="text-xs sm:text-sm font-black text-slate-800 truncate">19:00 WIB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 text-slate-700">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Venue</p>
                        <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{venueFormatted}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organizer Row */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Diselenggarakan oleh:</span>
                    <span className="font-extrabold text-slate-700 truncate">{organizerFormatted}</span>
                  </div>

                  {/* Primary CTA Button & Price Block */}
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <Link
                      href={eventLink}
                      className="group/btn relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-white/15 skew-x-12 -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-out" />
                      <Ticket className="w-4 h-4 text-amber-300 -rotate-12 group-hover/btn:rotate-0 transition-transform" />
                      <span>{lang === 'en' ? 'Book Tickets Now' : 'Beli Tiket Sekarang'}</span>
                      <ChevronRight className="w-4 h-4 text-white/70 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-100/80 border border-slate-200/80">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          {lang === 'en' ? 'FROM' : 'MULAI DARI'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-blue-700 tracking-tight">
                          {minPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Visual Feature Banner */}
                <div className="lg:col-span-6 relative">
                  {/* Subtle ambient blur behind banner */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />

                  <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl h-72 sm:h-96 w-full bg-slate-950 flex flex-col justify-between p-6 sm:p-8">
                    <img
                      src={bannerUrl}
                      alt={currentEvent?.title || 'RAME-RAME IN FESTIVAL 2026'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_BANNERS[0];
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-black/25" />

                    {/* Top Right Live Badge */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white/90">
                        Official Stage
                      </span>
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-black text-slate-900 border border-white/50 shadow-xl">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>LIVE ON STAGE</span>
                      </span>
                    </div>

                    {/* Bottom Floating Glassmorphism Ticket Card */}
                    <div className="relative z-10 flex items-end justify-between gap-3">
                      <div className="space-y-1.5 bg-slate-950/75 backdrop-blur-xl border border-white/20 p-4 rounded-2xl max-w-xs shadow-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-blue-300 uppercase tracking-widest font-black block">
                            {lang === 'en' ? 'STARTING FROM' : 'MULAI DARI'}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold">
                            General & VIP
                          </span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-white tracking-tight block">
                          {minPrice}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold shadow-lg">
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Metix Guaranteed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentIndex === 1 ? (
              /* ================= SLIDE 1: TANPA POTONGAN KOMISI BANNER ================= */
              <div
                key="slide-1-promo"
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-10 lg:p-12 text-white min-h-[340px] sm:min-h-[400px] flex flex-col justify-between shadow-2xl border border-blue-500/20 animate-in fade-in duration-500"
              >
                {/* Ambient Glows & Grid Mesh */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-8 right-16 text-amber-300/10 text-9xl font-black select-none pointer-events-none rotate-12">⚡</div>
                <div className="absolute bottom-6 right-36 text-blue-400/10 text-9xl font-black select-none pointer-events-none -rotate-12">0%</div>

                {/* Top Badge Tagline */}
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-400/20">
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>UNTUK PENYELENGGARA EVENT & PROMOTOR</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200">
                    <ShieldCheck className="w-4 h-4 text-amber-300" /> Metix Partner Guarantee
                  </span>
                </div>

                {/* Main Headline */}
                <div className="relative z-10 my-4 sm:my-6 space-y-3 max-w-3xl">
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
                    Tanpa Potongan Komisi
                  </h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight drop-shadow-lg">
                      Sepeserpun!
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-cyan-400/90 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-400/20">
                      <Percent className="w-4 h-4" /> 0% Komisi Penjualan EO
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-200/90 font-medium max-w-xl pt-1 leading-relaxed">
                    100% omzet tiket milik promotor. Biaya platform hanya dibebankan kepada pembeli (buyer) saat checkout.
                  </p>
                </div>

                {/* Footer Bar & Partner Link */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-blue-200">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                      <Ticket className="w-4 h-4 text-amber-300" />
                      <span className="font-extrabold text-white">Backstage Metix</span>
                    </div>
                    <span className="text-blue-400">•</span>
                    <span className="text-blue-300">Pencairan Cepat H+0</span>
                    <span className="text-blue-400">•</span>
                    <span className="text-blue-300">Gratis Scanner App</span>
                  </div>

                  <Link
                    href="/dashboard/events"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-400/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>Buat Event Sekarang</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              /* ================= SLIDE 2: SOSIAL MEDIA BANNER ================= */
              <div
                key="slide-2-social"
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-6 sm:p-10 lg:p-12 text-white min-h-[340px] sm:min-h-[400px] flex flex-col justify-between shadow-2xl border border-indigo-500/20 animate-in fade-in duration-500"
              >
                {/* Ambient Glows */}
                <div className="absolute top-0 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-extrabold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Official Community Hub
                  </span>
                </div>

                {/* Content Row */}
                <div className="relative z-10 my-4 sm:my-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Mockup Phone Graphic */}
                  <div className="hidden md:flex md:col-span-4 justify-center">
                    <div className="w-48 bg-slate-950 border-4 border-slate-800/90 rounded-3xl p-3 shadow-2xl space-y-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300 ring-1 ring-white/10">
                      <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />
                      <div className="bg-slate-900 rounded-xl p-2.5 space-y-2 text-center text-xs">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center font-black text-white text-sm border-2 border-amber-300 shadow-md">
                          M
                        </div>
                        <div className="font-extrabold text-white">@metixofficial</div>
                      </div>
                    </div>
                  </div>

                  {/* Headline & Handle Badges */}
                  <div className="md:col-span-8 space-y-3">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                      Ikuti Komunitas Metix
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-200/90 font-medium max-w-md leading-relaxed">
                      Dapatkan info event terbaru, tiket flash sale, dan penawaran eksklusif langsung dari channel resmi kami!
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <a
                        href="https://www.instagram.com/metix.id?stkn=MWZ1bjhjYmx2M3RxeA%3D%3D&utm_source=qr"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-amber-300 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <InstagramIcon className="w-4 h-4 text-pink-600" />
                        <span>@metixofficial</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>

                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 hover:bg-white/20 transition-all cursor-pointer">
                          <Globe className="w-4 h-4" />
                        </span>
                        <span className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 hover:bg-white/20 transition-all cursor-pointer">
                          <YoutubeIcon className="w-4 h-4 text-red-400" />
                        </span>
                        <span className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 hover:bg-white/20 transition-all cursor-pointer">
                          <Share2 className="w-4 h-4 text-cyan-300" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/15 text-xs text-blue-200">
                  <span className="font-bold">METIX Indonesia Official</span>
                  <span className="font-semibold text-amber-300">#MetixExperience</span>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Carousel Controls & Indicators Bar */}
          <div className="flex items-center justify-between pt-2 px-1">
            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${idx === currentIndex
                    ? 'w-10 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-600/30'
                    : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrow Nav Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))}
                className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 hover:bg-blue-600 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % totalSlides)}
                className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 hover:bg-blue-600 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

