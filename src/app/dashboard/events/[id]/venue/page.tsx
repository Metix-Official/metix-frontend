'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerEventDetail,
  updateOwnerEventVenueApi,
  ApiEvent,
} from '@/lib/api';
import { VenueMapPicker } from '@/components/ui/VenueMapPicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  Building2,
  Users,
  Compass,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface VenuePageProps {
  params: Promise<{ id: string }>;
}

export default function EventVenuePage({ params }: VenuePageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<ApiEvent | null>(null);

  // Form State
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState<number | string>(5000);
  const [latitude, setLatitude] = useState<number>(-6.2088);
  const [longitude, setLongitude] = useState<number>(106.8456);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const evtData = await fetchOrganizerEventDetail(eventId);
      if (evtData) {
        setEvent(evtData);
        if (evtData.venue) {
          setVenueName(evtData.venue.name || '');
          setAddress(evtData.venue.address || '');
          setCity(evtData.venue.city || '');
          setCapacity(evtData.venue.capacity || 5000);
          if (evtData.venue.latitude) setLatitude(Number(evtData.venue.latitude));
          if (evtData.venue.longitude) setLongitude(Number(evtData.venue.longitude));
        } else if (evtData.location) {
          setVenueName(evtData.location);
          setCity(evtData.city || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!venueName.trim()) {
      toast.error('Validasi Gagal', {
        description: 'Nama venue / lokasi wajib diisi.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateOwnerEventVenueApi(eventId, {
        name: venueName.trim(),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        latitude,
        longitude,
      });

      toast.success('Venue & Lokasi Berhasil Disimpan', {
        description: `Lokasi "${venueName.trim()}" telah berhasil diperbarui.`,
      });

      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menyimpan Venue & Lokasi', {
        description: err?.message || 'Terjadi kesalahan saat menyimpan data venue.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Venue & Lokasi Event" activeNav="/dashboard/events">
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

          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-blue-200" /> Relasi: venues
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Venue & Lokasi: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
              Kelola nama tempat, alamat venue, kota, kapasitas penonton, dan titik koordinat peta (GPS Leaflet Interactive) untuk event ini.
            </p>
          </div>
        </div>

        {/* Form Container */}
        {isLoading ? (
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 space-y-4">
            <Skeleton className="h-10 w-1/3 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Detail Lokasi & Titik Koordinat Peta
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tentukan lokasi pelaksanaan acara agar penonton dapat menemukan lokasi dengan mudah
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Venue & Lokasi</span>
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Tempat */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Nama Venue / Tempat <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Contoh: Gelora Bung Karno, JIExpo Kemayoran, Lapangan Merdeka"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Kota */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Kota / Wilayah
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Contoh: Medan, Jakarta Pusat, Surabaya, Bandung"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Pintu Satu Senayan, Gelora, Kecamatan Tanah Abang..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all resize-none"
                />
              </div>

              {/* Kapasitas Penonton */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Kapasitas Penonton
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Contoh: 10000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Leaflet Interactive Map */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Pilih Titik Lokasi pada Peta Interaktif (Leaflet GPS)</span>
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <VenueMapPicker
                  initialLat={latitude}
                  initialLng={longitude}
                  cityValue={city}
                  onCityChange={(c) => setCity(c)}
                  onLocationSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>
            </div>

            {/* Bottom Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard/events"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Venue & Lokasi</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
