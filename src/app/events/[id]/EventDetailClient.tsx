'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Ticket,
  ExternalLink,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  X,
  BadgeCheck,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Info,
  Car,
  Crown,
  Camera,
  Music,
  Utensils,
  Wifi,
  Video,
  Globe,
} from 'lucide-react';
import { fetchPublicEventDetail, fetchTicketTypes, ApiEvent, ApiLineupItem, ApiSocialMedia, getPhotoUrl, getStoredToken } from '@/lib/api';
import { TicketCheckoutModal } from '@/components/public/TicketCheckoutModal';
import { AuthModal } from '@/components/public/AuthModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Footer } from '@/components/public/Footer';

export default function EventDetailClient() {
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeMobileTab, setActiveMobileTab] = useState<'deskripsi' | 'lineup' | 'fasilitas' | 'social_media'>('deskripsi');

  const [organizerLogoError, setOrganizerLogoError] = useState(false);

  const handleBuyClick = () => {
    if (!event) return;
    const token = getStoredToken();
    if (!token) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    router.push(`/events/${event.id}/checkout`);
  };

  useEffect(() => {
    const rawId = params?.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    const fetchId = targetId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null);

    if (fetchId) {
      fetchPublicEventDetail(fetchId).then(async (data) => {
        if (data) {
          try {
            const types = await fetchTicketTypes(data.id);
            if (types && types.length > 0) {
              data.ticket_types = types;
            } else {
              data.ticket_types = [
                {
                  id: 1,
                  event_id: data.id,
                  name: 'Reguler Pass',
                  price: 150000,
                  quota: 500,
                  sold_quantity: 0,
                  max_per_order: 5,
                  available_quota: 500,
                  status: 'ACTIVE',
                },
                {
                  id: 2,
                  event_id: data.id,
                  name: 'VIP Pass (Front Row)',
                  price: 350000,
                  quota: 100,
                  sold_quantity: 0,
                  max_per_order: 3,
                  available_quota: 100,
                  status: 'ACTIVE',
                },
              ];
            }
          } catch {
            data.ticket_types = [
              {
                id: 1,
                event_id: data.id,
                name: 'Reguler Pass',
                price: 150000,
                quota: 500,
                sold_quantity: 0,
                max_per_order: 5,
                available_quota: 500,
                status: 'ACTIVE',
              },
              {
                id: 2,
                event_id: data.id,
                name: 'VIP Pass (Front Row)',
                price: 350000,
                quota: 100,
                sold_quantity: 0,
                max_per_order: 3,
                available_quota: 100,
                status: 'ACTIVE',
              },
            ];
          }
        }
        setEvent(data);
        setIsLoading(false);
      });
    }
  }, [params]);

  // Compute lowest ticket price
  const lowestPrice = React.useMemo(() => {
    if (!event) return 'Rp 150.000';
    if (event.ticket_types && event.ticket_types.length > 0) {
      const validPrices = event.ticket_types
        .map((t) => Number(t.price))
        .filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length > 0) {
        return `Rp ${Math.min(...validPrices).toLocaleString('id-ID')}`;
      }
    }
    return 'Rp 150.000';
  }, [event]);

  // Format Date & Time from start_at / event_start_at
  const dateFormatted = React.useMemo(() => {
    const startStr = event?.start_at || event?.event_start_at || event?.start_time;
    if (!startStr) return 'Tanggal belum ditentukan';
    try {
      const d = new Date(startStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return startStr;
    }
  }, [event]);

  const timeFormatted = React.useMemo(() => {
    const startStr = event?.start_at || event?.event_start_at || event?.start_time;
    const endStr = event?.end_at || event?.event_end_at || event?.end_time;
    if (!startStr) return '19:00 WIB';
    try {
      const dStart = new Date(startStr);
      const startTime = dStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (endStr) {
        const dEnd = new Date(endStr);
        const endTime = dEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${startTime} - ${endTime} WIB`;
      }
      return `${startTime} WIB`;
    } catch {
      return '19:00 WIB';
    }
  }, [event]);

  const venueNameFormatted = React.useMemo(() => {
    if (!event) return 'Venue Location';
    if (event.venue) {
      if (typeof event.venue === 'object') {
        const name = event.venue.name || '';
        const city = event.venue.city || '';
        if (name && city && name.toLowerCase() !== city.toLowerCase()) {
          return `${name}, ${city}`;
        }
        return name || city || 'Venue Utama';
      }
      return String(event.venue);
    }
    return event.location || 'Venue Utama';
  }, [event]);

  const venueAddressFormatted = React.useMemo(() => {
    if (!event) return null;
    if (typeof event.venue === 'object' && event.venue?.address) {
      return event.venue.address;
    }
    return event.address || null;
  }, [event]);

  const organizerDetails = React.useMemo(() => {
    if (!event) return null;
    let orgData: any = null;
    if (event.organizer && typeof event.organizer === 'object') {
      orgData = event.organizer;
    } else if ((event as any)?.organizer_profile && typeof (event as any).organizer_profile === 'object') {
      orgData = (event as any).organizer_profile;
    }

    const name = orgData?.organization_name || orgData?.name || (typeof event.organizer === 'string' ? event.organizer : null) || (event as any)?.user?.name || 'Metix Official Organizer';
    const logo = orgData?.logo ? getPhotoUrl(orgData.logo) : null;
    const description = orgData?.description || 'Penyelenggara terverifikasi di platform Metix Indonesia. Berpengalaman dalam menyelenggarakan konser musik, festival, dan acara hiburan terpopuler.';
    const address = orgData?.address || (event as any)?.city || 'Indonesia';
    const phone = orgData?.phone || (event as any)?.user?.phone || '081234567891';
    const email = orgData?.email || (event as any)?.user?.email || 'organizer@metix.id';
    const status = orgData?.status || 'ACTIVE';

    return {
      name,
      logo,
      description,
      address,
      phone,
      email,
      status,
      isVerified: status === 'ACTIVE' || status === 'APPROVED' || !orgData,
    };
  }, [event]);

  const organizerName = organizerDetails?.name || 'Metix Official Organizer';
  const organizerLogoUrl = organizerDetails?.logo || null;

  const bannerUrl =
    (event ? getPhotoUrl(event.banner, event.id) : null) ||
    (typeof window !== 'undefined' && event?.id ? localStorage.getItem(`metix_banner_preview_${event.id}`) : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('metix_last_uploaded_banner') : null) ||
    (event?.venue_photo ? getPhotoUrl(event.venue_photo) : null);
  const venuePhotoUrl = event?.venue_photo ? getPhotoUrl(event.venue_photo) : null;

  const parsedLineups: any[] = (() => {
    if (!event) return [];
    let raw = event.lineups || (event as any).lineup || (event as any).event_lineups;
    if ((!raw || (Array.isArray(raw) && raw.length === 0)) && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`metix_event_details_${event.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.lineups || parsed.lineup) raw = parsed.lineups || parsed.lineup;
        }
      } catch {}
    }
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {}
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      if (Array.isArray((raw as any).data)) raw = (raw as any).data;
      else if (Array.isArray((raw as any).lineups)) raw = (raw as any).lineups;
      else if (Array.isArray((raw as any).lineup)) raw = (raw as any).lineup;
      else raw = [raw];
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
  })();

  const parsedFacilities: any[] = (() => {
    if (!event) return [];
    let raw = event.facilities || (event as any).facility;
    if ((!raw || (Array.isArray(raw) && raw.length === 0)) && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`metix_event_details_${event.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.facilities) raw = parsed.facilities;
        }
      } catch {}
    }
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {}
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      if (Array.isArray((raw as any).data)) raw = (raw as any).data;
      else if (Array.isArray((raw as any).facilities)) raw = (raw as any).facilities;
      else if (Array.isArray((raw as any).facility)) raw = (raw as any).facility;
      else raw = [raw];
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
  })();

  const parsedSocialMedia: ApiSocialMedia = (() => {
    if (!event) return {};
    let raw = event.social_media || (event as any).socials || {};
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch { }
    }
    if (Object.keys(raw).length === 0 && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`metix_event_details_${event.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.social_media) raw = parsed.social_media;
        }
      } catch { }
    }
    return {
      instagram: raw.instagram || (event as any).instagram || '',
      tiktok: raw.tiktok || (event as any).tiktok || '',
      website: raw.website || (event as any).website || '',
      whatsapp: raw.whatsapp || (event as any).whatsapp || '',
      youtube: raw.youtube || (event as any).youtube || '',
    };
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-32 rounded-2xl" />
          </div>
        </header>

        {/* Content Skeleton matching 7:5 grid split */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-[380px] sm:h-[420px] w-full rounded-3xl" />
              <Skeleton className="h-56 w-full rounded-3xl" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Event Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 font-medium">
            Event yang Anda cari tidak tersedia atau belum dipublikasikan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar / Back header with METIX Logo Branding */}
      <header className="bg-white/95 border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-bold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Kembali</span>
          </Link>

          {/* Official METIX Logo Branding */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
        </div>
      </header>

      {/* Main Content Grid matching user layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Banner Image + Description */}
          <div className="lg:col-span-7 space-y-6">
            {/* Big Event Banner Container */}
            <div className="rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shadow-xs relative group">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt={event.title}
                  className="w-full h-auto max-h-[480px] object-cover"
                />
              ) : (
                <div className="h-80 sm:h-96 w-full bg-gradient-to-tr from-blue-600 via-indigo-700 to-purple-800 p-8 flex flex-col justify-end text-white relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ffffff20_0%,transparent_60%)]" />
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-wider w-fit mb-2 border border-white/20">
                    {event.category || 'Music Concert'}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">{event.title}</h1>
                </div>
              )}
            </div>

            {/* Mobile Navigation Tabs Bar (Visible on Mobile Only: lg:hidden) */}
            <div className="lg:hidden border-b border-slate-200 bg-white pt-2 pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-3">
              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('deskripsi')}
                  className={`pb-2.5 text-sm font-extrabold whitespace-nowrap transition-all relative cursor-pointer ${activeMobileTab === 'deskripsi'
                    ? 'text-blue-600 font-extrabold'
                    : 'text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                >
                  <span>Deskripsi</span>
                  {activeMobileTab === 'deskripsi' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-in fade-in-0" />
                  )}
                </button>

                {parsedLineups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('lineup')}
                    className={`pb-2.5 text-sm font-extrabold whitespace-nowrap transition-all relative cursor-pointer ${activeMobileTab === 'lineup'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 font-bold'
                      }`}
                  >
                    <span>Lineup</span>
                    {activeMobileTab === 'lineup' && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-in fade-in-0" />
                    )}
                  </button>
                )}

                {parsedFacilities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('fasilitas')}
                    className={`pb-2.5 text-sm font-extrabold whitespace-nowrap transition-all relative cursor-pointer ${activeMobileTab === 'fasilitas'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-slate-700 hover:text-slate-900 font-bold'
                      }`}
                  >
                    <span>Fasilitas</span>
                    {activeMobileTab === 'fasilitas' && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-in fade-in-0" />
                    )}
                  </button>
                )}

                {(parsedSocialMedia.instagram ||
                  parsedSocialMedia.tiktok ||
                  parsedSocialMedia.website ||
                  parsedSocialMedia.whatsapp ||
                  parsedSocialMedia.youtube) && (
                    <button
                      type="button"
                      onClick={() => setActiveMobileTab('social_media')}
                      className={`pb-2.5 text-sm font-extrabold whitespace-nowrap transition-all relative cursor-pointer ${activeMobileTab === 'social_media'
                        ? 'text-blue-600 font-extrabold'
                        : 'text-slate-700 hover:text-slate-900 font-bold'
                        }`}
                    >
                      <span>Media Sosial</span>
                      {activeMobileTab === 'social_media' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-in fade-in-0" />
                      )}
                    </button>
                  )}
              </div>
            </div>

            {/* Deskripsi Section */}
            <div className={`space-y-2.5 pt-1 ${activeMobileTab === 'deskripsi' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="hidden lg:block text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Deskripsi Event
              </h3>
              <div
                className={`prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line ${!isDescriptionExpanded ? 'line-clamp-3' : ''
                  }`}
              >
                {event.description ||
                  'Deskripsi detail event ini belum ditambahkan oleh penyelenggara. Dapatkan tiket resmi event ini sekarang sebelum kehabisan!'}
              </div>

              {(event.description || '').length > 150 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-extrabold cursor-pointer transition-colors pt-0.5"
                >
                  <span>{isDescriptionExpanded ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'}</span>
                  {isDescriptionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Lineup Section */}
            {parsedLineups.length > 0 && (
              <div className={`space-y-3 pt-2 ${activeMobileTab === 'lineup' ? 'block' : 'hidden lg:block'}`}>
                <h3 className="hidden lg:block text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Lineup
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedLineups.map((item: any, idx) => {
                    const lineupName = typeof item === 'string'
                      ? item
                      : (typeof item?.name === 'string'
                        ? item.name
                        : (typeof item?.name === 'object' ? String(item.name?.name || item.name?.title || '') : String(item?.name || '')));
                    const lineupImg = (typeof item === 'object'
                      ? (typeof item?.image === 'string' ? item.image : (typeof item?.photo === 'string' ? item.photo : null))
                      : null) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200';
                    const lineupDesc = (typeof item === 'object' && typeof item?.description === 'string')
                      ? item.description
                      : (typeof item?.description === 'number' ? String(item.description) : null);
                    return (
                      <div
                        key={item?.id || idx}
                        className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                            <img
                              src={lineupImg}
                              alt={lineupName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                              {lineupName}
                            </h4>
                            {lineupDesc && (
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {lineupDesc}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="w-4.5 h-4.5 text-blue-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fasilitas Section */}
            {parsedFacilities.length > 0 && (
              <div className={`space-y-3 pt-3 ${activeMobileTab === 'fasilitas' ? 'block' : 'hidden lg:block'}`}>
                <h3 className="hidden lg:block text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Fasilitas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedFacilities.map((fac: any, idx) => {
                    const facName = typeof fac === 'string' ? fac : (fac && typeof fac === 'object' ? (fac.name || '') : String(fac || ''));

                    const getFacilityIcon = (nameInput: any) => {
                      const facStr = typeof nameInput === 'string' ? nameInput : (nameInput && typeof nameInput === 'object' ? (nameInput.name || '') : String(nameInput || ''));
                      const lower = facStr.toLowerCase();
                      if (lower.includes('parkir')) return <Car className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('vip')) return <Crown className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('photo') || lower.includes('foto')) return <Camera className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('stage') || lower.includes('panggung') || lower.includes('hiburan') || lower.includes('musik')) return <Music className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('makanan') || lower.includes('tenant') || lower.includes('food') || lower.includes('kuliner')) return <Utensils className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('toilet') || lower.includes('wc')) return <Sparkles className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-5 h-5 text-blue-600" />;
                      if (lower.includes('medis') || lower.includes('p3k')) return <ShieldCheck className="w-5 h-5 text-blue-600" />;
                      return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
                    };

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3.5 shadow-2xs hover:shadow-sm transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
                          {getFacilityIcon(facName)}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                          {facName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Sosial Section (Only visible on Mobile when activeMobileTab === 'social_media') */}
            {(parsedSocialMedia.instagram ||
              parsedSocialMedia.tiktok ||
              parsedSocialMedia.website ||
              parsedSocialMedia.whatsapp ||
              parsedSocialMedia.youtube) && (
                <div className={`space-y-3 pt-3 lg:hidden ${activeMobileTab === 'social_media' ? 'block' : 'hidden'}`}>
                  <div className="flex flex-wrap gap-2">
                    {parsedSocialMedia.instagram && (
                      <a
                        href={
                          parsedSocialMedia.instagram.startsWith('http')
                            ? parsedSocialMedia.instagram
                            : `https://instagram.com/${parsedSocialMedia.instagram.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-pink-300 hover:bg-pink-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-pink-600 shrink-0" />
                        <span>Instagram</span>
                      </a>
                    )}

                    {parsedSocialMedia.tiktok && (
                      <a
                        href={
                          parsedSocialMedia.tiktok.startsWith('http')
                            ? parsedSocialMedia.tiktok
                            : `https://tiktok.com/@${parsedSocialMedia.tiktok.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-slate-900 shrink-0" />
                        <span>TikTok</span>
                      </a>
                    )}

                    {parsedSocialMedia.website && (
                      <a
                        href={
                          parsedSocialMedia.website.startsWith('http')
                            ? parsedSocialMedia.website
                            : `https://${parsedSocialMedia.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Website</span>
                      </a>
                    )}

                    {parsedSocialMedia.whatsapp && (
                      <a
                        href={
                          parsedSocialMedia.whatsapp.startsWith('http')
                            ? parsedSocialMedia.whatsapp
                            : `https://wa.me/${parsedSocialMedia.whatsapp.replace(/[^0-9]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {parsedSocialMedia.youtube && (
                      <a
                        href={
                          parsedSocialMedia.youtube.startsWith('http')
                            ? parsedSocialMedia.youtube
                            : `https://youtube.com/${parsedSocialMedia.youtube}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-rose-400 hover:bg-rose-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Divider Line */}
            <div className="hidden lg:block border-t border-slate-200 my-4" />

          </div>

          {/* RIGHT COLUMN: Event Summary Card + Pricing / Beli Sekarang Button */}
          <div className="lg:col-span-5 space-y-5">

            {/* Card 1: Event Summary Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase leading-snug">
                {event.title}
              </h2>

              <div className="space-y-3 pt-1 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-900 font-bold">{dateFormatted}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-900 font-bold">{timeFormatted}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="block text-slate-900 font-bold uppercase text-xs sm:text-sm">
                      {venueNameFormatted}
                    </span>
                    {venueAddressFormatted && (
                      <span className="block text-xs text-slate-500 font-medium">{venueAddressFormatted}</span>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        venueNameFormatted + ' ' + (venueAddressFormatted || '')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold mt-1"
                    >
                      <span>Petunjuk Arah</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Separator & Premium Organizer Profile Card */}
              <div className="pt-5 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Penyelenggara Event</span>
                  </span>
                  {organizerDetails?.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200/60 shadow-2xs">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Terverifikasi</span>
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200/90 hover:border-blue-300 shadow-xs transition-all space-y-3">
                  <div className="flex items-center gap-3">
                    {organizerLogoUrl && !organizerLogoError ? (
                      <img
                        src={organizerLogoUrl}
                        alt={organizerName}
                        onError={() => setOrganizerLogoError(true)}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 border border-blue-400/30">
                        {organizerName.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                        {organizerName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{organizerDetails?.address || 'Official Organizer Partner'}</span>
                      </p>
                    </div>
                  </div>

                  {organizerDetails?.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-slate-100/90">
                      {organizerDetails.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-[11px]">{organizerDetails?.email || 'cs@metix.id'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOrganizerModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 border border-slate-200/90 shadow-2xs text-xs font-black transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Profil Organizer</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Price & "Beli Sekarang" CTA Button (Desktop Only, hidden on Mobile) */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Mulai Dari</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{lowestPrice}</span>
              </div>

              {event.status === 'closed' ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-lg bg-slate-100 text-slate-400 font-extrabold text-sm cursor-not-allowed text-center"
                >
                  Tiket Habis (Sold Out)
                </button>
              ) : (
                <button
                  onClick={handleBuyClick}
                  className="w-full py-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-700/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Beli Sekarang</span>
                </button>
              )}
            </div>

            {/* Card: Media Sosial (Desktop Only: hidden lg:block) */}
            {(parsedSocialMedia.instagram ||
              parsedSocialMedia.tiktok ||
              parsedSocialMedia.website ||
              parsedSocialMedia.whatsapp ||
              parsedSocialMedia.youtube) && (
                <div className="hidden lg:block space-y-2 pt-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                    Media Sosial
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedSocialMedia.instagram && (
                      <a
                        href={
                          parsedSocialMedia.instagram.startsWith('http')
                            ? parsedSocialMedia.instagram
                            : `https://instagram.com/${parsedSocialMedia.instagram.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-pink-300 hover:bg-pink-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-pink-600 shrink-0" />
                        <span>Instagram</span>
                      </a>
                    )}

                    {parsedSocialMedia.tiktok && (
                      <a
                        href={
                          parsedSocialMedia.tiktok.startsWith('http')
                            ? parsedSocialMedia.tiktok
                            : `https://tiktok.com/@${parsedSocialMedia.tiktok.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-slate-900 shrink-0" />
                        <span>TikTok</span>
                      </a>
                    )}

                    {parsedSocialMedia.website && (
                      <a
                        href={
                          parsedSocialMedia.website.startsWith('http')
                            ? parsedSocialMedia.website
                            : `https://${parsedSocialMedia.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Website</span>
                      </a>
                    )}

                    {parsedSocialMedia.whatsapp && (
                      <a
                        href={
                          parsedSocialMedia.whatsapp.startsWith('http')
                            ? parsedSocialMedia.whatsapp
                            : `https://wa.me/${parsedSocialMedia.whatsapp.replace(/[^0-9]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {parsedSocialMedia.youtube && (
                      <a
                        href={
                          parsedSocialMedia.youtube.startsWith('http')
                            ? parsedSocialMedia.youtube
                            : `https://youtube.com/${parsedSocialMedia.youtube}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 text-xs font-black text-slate-800 hover:border-rose-400 hover:bg-rose-50/30 transition-all shadow-2xs cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Card 3: Ticket Authenticity Check Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs text-center">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Beli tiket dari orang lain?{' '}
                <Link href="/dashboard/tickets" className="text-blue-600 font-extrabold hover:text-blue-700 hover:underline">
                  Cek keaslian tiketmu disini
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom CTA Dock (Visible on Mobile Only: lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3.5 px-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mulai Dari</span>
          <span className="text-base font-black text-slate-900 tracking-tight">{lowestPrice}</span>
        </div>

        {event.status === 'closed' ? (
          <button
            disabled
            className="py-3 px-5 rounded-xl bg-slate-100 text-slate-400 font-extrabold text-xs cursor-not-allowed"
          >
            Tiket Habis
          </button>
        ) : (
          <button
            onClick={handleBuyClick}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Beli Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Public Footer */}
      <Footer />

      {/* Auth Modal for Forced Login before Checkout */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (event) {
            router.push(`/events/${event.id}/checkout`);
          }
        }}
      />

      {/* Checkout Modal fallback */}
      <TicketCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />

      {/* ================= MODAL PREVIEW FOTO VENUE PREMIUM ================= */}
      {isVenueModalOpen && venuePhotoUrl && (
        <div
          onClick={() => setIsVenueModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Foto Venue — {event.location || event.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pratinjau area panggung dan lokasi acara
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsVenueModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-4 sm:p-6 bg-slate-950 flex items-center justify-center overflow-auto max-h-[72vh]">
              <img
                src={venuePhotoUrl}
                alt={`Foto Venue ${event.location || event.title}`}
                className="w-full max-h-[66vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs font-semibold text-slate-600">
              <span>📍 {event.location || 'Lokasi Venue'}</span>
              <button
                onClick={() => setIsVenueModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PROFIL ORGANIZER (ORGANIZER_PROFILES) PREMIUM ================= */}
      {isOrganizerModalOpen && (
        <div
          onClick={() => setIsOrganizerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Top Gradient Banner Header */}
            <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 relative p-4 flex justify-end items-start shrink-0">
              <button
                onClick={() => setIsOrganizerModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Header Info */}
            <div className="px-6 pb-6 pt-0 relative flex-1 space-y-5">
              <div className="flex items-end justify-between -mt-10 mb-2">
                <div className="relative">
                  {organizerLogoUrl && !organizerLogoError ? (
                    <img
                      src={organizerLogoUrl}
                      alt={organizerName}
                      onError={() => setOrganizerLogoError(true)}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white font-black text-xl flex items-center justify-center shrink-0 border-4 border-white shadow-xl">
                      {organizerName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-200 shadow-xs">
                  <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Verified Organizer</span>
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {organizerName}
                </h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{organizerDetails?.address || 'Official Organizer Partner'}</span>
                </p>
              </div>

              {/* Bio / Description Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Tentang Penyelenggara
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {organizerDetails?.description}
                </p>
              </div>

              {/* Official Contact Details Grid */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Kontak Resmi Penyelenggara
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold block">Email Official</span>
                      <span className="font-extrabold text-slate-800 truncate block text-[11px]">
                        {organizerDetails?.email || 'organizer@metix.id'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold block">Hotline CS</span>
                      <span className="font-extrabold text-slate-800 truncate block text-[11px]">
                        {organizerDetails?.phone || '081234567891'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Direct WhatsApp Contact CTA */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <a
                href={`https://wa.me/${(organizerDetails?.phone || '081234567891').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${organizerName}, saya bertanya terkait event ${event?.title || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setIsOrganizerModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal when "Beli Sekarang" is clicked */}
      <TicketCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />
    </div>
  );
}
