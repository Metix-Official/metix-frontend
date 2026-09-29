'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchEventSetting,
  updateEventSetting,
  fetchOrganizerEventDetail,
  ApiEventSetting,
  ApiEvent,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  Clock,
  UserCheck,
  Loader2,
} from 'lucide-react';

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function EventSettingsPage({ params }: SettingsPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [setting, setSetting] = useState<ApiEventSetting>({
    allow_ticket_transfer: true,
    transfer_fee: 5000,
    max_ticket_per_order: 5,
    reservation_timeout: 15,
    require_identity: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evtData, settingData] = await Promise.all([
        fetchOrganizerEventDetail(eventId).catch(() => null),
        fetchEventSetting(Number(eventId)),
      ]);

      if (evtData) setEvent(evtData);
      if (settingData) {
        setSetting({
          allow_ticket_transfer: Boolean(settingData.allow_ticket_transfer),
          transfer_fee: Number(settingData.transfer_fee || 0),
          max_ticket_per_order: Number(settingData.max_ticket_per_order || 5),
          reservation_timeout: Number(settingData.reservation_timeout || 15),
          require_identity: Boolean(settingData.require_identity),
        });
      }
    } catch (err: any) {
      toast.error('Gagal Memuat Pengaturan Event', {
        description: err?.message || 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEventSetting(Number(eventId), setting);
      toast.success('Pengaturan Event Berhasil Disimpan! 🎉');
    } catch (err: any) {
      toast.error('Gagal Menyimpan Pengaturan', {
        description: err?.message || 'Silakan coba beberapa saat lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Pengaturan Event" activeNav="/dashboard/events">
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

        {/* Banner Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white p-6 sm:p-7 shadow-xl shadow-indigo-700/15 border border-indigo-600/30">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5 text-indigo-200" /> Relasi: event_settings
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Pengaturan: {event?.title || `Event #${eventId}`}
            </h2>
            <p className="text-xs text-indigo-100 font-medium max-w-2xl leading-relaxed">
              Konfigurasi parameter kebijakan tiket, batas checkout, dan transfer kepemilikan tiket untuk acara ini.
            </p>
          </div>
        </div>

        {/* Content Form & Table Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tabel Parameter Pengaturan Event (event_settings)
              </h3>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4 w-1/3">Parameter Kebijakan</th>
                      <th className="py-3.5 px-4 w-1/3">Nilai Konfigurasi</th>
                      <th className="py-3.5 px-4 text-right">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 1. Allow Ticket Transfer */}
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">1</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Transfer Kepemilikan Tiket
                          </span>
                          <span className="text-[11px] text-slate-400">allow_ticket_transfer</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={setting.allow_ticket_transfer}
                            onChange={(e) =>
                              setSetting({ ...setting, allow_ticket_transfer: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-xs font-bold text-slate-800">
                            {setting.allow_ticket_transfer ? 'Diizinkan' : 'Dinonaktifkan'}
                          </span>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-medium">
                        Pembeli dapat mentransfer tiket ke pengguna lain
                      </td>
                    </tr>

                    {/* 2. Transfer Fee */}
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">2</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Biaya Transfer Tiket (Rp)
                          </span>
                          <span className="text-[11px] text-slate-400">transfer_fee</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          min={0}
                          value={setting.transfer_fee}
                          onChange={(e) =>
                            setSetting({ ...setting, transfer_fee: Number(e.target.value) || 0 })
                          }
                          className="w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-medium">
                        Biaya administrasi saat tiket dipindahtangankan
                      </td>
                    </tr>

                    {/* 3. Max Ticket Per Order */}
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">3</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Maksimal Tiket per Pesanan
                          </span>
                          <span className="text-[11px] text-slate-400">max_ticket_per_order</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={setting.max_ticket_per_order}
                          onChange={(e) =>
                            setSetting({
                              ...setting,
                              max_ticket_per_order: Number(e.target.value) || 1,
                            })
                          }
                          className="w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-medium">
                        Batas kuota pembelian dalam 1x checkout
                      </td>
                    </tr>

                    {/* 4. Reservation Timeout */}
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">4</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Batas Waktu Pembayaran (Menit)
                          </span>
                          <span className="text-[11px] text-slate-400">reservation_timeout</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={setting.reservation_timeout}
                          onChange={(e) =>
                            setSetting({
                              ...setting,
                              reservation_timeout: Number(e.target.value) || 15,
                            })
                          }
                          className="w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-medium">
                        Waktu penahanan stok tiket sebelum kedaluwarsa
                      </td>
                    </tr>

                    {/* 5. Require Identity */}
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">5</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-xs">
                            Verifikasi Identitas (NIK KTP)
                          </span>
                          <span className="text-[11px] text-slate-400">require_identity</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={setting.require_identity}
                            onChange={(e) =>
                              setSetting({ ...setting, require_identity: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-xs font-bold text-slate-800">
                            {setting.require_identity ? 'Wajib NIK' : 'Opsional'}
                          </span>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500 font-medium">
                        Pembeli wajib memasukkan 16 digit NIK saat checkout
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Pengaturan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
