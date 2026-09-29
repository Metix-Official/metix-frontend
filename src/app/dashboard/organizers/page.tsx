'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOwnerOrganizers,
  approveOwnerOrganizer,
  rejectOwnerOrganizer,
  ApiOrganizerProfile,
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
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  X,
  Loader2,
  FileText,
} from 'lucide-react';

export default function OwnerOrganizersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

  useEffect(() => {
    loadOrganizers();
  }, [searchQuery, statusFilter, currentPage]);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang data organisasi...', { id: 'refresh-data' });
    await loadOrganizers();
    toast.success('Data organisasi diperbarui! 🔄', { id: 'refresh-data' });
  };

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
        description: `Pengajuan "${rejectingProfile.organization_name}" telah ditolak.`,
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active (Approved)
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
    <DashboardLayout pageTitle="Persetujuan Profil Organisasi EO" activeNav="/dashboard/organizers">
      <div className="w-full space-y-6">
        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-white" /> Platform Owner Console
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Persetujuan Organisasi Event Organizer (EO)
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                Verifikasi dan tinjau berkas serta legalitas penyelenggara event yang mendaftar di ekosistem Metix.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-800">
                Daftar Profil Organisasi ({organizerMeta.total})
              </h3>
            </div>

            <div className="flex items-center gap-3">
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

              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari organisasi..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : organizers.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4 rounded-l-xl">Organisasi</th>
                      <th className="py-3.5 px-4">Kontak & PIC</th>
                      <th className="py-3.5 px-4">Legalitas & Berkas</th>
                      <th className="py-3.5 px-4">Status Pengajuan</th>
                      <th className="py-3.5 px-4 text-right rounded-r-xl">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {organizers.map((org) => {
                      const logo = getPhotoUrl(org.logo_url || org.logo, undefined, true);
                      const legalDoc = getPhotoUrl(org.legal_document_url || org.legal_document);

                      return (
                        <tr key={org.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={org.organization_name}
                                  className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                                  {org.organization_name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col max-w-[200px]">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                  {org.organization_name}
                                </span>
                                {org.city && (
                                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    {org.city}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {org.email || org.user?.email || '-'}
                              </span>
                              <span className="text-slate-400 font-medium flex items-center gap-1 truncate">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                {org.phone_number || org.user?.phone || '-'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {legalDoc ? (
                              <a
                                href={legalDoc}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Unduh Legalitas
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {getStatusBadge(org.status)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={updatingId === org.id || org.status === 'ACTIVE'}
                                onClick={() => handleApproveOrganizer(org)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Approve Organisasi"
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
                                title="Reject Organisasi"
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

              {organizerMeta.last_page > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
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
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1 bg-slate-50 rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Tidak ada data profil organisasi yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-rose-600 p-6 text-white relative">
              <button
                onClick={() => setRejectingProfile(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-black">Tolak Pengajuan Organisasi</h3>
              <p className="text-xs text-rose-100 font-medium">
                {rejectingProfile.organization_name}
              </p>
            </div>

            <form onSubmit={handleConfirmRejectOrganizer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Dokumen legalitas tidak jelas / SIUP kadaluarsa..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProfile(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Tolak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
