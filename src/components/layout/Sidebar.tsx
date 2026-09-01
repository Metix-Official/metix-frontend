'use me';
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
  const displayName = user?.name || user?.first_name || 'Guest User';
  const photoUrl = getPhotoUrl(user?.profile_photo_url || user?.photo);
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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
        { name: 'Tiket & Kuota', href: '/dashboard/tickets', iconName: 'Ticket' },
        { name: 'Kasir Offline (POS)', href: '/dashboard/pos', iconName: 'CreditCard' },
        // { name: 'Check-In QR', href: '/dashboard/checkin', iconName: 'QrCode' },
        { name: 'Kelola Admin Scan', href: '/dashboard/admins', iconName: 'Users' },
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/90 text-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col justify-between shadow-xs`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-slate-200/80">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/mitex.png"
                alt="METIX Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items & Role Badge */}
          <div className="px-3.5 py-4 space-y-3">
            <div className="px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 flex items-center justify-between gap-2 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 truncate">
                {userRoleLabel}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>

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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 group ${isActive
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/70'
                    }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <IconComponent
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-700'
                        }`}
                    />
                    <span className="whitespace-nowrap truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isActive
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

        {/* Footer Card / Account Info */}
        <div className="p-4 border-t border-slate-200/80">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-8.5 h-8.5 rounded-xl object-cover border border-blue-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-blue-700 font-medium truncate">
                  {planBadge}
                </span>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
