'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterPaymentWebhooks,
  MasterPaymentWebhook,
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
  Webhook,
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
  Code2,
  Copy,
  Check,
  Radio,
  Fingerprint,
  Calendar,
} from 'lucide-react';

export default function MasterPaymentWebhookPage() {
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

  // Webhooks State
  const [webhooks, setWebhooks] = useState<MasterPaymentWebhook[]>([]);

  // Modal JSON Viewer State
  const [selectedPayload, setSelectedPayload] = useState<{
    webhookId: number;
    referenceId: string;
    eventType: string;
    data: any;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Payment Webhooks from API
  const loadWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMasterPaymentWebhooks({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      setWebhooks(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Payment Webhooks', {
        description: err?.message || 'Terjadi kesalahan saat memuat log webhook.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, perPage]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data webhooks...', { id: 'refresh-webhooks' });
    await loadWebhooks();
    toast.success('Data Payment Webhooks berhasil diperbarui! 🔄', { id: 'refresh-webhooks' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  // Format Date Helper
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Handle Copy Payload
  const handleCopyJson = () => {
    if (!selectedPayload?.data) return;
    const jsonStr = typeof selectedPayload.data === 'string'
      ? selectedPayload.data
      : JSON.stringify(selectedPayload.data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setIsCopied(true);
    toast.success('Payload JSON berhasil disalin ke clipboard! 📋');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Format IDR Helper
  const formatIDR = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Handle Copy Text (Reference ID / Signature)
  const handleCopyText = (text: string, label: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} berhasil disalin! 📋`);
    setTimeout(() => setCopiedText((prev) => (prev === text ? null : prev)), 2000);
  };

  // Render Status Badge
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PROCESSED':
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PROCESSED
          </span>
        );
      case 'RECEIVED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {s}
          </span>
        );
      case 'FAILED':
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  // Pagination calculation
  const fromRecord = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const toRecord = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Payment Webhooks
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Log data notifikasi webhook payment gateway langsung dari tabel payment_webhooks
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Webhook:</span>
              <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {meta.total}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari reference ID, event type, provider, status, signature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-slate-50/70 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status */}
            <div className="sm:col-span-4 flex items-center gap-2">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full h-10 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PROCESSED">PROCESSED</SelectItem>
                    <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer shrink-0"
                  title="Reset Filter"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Webhooks Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : webhooks.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">#</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Event Type</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Reference ID</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Payload</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Signature</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Processed At</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Provider</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {webhooks.map((webhook, index) => {
                      const rowNumber = (meta.current_page - 1) * meta.per_page + (index + 1);
                      return (
                        <tr
                          key={webhook.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* 0. No Urut */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-400 font-mono text-[11px] font-bold">
                            {rowNumber}
                          </td>

                          {/* 1. Event Type */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[11px]">
                              <Radio className="w-3 h-3 text-indigo-500 shrink-0" />
                              {webhook.event_type}
                            </span>
                          </td>

                          {/* 2. Reference ID (dengan tombol salin) */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            {webhook.reference_id && webhook.reference_id !== '-' ? (
                              <button
                                type="button"
                                onClick={() => handleCopyText(webhook.reference_id, 'Reference ID')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer group shadow-2xs ${
                                  copiedText === webhook.reference_id
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20'
                                    : 'bg-blue-50/80 hover:bg-blue-100 text-blue-800 border-blue-200 hover:border-blue-300'
                                }`}
                                title="Klik untuk salin Reference ID"
                              >
                                <span>{webhook.reference_id}</span>
                                {copiedText === webhook.reference_id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75" />
                                ) : (
                                  <Copy className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0 transition-colors" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 3. Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            {renderStatusBadge(webhook.status)}
                          </td>

                          {/* 4. Payload */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            {webhook.payload ? (
                              <div className="inline-flex items-center gap-2">
                                {webhook.payload?.amount !== undefined && (
                                  <span className="font-extrabold text-blue-600 text-xs">
                                    {formatIDR(webhook.payload.amount)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayload({
                                    webhookId: webhook.id,
                                    referenceId: webhook.reference_id,
                                    eventType: webhook.event_type,
                                    data: webhook.payload,
                                  })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                  title="Lihat Payload JSON Lengkap"
                                >
                                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Lihat Payload</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 5. Signature (dengan tombol salin) */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            {webhook.signature && webhook.signature !== '-' ? (
                              <button
                                type="button"
                                onClick={() => handleCopyText(webhook.signature, 'Signature')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-medium border transition-all cursor-pointer group shadow-2xs max-w-[260px] ${
                                  copiedText === webhook.signature
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                                title={`Klik untuk salin Signature: ${webhook.signature}`}
                              >
                                <Fingerprint className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{webhook.signature}</span>
                                {copiedText === webhook.signature ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          {/* 6. Processed At */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px] align-middle">
                            {webhook.processed_at ? (
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDateTime(webhook.processed_at)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* 7. Provider */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                              {webhook.provider}
                            </span>
                          </td>

                          {/* 8. Created At */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px] align-middle">
                            {formatDateTime(webhook.created_at)}
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
                    <strong className="text-slate-900">{meta.total}</strong> webhook
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
                <Webhook className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Webhook Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada hasil webhook yang cocok dengan kata kunci atau status yang Anda filter.'
                    : 'Belum ada data rekaman payment_webhooks yang tersimpan di sistem.'}
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

      {/* Payload Modal Dialog */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Payload Webhook #{selectedPayload.webhookId}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ref: {selectedPayload.referenceId} ({selectedPayload.eventType})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Salin JSON"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayload(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: JSON Code Viewer */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-950 font-mono text-[11px] text-emerald-400 leading-relaxed rounded-b-3xl">
              <pre className="whitespace-pre-wrap break-all">
                {typeof selectedPayload.data === 'string'
                  ? selectedPayload.data
                  : JSON.stringify(selectedPayload.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
