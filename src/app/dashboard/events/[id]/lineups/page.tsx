'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventLineupsList,
  fetchOrganizerEventDetail,
  ApiEventLineupItem,
  ApiEvent,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Music,
  Search,
  RefreshCw,
  X,
  User,
} from 'lucide-react';

interface LineupsPageProps {
  params: Promise<{ id: string }>;
}

export default function EventLineupsPage({ params }: LineupsPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [lineups, setLineups] = useState<ApiEventLineupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, lineupList] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventLineupsList(eventId),
      ]);

      if (evtData) setEvent(evtData);
      setLineups(lineupList);
    } catch (err: any) {
      toast.error('Gagal Memuat Lineups Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLineups = lineups.filter(
    (l) =>
      (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Lineups Event" activeNav="/dashboard/events">
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
        <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-800 to-blue-800 text-white p-6 sm:p-7 shadow-xl shadow-purple-700/15 border border-purple-600/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Music className="w-3.5 h-3.5 text-purple-200" /> Relasi: event_lineups
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Lineups & Guest Stars: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-purple-100 font-medium max-w-2xl leading-relaxed">
              Daftar artis, musisi, pembicara, dan pengisi acara yang tampil pada event ini.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Lineups Pengisi Acara ({lineups.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari performer / artis..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all"
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
          ) : filteredLineups.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Artis / Guest Star</th>
                    <th className="py-3.5 px-4">Peran / Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Ditambahkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLineups.map((lineup, idx) => {
                    const imgUrl = getPhotoUrl(lineup.image);

                    return (
                      <tr key={lineup.id || idx} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={lineup.name}
                                className="w-10 h-10 rounded-xl object-cover border border-purple-200 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <span className="font-extrabold text-slate-900 text-xs">
                              {lineup.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {lineup.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-medium text-[11px]">
                          {lineup.created_at
                            ? new Date(lineup.created_at).toLocaleDateString('id-ID', {
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
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto">
                <Music className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Belum Ada Lineup Terdaftar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Event ini belum memiliki data pengisi acara pada tabel event_lineups.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
