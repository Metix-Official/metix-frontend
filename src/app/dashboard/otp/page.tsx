'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOtpVerifications,
  OtpVerificationItem,
  getStoredUser,
  UserProfile,
} from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KeyRound,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Eye,
  Hash,
  Download,
  AlertTriangle,
  FileCode,
  Calendar,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function MasterOtpVerificationsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // OTP Records
  const [otpList, setOtpList] = useState<OtpVerificationItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal Detail State
  const [selectedOtp, setSelectedOtp] = useState<OtpVerificationItem | null>(null);

  // Check User Auth
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    setIsAuthLoading(false);
  }, []);

  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    return getUserRole(currentUser) === ROLES.OWNER;
  }, [currentUser]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Data
  const loadOtpData = useCallback(async () => {
    if (!isOwner && !isAuthLoading) return;
    setIsLoading(true);
    try {
      const res = await fetchOtpVerifications({
        search: debouncedSearch || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        per_page: perPage,
      });

      setOtpList(res.data || []);
      if (res.meta) {
        setMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          per_page: res.meta.per_page,
          total: res.meta.total,
        });
      }
    } catch (err: any) {
      console.error('Error fetching OTP verifications:', err);
      toast.error(err?.message || 'Gagal memuat data OTP verifications.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, currentPage, perPage, isOwner, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && isOwner) {
      loadOtpData();
    }
  }, [loadOtpData, isAuthLoading, isOwner]);

  // Copy handler
  const copyToClipboard = (text: string, key: string, label: string = 'Disalin') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Export to CSV
  const exportToCsv = () => {
    if (!otpList.length) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'User ID',
      'Nama Pengguna',
      'Tipe',
      'Tujuan (Email/WA)',
      'Nilai Asli OTP',
      'Code Hash (Bcrypt)',
      'Percobaan (Attempts)',
      'Status',
      'Waktu Dibuat',
      'Waktu Kadaluarsa',
      'Waktu Terverifikasi',
    ];

    const rows = otpList.map((item) => [
      item.id,
      item.user_id ?? 'Tamu',
      item.user?.name ?? '-',
      item.type,
      item.destination,
      item.plain_code ?? '(Hash)',
      `"${item.code_hash}"`,
      item.attempts,
      item.status,
      item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-',
      item.expires_at ? new Date(item.expires_at).toLocaleString('id-ID') : '-',
      item.verified_at ? new Date(item.verified_at).toLocaleString('id-ID') : '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `otp_verifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('File CSV berhasil diunduh.');
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = meta.total || otpList.length;
    const verified = otpList.filter((item) => item.is_verified || !!item.verified_at).length;
    const active = otpList.filter((item) => !item.is_verified && !item.is_expired).length;
    const expired = otpList.filter((item) => item.is_expired || (!item.is_verified && item.attempts >= 5)).length;

    return { total, verified, active, expired };
  }, [meta.total, otpList]);

  // Date formatting helpers
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Render Access Denied if not Owner
  if (!isAuthLoading && !isOwner) {
    return (
      <DashboardLayout pageTitle="Akses Dibatasi">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Halaman Khusus Super Admin (Owner)</h1>
          <p className="text-sm text-slate-600 max-w-md mb-6">
            Menu OTP Verifikasi hanya dapat diakses oleh akun dengan peran Platform Owner.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Log OTP Verifikasi">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Data OTP Verifikasi
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    Tabel: otp_verifications
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Monitoring data verifikasi OTP, status hash Bcrypt, dan perbandingan kode asli untuk audit Super Admin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportToCsv}
              disabled={isLoading || otpList.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 active:scale-95 transition shadow-2xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={() => loadOtpData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-sm shadow-blue-600/25 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total OTP</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{meta.total}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Total permintaan OTP tercatat</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Terverifikasi</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">{stats.verified}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Berhasil divalidasi pengguna</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu / Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">{stats.active}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Masa berlaku belum habis</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Kadaluarsa / Gagal</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-700 mt-2">{stats.expired}</p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Expired atau limit percobaan</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan email, nomor, kode asli, user ID, atau hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Type */}
            <div className="w-full sm:w-44">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9.5 text-xs font-semibold bg-white border-slate-200 rounded-xl">
                  <SelectValue placeholder="Tipe OTP" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-xs">Semua Tipe</SelectItem>
                  <SelectItem value="EMAIL" className="text-xs">Email</SelectItem>
                  <SelectItem value="WHATSAPP" className="text-xs">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9.5 text-xs font-semibold bg-white border-slate-200 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="active" className="text-xs">Aktif (Pending)</SelectItem>
                  <SelectItem value="verified" className="text-xs">Terverifikasi</SelectItem>
                  <SelectItem value="expired" className="text-xs">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Per Page Selector */}
            <div className="w-full sm:w-32">
              <Select
                value={String(perPage)}
                onValueChange={(val) => {
                  setPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full h-9.5 text-xs font-semibold bg-white border-slate-200 rounded-xl">
                  <SelectValue placeholder="Baris" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="10" className="text-xs">10 baris</SelectItem>
                  <SelectItem value="20" className="text-xs">20 baris</SelectItem>
                  <SelectItem value="50" className="text-xs">50 baris</SelectItem>
                  <SelectItem value="100" className="text-xs">100 baris</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <FilterX className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* OTP Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">User ID & Pengguna</th>
                  <th className="py-3 px-4">Tipe & Tujuan</th>
                  <th className="py-3 px-4">Code Hash (Bcrypt)</th>
                  <th className="py-3 px-4 bg-emerald-50/60 text-emerald-900 border-x border-emerald-100">
                    <span className="flex items-center gap-1 text-emerald-800 font-extrabold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Nilai Asli OTP
                    </span>
                  </th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4">Kadaluarsa (Expires At)</th>
                  <th className="py-3 px-4">Verifikasi (Verified At)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto rounded" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-36 rounded" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                      <td className="py-4 px-4 bg-emerald-50/30"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                      <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-10 mx-auto rounded" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                      <td className="py-4 px-4 text-center"><Skeleton className="h-7 w-7 mx-auto rounded-lg" /></td>
                    </tr>
                  ))
                ) : otpList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                          <KeyRound className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">Tidak Ada Data OTP</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Belum ada catatan permintaan OTP atau tidak ada hasil yang cocok dengan filter pencarian.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  otpList.map((item) => {
                    const isHashCopied = copiedKey === `hash-${item.id}`;
                    const isPlainCopied = copiedKey === `plain-${item.id}`;
                    const isDestCopied = copiedKey === `dest-${item.id}`;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* ID Column */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                          #{item.id}
                        </td>

                        {/* User ID & Info */}
                        <td className="py-3.5 px-4">
                          {item.user_id ? (
                            <div className="flex items-start gap-2">
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                                UID:{item.user_id}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {item.user?.name || `User #${item.user_id}`}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.user?.email || '-'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                Tamu / Registrasi
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Type & Destination */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {item.type === 'EMAIL' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold">
                                  <Mail className="w-3 h-3" />
                                  EMAIL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                  <Phone className="w-3 h-3" />
                                  WHATSAPP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 group/dest">
                              <span className="font-medium text-slate-800 text-xs truncate max-w-[180px]">
                                {item.destination}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.destination, `dest-${item.id}`, 'Tujuan')}
                                title="Salin tujuan"
                                className="text-slate-400 hover:text-blue-600 opacity-0 group-hover/dest:opacity-100 transition p-0.5"
                              >
                                {isDestCopied ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Code Hash (Bcrypt) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code
                              className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-md max-w-[140px] truncate block select-all"
                              title={item.code_hash}
                            >
                              {item.code_hash}
                            </code>
                            <button
                              onClick={() => copyToClipboard(item.code_hash, `hash-${item.id}`, 'Code Hash')}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                              title="Salin Code Hash Lengkap"
                            >
                              {isHashCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Nilai Asli (Plain OTP) - Prominent in dedicated column right next to code_hash */}
                        <td className="py-3.5 px-4 bg-emerald-50/40 border-x border-emerald-100/70">
                          {item.plain_code ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black tracking-widest text-xs shadow-xs">
                                {item.plain_code}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.plain_code!, `plain-${item.id}`, 'Kode Asli OTP')}
                                className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition shrink-0"
                                title="Salin Kode Asli"
                              >
                                {isPlainCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="text-[11px] italic bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono" title="Data lama tercatat sebelum modul pencatatan kode asli diaktifkan">
                                (Hash Saja)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Attempts (attemps) */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.attempts >= 5
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : item.attempts > 0
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.attempts} / 5
                          </span>
                        </td>

                        {/* Expires At */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-slate-800">
                              {formatDateTime(item.expires_at)}
                            </span>
                            {item.expires_at && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.expires_at) < new Date() ? 'Sudah lewat' : 'Aktif 5 menit'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Verified At */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.verified_at ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{formatDateTime(item.verified_at)}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Belum verifikasi
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {item.is_verified || !!item.verified_at ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Terverifikasi
                            </span>
                          ) : item.is_expired || (item.expires_at && new Date(item.expires_at) < new Date()) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Kadaluarsa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Aktif
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedOtp(item)}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 text-xs text-slate-600">
              <div>
                Menampilkan{' '}
                <span className="font-bold text-slate-800">
                  {Math.min((currentPage - 1) * perPage + 1, meta.total)}
                </span>{' '}
                sampai{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * perPage, meta.total)}
                </span>{' '}
                dari <span className="font-bold text-slate-800">{meta.total}</span> data
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </button>
                <div className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                  {currentPage} / {meta.last_page || 1}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.last_page))}
                  disabled={currentPage >= meta.last_page || isLoading}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium disabled:opacity-40 transition flex items-center gap-1"
                >
                  Berikutnya
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Detail OTP Verification */}
        {selectedOtp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedOtp(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        Detail OTP Verification #{selectedOtp.id}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {selectedOtp.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Informasi lengkap entri tabel otp_verifications untuk audit keamanan.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOtp(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nilai Asli Highlight Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Nilai Asli Kode OTP
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    {selectedOtp.plain_code ? (
                      <span className="text-3xl font-black font-mono tracking-widest text-emerald-700">
                        {selectedOtp.plain_code}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-slate-500 italic">
                        Tersimpan sebagai hash saja (record lama)
                      </span>
                    )}
                  </div>
                </div>

                {selectedOtp.plain_code && (
                  <button
                    onClick={() => copyToClipboard(selectedOtp.plain_code!, 'modal-plain', 'Kode OTP')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Kode
                  </button>
                )}
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* User Info */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Pengguna (User)
                  </span>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {selectedOtp.user?.name || (selectedOtp.user_id ? `User ID #${selectedOtp.user_id}` : 'Tamu / Register Baru')}
                    </p>
                    <p className="text-slate-600">{selectedOtp.user?.email || selectedOtp.destination}</p>
                    {selectedOtp.user?.phone && (
                      <p className="text-slate-500 font-mono text-[11px]">{selectedOtp.user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Tujuan */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Tujuan Pengiriman (Destination)
                  </span>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="font-bold text-slate-900 break-all">{selectedOtp.destination}</p>
                    <p className="text-slate-500">Kanal pengiriman: <span className="font-semibold text-slate-700">{selectedOtp.type}</span></p>
                  </div>
                </div>

                {/* Attempts & Status */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Percobaan (Attempts)
                  </span>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedOtp.attempts} / 5 kali
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        selectedOtp.attempts >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {selectedOtp.attempts >= 5 ? 'Batas Terlampaui' : 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Status Validasi */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Status Validasi
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    {selectedOtp.is_verified || !!selectedOtp.verified_at ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Terverifikasi pada {formatDateTime(selectedOtp.verified_at)}
                      </span>
                    ) : selectedOtp.is_expired ? (
                      <span className="inline-flex items-center gap-1 font-bold text-slate-600">
                        <XCircle className="w-4 h-4 text-slate-400" />
                        Kadaluarsa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Clock className="w-4 h-4" />
                        Aktif menunggu input pengguna
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Hash Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Bcrypt Code Hash (Kolom `code_hash`)
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedOtp.code_hash, 'modal-hash', 'Code Hash')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Salin Hash
                  </button>
                </div>
                <code className="block p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg break-all select-all">
                  {selectedOtp.code_hash}
                </code>
              </div>

              {/* Timestamps */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span>Dibuat: <strong className="text-slate-800">{formatDateTime(selectedOtp.created_at)}</strong></span>
                <span>Kadaluarsa: <strong className="text-slate-800">{formatDateTime(selectedOtp.expires_at)}</strong></span>
                <span>Verifikasi: <strong className="text-slate-800">{formatDateTime(selectedOtp.verified_at)}</strong></span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setSelectedOtp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
