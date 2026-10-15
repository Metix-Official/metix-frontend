'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Loader2, AlertCircle, Info, Sparkles, Mail, ExternalLink, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
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

  const getEmailProviderInfo = (emailAddress: string) => {
    const domain = emailAddress.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail.com')) {
      return {
        name: 'Gmail',
        inboxUrl: 'https://mail.google.com',
        spamUrl: 'https://mail.google.com/mail/u/0/#spam',
      };
    }
    if (domain.includes('yahoo.com') || domain.includes('ymail.com')) {
      return {
        name: 'Yahoo Mail',
        inboxUrl: 'https://mail.yahoo.com',
        spamUrl: 'https://mail.yahoo.com/d/folders/2',
      };
    }
    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return {
        name: 'Outlook',
        inboxUrl: 'https://outlook.live.com',
        spamUrl: 'https://outlook.live.com/mail/0/junkemail',
      };
    }
    return {
      name: 'Email',
      inboxUrl: 'mailto:',
      spamUrl: undefined,
    };
  };

  const provider = getEmailProviderInfo(email);

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
        <div className="flex items-center justify-between mb-3">
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
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kode verifikasi 6 digit telah dikirimkan ke:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-800 text-xs font-bold max-w-full shadow-2xs">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="break-all">{email}</span>
            </div>

            {/* Direct Email App Opener Button */}
            {provider.inboxUrl && (
              <a
                href={provider.inboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-extrabold transition-all hover:scale-105 active:scale-95 shadow-2xs"
              >
                <span>Buka {provider.name}</span>
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </a>
            )}
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 6 Digit Individual Input Boxes (Front & Center) */}
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
          <div className="text-center pt-1">
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
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Cek Spam
              </button>
            </p>
          </div>

          {/* Smart Email Helper (Clean, Spacious & Beautiful Typography) */}
          <div className="rounded-2xl border transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-indigo-50/40 border-slate-200/80 shadow-2xs">
            {/* Collapsible Card Header Bar */}
            <button
              type="button"
              onClick={() => setShowSpamGuide((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Inbox className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 leading-none">
                      Belum Menerima Kode?
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold whitespace-nowrap">
                      Tips Cepat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1">
                    Email sering masuk ke folder <strong className="text-slate-700">Spam</strong> atau <strong className="text-slate-700">Promosi</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-blue-600 shrink-0 ml-3 whitespace-nowrap">
                <span>{showSpamGuide ? 'Tutup' : '3 Cara Cepat'}</span>
                {showSpamGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Expanded Visual 3-Step Cards with Full Horizontal Breathing Room */}
            {showSpamGuide && (
              <div className="p-3.5 pt-0 border-t border-slate-200/70 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                <div className="space-y-2 pt-2.5">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 leading-tight">Cek Folder Spam atau Junk</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Buka menu folder di aplikasi email Anda dan periksa folder <strong className="text-slate-700">Spam</strong> atau <strong className="text-slate-700">Junk</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 leading-tight">Gunakan Pencarian "METIX"</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Ketik kata kunci <strong className="text-slate-700">"METIX OTP"</strong> pada kolom pencarian email Anda.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 leading-tight">Tandai "Bukan Spam"</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Klik <strong className="text-slate-700">"Laporkan bukan spam"</strong> agar email tiket selanjutnya selalu masuk ke kotak masuk utama.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Shortcut to Open Spam Folder */}
                {provider.spamUrl && (
                  <a
                    href={provider.spamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs hover:border-blue-400 group cursor-pointer mt-1"
                  >
                    <Mail className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Buka Folder Spam {provider.name} Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                )}
              </div>
            )}
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
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 leading-relaxed font-medium">
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
