'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RecentEvents } from '@/components/dashboard/RecentEvents';
import { StatMetric, Transaction, EventItem } from '@/data/mockData';
import { fetchDashboardData, fetchEoAdmins, fetchMyEvents, fetchUserTickets, fetchSalesReportData, DashboardResponse, EoAdminUser, getStoredUser } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Download, Sparkles, Ticket, ShieldCheck, UserCheck, AlertCircle, XCircle } from 'lucide-react';

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
        if (admins) {
          setEoAdmins(admins);
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

    const totalScanned = eoAdmins.reduce((acc, a) => acc + (a.scan_count || 0), 0) || (s?.checkinsCount || 0);
    const totalStaff = eoAdmins.length;
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
          ? e.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_quantity || 0), 0)
          : (e.tickets_sold || e.ticketsSold || 0);
        return acc + sold;
      }, 0);
      const totalOrders = reportTicketsSold > 0 ? reportTicketsSold : ((s?.totalOrders && Number(s.totalOrders) > 0) ? Number(s.totalOrders) : calcOrders);

      const calcRevenue = rawEvents.reduce((acc: number, e: any) => {
        const rev = e.revenue
          ? Number(e.revenue)
          : e.ticket_types
            ? e.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_quantity || 0) * Number(tt.price || 0)), 0)
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
          change: '+12.5%',
          isPositive: true,
          period: 'tiket rilis',
          iconName: 'Ticket',
        },
        {
          id: 's3',
          title: 'Total Pendapatan',
          value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
          change: '+8.2%',
          isPositive: true,
          period: 'omzet EO',
          iconName: 'DollarSign',
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

  // Compute Recent Transactions list from backend API (EO Role Only)
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
        status: ord.status === 'paid' ? 'Completed' : 'Completed',
        date: ord.created_at
          ? new Date(ord.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
          : 'Hari ini',
      }));
    }

    const tData = dashboardData?.tickets?.data || [];
    if (tData && tData.length > 0) {
      return tData.map((item: any, idx: number) => ({
        id: item.id ? String(item.id) : `tx-${idx}`,
        invoiceId: item.order?.invoice_number || item.invoice_number || `INV-${item.id || idx + 1}`,
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

    const rawEvents = dashboardData?.eventsList || [];
    if (rawEvents.length > 0) {
      const generated: Transaction[] = [];
      rawEvents.forEach((evt: any, eIdx: number) => {
        const ticketTypes = evt.ticket_types || [];
        ticketTypes.forEach((tt: any, tIdx: number) => {
          const sold = Number(tt.sold_quantity || 0);
          if (sold > 0) {
            generated.push({
              id: `tx-gen-${eIdx}-${tIdx}`,
              invoiceId: `INV-2026-${eIdx + 1}${tIdx + 1}`,
              customerName: 'Pengunjung Metix',
              customerEmail: 'customer@metix.id',
              eventName: evt.title || 'Event Metix',
              ticketType: tt.name || 'Pass',
              quantity: sold,
              amount: `Rp ${(sold * Number(tt.price || 0)).toLocaleString('id-ID')}`,
              status: 'Completed',
              date: 'Terbaru',
            });
          }
        });
      });
      if (generated.length > 0) return generated;
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
          : Number(item.total_tickets || item.totalTickets || item.quota || 500);

        const soldQty = item.ticket_types && item.ticket_types.length > 0
          ? item.ticket_types.reduce((sum: number, tt: any) => sum + Number(tt.sold_quantity || 0), 0)
          : Number(item.tickets_sold || item.ticketsSold || item.sold_quantity || 0);

        const rev = item.revenue
          ? Number(item.revenue)
          : item.ticket_types
            ? item.ticket_types.reduce((sum: number, tt: any) => sum + (Number(tt.sold_quantity || 0) * Number(tt.price || 0)), 0)
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
          totalTickets: totalQuota > 0 ? totalQuota : 500,
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
                {currentRole !== 'pembeli' && (
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export Report
                  </button>
                )}
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

      {/* Main Grid: Recent Transactions (2 cols) & Recent Events (1 col) - ONLY shown for Event Organizer (EO/mitra) role */}
      {currentRole === 'mitra' && (
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
      )}

      {/* Monitor Activity Per Scanner Widget (Scanner 1, Scanner 2, Scanner 3...) */}
      {(currentRole === 'mitra' || currentRole === 'owner') && (
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  Live Gate Monitor
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-time Sync
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-blue-600" /> Monitoring Activity Per Scanner Gatekeeper
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pantau jumlah total tiket yang berhasil di-scan oleh masing-masing petugas gate (Scanner 1, Scanner 2, Scanner 3, dll).
              </p>
            </div>

            <a
              href="/dashboard/scanner-reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition-all shadow-2xs border border-blue-200 shrink-0 self-start sm:self-center"
            >
              Lihat Detail Laporan Scanner &rarr;
            </a>
          </div>

          {eoAdmins.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Petugas Scanner Terdaftar</h4>
                <p className="text-xs text-slate-500">
                  Daftarkan petugas gatekeeper di menu Management Staff / Scanner.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eoAdmins.map((staff, idx) => {
                const totalScans = eoAdmins.reduce((sum, s) => sum + (s.scan_count || 0), 0);
                const percent = totalScans > 0 ? Math.round(((staff.scan_count || 0) / totalScans) * 100) : 0;

                return (
                  <div
                    key={staff.id || idx}
                    className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/20">
                          #{idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                            {staff.name || `Scanner ${idx + 1}`}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black uppercase">
                        Active
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Sudah Di-Scan
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-blue-600">
                            {(staff.scan_count || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs font-bold text-slate-400"> E-Tiket</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, percent || 5)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Kontribusi Gate: {percent}%</span>
                          <span>Quota: {staff.scan_quota || '∞'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                      <span className="truncate max-w-[160px]">📍 {staff.event_title || 'Event Active'}</span>
                      <a
                        href="/dashboard/scanner-reports"
                        className="text-blue-600 font-extrabold hover:underline"
                      >
                        Detail &rarr;
                      </a>
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
