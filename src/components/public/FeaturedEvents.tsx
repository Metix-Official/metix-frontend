'use client';

import React, { useRef, useCallback } from 'react';
import { Megaphone, CalendarOff, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { EventCard } from './EventCard';
import { ApiEvent } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { computeEventPricing } from '@/lib/ticketUtils';
import Link from 'next/link';

interface FeaturedEventsProps {
  lang?: 'id' | 'en';
  apiEvents?: ApiEvent[];
  isLoading?: boolean;
}

export const FeaturedEvents: React.FC<FeaturedEventsProps> = ({
  lang = 'id',
  apiEvents = [],
  isLoading = false,
}) => {
  // Convert ApiEvent objects into PublicEvent cards if API data exists
  const eventsToDisplay: PublicEvent[] = React.useMemo(() => {
    if (!apiEvents || apiEvents.length === 0) {
      return [];
    }

    const themes = [
      'from-blue-600 to-indigo-700',
      'from-violet-600 to-purple-700',
      'from-sky-500 to-blue-600',
      'from-emerald-600 to-teal-700',
      'from-amber-500 to-orange-600',
      'from-rose-600 to-pink-700',
    ];

    return apiEvents.map((item, idx) => {
      let month = 'SEP';
      let day = '15';
      let dateFull = '15 Sep 2026';
      const startDateStr = item.start_at || item.event_start_at || item.start_time;

      if (startDateStr) {
        try {
          const d = new Date(startDateStr);
          month = d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
          day = d.getDate().toString();
          dateFull = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
          // Fallback
        }
      }

      // Compute pricing with ticketUtils: ACTIVE vs SOLD_OUT, ignoring INACTIVE
      const pricing = computeEventPricing(item.ticket_types, item.status);
      const priceStr = pricing.priceStr;
      const isSoldOut = pricing.isSoldOut || item.status?.toUpperCase() === 'CLOSED';

      // Venue parsing from API schema
      let venueStr = item.location || 'Venue Location';
      if (item.venue) {
        if (typeof item.venue === 'object') {
          const name = item.venue.name || '';
          const city = item.venue.city || '';
          if (name && city && name.toLowerCase() !== city.toLowerCase()) {
            venueStr = `${name}, ${city}`;
          } else {
            venueStr = name || city || venueStr;
          }
        } else if (typeof item.venue === 'string') {
          venueStr = item.venue;
        }
      }

      // Organizer parsing from API schema
      let orgStr = 'Metix Organizer';
      if (item.organizer) {
        if (typeof item.organizer === 'object') {
          orgStr = item.organizer.organization_name || item.organizer.name || orgStr;
        } else if (typeof item.organizer === 'string') {
          orgStr = item.organizer;
        }
      }

      return {
        id: String(item.id),
        title: item.title,
        category: item.category || 'Music Concert',
        organizer: orgStr,
        dateBadge: { month, day },
        dateFull,
        timeRange: '19:00 WIB',
        venue: venueStr,
        city: typeof item.venue === 'object' ? item.venue?.city || 'Indonesia' : 'Indonesia',
        country: 'ID',
        price: priceStr,
        banner: item.banner,
        imageTheme: themes[idx % themes.length],
        isSoldOut: isSoldOut,
        rawApiEvent: item,
      };
    });
  }, [apiEvents]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollLeft <= 20) {
      // Loop to end
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 24
        : 310;
      el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    }
  }, []);

  const handleNext = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollLeft >= scrollWidth - clientWidth - 20) {
      // Loop back to start
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 24
        : 310;
      el.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }, []);

  return (
    <section id="events" className="py-12 lg:py-16 bg-blue-50/40 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header (Gambar 2 Style: Animated Megaphone + Event Seru Untukmu) */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center justify-center select-none">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 shrink-0 animate-megaphone" />
              {/* Emitted Sound Waves */}
              <svg
                className="absolute -top-1 -right-2.5 w-4 h-4 text-blue-600 pointer-events-none overflow-visible"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path
                  d="M3 5 C 6 4, 8 6, 9 9"
                  className="animate-soundwave-1"
                />
                <path
                  d="M7 2 C 11 1, 13 4, 14 8"
                  className="animate-soundwave-2"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'en' ? 'Exciting Events For You' : 'Event Seru Untukmu'}
            </h2>
          </div>
        </div>

        {isLoading ? (
          /* Symmetrical EventCard Skeleton Loading Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border border-slate-200/80 p-0 overflow-hidden shadow-xs space-y-4">
                <Skeleton className="h-48 sm:h-52 w-full rounded-none" />
                <div className="p-5 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-4/5 rounded-lg" />
                    <Skeleton className="h-4 w-3/5 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : eventsToDisplay.length > 0 ? (
          <div className="relative group">
            {/* Floating Left Arrow Navigation Button */}
            {eventsToDisplay.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute -left-2.5 sm:-left-3.5 md:-left-4.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-blue-600 active:scale-95 transition-all cursor-pointer focus:outline-none"
                aria-label={lang === 'en' ? 'Previous Events' : 'Event Sebelumnya'}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            )}

            {/* Floating Right Arrow Navigation Button */}
            {eventsToDisplay.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute -right-2.5 sm:-right-3.5 md:-right-4.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-blue-600 active:scale-95 transition-all cursor-pointer focus:outline-none"
                aria-label={lang === 'en' ? 'Next Events' : 'Event Selanjutnya'}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            )}

            {/* Horizontal Scrollable Event Cards Track */}
            <div
              ref={scrollContainerRef}
              className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 px-1 no-scrollbar select-none"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {eventsToDisplay.map((event, index) => {
                const rawApi = apiEvents.find((x) => String(x.id) === event.id) || (event as any).rawApiEvent;
                return (
                  <div
                    key={event.id}
                    className="w-[270px] sm:w-[285px] md:w-[295px] shrink-0 snap-start flex"
                  >
                    <EventCard
                      event={event}
                      rawApiEvent={rawApi}
                      index={index}
                      lang={lang}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= PREMIUM NO EVENT EMPTY STATE ================= */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-3 max-w-2xl mx-auto my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-2xs">
              <CalendarOff className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'No Popular Events Available' : 'Belum Ada Event Populer Saat Ini'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                {lang === 'en'
                  ? 'There are currently no active public events published. Pantau halaman ini secara berkala untuk penawaran tiket terbaru!'
                  : 'Saat ini belum ada event populer yang dipublikasikan. Pantau halaman ini secara berkala untuk update rilis tiket event mendatang!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
