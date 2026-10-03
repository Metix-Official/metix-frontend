'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { fetchUserTickets, fetchUserOrders, fetchPublicEvents, fetchPaymentStatus, initiateOrderPayment, ApiTicketDetail, getStoredUser, getTicketPdfUrl, getTicketQrUrl, getPhotoUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Ticket, Search, Calendar, MapPin, QrCode, X, Printer, Download, CheckCircle2, XCircle, RotateCw, Clock, AlertTriangle, CreditCard, Lock, Copy, ChevronDown, ChevronUp, HelpCircle, Check, Building2, Wallet, Store, Zap, User, ExternalLink, ShieldCheck, Sparkles, Bell, BellRing } from 'lucide-react';
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

function OrderCountdownCard({
  order,
  onRefresh,
  onDismiss,
}: {
  order: any;
  onRefresh: () => void;
  onDismiss?: (orderId: string | number) => void;
}) {
  const createdAtMs = order.created_at ? new Date(order.created_at).getTime() : Date.now();
  const expiresAtMs = order.expires_at ? new Date(order.expires_at).getTime() : (createdAtMs + 60 * 60 * 1000);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(order.id || order.order_number);
    }
  };

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  });

  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onDismiss) {
        onDismiss(order.id || order.order_number);
      }
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onDismiss) {
          onDismiss(order.id || order.order_number);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAtMs, timeLeft, onDismiss, order.id, order.order_number]);

  // Automatic Background Check with DOKU Server every 8 seconds while waiting for payment
  useEffect(() => {
    if (timeLeft <= 0) return;

    const pollPaymentStatus = async () => {
      try {
        const res = await fetchPaymentStatus(order.id);
        if (res && (res.status === 'PAID' || res.status === 'SUCCESS' || res.status === 'COMPLETED')) {
          toast.success('Pembayaran terkonfirmasi LUNAS! Tiket Anda telah otomatis diterbitkan 🎉', { id: `auto-paid-${order.id}` });
          onRefresh();
        }
      } catch (err) {
        // Silent error on auto check
      }
    };

    // First auto-check 3 seconds after page loads
    const initialTimer = setTimeout(pollPaymentStatus, 3000);

    // Periodic check every 8 seconds
    const pollInterval = setInterval(pollPaymentStatus, 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
    };
  }, [order.id, timeLeft, onRefresh]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isExpired = timeLeft <= 0;

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

  if (isDismissed || isExpired) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50/80 border border-amber-200/90 p-3 sm:p-3.5 text-slate-900 shadow-2xs animate-in fade-in-0 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Icon, Countdown Badge, Title, Price, Order details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600 animate-spin-slow" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                <span>⏱️ {formattedTimer}</span>
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {eventTitle}
              </h4>
              <span className="text-xs font-mono font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 font-medium">
              <span>Order #{orderNum.replace(/^#/, '')}</span>
              <span>•</span>
              <span className="text-slate-700 font-bold">{paymentMethodName}</span>
              {hasRealCode && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 font-mono font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer text-[10px]"
                    title="Klik untuk salin kode pembayaran"
                  >
                    <span>Kode: {paymentCode}</span>
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {hasRealCode && (
            <button
              type="button"
              onClick={() => setIsInstructionOpen((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/50 text-slate-700 font-bold text-xs border border-amber-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Petunjuk</span>
              {isInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Cek Status Pembayaran"
          >
            <RotateCw className={`w-3 h-3 text-blue-600 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>{isCheckingStatus ? 'Cek...' : 'Cek Status'}</span>
          </button>

          {!hasRealCode && (
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isRedirecting}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isRedirecting ? 'Menghubungkan...' : 'Bayar Sekarang'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-amber-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Sembunyikan notifikasi ini"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Quick Payment Instruction */}
      {isInstructionOpen && hasRealCode && (
        <div className="p-3 rounded-xl bg-white border border-amber-200/80 text-xs space-y-1 animate-in fade-in-0 mt-1">
          <p className="font-extrabold text-amber-900 text-[11px]">Cara Pembayaran {paymentMethodName}:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-600 font-medium text-[11px]">
            <li>Buka m-Banking atau E-Wallet Anda (BCA, Mandiri, BRI, GoPay, dll).</li>
            <li>Pilih menu <strong>Transfer ➔ Virtual Account</strong> (atau Bayar Tagihan).</li>
            <li>Masukkan kode/nomor VA: <strong className="font-mono text-slate-900 font-black">{paymentCode}</strong>.</li>
            <li>Pastikan nominal tagihan tepat <strong className="text-slate-900 font-black">Rp {totalPrice.toLocaleString('id-ID')}</strong>.</li>
          </ol>
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [readOrderIds, setReadOrderIds] = useState<string[]>([]);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>([]);

  // Load persistent
  //  read & dismissed states from localStorage on mount
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem('metix_read_order_ids');
      if (storedRead) setReadOrderIds(JSON.parse(storedRead));
      const storedDismissed = localStorage.getItem('metix_dismissed_order_ids');
      if (storedDismissed) setDismissedOrderIds(JSON.parse(storedDismissed));
    } catch { }
  }, []);

  // Filter out orders that user has permanently dismissed (via X or cleaned)
  const unpaidOrders = React.useMemo(() => {
    return userOrders.filter((ord: any) => {
      const s = String(ord?.status || ord?.payment_status || 'PENDING').toUpperCase();
      const isUnpaid = !['PAID', 'SUCCESS', 'COMPLETED', 'SETTLED'].includes(s);
      const ordKey = String(ord.id || ord.order_number || '');
      const isDismissed = dismissedOrderIds.includes(ordKey);
      return isUnpaid && !isDismissed;
    });
  }, [userOrders, dismissedOrderIds]);

  const hasUnpaidOrders = unpaidOrders.length > 0;

  // Lonceng HANYA kelap-kelip jika ada tagihan yang BELUM pernah dibaca/dilihat oleh user (seperti pesan unread WhatsApp)
  const hasUnreadOrders = React.useMemo(() => {
    return unpaidOrders.some((ord: any) => {
      const ordKey = String(ord.id || ord.order_number || '');
      return !readOrderIds.includes(ordKey);
    });
  }, [unpaidOrders, readOrderIds]);

  // Saat lonceng diklik, tandai semua tagihan aktif saat ini sebagai sudah dibaca (Mark as Read)
  const handleToggleNotification = () => {
    const willOpen = !isNotificationOpen;
    setIsNotificationOpen(willOpen);

    if (willOpen && unpaidOrders.length > 0) {
      const newRead = Array.from(
        new Set([...readOrderIds, ...unpaidOrders.map((o: any) => String(o.id || o.order_number || ''))])
      );
      setReadOrderIds(newRead);
      try {
        localStorage.setItem('metix_read_order_ids', JSON.stringify(newRead));
      } catch { }
    }
  };

  // Saat satu kartu ditutup permanen dengan tombol X
  const handleDismissOrder = (orderId: string | number) => {
    const key = String(orderId);
    const newDismissed = Array.from(new Set([...dismissedOrderIds, key]));
    setDismissedOrderIds(newDismissed);
    try {
      localStorage.setItem('metix_dismissed_order_ids', JSON.stringify(newDismissed));
    } catch { }
  };

  // Bersihkan semua kartu expired secara permanen
  const handleCleanExpired = () => {
    const expiredKeys: string[] = [];
    userOrders.forEach((ord: any) => {
      const createdAtMs = ord.created_at ? new Date(ord.created_at).getTime() : Date.now();
      const expiresAtMs = ord.expires_at ? new Date(ord.expires_at).getTime() : (createdAtMs + 60 * 60 * 1000);
      if (expiresAtMs <= Date.now()) {
        expiredKeys.push(String(ord.id || ord.order_number || ''));
      }
    });

    const newDismissed = Array.from(new Set([...dismissedOrderIds, ...expiredKeys]));
    setDismissedOrderIds(newDismissed);
    try {
      localStorage.setItem('metix_dismissed_order_ids', JSON.stringify(newDismissed));
    } catch { }
    toast.success('Notifikasi expired berhasil dibersihkan permanen!');
  };

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

      // Gabungkan relasi venue & category dari public event jika di ticket belum termuat
      const enriched = data.map((t) => {
        const evId = t.event?.id;
        const matched = evId ? eventsMap.get(Number(evId)) : null;

        let resolvedCategory = (t.ticket_type as any)?.category || (t as any).category || '';
        let resolvedTypeName = t.ticket_type?.name || (t as any).ticket_type_name || (t as any).type_name || 'Tiket';

        if (matched) {
          const matchedTt = matched.ticket_types?.find((tt: any) =>
            (tt.id && (t as any).ticket_type_id && tt.id === (t as any).ticket_type_id) ||
            (tt.name && resolvedTypeName && tt.name.toLowerCase() === resolvedTypeName.toLowerCase())
          );
          if (!resolvedCategory && matchedTt?.category) {
            resolvedCategory = matchedTt.category;
          }
          if (matchedTt?.name && resolvedTypeName === 'Tiket') {
            resolvedTypeName = matchedTt.name;
          }

          return {
            ...t,
            category: resolvedCategory,
            ticket_type: {
              ...t.ticket_type,
              name: resolvedTypeName,
              category: resolvedCategory,
              price: t.ticket_type?.price ?? matchedTt?.price ?? 0,
            },
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
          category: resolvedCategory,
          ticket_type: {
            ...t.ticket_type,
            name: resolvedTypeName,
            category: resolvedCategory,
            price: t.ticket_type?.price ?? 0,
          },
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

  const ticketCounts = React.useMemo(() => {
    let allCount = 0;
    let activeCount = 0;
    let usedCount = 0;

    tickets.forEach((t) => {
      const ordStatus = String((t.order as any)?.status || (t as any).order_status || (t.order as any)?.payment_status || '').toLowerCase();
      const isOrderUnpaid = ['pending', 'unpaid', 'waiting_payment', 'waiting_for_payment', 'draft'].includes(ordStatus);
      if (isOrderUnpaid) return;

      const s = (t.status || 'active').toLowerCase();
      if (s === 'pending' || s === 'pending_payment') return;

      allCount++;
      if (s === 'used' || s === 'checked_in' || s === 'checked-in') {
        usedCount++;
      } else if (s !== 'cancelled' && s !== 'canceled') {
        activeCount++;
      }
    });

    return { all: allCount, active: activeCount, used: usedCount };
  }, [tickets]);

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

  // Reliable image to JPEG base64 converter (handles CORS, WebP, PNG, Next.js Proxy)
  const urlToJpegBase64 = async (url: string): Promise<string | null> => {
    try {
      let blob: Blob | null = null;

      // 1. Try direct fetch first
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch {
        // Direct fetch failed (likely CORS), try proxy
      }

      // 2. If direct fetch failed or CORS blocked, use Next.js server-side proxy
      if (!blob) {
        try {
          const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
          if (proxyRes.ok) {
            blob = await proxyRes.blob();
          }
        } catch {
          // Proxy fetch failed
        }
      }

      if (!blob) return null;

      // 3. Convert blob into standard JPEG via HTML5 Canvas (ensures 100% jsPDF compatibility)
      return await new Promise<string | null>((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 400;
            canvas.height = img.naturalHeight || img.height || 600;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const jpegData = canvas.toDataURL('image/jpeg', 0.9);
              URL.revokeObjectURL(objectUrl);
              resolve(jpegData);
              return;
            }
          } catch (canvasErr) {
            console.warn('Canvas conversion error:', canvasErr);
          }
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });
    } catch (err) {
      console.warn('urlToJpegBase64 failed:', err);
      return null;
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

      const eventTitle = ticket.event?.title || (ticket as any).event_title || (ticket as any).title || 'Event Metix Pass';
      const venue = resolveVenueName(ticket.event);
      const ticketType = ticket.ticket_type?.name || (ticket as any).ticket_type_name || (ticket as any).type_name || 'Tiket';
      const category = (ticket.ticket_type as any)?.category || (ticket as any).category || '';
      const buyerName = ticket.holder_name || (ticket.attendee as any)?.full_name || ticket.order?.buyer_name || (ticket as any).user?.name || getStoredUser()?.name || 'Pelanggan Metix';
      const rawPrice = ticket.ticket_type?.price ?? (ticket.order as any)?.grand_total ?? (ticket.order as any)?.total_amount ?? 0;
      const numPrice = Number(rawPrice);
      const priceDisplay = numPrice > 0 ? `Rp ${numPrice.toLocaleString('id-ID')}` : 'FREE PASS';

      let dateStr = '-';
      let timeStr = '';
      const dateCandidate = ticket.event?.start_at || ticket.event?.event_start_at || (ticket.event as any)?.date;
      if (dateCandidate) {
        try {
          const d = new Date(dateCandidate);
          dateStr = d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
          const hrs = d.getHours();
          const mins = d.getMinutes();
          if (hrs !== 0 || mins !== 0) {
            timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`;
          }
        } catch { }
      }

      // Fetch event banner image for left cover art
      const rawBanner = (ticket as any).event_banner_url || ticket.event?.banner || (ticket.event as any)?.banner_url || (ticket.event as any)?.image || (ticket.event as any)?.poster || (ticket.event as any)?.venue_photo;
      const eventBannerUrl = rawBanner ? (getPhotoUrl(rawBanner, ticket.event?.id) || rawBanner) : null;
      let posterBase64: string | null = null;
      if (eventBannerUrl) {
        posterBase64 = await urlToJpegBase64(eventBannerUrl);
      }

      // Fetch QR Code base64
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
        ticketCode
      )}`;
      let qrBase64: string | null = null;
      try {
        qrBase64 = await urlToJpegBase64(qrUrl);
      } catch {
        // Fallback
      }

      const cardX = 12;
      const cardY = 28;
      const cardWidth = 186;
      const cardHeight = 84;

      // =========================================================================
      // 1. TOP DOCUMENT HEADER (METIX OFFICIAL CLEARANCE)
      // =========================================================================
      doc.setFont('helvetica', 'black');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138); // Deep Navy
      doc.text('METIX', cardX, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('OFFICIAL E-TICKET PASS & VENUE CLEARANCE', cardX + 24, 15.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Platform Ticketing Resmi Indonesia • Valid & Verified by Metix System', cardX + 24, 19.5);

      // Order info on right
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`ORDER: #${orderNum || ticket.id}`, cardX + cardWidth, 15.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`Diterbitkan: ${nowStr}`, cardX + cardWidth, 19.5, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(cardX, 23, cardX + cardWidth, 23);

      // =========================================================================
      // 2. HORIZONTAL VIP PASS (Exact Replica of On-Screen Ticket - Premium Edition)
      // =========================================================================
      // Outer Card Background & Border
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'FD');

      // 2A. Left Cover Art (Width = 46mm, Height = 84mm)
      if (posterBase64) {
        try {
          doc.addImage(posterBase64, 'JPEG', cardX, cardY, 46, cardHeight, undefined, 'FAST');
        } catch {
          doc.setFillColor(241, 245, 249);
          doc.rect(cardX, cardY, 46, cardHeight, 'F');
        }
      } else {
        doc.setFillColor(241, 245, 249);
        doc.rect(cardX, cardY, 46, cardHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.text('METIX PASS', cardX + 23, cardY + 42, { align: 'center' });
      }

      // Left Cover Art Bottom Badge Strip
      doc.setFillColor(15, 23, 42);
      doc.rect(cardX, cardY + 74, 46, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('LIVE PASS ★ VIP', cardX + 23, cardY + 80.5, { align: 'center' });

      // Border between Cover Art and Body
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(cardX + 46, cardY, cardX + 46, cardY + cardHeight);

      // 2B. Middle Ticket Body (Typography & Details, Width = 88mm)
      const bodyX = cardX + 50;

      // Line 1: Category & Authentic Ticket Code (Blue Mono)
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      const catText = (category ? category.toUpperCase() : 'CONCERT PASS') + ' • ' + ticketCode;
      doc.text(catText.substring(0, 38), bodyX, cardY + 9);

      // Line 2: Headline Event Title (Large, Bold, Dark Slate)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(eventTitle.substring(0, 24).toUpperCase(), bodyX, cardY + 18);

      // Line 3: Ticket Access Type
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${ticketType.toUpperCase()} ACCESS`, bodyX, cardY + 24);

      // Line 4: Date, Time & Venue Bar
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bodyX, cardY + 27, 82, 17, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`WAKTU  :  ${dateStr}${timeStr ? ' • ' + timeStr : ''}`, bodyX + 3, cardY + 33.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`LOKASI :  ${venue.substring(0, 44)}`, bodyX + 3, cardY + 40);

      // Line 5: 4 Bottom Info Capsules (ENTRANCE | TIPE | ROW/SEAT | PEMEGANG)
      const pillars = [
        { label: 'ENTRANCE', val: 'GATE 01' },
        { label: 'TIPE', val: ticketType.substring(0, 9) },
        { label: 'ROW / SEAT', val: 'FESTIVAL' },
        { label: 'PEMEGANG', val: buyerName.substring(0, 14) },
      ];

      const pWidth = 19.5;
      const pHeight = 28;
      const pGap = 1.3;

      pillars.forEach((p, idx) => {
        const px = bodyX + idx * (pWidth + pGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(px, cardY + 48, pWidth, pHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text(p.label, px + (pWidth / 2), cardY + 55, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        doc.text(p.val, px + (pWidth / 2), cardY + 65, { align: 'center' });
      });

      // 2C. Perforation Tear-Off Divider
      const perfX = cardX + 135;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.circle(perfX, cardY, 3, 'FD'); // Top cutout notch

      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(perfX, cardY + 3, perfX, cardY + cardHeight - 3);
      doc.setLineDashPattern([], 0);

      doc.circle(perfX, cardY + cardHeight, 3, 'FD'); // Bottom cutout notch

      // 2D. Right Ticket Stub (Width = 51mm)
      doc.setFillColor(248, 250, 252);
      doc.rect(perfX, cardY, 51, cardHeight, 'F');

      // Status Badge
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(cardX + 139, cardY + 5, 43, 6, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(5, 150, 105);
      doc.text('SIAP CHECK-IN', cardX + 160.5, cardY + 9.2, { align: 'center' });

      // QR Code
      const qrBoxX = cardX + 144.5;
      const qrBoxY = cardY + 13;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrBoxX - 1, qrBoxY - 1, 34, 34, 2, 2, 'FD');

      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', qrBoxX, qrBoxY, 32, 32);
      } else {
        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(37, 99, 235);
        doc.text(ticketCode, cardX + 160.5, cardY + 30, { align: 'center' });
      }

      // QR Instruction
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Scan di gerbang masuk venue', cardX + 160.5, cardY + 51, { align: 'center' });

      // Ticket Code (Mono)
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(ticketCode, cardX + 160.5, cardY + 57, { align: 'center' });

      // Price Display
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text(priceDisplay, cardX + 160.5, cardY + 64, { align: 'center' });

      // Metix Watermark Logo
      doc.setFont('helvetica', 'black');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      doc.text('METIX', cardX + 160.5, cardY + 75, { align: 'center' });

      // Re-stroke outer card border cleanly
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.35);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'D');

      // =========================================================================
      // 3. FOLD & CUT PERFORATION INDICATOR
      // =========================================================================
      const foldY = 120;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(cardX, foldY, cardX + cardWidth, foldY);
      doc.setLineDashPattern([], 0);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('- - - GUNTING ATAU LIPAT DI SINI (TEAR OR FOLD HERE TO CARRY PASS) - - -', cardX + (cardWidth / 2), foldY - 1, { align: 'center' });

      // =========================================================================
      // 4. TERMS & CONDITIONS SECTION (SYARAT & KETENTUAN RESMI)
      // =========================================================================
      const tcY = 126;
      const tcHeight = 156;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(250, 250, 252);
      doc.roundedRect(cardX, tcY, cardWidth, tcHeight, 4, 4, 'FD');

      // T&C Header Strip
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(cardX, tcY, cardWidth, 12, 4, 4, 'F');
      doc.rect(cardX, tcY + 7, cardWidth, 5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('TERMS & CONDITIONS  *  SYARAT & KETENTUAN MASUK ACARA', cardX + 8, tcY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(253, 224, 71);
      doc.text('METIX OFFICIAL POLICY', cardX + cardWidth - 8, tcY + 8, { align: 'right' });

      // Two-Column T&C Grid
      const colWidth = 80;
      const leftColX = cardX + 8;
      const rightColX = cardX + 96;

      const drawTcItem = (x: number, y: number, num: string, title: string, desc: string) => {
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(x, y - 2.5, 4, 4, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(num, x + 2, y + 0.5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(title, x + 6.5, y + 0.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const splitDesc = doc.splitTextToSize(desc, colWidth);
        doc.text(splitDesc, x, y + 5);
      };

      // Column 1
      let itemY = tcY + 18;
      drawTcItem(
        leftColX,
        itemY,
        '1',
        'Validasi 1x Scan (Single Entry)',
        'QR Code e-tiket hanya berlaku untuk 1 (satu) kali pemindaian masuk. Tiket yang sudah di-scan tidak dapat digunakan kembali atau dipindahtangankan.'
      );

      itemY += 21;
      drawTcItem(
        leftColX,
        itemY,
        '2',
        'Wajib Membawa Identitas Asli',
        'Pemegang tiket wajib menunjukkan kartu identitas resmi asli (KTP/SIM/Paspor) yang sah dan masih berlaku sesuai nama yang terdaftar pada pesanan tiket.'
      );

      itemY += 21;
      drawTcItem(
        leftColX,
        itemY,
        '3',
        'Larangan Barang Terlarang',
        'Dilarang membawa senjata tajam, obat terlarang, minuman keras, flare/kembang api, laser pointer, dan kamera profesional (DSLR/Mirrorless tanpa ID pers).'
      );

      // Column 2
      itemY = tcY + 18;
      drawTcItem(
        rightColX,
        itemY,
        '4',
        'Kebijakan Tiket (Non-Refundable)',
        'Tiket yang telah dibeli tidak dapat ditukar, dibatalkan, atau diuangkan kembali dengan alasan apapun, kecuali apabila acara resmi dibatalkan oleh penyelenggara.'
      );

      itemY += 21;
      drawTcItem(
        rightColX,
        itemY,
        '5',
        'Hak Penyelenggara & Keamanan',
        'Penyelenggara berhak memeriksa barang bawaan serta menolak masuk atau mengeluarkan pengunjung yang tidak mematuhi norma ketertiban dan keamanan venue.'
      );

      itemY += 21;
      drawTcItem(
        rightColX,
        itemY,
        '6',
        'Dokumentasi & Hak Publikasi',
        'Pengunjung memberikan izin kepada penyelenggara untuk mengambil foto atau rekaman video selama acara untuk keperluan dokumentasi dan publikasi resmi.'
      );

      // Support & Verification Banner
      const helpY = tcY + 138;
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(cardX + 4, helpY, cardWidth - 8, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text('BUTUH BANTUAN TIKET? Hubungi Layanan Metix: support@metix.id | partnership.metix.id', cardX + 8, helpY + 7.5);

      doc.setFont('helvetica', 'black');
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129);
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

            {/* Right: Icon Lonceng Notifikasi Tagihan (Khusus Halaman Tiket) */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleToggleNotification}
                className={`relative px-4 py-2.5 rounded-2xl border font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${hasUnreadOrders
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-amber-500/25 ring-2 ring-amber-300/60 ring-offset-2 ring-offset-blue-800'
                  : hasUnpaidOrders
                    ? 'bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
                  }`}
                title={
                  hasUnreadOrders
                    ? `Ada tagihan baru belum dibaca!`
                    : hasUnpaidOrders
                      ? `${unpaidOrders.length} Tagihan Menunggu Pembayaran (Sudah dibaca)`
                      : 'Tidak ada tagihan aktif'
                }
              >
                <div className="relative flex items-center justify-center">
                  {hasUnreadOrders ? (
                    <BellRing className="w-4 h-4 text-slate-950 animate-bounce" />
                  ) : (
                    <Bell className={`w-4 h-4 ${hasUnpaidOrders ? 'text-amber-300' : 'text-white'}`} />
                  )}

                  {/* Kelap-kelip Glowing Light Indicator HANYA JIKA BELUM DIBACA (Unread) */}
                  {hasUnreadOrders && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-90"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white"></span>
                    </span>
                  )}
                </div>

                <span>
                  {hasUnpaidOrders ? `Tagihan Pesanan (${unpaidOrders.length})` : 'Notifikasi'}
                </span>

                {hasUnreadOrders ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black animate-pulse">
                    Baru
                  </span>
                ) : hasUnpaidOrders ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-blue-100 text-[9px] font-mono font-bold">
                    {isNotificationOpen ? 'Tutup' : 'Lihat'}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {/* Pending Orders Section (HANYA MUNCUL KETIKA ICON LONCENG DIKLIK) */}
        {isNotificationOpen && hasUnpaidOrders && (
          <div className="rounded-3xl bg-slate-50 border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <BellRing className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Daftar Tagihan Menunggu Pembayaran ({unpaidOrders.length})
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Selesaikan pembayaran sebelum batas waktu berakhir untuk mengamankan tiket Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCleanExpired}
                  className="text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Bersihkan Expired</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
                  title="Tutup Panel Notifikasi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {unpaidOrders.map((ord: any) => (
                <OrderCountdownCard
                  key={ord.id || ord.order_number}
                  order={ord}
                  onRefresh={loadTickets}
                  onDismiss={handleDismissOrder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar & Tabs */}
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-3.5 sm:p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            {/* Status Filter Tabs */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-[0.98] ${activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                <span>Semua</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${activeTab === 'all'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/90 text-slate-600'
                    }`}
                >
                  {ticketCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-[0.98] ${activeTab === 'active'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                <span>Check-In</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${activeTab === 'active'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/90 text-slate-600'
                    }`}
                >
                  {ticketCounts.active}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('used')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-[0.98] ${activeTab === 'used'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                <span className="hidden sm:inline">Sudah Digunakan</span>
                <span className="sm:hidden inline">Digunakan</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${activeTab === 'used'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/90 text-slate-600'
                    }`}
                >
                  {ticketCounts.used}
                </span>
              </button>
            </div>

            {/* Search Input & Sync Button */}
            <div className="flex items-center gap-2 w-full lg:max-w-md">
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
            <div className="grid grid-cols-1 gap-6 pt-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-64 sm:h-72 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 pt-2">
              {filteredTickets.map((item) => {
                const rawStatus = (item.status || 'active').toLowerCase();
                const isUsed = rawStatus === 'used' || rawStatus === 'checked_in' || rawStatus === 'checked-in';
                const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled';
                const eventTitle = item.event?.title || (item as any).event_title || (item as any).title || 'Event Metix Pass';
                const venue = resolveVenueName(item.event);
                const ticketType = item.ticket_type?.name || (item as any).ticket_type_name || (item as any).type_name || 'Tiket';
                const category = (item.ticket_type as any)?.category || (item as any).category || '';

                // Authentic ticket_code generated by Laravel Backend
                const rawCode = item.qr_token || item.ticket_code || (item as any).code || '';
                const orderNum = item.order?.order_number || item.order_number;
                const displayTicketCode = (rawCode && !rawCode.startsWith('MTX-'))
                  ? rawCode
                  : (rawCode || (orderNum ? `TKT-${orderNum}-1` : `TKT-${item.id}`));

                const rawBanner = item.event?.banner || (item.event as any)?.banner_url || (item.event as any)?.image || (item.event as any)?.poster || (item.event as any)?.venue_photo;
                const eventBannerUrl = rawBanner ? (getPhotoUrl(rawBanner, item.event?.id) || rawBanner) : null;
                const holderName = item.holder_name || item.attendee?.full_name || item.order?.buyer_name || (item as any).user?.name || getStoredUser()?.name || 'Pelanggan Metix';
                const rawPrice = item.ticket_type?.price ?? (item.order as any)?.grand_total ?? (item.order as any)?.total_amount ?? 0;
                const numPrice = Number(rawPrice);
                const priceDisplay = numPrice > 0 ? `Rp ${numPrice.toLocaleString('id-ID')}` : 'FREE PASS';

                let dateStr = '15 Sep 2026';
                let timeStr = '';
                const dateCandidate = item.event?.event_start_at || item.event?.start_at || (item as any).event_date || item.created_at;
                if (dateCandidate) {
                  try {
                    const d = new Date(dateCandidate);
                    dateStr = d.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const hrs = d.getHours();
                    const mins = d.getMinutes();
                    if (hrs !== 0 || mins !== 0) {
                      timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                    }
                  } catch {
                    // Fallback
                  }
                }

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row group text-slate-900"
                  >
                    {/* Status Scanned (Sudah Di-Scan): Blur Card Effect & Garis Panjang dari Kiri ke Kanan */}
                    {isUsed && (
                      <>
                        {/* 1. Frosted Blur Backdrop Overlay */}
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2.5px] z-30 pointer-events-none transition-all duration-500" />

                        {/* 2. Long Horizontal Ribbon Banner from Left to Right */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
                          <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl py-2.5 sm:py-3.5 px-4 border-y-2 border-emerald-400/60 flex items-center justify-center gap-2.5 sm:gap-3.5 select-none">
                            <CheckCircle2 className="w-5 h-5 text-white shrink-0 drop-shadow-sm animate-pulse" />
                            <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-widest text-white drop-shadow-sm font-mono whitespace-nowrap">
                              SUDAH DI SCAN
                            </span>
                            <span className="hidden sm:inline-block text-emerald-200 font-mono">•</span>
                            <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-emerald-950/40 px-3 py-0.5 rounded-full border border-emerald-300/30 whitespace-nowrap">
                              GATE CHECKED-IN
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 1. Left Edge Cover Art / Poster (Spanning full ticket height like a VIP Pass) */}
                    {eventBannerUrl ? (
                      <div className="relative w-full h-44 md:h-auto md:w-44 lg:w-48 shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/80 group/poster">
                        <img
                          src={eventBannerUrl}
                          alt={eventTitle}
                          className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-700 ease-out"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-white font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 shadow-xs">
                            LIVE PASS
                          </span>
                          <span className="text-[9px] font-bold text-white/90 font-mono drop-shadow-sm">
                            ★ VIP
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-40 md:h-auto md:w-40 lg:w-44 shrink-0 bg-slate-50 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-200/80 text-slate-400">
                        <Ticket className="w-10 h-10 text-slate-400 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono text-center">
                          METIX PASS
                        </span>
                      </div>
                    )}

                    {/* 2. Main Ticket Typography Body - Clean & Plain White ("Putih Polos & Simpel") */}
                    <div className="relative p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between space-y-4 bg-white z-10">
                      {/* Top Section: Category, Ticket Code, Title, and Access Subtitle */}
                      <div className="space-y-2">
                        {/* Line 1: Category & Authentic Ticket Code (Satu Baris Rata) */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-600 font-mono">
                            {category || 'METIX CONCERT PASS'}
                          </span>
                          <span className="text-slate-300 font-mono">•</span>
                          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 whitespace-nowrap">
                            {displayTicketCode}
                          </span>
                        </div>

                        {/* Line 2: Headline Concert Title (UNGU) */}
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                          {eventTitle}
                        </h3>

                        {/* Line 3: Ticket Type Subtitle */}
                        <p className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-500">
                          {ticketType} ACCESS
                        </p>
                      </div>

                      {/* Line 4: Date, Time & Venue Bar (Sama Rata, Simple & Bersih) */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        {timeStr && (
                          <div className="flex items-center gap-2 font-bold text-slate-700 shrink-0">
                            <span className="text-slate-300">•</span>
                            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{timeStr} WIB</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 font-semibold text-slate-600 text-xs sm:text-sm min-w-0">
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{venue}</span>
                        </div>
                      </div>

                      {/* Line 5: 4 Bottom Info Pillars (ENTRANCE | TIPE | ROW/SEAT | PEMEGANG) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">
                            ENTRANCE
                          </span>
                          <span className="block text-xs font-black text-slate-800 truncate mt-0.5">
                            GATE 01
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">
                            TIPE
                          </span>
                          <span className="block text-xs font-black text-blue-600 truncate mt-0.5">
                            {ticketType}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">
                            ROW / SEAT
                          </span>
                          <span className="block text-xs font-black text-slate-800 truncate mt-0.5">
                            FESTIVAL
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">
                            PEMEGANG
                          </span>
                          <span className="block text-xs font-black text-slate-800 truncate mt-0.5" title={holderName}>
                            {holderName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Vertical Tear-Off Perforation Divider (Garis Sobekan Tiket ke Samping) */}
                    <div className="relative hidden md:flex flex-col items-center justify-between select-none shrink-0 w-6 z-20">
                      {/* Top Notch Cutout */}
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/60 -mt-3 shadow-inner" />
                      {/* Vertical Dashed Perforation Line */}
                      <div className="w-0 flex-1 border-r-2 border-dashed border-slate-200 my-1" />
                      {/* Bottom Notch Cutout */}
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/60 -mb-3 shadow-inner" />
                    </div>

                    {/* Horizontal Divider Fallback for Small Mobile Screens */}
                    <div className="relative flex md:hidden items-center justify-between py-1 select-none z-20">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/60 -ml-3 shadow-inner" />
                      <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/60 -mr-3 shadow-inner" />
                    </div>

                    {/* 3. Right Ticket Stub (QR Code & Action Section) - Simple & Clean */}
                    <div className="relative p-5 sm:p-6 w-full md:w-56 lg:w-60 flex flex-col items-center justify-between bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-200/70 space-y-4 shrink-0 z-10">
                      {/* Stub Header: Status & Price */}
                      <div className="w-full flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${isUsed
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : isCancelled
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                        >
                          {isUsed ? 'Sudah Digunakan' : isCancelled ? 'Dibatalkan' : 'Siap Check-In'}
                        </span>

                        <span className="text-xs font-mono font-black text-slate-800">
                          {priceDisplay}
                        </span>
                      </div>

                      {/* Official QR Code with Clean Frame */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="relative p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs group-hover:scale-105 transition-all">
                          <img
                            src={item.qr_code_url || getTicketQrUrl(item.id)}
                            alt={`QR Code ${displayTicketCode}`}
                            className={`w-28 h-28 sm:w-32 sm:h-32 object-contain transition-all duration-300 ${isUsed
                                ? 'filter blur-[3.5px] opacity-25 grayscale'
                                : isCancelled
                                  ? 'filter blur-[3px] opacity-25 grayscale'
                                  : ''
                              }`}
                            onError={(e) => {
                              const qrData = item.qr_token || item.ticket_code || displayTicketCode || String(item.id);
                              (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                qrData
                              )}`;
                            }}
                          />

                          {/* Watermark / Badge if Used (Sudah Di-scan) */}
                          {isUsed && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900/40 backdrop-blur-[1px] select-none">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg mb-1 border-2 border-white">
                                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-md bg-slate-900/90 border border-white/20">
                                Checked-In
                              </span>
                            </div>
                          )}

                          {/* Watermark / Badge if Cancelled */}
                          {isCancelled && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900/40 backdrop-blur-[1px] select-none">
                              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md mb-1 border-2 border-white">
                                <XCircle className="w-5 h-5 stroke-[2.5]" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-300/30">
                                Dibatalkan
                              </span>
                            </div>
                          )}
                        </div>

                        {/* QR helper text */}
                        <p className="text-[10px] text-slate-500 font-medium text-center flex items-center justify-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{isUsed ? 'Tiket terverifikasi' : 'Scan di gerbang masuk'}</span>
                        </p>
                      </div>

                      {/* Download Button */}
                      <div className="w-full pt-1">
                        {isUsed ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-black flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Checked-In
                          </button>
                        ) : isCancelled ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 text-xs font-black flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Dibatalkan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePrintTicketPdf({ ...item, ticket_code: displayTicketCode, event_banner_url: eventBannerUrl } as any)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh PDF
                          </button>
                        )}
                      </div>
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
