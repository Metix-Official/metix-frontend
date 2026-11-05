'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Ticket, Plus, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStoredUser } from '@/lib/api';

export interface TicketTypeItem {
  id?: string | number;
  name: string;
  category?: string;
  ticket_category?: string;
  ticket_type_category?: string;
  price?: number;
  quota?: number;
  sold_count?: number;
  sold_quantity?: number;
  remaining?: number;
  percentage?: number;
  revenue?: number;
  status?: string;
  event_title?: string;
}

export interface EventWithTicketTypes {
  event_id: string | number;
  organizer_id?: string | number;
  user_id?: string | number;
  event_title: string;
  event_status?: string;
  start_at?: string;
  total_quota?: number;
  total_sold?: number;
  total_revenue?: number;
  ticket_types?: TicketTypeItem[];
}

interface TicketCategoriesCardProps {
  ticketTypesByEvent?: EventWithTicketTypes[];
  rawEvents?: any[];
  currentRole?: 'owner' | 'mitra' | 'admin' | 'pembeli';
  className?: string;
}

export function TicketCategoriesCard({
  ticketTypesByEvent = [],
  rawEvents = [],
  currentRole,
  className = '',
}: TicketCategoriesCardProps) {
  // Awalnya kosong agar tidak langsung menampilkan data sebelum user memilih event
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Normalize events list
  const normalizedEvents: EventWithTicketTypes[] = useMemo(() => {
    let sourceList: EventWithTicketTypes[] = [];

    if (Array.isArray(ticketTypesByEvent) && ticketTypesByEvent.length > 0) {
      sourceList = ticketTypesByEvent;
    } else if (Array.isArray(rawEvents) && rawEvents.length > 0) {
      sourceList = rawEvents.map((e: any) => {
        const types = (e.ticket_types || []).map((tt: any) => {
          const sold = Number(tt.sold_count ?? tt.sold_quantity ?? 0);
          const quota = Number(tt.quota ?? 0);
          const price = Number(tt.price ?? 0);
          const cat = String(tt.category || tt.ticket_category || tt.ticket_type_category || '').trim();
          return {
            id: tt.id,
            name: tt.name,
            category: cat || 'Reguler',
            price,
            quota,
            sold_count: sold,
            remaining: Math.max(0, quota - sold),
            percentage: quota > 0 ? Math.round((sold / quota) * 100) : 0,
            revenue: sold * price,
            status: tt.status ?? 'ACTIVE',
          };
        });

        return {
          event_id: e.id,
          organizer_id: e.organizer_id || e.organizer?.id,
          user_id: e.user_id || e.organizer?.user_id,
          event_title: e.title,
          event_status: e.status,
          start_at: e.start_at,
          total_quota: types.reduce((s: number, t: any) => s + t.quota, 0),
          total_sold: types.reduce((s: number, t: any) => s + t.sold_count, 0),
          total_revenue: types.reduce((s: number, t: any) => s + t.revenue, 0),
          ticket_types: types,
        };
      });
    }

    // Role-based defensive check:
    // If logged in as EO (mitra), ensure NO foreign event leaks
    if (currentRole === 'mitra') {
      const storedUser = typeof window !== 'undefined' ? getStoredUser() : null;
      const myOrgId = storedUser?.organizer_profile?.id || (storedUser as any)?.organizer_id;
      const myUserId = storedUser?.id;

      if (myOrgId || myUserId) {
        sourceList = sourceList.filter((ev: any) => {
          const orgId = ev.organizer_id || ev.organizer?.id;
          const orgUserId = ev.user_id || ev.organizer?.user_id;
          // If the event provides organizer_id or user_id, verify it matches
          if (myOrgId && orgId && Number(orgId) !== Number(myOrgId)) {
            return false;
          }
          if (myUserId && orgUserId && Number(orgUserId) !== Number(myUserId)) {
            return false;
          }
          return true;
        });
      }
    }

    return sourceList;
  }, [ticketTypesByEvent, rawEvents, currentRole]);

  // Filter events based on selected event from shadcn Select
  // Jika belum memilih event (selectedEventId kosong), maka events kosong
  const eventsForCategory = useMemo(() => {
    if (!selectedEventId) {
      return [];
    }
    if (selectedEventId === 'all') {
      return normalizedEvents;
    }
    return normalizedEvents.filter((ev) => String(ev.event_id) === String(selectedEventId));
  }, [normalizedEvents, selectedEventId]);

  // Flatten ticket types into single card items (1 card per 1 ticket type)
  const allTicketCards = useMemo(() => {
    if (!selectedEventId) return [];

    const list: Array<{
      id: string | number;
      name: string;
      category: string;
      quota: number;
      sold_count: number;
      remaining: number;
      price: number;
      revenue: number;
      percentage: number;
      status: string;
      event_id: string | number;
      event_title: string;
    }> = [];

    eventsForCategory.forEach((ev) => {
      const types = ev.ticket_types || [];
      types.forEach((tt) => {
        let cat = String(tt.category || tt.ticket_category || tt.ticket_type_category || '').trim();
        if (!cat || cat.toLowerCase() === 'undefined' || cat.toLowerCase() === 'null') {
          const nameUpper = String(tt.name || '').toUpperCase();
          if (nameUpper.includes('VVIP')) cat = 'VVIP';
          else if (nameUpper.includes('VIP')) cat = 'VIP';
          else if (nameUpper.includes('EARLY')) cat = 'EARLY BIRD';
          else if (nameUpper.includes('PRESALE')) cat = 'PRESALE';
          else if (nameUpper.includes('FESTIVAL')) cat = 'FESTIVAL';
          else cat = 'REGULAR';
        }

        const sold = Number(tt.sold_count ?? tt.sold_quantity ?? 0);
        const quota = Number(tt.quota ?? 0);
        const price = Number(tt.price ?? 0);
        const rev = Number(tt.revenue ?? (sold * price));
        const rem = tt.remaining !== undefined ? Number(tt.remaining) : Math.max(0, quota - sold);
        const pct = quota > 0 ? Number(((sold / quota) * 100).toFixed(1)) : 0;

        list.push({
          id: tt.id || `${ev.event_id}-${tt.name}`,
          name: tt.name,
          category: cat,
          quota,
          sold_count: sold,
          remaining: rem,
          price,
          revenue: rev,
          percentage: pct,
          status: tt.status ?? 'ACTIVE',
          event_id: ev.event_id,
          event_title: ev.event_title,
        });
      });
    });

    // Sort cards logically: VVIP, VIP, EARLY BIRD, PRESALE, REGULAR, FESTIVAL
    const priorityOrder = ['VVIP', 'VIP', 'EARLY BIRD', 'PRESALE', 'REGULAR', 'FESTIVAL'];
    list.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.category.toUpperCase());
      const idxB = priorityOrder.indexOf(b.category.toUpperCase());
      if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
      if (idxA !== -1 && idxB === -1) return -1;
      if (idxA === -1 && idxB !== -1) return 1;
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

    return list;
  }, [eventsForCategory, selectedEventId]);

  // Unique categories for optional filter tabs
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allTicketCards.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [allTicketCards]);

  // Filtered ticket cards by category pill
  const filteredTicketCards = useMemo(() => {
    if (selectedCategoryFilter === 'all') return allTicketCards;
    return allTicketCards.filter(
      (c) => c.category.toUpperCase() === selectedCategoryFilter.toUpperCase()
    );
  }, [allTicketCards, selectedCategoryFilter]);

  // Grand totals of filtered view
  const grandQuota = useMemo(() => filteredTicketCards.reduce((sum, c) => sum + c.quota, 0), [filteredTicketCards]);
  const grandSold = useMemo(() => filteredTicketCards.reduce((sum, c) => sum + c.sold_count, 0), [filteredTicketCards]);
  const grandRemaining = useMemo(() => Math.max(0, grandQuota - grandSold), [grandQuota, grandSold]);
  const grandRevenue = useMemo(() => filteredTicketCards.reduce((sum, c) => sum + c.revenue, 0), [filteredTicketCards]);
  const grandPercentage = useMemo(() => grandQuota > 0 ? Number(((grandSold / grandQuota) * 100).toFixed(1)) : 0, [grandQuota, grandSold]);

  return (
    <div className={`rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6 ${className}`}>
      {/* Header Card dengan Filter Event menggunakan Shadcn Select */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
              Inventori & Penjualan
            </span>
            <span className="text-xs font-bold text-slate-400">
              Update Real-time
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            Detail Kuota & Penjualan Tiket per Kategori
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Pantau rincian kuota, tiket terjual, sisa kuota, dan estimasi omzet terstruktur per jenis tiket.
          </p>
        </div>

        {/* Dropdown Filter Event Shadcn Select */}
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Pilih Event:</span>
          <Select
            value={selectedEventId}
            onValueChange={(val) => {
              setSelectedEventId(val);
              setSelectedCategoryFilter('all');
            }}
            disabled={normalizedEvents.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[260px] md:w-[300px] bg-slate-50 border-slate-200 font-bold text-xs text-slate-800 rounded-xl shadow-2xs hover:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              <SelectValue placeholder={normalizedEvents.length === 0 ? (currentRole === 'mitra' ? 'Belum Ada Event' : 'Tidak Ada Event') : 'Pilih Event...'} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-72">
              {normalizedEvents.map((ev) => (
                <SelectItem key={ev.event_id} value={String(ev.event_id)} className="font-semibold text-xs py-2">
                  {ev.event_title}
                </SelectItem>
              ))}
              {normalizedEvents.length > 1 && (
                <SelectItem value="all" className="font-black text-xs py-2 text-blue-600 border-t border-slate-100 mt-1">
                  {currentRole === 'mitra' ? `Semua Event Saya (${normalizedEvents.length} Event)` : `Semua Event (${normalizedEvents.length} Event)`}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Mini Badges Row (Hanya muncul jika event sudah dipilih dan ada data) */}
      {selectedEventId && filteredTicketCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/80 animate-in fade-in duration-300">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Total Kuota
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
              {grandQuota.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 block">
              Sisa Kuota
            </span>
            <span className="text-sm sm:text-base font-black text-teal-600 font-mono">
              {grandRemaining.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 block">
              Tiket Terjual
            </span>
            <span className="text-sm sm:text-base font-black text-sky-600 font-mono">
              {grandSold.toLocaleString('id-ID')} ({grandPercentage}%)
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block">
              Total
            </span>
            <span className="text-sm sm:text-base font-black text-amber-600 font-mono">
              Rp {grandRevenue.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Optional Category Filter Pills if more than 1 category */}
      {selectedEventId && availableCategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-in fade-in duration-300">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Kategori:</span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategoryFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Semua ({allTicketCards.length})
          </button>
          {availableCategories.map((cat) => {
            const count = allTicketCards.filter(
              (c) => c.category.toUpperCase() === cat.toUpperCase()
            ).length;
            const isActive = selectedCategoryFilter.toUpperCase() === cat.toUpperCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* KONDISI 1: Belum ada event sama sekali (misal EO belum pernah buat event) */}
      {normalizedEvents.length === 0 ? (
        <div className="py-14 px-4 text-center space-y-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-black text-slate-800">
              {currentRole === 'mitra' ? 'Belum Ada Event yang Dibuat' : 'Belum Ada Event Terdaftar'}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {currentRole === 'mitra'
                ? 'Anda belum membuat event apapun. Silakan buat event terlebih dahulu untuk mulai memantau rincian kuota tiket, total terjual, sisa kuota, dan estimasi omzet per kategori tiket.'
                : 'Saat ini belum ada event yang terdaftar di dalam platform.'}
            </p>
          </div>
          {currentRole === 'mitra' && (
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Buat Event Baru
            </Link>
          )}
        </div>
      ) : !selectedEventId ? (
        /* KONDISI 2: Ada event, tapi user belum memilih event di dropdown */
        <div className="py-14 px-4 text-center space-y-3.5 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200/90">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-black text-slate-800">
              Pilih Event Terlebih Dahulu
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Silakan pilih salah satu event pada dropdown <strong>Pilih Event</strong> di atas untuk menampilkan rincian kuota, tiket terjual, sisa kuota, dan estimasi omzet per jenis tiket.
            </p>
          </div>
        </div>
      ) : filteredTicketCards.length === 0 ? (
        /* KONDISI 3: Event terpilih belum memiliki tipe tiket */
        <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-black text-slate-800">Belum Ada Tipe Tiket Aktif</h4>
            <p className="text-xs text-slate-500 font-medium">
              Tidak ada data tipe tiket yang dibuat untuk event ini.
            </p>
          </div>
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Kelola Event & Tiket
          </Link>
        </div>
      ) : (
        /* KONDISI 4: GRID 1 CARD PER 1 TYPE TIKET (PERSIS SESUAI GAMBAR REFERENSI USER) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-in fade-in duration-300">
          {filteredTicketCards.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* 1. Header Card Bold Uppercase di Tengah: KATEGORI: [NAMA KATEGORI] */}
                <div className="bg-slate-50/90 border-b border-slate-200 py-2.5 px-4 text-center">
                  <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 block truncate">
                    KATEGORI: {item.category}
                  </span>
                </div>

                {/* 2. Subheader Row: Nama Tipe Tiket di Kiri, Total Kuota di Kanan */}
                <div className="flex items-center justify-between py-2.5 px-4 border-b border-slate-100 bg-white font-bold text-xs sm:text-sm text-slate-900">
                  <span className="truncate pr-2 font-black">{item.name}</span>
                  <span className="shrink-0 font-extrabold text-slate-900 font-mono">
                    Total {item.quota.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Event Name Tag jika 'Semua Event' dipilih */}
                {selectedEventId === 'all' && item.event_title && (
                  <div className="px-4 py-1 bg-slate-50/40 text-[10.5px] text-slate-400 font-semibold truncate border-b border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">{item.event_title}</span>
                  </div>
                )}

                {/* 3. Baris Metrik Berwarna Sesuai Persis dengan Gambar Referensi */}
                <div className="divide-y divide-slate-100">
                  {/* Row 1: Sisa Kuota (Warna Teal) */}
                  <div className="flex items-center justify-between py-2 px-4 text-xs sm:text-sm text-teal-500 font-semibold">
                    <span>Sisa Kuota</span>
                    <span className="font-mono font-bold">{item.remaining.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Row 2: Terjual (Warna Biru Langit / Sky) */}
                  <div className="flex items-center justify-between py-2 px-4 text-xs sm:text-sm text-sky-500 font-semibold">
                    <span>Terjual</span>
                    <span className="font-mono font-bold">{item.sold_count.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Row 3: Total Omzet (Warna Amber / Oranye) */}
                  <div className="flex items-center justify-between py-2 px-4 text-xs sm:text-sm text-amber-500 font-semibold">
                    <span>Total</span>
                    <span className="font-mono font-bold">Rp {item.revenue.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Row 4: Persentase (Warna Merah / Rose) */}
                  <div className="flex items-center justify-between py-2 px-4 text-xs sm:text-sm text-rose-500 font-semibold">
                    <span>Persentase</span>
                    <span className="font-mono font-bold">{item.percentage}%</span>
                  </div>
                </div>

                {/* 4. Button Lihat Detail Pembeli / Transaksi (Buka Tab Baru _BLANK) */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/reports/ticket-category?event_id=${encodeURIComponent(String(item.event_id || ''))}&category=${encodeURIComponent(item.category)}&ticket=${encodeURIComponent(item.name)}${item.id ? `&ticket_type_id=${encodeURIComponent(String(item.id))}` : ''}&event_title=${encodeURIComponent(item.event_title || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/90 hover:border-blue-600 font-extrabold text-xs transition-all duration-200 shadow-2xs group cursor-pointer"
                  >
                    <span>Lihat Detail Pembeli</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Progress Bar Keterisian di Bawah Card */}
              <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${item.percentage >= 100
                    ? 'bg-rose-500'
                    : item.percentage >= 75
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                    }`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
