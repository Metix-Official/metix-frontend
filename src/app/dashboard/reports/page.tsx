'use me';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Role Determination
  const currentRole = useMemo(() => {
    if (!user) return 'mitra';
    const roleNames = user.roles ? user.roles.map((r: any) => r.name.toLowerCase()) : [];
    if (
      user.email === 'admin@metix.com' ||
      roleNames.includes('owner') ||
      roleNames.includes('admin') ||
      roleNames.includes('superadmin')
    ) {
      return 'owner';
    }
    if (
      roleNames.includes('mitra') ||
      roleNames.includes('eo') ||
      roleNames.includes('organizer') ||
      user.mitra_status === 'approved' ||
      user.email === 'lutfifahri175@gmail.com'
    ) {
      return 'mitra';
    }
    return 'pembeli';
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

  // Filtered Orders by Search Query
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (ord) =>
        ord.order_number.toLowerCase().includes(q) ||
        ord.buyer_name.toLowerCase().includes(q) ||
        ord.buyer_email.toLowerCase().includes(q) ||
        (ord.event_title || '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

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

  // Export CSV Function
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Tidak ada data laporan untuk di-export');
      return;
    }

    const headers = ['No Order', 'Nama Pembeli', 'Email', 'Event', 'Kategori Tiket', 'Jumlah', 'Total (Rp)', 'Metode Pembayaran', 'Tanggal'];
    const rows = filteredOrders.map((ord) => [
      ord.order_number,
      `"${ord.buyer_name}"`,
      ord.buyer_email,
      `"${ord.event_title}"`,
      `"${ord.ticket_type_name}"`,
      ord.quantity,
      ord.total_amount,
      `"${ord.payment_method}"`,
      new Date(ord.created_at).toLocaleString('id-ID'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Metix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan Penjualan Berhasil Di-export ke Excel/CSV! 📊');
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
      } else if (pm.includes('midtrans') || pm.includes('qris') || pm.includes('va') || pm.includes('bank') || pm.includes('gopay')) {
        onlineCount++;
      } else {
        otherCount++;
      }
    });

    const total = filteredOrders.length;
    const onlinePct = Math.round((onlineCount / total) * 100);
    const posPct = Math.round((posCount / total) * 100);
    const otherPct = Math.max(0, 100 - onlinePct - posPct);

    let primaryChannel = 'Midtrans Online';
    if (posCount > onlineCount && posCount > otherCount) primaryChannel = 'POS Cash / Offline';
    else if (otherCount > onlineCount && otherCount > posCount) primaryChannel = 'Transfer / Lainnya';
    else if (onlineCount > 0 && posCount > 0) primaryChannel = 'Midtrans & POS';

    return { onlinePct, posPct, otherPct, primaryChannel };
  }, [filteredOrders]);

  // Header Banner Content per Role
  const headerInfo = useMemo(() => {
    if (currentRole === 'owner') {
      return {
        badge: 'PLATFORM FINANCIAL & AUDIT REPORT',
        title: 'Laporan Keuangan & Penjualan Platform Nasional',
        subtitle: 'Audit omzet transaksi nasional seluruh Mitra EO, pendapatan komisi platform, dan rekap settlement.',
        icon: ShieldCheck,
      };
    }
    if (currentRole === 'mitra') {
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
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/20 border border-white/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-wider text-blue-100 backdrop-blur-md">
                <headerInfo.icon className="w-3.5 h-3.5 text-white" /> {headerInfo.badge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {headerInfo.title}
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                {headerInfo.subtitle}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-extrabold text-xs flex items-center gap-2 backdrop-blur-sm transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4" /> Cetak Laporan
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-blue-50 text-blue-900 font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel / CSV
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              {currentRole === 'owner' ? 'Omzet Platform Nasional' : 'Total Omzet Penjualan'}
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-slate-900">
                Rp {totalGrossRevenue.toLocaleString('id-ID')}
              </h4>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Transaksi Terverifikasi
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tiket Terjual (Pcs)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-indigo-600">
                {totalTicketsSold.toLocaleString('id-ID')} <span className="text-xs font-extrabold text-slate-400">Tiket</span>
              </h4>
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Kapasitas Terisi
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rata-Rata Order (AOV)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-emerald-600">
                Rp {averageOrderValue.toLocaleString('id-ID')}
              </h4>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Nilai Transaksi Rata-Rata
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Metode Pembayaran Utama</span>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900 truncate">
                {channelStats.primaryChannel}
              </h4>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-purple-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Settlement Instant
            </span>
          </div>

        </div>

        {/* Visual Sales Channel Distribution Progress Bars */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-700" /> Distribusi Saluran Penjualan Tiket
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Komposisi transaksi online Midtrans Payment Gateway vs Kasir Offline (POS).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Channel 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Midtrans QRIS & VA
                </span>
                <span className="font-black text-blue-700">{channelStats.onlinePct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.onlinePct}%` }} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">Online Automatic Checkout</span>
            </div>

            {/* Channel 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Kasir Offline (POS Tunai)
                </span>
                <span className="font-black text-emerald-700">{channelStats.posPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.posPct}%` }} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">On-the-spot Cash Tendered</span>
            </div>

            {/* Channel 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> E-Wallet & Lainnya
                </span>
                <span className="font-black text-purple-700">{channelStats.otherPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${channelStats.otherPct}%` }} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">Promo & Transfer Bank Direct</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/30 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. order, nama pembeli, email, atau event..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Event Filter */}
              <div className="min-w-[180px]">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Semua Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Event</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div className="w-32">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white">
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
              <div className="w-28">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white">
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
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" /> Rincian Transaksi Penjualan ({filteredOrders.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Daftar lengkap transaksi tiket yang terverifikasi pada periode terpilih.
              </p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">No. Order & Pembeli</th>
                    <th className="py-3.5 px-4">Event & Kategori</th>
                    <th className="py-3.5 px-4">Pembayaran</th>
                    <th className="py-3.5 px-4">Qty</th>
                    <th className="py-3.5 px-4">Total Nomilal (Rp)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Tanggal & Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors group">
                      
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-slate-900 group-hover:text-blue-700 transition-colors">
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

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 max-w-[200px] truncate">
                            {ord.event_title}
                          </span>
                          <span className="text-[11px] text-blue-700 font-black">
                            {ord.ticket_type_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          <CreditCard className="w-3 h-3 text-slate-500" /> {ord.payment_method}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {ord.quantity} Pcs
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        Rp {ord.total_amount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas / Paid
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px] whitespace-nowrap">
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
