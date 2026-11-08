'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Ticket,
  ArrowRight,
  Sparkles,
  BookOpen,
  Tag,
} from 'lucide-react';
import { TicketPurchaseGuideModal } from './TicketPurchaseGuideModal';
import { ApiEvent, getPhotoUrl } from '@/lib/api';

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

  const eventCategory = targetEvent?.category || 'MUSIC CONCERT';

  const dateBadge = useMemo(() => {
    let month = 'DES';
    let day = '27';
    const startDateStr = targetEvent?.start_at || targetEvent?.event_start_at || targetEvent?.start_time;

    if (startDateStr) {
      try {
        const d = new Date(startDateStr);
        month = d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
        day = d.getDate().toString();
      } catch {}
    }
    return { month, day };
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Container Card with External Close X Button (Sesuai Referensi Gambar) */}
        <div
          className="relative w-full max-w-[360px] sm:max-w-[390px] bg-white rounded-[32px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.25)] border border-slate-100 overflow-visible animate-in zoom-in-95 duration-200 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Floating Circular Close Button X in top right corner (Sesuai Referensi Gambar - Light & Clean) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3.5 -right-3.5 z-30 w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border border-slate-200 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Modal Card Content */}
          <div className="p-6 sm:p-7 space-y-4 text-center">
            {/* Top Text Header (Ringkas & Elegan seperti referensi) */}
            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-black text-blue-700 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Metix Ticketing Pass</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Pesan Tiket Konser & Acara Favoritmu
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Dapatkan E-Tiket resmi terverifikasi dengan pemesanan instan dan aman.
              </p>
            </div>

            {/* Central Visual Poster (Dynamic Event Banner - Sesuai Gambar 2) */}
            <div
              onClick={handleOrderClick}
              className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-950 flex flex-col justify-between cursor-pointer group shrink-0"
              title="Klik untuk langsung pesan tiket"
            >
              <img
                src={imgSrc}
                alt={targetEvent?.title || 'Event Metix'}
                onError={handleImageError}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              {/* Subtle Dark Gradient Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

              {/* Top Row: Category Pill & Date Badge */}
              <div className="relative z-10 px-3.5 pt-3.5 flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-xs">
                  <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{eventCategory}</span>
                </span>

                <div className="px-3 py-1 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 backdrop-blur-md text-white font-black text-center shadow-lg shadow-blue-600/40 border border-blue-400/40 shrink-0">
                  <div className="text-[9px] text-blue-200 font-extrabold uppercase tracking-widest leading-none">
                    {dateBadge.month}
                  </div>
                  <div className="text-xs sm:text-sm font-black leading-tight">
                    {dateBadge.day}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Official Pass & Status Badge */}
              <div className="relative z-10 px-3.5 pb-2.5 flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white/90 tracking-wide flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-amber-300" />
                  <span>OFFICIAL PASS</span>
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>Tersedia</span>
                </span>
              </div>
            </div>

            {/* 2 Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* BUTTON 2: Pesan Tiket (High-Impact Hero CTA) */}
              <button
                type="button"
                onClick={handleOrderClick}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Ticket className="w-4 h-4 transition-transform group-hover:rotate-12" />
                <span>Pesan Tiket Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* BUTTON 1: Informasi Cara Beli Tiket (Membuka Wide Modal Panduan) */}
              <button
                type="button"
                onClick={() => setIsWideGuideOpen(true)}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:scale-110" />
                <span>Cara Beli Tiket (Lihat Panduan)</span>
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
