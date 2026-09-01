'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerBankAccounts,
  createOrganizerBankAccount,
  updateOrganizerBankAccount,
  deleteOrganizerBankAccount,
  setPrimaryOrganizerBankAccount,
  fetchOrganizerWithdrawals,
  createWithdrawalRequest,
  fetchWithdrawalDetail,
  fetchDashboardData,
  ApiBankAccount,
  ApiWithdrawal,
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
  CreditCard,
  Building2,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Star,
  Trash2,
  Pencil,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Loader2,
  X,
  Send,
  HelpCircle,
  Download,
  Eye,
  Wallet,
  Landmark,
} from 'lucide-react';

const COMMON_BANKS = [
  'Bank BCA',
  'Bank BTN',
  'Bank Mandiri',
  'Bank BNI',
  'Bank BRI',
  'Bank Syariah Indonesia (BSI)',
  'Bank CIMB Niaga',
  'Bank Permata',
  'Bank Danamon',
  'Bank Jago',
  'Bank SeaBank',
];

export default function WithdrawalManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stats / Balance
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<ApiBankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<ApiWithdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [withdrawalMeta, setWithdrawalMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  }>({ current_page: 1, last_page: 1, total: 0 });

  // Modal States
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<ApiBankAccount | null>(null);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  // Bank Form State
  const [bankName, setBankName] = useState('Bank BCA');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  // Delete Bank Confirmation Modal
  const [deletingBankTarget, setDeletingBankTarget] = useState<ApiBankAccount | null>(null);
  const [isDeletingBank, setIsDeletingBank] = useState(false);

  // Withdrawal Request Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [withdrawAmountRaw, setWithdrawAmountRaw] = useState<number>(0);
  const [withdrawAmountDisplay, setWithdrawAmountDisplay] = useState<string>('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawalFormError, setWithdrawalFormError] = useState<string | null>(null);

  // Withdrawal Detail Modal State
  const [selectedWithdrawalDetail, setSelectedWithdrawalDetail] = useState<ApiWithdrawal | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Dashboard Stats for Available Balance
      const dash = await fetchDashboardData();
      if (dash && dash.stats) {
        setAvailableBalance(dash.stats.revenueThisMonth || dash.stats.totalRevenue || 0);
      }

      // 2. Fetch Bank Accounts
      const accounts = await fetchOrganizerBankAccounts();
      setBankAccounts(accounts);

      // Auto-select primary bank for withdrawal request
      const primaryBank = accounts.find((a) => a.is_primary) || accounts[0];
      if (primaryBank) {
        setSelectedBankId(String(primaryBank.id));
      }

      // 3. Fetch Withdrawals History
      const res = await fetchOrganizerWithdrawals({
        status: statusFilter,
        page: currentPage,
      });
      setWithdrawals(res.withdrawals);
      if (res.meta) {
        setWithdrawalMeta({
          current_page: res.meta.current_page,
          last_page: res.meta.last_page,
          total: res.meta.total,
        });
      }
    } catch (e) {
      console.warn('Failed to load withdrawal data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, currentPage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('Memuat ulang data penarikan & rekening...', { id: 'refresh-withdrawal' });
    await loadData();
    setIsRefreshing(false);
    toast.success('Data penarikan & rekening berhasil diperbarui! 🔄', { id: 'refresh-withdrawal' });
  };

  // Open Bank Modal for Create or Edit
  const handleOpenBankModal = (bank?: ApiBankAccount) => {
    setBankFormError(null);
    if (bank) {
      setEditingBankAccount(bank);
      if (COMMON_BANKS.includes(bank.bank_name)) {
        setBankName(bank.bank_name);
        setCustomBankName('');
      } else {
        setBankName('Lainnya');
        setCustomBankName(bank.bank_name);
      }
      setAccountNumber(bank.account_number);
      setAccountHolderName(bank.account_holder_name);
      setIsPrimary(bank.is_primary);
    } else {
      setEditingBankAccount(null);
      setBankName('Bank BCA');
      setCustomBankName('');
      setAccountNumber('');
      setAccountHolderName('');
      setIsPrimary(bankAccounts.length === 0); // Default to primary if first bank account
    }
    setIsBankModalOpen(true);
  };

  // Submit Bank Account Form (Create / Update)
  const handleSubmitBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankFormError(null);

    const finalBankName = bankName === 'Lainnya' ? customBankName.trim() : bankName;
    if (!finalBankName) {
      setBankFormError('Nama bank wajib diisi.');
      return;
    }

    if (!accountNumber.trim() || !/^[0-9\-]+$/.test(accountNumber.trim())) {
      setBankFormError('Nomor rekening hanya boleh berisi angka dan tanda hubung (minimal 5 karakter).');
      return;
    }

    if (!accountHolderName.trim()) {
      setBankFormError('Nama pemilik rekening wajib diisi.');
      return;
    }

    setIsSubmittingBank(true);
    try {
      if (editingBankAccount) {
        await updateOrganizerBankAccount(editingBankAccount.id, {
          bank_name: finalBankName,
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim(),
          is_primary: isPrimary,
        });
        toast.success('Rekening Bank Berhasil Diperbarui! 🎉');
      } else {
        await createOrganizerBankAccount({
          bank_name: finalBankName,
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim(),
          is_primary: isPrimary,
        });
        toast.success('Rekening Bank Berhasil Ditambahkan! 🎉');
      }
      setIsBankModalOpen(false);
      loadData();
    } catch (err: any) {
      setBankFormError(err?.message || 'Gagal menyimpan rekening bank.');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  // Delete Bank Account
  const handleConfirmDeleteBank = async () => {
    if (!deletingBankTarget) return;
    setIsDeletingBank(true);
    try {
      await deleteOrganizerBankAccount(deletingBankTarget.id);
      toast.success(`Rekening ${deletingBankTarget.bank_name} berhasil dihapus.`);
      setDeletingBankTarget(null);
      loadData();
    } catch (err: any) {
      toast.error('Gagal Menghapus Rekening', {
        description: err?.message || 'Terjadi kesalahan saat menghapus rekening bank.',
      });
    } finally {
      setIsDeletingBank(false);
    }
  };

  // Set Primary Bank Account
  const handleSetPrimaryBank = async (bankId: number, bankTitle: string) => {
    try {
      await setPrimaryOrganizerBankAccount(bankId);
      toast.success(`Rekening ${bankTitle} telah dijadikan Rekening Utama! ⭐`);
      loadData();
    } catch (err: any) {
      toast.error('Gagal Mengubah Rekening Utama', {
        description: err?.message || 'Terjadi kesalahan.',
      });
    }
  };

  // Format Input Nominal Penarikan
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setWithdrawAmountRaw(0);
      setWithdrawAmountDisplay('');
      return;
    }
    const num = parseInt(raw, 10);
    setWithdrawAmountRaw(num);
    setWithdrawAmountDisplay(num.toLocaleString('id-ID'));
  };

  // Quick Amount Select Buttons
  const handleQuickAmountSelect = (amount: number) => {
    setWithdrawAmountRaw(amount);
    setWithdrawAmountDisplay(amount.toLocaleString('id-ID'));
  };

  // Submit Withdrawal Request Form
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalFormError(null);

    if (!selectedBankId) {
      setWithdrawalFormError('Pilih rekening bank tujuan pencairan.');
      return;
    }

    if (withdrawAmountRaw < 10000) {
      setWithdrawalFormError('Nominal penarikan minimal adalah Rp 10.000.');
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await createWithdrawalRequest({
        organizer_bank_account_id: Number(selectedBankId),
        amount: withdrawAmountRaw,
      });

      toast.success('Pengajuan Penarikan Dana Berhasil Dikirim! 🚀', {
        description: `Permintaan penarikan dana sebesar Rp ${withdrawAmountRaw.toLocaleString(
          'id-ID'
        )} telah dikirim untuk diproses oleh Owner.`,
      });

      setIsWithdrawModalOpen(false);
      setWithdrawAmountRaw(0);
      setWithdrawAmountDisplay('');
      loadData();
    } catch (err: any) {
      setWithdrawalFormError(err?.message || 'Gagal mengajukan penarikan dana.');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  // Open Withdrawal Detail Modal
  const handleOpenDetailModal = async (withdrawalId: number) => {
    setIsLoadingDetail(true);
    setSelectedWithdrawalDetail(null);
    const detail = await fetchWithdrawalDetail(withdrawalId);
    setSelectedWithdrawalDetail(detail);
    setIsLoadingDetail(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed (Dana Ditransfer)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Approved (Disetujui)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected (Ditolak)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const completedTotal = React.useMemo(() => {
    return withdrawals
      .filter((w) => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + (w.net_amount || w.amount || 0), 0);
  }, [withdrawals]);

  const pendingCount = React.useMemo(() => {
    return withdrawals.filter((w) => w.status === 'PENDING').length;
  }, [withdrawals]);

  const primaryBankAccount = React.useMemo(() => {
    return bankAccounts.find((a) => a.is_primary) || bankAccounts[0] || null;
  }, [bankAccounts]);

  return (
    <DashboardLayout pageTitle="Penarikan Dana & Rekening Bank" activeNav="Penarikan Dana">
      <div className="w-full space-y-6">
        {/* Banner Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Landmark className="w-3.5 h-3.5 text-white" /> Financial Payout Console
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Penarikan Dana & Rekening Bank EO
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                Kelola rekening bank penerima pencairan tiket, ajukan penarikan dana baru, dan pantau status riwayat transfer dari Owner.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWithdrawalFormError(null);
                  setIsWithdrawModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-4 h-4 text-blue-700" />
                <span>+ Ajukan Penarikan Dana</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Saldo Siap Dicairkan
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {availableBalance.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Penarikan Sukses
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">
                Rp {completedTotal.toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Pengajuan Dalam Review
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-amber-600">
                {pendingCount} Transaksi
              </h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Rekening Utama Pencairan
            </span>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900 truncate">
                  {primaryBankAccount ? primaryBankAccount.bank_name : 'Belum Didaftarkan'}
                </h4>
                <p className="text-xs text-slate-500 font-semibold truncate">
                  {primaryBankAccount ? primaryBankAccount.account_number : '-'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION A: KELOLA REKENING BANK EO */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Daftar Rekening Bank Penampung EO</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Atur rekening bank resmi organisasi Anda untuk menerima dana pencairan tiket event dari Owner.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenBankModal()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekening Bank Baru</span>
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : bankAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between space-y-4 ${acc.is_primary
                    ? 'bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border-blue-300 shadow-md shadow-blue-600/5'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-600 text-white font-black text-xs">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <span className="font-black text-sm text-slate-900">{acc.bank_name}</span>
                      </div>

                      {acc.is_primary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Rekening Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryBank(acc.id, acc.bank_name)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          Set Utama
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Nomor Rekening
                      </span>
                      <p className="text-base font-black tracking-wider text-slate-900 font-mono">
                        {acc.account_number}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Atas Nama Pemilik
                      </span>
                      <p className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                        {acc.account_holder_name}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBankModal(acc)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBankTarget(acc)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Landmark className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">Belum Ada Rekening Bank</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Tambahkan minimal 1 akun rekening bank agar Anda dapat menerima dana pencairan tiket event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBankModal()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Rekening Sekarang
              </button>
            </div>
          )}
        </div>

        {/* SECTION B: DAFTAR RIWAYAT PENARIKAN DANA */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Riwayat & Daftar Penarikan Dana (Payout History)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pantau seluruh daftar pengajuan penarikan dana, bukti transfer, dan status persetujuan dari Owner.
              </p>
            </div>

            {/* Status Filter Dropdown via Shadcn UI Select */}
            <div className="w-full sm:w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved (Disetujui)</SelectItem>
                  <SelectItem value="COMPLETED">Completed (Selesai)</SelectItem>
                  <SelectItem value="REJECTED">Rejected (Ditolak)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">No. Referensi & Waktu</th>
                    <th className="py-3.5 px-4">Rekening Tujuan</th>
                    <th className="py-3.5 px-4">Nominal Penarikan (Rp)</th>
                    <th className="py-3.5 px-4">Status Pengajuan</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Aksi Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((item) => {
                    const reqDate = item.requested_at || item.created_at;
                    let formattedDate = '-';
                    if (reqDate) {
                      try {
                        formattedDate = new Date(reqDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        formattedDate = reqDate;
                      }
                    }

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                              {item.reference_number || `#WD-${item.id}`}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formattedDate}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-[11px] space-y-0.5">
                            <span className="font-extrabold text-slate-900">
                              {item.bank_name} — {item.account_number}
                            </span>
                            <span className="text-slate-500 font-semibold uppercase">
                              a.n. {item.account_holder_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          Rp {(item.net_amount || item.amount || 0).toLocaleString('id-ID')}
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1 bg-slate-50 rounded-2xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada riwayat penarikan dana yang sesuai dengan filter.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {withdrawalMeta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <span>Halaman {withdrawalMeta.current_page} dari {withdrawalMeta.last_page}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= withdrawalMeta.last_page}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL TAMBAH / EDIT REKENING BANK ================= */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">
                {editingBankAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Isi rincian nama bank, nomor rekening, dan nama pemilik rekening resmi.
              </p>
            </div>

            {bankFormError && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBank} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Pilih Nama Bank</label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600">
                    <SelectValue placeholder="Pilih Nama Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                    <SelectItem value="Lainnya">Lainnya (Bank Lain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bankName === 'Lainnya' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Tuliskan Nama Bank</label>
                  <input
                    type="text"
                    required
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="e.g. Bank Mega / Bank BTN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Nomor Rekening</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Atas Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="e.g. PT SOUNDWAVE EVENT ASIA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_primary_checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="is_primary_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Jadikan sebagai Rekening Utama pencairan
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBank}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingBank ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan Rekening Bank'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PENGAJUAN PENARIKAN DANA ================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Form Pengajuan Penarikan Dana</h3>
              <p className="text-xs text-blue-100 font-medium">
                Tentukan rekening bank tujuan dan nominal dana yang ingin Anda cairkan.
              </p>
            </div>

            {withdrawalFormError && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{withdrawalFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWithdrawal} className="p-6 space-y-5">
              {/* Select Bank Account */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Pilih Rekening Bank Tujuan Pencairan <span className="text-rose-500">*</span>
                </label>

                {bankAccounts.length > 0 ? (
                  <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                    <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600">
                      <SelectValue placeholder="Pilih Rekening Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.bank_name} — {b.account_number} (a.n. {b.account_holder_name}){' '}
                          {b.is_primary ? '(Utama)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-between">
                    <span>Belum ada rekening bank yang didaftarkan.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(false);
                        handleOpenBankModal();
                      }}
                      className="text-blue-700 underline font-extrabold ml-2"
                    >
                      + Tambah Bank
                    </button>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-extrabold text-slate-700">
                    Nominal Penarikan Dana (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="font-bold text-slate-500">
                    Saldo Siap: <strong className="text-slate-900">Rp {availableBalance.toLocaleString('id-ID')}</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={withdrawAmountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Quick Amount Select Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[100000, 500000, 1000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmountSelect(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-extrabold border border-slate-200 transition-colors"
                    >
                      Rp {(amt / 1000).toLocaleString('id-ID')}rb
                    </button>
                  ))}
                  {availableBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmountSelect(availableBalance)}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-black border border-blue-300 transition-colors"
                    >
                      Tarik Semua Saldo
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Nominal Pengajuan Penarikan</span>
                  <span className="font-bold text-slate-900">
                    Rp {withdrawAmountRaw.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Biaya Admin Transaksi</span>
                  <span className="font-bold text-emerald-600">Rp 0 (Bebas Biaya)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-slate-900 text-sm">
                  <span>Total Net Diterima</span>
                  <span className="text-blue-700">
                    Rp {withdrawAmountRaw.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal || withdrawAmountRaw < 10000 || !selectedBankId}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingWithdrawal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengirim Pengajuan...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Konfirmasi & Kirim Pengajuan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL PENARIKAN DANA EO ================= */}
      {(selectedWithdrawalDetail || isLoadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedWithdrawalDetail(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-100">
                  Detail Transaksi Penarikan Dana
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                {selectedWithdrawalDetail?.reference_number || 'Detail Penarikan'}
              </h3>
            </div>

            {isLoadingDetail ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-6 w-48 rounded-xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : selectedWithdrawalDetail ? (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Status Stepper / Progress Timeline */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Status Transaksi
                    </span>
                    {getStatusBadge(selectedWithdrawalDetail.status)}
                  </div>

                  {/* Visual Stepper */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div
                      className={`p-2 rounded-xl border text-[10px] font-extrabold ${selectedWithdrawalDetail.status === 'PENDING' ||
                        selectedWithdrawalDetail.status === 'APPROVED' ||
                        selectedWithdrawalDetail.status === 'COMPLETED'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                    >
                      1. Pengajuan
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-[10px] font-extrabold ${selectedWithdrawalDetail.status === 'APPROVED' ||
                        selectedWithdrawalDetail.status === 'COMPLETED'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : selectedWithdrawalDetail.status === 'PENDING'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                    >
                      2. Review Owner
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-[10px] font-extrabold ${selectedWithdrawalDetail.status === 'COMPLETED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : selectedWithdrawalDetail.status === 'REJECTED'
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                    >
                      3. Transfer Dana
                    </div>
                  </div>
                </div>

                {/* Amount & Bank Breakdown */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Nominal Pencairan Net
                      </span>
                      <span className="text-2xl font-black text-blue-700">
                        Rp {(selectedWithdrawalDetail.net_amount || selectedWithdrawalDetail.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-600 text-white">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Bank Tujuan</span>
                      <span className="font-bold text-slate-900">{selectedWithdrawalDetail.bank_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Nomor Rekening</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedWithdrawalDetail.account_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Atas Nama Pemilik</span>
                      <span className="font-extrabold text-slate-900 uppercase">
                        {selectedWithdrawalDetail.account_holder_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proof of Transfer Preview */}
                {selectedWithdrawalDetail.proof_of_transfer && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      Bukti Transfer dari Owner
                    </span>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-60 bg-slate-950 flex items-center justify-center p-2">
                      <img
                        src={getPhotoUrl(selectedWithdrawalDetail.proof_of_transfer) || undefined}
                        alt="Bukti Transfer Penarikan"
                        className="max-h-56 object-contain rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedWithdrawalDetail.status === 'REJECTED' && selectedWithdrawalDetail.rejection_reason && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                    <span className="font-extrabold block text-rose-700">Alasan Penolakan Owner:</span>
                    <p className="font-medium text-slate-700 leading-relaxed">
                      {selectedWithdrawalDetail.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Close Action */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedWithdrawalDetail(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS REKENING ================= */}
      {deletingBankTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">Hapus Rekening Bank?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin menghapus rekening <strong className="text-slate-900">{deletingBankTarget.bank_name} ({deletingBankTarget.account_number})</strong>?
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingBankTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingBank}
                onClick={handleConfirmDeleteBank}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeletingBank ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Ya, Hapus Rekening'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
