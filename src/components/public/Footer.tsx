'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Sparkles, Ticket, Headphones } from 'lucide-react';

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

// ==========================================
// LOGO METODE PEMBAYARAN RESMI METIX (Gateway DOKU & Bank)
// ==========================================

const QrisLogo: React.FC = () => (
  <div className="flex items-center justify-center select-none">
    <svg viewBox="0 0 62 20" className="h-4.5 w-auto">
      <text x="2" y="15" fill="#0f172a" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" letterSpacing="-0.5px">Q</text>
      <rect x="15" y="10" width="3.5" height="5.5" fill="#e11d48" rx="0.5" />
      <text x="19.5" y="15" fill="#0f172a" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" letterSpacing="-0.5px">RIS</text>
    </svg>
  </div>
);

const BcaLogo: React.FC = () => (
  <div className="flex items-center gap-1.5 select-none">
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-[#0060af]">
      <path d="M10 1L2 10l8 9 8-9L10 1zm0 4.5l4.5 4.5-4.5 4.5-4.5-4.5L10 5.5z" />
    </svg>
    <span className="font-black text-xs sm:text-sm tracking-tight text-[#0060af]">BCA</span>
  </div>
);

const MandiriLogo: React.FC = () => (
  <div className="flex flex-col items-center select-none relative pt-1">
    <svg viewBox="0 0 28 8" className="w-6 h-2 absolute top-0 right-0 fill-amber-400">
      <path d="M0 6c8-8 18-4 28-6-4 4-12 7-28 6z" />
    </svg>
    <span className="font-extrabold text-[11px] sm:text-xs tracking-tight text-[#002d62] leading-none">mandiri</span>
  </div>
);

const BniLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <svg viewBox="0 0 8 14" className="w-2 h-3.5 fill-[#005e6a]">
      <path d="M5 0H8L3 14H0L5 0Z" />
    </svg>
    <span className="font-black text-xs sm:text-sm tracking-tight text-[#f15a24]">BNI</span>
  </div>
);

const BriLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] border-2 border-[#00529c] flex items-center justify-center">
      <span className="font-black text-[8px] sm:text-[9px] text-[#00529c] leading-none">B</span>
    </div>
    <span className="font-black text-xs sm:text-sm tracking-tight text-[#00529c]">BRI</span>
  </div>
);

const BtnLogo: React.FC = () => (
  <div className="relative inline-flex items-center select-none font-bold text-xs sm:text-sm text-[#00529c]">
    <span>bt</span>
    <span className="relative">
      n
      <span className="absolute -top-1 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
    </span>
  </div>
);

const BsiLogo: React.FC = () => (
  <div className="relative inline-flex items-center select-none font-black text-xs sm:text-sm tracking-tight text-[#00a39d]">
    <span>BS</span>
    <span className="relative">
      I
      <span className="absolute -top-1.5 -right-2 text-amber-500 text-[9px] leading-none">★</span>
    </span>
  </div>
);

const PermataLogo: React.FC = () => (
  <div className="flex flex-col items-center select-none">
    <svg viewBox="0 0 18 18" className="w-3.5 h-3.5 fill-[#0066b2]">
      <path d="M9 1l6 4-6 12L3 5z" />
    </svg>
    <span className="text-[7.5px] sm:text-[8px] font-bold text-[#0066b2] leading-tight mt-0.5">Permata Bank</span>
  </div>
);

const CimbLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <svg viewBox="0 0 12 14" className="w-2.5 h-3.5 fill-[#ed1c24]">
      <path d="M0 0l10 7-10 7V0z" />
    </svg>
    <div className="flex flex-col leading-none">
      <span className="font-black text-[9px] text-[#7d0000] tracking-tight">CIMB</span>
      <span className="font-bold text-[7px] text-[#ed1c24] tracking-tighter">NIAGA</span>
    </div>
  </div>
);

const VisaLogo: React.FC = () => (
  <svg viewBox="0 0 52 16" className="h-3.5 sm:h-4 w-auto select-none">
    <text x="0" y="13.5" fill="#1a1f71" fontFamily="system-ui, sans-serif" fontWeight="900" fontStyle="italic" fontSize="16" letterSpacing="0.5px">VISA</text>
    <path d="M1 3.5l4.5 0-1 4.5z" fill="#f59e0b" />
  </svg>
);

const MastercardLogo: React.FC = () => (
  <div className="flex flex-col items-center select-none">
    <div className="flex -space-x-1.5 items-center">
      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#eb001b]" />
      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#f79e1b] opacity-90" />
    </div>
    <span className="text-[7px] sm:text-[7.5px] font-bold text-slate-800 leading-none mt-0.5 tracking-tight">mastercard</span>
  </div>
);

const GopayLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#00aed6] flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-white" />
    </div>
    <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900">gopay</span>
  </div>
);

const OvoLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#4c3494] flex items-center justify-center p-0.5">
      <div className="w-2 h-2 rounded-full border-[1.5px] border-white" />
    </div>
    <span className="font-black text-xs sm:text-sm tracking-tight text-[#4c3494]">ovo</span>
  </div>
);

const DanaLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#118eea] flex items-center justify-center">
      <span className="text-white font-black text-[8px] sm:text-[9px] leading-none">D</span>
    </div>
    <span className="font-black text-xs sm:text-sm tracking-tight text-[#118eea]">DANA</span>
  </div>
);

const ShopeePayLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none text-[#ee4d2d]">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] bg-[#ee4d2d] text-white flex items-center justify-center font-black text-[9px] shadow-2xs">
      S
    </div>
    <span className="font-extrabold text-xs sm:text-sm tracking-tight">Pay</span>
  </div>
);

const LinkAjaLogo: React.FC = () => (
  <div className="flex items-center gap-1 select-none">
    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] bg-[#e31e25] text-white flex items-center justify-center font-black text-[8px] sm:text-[9px] shadow-2xs leading-none">
      <span className="text-amber-300 font-black mr-0.2">i</span>!
    </div>
    <span className="font-black text-[11px] sm:text-xs tracking-tight text-[#e31e25]">LinkAja!</span>
  </div>
);

const IndomaretLogo: React.FC = () => (
  <div className="rounded-[3px] border border-slate-300 overflow-hidden flex flex-col w-12 sm:w-13 select-none shadow-2xs">
    <div className="h-1 bg-[#005ba9]" />
    <div className="h-3 sm:h-3.5 bg-[#e21a22] flex items-center justify-center px-0.5">
      <span className="text-[7px] sm:text-[7.5px] font-black text-white tracking-tighter">Indomaret</span>
    </div>
    <div className="h-1 bg-[#ffcb05]" />
  </div>
);

const AlfamartLogo: React.FC = () => (
  <div className="flex flex-col items-center select-none">
    <span className="font-black text-[10px] sm:text-[11.5px] text-[#e21a22] tracking-tight leading-none">Alfamart</span>
    <div className="w-9 h-0.5 bg-amber-400 rounded-full mt-0.5" />
  </div>
);

const PAYMENT_METHODS = [
  { name: 'QRIS', component: QrisLogo },
  { name: 'BCA Virtual Account', component: BcaLogo },
  { name: 'Mandiri Virtual Account', component: MandiriLogo },
  { name: 'BNI Virtual Account', component: BniLogo },
  { name: 'BRI Virtual Account', component: BriLogo },
  { name: 'BTN Virtual Account', component: BtnLogo },
  { name: 'BSI Virtual Account', component: BsiLogo },
  { name: 'Permata Bank', component: PermataLogo },
  { name: 'CIMB Niaga', component: CimbLogo },
  { name: 'VISA', component: VisaLogo },
  { name: 'Mastercard', component: MastercardLogo },
  { name: 'GoPay', component: GopayLogo },
  { name: 'OVO', component: OvoLogo },
  { name: 'DANA', component: DanaLogo },
  { name: 'ShopeePay', component: ShopeePayLogo },
  { name: 'LinkAja', component: LinkAjaLogo },
  { name: 'Indomaret', component: IndomaretLogo },
  { name: 'Alfamart', component: AlfamartLogo },
];

export const Footer: React.FC<FooterProps> = ({ lang = 'id' }) => {
  return (
    <footer className="relative bg-gradient-to-b from-slate-50/60 via-slate-50 to-slate-100/80 border-t border-slate-200/70 text-slate-600 text-xs overflow-hidden">
      {/* Soft Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 space-y-10 relative z-10">

        {/* 1. Main Navigation Links (5 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

          {/* Column 1: Brand & Bio */}
          <div className="space-y-3.5 col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-200">
              <img src="/mitex.png" alt="METIX Logo" className="h-7.5 w-auto object-contain" />
            </Link>
            <p className="text-[11.5px] text-slate-500 font-normal leading-relaxed pr-2">
              Platform penjualan tiket konser musik festival, tur hiburan, dan event spesial terpercaya di Indonesia dengan verifikasi transaksi instan.
            </p>
            <div className="pt-0.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-bold shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Sistem Aktif & Terlindungi</span>
              </div>
            </div>
          </div>

          {/* Column 2: Jelajahi Event */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'en' ? 'Explore Events' : 'Jelajahi Event'}</span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 font-medium text-xs">
              <li>
                <Link href="#events" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'Concert Schedules' : 'Jadwal Konser Musik'}
                </Link>
              </li>
              <li>
                <Link href="#events" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'Festivals & Tours' : 'Festival & Musikal Tour'}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'How to Buy Tickets' : 'Panduan Membeli Tiket'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Untuk Penyelenggara */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'en' ? 'For Promoters' : 'Untuk Penyelenggara'}</span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 font-medium text-xs">
              <li>
                <Link href="/dashboard/events" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-flex items-center gap-1.5 text-slate-700 font-semibold group">
                  <span>Buat Event Baru</span>
                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.2 rounded-full font-bold shadow-2xs group-hover:bg-emerald-100 transition-colors">0% Komisi</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/events" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  Dashboard Manajemen Tiket
                </Link>
              </li>
              <li>
                <Link href="/dashboard/pos" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  Scanner QR & Gate Check-in
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Bantuan & Legalitas */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'en' ? 'Support & Legal' : 'Bantuan & Legalitas'}</span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 font-medium text-xs">
              <li>
                <Link href="/terms" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'Terms of Service' : 'Syarat & Ketentuan Layanan'}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi Pengguna'}
                </Link>
              </li>
              <li>
                <a href="https://www.instagram.com/metix.id/" target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:translate-x-1 transition-all inline-block">
                  {lang === 'en' ? 'Customer Support' : 'Pusat Bantuan & CS Metix'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Komunitas Resmi */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-tight flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-pink-600" />
              <span>{lang === 'en' ? 'Official Community' : 'Komunitas Resmi'}</span>
            </h3>
            <p className="text-[11.5px] text-slate-500 font-normal leading-relaxed">
              Ikuti Instagram resmi kami untuk update jadwal konser terbaru dan info giveaway tiket gratis.
            </p>

            <a
              href="https://www.instagram.com/metix.id/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 hover:border-pink-300 text-slate-800 hover:text-slate-950 font-bold text-xs shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <InstagramIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xs text-slate-900 leading-tight">@metix.id</span>
                <span className="text-[9.5px] text-slate-400 font-medium">Official Instagram</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 ml-auto shrink-0 transition-colors" />
            </a>
          </div>

        </div>

        {/* 2. Pilihan Pembayaran Section (Metix Official Channels via DOKU Gateway) */}
        <div className="pt-8 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {lang === 'en' ? 'Payment Methods' : 'Pilihan Pembayaran'}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Didukung Pembayaran Otomatis & Terverifikasi
            </span>
          </div>

          {/* Grid Logo Badges (Official Channels: QRIS, VA, E-Wallet, Retail, Cards) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 max-w-4xl">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.name}
                className="h-11 sm:h-12 w-20 sm:w-24 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex items-center justify-center p-2 shrink-0 select-none"
                title={method.name}
              >
                <method.component />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Bottom Bar: Copyright & Security */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] font-medium">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-700 font-bold">METIX</strong>. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Sistem Pembayaran Aman Berlisensi Bank Indonesia</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
