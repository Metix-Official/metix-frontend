'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOwnerUsers,
  updateOwnerUser,
  OwnerUserItem,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Calendar,
  X,
  Eye,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  FilterX,
  CreditCard,
  Building,
  UserCheck,
  Pencil,
  Loader2,
  Lock,
  Save,
  RotateCcw,
} from 'lucide-react';

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  nik: string;
  city: string;
  password?: string;
}

export default function MasterUserPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  // Data State
  const [users, setUsers] = useState<OwnerUserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<OwnerUserItem | null>(null);

  // Quick Status Toggle State
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<OwnerUserItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'BUYER',
    status: 'ACTIVE',
    nik: '',
    city: '',
    password: '',
  });

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Users from Backend API
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchOwnerUsers({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      setUsers(res.users);
      setMeta(res.meta);
    } catch (err: any) {
      toast.error('Gagal Mengambil Data Master User', {
        description: err?.message || 'Terjadi kesalahan saat memuat data pengguna.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, currentPage, perPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data pengguna...', { id: 'refresh-users' });
    await loadUsers();
    toast.success('Data Master User berhasil diperbarui! 🔄', { id: 'refresh-users' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  // Status cycle: ACTIVE -> INACTIVE -> BLOCKED -> ACTIVE
  const getNextStatus = (currentStatus?: string): 'ACTIVE' | 'INACTIVE' | 'BLOCKED' => {
    const s = (currentStatus || '').toUpperCase();
    if (s === 'ACTIVE') return 'INACTIVE';
    if (s === 'INACTIVE') return 'BLOCKED';
    if (s === 'BLOCKED') return 'ACTIVE';
    return 'ACTIVE';
  };

  // Clickable Status Toggle Handler
  const handleToggleStatus = async (user: OwnerUserItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = getNextStatus(user.status);
    setStatusUpdatingId(user.id);

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    );

    const res = await updateOwnerUser(user.id, { status: nextStatus });
    if (res.success) {
      const labelMap: Record<string, string> = {
        ACTIVE: 'Active 🔵',
        INACTIVE: 'Inactive 🟡',
        BLOCKED: 'Blocked 🔴',
      };
      toast.success(
        `Status ${user.name || 'User'} diubah menjadi ${labelMap[nextStatus] || nextStatus}`
      );
    } else {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
      toast.error('Gagal Mengubah Status', { description: res.message });
    }
    setStatusUpdatingId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: OwnerUserItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'BUYER',
      status: user.status || 'ACTIVE',
      nik: user.nik || '',
      city: user.city || '',
      password: '',
    });
  };

  // Save Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.name.trim()) {
      toast.error('Nama Lengkap tidak boleh kosong');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email tidak boleh kosong');
      return;
    }

    setIsSavingEdit(true);

    const payload: Partial<OwnerUserItem> & { password?: string } = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
      role: editForm.role,
      status: editForm.status,
      nik: editForm.nik.trim() || null,
      city: editForm.city.trim() || null,
    };

    if (editForm.password && editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    const res = await updateOwnerUser(editingUser.id, payload);

    if (res.success) {
      toast.success('Data Pengguna Berhasil Diperbarui! 🎉');
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone || null,
                role: editForm.role,
                status: editForm.status,
                nik: editForm.nik || null,
                city: editForm.city || null,
              }
            : u
        )
      );
      setEditingUser(null);
    } else {
      toast.error('Gagal Memperbarui Pengguna', {
        description: res.message || 'Silakan periksa kembali input data Anda.',
      });
    }

    setIsSavingEdit(false);
  };

  // Format Date Helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Status Badge Component:
  // Active -> Biru (Blue)
  // Inactive -> Kuning (Yellow / Amber)
  // Blocked -> Merah (Red / Rose)
  const renderStatusBadge = (status?: string | null, isUpdating: boolean = false) => {
    const normalized = (status || '').toUpperCase();

    if (isUpdating) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
          <span>Menyimpan...</span>
        </span>
      );
    }

    if (normalized === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs group-hover/btn:bg-blue-100 transition-colors">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Active</span>
        </span>
      );
    }

    if (normalized === 'INACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs group-hover/btn:bg-amber-100 transition-colors">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Inactive</span>
        </span>
      );
    }

    if (normalized === 'BLOCKED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs group-hover/btn:bg-rose-100 transition-colors">
          <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Blocked</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {status || 'Unknown'}
      </span>
    );
  };

  // Role Badge Helper
  const renderRoleBadge = (role?: string) => {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            OWNER
          </span>
        );
      case 'EO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building className="w-3 h-3 text-emerald-600" />
            EO
          </span>
        );
      case 'SCANNER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            SCANNER
          </span>
        );
      case 'BUYER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200">
            <UserIcon className="w-3 h-3 text-sky-600" />
            BUYER
          </span>
        );
    }
  };

  const fromRecord = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const toRecord = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <DashboardLayout pageTitle="Master User Platform" activeNav="/dashboard/users">
      <div className="w-full space-y-6">
        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-white" /> Data Master
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Master User Platform
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl leading-relaxed">
                Kelola seluruh data pengguna platform Metix, termasuk akun Super Admin Owner, Event Organizer (EO), Pembeli (Buyer), dan Petugas Scanner. Klik status untuk mengubahnya secara instan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Controls: Search & Select Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            {/* Search Input: name & email */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, no. hp, NIK..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select Options: Role & Status & Reset */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Select Role */}
              <div className="w-[160px]">
                <Select
                  value={roleFilter}
                  onValueChange={(val) => {
                    setRoleFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                    <SelectValue placeholder="Semua Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="EO">Event Organizer</SelectItem>
                    <SelectItem value="BUYER">Buyer</SelectItem>
                    <SelectItem value="SCANNER">Scanner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select Status */}
              <div className="w-[160px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset Filter"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Master User */}
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-700 min-w-[950px]">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Kontak & NIK</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <span className="text-[10px] text-slate-400 font-normal lowercase">(klik utk ubah)</span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Kota / Domisili</th>
                      <th className="py-3.5 px-4">Bergabung</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u, index) => {
                      const photo = getPhotoUrl(u.photo_url || u.photo_path);
                      const initials = (u.name || u.email || 'US')
                        .trim()
                        .substring(0, 2)
                        .toUpperCase();
                      const rowNumber = (meta.current_page - 1) * meta.per_page + index + 1;
                      const nextStatus = getNextStatus(u.status);

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedUser(u)}
                        >
                          {/* Row Number */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                            {rowNumber}
                          </td>

                          {/* User Info (Photo + Name) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={u.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                  {initials}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 max-w-[220px]">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                  {u.name || 'Pengguna Metix'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact & NIK */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-bold text-slate-800 flex items-center gap-1 truncate">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                {u.phone || '-'}
                              </span>
                              <span className="text-slate-400 font-medium flex items-center gap-1 truncate">
                                <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                                {u.nik ? `NIK: ${u.nik}` : 'NIK: -'}
                              </span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            {renderRoleBadge(u.role)}
                          </td>

                          {/* Clickable Status Button:
                              Active (Biru) -> Inactive (Kuning) -> Blocked (Merah) -> Active (Biru) */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={statusUpdatingId === u.id}
                              onClick={(e) => handleToggleStatus(u, e)}
                              className="group/btn relative transition-transform active:scale-95 cursor-pointer focus:outline-none"
                              title={`Klik untuk ubah status ke ${nextStatus}`}
                            >
                              {renderStatusBadge(u.status, statusUpdatingId === u.id)}
                            </button>
                          </td>

                          {/* City / Province */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {u.city || u.province || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Registered Date */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(u.created_at)}</span>
                            </div>
                          </td>

                          {/* Action Buttons: Edit & Detail */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(u, e)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-blue-200 shadow-2xs"
                                title="Edit Pengguna"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Detail Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
                                title="Lihat Detail Profil"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs font-semibold text-slate-600">
                {/* Records Info & Per Page Selector */}
                <div className="flex items-center gap-3">
                  <span>
                    Menampilkan <strong className="text-slate-900">{fromRecord}</strong> -{' '}
                    <strong className="text-slate-900">{toRecord}</strong> dari{' '}
                    <strong className="text-slate-900">{meta.total}</strong> user
                  </span>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                    <span className="text-slate-500 text-[11px]">Baris:</span>
                    <Select
                      value={String(perPage)}
                      onValueChange={(val) => {
                        setPerPage(Number(val));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[72px] h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
                    Halaman {meta.current_page} dari {meta.last_page}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= meta.last_page || isLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tidak Ada Pengguna Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Tidak ada hasil yang cocok dengan kata kunci atau filter yang Anda pilih.'
                    : 'Belum ada data user yang tersimpan di sistem.'}
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua Filter</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL EDIT PENGGUNA (LEBAR & NATURAL) ================= */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0"
          onClick={() => !isSavingEdit && setEditingUser(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 text-white relative shrink-0">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingUser(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/30 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  <Pencil className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                    Edit Akun User #{editingUser.id}
                  </span>
                  <h3 className="text-lg font-black truncate">{editingUser.name || 'Pengguna'}</h3>
                  <p className="text-xs text-blue-100 truncate">{editingUser.email}</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-7 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nama lengkap pengguna"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Alamat Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="contoh@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  {/* Nomor Telepon */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="081234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  {/* NIK KTP */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      NIK KTP (16 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={editForm.nik}
                      onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                      placeholder="16 digit NIK"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  {/* Role User */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Role Hak Akses <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={editForm.role}
                      onValueChange={(val) => setEditForm({ ...editForm, role: val })}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUYER">Buyer (Pembeli Tiket)</SelectItem>
                        <SelectItem value="EO">Event Organizer (EO)</SelectItem>
                        <SelectItem value="SCANNER">Scanner (Staff Pintu Masuk)</SelectItem>
                        <SelectItem value="OWNER">Owner (Super Admin Platform)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status User */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Status Akun <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active (Aktif)</SelectItem>
                        <SelectItem value="INACTIVE">Inactive (Nonaktif)</SelectItem>
                        <SelectItem value="BLOCKED">Blocked (Diblokir)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Kota Domisili */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kota / Wilayah Domisili
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Contoh: Kota Medan / Jakarta Selatan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  {/* Password Baru (Opsional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Password Baru</span>
                      <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                    </label>
                    <input
                      type="password"
                      value={editForm.password || ''}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Kosongkan jika tidak diubah"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL USER ================= */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                {selectedUser.photo_url || selectedUser.photo_path ? (
                  <img
                    src={getPhotoUrl(selectedUser.photo_url || selectedUser.photo_path) || ''}
                    alt={selectedUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    {(selectedUser.name || 'US').substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {renderRoleBadge(selectedUser.role)}
                    {renderStatusBadge(selectedUser.status)}
                  </div>
                  <h3 className="text-lg font-black truncate">{selectedUser.name}</h3>
                  <p className="text-xs text-blue-100 truncate">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Modal Body: Information Details */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Account Details */}
              <div className="space-y-2">
                <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                  Informasi Akun
                </h5>
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-medium">User ID</span>
                    <p className="font-bold text-slate-900">#{selectedUser.id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Nomor Telepon</span>
                    <p className="font-bold text-slate-900">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">NIK KTP</span>
                    <p className="font-bold text-slate-900">{selectedUser.nik || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Terdaftar Sejak</span>
                    <p className="font-bold text-slate-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Profile Details (Buyer Profile) */}
              <div className="space-y-2">
                <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">
                  Profil & Domisili
                </h5>
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                    <p className="font-bold text-slate-900">
                      {selectedUser.gender === 'MALE'
                        ? 'Laki-Laki'
                        : selectedUser.gender === 'FEMALE'
                        ? 'Perempuan'
                        : selectedUser.gender || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Tanggal Lahir</span>
                    <p className="font-bold text-slate-900">{formatDate(selectedUser.date_of_birth)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Kota</span>
                    <p className="font-bold text-slate-900">{selectedUser.city || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Provinsi</span>
                    <p className="font-bold text-slate-900">{selectedUser.province || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Kode Pos</span>
                    <p className="font-bold text-slate-900">{selectedUser.postal_code || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Negara</span>
                    <p className="font-bold text-slate-900">{selectedUser.country || 'ID'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium">Alamat Lengkap</span>
                    <p className="font-bold text-slate-900">
                      {selectedUser.buyer_address || selectedUser.address || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const u = selectedUser;
                  setSelectedUser(null);
                  handleOpenEdit(u);
                }}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-200"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit User Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
