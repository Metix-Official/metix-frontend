'use client';

import React, { useState, useEffect, useCallback, use, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerEventDetail,
  fetchPromos,
  createPromo,
  updatePromo,
  deletePromo,
  fetchTicketTypes,
  ApiEvent,
  ApiPromo,
  ApiTicketType,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  DollarSign,
  Users,
  Coffee,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  FilterX,
  Clock,
  Building2,
  MapPin,
  Ticket,
  Music,
  Share2,
  QrCode,
  Settings,
  X,
  Percent,
  Gift,
  ShieldAlert,
} from 'lucide-react';

interface PromosPageProps {
  params: Promise<{ id: string }>;
}

export default function EventPromosPage({ params }: PromosPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const numEventId = Number(eventId);

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [promos, setPromos] = useState<ApiPromo[]>([]);
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'FIXED'>('ALL');
  const [benefitFilter, setBenefitFilter] = useState<'ALL' | 'COFFEE' | 'DISCOUNT_ONLY'>('ALL');

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal Create Promo State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create Form fields
  const [createCode, setCreateCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDiscountType, setCreateDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [createDiscountValue, setCreateDiscountValue] = useState<string>('50000');
  const [createMaxDiscount, setCreateMaxDiscount] = useState<string>('');
  const [createMinPurchase, setCreateMinPurchase] = useState<string>('0');
  const [createQuota, setCreateQuota] = useState<string>('100');
  const [createMaxPerUser, setCreateMaxPerUser] = useState<string>('1');
  const [createScopeType, setCreateScopeType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [createTicketTypeId, setCreateTicketTypeId] = useState<number | null>(null);
  const [createHasCoffee, setCreateHasCoffee] = useState(false);
  const [createBenefitName, setCreateBenefitName] = useState('Free Coffee');
  const [createBenefitQty, setCreateBenefitQty] = useState<number>(1);
  const [createStartAt, setCreateStartAt] = useState<string>('');
  const [createEndAt, setCreateEndAt] = useState<string>('');
  const [createStatus, setCreateStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Modal Edit Promo State
  const [editingPromo, setEditingPromo] = useState<ApiPromo | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit Form fields
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountType, setEditDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [editDiscountValue, setEditDiscountValue] = useState<string>('');
  const [editMaxDiscount, setEditMaxDiscount] = useState<string>('');
  const [editMinPurchase, setEditMinPurchase] = useState<string>('');
  const [editQuota, setEditQuota] = useState<string>('');
  const [editMaxPerUser, setEditMaxPerUser] = useState<string>('');
  const [editScopeType, setEditScopeType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [editTicketTypeId, setEditTicketTypeId] = useState<number | null>(null);
  const [editHasCoffee, setEditHasCoffee] = useState(false);
  const [editBenefitName, setEditBenefitName] = useState('Free Coffee');
  const [editBenefitQty, setEditBenefitQty] = useState<number>(1);
  const [editStartAt, setEditStartAt] = useState<string>('');
  const [editEndAt, setEditEndAt] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ACTIVE');

  // Modal Delete Promo State
  const [deletingPromo, setDeletingPromo] = useState<ApiPromo | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Format Helper for input datetime-local: YYYY-MM-DDTHH:mm
  const formatForDateTimeLocal = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const cleanStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr.replace(' ', 'T');
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Format Helper for Display Table Dates
  const formatTableDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const cleanStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr.replace(' ', 'T');
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, promoList, ticketsList] = await Promise.all([
        fetchOrganizerEventDetail(eventId),
        fetchPromos(numEventId),
        fetchTicketTypes(numEventId),
      ]);

      if (evtData) setEvent(evtData);
      setPromos(Array.isArray(promoList) ? promoList : []);
      setTicketTypes(Array.isArray(ticketsList) ? ticketsList : []);
    } catch (err: any) {
      toast.error('Gagal memuat data kode promo', {
        description: err?.message || 'Terjadi kesalahan saat sinkronisasi data.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, numEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Copy Promo Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode promo "${code}" berhasil disalin!`);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  // Generate Random Promo Code
  const handleGenerateRandomCode = (setter: (v: string) => void) => {
    const prefixes = ['METIX', 'FEST', 'SUPER', 'HEMAT', 'DISKON', 'VIP'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setter(`${prefix}${randomSuffix}`);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 mins ago
    const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later

    setCreateCode('');
    setCreateName('');
    setCreateDescription('');
    setCreateDiscountType('FIXED');
    setCreateDiscountValue('50000');
    setCreateMaxDiscount('');
    setCreateMinPurchase('0');
    setCreateQuota('100');
    setCreateMaxPerUser('1');
    setCreateScopeType('ALL');
    setCreateTicketTypeId(null);
    setCreateHasCoffee(false);
    setCreateBenefitName('Free Coffee');
    setCreateBenefitQty(1);
    setCreateStartAt(formatForDateTimeLocal(defaultStart.toISOString()));
    setCreateEndAt(formatForDateTimeLocal(defaultEnd.toISOString()));
    setCreateStatus('ACTIVE');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create Promo
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanCode = createCode.trim().toUpperCase();
    if (!cleanCode) {
      setCreateError('Kode promo wajib diisi.');
      return;
    }
    if (!createName.trim()) {
      setCreateError('Nama promo wajib diisi.');
      return;
    }
    if (!createStartAt || !createEndAt) {
      setCreateError('Waktu mulai dan berakhir wajib ditentukan.');
      return;
    }

    const start = new Date(createStartAt);
    const end = new Date(createEndAt);
    if (end <= start) {
      setCreateError('Waktu berakhir promo harus setelah waktu mulai.');
      return;
    }

    const valNum = parseFloat(createDiscountValue) || 0;
    if (createDiscountType === 'PERCENTAGE' && valNum > 100) {
      setCreateError('Persentase diskon tidak boleh melebihi 100%.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload: any = {
        code: cleanCode,
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        discount_type: createDiscountType,
        discount_value: valNum,
        max_discount:
          createDiscountType === 'PERCENTAGE' && createMaxDiscount ? parseFloat(createMaxDiscount) : null,
        min_purchase: parseFloat(createMinPurchase) || 0,
        quota: createQuota ? parseInt(createQuota, 10) : 100,
        max_usage_per_user: createMaxPerUser ? parseInt(createMaxPerUser, 10) : 1,
        ticket_type_id: createScopeType === 'SPECIFIC' ? createTicketTypeId : null,
        start_at: createStartAt,
        end_at: createEndAt,
        status: createStatus,
        benefit_type: createHasCoffee ? 'FREE_PRODUCT' : null,
        benefit_name: createHasCoffee ? createBenefitName.trim() : null,
        benefit_quantity: createHasCoffee ? Number(createBenefitQty || 1) : null,
      };

      await createPromo(numEventId, payload);
      toast.success('Kode promo berhasil dibuat!');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setCreateError(err?.message || 'Gagal membuat kode promo.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: ApiPromo) => {
    setEditingPromo(p);
    setEditCode(p.code || '');
    setEditName(p.name || '');
    setEditDescription(p.description || '');
    setEditDiscountType(p.discount_type || 'FIXED');
    setEditDiscountValue(String(p.discount_value ?? 0));
    setEditMaxDiscount(p.max_discount ? String(p.max_discount) : '');
    setEditMinPurchase(p.min_purchase ? String(p.min_purchase) : '0');
    setEditQuota(p.quota ? String(p.quota) : '100');
    setEditMaxPerUser(p.max_usage_per_user ? String(p.max_usage_per_user) : '1');
    setEditScopeType(p.ticket_type_id ? 'SPECIFIC' : 'ALL');
    setEditTicketTypeId(p.ticket_type_id ? Number(p.ticket_type_id) : null);

    const hasBenefit = Boolean(p.benefit_name || p.benefit_type);
    setEditHasCoffee(hasBenefit);
    setEditBenefitName(p.benefit_name || 'Free Coffee');
    setEditBenefitQty(p.benefit_quantity ? Number(p.benefit_quantity) : 1);

    setEditStartAt(formatForDateTimeLocal(p.start_at));
    setEditEndAt(formatForDateTimeLocal(p.end_at));
    setEditStatus((p.status || 'ACTIVE').toUpperCase() as any);
    setEditError(null);
  };

  // Submit Edit Promo
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    setEditError(null);

    const cleanCode = editCode.trim().toUpperCase();
    if (!cleanCode) {
      setEditError('Kode promo wajib diisi.');
      return;
    }
    if (!editName.trim()) {
      setEditError('Nama promo wajib diisi.');
      return;
    }
    if (!editStartAt || !editEndAt) {
      setEditError('Waktu mulai dan berakhir wajib ditentukan.');
      return;
    }

    const start = new Date(editStartAt);
    const end = new Date(editEndAt);
    if (end <= start) {
      setEditError('Waktu berakhir promo harus setelah waktu mulai.');
      return;
    }

    const valNum = parseFloat(editDiscountValue) || 0;
    if (editDiscountType === 'PERCENTAGE' && valNum > 100) {
      setEditError('Persentase diskon tidak boleh melebihi 100%.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const payload: any = {
        code: cleanCode,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        discount_type: editDiscountType,
        discount_value: valNum,
        max_discount:
          editDiscountType === 'PERCENTAGE' && editMaxDiscount ? parseFloat(editMaxDiscount) : null,
        min_purchase: parseFloat(editMinPurchase) || 0,
        quota: editQuota ? parseInt(editQuota, 10) : 100,
        max_usage_per_user: editMaxPerUser ? parseInt(editMaxPerUser, 10) : 1,
        ticket_type_id: editScopeType === 'SPECIFIC' ? editTicketTypeId : null,
        start_at: editStartAt,
        end_at: editEndAt,
        status: editStatus,
        benefit_type: editHasCoffee ? 'FREE_PRODUCT' : null,
        benefit_name: editHasCoffee ? editBenefitName.trim() : null,
        benefit_quantity: editHasCoffee ? Number(editBenefitQty || 1) : null,
      };

      await updatePromo(numEventId, editingPromo.id, payload);
      toast.success('Kode promo berhasil diperbarui!');
      setEditingPromo(null);
      loadData();
    } catch (err: any) {
      setEditError(err?.message || 'Gagal memperbarui kode promo.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Delete Promo
  const handleDeleteSubmit = async () => {
    if (!deletingPromo) return;
    setIsSubmittingDelete(true);
    try {
      const ok = await deletePromo(numEventId, deletingPromo.id);
      if (ok) {
        toast.success(`Kode promo "${deletingPromo.code}" berhasil dihapus!`);
        setDeletingPromo(null);
        loadData();
      } else {
        toast.error('Gagal menghapus kode promo.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus kode promo.');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Computed Statistics
  const stats = useMemo(() => {
    const totalPromos = promos.length;
    const nowTime = Date.now();

    let activeCount = 0;
    let expiredCount = 0;
    let totalUsage = 0;
    let coffeeCount = 0;

    promos.forEach((p) => {
      const rawStatus = (p.status || 'ACTIVE').toUpperCase();
      const endTime = p.end_at ? new Date(p.end_at).getTime() : 0;
      const isPast = endTime > 0 && endTime < nowTime;

      if (rawStatus === 'ACTIVE' && !isPast) {
        activeCount++;
      } else {
        expiredCount++;
      }

      totalUsage += Number(p.used_count || 0);

      if (p.benefit_name || p.benefit_type) {
        coffeeCount++;
      }
    });

    return { totalPromos, activeCount, expiredCount, totalUsage, coffeeCount };
  }, [promos]);

  // Filtered Promos
  const filteredPromos = useMemo(() => {
    const nowTime = Date.now();
    return promos.filter((p) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (p.code || '').toLowerCase().includes(q);
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchBenefit = (p.benefit_name || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDesc && !matchBenefit) return false;
      }

      // Status filter
      const rawStatus = (p.status || 'ACTIVE').toUpperCase();
      const endTime = p.end_at ? new Date(p.end_at).getTime() : 0;
      const isPast = endTime > 0 && endTime < nowTime;

      if (statusFilter === 'ACTIVE') {
        if (rawStatus !== 'ACTIVE' || isPast) return false;
      } else if (statusFilter === 'INACTIVE') {
        if (rawStatus !== 'INACTIVE') return false;
      } else if (statusFilter === 'EXPIRED') {
        if (rawStatus !== 'EXPIRED' && !isPast) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && p.discount_type !== typeFilter) {
        return false;
      }

      // Benefit filter
      if (benefitFilter === 'COFFEE' && !p.benefit_name && !p.benefit_type) {
        return false;
      }
      if (benefitFilter === 'DISCOUNT_ONLY' && (p.benefit_name || p.benefit_type)) {
        return false;
      }

      return true;
    });
  }, [promos, searchQuery, statusFilter, typeFilter, benefitFilter]);

  const bannerUrl = event ? getPhotoUrl(event.banner || (event as any).banner_image || (event as any).photo) : null;

  return (
    <DashboardLayout pageTitle="Kelola Kode Promo Event" activeNav="/dashboard/events">
      <div className="w-full space-y-6 pb-12">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs group w-fit"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Master Event</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kode Promo</span>
            </button>
          </div>
        </div>

        {/* Hero Event Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
                <Tag className="w-3.5 h-3.5 text-blue-200" /> Relasi: promos
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Kode Promo: {event?.title || `Event #${eventId}`}
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
                Kelola kupon diskon potongan harga (nominal / persen), kuota pemakaian, jadwal promosi, hingga benefit merchandise atau Free Coffee untuk pembeli tiket.
              </p>

              {/* Event Quick Meta */}
              {event && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-blue-100 font-bold">
                  {event.city && (
                    <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                      <MapPin className="w-3 h-3" /> {event.city}
                    </span>
                  )}
                  {event.start_time && (
                    <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                      <Calendar className="w-3 h-3" />{' '}
                      {new Date(event.start_time).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-lg font-black text-[10px] uppercase">
                    Status: {event.status || 'ACTIVE'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Relation Subnav Pills */}
            <div className="flex items-center gap-1.5 flex-wrap self-start lg:self-center bg-black/20 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Link
                href={`/dashboard/events/${eventId}/edit`}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Edit Event
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/venue`}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Venue
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/tickets`}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Tiket & Kuota
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/facilities`}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Fasilitas
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/lineups`}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Lineups
              </Link>
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-white text-indigo-900 shadow-xs">
                Kode Promo
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Promo</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalPromos}</div>
            <p className="text-[11px] font-medium text-slate-400">Kode promo terdaftar</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Promo Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.activeCount}</div>
            <p className="text-[11px] font-medium text-slate-400">Siap digunakan pembeli</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Penggunaan</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats.totalUsage}x</div>
            <p className="text-[11px] font-medium text-slate-400">Klaim transaksi sukses</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Benefit Khusus</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Coffee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.coffeeCount}</div>
            <p className="text-[11px] font-medium text-slate-400">Promo free coffee/item</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode promo, nama, atau benefit (misal: BELIDINEBE)..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Status Aktif</option>
                <option value="INACTIVE">Status Tidak Aktif</option>
                <option value="EXPIRED">Sudah Berakhir</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">Semua Tipe Diskon</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
                <option value="PERCENTAGE">Persentase (%)</option>
              </select>

              <select
                value={benefitFilter}
                onChange={(e) => setBenefitFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">Semua Benefit</option>
                <option value="COFFEE">Khusus Free Coffee (☕)</option>
                <option value="DISCOUNT_ONLY">Diskon Saja</option>
              </select>

              {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || benefitFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setBenefitFilter('ALL');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Filter"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Promo Table / Card View */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">Daftar Kode Promo Event</h3>
              <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                {filteredPromos.length} dari {promos.length} Kode
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Buat Promo Baru
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Tag className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-black text-slate-900">Belum Ada Kode Promo</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'Tidak ada kode promo yang cocok dengan pencarian dan filter.'
                    : 'Event ini belum memiliki kode promo diskon. Buat kode promo pertama untuk menarik pembeli.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kode Promo Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[840px]">
                <thead className="bg-slate-50/70 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Kode & Nama Promo</th>
                    <th className="py-3 px-4">Nilai Diskon</th>
                    <th className="py-3 px-4">Target Tiket</th>
                    <th className="py-3 px-4">Kuota & Penggunaan</th>
                    <th className="py-3 px-4">Jadwal Berlaku</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPromos.map((p) => {
                    const isCopied = copiedCode === p.code;
                    const used = Number(p.used_count || 0);
                    const quota = Number(p.quota || 0);
                    const remaining = quota > 0 ? Math.max(0, quota - used) : 'Unlimited';
                    const usagePercent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

                    const nowTime = Date.now();
                    const endTime = p.end_at ? new Date(p.end_at).getTime() : 0;
                    const isPast = endTime > 0 && endTime < nowTime;
                    const rawStatus = (p.status || 'ACTIVE').toUpperCase();
                    const isActuallyActive = rawStatus === 'ACTIVE' && !isPast;

                    const hasCoffee = Boolean(p.benefit_name || p.benefit_type);

                    // Target ticket type name
                    let targetTicketName = 'Semua Kelas Tiket';
                    if (p.ticket_type_id) {
                      const matchTt = ticketTypes.find((t) => t.id === p.ticket_type_id);
                      targetTicketName = matchTt?.name || `Tiket #${p.ticket_type_id}`;
                    }

                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* Kode & Nama */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs tracking-wider">
                              {p.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(p.code)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Salin Kode Promo"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="font-extrabold text-slate-900 text-xs mt-1">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
                              {p.description}
                            </div>
                          )}

                          {hasCoffee && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black tracking-wide">
                              <Coffee className="w-3 h-3 text-amber-600" />
                              <span>
                                {p.benefit_name || 'Free Coffee'} ({p.benefit_quantity || 1}x)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Nilai Diskon */}
                        <td className="py-3.5 px-4 font-black whitespace-nowrap">
                          {p.discount_type === 'PERCENTAGE' ? (
                            <div>
                              <span className="text-purple-700 text-sm">{p.discount_value}% OFF</span>
                              {p.max_discount && (
                                <div className="text-[10px] text-slate-500 font-bold">
                                  Maks: Rp {Number(p.max_discount).toLocaleString('id-ID')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-700 text-sm">
                              Rp {Number(p.discount_value).toLocaleString('id-ID')}
                            </span>
                          )}
                          {Number(p.min_purchase || 0) > 0 && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Min: Rp {Number(p.min_purchase).toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>

                        {/* Target Tiket */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg border ${
                              p.ticket_type_id
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Ticket className="w-3 h-3" />
                            {targetTicketName}
                          </span>
                        </td>

                        {/* Kuota & Penggunaan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {used} / {quota > 0 ? quota : '∞'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({remaining} sisa)
                            </span>
                          </div>
                          {quota > 0 && (
                            <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 90
                                    ? 'bg-rose-500'
                                    : usagePercent >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Jadwal Berlaku */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-medium text-slate-600">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold block">Mulai:</span>
                            {formatTableDateTime(p.start_at)}
                          </div>
                          <div className="mt-0.5">
                            <span className="text-slate-400 text-[10px] font-bold block">Berakhir:</span>
                            <span className={isPast ? 'text-rose-600 font-bold' : ''}>
                              {formatTableDateTime(p.end_at)}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isActuallyActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              ACTIVE
                            </span>
                          ) : isPast || rawStatus === 'EXPIRED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                              INACTIVE
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                              title="Edit Kode Promo"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPromo(p)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                              title="Hapus Kode Promo"
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
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL CREATE PROMO */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                    <Tag className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">Buat Kode Promo Baru</h3>
                    <p className="text-[11px] text-blue-100">Diskon tiket atau benefit spesial untuk pembeli</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {createError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Kode & Nama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Kode Promo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={createCode}
                        onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: HEMAT50"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-xs text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:border-blue-500 tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateRandomCode(setCreateCode)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-black border border-blue-200 cursor-pointer"
                        title="Acak Kode"
                      >
                        Acak
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Nama Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Contoh: Diskon Presale Early Bird"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Deskripsi Promo (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Keterangan singkat mengenai ketentuan promo..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Tipe & Nilai Diskon */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 uppercase tracking-wider text-[10.5px]">
                      Skema Potongan Harga
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setCreateDiscountType('FIXED')}
                        className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                          createDiscountType === 'FIXED'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Nominal (Rp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateDiscountType('PERCENTAGE')}
                        className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                          createDiscountType === 'PERCENTAGE'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Persentase (%)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">
                        {createDiscountType === 'PERCENTAGE' ? 'Nilai Persentase (%)' : 'Potongan Harga (Rp)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                          {createDiscountType === 'PERCENTAGE' ? '%' : 'Rp'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={createDiscountType === 'PERCENTAGE' ? 100 : undefined}
                          value={createDiscountValue}
                          onChange={(e) => setCreateDiscountValue(e.target.value)}
                          required
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {createDiscountType === 'PERCENTAGE' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">
                          Batas Maksimal Diskon (Rp, Opsional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                            Rp
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={createMaxDiscount}
                            onChange={(e) => setCreateMaxDiscount(e.target.value)}
                            placeholder="Tanpa batas"
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scope Target Tiket */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Target Kelas Tiket
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateScopeType('ALL');
                        setCreateTicketTypeId(null);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        createScopeType === 'ALL'
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Semua Kelas Tiket
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateScopeType('SPECIFIC')}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        createScopeType === 'SPECIFIC'
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Kelas Tiket Tertentu
                    </button>
                  </div>

                  {createScopeType === 'SPECIFIC' && (
                    <div className="pt-1">
                      <select
                        value={createTicketTypeId ?? ''}
                        onChange={(e) => setCreateTicketTypeId(e.target.value ? Number(e.target.value) : null)}
                        required={createScopeType === 'SPECIFIC'}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="">Pilih Kelas Tiket yang Berlaku...</option>
                        {ticketTypes.map((tt) => (
                          <option key={tt.id} value={tt.id}>
                            {tt.name} (Rp {Number(tt.price || 0).toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Kuota, Min Purchase, Max per User */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Total Kuota Promo</label>
                    <input
                      type="number"
                      min={1}
                      value={createQuota}
                      onChange={(e) => setCreateQuota(e.target.value)}
                      placeholder="Contoh: 100"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Min Belanja (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={createMinPurchase}
                      onChange={(e) => setCreateMinPurchase(e.target.value)}
                      placeholder="Contoh: 0"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Maks Pakai / User</label>
                    <input
                      type="number"
                      min={1}
                      value={createMaxPerUser}
                      onChange={(e) => setCreateMaxPerUser(e.target.value)}
                      placeholder="Contoh: 1"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Jadwal Mulai & Berakhir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Waktu Mulai Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={createStartAt}
                      onChange={(e) => setCreateStartAt(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Waktu Berakhir Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={createEndAt}
                      onChange={(e) => setCreateEndAt(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Free Coffee / Special Benefit Toggle */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createHasCoffee}
                      onChange={(e) => setCreateHasCoffee(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-amber-700" /> Sertakan Benefit Khusus (Free Coffee / Item)
                    </span>
                  </label>

                  {createHasCoffee && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-900">Nama Benefit</label>
                        <input
                          type="text"
                          value={createBenefitName}
                          onChange={(e) => setCreateBenefitName(e.target.value)}
                          placeholder="Contoh: Free Coffee"
                          className="w-full px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-900">Jumlah / Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={createBenefitQty}
                          onChange={(e) => setCreateBenefitQty(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700 text-xs">Status Promo Awal</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateStatus('ACTIVE')}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        createStatus === 'ACTIVE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ACTIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateStatus('INACTIVE')}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        createStatus === 'INACTIVE'
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      INACTIVE
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCreate ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Kode Promo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL EDIT PROMO */}
        {/* ========================================================================= */}
        {editingPromo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                    <Pencil className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">Edit Kode Promo: {editingPromo.code}</h3>
                    <p className="text-[11px] text-blue-100">Perbarui kuota, diskon, atau jadwal promo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {editError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Kode & Nama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Kode Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: HEMAT50"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-xs text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:border-blue-500 tracking-wider"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Nama Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Contoh: Diskon Presale Early Bird"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Deskripsi Promo
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Keterangan singkat mengenai promo..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Tipe & Nilai Diskon */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 uppercase tracking-wider text-[10.5px]">
                      Skema Potongan Harga
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setEditDiscountType('FIXED')}
                        className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                          editDiscountType === 'FIXED'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Nominal (Rp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDiscountType('PERCENTAGE')}
                        className={`px-3 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                          editDiscountType === 'PERCENTAGE'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Persentase (%)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">
                        {editDiscountType === 'PERCENTAGE' ? 'Nilai Persentase (%)' : 'Potongan Harga (Rp)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                          {editDiscountType === 'PERCENTAGE' ? '%' : 'Rp'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={editDiscountType === 'PERCENTAGE' ? 100 : undefined}
                          value={editDiscountValue}
                          onChange={(e) => setEditDiscountValue(e.target.value)}
                          required
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {editDiscountType === 'PERCENTAGE' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">
                          Batas Maksimal Diskon (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                            Rp
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={editMaxDiscount}
                            onChange={(e) => setEditMaxDiscount(e.target.value)}
                            placeholder="Tanpa batas"
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scope Target Tiket */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Target Kelas Tiket
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditScopeType('ALL');
                        setEditTicketTypeId(null);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        editScopeType === 'ALL'
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Semua Kelas Tiket
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditScopeType('SPECIFIC')}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        editScopeType === 'SPECIFIC'
                          ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Kelas Tiket Tertentu
                    </button>
                  </div>

                  {editScopeType === 'SPECIFIC' && (
                    <div className="pt-1">
                      <select
                        value={editTicketTypeId ?? ''}
                        onChange={(e) => setEditTicketTypeId(e.target.value ? Number(e.target.value) : null)}
                        required={editScopeType === 'SPECIFIC'}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="">Pilih Kelas Tiket yang Berlaku...</option>
                        {ticketTypes.map((tt) => (
                          <option key={tt.id} value={tt.id}>
                            {tt.name} (Rp {Number(tt.price || 0).toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Kuota, Min Purchase, Max per User */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Total Kuota Promo</label>
                    <input
                      type="number"
                      min={1}
                      value={editQuota}
                      onChange={(e) => setEditQuota(e.target.value)}
                      placeholder="Contoh: 100"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Min Belanja (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={editMinPurchase}
                      onChange={(e) => setEditMinPurchase(e.target.value)}
                      placeholder="Contoh: 0"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[10px]">Maks Pakai / User</label>
                    <input
                      type="number"
                      min={1}
                      value={editMaxPerUser}
                      onChange={(e) => setEditMaxPerUser(e.target.value)}
                      placeholder="Contoh: 1"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Jadwal Mulai & Berakhir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Waktu Mulai Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editStartAt}
                      onChange={(e) => setEditStartAt(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                      Waktu Berakhir Promo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editEndAt}
                      onChange={(e) => setEditEndAt(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Free Coffee / Special Benefit Toggle */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHasCoffee}
                      onChange={(e) => setEditHasCoffee(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-amber-700" /> Sertakan Benefit Khusus (Free Coffee / Item)
                    </span>
                  </label>

                  {editHasCoffee && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-900">Nama Benefit</label>
                        <input
                          type="text"
                          value={editBenefitName}
                          onChange={(e) => setEditBenefitName(e.target.value)}
                          placeholder="Contoh: Free Coffee"
                          className="w-full px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-900">Jumlah / Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={editBenefitQty}
                          onChange={(e) => setEditBenefitQty(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 font-bold text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Status Promo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatus('ACTIVE')}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        editStatus === 'ACTIVE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ACTIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('INACTIVE')}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        editStatus === 'INACTIVE'
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      INACTIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('EXPIRED')}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        editStatus === 'EXPIRED'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      EXPIRED
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingPromo(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL CONFIRM DELETE PROMO */}
        {/* ========================================================================= */}
        {deletingPromo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-black text-base text-slate-900">Hapus Kode Promo?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Apakah Anda yakin ingin menghapus kode promo{' '}
                  <strong className="text-slate-900 font-mono font-black">
                    "{deletingPromo.code}"
                  </strong>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Nama Promo:</span>
                  <strong className="text-slate-900 font-bold">{deletingPromo.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Penggunaan:</span>
                  <strong className="text-blue-600 font-bold">{deletingPromo.used_count || 0}x</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={() => setDeletingPromo(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={handleDeleteSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDelete ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
