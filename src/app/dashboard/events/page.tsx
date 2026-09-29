'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterEvents,
  ApiEvent,
  getPhotoUrl,
} from '@/lib/api';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar,
  Search,
  MapPin,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Building2,
  SlidersHorizontal,
  Music,
  Share2,
  QrCode,
  Settings,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';

export default function MasterEventPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  // Events State
  const [events, setEvents] = useState<ApiEvent[]>([]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Master Events from API
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMasterEvents({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      setEvents(res.events);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Master Event', {
        description: err?.message || 'Terjadi kesalahan saat memuat data acara.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, perPage]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data event...', { id: 'refresh-events' });
    await loadEvents();
    toast.success('Data Master Event berhasil diperbarui! 🔄', { id: 'refresh-events' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  // Format Date Helper
  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start) return '-';
    try {
      const startDate = new Date(start);
      const startStr = startDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (!end) return startStr;

      const endDate = new Date(end);
      const endStr = endDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
    } catch {
      return start;
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PUBLISHED
          </span>
        );
      case 'ONGOING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs animate-pulse">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            ONGOING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            CANCELLED
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            DRAFT
          </span>
        );
    }
  };

  const fromRecord = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const toRecord = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <DashboardLayout pageTitle="Master Event" activeNav="/dashboard/events">
      <div className="w-full space-y-6">
        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-white" /> Data Master
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Master Event Platform
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
                Kelola seluruh data event platform Metix. Gunakan opsi di setiap baris event untuk mengelola Fasilitas, Lineups, Social Media, Scanner, dan Pengaturan Event.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Controls: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul event, lokasi, deskripsi..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select Status & Reset */}
            <div className="flex items-center gap-2.5">
              <div className="w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset Filter"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Master Event Table */}
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-700 min-w-[1050px]">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4 min-w-[240px]">Event</th>
                      <th className="py-3.5 px-4">Penyelenggara (EO)</th>
                      <th className="py-3.5 px-4">Venue & Lokasi</th>
                      <th className="py-3.5 px-4">Jadwal Pelaksanaan</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center w-24">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((evt, index) => {
                      const bannerUrl = getPhotoUrl(evt.banner);
                      const orgLogo = getPhotoUrl(evt.organizer?.logo, undefined, true);
                      const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1;

                      return (
                        <tr
                          key={evt.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="py-4 px-4 text-center font-bold text-slate-400 text-[11px]">
                            {rowNumber}
                          </td>

                          {/* Event Banner & Title */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {bannerUrl ? (
                                <img
                                  src={bannerUrl}
                                  alt={evt.title}
                                  className="w-14 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                  <Calendar className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 max-w-[220px]">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate text-xs">
                                  {evt.title}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium truncate">
                                  /{evt.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Organizer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {orgLogo ? (
                                <img
                                  src={orgLogo}
                                  alt={evt.organizer?.organization_name || 'EO'}
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                                {evt.organizer?.organization_name || 'Event Organizer'}
                              </span>
                            </div>
                          </td>

                          {/* Venue & Location */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col text-[11px] max-w-[160px]">
                              <span className="font-bold text-slate-800 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {evt.venue?.name || 'Venue Utama'}
                              </span>
                              <span className="text-slate-400 font-medium truncate">
                                {evt.venue?.city || evt.venue?.address || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Date Range */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateRange(evt.start_at, evt.end_at)}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            {renderStatusBadge(evt.status)}
                          </td>

                          {/* OPSI / AKSI RELASI (Titik Tiga ... Dropdown dari atas ke bawah) */}
                          <td className="py-4 px-4 text-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs focus:outline-none"
                                  title="Opsi Relasi Event"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-48 p-1.5 rounded-2xl bg-white shadow-xl border border-slate-200 animate-in fade-in-0 zoom-in-95">
                                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Opsi Relasi Event
                                  </span>
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                  {/* 1. Fasilitas */}
                                  <Link
                                    href={`/dashboard/events/${evt.id}/facilities`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                  >
                                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Fasilitas</span>
                                  </Link>

                                  {/* 2. Lineups */}
                                  <Link
                                    href={`/dashboard/events/${evt.id}/lineups`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                                  >
                                    <Music className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>Lineups</span>
                                  </Link>

                                  {/* 3. Event Social Media */}
                                  <Link
                                    href={`/dashboard/events/${evt.id}/social-media`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  >
                                    <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Social Media</span>
                                  </Link>

                                  {/* 4. Event Scanners */}
                                  <Link
                                    href={`/dashboard/events/${evt.id}/scanners`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                  >
                                    <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Scanners</span>
                                  </Link>

                                  {/* 5. Event Settings */}
                                  <Link
                                    href={`/dashboard/events/${evt.id}/settings`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                  >
                                    <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>Settings</span>
                                  </Link>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs font-semibold text-slate-600">
                {/* Records Info & Per Page Selector */}
                <div className="flex items-center gap-3">
                  <span>
                    Menampilkan <strong className="text-slate-900">{fromRecord}</strong> -{' '}
                    <strong className="text-slate-900">{toRecord}</strong> dari{' '}
                    <strong className="text-slate-900">{meta.total}</strong> event
                  </span>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                    <span className="text-slate-500 text-[11px]">Baris:</span>
                    <Select
                      value={String(perPage)}
                      onValueChange={(val) => {
                        setPerPage(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[72px] h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
                    Halaman {meta.current_page} dari {meta.last_page}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= meta.last_page || isLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Event Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada hasil yang cocok dengan kata kunci atau filter yang Anda pilih.'
                    : 'Belum ada data event yang tersimpan di sistem.'}
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua Filter</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
