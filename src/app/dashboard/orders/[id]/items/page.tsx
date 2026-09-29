'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMasterOrderItems,
  fetchMasterOrderDetail,
  MasterOrderItem,
  MasterOrder,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Ticket,
  Calendar,
  User,
  Mail,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  RefreshCw,
  Receipt,
  Layers,
} from 'lucide-react';

export default function OrderItemsDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<MasterOrderItem[]>([]);
  const [orderSummary, setOrderSummary] = useState<{
    id: number;
    order_number: string;
    buyer_name: string;
    buyer_email: string;
    event_title: string;
    status: string;
    total_amount: number;
  } | null>(null);
  const [fullOrder, setFullOrder] = useState<MasterOrder | null>(null);

  const loadOrderItems = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      // Fetch both items endpoint and full order detail for complete insights
      const [itemsRes, detailRes] = await Promise.all([
        fetchMasterOrderItems(orderId).catch(() => null),
        fetchMasterOrderDetail(orderId).catch(() => null),
      ]);

      if (itemsRes && itemsRes.data) {
        setItems(itemsRes.data);
        setOrderSummary(itemsRes.order);
      } else if (detailRes && detailRes.items) {
        setItems(detailRes.items);
      }

      if (detailRes) {
        setFullOrder(detailRes);
      }
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Order Items', {
        description: err?.message || 'Terjadi kesalahan saat memuat item transaksi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderItems();
  }, [loadOrderItems]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang item pesanan...', { id: 'refresh-items' });
    await loadOrderItems();
    toast.success('Data Order Items berhasil diperbarui! 🔄', { id: 'refresh-items' });
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

  // Render Status Badge strictly according to requirements:
  // Pending kuning, PAID hijau, Experied merah, cancelled biru, refunded biru langit
  const renderStatusBadge = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PAID
          </span>
        );
      case 'EXPIRED':
      case 'EXPERIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            EXPIRED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-blue-600" />
            CANCELLED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalItemsSubtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  const effectiveOrderNumber = orderSummary?.order_number || fullOrder?.order_number || `#${orderId}`;
  const effectiveBuyerName = orderSummary?.buyer_name || fullOrder?.buyer_name || '-';
  const effectiveBuyerEmail = orderSummary?.buyer_email || fullOrder?.buyer_email || '-';
  const effectiveEventTitle = orderSummary?.event_title || fullOrder?.event?.title || '-';
  const effectiveStatus = orderSummary?.status || fullOrder?.status || 'PENDING';
  const effectiveTotal = orderSummary?.total_amount || fullOrder?.total_amount || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="space-y-2">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Master Order</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Order Items: {effectiveOrderNumber}
                  </h1>
                  {renderStatusBadge(effectiveStatus)}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Rincian seluruh tiket dan item pesanan yang terdaftar pada order ini
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Order Details Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Buyer Info */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pemesan (Buyer)
              </span>
              <span className="text-xs font-black text-slate-900 block truncate" title={effectiveBuyerName}>
                {effectiveBuyerName}
              </span>
              <span className="text-[11px] text-slate-500 block truncate" title={effectiveBuyerEmail}>
                {effectiveBuyerEmail}
              </span>
            </div>
          </div>

          {/* Card 2: Event Title */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Acara / Event
              </span>
              <span className="text-xs font-black text-slate-900 block truncate" title={effectiveEventTitle}>
                {effectiveEventTitle}
              </span>
              {fullOrder?.created_at && (
                <span className="text-[11px] text-slate-500 block truncate">
                  Dibuat: {formatDateTime(fullOrder.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Total Items */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Item / Tiket
              </span>
              <span className="text-sm font-black text-slate-900 block">
                {items.length} tipe ({totalQuantity} tiket)
              </span>
              <span className="text-[11px] text-slate-500 block">
                Subtotal: {formatIDR(totalItemsSubtotal)}
              </span>
            </div>
          </div>

          {/* Card 4: Total Payment */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Pembayaran
              </span>
              <span className="text-sm font-black text-blue-600 block">
                {formatIDR(effectiveTotal)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Metode: {fullOrder?.payment_method || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Breakdown Banner (Subtotal, Tax, Fee) */}
        {fullOrder && (
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Subtotal:</span>
                <span className="font-extrabold text-slate-800">{formatIDR(fullOrder.subtotal)}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[11px] text-slate-500 font-bold block">Local Tax:</span>
                <span className="font-extrabold text-slate-800">{formatIDR(fullOrder.local_tax || fullOrder.local_tax_amount)}</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[11px] text-slate-500 font-bold block">Platform Fee:</span>
                <span className="font-extrabold text-slate-800">{formatIDR(fullOrder.platform_fee)}</span>
              </div>
              {fullOrder.payment_fee > 0 && (
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[11px] text-slate-500 font-bold block">Payment Fee:</span>
                  <span className="font-extrabold text-slate-800">{formatIDR(fullOrder.payment_fee)}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-bold block">Waktu Pembayaran (Paid At):</span>
              <span className="font-black text-slate-900">
                {fullOrder.paid_at ? formatDateTime(fullOrder.paid_at) : 'Belum Dibayar'}
              </span>
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Item Tiket ({items.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Data tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">order_items</code>
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle"># ID</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Item Order (Snapshot)</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Relasi Ticket Type</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap align-middle">Jumlah (Qty)</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Harga Satuan (Unit Price)</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap align-middle">Subtotal</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap align-middle">Waktu Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                        {/* 1. ID */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                          <span className="font-mono text-[11px] text-slate-400">
                            #{item.id}
                          </span>
                        </td>

                        {/* 2. Nama Tiket Snapshot dari Order Items */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                              <Ticket className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block">
                                {item.ticket_type_name || '-'}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Snapshot Pemesanan
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Relasi ke Tabel ticket_types */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          {item.ticket_type ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900">
                                  {item.ticket_type.name}
                                </span>
                                {item.ticket_type.category && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {item.ticket_type.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                                  ID #{item.ticket_type.id}
                                </span>
                                {item.ticket_type.quota !== undefined && item.ticket_type.quota !== null && (
                                  <span>Kuota: {item.ticket_type.quota}</span>
                                )}
                                {item.ticket_type.status && (
                                  <span className={`font-bold ${item.ticket_type.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    • {item.ticket_type.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                              <span>Ticket Type ID: #{item.ticket_type_id}</span>
                            </div>
                          )}
                        </td>

                        {/* 4. Quantity */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {item.quantity} pcs
                          </span>
                        </td>

                        {/* 5. Unit Price */}
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap align-middle">
                          {formatIDR(item.unit_price)}
                        </td>

                        {/* 6. Subtotal */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap align-middle">
                          {formatIDR(item.subtotal)}
                        </td>

                        {/* 7. Created At */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px] align-middle">
                          {formatDateTime(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-black text-slate-900">
                    <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600 align-middle">
                      Total Item Keseluruhan:
                    </td>
                    <td className="py-3.5 px-4 text-center text-blue-700 whitespace-nowrap align-middle">
                      {totalQuantity} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-bold text-[11px] whitespace-nowrap align-middle">
                      Total Subtotal Item:
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-600 text-sm whitespace-nowrap align-middle">
                      {formatIDR(totalItemsSubtotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Item Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pesanan ini tidak memiliki record order_items terdaftar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
