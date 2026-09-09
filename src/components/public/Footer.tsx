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

            <div className="flex items-center gap-2 max-w-xs">
              {/* Instagram Button */}
              <a
                href="https://www.instagram.com/metix.id?stkn=MWZ1bjhjYmx2M3RxeA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#d62976] hover:bg-[#c13584] text-white font-extrabold text-[11px] shadow-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram</span>
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
