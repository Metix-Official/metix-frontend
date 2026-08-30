'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getStoredToken, getStoredUser, fetchUserProfile, UserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  const router = useRouter();

  useEffect(() => {
    async function initUser() {
      const token = getStoredToken();
      const currentUser = getStoredUser();

      if (!token) {
        setIsAuthenticated(false);
        router.replace('/');
      } else {
        setUser(currentUser);
        setIsAuthenticated(true);
        // Refresh profile from backend API asynchronously
        const freshUser = await fetchUserProfile();
        if (freshUser) {
          setUser(freshUser);
        }
      }
    }
    initUser();

    // Listen for custom event when profile or photo is saved
    const handleProfileUpdate = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [router]);

  // Loading state while checking authentication guard
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        <p className="text-xs font-bold text-slate-600">
          Memeriksa Autentikasi Metix...
        </p>
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
