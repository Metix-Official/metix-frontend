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
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

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
        if (showRefreshState) {
          toast.success('Data berhasil diperbarui!');
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

        {/* Top Header - Premium gradient card */}
        <div
          className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-6 rounded-2xl overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 45%, #6d28d9 100%)' }}
        >
          {/* Decorative background circles */}
          <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />

          <div className="relative flex items-center gap-4">
            <span className="p-2.5 rounded-xl bg-white/20 text-white">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Refund Management
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Permohonan Refund Pembeli
              </h1>
              <p className="text-sm text-indigo-200 mt-0.5">
                Daftar pengembalian dana tiket dari event yang Anda batalkan.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadRefundRequests(currentPage, true)}
            disabled={isRefreshing || isLoading}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition shadow-md disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Receipt className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Permohonan refund</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{metrics.pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Menunggu transfer</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Selesai</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{metrics.completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Dana dikembalikan</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <DollarSign className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dana</span>
            </div>
            <p className="text-base font-black text-purple-600 leading-tight">{formatRupiah(metrics.totalNominal)}</p>
            <p className="text-xs text-slate-400 mt-1">Total pengembalian</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
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
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              placeholder="Cari order, nama pembeli..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-sm text-slate-500">Memuat permohonan refund pembeli...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
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
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Pesanan & Event</th>
                    <th className="px-5 py-4">Pembeli</th>
                    <th className="px-5 py-4">Nominal</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
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
                        className="hover:bg-orange-50/40 transition group"
                      >
                        {/* Pesanan & Event */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{orderNumber}</span>
                          </div>
                          <div className="text-xs text-orange-600 font-medium mt-1 line-clamp-1 max-w-[200px]" title={eventTitle}>
                            {eventTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        {/* Pembeli */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-slate-900">
                            {buyerName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {buyerEmail}
                          </div>
                          {buyerPhone !== '-' && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {buyerPhone}
                            </div>
                          )}
                        </td>

                        {/* Nominal */}
                        <td className="px-5 py-4 align-top">
                          <div className="font-bold text-slate-900">
                            {formatRupiah(item.amount)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 align-top whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              Menunggu Transfer
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selesai
                            </span>
                          )}
                          {!isPending && !isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Konfirmasi</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setDetailRefund(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
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
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition text-slate-600 font-medium"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition text-slate-600 font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="p-2 rounded-xl bg-emerald-50">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Konfirmasi Selesai Transfer
                </h3>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Target Transfer Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Penerima Refund</span>
                <span className="font-semibold text-slate-700">
                  {selectedRefund.user?.name || (selectedRefund as any).requester?.name || 'Pembeli'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Bank Tujuan</span>
                <span className="font-bold text-slate-900">
                  {selectedRefund.bank_name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
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
                <span className="font-semibold text-slate-800">
                  {selectedRefund.account_name || '-'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Nominal yang Ditransfer
                </span>
                <span className="text-base font-extrabold text-orange-600">
                  {formatRupiah(selectedRefund.amount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Referensi Transfer / Ref Bank (Opsional)
                </label>
                <input
                  type="text"
                  value={gatewayRef}
                  onChange={(e) => setGatewayRef(e.target.value)}
                  placeholder="Contoh: TRX-20261014-99812 / No Bukti Transfer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan untuk Pembeli / Admin (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Contoh: Dana telah ditransfer via Bank Mandiri ke rekening BCA pembeli."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Rincian Refund #{detailRefund.id}
              </h3>
              <button
                onClick={() => setDetailRefund(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-600">
                  {detailRefund.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Nominal</span>
                <span className="font-extrabold text-slate-900">
                  {formatRupiah(detailRefund.amount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Rekening</span>
                <span className="font-mono text-slate-900">
                  {detailRefund.bank_name} - {detailRefund.account_number} ({detailRefund.account_name})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Ref Transaksi</span>
                <span className="font-mono text-slate-900">
                  {detailRefund.gateway_reference || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Catatan Admin</span>
                <span className="text-slate-700 text-right">
                  {detailRefund.admin_note || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Alasan Pembeli</span>
                <span className="text-slate-700 text-right">
                  {detailRefund.reason || '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setDetailRefund(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
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
