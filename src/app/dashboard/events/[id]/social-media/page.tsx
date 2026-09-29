'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventSocialMediasList,
  fetchOrganizerEventDetail,
  ApiEventSocialMediaItem,
  ApiEvent,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Share2,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface SocialMediaPageProps {
  params: Promise<{ id: string }>;
}

export default function EventSocialMediaPage({ params }: SocialMediaPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [socialMedias, setSocialMedias] = useState<ApiEventSocialMediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, socialList] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventSocialMediasList(eventId),
      ]);

      if (evtData) setEvent(evtData);
      setSocialMedias(socialList);
    } catch (err: any) {
      toast.error('Gagal Memuat Media Sosial Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSocials = socialMedias.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.image || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Social Media Event" activeNav="/dashboard/events">
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
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-800 text-white p-6 sm:p-7 shadow-xl shadow-emerald-700/15 border border-emerald-600/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 text-emerald-200" /> Relasi: event_social_media
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Social Media: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-emerald-100 font-medium max-w-2xl leading-relaxed">
              Tautan dan saluran resmi promosi acara (Instagram, TikTok, WhatsApp, YouTube, Website).
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Akun & Saluran Media Sosial ({socialMedias.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari platform..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
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
          ) : filteredSocials.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Platform Media Sosial</th>
                    <th className="py-3.5 px-4">Tautan / Akun Resmi</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Ditambahkan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSocials.map((sm, idx) => {
                    const linkUrl = sm.image && sm.image.startsWith('http') ? sm.image : null;

                    return (
                      <tr key={sm.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 text-xs capitalize">
                            {sm.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {linkUrl ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                            >
                              <span>{sm.image}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-800 font-semibold">
                              {sm.image || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {sm.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-medium text-[11px]">
                          {sm.created_at
                            ? new Date(sm.created_at).toLocaleDateString('id-ID', {
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Belum Ada Akun Media Sosial Terdaftar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Event ini belum memiliki data media sosial pada tabel event_social_media.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
