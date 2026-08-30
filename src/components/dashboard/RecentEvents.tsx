'use me';
'use client';

import React from 'react';
import { Calendar, MapPin, ArrowUpRight, Ticket, CalendarOff } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface RecentEventsProps {
  events: EventItem[];
}

export const RecentEvents: React.FC<RecentEventsProps> = ({ events = [] }) => {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-2xs flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Recent Events
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Active and upcoming managed events
            </p>
          </div>
          {events.length > 0 && (
            <a
              href="#"
              className="text-xs font-extrabold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              Manage Events <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => {
              const percentage = Math.round(
                (event.ticketsSold / (event.totalTickets || 1)) * 100
              );

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                        {event.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                        {event.title}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        event.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : event.status === 'Sold Out'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[150px]">{event.location}</span>
                    </div>
                  </div>

                  {/* Progress bar for ticket sales */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-blue-700" /> Ticket Capacity
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {event.ticketsSold.toLocaleString()} /{' '}
                        {event.totalTickets.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 100
                            ? 'bg-purple-600'
                            : percentage > 75
                            ? 'bg-blue-700'
                            : 'bg-emerald-600'
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
                Belum ada event aktif yang dikelola saat ini.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
