'use client';

import React, { useState, useEffect, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventFacilitiesList,
  fetchOrganizerEventDetail,
  createEventFacilityApi,
  updateEventFacilityApi,
  deleteEventFacilityApi,
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
  X,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertTriangle,
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

  // Modal Create / Edit State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<ApiEventFacilityItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Delete State
  const [deletingFacility, setDeletingFacility] = useState<ApiEventFacilityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingFacility(null);
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (fac: ApiEventFacilityItem) => {
    setEditingFacility(fac);
    setFormData({
      name: fac.name || '',
      description: fac.description || '',
    });
    setImageFile(null);
    setImagePreview(fac.image ? getPhotoUrl(fac.image) : null);
    setIsFormModalOpen(true);
  };

  // Close Form Modal & Cleanup
  const handleCloseFormModal = () => {
    if (isSubmitting) return;
    setIsFormModalOpen(false);
    setEditingFacility(null);
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar', {
        description: 'Maksimal ukuran gambar fasilitas adalah 5MB.',
      });
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Validasi Gagal', {
        description: 'Nama fasilitas wajib diisi.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingFacility) {
        // Edit Mode
        await updateEventFacilityApi(eventId, editingFacility.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image: imageFile || undefined,
        });

        toast.success('Fasilitas Berhasil Diperbarui', {
          description: `Fasilitas "${formData.name.trim()}" telah berhasil diperbarui.`,
        });
      } else {
        // Create Mode
        await createEventFacilityApi(eventId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image: imageFile,
        });

        toast.success('Fasilitas Berhasil Ditambahkan', {
          description: `Fasilitas "${formData.name.trim()}" berhasil ditambahkan ke event.`,
        });
      }

      handleCloseFormModal();
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menyimpan Fasilitas', {
        description: err?.message || 'Terjadi kesalahan saat memproses data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingFacility) return;

    setIsDeleting(true);
    try {
      await deleteEventFacilityApi(eventId, deletingFacility.id);
      toast.success('Fasilitas Berhasil Dihapus', {
        description: `Fasilitas "${deletingFacility.name}" telah dihapus dari event.`,
      });
      setDeletingFacility(null);
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menghapus Fasilitas', {
        description: err?.message || 'Terjadi kesalahan saat menghapus fasilitas.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
              Kelola daftar fasilitas yang disediakan oleh penyelenggara untuk kenyamanan pengunjung di venue acara (Mushola, Parkir VIP, Toilet, Area Medis, dll).
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Actions & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Fasilitas Event ({facilities.length})
              </h3>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-60">
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

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Fasilitas</span>
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
          ) : filteredFacilities.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Nama Fasilitas</th>
                    <th className="py-3.5 px-4">Deskripsi / Keterangan</th>
                    <th className="py-3.5 px-4">Foto / Ikon</th>
                    <th className="py-3.5 px-4 text-center">Ditambahkan</th>
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFacilities.map((fac, idx) => {
                    const imgUrl = getPhotoUrl(fac.image);

                    return (
                      <tr key={fac.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px] align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {fac.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 align-middle max-w-xs truncate">
                          {fac.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={fac.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium text-[11px] align-middle">
                          {fac.created_at
                            ? new Date(fac.created_at).toLocaleDateString('id-ID', {
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
                              onClick={() => handleOpenEditModal(fac)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                              title="Edit Fasilitas"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingFacility(fac)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Fasilitas"
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
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {searchQuery ? 'Tidak Ada Fasilitas yang Cocok' : 'Belum Ada Fasilitas Terdaftar'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan fasilitas dengan kata kunci "${searchQuery}".`
                    : 'Event ini belum memiliki fasilitas tambahan pada tabel event_facilities.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Fasilitas Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Create / Edit Facility */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingFacility ? 'Edit Fasilitas Event' : 'Tambah Fasilitas Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingFacility
                      ? 'Perbarui rincian fasilitas venue event ini'
                      : 'Tambahkan fasilitas baru untuk kenyamanan penonton'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Nama Fasilitas */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Nama Fasilitas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mushola, Parkir VIP, Toilet Bersih, Area Medis"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan lokasi atau ketentuan fasilitas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all resize-none"
                />
              </div>

              {/* Upload Foto / Ikon Fasilitas */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Foto / Ikon Fasilitas (Opsional)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative group w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute inset-0 bg-slate-950/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus gambar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imagePreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Format: JPG, PNG, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                </div>
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
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingFacility ? 'Simpan Perubahan' : 'Tambah Fasilitas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Facility */}
      {deletingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Fasilitas Ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus fasilitas{' '}
                <span className="font-extrabold text-slate-800">
                  &quot;{deletingFacility.name}&quot;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFacility(null)}
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
    </DashboardLayout>
  );
}
