'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { EventCard } from './EventCard';
import { ApiEvent } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface UpcomingEventsProps {
  lang?: 'id' | 'en';
  apiEvents?: ApiEvent[];
  isLoading?: boolean;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  lang = 'id',
  apiEvents = [],
  isLoading = false,
}) => {
  const eventsToDisplay: PublicEvent[] = React.useMemo(() => {
    if (!apiEvents || apiEvents.length === 0) {
      return [];
    }

    const themes = [
      'from-sky-500 to-blue-600',
      'from-purple-600 to-indigo-700',
      'from-emerald-500 to-teal-600',
    ];

    return apiEvents.slice(0, 3).map((item, idx) => {
      let month = 'OKT';
      let day = '20';
      let dateFull = '20 Oct 2026';
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

      let priceStr = 'Rp 200.000';
      if (item.ticket_types && item.ticket_types.length > 0) {
        const prices = item.ticket_types.map((t) => Number(t.price)).filter((p) => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          priceStr = `Rp ${Math.min(...prices).toLocaleString('id-ID')}`;
        }
      }

      // Venue parsing from API schema
      let venueStr = item.location || 'Venue Utama';
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
        timeRange: '18:00 WIB',
        venue: venueStr,
        city: typeof item.venue === 'object' ? item.venue?.city || 'Indonesia' : 'Indonesia',
        country: 'ID',
        price: priceStr,
        banner: item.banner,
        imageTheme: themes[idx % themes.length],
        isSoldOut: item.status?.toUpperCase() === 'CLOSED',
        rawApiEvent: item,
      };
    });
  }, [apiEvents]);

  return (
    <section id="explore" className="py-12 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-1 animate-fade-in-up opacity-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-wider uppercase">
              {lang === 'en' ? 'Upcoming Events' : 'Event Terbaru'}
            </h2>
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {lang === 'en'
              ? 'Handpicked upcoming experiences across Indonesian venues'
              : 'Pilihan acara seru mendatang di berbagai tempat populer'}
          </p>
        </div>

        {isLoading ? (
          /* Shadcn Skeleton Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : eventsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventsToDisplay.map((event, index) => {
              const rawApi = apiEvents.find((x) => String(x.id) === event.id) || (event as any).rawApiEvent;
              return (
                <EventCard key={event.id} event={event} rawApiEvent={rawApi} index={index} />
              );
            })}
          </div>
        ) : (
          /* ================= PREMIUM NO EVENT EMPTY STATE ================= */
          <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-3 max-w-2xl mx-auto my-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-7 h-7 text-blue-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'No Upcoming Events' : 'Belum Ada Event Mendatang'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Upcoming schedules are being prepared. Check back soon for new concerts, masterclasses, and workshops!'
                  : 'Jadwal event terbaru sedang disiapkan oleh penyelenggara acara. Silakan cek kembali secara berkala!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
