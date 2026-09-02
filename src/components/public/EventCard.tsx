'use client';

import React from 'react';
import { Ticket, Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import Link from 'next/link';

const DEFAULT_CONCERT_BANNERS = [
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
];

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
  const fallbackUrl = DEFAULT_CONCERT_BANNERS[index % DEFAULT_CONCERT_BANNERS.length];

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

  const rawBanner = rawApiEvent?.banner || (rawApiEvent as any)?.banner_url || (event as any)?.banner || (targetApiEvent as any)?.banner;
  const initialBannerUrl = rawBanner ? getPhotoUrl(rawBanner) : fallbackUrl;

  const [imgSrc, setImgSrc] = React.useState<string>(initialBannerUrl || fallbackUrl);

  React.useEffect(() => {
    const url = rawBanner ? getPhotoUrl(rawBanner) : fallbackUrl;
    setImgSrc(url || fallbackUrl);
  }, [rawBanner, fallbackUrl]);

  const handleImageError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    }
  };

  const eventLink = `/events/${targetApiEvent.slug || targetApiEvent.id}`;

  return (
    <Link
      href={eventLink}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative rounded-3xl bg-white border border-slate-200/90 hover:border-blue-500/60 shadow-sm hover:shadow-2xl hover:shadow-blue-600/15 transition-all duration-300 flex flex-col h-full hover:-translate-y-1.5 animate-fade-in-up opacity-0 cursor-pointer overflow-hidden"
    >
      {/* Top Banner & Image Thumbnail with Ticket Voucher Header */}
      <div className="relative h-48 sm:h-52 w-full bg-slate-950 flex flex-col justify-between overflow-hidden shrink-0">
        <img
          src={imgSrc}
          alt={event.title}
          onError={handleImageError}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Subtle Dark Gradient Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

        {/* Decorative Top Ticket Strip / Voucher Header */}
        <div className="relative z-10 px-3.5 pt-3.5 flex items-center justify-between gap-2">
          {/* Category Pill */}
          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-xs">
            <Tag className="w-3 h-3 text-amber-400 shrink-0" /> {event.category}
          </span>

          {/* Date Ticket Stub Badge */}
          <div className="px-3 py-1 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 backdrop-blur-md text-white font-black text-center shadow-lg shadow-blue-600/40 border border-blue-400/40 shrink-0">
            <div className="text-[9px] text-blue-200 font-extrabold uppercase tracking-widest leading-none">{event.dateBadge.month}</div>
            <div className="text-xs sm:text-sm font-black leading-tight">{event.dateBadge.day}</div>
          </div>
        </div>

        {/* Bottom Banner Ticket Badge Tag */}
        <div className="relative z-10 px-3.5 pb-2.5 flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white/90 tracking-wide flex items-center gap-1">
            <Ticket className="w-3 h-3 text-amber-300" />
            <span>OFFICIAL PASS</span>
          </span>
          {event.isSoldOut ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/80 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Sold Out
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Tersedia
            </span>
          )}
        </div>
      </div>

      {/* Main Ticket Body Info */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white relative">
        <div className="space-y-3">
          <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug tracking-tight min-h-[2.5rem]">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{event.dateFull}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Perforated Stub Line with Left & Right Circular Cutouts */}
      <div className="relative bg-white px-3">
        <div className="border-t-2 border-dashed border-slate-200 w-full" />
        {/* Notch Left */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 border-r border-slate-300/80 shadow-inner z-10" />
        {/* Notch Right */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 border-l border-slate-300/80 shadow-inner z-10" />
      </div>

      {/* Ticket Footer Stub (Price & CTA Button) */}
      <div className="p-4 sm:p-5 pt-3.5 bg-slate-50/70 group-hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Mulai Dari</span>
          <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 tracking-tight transition-colors">
            {event.price}
          </span>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-all flex items-center gap-1.5 shrink-0 group-hover:scale-105">
          <span>Beli Tiket</span>
          <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
};
