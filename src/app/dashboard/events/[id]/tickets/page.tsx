'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerEventDetail,
  fetchTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  ApiEvent,
  ApiTicketType,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Tag,
  DollarSign,
  Users,
  Clock,
  Building2,
  Share2,
  Music,
  QrCode,
  Settings,
  MapPin,
  X,
} from 'lucide-react';

interface TicketsPageProps {
  params: Promise<{ id: string }>;
}

export default function EventTicketsPage({ params }: TicketsPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Create Form State
  const [ticketPriceDisplay, setTicketPriceDisplay] = useState('');
  const [rawTicketPrice, setRawTicketPrice] = useState(0);
  const [isAddingTicketType, setIsAddingTicketType] = useState(false);

  // Edit Modal State
  const [editingTicketType, setEditingTicketType] = useState<ApiTicketType | null>(null);
  const [editTicketPriceDisplay, setEditTicketPriceDisplay] = useState('');
  const [rawEditTicketPrice, setRawEditTicketPrice] = useState(0);
  const [isUpdatingTicketType, setIsUpdatingTicketType] = useState(false);

  // Delete State
  const [deletingTicketTarget, setDeletingTicketTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

  // Load Event and Tickets Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const evtData = await fetchOrganizerEventDetail(eventId);
      if (evtData) {
        setEvent(evtData);
      }
    } catch (err: any) {
      console.warn('Gagal memuat detail event:', err);
    } finally {
      setIsLoading(false);
    }

    setIsTicketLoading(true);
    try {
      const types = await fetchTicketTypes(eventId);
      setTicketTypes(types);
    } catch (err: any) {
      toast.error('Gagal mengambil daftar tipe tiket', {
        description: err?.message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setIsTicketLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Currency Input
  const handleTicketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const numVal = rawVal ? parseInt(rawVal, 10) : 0;
    setRawTicketPrice(numVal);
    setTicketPriceDisplay(numVal ? numVal.toLocaleString('id-ID') : '');
  };

  const handleEditTicketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const numVal = rawVal ? parseInt(rawVal, 10) : 0;
    setRawEditTicketPrice(numVal);
    setEditTicketPriceDisplay(numVal ? numVal.toLocaleString('id-ID') : '');
  };

  const formatDateTimeInput = (val?: string | null) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return format(d, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return '';
    }
  };

  // Submit Create Ticket Type
  const handleCreateTicketTypeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingTicketType(true);
    setTicketError(null);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const category = String(form.get('category') || '').trim() || 'Early Bird';
    const name = String(form.get('name') || '').trim();
    const description = String(form.get('description') || '').trim();
    const price = rawTicketPrice || Number(form.get('price') || 0);
    const quota = Number(form.get('quota') || 0);
    const max_per_order = Number(form.get('max_per_order') || 5);
    const sale_start_at = String(form.get('sale_start_at') || '').trim();
    const sale_end_at = String(form.get('sale_end_at') || '').trim();
    const status = String(form.get('status') || 'ACTIVE');

    try {
      await createTicketType(Number(eventId), {
        category,
        name,
        description,
        price,
        quota,
        max_per_order,
        sale_start_at: sale_start_at ? sale_start_at.replace('T', ' ') : undefined,
        sale_end_at: sale_end_at ? sale_end_at.replace('T', ' ') : undefined,
        status,
      });

      toast.success('Tipe Tiket Berhasil Dibuat! 🎉', {
        description: `Tipe tiket "${name}" (Rp ${price.toLocaleString('id-ID')}) dengan kuota ${quota} berhasil ditambahkan.`,
      });

      formElement.reset();
      setTicketPriceDisplay('');
      setRawTicketPrice(0);

      const types = await fetchTicketTypes(eventId);
      setTicketTypes(types);
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan tipe tiket.';
      setTicketError(msg);
      toast.error('Gagal Menambah Tipe Tiket', { description: msg });
    } finally {
      setIsAddingTicketType(false);
    }
  };

  // Edit Ticket Type
  const handleOpenEditModal = (tt: ApiTicketType) => {
    setEditingTicketType(tt);
    const p = Number(tt.price || 0);
    setRawEditTicketPrice(p);
    setEditTicketPriceDisplay(p ? p.toLocaleString('id-ID') : '');
  };

  const handleUpdateTicketTypeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTicketType) return;

    setIsUpdatingTicketType(true);
    setTicketError(null);

    const form = new FormData(e.currentTarget);
    const category = String(form.get('category') || '').trim() || 'Early Bird';
    const name = String(form.get('name') || '').trim();
    const description = String(form.get('description') || '').trim();
    const price = rawEditTicketPrice || Number(form.get('price') || 0);
    const quota = Number(form.get('quota') || 0);
    const max_per_order = Number(form.get('max_per_order') || 5);
    const sale_start_at = String(form.get('sale_start_at') || '').trim();
    const sale_end_at = String(form.get('sale_end_at') || '').trim();
    const status = String(form.get('status') || 'ACTIVE');

    try {
      await updateTicketType(Number(eventId), editingTicketType.id, {
        category,
        name,
        description,
        price,
        quota,
        max_per_order,
        sale_start_at: sale_start_at ? sale_start_at.replace('T', ' ') : undefined,
        sale_end_at: sale_end_at ? sale_end_at.replace('T', ' ') : undefined,
        status,
      });

      toast.success('Tipe Tiket Berhasil Diperbarui! 🎉', {
        description: `Tipe tiket "${name}" telah berhasil diperbarui.`,
      });

      setEditingTicketType(null);
      const types = await fetchTicketTypes(eventId);
      setTicketTypes(types);
    } catch (err: any) {
      toast.error('Gagal Memperbarui Tipe Tiket', {
        description: err?.message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsUpdatingTicketType(false);
    }
  };

  // Delete Ticket Type
  const confirmDeleteTicketType = async () => {
    if (!deletingTicketTarget) return;

    setIsDeletingTicket(true);
    const { id, name } = deletingTicketTarget;

    try {
      const ok = await deleteTicketType(Number(eventId), id);
      if (ok) {
        toast.success('Tipe Tiket Berhasil Dihapus', {
          description: `Tipe tiket "${name}" telah dihapus dari event.`,
        });
        const types = await fetchTicketTypes(eventId);
        setTicketTypes(types);
      } else {
        toast.error('Gagal Menghapus Tipe Tiket');
      }
    } catch (err: any) {
      toast.error('Gagal Menghapus Tipe Tiket', {
        description: err?.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setIsDeletingTicket(false);
      setDeletingTicketTarget(null);
    }
  };

  // Group ticket types by category
  const groupedTickets = React.useMemo(() => {
    const groups: Record<string, ApiTicketType[]> = {};
    ticketTypes.forEach((tt) => {
      const cat = (tt.category || 'Umum').trim();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tt);
    });
    return groups;
  }, [ticketTypes]);

  const bannerUrl = event?.banner ? getPhotoUrl(event.banner) : null;

  return (
    <DashboardLayout pageTitle="Kelola Tiket & Kuota Event" activeNav="/dashboard/events">
      <div className="w-full space-y-6">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/events"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all shadow-2xs group"
              title="Kembali ke Daftar Event"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Event #{eventId}
                </span>
                <span className="text-xs text-slate-400 font-bold">/</span>
                <span className="text-xs text-slate-500 font-bold">Tiket & Kuota</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Kelola Tipe Tiket & Batasan Kuota
              </h2>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/events/${eventId}/edit`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/venue`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Venue & Lokasi</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/facilities`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Fasilitas</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/lineups`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Lineups</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/social-media`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media</span>
            </Link>
          </div>
        </div>

        {/* Event Header Banner Card */}
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : event ? (
          <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 shadow-xl shadow-blue-700/15 border border-blue-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt={event.title}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Ticket className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-wider">
                  <Ticket className="w-3 h-3" /> Tiket & Kuota
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {event.title}
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  Atur jenis tiket, tentukan harga (Rp), kuota total, jadwal penjualan, batasan order, dan status ketersediaan tiket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-center">
                <span className="block text-[10px] font-bold uppercase text-blue-200">Total Kategori</span>
                <span className="text-lg font-black text-white">{ticketTypes.length} Tipe</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content Card: Form Tambah & Tabel Tiket */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-7">
          {/* Error Message if any */}
          {ticketError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ticketError}</span>
            </div>
          )}

          {/* Form Tambah Jenis & Kategori Tiket Baru */}
          <form
            onSubmit={handleCreateTicketTypeSubmit}
            className="p-5 sm:p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider border-b border-blue-200/60 pb-3">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Tambah Jenis & Kategori Tiket Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Jenis Tiket / Fase Penjualan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Jenis Tiket / Fase Penjualan *
                </label>
                <input
                  type="text"
                  name="category"
                  required
                  list="ticket_category_presets"
                  defaultValue="Early Bird"
                  placeholder="e.g. Early Bird / Pre-Sale 1"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
                <datalist id="ticket_category_presets">
                  <option value="Early Bird" />
                  <option value="Pre-Sale 1" />
                  <option value="Pre-Sale 2" />
                  <option value="General Admission" />
                  <option value="OTS (On The Spot)" />
                </datalist>
              </div>

              {/* Kategori / Kelas Tiket */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Kategori / Kelas Tiket *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  list="ticket_name_presets"
                  defaultValue="Festival"
                  placeholder="e.g. Festival / VIP"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
                <datalist id="ticket_name_presets">
                  <option value="Festival" />
                  <option value="VIP" />
                  <option value="VVIP" />
                  <option value="Reguler" />
                  <option value="Tribune" />
                </datalist>
              </div>

              {/* Harga Tiket */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Harga Tiket (Rp) *
                </label>
                <div className="flex items-center">
                  <span className="px-3.5 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="150.000"
                    value={ticketPriceDisplay}
                    onChange={handleTicketPriceChange}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                  />
                  <input type="hidden" name="price" value={rawTicketPrice} />
                </div>
              </div>

              {/* Total Kuota Tiket */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Total Kuota Tiket *
                </label>
                <input
                  type="number"
                  name="quota"
                  required
                  min="1"
                  placeholder="e.g. 200"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {/* Maks. Tiket / Order */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Maks. Tiket / Order
                </label>
                <input
                  type="number"
                  name="max_per_order"
                  defaultValue={5}
                  min="1"
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Mulai Penjualan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Mulai Penjualan (Opsional)
                </label>
                <input
                  type="datetime-local"
                  name="sale_start_at"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Selesai Penjualan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Selesai Penjualan (Opsional)
                </label>
                <input
                  type="datetime-local"
                  name="sale_end_at"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Status Penjualan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Status Penjualan Tiket
                </label>
                <select
                  name="status"
                  defaultValue="ACTIVE"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                >
                  <option value="ACTIVE" className="text-emerald-700 font-bold">
                    ACTIVE (Tersedia untuk dibeli)
                  </option>
                  <option value="INACTIVE" className="text-amber-700 font-bold">
                    INACTIVE (Disembunyikan sementara)
                  </option>
                  <option value="SOLD_OUT" className="text-rose-700 font-bold">
                    SOLD_OUT (Ditandai Habis)
                  </option>
                </select>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700">
                Deskripsi / Benefit Tiket (Opsional)
              </label>
              <input
                type="text"
                name="description"
                placeholder="e.g. Free merchandise, akses fast track, dan voucher tenant"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isAddingTicketType}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isAddingTicketType ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Simpan Tipe Tiket Baru</span>
              </button>
            </div>
          </form>

          {/* Table Daftar Tipe Tiket Grouped By Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Daftar Kategori Tiket Terdaftar ({ticketTypes.length})</span>
              </h4>
            </div>

            {isTicketLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : Object.keys(groupedTickets).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(groupedTickets).map(([categoryName, items]) => (
                  <div
                    key={categoryName}
                    className="overflow-x-auto border border-slate-200/90 rounded-2xl bg-white shadow-2xs"
                  >
                    {/* Header Group */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Tag className="w-4 h-4 text-blue-600" />
                        <span>
                          Fase / Kategori:{' '}
                          <strong className="text-blue-700 font-black">{categoryName}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-500 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {items.length} Kelas Tiket
                      </span>
                    </div>

                    <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                      <thead className="bg-slate-50/50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="py-3 px-4">Kelas Tiket & Deskripsi</th>
                          <th className="py-3 px-4">Harga Tiket</th>
                          <th className="py-3 px-4">Total Kuota & Sisa</th>
                          <th className="py-3 px-4 text-center">Maks/Order</th>
                          <th className="py-3 px-4">Jadwal Penjualan</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((tt) => {
                          const sold = tt.sold_count ?? tt.sold_quantity ?? 0;
                          const totalQuota = tt.quota ?? 0;
                          const available =
                            tt.available ?? tt.available_quota ?? Math.max(0, totalQuota - sold);

                          let rawStatus = (tt.status || 'ACTIVE').toUpperCase();
                          if (available <= 0 && totalQuota > 0) {
                            rawStatus = 'SOLD_OUT';
                          }

                          let statusBadge = (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              ACTIVE
                            </span>
                          );
                          if (rawStatus === 'INACTIVE') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                INACTIVE
                              </span>
                            );
                          } else if (rawStatus === 'SOLD_OUT') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                SOLD_OUT
                              </span>
                            );
                          }

                          let salePeriod = '-';
                          if (tt.sale_start_at || tt.sale_end_at) {
                            const formatTableDate = (dStr?: string | null) => {
                              if (!dStr) return null;
                              try {
                                const cleanStr =
                                  dStr.includes('Z') || dStr.includes('+')
                                    ? dStr
                                    : dStr.replace(' ', 'T');
                                const d = new Date(cleanStr);
                                if (isNaN(d.getTime())) return null;
                                return d.toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              } catch {
                                return null;
                              }
                            };

                            const startStr =
                              formatTableDate(tt.sale_start_at) ||
                              (tt.sale_start_at ? String(tt.sale_start_at) : 'Sekarang');
                            const endStr =
                              formatTableDate(tt.sale_end_at) ||
                              (tt.sale_end_at ? String(tt.sale_end_at) : 'Selesai Event');
                            salePeriod = `${startStr} s/d ${endStr}`;
                          }

                          return (
                            <tr key={tt.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900 text-xs">{tt.name}</div>
                                {tt.description && (
                                  <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                    {tt.description}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-black text-blue-700 whitespace-nowrap text-xs">
                                Rp {Number(tt.price || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                                <div>
                                  <span className="font-extrabold text-slate-900">{totalQuota} Tiket</span>
                                  <span className="text-slate-500 text-[11px]">
                                    {' '}
                                    (Terjual:{' '}
                                    <strong className="text-blue-600 font-extrabold">{sold}</strong>)
                                  </span>
                                </div>
                                <div
                                  className={`text-[10px] font-bold mt-0.5 ${available > 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                >
                                  Sisa Tersedia: {available} Tiket
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800 text-center whitespace-nowrap">
                                {tt.max_per_order ?? 5} Tiket
                              </td>
                              <td className="py-3.5 px-4 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                                {salePeriod}
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {statusBadge}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(tt)}
                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                                    title="Edit Tipe Tiket"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeletingTicketTarget({ id: tt.id, name: tt.name })
                                    }
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                                    title="Hapus Tipe Tiket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">Belum Ada Tipe Tiket</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Gunakan formulir di atas untuk mulai menambahkan kategori, harga, dan kuota tiket untuk event ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL EDIT TIPE TIKET ================= */}
      {editingTicketType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setEditingTicketType(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black tracking-tight">
                Edit Tipe Tiket — {editingTicketType.name}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Perbarui jenis tiket, nama kelas, harga (Rp), kuota total, jadwal penjualan, dan status ketersediaan tiket.
              </p>
            </div>

            <form
              onSubmit={handleUpdateTicketTypeSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Jenis Tiket / Fase Penjualan *
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    list="ticket_category_presets"
                    defaultValue={editingTicketType.category || 'Early Bird'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Kategori / Kelas Tiket *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    list="ticket_name_presets"
                    defaultValue={editingTicketType.name}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Harga Tiket (Rp) *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      value={editTicketPriceDisplay}
                      onChange={handleEditTicketPriceChange}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <input type="hidden" name="price" value={rawEditTicketPrice} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Total Kuota Tiket *
                  </label>
                  <input
                    type="number"
                    name="quota"
                    required
                    min={editingTicketType.sold_count ?? 1}
                    defaultValue={editingTicketType.quota}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Maks. Tiket / Order
                  </label>
                  <input
                    type="number"
                    name="max_per_order"
                    defaultValue={editingTicketType.max_per_order ?? 5}
                    min="1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Mulai Penjualan
                  </label>
                  <input
                    type="datetime-local"
                    name="sale_start_at"
                    defaultValue={formatDateTimeInput(editingTicketType.sale_start_at)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Selesai Penjualan
                  </label>
                  <input
                    type="datetime-local"
                    name="sale_end_at"
                    defaultValue={formatDateTimeInput(editingTicketType.sale_end_at)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Status Penjualan
                  </label>
                  <select
                    name="status"
                    defaultValue={editingTicketType.status || 'ACTIVE'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="ACTIVE" className="text-emerald-700 font-bold">
                      ACTIVE (Tersedia)
                    </option>
                    <option value="INACTIVE" className="text-amber-700 font-bold">
                      INACTIVE (Disembunyikan)
                    </option>
                    <option value="SOLD_OUT" className="text-rose-700 font-bold">
                      SOLD_OUT (Habis)
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">
                  Deskripsi / Benefit Tiket
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingTicketType.description || ''}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTicketType(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTicketType}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                >
                  {isUpdatingTicketType ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deletingTicketTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Hapus Tipe Tiket?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus tipe tiket{' '}
                <strong className="text-slate-900 font-bold">&quot;{deletingTicketTarget.name}&quot;</strong>?
                Data yang telah dihapus tidak dapat dipulihkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingTicket}
                onClick={() => setDeletingTicketTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTicket}
                onClick={confirmDeleteTicketType}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeletingTicket ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Ya, Hapus Tiket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
