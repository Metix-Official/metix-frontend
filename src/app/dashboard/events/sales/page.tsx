'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchSalesReportData,
  fetchMyEvents,
  getStoredUser,
  ReportOrderItem,
  ApiEvent,
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
  Clock,
  XCircle,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  Download,
  Printer,
  ArrowLeft,
  Users,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Coffee,
} from 'lucide-react';

export default function EventSalesDetailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ReportOrderItem[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Filter ONLY Published Events for Select Options
  const publishedEvents = useMemo(() => {
    return events.filter((ev) => {
      const st = String(ev.status || '').toLowerCase();
      return st === 'published' || st === 'active';
    });
  }, [events]);

  // Extract distinct Ticket Categories strictly from ticket_types.category for selectedEventId
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    
    // 1. Extract from events (filtered by selectedEventId)
    const targetEvents = selectedEventId === 'all'
      ? events
      : events.filter((ev) => String(ev.id) === selectedEventId);

    targetEvents.forEach((ev) => {
      if (ev.ticket_types) {
        ev.ticket_types.forEach((tt) => {
          const cat = (tt as any).category;
          if (cat && String(cat).trim() && String(cat).trim() !== 'null' && String(cat).trim() !== 'undefined') {
            set.add(String(cat).trim());
          }
        });
      }
    });

    // 2. Extract from orders (filtered by selectedEventId) as fallback if order has category
    const targetOrders = selectedEventId === 'all'
      ? orders
      : orders.filter((o) => String(o.event_id) === selectedEventId);

    targetOrders.forEach((o) => {
      const cat = (o as any).category || (o as any).ticket_category;
      if (cat && String(cat).trim() && String(cat).trim() !== 'null' && String(cat).trim() !== 'undefined') {
        set.add(String(cat).trim());
      }
      if (o.tickets) {
        o.tickets.forEach((t: any) => {
          if (t.category && String(t.category).trim() && String(t.category).trim() !== 'null') {
            set.add(String(t.category).trim());
          }
        });
      }
    });

    return Array.from(set);
  }, [orders, events, selectedEventId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [repData, evData] = await Promise.all([
        fetchSalesReportData({
          event_id: selectedEventId,
          month: 'all',
          year: 'all',
        }),
        fetchMyEvents(),
      ]);

      setEvents(evData.events || []);
      setOrders(repData.orders || []);
    } catch (err) {
      console.error('Error loading sales data:', err);
      toast.error('Gagal memuat rincian transaksi tiket');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Event filter
      if (selectedEventId !== 'all' && String(ord.event_id) !== selectedEventId) {
        return false;
      }
      // Category filter (mencocokkan murni kolom 'category' dari tabel ticket_types)
      if (selectedCategory !== 'all') {
        const targetCat = selectedCategory.toLowerCase().trim();
        const ordCategory = String((ord as any).category || (ord as any).ticket_category || '').toLowerCase().trim();
        const ticketCategoryMatches = ord.tickets && ord.tickets.some((t: any) => String(t.category || '').toLowerCase().trim() === targetCat);

        if (ordCategory !== targetCat && !ticketCategoryMatches) {
          return false;
        }
      }
      // Payment Method filter
      if (selectedPaymentMethod !== 'all' && ord.payment_method !== selectedPaymentMethod) {
        return false;
      }
      // Status filter (strictly only show paid/completed orders)
      const isPaid = ord.status === 'paid' || ord.status === 'completed';
      if (!isPaid) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrderNumber = ord.order_number.toLowerCase().includes(q);
        const matchBuyer = (ord.buyer_name || '').toLowerCase().includes(q);
        const matchFullName = (ord.full_name || '').toLowerCase().includes(q);
        const matchEvent = (ord.event_title || '').toLowerCase().includes(q);
        const matchTicketType = (ord.ticket_type_name || '').toLowerCase().includes(q);
        const matchAttendees = ord.attendees ? ord.attendees.some(a => a.toLowerCase().includes(q)) : false;
        const matchPayment = (ord.payment_method || '').toLowerCase().includes(q);

        return (
          matchOrderNumber ||
          matchBuyer ||
          matchFullName ||
          matchEvent ||
          matchTicketType ||
          matchAttendees ||
          matchPayment
        );
      }
      return true;
    });
  }, [orders, selectedEventId, selectedCategory, selectedPaymentMethod, selectedStatus, searchQuery]);

  // Aggregate Metrics from filtered data
  const totalTicketsSold = useMemo(() => {
    return filteredOrders.reduce((acc, ord) => acc + (ord.quantity || 1), 0);
  }, [filteredOrders]);

  const totalGrossRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'paid' || o.status === 'completed')
      .reduce((acc, ord) => acc + ord.total_amount, 0);
  }, [filteredOrders]);

  const totalSubtotal = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'paid' || o.status === 'completed')
      .reduce((acc, ord) => acc + (ord.subtotal || ord.total_amount), 0);
  }, [filteredOrders]);

  // Distinct payment methods extracted from orders
  const availablePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.payment_method && o.payment_method.trim()) set.add(o.payment_method.trim());
    });
    return Array.from(set);
  }, [orders]);

  // Helper to escape values for CSV
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // CSV Export Handler with Executive Corporate Header
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor');
      return;
    }

    try {
      const currentUser = getStoredUser();
      const eoName = currentUser?.name || 'Event Organizer';
      const eoEmail = currentUser?.email || '-';

      const selectedEventObj = events.find((e) => String(e.id) === selectedEventId);
      const eventCoverageName =
        selectedEventId === 'all'
          ? 'Semua Event (Akumulasi Seluruh Event)'
          : selectedEventObj?.title || `Event #${selectedEventId}`;

      const statusFilterLabel =
        selectedStatus === 'all'
          ? 'Semua Status (Lunas & Pending)'
          : selectedStatus === 'paid'
            ? 'Hanya Lunas / Paid'
            : 'Hanya Pending';

      const paymentFilterLabel =
        selectedPaymentMethod === 'all'
          ? 'Semua Metode Pembayaran'
          : selectedPaymentMethod;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const downloadTimestampStr = `${formattedDate}, ${formattedTime} WIB`;

      const lines: string[] = [];

      // 1. Executive Platform Header Banner
      lines.push(escapeCsv('METIX ENTERPRISE — OFFICIAL SALES & ATTENDEES AUDIT REPORT'));
      lines.push(escapeCsv('LAPORAN RESMI TRANSAKSI PENJUALAN TIKET & DATA REKAPITULASI PENGUNJUNG'));
      lines.push('');

      // 2. Organization & Filter Metadata Block
      lines.push([escapeCsv('INFORMASI DOKUMEN & PENYELENGGARA (EO)'), '', '', ''].join(','));
      lines.push([
        escapeCsv('Penyelenggara (EO):'),
        escapeCsv(eoName),
        escapeCsv('Waktu Unduh Laporan:'),
        escapeCsv(downloadTimestampStr),
      ].join(','));
      lines.push([
        escapeCsv('Email Penyelenggara:'),
        escapeCsv(eoEmail),
        escapeCsv('Zona Waktu:'),
        escapeCsv('Asia/Jakarta (WIB)'),
      ].join(','));
      lines.push([
        escapeCsv('Cakupan Event:'),
        escapeCsv(eventCoverageName),
        escapeCsv('Filter Status Pembayaran:'),
        escapeCsv(statusFilterLabel),
      ].join(','));
      lines.push([
        escapeCsv('Filter Metode Bayar:'),
        escapeCsv(paymentFilterLabel),
        escapeCsv('Total Data Transaksi:'),
        escapeCsv(`${filteredOrders.length} Pesanan`),
      ].join(','));
      lines.push('');

      // 3. Executive KPI Summary Block
      lines.push([escapeCsv('RINGKASAN EKSEKUTIF PENJUALAN (EXECUTIVE KPI SUMMARY)'), '', '', ''].join(','));
      lines.push([
        escapeCsv('Total Tiket Terjual:'),
        escapeCsv(`${totalTicketsSold} Tiket`),
        escapeCsv('Total Nilai Subtotal:'),
        escapeCsv(`Rp ${totalSubtotal.toLocaleString('id-ID')}`),
      ].join(','));
      lines.push([
        escapeCsv('Total Transaksi Selesai:'),
        escapeCsv(`${filteredOrders.filter((o) => o.status === 'paid' || o.status === 'completed').length} Transaksi Lunas`),
        escapeCsv('Total Omzet Bruto Lunas:'),
        escapeCsv(`Rp ${totalGrossRevenue.toLocaleString('id-ID')}`),
      ].join(','));
      lines.push('');

      // 4. Tabular Data Header
      const tableHeaders = [
        'No.',
        'No. Order / Invoice',
        'Kode E-Tiket',
        'Nama Event',
        'Kategori Tiket',
        'Nama Lengkap Pengunjung (Attendee)',
        'Email Pembeli',
        'No. WhatsApp / Telepon',
        'Qty Tiket',
        'Harga Satuan Tiket (Rp)',
        'Subtotal Order (Rp)',
        'Metode Pembayaran',
        'Total Tagihan Order (Rp)',
        'Status Pembayaran',
        'Tanggal Transaksi',
        'Waktu Transaksi (WIB)',
      ];
      lines.push(tableHeaders.map(escapeCsv).join(','));

      // 5. Data Rows (with complete attendee breakout if available)
      let rowNumber = 1;
      filteredOrders.forEach((ord) => {
        const isPaid = ord.status === 'paid' || ord.status === 'completed';
        const statusText = isPaid ? 'Lunas / Paid' : 'Pending';
        const dateObj = new Date(ord.created_at);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          : '-';
        const timeStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
          : '-';

        if (ord.tickets && ord.tickets.length > 0) {
          // Breakout each ticket attendee so every participant is clearly audited
          ord.tickets.forEach((t) => {
            const ticketPrice =
              t.price ??
              (ord.quantity
                ? Math.round((ord.subtotal || ord.total_amount) / ord.quantity)
                : ord.subtotal || ord.total_amount);

            lines.push([
              rowNumber++,
              escapeCsv(ord.order_number),
              escapeCsv(t.ticket_code || '-'),
              escapeCsv(ord.event_title || '-'),
              escapeCsv(t.ticket_type || ord.ticket_type_name || '-'),
              escapeCsv(t.full_name || ord.full_name || ord.buyer_name || '-'),
              escapeCsv(t.email || ord.buyer_email || '-'),
              escapeCsv(t.phone && t.phone !== '-' ? t.phone : ord.buyer_phone || '-'),
              1,
              ticketPrice,
              ord.subtotal || ord.total_amount,
              escapeCsv(ord.payment_method || '-'),
              ord.total_amount,
              escapeCsv(statusText),
              escapeCsv(dateStr),
              escapeCsv(timeStr),
            ].join(','));
          });
        } else {
          // Single order row
          lines.push([
            rowNumber++,
            escapeCsv(ord.order_number),
            escapeCsv('-'),
            escapeCsv(ord.event_title || '-'),
            escapeCsv(ord.ticket_type_name || '-'),
            escapeCsv(ord.full_name || ord.buyer_name || '-'),
            escapeCsv(ord.buyer_email || '-'),
            escapeCsv(ord.buyer_phone || '-'),
            ord.quantity || 1,
            ord.subtotal || ord.total_amount,
            ord.subtotal || ord.total_amount,
            escapeCsv(ord.payment_method || '-'),
            ord.total_amount,
            escapeCsv(statusText),
            escapeCsv(dateStr),
            escapeCsv(timeStr),
          ].join(','));
        }
      });

      // 6. Grand Total Akumulasi Row
      lines.push('');
      lines.push([
        escapeCsv('TOTAL AKUMULASI'),
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(''),
        totalTicketsSold,
        '',
        totalSubtotal,
        escapeCsv(''),
        totalGrossRevenue,
        escapeCsv(`${filteredOrders.length} Pesanan`),
        escapeCsv(''),
        escapeCsv(''),
      ].join(','));

      // 7. Official Legal & Integrity Footnote
      lines.push('');
      lines.push(
        escapeCsv(
          '*** CATATAN RESMI: Laporan ini diekspor secara otomatis oleh METIX Enterprise Management Platform dan sah sebagai rekonsiliasi data penjualan serta registrasi pengunjung resmi. ***'
        )
      );
      lines.push(
        escapeCsv(
          `*** Hak Cipta © ${now.getFullYear()} METIX (PT Metix Indonesia). Seluruh data transaksi dilindungi sistem enkripsi platform. ***`
        )
      );

      // 8. Create UTF-8 BOM Blob and Trigger Download
      const csvString = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const eventSlug =
        selectedEventId === 'all'
          ? 'Semua_Event'
          : (selectedEventObj?.title || 'Event')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .slice(0, 25);
      const dateFileSlug = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeFileSlug = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `METIX_Laporan_Penjualan_${eventSlug}_${dateFileSlug}_${timeFileSlug}.csv`;

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengunduh laporan penjualan: ${fileName}`);
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Terjadi kesalahan saat memproses ekspor CSV');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Laporan Penjualan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              Detail Total Penjualan Event & Attendees
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black shadow-2xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Real-time Audit
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <p className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5">
                <span>Akumulasi rekapitulasi tiket terjual dari seluruh event Anda beserta daftar identitas</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/60 shadow-2xs">
                  <Users className="w-3 h-3 text-blue-600" />
                  Ticket Attendees
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Export CSV / Excel</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold tracking-wide">
                {filteredOrders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Tiket Terjual
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {totalTicketsSold.toLocaleString('id-ID')}{' '}
              <span className="text-[11px] font-bold text-slate-500">Tiket</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Dari seluruh event aktif
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Omzet (Subtotal)
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Rp {totalSubtotal.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Subtotal harga tiket sebelum biaya platform
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Bruto (Total Amount)
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight text-emerald-700">
              Rp {totalGrossRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Akumulasi pembayaran terverifikasi (*paid*)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Event Terdata
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {events.length}{' '}
              <span className="text-[11px] font-bold text-slate-500">Event</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Event yang dimiliki akun Event Organizer ini
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. Order, nama attendee, event, atau tiket..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-2xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Event Selector (Hanya Event Published) */}
              <div className="w-48 sm:w-56">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Semua Event Published" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 Semua Event Published ({publishedEvents.length})</SelectItem>
                    {publishedEvents.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        🎫 {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter Dropdown */}
              <div className="w-44">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Kategori Tiket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏷️ Semua Kategori</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        🏷️ {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="w-40">
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Metode Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    {availablePaymentMethods.map((pm) => (
                      <SelectItem key={pm} value={pm}>
                        {pm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Daftar Transaksi Tiket & Attendees ({filteredOrders.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Tabel memuat rincian No. Order, Nama Lengkap Pengunjung, Nama Event, Tipe Tiket, Subtotal, Metode Pembayaran, Total Amount, dan Tanggal Pembelian.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2.5 py-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[900px]">
                <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Nama Lengkap (Attendee)</th>
                    <th className="py-2.5 px-3">Nama Event</th>
                    <th className="py-2.5 px-3">Tipe & Kategori Tiket</th>
                    <th className="py-2.5 px-3">Subtotal (Rp)</th>
                    <th className="py-2.5 px-3">Metode Bayar</th>
                    <th className="py-2.5 px-3">Total Amount (Rp)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Tanggal Beli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    const hasTickets = Boolean((ord.tickets && ord.tickets.length > 0) || ord.quantity > 0);
                    const ticketsList = (ord.tickets && ord.tickets.length > 0)
                      ? ord.tickets
                      : [
                          {
                            id: ord.id,
                            ticket_code: ord.order_number,
                            ticket_type: ord.ticket_type_name || 'Tiket',
                            full_name: ord.full_name || ord.buyer_name || 'Peserta',
                            email: ord.buyer_email,
                            phone: ord.buyer_phone,
                          }
                        ];
                    const isPaid = ord.status === 'paid' || ord.status === 'completed';

                    const rawTotal = Number(ord.total_amount || 0);
                    let rawSubtotal = Number(ord.subtotal || ord.original_subtotal || 0);
                    let rawTax = Number((ord as any).local_tax_amount ?? ord.tax_amount ?? (ord as any).tax ?? 0);
                    let rawFee = Number(ord.platform_fee ?? (ord as any).fee_platform ?? 0);

                    if (rawSubtotal === 0 && rawTotal > 0) {
                      rawSubtotal = Math.round(rawTotal / 1.12);
                    }
                    if (rawTax === 0 && rawSubtotal > 0) {
                      rawTax = Math.round(rawSubtotal * 0.05);
                    }
                    if (rawFee === 0 && rawSubtotal > 0) {
                      rawFee = (rawTotal > rawSubtotal + rawTax) ? (rawTotal - rawSubtotal - rawTax) : Math.round(rawSubtotal * 0.07);
                    }
                    const rowSubtotal = rawSubtotal;
                    const rowTax = rawTax;
                    const rowFee = rawFee;
                    const rowTotal = rawTotal > 0 ? rawTotal : (rowSubtotal + rowTax + rowFee);

                    const discountAmount = Number(ord.discount_amount || 0);
                    const hasDiscount = discountAmount > 0;

                    const rawBenefitName = ord.benefit_name || (ord as any).promo?.benefit_name || (ord.tickets && ord.tickets[0]?.benefit_name) || '';
                    const rawBenefitType = ord.benefit_type || (ord as any).promo?.benefit_type || (ord.tickets && ord.tickets[0]?.benefit_type) || '';

                    const isCoffeeBenefit =
                      rawBenefitType === 'FREE_COFFEE' ||
                      rawBenefitName.toLowerCase().includes('kopi') ||
                      rawBenefitName.toLowerCase().includes('coffee') ||
                      Boolean(rawBenefitName);

                    const isDiscountPromo = hasDiscount;
                    const isCoffeePromo = Boolean(isCoffeeBenefit || (ord.promo_code && !hasDiscount));
                    const hasAnyPromo = Boolean(ord.promo_code || isDiscountPromo || isCoffeePromo);

                    const originalSubtotal = Number(ord.original_subtotal || ord.subtotal || ord.total_amount);
                    const netSubtotal = Math.max(0, originalSubtotal - discountAmount);

                    return (
                      <React.Fragment key={ord.id}>
                        <tr
                          className={`hover:bg-blue-50/40 transition-colors group ${isExpanded ? 'bg-blue-50/50' : ''
                            }`}
                        >
                          {/* 1. Order Number */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-slate-900 group-hover:text-blue-700 transition-colors text-xs">
                                {ord.order_number}
                              </span>
                              {hasTickets && ord.tickets!.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                  className="p-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                  title="Lihat rincian per tiket"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 block">
                              {ord.quantity} Tiket
                            </span>
                          </td>

                          {/* 2. Full Name (Attendee) */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-xs">
                                {ord.full_name || ord.buyer_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {ord.buyer_email}
                              </span>
                              {ord.buyer_phone && ord.buyer_phone !== '-' && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {ord.buyer_phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Nama Event */}
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 max-w-[180px] truncate block text-xs" title={ord.event_title}>
                              {ord.event_title || 'Event Metix'}
                            </span>
                          </td>

                          {/* 4. Tipe & Kategori Tiket (Stacked Vertically) */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                                <Ticket className="w-2.5 h-2.5" />
                                {ord.ticket_type_name || 'Tiket Pass'}
                              </span>
                              {(() => {
                                let cat = (ord as any).category || (ord as any).ticket_category;
                                if (!cat && ord.tickets) {
                                  const foundTicket = ord.tickets.find((t: any) => t.category && String(t.category).trim());
                                  if (foundTicket) cat = foundTicket.category;
                                }
                                return cat ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-black">
                                    🏷️ {cat}
                                  </span>
                                ) : null;
                              })()}

                              {/* Badges Pembeda Promo */}
                              {hasAnyPromo && (
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {isDiscountPromo && (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-extrabold shadow-2xs">
                                        <Tag className="w-2.5 h-2.5 text-purple-600" />
                                        <span>{ord.promo_code || 'PROMO'}</span>
                                      </span>
                                      <span className="inline-flex items-center text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/80">
                                        -Rp {discountAmount.toLocaleString('id-ID')}
                                      </span>
                                    </>
                                  )}

                                  {isCoffeePromo && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-[9px] font-extrabold shadow-2xs">
                                      <Coffee className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                      <span>{ord.promo_code || 'KODE KOPI'}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 5. Subtotal */}
                          <td className="py-2.5 px-3 font-extrabold text-slate-800 text-xs">
                            {isDiscountPromo ? (
                              <div className="flex flex-col items-start justify-center gap-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold leading-tight font-mono">
                                  <span className="text-[9px]">Awal:</span>
                                  <span className="line-through decoration-rose-500 decoration-1.5">
                                    Rp {originalSubtotal.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <span className="text-[10px] font-extrabold text-rose-600 leading-tight font-mono">
                                  - Rp {discountAmount.toLocaleString('id-ID')}
                                </span>
                                <span className="font-black text-slate-900 text-xs font-mono mt-0.5">
                                  Rp {netSubtotal.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ) : isCoffeePromo ? (
                              <div className="flex flex-col items-start justify-center gap-0.5">
                                <span className="font-black text-slate-900 text-xs font-mono">
                                  Rp {(ord.subtotal || ord.total_amount).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1">
                                  <Coffee className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Klaim Kopi</span>
                                </span>
                              </div>
                            ) : (
                              <span>Rp {(ord.subtotal || ord.total_amount).toLocaleString('id-ID')}</span>
                            )}
                          </td>

                          {/* 6. Payment Method */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                              <CreditCard className="w-2.5 h-2.5 text-slate-500" />
                              {ord.payment_method || 'Midtrans'}
                            </span>
                          </td>

                          {/* 7. Total Amount */}
                          <td className="py-2.5 px-3 font-black text-slate-900 text-xs">
                            Rp {ord.total_amount.toLocaleString('id-ID')}
                          </td>

                          {/* 8. Status */}
                          <td className="py-2.5 px-3">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Paid
                              </span>
                            ) : ord.status === 'pending' || ord.status === 'unpaid' || ord.status === 'waiting_payment' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                                <XCircle className="w-2.5 h-2.5 text-rose-600" /> {ord.status}
                              </span>
                            )}
                          </td>

                          {/* 9. Tanggal Beli */}
                          <td className="py-2.5 px-3 text-right text-slate-500 font-medium text-[10px] whitespace-nowrap">
                            <span className="block font-bold text-slate-800">
                              {new Date(ord.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(ord.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} WIB
                            </span>
                          </td>
                        </tr>

                        {/* Expandable sub-row for multiple tickets in one order */}
                        {isExpanded && hasTickets && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={9} className="p-3 sm:p-4">
                              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-black text-slate-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span>
                                      Rincian Tiket & Pemesan ({ticketsList.length} Peserta)
                                    </span>
                                  </h5>
                                  <span className="text-[11px] font-mono font-bold text-slate-500">
                                    No. Order: <span className="text-slate-900">{ord.order_number}</span>
                                  </span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                      <tr>
                                        <th className="py-2.5 px-3.5">Nama Pemesan Tiket</th>
                                        <th className="py-2.5 px-3.5">Kode & Tipe Tiket</th>
                                        <th className="py-2.5 px-3.5 text-center w-[80px]">Qty</th>
                                        <th className="py-2.5 px-3.5 text-right min-w-[130px]">Subtotal Tiket</th>
                                        <th className="py-2.5 px-3.5 text-right min-w-[100px]">Pajak (5%)</th>
                                        <th className="py-2.5 px-3.5 text-right min-w-[120px]">Fee Platform</th>
                                        <th className="py-2.5 px-3.5 text-right min-w-[130px]">Total Tagihan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {ticketsList.map((t: any, idx: number) => {
                                        const ticketCount = ticketsList.length || ord.quantity || 1;
                                        const tPrice = (t.price && Number(t.price) > 0)
                                          ? Number(t.price)
                                          : (t.unit_price && Number(t.unit_price) > 0)
                                            ? Number(t.unit_price)
                                            : Math.round(rowSubtotal / ticketCount);
                                        const tDiscount = isDiscountPromo ? Math.round(discountAmount / ticketCount) : 0;
                                        const tSubtotal = Math.max(0, tPrice - tDiscount);
                                        const ratio = rowSubtotal > 0 ? (tSubtotal / rowSubtotal) : (1 / ticketCount);
                                        const tTax = Math.round(rowTax * ratio);
                                        const tFee = Math.round(rowFee * ratio);
                                        const tTotal = tSubtotal + tTax + tFee;

                                        return (
                                          <tr
                                            key={t.id || idx}
                                            className="hover:bg-blue-50/30 transition-colors"
                                          >
                                            {/* 1. Nama Pemesan Tiket */}
                                            <td className="py-3 px-3.5 align-middle">
                                              <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-900 text-xs">
                                                  {t.full_name || ord.buyer_name || 'Peserta'}
                                                </span>
                                                <span className="text-[10.5px] text-slate-400 font-medium">
                                                  {t.email || ord.buyer_email || '-'}
                                                  {(t.phone || ord.buyer_phone) && ` • ${t.phone || ord.buyer_phone}`}
                                                </span>
                                              </div>
                                            </td>

                                            {/* 2. Kode & Tipe Tiket */}
                                            <td className="py-3 px-3.5 align-middle">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-mono font-black text-blue-700 text-xs tracking-tight">
                                                  {t.ticket_code || `${ord.order_number}-${String(idx + 1).padStart(2, '0')}`}
                                                </span>
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100/90 text-blue-800 border border-blue-200/60 shrink-0">
                                                  {t.ticket_type || ord.ticket_type_name || 'Tiket'}
                                                </span>
                                                {t.category && (
                                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    🏷️ {t.category}
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            {/* 3. Qty */}
                                            <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                                              <span className="font-black text-slate-900 text-xs px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 inline-block font-mono">
                                                1 Pcs
                                              </span>
                                            </td>

                                            {/* 4. Subtotal Tiket */}
                                            <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                                              {isDiscountPromo && tDiscount > 0 ? (
                                                <div className="flex flex-col items-end justify-center gap-0.5">
                                                  <span className="text-[9.5px] line-through text-slate-400 font-mono">
                                                    Rp {tPrice.toLocaleString('id-ID')}
                                                  </span>
                                                  <span className="text-[9.5px] font-extrabold text-rose-600 font-mono">
                                                    - Rp {tDiscount.toLocaleString('id-ID')}
                                                  </span>
                                                  <span className="font-bold text-slate-800 text-xs font-mono">
                                                    Rp {tSubtotal.toLocaleString('id-ID')}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="font-bold text-slate-800 text-xs font-mono">
                                                  Rp {tSubtotal.toLocaleString('id-ID')}
                                                </span>
                                              )}
                                            </td>

                                            {/* 5. Pajak (5%) */}
                                            <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                                              <span className="font-semibold text-amber-700 text-xs font-mono">
                                                Rp {tTax.toLocaleString('id-ID')}
                                              </span>
                                            </td>

                                            {/* 6. Fee Platform (7%) */}
                                            <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                                              <span className="font-semibold text-purple-700 text-xs font-mono">
                                                Rp {tFee.toLocaleString('id-ID')}
                                              </span>
                                            </td>

                                            {/* 7. Total Tagihan */}
                                            <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                                              <span className="font-black text-blue-700 text-xs font-mono">
                                                Rp {tTotal.toLocaleString('id-ID')}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
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
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 font-medium bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold text-sm">
                Belum ada transaksi penjualan tiket ditemukan
              </p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah pilihan event pada dropdown di atas.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
