'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { fetchUserTickets, ApiTicketDetail, getStoredUser } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Ticket, Search, Calendar, MapPin, QrCode, Sparkles, X, Printer, CheckCircle2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';

export default function TicketsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<ApiTicketDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used'>('all');
  const [selectedTicket, setSelectedTicket] = useState<ApiTicketDetail | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    const role = (user?.role || 'BUYER').toUpperCase();
    if (role !== 'BUYER') {
      toast.error('Halaman E-Tiket hanya dapat diakses oleh akun Pembeli (Buyer).');
      router.replace('/dashboard');
      return;
    }

    async function loadTickets() {
      setIsLoading(true);
      const data = await fetchUserTickets();
      setTickets(data);
      setIsLoading(false);
    }
    loadTickets();
  }, [router]);

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((item) => {
      const matchSearch =
        (item.event?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ticket_code || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeTab === 'active') {
        return item.status === 'active';
      }
      if (activeTab === 'used') {
        return item.status === 'used';
      }
      return true;
    });
  }, [tickets, searchQuery, activeTab]);

  // Pure Next.js Client-Side PDF Generation Handler using jsPDF
  const handlePrintTicketPdf = async (ticket: ApiTicketDetail) => {
    try {
      toast.loading('Membangun dokumen PDF E-Tiket...', { id: 'jspdf-toast' });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const eventTitle = ticket.event?.title || 'Metix National Event 2026';
      const venue = ticket.event?.location || 'Stadion Gelora Bung Karno, Jakarta';
      const ticketType = ticket.ticket_type?.name || 'VIP Early Bird Pass';
      const buyerName = ticket.order?.buyer_name || 'Guest User';
      const buyerEmail = ticket.order?.buyer_email || 'buyer@metix.id';
      const priceStr = ticket.ticket_type?.price
        ? `Rp ${Number(ticket.ticket_type.price).toLocaleString('id-ID')}`
        : 'Rp 150.000';
      const ticketCode = ticket.ticket_code || 'TKT-H1DLZTWIOW';

      let dateStr = '15 September 2026';
      if (ticket.event?.event_start_at) {
        try {
          dateStr = new Date(ticket.event.event_start_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        } catch {}
      }

      // Card Dimensions: 180mm x 140mm (Perfect proportion, zero excessive white space)
      const cardX = 15;
      const cardY = 25;
      const cardWidth = 180;

      // 1. Draw Outer Card Container Shadow & Border
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, cardY, cardWidth, 138, 5, 5, 'FD');

      // 2. Top Banner Header (Height: 38mm)
      doc.setFillColor(30, 58, 138); // Deep Navy Blue #1e3a8a
      doc.roundedRect(cardX, cardY, cardWidth, 38, 5, 5, 'F');
      // Cover bottom rounded corners of header banner to fit body container
      doc.rect(cardX, cardY + 30, cardWidth, 8, 'F');

      // Gold Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(253, 224, 71); // Gold #fde047
      doc.text('OFFICIAL VIP E-TICKET PASS', cardX + 8, cardY + 11);

      // Event Title
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(eventTitle.substring(0, 42), cardX + 8, cardY + 21);

      // Ticket Code Tag
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(147, 197, 253); // Light Blue #93c5fd
      doc.text(`CODE: ${ticketCode}`, cardX + 8, cardY + 31);

      // 3. QR Code Section (Left Side)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        ticketCode
      )}`;

      try {
        const imgRes = await fetch(qrUrl);
        const blob = await imgRes.blob();
        const reader = new FileReader();
        const qrBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Draw QR Code Frame
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.4);
        doc.roundedRect(cardX + 8, cardY + 45, 54, 54, 3, 3, 'D');

        doc.addImage(qrBase64, 'PNG', cardX + 10, cardY + 47, 50, 50);
      } catch {
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.text(`[ QR: ${ticketCode} ]`, cardX + 10, cardY + 70);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text('SCAN DI GATE CHECK-IN', cardX + 10, cardY + 105);

      // 4. Information Rows (Right Side)
      let startY = cardY + 46;
      const leftCol = cardX + 72;

      const drawRow = (label: string, value: string, isHighlight = false) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(label.toUpperCase(), leftCol, startY);

        doc.setFontSize(isHighlight ? 11 : 9.5);
        doc.setTextColor(isHighlight ? 29 : 15, isHighlight ? 78 : 23, isHighlight ? 216 : 42);
        doc.text(value.substring(0, 42), leftCol, startY + 4.5);

        // Divider Line
        doc.setDrawColor(241, 245, 249);
        doc.line(leftCol, startY + 8, cardX + cardWidth - 8, startY + 8);
        startY += 12.5;
      };

      drawRow('Kategori Tiket', ticketType, true);
      drawRow('Pemilik Tiket (Holder)', `${buyerName} (${buyerEmail})`);
      drawRow('Waktu & Tanggal Event', dateStr);
      drawRow('Lokasi Venue', venue);
      drawRow('Nominal Tiket', priceStr);

      // 5. Bottom Ticket Stub Footer Section (Separated by Dashed Line)
      const footerY = cardY + 114;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);

      // Footer Background Box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(cardX, footerY, cardWidth, 24, 0, 0, 'F');
      // Re-draw rounded bottom corners for card container
      doc.roundedRect(cardX, cardY, cardWidth, 138, 5, 5, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Petunjuk Check-in: Tunjukkan PDF E-Ticket Pass ini kepada petugas gate venue event.', cardX + 8, footerY + 9);
      doc.text('QR Code hanya berlaku untuk 1x scan check-in di venue event.', cardX + 8, footerY + 15);

      // Brand Logo Watermark - METIX (NOT METIX PRO)
      doc.setFont('helvetica', 'black');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // Navy #1e3a8a
      doc.text('METIX', cardX + cardWidth - 28, footerY + 13);

      // 6. Output PDF to Browser Blob URL Viewport
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      toast.success('Dokumen PDF E-Tiket METIX berhasil dibuat!', { id: 'jspdf-toast' });
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('jsPDF Client Generation Error:', err);
      toast.error('Gagal memproses dokumen PDF E-Tiket.', { id: 'jspdf-toast' });
    }
  };

  return (
    <DashboardLayout pageTitle="E-Tiket Saya" activeNav="Tiket Saya">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5 text-white" /> Digital E-Ticket Pass Manager
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Koleksi E-Tiket Pass Saya
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Akses QR Code check-in venue real-time, cetak e-ticket pass, dan unduh tanda bukti transaksi.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Tiket ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siap Check-In ({tickets.filter((t) => t.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveTab('used')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'used'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudah Digunakan ({tickets.filter((t) => t.status === 'used').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event atau kode tiket..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Ticket Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredTickets.map((item) => {
                const isUsed = item.status === 'used';
                const isCancelled = item.status === 'cancelled';
                const eventTitle = item.event?.title || 'Event Metix Pass';
                const venue = item.event?.location || 'Venue Utama';
                const ticketType = item.ticket_type?.name || 'VIP Pass';
                const priceStr = item.ticket_type?.price
                  ? `Rp ${Number(item.ticket_type.price).toLocaleString('id-ID')}`
                  : 'Rp 150.000';

                let dateStr = '15 Sep 2026';
                if (item.event?.event_start_at) {
                  try {
                    dateStr = new Date(item.event.event_start_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                  } catch {
                    // Fallback
                  }
                }

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Top Decorative Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-5 text-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-xs">
                          {ticketType}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isUsed
                              ? 'bg-slate-900/40 text-slate-200 border-white/20'
                              : isCancelled
                              ? 'bg-rose-500/40 text-rose-100 border-rose-300/30'
                              : 'bg-emerald-500/40 text-emerald-100 border-emerald-300/30'
                          }`}
                        >
                          {isUsed ? 'Sudah Digunakan' : isCancelled ? 'Dibatalkan' : 'Siap Check-In'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold tracking-tight leading-snug line-clamp-1">
                          {eventTitle}
                        </h3>
                        <p className="text-xs text-blue-100 font-mono font-bold mt-0.5">
                          {item.ticket_code || 'TKT-84920'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Card Details */}
                    <div className="p-5 space-y-3 flex-1 bg-white">
                      <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{venue}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Harga Tiket:</span>
                        <span className="font-extrabold text-slate-900">{priceStr}</span>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      {isUsed ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled
                            className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-2xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sudah Di-Scan (Checked-In)
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintTicketPdf(item)}
                            title="Cetak Bukti E-Tiket PDF"
                            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
                          >
                            <Printer className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      ) : isCancelled ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed shadow-2xs"
                        >
                          <XCircle className="w-4 h-4 text-rose-500" /> Tiket Dibatalkan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(item)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" /> Lihat E-Tiket Pass & QR Code
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Premium Empty State */
            <div className="py-14 text-center space-y-3 bg-slate-50/70 rounded-3xl border border-slate-200/80 my-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                <Ticket className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Belum Ada Tiket Ditemukan
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Belum ada tiket terdaftar pada kategori ini. Beli tiket event menarik dari halaman utama untuk mengisi koleksi E-Tiket Anda!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= ULTRA PREMIUM E-TICKET PASS & QR CODE MODAL ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 space-y-0">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 p-6 text-white text-center relative">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" /> Official VIP E-Ticket Pass
              </div>

              <h3 className="text-lg font-extrabold tracking-tight line-clamp-1">
                {selectedTicket.event?.title || 'Metix Event Pass'}
              </h3>
              <p className="text-xs text-blue-100 font-mono font-bold mt-1">
                CODE: {selectedTicket.ticket_code || 'TKT-84920'}
              </p>
            </div>

            {/* Modal QR Code Section */}
            <div className="p-6 text-center space-y-4 bg-white">
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-blue-200 inline-block shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    selectedTicket.ticket_code || 'TKT-84920'
                  )}`}
                  alt="E-Ticket QR Code"
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Scan QR Code di Gate Check-In Venue
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tunjukkan tampilan layar ini atau hasil cetak PDF ke petugas check-in.
                </p>
              </div>

              {/* Detail Ringkasan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Tipe Tiket:</span>
                  <span className="font-extrabold text-blue-700">
                    {selectedTicket.ticket_type?.name || 'VIP Pass'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Pemilik Tiket:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedTicket.order?.buyer_name || 'Pembeli Metix'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Venue Location:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">
                    {selectedTicket.event?.location || 'GBK Senayan, Jakarta'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => handlePrintTicketPdf(selectedTicket)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Cetak E-Pass PDF
              </button>

              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-blue-600/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
