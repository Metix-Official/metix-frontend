'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/components/ui/sonner';
import {
  fetchEoAdmins,
  createEoAdmin,
  updateEoAdmin,
  deleteEoAdmin,
  fetchMyEvents,
  EoAdminUser,
  ApiEvent,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Mail,
  Phone,
  Trash2,
  Edit2,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Calendar,
  Globe,
  Ticket,
} from 'lucide-react';

export default function EoAdminsPage() {
  const [admins, setAdmins] = useState<EoAdminUser[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<EoAdminUser | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    scan_quota: '200',
    event_id: '',
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deletingAdmin, setDeletingAdmin] = useState<EoAdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadAdmins() {
    setIsLoading(true);
    const [list, myEvts] = await Promise.all([
      fetchEoAdmins(),
      fetchMyEvents().catch(() => null),
    ]);
    setAdmins(list);
    setEvents(myEvts?.events || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone && a.phone.includes(searchQuery))
  );

  const openAddModal = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      scan_quota: '200',
      event_id: events[0]?.id ? String(events[0].id) : 'all',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin: EoAdminUser) => {
    setEditingAdmin(admin);
    const matchedEvt = events.find(
      (ev) => String(ev.id) === String(admin.event_id) || (admin.event_title && ev.title.trim().toLowerCase() === admin.event_title.trim().toLowerCase())
    );
    const selectedEventId = matchedEvt ? String(matchedEvt.id) : (admin.event_id ? String(admin.event_id) : 'all');

    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      scan_quota: admin.scan_quota !== null && admin.scan_quota !== undefined ? String(admin.scan_quota) : '200',
      event_id: selectedEventId,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nama dan email wajib diisi.');
      return;
    }

    if (!editingAdmin && !formData.password) {
      setFormError('Password wajib diisi untuk pendaftaran akun baru.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }

    try {
      setIsSubmitting(true);
      const quotaNum = formData.scan_quota ? parseInt(formData.scan_quota, 10) : 200;
      const selectedEvt = events.find((ev) => String(ev.id) === formData.event_id);
      const eventIdNum = formData.event_id && formData.event_id !== 'all' ? Number(formData.event_id) : null;
      const eventTitleStr = selectedEvt?.title || (formData.event_id === 'all' ? 'Semua Event (Global)' : undefined);

      if (editingAdmin) {
        await updateEoAdmin(editingAdmin.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password || undefined,
          phone: formData.phone.trim() || undefined,
          scan_quota: quotaNum,
          event_id: eventIdNum,
          event_title: eventTitleStr,
        });
      } else {
        await createEoAdmin({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          scan_quota: quotaNum,
          event_id: eventIdNum,
          event_title: eventTitleStr,
        });
        toast.success(editingAdmin ? 'Data Staff Berhasil Diperbarui! 🎉' : 'Staff Scanner Berhasil Ditambahkan! 🎉', {
          description: `Akun ${formData.name} kini terdaftar di database server.`,
        });
      }
      setIsAddModalOpen(false);
      await loadAdmins();
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan saat menyimpan data admin.';
      setFormError(msg);
      toast.error('Gagal Menyimpan Staff Scanner', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    try {
      setIsDeleting(true);
      await deleteEoAdmin(deletingAdmin.id);
      toast.success('Staff Admin Berhasil Dihapus! 🗑️');
      setDeletingAdmin(null);
      await loadAdmins();
    } catch (err: any) {
      toast.error('Gagal Menghapus Staff', { description: err.message || 'Gagal menghapus admin.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Kelola Admin Scan QR" activeNav="Kelola Admin Scan">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-4 sm:p-5 shadow-lg shadow-blue-700/15 border border-blue-600/30">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              <ShieldCheck className="w-3 h-3 text-blue-200" /> Tim Gatekeeper Event
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight">
              Manajemen Staff Admin Scanner
            </h2>
            <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
              Daftarkan dan kelola akun petugas yang bertugas melakukan scan QR Code pada pintu masuk event Anda. Staff hanya memiliki akses ke modul Check-in Scanner.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-blue-700" /> Tambah Staff Scanner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search & Counter Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 px-2.5 py-1.5 bg-slate-100 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Total Staff: <strong>{admins.length}</strong> Akun</span>
          </div>
        </div>

        {/* Admins List Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-10 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {searchQuery ? 'Staff Scanner Tidak Ditemukan' : 'Belum Ada Staff Admin Scanner'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian lain.'
                  : 'Klik tombol "Tambah Staff Scanner" untuk membuatkan akun bagi petugas pintu masuk event Anda.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={openAddModal}
                  className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Daftarkan Staff Scanner
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Nama & Email</th>
                    <th className="px-3.5 py-2.5">Kontak / Telepon</th>
                    <th className="px-3.5 py-2.5">Status & Kuota Scan</th>
                    <th className="px-3.5 py-2.5">Penugasan Event</th>
                    <th className="px-3.5 py-2.5">Hak Akses Role</th>
                    <th className="px-3.5 py-2.5">Tanggal Buat</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                            {admin.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{admin.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {admin.phone ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-700 text-xs">
                            <Phone className="w-3 h-3 text-slate-400" /> {admin.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {(() => {
                          const count = admin.scan_count || 0;
                          const quota = admin.scan_quota;
                          const hasQuota = quota !== null && quota !== undefined && quota > 0;
                          const pct = hasQuota ? Math.min(100, Math.round((count / quota) * 100)) : 0;
                          return (
                            <div className="space-y-1 max-w-[130px]">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                                <span>{count} {hasQuota ? `/ ${quota}` : ''} Scan</span>
                                {hasQuota && <span className="text-[9px] text-blue-600 font-extrabold">{pct}%</span>}
                              </div>
                              {hasQuota ? (
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Tanpa Batas
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 max-w-[160px] truncate" title={admin.event_title || 'Semua Event'}>
                          <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{admin.event_title || 'Semua Event'}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <QrCode className="w-3 h-3" /> Staff Scanner
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 text-[10px]">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Baru saja'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data Admin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingAdmin(admin)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Akun Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAdmin ? 'Edit Staff Scanner' : 'Daftarkan Staff Scanner Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingAdmin ? 'Perbarui informasi akun staff' : 'Isi formulir pendaftaran akun'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Staff <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: scanner.gate1@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {editingAdmin ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'} {!editingAdmin && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={editingAdmin ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                    minLength={editingAdmin ? undefined : 6}
                    required={!editingAdmin}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Penugasan Event Gate Scanner <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Gate Access
                  </span>
                </label>

                <Select
                  value={formData.event_id || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, event_id: value })}
                >
                  <SelectTrigger className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-xs sm:text-sm text-slate-800 cursor-pointer shadow-2xs">
                    <SelectValue placeholder="Pilih event yang dijaga..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectGroup>
                      <SelectItem
                        value="all"
                        textValue="🌐 Semua Event EO (Akses Penuh Seluruh Gate)"
                        className="py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">Semua Event EO</span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                Akses Penuh
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal">
                              Dapat scan tiket di seluruh event & gate aktif organisasi
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectGroup>

                    {events.length > 0 && (
                      <>
                        <SelectSeparator className="my-1" />
                        <SelectGroup>
                          <SelectLabel className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-3 py-1">
                            Pilih Event Tertentu ({events.length})
                          </SelectLabel>
                          {events.map((ev) => {
                            const isPublished = ev.status?.toLowerCase() === 'published';
                            return (
                              <SelectItem
                                key={ev.id}
                                value={String(ev.id)}
                                textValue={`🎫 ${ev.title} ${ev.status ? `(${ev.status})` : ''}`}
                                className="py-2"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                      isPublished
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <Ticket className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col text-left overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 text-xs truncate max-w-[200px] sm:max-w-[260px]">
                                        {ev.title}
                                      </span>
                                      {ev.status && (
                                        <span
                                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                            isPublished
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {ev.status}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                      {ev.start_at && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-400" />
                                          {new Date(ev.start_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </span>
                                      )}
                                      {(ev.venue_name || ev.city) && (
                                        <span className="truncate max-w-[150px]">
                                          • {ev.venue_name || ev.city}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {/* Status Penugasan Indicator Card */}
                {formData.event_id === 'all' || !formData.event_id ? (
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-indigo-900">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold">Akses Seluruh Event:</span> Staff dapat melakukan validasi barcode pada gate mana pun di semua event aktif Anda.
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-950">
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold">Akses Terkunci Spesifik:</span> Staff hanya diizinkan memvalidasi tiket untuk acara yang telah ditugaskan.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Batas Kuota Scan Tiket (Default: 200)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 200"
                  value={formData.scan_quota}
                  onChange={(e) => setFormData({ ...formData, scan_quota: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all font-mono font-bold"
                  min={1}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    'Memproses...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingAdmin ? 'Simpan Perubahan' : 'Daftarkan Staff'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun staff <strong>{deletingAdmin.name}</strong> ({deletingAdmin.email})? Akun ini tidak akan dapat mengakses scanner lagi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingAdmin(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
