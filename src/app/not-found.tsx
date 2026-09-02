'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans antialiased selection:bg-blue-600 selection:text-white">
      <div className="relative max-w-md w-full space-y-6">
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Icon */}
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-blue-500 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/10 animate-bounce duration-1000">
          <SearchX className="w-10 h-10" />
        </div>

        {/* 404 Headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-extrabold uppercase tracking-widest">
            ERROR 404 • NOT FOUND
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
            Maaf, halaman yang Anda tuju tidak ditemukan atau Anda tidak memiliki akses ke alamat ini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:scale-105"
          >
            <Home className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  );
}
