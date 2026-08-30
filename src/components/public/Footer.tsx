'use me';
'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  lang?: 'id' | 'en';
}

export const Footer: React.FC<FooterProps> = ({ lang = 'id' }) => {
  return (
    <footer className="bg-[#fcfcfd] border-t border-slate-200/80 text-slate-600 text-xs py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* 5-Column Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          
          {/* Column 1: Metix */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            </Link>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  {lang === 'en' ? 'About Us' : 'Tentang Kami'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  {lang === 'en' ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Layanan Kami */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {lang === 'en' ? 'Our Services' : 'Layanan Kami'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Ticket Management System
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Cetak Tiket Gelang
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Web Development
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Dukungan */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {lang === 'en' ? 'Support' : 'Dukungan'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Customer Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Partnership
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Lainnya */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {lang === 'en' ? 'Others' : 'Lainnya'}
            </h3>
            <ul className="space-y-2 text-slate-600 font-medium text-xs">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  {lang === 'en' ? 'How to Buy Tickets' : 'Cara Membeli Tiket'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Mini Apps
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Ikuti Kami (Social Media Grid Buttons) */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {lang === 'en' ? 'Follow Us' : 'Ikuti Kami'}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {/* Instagram Button */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#d62976] hover:bg-[#c13584] text-white font-extrabold text-[11px] shadow-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>

              {/* Youtube Button */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white font-extrabold text-[11px] shadow-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Youtube</span>
              </a>

              {/* X Button */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#15202b] hover:bg-[#0f172a] text-white font-extrabold text-[11px] shadow-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X</span>
              </a>

              {/* Tiktok Button */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#111827] hover:bg-[#030712] text-white font-extrabold text-[11px] shadow-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.33 1.55-1.33 2.56.01 1.05.58 2.05 1.46 2.59.88.54 2.03.58 2.96.11.89-.45 1.51-1.37 1.58-2.38.07-3.68.03-7.37.04-11.05z"/>
                </svg>
                <span>Tiktok</span>
              </a>
            </div>
          </div>

        </div>

        {/* Horizontal Divider Line & Centered Copyright */}
        <div className="pt-6 border-t border-slate-200/80 text-center">
          <p className="text-[11px] sm:text-xs text-slate-500 font-extrabold tracking-tight">
            Metix © 2026. All rights reserved
          </p>
        </div>

      </div>
    </footer>
  );
};
