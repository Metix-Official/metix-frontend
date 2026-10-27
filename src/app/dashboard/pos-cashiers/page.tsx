'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/components/ui/sonner';
import {
  fetchEoPosCashiers,
  createEoPosCashier,
  updateEoPosCashier,
  deleteEoPosCashier,
  fetchMyEvents,
  ApiPosCashierItem,
  ApiEvent,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
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
  Ticket,
  DollarSign,
  TrendingUp,
  Receipt,
  UserPlus,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function PosCashiersPage() {
  const [cashiers, setCashiers] = useState<ApiPosCashierItem[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<ApiPosCashierItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    event_id: '',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deletingCashier, setDeletingCashier] = useState<ApiPosCashierItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const [cashierList, myEvts] = await Promise.all([
        fetchEoPosCashiers(),
        fetchMyEvents().catch(() => null),
      ]);
      setCashiers(cashierList);
      setEvents(myEvts?.events || []);
    } catch (err: any) {
      toast.error('Gagal Memuat Data Kasir POS', {
        description: err?.message || 'Terjadi kesalahan koneksi.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCashiers = cashiers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.event_title && c.event_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Aggregate Metrics
  const totalTickets = cashiers.reduce((acc, c) => acc + (c.tickets_sold || 0), 0);
  const totalRevenue = cashiers.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
  const activeCashiers = cashiers.filter((c) => (c.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

  const openAddModal = () => {
    setEditingCashier(null);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      event_id: events.length > 0 ? String(events[0].id) : '',
      status: 'ACTIVE',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cashier: ApiPosCashierItem) => {
    setEditingCashier(cashier);
    setShowPassword(false);
    setFormData({
      name: cashier.name || '',
      email: cashier.email || '',
      password: '',
      phone: cashier.phone || '',
      event_id: cashier.event_id ? String(cashier.event_id) : (events.length > 0 ? String(events[0].id) : ''),
      status: (cashier.status || 'ACTIVE').toUpperCase(),
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nama lengkap dan email login wajib diisi.');
      return;
    }

    if (!editingCashier && !formData.password) {
      setFormError('Kata sandi wajib diisi untuk pendaftaran kasir baru.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!formData.event_id) {
      setFormError('Pilih event penugasan untuk kasir ini.');
      return;
    }

    try {
      setIsSubmitting(true);
      const rawPhone = formData.phone.trim();
      const sanitizedPhone = rawPhone && !['-', '—', 'none', 'null'].includes(rawPhone) ? rawPhone : undefined;
      const eventIdNum = Number(formData.event_id);

      if (editingCashier) {
        await updateEoPosCashier(editingCashier.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password || undefined,
          phone: sanitizedPhone,
          event_id: eventIdNum,
          status: formData.status,
        });
        toast.success('Data Admin Kasir POS Berhasil Diperbarui! 🎉', {
          description: `Akun kasir ${formData.name} berhasil disimpan.`,
        });
      } else {
        await createEoPosCashier({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: sanitizedPhone,
          event_id: eventIdNum,
          status: formData.status,
        });
        toast.success('Admin Kasir POS Berhasil Ditambahkan! 🎉', {
          description: `Akun kasir ${formData.name} kini siap login ke terminal POS.`,
        });
      }

      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan saat menyimpan data kasir.';
      setFormError(msg);
      toast.error('Gagal Menyimpan Admin Kasir POS', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCashier) return;
    const targetId = deletingCashier.id;
    const targetName = deletingCashier.name;

    try {
      setIsDeleting(true);
      await deleteEoPosCashier(targetId);
      setCashiers((prev) => prev.filter((c) => c.id !== targetId));
      toast.success('Admin Kasir POS Berhasil Dihapus! 🗑️', {
        description: `Penugasan untuk ${targetName} telah dilepas dari event.`,
      });
      setDeletingCashier(null);
    } catch (err: any) {
      toast.error('Gagal Menghapus Kasir', {
        description: err.message || 'Terjadi kesalahan saat menghapus data.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Kelola Admin Kasir Offline (POS)" activeNav="Kelola Admin POS">
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/15 border border-blue-600/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <CreditCard className="w-3.5 h-3.5 text-amber-300" />
              <span>Manajemen Kasir Box-Office</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Kelola Admin Kasir Offline (POS)
            </h2>
            <p className="text-xs text-blue-100 font-medium leading-relaxed">
              Daftarkan akun staf kasir untuk penjualan tiket on-the-spot di venue, tentukan penugasan event, dan pantau hasil penjualan tiket masing-masing admin secara transparan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-900 text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-blue-700" />
              <span>Tambah Admin POS</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Admin Kasir
            </span>
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-2xl font-black text-slate-900">{cashiers.length}</h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Petugas kasir terdaftar</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Kasir Aktif
            </span>
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-2xl font-black text-emerald-600">{activeCashiers}</h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Memiliki izin akses POS</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Tiket Terjual (POS)
            </span>
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-2xl font-black text-indigo-700">
                {totalTickets.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Lembar tiket on-the-spot</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Omset Kasir POS
            </span>
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xl font-black text-slate-900 truncate">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">QRIS DOKU & Tunai (Cash)</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kasir berdasarkan nama, email, no HP, atau event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table of Cashiers */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredCashiers.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-black text-slate-800">
                  {searchQuery ? 'Kasir Tidak Ditemukan' : 'Belum Ada Admin Kasir POS'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {searchQuery
                    ? `Tidak ada hasil untuk pencarian "${searchQuery}".`
                    : 'Tambahkan akun admin kasir POS untuk mulai melayani penjualan tiket di venue acara.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Kasir Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Admin Kasir</th>
                    <th className="py-3.5 px-4">Kontak</th>
                    <th className="py-3.5 px-4">Penugasan Event</th>
                    <th className="py-3.5 px-4">Penjualan Tiket</th>
                    <th className="py-3.5 px-4">Total Omset</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right sm:pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCashiers.map((cashier, idx) => {
                    const isActive = (cashier.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                    return (
                      <tr
                        key={cashier.id || idx}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Admin Name & Email */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-600/20 shrink-0">
                              {(cashier.name || 'POS').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[170px] sm:max-w-[220px]">
                                  {cashier.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  POS
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                                {cashier.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone Contact */}
                        <td className="py-4 px-4">
                          {cashier.phone && cashier.phone !== '-' ? (
                            <a
                              href={`https://wa.me/${cashier.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-semibold text-xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{cashier.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>

                        {/* Event Assignment */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 max-w-[220px]">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                              <Calendar className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-slate-800 text-xs truncate">
                              {cashier.event_title || 'Semua Event'}
                            </span>
                          </div>
                        </td>

                        {/* Tickets Sold */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-slate-900 text-sm">
                                {(cashier.tickets_sold || 0).toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">Tiket</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {cashier.orders_count || 0} Transaksi
                            </p>
                          </div>
                        </td>

                        {/* Total Revenue */}
                        <td className="py-4 px-4">
                          <span className="font-black text-slate-900 text-xs">
                            Rp {(cashier.total_revenue || 0).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right sm:pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(cashier)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Kasir"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCashier(cashier)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Kasir"
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
      </div>

      {/* MODAL TAMBAH / EDIT ADMIN KASIR POS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {editingCashier ? 'Edit Data Admin Kasir POS' : 'Tambah Admin Kasir POS'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {editingCashier
                      ? 'Perbarui detail profil, kata sandi, atau event penugasan kasir.'
                      : 'Buat akun login kasir untuk melayani penjualan tiket di venue.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 text-xs shadow-xs animate-in zoom-in-95 duration-200">
                <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-black text-rose-950 block text-xs">Peringatan Validasi:</span>
                  <p className="text-[11.5px] font-semibold text-rose-800 leading-relaxed">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Kasir *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Admin POS 1 / Siti Rahma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-semibold"
                  required
                />
              </div>

              {/* Email Login */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Login Kasir *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="kasir1@event.com"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (formError) setFormError(null); }}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${formError?.toLowerCase().includes("email") ? "border-rose-400 bg-rose-50/50 text-rose-950 ring-2 ring-rose-400/20" : "border-slate-200 bg-slate-50"} focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-semibold`}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Email ini digunakan petugas kasir untuk login ke sistem Metix.
                </p>
              </div>

              {/* Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi {editingCashier ? '(Opsional - kosongkan jika tidak ingin ganti)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingCashier ? 'Masukkan password baru...' : 'Minimal 6 karakter'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-semibold font-mono"
                    minLength={editingCashier && !formData.password ? undefined : 6}
                    required={!editingCashier}
                  />
                </div>
              </div>

              {/* Nomor Telepon / WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Telepon / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={formData.phone}
                    onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); if (formError) setFormError(null); }}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border ${formError?.toLowerCase().includes("telepon") || formError?.toLowerCase().includes("whatsapp") || formError?.toLowerCase().includes("phone") ? "border-rose-400 bg-rose-50/50 text-rose-950 ring-2 ring-rose-400/20" : "border-slate-200 bg-slate-50"} focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-semibold`}
                  />
                </div>
              </div>

              {/* Penugasan Event Penjualan Offline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Penugasan Event Penjualan Offline *
                </label>
                <Select
                  value={formData.event_id}
                  onValueChange={(val) => setFormData({ ...formData, event_id: val })}
                >
                  <SelectTrigger className="w-full h-11 text-xs rounded-xl border-slate-200 bg-slate-50 font-bold">
                    <SelectValue placeholder="-- Pilih Event yang Ditugaskan --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400 uppercase font-black">
                        Daftar Event Anda
                      </SelectLabel>
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={String(ev.id)} className="text-xs font-bold py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Ticket className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{ev.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saat kasir login, kasir hanya dapat melayani penjualan tiket untuk event yang dipilih.
                </p>
              </div>

              {/* Status Akun */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Akun Kasir
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formData.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aktif (Bisa Login)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'INACTIVE' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formData.status === 'INACTIVE'
                        ? 'bg-slate-200 border-slate-300 text-slate-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-black transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : (editingCashier ? 'Simpan Perubahan' : 'Daftarkan Kasir')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS KASIR */}
      {deletingCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Lepas Penugasan Kasir?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin melepas akun <strong>{deletingCashier.name}</strong> ({deletingCashier.email}) dari event? Akun ini tidak akan dapat mengakses terminal POS lagi.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Tiket Terjual:</span>
                <span className="font-black text-slate-800">{deletingCashier.tickets_sold || 0} Tiket</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Omset:</span>
                <span className="font-black text-slate-800">Rp {(deletingCashier.total_revenue || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCashier(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? 'Melepas...' : 'Ya, Lepaskan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
