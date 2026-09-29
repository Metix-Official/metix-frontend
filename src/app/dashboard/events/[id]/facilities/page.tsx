'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventFacilitiesList,
  fetchOrganizerEventDetail,
  ApiEventFacilityItem,
  ApiEvent,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Building2,
  Search,
  RefreshCw,
  Calendar,
  X,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface FacilitiesPageProps {
  params: Promise<{ id: string }>;
}

export default function EventFacilitiesPage({ params }: FacilitiesPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [facilities, setFacilities] = useState<ApiEventFacilityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, facList] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventFacilitiesList(eventId),
      ]);

      if (evtData) setEvent(evtData);
      setFacilities(facList);
    } catch (err: any) {
      toast.error('Gagal Memuat Fasilitas Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredFacilities = facilities.filter(
    (f) =>
      (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Fasilitas Event" activeNav="/dashboard/events">
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
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs inline-flex items-center gap-1.5"
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
              <Building2 className="w-3.5 h-3.5 text-blue-200" /> Relasi: event_facilities
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Fasilitas: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
              Daftar fasilitas yang disediakan oleh penyelenggara untuk kenyamanan pengunjung di venue acara.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Fasilitas Event ({facilities.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari fasilitas..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : filteredFacilities.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Nama Fasilitas</th>
                    <th className="py-3.5 px-4">Deskripsi / Keterangan</th>
                    <th className="py-3.5 px-4">Foto / Ikon</th>
                    <th className="py-3.5 px-4 text-right">Ditambahkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFacilities.map((fac, idx) => {
                    const imgUrl = getPhotoUrl(fac.image);

                    return (
                      <tr key={fac.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {fac.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {fac.description || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={fac.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-medium text-[11px]">
                          {fac.created_at
                            ? new Date(fac.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Belum Ada Fasilitas Terdaftar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Event ini belum memiliki fasilitas tambahan pada tabel event_facilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
