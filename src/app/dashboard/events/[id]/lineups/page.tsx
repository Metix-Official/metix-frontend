'use client';

import React, { useState, useEffect, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventLineupsList,
  fetchOrganizerEventDetail,
  createEventLineupApi,
  updateEventLineupApi,
  deleteEventLineupApi,
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
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  AlertTriangle,
  Sparkles,
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

  // Modal Create / Edit State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLineup, setEditingLineup] = useState<ApiEventLineupItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Delete State
  const [deletingLineup, setDeletingLineup] = useState<ApiEventLineupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingLineup(null);
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (item: ApiEventLineupItem) => {
    setEditingLineup(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
    });
    setImageFile(null);
    setImagePreview(item.image ? getPhotoUrl(item.image) : null);
    setIsFormModalOpen(true);
  };

  // Close Form Modal & Cleanup
  const handleCloseFormModal = () => {
    if (isSubmitting) return;
    setIsFormModalOpen(false);
    setEditingLineup(null);
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar', {
        description: 'Maksimal ukuran gambar foto performer adalah 20MB.',
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
        description: 'Nama pengisi acara / artis wajib diisi.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLineup) {
        // Edit Mode
        await updateEventLineupApi(eventId, editingLineup.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image: imageFile || undefined,
        });

        toast.success('Lineup Berhasil Diperbarui', {
          description: `Data pengisi acara "${formData.name.trim()}" telah diperbarui.`,
        });
      } else {
        // Create Mode
        await createEventLineupApi(eventId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image: imageFile,
        });

        toast.success('Lineup Berhasil Ditambahkan', {
          description: `Performer "${formData.name.trim()}" berhasil ditambahkan ke event.`,
        });
      }

      handleCloseFormModal();
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menyimpan Lineup', {
        description: err?.message || 'Terjadi kesalahan saat memproses data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingLineup) return;

    setIsDeleting(true);
    try {
      await deleteEventLineupApi(eventId, deletingLineup.id);
      toast.success('Lineup Berhasil Dihapus', {
        description: `Pengisi acara "${deletingLineup.name}" telah dihapus dari event.`,
      });
      setDeletingLineup(null);
      await loadData();
    } catch (err: any) {
      toast.error('Gagal Menghapus Lineup', {
        description: err?.message || 'Terjadi kesalahan saat menghapus data performer.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-purple-700 hover:border-purple-300 transition-colors shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Master Event</span>
          </Link>

          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-purple-700 hover:border-purple-300 transition-colors shadow-2xs inline-flex items-center gap-1.5"
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
              Kelola daftar artis, musisi, pembicara, dan pengisi acara yang tampil pada event ini beserta rincian jadwal/peran dan foto profil penampil.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Actions & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Lineups Pengisi Acara ({lineups.length})
              </h3>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-60">
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

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lineup</span>
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
          ) : filteredLineups.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Artis / Guest Star</th>
                    <th className="py-3.5 px-4">Peran / Keterangan</th>
                    <th className="py-3.5 px-4 text-center">Ditambahkan</th>
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLineups.map((lineup, idx) => {
                    const imgUrl = getPhotoUrl(lineup.image);

                    return (
                      <tr key={lineup.id || idx} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px] align-middle">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
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
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {lineup.name}
                              </span>
                              <span className="text-[10px] text-purple-600 font-semibold inline-flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Guest Star
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 align-middle max-w-xs truncate">
                          {lineup.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium text-[11px] align-middle">
                          {lineup.created_at
                            ? new Date(lineup.created_at).toLocaleDateString('id-ID', {
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
                              onClick={() => handleOpenEditModal(lineup)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                              title="Edit Lineup"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingLineup(lineup)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="Hapus Lineup"
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
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto">
                <Music className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {searchQuery ? 'Tidak Ada Lineup yang Cocok' : 'Belum Ada Lineup Terdaftar'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan performer dengan kata kunci "${searchQuery}".`
                    : 'Event ini belum memiliki data pengisi acara pada tabel event_lineups.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Lineup Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Create / Edit Lineup */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                  <Music className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingLineup ? 'Edit Lineup Event' : 'Tambah Lineup Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingLineup
                      ? 'Perbarui profil penampil atau jadwal acara'
                      : 'Tambahkan artis, musisi, atau bintang tamu baru'}
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
              {/* Nama Performer */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Nama Artis / Performer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sheila On 7, Tulus, Raisa, DJ Whisnu Santika"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all"
                />
              </div>

              {/* Peran / Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Peran / Jadwal / Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Guest Star Utama - Main Stage (Pukul 20:30 WIB)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 transition-all resize-none"
                />
              </div>

              {/* Upload Foto Performer */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">
                  Foto Profil Performer (Opsional)
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
                    <div className="relative group w-16 h-16 rounded-xl border border-purple-200 overflow-hidden shrink-0">
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
                    <div className="w-16 h-16 rounded-xl bg-purple-50 border border-dashed border-purple-300 flex items-center justify-center text-purple-400 shrink-0">
                      <User className="w-6 h-6" />
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
                      Format: JPG, PNG, WEBP (Maksimal 20MB)
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
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLineup ? 'Simpan Perubahan' : 'Tambah Lineup'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Lineup */}
      {deletingLineup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Lineup Ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus pengisi acara{' '}
                <span className="font-extrabold text-slate-800">
                  &quot;{deletingLineup.name}&quot;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLineup(null)}
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
