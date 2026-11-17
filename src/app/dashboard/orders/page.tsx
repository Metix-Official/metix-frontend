'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterOrders,
  MasterOrder,
  updateMasterOrderApi,
} from '@/lib/api';
import { OrderTicketHoldersModal } from '@/components/dashboard/OrderTicketHoldersModal';
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
  ShoppingBag,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  FilterX,
  MoreVertical,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Package,
  Copy,
  Check,
  Pencil,
  CalendarPlus,
  Loader2,
  UserCheck,
  Plus,
  Minus,
} from 'lucide-react';

export default function MasterOrderPage() {
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

  // Orders State
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  // Quick Edit Paid At State
  const [editingPaidAtOrderId, setEditingPaidAtOrderId] = useState<number | null>(null);
  const [paidAtInput, setPaidAtInput] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('PAID');
  const [isSavingPaidAt, setIsSavingPaidAt] = useState<boolean>(false);

  // Quick Manage Ticket Holders Modal State
  const [openOptionsOrderId, setOpenOptionsOrderId] = useState<number | null>(null);
  const [managingHoldersOrder, setManagingHoldersOrder] = useState<MasterOrder | null>(null);

  // Expandable Table Row State
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set());

  const toggleExpandRow = (orderId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Master Orders from API
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMasterOrders({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      setOrders(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Master Order', {
        description: err?.message || 'Terjadi kesalahan saat memuat data pesanan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, perPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data order...', { id: 'refresh-orders' });
    await loadOrders();
    toast.success('Data Master Order berhasil diperbarui! 🔄', { id: 'refresh-orders' });
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

  // Handle Copy Order Number
  const handleCopyOrderNumber = (orderNumber: string) => {
    if (!orderNumber || orderNumber === '-') return;
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderNumber(orderNumber);
    toast.success(`Nomor order ${orderNumber} berhasil disalin! 📋`);
    setTimeout(() => setCopiedOrderNumber((prev) => (prev === orderNumber ? null : prev)), 2000);
  };

  // Open Paid At Quick Edit Popover
  const handleOpenPaidAtEdit = (order: MasterOrder) => {
    setEditingPaidAtOrderId(order.id);
    let formattedPaidAt = '';
    const pad = (n: number) => String(n).padStart(2, '0');
    if (order.paid_at) {
      const d = new Date(order.paid_at);
      if (!isNaN(d.getTime())) {
        formattedPaidAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    } else {
      const now = new Date();
      formattedPaidAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    setPaidAtInput(formattedPaidAt);
    const currStatus = (order.status || 'PAID').toUpperCase();
    setSelectedStatus(currStatus === 'PENDING' ? 'PAID' : currStatus);
  };

  // Set Current Time Helper
  const handleSetCurrentTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setPaidAtInput(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  // Save Paid At & Status
  const handleSavePaidAt = async (order: MasterOrder) => {
    setIsSavingPaidAt(true);
    try {
      const formattedIso = paidAtInput ? new Date(paidAtInput).toISOString() : null;
      await updateMasterOrderApi(order.id, {
        paid_at: formattedIso,
        status: selectedStatus,
      });

      // Update state in place
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                paid_at: formattedIso,
                status: selectedStatus,
              }
            : o
        )
      );

      toast.success(`Waktu bayar & status Order #${order.order_number} berhasil diperbarui! 🎉`);
      setEditingPaidAtOrderId(null);
    } catch (err: any) {
      toast.error('Gagal Memperbarui Waktu Bayar', {
        description: err.message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsSavingPaidAt(false);
    }
  };

  // Render Status Badge strictly according to requirements:
  // Pending kuning, PAID hijau, Experied merah, cancelled biru, refunded biru langit
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PAID
          </span>
        );
      case 'EXPIRED':
      case 'EXPERIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            EXPIRED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-blue-600" />
            CANCELLED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
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
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Order
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Kelola dan pantau seluruh transaksi pesanan tiket dengan data terintegrasi
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Order:</span>
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
                placeholder="Cari nomor order, nama buyer, email, event..."
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

        {/* Orders Table Container */}
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
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[850px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 w-16 text-center whitespace-nowrap align-middle">#</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Buyer</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Event</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Order Number</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Tanggal</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Total</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map((order, index) => {
                      const rowNumber = (meta.current_page - 1) * meta.per_page + (index + 1);
                      const isExpanded = expandedOrderIds.has(order.id);

                      return (
                        <React.Fragment key={order.id}>
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
                                  onClick={(e) => toggleExpandRow(order.id, e)}
                                  className={cn(
                                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs border',
                                    isExpanded
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                                      : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200'
                                  )}
                                  title={
                                    isExpanded
                                      ? 'Tutup detail pesanan'
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

                            {/* Nama Buyer + Kontak */}
                            <td className="py-3.5 px-4 align-middle">
                              <div className="flex flex-col min-w-0 max-w-[180px]">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                  {order.buyer_name || '-'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium truncate" title={order.buyer_email}>
                                  {order.buyer_email || '-'}
                                </span>
                                {order.buyer_phone && (
                                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                                    {order.buyer_phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Event */}
                            <td className="py-3.5 px-4 align-middle">
                              <span
                                className="font-bold text-slate-800 line-clamp-2 max-w-[200px] leading-snug"
                                title={order.event?.title}
                              >
                                {order.event?.title || '-'}
                              </span>
                            </td>

                            {/* Order Number */}
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleCopyOrderNumber(order.order_number)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer group shadow-2xs ${
                                  copiedOrderNumber === order.order_number
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/20'
                                    : 'bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border-slate-200 hover:border-blue-300'
                                }`}
                                title="Klik untuk salin nomor order"
                              >
                                <span>{order.order_number}</span>
                                {copiedOrderNumber === order.order_number ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                                )}
                              </button>
                            </td>

                            {/* Tanggal */}
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-700">
                                {formatDateTime(order.created_at)}
                              </span>
                            </td>

                            {/* Total Amount */}
                            <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                              <span className="font-black text-blue-700 text-xs">
                                {formatIDR(order.total_amount)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                              {renderStatusBadge(order.status)}
                            </td>

                            {/* Aksi: Menu Titik Tiga */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                              <Popover
                                open={openOptionsOrderId === order.id}
                                onOpenChange={(open) => setOpenOptionsOrderId(open ? order.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs focus:outline-none"
                                    title="Menu Aksi Order"
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
                                      Aksi Order #{order.order_number}
                                    </span>
                                  </div>
                                  <div className="flex flex-col space-y-0.5">
                                    {/* Ubah Pemegang Tiket */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenOptionsOrderId(null);
                                        setManagingHoldersOrder(order);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer text-left"
                                    >
                                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Ubah Pemegang Tiket</span>
                                    </button>

                                    {/* Order Items & Tiket */}
                                    <Link
                                      href={`/dashboard/orders/${order.id}/items`}
                                      onClick={() => setOpenOptionsOrderId(null)}
                                      className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <Package className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>Order Items & Tiket</span>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>

                                    {/* Ubah Waktu Bayar */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenOptionsOrderId(null);
                                        handleOpenPaidAtEdit(order);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer text-left"
                                    >
                                      <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>Ubah Waktu Bayar</span>
                                    </button>

                                    <div className="h-px bg-slate-100 my-1" />

                                    {/* Salin No Order */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenOptionsOrderId(null);
                                        handleCopyOrderNumber(order.order_number);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                                    >
                                      <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                                      <span>Salin No. Order</span>
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
                                        <Package className="w-3.5 h-3.5 text-blue-600" />
                                        Rincian Lengkap Pesanan
                                      </span>
                                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                                        #{order.order_number}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Quick Link to Order Items */}
                                      <Link
                                        href={`/dashboard/orders/${order.id}/items`}
                                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-blue-200"
                                      >
                                        <Package className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Order Items & Tiket</span>
                                        <ExternalLink className="w-3 h-3 text-blue-500" />
                                      </Link>

                                      {/* Quick Button to Ticket Holders */}
                                      <button
                                        type="button"
                                        onClick={() => setManagingHoldersOrder(order)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                      >
                                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Ubah Pemegang Tiket</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Grid Informasi Lengkap */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    {/* Kolom 1: Rincian Biaya & Pajak */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Rincian Biaya & Pajak
                                      </span>
                                      <div className="pt-0.5 space-y-1">
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Subtotal:</span>
                                          <span className="font-semibold">{formatIDR(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Pajak Daerah:</span>
                                          <span className="font-semibold">{formatIDR(order.local_tax || order.local_tax_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                          <span>Biaya Platform:</span>
                                          <span className="font-semibold">{formatIDR(order.platform_fee)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-extrabold text-blue-700">
                                          <span>Total Tagihan:</span>
                                          <span>{formatIDR(order.total_amount)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Kolom 2: Pembayaran & Paid At (Interactive Popover) */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Pembayaran & Waktu Bayar
                                      </span>
                                      <div className="pt-0.5 space-y-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 text-[11px]">Metode:</span>
                                          <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] inline-flex items-center gap-1">
                                            <CreditCard className="w-3 h-3 text-slate-400" />
                                            {order.payment_method || '-'}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-slate-400 text-[11px] block">Waktu Bayar:</span>
                                          <Popover
                                            open={editingPaidAtOrderId === order.id}
                                            onOpenChange={(open) => {
                                              if (open) {
                                                handleOpenPaidAtEdit(order);
                                              } else {
                                                setEditingPaidAtOrderId(null);
                                              }
                                            }}
                                          >
                                            <PopoverTrigger asChild>
                                              <button
                                                type="button"
                                                className={`group/btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                                                  order.paid_at
                                                    ? 'bg-white hover:bg-blue-50 border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700'
                                                    : 'bg-amber-50/60 hover:bg-blue-50 border-dashed border-amber-300 hover:border-blue-300 text-amber-700 hover:text-blue-700'
                                                }`}
                                                title="Klik untuk ubah waktu pembayaran"
                                              >
                                                {order.paid_at ? (
                                                  <>
                                                    <span>{formatDateTime(order.paid_at)}</span>
                                                    <Pencil className="w-3 h-3 text-slate-400 group-hover/btn:text-blue-600 transition-colors" />
                                                  </>
                                                ) : (
                                                  <>
                                                    <CalendarPlus className="w-3.5 h-3.5 text-amber-500 group-hover/btn:text-blue-600 transition-colors" />
                                                    <span className="italic">Belum diset (Klik Edit)</span>
                                                    <Pencil className="w-3 h-3 text-slate-400 group-hover/btn:text-blue-600 transition-colors opacity-70" />
                                                  </>
                                                )}
                                              </button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                              align="start"
                                              side="bottom"
                                              className="w-80 p-4 rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in-0 zoom-in-95 z-50 space-y-3.5"
                                            >
                                              {/* Popover Header */}
                                              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                  </div>
                                                  <div>
                                                    <h4 className="text-xs font-black text-slate-900">Ubah Waktu Bayar</h4>
                                                    <p className="text-[10px] text-slate-500 font-mono">Order #{order.order_number}</p>
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingPaidAtOrderId(null)}
                                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>

                                              {/* Quick Shortcuts */}
                                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                                <span className="text-slate-400 font-semibold">Pintas:</span>
                                                <button
                                                  type="button"
                                                  onClick={handleSetCurrentTime}
                                                  className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer"
                                                >
                                                  Waktu Sekarang
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setPaidAtInput('')}
                                                  className="px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold border border-slate-200 transition-colors cursor-pointer"
                                                >
                                                  Kosongkan
                                                </button>
                                              </div>

                                              {/* Datetime Picker */}
                                              <div className="space-y-1 text-left">
                                                <label className="text-[11px] font-semibold text-slate-700">
                                                  Tanggal & Jam Bayar
                                                </label>
                                                <input
                                                  type="datetime-local"
                                                  value={paidAtInput}
                                                  onChange={(e) => setPaidAtInput(e.target.value)}
                                                  className="w-full px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-medium text-slate-900 shadow-2xs focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                                />
                                              </div>

                                              {/* Status Option */}
                                              <div className="space-y-1 text-left">
                                                <label className="text-[11px] font-semibold text-slate-700">
                                                  Status Pesanan
                                                </label>
                                                <Select
                                                  value={selectedStatus}
                                                  onValueChange={(val) => setSelectedStatus(val)}
                                                >
                                                  <SelectTrigger className="w-full py-1.5 h-9 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-bold shadow-2xs">
                                                    <SelectValue placeholder="Pilih status" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="PAID" className="text-xs font-bold text-emerald-700">
                                                      PAID (Lunas)
                                                    </SelectItem>
                                                    <SelectItem value="PENDING" className="text-xs font-bold text-amber-700">
                                                      PENDING (Menunggu)
                                                    </SelectItem>
                                                    <SelectItem value="CANCELLED" className="text-xs font-bold text-rose-700">
                                                      CANCELLED (Batal)
                                                    </SelectItem>
                                                    <SelectItem value="EXPIRED" className="text-xs font-bold text-slate-600">
                                                      EXPIRED (Kedaluwarsa)
                                                    </SelectItem>
                                                    <SelectItem value="REFUNDED" className="text-xs font-bold text-purple-700">
                                                      REFUNDED (Dikembalikan)
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>

                                              {/* Info Note */}
                                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10.5px] text-slate-500 leading-tight">
                                                💡 Jika status diubah ke <strong>PAID</strong>, tiket & QR code pemesan akan otomatis diterbitkan.
                                              </div>

                                              {/* Action Buttons */}
                                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingPaidAtOrderId(null)}
                                                  disabled={isSavingPaidAt}
                                                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                  Batal
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSavePaidAt(order)}
                                                  disabled={isSavingPaidAt}
                                                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                  {isSavingPaidAt ? (
                                                    <>
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                      <span>Menyimpan...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Check className="w-3.5 h-3.5" />
                                                      <span>Simpan</span>
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
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
                                          {order.buyer_name || '-'}
                                        </div>
                                        <div className="text-slate-500 text-[11px] truncate" title={order.buyer_email}>
                                          {order.buyer_email || '-'}
                                        </div>
                                        <div className="text-slate-600 font-semibold text-[11px]">
                                          {order.buyer_phone || '-'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Kolom 4: Event & Riwayat Waktu */}
                                    <div className="space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Event & Riwayat Waktu
                                      </span>
                                      <div className="pt-0.5 space-y-1">
                                        <div className="font-bold text-slate-800 truncate" title={order.event?.title}>
                                          {order.event?.title || '-'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>Dibuat: {formatDateTime(order.created_at)}</span>
                                        </div>
                                        {order.expires_at && (
                                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span>Kedaluwarsa: {formatDateTime(order.expires_at)}</span>
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
                    <strong className="text-slate-900">{meta.total}</strong> order
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
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Order Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada hasil yang cocok dengan kata kunci atau status yang Anda filter.'
                    : 'Belum ada data transaksi order yang tersimpan di sistem.'}
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

      <OrderTicketHoldersModal
        order={managingHoldersOrder}
        onClose={() => setManagingHoldersOrder(null)}
      />
    </DashboardLayout>
  );
}
