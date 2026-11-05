'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  fetchSalesReportData,
  fetchMyEvents,
  fetchMasterEvents,
  getStoredUser,
  ReportOrderItem,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Ticket,
  Search,
  CheckCircle2,
  CreditCard,
  Calendar,
  Download,
  Printer,
  ArrowLeft,
  DollarSign,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';

interface DisplayRowItem {
  id: string | number;
  order_id: number;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  event_title: string;
  event_id?: number | string;
  subtotal: number;
  local_tax: number;
  platform_fee: number;
  payment_method: string;
  total_amount: number;
  category: string;
  ticket_name: string;
  quantity: number;
  status: string;
  created_at: string;
}

function TicketCategoryDetailContent() {
  const searchParams = useSearchParams();

  // Query parameters
  const eventIdParam = searchParams.get('event_id') || 'all';
  const categoryParam = searchParams.get('category') || '';
  const ticketParam = searchParams.get('ticket') || '';
  const eventTitleParam = searchParams.get('event_title') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<ReportOrderItem[]>([]);
  const [eventTitle, setEventTitle] = useState<string>(eventTitleParam);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setCurrentUser(u);
  }, []);

  // Fetch report data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = getStoredUser();
      const userRole = (user?.role || '').toUpperCase();

      const [reportRes, eventsRes] = await Promise.all([
        fetchSalesReportData({
          event_id: eventIdParam !== 'all' ? eventIdParam : undefined,
          month: 'all',
          year: 'all',
          status: 'paid',
        }),
        userRole === 'OWNER'
          ? fetchMasterEvents({ per_page: 100 }).catch(() => ({ events: [] }))
          : fetchMyEvents().catch(() => ({ events: [] })),
      ]);

      const allOrders = reportRes?.orders || [];
      setOrders(allOrders);

      // Resolve event title if missing
      if (!eventTitle) {
        const eventsList = (eventsRes as any)?.events || (eventsRes as any)?.data || [];
        const matchedEvent = eventsList.find((e: any) => String(e.id) === String(eventIdParam));
        if (matchedEvent) {
          setEventTitle(matchedEvent.title);
        } else if (allOrders.length > 0 && allOrders[0]?.event_title) {
          setEventTitle(allOrders[0].event_title);
        }
      }
    } catch (err: any) {
      console.error('Failed to load ticket category sales:', err);
      toast.error('Gagal memuat data transaksi tiket: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventIdParam]);

  // Extract & flatten rows strictly matching target category and ticket type
  const rawTableRows: DisplayRowItem[] = useMemo(() => {
    const list: DisplayRowItem[] = [];
    const normTargetCat = (categoryParam || '').trim().toUpperCase();
    const normTargetTkt = (ticketParam || '').trim().toUpperCase();

    orders.forEach((ord) => {
      // Filter strictly only PAID transactions
      const ordStatus = String(ord.status || '').toLowerCase().trim();
      const isPaid = ordStatus === 'paid' || ordStatus === 'completed' || ordStatus === 'success' || ordStatus === 'settlement';
      if (!isPaid) {
        return;
      }

      // Filter by Event ID if specified
      if (eventIdParam && eventIdParam !== 'all' && String(ord.event_id) !== String(eventIdParam)) {
        return;
      }

      // Check if order has individual ticket records
      const hasTicketsArray = Array.isArray(ord.tickets) && ord.tickets.length > 0;

      if (hasTicketsArray) {
        let matchedInTickets = false;

        ord.tickets!.forEach((t: any, idx: number) => {
          // If ticket has individual status and is cancelled or refunded, skip
          if (t.status) {
            const tStatus = String(t.status || '').toLowerCase().trim();
            if (tStatus === 'cancelled' || tStatus === 'refunded' || tStatus === 'expired') {
              return;
            }
          }

          const tCat = String(t.category || ord.category || ord.ticket_category || '').trim().toUpperCase();
          const tTkt = String(t.ticket_type || ord.ticket_type_name || '').trim().toUpperCase();

          const catMatches = !normTargetCat || tCat.includes(normTargetCat) || normTargetCat.includes(tCat);
          const tktMatches = !normTargetTkt || tTkt.includes(normTargetTkt) || normTargetTkt.includes(tTkt);

          if (catMatches && tktMatches) {
            matchedInTickets = true;
            list.push({
              id: `${ord.id}-${t.id || idx}`,
              order_id: ord.id,
              order_number: ord.order_number,
              buyer_name: t.full_name || ord.buyer_name || ord.full_name || 'Pembeli Metix',
              buyer_email: t.email || ord.buyer_email || 'buyer@metix.id',
              buyer_phone: t.phone || ord.buyer_phone,
              event_title: ord.event_title || eventTitle || 'Event Metix',
              event_id: ord.event_id,
              subtotal: Number(t.price ?? ord.subtotal),
              local_tax: Number(ord.tax_amount ?? 0),
              platform_fee: Number(ord.platform_fee ?? 0),
              payment_method: ord.payment_method || 'Midtrans QRIS / VA',
              total_amount: Number(ord.total_amount || (t.price ?? ord.subtotal)),
              category: t.category || ord.category || ord.ticket_category || categoryParam || 'Reguler',
              ticket_name: t.ticket_type || ord.ticket_type_name || ticketParam || 'Tiket Pass',
              quantity: 1,
              status: 'PAID',
              created_at: ord.created_at,
            });
          }
        });

        if (matchedInTickets) return;
      }

      // Fallback: Check top-level order properties
      const ordCat = String(ord.category || ord.ticket_category || '').trim().toUpperCase();
      const ordTkt = String(ord.ticket_type_name || '').trim().toUpperCase();

      const topCatMatch = !normTargetCat || ordCat.includes(normTargetCat) || normTargetCat.includes(ordCat);
      const topTktMatch = !normTargetTkt || ordTkt.includes(normTargetTkt) || normTargetTkt.includes(ordTkt);

      if (topCatMatch && topTktMatch) {
        list.push({
          id: String(ord.id),
          order_id: ord.id,
          order_number: ord.order_number,
          buyer_name: ord.buyer_name || ord.full_name || 'Pembeli Metix',
          buyer_email: ord.buyer_email || 'buyer@metix.id',
          buyer_phone: ord.buyer_phone,
          event_title: ord.event_title || eventTitle || 'Event Metix',
          event_id: ord.event_id,
          subtotal: Number(ord.subtotal || ord.total_amount),
          local_tax: Number(ord.tax_amount ?? 0),
          platform_fee: Number(ord.platform_fee ?? 0),
          payment_method: ord.payment_method || 'Midtrans QRIS / VA',
          total_amount: Number(ord.total_amount),
          category: ord.category || ord.ticket_category || categoryParam || 'Reguler',
          ticket_name: ord.ticket_type_name || ticketParam || 'Tiket Pass',
          quantity: ord.quantity || 1,
          status: 'PAID',
          created_at: ord.created_at,
        });
      }
    });

    return list;
  }, [orders, eventIdParam, categoryParam, ticketParam, eventTitle]);

  // Search Filter: by Buyer Name, Order Number, and Email
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawTableRows;

    const query = searchQuery.trim().toLowerCase();
    return rawTableRows.filter((item) => {
      const matchName = item.buyer_name.toLowerCase().includes(query);
      const matchOrder = item.order_number.toLowerCase().includes(query);
      const matchEmail = item.buyer_email.toLowerCase().includes(query);
      return matchName || matchOrder || matchEmail;
    });
  }, [rawTableRows, searchQuery]);

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(startIdx, startIdx + pageSize);
  }, [filteredRows, safeCurrentPage, pageSize]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalOmzet = filteredRows.reduce((sum, item) => sum + item.total_amount, 0);
    const totalSubtotal = filteredRows.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = filteredRows.reduce((sum, item) => sum + item.local_tax, 0);
    const totalFee = filteredRows.reduce((sum, item) => sum + item.platform_fee, 0);
    const totalTickets = filteredRows.reduce((sum, item) => sum + item.quantity, 0);
    return { totalOmzet, totalSubtotal, totalTax, totalFee, totalTickets };
  }, [filteredRows]);

  // Copy order number to clipboard helper
  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderNumber(orderNumber);
    toast.success(`Order number ${orderNumber} disalin!`);
    setTimeout(() => {
      setCopiedOrderNumber(null);
    }, 2000);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error('Tidak ada data untuk diexport.');
      return;
    }

    const headers = [
      'No',
      'Nama Buyer',
      'Email',
      'Event',
      'Order Number',
      'Subtotal',
      'Local Tax',
      'Platform Fee',
      'Payment Method',
      'Total Amount',
      'KATEGORI Tiket',
      'Tiket',
      'Status',
      'Tanggal Transaksi',
    ];

    const csvContent = [
      headers.join(';'),
      ...filteredRows.map((r, idx) => [
        idx + 1,
        `"${r.buyer_name.replace(/"/g, '""')}"`,
        `"${r.buyer_email.replace(/"/g, '""')}"`,
        `"${r.event_title.replace(/"/g, '""')}"`,
        `"${r.order_number}"`,
        r.subtotal,
        r.local_tax,
        r.platform_fee,
        `"${r.payment_method}"`,
        r.total_amount,
        `"${r.category}"`,
        `"${r.ticket_name}"`,
        `"${r.status}"`,
        `"${r.created_at}"`,
      ].join(';')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const catClean = (categoryParam || 'kategori').toLowerCase().replace(/\s+/g, '-');
    const tktClean = (ticketParam || 'tiket').toLowerCase().replace(/\s+/g, '-');
    link.download = `data-pembeli-${catClean}-${tktClean}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('File CSV berhasil diunduh.');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. STANDALONE TOP NAVIGATION BAR (TANPA SIDEBAR & TANPA HEADBAR STANDAR) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Context Pill */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-blue-600 group-hover:opacity-90 transition-opacity">
                ME<span className="text-slate-900">TIX</span>
              </span>
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold uppercase tracking-wide">
              Detail Transaksi Tiket
            </span>
          </div>

          {/* Right: User Pill, Kembali ke Dashboard & Tutup Tab */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-extrabold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-slate-400">
                  ({currentUser.role === 'OWNER' ? 'Owner' : 'EO'})
                </span>
              </div>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.history.back();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer"
              title="Tutup Halaman Ini"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Tab</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (FULL-WIDTH CONTAINER) */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* HERO TITLE & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span>Laporan Penjualan</span>
              <span>/</span>
              <span className="text-blue-600 font-extrabold">Detail Kategori Tiket</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Data Pembeli & Transaksi Tiket
              </h1>

              {/* Event Badge */}
              {eventTitle && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {eventTitle}
                </span>
              )}

              {/* Category Badge */}
              {categoryParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold uppercase tracking-wide">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  KATEGORI: {categoryParam}
                </span>
              )}

              {/* Ticket Type Badge */}
              {ticketParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-extrabold">
                  <Ticket className="w-3.5 h-3.5 text-blue-600" />
                  TIKET: {ticketParam}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium max-w-3xl leading-relaxed">
              Daftar seluruh transaksi pembelian tiket khusus untuk kategori <strong>{categoryParam || 'Semua'}</strong> tipe <strong>{ticketParam || 'Semua'}</strong>. Seluruh data disinkronisasi langsung dari sistem transaksi dan laporan penjualan.
            </p>
          </div>

          {/* Action Button: Refresh */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-60"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Transaksi</span>
              <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {filteredRows.length.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Pembelian Berhasil</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Tiket</span>
              <Ticket className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-600 font-mono">
              {summaryMetrics.totalTickets.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Tiket Terjual</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Subtotal</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
              Rp {summaryMetrics.totalSubtotal.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Sebelum Pajak & Biaya</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Omzet Bersih</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              Rp {summaryMetrics.totalOmzet.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Total Pembayaran Diterima</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABLE WRAPPER WITH SEARCH, ROW SELECTOR & PAGINATION */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Action & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            {/* Search Input: by Nama & Order Number */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama Buyer atau Order Number..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Tampilkan:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => setPageSize(Number(val))}
                >
                  <SelectTrigger className="w-[105px] h-9 bg-white border-slate-200 text-xs font-extrabold text-slate-800 rounded-xl shadow-2xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    <SelectItem value="10" className="text-xs font-bold">10 baris</SelectItem>
                    <SelectItem value="25" className="text-xs font-bold">25 baris</SelectItem>
                    <SelectItem value="50" className="text-xs font-bold">50 baris</SelectItem>
                    <SelectItem value="100" className="text-xs font-bold">100 baris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE DATA TABLE (11 KOLOM SESUAI PERMINTAAN USER) */}
          {/* ========================================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Nama Buyer</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Local Tax</th>
                  <th className="py-3.5 px-4 text-right">Platform Fee</th>
                  <th className="py-3.5 px-4 text-center">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">KATEGORI Tiket</th>
                  <th className="py-3.5 px-4 text-center">Tiket</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={13} className="py-4 px-4">
                        <Skeleton className="h-6 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-14 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm mx-auto">
                        <h4 className="text-sm font-black text-slate-800">Tidak Ada Data Transaksi</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {searchQuery
                            ? `Tidak ditemukan transaksi dengan kata kunci "${searchQuery}".`
                            : `Belum ada pembeli atau transaksi tiket untuk kategori ini.`}
                        </p>
                      </div>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
                    const isCopied = copiedOrderNumber === row.order_number;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/40 transition-colors duration-150 group"
                      >
                        {/* 1. Row Number */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                          {rowNumber}
                        </td>

                        {/* 2. Nama Buyer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                              {row.buyer_name ? row.buyer_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="font-extrabold text-slate-900 truncate max-w-[170px]" title={row.buyer_name}>
                              {row.buyer_name}
                            </span>
                          </div>
                        </td>

                        {/* 3. Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11.5px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[190px]" title={row.buyer_email}>
                              {row.buyer_email}
                            </span>
                          </div>
                        </td>

                        {/* 4. Event */}
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] truncate max-w-[160px]"
                            title={row.event_title}
                          >
                            {row.event_title}
                          </span>
                        </td>

                        {/* 5. Order Number */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200/60">
                              {row.order_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyOrderNumber(row.order_number)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                              title="Salin Order Number"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 6. Subtotal */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          Rp {row.subtotal.toLocaleString('id-ID')}
                        </td>

                        {/* 7. Local Tax */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-600">
                          Rp {row.local_tax.toLocaleString('id-ID')}
                        </td>

                        {/* 8. Platform Fee */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-600">
                          Rp {row.platform_fee.toLocaleString('id-ID')}
                        </td>

                        {/* 9. Payment Method */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10.5px] border border-slate-200">
                            <CreditCard className="w-3 h-3 text-slate-500" />
                            {row.payment_method}
                          </span>
                        </td>

                        {/* 10. Total Amount */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-xs">
                          Rp {row.total_amount.toLocaleString('id-ID')}
                        </td>

                        {/* 11. KATEGORI Tiket */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-black text-[10.5px] uppercase tracking-wide">
                            {row.category}
                          </span>
                        </td>

                        {/* 12. Tiket */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-[11px]">
                            {row.ticket_name}
                          </span>
                        </td>

                        {/* 13. Status Pembayaran */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10.5px] uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {row.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM PAGINATION BAR: Range Info & Direct Page Selector */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
            {/* Info Range Items */}
            <div className="text-xs font-semibold text-slate-500">
              Menampilkan{' '}
              <span className="font-black text-slate-900">
                {totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </span>{' '}
              -{' '}
              <span className="font-black text-slate-900">
                {Math.min(safeCurrentPage * pageSize, totalItems)}
              </span>{' '}
              dari <span className="font-black text-slate-900">{totalItems}</span> data transaksi
            </div>

            {/* Pagination Controls & Direct Page Select */}
            <div className="flex items-center gap-2">
              {/* Select Dropdown to Jump to Page */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs font-bold text-slate-500">Halaman:</span>
                <Select
                  value={String(safeCurrentPage)}
                  onValueChange={(val) => setCurrentPage(Number(val))}
                  disabled={totalPages <= 1}
                >
                  <SelectTrigger className="w-[85px] h-8 bg-white border-slate-200 text-xs font-extrabold text-slate-800 rounded-lg shadow-2xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-60">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="text-xs font-bold">
                        Hal {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs font-bold text-slate-400">dari {totalPages}</span>
              </div>

              {/* Prev / Next Buttons */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Pill Indicator */}
              <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs rounded-lg shadow-2xs font-mono">
                {safeCurrentPage}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TicketCategoryDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center">
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
          <div className="p-8 space-y-6 max-w-[1700px] w-full mx-auto">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-[500px] w-full rounded-3xl" />
          </div>
        </div>
      }
    >
      <TicketCategoryDetailContent />
    </Suspense>
  );
}
