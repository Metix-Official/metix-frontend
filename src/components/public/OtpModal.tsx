'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Loader2, AlertCircle, Info, Sparkles, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  email: string;
  onVerify: (otpCode: string) => Promise<void>;
  onResend: () => Promise<void>;
  title?: string;
  submitButtonText?: string;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  onBack,
  email,
  onVerify,
  onResend,
  title = 'Masukkan Kode Verifikasi',
  submitButtonText = 'Verifikasi Kode OTP',
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSpamGuide, setShowSpamGuide] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(Array(6).fill(''));
      setTimer(60);
      setCanResend(false);
      setError(null);
      setShowSpamGuide(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (!isOpen || canResend) return;

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [isOpen, timer, canResend]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const lastChar = cleanValue.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);
    setError(null);

    // Auto-focus next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = Array(6).fill('');
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    setError(null);

    const nextFocusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleResendClick = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError(null);

    try {
      await onResend();
      setTimer(60);
      setCanResend(false);
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      await onVerify(otpCode);
    } catch (err: any) {
      setError(err.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-fade-in-up">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box matching screenshot with max-height and scrolling */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto scrollbar-thin">

        {/* Top Bar: Back Arrow & Close Button */}
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Header */}
        <div className="text-center space-y-2.5 mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <div className="space-y-1.5 px-1">
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Kode verifikasi telah dikirim ke:
            </p>
            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-800 text-xs font-bold max-w-full shadow-2xs">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="break-all">{email}</span>
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Edukasi Folder Spam & Junk Alert Card */}
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs text-left shadow-xs transition-all animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 shadow-2xs">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[12px] text-amber-950">
                  Catatan Penting OTP
                </span>
                <button
                  type="button"
                  onClick={() => setShowSpamGuide((prev) => !prev)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-400 hover:decoration-amber-600 transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{showSpamGuide ? 'Tutup Contoh' : 'Lihat Contoh'}</span>
                  {showSpamGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                Kode OTP tidak muncul di <strong className="font-bold text-amber-950">Inbox</strong>? Cek folder <strong className="font-bold text-amber-950 underline decoration-amber-400">Spam</strong> atau <strong className="font-bold text-amber-950">Junk</strong> email Anda.
              </p>

              {/* Panduan & Contoh Interaktif */}
              {showSpamGuide && (
                <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-2.5 text-[11px] text-amber-950 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Contoh langkah menemukan kode OTP di Email:
                  </p>

                  <div className="space-y-1.5 pl-0.5 text-[11px] font-medium text-amber-900/90">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Buka aplikasi Gmail atau aplikasi email yang Anda gunakan.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Buka menu folder di sebelah kiri (<strong className="font-bold">☰</strong>).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Pilih folder <strong className="font-bold bg-amber-200/70 px-1 py-0.5 rounded text-amber-950">Spam</strong> atau <strong className="font-bold bg-amber-200/70 px-1 py-0.5 rounded text-amber-950">Junk</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>Temukan email dengan subjek <strong className="font-bold text-amber-950">"Kode Verifikasi OTP METIX"</strong> lalu salin 6 digit kode tersebut.</span>
                    </div>
                  </div>

                  {/* Quick Shortcut for Gmail Users */}
                  {email.toLowerCase().includes('@gmail.com') && (
                    <div className="pt-1">
                      <a
                        href="https://mail.google.com/mail/u/0/#spam"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300/80 text-amber-900 font-bold text-[11px] hover:bg-amber-100/60 transition-colors shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        <span>Buka Folder Spam Gmail Sekarang</span>
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                      </a>
                    </div>
                  )}

                  {/* Tips box */}
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/70 text-[10.5px] leading-relaxed text-amber-900 flex items-start gap-2 mt-1">
                    <span className="font-extrabold text-amber-950 shrink-0">💡 Tips:</span>
                    <span>Di dalam email, klik tombol <strong>"Laporkan bukan spam"</strong> atau pindahkan ke Inbox agar email tiket pembelian Anda selanjutnya selalu masuk ke kotak masuk utama.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Individual Input Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-2xl border transition-all outline-none ${digit
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 text-slate-900 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/15'
                  }`}
              />
            ))}
          </div>

          {/* Resend OTP Timer / Link */}
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium">
              Tidak menerima kode?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendClick}
                  disabled={isResending}
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    'Kirim Ulang Kode'
                  )}
                </button>
              ) : (
                <span className="text-slate-400">
                  Kirim Ulang ({timer} detik)
                </span>
              )}
              <span className="mx-1.5 text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setShowSpamGuide((prev) => !prev)}
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Cek Spam
              </button>
            </p>
          </div>

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${isComplete && !isVerifying
              ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20 cursor-pointer active:scale-98'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi Kode...
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </form>

        {/* Security Footer Disclaimer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 leading-relaxed font-medium">
          Jika Anda tidak meminta perubahan ini atau akun Anda diretas, segera kunjungi{' '}
          <Link href="/terms" className="font-bold text-blue-600 hover:underline">
            Pusat Bantuan
          </Link>
          .
        </div>

      </div>
    </div>
  );
};
