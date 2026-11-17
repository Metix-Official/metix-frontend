'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterPayments,
  MasterPayment,
  updateOwnerPaymentApi,
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
import { cn } from '@/lib/utils';
import {
  CreditCard,
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
  RotateCcw,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Calendar,
  User,
  Mail,
  Receipt,
  MoreVertical,
  Pencil,
  Trash2,
  Lock,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  Package,
} from 'lucide-react';

export default function MasterPaymentPage() {
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

  // Payments State
  const [payments, setPayments] = useState<MasterPayment[]>([]);

  // Modal JSON Viewer State
  const [selectedRawResponse, setSelectedRawResponse] = useState<{
    paymentId: number;
    invoiceNumber: string;
    data: any;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Action Dropdown & Modal State
  const [actionMenuPaymentId, setActionMenuPaymentId] = useState<number | null>(null);

  // Expandable Table Row State
  const [expandedPaymentIds, setExpandedPaymentIds] = useState<Set<number>>(new Set());

  const toggleExpandRow = (paymentId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(paymentId)) {
        next.delete(paymentId);
      } else {
        next.add(paymentId);
      }
      return next;
    });
  };

  // Edit Modal State
  const [editingPayment, setEditingPayment] = useState<MasterPayment | null>(null);
  const [editForm, setEditForm] = useState<{
    provider_transaction_id: string;
    status: string;
    paid_at: string;
  }>({
    provider_transaction_id: '',
    status: 'PENDING',
    paid_at: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete/Cancel Modal State
  const [cancellingPayment, setCancellingPayment] = useState<MasterPayment | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Master Payments from API
  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMasterPayments({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      setPayments(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Master Payment', {
        description: err?.message || 'Terjadi kesalahan saat memuat data transaksi pembayaran.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, perPage]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data pembayaran...', { id: 'refresh-payments' });
    await loadPayments();
    toast.success('Data Master Payment berhasil diperbarui! 🔄', { id: 'refresh-payments' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  // Format IDR Helper
  const formatIDR = (val?: number | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

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

  // Handle Copy Raw Response
  const handleCopyJson = () => {
    if (!selectedRawResponse?.data) return;
    const jsonStr = typeof selectedRawResponse.data === 'string'
      ? selectedRawResponse.data
      : JSON.stringify(selectedRawResponse.data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setIsCopied(true);
    toast.success('JSON berhasil disalin ke clipboard! 📋');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Copy Invoice Number
  const handleCopyInvoice = (invoice: string) => {
    if (!invoice || invoice === '-') return;
    navigator.clipboard.writeText(invoice);
    setCopiedInvoice(invoice);
    toast.success(`Nomor invoice ${invoice} berhasil disalin! 📋`);
    setTimeout(() => setCopiedInvoice((prev) => (prev === invoice ? null : prev)), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (payment: MasterPayment) => {
    setEditingPayment(payment);
    let formattedPaidAt = '';
    if (payment.paid_at) {
      const d = new Date(payment.paid_at);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        formattedPaidAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    setEditForm({
      provider_transaction_id: payment.provider_transaction_id === '-' ? '' : (payment.provider_transaction_id || ''),
      status: (payment.status || 'PENDING').toUpperCase(),
      paid_at: formattedPaidAt,
    });
    setActionMenuPaymentId(null);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    setIsSubmittingEdit(true);
    try {
      const res = await updateOwnerPaymentApi(editingPayment.id, {
        provider_transaction_id: editForm.provider_transaction_id.trim() || null,
        status: editForm.status,
        paid_at: editForm.paid_at ? new Date(editForm.paid_at).toISOString() : null,
      });

      // Update state in place
      setPayments((prev) =>
        prev.map((p) => (p.id === editingPayment.id ? { ...p, ...res.data } : p))
      );

      toast.success('Data transaksi pembayaran berhasil diperbarui! 🎉');
      setEditingPayment(null);
    } catch (err: any) {
      toast.error('Gagal Memperbarui Transaksi', {
        description: err.message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Confirm Cancel (Delete Action)
  const handleConfirmCancel = async () => {
    if (!cancellingPayment) return;

    setIsSubmittingCancel(true);
    try {
      const res = await updateOwnerPaymentApi(cancellingPayment.id, {
        status: 'CANCELLED',
      });

      // Update state in place
      setPayments((prev) =>
        prev.map((p) =>
          p.id === cancellingPayment.id ? { ...p, ...res.data, status: 'CANCELLED' } : p
        )
      );

      toast.success(`Transaksi #${cancellingPayment.invoice_number} berhasil dibatalkan (Status: CANCELLED).`);
      setCancellingPayment(null);
    } catch (err: any) {
      toast.error('Gagal Membatalkan Transaksi', {
        description: err.message || 'Terjadi kesalahan saat membatalkan transaksi.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING
          </span>
        );
      case 'PAID':
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PAID
          </span>
        );
      case 'EXPIRED':
      case 'EXPERIED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            {s}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-blue-600" />
            CANCELLED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs whitespace-nowrap">
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            REFUNDED
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
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Payment
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Pantau seluruh data transaksi pembayaran tiket dan integrasi payment gateway
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Transaksi:</span>
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
                placeholder="Cari nomor invoice, order number, nama buyer, email, event, provider..."
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
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="PAID">PAID</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    <SelectItem value="REFUNDED">REFUNDED</SelectItem>
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

        {/* Payments Table Container */}
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
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[850px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 w-16 text-center whitespace-nowrap align-middle">#</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Buyer</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Event</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Invoice Number</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Tanggal</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Total</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.map((payment, index) => {
                      const rowNumber = (meta.current_page - 1) * meta.per_page + (index + 1);
                      const isExpanded = expandedPaymentIds.has(payment.id);

                      return (
                        <React.Fragment key={payment.id}>
                          <tr
                            className={cn(
                              'hover:bg-blue-50/40 transition-colors group',
                              isExpanded && 'bg-blue-50/20'
                            )}
                          >
                            {/* # + Button Tambah */}
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-slate-400 text-[11px] min-w-[18px] text-right font-mono">
                                  {rowNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpandRow(payment.id, e)}
                                  className={cn(
                                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs border',
                                    isExpanded
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                                      : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200'
                                  )}
                                  title={
                                    isExpanded
                                      ? 'Tutup detail transaksi'
                                      : 'Tampilkan data 1 baris lengkap ke bawah'
                                  }
                                >
                                  {isExpanded ? (
                                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Buyer */}
                            <td className="py-3.5 px-4 align-middle">
                              <div className="flex flex-col min-w-0 max-w-[180px]">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                  {payment.buyer_name || '-'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium truncate" title={payment.buyer_email}>
                                  {payment.buyer_email || '-'}
                                </span>
                                {payment.buyer_phone && (
                                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                                    {payment.buyer_phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Event */}
                            <td className="py-3.5 px-4 align-middle">
                              <span
                                className="font-bold text-slate-800 line-clamp-2 max-w-[200px] leading-snug"
                                title={payment.event_title}
                              >
                                {payment.event_title || '-'}
                              </span>
                            </td>

                            {/* Invoice Number & Order ID */}
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                              <div className="space-y-1">
                                {payment.invoice_number && payment.invoice_number !== '-' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyInvoice(payment.invoice_number)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer group shadow-2xs ${
                                      copiedInvoice === payment.invoice_number
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20'
                                        : 'bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border-slate-200 hover:border-blue-300'
                                    }`}
                                    title="Klik untuk salin invoice number"
                                  >
                                    <span>{payment.invoice_number}</span>
                                    {copiedInvoice === payment.invoice_number ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">-</span>
                                )}
                                <div className="text-[10px] text-slate-400 font-mono font-medium">
                                  Order #{payment.order_id}
                                </div>
                              </div>
                            </td>

                            {/* Tanggal */}
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-700">
                                {formatDateTime(payment.paid_at || payment.created_at)}
                              </span>
                            </td>

                            {/* Total Amount */}
                            <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                              <span className="font-black text-blue-700 text-xs">
                                {formatIDR(payment.amount)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                              {renderStatusBadge(payment.status)}
                            </td>

                            {/* Aksi: Menu Titik Tiga */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                              <Popover
                                open={actionMenuPaymentId === payment.id}
                                onOpenChange={(open) => setActionMenuPaymentId(open ? payment.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs focus:outline-none"
                                    title="Menu Aksi Pembayaran"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  className="w-56 p-1.5 rounded-2xl bg-white shadow-xl border border-slate-200 animate-in fade-in-0 zoom-in-95 z-50"
                                >
                                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Aksi #{payment.invoice_number || payment.id}
                                    </span>
                                  </div>
                                  <div className="flex flex-col space-y-0.5">
                                    {/* Edit Transaksi */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuPaymentId(null);
                                        handleOpenEdit(payment);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer text-left"
                                    >
                                      <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>Edit Transaksi</span>
                                    </button>

                                    {/* Batalkan Transaksi */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuPaymentId(null);
                                        setCancellingPayment(payment);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span>Batalkan Transaksi</span>
                                    </button>

                                    {/* Payment URL Link */}
                                    {payment.payment_url && (
                                      <a
                                        href={payment.payment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setActionMenuPaymentId(null)}
                                        className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                                          <span>Buka Payment Link</span>
                                        </div>
                                      </a>
                                    )}

                                    {/* Raw Response JSON */}
                                    {payment.raw_response && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActionMenuPaymentId(null);
                                          setSelectedRawResponse({
                                            paymentId: payment.id,
                                            invoiceNumber: payment.invoice_number,
                                            data: payment.raw_response,
                                          });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Code2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>Lihat Raw JSON</span>
                                      </button>
                                    )}

                                    <div className="h-px bg-slate-100 my-1" />

                                    {/* Salin No Invoice */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuPaymentId(null);
                                        handleCopyInvoice(payment.invoice_number);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                                    >
                                      <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                                      <span>Salin No. Invoice</span>
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>

                          {/* Data 1 baris semua lengkap ke bawah saat button tambah di-click */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200/80 animate-in fade-in-0 duration-150">
                              <td colSpan={8} className="py-4 px-6">
                                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
                                  {/* Header Panel Detail */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                        Rincian Lengkap Transaksi Pembayaran
                                      </span>
                                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                        #{payment.invoice_number || payment.id}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Quick Link to Payment URL */}
                                      {payment.payment_url && (
                                        <a
                                          href={payment.payment_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-blue-200"
                                        >
                                          <span>Buka Payment URL</span>
                                          <ExternalLink className="w-3 h-3 text-blue-500" />
                                        </a>
                                      )}

                                      {/* Quick Button Raw Response */}
                                      {payment.raw_response && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedRawResponse({
                                              paymentId: payment.id,
                                              invoiceNumber: payment.invoice_number,
                                              data: payment.raw_response,
                                            })
                                          }
                                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                                        >
                                          <Code2 className="w-3.5 h-3.5 text-slate-600" />
                                          <span>Lihat JSON</span>
                                        </button>
                                      )}

                                      {/* Quick Button Edit */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(payment)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Edit Transaksi</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Grid Informasi Lengkap */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    {/* Kolom 1: Informasi Pembayaran & Gateway */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Pembayaran & Gateway
                                      </span>
                                      <div className="pt-0.5 space-y-1.5">
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Nominal:</span>
                                          <span className="font-extrabold text-blue-700">{formatIDR(payment.amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Provider:</span>
                                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                                            {payment.provider || 'DOKU'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Metode:</span>
                                          <span className="font-semibold text-slate-800">{payment.payment_method || '-'}</span>
                                        </div>
                                        <div className="pt-1 border-t border-slate-200 text-slate-600">
                                          <span className="text-[10px] text-slate-400 block">Provider Trx ID:</span>
                                          <span className="font-mono text-[11px] font-bold text-slate-800 break-all">
                                            {payment.provider_transaction_id || '-'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Kolom 2: Order & Invoice */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Order & Invoice
                                      </span>
                                      <div className="pt-0.5 space-y-1.5">
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Order ID:</span>
                                          <span className="font-mono font-bold text-blue-700">#{payment.order_id}</span>
                                        </div>
                                        {payment.order_number && (
                                          <div className="flex justify-between items-center text-slate-600">
                                            <span>No. Order:</span>
                                            <span className="font-mono font-bold text-slate-800">{payment.order_number}</span>
                                          </div>
                                        )}
                                        <div className="text-slate-600">
                                          <span className="text-[10px] text-slate-400 block">No. Invoice:</span>
                                          <span className="font-mono font-bold text-slate-800 break-all">{payment.invoice_number || '-'}</span>
                                        </div>
                                        <div className="text-slate-600">
                                          <span className="text-[10px] text-slate-400 block">Event:</span>
                                          <span className="font-bold text-slate-800 line-clamp-2" title={payment.event_title}>
                                            {payment.event_title || '-'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Kolom 3: Informasi Pemesan */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Informasi Pemesan
                                      </span>
                                      <div className="pt-0.5 space-y-1">
                                        <div className="font-extrabold text-slate-900 truncate">
                                          {payment.buyer_name || '-'}
                                        </div>
                                        <div className="text-slate-500 text-[11px] truncate flex items-center gap-1" title={payment.buyer_email}>
                                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{payment.buyer_email || '-'}</span>
                                        </div>
                                        <div className="text-slate-600 font-semibold text-[11px] flex items-center gap-1">
                                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{payment.buyer_phone || '-'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Kolom 4: Status & Linimasa Waktu */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Status & Waktu
                                      </span>
                                      <div className="pt-0.5 space-y-1.5">
                                        <div>{renderStatusBadge(payment.status)}</div>
                                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>Dibuat: {payment.created_at ? formatDateTime(payment.created_at) : '-'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                          <span>Dibayar: {payment.paid_at ? formatDateTime(payment.paid_at) : 'Belum dibayar'}</span>
                                        </div>
                                        {payment.expired_at && (
                                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span>Kedaluwarsa: {formatDateTime(payment.expired_at)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
                    <strong className="text-slate-900">{meta.total}</strong> pembayaran
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
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Pembayaran Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada hasil transaksi yang cocok dengan kata kunci atau status yang Anda filter.'
                    : 'Belum ada data transaksi pembayaran yang tercatat di sistem.'}
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

      {/* Raw Response Modal Dialog */}
      {selectedRawResponse && (
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
                    Raw Gateway Response
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Invoice: {selectedRawResponse.invoiceNumber} (Payment #{selectedRawResponse.paymentId})
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
                  onClick={() => setSelectedRawResponse(null)}
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
                {typeof selectedRawResponse.data === 'string'
                  ? selectedRawResponse.data
                  : JSON.stringify(selectedRawResponse.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit Transaksi Pembayaran
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Invoice: {editingPayment.invoice_number} (Order #{editingPayment.order_id})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* SECTION 1: Disabled / Read-Only Fields */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Informasi Transaksi (Read-Only / Terkunci)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {/* Order Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nomor Order</label>
                    <input
                      type="text"
                      disabled
                      value={`Order #${editingPayment.order_id} (${editingPayment.order_number})`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>

                  {/* Event Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nama Event</label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.event_title || '-'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none font-medium truncate"
                    />
                  </div>

                  {/* Buyer Name & Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nama Pembeli</label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.buyer_name || '-'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Email Pembeli</label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.buyer_email || '-'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>

                  {/* Invoice & Total Amount */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Nomor Invoice</label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.invoice_number || '-'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Total Nominal Tagihan</label>
                    <input
                      type="text"
                      disabled
                      value={formatIDR(editingPayment.amount)}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-blue-700 cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Provider & Method */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Provider & Metode</label>
                    <input
                      type="text"
                      disabled
                      value={`${editingPayment.provider || 'DOKU'} - ${editingPayment.payment_method || '-'}`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>

                  {/* Created & Expired */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Waktu Kedaluwarsa</label>
                    <input
                      type="text"
                      disabled
                      value={editingPayment.expired_at ? formatDateTime(editingPayment.expired_at) : '-'}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed select-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Editable Fields */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Bidang yang Dapat Diperbarui</span>
                </div>

                {/* 1. Provider Transaction ID */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700">
                    Provider Transaction ID
                  </label>
                  <input
                    type="text"
                    value={editForm.provider_transaction_id}
                    onChange={(e) => setEditForm({ ...editForm, provider_transaction_id: e.target.value })}
                    placeholder="Contoh: 1234567890 atau DOKU-REF-123"
                    className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs focus:shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    ID referensi transaksi resmi dari payment gateway (DOKU / Bank).
                  </p>
                </div>

                {/* 2. Status Select */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700">
                    Status Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) => {
                      const next = { ...editForm, status: val };
                      // If changed to PAID and paid_at is empty, suggest current datetime
                      if (val === 'PAID' && !editForm.paid_at) {
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        next.paid_at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                      }
                      setEditForm(next);
                    }}
                  >
                    <SelectTrigger className="w-full py-2.5 rounded-xl border-slate-200 bg-white text-xs font-bold shadow-2xs">
                      <SelectValue placeholder="Pilih status pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING" className="text-xs font-bold text-amber-700">
                        PENDING (Menunggu Pembayaran)
                      </SelectItem>
                      <SelectItem value="PAID" className="text-xs font-bold text-emerald-700">
                        PAID (Lunas / Berhasil)
                      </SelectItem>
                      <SelectItem value="FAILED" className="text-xs font-bold text-rose-700">
                        FAILED (Gagal)
                      </SelectItem>
                      <SelectItem value="EXPIRED" className="text-xs font-bold text-slate-600">
                        EXPIRED (Kedaluwarsa)
                      </SelectItem>
                      <SelectItem value="REFUNDED" className="text-xs font-bold text-purple-700">
                        REFUNDED (Dikembalikan)
                      </SelectItem>
                      <SelectItem value="CANCELLED" className="text-xs font-bold text-rose-700">
                        CANCELLED (Dibatalkan)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Paid At */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Waktu Pembayaran (Paid At)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const nowFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          setEditForm({ ...editForm, paid_at: nowFormatted });
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        Set Sekarang
                      </button>
                      {editForm.paid_at && (
                        <>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, paid_at: '' })}
                            className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    value={editForm.paid_at}
                    onChange={(e) => setEditForm({ ...editForm, paid_at: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-medium text-slate-900 shadow-2xs focus:shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Kosongkan jika transaksi belum atau tidak dibayar.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Batalkan Transaksi Pembayaran?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan transaksi ini? Data tidak akan dihapus permanen, melainkan status pembayaran akan diubah menjadi <strong className="font-bold text-rose-600">CANCELLED</strong>.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5 text-xs shadow-2xs">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Nomor Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{cancellingPayment.invoice_number}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Order:</span>
                  <span className="font-bold text-slate-800">#{cancellingPayment.order_id} ({cancellingPayment.order_number})</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Pembeli:</span>
                  <span className="font-semibold text-slate-800">{cancellingPayment.buyer_name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Total Tagihan:</span>
                  <span className="font-extrabold text-blue-700">{formatIDR(cancellingPayment.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Status Saat Ini:</span>
                  <span>{renderStatusBadge(cancellingPayment.status)}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancellingPayment(null)}
                disabled={isSubmittingCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingCancel ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Batalkan Transaksi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
