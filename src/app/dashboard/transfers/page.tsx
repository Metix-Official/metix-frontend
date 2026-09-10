'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchTicketTransfers,
  acceptTicketTransfer,
  rejectTicketTransfer,
  fetchUserTickets,
  fetchUserProfile,
  ApiTicketTransferItem,
  ApiTicketDetail,
  UserProfile,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Mail,
  User,
  Phone,
  Ticket,
  X,
  ShieldAlert,
  FileText,
  Download,
  Printer,
  Sparkles,
  Info,
  CreditCard,
  MapPin,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateSuratKuasaPdf, SuratKuasaData } from '@/lib/suratKuasaGenerator';

export default function TransfersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sentTransfers, setSentTransfers] = useState<ApiTicketTransferItem[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<ApiTicketTransferItem[]>([]);
  const [userTickets, setUserTickets] = useState<ApiTicketDetail[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New Transfer Modal State (In-System Transfer)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  // Surat Kuasa Modal State (Offline / External Transfer Template)
  const [isSuratKuasaModalOpen, setIsSuratKuasaModalOpen] = useState(false);
  const [suratKuasaMode, setSuratKuasaMode] = useState<'prefilled' | 'blank'>('prefilled');
  const [skTicketId, setSkTicketId] = useState<string>('');

  // Form Data Pemberi Kuasa
  const [pemberiNama, setPemberiNama] = useState('');
  const [pemberiNik, setPemberiNik] = useState('');
  const [pemberiEmail, setPemberiEmail] = useState('');
  const [pemberiPhone, setPemberiPhone] = useState('');

  // Form Data Penerima Kuasa
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaNik, setPenerimaNik] = useState('');
  const [penerimaEmail, setPenerimaEmail] = useState('');
  const [penerimaPhone, setPenerimaPhone] = useState('');

  // Kota & Tanggal
  const [signingCity, setSigningCity] = useState('Jakarta');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTicketTransfers();
      setSentTransfers(data.sentTransfers);
      setReceivedTransfers(data.receivedTransfers);

      const tickets = await fetchUserTickets();
      const active = tickets.filter((t) => t.status === 'active');
      setUserTickets(active);
      if (active.length > 0) {
        setSelectedTicketId(String(active[0].id));
        setSkTicketId(String(active[0].id));
      }

      const userProfile = await fetchUserProfile();
      if (userProfile) {
        setCurrentUser(userProfile);
        setPemberiNama(userProfile.name || '');
        setPemberiEmail(userProfile.email || '');
        setPemberiPhone((userProfile.phone || '').replace(/\D/g, '').slice(0, 13));
        setPemberiNik((userProfile as any).nik || '');
      }
    } catch (err) {
      console.error('Failed to load transfer data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (transferId: number) => {
    const ok = await acceptTicketTransfer(transferId);
    if (ok) {
      setActionMessage('Transfer tiket berhasil Anda terima! Tiket kini telah berpindah ke akun Anda.');
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    }
  };

  const handleReject = async (transferId: number) => {
    const ok = await rejectTicketTransfer(transferId, 'Ditolak oleh penerima');
    if (ok) {
      setActionMessage('Transfer tiket telah ditolak.');
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    }
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setActionMessage('Permintaan transfer tiket telah berhasil dikirim! OTP verifikasi telah dikirimkan ke email Anda.');
      setTimeout(() => setActionMessage(null), 4000);
    }, 1200);
  };

  // Unduh Template Kosong
  const handleDownloadBlankTemplate = () => {
    try {
      toast.loading('Menyiapkan Template Kosong Surat Kuasa...', { id: 'sk-toast' });
      generateSuratKuasaPdf({
        isBlank: true,
        docCity: 'Jakarta',
      });
      toast.success('Template Surat Kuasa (Blank PDF) berhasil diunduh!', { id: 'sk-toast' });
      setIsSuratKuasaModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh template.', { id: 'sk-toast' });
    }
  };

  // Unduh Pre-filled dari Form Modal
  const handleDownloadPrefilledSuratKuasa = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading('Menghasilkan Dokumen Surat Kuasa PDF...', { id: 'sk-toast' });
      const selectedTicket = userTickets.find((t) => String(t.id) === skTicketId);

      let dateFormatted = '';
      if (selectedTicket?.event?.event_start_at) {
        try {
          dateFormatted = new Date(selectedTicket.event.event_start_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        } catch { }
      }

      const payload: SuratKuasaData = {
        isBlank: false,
        pemberiNama: pemberiNama.trim() || 'Pemilik Tiket',
        pemberiNik: pemberiNik.trim() || '................................................',
        pemberiEmail: pemberiEmail.trim() || 'user@metix.id',
        pemberiPhone: pemberiPhone.trim() || '-',

        penerimaNama: penerimaNama.trim() || 'Penerima Kuasa',
        penerimaNik: penerimaNik.trim() || '................................................',
        penerimaEmail: penerimaEmail.trim() || '-',
        penerimaPhone: penerimaPhone.trim() || '-',

        eventTitle: selectedTicket?.event?.title || 'Metix Official Concert',
        eventDate: dateFormatted || 'Sesuai Jadwal Resmi Acara',
        eventLocation: selectedTicket?.event?.location || 'Stadion / Venue Konser Resmi',
        ticketType: selectedTicket?.ticket_type?.name || 'Standard Pass',
        ticketCode: selectedTicket?.ticket_code || 'MTX-OFFICIAL-PASS',
        orderNumber: selectedTicket?.order?.order_number || selectedTicket?.ticket_code || 'ORD-METIX',

        docCity: signingCity.trim() || 'Jakarta',
      };

      generateSuratKuasaPdf(payload);
      toast.success('Surat Kuasa Transfer Tiket resmi berhasil diunduh!', { id: 'sk-toast' });
      setIsSuratKuasaModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghasilkan dokumen Surat Kuasa.', { id: 'sk-toast' });
    }
  };

  // Unduh Surat Kuasa dari riwayat tabel transaksi transfer
  const handleDownloadFromHistoryItem = (item: ApiTicketTransferItem) => {
    try {
      toast.loading('Menyiapkan Surat Kuasa dari data transfer...', { id: 'sk-history' });
      const eventTitle = item.ticket?.event?.title || 'Metix Concert Pass';
      const ticketCode = item.ticket?.ticket_code || 'TKT-OFFICIAL';
      const orderNumber = item.ticket?.order?.order_number || `ORD-${item.id}`;
      const ticketType = item.ticket?.ticket_type?.name || 'General Admission';

      let dateFormatted = '';
      if (item.ticket?.event?.event_start_at) {
        try {
          dateFormatted = new Date(item.ticket.event.event_start_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        } catch { }
      }

      const payload: SuratKuasaData = {
        isBlank: false,
        pemberiNama: item.from_user?.name || currentUser?.name || 'Pemilik Tiket Metix',
        pemberiNik: (currentUser as any)?.nik || '................................................',
        pemberiEmail: item.from_user?.email || currentUser?.email || 'pemberi@metix.id',
        pemberiPhone: currentUser?.phone || '-',

        penerimaNama: item.recipient_name || item.to_user?.name || 'Penerima Tiket',
        penerimaNik: '................................................',
        penerimaEmail: item.recipient_email || item.to_user?.email || 'penerima@metix.id',
        penerimaPhone: item.recipient_phone || '-',

        eventTitle,
        eventDate: dateFormatted || 'Sesuai Jadwal Penyelenggara',
        eventLocation: item.ticket?.event?.location || 'Venue Resmi Acara',
        ticketType,
        ticketCode,
        orderNumber,

        docCity: 'Jakarta',
        docNumber: `SKT/MTX/TRF-${item.id}`,
      };

      generateSuratKuasaPdf(payload);
      toast.success(`Surat Kuasa #${item.id} (${ticketCode}) berhasil diunduh!`, { id: 'sk-history' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh Surat Kuasa dari transaksi ini.', { id: 'sk-history' });
    }
  };

  const currentList = activeTab === 'sent' ? sentTransfers : receivedTransfers;
  const filteredList = currentList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const eventTitle = item.ticket?.event?.title || '';
    const code = item.ticket?.ticket_code || '';
    const recipient = item.recipient_email || item.recipient_name || '';
    return eventTitle.toLowerCase().includes(q) || code.toLowerCase().includes(q) || recipient.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
          </span>
        );
      case 'pending':
      case 'pending_acceptance':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Penerima
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
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout pageTitle="Transfer Tiket Saya" activeNav="Transfer Tiket">
      <div className="w-full space-y-6">


        {/* Informative Notice Box: Prosedur Transfer Offline */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200/90 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                Ingin Mengalihkan Tiket di Luar Sistem Metix?
              </h4>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                Jika Anda melakukan transaksi langsung atau ingin mewakilkan penukaran wristband ke orang lain, Anda <strong>wajib</strong> mencetak template Surat Kuasa resmi dan membubuhkan tanda tangan basah di atas <strong>Materai Rp 10.000</strong> beserta fotokopi KTP asli.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSuratKuasaModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold whitespace-nowrap shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Buka Template Surat Kuasa
          </button>
        </div>

        {/* Action Alert Notification */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

      </div>

      {/* ================= MODAL DOWNLOAD TEMPLATE SURAT KUASA ================= */}
      {isSuratKuasaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white relative shrink-0">
              <button
                onClick={() => setIsSuratKuasaModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" /> Dokumen Legalitas Resmi Penukaran Tiket
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Unduh Surat Kuasa Transfer Tiket</h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Gunakan template resmi ini untuk transfer kepemilikan atau mewakilkan penukaran tiket di luar sistem Metix.
              </p>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-2 mt-4 bg-white/10 p-1 rounded-xl border border-white/15 w-fit">
                <button
                  type="button"
                  onClick={() => setSuratKuasaMode('prefilled')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${suratKuasaMode === 'prefilled'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Terisi Otomatis (Pre-filled)
                </button>
                <button
                  type="button"
                  onClick={() => setSuratKuasaMode('blank')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${suratKuasaMode === 'blank'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                    }`}
                >
                  <Printer className="w-3.5 h-3.5" /> Template Kosong (Tulis Tangan)
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5">
              {suratKuasaMode === 'blank' ? (
                /* Mode Blank Template */
                <div className="space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-2">
                    <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-blue-950">
                      <FileText className="w-4 h-4 text-blue-600" /> Formulir Resmi Siap Cetak (A4)
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Template kosong ini mencantumkan format resmi standar Metix dengan kolom titik-titik siap isi tulisan tangan menggunakan pena hitam.
                    </p>
                    <ul className="text-[11px] text-blue-700 space-y-1 list-disc list-inside pt-1">
                      <li>Telah dilengkapi kop resmi Metix Indonesia dan nomor dokumen.</li>
                      <li>Menyediakan kolom Materai Rp 10.000 untuk ditandatangani basah.</li>
                      <li>Memuat pasal pembebasan tanggung jawab dan persetujuan transfer resmi.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="font-extrabold">Tips Penyelenggara:</span> Pastikan melampirkan fotokopi KTP/Paspor asli Pemberi Kuasa dan Penerima Kuasa saat menyerahkan surat kuasa ini di Ticket Box / Venue.
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSuratKuasaModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBlankTemplate}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Unduh Template Kosong (PDF)
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode Pre-filled Form */
                <form onSubmit={handleDownloadPrefilledSuratKuasa} className="space-y-4">
                  {/* Bagian 1: Pilih Tiket Aktif */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-blue-600" /> Pilih Tiket yang Ingin Dikuasakan / Ditransfer
                    </label>
                    {userTickets.length > 0 ? (
                      <Select value={skTicketId} onValueChange={setSkTicketId}>
                        <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                          <SelectValue placeholder="Pilih Tiket Aktif Anda" />
                        </SelectTrigger>
                        <SelectContent>
                          {userTickets.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.event?.title || 'Metix Event'} — ({t.ticket_code}) [{t.ticket_type?.name || 'Tiket'}]
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tidak ada tiket aktif terdeteksi. Data tiket akan menggunakan format template standar.</span>
                      </div>
                    )}
                  </div>

                  {/* Bagian 2: Data Pemberi Kuasa (Pemilik Tiket) */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" /> Data Pemberi Kuasa (Pemilik Tiket Asli)
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">(Otomatis terisi dari profil Anda)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={pemberiNama}
                          onChange={(e) => setPemberiNama(e.target.value)}
                          placeholder="Nama lengkap sesuai KTP"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nomor Identitas (NIK/KTP/Paspor)</label>
                        <input
                          type="text"
                          required
                          value={pemberiNik}
                          onChange={(e) => setPemberiNik(e.target.value)}
                          placeholder="16 digit NIK atau No. Paspor"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Email Pemilik Tiket</label>
                        <input
                          type="email"
                          required
                          value={pemberiEmail}
                          onChange={(e) => setPemberiEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nomor Telepon / WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={pemberiPhone}
                          onChange={(e) => setPemberiPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Data Penerima Kuasa */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" /> Data Penerima Kuasa (Penerima Tiket)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nama Lengkap Penerima</label>
                        <input
                          type="text"
                          required
                          value={penerimaNama}
                          onChange={(e) => setPenerimaNama(e.target.value)}
                          placeholder="Nama lengkap sesuai KTP penerima"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nomor Identitas (NIK/KTP/Paspor)</label>
                        <input
                          type="text"
                          required
                          value={penerimaNik}
                          onChange={(e) => setPenerimaNik(e.target.value)}
                          placeholder="16 digit NIK penerima"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Email Penerima</label>
                        <input
                          type="email"
                          required
                          value={penerimaEmail}
                          onChange={(e) => setPenerimaEmail(e.target.value)}
                          placeholder="emailpenerima@gmail.com"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nomor Telepon / WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={penerimaPhone}
                          onChange={(e) => setPenerimaPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kota Penandatanganan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Kota Penandatanganan</label>
                      <input
                        type="text"
                        required
                        value={signingCity}
                        onChange={(e) => setSigningCity(e.target.value)}
                        placeholder="Contoh: Jakarta"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Ketentuan Materai</label>
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Wajib Materai Rp 10.000 di kolom Pemberi Kuasa</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSuratKuasaModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Unduh Surat Kuasa PDF Resmi
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL INISIASI TRANSFER TIKET BARU (IN-SYSTEM) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Form Transfer Tiket Baru</h3>
              <p className="text-xs text-blue-100 font-medium">
                Pilih tiket aktif Anda dan masukkan email penerima resmi.
              </p>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleCreateTransferSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Pilih Tiket Aktif</label>
                {userTickets.length > 0 ? (
                  <>
                    <input type="hidden" name="ticket_id" value={selectedTicketId} />
                    <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
                      <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                        <SelectValue placeholder="Pilih Tiket Aktif" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTickets.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.event?.title || 'Metix Event'} — ({t.ticket_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Anda belum memiliki tiket aktif untuk ditransfer.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Nama Penerima</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Budi Santoso"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Email Penerima</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="budi@gmail.com"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Nomor Telepon Penerima</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
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
                  disabled={isSubmitting || userTickets.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim OTP...' : 'Kirim OTP Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
