'use client';

import React from 'react';
import { ArrowRight, CalendarOff, Sparkles } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { EventCard } from './EventCard';
import { ApiEvent } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
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
      if (item.event_start_at) {
        try {
          const d = new Date(item.event_start_at);
          month = d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
          day = d.getDate().toString();
          dateFull = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
          // Fallback
        }
      }

      let priceStr = 'Rp 150.000';
      if (item.ticket_types && item.ticket_types.length > 0) {
        const prices = item.ticket_types.map((t) => Number(t.price)).filter((p) => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          priceStr = `Rp ${Math.min(...prices).toLocaleString('id-ID')}`;
        }
      }

      return {
        id: String(item.id),
        title: item.title,
        category: item.category || 'General',
        organizer: 'Metix Organizer',
        dateBadge: { month, day },
        dateFull,
        timeRange: '19:00 WIB',
        venue: item.location || 'Venue Location',
        city: 'Indonesia',
        country: 'ID',
        price: priceStr,
        imageTheme: themes[idx % themes.length],
        isSoldOut: item.status === 'closed',
      };
    });
  }, [apiEvents]);

  return (
    <section id="events" className="py-12 lg:py-16 bg-blue-50/40 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in-up opacity-0">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/80 text-blue-800 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'en' ? 'Trending Events' : 'Rekomendasi Terbaik'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {lang === 'en' ? 'Popular Events' : 'Event Populer'}
              <ArrowRight className="w-6 h-6 text-blue-600 hidden sm:inline-block" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              {lang === 'en'
                ? 'Explore the most popular events near you and get your tickets easily'
                : 'Jelajahi berbagai event terpopuler di sekitar kotamu dan pesan tiketnya secara instan'}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs border border-slate-200 shadow-xs hover:shadow-md transition-all shrink-0"
          >
            <span>{lang === 'en' ? 'View All Events' : 'Lihat Semua Event'}</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Link>
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
          <>
            {/* 3/4-Column Responsive Premium Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {eventsToDisplay.map((event, index) => {
                const rawApi = apiEvents.find((x) => String(x.id) === event.id);
                return (
                  <EventCard key={event.id} event={event} rawApiEvent={rawApi} index={index} />
                );
              })}
            </div>

            {/* Bottom Centered View All CTA Button (Visible on mobile & all screens) */}
            <div className="mt-12 text-center animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 hover:shadow-xl hover:scale-105 transition-all"
              >
                <span>{lang === 'en' ? 'Explore All Available Events' : 'Jelajahi Semua Event Lainnya'}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </>
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
