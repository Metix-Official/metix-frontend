'use me';
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Ticket,
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  Settings,
  Calendar,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { getDefaultRoleDashboard } from '@/lib/roles';
import {
  getStoredToken,
  getStoredUser,
  fetchUserProfile,
  logoutApi,
  getPhotoUrl,
  UserProfile,
} from '@/lib/api';

interface NavbarProps {
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  lang?: 'id' | 'en';
  onLangChange?: (lang: 'id' | 'en') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onOpenHelpGuide?: () => void;
}

const IdFlagBadge: React.FC<{ className?: string }> = ({ className = 'w-4.5 h-3' }) => (
  <div className={`${className} rounded-[2px] overflow-hidden border border-slate-300/80 flex flex-col shrink-0 shadow-2xs`}>
    <div className="h-1/2 bg-[#e11d48]" />
    <div className="h-1/2 bg-white" />
  </div>
);

const UsFlagBadge: React.FC<{ className?: string }> = ({ className = 'w-4.5 h-3' }) => (
  <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] overflow-hidden border border-slate-300/80 shrink-0 shadow-2xs`}>
    <rect width="20" height="14" fill="#b22234" />
    <rect y="1.08" width="20" height="1.08" fill="#ffffff" />
    <rect y="3.23" width="20" height="1.08" fill="#ffffff" />
    <rect y="5.38" width="20" height="1.08" fill="#ffffff" />
    <rect y="7.54" width="20" height="1.08" fill="#ffffff" />
    <rect y="9.69" width="20" height="1.08" fill="#ffffff" />
    <rect y="11.85" width="20" height="1.08" fill="#ffffff" />
    <rect width="8" height="7.54" fill="#3c3b6e" />
    <circle cx="2" cy="1.8" r="0.6" fill="#ffffff" />
    <circle cx="4" cy="1.8" r="0.6" fill="#ffffff" />
    <circle cx="6" cy="1.8" r="0.6" fill="#ffffff" />
    <circle cx="3" cy="3.77" r="0.6" fill="#ffffff" />
    <circle cx="5" cy="3.77" r="0.6" fill="#ffffff" />
    <circle cx="2" cy="5.7" r="0.6" fill="#ffffff" />
    <circle cx="4" cy="5.7" r="0.6" fill="#ffffff" />
    <circle cx="6" cy="5.7" r="0.6" fill="#ffffff" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  lang = 'id',
  onLangChange,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onOpenHelpGuide,
}) => {
  const [isFlagDropdownOpen, setIsFlagDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User Authentication & Profile Dropdown State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const flagRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = getStoredToken();
    if (token) {
      const storedUser = getStoredUser();
      if (storedUser) setUser(storedUser);

      fetchUserProfile().then((freshUser) => {
        if (freshUser) setUser(freshUser);
      });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flagRef.current && !flagRef.current.contains(event.target as Node)) {
        setIsFlagDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectLang = (selectedLang: 'id' | 'en') => {
    if (onLangChange) {
      onLangChange(selectedLang);
    }
    setIsFlagDropdownOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setIsProfileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const isEo = (() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return role === 'EO' || role === 'MITRA' || role === 'ORGANIZER' || !!user.organizer_profile;
  })();

  const isOwner = (() => {
    if (!user) return false;
    const role = (user.role || (user as any).roles?.[0]?.name || '').toUpperCase();
    return role === 'OWNER' || role === 'SUPERADMIN' || role === 'ADMIN_PLATFORM' || role === 'SUPER ADMIN';
  })();

  const rawLogo =
    (user as any)?.organizer?.logo ||
    (user as any)?.organizer_profile?.logo ||
    user?.profile_photo_url ||
    user?.photo ||
    (user as any)?.avatar;

  const photoUrl = user ? getPhotoUrl(rawLogo, undefined, isEo) : null;

  const userDisplayName = user?.name || user?.first_name || 'Pengguna Metix';

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-2xl border-b border-slate-200/70 transition-all duration-300 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)] pt-[env(safe-area-inset-top)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-17 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Metix Logo Branding */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Center & Right Desktop Cluster */}
          <div className="hidden md:flex items-center justify-between gap-5 flex-1 ml-6 lg:ml-10">
            {/* Desktop Search Input Bar (Luxury Glass Pill Design) */}
            <div className="flex-1 max-w-2xl lg:max-w-3xl">
              <form onSubmit={handleFormSubmit} className="relative flex items-center w-full group/search">
                <div className="absolute left-4 pointer-events-none flex items-center justify-center text-slate-400 group-focus-within/search:text-blue-600 transition-colors">
                  <Search className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search concerts, favorite artists, festivals, or venues...'
                      : 'Cari konser musik, artis favorit, festival, atau venue...'
                  }
                  className="w-full pl-11 pr-24 py-2.5 bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-600 rounded-full text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs hover:shadow-xs focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange && onSearchChange('')}
                    className="absolute right-20 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                    aria-label={lang === 'en' ? 'Clear search' : 'Hapus Pencarian'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5 group/btn"
                  aria-label={lang === 'en' ? 'Search' : 'Cari'}
                >
                  <span>{lang === 'en' ? 'Search' : 'Cari'}</span>
                </button>
              </form>
            </div>

            {/* Right Desktop Action Buttons */}
            <div className="flex items-center gap-3.5 shrink-0 ml-auto">
              {/* Help Center / Info Button (Pusat Bantuan) */}
              <div className="relative group/help">
                <button
                  type="button"
                  onClick={onOpenHelpGuide}
                  className="w-10 h-10 rounded-2xl border border-slate-200/90 hover:border-blue-400 bg-white/90 hover:bg-blue-50/70 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                  title={lang === 'en' ? 'Help Center & Guides' : 'Pusat Bantuan & Panduan'}
                  aria-label="Pusat Bantuan"
                >
                  <Info className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
                </button>
                {/* Tooltip Pusat Bantuan */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover/help:opacity-100 transition-all duration-200 whitespace-nowrap z-50 translate-y-1 group-hover/help:translate-y-0">
                  {lang === 'en' ? 'Help Center & Guides' : 'Pusat Bantuan & Panduan'}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              </div>

              {/* Flag ID / EN Picker Dropdown */}
              <div className="relative" ref={flagRef}>
                <button
                  onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white/90 hover:bg-white text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                >
                  {/* Vector Country Flag Badge */}
                  {lang === 'id' ? <IdFlagBadge /> : <UsFlagBadge />}
                  <span className="font-extrabold text-xs text-slate-800">{lang === 'id' ? 'ID' : 'EN'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Flag Dropdown Options */}
                {isFlagDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-0 slide-in-from-top-2">
                    <button
                      onClick={() => handleSelectLang('id')}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        lang === 'id'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <IdFlagBadge />
                        <span>Bahasa Indonesia (ID)</span>
                      </span>
                      {lang === 'id' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>

                    <button
                      onClick={() => handleSelectLang('en')}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        lang === 'en'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <UsFlagBadge />
                        <span>English (EN)</span>
                      </span>
                      {lang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Vertical Divider Line */}
              <div className="h-6 w-px bg-slate-200" />

              {/* Action Buttons: Logged In (Profile Dropdown) VS Guest (Masuk & Daftar) */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-2xl border border-slate-200/90 bg-white/90 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="relative">
                      <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-white/20">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={userDisplayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userDisplayName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
                    </div>

                    <div className="flex flex-col text-left min-w-0 pr-0.5">
                      <span className="text-xs font-extrabold text-slate-900 line-clamp-1 max-w-[130px] leading-tight group-hover:text-blue-600 transition-colors">
                        {userDisplayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                        {isOwner ? 'Platform Owner' : isEo ? 'Organizer' : lang === 'en' ? 'Member' : 'Pengguna'}
                      </span>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-y-0.5 shrink-0" />
                  </button>

                  {/* Profile Collapsible Popover Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in-0 slide-in-from-top-2">
                      <div className="px-3.5 py-3 border-b border-slate-100 mb-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-black text-slate-900 truncate">{userDisplayName}</p>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/80">
                            {isOwner ? 'Owner' : isEo ? 'EO' : 'Buyer'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{user.email}</p>
                      </div>

                      <Link
                        href={getDefaultRoleDashboard(user)}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard Portal
                      </Link>

                      {isOwner ? (
                        <Link
                          href="/dashboard/events"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-blue-600" /> {lang === 'en' ? 'Events' : 'Event'}
                        </Link>
                      ) : isEo ? (
                        <Link
                          href="/dashboard/events"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-blue-600" /> {lang === 'en' ? 'My Events' : 'Event Saya'}
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard/tickets"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-blue-600" /> {lang === 'en' ? 'My Tickets' : 'Tiket Saya'}
                        </Link>
                      )}

                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-blue-600" /> {lang === 'en' ? 'Profile Settings' : 'Pengaturan Profil'}
                      </Link>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" /> {lang === 'en' ? 'Sign Out (Logout)' : 'Keluar (Logout)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-extrabold text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    {lang === 'en' ? 'Sign In' : 'Masuk'}
                  </button>

                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                    className="px-5.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {lang === 'en' ? 'Sign Up' : 'Daftar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            {/* Help Center Info Button Mobile */}
            <button
              type="button"
              onClick={onOpenHelpGuide}
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-blue-700 transition-colors"
              title="Pusat Bantuan"
              aria-label="Pusat Bantuan"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Flag ID / EN Picker Mobile */}
            <button
              onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-800 shadow-2xs"
            >
              {lang === 'id' ? <IdFlagBadge className="w-4 h-2.5" /> : <UsFlagBadge className="w-4 h-2.5" />}
              <span>{lang === 'id' ? 'ID' : 'EN'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Mobile Flag Dropdown */}
            {isFlagDropdownOpen && (
              <div className="absolute right-14 top-14 w-44 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
                <button
                  onClick={() => handleSelectLang('id')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold ${
                    lang === 'id' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IdFlagBadge className="w-4 h-2.5" />
                    <span>Indonesia (ID)</span>
                  </span>
                  {lang === 'id' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
                <button
                  onClick={() => handleSelectLang('en')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold ${
                    lang === 'en' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UsFlagBadge className="w-4 h-2.5" />
                    <span>English (EN)</span>
                  </span>
                  {lang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              </div>
            )}

            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200/90 cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-blue-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Downward Collapsible Dropdown Panel - Premium Glassmorphism Floating Card */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3.5 pb-5 border-t border-slate-200/70 space-y-4 animate-in fade-in-0 slide-in-from-top-3 duration-250">
            {/* Search Input Bar */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Cari artis, event, atau tempat...'
                    : 'Cari artis, event, atau tempat...'
                }
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 font-semibold transition-all shadow-2xs"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="absolute right-10 text-slate-400 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 p-1.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs active:scale-95 transition-transform"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Mobile Actions: User Profile VS Log In */}
            {user ? (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white rounded-2xl border border-blue-100/80 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-blue-600/20 border border-blue-400/30">
                    {photoUrl ? (
                      <img src={photoUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      userDisplayName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{userDisplayName}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={getDefaultRoleDashboard(user)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-transform"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 font-extrabold text-xs text-center cursor-pointer active:scale-95 transition-transform"
                >
                  {lang === 'en' ? 'Sign In' : 'Masuk'}
                </button>

                <button
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center shadow-md shadow-blue-600/20 active:scale-95 transition-transform cursor-pointer"
                >
                  {lang === 'en' ? 'Sign Up' : 'Daftar'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
