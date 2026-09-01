'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchOwnerUsers, approveMitraUser, rejectMitraUser, updateUserRole, UserProfile, getPhotoUrl } from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Search, CheckCircle2, XCircle, ShieldCheck, UserCheck, BadgeCheck, Mail, Phone, RefreshCw, UserPlus, UserMinus, ChevronDown } from 'lucide-react';

export default function UserManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchOwnerUsers({ search: searchQuery });
    setUsers(data.users);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleApprove = async (userId: number, userName: string) => {
    setUpdatingUserId(userId);
    const success = await approveMitraUser(userId);
    if (success) {
      setActionSuccess(`Pengajuan Mitra ${userName} berhasil disetujui sebagai Event Organizer!`);
      setTimeout(() => setActionSuccess(null), 3500);
      loadData();
    }
    setUpdatingUserId(null);
  };

  const handleReject = async (userId: number, userName: string) => {
    setUpdatingUserId(userId);
    const success = await rejectMitraUser(userId);
    if (success) {
      setActionSuccess(`Pengajuan Mitra ${userName} telah ditolak.`);
      setTimeout(() => setActionSuccess(null), 3500);
      loadData();
    }
    setUpdatingUserId(null);
  };

  const handleRoleChange = async (userId: number, userName: string, newRole: 'mitra' | 'pembeli') => {
    setUpdatingUserId(userId);
    const success = await updateUserRole(userId, newRole);
    if (success) {
      const roleText = newRole === 'mitra' ? 'Event Organizer (EO)' : 'Pembeli Tiket';
      setActionSuccess(`Role ${userName} berhasil diperbarui menjadi ${roleText}!`);
      setTimeout(() => setActionSuccess(null), 3500);
      loadData();
    }
    setUpdatingUserId(null);
  };


  const getUserRoleBadge = (u: UserProfile) => {
    const role = getUserRole(u);
    if (role === ROLES.OWNER) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
          <ShieldCheck className="w-3 h-3 text-purple-600 shrink-0" /> Super Admin (Owner)
        </span>
      );
    }
    if (role === ROLES.EO) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <BadgeCheck className="w-3 h-3 text-blue-600 shrink-0" /> Event Organizer (EO)
        </span>
      );
    }
    if (role === ROLES.SCANNER) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          <BadgeCheck className="w-3 h-3 text-amber-600 shrink-0" /> Admin Scanner Staff
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
        <UserCheck className="w-3 h-3 text-slate-500 shrink-0" /> Pembeli Tiket (Buyer)
      </span>
    );
  };

  return (
    <DashboardLayout pageTitle="Kelola Semua Akun & Mitra" activeNav="Kelola Semua Akun">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-white" /> User Management & Partner Approvals
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Kelola Semua Akun Terdaftar & Persetujuan Mitra EO
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Setujui pengajuan Mitra EO baru atau ubah role pengguna via API backend.
              </p>
            </div>

            <button
              onClick={loadData}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Data API
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Search & Filter Header */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama atau email pengguna..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div className="text-xs text-slate-500 font-extrabold self-center">
              Total Pengguna Terdaftar: <span className="text-blue-700 font-black">{users.length}</span>
            </div>
          </div>

          {/* User Table */}
          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : users.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">User Profile</th>
                    <th className="py-3.5 px-4">Kontak & NIK</th>
                    <th className="py-3.5 px-4">Peran (Role)</th>
                    <th className="py-3.5 px-4">Status Mitra</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Tindakan API (Approval & Role)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const photo = getPhotoUrl(u.profile_photo_url || u.photo);
                    const initials = (u.name || u.email)
                      .substring(0, 2)
                      .toUpperCase();
                    const isOwnerAccount = u.email === 'admin@metix.com';
                    const isMitraAccount = u.email === 'lutfifahri175@gmail.com' || (u.roles && u.roles.some(r => r.name === 'mitra'));

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

                        <td className="py-3.5 px-4">{getUserRoleBadge(u)}</td>

                        <td className="py-3.5 px-4">
                          {u.mitra_status === 'approved' || isMitraAccount ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          ) : u.mitra_status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              Pending Approval
                            </span>
                          ) : u.mitra_status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Customer</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isOwnerAccount ? (
                            <span className="text-[11px] text-purple-700 font-extrabold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                              Platform Owner
                            </span>
                          ) : u.mitra_status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={updatingUserId === u.id}
                                onClick={() => handleApprove(u.id, u.name)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Mitra
                              </button>
                              <button
                                disabled={updatingUserId === u.id}
                                onClick={() => handleReject(u.id, u.name)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          ) : isMitraAccount ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Mitra Active
                              </span>
                              <button
                                disabled={updatingUserId === u.id}
                                onClick={() => handleRoleChange(u.id, u.name, 'pembeli')}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-all cursor-pointer"
                                title="Demote back to Pembeli Tiket"
                              >
                                Demote Pembeli
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={updatingUserId === u.id}
                              onClick={() => handleRoleChange(u.id, u.name, 'mitra')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Setujui / Jadikan Mitra EO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Tidak ada data akun yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
