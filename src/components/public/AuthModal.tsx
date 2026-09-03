'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, UserCheck, Eye, EyeOff, Loader2, AlertCircle, Ticket, Building2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loginUser, registerUser, UserProfile, getStoredUser } from '@/lib/api';
import { getDefaultRoleDashboard } from '@/lib/roles';
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
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const router = useRouter();

  // Login Form API State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration Form State based on User Schema
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  // Synchronize mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginError(null);
      setRegisterError(null);
      setAgreeTerms(false);
      setAgreeDataProcessing(false);
      setAgreeMarketing(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleAuthCompletion = (userObj?: UserProfile | null) => {
    onClose();
    if (onSuccess) {
      onSuccess();
    } else if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // Only redirect to role dashboard if not currently completing checkout on an event page
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

  const handleApiRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setIsSubmittingRegister(true);

    const monthNames: Record<string, string> = {
      Januari: '01', Februari: '02', Maret: '03', April: '04', Mei: '05', Juni: '06',
      Juli: '07', Agustus: '08', September: '09', Oktober: '10', November: '11', Desember: '12'
    };
    const monthNum = monthNames[birthMonth] || '01';
    const dayPadded = birthDay.padStart(2, '0');
    const formattedBirthDate = `${birthYear}-${monthNum}-${dayPadded}`;

    const passToUse = password || 'password123';
    try {
      await registerUser({
        name,
        email,
        password: passToUse,
        password_confirmation: passToUse,
        role: registerRole,
        phone,
        gender: gender === 'male' ? 'Laki-Laki' : 'Perempuan',
        birth_date: formattedBirthDate,
      });
      handleAuthCompletion();
    } catch (err: any) {
      setRegisterError(err.message || 'Pendaftaran akun gagal. Silakan periksa data Anda.');
    } finally {
      setIsSubmittingRegister(false);
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

        {/* Fixed Top Header Bar: Back Arrow (if register mode) & Close X */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-0 shrink-0 relative z-20">
          {mode === 'register' ? (
            <button
              onClick={() => setMode('login')}
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
                  Selamat datang kembali! Silakan masukkan email & password Anda.
                </p>
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

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Kata Sandi
                    </label>
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

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmittingLogin}
                    className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingLogin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Memproses Login...
                      </>
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
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md shadow-slate-900/10 border border-blue-600/30 transition-all duration-300 ease-out ${
                        registerRole === 'BUYER' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
                      }`}
                    />

                    {/* Tab 1: Pembeli Tiket */}
                    <button
                      type="button"
                      onClick={() => setRegisterRole('BUYER')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                        registerRole === 'BUYER'
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
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                        registerRole === 'EO'
                          ? 'text-blue-700'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 transition-transform duration-300 ${registerRole === 'EO' ? 'scale-110 text-blue-600' : 'text-slate-400'}`} />
                      <span>Event Organizer (EO)</span>
                    </button>
                  </div>

                  {/* Role Detail Description Banner with Fade/Slide Animation */}
                  <div className="overflow-hidden">
                    {registerRole === 'BUYER' ? (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-700 font-medium flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        <Ticket className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Akun Pembeli: Cari event favorit, beli tiket resmi, dan dapatkan E-Ticket cepat.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 font-medium flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Akun Event Organizer: Buat event, kelola tiket, scanner QR & laporan transaksi.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Jenis Kelamin Cards (Animated Segmented Control) */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Jenis Kelamin
                  </label>
                  <div className="relative p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner grid grid-cols-2 gap-1 overflow-hidden">
                    {/* Animated Sliding Background Indicator */}
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md shadow-slate-900/10 border border-blue-600/30 transition-all duration-300 ease-out ${
                        gender === 'male' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                        gender === 'male'
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
                      className={`relative z-10 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                        gender === 'female'
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
                    Tanggal Lahir
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
                  <label className="text-xs font-bold text-slate-800">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                {/* Kata Sandi */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Kata Sandi (Opsional, Default: password123)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi (Minimal 6 karakter)"
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
                    disabled={isSubmittingRegister || !agreeTerms || !agreeDataProcessing}
                    className={`w-full py-3.5 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${
                      agreeTerms && agreeDataProcessing && !isSubmittingRegister
                        ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20 cursor-pointer hover:scale-[1.01] active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
                    }`}
                  >
                    {isSubmittingRegister ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan Akun...
                      </>
                    ) : (
                      'Simpan & Daftar Sekarang'
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
    </div>
  );
};
