'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventScannersList,
  fetchOrganizerEventDetail,
  ApiEventScannerItem,
  ApiEvent,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  QrCode,
  Search,
  RefreshCw,
  X,
  UserCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ScannersPageProps {
  params: Promise<{ id: string }>;
}

export default function EventScannersPage({ params }: ScannersPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [scanners, setScanners] = useState<ApiEventScannerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, scannerList] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventScannersList(eventId),
      ]);

      if (evtData) setEvent(evtData);
      setScanners(scannerList);
    } catch (err: any) {
      toast.error('Gagal Memuat Data Scanner Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredScanners = scanners.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery)
  );

  return (
    <DashboardLayout pageTitle="Petugas Scanner Event" activeNav="/dashboard/events">
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
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white p-6 sm:p-7 shadow-xl shadow-amber-600/15 border border-amber-500/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5 text-amber-200" /> Relasi: event_scanners
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Petugas Scanner: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-amber-100 font-medium max-w-2xl leading-relaxed">
              Daftar staf pintu masuk yang memiliki hak akses untuk memindai (scan QR check-in) tiket pengunjung event ini.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Petugas Scanner Event ({scanners.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari scanner..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
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
          ) : filteredScanners.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Nama Petugas Scanner</th>
                    <th className="py-3.5 px-4">Kontak</th>
                    <th className="py-3.5 px-4">Peran Tim</th>
                    <th className="py-3.5 px-4 text-center">Total Scan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ditugaskan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScanners.map((scn, idx) => {
                    const initials = (scn.name || scn.email || 'SC').substring(0, 2).toUpperCase();

                    return (
                      <tr key={scn.id || idx} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0 border border-amber-200">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {scn.name || 'Petugas Scanner'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {scn.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {scn.phone || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {scn.role_in_team || 'SCANNER'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-amber-700">
                          {scn.scan_count || 0} Tiket
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-medium text-[11px]">
                          {scn.joined_at
                            ? new Date(scn.joined_at).toLocaleDateString('id-ID', {
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
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Belum Ada Petugas Scanner Ditugaskan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Event ini belum memiliki staf scanner pada tabel event_scanners.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
