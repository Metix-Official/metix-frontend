'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  duplicateEvent,
  archiveEvent,
  fetchTicketTypes,
  createTicketType,
  deleteTicketType,
  fetchPromos,
  createPromo,
  deletePromo,
  fetchEventSetting,
  updateEventSetting,
  createVenue,
  ApiEvent,
  ApiTicketType,
  ApiPromo,
  ApiEventSetting,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { VenueMapPicker } from '@/components/ui/VenueMapPicker';
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
  Settings,
  ShieldCheck,
  Sliders,
  UserCheck,
  Repeat,
  FileCheck,
  QrCode,
  SlidersHorizontal,
  Percent,
} from 'lucide-react';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

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
  const [createStartAt, setCreateStartAt] = useState<string>(format(new Date(), "yyyy-MM-dd'T'18:00"));
  const [createEndAt, setCreateEndAt] = useState<string>(format(new Date(), "yyyy-MM-dd'T'23:00"));
  const [createLat, setCreateLat] = useState<number>(-6.2088);
  const [createLng, setCreateLng] = useState<number>(106.8456);
  const [createCityInput, setCreateCityInput] = useState<string>('');
  const [createBannerPreview, setCreateBannerPreview] = useState<string>('');
  const [createBannerUrlInput, setCreateBannerUrlInput] = useState<string>('');
  const [createModalTab, setCreateModalTab] = useState<'info' | 'venue' | 'banner'>('info');

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStartAt, setEditStartAt] = useState<string>(format(new Date(), "yyyy-MM-dd'T'18:00"));
  const [editEndAt, setEditEndAt] = useState<string>(format(new Date(), "yyyy-MM-dd'T'23:00"));
  const [editLat, setEditLat] = useState<number>(-6.2088);
  const [editLng, setEditLng] = useState<number>(106.8456);
  const [editCityInput, setEditCityInput] = useState<string>('');
  const [editBannerPreview, setEditBannerPreview] = useState<string>('');
  const [editBannerUrlInput, setEditBannerUrlInput] = useState<string>('');
  const [editModalTab, setEditModalTab] = useState<'info' | 'venue' | 'banner'>('info');

  useEffect(() => {
    if (editingEvent) {
      if (editingEvent.banner) {
        const photo = getPhotoUrl(editingEvent.banner);
        setEditBannerPreview(photo || editingEvent.banner);
        setEditBannerUrlInput(editingEvent.banner.startsWith('http') ? editingEvent.banner : '');
      } else {
        setEditBannerPreview('');
        setEditBannerUrlInput('');
      }
      setEditCityInput(editingEvent.venue?.city || editingEvent.city || '');
      const rawStart = editingEvent.start_at || editingEvent.event_start_at;
      if (rawStart) {
        try {
          const d = new Date(rawStart);
          setEditStartAt(format(d, "yyyy-MM-dd'T'HH:mm"));
        } catch {
          setEditStartAt(format(new Date(), "yyyy-MM-dd'T'18:00"));
        }
      } else {
        setEditStartAt(format(new Date(), "yyyy-MM-dd'T'18:00"));
      }

      const rawEnd = editingEvent.end_at || editingEvent.event_end_at;
      if (rawEnd) {
        try {
          const d = new Date(rawEnd);
          setEditEndAt(format(d, "yyyy-MM-dd'T'HH:mm"));
        } catch {
          setEditEndAt(format(new Date(), "yyyy-MM-dd'T'23:00"));
        }
      } else {
        setEditEndAt(format(new Date(), "yyyy-MM-dd'T'23:00"));
      }

      // Populate Venue coordinates
      const venueObj = typeof editingEvent.venue === 'object' ? editingEvent.venue : null;
      const initialLat = parseFloat(String(editingEvent.latitude || venueObj?.latitude || -6.2088));
      const initialLng = parseFloat(String(editingEvent.longitude || venueObj?.longitude || 106.8456));
      setEditLat(isNaN(initialLat) ? -6.2088 : initialLat);
      setEditLng(isNaN(initialLng) ? 106.8456 : initialLng);
      setEditModalTab('info');
    }
  }, [editingEvent]);

  // File Choose Live Preview Handlers
  const handleCreateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setCreateBannerPreview(dataUrl);
      } catch {
        // Fallback
      }
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setEditBannerPreview(dataUrl);
      } catch {
        // Fallback
      }
    }
  };
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

  // Event Settings Modal State
  const [selectedEventForSettings, setSelectedEventForSettings] = useState<ApiEvent | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingAllowTransfer, setSettingAllowTransfer] = useState(false);
  const [settingTransferFee, setSettingTransferFee] = useState<number>(0);
  const [transferFeeDisplay, setTransferFeeDisplay] = useState<string>('0');
  const [settingMaxPerOrder, setSettingMaxPerOrder] = useState<number>(4);
  const [settingReservationTimeout, setSettingReservationTimeout] = useState<number>(10);
  const [settingRequireIdentity, setSettingRequireIdentity] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const handleTransferFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setTransferFeeDisplay('0');
      setSettingTransferFee(0);
      return;
    }
    const num = parseInt(rawValue, 10);
    setSettingTransferFee(num);
    setTransferFeeDisplay(num.toLocaleString('id-ID'));
  };

  const handleOpenSettingsModal = async (evt: ApiEvent) => {
    setSelectedEventForSettings(evt);
    setSettingsError(null);
    setIsSettingsLoading(true);
    setIsSettingsModalOpen(true);

    try {
      const settingData = await fetchEventSetting(evt.id);
      const fee = settingData?.transfer_fee ?? evt.setting?.transfer_fee ?? 0;
      setSettingTransferFee(fee);
      setTransferFeeDisplay(fee > 0 ? fee.toLocaleString('id-ID') : '0');

      if (settingData) {
        setSettingAllowTransfer(settingData.allow_ticket_transfer ?? false);
        setSettingMaxPerOrder(settingData.max_ticket_per_order ?? 4);
        setSettingReservationTimeout(settingData.reservation_timeout ?? 10);
        setSettingRequireIdentity(settingData.require_identity ?? false);
      } else if (evt.setting) {
        setSettingAllowTransfer(evt.setting.allow_ticket_transfer ?? false);
        setSettingMaxPerOrder(evt.setting.max_ticket_per_order ?? 4);
        setSettingReservationTimeout(evt.setting.reservation_timeout ?? 10);
        setSettingRequireIdentity(evt.setting.require_identity ?? false);
      } else {
        setSettingAllowTransfer(false);
        setSettingMaxPerOrder(4);
        setSettingReservationTimeout(10);
        setSettingRequireIdentity(false);
      }
    } catch {
      setSettingAllowTransfer(false);
      setSettingTransferFee(0);
      setTransferFeeDisplay('0');
      setSettingMaxPerOrder(4);
      setSettingReservationTimeout(10);
      setSettingRequireIdentity(false);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // EVENT PROMO CODES MODAL STATES & HANDLERS
  // ----------------------------------------------------------------------
  const [selectedEventForPromo, setSelectedEventForPromo] = useState<ApiEvent | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promos, setPromos] = useState<ApiPromo[]>([]);
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [deletingPromoTarget, setDeletingPromoTarget] = useState<{ id: number; code: string } | null>(null);
  const [isDeletingPromo, setIsDeletingPromo] = useState(false);

  const [promoDiscountType, setPromoDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [promoDiscountValueDisplay, setPromoDiscountValueDisplay] = useState('');
  const [rawPromoDiscountValue, setRawPromoDiscountValue] = useState(0);

  const [promoMinPurchaseDisplay, setPromoMinPurchaseDisplay] = useState('');
  const [rawPromoMinPurchase, setRawPromoMinPurchase] = useState(0);

  const handlePromoDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setPromoDiscountValueDisplay('');
      setRawPromoDiscountValue(0);
      return;
    }
    const num = parseInt(rawValue, 10);
    setRawPromoDiscountValue(num);
    if (promoDiscountType === 'PERCENTAGE') {
      const clamped = Math.min(100, num);
      setRawPromoDiscountValue(clamped);
      setPromoDiscountValueDisplay(String(clamped));
    } else {
      setPromoDiscountValueDisplay(num.toLocaleString('id-ID'));
    }
  };

  const handlePromoMinPurchaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setPromoMinPurchaseDisplay('');
      setRawPromoMinPurchase(0);
      return;
    }
    const num = parseInt(rawValue, 10);
    setRawPromoMinPurchase(num);
    setPromoMinPurchaseDisplay(num.toLocaleString('id-ID'));
  };

  const handleOpenPromoModal = async (evt: ApiEvent) => {
    setSelectedEventForPromo(evt);
    setPromoError(null);
    setIsPromoLoading(true);
    setIsPromoModalOpen(true);

    setPromoDiscountType('FIXED');
    setPromoDiscountValueDisplay('');
    setRawPromoDiscountValue(0);
    setPromoMinPurchaseDisplay('');
    setRawPromoMinPurchase(0);

    const promoList = await fetchPromos(evt.id);
    setPromos(promoList);
    setIsPromoLoading(false);
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventForPromo) return;

    setIsAddingPromo(true);
    setPromoError(null);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const code = String(form.get('code')).toUpperCase().trim();
    const name = String(form.get('name')).trim();
    const description = String(form.get('description') || '').trim();
    const discount_type = promoDiscountType;
    const discount_value = rawPromoDiscountValue || Number(form.get('discount_value'));
    const min_purchase = rawPromoMinPurchase || Number(form.get('min_purchase') || 0);
    const quota = Number(form.get('quota') || 100);
    const max_usage_per_user = Number(form.get('max_usage_per_user') || 1);
    const start_at_val = String(form.get('start_at'));
    const end_at_val = String(form.get('end_at'));

    // Format datetime string to YYYY-MM-DD HH:mm:ss if ISO
    const start_at = start_at_val.includes('T') ? start_at_val.replace('T', ' ') + ':00' : start_at_val;
    const end_at = end_at_val.includes('T') ? end_at_val.replace('T', ' ') + ':00' : end_at_val;

    try {
      await createPromo(selectedEventForPromo.id, {
        code,
        name,
        description,
        discount_type,
        discount_value,
        min_purchase,
        quota,
        max_usage_per_user,
        start_at,
        end_at,
      });

      toast.success('Kode Promo Berhasil Dibuat! 🎉', {
        description: `Kode promo "${code}" (${discount_type === 'FIXED' ? 'Rp ' + discount_value.toLocaleString('id-ID') : discount_value + '%'}) berhasil ditambahkan.`,
      });

      formElement.reset();
      setPromoDiscountValueDisplay('');
      setRawPromoDiscountValue(0);
      setPromoMinPurchaseDisplay('');
      setRawPromoMinPurchase(0);

      // Refresh promo list
      const updatedList = await fetchPromos(selectedEventForPromo.id);
      setPromos(updatedList);
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuat kode promo.';
      setPromoError(msg);
      toast.error('Gagal Menambah Promo', {
        description: msg,
      });
    } finally {
      setIsAddingPromo(false);
    }
  };

  const confirmDeletePromo = async () => {
    if (!selectedEventForPromo || !deletingPromoTarget) return;

    setIsDeletingPromo(true);
    const { id, code } = deletingPromoTarget;

    try {
      const ok = await deletePromo(selectedEventForPromo.id, id);
      if (ok) {
        toast.success('Kode Promo Dihapus', {
          description: `Kode promo "${code}" berhasil dihapus.`,
        });
        const updatedList = await fetchPromos(selectedEventForPromo.id);
        setPromos(updatedList);
      } else {
        toast.error('Gagal menghapus kode promo.');
      }
    } catch {
      toast.error('Gagal menghapus kode promo.');
    } finally {
      setIsDeletingPromo(false);
      setDeletingPromoTarget(null);
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForSettings) return;

    setIsSavingSettings(true);
    setSettingsError(null);

    try {
      await updateEventSetting(selectedEventForSettings.id, {
        allow_ticket_transfer: settingAllowTransfer,
        transfer_fee: Number(settingTransferFee),
        max_ticket_per_order: Number(settingMaxPerOrder),
        reservation_timeout: Number(settingReservationTimeout),
        require_identity: settingRequireIdentity,
      });

      toast.success('Pengaturan Event Berhasil Disimpan! ⚙️', {
        description: `Pengaturan untuk event "${selectedEventForSettings.title}" telah diperbarui.`,
      });

      setIsSettingsModalOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan pengaturan event.';
      setSettingsError(msg);
      toast.error('Gagal Menyimpan Pengaturan', { description: msg });
    } finally {
      setIsSavingSettings(false);
    }
  };

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
  // 1-Click Publish Event API Function
  const handlePublish = async (eventId: number, title: string) => {
    setActionEventId(eventId);
    try {
      const ok = await publishEvent(eventId);
      if (ok) {
        toast.success('Event Dipublikasikan! 🚀', {
          description: `Event "${title}" telah berhasil dipublikasikan dan aktif.`,
        });
        loadData();
      } else {
        toast.error('Gagal Mempublikasikan Event');
      }
    } catch (err: any) {
      toast.error('Gagal Mempublikasikan Event', {
        description: err?.message || 'Terjadi kesalahan saat mempublikasikan event.',
      });
    } finally {
      setActionEventId(null);
    }
  };

  const handleArchive = async (eventId: number, title: string) => {
    setActionEventId(eventId);
    try {
      const ok = await cancelEvent(eventId);
      if (ok) {
        toast.success('Event Diarsipkan! 📦', {
          description: `Event "${title}" telah diarsipkan/dibatal dan dipindahkan ke tab Archived.`,
        });
        loadData();
      } else {
        toast.error('Gagal Mengarsipkan Event');
      }
    } catch (err: any) {
      toast.error('Gagal Mengarsipkan Event', {
        description: err?.message || 'Terjadi kesalahan saat membatalkan event.',
      });
    } finally {
      setActionEventId(null);
    }
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

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);

      // Programmatic Validation & Auto-Tab Navigation
      const titleVal = formData.get('title');
      if (!titleVal || String(titleVal).trim() === '') {
        setCreateModalTab('info');
        setErrorMessage('Judul Event belum diisi! Silakan isi terlebih dahulu.');
        setIsSubmitting(false);
        toast.error('Judul Event belum diisi!');
        alert('⚠️ PERINGATAN: Data Judul Event belum diisi!\n\nDiharapkan mengisi Judul Event terlebih dahulu sebelum membuat event.');
        return;
      }

      const slugVal = formData.get('slug');
      if (!slugVal || String(slugVal).trim() === '') {
        setCreateModalTab('info');
        setErrorMessage('Data Slug / URL Event belum diisi! Silakan isi bidang slug terlebih dahulu.');
        setIsSubmitting(false);
        toast.error('Data Slug / URL Event belum diisi!');
        alert('⚠️ PERINGATAN: Data Slug / URL Event belum diisi!\n\nDiharapkan mengisi bidang Slug / URL Event terlebih dahulu sebelum membuat event.');
        return;
      }

      const venueName = formData.get('name') || formData.get('venue_name') || formData.get('location');
      if (!venueName || String(venueName).trim() === '') {
        setCreateModalTab('venue');
        setErrorMessage('Nama venue / tempat belum diisi!');
        setIsSubmitting(false);
        toast.error('Nama venue / tempat belum diisi!');
        alert('⚠️ PERINGATAN: Nama Venue / Tempat Event belum diisi!\n\nDiharapkan mengisi bidang Tempat / Venue terlebih dahulu.');
        return;
      }
      formData.set('venue_name', String(venueName));
      formData.set('name', String(venueName));
      formData.set('location', String(venueName));

      let startAtVal = String(formData.get('start_at') || createStartAt || '').trim();
      if (!startAtVal) {
        setCreateModalTab('info');
        setErrorMessage('Tanggal & Waktu Mulai Event belum ditentukan!');
        setIsSubmitting(false);
        toast.error('Tanggal Mulai Event belum ditentukan!');
        alert('⚠️ PERINGATAN: Tanggal & Waktu Mulai Event belum ditentukan!\n\nDiharapkan mengisi Tanggal Mulai Event terlebih dahulu.');
        return;
      }

      // Call API POST /api/v1/organizer/venues to get created venue_id integer
      const createdVenue = await createVenue({
        name: String(venueName),
        address: String(formData.get('address') || '').trim() || 'Jl. Utama No. 1',
        city: String(formData.get('city') || createCityInput || '').trim() || 'Jakarta',
        latitude: createLat,
        longitude: createLng,
        capacity: Number(formData.get('capacity')) || 5000,
      });

      if (createdVenue && createdVenue.id) {
        formData.set('venue_id', String(createdVenue.id));
      }

      startAtVal = String(formData.get('start_at') || createStartAt || '').trim();
      let endAtVal = String(formData.get('end_at') || createEndAt || '').trim();

      if (startAtVal.includes('T')) startAtVal = startAtVal.replace('T', ' ');
      if (endAtVal.includes('T')) endAtVal = endAtVal.replace('T', ' ');

      if (startAtVal && startAtVal.length === 16) startAtVal += ':00';
      if (endAtVal && endAtVal.length === 16) endAtVal += ':00';

      if (!startAtVal) startAtVal = format(new Date(), 'yyyy-MM-dd') + ' 18:00:00';
      if (!endAtVal) endAtVal = format(new Date(), 'yyyy-MM-dd') + ' 23:00:00';

      formData.set('start_at', startAtVal);
      formData.set('end_at', endAtVal);
      formData.set('event_start_at', startAtVal);
      formData.set('event_end_at', endAtVal);

      // Remove venue_photo completely
      formData.delete('venue_photo');
      formData.delete('venue_photo_url');

      // Ensure banner string is <= 255 characters to satisfy backend VARCHAR(255) / max:255 validation
      const bannerUrlInput = formData.get('banner_url');
      const bannerFile = formData.get('banner');
      formData.delete('banner_url');

      const defaultShortBanner = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745';

      if (createBannerPreview) {
        formData.set('_local_banner_preview', createBannerPreview);
      }

      if (bannerUrlInput && String(bannerUrlInput).trim() !== '') {
        const cleanUrl = String(bannerUrlInput).trim().slice(0, 255);
        formData.set('banner', cleanUrl);
      } else if (bannerFile instanceof File && bannerFile.size > 0) {
        const shortName = `events/banner_${Date.now()}_${bannerFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`.slice(0, 255);
        formData.set('banner', shortName);
      } else if (createBannerPreview && createBannerPreview.startsWith('http')) {
        formData.set('banner', createBannerPreview.slice(0, 255));
      } else {
        formData.set('banner', defaultShortBanner);
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

      // Programmatic Validation & Auto-Tab Navigation
      const titleVal = formData.get('title');
      if (!titleVal || String(titleVal).trim() === '') {
        setEditModalTab('info');
        setErrorMessage('Judul event wajib diisi!');
        setIsUpdating(false);
        toast.error('Judul event wajib diisi!');
        return;
      }

      const venueName = formData.get('name') || formData.get('venue_name') || formData.get('location');
      if (!venueName || String(venueName).trim() === '') {
        setEditModalTab('venue');
        setErrorMessage('Nama venue / tempat wajib diisi!');
        setIsUpdating(false);
        toast.error('Nama venue / tempat wajib diisi!');
        return;
      }
      formData.set('venue_name', String(venueName));
      formData.set('name', String(venueName));
      formData.set('location', String(venueName));

      // Call API POST /api/v1/organizer/venues to get created venue_id integer
      let venueIdToSet = editingEvent.venue_id || editingEvent.venue?.id;
      const createdVenue = await createVenue({
        name: String(venueName),
        address: String(formData.get('address') || editingEvent.venue?.address || '').trim() || 'Jl. Utama No. 1',
        city: String(formData.get('city') || editingEvent.venue?.city || '').trim() || 'Jakarta',
        latitude: editLat,
        longitude: editLng,
        capacity: Number(formData.get('capacity')) || editingEvent.venue?.capacity || 5000,
      });

      if (createdVenue && createdVenue.id) {
        venueIdToSet = createdVenue.id;
      }

      if (venueIdToSet) {
        formData.set('venue_id', String(venueIdToSet));
      }

      let startAtVal = String(formData.get('start_at') || editStartAt || '').trim();
      let endAtVal = String(formData.get('end_at') || editEndAt || '').trim();

      if (startAtVal.includes('T')) startAtVal = startAtVal.replace('T', ' ');
      if (endAtVal.includes('T')) endAtVal = endAtVal.replace('T', ' ');

      if (startAtVal && startAtVal.length === 16) startAtVal += ':00';
      if (endAtVal && endAtVal.length === 16) endAtVal += ':00';

      if (!startAtVal) startAtVal = format(new Date(), 'yyyy-MM-dd') + ' 18:00:00';
      if (!endAtVal) endAtVal = format(new Date(), 'yyyy-MM-dd') + ' 23:00:00';

      formData.set('start_at', startAtVal);
      formData.set('end_at', endAtVal);
      formData.set('event_start_at', startAtVal);
      formData.set('event_end_at', endAtVal);

      // Remove venue_photo completely
      formData.delete('venue_photo');
      formData.delete('venue_photo_url');

      // Ensure banner string is <= 255 characters to satisfy backend VARCHAR(255) / max:255 validation
      const bannerUrlInput = formData.get('banner_url');
      const bannerFile = formData.get('banner');
      formData.delete('banner_url');

      const defaultShortBanner = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745';

      if (editBannerPreview) {
        formData.set('_local_banner_preview', editBannerPreview);
      }

      if (bannerUrlInput && String(bannerUrlInput).trim() !== '') {
        const cleanUrl = String(bannerUrlInput).trim().slice(0, 255);
        formData.set('banner', cleanUrl);
      } else if (bannerFile instanceof File && bannerFile.size > 0) {
        const shortName = `events/banner_${Date.now()}_${bannerFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`.slice(0, 255);
        formData.set('banner', shortName);
      } else if (editBannerPreview && editBannerPreview.length <= 255) {
        formData.set('banner', editBannerPreview);
      } else if (editingEvent.banner && editingEvent.banner.length <= 255) {
        formData.set('banner', editingEvent.banner);
      } else {
        formData.set('banner', defaultShortBanner);
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

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
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
        description: `Tipe tiket "${name}" (Rp ${price.toLocaleString('id-ID')}) dengan kuota ${quota} berhasil ditambahkan.`,
      });

      formElement.reset();
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
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        (evt.location || '').toLowerCase().includes(q) ||
        (evt.venue_name || '').toLowerCase().includes(q) ||
        (evt.venue?.name || '').toLowerCase().includes(q) ||
        (evt.category || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      const evtStatus = (evt.status || '').toLowerCase();

      if (activeTab === 'published') return evtStatus === 'published' || evtStatus === 'active';
      if (activeTab === 'draft') return evtStatus === 'draft';
      if (activeTab === 'closed') return evtStatus === 'closed' || evtStatus === 'cancelled' || evtStatus === 'archived';
      return true;
    });
  }, [events, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'published':
      case 'active':
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
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Archived
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
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-700/15 border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-extrabold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-blue-200" /> Event Organizer Console
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Kelola Event, Harga Tiket & Kuota
              </h2>
              <p className="text-xs text-blue-100/90 font-medium max-w-xl">
                Publikasikan event baru, atur harga & kuota tiket (VIP / Regular), duplikasi konser, dan kelola event dengan mudah.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50 active:scale-95"
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
                className="px-5 py-2.5 rounded-2xl bg-white text-indigo-950 hover:bg-blue-50 font-black text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-indigo-700" />
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
                Published ({events.filter((e) => ['published', 'active'].includes((e.status || '').toLowerCase())).length})
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'draft'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draft ({events.filter((e) => (e.status || '').toLowerCase() === 'draft').length})
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'closed'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Archived ({events.filter((e) => ['closed', 'cancelled', 'archived'].includes((e.status || '').toLowerCase())).length})
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

          {/* Events Ticket-Style Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredEvents.map((item) => {
                const bannerUrl = getPhotoUrl(item.banner || item.venue_photo, item.id);
                const categoryName = item.category || 'Music Concert';
                const venueName = item.venue?.name || item.venue_name || item.location || 'Venue Belum Diatur';
                const venueCity = item.venue?.city || item.city || '';
                const venueDisplay = venueCity ? `${venueName} (${venueCity})` : venueName;

                let dateStr = '15 Sep 2026';
                if (item.event_start_at || item.start_at) {
                  try {
                    const rawDate = item.event_start_at || item.start_at;
                    dateStr = new Date(rawDate!).toLocaleDateString('id-ID', {
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
                    className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Side Half-Moon Notches for Karcis / Ticket Cutout Effect */}
                    <div className="absolute -left-3.5 top-[152px] w-7 h-7 rounded-full bg-slate-100 border-r border-slate-300 z-20 shadow-inner" />
                    <div className="absolute -right-3.5 top-[152px] w-7 h-7 rounded-full bg-slate-100 border-l border-slate-300 z-20 shadow-inner" />

                    {/* Ticket Header Banner */}
                    <div className="relative h-44 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 overflow-hidden">
                      {bannerUrl ? (
                        <img
                          src={bannerUrl}
                          alt={item.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                          <Sparkles className="w-8 h-8 text-amber-300 mb-1" />
                          <span className="font-extrabold text-sm tracking-tight">{item.title}</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div>{getStatusBadge(item.status)}</div>
                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/30">
                          VIP TICKET PASS
                        </span>
                      </div>

                      {/* Bottom Category Badge */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                        <Tag className="w-3 h-3 text-amber-400" /> {categoryName}
                      </div>
                    </div>

                    {/* Dashed Perforated Ticket Coupon Line */}
                    <div className="relative border-b-2 border-dashed border-slate-200 z-10 px-4 bg-white" />

                    {/* Body Content */}
                    <div className="p-5 space-y-3 flex-1 bg-white relative">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </h3>

                      <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-800">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{venueDisplay}</span>
                        </div>
                      </div>

                      {/* Event Settings Clean Metadata Text Row */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-bold">
                          <span>Max: <strong className="text-slate-900 font-extrabold">{item.setting?.max_ticket_per_order || 4} Tiket</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>Timeout: <strong className="text-slate-900 font-extrabold">{item.setting?.reservation_timeout || 10}m</strong></span>
                        </div>

                        <button
                          onClick={() => handleOpenPromoModal(item)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-all cursor-pointer flex items-center gap-1 font-extrabold text-[11px] shadow-2xs"
                          title="Kelola Kode Promo Diskon Event"
                        >
                          <Tag className="w-3.5 h-3.5 text-indigo-600" /> Kode Promo
                        </button>
                      </div>
                    </div>

                    {/* Ticket Stub Action Buttons */}
                    <div className="px-4 space-y-2 pb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenTicketTypesModal(item)}
                          className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Ticket className="w-4 h-4 text-blue-600" /> Tiket & Kuota
                        </button>

                        <button
                          onClick={() => handleOpenSettingsModal(item)}
                          className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Settings className="w-4 h-4 text-slate-600" /> Settings
                        </button>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      {(() => {
                        const s = (item.status || '').toLowerCase();
                        if (s === 'draft') {
                          return (
                            <button
                              disabled={actionEventId === item.id}
                              onClick={() => handlePublish(item.id, item.title)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                              title="Publikasikan Event ke Publik"
                            >
                              {actionEventId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Globe className="w-3.5 h-3.5" />
                              )}
                              <span>Publish</span>
                            </button>
                          );
                        } else if (s === 'published' || s === 'active') {
                          return (
                            <button
                              disabled={actionEventId === item.id}
                              onClick={() => handleArchive(item.id, item.title)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                              title="Arsipkan / Batalkan Event"
                            >
                              {actionEventId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                              <span>Archived</span>
                            </button>
                          );
                        } else {
                          return (
                            <span className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold text-center border border-slate-200 flex items-center justify-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Archived
                            </span>
                          );
                        }
                      })()}

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
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 px-4 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200/90 my-2 w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-black text-slate-900">
                  Belum Ada Event Ditemukan
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Belum ada event terdaftar pada kategori atau pencarian ini. Klik tombol <strong className="text-slate-700">"+ Buat Event Baru"</strong> untuk mempublikasikan konser atau acara Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Event Sekarang</span>
              </button>
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
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-indigo-800 via-blue-800 to-indigo-900 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black tracking-tight">Edit Event — {editingEvent.title}</h3>
              <p className="text-xs text-blue-100/90 font-medium">
                Perbarui detail rincian acara, lokasi venue, serta media banner.
              </p>

              {/* Navigation Tabs Bar */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setEditModalTab('info')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    editModalTab === 'info'
                      ? 'bg-white text-indigo-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> 1. Info Acara
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('venue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    editModalTab === 'venue'
                      ? 'bg-white text-indigo-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> 2. Lokasi & Peta Venue
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('banner')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    editModalTab === 'banner'
                      ? 'bg-white text-indigo-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> 3. Media Banner
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Form Modal Content */}
            <form onSubmit={handleEditSubmit} noValidate className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* TAB 1: INFO EVENT & TANGGAL */}
              <div className={`space-y-4 animate-in fade-in-0 ${editModalTab === 'info' ? 'block' : 'hidden'}`}>
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
                    rows={4}
                    defaultValue={editingEvent.description || editingEvent.desc || ''}
                    placeholder="Tuliskan deskripsi lengkap mengenai event, guest star, rundown, dan informasi acara..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Waktu Mulai Event (Start At)</label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      required
                      value={editStartAt}
                      onChange={(e) => setEditStartAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Waktu Selesai Event (End At)</label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      required
                      value={editEndAt}
                      onChange={(e) => setEditEndAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 2: DETAIL VENUE & PETA */}
              <div className={`space-y-4 animate-in fade-in-0 ${editModalTab === 'venue' ? 'block' : 'hidden'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Nama Venue / Tempat</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={editingEvent.venue?.name || editingEvent.venue_name || editingEvent.location || ''}
                        placeholder="e.g. GBK Senayan / JIExpo Kemayoran"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Alamat Lengkap</label>
                      <input
                        type="text"
                        name="address"
                        defaultValue={editingEvent.venue?.address || editingEvent.address || ''}
                        placeholder="e.g. Jl. Jendral Sudirman No. 1, Gelora"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Kota / Lokasi Cari</label>
                      <input
                        type="text"
                        name="city"
                        value={editCityInput}
                        onChange={(e) => setEditCityInput(e.target.value)}
                        placeholder="e.g. Jakarta Pusat, Bandung, Surabaya"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Kapasitas Penonton</label>
                      <input
                        type="number"
                        name="capacity"
                        defaultValue={editingEvent.venue?.capacity || editingEvent.capacity || 5000}
                        placeholder="e.g. 50000"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Leaflet Interactive Map JS Picker */}
                  <input type="hidden" name="latitude" value={editLat} />
                  <input type="hidden" name="longitude" value={editLng} />
                  <VenueMapPicker
                    initialLat={editLat}
                    initialLng={editLng}
                    cityValue={editCityInput}
                    onCityChange={(cityName) => setEditCityInput(cityName)}
                    onLocationSelect={(lat, lng) => {
                      setEditLat(lat);
                      setEditLng(lng);
                    }}
                  />
              </div>

              {/* TAB 3: MEDIA BANNER */}
              <div className={`space-y-4 animate-in fade-in-0 ${editModalTab === 'banner' ? 'block' : 'hidden'}`}>
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 block">Foto Banner Event (Upload dari Komputer)</label>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-48 w-full bg-slate-900 group">
                    {editBannerPreview ? (
                      <img
                        src={editBannerPreview}
                        alt="Banner Event Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900">
                        <Sparkles className="w-8 h-8 text-amber-300 mb-1 animate-pulse" />
                        <span className="font-extrabold text-xs tracking-tight">Belum Ada Banner Terpilih</span>
                        <span className="text-[10px] text-blue-200 mt-1 font-medium">
                          Pilih file gambar dari komputer di bawah untuk melihat preview
                        </span>
                      </div>
                    )}
                    {editBannerPreview && (
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Preview Banner Aktif
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700">Upload File Gambar dari Komputer</label>
                    <input
                      type="file"
                      name="banner"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  {editModalTab !== 'info' && (
                    <button
                      type="button"
                      onClick={() => setEditModalTab(editModalTab === 'banner' ? 'venue' : 'info')}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      &larr; Kembali
                    </button>
                  )}

                  {editModalTab !== 'banner' ? (
                    <button
                      type="button"
                      onClick={() => setEditModalTab(editModalTab === 'info' ? 'venue' : 'banner')}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Lanjut &rarr;
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Memperbarui...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Total Kuota Tiket</label>
                    <input
                      type="number"
                      name="quota"
                      required
                      min="1"
                      placeholder="e.g. 200"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAddingTicketType}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAddingTicketType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Simpan Tipe Tiket via API</span>
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
                          <th className="py-3 px-4">Total Kuota Tiket</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ticketTypes.map((tt) => {
                          const sold = tt.sold_count ?? tt.sold_quantity ?? 0;
                          const totalQuota = tt.quota ?? 0;
                          const available = tt.available ?? tt.available_quota ?? Math.max(0, totalQuota - sold);

                          return (
                            <tr key={tt.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-extrabold text-slate-900">{tt.name}</td>
                              <td className="py-3 px-4 font-black text-blue-700">
                                Rp. {Number(tt.price || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                <div>
                                  <span className="font-extrabold text-slate-900">{totalQuota} Tiket</span>
                                  <span className="text-slate-500"> (Terjual: <strong className="text-blue-600 font-extrabold">{sold}</strong>)</span>
                                </div>
                                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                  Sisa Tersedia: {available} Tiket
                                </div>
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
                          );
                        })}
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

      {/* ================= MODAL KELOLA KODE PROMO DISKON ================= */}
      {isPromoModalOpen && selectedEventForPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-800 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-purple-200" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-100">
                  Kelola Kode Promo & Diskon Event
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight truncate">
                {selectedEventForPromo.title}
              </h3>
              <p className="text-xs text-purple-100/90 font-medium">
                Atur kode kupon diskon, persen/nominal potongan, minimum pembelian, dan batas waktu promo.
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {promoError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{promoError}</span>
                </div>
              )}

              {/* Form Tambah Kode Promo Baru */}
              <form onSubmit={handleCreatePromoSubmit} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
                  <PlusCircle className="w-4 h-4 text-indigo-600" /> Tambah Kode Promo / Kupon Baru
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Kode Promo (Kupon)</label>
                    <input
                      type="text"
                      name="code"
                      required
                      placeholder="e.g. DISKON50K"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-950 uppercase tracking-wide focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Nama Promo</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Promo Kemerdekaan"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Deskripsi Promo (Opsional)</label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. Potongan Rp 50.000 untuk pembelian tiket"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Tipe Diskon</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setPromoDiscountType('FIXED');
                          setPromoDiscountValueDisplay('');
                          setRawPromoDiscountValue(0);
                        }}
                        className={`py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                          promoDiscountType === 'FIXED'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Rp (Nominal)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPromoDiscountType('PERCENTAGE');
                          setPromoDiscountValueDisplay('');
                          setRawPromoDiscountValue(0);
                        }}
                        className={`py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                          promoDiscountType === 'PERCENTAGE'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        % (Persen)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">
                      Nilai Potongan {promoDiscountType === 'FIXED' ? '(Rp)' : '(%)'}
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                        {promoDiscountType === 'FIXED' ? 'Rp.' : '%'}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={promoDiscountType === 'FIXED' ? '50.000' : '20'}
                        value={promoDiscountValueDisplay}
                        onChange={handlePromoDiscountValueChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                      <input type="hidden" name="discount_value" value={rawPromoDiscountValue} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Min. Pembelian (Rp)</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                        Rp.
                      </span>
                      <input
                        type="text"
                        placeholder="100.000"
                        value={promoMinPurchaseDisplay}
                        onChange={handlePromoMinPurchaseChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                      <input type="hidden" name="min_purchase" value={rawPromoMinPurchase} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Kuota Promo</label>
                    <input
                      type="number"
                      name="quota"
                      required
                      min="1"
                      defaultValue="100"
                      placeholder="100"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Max / User</label>
                    <input
                      type="number"
                      name="max_usage_per_user"
                      required
                      min="1"
                      defaultValue="1"
                      placeholder="1"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Waktu Mulai</label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      required
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Waktu Berakhir</label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      required
                      defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAddingPromo}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAddingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Simpan Kode Promo via API</span>
                  </button>
                </div>
              </form>

              {/* Table Daftar Promo Existing */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Daftar Kode Promo Terdaftar ({promos.length})
                </h4>

                {isPromoLoading ? (
                  <Skeleton className="h-40 w-full rounded-2xl" />
                ) : promos.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Kode Promo</th>
                          <th className="py-3 px-4">Diskon / Potongan</th>
                          <th className="py-3 px-4">Syarat & Kuota</th>
                          <th className="py-3 px-4">Masa Berlaku</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {promos.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-black uppercase text-xs tracking-wider">
                                {p.code}
                              </div>
                              <div className="font-extrabold text-slate-900 text-xs mt-1">{p.name}</div>
                              {p.description && (
                                <div className="text-[10px] text-slate-500 line-clamp-1">{p.description}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-700 text-xs">
                              {p.discount_type === 'FIXED'
                                ? `Rp. ${Number(p.discount_value || 0).toLocaleString('id-ID')}`
                                : `${p.discount_value}%`}
                            </td>
                            <td className="py-3 px-4 text-[11px] font-semibold text-slate-700 space-y-0.5">
                              <div>Min. Transaksi: Rp. {Number(p.min_purchase || 0).toLocaleString('id-ID')}</div>
                              <div className="text-slate-500">Kuota: {p.quota || 0} (Pakai: {p.used_count || 0})</div>
                            </td>
                            <td className="py-3 px-4 text-[10px] text-slate-600 font-medium space-y-0.5">
                              <div>Mulai: {p.start_at ? format(new Date(p.start_at), 'dd MMM yyyy HH:mm') : '-'}</div>
                              <div>End: {p.end_at ? format(new Date(p.end_at), 'dd MMM yyyy HH:mm') : '-'}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setDeletingPromoTarget({ id: p.id, code: p.code })}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                title="Hapus Promo"
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
                    Belum ada kode promo yang dibuat untuk event ini. Gunakan form di atas untuk membuat diskon event.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Promo */}
      {deletingPromoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Hapus Kode Promo?</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Apakah Anda yakin ingin menghapus kode promo <strong className="text-slate-900 font-bold">{deletingPromoTarget.code}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={isDeletingPromo}
                onClick={() => setDeletingPromoTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex-1"
              >
                Batal
              </button>
              <button
                disabled={isDeletingPromo}
                onClick={confirmDeletePromo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex-1 flex items-center justify-center gap-1"
              >
                {isDeletingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL BUAT EVENT BARU ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black tracking-tight">Form Buat Event Baru</h3>
              <p className="text-xs text-blue-100/90 font-medium">
                Isi rincian judul, tanggal, lokasi venue & peta, serta banner publikasi event Anda.
              </p>

              {/* Navigation Tabs Bar */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCreateModalTab('info')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    createModalTab === 'info'
                      ? 'bg-white text-blue-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> 1. Info Acara
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalTab('venue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    createModalTab === 'venue'
                      ? 'bg-white text-blue-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> 2. Lokasi & Peta Venue
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalTab('banner')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    createModalTab === 'banner'
                      ? 'bg-white text-blue-950 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> 3. Media Banner
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Form Modal Content */}
            <form onSubmit={handleCreateSubmit} noValidate className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* TAB 1: INFO EVENT & TANGGAL */}
              <div className={`space-y-4 animate-in fade-in-0 ${createModalTab === 'info' ? 'block' : 'hidden'}`}>
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
                    rows={4}
                    placeholder="Tuliskan deskripsi lengkap mengenai event, guest star, rundown, dan informasi acara..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Waktu Mulai Event (Start At)</label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      required
                      value={createStartAt}
                      onChange={(e) => setCreateStartAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">Waktu Selesai Event (End At)</label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      required
                      value={createEndAt}
                      onChange={(e) => setCreateEndAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 2: DETAIL VENUE & PETA */}
              <div className={`space-y-4 animate-in fade-in-0 ${createModalTab === 'venue' ? 'block' : 'hidden'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Nama Venue / Tempat</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="e.g. GBK Senayan / JIExpo Kemayoran"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Alamat Lengkap</label>
                      <input
                        type="text"
                        name="address"
                        placeholder="e.g. Jl. Jendral Sudirman No. 1, Gelora"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Kota / Lokasi Cari</label>
                      <input
                        type="text"
                        name="city"
                        value={createCityInput}
                        onChange={(e) => setCreateCityInput(e.target.value)}
                        placeholder="e.g. Jakarta Pusat, Bandung, Surabaya"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">Kapasitas Penonton</label>
                      <input
                        type="number"
                        name="capacity"
                        defaultValue={5000}
                        placeholder="e.g. 50000"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Leaflet Interactive Map JS Picker */}
                  <input type="hidden" name="latitude" value={createLat} />
                  <input type="hidden" name="longitude" value={createLng} />
                  <VenueMapPicker
                    initialLat={createLat}
                    initialLng={createLng}
                    cityValue={createCityInput}
                    onCityChange={(cityName) => setCreateCityInput(cityName)}
                    onLocationSelect={(lat, lng) => {
                      setCreateLat(lat);
                      setCreateLng(lng);
                    }}
                  />
              </div>

              {/* TAB 3: MEDIA BANNER */}
              <div className={`space-y-4 animate-in fade-in-0 ${createModalTab === 'banner' ? 'block' : 'hidden'}`}>
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 block">Foto Banner Event (Upload dari Komputer)</label>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-48 w-full bg-slate-900 group">
                    {createBannerPreview ? (
                      <img
                        src={createBannerPreview}
                        alt="Banner Event Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900">
                        <Sparkles className="w-8 h-8 text-amber-300 mb-1 animate-pulse" />
                        <span className="font-extrabold text-xs tracking-tight">Belum Ada Banner Terpilih</span>
                        <span className="text-[10px] text-blue-200 mt-1 font-medium">
                          Pilih file gambar dari komputer di bawah untuk melihat preview
                        </span>
                      </div>
                    )}
                    {createBannerPreview && (
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Preview Banner Aktif
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700">Upload File Gambar dari Komputer</label>
                    <input
                      type="file"
                      name="banner"
                      accept="image/*"
                      onChange={handleCreateFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  {createModalTab !== 'info' && (
                    <button
                      type="button"
                      onClick={() => setCreateModalTab(createModalTab === 'banner' ? 'venue' : 'info')}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      &larr; Kembali
                    </button>
                  )}

                  {createModalTab !== 'banner' ? (
                    <button
                      type="button"
                      onClick={() => setCreateModalTab(createModalTab === 'info' ? 'venue' : 'banner')}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Lanjut &rarr;
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EVENT SETTINGS ================= */}
      {isSettingsModalOpen && selectedEventForSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-100">
                  Pengaturan Event & Aturan Tiket
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight truncate">
                {selectedEventForSettings.title}
              </h3>
            </div>

            {settingsError && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{settingsError}</span>
              </div>
            )}

            {isSettingsLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-6 w-48 rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettingsSubmit} className="p-6 space-y-5">
                {/* Allow Ticket Transfer Switch */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer">
                      <Repeat className="w-4 h-4 text-blue-600" /> Izinkan Transfer Tiket
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pembeli tiket dapat mentransfer tiket ke pengguna lain secara online.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingAllowTransfer}
                    onChange={(e) => setSettingAllowTransfer(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                </div>

                {/* Transfer Fee Formatted Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Biaya Transfer Tiket (Rp)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-black text-slate-600">
                      Rp.
                    </span>
                    <input
                      type="text"
                      value={transferFeeDisplay}
                      onChange={handleTransferFeeChange}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Set 0 jika biaya transfer tiket gratis untuk pembeli.
                  </p>
                </div>

                {/* Grid: Max Tickets per Order & Timeout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Maksimal Pembelian Tiket
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={settingMaxPerOrder}
                      onChange={(e) => setSettingMaxPerOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Default: 4 tiket per transaksi.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Timeout Reservasi (Menit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      required
                      value={settingReservationTimeout}
                      onChange={(e) => setSettingReservationTimeout(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Batas waktu bayar checkout (default 10 menit).</p>
                  </div>
                </div>

                {/* Require Identity Switch */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer">
                      <UserCheck className="w-4 h-4 text-amber-600" /> Wajibkan Pengisian KTP / NIK
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pembeli wajib mengisi nomor NIK/KTP dan data pemegang tiket saat checkout.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingRequireIdentity}
                    onChange={(e) => setSettingRequireIdentity(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Simpan Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
