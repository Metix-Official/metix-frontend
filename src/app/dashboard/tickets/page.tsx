'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { fetchUserTickets, fetchUserOrders, fetchPublicEvents, fetchPaymentStatus, initiateOrderPayment, ApiTicketDetail, getStoredUser, getTicketPdfUrl, getTicketQrUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Ticket, Search, Calendar, MapPin, QrCode, X, Printer, Download, CheckCircle2, XCircle, RotateCw, Clock, AlertTriangle, CreditCard, Lock, Copy, ChevronDown, ChevronUp, HelpCircle, Check, Building2, Wallet, Store, Zap, User, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
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
  const expiresAtMs = order.expires_at ? new Date(order.expires_at).getTime() : (createdAtMs + 60 * 60 * 1000);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  });

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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

  if (isDismissed) {
    return null;
  }

  const orderNum = order.order_number || (order.id ? `#MTX-${order.id}` : '#MTX-ORDER');
  const totalPrice = Number(order.total_amount || order.grand_total || order.total_price || 0);
  const eventTitle = order.event?.title || order.items?.[0]?.ticket_type?.name || 'Event Metix Pass';
  const paymentUrl = order.payment_url || (order.payment?.payment_url) || null;

  // Real VA / Payment code detection vs Hosted Checkout Portal
  const realPaymentCode = (typeof order.payment?.payment_code === 'string' && order.payment.payment_code)
    || (typeof order.payment?.va_number === 'string' && order.payment.va_number)
    || (typeof order.va_number === 'string' && order.va_number)
    || null;
  const hasRealCode = Boolean(realPaymentCode);
  const paymentCode = realPaymentCode || '';

  // Resolve Displayed Payment Method Name safely
  const rawCat = (typeof order.payment_category === 'string' && order.payment_category)
    || (typeof order.payment_method === 'string' && order.payment_method)
    || (typeof order.payment_method === 'object' && order.payment_method?.name)
    || (typeof order.payment?.payment_method === 'string' && order.payment.payment_method)
    || (typeof order.payment?.payment_method === 'object' && order.payment?.payment_method?.name)
    || (hasRealCode ? 'QRIS' : 'DOKU_CHECKOUT');
  const categoryRaw = String(rawCat || '').toUpperCase();
  let paymentMethodName = hasRealCode ? 'QRIS Instant (Scan QR)' : 'DOKU Payment Portal';

  if (categoryRaw.includes('VA') || categoryRaw.includes('VIRTUAL') || categoryRaw.includes('TRANSFER')) {
    paymentMethodName = 'Virtual Account Bank (BCA / Mandiri / BNI / BRI)';
  } else if (categoryRaw.includes('EWALLET') || categoryRaw.includes('E_WALLET') || categoryRaw.includes('GOPAY') || categoryRaw.includes('OVO')) {
    paymentMethodName = 'E-Wallet (GoPay / ShopeePay / OVO / DANA)';
  } else if (categoryRaw.includes('ALFAMART') || categoryRaw.includes('RETAIL')) {
    paymentMethodName = 'Gerai Retail Alfamart / Indomaret';
  } else if (categoryRaw.includes('CREDIT') || categoryRaw.includes('CARD')) {
    paymentMethodName = 'Kartu Kredit / Debit Visa & Mastercard';
  } else if (!hasRealCode) {
    paymentMethodName = 'DOKU Hosted Gateway (Multi-Channel)';
  }

  const handleCopyCode = () => {
    if (!paymentCode) return;
    navigator.clipboard.writeText(paymentCode);
    setCopiedCode(true);
    toast.success('Nomor VA / Kode Pembayaran Berhasil Disalin!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(orderNum.replace(/^#/, ''));
    setCopiedOrderNum(true);
    toast.success('Nomor Pesanan Berhasil Disalin!');
    setTimeout(() => setCopiedOrderNum(false), 3000);
  };

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Helper untuk mendapatkan URL pembayaran resmi DOKU jika belum ada di objek order
  const getOrInitiatePaymentUrl = async (): Promise<string | null> => {
    if (paymentUrl) return paymentUrl;
    try {
      const res = await initiateOrderPayment(order.id);
      if (res.payment_url) {
        return res.payment_url;
      }
    } catch (e) {
      console.warn('Gagal memuat URL DOKU:', e);
    }
    return null;
  };

  const handlePayNow = async () => {
    setIsRedirecting(true);
    toast.loading('Menyiapkan portal pembayaran DOKU...', { id: 'doku-pay' });
    try {
      const url = await getOrInitiatePaymentUrl();
      if (url) {
        toast.success('Membuka portal pembayaran DOKU...', { id: 'doku-pay' });
        window.location.href = url;
      } else {
        toast.error('Gagal memuat link pembayaran DOKU. Silakan periksa koneksi atau coba lagi.', { id: 'doku-pay' });
      }
    } catch {
      toast.error('Terjadi kendala saat membuka DOKU.', { id: 'doku-pay' });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const statusRes = await fetchPaymentStatus(order.id);
      if (statusRes.status === 'PAID') {
        toast.success('Pembayaran terkonfirmasi LUNAS! Tiket Anda telah diterbitkan 🎉');
        onRefresh();
        return;
      }

      toast.info('Status belum lunas. Mengarahkan ke portal resmi DOKU...');
      const url = await getOrInitiatePaymentUrl();
      if (url) {
        window.location.href = url;
      } else {
        toast.info('Status pembayaran belum terkonfirmasi oleh DOKU. Silakan selesaikan transaksi di portal DOKU.');
      }
    } catch {
      toast.error('Gagal mengecek status pembayaran.');
      const fallbackUrl = await getOrInitiatePaymentUrl();
      if (fallbackUrl) {
        window.location.href = fallbackUrl;
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden p-5 sm:p-7 rounded-3xl border transition-all space-y-5 shadow-2xl animate-in fade-in-0 duration-300 ${
        isExpired
          ? 'bg-rose-50/90 border-rose-200 text-slate-900 shadow-rose-500/5'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border-blue-500/30 shadow-blue-950/40 backdrop-blur-xl'
      }`}
    >
      {/* Subtle Background Glow Elements */}
      {!isExpired && (
        <>
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Top Banner Header */}
      <div className={`relative z-10 flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${isExpired ? 'border-rose-200' : 'border-white/10'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse'}`} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-black uppercase tracking-wider ${isExpired ? 'text-rose-700 font-extrabold' : 'text-amber-300'}`}>
              {isExpired ? 'Pesanan Kedaluwarsa (Batas 60 Menit Berakhir)' : '⏱️ Menunggu Pembayaran (Batas 60 Menit)'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isExpired ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-blue-900/60 text-blue-200 border-blue-400/30'
            }`}>
              DOKU Payment Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpired ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-mono font-black tracking-wider shadow-md shadow-amber-500/20">
              <Clock className="w-4 h-4 text-slate-950 animate-spin-slow" />
              <span>Hitung Mundur: {formattedTimer} Menit</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-rose-200/80 text-rose-800 border border-rose-300 uppercase">
                Batas Waktu DOKU Habis
              </span>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Tutup Notifikasi Pesanan Expired"
                className="p-1 rounded-full bg-rose-200/80 hover:bg-rose-300 text-rose-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Order & Tagihan Summary */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyOrderNum}
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isExpired
                  ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                  : 'bg-white/5 text-blue-300 border-white/10 hover:bg-white/10 hover:border-blue-400/40'
              }`}
              title="Klik untuk menyalin nomor pesanan"
            >
              <span>Nomor Pesanan: {orderNum}</span>
              {copiedOrderNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>

            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              isExpired ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-blue-900/40 text-amber-300 border-amber-400/30'
            }`}>
              {paymentMethodName}
            </span>
          </div>

          <h4 className={`text-lg sm:text-xl font-black tracking-tight ${isExpired ? 'text-slate-900' : 'text-white'}`}>
            {eventTitle}
          </h4>

          <p className={`text-xs font-medium leading-relaxed max-w-xl ${isExpired ? 'text-slate-600' : 'text-slate-300'}`}>
            {isExpired
              ? 'Batas waktu pembayaran 60 menit telah berakhir. Pesanan ini otomatis dibatalkan oleh gateway.'
              : hasRealCode
              ? 'Silakan transfer tagihan Anda ke nomor Virtual Account / Kode Pembayaran resmi di bawah ini sebelum batas waktu berakhir.'
              : 'Pesanan Anda telah diamankan. Selesaikan pembayaran melalui portal resmi DOKU dengan mengklik tombol di bawah ini.'}
          </p>
        </div>

        {/* Price & Tagihan Box */}
        <div className="flex flex-col sm:items-end shrink-0 space-y-1 sm:text-right bg-white/[0.04] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-white/10">
          <span className={`text-[10px] uppercase font-bold tracking-wider block ${isExpired ? 'text-slate-400' : 'text-blue-300'}`}>
            Total Tagihan Presisi
          </span>
          <div className={`text-2xl font-black font-mono tracking-wide ${isExpired ? 'text-slate-400 line-through' : 'text-amber-300 drop-shadow-sm'}`}>
            Rp {totalPrice.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400">Termasuk pajak & biaya admin gateway</span>
        </div>
      </div>

      {/* Core Payment Section: Hosted DOKU Portal vs Direct Code Display */}
      {!isExpired && (
        <div className="relative z-10 space-y-3">
          {hasRealCode ? (
            /* Scenario A: Real VA / Kode Pembayaran Available */
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.07] border border-white/15 space-y-3 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-4 rounded-xl border border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block">
                    Nomor Virtual Account / Kode Pembayaran Resmi:
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black tracking-widest text-amber-300">
                    {paymentCode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-white/20 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Nomor'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Cek Status Pembayaran"
                  >
                    <RotateCw className={`w-3.5 h-3.5 text-blue-300 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    <span>{isCheckingStatus ? 'Mengecek...' : 'Cek Status'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Guide */}
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
                  <p className="font-bold text-amber-300">Langkah-Langkah Pembayaran:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-200 font-medium">
                    <li>Buka aplikasi m-Banking atau E-Wallet pilihan Anda (BCA, Mandiri, BRI, GoPay, OVO, dll).</li>
                    <li>Pilih menu <strong>Transfer ➔ Virtual Account</strong> (atau <strong>Bayar Tagihan</strong>).</li>
                    <li>Masukkan nomor Virtual Account: <strong className="font-mono text-amber-300">{paymentCode}</strong>.</li>
                    <li>Pastikan nominal tagihan tepat <strong className="text-amber-300">Rp {totalPrice.toLocaleString('id-ID')}</strong>.</li>
                    <li>Konfirmasi dan masukkan PIN Anda. Tiket akan terbit otomatis seketika!</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            /* Scenario B: DOKU Hosted Checkout Portal (Waiting for payment on DOKU) */
            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md space-y-4 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      Portal Pembayaran Resmi DOKU Checkout
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Terenkripsi & Resmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    Pesanan Anda telah diamankan. Untuk menyelesaikan pembayaran, silakan masuk ke portal DOKU dan pilih channel pembayaran favorit Anda (QRIS, Virtual Account Bank, e-Wallet, atau Kartu Kredit).
                  </p>
                </div>

                {/* Supported Channels Chips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
                    QRIS
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
                    BCA / Mandiri / BRI VA
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
                    e-Wallet
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10">
                    Kartu Kredit
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={isCheckingStatus}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-blue-300 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Mengecek Status...' : 'Cek Status Pembayaran'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isRedirecting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>{isRedirecting ? 'Menghubungkan ke DOKU...' : 'Lanjutkan Pembayaran di DOKU'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expired Order Notification Box */}
      {isExpired && (
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-rose-100/90 border border-rose-300 text-slate-900 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-rose-950 text-xs sm:text-sm">Batas Waktu Pembayaran 60 Menit Telah Habis</h5>
                <p className="text-xs text-rose-800 font-medium">Pesanan ini telah kedaluwarsa secara otomatis oleh sistem DOKU. Silakan buat pesanan baru jika ingin membeli tiket ini.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="px-4 py-2 rounded-xl bg-rose-200 hover:bg-rose-300 text-rose-900 text-xs font-bold transition-all shrink-0 cursor-pointer self-start sm:self-auto border border-rose-300"
            >
              Hapus dari Riwayat
            </button>
          </div>
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

      // Gabungkan relasi venue dari public event jika di ticket.event belum termuat
      const enriched = data.map((t) => {
        const evId = t.event?.id;
        const matched = evId ? eventsMap.get(Number(evId)) : null;

        if (matched) {
          return {
            ...t,
            status: t.status || 'active',
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
          status: t.status || 'active',
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

    // Setup Realtime WebSocket Listener for Ticket Scanned Event via Reverb
    let echoInstance: any = null;
    if (user && user.id) {
      const token = (user as any).token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      if (token) {
        import('@/lib/echo').then(({ initEcho }) => {
          echoInstance = initEcho(token);
          if (echoInstance) {
            echoInstance
              .private(`user.${user.id}`)
              .listen('.TicketScanned', (data: { ticket_id: number; ticket_code: string; status: string }) => {
                toast.success(`Tiket #${data.ticket_code || data.ticket_id} berhasil di-scan di gate venue! 🎉`, {
                  duration: 5000,
                });
                setTickets((prev) =>
                  prev.map((t) => {
                    const matchId = t.id === data.ticket_id;
                    const matchCode = data.ticket_code && (t.ticket_code === data.ticket_code || (t as any).qr_token === data.ticket_code);
                    return (matchId || matchCode) ? { ...t, status: 'used' } : t;
                  })
                );
                loadTickets();
              })
              .listen('.PaymentConfirmed', (data: { order_number: string }) => {
                toast.success(`Pembayaran untuk pesanan ${data.order_number || ''} BERHASIL LUNAS! Tiket Anda telah diterbitkan 🎉`, {
                  duration: 6000,
                });
                loadTickets();
              })
              .listen('.TicketReset', (data: { ticket_id: number; ticket_code: string }) => {
                toast.info(`Status tiket #${data.ticket_code || data.ticket_id} dikembalikan menjadi Siap Check-In (ACTIVE).`, {
                  duration: 5000,
                });
                setTickets((prev) =>
                  prev.map((t) => {
                    const matchId = t.id === data.ticket_id;
                    const matchCode = data.ticket_code && (t.ticket_code === data.ticket_code || (t as any).qr_token === data.ticket_code);
                    return (matchId || matchCode) ? { ...t, status: 'active' } : t;
                  })
                );
                loadTickets();
              });
          }
        });
      }
    }

    return () => {
      if (echoInstance && user?.id) {
        echoInstance.leave(`user.${user.id}`);
      }
    };
  }, [router, loadTickets]);

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((item) => {
      const title = (item.event?.title || (item as any).event_title || (item as any).title || '').toLowerCase();
      const code = (item.ticket_code || '').toLowerCase();
      const typeName = (item.ticket_type?.name || (item as any).ticket_type_name || (item as any).type_name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || title.includes(q) || code.includes(q) || typeName.includes(q);
      if (!matchSearch) return false;

      const ordStatus = String((item.order as any)?.status || (item as any).order_status || (item.order as any)?.payment_status || '').toLowerCase();
      const isOrderUnpaid = ['pending', 'unpaid', 'waiting_payment', 'waiting_for_payment', 'draft'].includes(ordStatus);
      if (isOrderUnpaid) return false;

      const rawStatus = (item.status || 'active').toLowerCase();
      if (rawStatus === 'pending' || rawStatus === 'pending_payment' || rawStatus === 'unpaid') return false;

      const isUsed = rawStatus === 'used' || rawStatus === 'checked_in' || rawStatus === 'checked-in';
      const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'expired';
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
      const buyerName = ticket.holder_name || (ticket.attendee as any)?.full_name || ticket.order?.buyer_name || (ticket as any).user?.name || getStoredUser()?.name || 'Pelanggan Metix';
      const ticketCode = ticket.ticket_code || '-';

      let dateStr = '-';
      const dateCandidate = ticket.event?.start_at || ticket.event?.event_start_at || (ticket.event as any)?.date;
      if (dateCandidate) {
        try {
          const d = new Date(dateCandidate);
          dateStr = d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }) + `, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
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

        {/* Pending Orders 60-Minute DOKU Countdown Section */}
        {userOrders.filter((ord: any) => {
          const s = String(ord?.status || ord?.payment_status || 'PENDING').toUpperCase();
          return !['PAID', 'SUCCESS', 'COMPLETED', 'SETTLED'].includes(s);
        }).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Riwayat Pesanan Menunggu Pembayaran (DOKU)
              </span>
              <button
                type="button"
                onClick={() => {
                  setUserOrders((prev) =>
                    prev.filter((ord: any) => {
                      const createdAtMs = ord.created_at ? new Date(ord.created_at).getTime() : Date.now();
                      const expiresAtMs = ord.expires_at ? new Date(ord.expires_at).getTime() : (createdAtMs + 60 * 60 * 1000);
                      return expiresAtMs > Date.now();
                    })
                  );
                  toast.success('Kartu pesanan expired berhasil dibersihkan!');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat Expired</span>
              </button>
            </div>

            {userOrders
              .filter((ord: any) => {
                const s = String(ord?.status || ord?.payment_status || 'PENDING').toUpperCase();
                return !['PAID', 'SUCCESS', 'COMPLETED', 'SETTLED'].includes(s);
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
                Semua Tiket ({tickets.filter((t) => {
                  const ordStatus = String((t.order as any)?.status || (t as any).order_status || (t.order as any)?.payment_status || '').toLowerCase();
                  const isOrderUnpaid = ['pending', 'unpaid', 'waiting_payment', 'waiting_for_payment', 'draft'].includes(ordStatus);
                  const s = (t.status || 'active').toLowerCase();
                  return !isOrderUnpaid && s !== 'pending' && s !== 'pending_payment';
                }).length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Siap Check-In ({tickets.filter((t) => {
                  const ordStatus = String((t.order as any)?.status || (t as any).order_status || (t.order as any)?.payment_status || '').toLowerCase();
                  const isOrderUnpaid = ['pending', 'unpaid', 'waiting_payment', 'waiting_for_payment', 'draft'].includes(ordStatus);
                  const s = (t.status || 'active').toLowerCase();
                  return !isOrderUnpaid && s !== 'used' && s !== 'checked_in' && s !== 'checked-in' && s !== 'cancelled' && s !== 'canceled' && s !== 'pending' && s !== 'pending_payment';
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
                          <User className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-extrabold text-slate-900 truncate">
                            {item.holder_name || item.attendee?.full_name || item.order?.buyer_name || (item as any).user?.name || getStoredUser()?.name || 'Pelanggan Metix'}
                          </span>
                        </div>
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
