'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEoAdmins,
  createEoAdmin,
  updateEoAdmin,
  deleteEoAdmin,
  EoAdminUser,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
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
} from 'lucide-react';

export default function EoAdminsPage() {
  const [admins, setAdmins] = useState<EoAdminUser[]>([]);
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
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deletingAdmin, setDeletingAdmin] = useState<EoAdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadAdmins() {
    setIsLoading(true);
    const list = await fetchEoAdmins();
    setAdmins(list);
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
    setFormData({ name: '', email: '', password: '', phone: '' });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin: EoAdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
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
      if (editingAdmin) {
        await updateEoAdmin(editingAdmin.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password || undefined,
          phone: formData.phone.trim() || undefined,
        });
      } else {
        await createEoAdmin({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        });
      }
      setIsAddModalOpen(false);
      await loadAdmins();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    try {
      setIsDeleting(true);
      await deleteEoAdmin(deletingAdmin.id);
      setDeletingAdmin(null);
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Kelola Admin Scan QR" activeNav="Kelola Admin Scan">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-indigo-900/30">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Tim Gatekeeper Event
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Manajemen Staff Admin Scanner
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Daftarkan dan kelola akun petugas yang bertugas melakukan scan QR Code pada pintu masuk event Anda. Staff hanya memiliki akses ke modul Check-in Scanner.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-2.5 shadow-xl shadow-indigo-950/40 transition-all cursor-pointer shrink-0 hover:scale-105"
          >
            <Plus className="w-5 h-5" /> Tambah Staff Scanner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Search & Counter Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 px-3 py-2 bg-slate-100 rounded-xl">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Total Staff: <strong>{admins.length}</strong> Akun</span>
          </div>
        </div>

        {/* Admins List Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
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
                  className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Daftarkan Staff Scanner
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200/80 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama & Email</th>
                    <th className="px-6 py-4">Kontak / Telepon</th>
                    <th className="px-6 py-4">Hak Akses Role</th>
                    <th className="px-6 py-4">Tanggal Buat</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                            {admin.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {admin.phone ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {admin.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <QrCode className="w-3.5 h-3.5" /> Staff Scanner
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Baru saja'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Data Admin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingAdmin(admin)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Akun Admin"
                          >
                            <Trash2 className="w-4 h-4" />
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
