'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Loader2, AlertCircle } from 'lucide-react';
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

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(Array(6).fill(''));
      setTimer(60);
      setCanResend(false);
      setError(null);
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

      {/* Modal Dialog Box matching screenshot */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
        
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
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
            Kode verifikasi telah dikirim melalui email ke{' '}
            <strong className="text-slate-700 font-bold break-all">{email}</strong>
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

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
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-2xl border transition-all outline-none ${
                  digit
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
            </p>
          </div>

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${
              isComplete && !isVerifying
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
