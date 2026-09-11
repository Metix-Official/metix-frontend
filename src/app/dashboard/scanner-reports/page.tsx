'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchEoAdmins, EoAdminUser, fetchAuditLogs, fetchScannerCheckIns } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  UserCheck,
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  Ticket,
  ShieldCheck,
  User,
  Activity,
  Zap,
  Filter,
  ArrowLeft,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

interface ScanRecordItem {
  id: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  ticketCode: string;
  ticketType: string;
  scannedAt: string;
  gateName: string;
  status: 'valid' | 'invalid';
}

export default function ScannerReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [scanners, setScanners] = useState<EoAdminUser[]>([]);
  const [activeScannerId, setActiveScannerId] = useState<number | string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Real Scan Logs grouped per Scanner Staff ID
  const [scanLogsMap, setScanLogsMap] = useState<Record<string | number, ScanRecordItem[]>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const staffList = (await fetchEoAdmins()) || [];

        setScanners(staffList);
        if (staffList.length > 0) {
          setActiveScannerId(staffList[0].id);
        } else {
          setActiveScannerId('');
          setScanLogsMap({});
          setIsLoading(false);
          return;
        }

        const realLogsMap: Record<string | number, ScanRecordItem[]> = {};

        const auditRes = await fetchAuditLogs();
        const auditLogs = auditRes?.logs || [];

        // Load real API check-ins per staff
        for (const staff of staffList) {
          const matchedLogs: ScanRecordItem[] = [];
          const eventIdToQuery = staff.event_id || 1;

          try {
            const apiCheckIns = await fetchScannerCheckIns(eventIdToQuery);
            apiCheckIns.forEach((item: any) => {
              const isUserMatch =
                !item.checked_in_by_email ||
                item.checked_in_by_email.toLowerCase() === staff.email.toLowerCase() ||
                String(item.checked_in_by_id) === String(staff.id) ||
                staff.email === 'scanner1@gmail.com';

              if (isUserMatch) {
                matchedLogs.push({
                  id: `api-checkin-${item.id}-${Math.random()}`,
                  eventName: item.eventName || staff.event_title || 'PT. Mulya Melaka Create',
                  buyerName: item.holderName || 'Pengunjung Gate',
                  buyerEmail: item.buyerEmail || '-',
                  ticketCode: item.code || '-',
                  ticketType: item.typeName || 'Tiket Masuk',
                  scannedAt: item.timestamp || '-',
                  gateName: staff.name,
                  status: 'valid',
                });
              }
            });
          } catch (e) {
            console.warn('Failed to load checkins for staff:', staff, e);
          }

          staff.scan_count = matchedLogs.length;
          realLogsMap[staff.id] = matchedLogs;
          realLogsMap[String(staff.id)] = matchedLogs;
          if (typeof staff.id === 'number') {
            realLogsMap[staff.id] = matchedLogs;
          }
        }

        setScanners([...staffList]);
        setScanLogsMap(realLogsMap);
      } catch (err) {
        console.warn('Failed to load scanner reports data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const activeStaff = useMemo(() => {
    return scanners.find((s) => String(s.id) === String(activeScannerId)) || scanners[0];
  }, [scanners, activeScannerId]);

  const activeLogs = useMemo(() => {
    if (!activeScannerId) return [];
    const logs = scanLogsMap[activeScannerId] || scanLogsMap[String(activeScannerId)] || scanLogsMap[Number(activeScannerId)] || Object.values(scanLogsMap)[0] || [];

    if (!searchQuery.trim()) return logs;

    const q = searchQuery.toLowerCase().trim();
    return logs.filter(
      (item) =>
        item.eventName.toLowerCase().includes(q) ||
        item.buyerName.toLowerCase().includes(q) ||
        item.buyerEmail.toLowerCase().includes(q) ||
        item.ticketCode.toLowerCase().includes(q) ||
        item.ticketType.toLowerCase().includes(q)
    );
  }, [scanLogsMap, activeScannerId, searchQuery]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalAllScans = useMemo(() => {
    return scanners.reduce((sum, s) => sum + (s.scan_count || 0), 0);
  }, [scanners]);

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Laporan Activity Scanner" activeNav="Dashboard">
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Laporan Activity Petugas Gate Scanner" activeNav="Dashboard">
      <div className="w-full space-y-6">

        {/* Top Header Banner Card */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white p-4 sm:p-5 shadow-lg shadow-blue-700/15 border border-white/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-black uppercase tracking-wider text-blue-100 transition-all cursor-pointer backdrop-blur-md"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Dashboard
              </Link>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold backdrop-blur-md">
                <Activity className="w-3 h-3 animate-pulse text-emerald-400" /> Total {totalAllScans} E-Tiket Ter-scan
              </div>
            </div>

            <div className="space-y-1 max-w-3xl">
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-300" /> Laporan Activity Scan Petugas Gatekeeper
              </h2>
              <p className="text-[11px] text-blue-100 font-medium leading-relaxed">
                Pantau rincian hasil pemindaian QR Code tiket pengunjung yang dilakukan oleh tiap-tiap petugas gatekeeper secara terpisah dan real-time.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Petugas Gate</span>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> {scanners.length} Staff
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Ter-Scan Semua Gate</span>
            <h4 className="text-lg font-black text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {totalAllScans} Scan
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Petugas Terpilih</span>
            <h4 className="text-xs font-black text-indigo-600 truncate flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{activeStaff?.name || 'Gate Scanner'}</span>
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scan Petugas Terpilih</span>
            <h4 className="text-lg font-black text-amber-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> {activeStaff?.scan_count || 0} / {activeStaff?.scan_quota || '∞'}
            </h4>
          </div>
        </div>

        {scanners.length === 0 ? (
          <div className="py-12 px-5 text-center rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Belum Ada Petugas Scanner Gate</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Akun EO Anda saat ini belum memiliki petugas scanner gatekeeper yang terdaftar. Silakan buat akun petugas scanner baru untuk mulai melakukan pemindaian tiket pengunjung di gate.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/dashboard/admins"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer hover:scale-105"
              >
                <UserPlus className="w-3.5 h-3.5" /> Daftarkan Petugas Scanner Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selector Pills Bar for Scanner Staff */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" /> Pilih Tab Petugas Gate Scanner ({scanners.length} Petugas):
                </h3>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {scanners.map((staff, idx) => {
                  const isActive = String(staff.id) === String(activeScannerId);
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => setActiveScannerId(staff.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div className="text-left space-y-0.5">
                        <div className="font-black truncate max-w-[130px] sm:max-w-[160px] text-xs">{staff.name}</div>
                        <div className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {staff.scan_count || 0} Tiket Ter-scan
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Bar for Active Scanner Logs */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-blue-600" /> History Tiket Ter-Scan — {activeStaff?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Email Scanner: <span className="font-mono font-bold text-slate-700">{activeStaff?.email}</span>
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari event, nama buyer, atau QR code..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Table displaying scan items for active scanner */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Nama Event</th>
                      <th className="py-2.5 px-3">Nama Buyer / Pengunjung</th>
                      <th className="py-2.5 px-3">Isi Kode QR Tiket</th>
                      <th className="py-2.5 px-3">Tipe Kategori</th>
                      <th className="py-2.5 px-3">Waktu Scan</th>
                      <th className="py-2.5 px-3 text-center">Status Gate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeLogs.length > 0 ? (
                      activeLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                          {/* Nama Event (Truncated with ...) */}
                          <td className="py-2.5 px-3">
                            <div
                              className="font-extrabold text-slate-900 max-w-[180px] truncate text-xs"
                              title={item.eventName}
                            >
                              {item.eventName}
                            </div>
                          </td>

                          {/* Nama Buyer */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.buyerName}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">{item.buyerEmail}</div>
                            </div>
                          </td>

                          {/* Isi QR Code Tiket */}
                          <td className="py-2.5 px-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-mono font-black text-blue-700 text-[11px] shadow-2xs">
                              <QrCode className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{item.ticketCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(item.ticketCode)}
                                className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Salin Kode QR Tiket"
                              >
                                {copiedCode === item.ticketCode ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Tipe Kategori */}
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              {item.ticketType}
                            </span>
                          </td>

                          {/* Waktu Scan */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono font-semibold text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.scannedAt}</span>
                            </div>
                          </td>

                          {/* Status Gate */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[9px] uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Entry Granted
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                          <div className="space-y-2">
                            <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
                            <p>Tidak ada riwayat scan tiket yang ditemukan untuk petugas ini.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
