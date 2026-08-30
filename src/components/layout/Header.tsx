'use me';
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  X,
  Calendar,
  Ticket,
  LayoutDashboard,
  CreditCard,
  QrCode,
  Users,
  Send,
  Settings,
  Printer,
} from 'lucide-react';
import { CURRENT_USER } from '@/data/mockData';
import { UserProfile, logoutApi, getPhotoUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
  user?: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  pageTitle = 'Dashboard Overview',
  user,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayName = user?.name || user?.first_name || CURRENT_USER.name;
  const displayEmail = user?.email || CURRENT_USER.email;
  const photoUrl = getPhotoUrl(user?.profile_photo_url || user?.photo);
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Role label logic
  const userRoleLabel = React.useMemo(() => {
    if (user) {
      const roleNames = user.roles ? user.roles.map((r) => r.name) : [];
      if (user.email === 'admin@metix.com' || roleNames.includes('owner')) {
        return 'Super Admin Platform';
      }
      if (user.email === 'lutfifahri175@gmail.com' || roleNames.includes('mitra')) {
        return 'Event Organizer (EO)';
      }
    }
    return 'Pembeli Tiket';
  }, [user]);

  const handleLogout = async () => {
    await logoutApi();
    router.replace('/');
  };

  // Notifications per Role
  const initialNotifications = React.useMemo(() => {
    const roleNames = user?.roles ? user.roles.map((r) => r.name) : [];
    const isOwner = user?.email === 'admin@metix.com' || roleNames.includes('owner');
    const isMitra = user?.email === 'lutfifahri175@gmail.com' || roleNames.includes('mitra');

    if (isOwner) {
      return [
        {
          id: 1,
          title: 'Pengajuan Mitra Baru',
          desc: 'Mitra EO "Konser Jakarta Pro" mengajukan verifikasi akun.',
          time: '5 menit lalu',
          unread: true,
        },
        {
          id: 2,
          title: 'Permintaan Penarikan Dana',
          desc: 'Mitra Soundwave mengajukan penarikan Rp 25.000.000.',
          time: '1 jam lalu',
          unread: true,
        },
        {
          id: 3,
          title: 'Backup Sistem Otomatis',
          desc: 'Audit log dan database platform berhasil diperbarui.',
          time: '3 jam lalu',
          unread: false,
        },
      ];
    }

    if (isMitra) {
      return [
        {
          id: 1,
          title: 'Pembelian Tiket Baru',
          desc: 'Budi Santoso membeli 2x VIP Pass untuk Metix Music Fest.',
          time: '5 menit lalu',
          unread: true,
        },
        {
          id: 2,
          title: 'Kuota Tiket Hampir Habis!',
          desc: 'Presale 1 Metix Music Fest telah mencapai 95% kuota.',
          time: '1 jam lalu',
          unread: true,
        },
        {
          id: 3,
          title: 'Pencairan Dana Berhasil',
          desc: 'Rp 45.000.000 berhasil ditransfer ke rekening usaha.',
          time: '3 jam lalu',
          unread: false,
        },
      ];
    }

    // Default Customer / Pembeli Tiket
    return [
      {
        id: 1,
        title: 'Pembayaran Tiket Berhasil',
        desc: 'E-Tiket VIP Pass Metix Music Fest telah terbit & siap pakai.',
        time: '10 menit lalu',
        unread: true,
      },
      {
        id: 2,
        title: 'Pengingat Jadwal Event',
        desc: 'Metix Fest 2026 dimulai besok pukul 19:00 WIB di GBK.',
        time: '2 jam lalu',
        unread: true,
      },
      {
        id: 3,
        title: 'Transfer Tiket Diterima',
        desc: 'Anda menerima 1x Tiket Regular dari Rizky Pratama.',
        time: '1 hari lalu',
        unread: false,
      },
    ];
  }, [user]);

  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  // Quick Search Sidebar Menu Items logic
  const searchResults = React.useMemo(() => {
    const q = headerSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const roleNames = user?.roles ? user.roles.map((r) => r.name) : [];
    const isOwner = user?.email === 'admin@metix.com' || roleNames.includes('owner');
    const isMitra = user?.email === 'lutfifahri175@gmail.com' || roleNames.includes('mitra');

    let menuItems = [];

    if (isOwner) {
      menuItems = [
        { title: 'Dashboard Owner', desc: 'Ringkasan statistik platform & komisi', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Kelola Semua Akun (Users)', desc: 'Manajemen akun user, EO & pembeli', href: '/dashboard/users', icon: Users },
        { title: 'Persetujuan Dana (Withdrawals)', desc: 'Verifikasi pengajuan pencairan dana mitra', href: '/dashboard/withdrawals', icon: CreditCard },
        { title: 'Event Platform', desc: 'Daftar semua event terdaftar di platform', href: '/dashboard/events', icon: Calendar },
        { title: 'Laporan Analisis', desc: 'Laporan omzet & analitik platform', href: '/dashboard/reports', icon: Send },
        { title: 'Audit Logs', desc: 'Log aktivitas & jejak audit keamanan', href: '/dashboard/audit-logs', icon: Printer },
        { title: 'Pengaturan Platform', desc: 'Konfigurasi & preferensi sistem', href: '/dashboard/settings', icon: Settings },
        { title: 'Profil Saya', desc: 'Informasi profil Super Admin', href: '/dashboard/profile', icon: User },
        { title: 'Keamanan & API', desc: 'Password & kunci API platform', href: '/dashboard/security', icon: ShieldCheck },
      ];
    } else if (isMitra) {
      menuItems = [
        { title: 'Dashboard EO', desc: 'Ringkasan penjualan tiket & omzet', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Event Saya', desc: 'Buat, edit & publikasikan event', href: '/dashboard/events', icon: Calendar },
        { title: 'Tiket & Kuota', desc: 'Kelola harga tiket (VIP/Regular) & kuota', href: '/dashboard/tickets', icon: Ticket },
        { title: 'Kasir Offline (POS)', desc: 'Terminal transaksi kasir offline venue', href: '/dashboard/pos', icon: CreditCard },
        { title: 'Check-In QR', desc: 'Scan QR code e-tiket pintu masuk', href: '/dashboard/checkin', icon: QrCode },
        { title: 'Cetak Gelang (Wristbands)', desc: 'Generate & cetak QR gelang fisik', href: '/dashboard/wristbands', icon: Printer },
        { title: 'Laporan Penjualan', desc: 'Laporan transaksi & rekapitulasi kasir', href: '/dashboard/reports', icon: Send },
        { title: 'Pengaturan Account', desc: 'Pengaturan profil & usaha EO', href: '/dashboard/settings', icon: Settings },
        { title: 'Profil Saya', desc: 'Informasi profil akun mitra', href: '/dashboard/profile', icon: User },
        { title: 'Keamanan & API', desc: 'Password & kunci API', href: '/dashboard/security', icon: ShieldCheck },
      ];
    } else {
      menuItems = [
        { title: 'Dashboard Overview', desc: 'Ringkasan e-tiket & transaksi saya', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Tiket Saya', desc: 'E-Tiket pass aktif & cetak PDF', href: '/dashboard/tickets', icon: Ticket },
        { title: 'Transfer Tiket', desc: 'Kirim & terima tiket dari teman', href: '/dashboard/transfers', icon: Send },
        { title: 'Profil Saya', desc: 'Informasi profil & data akun', href: '/dashboard/profile', icon: User },
        { title: 'Pengaturan Akun', desc: 'Pengaturan & preferensi akun', href: '/dashboard/settings', icon: Settings },
        { title: 'Keamanan Akun', desc: 'Ubah password & keamanan', href: '/dashboard/security', icon: ShieldCheck },
      ];
    }

    return menuItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [headerSearchQuery, user]);

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 flex items-center justify-between transition-all shadow-2xs">
      {/* Left section: Hamburger toggle + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">
              {pageTitle}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 hidden sm:flex">
            <span>Selamat datang kembali,</span>
            <span className="font-extrabold text-slate-900">{displayName}</span>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 fill-amber-400/30" />
          </p>
        </div>
      </div>

      {/* Right section: Search, Notifications, User Profile */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block w-64 lg:w-80" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={headerSearchQuery}
            onChange={(e) => {
              setHeaderSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Cari menu & fitur sidebar..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium shadow-2xs"
          />
          {headerSearchQuery && (
            <button
              onClick={() => {
                setHeaderSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Live Search Results Dropdown */}
          {isSearchOpen && headerSearchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in-0 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Navigasi Menu ({searchResults.length})
                </span>
                <span className="text-[10px] text-blue-600 font-bold">Sidebar Nav</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item, idx) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setHeaderSearchQuery('');
                          router.push(item.href);
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors flex items-center gap-3 group cursor-pointer"
                      >
                        <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white transition-colors shrink-0 border border-blue-200/80">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 font-medium">
                  Tidak ada menu sidebar untuk "<span className="font-bold text-slate-800">{headerSearchQuery}</span>"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              if (isProfileOpen) setIsProfileOpen(false);
            }}
            className="relative p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200/90 transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      Semua Dibaca
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                      item.unread
                        ? 'bg-blue-50/50 border-blue-100'
                        : 'bg-slate-50 border-slate-100 opacity-75'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              if (isNotificationsOpen) setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-3 p-1.5 pl-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-50 bg-white transition-all shadow-2xs cursor-pointer"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-8 h-8 rounded-xl object-cover border border-blue-200 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                {userInitials}
              </div>
            )}

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-extrabold text-slate-900">
                {displayName}
              </span>
              <span className="text-[10px] text-blue-700 font-semibold">{userRoleLabel}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in-0">
              <div className="p-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="w-9 h-9 rounded-xl object-cover border border-blue-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {displayEmail}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <Link
                href="/dashboard/security"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Security & API</span>
              </Link>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
