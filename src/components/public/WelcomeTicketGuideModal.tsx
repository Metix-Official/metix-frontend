'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  MapPin,
} from 'lucide-react';
import { TicketPurchaseGuideModal } from './TicketPurchaseGuideModal';
import { ApiEvent, getPhotoUrl } from '@/lib/api';
import { computeEventPricing } from '@/lib/ticketUtils';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80';

interface WelcomeTicketGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderTicket: () => void;
  featuredEvent?: ApiEvent | null;
}

export const WelcomeTicketGuideModal: React.FC<WelcomeTicketGuideModalProps> = ({
  isOpen,
  onClose,
  onOrderTicket,
  featuredEvent,
}) => {
  const [isWideGuideOpen, setIsWideGuideOpen] = useState(false);

  const targetEvent = featuredEvent || null;

  const dateFormatted = useMemo(() => {
    const startDateStr =
      targetEvent?.start_at ||
      targetEvent?.event_start_at ||
      targetEvent?.start_time;

    if (startDateStr) {
      try {
        const d = new Date(startDateStr);
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {}
    }
    return '27 Des 2026';
  }, [targetEvent]);

  const venueFormatted = useMemo(() => {
    if (!targetEvent) return 'Pangkalan Brandan';
    if (targetEvent.venue) {
      if (typeof targetEvent.venue === 'object') {
        return targetEvent.venue.name || targetEvent.venue.city || 'Pangkalan Brandan';
      }
      return String(targetEvent.venue);
    }
    return targetEvent.location || 'Pangkalan Brandan';
  }, [targetEvent]);

  const minPrice = useMemo(() => {
    if (!targetEvent) return 'Rp 180.000';
    if (targetEvent.ticket_types && targetEvent.ticket_types.length > 0) {
      const pricing = computeEventPricing(targetEvent.ticket_types, targetEvent.status);
      return pricing.priceStr !== 'Coming Soon' ? pricing.priceStr : 'Rp 180.000';
    }
    return 'Rp 180.000';
  }, [targetEvent]);

  const rawBanner = targetEvent?.banner || (targetEvent as any)?.banner_url;
  const eventId = targetEvent?.id;
  const initialBannerUrl = getPhotoUrl(rawBanner, eventId) || DEFAULT_BANNER;

  const [imgSrc, setImgSrc] = useState<string>(initialBannerUrl || DEFAULT_BANNER);

  useEffect(() => {
    const url = getPhotoUrl(rawBanner, eventId) || DEFAULT_BANNER;
    setImgSrc(url || DEFAULT_BANNER);
  }, [rawBanner, eventId]);

  const handleImageError = () => {
    if (imgSrc !== DEFAULT_BANNER) {
      setImgSrc(DEFAULT_BANNER);
    }
  };

  if (!isOpen) return null;

  const handleOrderClick = () => {
    onClose();
    onOrderTicket();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
        {/* Container Card with External Close X Button */}
        <div
          className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-visible animate-in zoom-in-95 duration-200 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Floating Close Button X in top right corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md border border-slate-200 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Modal Card Content (Bersih, Ramping, & Menarik) */}
          <div className="p-5 sm:p-6 space-y-3.5 text-center">
            {/* Header: Bersih & Menarik */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-bold text-blue-700">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Event Rekomendasi</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug line-clamp-1">
                {targetEvent?.title || 'Konser Musik & Festival'}
              </h3>
            </div>

            {/* Poster Banner Bersih (Tanpa Badge Menumpuk) */}
            <div
              onClick={handleOrderClick}
              className="relative w-full aspect-[16/10] sm:h-44 rounded-2xl overflow-hidden shadow-xs border border-slate-100 bg-slate-900 cursor-pointer group shrink-0"
              title="Klik untuk langsung pesan tiket"
            >
              <img
                src={imgSrc}
                alt={targetEvent?.title || 'Event Metix'}
                onError={handleImageError}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Single Clean Status Pill on Top-Right */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tersedia</span>
                </span>
              </div>
            </div>

            {/* Informasi Tanggal, Lokasi, & Harga */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{dateFormatted}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{venueFormatted}</span>
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium pt-0.5">
                Mulai dari <strong className="text-base font-black text-blue-600">{minPrice}</strong>
              </div>
            </div>

            {/* Tombol Aksi (1 Tombol Utama + 1 Link Panduan Bersih) */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOrderClick}
                className="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Pesan Tiket Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsWideGuideOpen(true)}
                className="w-full py-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>Lihat Panduan Beli Tiket</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WIDE MODAL PANDUAN */}
      <TicketPurchaseGuideModal
        isOpen={isWideGuideOpen}
        onClose={() => setIsWideGuideOpen(false)}
        onOrderTicket={() => {
          setIsWideGuideOpen(false);
          handleOrderClick();
        }}
      />
    </>
  );
};
