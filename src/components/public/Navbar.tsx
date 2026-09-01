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
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  lang = 'id',
  onLangChange,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
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

  const photoUrl = user ? getPhotoUrl(user.profile_photo_url || user.photo) : null;
  const userDisplayName = user?.name || user?.first_name || 'Pengguna Metix';

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Metix Logo Branding */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>

          {/* Center & Right Desktop Cluster */}
          <div className="hidden md:flex items-center justify-between gap-5 flex-1 ml-6 lg:ml-10">
            {/* Desktop Search Input Bar */}
            <div className="flex-1 max-w-3xl">
              <form onSubmit={handleFormSubmit} className="relative flex items-center w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Cari berdasarkan artis, acara, atau nama tempat'
                      : 'Cari berdasarkan artis, acara, atau nama tempat'
                  }
                  className="w-full pl-5 pr-24 py-2.5 bg-slate-50/90 border border-slate-200/90 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all shadow-2xs font-medium"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange && onSearchChange('')}
                    className="absolute right-14 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                    aria-label="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 group"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </button>
              </form>
            </div>

            {/* Right Desktop Action Buttons */}
            <div className="flex items-center gap-3.5 shrink-0 ml-auto">
              {/* Flag ID / EN Picker Dropdown */}
              <div className="relative" ref={flagRef}>
                <button
                  onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200/90 hover:border-blue-300 bg-slate-50/90 hover:bg-white text-xs font-extrabold text-slate-800 transition-all shadow-2xs cursor-pointer"
                >
                  <span>{lang === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

              {/* Flag Dropdown Options */}
              {isFlagDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-0">
                  <button
                    onClick={() => handleSelectLang('id')}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      lang === 'id'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>🇮🇩</span> Bahasa Indonesia
                    </span>
                    {lang === 'id' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>

                  <button
                    onClick={() => handleSelectLang('en')}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      lang === 'en'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>🇺🇸</span> English (EN)
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
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
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
                  <span className="text-xs font-extrabold text-slate-900 line-clamp-1 max-w-[120px]">
                    {userDisplayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>

                {/* Profile Collapsible Popover Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in-0">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-900 truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{user.email}</p>
                    </div>

                    <Link
                      href={getDefaultRoleDashboard(user)}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard Portal
                    </Link>

                    <Link
                      href="/dashboard/tickets"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-blue-600" /> Tiket Saya
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-blue-600" /> Pengaturan Profil
                    </Link>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" /> Keluar (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                  className="px-5 py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 font-extrabold text-xs transition-all shadow-2xs cursor-pointer"
                >
                  {lang === 'en' ? 'Sign In' : 'Masuk'}
                </button>

                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Sign Up' : 'Daftar'}
                </button>
              </div>
            )}
          </div>
        </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Flag ID / EN Picker */}
            <button
              onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-800"
            >
              <span>{lang === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Mobile Flag Dropdown */}
            {isFlagDropdownOpen && (
              <div className="absolute right-14 top-14 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
                <button
                  onClick={() => handleSelectLang('id')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold ${
                    lang === 'id' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>🇮🇩 Indonesia</span>
                  {lang === 'id' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
                <button
                  onClick={() => handleSelectLang('en')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold ${
                    lang === 'en' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>🇺🇸 English</span>
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

        {/* Mobile Downward Collapsible Dropdown Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/80 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Search Input Bar */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search by artist, event, or venue'
                    : 'Cari berdasarkan artis, acara, atau tempat'
                }
                className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="absolute right-10 text-slate-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="absolute right-1.5 p-1.5 rounded-lg bg-blue-600 text-white shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Mobile Actions: User Profile VS Log In */}
            {user ? (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      userDisplayName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-slate-900 truncate">{userDisplayName}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs text-center flex items-center justify-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs text-center cursor-pointer"
                >
                  {lang === 'en' ? 'Sign In' : 'Masuk'}
                </button>

                <button
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center shadow-md shadow-blue-600/20 cursor-pointer"
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
