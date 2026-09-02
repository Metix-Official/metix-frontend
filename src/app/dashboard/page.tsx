'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { StatMetric, Transaction, EventItem } from '@/data/mockData';
import { fetchDashboardData, DashboardResponse, getStoredUser } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Download, Sparkles, Ticket, ShieldCheck, UserCheck } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    const u = getStoredUser();
    const role = getUserRole(u);
    if (role === 'SCANNER') {
      router.replace('/dashboard/checkin');
      return;
    }

    async function loadData() {
      setIsLoading(true);
      const res = await fetchDashboardData();
      if (res) {
        setDashboardData(res);
      }
      setIsLoading(false);
    }
    loadData();
  }, [router]);

  const storedUser = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('metix_user');
      if (u) {
        try { return JSON.parse(u); } catch {}
      }
    }
    return null;
  }, []);

  const isScannerAdmin = React.useMemo(() => {
    return storedUser?.roles?.some((r: any) => r.name === 'admin');
  }, [storedUser]);

  const currentRole = isScannerAdmin ? 'admin' : (dashboardData?.role || 'pembeli');

  // Compute stat cards values based on authenticated role
  const statsToDisplay: StatMetric[] = React.useMemo(() => {
    const s = dashboardData?.stats;

    if (currentRole === 'admin') {
      return [
        {
          id: 's1',
          title: 'Peran Akun',
          value: 'Admin Scanner',
          change: 'Active Staff',
          isPositive: true,
          period: 'penjaga pintu masuk',
          iconName: 'Ticket',
        },
        {
          id: 's2',
          title: 'Status Scanner',
          value: 'Siap Melayani',
          change: 'Online',
          isPositive: true,
          period: 'kamera & manual input',
          iconName: 'ShieldCheck',
        },
        {
          id: 's3',
          title: 'Tugas Utama',
          value: 'Scan QR Code',
          change: 'Gatekeeping',
          isPositive: true,
          period: 'verifikasi tiket pengunjung',
          iconName: 'TrendingUp',
        },
        {
          id: 's4',
          title: 'Fitur Akses',
          value: 'Scanner Only',
          change: 'Terbatas',
          isPositive: true,
          period: 'akses khusus pintu masuk',
          iconName: 'CalendarDays',
        },
      ];
    }

    if (currentRole === 'owner') {
      return [
        {
          id: 's1',
          title: 'Revenue Platform',
          value: `Rp ${(s?.totalRevenue || 0).toLocaleString('id-ID')}`,
          change: '+15.4%',
          isPositive: true,
          period: 'total transaksi platform',
          iconName: 'DollarSign',
        },
        {
          id: 's2',
          title: 'Komisi Platform',
          value: `Rp ${(s?.commissionEarned || 0).toLocaleString('id-ID')}`,
          change: '+5.0%',
          isPositive: true,
          period: 'pendapatan bersihan',
          iconName: 'TrendingUp',
        },
        {
          id: 's3',
          title: 'Total Event Platform',
          value: (s?.totalEvents || 0).toString(),
          change: '+4',
          isPositive: true,
          period: 'event terdaftar',
          iconName: 'CalendarDays',
        },
        {
          id: 's4',
          title: 'Persetujuan Mitra',
          value: (s?.pendingMitraApprovals || 0).toString(),
          change: 'Pending',
          isPositive: true,
          period: 'pengajuan baru',
          iconName: 'Ticket',
        },
      ];
    }

    if (currentRole === 'mitra') {
      const rawEvents = dashboardData?.eventsList || [];
      const totalEvts = s?.totalEvents ?? rawEvents.length;
      const activeEvts = s?.activeEventsCount ?? rawEvents.filter((e: any) => e.status === 'published').length;

      const totalOrders = s?.totalOrders ?? rawEvents.reduce((acc: number, e: any) => {
        const sold = e.ticket_types
          ? e.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_quantity || 0), 0)
          : (e.tickets_sold || e.ticketsSold || 0);
        return acc + sold;
      }, 0);

      const totalRevenue = s?.totalRevenue ?? rawEvents.reduce((acc: number, e: any) => {
        const rev = e.revenue
          ? Number(e.revenue)
          : e.ticket_types
          ? e.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_quantity || 0) * Number(tt.price || 0)), 0)
          : 0;
        return acc + rev;
      }, 0);

      return [
        {
          id: 's1',
          title: 'Total Event EO',
          value: totalEvts.toString(),
          change: '+1',
          isPositive: true,
          period: 'event dikelola',
          iconName: 'CalendarDays',
        },
        {
          id: 's2',
          title: 'Tiket Terjual',
          value: totalOrders.toLocaleString('id-ID'),
          change: '+12.5%',
          isPositive: true,
          period: 'tiket rilis',
          iconName: 'Ticket',
        },
        {
          id: 's3',
          title: 'Event Aktif',
          value: activeEvts.toString(),
          change: 'Published',
          isPositive: true,
          period: 'siap dibeli',
          iconName: 'TrendingUp',
        },
        {
          id: 's4',
          title: 'Total Pendapatan',
          value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
          change: '+8.2%',
          isPositive: true,
          period: 'omzet EO',
          iconName: 'DollarSign',
        },
      ];
    }

    // Default Role: Pembeli Tiket
    const ticketsCount = dashboardData?.tickets?.total || (dashboardData?.tickets?.data ? dashboardData.tickets.data.length : 0);
    const activeTickets = dashboardData?.tickets?.data
      ? dashboardData.tickets.data.filter((t: any) => t.status === 'active' || t.status === 'used').length
      : 0;

    return [
      {
        id: 's1',
        title: 'Tiket Saya',
        value: ticketsCount.toString(),
        change: 'E-Tiket',
        isPositive: true,
        period: 'total dibeli',
        iconName: 'Ticket',
      },
      {
        id: 's2',
        title: 'Tiket Aktif',
        value: activeTickets.toString(),
        change: 'Siap Pakai',
        isPositive: true,
        period: 'siap check-in',
        iconName: 'CalendarDays',
      },
      {
        id: 's3',
        title: 'Transfer Tiket',
        value: (dashboardData?.transfersCount || 0).toString(),
        change: 'Completed',
        isPositive: true,
        period: 'riwayat transfer',
        iconName: 'TrendingUp',
      },
      {
        id: 's4',
        title: 'Total Pembelian',
        value: `Rp ${(s?.totalRevenue || 0).toLocaleString('id-ID')}`,
        change: '+0.0%',
        isPositive: true,
        period: 'via Midtrans',
        iconName: 'DollarSign',
      },
    ];
  }, [dashboardData, currentRole]);

  // Compute Recent Transactions list from backend API
  const transactionsToDisplay: Transaction[] = React.useMemo(() => {
    if (dashboardData?.tickets?.data && dashboardData.tickets.data.length > 0) {
      return dashboardData.tickets.data.map((item: any, idx: number) => ({
        id: item.id ? String(item.id) : `tx-${idx}`,
        customerName: item.order?.buyer_name || item.buyer_name || 'Pembeli Metix',
        customerEmail: item.order?.buyer_email || 'pembeli@metix.id',
        eventName: item.event?.title || 'Event Metix',
        ticketType: item.ticket_type?.name || 'Reguler',
        quantity: 1,
        amount: item.ticket_type?.price
          ? `Rp ${Number(item.ticket_type.price).toLocaleString('id-ID')}`
          : 'Rp 0',
        status: item.status === 'used' ? 'Completed' : item.status === 'cancelled' ? 'Failed' : 'Completed',
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
          : 'Hari ini',
      }));
    }
    return [];
  }, [dashboardData]);

  // Compute Recent Events list from backend API
  const eventsToDisplay: EventItem[] = React.useMemo(() => {
    const rawList = dashboardData?.eventsList || [];
    if (rawList && rawList.length > 0) {
      return rawList.map((item: any) => {
        const totalQuota = item.ticket_types
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.quota || 0), 0)
          : (item.totalTickets || 500);
        const soldQty = item.ticket_types
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_quantity || 0), 0)
          : (item.tickets_sold || item.ticketsSold || 0);
        const rev = item.revenue
          ? Number(item.revenue)
          : item.ticket_types
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_quantity || 0) * Number(tt.price || 0)), 0)
          : 0;

        return {
          id: String(item.id),
          title: item.title,
          category: item.category || 'Music Concert',
          date: item.event_start_at ? new Date(item.event_start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Aktif',
          location: item.location || item.creator_name || 'Venue',
          ticketsSold: soldQty,
          totalTickets: totalQuota > 0 ? totalQuota : 500,
          revenue: `Rp ${rev.toLocaleString('id-ID')}`,
          status: item.status === 'published' ? 'Active' : item.status === 'draft' ? 'Draft' : 'Sold Out',
          badgeColor: item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200',
        };
      });
    }
    return [];
  }, [dashboardData]);

  // Dynamic Banner Content based on Role
  const bannerContent = React.useMemo(() => {
    if (currentRole === 'admin') {
      return {
        badge: 'Admin Scanner Staff',
        title: 'Gatekeeping Check-In & Validasi Tiket Entrance',
        desc: 'Modul khusus petugas pintu masuk. Lakukan pemindaian QR Code atau input manual kode tiket pengunjung.',
        icon: UserCheck,
      };
    }
    if (currentRole === 'owner') {
      return {
        badge: 'Platform Owner Dashboard',
        title: 'Super Admin Platform Overview & Finance',
        desc: 'Setujui pengajuan Mitra EO baru, pantau komisi platform, dan verifikasi penarikan dana.',
        icon: ShieldCheck,
      };
    }
    if (currentRole === 'mitra') {
      return {
        badge: 'Event Organizer (EO)',
        title: 'Manage events, ticket sales, and transactions in real-time',
        desc: 'Pantau penjualan tiket event, buat tipe harga baru, dan kelola penanganan kasir offline.',
        icon: Sparkles,
      };
    }
    return {
      badge: 'Pembeli Tiket (Customer)',
      title: 'E-Tiket Saya & Riwayat Transaksi',
      desc: 'Lihat e-tiket aktif Anda untuk masuk event, bayar transaksi Midtrans, dan lakukan transfer tiket.',
      icon: Ticket,
    };
  }, [currentRole]);

  const BannerIcon = bannerContent.icon;

  const formattedPageTitle = React.useMemo(() => {
    if (currentRole === 'admin') return 'Dashboard Admin Scanner';
    const r = dashboardData?.roleLabel;
    if (!r) return 'Dashboard Overview';
    if (r.startsWith('Event Organizer')) return 'Dashboard Event Organizer';
    if (r.startsWith('Super Admin')) return 'Dashboard Super Admin';
    return `Dashboard ${r}`;
  }, [dashboardData, currentRole]);

  return (
    <DashboardLayout pageTitle={formattedPageTitle} activeNav="Dashboard">
      {/* Pending EO Approval Alert Banner */}
      {storedUser?.role === 'EO' && (storedUser?.mitra_status === 'pending' || (storedUser as any)?.organizer_status === 'PENDING_APPROVAL') && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3.5 shadow-2xs animate-in fade-in-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-amber-900">
              Pengajuan Pendaftaran EO Berhasil Dikirim (Menunggu Persetujuan Owner)
            </h4>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Akun Anda saat ini berada dalam mode Pembeli (Buyer) hingga pendaftaran Event Organizer (EO) Anda disetujui oleh Owner/Admin Platform. Setelah disetujui, hak akses penuh EO akan aktif secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Banner / Welcome Quick Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-blue-700/15 border border-blue-600/30">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-50 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <BannerIcon className="w-3.5 h-3.5 text-white" /> {bannerContent.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {bannerContent.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-medium">
              {bannerContent.desc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentRole === 'admin' ? (
              <a
                href="/dashboard/checkin"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-800 text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-xl shadow-blue-950/20 transition-all cursor-pointer hover:scale-105"
              >
                <UserCheck className="w-5 h-5 text-blue-600" /> Buka Scanner QR Code
              </a>
            ) : (
              <>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Report
                </button>
                {currentRole !== 'pembeli' ? (
                  <a
                    href="/dashboard/events"
                    className="px-5 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Event
                  </a>
                ) : (
                  <a
                    href="/dashboard/tickets"
                    className="px-5 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" /> Lihat E-Tiket Saya
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl shadow-xs" />
            ))
          : statsToDisplay.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
      </div>

      {/* Main Grid: Recent Transactions (2 cols) & Recent Events (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-96 w-full rounded-3xl shadow-xs" />
          ) : (
            <RecentTransactions transactions={transactionsToDisplay} />
          )}
        </div>
        <div className="lg:col-span-1">
          {isLoading ? (
            <Skeleton className="h-96 w-full rounded-3xl shadow-xs" />
          ) : (
            <RecentEvents events={eventsToDisplay} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
