'use me';
'use client';

import React from 'react';
import { ArrowRight, Ticket, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface OrganizerCTAProps {
  lang?: 'id' | 'en';
}

export const OrganizerCTA: React.FC<OrganizerCTAProps> = ({ lang = 'id' }) => {
  return (
    <section className="py-16 bg-white border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 p-8 sm:p-12 overflow-hidden shadow-xl shadow-blue-600/20">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-blue-50 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Ticket className="w-4 h-4 text-white" />{' '}
                {lang === 'en' ? 'For Event Organizers' : 'Untuk Penyelenggara Event'}
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {lang === 'en' ? (
                  <>
                    Host Your Event & Sell Tickets Easily on{' '}
                    <span className="text-blue-100 underline decoration-amber-300 decoration-wavy">
                      METIX
                    </span>
                  </>
                ) : (
                  <>
                    Punya Event? Jual Tiket Mudah di{' '}
                    <span className="text-blue-100 underline decoration-amber-300 decoration-wavy">
                      METIX
                    </span>
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                {lang === 'en'
                  ? 'Manage ticket sales, participant registration, and QR code check-in automatically with real-time analytics.'
                  : 'Kelola penjualan tiket, registrasi peserta, dan pemindaian QR code check-in secara otomatis dengan dashboard analitik real-time.'}
              </p>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-white pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-200" /> Dashboard Real-Time
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-200" />{' '}
                  {lang === 'en' ? 'Door QR Code Scanner' : 'QR Code Scanner Pintu'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-200" />{' '}
                  {lang === 'en' ? 'Fast Payouts' : 'Pencairan Cepat'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-lg hover:bg-blue-50 transition-all"
              >
                <span>{lang === 'en' ? 'Create Event Now' : 'Mulai Buat Event'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
