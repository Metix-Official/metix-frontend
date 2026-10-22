'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Lock, ExternalLink } from 'lucide-react';

interface FooterProps {
  lang?: 'id' | 'en';
}

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export const Footer: React.FC<FooterProps> = ({ lang = 'id' }) => {
  return (
    <footer className="relative bg-gradient-to-b from-slate-50/60 via-slate-50 to-slate-100/80 border-t border-slate-200/70 text-slate-600 text-xs overflow-hidden">
      {/* Soft Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 space-y-12 relative z-10">

        {/* 1. Main Navigation Links (5 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

          {/* Column 1: Brand & Bio */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-200">
              <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            </Link>
            <p className="text-[11.5px] text-slate-500 font-normal leading-relaxed pr-2">
              Platform penjualan tiket konser, musik festival, dan event spesial terpercaya di Indonesia.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Semua Sistem Aktif & Terlindungi</span>
            </div>
          </div>

          {/* Column 2: Jelajahi Event */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
              {lang === 'en' ? 'Explore' : 'Jelajahi'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <Link href="#events" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'Upcoming Concerts' : 'Jadwal Konser Musik'}
                </Link>
              </li>
              <li>
                <Link href="#events" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'Music Festivals' : 'Festival & Tour'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'How to Buy Tickets' : 'Cara Membeli Tiket'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Penyelenggara (EO) */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
              {lang === 'en' ? 'Promoters' : 'Penyelenggara'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <Link href="/dashboard/events" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-flex items-center gap-1 text-slate-700 font-semibold">
                  <span>Buat Event Baru</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">0% Komisi</span>
                </Link>
              </li>
              <li>
                <a href="#events" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  Ticket Management System
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  Scanner QR Check-in
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Dukungan & Kebijakan */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
              {lang === 'en' ? 'Support & Legal' : 'Bantuan & Legal'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <Link href="/terms" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
                </Link>
              </li>
              <li>
                <a href="https://www.instagram.com/metix.id/" target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:translate-x-0.5 transition-all inline-block">
                  {lang === 'en' ? 'Customer Care' : 'Layanan Bantuan CS'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Official Social & Community */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="font-bold text-slate-900 text-xs tracking-wider uppercase">
              {lang === 'en' ? 'Community' : 'Komunitas Resmi'}
            </h3>
            <p className="text-[11.5px] text-slate-500 font-normal leading-relaxed">
              Ikuti Instagram resmi kami untuk update jadwal konser dan giveaway tiket gratis.
            </p>

            <a
              href="https://www.instagram.com/metix.id/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:border-pink-300 text-slate-700 hover:text-slate-900 font-bold text-[11.5px] shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <InstagramIcon className="w-3 h-3 text-white" />
              </div>
              <span className="truncate">@metix.id</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-auto shrink-0 transition-colors" />
            </a>
          </div>

        </div>

        {/* 2. Bottom Bar: Copyright & Payment Security */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] font-medium">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-700 font-bold">METIX</strong> (PT Metix Solusi Digital). All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Metode Pembayaran Resmi QRIS & Virtual Account</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
