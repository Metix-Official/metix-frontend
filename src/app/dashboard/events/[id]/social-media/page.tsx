'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventSocialMediasList,
  fetchOrganizerEventDetail,
  createEventSocialMediaApi,
  updateEventSocialMediaApi,
  deleteEventSocialMediaApi,
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
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Globe,
} from 'lucide-react';

interface SocialMediaPageProps {
  params: Promise<{ id: string }>;
}

const PLATFORM_PRESETS = [
  'Instagram',
  'TikTok',
  'WhatsApp',
  'YouTube',
  'Twitter / X',
  'Facebook',
  'Website',
  'Telegram',
  'Spotify',
];

export default function EventSocialMediaPage({ params }: SocialMediaPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [socialMedias, setSocialMedias] = useState<ApiEventSocialMediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection Checkbox State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal Create / Edit State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiEventSocialMediaItem | null>(null);
  const [formData, setFormData] = useState({
    name: 'Instagram',
    url: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Single Delete State
  const [deletingItem, setDeletingItem] = useState<ApiEventSocialMediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Batch Delete State
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, socialList] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventSocialMediasList(eventId),
      ]);

      if (evtData) setEvent(evtData);
      setSocialMedias(socialList);
      // Reset selected IDs that no longer exist
      setSelectedIds([]);
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

  // Checkbox Selection Logic
  const allFilteredSelected =
    filteredSocials.length > 0 &&
    filteredSocials.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Uncheck all filtered
      const filteredIds = new Set(filteredSocials.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Check all filtered
      const newSelected = new Set([...selectedIds, ...filteredSocials.map((s) => s.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: 'Instagram', url: '', description: '' });
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (item: ApiEventSocialMediaItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || 'Instagram',
      url: item.image || '',
      description: item.description || '',
    });
    setIsFormModalOpen(true);
  };

  // Close Form Modal
  const handleCloseFormModal = () => {
    if (isSubmitting) return;
    setIsFormModalOpen(false);
    setEditingItem(null);
    setFormData({ name: 'Instagram', url: '', description: '' });
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Validasi Gagal', {
        description: 'Nama platform media sosial wajib diisi.',
      });
      return;
    }

    if (!formData.url.trim()) {
      toast.error('Validasi Gagal', {
        description: 'Tautan (URL) atau akun resmi wajib diisi.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Edit Mode
        await updateEventSocialMediaApi(eventId, editingItem.id, {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || undefined,
        });

        toast.success('Media Sosial Berhasil Diperbarui', {
          description: `Akun "${formData.name.trim()}" telah berhasil diperbarui.`,
        });
      } else {
        // Create Mode
        await createEventSocialMediaApi(eventId, {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || undefined,
        });

        toast.success('Media Sosial Berhasil Ditambahkan', {
          description: `Akun "${formData.name.trim()}" berhasil ditambahkan ke event.`,
        });
      }

      handleCloseFormModal();
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menyimpan Media Sosial', {
        description: err?.message || 'Terjadi kesalahan saat memproses data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      await deleteEventSocialMediaApi(eventId, deletingItem.id);
      toast.success('Media Sosial Berhasil Dihapus', {
        description: `Akun "${deletingItem.name}" telah dihapus dari event.`,
      });
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menghapus Media Sosial', {
        description: err?.message || 'Terjadi kesalahan saat menghapus media sosial.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch Delete Confirmation (Hapus Semua yang Terpilih)
  const handleBatchDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;

    setIsBatchDeleting(true);
    try {
      const deletePromises = selectedIds.map((id) =>
        deleteEventSocialMediaApi(eventId, id).catch((e) => {
          console.error(`Gagal menghapus id ${id}:`, e);
          return false;
        })
      );

      await Promise.all(deletePromises);

      toast.success('Hapus Data Terpilih Berhasil', {
        description: `${selectedIds.length} media sosial yang dipilih telah berhasil dihapus.`,
      });

      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menghapus Beberapa Data', {
        description: err?.message || 'Terjadi kesalahan saat proses hapus massal.',
      });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Social Media Event" activeNav="/dashboard/events">
      <div className="w-full space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Master Event</span>
          </Link>

          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
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
              Kelola tautan dan saluran resmi promosi acara (Instagram, TikTok, WhatsApp, YouTube, Website). Gunakan kotak centang di tabel untuk menghapus data terpilih sekaligus.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Actions & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Akun & Saluran Media Sosial ({socialMedias.length})
              </h3>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Batch Delete Action Button (Visible if checkboxes are checked) */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer animate-in zoom-in-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    Hapus {selectedIds.length === socialMedias.length ? 'Semua' : selectedIds.length} Terpilih
                  </span>
                </button>
              )}

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari platform / url..."
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

              {/* Add Button */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Media Sosial</span>
              </button>
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
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    {/* Checkbox Select All */}
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer transition-colors"
                        title="Pilih Semua / Batalkan Pilihan"
                      />
                    </th>
                    <th className="py-3.5 px-2 w-10 text-center">#</th>
                    <th className="py-3.5 px-4">Platform Media Sosial</th>
                    <th className="py-3.5 px-4">Tautan / Akun Resmi</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-center">Ditambahkan</th>
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSocials.map((sm, idx) => {
                    const linkUrl = sm.image && (sm.image.startsWith('http://') || sm.image.startsWith('https://'))
                      ? sm.image
                      : null;
                    const isChecked = selectedIds.includes(sm.id);

                    return (
                      <tr
                        key={sm.id || idx}
                        className={`transition-colors ${
                          isChecked ? 'bg-emerald-50/60' : 'hover:bg-emerald-50/30'
                        }`}
                      >
                        {/* Checkbox Single */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(sm.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer transition-colors"
                          />
                        </td>
                        <td className="py-3.5 px-2 text-center font-bold text-slate-400 text-[11px] align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <span className="font-extrabold text-slate-900 text-xs capitalize">
                            {sm.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          {linkUrl ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1.5 hover:underline max-w-sm truncate"
                            >
                              <span className="truncate">{sm.image}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-800 font-semibold max-w-sm truncate block">
                              {sm.image || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 align-middle">
                          {sm.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium text-[11px] align-middle">
                          {sm.created_at
                            ? new Date(sm.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sm)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                              title="Edit Media Sosial"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(sm)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Media Sosial"
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
          ) : (
            <div className="py-14 text-center space-y-4 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {searchQuery ? 'Tidak Ada Akun yang Cocok' : 'Belum Ada Akun Media Sosial'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan saluran media sosial dengan kata kunci "${searchQuery}".`
                    : 'Event ini belum memiliki data media sosial pada tabel event_social_media.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Media Sosial Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Create / Edit Social Media */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingItem ? 'Edit Media Sosial' : 'Tambah Media Sosial Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingItem
                      ? 'Perbarui tautan atau saluran promosi event'
                      : 'Tambahkan akun media sosial resmi promosi acara'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Platform Name / Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Platform Media Sosial <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {PLATFORM_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, name: preset })}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        formData.name === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Atau ketik nama platform lainnya..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
                />
              </div>

              {/* URL / Account Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Tautan (URL) / Akun Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: https://instagram.com/metixofficial atau @metixfestival"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Keterangan / Label (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Akun Resmi Instagram, Hotline WhatsApp Informasi Tiket..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Media Sosial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Single Delete */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Media Sosial Ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus saluran{' '}
                <span className="font-extrabold text-slate-800">
                  &quot;{deletingItem.name}&quot;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Batch Delete (Hapus Semua Data Terpilih) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus {selectedIds.length} Data Terpilih?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedIds.length === socialMedias.length
                  ? 'Apakah Anda yakin ingin menghapus SEMUA media sosial pada event ini? Seluruh data yang dicentang akan dihapus permanen.'
                  : `Apakah Anda yakin ingin menghapus ${selectedIds.length} media sosial yang telah Anda centang? Tindakan ini tidak dapat dibatalkan.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={isBatchDeleting}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchDeleteConfirm}
                disabled={isBatchDeleting}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isBatchDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {selectedIds.length === socialMedias.length ? 'Hapus Semua' : `Hapus (${selectedIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
