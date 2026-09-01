'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOwnerOrganizers,
  approveOwnerOrganizer,
  rejectOwnerOrganizer,
  fetchOwnerUsers,
  approveMitraUser,
  rejectMitraUser,
  updateUserRole,
  ApiOrganizerProfile,
  UserProfile,
  getPhotoUrl,
} from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
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
  Building2,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  AlertCircle,
  X,
  Loader2,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<'organizers' | 'users'>('organizers');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Organizers List State
  const [organizers, setOrganizers] = useState<ApiOrganizerProfile[]>([]);
  const [organizerMeta, setOrganizerMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  }>({ current_page: 1, last_page: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  // Reject Modal State
  const [rejectingProfile, setRejectingProfile] = useState<ApiOrganizerProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Users List State
  const [users, setUsers] = useState<UserProfile[]>([]);

  const loadOrganizers = async () => {
    setIsLoading(true);
    const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
    const res = await fetchOwnerOrganizers({
      search: searchQuery,
      status: filterStatus,
      page: currentPage,
    });
    setOrganizers(res.organizers);
    if (res.meta) {
      setOrganizerMeta({
        current_page: res.meta.current_page,
        last_page: res.meta.last_page,
        total: res.meta.total,
      });
    }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await fetchOwnerUsers({ search: searchQuery });
    setUsers(data.users);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'organizers') {
      loadOrganizers();
    } else {
      loadUsers();
    }
  }, [activeTab, searchQuery, statusFilter, currentPage]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data...', { id: 'refresh-data' });
    if (activeTab === 'organizers') {
      await loadOrganizers();
    } else {
      await loadUsers();
    }
    toast.success('Data berhasil diperbarui! 🔄', { id: 'refresh-data' });
  };

  // 1. Approve Organizer Profile via POST /v1/owner/organizers/{id}/approve
  const handleApproveOrganizer = async (org: ApiOrganizerProfile) => {
    if (!org.id) return;
    setUpdatingId(org.id);
    try {
      await approveOwnerOrganizer(org.id);
      toast.success('Profil Organisasi Disetujui! 🎉', {
        description: `Organisasi "${org.organization_name}" sekarang berstatus ACTIVE dan siap merilis event.`,
      });
      loadOrganizers();
    } catch (err: any) {
      toast.error('Gagal Menyetujui Organisasi', {
        description: err?.message || 'Terjadi kesalahan saat menyetujui organisasi.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // 2. Reject Organizer Profile via POST /v1/owner/organizers/{id}/reject
  const handleConfirmRejectOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProfile || !rejectingProfile.id) return;

    if (!rejectionReason.trim()) {
      toast.error('Alasan Penolakan Wajib Diisi');
      return;
    }

    setIsRejecting(true);
    try {
      await rejectOwnerOrganizer(rejectingProfile.id, rejectionReason.trim());
      toast.success('Pengajuan Organisasi Ditolak', {
        description: `Pengajuan "${rejectingProfile.organization_name}" telah ditolak dengan alasan: "${rejectionReason}".`,
      });
      setRejectingProfile(null);
      setRejectionReason('');
      loadOrganizers();
    } catch (err: any) {
      toast.error('Gagal Menolak Organisasi', {
        description: err?.message || 'Terjadi kesalahan saat menolak organisasi.',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // User tab actions
  const handleApproveUser = async (userId: number, userName: string) => {
    setUpdatingId(userId);
    const success = await approveMitraUser(userId);
    if (success) {
      toast.success('Mitra Disetujui!', {
        description: `Pengajuan Mitra ${userName} berhasil disetujui sebagai Event Organizer.`,
      });
      loadUsers();
    }
    setUpdatingId(null);
  };

  const handleRejectUser = async (userId: number, userName: string) => {
    setUpdatingId(userId);
    const success = await rejectMitraUser(userId);
    if (success) {
      toast.success('Mitra Ditolak', {
        description: `Pengajuan Mitra ${userName} telah ditolak.`,
      });
      loadUsers();
    }
    setUpdatingId(null);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active (Terverifikasi)
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected (Ditolak)
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" /> Inactive
          </span>
        );
    }
  };

  return (
    <DashboardLayout pageTitle="Kelola Akun & Organisasi EO" activeNav="Kelola Semua Akun">
      <div className="w-full space-y-6">
        {/* Banner Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-white" /> Platform Owner Verification Console
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Kelola Profil Organisasi EO & Akun Pengguna
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                Verifikasi dan setujui (Approve / Reject) profil organisasi mitra Event Organizer (EO) yang mendaftar di platform Metix.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Data API
            </button>
          </div>
        </div>

        {/* Tab Switcher: Organisasi vs Users */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setActiveTab('organizers')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'organizers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Persetujuan Profil Organisasi ({organizerMeta.total})</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Semua User Account ({users.length})</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-3">
              {activeTab === 'organizers' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="ACTIVE">Active (Approved)</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'organizers'
                      ? 'Cari nama organisasi, email, atau HP...'
                      : 'Cari nama atau email pengguna...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ================= TAB 1: ORGANIZERS APPROVAL LIST ================= */}
          {activeTab === 'organizers' && (
            <div className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-80 w-full rounded-2xl" />
              ) : organizers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-3.5 px-4 rounded-l-xl">Organisasi & Logo</th>
                        <th className="py-3.5 px-4">Kontak Resmi</th>
                        <th className="py-3.5 px-4">Alamat & Deskripsi</th>
                        <th className="py-3.5 px-4">Status Persetujuan</th>
                        <th className="py-3.5 px-4 text-right rounded-r-xl">Aksi Approvals API</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {organizers.map((org) => {
                        const logoUrl = org.logo ? getPhotoUrl(org.logo) : null;

                        return (
                          <tr key={org.id} className="hover:bg-blue-50/30 transition-colors group">
                            {/* Logo & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-2xs">
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt={org.organization_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-tr from-blue-700 to-indigo-700">
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-slate-900 text-sm group-hover:text-blue-700 transition-colors truncate">
                                    {org.organization_name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-semibold">
                                    ID: #{org.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col text-[11px] space-y-0.5">
                                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  {org.phone || '-'}
                                </span>
                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {org.email || '-'}
                                </span>
                              </div>
                            </td>

                            {/* Address & Description */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-start gap-1 font-semibold text-slate-800 line-clamp-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  <span>{org.address || 'Alamat belum diisi'}</span>
                                </div>
                                <div className="text-slate-500 font-medium line-clamp-1">
                                  {org.description || 'Tanpa deskripsi'}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {getStatusBadge(org.status)}
                                {org.status === 'REJECTED' && org.rejection_reason && (
                                  <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-200 line-clamp-2">
                                    Alasan: {org.rejection_reason}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Action Buttons: Approve & Reject */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={updatingId === org.id || org.status === 'ACTIVE'}
                                  onClick={() => handleApproveOrganizer(org)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Approve / Setujui Profil Organisasi"
                                >
                                  {updatingId === org.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve</span>
                                </button>

                                <button
                                  disabled={updatingId === org.id || org.status === 'REJECTED'}
                                  onClick={() => {
                                    setRejectingProfile(org);
                                    setRejectionReason('');
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Reject / Tolak Profil Organisasi"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
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
                <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1 bg-slate-50 rounded-2xl border border-slate-200">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Tidak ada data profil organisasi yang ditemukan.</p>
                </div>
              )}

              {/* Pagination info */}
              {organizerMeta.last_page > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <span>Halaman {organizerMeta.current_page} dari {organizerMeta.last_page}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentPage >= organizerMeta.last_page}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: USERS ACCOUNT LIST ================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-80 w-full rounded-2xl" />
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-3.5 px-4 rounded-l-xl">User Profile</th>
                        <th className="py-3.5 px-4">Kontak & NIK</th>
                        <th className="py-3.5 px-4">Role System</th>
                        <th className="py-3.5 px-4">Status Mitra</th>
                        <th className="py-3.5 px-4 text-right rounded-r-xl">Tindakan API</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const photo = getPhotoUrl(u.profile_photo_url || u.photo);
                        const initials = (u.name || u.email).substring(0, 2).toUpperCase();

                        return (
                          <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={u.name}
                                    className="w-9 h-9 rounded-xl object-cover border border-blue-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                                    {initials}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                                    {u.name || 'Pengguna Metix'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-col text-[11px]">
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" /> {u.phone || '081234567890'}
                                </span>
                                <span className="text-slate-400 font-medium">
                                  NIK: {u.nik || '3171023901920001'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <BadgeCheck className="w-3 h-3 text-blue-600 shrink-0" /> {getUserRole(u)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {u.mitra_status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                                </span>
                              ) : u.mitra_status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                  Pending
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Standard User</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {u.mitra_status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    disabled={updatingId === u.id}
                                    onClick={() => handleApproveUser(u.id, u.name)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    disabled={updatingId === u.id}
                                    onClick={() => handleRejectUser(u.id, u.name)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Terverifikasi</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1 bg-slate-50 rounded-2xl border border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Tidak ada data pengguna yang cocok.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= REJECT ORGANIZER REASON MODAL ================= */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-rose-600 p-6 text-white relative">
              <button
                onClick={() => setRejectingProfile(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1 font-extrabold text-xs uppercase tracking-wider text-rose-200">
                <ShieldAlert className="w-4 h-4" /> Tolak Pengajuan Organisasi
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {rejectingProfile.organization_name}
              </h3>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmRejectOrganizer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Alasan Penolakan (Wajib Diisi) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan spesifik penolakan pengajuan (contoh: Dokumen legalitas/KTP belum sesuai, logo kurang jelas, dll)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingProfile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menolak...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Konfirmasi Tolak
                    </>
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
