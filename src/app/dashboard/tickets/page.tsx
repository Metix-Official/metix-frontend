'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { fetchUserTickets, fetchUserOrders, fetchPublicEvents, ApiTicketDetail, getStoredUser, getTicketPdfUrl, getTicketQrUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Ticket, Search, Calendar, MapPin, QrCode, X, Printer, Download, CheckCircle2, XCircle, RotateCw, Clock, AlertTriangle, CreditCard, Lock, Copy, ChevronDown, ChevronUp, HelpCircle, Check, Building2, Wallet, Store, Zap } from 'lucide-react';
import jsPDF from 'jspdf';

import { getUserRole } from '@/lib/roles';

// Helper komprehensif untuk membaca nama venue dari relasi event (venue_id / venue object)
export function resolveVenueName(eventObj: any): string {
  if (!eventObj) return '-';

  // 1. Cek relasi objek venue (Laravel belongsTo: $event->venue)
  if (eventObj.venue && typeof eventObj.venue === 'object') {
    const vName = (eventObj.venue.name || eventObj.venue.venue_name || '').trim();
    const vCity = (eventObj.venue.city || '').trim();
    if (vName && vCity && vName.toLowerCase() !== vCity.toLowerCase()) {
      return `${vName}, ${vCity}`;
    }
    if (vName) return vName;
    if (vCity) return vCity;
    if (eventObj.venue.address) return eventObj.venue.address;
  }

  // 2. Cek jika venue adalah string langsung
  if (typeof eventObj.venue === 'string' && eventObj.venue.trim() && eventObj.venue !== 'Venue Utama') {
    return eventObj.venue.trim();
  }

  // 3. Cek properti venue_name
  if (eventObj.venue_name && typeof eventObj.venue_name === 'string' && eventObj.venue_name.trim()) {
    const vCity = eventObj.city ? `, ${eventObj.city.trim()}` : '';
    return `${eventObj.venue_name.trim()}${vCity}`;
  }

  // 4. Cek properti location
  if (eventObj.location && typeof eventObj.location === 'string' && eventObj.location.trim() && eventObj.location !== 'Venue Utama') {
    return eventObj.location.trim();
  }

  // 5. Cek properti city / address
  if (eventObj.city || eventObj.address) {
    const parts = [eventObj.address, eventObj.city].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }

  return 'Venue Utama';
}

function OrderCountdownCard({ order, onRefresh }: { order: any; onRefresh: () => void }) {
  const createdAtMs = order.created_at ? new Date(order.created_at).getTime() : Date.now();
  const expiresAtMs = order.expires_at ? new Date(order.expires_at).getTime() : (createdAtMs + 10 * 60 * 1000);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  });

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAtMs, timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isExpired = timeLeft <= 0;

  const orderNum = order.order_number || (order.id ? `#MTX-${order.id}` : '#MTX-ORDER');
  const totalPrice = Number(order.total_amount || order.grand_total || order.total_price || 0);
  const eventTitle = order.event?.title || order.items?.[0]?.ticket_type?.name || 'Event Metix Pass';
  const paymentUrl = order.payment_url || (order.payment?.payment_url) || null;

  // Resolve Payment Method Name & VA / Code / Account Number
  const categoryRaw = (order.payment_category || order.payment_method || order.payment?.payment_method || 'QRIS').toUpperCase();
  let paymentMethodName = 'QRIS Instant (Scan QR)';
  let paymentCode = order.payment?.payment_code || order.payment?.va_number || order.va_number || '8801' + String(order.id || 1001).padStart(8, '0');

  if (categoryRaw.includes('VA') || categoryRaw.includes('VIRTUAL') || categoryRaw.includes('TRANSFER')) {
    paymentMethodName = 'Virtual Account Bank (BCA / Mandiri / BNI / BRI)';
  } else if (categoryRaw.includes('EWALLET') || categoryRaw.includes('E_WALLET') || categoryRaw.includes('GOPAY') || categoryRaw.includes('OVO')) {
    paymentMethodName = 'E-Wallet (GoPay / ShopeePay / OVO / DANA)';
  } else if (categoryRaw.includes('ALFAMART') || categoryRaw.includes('RETAIL')) {
    paymentMethodName = 'Gerai Retail Alfamart / Indomaret';
  } else if (categoryRaw.includes('CREDIT') || categoryRaw.includes('CARD')) {
    paymentMethodName = 'Kartu Kredit / Debit Visa & Mastercard';
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(paymentCode);
    setCopiedCode(true);
    toast.success('Nomor VA / Kode Pembayaran Berhasil Disalin!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 shadow-sm animate-in fade-in-0 ${
      isExpired
        ? 'bg-rose-50/80 border-rose-200 text-slate-900'
        : 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border-blue-600/40 shadow-xl shadow-blue-950/10'
    }`}>
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className={`text-xs font-black uppercase tracking-wider ${isExpired ? 'text-rose-700 font-extrabold' : 'text-amber-300'}`}>
            {isExpired ? 'Pesanan Dibatalkan (Expired 10 Menit)' : '⏱️ Menunggu Pembayaran'}
          </span>
        </div>

        {!isExpired ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black tracking-wider shadow-md">
            <Clock className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>Hitung Mundur: {formattedTimer} Menit</span>
          </div>
        ) : (
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-rose-200/80 text-rose-800 border border-rose-300 uppercase">
            Batas Waktu 10 Menit Habis — Status: Cancelled
          </span>
        )}
      </div>

      {/* Main Order & Payment Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono font-extrabold ${isExpired ? 'text-rose-600' : 'text-blue-300'}`}>
              Nomor Pesanan: {orderNum}
            </span>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              isExpired ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-blue-900/60 text-amber-300 border-amber-400/30'
            }`}>
              {paymentMethodName}
            </span>
          </div>

          <h4 className={`text-base sm:text-lg font-black ${isExpired ? 'text-slate-900' : 'text-white'}`}>
            {eventTitle}
          </h4>

          <p className={`text-xs font-medium leading-relaxed ${isExpired ? 'text-slate-600' : 'text-slate-300'}`}>
            {isExpired
              ? 'Waktu pembayaran 10 menit telah berakhir. Status pesanan otomatis dibatalkan.'
              : 'Silakan transfer tagihan sebesar Rp ' + totalPrice.toLocaleString('id-ID') + ' ke nomor pembayaran di bawah ini sebelum batas 10 menit berakhir.'}
          </p>
        </div>

        <div className="flex flex-col sm:items-end shrink-0 space-y-2">
          <div className="text-right">
            <span className={`text-[10px] uppercase font-bold block ${isExpired ? 'text-slate-400' : 'text-blue-200'}`}>Total Tagihan Presisi</span>
            <div className={`text-xl font-black ${isExpired ? 'text-slate-500 line-through' : 'text-amber-300'}`}>
              Rp {totalPrice.toLocaleString('id-ID')}
            </div>
          </div>

          {!isExpired ? (
            <button
              type="button"
              onClick={() => {
                if (paymentUrl) {
                  window.open(paymentUrl, '_blank');
                } else {
                  setIsInstructionOpen((prev) => !prev);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
            >
              <CreditCard className="w-4 h-4 text-slate-950" />
              <span>Bayar Sekarang</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-2xl bg-slate-200 text-slate-500 text-xs font-bold opacity-70 cursor-not-allowed flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Dibatalkan (Expired)</span>
            </button>
          )}
        </div>
      </div>

      {/* Shopee-Style Payment Details Box (VA Number / Kode Pembayaran + Copy Button) */}
      {!isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-xl border border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block">
                Nomor Virtual Account / Kode Pembayaran:
              </span>
              <div className="text-lg sm:text-xl font-mono font-black tracking-widest text-amber-300">
                {paymentCode}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-white/20"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Nomor VA'}</span>
            </button>
          </div>

          {/* Toggle Collapsible Instruction Guide */}
          <button
            type="button"
            onClick={() => setIsInstructionOpen((prev) => !prev)}
            className="w-full text-left flex items-center justify-between text-xs font-extrabold text-blue-200 hover:text-white pt-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Petunjuk Cara Pembayaran ({paymentMethodName})</span>
            </span>
            {isInstructionOpen ? <ChevronUp className="w-4 h-4 text-amber-300" /> : <ChevronDown className="w-4 h-4 text-amber-300" />}
          </button>

          {isInstructionOpen && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-xs space-y-2.5 animate-in fade-in-0">
              <p className="font-bold text-amber-300">Langkah-Langkah Cara Pembayaran:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-200 font-medium">
                <li>Buka aplikasi m-Banking atau E-Wallet pilihan Anda (BCA, Mandiri, GoPay, OVO, ShopeePay, dll).</li>
                <li>Pilih menu <strong>Transfer ➔ Virtual Account</strong> (atau <strong>Scan QRIS</strong> jika menggunakan QRIS).</li>
                <li>Masukkan Nomor Virtual Account / Kode Pembayaran: <strong className="font-mono text-amber-300">{paymentCode}</strong>.</li>
                <li>Periksa detail tagihan sebesar <strong className="text-amber-300">Rp {totalPrice.toLocaleString('id-ID')}</strong> dan nama akun pemesan.</li>
                <li>Konfirmasi transaksi & masukkan PIN Anda. Tiket akan terbit otomatis!</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<ApiTicketDetail[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used'>('all');

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, pubData, ordersData] = await Promise.all([
        fetchUserTickets(),
        fetchPublicEvents().catch(() => null),
        fetchUserOrders().catch(() => []),
      ]);

      setUserOrders(ordersData || []);

      const eventsMap = new Map<number, any>();
      if (pubData?.events) {
        pubData.events.forEach((ev: any) => {
          if (ev && ev.id) eventsMap.set(Number(ev.id), ev);
        });
      }

      // Cross-reference with localStorage checked-in codes if any
      let localCheckedInCodes: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          localCheckedInCodes = JSON.parse(localStorage.getItem('metix_checked_in_codes') || '[]');
        } catch {}
      }

      // Gabungkan relasi venue dari public event jika di ticket.event belum termuat
      const enriched = data.map((t) => {
        const evId = t.event?.id;
        const matched = evId ? eventsMap.get(Number(evId)) : null;
        const rawCode = (t.ticket_code || t.qr_token || '').toUpperCase();
        const isLocallyCheckedIn = localCheckedInCodes.some((code) => code.toUpperCase() === rawCode);

        const updatedStatus = isLocallyCheckedIn ? 'used' : (t.status || 'active');

        if (matched) {
          return {
            ...t,
            status: updatedStatus,
            event: {
              ...matched,
              ...t.event,
              venue: t.event?.venue || matched.venue,
              location: t.event?.location || matched.location || matched.venue?.name,
              venue_name: (t.event as any)?.venue_name || (matched as any)?.venue_name || matched.venue?.name,
              city: t.event?.city || matched.city || matched.venue?.city,
            },
          };
        }
        return {
          ...t,
          status: updatedStatus,
        };
      });

      setTickets(enriched);
    } catch (err) {
      console.warn('Gagal memuat tiket:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    const role = getUserRole(user);
    if (role === 'SCANNER') {
      toast.error('Akun Petugas Scanner hanya dapat mengakses halaman scan check-in.');
      router.replace('/dashboard/checkin');
      return;
    }

    loadTickets();
  }, [router, loadTickets]);

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((item) => {
      const title = (item.event?.title || (item as any).event_title || (item as any).title || '').toLowerCase();
      const code = (item.ticket_code || '').toLowerCase();
      const typeName = (item.ticket_type?.name || (item as any).ticket_type_name || (item as any).type_name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || title.includes(q) || code.includes(q) || typeName.includes(q);
      if (!matchSearch) return false;

      const rawStatus = (item.status || 'active').toLowerCase();
      const isUsed = rawStatus === 'used' || rawStatus === 'checked_in' || rawStatus === 'checked-in';
      const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'pending' || rawStatus === 'expired';
      const isActive = rawStatus === 'active' || rawStatus === 'valid';

      if (activeTab === 'active') {
        return isActive;
      }
      if (activeTab === 'used') {
        return isUsed;
      }
      return true;
    });
  }, [tickets, searchQuery, activeTab]);

  // Helper to force download a file from a URL
  const downloadFileFromUrl = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch {
      // Fallback direct link download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // PDF Generation & Direct Download Handler (No _blank popup)
  const handlePrintTicketPdf = async (ticket: ApiTicketDetail) => {
    if (ticket.status === 'used') {
      toast.error('Tiket ini sudah digunakan (checked-in) dan tidak dapat diunduh kembali.', { id: 'jspdf-toast' });
      return;
    }

    const rawCode = ticket.qr_token || ticket.ticket_code || (ticket as any).code || '';
    const orderNum = ticket.order?.order_number || ticket.order_number;
    const ticketCode = (rawCode && !rawCode.startsWith('MTX-'))
      ? rawCode
      : (rawCode || (orderNum ? `TKT-${orderNum}-1` : `TKT-${ticket.id}`));
    const filename = `METIX-ETicket-${ticketCode}.pdf`;

    try {
      toast.loading('Menyiapkan download PDF E-Tiket...', { id: 'jspdf-toast' });

      // 1. If backend PDF URL is directly present on ticket model (Laravel Storage)
      if (ticket.pdf_url) {
        toast.success('Mengunduh PDF E-Tiket...', { id: 'jspdf-toast' });
        await downloadFileFromUrl(ticket.pdf_url, filename);
        return;
      }

      // 2. Check Laravel backend PDF endpoint /tickets/{id}/pdf
      const backendPdfUrl = getTicketPdfUrl(ticket);
      try {
        const checkRes = await fetch(backendPdfUrl, { method: 'HEAD' });
        if (checkRes.ok) {
          toast.success('Mengunduh PDF E-Tiket...', { id: 'jspdf-toast' });
          await downloadFileFromUrl(backendPdfUrl, filename);
          return;
        }
      } catch {
        // Fallback to client jsPDF if backend endpoint is not ready
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const eventTitle = ticket.event?.title || '-';
      const venue = resolveVenueName(ticket.event);
      const ticketType = ticket.ticket_type?.name || '-';
      const buyerName = ticket.order?.buyer_name || '-';
      const ticketCode = ticket.ticket_code || '-';

      let dateStr = '-';
      if (ticket.event?.event_start_at) {
        try {
          dateStr = new Date(ticket.event.event_start_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        } catch { }
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
      drawRow('Pemilik Tiket (Holder)', `${buyerName}`);
      drawRow('Waktu & Tanggal Event', dateStr);
      drawRow('Lokasi Venue', venue);

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

      // Brand Logo Watermark - METIX
      doc.setFont('helvetica', 'black');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // Navy #1e3a8a
      doc.text('METIX', cardX + cardWidth - 28, footerY + 13);

      // =========================================================================
      // 6. TEAR / FOLD DIVIDER LINE
      // =========================================================================
      const dividerY = 168;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(cardX, dividerY, cardX + cardWidth, dividerY);
      doc.setLineDashPattern([], 0); // Reset dash

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('- - - GUNTING ATAU LIPAT DI SINI (TEAR OR FOLD HERE) - - -', cardX + (cardWidth / 2), dividerY - 1, { align: 'center' });

      // =========================================================================
      // 7. TERMS & CONDITIONS SECTION (SYARAT & KETENTUAN MASUK EVENT)
      // =========================================================================
      const tcY = 173;
      const tcHeight = 108;

      // Outer T&C Container Box
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setFillColor(250, 250, 252); // Slate 50
      doc.roundedRect(cardX, tcY, cardWidth, tcHeight, 4, 4, 'FD');

      // T&C Header Strip
      doc.setFillColor(30, 41, 59); // Slate 800
      doc.roundedRect(cardX, tcY, cardWidth, 13, 4, 4, 'F');
      doc.rect(cardX, tcY + 8, cardWidth, 5, 'F'); // Cover bottom curve of header

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('TERMS & CONDITIONS  *  SYARAT & KETENTUAN MASUK ACARA', cardX + 8, tcY + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(253, 224, 71); // Gold accent
      doc.text('METIX OFFICIAL POLICY', cardX + cardWidth - 8, tcY + 8.5, { align: 'right' });

      // Two-Column T&C Grid
      const colWidth = 80;
      const leftColX = cardX + 8;
      const rightColX = cardX + 96;

      const drawTcItem = (x: number, y: number, num: string, title: string, desc: string) => {
        // Number badge
        doc.setFillColor(30, 58, 138); // Navy
        doc.roundedRect(x, y - 2.5, 4, 4, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(num, x + 2, y + 0.5, { align: 'center' });

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(title, x + 6.5, y + 0.5);

        // Description (Multi-line wrap)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        const splitDesc = doc.splitTextToSize(desc, colWidth);
        doc.text(splitDesc, x, y + 5);
      };

      // Column 1 (Left Side)
      let itemY = tcY + 19;
      drawTcItem(
        leftColX,
        itemY,
        '1',
        'Validasi 1x Scan (Single Entry)',
        'QR Code e-tiket hanya berlaku untuk 1 (satu) kali pemindaian masuk. Tiket yang sudah di-scan tidak dapat digunakan kembali atau dipindahtangankan.'
      );

      itemY += 16;
      drawTcItem(
        leftColX,
        itemY,
        '2',
        'Wajib Membawa Identitas Asli',
        'Pemegang tiket wajib menunjukkan kartu identitas resmi asli (KTP/SIM/Paspor) yang sah dan masih berlaku sesuai nama yang terdaftar pada pesanan tiket.'
      );

      itemY += 16;
      drawTcItem(
        leftColX,
        itemY,
        '3',
        'Larangan Barang Terlarang',
        'Dilarang membawa senjata tajam, obat terlarang, minuman keras, flare/kembang api, laser pointer, dan kamera profesional (DSLR/Mirrorless tanpa ID pers).'
      );

      // Column 2 (Right Side)
      itemY = tcY + 19;
      drawTcItem(
        rightColX,
        itemY,
        '4',
        'Kebijakan Tiket (Non-Refundable)',
        'Tiket yang telah dibeli tidak dapat ditukar, dibatalkan, atau diuangkan kembali dengan alasan apapun, kecuali apabila acara resmi dibatalkan oleh penyelenggara.'
      );

      itemY += 16;
      drawTcItem(
        rightColX,
        itemY,
        '5',
        'Hak Penyelenggara & Keamanan',
        'Penyelenggara berhak memeriksa barang bawaan serta menolak masuk atau mengeluarkan pengunjung yang tidak mematuhi norma ketertiban dan keamanan venue.'
      );

      itemY += 16;
      drawTcItem(
        rightColX,
        itemY,
        '6',
        'Dokumentasi & Hak Publikasi',
        'Pengunjung memberikan izin kepada penyelenggara untuk mengambil foto atau rekaman video selama acara untuk keperluan dokumentasi dan publikasi resmi.'
      );

      // Bottom Support Banner inside T&C Box
      const helpY = tcY + 92;
      doc.setFillColor(238, 242, 255); // Indigo 50
      doc.setDrawColor(199, 210, 254); // Indigo 200
      doc.roundedRect(cardX + 4, helpY, cardWidth - 8, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138); // Indigo 900
      doc.text('BUTUH BANTUAN TIKET? Hubungi Layanan Metix: support@metix.id | partnership.metix.id', cardX + 8, helpY + 7.5);

      doc.setFont('helvetica', 'black');
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.text('* VERIFIED AUTHENTIC PASS', cardX + cardWidth - 8, helpY + 7.5, { align: 'right' });

      // =========================================================================
      // 8. Output & Trigger Direct Download
      // =========================================================================
      doc.save(filename);
      toast.success('PDF E-Tiket berhasil diunduh!', { id: 'jspdf-toast' });
    } catch (err) {
      console.error('jsPDF Client Download Error:', err);
      toast.error('Gagal mengunduh dokumen PDF E-Tiket.', { id: 'jspdf-toast' });
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

        {/* Pending Orders 10-Minute Countdown Section */}
        {userOrders.filter((ord: any) => {
          const s = (ord.status || ord.payment_status || 'PENDING').toUpperCase();
          return s === 'PENDING' || s === 'UNPAID' || s === 'WAITING_PAYMENT' || s === 'DRAFT';
        }).length > 0 && (
          <div className="space-y-4">
            {userOrders
              .filter((ord: any) => {
                const s = (ord.status || ord.payment_status || 'PENDING').toUpperCase();
                return s === 'PENDING' || s === 'UNPAID' || s === 'WAITING_PAYMENT' || s === 'DRAFT';
              })
              .map((ord: any) => (
                <OrderCountdownCard key={ord.id || ord.order_number} order={ord} onRefresh={loadTickets} />
              ))}
          </div>
        )}

        {/* Filter Bar & Tabs */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Semua Tiket ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Siap Check-In ({tickets.filter((t) => {
                  const s = (t.status || 'active').toLowerCase();
                  return s !== 'used' && s !== 'checked_in' && s !== 'checked-in' && s !== 'cancelled' && s !== 'canceled';
                }).length})
              </button>
              <button
                onClick={() => setActiveTab('used')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'used'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Sudah Digunakan ({tickets.filter((t) => {
                  const s = (t.status || '').toLowerCase();
                  return s === 'used' || s === 'checked_in' || s === 'checked-in';
                }).length})
              </button>
            </div>

            {/* Search Input & Sync Button */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari event atau kode tiket..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.loading('Memperbarui data tiket...', { id: 'refresh-tickets' });
                  loadTickets().then(() => toast.success('Data tiket berhasil disinkronkan!', { id: 'refresh-tickets' }));
                }}
                title="Sinkronkan & Muat Ulang Tiket"
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-600 hover:text-blue-600 transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
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
                const rawStatus = (item.status || 'active').toLowerCase();
                const isUsed = rawStatus === 'used' || rawStatus === 'checked_in' || rawStatus === 'checked-in';
                const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled';
                const eventTitle = item.event?.title || (item as any).event_title || (item as any).title || 'Event Metix Pass';
                const venue = resolveVenueName(item.event);
                const ticketType = item.ticket_type?.name || (item as any).ticket_type_name || (item as any).type_name || 'VIP Pass';

                // Authentic ticket_code generated by Laravel Backend
                const rawCode = item.qr_token || item.ticket_code || (item as any).code || '';
                const orderNum = item.order?.order_number || item.order_number;
                const displayTicketCode = (rawCode && !rawCode.startsWith('MTX-'))
                  ? rawCode
                  : (rawCode || (orderNum ? `TKT-${orderNum}-1` : `TKT-${item.id}`));

                let dateStr = '15 Sep 2026';
                const dateCandidate = item.event?.event_start_at || item.event?.start_at || (item as any).event_date || item.created_at;
                if (dateCandidate) {
                  try {
                    dateStr = new Date(dateCandidate).toLocaleDateString('id-ID', {
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
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isUsed
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          <p className="text-xs text-white font-mono font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-md border border-white/30">
                            {displayTicketCode}
                          </p>
                          {orderNum && orderNum !== displayTicketCode && (
                            <span className="text-[10px] text-blue-200 font-mono">
                              (Order: {orderNum})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Card Details */}
                    <div className="p-5 space-y-3 bg-white">
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
                    </div>

                    {/* Ticket Stub Perforation Divider */}
                    <div className="relative flex items-center justify-between bg-slate-50/50 py-1">
                      <div className="w-4 h-6 bg-slate-100/90 rounded-r-full -ml-2 border-y border-r border-slate-200" />
                      <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-3" />
                      <div className="w-4 h-6 bg-slate-100/90 rounded-l-full -mr-2 border-y border-l border-slate-200" />
                    </div>

                    {/* QR Code Section (from Laravel Backend) */}
                    <div className="px-5 py-3.5 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                      <div className="relative p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs group-hover:border-blue-300/80 transition-all">
                        {/* QR Code Image from Laravel API / Storage */}
                        <img
                          src={item.qr_code_url || getTicketQrUrl(item.id)}
                          alt={`QR Code ${displayTicketCode}`}
                          className={`w-28 h-28 object-contain transition-all duration-300 ${isUsed
                            ? 'filter blur-[3.5px] opacity-25 grayscale'
                            : isCancelled
                              ? 'filter blur-[3px] opacity-25 grayscale'
                              : 'hover:scale-105'
                            }`}
                          onError={(e) => {
                            // Safe fallback in case Laravel QR endpoint is not yet configured on server
                            const qrData = item.qr_token || item.ticket_code || displayTicketCode || String(item.id);
                            (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              qrData
                            )}`;
                          }}
                        />

                        {/* Watermark / Badge if Used (Sudah Di-scan) */}
                        {isUsed && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-950/40 backdrop-blur-[1px] select-none animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-1 border-2 border-white">
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-md bg-slate-900/90 border border-white/20 shadow-xs">
                              Sudah Digunakan
                            </span>
                            <span className="text-[9px] font-bold text-emerald-300 mt-0.5">
                              Checked-In
                            </span>
                          </div>
                        )}

                        {/* Watermark / Badge if Cancelled */}
                        {isCancelled && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-950/40 backdrop-blur-[1px] select-none">
                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md mb-1 border-2 border-white">
                              <XCircle className="w-5 h-5 stroke-[2.5]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-300/30 shadow-xs">
                              Dibatalkan
                            </span>
                          </div>
                        )}
                      </div>

                      {/* QR helper text */}
                      <p className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{isUsed ? 'Tiket telah diverifikasi di gerbang' : 'Scan QR code di gerbang masuk'}</span>
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      {isUsed ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sudah Di-Scan (Checked-In)
                        </button>
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
                          onClick={() => handlePrintTicketPdf({ ...item, ticket_code: displayTicketCode })}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Download E-Tiket PDF
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
    </DashboardLayout>
  );
}
