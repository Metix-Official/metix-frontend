'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchUserProfile,
  UserProfile,
  fetchOwnerPlatformFees,
  updateOwnerPlatformFees,
  ApiPlatformFeeItem,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Sliders,
  Bell,
  Globe,
  Sparkles,
  CheckCircle2,
  Building2,
  Save,
  CreditCard,
  Percent,
  DollarSign,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUpgradeSubmitted, setIsUpgradeSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Owner Dynamic Platform Fee State
  const [platformFees, setPlatformFees] = useState<ApiPlatformFeeItem[]>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [feeSuccessMessage, setFeeSuccessMessage] = useState<string | null>(null);
  const [feeErrorMessage, setFeeErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      setIsLoading(false);

      if (data?.role === 'OWNER' || data?.email === 'admin@metix.com' || data?.email === 'lutfifahri175@gmail.com') {
        loadPlatformFees();
      }
    }
    loadProfile();
  }, []);

  const loadPlatformFees = async () => {
    setIsLoadingFees(true);
    try {
      const fees = await fetchOwnerPlatformFees();
      if (fees && fees.length > 0) {
        setPlatformFees(fees);
      } else {
        // Fallback default fees UI state if initial database query returns empty
        setPlatformFees([
          { id: 1, category: 'qris_1', name: 'QRIS (1 Tiket)', percentage: 7.0, fixed_fee: 0 },
          { id: 2, category: 'qris_2', name: 'QRIS (2 Tiket)', percentage: 6.7, fixed_fee: 0 },
          { id: 3, category: 'qris_3', name: 'QRIS (3 Tiket)', percentage: 6.3, fixed_fee: 0 },
          { id: 4, category: 'qris_4_plus', name: 'QRIS (4+ Tiket)', percentage: 5.9, fixed_fee: 0 },
          { id: 5, category: 'ewallet', name: 'E-Wallet (Gopay/OVO/ShopeePay/DANA)', percentage: 9.0, fixed_fee: 0 },
          { id: 6, category: 'virtual_account', name: 'Virtual Account (BCA/Mandiri/BRI/BNI)', percentage: 5.0, fixed_fee: 4500 },
          { id: 7, category: 'credit_card', name: 'Kartu Kredit / Debit', percentage: 7.8, fixed_fee: 2000 },
          { id: 8, category: 'alfamart', name: 'Alfamart / Retail Outlet', percentage: 5.0, fixed_fee: 6500 },
          { id: 9, category: 'paylater', name: 'Paylater (Akulaku/Kredivo/Indodana)', percentage: 7.5, fixed_fee: 0 },
        ]);
      }
    } catch (e) {
      console.warn('Failed to load platform fees', e);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const isOwner = profile?.role === 'OWNER' || profile?.email === 'lutfifahri175@gmail.com' || profile?.email === 'admin@metix.com';
  const isMitraOrOwner = isOwner || profile?.role === 'EO';

  const handleFeeInputChange = (id: number, field: 'percentage' | 'fixed_fee', value: string) => {
    setPlatformFees((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSavePlatformFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFees(true);
    setFeeSuccessMessage(null);
    setFeeErrorMessage(null);

    try {
      const payload = platformFees.map((f) => ({
        id: f.id,
        percentage: Number(f.percentage || 0),
        fixed_fee: Number(f.fixed_fee || 0),
      }));

      await updateOwnerPlatformFees(payload);
      setFeeSuccessMessage('Pengaturan Platform Fee berhasil diperbarui & disimpan di database server!');
      setTimeout(() => setFeeSuccessMessage(null), 5000);
    } catch (err: any) {
      setFeeErrorMessage(err?.message || 'Gagal memperbarui platform fee.');
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgradeSubmitted(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout pageTitle="Account Settings" activeNav="Pengaturan">
      <div className="w-full space-y-6">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-white" /> Preferences & System Management
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Account & System Settings
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Configure system alerts, default locale preferences, and dynamic platform fee settings.
            </p>
          </div>
        </div>

        {/* OWNER EXCLUSIVE: Dynamic Platform Fee Settings Card */}
        {isOwner && (
          <div className="rounded-3xl bg-white border border-blue-100 p-6 sm:p-8 shadow-lg shadow-blue-900/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-amber-600" /> Fitur Khusus Owner / Super Admin
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Pengaturan Biaya Transaksi (Platform Fee)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Atur persentase (%) dan biaya tetap (Rp) untuk tiap metode pembayaran yang dibebankan saat pembeli checkout.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  Akses: <strong className="text-slate-900 font-extrabold">Super Owner</strong>
                </span>
              </div>
            </div>

            {feeSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-in fade-in-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{feeSuccessMessage}</span>
              </div>
            )}

            {feeErrorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-2 animate-in fade-in-0">
                <Zap className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{feeErrorMessage}</span>
              </div>
            )}

            {isLoadingFees ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : (
              <form onSubmit={handleSavePlatformFees} className="space-y-5">
                <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Kategori Metode Pembayaran</th>
                        <th className="py-3.5 px-4 w-44">Biaya Persen (%)</th>
                        <th className="py-3.5 px-4 w-48">Biaya Tetap (Rp)</th>
                        <th className="py-3.5 px-4 text-right">Contoh Simulasi Subtotal Rp 100.000</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {platformFees.map((fee) => {
                        const pct = Number(fee.percentage || 0);
                        const fixed = Number(fee.fixed_fee || 0);
                        const simSubtotal = 100000;
                        const simFee = Math.floor((simSubtotal * pct) / 100) + fixed;

                        return (
                          <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-900 block">{fee.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{fee.category}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={fee.percentage}
                                  onChange={(e) => handleFeeInputChange(fee.id, 'percentage', e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none pr-7"
                                />
                                <span className="absolute right-2.5 text-xs font-bold text-slate-400">%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-bold text-slate-600">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={fee.fixed_fee}
                                  onChange={(e) => handleFeeInputChange(fee.id, 'fixed_fee', e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-r-xl text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                + Rp {simFee.toLocaleString('id-ID')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    * Perubahan tarif akan langsung berlaku secara realtime pada seluruh transaksi checkout baru di website.
                  </p>

                  <button
                    type="submit"
                    disabled={isSavingFees}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  >
                    {isSavingFees ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Perubahan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Simpan Pengaturan Platform Fee
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Upgrade to Mitra EO Card (If Customer) */}
        {!isMitraOrOwner && (
          <div className="rounded-3xl bg-amber-500/10 border border-amber-500/30 p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Upgrade Account to Event Organizer (EO)
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Want to publish your own music concerts, webinars, or festival tickets? Upgrade your account to Mitra EO to gain access to ticket creation and offline POS cashiers.
                </p>
              </div>
            </div>

            {isUpgradeSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Application Submitted! Super Admin Platform will review your request shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleUpgradeSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Organization Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. LiveNation Indonesia"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Bank Account & Name</label>
                    <input
                      type="text"
                      required
                      placeholder="BCA - 849021021 a/n PT Event Live"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  Submit EO Partner Application
                </button>
              </form>
            )}
          </div>
        )}

        {/* System Preferences Form */}
        {isLoading ? (
          <Skeleton className="h-80 w-full rounded-3xl" />
        ) : (
          <form onSubmit={handleSaveSettings} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Notification & Regional Settings
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Manage email digests, ticket receipts, and language options
                </p>
              </div>

              {isSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Preferences saved
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Notification Toggle 1 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Email Ticket Confirmation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Send PDF E-Ticket receipt immediately after payment succeeds.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </div>

              {/* Notification Toggle 2 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Platform Digest & Event Recommendations</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Receive weekly email notifications about upcoming concerts and ticket deals.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
