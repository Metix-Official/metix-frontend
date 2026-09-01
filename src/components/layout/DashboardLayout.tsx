'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getStoredToken, getStoredUser, fetchUserProfile, UserProfile } from '@/lib/api';
import { canAccessRoute, getDefaultRoleDashboard, getUserRole } from '@/lib/roles';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  activeNav?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle = 'Dashboard',
  activeNav = 'Dashboard',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initUser() {
      const token = getStoredToken();
      const currentUser = getStoredUser();

      if (!token) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        router.replace('/');
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);

      // Check immediate access using stored user
      const initialAccess = canAccessRoute(currentUser, pathname);
      setIsAuthorized(initialAccess);

      // Refresh profile from backend API asynchronously
      const freshUser = await fetchUserProfile();
      if (freshUser) {
        setUser(freshUser);
        const freshAccess = canAccessRoute(freshUser, pathname);
        setIsAuthorized(freshAccess);
      }
    }

    initUser();

    const handleProfileUpdate = () => {
      const updatedUser = getStoredUser();
      setUser(updatedUser);
      setIsAuthorized(canAccessRoute(updatedUser, pathname));
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [router, pathname]);

  // Loading state while checking authentication and route authorization
  if (isAuthenticated === null || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        <p className="text-xs font-bold text-slate-600">
          Memeriksa Hak Akses Metix...
        </p>
      </div>
    );
  }

  // Unauthorized Access UI (403 Forbidden Response)
  if (isAuthorized === false) {
    const defaultDashboard = getDefaultRoleDashboard(user);
    const userRole = getUserRole(user) || 'GUEST';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          403 — Akses Ditolak
        </h1>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          Akun Anda dengan role <span className="font-bold text-blue-700">{userRole}</span> tidak memiliki izin untuk mengakses halaman ini (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{pathname}</code>).
        </p>
        <Link
          href={defaultDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-sm shadow-md hover:bg-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Utama
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white flex">
      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePath={activeNav}
        user={user}
      />

      {/* Main Content Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Header Component */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          pageTitle={pageTitle}
          user={user}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
