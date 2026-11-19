'use client';

import React from 'react';
import { MapPin, Calendar, Clock, Building2, ArrowRight } from 'lucide-react';
import { PublicEvent } from '@/data/publicMockData';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import {
  computeEventPricing,
  getCountdownTimeLeft,
  formatCountdownString,
  EventTicketPricingResult,
} from '@/lib/ticketUtils';
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
  customLink?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  lang?: 'id' | 'en';
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  rawApiEvent,
  index = 0,
  animationDelayMs,
  customLink,
  onClick,
  className,
  lang = 'id',
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

  const organizerName = React.useMemo(() => {
    if (rawApiEvent?.organizer) {
      if (typeof rawApiEvent.organizer === 'object') {
        return (
          rawApiEvent.organizer.organization_name ||
          rawApiEvent.organizer.name ||
          'Metix Organizer'
        );
      }
      return String(rawApiEvent.organizer);
    }
    return event.organizer || 'Metix Organizer';
  }, [rawApiEvent, event.organizer]);

  // Real-time ticking state for live countdown
  const [now, setNow] = React.useState<Date>(() => new Date());

  // Compute pricing considering ticket type status: ACTIVE vs SOLD_OUT
  const pricing: EventTicketPricingResult = React.useMemo(() => {
    const types =
      rawApiEvent?.ticket_types ||
      (event as any)?.rawApiEvent?.ticket_types ||
      (event as any)?.ticket_types;
    if (types && Array.isArray(types) && types.length > 0) {
      return computeEventPricing(
        types,
        targetApiEvent?.status || (event.isSoldOut ? 'closed' : 'published'),
        now
      );
    }
    return {
      priceStr: event.price || 'Coming Soon',
      isSoldOut: Boolean(event.isSoldOut),
      hasTickets: Boolean(event.price && event.price !== 'Coming Soon'),
      activeTicketsCount: event.isSoldOut ? 0 : 1,
      saleState: event.isSoldOut
        ? 'SOLD_OUT'
        : event.price && event.price !== 'Coming Soon'
        ? 'ON_SALE'
        : 'COMING_SOON',
      targetCountdownDate: null,
      countdownType: null,
      countdownString: null,
    };
  }, [rawApiEvent, event, targetApiEvent, now]);

  React.useEffect(() => {
    if (!pricing.targetCountdownDate) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [pricing.targetCountdownDate]);

  const countdownInfo = React.useMemo(() => {
    if (!pricing.targetCountdownDate) return null;
    const timeLeft = getCountdownTimeLeft(pricing.targetCountdownDate, now);
    if (!timeLeft) return null;
    return {
      formatted: formatCountdownString(timeLeft),
      type: pricing.countdownType,
      timeLeft,
    };
  }, [pricing.targetCountdownDate, pricing.countdownType, now]);

  const displayedPrice = pricing.priceStr;
  const isEventSoldOut = pricing.isSoldOut || Boolean(event.isSoldOut);
  const isUpcomingSale = pricing.saleState === 'UPCOMING';
  const isSaleEnded = pricing.saleState === 'SALE_ENDED';

  const rawBanner =
    rawApiEvent?.banner ||
    (rawApiEvent as any)?.banner_url ||
    (event as any)?.banner ||
    (targetApiEvent as any)?.banner;
  const eventId = rawApiEvent?.id || targetApiEvent?.id || event.id;
  const initialBannerUrl = getPhotoUrl(rawBanner, eventId) || fallbackUrl;

  const [imgSrc, setImgSrc] = React.useState<string>(initialBannerUrl || fallbackUrl);

  React.useEffect(() => {
    const url = getPhotoUrl(rawBanner, eventId) || fallbackUrl;
    setImgSrc(url || fallbackUrl);
  }, [rawBanner, eventId, fallbackUrl]);

  const handleImageError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    }
  };

  const eventLink = customLink || `/events/${targetApiEvent.slug || targetApiEvent.id}`;

  return (
    <Link
      href={eventLink}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative w-full max-w-[290px] sm:max-w-[300px] mx-auto rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1 animate-fade-in-up opacity-0 cursor-pointer overflow-hidden ${
        className || ''
      }`}
    >
      {/* Top Image Thumbnail (16:9 Aspect Ratio to display full concert banners without cropping) */}
      <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden shrink-0">
        <img
          src={imgSrc}
          alt={event.title}
          onError={handleImageError}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Right: Status or Date Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isEventSoldOut ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          ) : isSaleEnded ? (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              {lang === 'en' ? 'Ended' : 'Berakhir'}
            </span>
          ) : isUpcomingSale ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
              <Clock className="w-3 h-3 text-white animate-pulse" />
              {lang === 'en' ? 'Soon' : 'Segera'}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'en' ? 'Available' : 'Tersedia'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body Info (BayFest, Tanggal, Lokasi, Penyelenggara) */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
        <div className="space-y-2">
          {/* Category Pill Tag (Bersih & Rapi di atas judul, tidak menutupi poster banner) */}
          {event.category && (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100/80">
                {event.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3
            className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug tracking-tight"
            title={event.title}
          >
            {event.title}
          </h3>

          {/* Event Metadata (Tanggal, Lokasi, Penyelenggara) */}
          <div className="space-y-1.5 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{event.dateFull}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate" title={event.venue}>
                {event.venue}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 pt-1 border-t border-slate-100">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">
                {lang === 'en' ? 'By :' : 'Oleh :'} <strong className="text-slate-800 font-bold">{organizerName}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Area: MULAI DARI + Harga + Tombol Beli Tiket */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Sisi Kiri: Label MULAI DARI & Nominal Harga */}
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
              {displayedPrice === 'Coming Soon'
                ? (lang === 'en' ? 'TICKET PRICE' : 'HARGA TIKET')
                : (lang === 'en' ? 'STARTS FROM' : 'MULAI DARI')}
            </span>

            <span
              className={`text-base font-black tracking-tight leading-tight ${
                isEventSoldOut
                  ? 'line-through text-slate-400 decoration-rose-500 decoration-2'
                  : displayedPrice === 'Coming Soon'
                  ? 'text-amber-600'
                  : 'text-blue-600 group-hover:text-blue-700'
              }`}
            >
              {displayedPrice}
            </span>

            {/* Countdown jika penjualan segera dibuka */}
            {isUpcomingSale && countdownInfo && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 w-fit">
                {lang === 'en' ? 'Opens' : 'Buka'} {countdownInfo.formatted}
              </span>
            )}
          </div>

          {/* Sisi Kanan: Tombol Beli Tiket */}
          <div
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
              isEventSoldOut
                ? 'bg-slate-200 text-slate-500 border border-slate-300/80 shadow-none cursor-not-allowed'
                : isSaleEnded
                ? 'bg-slate-200 text-slate-500 border border-slate-300/80 shadow-none cursor-not-allowed'
                : isUpcomingSale
                ? 'bg-slate-100 text-slate-600 border border-slate-300/80 shadow-2xs cursor-not-allowed'
                : displayedPrice === 'Coming Soon'
                ? 'bg-amber-600 text-white group-hover:bg-amber-700 shadow-amber-600/20 group-hover:scale-105'
                : 'bg-blue-600 text-white group-hover:bg-blue-700 shadow-blue-600/25 group-hover:scale-105 active:scale-95'
            }`}
          >
            {isUpcomingSale ? (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{lang === 'en' ? 'Soon' : 'Segera'}</span>
              </>
            ) : isSaleEnded ? (
              <span>{lang === 'en' ? 'Ended' : 'Berakhir'}</span>
            ) : isEventSoldOut ? (
              <span>Sold Out</span>
            ) : displayedPrice === 'Coming Soon' ? (
              <span>Coming Soon</span>
            ) : (
              <>
                <span>{lang === 'en' ? 'Buy Ticket' : 'Beli Tiket'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
