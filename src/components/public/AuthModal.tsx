'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, UserCheck, Eye, EyeOff, Loader2, AlertCircle, Ticket, Building2, Sparkles, Mail, Lock, Info, KeyRound, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loginUser, registerUser, requestOtpApi, loginOtpApi, registerOtpApi, resetPasswordOtpApi, UserProfile, getStoredUser } from '@/lib/api';
import { getDefaultRoleDashboard } from '@/lib/roles';
import { OtpModal } from './OtpModal';
import Link from 'next/link';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const router = useRouter();

  // Login Form API State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // OTP Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Registration Form State based on User Schema
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDay, setBirthDay] = useState('1');
  const [birthMonth, setBirthMonth] = useState('Januari');
  const [birthYear, setBirthYear] = useState('2000');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<'BUYER' | 'EO'>('BUYER');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // Forgot Password Flow State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotResendTimer, setForgotResendTimer] = useState<number>(60);
  const [forgotCanResend, setForgotCanResend] = useState<boolean>(false);

  // Synchronize mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'register' ? 'register' : 'login');
      setLoginError(null);
      setRegisterError(null);
      setEmailTouched(false);
      setAgreeTerms(false);
      setAgreeDataProcessing(false);
      setAgreeMarketing(false);
      setIsOtpModalOpen(false);
      setForgotStep(1);
      setForgotError(null);
      setForgotSuccess(null);
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotResendTimer(60);
      setForgotCanResend(false);
    }
  }, [isOpen, initialMode]);

  // Resend Countdown Timer for Forgot Password OTP
  useEffect(() => {
    if (mode !== 'forgot_password' || forgotStep !== 2 || forgotCanResend) return;

    if (forgotResendTimer > 0) {
      const interval = setInterval(() => {
        setForgotResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setForgotCanResend(true);
    }
  }, [mode, forgotStep, forgotResendTimer, forgotCanResend]);

  if (!isOpen && !isOtpModalOpen) return null;

  const handleAuthCompletion = (userObj?: UserProfile | null) => {
    onClose();
    setIsOtpModalOpen(false);
    if (typeof window !== 'undefined') {
      const pendingRedirect = sessionStorage.getItem('metix_pending_redirect');
      if (pendingRedirect) {
        sessionStorage.removeItem('metix_pending_redirect');
        if (onSuccess) onSuccess();
        router.push(pendingRedirect);
        return;
      }
    }

    if (onSuccess) {
      onSuccess();
    } else if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (!pathname.includes('/events')) {
        const user = userObj || getStoredUser();
        const targetDashboard = getDefaultRoleDashboard(user);
        router.push(targetDashboard);
      }
    }
  };

  const handleApiLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    if (loginMethod === 'otp') {
      try {
        await requestOtpApi({ email: loginEmail, purpose: 'LOGIN' });
        setOtpTargetEmail(loginEmail);
        setOtpPurpose('LOGIN');
        setIsOtpModalOpen(true);
      } catch (err: any) {
        setLoginError(err.message || 'Gagal mengirimkan kode OTP login.');
      } finally {
        setIsSubmittingLogin(false);
      }
      return;
    }

    try {
      const res = await loginUser({
        email: loginEmail,
        password: loginPassword,
      });
      handleAuthCompletion(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Email atau password yang Anda masukkan salah.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const getFormattedBirthDate = () => {
    const monthNames: Record<string, string> = {
      Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06',
      Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12'
    };
    const monthNum = monthNames[birthMonth] || '01';
    const dayPadded = birthDay.padStart(2, '0');
    return `${birthYear}-${monthNum}-${dayPadded}`;
  };

  const handleApiRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!name.trim()) {
      setRegisterError('Nama lengkap wajib diisi.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailTouched(true);
      setRegisterError('Format email tidak valid. Masukkan email yang benar (contoh: nama@email.com).');
      return;
    }

    const emailDomain = email.trim().split('@')[1]?.toLowerCase() || '';
    const isDisposable = ['mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com'].includes(emailDomain);
    if (isDisposable) {
      setEmailTouched(true);
      setRegisterError(`Domain email sementara (${emailDomain}) tidak diizinkan. Silakan gunakan email resmi.`);
      return;
    }

    const cleanPhoneDigits = phone.trim().replace(/\D/g, '');
    if (!cleanPhoneDigits) {
      setRegisterError('Nomor telepon wajib diisi.');
      return;
    }

    if (cleanPhoneDigits.length < 9 || cleanPhoneDigits.length > 12 || !cleanPhoneDigits.startsWith('8')) {
      setRegisterError('Nomor telepon harus dimulai dari angka 8 dan terdiri dari 9-12 digit (contoh: 81234567890).');
      return;
    }

    const fullPhoneNumber = `+62${cleanPhoneDigits}`;

    if (!password || password.length < 8) {
      setRegisterError('Kata sandi wajib diisi minimal 8 karakter.');
      return;
    }

    setIsSubmittingRegister(true);

    try {
      // Request OTP for registration (with phone checking in backend)
      await requestOtpApi({
        email: email.trim(),
        purpose: 'REGISTER',
        phone: fullPhoneNumber,
      });
      setOtpTargetEmail(email.trim());
      setOtpPurpose('REGISTER');
      setIsOtpModalOpen(true);
    } catch (err: any) {
      setRegisterError(err.message || 'Gagal mengirim kode OTP registrasi.');
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleVerifyOtpModal = async (otpCode: string) => {
    if (otpPurpose === 'LOGIN') {
      const res = await loginOtpApi({
        email: otpTargetEmail,
        otp: otpCode,
      });
      handleAuthCompletion(res.user);
    } else {
      const cleanPhoneDigits = phone.trim().replace(/\D/g, '');
      const fullPhoneNumber = `+62${cleanPhoneDigits}`;
      const res = await registerOtpApi({
        name,
        email: otpTargetEmail,
        otp: otpCode,
        password,
        password_confirmation: password,
        role: registerRole,
        phone: fullPhoneNumber,
        gender: gender === 'male' ? 'MALE' : 'FEMALE',
        birth_date: getFormattedBirthDate(),
      });
      handleAuthCompletion(res.user);
    }
  };

  const handleResendOtpModal = async () => {
    await requestOtpApi({
      email: otpTargetEmail,
      purpose: otpPurpose,
    });
  };

  // Forgot Password: Step 1 Request OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setForgotError('Format email tidak valid. Masukkan format email yang benar.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      await requestOtpApi({
        email: emailTrimmed,
        purpose: 'RESET_PASSWORD',
      });
      setForgotStep(2);
      setForgotResendTimer(60);
      setForgotCanResend(false);
      setForgotSuccess('Kode OTP reset password telah dikirim ke email Anda.');
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengirim kode OTP reset password.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Forgot Password: Step 2 Resend OTP
  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || isSubmittingForgot) return;
    setForgotError(null);
    setForgotSuccess(null);
    setIsSubmittingForgot(true);

    try {
      await requestOtpApi({
        email: forgotEmail.trim(),
        purpose: 'RESET_PASSWORD',
      });
      setForgotResendTimer(60);
      setForgotCanResend(false);
      setForgotSuccess('Kode OTP baru telah berhasil dikirimkan ke email Anda.');
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Forgot Password: Step 2 Verify OTP & Save New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanOtp = forgotOtp.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Masukkan 6 digit kode OTP verifikasi yang dikirim ke email Anda.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('Kata sandi baru wajib minimal 8 karakter.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await resetPasswordOtpApi({
        email: forgotEmail.trim(),
        otp: cleanOtp,
        password: forgotNewPassword,
        password_confirmation: forgotConfirmPassword,
      });
      handleAuthCompletion(res.user);
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mereset kata sandi. Pastikan kode OTP yang dimasukkan benar.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Automatic Guest Login with guest@gmail.com / password
  const handleGuestLogin = async () => {
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      await loginUser({
        email: 'guest@gmail.com',
        password: 'password',
      });
      handleAuthCompletion();
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login sebagai Tamu (guest@gmail.com).');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysList = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const yearsList = Array.from({ length: 70 }, (_, i) => (2015 - i).toString());

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const currentEmailDomain = email.trim().split('@')[1]?.toLowerCase() || '';
  const isDisposableDomain = ['mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com'].includes(currentEmailDomain);
  const isEmailFormatValid = email.trim().length > 0 && emailRegex.test(email.trim()) && !isDisposableDomain;
  const isEmailFormatInvalid = emailTouched && email.trim().length > 0 && (!emailRegex.test(email.trim()) || isDisposableDomain);

  const isEmailError = Boolean(
    isEmailFormatInvalid ||
    (registerError &&
      (registerError.toLowerCase().includes('email') ||
        (registerError.toLowerCase().includes('terdaftar') &&
          !registerError.toLowerCase().includes('telepon') &&
          !registerError.toLowerCase().includes('phone') &&
          !registerError.toLowerCase().includes('nomor'))))
  );

  const cleanPhoneDigits = phone.trim().replace(/\D/g, '');
  const isPhoneFormatValid = cleanPhoneDigits.length >= 9 && cleanPhoneDigits.length <= 12 && cleanPhoneDigits.startsWith('8');

  const isPhoneError = Boolean(
    registerError &&
    (registerError.toLowerCase().includes('telepon') ||
      registerError.toLowerCase().includes('phone') ||
      registerError.toLowerCase().includes('nomor'))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-all animate-fade-in-up">
      {/* Backdrop overlay click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card Container with scrollable max height */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] z-10">

        {/* Fixed Top Header Bar: Back Arrow (if register or forgot password mode) & Close X */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-0 shrink-0 relative z-20">
          {mode === 'register' || mode === 'forgot_password' ? (
            <button
              onClick={() => {
                if (mode === 'forgot_password' && forgotStep === 2) {
                  setForgotStep(1);
                  setForgotError(null);
                  setForgotSuccess(null);
                } else {
                  setMode('login');
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors ml-auto shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="p-6 sm:p-8 pt-2 overflow-y-auto space-y-5 flex-1 scrollbar-thin">

          {mode === 'login' ? (
            /* ================= LOGIN MODE (WITH REAL API /LOGIN INTEGRATION) ================= */
            <div className="space-y-5">
              {/* Header Title */}
              <div className="text-center space-y-1.5">
                <img src="/mitex.png" alt="METIX Logo" className="h-8 w-auto mx-auto object-contain mb-2" />
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Masuk ke Akun Anda
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Selamat datang kembali! Silakan masuk dengan Password atau OTP Email.
                </p>
              </div>

              {/* Login Method Segmented Control */}
              <div className="relative p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner grid grid-cols-2 gap-1 overflow-hidden">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md shadow-slate-900/10 border border-blue-600/30 transition-all duration-300 ease-out ${loginMethod === 'password' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
                    }`}
                />

                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`relative z-10 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${loginMethod === 'password' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`relative z-10 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${loginMethod === 'otp' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>OTP Email</span>
                </button>
              </div>

              {/* Login Error Notification */}
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Real Login Form */}
              <form onSubmit={handleApiLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {loginMethod === 'password' && (
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail || '');
                          setForgotStep(1);
                          setForgotError(null);
                          setForgotSuccess(null);
                          setForgotOtp('');
                          setForgotNewPassword('');
                          setForgotConfirmPassword('');
                          setMode('forgot_password');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingLogin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                      </>
                    ) : loginMethod === 'otp' ? (
                      'Kirim Kode OTP Login'
                    ) : (
                      'Masuk ke Akun'
                    )}
                  </button>
                </div>
              </form>

              {/* Switch to Register */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  Belum punya akun?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </div>
          ) : mode === 'forgot_password' ? (
            /* ================= FORGOT PASSWORD MODE (RESET WITH OTP) ================= */
            <div className="space-y-5">
              {/* Header Title */}
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-2 shadow-2xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {forgotStep === 1 ? 'Atur Ulang Kata Sandi' : 'Buat Kata Sandi Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
                  {forgotStep === 1
                    ? 'Masukkan alamat email Anda untuk menerima kode OTP verifikasi reset password.'
                    : `Kode OTP verifikasi telah dikirim ke ${forgotEmail}. Silakan masukkan kode dan buat password baru.`}
                </p>
              </div>

              {/* Error Alert */}
              {forgotError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success Alert */}
              {forgotSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                /* Step 1: Request OTP by Email */
                <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Alamat Email Akun
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="Masukkan email Anda (contoh: nama@email.com)"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  {/* Spam Folder Note */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs font-medium flex items-start gap-2.5 shadow-2xs">
                    <div className="p-1 rounded-lg bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-amber-950">Catatan:</span> Pastikan email yang dimasukkan sudah pernah terdaftar. Kode OTP akan dikirimkan ke kotak masuk atau folder <strong className="font-bold underline decoration-amber-400">Spam/Junk</strong>.
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingForgot || !forgotEmail.trim()}
                      className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingForgot ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Mengirimkan OTP...
                        </>
                      ) : (
                        'Kirim Kode OTP Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Input OTP & New Password */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Kode OTP */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Kode OTP (6 Digit)
                      </label>
                      <button
                        type="button"
                        onClick={handleResendForgotOtp}
                        disabled={!forgotCanResend || isSubmittingForgot}
                        className={`text-[11px] font-bold ${
                          forgotCanResend ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {forgotCanResend ? 'Kirim Ulang Kode' : `Kirim Ulang (${forgotResendTimer}s)`}
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setForgotOtp(val);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="Contoh: 123456"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold tracking-widest text-center text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  {/* Password Baru */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={forgotNewPassword}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          if (forgotError) setForgotError(null);
                        }}
                        placeholder="Minimal 8 karakter"
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password Baru */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Ulangi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          if (forgotError) setForgotError(null);
                        }}
                        placeholder="Masukkan kembali kata sandi baru"
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingForgot || forgotOtp.length !== 6 || forgotNewPassword.length < 8 || forgotNewPassword !== forgotConfirmPassword}
                      className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingForgot ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Password...
                        </>
                      ) : (
                        'Simpan Kata Sandi & Masuk'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Back to Login Footer */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  Sudah ingat kata sandi Anda?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Masuk ke Akun
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ================= REGISTER MODE (REAL API /REGISTER INTEGRATION) ================= */
            <div className="space-y-5">
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Lengkapi Profil Anda
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Masukkan detail Anda di bawah ini untuk melanjutkan
                </p>
              </div>

              {/* Register Error Notification */}
              {registerError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* Registration Form Fields */}
              <form onSubmit={handleApiRegisterSubmit} className="space-y-4">
                {/* Peran / Role Akun (Animated Segmented Tab Control) */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Daftar Sebagai</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 animate-in fade-in-50 duration-200">
                      {registerRole === 'BUYER' ? 'Akun Pembeli' : 'Akun Pengelenggara'}
                    </span>
                  </label>
                  <div className="relative p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner grid grid-cols-2 gap-1 overflow-hidden">
                    {/* Animated Sliding Background Indicator */}
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md shadow-slate-900/10 border border-blue-600/30 transition-all duration-300 ease-out ${registerRole === 'BUYER' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
                        }`}
                    />

                    {/* Tab 1: Pembeli Tiket */}
                    <button
                      type="button"
                      onClick={() => setRegisterRole('BUYER')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${registerRole === 'BUYER'
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Ticket className={`w-3.5 h-3.5 transition-transform duration-300 ${registerRole === 'BUYER' ? 'scale-110 text-blue-600' : 'text-slate-400'}`} />
                      <span>Pembeli Tiket</span>
                    </button>

                    {/* Tab 2: Event Organizer (EO) */}
                    <button
                      type="button"
                      onClick={() => setRegisterRole('EO')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${registerRole === 'EO'
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 transition-transform duration-300 ${registerRole === 'EO' ? 'scale-110 text-blue-600' : 'text-slate-400'}`} />
                      <span>Event Organizer (EO)</span>
                    </button>
                  </div>

                  {/* Role Detail Description Banner & OTP Note */}
                  <div className="space-y-2 overflow-hidden">

                    {/* Notice Card for OTP Email */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs font-medium flex items-start gap-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 shadow-xs">
                      <div className="p-1 rounded-lg bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[11px] leading-relaxed">
                        <span className="font-bold text-amber-950">Catatan:</span> Kode OTP tidak muncul di <strong className="font-bold text-amber-900">Inbox</strong>? Cek folder <strong className="font-bold text-amber-900 underline decoration-amber-400">Spam</strong> atau <strong className="font-bold text-amber-900">Junk</strong> email Anda.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^a-zA-Z\s'\.]/g, '');
                      setName(sanitized);
                      if (registerError) setRegisterError(null);
                    }}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    {isEmailFormatValid && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in-50">
                        ✓ Format email valid
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (registerError) setRegisterError(null);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="Masukkan email (contoh: nama@email.com)"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                      isEmailError || isEmailFormatInvalid
                        ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 bg-rose-50/20'
                        : isEmailFormatValid
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                    }`}
                  />
                  {(isEmailError || isEmailFormatInvalid) && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in-50">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>
                        {isDisposableDomain
                          ? `Domain email (${currentEmailDomain}) tidak diizinkan. Gunakan email pribadi resmi.`
                          : isEmailFormatInvalid
                          ? 'Format email tidak valid. Masukkan format email yang benar (contoh: nama@email.com).'
                          : registerError}
                      </span>
                    </p>
                  )}
                </div>

                {/* Jenis Kelamin Cards (Animated Segmented Control) */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner grid grid-cols-2 gap-1 overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md shadow-slate-900/10 border border-blue-600/30 transition-all duration-300 ease-out ${gender === 'male' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
                        }`}
                    />

                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${gender === 'male'
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${gender === 'male' ? 'border-blue-600 bg-blue-600 scale-110' : 'border-slate-400 bg-white'}`}>
                        {gender === 'male' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50 duration-150" />}
                      </span>
                      <span>Laki – Laki ♂</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${gender === 'female'
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${gender === 'female' ? 'border-blue-600 bg-blue-600 scale-110' : 'border-slate-400 bg-white'}`}>
                        {gender === 'female' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50 duration-150" />}
                      </span>
                      <span>Perempuan ♀</span>
                    </button>
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={birthDay} onValueChange={setBirthDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tanggal" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysList.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={birthMonth} onValueChange={setBirthMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthsList.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={birthYear} onValueChange={setBirthYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsList.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Nomor Telepon */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Nomor Telepon <span className="text-rose-500">*</span>
                    </label>
                    {phone.length > 0 && (
                      <span className={`text-[11px] font-bold ${isPhoneFormatValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isPhoneFormatValid ? `✓ +62 ${phone}` : `+62 ${phone} (${phone.length}/11 digit)`}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    {/* Fixed +62 prefix badge with Indonesian Flag */}
                    <div className="absolute left-1 top-1 bottom-1 px-3 bg-slate-100/90 rounded-lg flex items-center gap-1.5 border border-slate-200/80 text-slate-800 text-xs font-bold select-none pointer-events-none z-10 shadow-2xs">
                      <span className="text-sm">🇮🇩</span>
                      <span>+62</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        // If user pastes or types with leading 62 or 0
                        if (val.startsWith('62')) val = val.slice(2);
                        if (val.startsWith('0')) val = val.slice(1);
                        val = val.slice(0, 12);
                        setPhone(val);
                        if (registerError) setRegisterError(null);
                      }}
                      placeholder="81234567890"
                      className={`w-full pl-[5.25rem] pr-4 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                        isPhoneError
                          ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 bg-rose-50/20'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                  </div>
                  {isPhoneError ? (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{registerError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium">
                      * Nomor diawali otomatis dengan kode negara +62. Masukkan mulai dari angka 8 (contoh: 81234567890).
                    </p>
                  )}
                </div>

                {/* Kata Sandi - User Custom Password Required */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Buat Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Buat kata sandi akun Anda (Minimal 8 karakter)"
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Persetujuan & Syarat Ketentuan (Consent Checkboxes) */}
                <div className="space-y-3 pt-3 text-left text-xs border-t border-slate-100">
                  {/* Checkbox 1 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-slate-600 leading-relaxed text-[11px] font-medium group-hover:text-slate-900 transition-colors">
                      Saya telah membaca dan menyetujui{' '}
                      <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="font-bold text-blue-600 hover:underline">
                        Syarat dan Ketentuan
                      </Link>{' '}
                      dan{' '}
                      <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="font-bold text-blue-600 hover:underline">
                        Kebijakan Privasi
                      </Link>{' '}
                      di METIX
                    </span>
                  </label>

                  {/* Checkbox 2 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeDataProcessing}
                      onChange={(e) => setAgreeDataProcessing(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-slate-600 leading-relaxed text-[11px] font-medium group-hover:text-slate-900 transition-colors">
                      Saya telah membaca dan memberikan persetujuan kepada METIX untuk memproses data pribadi saya sesuai dengan{' '}
                      <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="font-bold text-blue-600 hover:underline">
                        Pemrosesan Data Pribadi
                      </Link>
                    </span>
                  </label>

                  {/* Checkbox 3 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-slate-600 leading-relaxed text-[11px] font-medium group-hover:text-slate-900 transition-colors">
                      Saya bersedia menerima informasi terkini terkait event dan promosi di METIX
                    </span>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingRegister || !agreeTerms || !agreeDataProcessing || !isEmailFormatValid || !isPhoneFormatValid}
                    className={`w-full py-3.5 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${agreeTerms && agreeDataProcessing && isEmailFormatValid && isPhoneFormatValid && !isSubmittingRegister
                      ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20 cursor-pointer hover:scale-[1.01] active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
                      }`}
                  >
                    {isSubmittingRegister ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Mengirimkan OTP...
                      </>
                    ) : (
                      'Kirim Kode OTP Registrasi'
                    )}
                  </button>
                </div>
              </form>

              {/* Switch to Login */}
              <div className="text-center pt-1">
                <p className="text-xs text-slate-600 font-medium">
                  Sudah punya akun?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Masuk
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer: Terms & Privacy Notice */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-5 text-center text-[11px] text-slate-500 leading-relaxed font-medium rounded-b-3xl shrink-0">
          Dengan menggunakan website ini, membeli tiket, atau membuat akun, Anda setuju dengan{' '}
          <Link href="/terms" onClick={onClose} className="font-bold text-blue-600 hover:underline">
            Syarat Layanan & Kebijakan Privasi
          </Link>
        </div>

      </div>

      {/* Render OTP Popup Modal */}
      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onBack={() => setIsOtpModalOpen(false)}
        email={otpTargetEmail}
        onVerify={handleVerifyOtpModal}
        onResend={handleResendOtpModal}
        title="Masukkan Kode Verifikasi"
        submitButtonText={otpPurpose === 'REGISTER' ? 'Verifikasi & Buat Akun' : 'Verifikasi & Masuk'}
      />
    </div>
  );
};
