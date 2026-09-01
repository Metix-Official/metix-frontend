'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Ticket,
  ExternalLink,
  Camera,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { fetchPublicEventDetail, ApiEvent, getPhotoUrl } from '@/lib/api';
import { TicketCheckoutModal } from '@/components/public/TicketCheckoutModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Footer } from '@/components/public/Footer';

export default function EventDetailClient() {
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

  useEffect(() => {
    const rawId = params?.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    
    if (targetId) {
      fetchPublicEventDetail(targetId).then((data) => {
        setEvent(data);
        setIsLoading(false);
      });
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      if (id) {
        fetchPublicEventDetail(id).then((data) => {
          setEvent(data);
          setIsLoading(false);
        });
      }
    }
  }, [params]);

  // Compute lowest ticket price
  const lowestPrice = React.useMemo(() => {
    if (!event || !event.ticket_types || event.ticket_types.length === 0) {
      return 'Rp 0';
    }
    const validPrices = event.ticket_types
      .map((t) => Number(t.price))
      .filter((p) => !isNaN(p) && p > 0);
    if (validPrices.length === 0) return 'Rp 0';
    return `Rp ${Math.min(...validPrices).toLocaleString('id-ID')}`;
  }, [event]);

  // Format Date & Time
  const dateFormatted = React.useMemo(() => {
    if (!event?.event_start_at) return 'Tanggal belum ditentukan';
    try {
      const d = new Date(event.event_start_at);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return event.event_start_at;
    }
  }, [event]);

  const timeFormatted = React.useMemo(() => {
    if (!event?.event_start_at) return '15:00 WITA';
    try {
      const d = new Date(event.event_start_at);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '15:00 WITA';
    }
  }, [event]);

  const bannerUrl = event?.banner ? getPhotoUrl(event.banner) : (event?.venue_photo ? getPhotoUrl(event.venue_photo) : null);
  const venuePhotoUrl = event?.venue_photo ? getPhotoUrl(event.venue_photo) : null;
  const organizerName = (event as any)?.user?.name || 'Metix Organizer';

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

            {/* Clean Description Section Without Card Box */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Deskripsi Event
              </h3>
              <div
                className={`prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line ${
                  !isDescriptionExpanded ? 'line-clamp-3' : ''
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

            {/* Divider Line */}
            <div className="border-t border-slate-200 my-4" />

            {/* Syarat & Ketentuan Section */}
            {(() => {
              const termsContent =
                event.terms ||
                event.terms_and_conditions ||
                event.syarat_ketentuan ||
                null;

              return (
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                    <span>Syarat & Ketentuan</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    {termsContent ||
                      `1. Tiket yang sudah dibeli tidak dapat ditukarkan atau dikembalikan (non-refundable).
2. Wajib membawa kartu identitas resmi (KTP/SIM/Paspor) yang sesuai dengan nama pada e-tiket saat penukaran fisik/check-in.
3. Pemegang tiket wajib mematuhi seluruh protokol keselamatan dan tata tertib di area venue acara.
4. Panitia penyelenggara berhak menolak masuk pengunjung yang tidak memenuhi syarat & ketentuan yang berlaku.`}
                  </div>
                </div>
              );
            })()}

            {/* Foto Venue Small Compact Card */}
            {venuePhotoUrl && (
              <div className="pt-2">
                <div
                  onClick={() => setIsVenueModalOpen(true)}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200/80">
                      <img
                        src={venuePhotoUrl}
                        alt={`Foto Venue ${event.location || event.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                        {event.location || 'Foto Venue & Lokasi Event'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        Klik untuk melihat foto lokasi tempat event
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 ml-3">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}
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
                      {event.location || 'Venue Location'}
                    </span>
                    {event.address && (
                      <span className="block text-xs text-slate-500 font-medium">{event.address}</span>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        (event.location || '') + ' ' + (event.address || '')
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

              {/* Separator & Organizer Info */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Dibuat Oleh</span>
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight block">
                  {organizerName}
                </span>
              </div>
            </div>

            {/* Card 2: Price & "Beli Sekarang" CTA Button */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
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
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-700/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Beli Sekarang</span>
                </button>
              )}
            </div>

            {/* Card 3: Social Media & Ticket Authenticity Link */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-900 block">Media Sosial</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-pink-600" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="font-extrabold text-slate-900">d</span>
                    <span>Tiktok</span>
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Beli tiket dari orang lain?{' '}
                  <Link href="/dashboard/tickets" className="text-blue-600 font-bold hover:underline">
                    Cek keaslian tiketmu disini
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Public Footer */}
      <Footer />

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

      {/* Checkout Modal when "Beli Sekarang" is clicked */}
      <TicketCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />
    </div>
  );
}
