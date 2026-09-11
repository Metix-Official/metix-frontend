'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchSalesReportData,
  fetchMyEvents,
  getStoredUser,
  ReportOrderItem,
  ApiEvent,
} from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
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
  TrendingUp,
  DollarSign,
  Ticket,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  BarChart3,
  CreditCard,
  Building2,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<ReportOrderItem[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Role Determination
  const currentRole = useMemo(() => {
    return getUserRole(user) || ROLES.EO;
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    const storedUser = getStoredUser();
    setUser(storedUser);

    const [repData, evData] = await Promise.all([
      fetchSalesReportData({
        event_id: selectedEventId,
        month: selectedMonth,
        year: selectedYear,
      }),
      fetchMyEvents(),
    ]);

    setEvents(evData.events || []);
    setOrders(repData.orders || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId, selectedMonth, selectedYear]);

  // Published Events created by EO
  const publishedEvents = useMemo(() => {
    return events.filter((ev) => String(ev.status || '').toLowerCase() === 'published');
  }, [events]);

  // Distinct payment methods extracted from orders
  const availablePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.payment_method && o.payment_method.trim()) set.add(o.payment_method.trim());
    });
    return Array.from(set);
  }, [orders]);

  // Filtered Orders strictly matching logged-in EO's created events, Payment Method & Search Query
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by EO created events list if role is EO
    if (currentRole === ROLES.EO && publishedEvents.length > 0) {
      const eoEventIds = new Set(publishedEvents.map((e) => String(e.id)));
      const eoEventTitles = new Set(publishedEvents.map((e) => e.title.toLowerCase()));

      result = result.filter(
        (ord) =>
          (ord.event_id && eoEventIds.has(String(ord.event_id))) ||
          (ord.event_title && eoEventTitles.has(ord.event_title.toLowerCase()))
      );
    }

    // Filter by Payment Method Select Option
    if (selectedPaymentMethod !== 'all') {
      result = result.filter((ord) => {
        const pm = (ord.payment_method || '').toLowerCase();
        const sel = selectedPaymentMethod.toLowerCase();
        if (sel === 'pos' || sel === 'cash') {
          return pm.includes('pos') || pm.includes('cash') || pm.includes('kasir') || pm.includes('tunai');
        }
        if (sel === 'qris') {
          return pm.includes('qris');
        }
        if (sel === 'va') {
          return pm.includes('va') || pm.includes('virtual account') || pm.includes('bank');
        }
        if (sel === 'gopay') {
          return pm.includes('gopay') || pm.includes('ewallet') || pm.includes('e-wallet');
        }
        return pm.includes(sel) || pm === sel;
      });
    }

    if (!searchQuery.trim()) return result;

    const q = searchQuery.toLowerCase().trim();
    return result.filter(
      (ord) =>
        ord.order_number.toLowerCase().includes(q) ||
        ord.buyer_name.toLowerCase().includes(q) ||
        ord.buyer_email.toLowerCase().includes(q) ||
        (ord.event_title || '').toLowerCase().includes(q) ||
        (ord.ticket_type_name || '').toLowerCase().includes(q) ||
        (ord.payment_method || '').toLowerCase().includes(q)
    );
  }, [orders, publishedEvents, currentRole, selectedPaymentMethod, searchQuery]);

  // Computed Report Aggregations
  const totalGrossRevenue = useMemo(
    () => filteredOrders.reduce((sum, item) => sum + item.total_amount, 0),
    [filteredOrders]
  );

  const totalTicketsSold = useMemo(
    () => filteredOrders.reduce((sum, item) => sum + item.quantity, 0),
    [filteredOrders]
  );

  const averageOrderValue = useMemo(
    () => (filteredOrders.length > 0 ? Math.round(totalGrossRevenue / filteredOrders.length) : 0),
    [totalGrossRevenue, filteredOrders]
  );

  // Helper to escape values for CSV
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export CSV Function with Executive Corporate Header
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada data laporan untuk di-export');
      return;
    }

    try {
      const storedUser = user || getStoredUser();
      const accountName = storedUser?.name || (currentRole === ROLES.OWNER ? 'Super Admin Platform' : 'Event Organizer');
      const accountEmail = storedUser?.email || '-';
      const roleLabel = currentRole === ROLES.OWNER ? 'Super Admin Platform (Nasional)' : 'Mitra Event Organizer (EO)';

      const selectedEventObj = events.find((e) => String(e.id) === selectedEventId);
      const eventCoverageName =
        selectedEventId === 'all'
          ? (currentRole === ROLES.OWNER ? 'Semua Event Platform' : 'Semua Event EO (Akumulasi)')
          : selectedEventObj?.title || `Event #${selectedEventId}`;

      const monthsMap: Record<string, string> = {
        all: 'Semua Bulan (Sepanjang Tahun)',
        '1': 'Januari',
        '2': 'Februari',
        '3': 'Maret',
        '4': 'April',
        '5': 'Mei',
        '6': 'Juni',
        '7': 'Juli',
        '8': 'Agustus',
        '9': 'September',
        '10': 'Oktober',
        '11': 'November',
        '12': 'Desember',
      };
      const monthLabel = monthsMap[selectedMonth] || selectedMonth;
      const periodLabel =
        selectedMonth === 'all' && selectedYear === 'all'
          ? 'Seluruh Periode Transaksi'
          : `${monthLabel} ${selectedYear === 'all' ? '(Semua Tahun)' : selectedYear}`;

      const paymentFilterLabel =
        selectedPaymentMethod === 'all'
          ? 'Semua Saluran Pembayaran'
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
      lines.push(escapeCsv('METIX ENTERPRISE — OFFICIAL FINANCIAL & SALES ANALYTICS REPORT'));
      lines.push(escapeCsv('LAPORAN RESMI AUDIT KEUANGAN, OMZET PENJUALAN TIKET & REKAP TRANSAKSI'));
      lines.push('');

      // 2. Organization & Filter Metadata Block
      lines.push([escapeCsv('INFORMASI DOKUMEN & ENTITAS'), '', '', ''].join(','));
      lines.push([
        escapeCsv('Entitas / Pengguna:'),
        escapeCsv(accountName),
        escapeCsv('Waktu Unduh Laporan:'),
        escapeCsv(downloadTimestampStr),
      ].join(','));
      lines.push([
        escapeCsv('Email Terdaftar:'),
        escapeCsv(accountEmail),
        escapeCsv('Zona Waktu Sistem:'),
        escapeCsv('Asia/Jakarta (WIB)'),
      ].join(','));
      lines.push([
        escapeCsv('Peran Akun:'),
        escapeCsv(roleLabel),
        escapeCsv('Periode Laporan:'),
        escapeCsv(periodLabel),
      ].join(','));
      lines.push([
        escapeCsv('Cakupan Event:'),
        escapeCsv(eventCoverageName),
        escapeCsv('Filter Metode Bayar:'),
        escapeCsv(paymentFilterLabel),
      ].join(','));
      lines.push([
        escapeCsv('Total Data Transaksi:'),
        escapeCsv(`${filteredOrders.length} Pesanan`),
        escapeCsv('Kanal Utama:'),
        escapeCsv(channelStats.primaryChannel),
      ].join(','));
      lines.push('');

      // 3. Executive KPI Summary Block
      lines.push([escapeCsv('RINGKASAN EKSEKUTIF KEUANGAN (EXECUTIVE FINANCIAL SUMMARY)'), '', '', ''].join(','));
      lines.push([
        escapeCsv('Total Tiket Terjual:'),
        escapeCsv(`${totalTicketsSold} Tiket`),
        escapeCsv('Rata-rata Nilai Order (AOV):'),
        escapeCsv(`Rp ${averageOrderValue.toLocaleString('id-ID')}`),
      ].join(','));
      lines.push([
        escapeCsv('Total Transaksi:'),
        escapeCsv(`${filteredOrders.length} Pesanan`),
        escapeCsv('Total Omzet Bruto:'),
        escapeCsv(`Rp ${totalGrossRevenue.toLocaleString('id-ID')}`),
      ].join(','));
      lines.push('');

      // 4. Tabular Data Header
      const tableHeaders = [
        'No.',
        'No. Order / Invoice',
        'Nama Pembeli',
        'Nama Pengunjung (Attendee)',
        'Email Pembeli',
        'No. Telepon / WhatsApp',
        'Nama Event',
        'Kategori Tiket',
        'Jumlah Tiket (Qty)',
        'Subtotal (Rp)',
        'Metode Pembayaran',
        'Total Tagihan (Rp)',
        'Status Transaksi',
        'Tanggal Transaksi',
        'Waktu Transaksi (WIB)',
      ];
      lines.push(tableHeaders.map(escapeCsv).join(','));

      // 5. Data Rows
      let rowNumber = 1;
      filteredOrders.forEach((ord) => {
        const isPaid =
          (ord.status || '').toLowerCase() === 'paid' ||
          (ord.status || '').toLowerCase() === 'completed';
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

        lines.push([
          rowNumber++,
          escapeCsv(ord.order_number),
          escapeCsv(ord.buyer_name || '-'),
          escapeCsv(
            ord.full_name ||
            (ord.attendees && ord.attendees.length > 0
              ? ord.attendees.join(', ')
              : ord.buyer_name) ||
            '-'
          ),
          escapeCsv(ord.buyer_email || '-'),
          escapeCsv(ord.buyer_phone || '-'),
          escapeCsv(ord.event_title || '-'),
          escapeCsv(ord.ticket_type_name || '-'),
          ord.quantity || 1,
          ord.subtotal || ord.total_amount,
          escapeCsv(ord.payment_method || '-'),
          ord.total_amount,
          escapeCsv(statusText),
          escapeCsv(dateStr),
          escapeCsv(timeStr),
        ].join(','));
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
          '*** CATATAN RESMI: Laporan ini diekspor secara otomatis oleh METIX Enterprise Financial Management System dan sah sebagai rekonsiliasi pembukuan dan audit finansial resmi. ***'
        )
      );
      lines.push(
        escapeCsv(
          `*** Hak Cipta © ${now.getFullYear()} METIX (PT Metix Indonesia). Seluruh data transaksi dilindungi enkripsi platform. ***`
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
      const fileName = `METIX_Laporan_Keuangan_${eventSlug}_${dateFileSlug}_${timeFileSlug}.csv`;

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengunduh laporan keuangan: ${fileName}`);
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Terjadi kesalahan saat memproses ekspor laporan');
    }
  };

  // Dynamically compute payment channel percentages from real API orders
  const channelStats = useMemo(() => {
    if (filteredOrders.length === 0) {
      return { onlinePct: 0, posPct: 0, otherPct: 0, primaryChannel: '-' };
    }

    let onlineCount = 0;
    let posCount = 0;
    let otherCount = 0;

    filteredOrders.forEach((ord) => {
      const pm = (ord.payment_method || '').toLowerCase();
      if (pm.includes('pos') || pm.includes('cash') || pm.includes('kasir') || pm.includes('tunai')) {
        posCount++;
      } else if (pm.includes('doku') || pm.includes('qris') || pm.includes('va') || pm.includes('bank') || pm.includes('gopay')) {
        onlineCount++;
      } else {
        otherCount++;
      }
    });

    const total = filteredOrders.length;
    const onlinePct = Math.round((onlineCount / total) * 100);
    const posPct = Math.round((posCount / total) * 100);
    const otherPct = Math.max(0, 100 - onlinePct - posPct);

    let primaryChannel = 'Doku Online';
    if (posCount > onlineCount && posCount > otherCount) primaryChannel = 'POS Cash / Offline';
    else if (otherCount > onlineCount && otherCount > posCount) primaryChannel = 'Transfer / Lainnya';
    else if (onlineCount > 0 && posCount > 0) primaryChannel = 'Doku & POS';

    return { onlinePct, posPct, otherPct, primaryChannel };
  }, [filteredOrders]);

  // Header Banner Content per Role
  const headerInfo = useMemo(() => {
    if (currentRole === ROLES.OWNER) {
      return {
        badge: 'PLATFORM FINANCIAL & AUDIT REPORT',
        title: 'Laporan Keuangan & Penjualan Platform Nasional',
        subtitle: 'Audit omzet transaksi nasional seluruh Mitra EO, pendapatan komisi platform, dan rekap settlement.',
        icon: ShieldCheck,
      };
    }
    if (currentRole === ROLES.EO) {
      return {
        badge: 'REKAPITULASI PENJUALAN EO',
        title: 'Laporan Penjualan Tiket Event EO',
        subtitle: 'Analisis omzet penjualan tiket, grafik transaksi bulanan, dan rekapitulasi pembayaran Midtrans / POS.',
        icon: TrendingUp,
      };
    }
    return {
      badge: 'RIWAYAT TRANSAKSI SAYA',
      title: 'Laporan Pembelian Tiket & Struk Belanja',
      subtitle: 'Rekapitulasi riwayat pembelian tiket konser, rincian pembayaran, dan dokumen invoice resmi.',
      icon: Ticket,
    };
  }, [currentRole]);

  return (
    <DashboardLayout pageTitle="Laporan Penjualan Tiket" activeNav="Laporan Penjualan">
      <div className="w-full space-y-6">

        {/* Top Banner Header */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 shadow-lg shadow-blue-700/15 border border-white/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-wider text-blue-100 backdrop-blur-md">
                <headerInfo.icon className="w-3 h-3 text-white" /> {headerInfo.badge}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                {headerInfo.title}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium max-w-2xl">
                {headerInfo.subtitle}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-black text-xs flex items-center gap-2 shadow-md shadow-blue-950/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel / CSV</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black">
                  {filteredOrders.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {currentRole === ROLES.OWNER ? 'Omzet Platform Nasional' : 'Total Omzet Penjualan'}
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {totalGrossRevenue.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Transaksi Terverifikasi
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tiket Terjual (Pcs)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">
                {totalTicketsSold.toLocaleString('id-ID')} <span className="text-[11px] font-extrabold text-slate-400">Tiket</span>
              </h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Kapasitas Terisi
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Rata-Rata Order (AOV)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">
                Rp {averageOrderValue.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Nilai Rata-Rata
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Metode Pembayaran Utama</span>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 truncate">
                {channelStats.primaryChannel}
              </h4>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-purple-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Settlement Instant
            </span>
          </div>

        </div>

        {/* Visual Sales Channel Distribution Progress Bars */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-700" /> Distribusi Saluran Penjualan Tiket
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Komposisi transaksi online Doku Payment Gateway vs Kasir Offline (POS).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Channel 1 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Doku QRIS & VA
                </span>
                <span className="font-black text-blue-700">{channelStats.onlinePct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.onlinePct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">Online Automatic Checkout</span>
            </div>

            {/* Channel 2 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Kasir Offline (POS Tunai)
                </span>
                <span className="font-black text-emerald-700">{channelStats.posPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.posPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">On-the-spot Cash Tendered</span>
            </div>

            {/* Channel 3 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> E-Wallet & Lainnya
                </span>
                <span className="font-black text-purple-700">{channelStats.otherPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.otherPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">Promo & Transfer Bank Direct</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event EO saya, nama pembeli, email, atau no. order..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">

              {/* Event Filter (Published Only) */}
              <div className="min-w-[180px]">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Semua Event (Published)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Event Published ({publishedEvents.length})</SelectItem>
                    {publishedEvents.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method / Type Filter */}
              <div className="min-w-[160px]">
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Tipe Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="qris">DOKU QRIS</SelectItem>
                    <SelectItem value="va">Virtual Account (VA)</SelectItem>
                    <SelectItem value="pos">Kasir Offline (POS / Tunai)</SelectItem>
                    <SelectItem value="gopay">E-Wallet / GoPay</SelectItem>
                    {availablePaymentMethods
                      .filter((pm) => {
                        const l = pm.toLowerCase();
                        return !['qris', 'va', 'pos', 'cash', 'gopay', 'doku', 'tunai'].some((k) => l.includes(k));
                      })
                      .map((pm) => (
                        <SelectItem key={pm} value={pm}>
                          {pm}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div className="w-28">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Januari</SelectItem>
                    <SelectItem value="2">Februari</SelectItem>
                    <SelectItem value="3">Maret</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">Mei</SelectItem>
                    <SelectItem value="6">Juni</SelectItem>
                    <SelectItem value="7">Juli</SelectItem>
                    <SelectItem value="8">Agustus</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">Oktober</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">Desember</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="w-24">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </div>

        {/* Detailed Orders Sales Report Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" /> Rincian Transaksi Penjualan ({filteredOrders.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Daftar lengkap transaksi tiket yang terverifikasi pada periode terpilih.
              </p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Order & Pembeli</th>
                    <th className="py-2.5 px-3">Event & Kategori</th>
                    <th className="py-2.5 px-3">Pembayaran</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Total Nominal (Rp)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Tanggal & Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors group">

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-slate-900 group-hover:text-blue-700 transition-colors text-xs">
                            {ord.order_number}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800">
                            {ord.buyer_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {ord.buyer_email}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 max-w-[180px] truncate text-xs">
                            {ord.event_title}
                          </span>
                          <span className="text-[10px] text-blue-700 font-black">
                            {ord.ticket_type_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-extrabold text-slate-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[10px]">
                          <CreditCard className="w-3 h-3 text-slate-500" /> {ord.payment_method}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-black text-slate-900 text-xs">
                        {ord.quantity} Pcs
                      </td>

                      <td className="py-2.5 px-3 font-black text-slate-900 text-xs">
                        Rp {ord.total_amount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-2.5 px-3">
                        {(() => {
                          const status = (ord.status || '').toLowerCase();
                          const isPaid = status === 'paid' || status === 'completed';
                          const isPending = status === 'pending' || status === 'unpaid' || status === 'waiting_payment';

                          if (isPaid) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Paid
                              </span>
                            );
                          }
                          if (isPending) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                              <XCircle className="w-2.5 h-2.5 text-rose-600" /> {ord.status}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-400 font-medium text-[10px] whitespace-nowrap">
                        {new Date(ord.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada data transaksi penjualan pada filter ini.</p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
