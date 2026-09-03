'use me';
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchAuditLogs, AuditLogItem } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  UserCheck,
  Activity,
  ShieldCheck,
  Eye,
  X,
  Globe,
  Monitor,
  Lock,
  KeyRound,
  FileCode2,
  Layers,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListOrdered,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionsList, setActionsList] = useState<string[]>([]);

  // Filters & Search
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Page Size States (10, 100, 1000, 10000, all)
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Log Detail Modal
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogItem | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    const res = await fetchAuditLogs({
      search: searchQuery,
      action: selectedAction,
    });

    setLogs(res.logs || []);
    if (res.actionsList && res.actionsList.length > 0) {
      setActionsList(res.actionsList);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction]);

  // Reset to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction, pageSize]);

  // Filtered Logs strictly by search query
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        (log.user_name || '').toLowerCase().includes(q) ||
        (log.user_email || '').toLowerCase().includes(q) ||
        (log.description || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.ip_address || '').toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  // Pagination Calculations
  const totalItems = filteredLogs.length;
  const isAll = pageSize === 'all';
  const limitPerPage = isAll ? totalItems : (pageSize as number);
  const totalPages = isAll ? 1 : Math.ceil(totalItems / limitPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isAll ? 0 : (validCurrentPage - 1) * limitPerPage;
  const endIndex = isAll ? totalItems : Math.min(startIndex + limitPerPage, totalItems);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  // Pagination Page Number Buttons Helper (Smart Truncation 1, 2, 3 ... TotalPages)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        // Di awal: 1, 2, 3, 4, 5, ..., totalPages
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        // Di akhir: 1, ..., totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Di tengah: 1, ..., current - 1, current, current + 1, ..., totalPages
        pages.push(1);
        pages.push('...');
        pages.push(validCurrentPage - 1);
        pages.push(validCurrentPage);
        pages.push(validCurrentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Action Badge Styling Helper
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <KeyRound className="w-3 h-3 text-blue-600" /> {act}
        </span>
      );
    }
    if (act.includes('APPROVE') || act.includes('CREATE') || act.includes('SUCCESS')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {act}
        </span>
      );
    }
    if (act.includes('UPDATE') || act.includes('ROLE') || act.includes('EDIT')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-3 h-3 text-purple-600" /> {act}
        </span>
      );
    }
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('FAIL')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> {act}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <Activity className="w-3 h-3 text-slate-500" /> {act}
      </span>
    );
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('Tidak ada data audit log untuk di-export');
      return;
    }

    const headers = ['ID', 'Pengguna', 'Email', 'Aksi', 'Deskripsi', 'IP Address', 'User Agent', 'Waktu'];
    const rows = filteredLogs.map((log) => [
      log.id,
      `"${log.user_name || 'System'}"`,
      log.user_email || 'system@metix.id',
      `"${log.action}"`,
      `"${log.description}"`,
      log.ip_address || '127.0.0.1',
      `"${log.user_agent || '-'}"`,
      new Date(log.created_at).toLocaleString('id-ID'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_Metix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Audit Logs Berhasil Di-export ke Excel/CSV! 🛡️');
  };

  return (
    <DashboardLayout pageTitle="Audit Logs & Keamanan Sistem" activeNav="Audit Logs">
      <div className="w-full space-y-6">
        
        {/* Top Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/20 border border-white/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-wider text-blue-300 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> SECURITY & AUDIT TRAIL
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Audit Logs & Keamanan Sistem
              </h2>
              <p className="text-xs text-slate-300 font-medium max-w-2xl">
                Pantau jejak aktivitas pengguna, riwayat tindakan sensitif, dan log keamanan platform secara real-time untuk transparansi dan auditabilitas.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs flex items-center gap-2 backdrop-blur-sm transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4" /> Cetak Audit Log
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Audit Log</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-slate-900">{totalItems.toLocaleString('id-ID')} <span className="text-xs font-extrabold text-slate-400">Records</span></h4>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <FileCode2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-blue-600 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Log Terenkripsi
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kategori Action Unik</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-indigo-600">{actionsList.length || 1} <span className="text-xs font-extrabold text-slate-400">Tipe</span></h4>
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Action Types
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Proteksi</span>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Active Shield
              </h4>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SSL & OAuth Verified
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Halaman Aktif</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 truncate">
                Hal. {validCurrentPage} <span className="text-xs text-slate-400">/ {totalPages}</span>
              </h4>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <ListOrdered className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-purple-600 flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5" /> {isAll ? 'Semua Data' : `${limitPerPage} Baris/Hal`}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengguna, email, deskripsi aksi, atau IP address..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Action Filter Dropdown */}
            <div className="w-full sm:w-60 shrink-0">
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white">
                  <SelectValue placeholder="Semua Aksi (Action)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi (Action)</SelectItem>
                  {actionsList.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Size Selector (10, 100, 1000, 10000, all) */}
            <div className="w-full sm:w-52 shrink-0">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  if (val === 'all') {
                    setPageSize('all');
                  } else {
                    setPageSize(Number(val));
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-blue-700 focus:bg-white">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-blue-600" />
                    <SelectValue placeholder="Tampilkan 10 data" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 data per halaman</SelectItem>
                  <SelectItem value="100">100 data per halaman</SelectItem>
                  <SelectItem value="1000">1.000 data per halaman</SelectItem>
                  <SelectItem value="10000">10.000 data per halaman</SelectItem>
                  <SelectItem value="all">Semua Data (All)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-700" /> Rekam Audit Log Sistem ({totalItems.toLocaleString('id-ID')})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Daftar lengkap riwayat aksi dan log aktivitas keamanan pengguna.
              </p>
            </div>

            {/* Range indicator badge */}
            {totalItems > 0 && (
              <div className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-extrabold text-blue-700 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>
                  Menampilkan <strong>{startIndex + 1}</strong> – <strong>{endIndex}</strong> dari <strong>{totalItems.toLocaleString('id-ID')}</strong> log
                </span>
              </div>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : paginatedLogs.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Pengguna & Email</th>
                    <th className="py-3.5 px-4">Aksi (Action)</th>
                    <th className="py-3.5 px-4">Deskripsi Aktivitas</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-right">Waktu (Timestamp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogDetail(log)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {(log.user_name || 'S')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {log.user_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {log.user_email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[280px] truncate">
                        {log.description}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-bold">
                        {log.ip_address}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada catatan audit log pada kriteria pencarian ini.</p>
            </div>
          )}

          {/* ================= BEAUTIFUL PAGINATION CONTROLS BOTTOM BAR ================= */}
          {!isLoading && totalItems > 0 && (
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Info text left */}
              <div className="text-xs text-slate-500 font-medium text-center md:text-left">
                Menampilkan <span className="font-extrabold text-slate-800">{startIndex + 1}</span> – <span className="font-extrabold text-slate-800">{endIndex}</span> dari <span className="font-extrabold text-slate-900">{totalItems.toLocaleString('id-ID')}</span> audit log
              </div>

              {/* Controls right */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Page Size Quick Switcher Pills */}
                <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 mr-2 text-xs font-bold text-slate-600">
                  <span className="px-2 text-[10px] text-slate-400 uppercase tracking-wider">Per Hal:</span>
                  {[10, 100, 1000, 10000, 'all'].map((opt) => (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() => setPageSize(opt as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        pageSize === opt
                          ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {opt === 'all' ? 'All' : opt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                {/* Page Nav Buttons */}
                {!isAll && totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                    {/* First Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Halaman Pertama"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage === 1}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Numbered Page Buttons */}
                    <div className="flex items-center gap-1 px-1">
                      {getPageNumbers().map((pg, i) =>
                        typeof pg === 'number' ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`min-w-[32px] h-8 px-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center ${
                              validCurrentPage === pg
                                ? 'bg-blue-700 text-white font-black shadow-md shadow-blue-700/20'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900 font-bold'
                            }`}
                          >
                            {pg}
                          </button>
                        ) : (
                          <span key={i} className="px-1 text-slate-400 text-xs font-bold">
                            ...
                          </span>
                        )
                      )}
                    </div>

                    {/* Next Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage === totalPages}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage === totalPages}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Halaman Terakhir"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ================= MODAL DETAIL AUDIT LOG ================= */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <button
              onClick={() => setSelectedLogDetail(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Detail Audit Log Record #{selectedLogDetail.id}
              </span>
              <h3 className="text-lg font-black text-slate-900 pt-1">
                {selectedLogDetail.action}
              </h3>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-800">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] block font-bold">Pengguna Eksekutor:</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedLogDetail.user_name} ({selectedLogDetail.user_email})</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] block font-bold">Deskripsi Aktivitas:</span>
                <p className="font-bold text-slate-800 leading-relaxed">{selectedLogDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 font-mono">
                  <span className="text-slate-400 text-[11px] block font-sans font-bold">IP Address:</span>
                  <span className="font-black text-slate-900">{selectedLogDetail.ip_address}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[11px] block font-bold">Waktu Eksekusi:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedLogDetail.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {selectedLogDetail.user_agent && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 font-mono text-[11px]">
                  <span className="text-slate-400 font-sans font-bold block">User Agent:</span>
                  <span className="text-slate-600 break-all">{selectedLogDetail.user_agent}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

