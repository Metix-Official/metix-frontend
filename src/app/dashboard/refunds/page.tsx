'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerRefundRequestsApi,
  completeRefundRequestApi,
  RefundRequestItem,
  getStoredUser,
} from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { toast } from '@/components/ui/sonner';
import {
  RotateCcw,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Building2,
  User,
  Calendar,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Receipt,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export default function RefundsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refunds, setRefunds] = useState<RefundRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // Modal State for Completing Refund
  const [selectedRefund, setSelectedRefund] = useState<RefundRequestItem | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [gatewayRef, setGatewayRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [detailRefund, setDetailRefund] = useState<RefundRequestItem | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
  }, []);

  const loadRefundRequests = useCallback(async (page = 1, showRefreshState = false) => {
    if (showRefreshState) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetchOrganizerRefundRequestsApi({
        page,
        per_page: 15,
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setRefunds(res.data);
        if (res.meta) {
          setMeta({
            current_page: res.meta.current_page || page,
            last_page: res.meta.last_page || 1,
            total: res.meta.total || res.data.length,
          });
        }
      } else {
        setRefunds([]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat data permohonan refund');
      setRefunds([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadRefundRequests(1);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadRefundRequests]);

  const handleCopyAccount = (accountNo: string, key: string) => {
    navigator.clipboard.writeText(accountNo);
    setCopiedId(key);
    toast.success(`Nomor rekening ${accountNo} berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCompleteModal = (item: RefundRequestItem) => {
    setSelectedRefund(item);
    setGatewayRef(item.gateway_reference || '');
    setAdminNote(item.admin_note || '');
    setIsCompleteModalOpen(true);
  };

  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    setIsSubmitting(true);
    try {
      await completeRefundRequestApi(selectedRefund.id, {
        gateway_reference: gatewayRef.trim() || undefined,
        admin_note: adminNote.trim() || undefined,
      });

      toast.success('Pengembalian dana berhasil dikonfirmasi selesai!');
      setIsCompleteModalOpen(false);
      setSelectedRefund(null);
      loadRefundRequests(currentPage, true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengonfirmasi refund selesai');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let totalNominal = 0;
    let pendingCount = 0;
    let completedCount = 0;

    refunds.forEach((r) => {
      const amt = Number(r.amount) || 0;
      totalNominal += amt;
      if (r.status === 'PENDING') pendingCount++;
      if (r.status === 'COMPLETED') completedCount++;
    });

    return {
      totalCount: meta.total || refunds.length,
      totalNominal,
      pendingCount,
      completedCount,
    };
  }, [refunds, meta]);

  const formatRupiah = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const isEo = getUserRole(currentUser) === ROLES.EO;

  return (
    <DashboardLayout
      pageTitle="Permohonan Refund Pembeli"
      activeNav="/dashboard/refunds"
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <RotateCcw className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Permohonan Refund Pembeli
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Daftar pembeli yang mengajukan pengembalian dana tiket untuk event yang Anda batalkan/refund.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadRefundRequests(currentPage, true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Pengajuan
              </span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.totalCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Permohonan refund terdaftar</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Menunggu Transfer
              </span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
              {metrics.pendingCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Perlu ditransfer ke rekening pembeli</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Selesai Ditransfer
              </span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {metrics.completedCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Dana telah berhasil dikembalikan</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estimasi Dana (Halaman ini)
              </span>
              <span className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-2">
              {formatRupiah(metrics.totalNominal)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total pengembalian dana</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'PENDING', label: 'Menunggu Transfer' },
              { id: 'COMPLETED', label: 'Selesai' },
              { id: 'REJECTED', label: 'Ditolak' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari order, nama pembeli, bank..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-sm text-slate-500">Memuat permohonan refund pembeli...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Permohonan Refund
              </h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada permohonan refund yang cocok dengan filter atau kata kunci pencarian Anda.'
                  : 'Saat pembeli mengajukan pengembalian dana tiket untuk event Anda yang disetujui Owner, data dan rekening pencairan akan tampil di sini.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Pesanan & Event</th>
                    <th className="px-5 py-4">Pembeli</th>
                    <th className="px-5 py-4">Rekening Tujuan</th>
                    <th className="px-5 py-4">Nominal</th>
                    <th className="px-5 py-4">Alasan</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {refunds.map((item) => {
                    const buyerName =
                      item.user?.name ||
                      `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() ||
                      (item as any).requester?.name ||
                      (item as any).order?.user?.name ||
                      'Pembeli';
                    const buyerEmail = item.user?.email || (item as any).requester?.email || '-';
                    const buyerPhone = item.user?.phone || (item as any).requester?.phone || '-';
                    const orderNumber = item.order?.order_number || (item as any).order_number || `#${item.order_id}`;
                    const eventTitle = item.order?.event?.title || (item as any).ticket?.event?.title || 'Event Terkait';

                    const isPending = item.status === 'PENDING';
                    const isCompleted = item.status === 'COMPLETED';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Pesanan & Event */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{orderNumber}</span>
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1 line-clamp-1 max-w-[200px]" title={eventTitle}>
                            {eventTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        {/* Pembeli */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {buyerName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {buyerEmail}
                          </div>
                          {buyerPhone !== '-' && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {buyerPhone}
                            </div>
                          )}
                        </td>

                        {/* Rekening Tujuan */}
                        <td className="px-5 py-4 align-top">
                          {item.bank_name || item.account_number ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.bank_name || 'BANK'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                  {item.account_number}
                                </span>
                                {item.account_number && (
                                  <button
                                    onClick={() => handleCopyAccount(item.account_number!, `acc-${item.id}`)}
                                    title="Salin Nomor Rekening"
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                                  >
                                    {copiedId === `acc-${item.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                a.n {item.account_name || '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Rekening belum diisi
                            </span>
                          )}
                        </td>

                        {/* Nominal */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatRupiah(item.amount)}
                          </div>
                        </td>

                        {/* Alasan */}
                        <td className="px-5 py-4 align-top max-w-[220px]">
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2" title={item.reason}>
                            {item.reason || '-'}
                          </p>
                          {item.admin_note && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1 italic">
                              Ket: {item.admin_note}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 align-top whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              Menunggu Transfer
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai Ditransfer
                            </span>
                          )}
                          {!isPending && !isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                              {item.status}
                            </span>
                          )}
                          {item.gateway_reference && (
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              Ref: {item.gateway_reference}
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              onClick={() => handleOpenCompleteModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Konfirmasi Selesai</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setDetailRefund(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium transition"
                            >
                              <span>Rincian</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const prev = currentPage - 1;
                    setCurrentPage(prev);
                    loadRefundRequests(prev);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage >= meta.last_page}
                  onClick={() => {
                    const next = currentPage + 1;
                    setCurrentPage(next);
                    loadRefundRequests(next);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Selesai Transfer */}
      {isCompleteModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Konfirmasi Selesai Transfer
                </h3>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Target Transfer Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Penerima Refund</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedRefund.user?.name || (selectedRefund as any).requester?.name || 'Pembeli'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bank Tujuan</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedRefund.bank_name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedRefund.account_number || '-'}
                  </span>
                  {selectedRefund.account_number && (
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(selectedRefund.account_number!, 'modal-acc')}
                      className="text-orange-500 hover:text-orange-600 p-0.5"
                    >
                      {copiedId === 'modal-acc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Atas Nama (A/N)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRefund.account_name || '-'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nominal yang Ditransfer
                </span>
                <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                  {formatRupiah(selectedRefund.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor Referensi Transfer / Ref Bank (Opsional)
                </label>
                <input
                  type="text"
                  value={gatewayRef}
                  onChange={(e) => setGatewayRef(e.target.value)}
                  placeholder="Contoh: TRX-20261014-99812 / No Bukti Transfer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan untuk Pembeli / Admin (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Contoh: Dana telah ditransfer via Bank Mandiri ke rekening BCA pembeli."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Konfirmasi Selesai</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rincian Refund #{detailRefund.id}
              </h3>
              <button
                onClick={() => setDetailRefund(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {detailRefund.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Nominal</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(detailRefund.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Rekening</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {detailRefund.bank_name} - {detailRefund.account_number} ({detailRefund.account_name})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Ref Transaksi</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {detailRefund.gateway_reference || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Catatan Admin</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">
                  {detailRefund.admin_note || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Alasan Pembeli</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">
                  {detailRefund.reason || '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setDetailRefund(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
