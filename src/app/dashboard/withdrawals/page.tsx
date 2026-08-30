'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
  getStoredUser,
  ApiWithdrawalItem,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, ArrowUpRight, CheckCircle2, XCircle, Clock, Plus, Mail, Building2, ShieldCheck, DollarSign, Wallet, RefreshCw, X, Loader2 } from 'lucide-react';

export default function WithdrawalsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<ApiWithdrawalItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // New Withdrawal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankName, setBankName] = useState('Bank BCA');
  const [withdrawalAmountDisplay, setWithdrawalAmountDisplay] = useState('');
  const [rawWithdrawalAmount, setRawWithdrawalAmount] = useState<number>(0);

  const handleWithdrawalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setWithdrawalAmountDisplay('');
      setRawWithdrawalAmount(0);
      return;
    }
    const num = parseInt(rawValue, 10);
    setRawWithdrawalAmount(num);
    setWithdrawalAmountDisplay(num.toLocaleString('id-ID'));
  };

  const currentUser = getStoredUser();
  const isOwner = currentUser?.email === 'admin@metix.com' || (currentUser?.roles && currentUser.roles.some((r) => r.name === 'owner'));

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchWithdrawals({ status: activeTab === 'all' ? undefined : activeTab });
    setWithdrawals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    setUpdatingId(id);
    const ok = await approveWithdrawal(id);
    if (ok) {
      setActionSuccess(`Pengajuan pencairan dana #${id} berhasil disetujui! Status diperbarui ke Approved.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    }
    setUpdatingId(null);
  };

  const handleReject = async (id: number) => {
    setUpdatingId(id);
    const ok = await rejectWithdrawal(id, 'Ditolak oleh Owner Platform');
    if (ok) {
      setActionSuccess(`Pengajuan pencairan dana #${id} telah ditolak.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    }
    setUpdatingId(null);
  };

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const amount = rawWithdrawalAmount || Number(form.get('amount'));
    const bank_name = String(form.get('bank_name'));
    const account_number = String(form.get('account_number'));
    const account_name = String(form.get('account_name'));

    const ok = await requestWithdrawal({ amount, bank_name, account_number, account_name });
    setIsSubmitting(false);
    setIsModalOpen(false);
    setWithdrawalAmountDisplay('');
    setRawWithdrawalAmount(0);

    if (ok) {
      setActionSuccess('Pengajuan penarikan dana berhasil dikirim! Menunggu persetujuan Super Admin Owner.');
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } else {
      alert('Gagal mengirim pengajuan penarikan. Pastikan saldo Anda mencukupi.');
    }
  };

  const totalPayout = withdrawals.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
  const approvedCount = withdrawals.filter((w) => w.status === 'approved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui (Paid)
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout pageTitle="Persetujuan & Penarikan Dana" activeNav="Persetujuan Dana">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-white" /> Corporate Payout & Settlement Hub
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Persetujuan & Penarikan Dana EO
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Setujui pencairan hasil penjualan tiket Mitra EO atau ajukan klaim saldo pendapatan event.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Tarik Dana EO
              </button>
            </div>
          </div>
        </div>

        {/* Action Alert Notification */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Summary Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Volume Payout</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {totalPayout.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-amber-600">{pendingCount}</h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Disetujui (Approved)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">{approvedCount}</h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Biaya Layanan Settlement</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">0% Admin</h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card & Filters */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({withdrawals.filter((w) => w.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disetujui ({withdrawals.filter((w) => w.status === 'approved').length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ditolak ({withdrawals.filter((w) => w.status === 'rejected').length})
            </button>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : withdrawals.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">Pemohon Payout</th>
                    <th className="py-3.5 px-4">Nominal Penarikan</th>
                    <th className="py-3.5 px-4">Rekening Tujuan (Bank)</th>
                    <th className="py-3.5 px-4">Status & Tanggal</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Tindakan API Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => {
                    const requesterName = w.user?.name || w.user?.email || 'Mitra EO';
                    const requesterEmail = w.user?.email || 'eo@gmail.com';
                    const photo = getPhotoUrl(w.user?.profile_photo_url || w.user?.photo);
                    const amountVal = Number(w.amount || 0);

                    const bankName = w.bank_details?.bank_name || 'BCA';
                    const accNo = w.bank_details?.account_number || '8490192019';
                    const accName = w.bank_details?.account_name || requesterName;

                    return (
                      <tr key={w.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {photo ? (
                              <img
                                src={photo}
                                alt={requesterName}
                                className="w-9 h-9 rounded-xl object-cover border border-blue-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                                {requesterName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {requesterName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" /> {requesterEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-black text-slate-900 text-sm">
                            Rp {amountVal.toLocaleString('id-ID')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-extrabold text-blue-800 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-blue-600" /> {bankName} — {accNo}
                            </span>
                            <span className="text-slate-500 font-medium">a/n {accName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(w.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          {isOwner && w.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={updatingId === w.id}
                                onClick={() => handleApprove(w.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Transfer
                              </button>
                              <button
                                disabled={updatingId === w.id}
                                onClick={() => handleReject(w.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Selesai / Terproses</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80 my-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <CreditCard className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Belum Ada Data Penarikan Dana
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Belum ada pengajuan pencairan saldo pendapatan event yang terdaftar pada kategori ini.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL FORM PENARIKAN DANA EO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Form Penarikan Dana EO</h3>
              <p className="text-xs text-blue-100 font-medium">
                Tarik saldo hasil penjualan tiket ke rekening bank resmi Mitra.
              </p>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Nominal Penarikan (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5.000.000"
                    value={withdrawalAmountDisplay ?? ''}
                    onChange={handleWithdrawalAmountChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                  <input type="hidden" name="amount" value={rawWithdrawalAmount ?? 0} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Pilih Bank Tujuan</label>
                <input type="hidden" name="bank_name" value={bankName} />
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                    <SelectValue placeholder="Pilih Bank Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank BCA">Bank Central Asia (BCA)</SelectItem>
                    <SelectItem value="Bank Mandiri">Bank Mandiri</SelectItem>
                    <SelectItem value="Bank BRI">Bank Rakyat Indonesia (BRI)</SelectItem>
                    <SelectItem value="Bank BNI">Bank Negara Indonesia (BNI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Nomor Rekening</label>
                  <input
                    type="text"
                    name="account_number"
                    required
                    placeholder="8490192019"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    name="account_name"
                    required
                    placeholder="PT Event Live"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    'Kirim Pengajuan Payout'
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
