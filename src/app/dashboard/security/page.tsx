'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchUserProfile,
  UserProfile,
  fetchActiveSessions,
  revokeOtherSessions,
  updateAccountPassword,
  ActiveSession,
  SessionsResponse,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ShieldCheck,
  Lock,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Clock,
  Globe,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

function parseUserAgent(ua?: string | null): {
  os: string;
  browser: string;
  deviceType: 'laptop' | 'smartphone' | 'tablet';
} {
  if (!ua) {
    if (typeof navigator !== 'undefined') {
      ua = navigator.userAgent;
    } else {
      return { os: 'Desktop OS', browser: 'Web Browser', deviceType: 'laptop' };
    }
  }

  let os = 'Desktop OS';
  let deviceType: 'laptop' | 'smartphone' | 'tablet' = 'laptop';

  if (/windows nt 10/i.test(ua)) os = 'Windows 10 / 11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone/i.test(ua)) {
    os = 'iPhone (iOS)';
    deviceType = 'smartphone';
  } else if (/ipad/i.test(ua)) {
    os = 'iPad (iPadOS)';
    deviceType = 'tablet';
  } else if (/android/i.test(ua)) {
    os = 'Android Device';
    deviceType = 'smartphone';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS (Apple)';
  } else if (/linux/i.test(ua)) {
    os = 'Linux PC';
  }

  let browser = 'Web Browser';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browser = 'Apple Safari';

  return { os, browser, deviceType };
}

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sessions state
  const [sessionsData, setSessionsData] = useState<SessionsResponse | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Client device info fallback
  const clientDevice = React.useMemo(() => {
    return parseUserAgent(typeof navigator !== 'undefined' ? navigator.userAgent : null);
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [userProfile, sessions] = await Promise.all([
        fetchUserProfile(),
        fetchActiveSessions(),
      ]);
      setProfile(userProfile);
      setSessionsData(sessions);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Password saat ini wajib diisi.');
      toast.error('Gagal', { description: 'Password saat ini wajib diisi.' });
      return;
    }

    if (!newPassword) {
      setPasswordError('Password baru wajib diisi.');
      toast.error('Gagal', { description: 'Password baru wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter.');
      toast.error('Gagal', { description: 'Password baru minimal 8 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      toast.error('Gagal', { description: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await updateAccountPassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password Berhasil Diperbarui!', {
        description: 'Password akun Anda telah diganti. Gunakan password baru untuk sesi selanjutnya.',
        duration: 4000,
      });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      const msg = err?.errors?.current_password?.[0] || err?.message || 'Gagal memperbarui password.';
      setPasswordError(msg);
      toast.error('Gagal Memperbarui Password', {
        description: msg,
        duration: 5000,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm('Apakah Anda yakin ingin mengeluarkan seluruh sesi login di perangkat lain?')) {
      return;
    }

    setIsRevoking(true);
    try {
      await revokeOtherSessions();
      toast.success('Sesi Lain Berhasil Dikeluarkan!', {
        description: 'Seluruh login di perangkat lain telah dinonaktifkan demi keamanan akun Anda.',
      });
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Mengeluarkan Sesi', {
        description: err?.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Render device icon
  const renderDeviceIcon = (deviceType: 'laptop' | 'smartphone' | 'tablet', isCurrent: boolean) => {
    const colorClass = isCurrent
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-100 text-slate-600 border-slate-200';
    const iconClass = isCurrent ? 'text-emerald-600' : 'text-slate-500';

    return (
      <div className={`p-2.5 rounded-xl border ${colorClass}`}>
        {deviceType === 'smartphone' && <Smartphone className={`w-5 h-5 ${iconClass}`} />}
        {deviceType === 'tablet' && <Tablet className={`w-5 h-5 ${iconClass}`} />}
        {deviceType === 'laptop' && <Laptop className={`w-5 h-5 ${iconClass}`} />}
      </div>
    );
  };

  const currentIp = sessionsData?.current_session?.ip_address || '127.0.0.1 (Local)';
  const currentUaString = sessionsData?.current_session?.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const activeSessionsList = sessionsData?.sessions || [];
  const otherSessionsCount = activeSessionsList.filter((s) => !s.is_current).length;

  return (
    <DashboardLayout pageTitle="Security & Credential" activeNav="Security & API">
      <div className="w-full space-y-6">
        {/* Security Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-white" /> Sanctum Authentication
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Security Credentials & Sesi Login
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Kelola keamanan akun, perbarui kata sandi, dan pantau sesi perangkat yang terhubung.
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-3xl" />
        ) : (
          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>Update Account Password</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Pastikan akun Anda menggunakan kombinasi kata sandi yang aman dan tidak mudah ditebak
                </p>
              </div>

              {passwordSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password updated!
                </span>
              )}
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Current Password (Kata Sandi Saat Ini)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                    title={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>New Password (Kata Sandi Baru)</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Min. 8 karakter)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                    title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Confirm New Password (Konfirmasi Kata Sandi)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                    title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memperbarui Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Active Sessions List */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <span>Active Browser Sessions</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Daftar sesi perangkat dan browser yang sedang aktif menggunakan token Sanctum akun Anda
              </p>
            </div>

            {otherSessionsCount > 0 && (
              <button
                type="button"
                onClick={handleRevokeOthers}
                disabled={isRevoking}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengeluarkan...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout Sesi Lain ({otherSessionsCount})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : activeSessionsList.length > 0 ? (
            <div className="space-y-3">
              {activeSessionsList.map((session) => {
                const info = parseUserAgent(session.user_agent || (session.is_current ? currentUaString : null));
                const ipDisplay = session.ip_address || (session.is_current ? currentIp : 'IP Terproteksi');
                const lastActive = session.is_current
                  ? 'Aktif Sekarang'
                  : session.last_used_at
                    ? new Date(session.last_used_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : session.created_at
                      ? new Date(session.created_at).toLocaleDateString('id-ID')
                      : 'Baru saja';

                return (
                  <div
                    key={session.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                      session.is_current
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderDeviceIcon(info.deviceType, session.is_current)}
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{info.os} — {info.browser}</span>
                          {session.is_current && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                              Current Session
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>IP: {ipDisplay}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lastActive}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-auto shrink-0">
                      {session.is_current ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Now</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
                          Sesi Tersimpan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback single current session detected from browser */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 gap-3">
              <div className="flex items-center gap-3">
                {renderDeviceIcon(clientDevice.deviceType, true)}
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{clientDevice.os} — {clientDevice.browser}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Current Session
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span>IP Address: {currentIp}</span>
                    <span>•</span>
                    <span>Aktif Sekarang</span>
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 self-end sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
