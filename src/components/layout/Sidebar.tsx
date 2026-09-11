'use client';

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  CreditCard,
  QrCode,
  Users,
  Send,
  Settings,
  X,
  TicketPercent,
  Sparkles,
  Printer,
  Building2,
} from 'lucide-react';
import { UserProfile, getPhotoUrl } from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePath?: string;
  user?: UserProfile | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  Ticket,
  CreditCard,
  QrCode,
  Users,
  Send,
  Settings,
  Printer,
  Building2,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const pathname = usePathname();
  const displayName =
    (user as any)?.organizer_profile?.organization_name ||
    (user as any)?.organizer?.name ||
    user?.name ||
    user?.first_name ||
    'Guest User';

  const isEo = getUserRole(user) === 'EO' || (user?.role || '').toUpperCase() === 'EO' || !!user?.organizer_profile;
  const rawLogo =
    (user as any)?.organizer?.logo ||
    (user as any)?.organizer?.logo_url ||
    (user as any)?.organizer_profile?.logo ||
    (user as any)?.organizer_profile?.logo_url ||
    user?.profile_photo_url ||
    user?.photo ||
    (user as any)?.avatar ||
    (user as any)?.avatar_url;

  const photoUrl = getPhotoUrl(rawLogo, undefined, isEo);

  const userInitials = React.useMemo(() => {
    if (!displayName) return 'M';
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.trim().substring(0, 2).toUpperCase();
  }, [displayName]);

  const currentRole = React.useMemo(() => getUserRole(user), [user]);

  // Role badge logic
  const userRoleLabel = React.useMemo(() => {
    switch (currentRole) {
      case ROLES.OWNER:
        return 'Super Admin Platform';
      case ROLES.EO:
        return 'Event Organizer (EO)';
      case ROLES.SCANNER:
        return 'Admin Scanner Staff';
      case ROLES.BUYER:
      default:
        return 'Pembeli Tiket';
    }
  }, [currentRole]);

  const planBadge = React.useMemo(() => {
    switch (currentRole) {
      case ROLES.OWNER:
        return 'Platform Owner';
      case ROLES.EO:
        return 'EO Partner';
      case ROLES.SCANNER:
        return 'Staff Scanner';
      case ROLES.BUYER:
      default:
        return 'Pembeli Tiket';
    }
  }, [currentRole]);

  // Dynamic Navigation Items per Role with distinct Href routes
  const roleNavItems = React.useMemo(() => {
    if (currentRole === ROLES.SCANNER) {
      return [
        { name: 'Dashboard Scanner', href: '/dashboard/checkin', iconName: 'QrCode' },
        { name: 'Profil Saya', href: '/dashboard/profile', iconName: 'Users' },
      ];
    }
    if (currentRole === ROLES.OWNER) {
      return [
        { name: 'Dashboard Owner', href: '/dashboard', iconName: 'LayoutDashboard' },
        { name: 'Kelola Semua Akun', href: '/dashboard/users', iconName: 'Users', badge: 'Users' },
        { name: 'Persetujuan Dana', href: '/dashboard/withdrawals', iconName: 'CreditCard' },
        { name: 'Laporan Analisis', href: '/dashboard/reports', iconName: 'Send' },
        { name: 'Audit Logs', href: '/dashboard/audit-logs', iconName: 'Printer' },
        { name: 'Pengaturan Platform', href: '/dashboard/settings', iconName: 'Settings' },
      ];
    }
    if (currentRole === ROLES.EO) {
      return [
        { name: 'Dashboard EO', href: '/dashboard', iconName: 'LayoutDashboard' },
        { name: 'Profil Organisasi', href: '/dashboard/organization', iconName: 'Building2', badge: 'EO' },
        { name: 'Penarikan Dana', href: '/dashboard/withdrawals', iconName: 'CreditCard', badge: 'Payout' },
        { name: 'Event Saya', href: '/dashboard/events', iconName: 'Calendar', badge: 'Aktif' },
        { name: 'Kasir Offline (POS)', href: '/dashboard/pos', iconName: 'CreditCard' },
        { name: 'Kelola Admin Scan', href: '/dashboard/admins', iconName: 'Users' },
        { name: 'Laporan Scanner', href: '/dashboard/scanner-reports', iconName: 'QrCode', badge: 'Gate' },
        { name: 'Laporan Penjualan', href: '/dashboard/reports', iconName: 'Send' },
        { name: 'Pengaturan', href: '/dashboard/settings', iconName: 'Settings' },
      ];
    }
    // Default Role: BUYER
    return [
      { name: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
      { name: 'Tiket Saya', href: '/dashboard/tickets', iconName: 'Ticket' },
      { name: 'Transfer Tiket', href: '/dashboard/transfers', iconName: 'Send' },
      { name: 'Profil Saya', href: '/dashboard/profile', iconName: 'Users' },
      { name: 'Pengaturan', href: '/dashboard/settings', iconName: 'Settings' },
    ];
  }, [currentRole]);

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Compact Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white border-r border-slate-200/90 text-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col justify-between shadow-xs`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 border-b border-slate-200/80">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/mitex.png"
                alt="METIX Logo"
                className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items & Role Badge */}
          <div className="px-2.5 py-3.5 space-y-2">
            <div className="px-2.5 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 flex items-center justify-between gap-1.5 shadow-2xs">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-blue-800 truncate">
                {userRoleLabel}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>

            <div className="space-y-1">
              {roleNavItems.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] || LayoutDashboard;

                // Only highlight the single item matching current route pathname exactly
                const isActive =
                  pathname === item.href ||
                  (item.href === '/dashboard' && (pathname === '/dashboard' || pathname === '/dashboard/'));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/70'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                      />
                      <span className="whitespace-nowrap truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Card / Account Info */}
        <div className="p-3 border-t border-slate-200/80">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-lg object-cover border border-blue-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-black text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-blue-600 font-bold truncate">
                  {planBadge}
                </span>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
