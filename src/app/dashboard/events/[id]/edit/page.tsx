'use client';

import React, { useState, useEffect, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerEventDetail,
  updateEvent,
  ApiEvent,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Save,
  Loader2,
  Building2,
  Music,
  Share2,
  QrCode,
  Settings,
  MapPin,
  Upload,
  X,
  Sparkles,
  Clock,
  ExternalLink,
  Ticket,
} from 'lucide-react';

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<ApiEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const evtData = await fetchOrganizerEventDetail(eventId);
      if (evtData) {
        setEvent(evtData);
        setTitle(evtData.title || '');
        setDescription(evtData.description || '');
        setStatus((evtData.status || 'DRAFT').toUpperCase());

        // Format datetime-local string (YYYY-MM-DDTHH:mm)
        if (evtData.start_at) {
          const d = new Date(evtData.start_at);
          setStartAt(d.toISOString().slice(0, 16));
        }
        if (evtData.end_at) {
          const d = new Date(evtData.end_at);
          setEndAt(d.toISOString().slice(0, 16));
        }
        if (evtData.banner) {
          setBannerPreview(getPhotoUrl(evtData.banner));
        }
      }
    } catch (err: any) {
      toast.error('Gagal Memuat Detail Event', {
        description: err?.message || 'Terjadi kesalahan saat memuat data acara.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran banner terlalu besar', {
        description: 'Maksimal ukuran gambar banner adalah 20MB.',
      });
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Validasi Gagal', { description: 'Judul event wajib diisi.' });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('status', status);

      if (startAt) {
        formData.append('start_at', startAt.replace('T', ' ') + ':00');
      }
      if (endAt) {
        formData.append('end_at', endAt.replace('T', ' ') + ':00');
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      await updateEvent(Number(eventId), formData);

      toast.success('Event Berhasil Diperbarui', {
        description: `Perubahan pada event "${title.trim()}" telah berhasil disimpan.`,
      });

      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menyimpan Event', {
        description: err?.message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Edit Event" activeNav="/dashboard/events">
      <div className="w-full space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Master Event</span>
          </Link>

          {/* Quick Sub-Resource Links */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/events/${eventId}/venue`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Venue & Lokasi</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/tickets`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors shadow-2xs"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span>Tiket & Kuota</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/facilities`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Fasilitas</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/lineups`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
            >
              <Music className="w-3.5 h-3.5 text-purple-600" />
              <span>Lineups</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/social-media`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Social Media</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/settings`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-200" /> Edit Data Event
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Edit: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
              Perbarui rincian utama acara, jadwal pelaksanaan, status publikasi, dan foto banner event.
            </p>
          </div>
        </div>

        {/* Form Container */}
        {isLoading ? (
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-4">
            <Skeleton className="h-10 w-1/3 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Informasi Utama Event
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Pastikan informasi acara akurat sebelum mempublikasikan ke penonton
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Judul Event */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-800">
                  Judul Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Metix Music Festival 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                />
              </div>

              {/* Status Event */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Status Event <span className="text-rose-500">*</span>
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val)}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    <SelectItem value="ONGOING">ONGOING</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Penyelenggara Info */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Penyelenggara (EO)
                </label>
                <input
                  type="text"
                  disabled
                  value={event?.organizer?.organization_name || 'Event Organizer'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Waktu Mulai */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Waktu Mulai Acara
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Waktu Selesai */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Waktu Selesai Acara
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-800">
                  Deskripsi Lengkap Acara
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan mengenai tema acara, susunan acara, dan ketentuan bagi pengunjung..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all resize-none"
                />
              </div>

              {/* Foto Banner Event */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-800">
                  Banner Foto Event (Upload Gambar Baru)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleBannerChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  {bannerPreview ? (
                    <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0 group">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute inset-0 bg-slate-950/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus banner"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 h-28 rounded-xl bg-slate-200/60 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Calendar className="w-7 h-7" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{bannerPreview ? 'Ganti Banner Foto' : 'Pilih Banner Foto'}</span>
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Format didukung: JPG, PNG, WEBP. Maksimal ukuran 20MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard/events"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
