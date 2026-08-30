'use client';

import React, { useState } from 'react';
import { Ticket, Calendar, MapPin, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { TicketCheckoutModal } from './TicketCheckoutModal';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import Link from 'next/link';

interface EventCardProps {
  event: PublicEvent;
  rawApiEvent?: ApiEvent;
  index?: number;
  animationDelayMs?: number;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  rawApiEvent,
  index = 0,
  animationDelayMs,
}) => {
  const delay = animationDelayMs ?? index * 80;

  const targetApiEvent: ApiEvent = rawApiEvent || {
    id: Number(event.id) || 1,
    user_id: 1,
    title: event.title,
    slug: event.title.toLowerCase().replace(/\s+/g, '-'),
    event_start_at: event.dateFull || '2026-09-15',
    event_end_at: '2026-09-15',
    status: event.isSoldOut ? 'closed' : 'published',
    category: event.category,
    location: event.venue,
  };

  const bannerUrl = rawApiEvent?.banner ? getPhotoUrl(rawApiEvent.banner) : null;
  const eventLink = `/events/${targetApiEvent.slug || targetApiEvent.id}`;

  return (
    <Link
      href={eventLink}
      style={{ animationDelay: `${delay}ms` }}
      className="group rounded-3xl bg-white border border-slate-200 hover:border-blue-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1 animate-fade-in-up opacity-0 relative cursor-pointer"
    >
      {/* Photo Thumbnail Banner */}
      <div className={`relative h-48 sm:h-52 w-full ${!bannerUrl ? `bg-gradient-to-tr ${event.imageTheme}` : 'bg-slate-900'} flex flex-col justify-between overflow-hidden shrink-0`}>
        {bannerUrl ? (
          <>
            <img
              src={bannerUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ffffff25_0%,transparent_60%)]" />
        )}

        {/* Category & Date Badges overlay */}
        <div className="relative z-10 p-3.5 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-xs">
            <Tag className="w-3 h-3 text-amber-300 shrink-0" /> {event.category}
          </span>

          <div className="px-2.5 py-1 rounded-xl bg-blue-600/90 backdrop-blur-md text-white font-black text-xs text-center leading-tight shadow-md shadow-blue-600/30 border border-blue-400/30">
            <div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">{event.dateBadge.month}</div>
            <div className="text-xs font-black">{event.dateBadge.day}</div>
          </div>
        </div>
      </div>

      {/* Card Body Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug tracking-tight min-h-[2.5rem]">
            {event.title}
          </h3>
          
          <div className="space-y-1 text-xs text-slate-600 font-semibold">
            <div className="truncate">{event.dateFull}</div>
            <div className="truncate text-slate-500 font-medium">{event.venue}</div>
          </div>
        </div>

        {/* Bottom Price Row matching Image 1 */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500">Mulai Dari</span>
          <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">{event.price}</span>
        </div>
      </div>
    </Link>
  );
};
