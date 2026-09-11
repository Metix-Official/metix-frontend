'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
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
      const isOrganizer = role === 'EO' || role === 'OWNER' || (u?.role || '').toUpperCase() === 'EO' || !!u?.organizer_profile;

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
        const candidateEventIds = new Set<number | string>([1, 2, 3, 4, 5]);
        finalEvents.forEach((e: any) => { if (e.id) candidateEventIds.add(e.id); });

        for (const evId of Array.from(candidateEventIds)) {
          try {
            const checkIns = await fetchScannerCheckIns(evId);
            if (checkIns && checkIns.length > 0) {
              globalApiCheckInCount += checkIns.length;
            }
          } catch {}
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
        // Akun Pembeli (BUYER) - hanya ambil data pembeli agar tidak 403
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
          title: 'Hasil Scan Staff Gate',
          value: `${totalScanned.toLocaleString('id-ID')} Scan`,
          change: `${totalStaff} Staff`,
          isPositive: true,
          period: `${staffText} (${totalScanned} QR ter-scan)`,
          iconName: 'UserCheck',
          href: '/dashboard/scanner-reports',
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
        period: 'via Metix',
        iconName: 'DollarSign',
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

  // Compute Recent Events list from backend API (EO Role Only)
  const eventsToDisplay: EventItem[] = React.useMemo(() => {
    if (currentRole !== 'mitra') return [];
    const rawList = dashboardData?.eventsList || [];
    if (rawList && rawList.length > 0) {
      return rawList.map((item: any) => {
        const totalQuota = item.ticket_types && item.ticket_types.length > 0
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.quota || 0), 0)
          : Number(item.total_tickets || item.totalTickets || item.tickets_capacity || item.quota || 0);

        const soldQty = item.ticket_types && item.ticket_types.length > 0
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_count ?? tt.sold_quantity ?? 0), 0)
          : Number(item.tickets_sold || item.ticketsSold || item.sold_count || item.sold_quantity || 0);

        const rev = item.revenue
          ? Number(item.revenue)
          : item.ticket_types
            ? item.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_count ?? tt.sold_quantity ?? 0) * Number(tt.price || 0)), 0)
            : 0;

        const isSoldOut = totalQuota > 0 && soldQty >= totalQuota;
        const categoryName = (typeof item.category === 'object' ? item.category?.name : item.category) || 'MUSIC CONCERT';
        const locationName = (typeof item.venue === 'object' ? item.venue?.name : item.venue) || item.venue_name || item.location || item.creator_name || 'Venue';

        let statusText: 'Active' | 'Draft' | 'Completed' | 'Sold Out' = 'Active';
        if (item.status === 'Sold Out' || isSoldOut) {
          statusText = 'Sold Out';
        } else if (item.status === 'published' || item.status === 'Active' || item.status === 'active') {
          statusText = 'Active';
        } else if (item.status === 'draft' || item.status === 'Draft') {
          statusText = 'Draft';
        }

        return {
          id: String(item.id),
          title: item.title || 'Untitled Event',
          category: String(categoryName).toUpperCase(),
          date: item.status === 'published' || item.status === 'active' || item.status === 'Active' ? 'Aktif' : (item.event_start_at ? new Date(item.event_start_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Aktif'),
          location: locationName,
          ticketsSold: soldQty,
          totalTickets: totalQuota,
          revenue: `Rp ${rev.toLocaleString('id-ID')}`,
          status: statusText,
          badgeColor: '',
        };
      });
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

      {/* Banner / Welcome Quick Action */}
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
              <>
                <Link
                  href="/dashboard/events"
                  className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-700" />
                  <span>Create Event</span>
                </Link>
              </>
            ) : currentRole === 'owner' ? (
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
            ) : (
              <>
                <Link
                  href="/events"
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <span>Jelajahi Event</span>
                </Link>
                <Link
                  href="/dashboard/tickets"
                  className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Ticket className="w-3.5 h-3.5 text-blue-700" />
                  <span>Lihat E-Tiket Saya</span>
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

      {/* Main Grid: Recent Transactions (2 cols) & Recent Events (1 col) - ONLY shown for Event Organizer (EO/mitra) role */}
      {currentRole === 'mitra' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-80 w-full rounded-2xl shadow-xs" />
            ) : (
              <RecentTransactions transactions={transactionsToDisplay} />
            )}
          </div>
          <div className="lg:col-span-1">
            {isLoading ? (
              <Skeleton className="h-80 w-full rounded-2xl shadow-xs" />
            ) : (
              <RecentEvents events={eventsToDisplay} />
            )}
          </div>
        </div>
      )}

      {/* Monitor Activity Per Scanner Widget (Scanner 1, Scanner 2, Scanner 3...) */}
      {(currentRole === 'mitra' || currentRole === 'owner') && (
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
      )}
    </DashboardLayout>
  );
}
