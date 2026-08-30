'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  createEvent,
  updateEvent,
  publishEvent,
  deleteEvent,
  duplicateEvent,
  archiveEvent,
  fetchTicketTypes,
  createTicketType,
  deleteTicketType,
  ApiEvent,
  ApiTicketType,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import {
  Calendar,
  Search,
  Plus,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Archive,
  RefreshCw,
  X,
  Loader2,
  Sparkles,
  Tag,
  DollarSign,
  Ticket,
  Pencil,
  Trash2,
  PlusCircle,
  Save,
  AlertCircle,
  Globe,
  AlertTriangle,
} from 'lucide-react';

export default function EventsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [stats, setStats] = useState<{ totalEarnings?: number; balance?: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<number | null>(null);

  // New Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createCategory, setCreateCategory] = useState('Music Concert');
  const [createStatus, setCreateStatus] = useState('published');
  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);
  const [isCreateDateOpen, setIsCreateDateOpen] = useState(false);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editCategory, setEditCategory] = useState('Music Concert');
  const [editStatus, setEditStatus] = useState('published');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [isEditDateOpen, setIsEditDateOpen] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setEditCategory(editingEvent.category || 'Music Concert');
      setEditStatus(editingEvent.status || 'published');
      if (editingEvent.event_start_at) {
        try {
          const parsedDate = new Date(editingEvent.event_start_at);
          setEditDate(isNaN(parsedDate.getTime()) ? undefined : parsedDate);
        } catch {
          setEditDate(undefined);
        }
      } else {
        setEditDate(undefined);
      }
    }
  }, [editingEvent]);

  // Custom Delete Confirmation Modal State
  const [deletingEventTarget, setDeletingEventTarget] = useState<ApiEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ticket Types Modal State (Harga & Kuota Tiket)
  const [selectedEventForTickets, setSelectedEventForTickets] = useState<ApiEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [isAddingTicketType, setIsAddingTicketType] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketPriceDisplay, setTicketPriceDisplay] = useState('');
  const [rawTicketPrice, setRawTicketPrice] = useState<number>(0);

  // Custom Delete Ticket Type Confirmation Modal State
  const [deletingTicketTypeTarget, setDeletingTicketTypeTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingTicketType, setIsDeletingTicketType] = useState(false);

  const handleTicketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setTicketPriceDisplay('');
      setRawTicketPrice(0);
      return;
    }
    const num = parseInt(rawValue, 10);
    setRawTicketPrice(num);
    setTicketPriceDisplay(num.toLocaleString('id-ID'));
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchMyEvents();
    setEvents(data.events);
    if (data.stats) {
      setStats({
        totalEarnings: data.stats.totalEarnings,
        balance: data.stats.balance,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('Memuat ulang daftar event...', { id: 'refresh-events-toast' });
    await loadData();
    setIsRefreshing(false);
    toast.success('Daftar event berhasil diperbarui! 🔄', { id: 'refresh-events-toast' });
  };

  // 1-Click Publish Event API Function
  const handlePublish = async (eventId: number, title: string) => {
    setActionEventId(eventId);
    const ok = await publishEvent(eventId);
    if (ok) {
      toast.success('Event Dipublikasikan!', {
        description: `Event "${title}" telah dipublikasikan dan aktif.`,
      });
      loadData();
    } else {
      toast.error('Gagal Mempublikasikan Event', {
        description: 'Terjadi kesalahan saat mencoba mempublikasikan event.',
      });
    }
    setActionEventId(null);
  };

  // Custom Modal Confirm Delete Event
  const confirmDeleteEvent = async () => {
    if (!deletingEventTarget) return;
    setIsDeleting(true);
    const eventId = deletingEventTarget.id;
    const title = deletingEventTarget.title;

    const ok = await deleteEvent(eventId);
    setIsDeleting(false);
    setDeletingEventTarget(null);

    if (ok) {
      toast.success('Event Berhasil Dihapus', {
        description: `Event "${title}" telah dihapus secara permanen.`,
      });
      loadData();
    } else {
      toast.error('Gagal Menghapus Event', {
        description: 'Terjadi kesalahan saat menghapus event.',
      });
    }
  };

  const handleDuplicate = async (eventId: number, title: string) => {
    setActionEventId(eventId);
    const ok = await duplicateEvent(eventId);
    if (ok) {
      toast.success('Event Diduplikasi', {
        description: `Event "${title}" berhasil diduplikasi ke status Draft.`,
      });
      loadData();
    } else {
      toast.error('Gagal Menduplikasi Event');
    }
    setActionEventId(null);
  };

  const handleArchive = async (eventId: number, title: string) => {
    setActionEventId(eventId);
    const ok = await archiveEvent(eventId);
    if (ok) {
      toast.success('Event Diarsipkan', {
        description: `Event "${title}" telah diarsipkan/ditutup.`,
      });
      loadData();
    } else {
      toast.error('Gagal Mengarsipkan Event');
    }
    setActionEventId(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const startDate = formData.get('event_start_at');
      if (startDate && !String(startDate).includes(' ')) {
        formData.set('event_start_at', `${startDate} 09:00:00`);
      }

      if (!formData.get('event_end_at') || formData.get('event_end_at') === '') {
        const dateVal = startDate ? String(startDate) : new Date().toISOString().split('T')[0];
        formData.set('event_end_at', `${dateVal} 23:59:59`);
      }

      await createEvent(formData);

      setIsModalOpen(false);
      toast.success('Event Berhasil Disimpan! 🎉', {
        description: 'Event baru Anda telah berhasil dibuat dan disimpan ke database.',
      });
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan event baru.';
      setErrorMessage(msg);
      toast.error('Gagal Menyimpan Event', {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const startDate = formData.get('event_start_at');
      if (startDate && !String(startDate).includes(' ')) {
        formData.set('event_start_at', `${startDate} 09:00:00`);
      }

      if (!formData.get('event_end_at') || formData.get('event_end_at') === '') {
        const dateVal = startDate ? String(startDate) : new Date().toISOString().split('T')[0];
        formData.set('event_end_at', `${dateVal} 23:59:59`);
      }

      await updateEvent(editingEvent.id, formData);

      const title = editingEvent.title;
      setEditingEvent(null);
      toast.success('Pembaruan Event Berhasil! 🎉', {
        description: `Detail event "${title}" telah berhasil diperbarui.`,
      });
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Gagal memperbarui event.';
      setErrorMessage(msg);
      toast.error('Gagal Memperbarui Event', {
        description: msg,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Ticket Types Modal (Harga & Kuota Tiket)
  const handleOpenTicketTypesModal = async (evt: ApiEvent) => {
    setSelectedEventForTickets(evt);
    setTicketError(null);
    setTicketPriceDisplay('');
    setRawTicketPrice(0);
    setIsTicketLoading(true);
    const types = await fetchTicketTypes(evt.id);
    setTicketTypes(types);
    setIsTicketLoading(false);
  };

  const handleCreateTicketTypeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventForTickets) return;

    setIsAddingTicketType(true);
    setTicketError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get('name'));
    const price = rawTicketPrice || Number(form.get('price'));
    const quota = Number(form.get('quota'));
    const max_per_order = Number(form.get('max_per_order') || 5);

    try {
      await createTicketType(selectedEventForTickets.id, {
        name,
        price,
        quota,
        max_per_order,
      });

      toast.success('Tipe Tiket Dibuat! 🎉', {
        description: `Tipe tiket "${name}" (Rp ${price.toLocaleString('id-ID')}) berhasil ditambahkan.`,
      });

      setTicketPriceDisplay('');
      setRawTicketPrice(0);

      // Refresh ticket types
      const types = await fetchTicketTypes(selectedEventForTickets.id);
      setTicketTypes(types);
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan tipe tiket.';
      setTicketError(msg);
      toast.error('Gagal Menambah Tipe Tiket', {
        description: msg,
      });
    } finally {
      setIsAddingTicketType(false);
    }
  };

  const handleDeleteTicketTypeItem = (ticketTypeId: number, name: string) => {
    setDeletingTicketTypeTarget({ id: ticketTypeId, name });
  };

  const confirmDeleteTicketType = async () => {
    if (!selectedEventForTickets || !deletingTicketTypeTarget) return;

    setIsDeletingTicketType(true);
    const { id, name } = deletingTicketTypeTarget;

    const ok = await deleteTicketType(selectedEventForTickets.id, id);
    setIsDeletingTicketType(false);
    setDeletingTicketTypeTarget(null);

    if (ok) {
      toast.success('Tipe Tiket Dihapus', {
        description: `Tipe tiket "${name}" telah dihapus.`,
      });
      const types = await fetchTicketTypes(selectedEventForTickets.id);
      setTicketTypes(types);
      loadData();
    } else {
      toast.error('Gagal Menghapus Tipe Tiket');
    }
  };

  const filteredEvents = React.useMemo(() => {
    return events.filter((evt) => {
      const matchSearch =
        (evt.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'published') return evt.status === 'published';
      if (activeTab === 'draft') return evt.status === 'draft';
      if (activeTab === 'closed') return evt.status === 'closed' || evt.status === 'cancelled';
      return true;
    });
  }, [events, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published (Aktif)
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Draft Mode
          </span>
        );
      case 'closed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout pageTitle="Event Platform & Event Saya" activeNav="Event Saya">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-white" /> Event Organizer Platform Console
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Kelola Event, Harga Tiket & Kuota
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Publikasikan event baru, atur harga & kuota tiket (VIP / Regular), duplikasi konser, dan hapus event via API.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Event Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Summary Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Event Terdaftar</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">{events.length} Event</h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Event Published (Aktif)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">
                {events.filter((e) => e.status === 'published').length} Event
              </h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue Event</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">
                Rp {(stats.totalEarnings || 0).toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Saldo Siap Dicairkan</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {(stats.balance || 0).toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'published'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Published ({events.filter((e) => e.status === 'published').length})
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'draft'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draft ({events.filter((e) => e.status === 'draft').length})
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'closed'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived ({events.filter((e) => e.status === 'closed' || e.status === 'cancelled').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event, lokasi, atau kategori..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredEvents.map((item) => {
                const bannerUrl = getPhotoUrl(item.banner || item.venue_photo);
                const categoryName = item.category || 'Music Concert';
                const venue = item.location || 'Jakarta International Expo';

                let dateStr = '15 Sep 2026';
                if (item.event_start_at) {
                  try {
                    dateStr = new Date(item.event_start_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                  } catch {
                    // Fallback
                  }
                }

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Banner Image */}
                    <div className="relative h-40 bg-gradient-to-r from-blue-700 to-indigo-600 overflow-hidden">
                      {bannerUrl ? (
                        <img
                          src={bannerUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                          <Sparkles className="w-8 h-8 text-amber-300 mb-1" />
                          <span className="font-extrabold text-sm tracking-tight">{item.title}</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                        <Tag className="w-3 h-3 text-amber-400" /> {categoryName}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-3 flex-1 bg-white">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </h3>

                      <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Manage Ticket Types Button (Harga & Kuota) */}
                    <div className="px-4 pt-2">
                      <button
                        onClick={() => handleOpenTicketTypesModal(item)}
                        className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Ticket className="w-4 h-4 text-blue-600" /> Kelola Harga & Kuota Tiket API
                      </button>
                    </div>

                    {/* Actions Footer (Publish/Archive, Copy, Edit, Delete) */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-3">
                      {/* Publish / Archive Dynamic Action */}
                      {item.status !== 'published' ? (
                        <button
                          disabled={actionEventId === item.id}
                          onClick={() => handlePublish(item.id, item.title)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          title="Publikasikan Event ke Publik"
                        >
                          <Globe className="w-3.5 h-3.5" /> Publish
                        </button>
                      ) : (
                        <button
                          disabled={actionEventId === item.id}
                          onClick={() => handleArchive(item.id, item.title)}
                          className="py-2 px-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:text-amber-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Arsipkan Event"
                        >
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                      )}

                      <button
                        disabled={actionEventId === item.id}
                        onClick={() => handleDuplicate(item.id, item.title)}
                        className="py-2 px-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Duplikasi Event"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>

                      <button
                        onClick={() => setEditingEvent(item)}
                        className="py-2 px-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Event"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        disabled={actionEventId === item.id}
                        onClick={() => setDeletingEventTarget(item)}
                        className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Hapus Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80 my-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Belum Ada Event Ditemukan
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Belum ada event terdaftar pada kategori ini. Klik tombol "+ Buat Event Baru" untuk mulai membuat event konser Anda!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL KONFIRMASI HAPUS EVENT (CUSTOM DIALOG) ================= */}
      {deletingEventTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Apakah Anda Yakin Ingin Menghapus?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Event <strong className="text-slate-900">"{deletingEventTarget.title}"</strong> akan dihapus secara permanen dari database API. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingEventTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteEvent}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ya, Hapus Permanen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS TIPE TIKET (CUSTOM DIALOG) ================= */}
      {deletingTicketTypeTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Konfirmasi Hapus Tipe Tiket</h3>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin menghapus tipe tiket <strong className="text-slate-900">&quot;{deletingTicketTypeTarget.name}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingTicketTypeTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTicketType}
                onClick={confirmDeleteTicketType}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeletingTicketType ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ya, Hapus Tipe Tiket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT EVENT ================= */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setEditingEvent(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Edit Event — {editingEvent.title}</h3>
              <p className="text-xs text-blue-100 font-medium">
                Perbarui detail judul, kategori, lokasi, atau status publikasi event.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Form Modal */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Judul Event / Konser</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent.title}
                  placeholder="e.g. Soundwave Music Fest 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Deskripsi Event / Detail Acara</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingEvent.description || editingEvent.desc || ''}
                  placeholder="Tuliskan deskripsi lengkap mengenai event, guest star, rundown, dan informasi acara..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Syarat & Ketentuan (Terms & Conditions)</label>
                <textarea
                  name="terms"
                  rows={3}
                  defaultValue={editingEvent.terms || editingEvent.terms_and_conditions || editingEvent.syarat_ketentuan || ''}
                  placeholder="Tuliskan syarat & ketentuan penukaran tiket, batasan usia, aturan barang bawaan, dll..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Kategori Event</label>
                  <input type="hidden" name="category" value={editCategory} />
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                      <SelectValue placeholder="Pilih Kategori Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Music Concert">Music Concert</SelectItem>
                      <SelectItem value="Webinar & Seminar">Webinar & Seminar</SelectItem>
                      <SelectItem value="Sports Festival">Sports Festival</SelectItem>
                      <SelectItem value="Exhibition & Art">Exhibition & Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Status Publikasi</label>
                  <input type="hidden" name="status" value={editStatus} />
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published (Aktif Langsung)</SelectItem>
                      <SelectItem value="draft">Draft Mode</SelectItem>
                      <SelectItem value="closed">Closed / Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Lokasi Venue</label>
                  <input
                    type="text"
                    name="location"
                    required
                    defaultValue={editingEvent.location || ''}
                    placeholder="e.g. GBK Senayan"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Tanggal Pelaksanaan</label>
                  <input
                    type="hidden"
                    name="event_start_at"
                    value={editDate ? format(editDate, 'yyyy-MM-dd') : ''}
                  />
                  <Popover open={isEditDateOpen} onOpenChange={setIsEditDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between hover:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                      >
                        <span>{editDate ? format(editDate, 'dd/MM/yyyy') : 'Pilih Tanggal Pelaksanaan'}</span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={editDate}
                        onSelect={(selectedDay) => {
                          setEditDate(selectedDay);
                          if (selectedDay) {
                            setIsEditDateOpen(false);
                          }
                        }}
                        defaultMonth={editDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Foto Banner & Venue Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Ubah Foto Banner (Opsional)</label>
                  {editingEvent.banner && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-28 w-full bg-slate-900 mb-2 group">
                      <img
                        src={getPhotoUrl(editingEvent.banner) || undefined}
                        alt="Banner Event Saat Ini"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold p-2 text-center">
                        <span>Banner Tersimpan saat ini</span>
                        <span className="text-[10px] text-blue-200 font-medium">Pilih file di bawah untuk mengganti</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    name="banner"
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Ubah Foto Venue (Opsional)</label>
                  {editingEvent.venue_photo && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-28 w-full bg-slate-900 mb-2 group">
                      <img
                        src={getPhotoUrl(editingEvent.venue_photo) || undefined}
                        alt="Foto Venue Saat Ini"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold p-2 text-center">
                        <span>Foto Venue Tersimpan saat ini</span>
                        <span className="text-[10px] text-blue-200 font-medium">Pilih file di bawah untuk mengganti</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    name="venue_photo"
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Memperbarui...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Perubahan API
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KELOLA HARGA & KUOTA TIKET ================= */}
      {selectedEventForTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setSelectedEventForTickets(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">
                Kelola Tipe Tiket, Harga (Rp) & Batasan Kuota — {selectedEventForTickets.title}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Atur kategori tiket (VIP / Regular / Early Bird), tentukan harga (Rp), kuota total, dan batasan max per pembeli.
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {ticketError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ticketError}</span>
                </div>
              )}

              {/* Form Tambah Tipe Tiket Baru */}
              <form onSubmit={handleCreateTicketTypeSubmit} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
                  <PlusCircle className="w-4 h-4 text-blue-600" /> Tambah Tipe / Kategori Tiket Baru
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Nama Tipe Tiket</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. VIP Pass / Regular"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Harga Tiket (Rp.)</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                        Rp.
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="150.000"
                        value={ticketPriceDisplay ?? ''}
                        onChange={handleTicketPriceChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <input type="hidden" name="price" value={rawTicketPrice ?? 0} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Total Batasan Kuota Tiket</label>
                    <input
                      type="number"
                      name="quota"
                      required
                      min="1"
                      placeholder="e.g. 500"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Maksimal per Order (Limit Pembelian)</label>
                    <input
                      type="number"
                      name="max_per_order"
                      required
                      min="1"
                      max="20"
                      defaultValue="5"
                      placeholder="5 (Max 20)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAddingTicketType}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isAddingTicketType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Simpan Tipe Tiket via API
                  </button>
                </div>
              </form>

              {/* Table Daftar Tipe Tiket Existing */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Daftar Kategori Tiket Terdaftar ({ticketTypes.length})
                </h4>

                {isTicketLoading ? (
                  <Skeleton className="h-40 w-full rounded-2xl" />
                ) : ticketTypes.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Nama Tipe Tiket</th>
                          <th className="py-3 px-4">Harga Tiket</th>
                          <th className="py-3 px-4">Kuota / Limit Transaksi</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ticketTypes.map((tt) => (
                          <tr key={tt.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-extrabold text-slate-900">{tt.name}</td>
                            <td className="py-3 px-4 font-black text-blue-700">
                              Rp. {Number(tt.price || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              <div>{tt.quota || 100} Tiket (Terjual: {tt.sold_quantity || 0})</div>
                              <div className="text-[10px] text-slate-400">Max {tt.max_per_order || 5} per order</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteTicketTypeItem(tt.id, tt.name)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                title="Hapus Tipe Tiket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                    Belum ada tipe tiket yang dibuat untuk event ini. Gunakan form di atas untuk menambah harga & kuota tiket.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEventForTickets(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL BUAT EVENT BARU ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Form Buat Event Baru (API Database)</h3>
              <p className="text-xs text-blue-100 font-medium">
                Isi rincian judul, tanggal, lokasi, dan status publikasi event Anda.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Form Modal */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Judul Event / Konser</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Soundwave Music Fest 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Deskripsi Event / Detail Acara</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Tuliskan deskripsi lengkap mengenai event, guest star, rundown, dan informasi acara..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Syarat & Ketentuan (Terms & Conditions)</label>
                <textarea
                  name="terms"
                  rows={3}
                  placeholder="Tuliskan syarat & ketentuan penukaran tiket, batasan usia, aturan barang bawaan, dll..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Kategori Event</label>
                  <input type="hidden" name="category" value={createCategory} />
                  <Select value={createCategory} onValueChange={setCreateCategory}>
                    <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                      <SelectValue placeholder="Pilih Kategori Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Music Concert">Music Concert</SelectItem>
                      <SelectItem value="Webinar & Seminar">Webinar & Seminar</SelectItem>
                      <SelectItem value="Sports Festival">Sports Festival</SelectItem>
                      <SelectItem value="Exhibition & Art">Exhibition & Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Status Publikasi Initial</label>
                  <input type="hidden" name="status" value={createStatus} />
                  <Select value={createStatus} onValueChange={setCreateStatus}>
                    <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published (Aktif Langsung)</SelectItem>
                      <SelectItem value="draft">Draft Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Lokasi Venue</label>
                  <input
                    type="text"
                    name="location"
                    required
                    placeholder="e.g. GBK Senayan"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Tanggal Pelaksanaan</label>
                  <input
                    type="hidden"
                    name="event_start_at"
                    value={createDate ? format(createDate, 'yyyy-MM-dd') : ''}
                  />
                  <Popover open={isCreateDateOpen} onOpenChange={setIsCreateDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between hover:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                      >
                        <span>{createDate ? format(createDate, 'dd/MM/yyyy') : 'Pilih Tanggal Pelaksanaan'}</span>
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={createDate}
                        onSelect={(selectedDay) => {
                          setCreateDate(selectedDay);
                          if (selectedDay) {
                            setIsCreateDateOpen(false);
                          }
                        }}
                        defaultMonth={createDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Foto Banner Event (Opsional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      name="banner"
                      accept="image/*"
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Foto Venue (Opsional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      name="venue_photo"
                      accept="image/*"
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan ke API...
                    </>
                  ) : (
                    'Simpan Event via API'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
