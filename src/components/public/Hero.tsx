'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import { computeEventPricing } from '@/lib/ticketUtils';
import Link from 'next/link';

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const totalCards = 4;
  const [totalDots, setTotalDots] = useState(2);

  const currentEvent = events && events.length > 0 ? events[0] : null;

  const minPrice = useMemo(() => {
    if (!currentEvent) return 'Rp 80.000';
    const pricing = computeEventPricing(currentEvent.ticket_types, currentEvent.status);
    return pricing.priceStr !== 'Coming Soon' ? pricing.priceStr : 'Rp 80.000';
  }, [currentEvent]);

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

  // Check scroll position to update arrows, active index, and dynamic dots
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard
      ? firstCard.offsetWidth + 16
      : clientWidth / 3;

    // Hitung total titik halaman yang nyata sesuai kapasitas lebar layar (responsif)
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const calculatedDots = maxScroll > 10 ? Math.round(maxScroll / cardWidth) + 1 : 1;
    setTotalDots(calculatedDots);

    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(newIndex, 0), calculatedDots - 1));
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  // Scroll to specific card index
  const scrollToIndex = useCallback((index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard
      ? firstCard.offsetWidth + 16
      : el.clientWidth / 3;

    el.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
  }, []);

  const handlePrev = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollLeft <= 20) {
      // Loop to end
      scrollToIndex(totalDots - 1);
    } else {
      const firstCard = el.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard
        ? firstCard.offsetWidth + 16
        : 350;
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  };

  const handleNext = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollLeft >= scrollWidth - clientWidth - 20) {
      // Loop back to start
      scrollToIndex(0);
    } else {
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 16
        : 350;
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }, [scrollToIndex]);

  // Autoplay interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, handleNext]);

  return (
    <section className="relative overflow-hidden bg-slate-50/50 pt-2 sm:pt-4 pb-4 sm:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative group"
        >
          {/* Floating Left Arrow Navigation Button (Gambar 2 Style) */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-blue-600 active:scale-95 transition-all cursor-pointer focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Floating Right Arrow Navigation Button (Gambar 2 Style) */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-blue-600 active:scale-95 transition-all cursor-pointer focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Horizontal Scrollable Multi-Card Track */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 no-scrollbar select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* CARD 1: Featured Concert & Festival (Dark Indigo / Blue Visual Card) */}
            <div className="w-[86%] sm:w-[48%] lg:w-[calc(33.333%-11px)] shrink-0 snap-start h-[175px] sm:h-[195px] lg:h-[205px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200/70 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white flex relative group/card transition-all">
              {/* Left Content */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 min-w-0">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-black border border-white/20">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Featured Event</span>
                  </div>

                  <h3
                    className="text-sm sm:text-base font-black text-white leading-snug line-clamp-2 drop-shadow-xs"
                    title={currentEvent?.title || 'Konser Musik & Festival Spektakuler'}
                  >
                    {currentEvent?.title || 'Konser Musik & Festival Spektakuler'}
                  </h3>

                  <p className="text-[11px] text-blue-200 font-medium line-clamp-1">
                    Mulai <span className="font-bold text-amber-300">{minPrice}</span> • {venueFormatted}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={eventLink}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-amber-300 text-slate-950 font-black text-[11px] transition-all shadow-xs active:scale-95"
                  >
                    <span>{lang === 'en' ? 'Buy Tickets' : 'Beli Tiket'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Right Visual Image */}
              <div className="w-32 sm:w-40 h-full relative shrink-0 overflow-hidden">
                <img
                  src={bannerUrl}
                  alt={currentEvent?.title || 'Event'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_BANNERS[0];
                  }}
                  className="w-full h-full object-cover object-center scale-105 group-hover/card:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
              </div>
            </div>

            {/* CARD 2: Layanan Organizer (White Card with Bold Blue Border & Yellow CTA - EXACT Gambar 2 Card 2) */}
            <div className="w-[86%] sm:w-[48%] lg:w-[calc(33.333%-11px)] shrink-0 snap-start h-[175px] sm:h-[195px] lg:h-[205px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md border-2 border-blue-600 bg-white text-slate-900 flex relative group/card transition-all">
              {/* Left Graphic / Visual */}
              <div className="w-28 sm:w-36 h-full relative shrink-0 overflow-hidden bg-slate-900">
                <img
                  src={FALLBACK_BANNERS[1]}
                  alt="Metix Organizer"
                  className="w-full h-full object-cover object-center brightness-90 group-hover/card:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-white" />
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase shadow-xs">
                  {lang === 'en' ? '0% Commission' : '0% Komisi'}
                </div>
              </div>

              {/* Right Content & Yellow CTA Button */}
              <div className="flex-1 p-3.5 sm:p-4.5 flex flex-col justify-between z-10 min-w-0">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                    <Zap className="w-3 h-3 fill-blue-600" />
                    <span>{lang === 'en' ? 'Promoter Services' : 'Layanan Promotor'}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm lg:text-[15px] font-black text-blue-950 leading-snug line-clamp-2">
                    {lang === 'en' ? 'Sell Event Tickets with Zero Platform Commission Fee!' : 'Jual Tiket Konser & Event Bebas Potongan Komisi!'}
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {lang === 'en' ? '100% ticket revenue belongs to promoters. Free entrance QR scanner.' : '100% omzet tiket milik promotor. Scanner QR pintu masuk gratis.'}
                  </p>
                </div>

                <div className="pt-1.5">
                  <Link
                    href="/dashboard/events"
                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-[11px] tracking-wide transition-all shadow-xs"
                  >
                    {lang === 'en' ? 'CREATE EVENT' : 'BUAT EVENT'}
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 3: Komunitas Musik & Festival @metix.id (Dark Violet / Instagram Aesthetic) */}
            <div className="w-[86%] sm:w-[48%] lg:w-[calc(33.333%-11px)] shrink-0 snap-start h-[175px] sm:h-[195px] lg:h-[205px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md border border-purple-500/30 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex relative group/card transition-all">
              {/* Left Content */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 min-w-0">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-pink-300 text-[10px] font-bold border border-white/15">
                    <InstagramIcon className="w-3 h-3 text-pink-400" />
                    <span>Official Community</span>
                  </div>

                  <h3 className="text-xs sm:text-sm lg:text-[15px] font-black text-white leading-snug line-clamp-2">
                    {lang === 'en' ? 'Stay Close to Your Favorite Concerts at ' : 'Dekat dengan Konser & Musik Favoritmu di '}
                    <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                      @metix.id
                    </span>
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium line-clamp-1">
                    {lang === 'en' ? 'Lineup leaks, tour dates & weekly ticket giveaways.' : 'Bocoran lineup, jadwal tur & info giveaway tiket mingguan.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <a
                    href="https://www.instagram.com/metix.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:brightness-110 active:scale-95 text-white font-bold text-[11px] transition-all shadow-xs whitespace-nowrap shrink-0"
                  >
                    <InstagramIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>@metix.id</span>
                  </a>
                  <span className="text-[10px] text-slate-300 font-semibold hidden sm:inline truncate">
                    {lang === 'en' ? '15K+ Concert Goers' : '15K+ Penikmat Konser'}
                  </span>
                </div>
              </div>

              {/* Right Visual Image */}
              <div className="w-28 sm:w-36 h-full relative shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80"
                  alt="Metix Community"
                  className="w-full h-full object-cover object-center group-hover/card:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
              </div>
            </div>

            {/* CARD 4: Instant Checkout & Garansi Keamanan (Deep Cyan / Mandiri Visa Style) */}
            <div className="w-[86%] sm:w-[48%] lg:w-[calc(33.333%-11px)] shrink-0 snap-start h-[175px] sm:h-[195px] lg:h-[205px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md border border-sky-500/25 bg-gradient-to-br from-slate-950 via-sky-950 to-blue-950 text-white flex relative group/card transition-all">
              {/* Left Content */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between z-10 min-w-0">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-400/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'en' ? '100% Official Ticket Guarantee' : 'Garansi Tiket Resmi 100%'}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm lg:text-[15px] font-black text-white leading-snug line-clamp-2">
                    {lang === 'en' ? 'Fast & Safe Ticket Booking with Instant Checkout' : 'Beli Tiket Cepat & Aman dengan Instant Checkout'}
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium line-clamp-1">
                    {lang === 'en' ? 'QRIS, Bank VA & E-Wallet supported. Auto E-Ticket delivery.' : 'Support QRIS, VA Bank & E-Wallet. Tiket otomatis terbit.'}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="#events"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-[11px] transition-all shadow-xs"
                  >
                    <span>{lang === 'en' ? 'Explore Events' : 'Jelajahi Event'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Right Visual Image */}
              <div className="w-28 sm:w-36 h-full relative shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80"
                  alt="Metix Guarantee"
                  className="w-full h-full object-cover object-center group-hover/card:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
              </div>
            </div>
          </div>

          {/* Bottom Dot Indicators - Dinamis sesuai kapasitas layar (di Desktop tepat 2 titik) */}
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {Array.from({ length: totalDots }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'w-6 bg-blue-600'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
