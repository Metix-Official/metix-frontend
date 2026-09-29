'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterOrders,
  MasterOrder,
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
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">#</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Nama Buyer</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Email</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Event</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Order Number</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Subtotal</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Local Tax</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Platform Fee</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Payment Method</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Total Amount</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Status</th>
                      <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Paid At</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map((order, index) => {
                      const rowNumber = (meta.current_page - 1) * meta.per_page + (index + 1);
                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* 0. No Urut */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap text-slate-400 font-mono text-[11px] font-bold">
                            {rowNumber}
                          </td>

                          {/* 1. Nama Buyer */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 block">
                              {order.buyer_name || '-'}
                            </span>
                            {order.buyer_phone && (
                              <span className="text-[10px] text-slate-400 block">
                                {order.buyer_phone}
                              </span>
                            )}
                          </td>

                          {/* 2. Email */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className="text-slate-600 block" title={order.buyer_email}>
                              {order.buyer_email || '-'}
                            </span>
                          </td>

                          {/* 3. Event */}
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className="font-bold text-slate-900 block" title={order.event?.title}>
                              {order.event?.title || '-'}
                            </span>
                          </td>

                          {/* 4. Order Number */}
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

                          {/* 5. Subtotal */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap align-middle">
                            {formatIDR(order.subtotal)}
                          </td>

                          {/* 6. Local Tax */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap align-middle">
                            {formatIDR(order.local_tax || order.local_tax_amount)}
                          </td>

                          {/* 7. Platform Fee */}
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap align-middle">
                            {formatIDR(order.platform_fee)}
                          </td>

                          {/* 8. Payment Method */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold text-[11px]">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              {order.payment_method || '-'}
                            </span>
                          </td>

                          {/* 9. Total Amount */}
                          <td className="py-3.5 px-4 text-right font-black text-blue-600 whitespace-nowrap align-middle text-sm">
                            {formatIDR(order.total_amount)}
                          </td>

                          {/* 10. Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            {renderStatusBadge(order.status)}
                          </td>

                          {/* 11. Paid At */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px] align-middle">
                            {order.paid_at ? (
                              <span className="font-semibold text-slate-700">
                                {formatDateTime(order.paid_at)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* 12. Opsi: Button titik tiga Order Item lempar halaman */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs focus:outline-none"
                                  title="Opsi Order"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-52 p-1.5 rounded-2xl bg-white shadow-xl border border-slate-200 animate-in fade-in-0 zoom-in-95">
                                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Opsi Order #{order.order_number}
                                  </span>
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                  {/* Lempar Halaman: Order Items */}
                                  <Link
                                    href={`/dashboard/orders/${order.id}/items`}
                                    className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors group/item"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Package className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span>Order Items</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-blue-600" />
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
    </DashboardLayout>
  );
}
