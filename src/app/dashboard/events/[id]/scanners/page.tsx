'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventScannersList,
  fetchOrganizerEventDetail,
  fetchEoAdmins,
  assignScannerToEvent,
  unassignScannerFromEvent,
  ApiEventScannerItem,
  ApiEvent,
  EoAdminUser,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  QrCode,
  Search,
  RefreshCw,
  X,
  Mail,
  Phone,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface ScannersPageProps {
  params: Promise<{ id: string }>;
}

export default function EventScannersPage({ params }: ScannersPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [scanners, setScanners] = useState<ApiEventScannerItem[]>([]);
  const [availableStaff, setAvailableStaff] = useState<EoAdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedScannerId, setSelectedScannerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Unassign / Delete Modal State
  const [scannerToDelete, setScannerToDelete] = useState<ApiEventScannerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, scannerList, allStaff] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventScannersList(eventId),
        fetchEoAdmins().catch(() => []),
      ]);

      if (evtData) setEvent(evtData);
      setScanners(scannerList);
      setAvailableStaff(allStaff);
    } catch (err: any) {
      toast.error('Gagal Memuat Data Scanner Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScannerId) {
      toast.error('Pilih Petugas Scanner terlebih dahulu.');
      return;
    }

    setIsAssigning(true);
    try {
      const success = await assignScannerToEvent(eventId, selectedScannerId);
      if (success) {
        toast.success('Petugas Scanner berhasil ditugaskan ke event ini! 🎉');
        setIsAssignModalOpen(false);
        setSelectedScannerId('');
        await loadData();
      } else {
        toast.error('Gagal menugaskan scanner ke event.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan', {
        description: err?.message || 'Gagal menyimpan penugasan scanner.',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!scannerToDelete) return;

    setIsDeleting(true);
    try {
      const success = await unassignScannerFromEvent(eventId, scannerToDelete.id);
      if (success) {
        toast.success(`Petugas "${scannerToDelete.name}" berhasil dilepas dari event.`);
        setScannerToDelete(null);
        await loadData();
      } else {
        toast.error('Gagal melepas petugas scanner.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan', {
        description: err?.message || 'Gagal menghapus penugasan scanner.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredScanners = scanners.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery)
  );

  return (
    <DashboardLayout pageTitle="Petugas Scanner Event" activeNav="/dashboard/events">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tugaskan Scanner</span>
            </button>

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
        </div>

        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white p-6 sm:p-7 shadow-xl shadow-amber-600/15 border border-amber-500/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5 text-amber-200" /> Relasi: event_scanners
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Petugas Scanner: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-amber-100 font-medium max-w-2xl leading-relaxed">
              Daftar staf pintu masuk yang memiliki hak akses untuk memindai (scan QR check-in) tiket pengunjung event ini.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Petugas Scanner Event ({scanners.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari scanner..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
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
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : filteredScanners.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Nama Petugas Scanner</th>
                    <th className="py-3.5 px-4">Kontak</th>
                    <th className="py-3.5 px-4">Peran Tim</th>
                    <th className="py-3.5 px-4 text-center">Total Scan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Ditugaskan</th>
                    <th className="py-3.5 px-4 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScanners.map((scn, idx) => {
                    const initials = (scn.name || scn.email || 'SC').substring(0, 2).toUpperCase();

                    return (
                      <tr key={scn.id || idx} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0 border border-amber-200">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {scn.name || 'Petugas Scanner'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {scn.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {scn.phone || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {scn.role_in_team || 'SCANNER'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-amber-700">
                          {scn.scan_count || 0} Tiket
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {scn.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium text-[11px]">
                          {scn.joined_at
                            ? new Date(scn.joined_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setScannerToDelete(scn)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer group/del"
                            title="Lepas Penugasan Scanner"
                          >
                            <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center space-y-4 bg-slate-50/70 rounded-3xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Belum Ada Petugas Scanner Ditugaskan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Event ini belum memiliki staf scanner pada tabel event_scanners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tugaskan Scanner Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TUGASKAN SCANNER KE EVENT */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Tugaskan Petugas Scanner
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Event: {event?.title || `Event #${eventId}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Staf Scanner
                </label>
                <select
                  value={selectedScannerId}
                  onChange={(e) => setSelectedScannerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
                  required
                >
                  <option value="">-- Pilih Akun Staf Scanner --</option>
                  {availableStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Staf yang dipilih akan mendapatkan izin scan tiket untuk event ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menugaskan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tugaskan ke Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI LEPAS PENUGASAN SCANNER (PREMIUM DELETE MODAL) */}
      {scannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Icon & Title */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Lepas Penugasan Scanner?
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                  Hak akses staf untuk melakukan scan tiket pada event ini akan dicabut.
                </p>
              </div>
            </div>

            {/* Target Scanner Details Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0 border border-amber-200">
                {(scannerToDelete.name || scannerToDelete.email || 'SC').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-extrabold text-slate-900 text-xs truncate">
                  {scannerToDelete.name || 'Petugas Scanner'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  {scannerToDelete.email}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {event?.title || `Event #${eventId}`}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScannerToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnassign}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Melepas...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Lepaskan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
