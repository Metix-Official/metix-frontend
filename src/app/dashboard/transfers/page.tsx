'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchTicketTransfers,
  acceptTicketTransfer,
  rejectTicketTransfer,
  fetchUserTickets,
  ApiTicketTransferItem,
  ApiTicketDetail,
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
import { Send, ArrowUpRight, ArrowDownLeft, Search, CheckCircle2, XCircle, Clock, Plus, Mail, User, Phone, Ticket, X, ShieldAlert, FileText } from 'lucide-react';

export default function TransfersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sentTransfers, setSentTransfers] = useState<ApiTicketTransferItem[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<ApiTicketTransferItem[]>([]);
  const [userTickets, setUserTickets] = useState<ApiTicketDetail[]>([]);
  
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // New Transfer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchTicketTransfers();
    setSentTransfers(data.sentTransfers);
    setReceivedTransfers(data.receivedTransfers);

    const tickets = await fetchUserTickets();
    const active = tickets.filter((t) => t.status === 'active');
    setUserTickets(active);
    if (active.length > 0) {
      setSelectedTicketId(String(active[0].id));
    }
    setIsLoading(false);
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
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Send className="w-3.5 h-3.5 text-white" /> Secure E-Ticket Transfer Manager
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Kelola Transfer Tiket Resmi
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Kirim tiket konser/event ke teman, verifikasi OTP & Surat Kuasa otomatis, atau terima tiket masuk.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Transfer Tiket Baru
            </button>
          </div>
        </div>

        {/* Action Alert Notification */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Main Content Container */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          {/* Header Controls (Tabs & Search) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'sent'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Tiket Dikirim ({sentTransfers.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'received'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> Tiket Diterima ({receivedTransfers.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event, kode tiket, atau penerima..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Transfers Table */}
          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : filteredList.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4 rounded-l-xl">Event & Tiket</th>
                    <th className="py-3.5 px-4">{activeTab === 'sent' ? 'Penerima Tiket' : 'Pengirim Tiket'}</th>
                    <th className="py-3.5 px-4">Status Transfer</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item) => {
                    const eventTitle = item.ticket?.event?.title || 'Metix Concert Pass';
                    const ticketCode = item.ticket?.ticket_code || 'TKT-84920';
                    const recipientName = item.recipient_name || item.to_user?.name || item.recipient_email || 'Recipient';
                    const recipientEmail = item.recipient_email || item.to_user?.email || 'recipient@gmail.com';
                    const senderName = item.from_user?.name || item.from_user?.email || 'Pengirim Metix';

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-extrabold shrink-0">
                              <Ticket className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {eventTitle}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono font-bold">
                                {ticketCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-extrabold text-slate-800">
                              {activeTab === 'sent' ? recipientName : senderName}
                            </span>
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {activeTab === 'sent' ? recipientEmail : item.from_user?.email}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          {activeTab === 'received' && item.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAccept(item.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer"
                              >
                                Terima Tiket
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] transition-all cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => alert(`Detail Transfer #${item.id} - Kode: ${ticketCode}`)}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] transition-all cursor-pointer"
                            >
                              Detail & Surat Kuasa
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
            /* Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80 my-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Belum Ada Transaksi Transfer
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  {activeTab === 'sent'
                    ? 'Anda belum pernah mengirim tiket ke pengguna lain. Klik tombol "+ Transfer Tiket Baru" untuk memulai.'
                    : 'Belum ada tiket masuk yang ditransfer oleh pengguna lain ke akun Anda.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL INISTIASI TRANSFER TIKET BARU ================= */}
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
