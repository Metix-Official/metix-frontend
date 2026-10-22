'use client';

import React from 'react';
import { AlertTriangle, Ban, Mail, MessageCircle, LogOut, ShieldAlert, ArrowRight } from 'lucide-react';
import { logoutUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface AccountStatusModalProps {
  isOpen: boolean;
  status: 'INACTIVE' | 'BLOCKED' | string;
  userName?: string;
  userEmail?: string;
  onClose?: () => void;
}

export const AccountStatusModal: React.FC<AccountStatusModalProps> = ({
  isOpen,
  status,
  userName,
  userEmail,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const normalizedStatus = (status || '').toUpperCase();
  const isBlocked = normalizedStatus === 'BLOCKED';

  const handleLogout = () => {
    logoutUser();
    if (onClose) onClose();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Permohonan Pengaktifan Kembali Akun Metix - ${userName || userEmail || 'Pengguna'}`);
    const body = encodeURIComponent(
      `Halo Tim Metix Support,\n\nSaya ingin mengajukan permohonan pengaktifan kembali akun Metix saya yang saat ini berstatus nonaktif:\n\nNama: ${userName || '-'}\nEmail: ${userEmail || '-'}\n\nMohon bantuannya untuk meninjau status akun saya.\n\nTerima kasih.`
    );
    window.open(`mailto:support@metix.id?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Banner */}
        <div className={`p-8 pb-6 flex flex-col items-center justify-center ${
          isBlocked ? 'bg-gradient-to-b from-rose-50 to-white' : 'bg-gradient-to-b from-amber-50 to-white'
        }`}>
          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-4 ${
            isBlocked
              ? 'bg-rose-500 text-white shadow-rose-500/30 ring-8 ring-rose-100'
              : 'bg-amber-500 text-white shadow-amber-500/30 ring-8 ring-amber-100'
          }`}>
            {isBlocked ? <Ban className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
          </div>

          {/* Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
            isBlocked
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
            {isBlocked ? 'Akun Diblokir (Permanen)' : 'Akun Dinonaktifkan (Sementara)'}
          </span>

          {/* Title */}
          <h2 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
            {isBlocked ? 'Akses Akun Anda Telah Diblokir' : 'Akun Anda Dinonaktifkan'}
          </h2>
        </div>

        {/* Body Content */}
        <div className="px-8 pb-8 space-y-4">
          {isBlocked ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Akun Anda telah <strong className="text-rose-600">diblokir secara permanen</strong> dan{' '}
                <strong className="text-slate-900">tidak dapat dikembalikan</strong> karena terindikasi melanggar 
                ketentuan serta kebijakan yang berlaku di Aplikasi Web Metix.
              </p>
              
              <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl text-left text-xs font-medium text-rose-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900 mb-0.5">Pelanggaran Syarat & Ketentuan</p>
                  <p className="leading-relaxed">
                    Sistem mendeteksi aktivitas yang melanggar ketentuan operasional Metix. Seluruh akses fitur pembelian tiket, tiket aktif, dan hak akses dashboard Anda telah ditutup secara permanen.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Akun Anda saat ini berstatus <strong className="text-amber-700">Inactive (Nonaktif)</strong> oleh tim Administrator. 
                Anda tidak dapat mengakses halaman tiket atau melakukan transaksi hingga akun diaktifkan kembali.
              </p>

              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-left text-xs font-medium text-amber-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950 mb-0.5">Cara Mengembalikan Akun</p>
                  <p className="leading-relaxed">
                    Silakan hubungi pihak Metix untuk melakukan verifikasi data dan pembukaan kembali akun Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Info Capsule */}
          {(userName || userEmail) && (
            <div className="py-2.5 px-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{userName || 'Pengguna Metix'}</span>
              <span className="font-mono text-slate-500">{userEmail}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            {!isBlocked && (
              <>
                {/* Official Instagram Button */}
                <a
                  href="https://www.instagram.com/metix.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 group-hover:rotate-6 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Hubungi via Instagram @metix.id</span>
                </a>

                {/* Email Support Button */}
                <button
                  type="button"
                  onClick={handleContactSupport}
                  className="w-full h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer hover:shadow-lg"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim Email Bantuan Metix</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`w-full h-11 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isBlocked
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
