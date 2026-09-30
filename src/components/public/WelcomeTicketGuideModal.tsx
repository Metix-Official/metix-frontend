'use client';

import React, { useState } from 'react';
import {
  X,
  Ticket,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { TicketPurchaseGuideModal } from './TicketPurchaseGuideModal';

interface WelcomeTicketGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderTicket: () => void;
}

export const WelcomeTicketGuideModal: React.FC<WelcomeTicketGuideModalProps> = ({
  isOpen,
  onClose,
  onOrderTicket,
}) => {
  const [isWideGuideOpen, setIsWideGuideOpen] = useState(false);

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

            {/* Central Visual Poster (3D Concert Pass Artwork - Light Clean Presentation) */}
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-100 aspect-square group">
              <img
                src="/metix_popup_ticket.jpg"
                alt="Metix 3D Concert Ticket Pass"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Subtle Overlay Badge (Light Glassmorphic) */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 flex items-center justify-between text-slate-800 text-[11px] font-bold shadow-xs">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Garansi Resmi 100%
                </span>
                <span className="text-slate-500 text-[10px]">QR Instant</span>
              </div>
            </div>

            {/* 2 Action Buttons (Sesuai Permintaan) */}
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

              {/* BUTTON 1: Informasi Cara Beli Tiket (Membuka Wide Modal Panduan Kelas Dunia) */}
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

      {/* WIDE MODAL PANDUAN LANGKAH-DEMI-LANGKAH DENGAN MOCKUP SMARTPHONE REALISTIS & STICKY NAV */}
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
