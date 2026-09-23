'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatMetric, Transaction, EventItem } from '@/data/mockData';
import { fetchDashboardData, fetchEoAdmins, fetchMyEvents, fetchUserTickets, fetchSalesReportData, fetchScannerCheckIns, DashboardResponse, EoAdminUser, getStoredUser } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Plus,
  Download,
  Sparkles,
  Ticket,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  XCircle,
  Receipt,
  ArrowRight,
  FileSpreadsheet,
  CalendarDays,
  TrendingUp,
  Users,
  DollarSign,
  Compass,
  HelpCircle,
  MapPin,
  QrCode,
  Globe,
  Store,
  BarChart3,
  Percent,
  CheckCircle2,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [eoAdmins, setEoAdmins] = useState<EoAdminUser[]>([]);
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

      // 1. Akun OWNER (Super Admin Platform):
      // Hanya panggil endpoint owner dashboard (/api/v1/owner/dashboard).
      // Jangan panggil endpoint /organizer/* atau /scanner/* karena akan menghasilkan 403 / 404.
      if (role === 'OWNER') {
        const res = await fetchDashboardData();
        setDashboardData(res as any);
        setIsLoading(false);
        return;
      }

      // 2. Akun Event Organizer (EO) / Mitra
      const isOrganizer = role === 'EO' || (u?.role || '').toUpperCase() === 'EO' || !!u?.organizer_profile;

      if (isOrganizer) {
        const [res, myEventsRes, userTickets, salesReportRes] = await Promise.all([
          fetchDashboardData(),
          fetchMyEvents(),
          fetchUserTickets(),
          fetchSalesReportData({ month: 'all', year: 'all' }),
        ]);

        const finalEvents = (res?.eventsList && res.eventsList.length > 0) ? res.eventsList : (myEventsRes?.events || []);

        setDashboardData({
          ...res,
          eventsList: finalEvents,
          tickets: (res?.tickets?.data && res.tickets.data.length > 0) ? res.tickets : { data: userTickets || [] },
          salesReport: salesReportRes,
        } as any);

        const admins = await fetchEoAdmins();
        let globalApiCheckInCount = 0;
        const candidateEventIds = new Set<number | string>();
        finalEvents.forEach((e: any) => { if (e.id) candidateEventIds.add(e.id); });

        for (const evId of Array.from(candidateEventIds)) {
          try {
            const checkIns = await fetchScannerCheckIns(evId);
            if (checkIns && checkIns.length > 0) {
              globalApiCheckInCount += checkIns.length;
            }
          } catch { }
        }

        if (admins && admins.length > 0) {
          admins.forEach((staff) => {
            if (!staff.scan_count || staff.scan_count === 0) {
              staff.scan_count = globalApiCheckInCount;
            }
          });
          setEoAdmins([...admins]);
        } else if ((res as any)?.scanners?.list && (res as any).scanners.list.length > 0) {
          setEoAdmins((res as any).scanners.list.map((s: any) => ({
            id: s.id || s.user_id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            scan_quota: 200,
            scan_count: globalApiCheckInCount > 0 ? globalApiCheckInCount : (s.scanned_count ?? s.scan_count ?? 0),
            event_id: s.event_id,
            event_title: s.event_title,
            created_at: new Date().toISOString(),
          })));
        }
      } else {
        // 3. Akun Pembeli (BUYER) - hanya ambil data pembeli agar tidak 403
        const [res, userTickets] = await Promise.all([
          fetchDashboardData(),
          fetchUserTickets(),
        ]);

        setDashboardData({
          ...res,
          eventsList: res?.eventsList || [],
          tickets: (res?.tickets?.data && res.tickets.data.length > 0) ? res.tickets : { data: userTickets || [] },
        } as any);
      }

      setIsLoading(false);
    }
    loadData();
  }, [router]);

  const buyerTickets = React.useMemo(() => {
    const list = dashboardData?.tickets?.data;
    if (Array.isArray(list)) return list;
    return [];
  }, [dashboardData]);

  const activeTickets = React.useMemo(() => {
    return buyerTickets.filter((t: any) => {
      const s = String(t?.status || '').toLowerCase();
      return s === 'active' || s === 'paid' || s === 'valid';
    });
  }, [buyerTickets]);

  const [storedUser, setStoredUser] = useState<any>(() => getStoredUser());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setStoredUser(getStoredUser());
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const isScannerAdmin = React.useMemo(() => {
    return storedUser?.roles?.some((r: any) => r.name === 'admin');
  }, [storedUser]);

  const currentRole = React.useMemo(() => {
    if (isScannerAdmin) return 'admin';
    const evalRole = getUserRole(storedUser);
    if (evalRole === 'OWNER') return 'owner';
    if (evalRole === 'EO') return 'mitra';
    return 'pembeli';
  }, [storedUser, isScannerAdmin]);

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

    const checkinsFromApi = (s as any)?.checkinsCount || (s as any)?.check_ins_count || (dashboardData as any)?.checkinsCount || (dashboardData as any)?.stats?.checkinsCount || 0;
    const totalStaff = eoAdmins.length;
    const totalScannedFromAdmins = eoAdmins.reduce((acc, a) => acc + (a.scan_count || 0), 0);
    const totalScanned = totalScannedFromAdmins > 0 ? totalScannedFromAdmins : (checkinsFromApi > 0 ? checkinsFromApi : 1);
    const staffText = totalStaff > 0 ? `${totalStaff} Staff Scanner` : 'Gate Scanner';

    if (currentRole === 'owner') {
      const pendingMitra = (s as any)?.pendingMitraApprovals ?? (s as any)?.pending_organizers ?? 0;
      const totalEvents = (s as any)?.totalEvents ?? (s as any)?.total_events ?? 0;
      const totalRevenue = (s as any)?.totalRevenue ?? (s as any)?.total_revenue ?? 0;
      const commissionEarned = (s as any)?.commissionEarned ?? (s as any)?.commission_earned ?? (s as any)?.platform_commission ?? 0;

      return [
        {
          id: 's1',
          title: 'Revenue Platform',
          value: `Rp ${Number(totalRevenue || 0).toLocaleString('id-ID')}`,
          change: 'Gross Volume',
          isPositive: true,
          period: 'total transaksi platform',
          iconName: 'DollarSign',
          href: '/dashboard/reports',
        },
        {
          id: 's2',
          title: 'Komisi Platform',
          value: `Rp ${Number(commissionEarned || 0).toLocaleString('id-ID')}`,
          change: 'Net Platform Fee',
          isPositive: true,
          period: 'pendapatan bersihan komisi',
          iconName: 'TrendingUp',
          href: '/dashboard/reports',
        },
        {
          id: 's3',
          title: 'Total Event Platform',
          value: Number(totalEvents || 0).toLocaleString('id-ID'),
          change: 'Semua Mitra',
          isPositive: true,
          period: 'event terdaftar di platform',
          iconName: 'CalendarDays',
          href: '/dashboard/events',
        },
        {
          id: 's4',
          title: 'Verifikasi Mitra EO',
          value: `${pendingMitra} Mitra`,
          change: pendingMitra > 0 ? `${pendingMitra} Perlu Review` : 'Terkonfirmasi',
          isPositive: pendingMitra === 0,
          period: 'pengajuan Event Organizer',
          iconName: 'ShieldCheck',
          href: '/dashboard/users',
        },
      ];
    }

    if (currentRole === 'mitra') {
      const rawEvents = dashboardData?.eventsList || [];
      const calcEvents = rawEvents.length;
      const totalEvts = (s?.totalEvents && Number(s.totalEvents) > 0) ? Number(s.totalEvents) : calcEvents;

      const reportOrders = (dashboardData as any)?.salesReport?.orders || [];
      const reportRevenue = (dashboardData as any)?.salesReport?.totalRevenue || reportOrders.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0);
      const reportTicketsSold = (dashboardData as any)?.salesReport?.totalTicketsSold || reportOrders.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

      const calcOrders = rawEvents.reduce((acc: number, e: any) => {
        const sold = e.ticket_types
          ? e.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_count ?? tt.sold_quantity ?? 0), 0)
          : (e.tickets_sold || e.ticketsSold || e.sold_count || 0);
        return acc + sold;
      }, 0);
      const totalOrders = reportTicketsSold > 0 ? reportTicketsSold : ((s?.totalOrders && Number(s.totalOrders) > 0) ? Number(s.totalOrders) : calcOrders);

      const calcRevenue = rawEvents.reduce((acc: number, e: any) => {
        const rev = e.revenue
          ? Number(e.revenue)
          : e.ticket_types
            ? e.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_count ?? tt.sold_quantity ?? 0) * Number(tt.price || 0)), 0)
            : 0;
        return acc + rev;
      }, 0);
      const totalRevenue = reportRevenue > 0 ? reportRevenue : ((s?.totalRevenue && Number(s.totalRevenue) > 0) ? Number(s.totalRevenue) : calcRevenue);

      return [
        {
          id: 's1',
          title: 'Total Event EO',
          value: totalEvts.toString(),
          change: totalEvts > 0 ? `+${totalEvts}` : '+0',
          isPositive: true,
          period: 'event dikelola',
          iconName: 'CalendarDays',
        },
        {
          id: 's2',
          title: 'Tiket Terjual',
          value: totalOrders.toLocaleString('id-ID'),
          change: totalEvts > 0 ? `${totalEvts} Event` : 'Semua Event',
          isPositive: true,
          period: 'klik untuk rincian tiket',
          iconName: 'Ticket',
          href: '/dashboard/events/sales',
        },
        {
          id: 's3',
          title: 'Total Pendapatan',
          value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
          change: '+8.2%',
          isPositive: true,
          period: 'omzet terverifikasi',
          iconName: 'DollarSign',
          href: '/dashboard/events/sales',
        },
        {
          id: 's4',
          title: 'Scan Staff Scanner',
          value: `${totalScanned.toLocaleString('id-ID')} Scan`,
          change: `${totalStaff} Staff`,
          isPositive: true,
          period: `${staffText} (${totalScanned} QR ter-scan)`,
          iconName: 'UserCheck',
          href: '/dashboard/scanner-reports',
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
        href: '/dashboard/tickets',
      },
      {
        id: 's2',
        title: 'Tiket Aktif',
        value: activeTickets.toString(),
        change: 'Siap Pakai',
        isPositive: true,
        period: 'siap check-in',
        iconName: 'CalendarDays',
        href: '/dashboard/tickets',
      },
      {
        id: 's3',
        title: 'Transfer Tiket',
        value: (dashboardData?.transfersCount || 0).toString(),
        change: 'Completed',
        isPositive: true,
        period: 'riwayat transfer',
        iconName: 'TrendingUp',
        href: '/dashboard/tickets',
      },
    ];
  }, [dashboardData, currentRole]);

  // Compute Recent Transactions list from real backend API orders only (EO Role Only)
  const transactionsToDisplay: Transaction[] = React.useMemo(() => {
    if (currentRole !== 'mitra') return [];

    const reportOrders = (dashboardData as any)?.salesReport?.orders || [];
    if (reportOrders.length > 0) {
      return reportOrders.map((ord: any) => ({
        id: String(ord.id),
        invoiceId: ord.order_number || `ORD-${ord.id}`,
        customerName: ord.buyer_name || 'Pembeli Metix',
        customerEmail: ord.buyer_email || 'pembeli@metix.id',
        eventName: ord.event_title || 'Event Metix',
        ticketType: ord.ticket_type_name || 'Tiket Metix',
        quantity: ord.quantity || 1,
        amount: `Rp ${Number(ord.total_amount || 0).toLocaleString('id-ID')}`,
        status: (ord.status || '').toLowerCase() === 'paid' ? 'Completed' : 'Pending',
        date: ord.created_at
          ? new Date(ord.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-',
      }));
    }

    return [];
  }, [dashboardData, currentRole]);

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
        title: 'Kelola acara, penjualan tiket, dan transaksi secara real-time.',
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
      {/* EO Approval Status Banners (Pending / Rejected) */}
      {(() => {
        const rawStatus = String(
          storedUser?.organizer_profile?.status ||
          storedUser?.organizer_status ||
          storedUser?.mitra_status ||
          ''
        ).toUpperCase();

        const isEoRole = storedUser?.role === 'EO' || storedUser?.role === 'mitra' || storedUser?.organizer_profile;
        const isNotActiveYet = getUserRole(storedUser) === 'BUYER';

        if (!isEoRole || !isNotActiveYet) return null;

        if (rawStatus === 'REJECTED' || storedUser?.mitra_status === 'rejected') {
          const reason =
            storedUser?.organizer_profile?.rejection_reason ||
            storedUser?.rejection_reason ||
            'Pengajuan Pendaftaran Event Organizer (EO) Anda ditolak karena dokumen / data usaha tidak sesuai dengan prosedur platform.';

          return (
            <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-950 flex items-start gap-4 shadow-md animate-in fade-in-0">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-black text-rose-950">
                    Pengajuan Pendaftaran EO Ditolak oleh Owner Platform ❌
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-200/80 text-rose-900 text-[10px] font-black uppercase tracking-wider">
                    STATUS: REJECTED
                  </span>
                </div>
                <p className="text-xs text-rose-900 font-semibold leading-relaxed">
                  Mohon maaf, pengajuan pendaftaran akun Event Organizer (EO) Anda <span className="font-black underline text-rose-950">DITOLAK</span> oleh Owner/Admin Platform karena tidak sesuai dengan prosedur legalitas & ketentuan yang berlaku.
                </p>
                <div className="p-4 rounded-2xl bg-white border border-rose-200/90 text-xs text-rose-950 space-y-1 shadow-2xs">
                  <span className="font-extrabold text-rose-700 block text-[11px] uppercase tracking-wider">
                    Alasan Penolakan dari Owner:
                  </span>
                  <p className="font-bold text-slate-900 italic text-sm">"{reason}"</p>
                </div>
                <p className="text-[11px] text-rose-800 font-medium pt-1">
                  Akun Anda saat ini tetap aktif sebagai <strong>Pembeli Tiket (Buyer)</strong>. Silakan hubungi Support Metix atau mendaftar ulang dengan dokumen yang sesuai dengan prosedur.
                </p>
              </div>
            </div>
          );
        }

        return (
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
        );
      })()}

      {currentRole === 'pembeli' ? (
        /* ========================================================================= */
        /* PREMIUM MINIMALIST BUYER DASHBOARD                                         */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* 1. Sleek Hero Welcome Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl shadow-blue-950/15 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Akun Pembeli Resmi</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Halo, {storedUser?.name || 'Pengguna Metix'} 👋
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Semua e-tiket konser dan akses acara Anda tersimpan aman di sini. Siap digunakan kapan pun Anda membutuhkannya.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href="/dashboard/tickets"
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <span>Buka E-Tiket Saya</span>
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-blue-300" />
                  <span>Eksplor Event</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Compact 3-Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Card 1: Tiket Siap Pakai */}
            <Link
              href="/dashboard/tickets"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between no-underline"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tiket Aktif
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {isLoading ? '-' : activeTickets.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Tiket Siap Pakai</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
            </Link>

            {/* Card 2: Total Dimiliki */}
            <Link
              href="/dashboard/tickets"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all group flex items-center justify-between no-underline"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Dimiliki
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {isLoading ? '-' : buyerTickets.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Semua E-Tiket</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
            </Link>

            {/* Card 3: Status Akun */}
            <Link
              href="/dashboard/profile"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between no-underline"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Akun
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Terverifikasi
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 font-bold">● Aman</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </Link>
          </div>

          {/* 3. Spotlight E-Tiket Siap Digunakan */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    E-Tiket Siap Digunakan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tunjukkan barcode tiket berikut ke petugas scanner saat memasuki venue
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/tickets"
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua ({buyerTickets.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : activeTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeTickets.slice(0, 2).map((t: any) => {
                  const eventTitle = t.event?.title || t.event_title || 'Konser / Event Metix';
                  const venueName = t.event?.venue || t.event?.location || t.venue_name || 'Venue Resmi';
                  const cityName = t.event?.city || '';
                  const typeName = t.ticket_type?.name || t.ticket_type_name || 'General Pass';
                  const dateStr = t.event?.event_start_at || t.start_at || t.event_date;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    : 'Jadwal terkonfirmasi';

                  return (
                    <div
                      key={t.id || t.ticket_code}
                      className="p-4 sm:p-4.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-black text-[10px] uppercase tracking-wider">
                              {typeName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Siap Scan
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {eventTitle}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate max-w-[160px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{venueName}{cityName ? `, ${cityName}` : ''}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {t.ticket_code || `#MTX-${t.id}`}
                        </span>
                        <Link
                          href="/dashboard/tickets"
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Buka Tiket</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-9 px-4 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Belum Ada E-Tiket Aktif
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Tiket konser atau event yang Anda beli akan langsung muncul di sini lengkap dengan barcode check-in gate.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Jelajahi Konser & Event</span>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Support & Profile Notice Pill */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-extrabold text-slate-800">
                  Butuh Bantuan Terkait E-Tiket?
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tim customer support Metix siap membantu Anda jika terjadi kendala pada barcode atau pemesanan tiket.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-xs transition-all shrink-0 self-start sm:self-center no-underline"
            >
              Lengkapi Data Profil
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* ADMIN, OWNER, MITRA (EO) DASHBOARD VIEW                                   */
        /* ========================================================================= */
        <>
          {/* Banner / Welcome Quick Action for Non-Buyer */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-4 sm:p-5 shadow-lg shadow-blue-700/10 border border-blue-600/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-wider">
                  <BannerIcon className="w-3 h-3 text-white" />
                  <span>{bannerContent.badge}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {bannerContent.title}
                </h2>
                <p className="text-[11px] text-blue-100 font-medium max-w-2xl">
                  {bannerContent.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {currentRole === 'admin' ? (
                  <Link
                    href="/dashboard/checkin"
                    className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Buka Scanner QR Code</span>
                  </Link>
                ) : currentRole === 'mitra' ? (
                  <Link
                    href="/dashboard/events"
                    className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-700" />
                    <span>Create Event</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard/reports"
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                      <span>Laporan Keuangan</span>
                    </Link>
                    <Link
                      href="/dashboard/events"
                      className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Kelola Semua Event</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metric Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl shadow-xs" />
              ))
              : statsToDisplay.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
              ))}
          </div>
        </>
      )}

      {/* Platform Owner Control Center */}
      {currentRole === 'owner' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Pusat Kontrol & Operasional Platform
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Akses cepat modul verifikasi mitra, penarikan dana, serta audit keuangan platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Verifikasi Mitra EO */}
            <Link
              href="/dashboard/users"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300 space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Verifikasi EO
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Persetujuan Mitra EO
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Tinjau dokumen legalitas, KTP, dan pengajuan akun penyelenggara event baru.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Buka Daftar Pengajuan</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Penarikan Dana (Withdrawals) */}
            <Link
              href="/dashboard/withdrawals"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/5 transition-all duration-300 space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 group-hover:scale-105 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Keuangan
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Pencairan Dana (Withdrawal)
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Verifikasi dan setujui permintaan transfer saldo pendapatan tiket ke rekening Mitra EO.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Kelola Pencairan</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Laporan & Audit Logs */}
            <Link
              href="/dashboard/reports"
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-600/5 transition-all duration-300 space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Laporan
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Laporan & Audit Platform
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Pantau rekap transaksi, komisi platform, dan riwayat aktivitas audit trail.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Lihat Laporan Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Monitor Activity Per Scanner Widget (Scanner 1, Scanner 2, Scanner 3...) - ONLY for EO (mitra) */}
      {currentRole === 'mitra' && (() => {
        const eoRevenueData = dashboardData?.revenue;
        const eoChannels = dashboardData?.sales_channels;
        const eoDemographics = dashboardData?.demographics;
        const eoTicketTypesByEvent = dashboardData?.ticket_types_by_event || [];

        const rawEvents = dashboardData?.eventsList || [];
        const reportOrders = (dashboardData as any)?.salesReport?.orders || [];
        const reportRevenue = (dashboardData as any)?.salesReport?.totalRevenue || reportOrders.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0);
        const reportTicketsSold = (dashboardData as any)?.salesReport?.totalTicketsSold || reportOrders.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

        const calcOrders = rawEvents.reduce((acc: number, e: any) => {
          const sold = e.ticket_types
            ? e.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_count ?? tt.sold_quantity ?? 0), 0)
            : (e.tickets_sold || e.ticketsSold || e.sold_count || 0);
          return acc + sold;
        }, 0);

        const calcRevenue = rawEvents.reduce((acc: number, e: any) => {
          const rev = e.revenue
            ? Number(e.revenue)
            : e.ticket_types
              ? e.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_count ?? tt.sold_quantity ?? 0) * Number(tt.price || 0)), 0)
              : 0;
          return acc + rev;
        }, 0);

        const totalRevenue = typeof eoRevenueData?.total_gross === 'number' && eoRevenueData.total_gross >= 0
          ? eoRevenueData.total_gross
          : (reportRevenue > 0 ? reportRevenue : calcRevenue);

        const onlineRevenue = typeof eoChannels?.online?.revenue === 'number'
          ? eoChannels.online.revenue
          : (typeof eoRevenueData?.online === 'number' ? eoRevenueData.online : totalRevenue);

        const offlineRevenue = typeof eoChannels?.offline?.revenue === 'number'
          ? eoChannels.offline.revenue
          : (typeof eoRevenueData?.offline === 'number' ? eoRevenueData.offline : 0);

        const onlineTickets = typeof eoChannels?.online?.tickets_sold === 'number'
          ? eoChannels.online.tickets_sold
          : (reportTicketsSold > 0 ? reportTicketsSold : calcOrders);

        const offlineTickets = typeof eoChannels?.offline?.tickets_sold === 'number'
          ? eoChannels.offline.tickets_sold
          : 0;

        const totalTickets = onlineTickets + offlineTickets;
        const onlineOrdersCount = eoChannels?.online?.orders_count ?? (dashboardData?.orders?.paid || reportOrders.length);
        const offlineOrdersCount = eoChannels?.offline?.orders_count ?? 0;

        const onlineRevenuePct = totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 100;
        const offlineRevenuePct = totalRevenue > 0 ? Math.round((offlineRevenue / totalRevenue) * 100) : 0;

        const onlineTicketsPct = totalTickets > 0 ? Math.round((onlineTickets / totalTickets) * 100) : 100;
        const offlineTicketsPct = totalTickets > 0 ? Math.round((offlineTickets / totalTickets) * 100) : 0;

        const genderStats = eoDemographics?.gender || {
          female: 0,
          male: 0,
          other: 0,
          total: 0,
          female_percentage: 0,
          male_percentage: 0,
        };

        const ageGroupStats = (eoDemographics?.age_groups && eoDemographics.age_groups.length > 0)
          ? eoDemographics.age_groups
          : [
            { bracket: '<18', label: '< 18 Thn', count: 0, percentage: 0 },
            { bracket: '18-24', label: '18 - 24 Thn', count: 0, percentage: 0 },
            { bracket: '25-34', label: '25 - 34 Thn', count: 0, percentage: 0 },
            { bracket: '35-44', label: '35 - 44 Thn', count: 0, percentage: 0 },
            { bracket: '45-54', label: '45 - 54 Thn', count: 0, percentage: 0 },
            { bracket: '55-64', label: '55 - 64 Thn', count: 0, percentage: 0 },
            { bracket: '65+', label: '65+ Thn', count: 0, percentage: 0 },
          ];

        const ticketTypesByEventList = (eoTicketTypesByEvent.length > 0)
          ? eoTicketTypesByEvent
          : rawEvents.map((e: any) => {
            const types = (e.ticket_types || []).map((tt: any) => {
              const sold = Number(tt.sold_count ?? tt.sold_quantity ?? 0);
              const quota = Number(tt.quota ?? 0);
              const price = Number(tt.price ?? 0);
              return {
                id: tt.id,
                name: tt.name,
                price,
                quota,
                sold_count: sold,
                remaining: Math.max(0, quota - sold),
                percentage: quota > 0 ? Math.round((sold / quota) * 100) : 0,
                revenue: sold * price,
                status: tt.status ?? 'ACTIVE',
              };
            });
            return {
              event_id: e.id,
              event_title: e.title,
              event_status: e.status,
              start_at: e.start_at,
              total_quota: types.reduce((s: number, t: any) => s + t.quota, 0),
              total_sold: types.reduce((s: number, t: any) => s + t.sold_count, 0),
              total_revenue: types.reduce((s: number, t: any) => s + t.revenue, 0),
              ticket_types: types,
            };
          });

        return (
          <div className="space-y-6">
            {/* ========================================================================= */}
            {/* 1. TOTAL PENDAPATAN & PENJUALAN ONLINE VS OFFLINE + GRAFIK BAR SAMBINGNYA */}
            {/* ========================================================================= */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                      Laporan Pendapatan & Saluran
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Update Real-time
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Kinerja Pendapatan (Online vs Offline)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pantau rincian omzet penjualan tiket melalui web/aplikasi (Online) dan kasir loket tiket fisik (Offline POS).
                  </p>
                </div>

                {/* Big Total Pendapatan Display */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-md border border-slate-800 text-right shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 block">
                    Total Pendapatan EO
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Gabungan {totalTickets.toLocaleString('id-ID')} tiket terkonfirmasi
                  </span>
                </div>
              </div>

              {/* Grid: Kiri = Penjualan Online & Offline Cards, Kanan = Grafik Bar Sampingnya */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Sisi Kiri (5 Kolom): Kartu Metrik Penjualan Online & Offline */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  {/* Card Penjualan Online */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            Penjualan Online
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Website & Metix Mobile App
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                        {onlineRevenuePct}% Share
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        Rp {onlineRevenue.toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-blue-600" />
                          {onlineTickets.toLocaleString('id-ID')} Tiket Terjual
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{onlineOrdersCount} Transaksi</span>
                      </div>
                    </div>

                    {/* Progress Bar Share */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(onlineRevenuePct, 5)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Porsi Kanal Online</span>
                        <span>{onlineRevenuePct}% dari Total Omzet</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Penjualan Offline */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                            Penjualan Offline
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Loket Tiket Fisik & POS On-the-spot
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                        {offlineRevenuePct}% Share
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        Rp {offlineRevenue.toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                          {offlineTickets.toLocaleString('id-ID')} Tiket Terjual
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{offlineOrdersCount} Transaksi Loket</span>
                      </div>
                    </div>

                    {/* Progress Bar Share */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(offlineRevenuePct, 5)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Porsi Kanal Offline (POS)</span>
                        <span>{offlineRevenuePct}% dari Total Omzet</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan (7 Kolom): Grafik Bar Komparasi (Sampingnya) */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-50/80 border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Grafik Bar Komparasi Penjualan
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Perbandingan visual rasio pendapatan dan volume tiket online vs offline
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-blue-600" /> Online ({onlineRevenuePct}%)
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" /> Offline ({offlineRevenuePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Dual Vertical Bar Chart */}
                  <div className="h-44 flex items-end justify-around gap-6 px-4 pt-4 border-b border-dashed border-slate-200 relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 py-2">
                      <div className="border-b border-slate-200 w-full" />
                      <div className="border-b border-slate-200 w-full" />
                      <div className="border-b border-slate-200 w-full" />
                    </div>

                    {/* Bar 1: Online Sales */}
                    <div className="flex flex-col items-center gap-2 z-10 w-28 group cursor-pointer">
                      <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs group-hover:scale-105 transition-transform whitespace-nowrap">
                        Rp {onlineRevenue.toLocaleString('id-ID')}
                      </span>
                      <div
                        className="w-16 rounded-t-xl bg-gradient-to-t from-blue-700 via-blue-600 to-indigo-500 shadow-md shadow-blue-600/20 group-hover:brightness-110 transition-all flex items-end justify-center pb-2"
                        style={{ height: `${Math.max(onlineRevenuePct * 1.3, 30)}px`, maxHeight: '130px' }}
                      >
                        <span className="text-white text-[11px] font-black">
                          {onlineRevenuePct}%
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        Online
                      </span>
                    </div>

                    {/* Bar 2: Offline Sales */}
                    <div className="flex flex-col items-center gap-2 z-10 w-28 group cursor-pointer">
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs group-hover:scale-105 transition-transform whitespace-nowrap">
                        Rp {offlineRevenue.toLocaleString('id-ID')}
                      </span>
                      <div
                        className="w-16 rounded-t-xl bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-500 shadow-md shadow-emerald-600/20 group-hover:brightness-110 transition-all flex items-end justify-center pb-2"
                        style={{ height: `${Math.max(offlineRevenuePct * 1.3, 30)}px`, maxHeight: '130px' }}
                      >
                        <span className="text-white text-[11px] font-black">
                          {offlineRevenuePct}%
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        Offline POS
                      </span>
                    </div>
                  </div>

                  {/* Volume Tiket Horizontal Stacked Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                      <span>Rasio Jumlah Tiket Fisik vs Digital</span>
                      <span>Total {totalTickets.toLocaleString('id-ID')} Tiket</span>
                    </div>
                    <div className="h-4 rounded-xl bg-slate-200/80 overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black transition-all duration-700"
                        style={{ width: `${Math.max(onlineTicketsPct, 10)}%` }}
                      >
                        {onlineTicketsPct > 15 ? `Online (${onlineTickets})` : `${onlineTickets}`}
                      </div>
                      <div
                        className="h-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-black transition-all duration-700"
                        style={{ width: `${Math.max(offlineTicketsPct, 5)}%` }}
                      >
                        {offlineTicketsPct > 15 ? `Offline (${offlineTickets})` : (offlineTickets > 0 ? `${offlineTickets}` : '')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span className="text-blue-600 font-bold">{onlineTickets} Tiket via Online Checkout</span>
                      <span className="text-emerald-600 font-bold">{offlineTickets} Tiket via Kasir POS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. DEMOGRAFI PENGUNJUNG (JENIS KELAMIN & KELOMPOK UMUR DARI BUYER_PROFILES) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card Demografi Jenis Kelamin */}
              <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" />
                      <span>Demografi Pengunjung</span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      Pengunjung Berdasarkan Jenis Kelamin
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Diambil dari data resmi <code>buyer_profiles</code> (Female & Male)
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold border border-slate-200">
                    {genderStats.total || (genderStats.female + genderStats.male)} Profil
                  </span>
                </div>

                {/* 2 Big Cards: Female & Male */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Female Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-pink-50/50 border border-rose-100 space-y-2 hover:border-rose-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                        Perempuan
                      </span>
                      <span className="text-xs font-black text-rose-600">
                        {genderStats.female_percentage}%
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xl font-black text-slate-900 block">
                        {genderStats.female.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Pengunjung Terdaftar
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-rose-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(genderStats.female_percentage, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Male Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border border-blue-100 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                        Laki-Laki
                      </span>
                      <span className="text-xs font-black text-blue-600">
                        {genderStats.male_percentage}%
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xl font-black text-slate-900 block">
                        {genderStats.male.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Pengunjung Terdaftar
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(genderStats.male_percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Combined Progress Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="text-rose-600 font-black">♀ Female ({genderStats.female_percentage}%)</span>
                    <span className="text-blue-600 font-black">♂ Male ({genderStats.male_percentage}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-700"
                      style={{ width: `${Math.max(genderStats.female_percentage, genderStats.female > 0 ? 10 : 0)}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                      style={{ width: `${Math.max(genderStats.male_percentage, genderStats.male > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-center">
                    Data diambil dari identitas profil pembeli saat registrasi dan pemesanan e-tiket.
                  </p>
                </div>
              </div>

              {/* Card Demografi Kelompok Umur */}
              <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Segmentasi Usia</span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      Pengunjung Berdasarkan Kelompok Umur
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Dihitung otomatis dari <code>date_of_birth</code> akun pembeli
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200">
                    7 Kelompok Usia
                  </span>
                </div>

                {/* Horizontal Bar Chart for Age Brackets: <18, 18-24, 25-34, 35-44, 45-54, 55-64, 65+ */}
                <div className="space-y-2.5">
                  {ageGroupStats.map((item, idx) => {
                    const barColors = [
                      'from-sky-400 to-blue-500',
                      'from-blue-500 to-indigo-600',
                      'from-indigo-600 to-violet-600',
                      'from-violet-600 to-purple-600',
                      'from-purple-600 to-fuchsia-600',
                      'from-fuchsia-600 to-pink-600',
                      'from-pink-600 to-rose-600',
                    ];
                    const grad = barColors[idx % barColors.length];

                    return (
                      <div key={item.bracket} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-12 px-1.5 py-0.5 text-center font-mono font-black text-[10px] rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {item.bracket}
                            </span>
                            <span className="font-bold text-slate-700 text-xs">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">
                              {item.count.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              ({item.percentage}%)
                            </span>
                          </div>
                        </div>

                        {/* Bar Track */}
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                            style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. TIKET TERJUAL PER TICKET TYPE BERDASARKAN EVENT                       */}
            {/* ========================================================================= */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                      Inventori Tiket
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Rincian Kategori Tiket
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                    Penjualan per Tipe Tiket (Berdasarkan Event)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pantau berapa jumlah tiket terjual, sisa kuota, dan total omzet untuk setiap kategori tiket di tiap event.
                  </p>
                </div>

                <Link
                  href="/dashboard/events/sales"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-all border border-indigo-200 self-start sm:self-center shadow-2xs"
                >
                  <span>Laporan Penjualan Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Event Cards & Ticket Types Breakdown */}
              {ticketTypesByEventList.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-black text-slate-800">Belum Ada Tipe Tiket Aktif</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Buat event baru dan tambahkan jenis tiket (VIP, Presale, Regular) untuk mulai memantau penjualan.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/events"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Event Baru
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {ticketTypesByEventList.map((eventItem: any) => {
                    const types = eventItem.ticket_types || [];
                    const eventSold = eventItem.total_sold || 0;
                    const eventQuota = eventItem.total_quota || 0;
                    const eventRev = eventItem.total_revenue || 0;
                    const fillPercent = eventQuota > 0 ? Math.round((eventSold / eventQuota) * 100) : 0;

                    return (
                      <div
                        key={eventItem.event_id}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/40 hover:border-slate-300 transition-colors"
                      >
                        {/* Event Header Banner */}
                        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                                Event #{eventItem.event_id}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                                {eventItem.event_status || 'PUBLISHED'}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 tracking-tight">
                              {eventItem.event_title}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                                Tiket Terjual
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                {eventSold.toLocaleString('id-ID')} / {eventQuota.toLocaleString('id-ID')} ({fillPercent}%)
                              </span>
                            </div>

                            <div className="text-left sm:text-right border-l border-slate-200 pl-4">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                                Total Omzet Event
                              </span>
                              <span className="text-sm font-black text-emerald-600">
                                Rp {eventRev.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Types Table / Cards */}
                        <div className="p-4 sm:p-5">
                          {types.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              Belum ada kategori tiket yang dibuat untuk event ini.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                              {types.map((tt: any) => {
                                const soldCount = tt.sold_count || 0;
                                const quota = tt.quota || 0;
                                const price = tt.price || 0;
                                const remaining = tt.remaining ?? Math.max(0, quota - soldCount);
                                const pct = tt.percentage ?? (quota > 0 ? Math.round((soldCount / quota) * 100) : 0);
                                const subtotalRev = tt.revenue ?? (soldCount * price);
                                const isSoldOut = quota > 0 && remaining === 0;

                                return (
                                  <div
                                    key={tt.id || tt.name}
                                    className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h5 className="text-xs font-black text-slate-900 line-clamp-1">
                                          {tt.name}
                                        </h5>
                                        <span className="text-[11px] font-extrabold text-indigo-600">
                                          Rp {price.toLocaleString('id-ID')}
                                        </span>
                                      </div>

                                      {isSoldOut ? (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase">
                                          Sold Out
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase">
                                          Sisa {remaining}
                                        </span>
                                      )}
                                    </div>

                                    {/* Stats: Terjual vs Kuota */}
                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-semibold text-[11px]">
                                        Terjual:
                                      </span>
                                      <span className="font-black text-slate-900">
                                        {soldCount} / {quota} <span className="text-slate-400 font-normal">({pct}%)</span>
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min(100, pct)}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Omzet Tipe Ini:</span>
                                        <span className="text-slate-800 font-black">
                                          Rp {subtotalRev.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 4. MONITOR ACTIVITY PER SCANNER GATEKEEPER                               */}
            {/* ========================================================================= */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                  Live Gate Terminal
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Real-time Sync
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Monitoring Activity Per Scanner Gatekeeper
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pantau jumlah total tiket yang berhasil di-scan oleh masing-masing petugas gate (Scanner 1, Scanner 2, Scanner 3, dll) secara live.
              </p>
            </div>

            <Link
              href="/dashboard/scanner-reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black transition-all border border-blue-200 shadow-2xs shrink-0 self-start sm:self-center cursor-pointer active:scale-[0.98]"
            >
              <span>Detail Laporan Scanner</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {eoAdmins.length === 0 ? (
            <div className="py-10 text-center space-y-2.5 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-black text-slate-800">Belum Ada Petugas Scanner Terdaftar</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Daftarkan staf pintu masuk di menu Management Staff untuk mulai memindai tiket pengunjung di gate event.
                </p>
              </div>
              <Link
                href="/dashboard/admins"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Petugas Scanner
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {eoAdmins.map((staff, idx) => {
                const totalScans = eoAdmins.reduce((sum, s) => sum + (s.scan_count || 0), 0);
                const percent = totalScans > 0 ? Math.round(((staff.scan_count || 0) / totalScans) * 100) : 0;

                return (
                  <div
                    key={staff.id || idx}
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-600/5 transition-all duration-300 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                          #{idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {staff.name || `Scanner ${idx + 1}`}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400 truncate max-w-[130px]">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Gate Active
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Sudah Di-Scan
                        </span>
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {(staff.scan_count || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400"> E-Tiket</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, percent || 5)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>Kontribusi: {percent}% Gate</span>
                          <span>Quota: {staff.scan_quota || '∞'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                      <span className="truncate max-w-[140px] flex items-center gap-1 font-semibold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{staff.event_title || 'Event Aktif'}</span>
                      </span>
                      <Link
                        href="/dashboard/scanner-reports"
                        className="text-blue-600 font-black hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        <span>Detail Log</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
