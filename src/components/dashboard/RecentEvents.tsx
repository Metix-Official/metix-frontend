'use me';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ArrowUpRight, Ticket, CalendarOff, Loader2 } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { fetchMyEvents } from '@/lib/api';

interface RecentEventsProps {
  events?: EventItem[];
}

export const RecentEvents: React.FC<RecentEventsProps> = ({ events: initialEvents }) => {
  const [eventsList, setEventsList] = useState<EventItem[]>(initialEvents || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialEvents || initialEvents.length === 0);

  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEventsList(initialEvents);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadApiEvents() {
      setIsLoading(true);
      try {
        const res = await fetchMyEvents();
        if (isMounted && res.events && res.events.length > 0) {
          const mapped: EventItem[] = res.events.map((item: any) => {
            const totalQuota = item.ticket_types && item.ticket_types.length > 0
              ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.quota || 0), 0)
              : Number(item.total_tickets || item.totalTickets || item.quota || 500);

            const soldQty = item.ticket_types && item.ticket_types.length > 0
              ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_quantity || 0), 0)
              : Number(item.tickets_sold || item.ticketsSold || item.sold_quantity || 0);

            const isSoldOut = totalQuota > 0 && soldQty >= totalQuota;
            const categoryName = (typeof item.category === 'object' ? item.category?.name : item.category) || 'MUSIC CONCERT';
            const locationName = (typeof item.venue === 'object' ? item.venue?.name : item.venue) || item.venue_name || item.location || item.creator_name || 'Venue';

            let statusText: 'Active' | 'Draft' | 'Completed' | 'Sold Out' = 'Active';
            if (item.status === 'Sold Out' || isSoldOut) {
              statusText = 'Sold Out';
            } else if (item.status === 'published' || item.status === 'Active' || item.status === 'active') {
              statusText = 'Active';
            } else if (item.status === 'draft' || item.status === 'Draft') {
              statusText = 'Draft';
            }

            return {
              id: String(item.id),
              title: item.title || 'Untitled Event',
              category: String(categoryName).toUpperCase(),
              date: item.status === 'published' || item.status === 'active' || item.status === 'Active' ? 'Aktif' : (item.event_start_at ? new Date(item.event_start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Aktif'),
              location: locationName,
              ticketsSold: soldQty,
              totalTickets: totalQuota > 0 ? totalQuota : 500,
              revenue: 'Rp 0',
              status: statusText,
              badgeColor: '',
            };
          });
          setEventsList(mapped);
        }
      } catch (err) {
        console.warn('Error loading events in RecentEvents:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadApiEvents();

    return () => {
      isMounted = false;
    };
  }, [initialEvents]);

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Recent Events
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Active and upcoming managed events
            </p>
          </div>
          <Link
            href="/dashboard/events"
            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            Manage Events <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat data event API...</p>
          </div>
        ) : eventsList.length > 0 ? (
          <div className="space-y-4">
            {eventsList.map((event) => {
              const percentage = Math.round(
                (event.ticketsSold / (event.totalTickets || 1)) * 100
              );

              return (
                <div
                  key={event.id}
                  className="p-5 rounded-2xl bg-white border-2 border-blue-200/90 hover:border-blue-400 transition-all space-y-3.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
                        {event.category || 'MUSIC CONCERT'}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug uppercase tracking-tight">
                        {event.title}
                      </h4>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full border text-center leading-tight shrink-0 ${
                        event.status === 'Sold Out' || percentage >= 100
                          ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                          : event.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {event.status === 'Sold Out' || percentage >= 100 ? 'Sold Out' : event.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{event.date || 'Aktif'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[160px]">{event.location || 'Venue'}</span>
                    </div>
                  </div>

                  {/* Progress bar for ticket capacity */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Ticket className="w-4 h-4 text-blue-600" /> Ticket Capacity
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {event.ticketsSold.toLocaleString()} /{' '}
                        {event.totalTickets.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 100
                            ? 'bg-purple-600'
                            : percentage > 75
                            ? 'bg-blue-600'
                            : percentage > 0
                            ? 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State Container */
          <div className="py-10 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
              <CalendarOff className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">
                Belum Ada Event
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Belum ada event aktif yang dikelola saat ini dari backend API.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

