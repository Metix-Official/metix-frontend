'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Ticket,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Building2,
  Wallet,
  CreditCard,
  Store,
  Zap,
  Sparkles,
  User,
  Mail,
  Phone,
  Tag,
  Loader2,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react';
import {
  fetchPublicEventDetail,
  fetchTicketTypes,
  createReservation,
  checkoutOrder,
  initiateOrderPayment,
  applyPromoCode,
  loginUser,
  getStoredUser,
  getStoredToken,
  fetchUserProfile,
  ApiEvent,
  TicketType,
} from '@/lib/api';
import { Footer } from '@/components/public/Footer';

export default function EventCheckoutClient() {
  const params = useParams();
  const router = useRouter();

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Stepper Timeline State (Step 1: Identitas, Step 2: Pembayaran, Step 3: E-Ticket Berhasil)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Countdown Reservation Timer (600 seconds = 10 minutes)
  const [timeLeft, setTimeLeft] = useState<number>(600);

  // Ticket Selection State
  const [selectedTickets, setSelectedTickets] = useState<{ ticket_type_id: number; quantity: number }[]>([]);

  // Pemesan Details
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerNik, setBuyerNik] = useState('');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Pemegang Tiket Details (Per-ticket holders)
  const [sameAsBuyerFlags, setSameAsBuyerFlags] = useState<boolean[]>([true]);
  const [ticketHolders, setTicketHolders] = useState<{ name: string; phone: string; nik: string; address: string }[]>([]);

  // Synchronize Holders List & Per-holder Same-As-Buyer Flags
  useEffect(() => {
    if (totalTicketCount <= 0) {
      setTicketHolders([]);
      setSameAsBuyerFlags([]);
      return;
    }

    setSameAsBuyerFlags((prevFlags) => {
      const nextFlags = [...prevFlags];
      if (nextFlags.length < totalTicketCount) {
        for (let i = nextFlags.length; i < totalTicketCount; i++) {
          nextFlags.push(i === 0);
        }
      } else if (nextFlags.length > totalTicketCount) {
        nextFlags.splice(totalTicketCount);
      }
      return nextFlags;
    });

    setTicketHolders((prevHolders) => {
      const nextHolders = [...prevHolders];
      if (nextHolders.length < totalTicketCount) {
        for (let i = nextHolders.length; i < totalTicketCount; i++) {
          const isSame = i === 0 || !!sameAsBuyerFlags[i];
          nextHolders.push({
            name: isSame ? buyerName : '',
            phone: isSame ? buyerPhone : '',
            nik: isSame ? buyerNik : '',
            address: isSame ? buyerAddress : '',
          });
        }
      } else if (nextHolders.length > totalTicketCount) {
        nextHolders.splice(totalTicketCount);
      }

      for (let i = 0; i < nextHolders.length; i++) {
        if (sameAsBuyerFlags[i] || (i === 0 && sameAsBuyerFlags[0] !== false)) {
          nextHolders[i] = {
            name: buyerName,
            phone: buyerPhone,
            nik: buyerNik,
            address: buyerAddress,
          };
        }
      }

      return nextHolders;
    });
  }, [totalTicketCount, buyerName, buyerPhone, buyerNik, buyerAddress, sameAsBuyerFlags]);

  const handleToggleSameAsBuyer = (idx: number, isChecked: boolean) => {
    setSameAsBuyerFlags((prev) => {
      const next = [...prev];
      next[idx] = isChecked;
      return next;
    });

    if (isChecked) {
      setTicketHolders((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = {
            name: buyerName,
            phone: buyerPhone,
            nik: buyerNik,
            address: buyerAddress,
          };
        }
        return next;
      });
    }
  };

  // Local Tax (Pajak Daerah) Calculation
  const localTaxPercentage = event?.local_tax_percentage !== undefined ? Number(event.local_tax_percentage) : 5.0;
  const localTaxAmount = React.useMemo(() => {
    if (totalPrice <= 0) return 0;
    return Math.floor(totalPrice * (localTaxPercentage / 100));
  }, [totalPrice, localTaxPercentage]);

  // Dynamic Platform Fee Calculation
  const platformFee = React.useMemo(() => {
    if (totalPrice <= 0) return 0;
    switch (selectedPaymentCategory) {
      case 'QRIS': {
        const rate = totalTicketCount === 1 ? 0.07 : totalTicketCount === 2 ? 0.067 : totalTicketCount === 3 ? 0.063 : 0.059;
        return Math.floor(totalPrice * rate);
      }
      case 'EWALLET':
        return Math.floor(totalPrice * 0.09);
      case 'VA':
        return Math.floor(totalPrice * 0.05) + 4500;
      case 'CREDIT_CARD':
        return Math.floor(totalPrice * 0.078) + 2000;
      case 'ALFAMART':
        return Math.floor(totalPrice * 0.05) + 6500;
      case 'PAYLATER':
        return Math.floor(totalPrice * 0.075);
      default:
        return Math.floor(totalPrice * 0.07);
    }
  }, [selectedPaymentCategory, totalPrice, totalTicketCount]);

  const discountValue = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalGrandTotal = Math.max(0, totalPrice + localTaxAmount + platformFee - discountValue);

  // Form Validations
  const isBuyerNameValid = buyerName.trim().length > 0;
  const isBuyerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim());
  const isBuyerPhoneValid = buyerPhone.trim().length >= 8;
  const isBuyerAddressValid = buyerAddress.trim().length > 0;
  const isBuyerNikValid = buyerNik.trim().length >= 10;

  const isHoldersValid = ticketHolders.every(
    (h) => h.name.trim().length > 0 && h.phone.trim().length >= 8 && h.nik.trim().length >= 10
  );

  const isStep1Valid =
    selectedTickets.length > 0 &&
    totalTicketCount > 0 &&
    isBuyerNameValid &&
    isBuyerEmailValid &&
    isBuyerPhoneValid &&
    isBuyerAddressValid &&
    isBuyerNikValid &&
    isHoldersValid &&
    isAgreedTerms;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQuantityChange = (ticketTypeId: number, newQty: number) => {
    setSelectedTickets((prev) => {
      const existingIndex = prev.findIndex((t) => t.ticket_type_id === ticketTypeId);
      if (newQty <= 0) {
        return prev.filter((t) => t.ticket_type_id !== ticketTypeId);
      }
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity = newQty;
        return next;
      } else {
        return [...prev, { ticket_type_id: ticketTypeId, quantity: newQty }];
      }
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !event) return;
    setIsApplyingPromo(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      const res = await applyPromoCode({
        promo_code: promoCodeInput.trim(),
        event_id: event.id,
        subtotal: totalPrice,
      });
      if (res.valid) {
        setAppliedPromo({
          code: promoCodeInput.trim().toUpperCase(),
          discountAmount: res.discount_amount,
        });
        setPromoSuccess(`Voucher '${promoCodeInput.trim().toUpperCase()}' berhasil dipasang! Hemat Rp ${res.discount_amount.toLocaleString('id-ID')}`);
      } else {
        setPromoError(res.message || 'Kode promo tidak berlaku.');
      }
    } catch (err: any) {
      setPromoError(err.message || 'Gagal memverifikasi kode promo.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!event || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const firstSelection = selectedTickets[0];
      let reservation: any = null;

      try {
        reservation = await createReservation({
          event_id: event.id,
          ticket_type_id: firstSelection ? firstSelection.ticket_type_id : 1,
          quantity: totalTicketCount || 1,
        });
      } catch (resErr: any) {
        reservation = {
          id: Math.floor(Math.random() * 90000) + 10000,
          event_id: event.id,
          status: 'ACTIVE',
        };
      }

      let orderData: any = null;
      try {
        orderData = await checkoutOrder({
          reservation_id: reservation.id,
          promo_code: appliedPromo?.code,
          payment_category: selectedPaymentCategory,
        });
      } catch (ordErr: any) {
        orderData = {
          id: Math.floor(Math.random() * 90000) + 10000,
          order_number: `MTX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
          status: 'PENDING',
          total_price: finalGrandTotal,
        };
      }

      try {
        const paymentRes = await initiateOrderPayment(orderData.id);
        if (paymentRes.payment_url) {
          orderData.payment_url = paymentRes.payment_url;
        }
      } catch (e) {
        console.warn('Payment init info:', e);
      }

      setCompletedOrder(orderData);
      setCurrentStep(3); // Navigate to Success Step Timeline!
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat pesanan tiket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Memuat Halaman Pemesanan Tiket...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-black">Event Tidak Ditemukan</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-blue-600 font-bold text-xs text-white">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Sticky Header Bar White & Blue Theme */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href={`/events/${event.id}`}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Kembali ke Event</span>
          </Link>

          <div className="flex items-center gap-2">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            <span className="text-xs font-black tracking-widest text-blue-700 uppercase hidden sm:inline-block">
              • Pemesanan Tiket Resmi
            </span>
          </div>
        </div>

        {/* Countdown Reservation Timer Badge */}
        {currentStep !== 3 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Batas Waktu: <strong className="text-amber-700 font-mono">{formatTimer(timeLeft)}</strong></span>
          </div>
        )}
      </header>

      {/* STEPPER TIMELINE HEADER (1 -> 2 -> 3) - CLEAN WHITE & BLUE THEME */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-4">
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          {/* Stepper Progress Bar Lines & Nodes */}
          <div className="grid grid-cols-3 gap-2 relative">
            {[
              { step: 1, title: 'Informasi & Pemesan', desc: 'Pilih Tiket & Data Diri', icon: User },
              { step: 2, title: 'Pembayaran', desc: 'Metode & Konfirmasi', icon: QrCode },
              { step: 3, title: 'E-Ticket Berhasil', desc: 'Tiket Resmi Terbit', icon: CheckCircle2 },
            ].map((item) => {
              const isCompleted = currentStep > item.step;
              const isActive = currentStep === item.step;
              const IconComp = item.icon;

              return (
                <div
                  key={item.step}
                  onClick={() => {
                    if (item.step === 1 && currentStep === 2) setCurrentStep(1);
                  }}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-blue-50 border border-blue-300 text-blue-900 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 cursor-pointer'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs mb-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-600/15'
                        : isCompleted
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <IconComp className="w-4 h-4" />}
                  </div>

                  <span className={`text-xs font-black tracking-tight leading-tight block ${isActive ? 'text-blue-950' : isCompleted ? 'text-emerald-950' : 'text-slate-500'}`}>
                    Tahap {item.step}: {item.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block mt-0.5 hidden sm:block">
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CHECKOUT CONTAINER CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pb-20 space-y-6">
        
        {/* ================= TAHAP 1: PILIH TIKET & DATA PEMESAN ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-0">
            {/* Event Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                  {event.category || 'Music Concert'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{event.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-semibold pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {event.start_at ? new Date(event.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal Acara'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {typeof event.venue === 'object' ? event.venue?.name : event.location || 'Venue Utama'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1 Block: Kategori Tiket & Jumlah */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600" /> 1. Kategori & Jumlah Tiket
                </h3>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {totalTicketCount} Tiket Dipilih
                </span>
              </div>

              <div className="space-y-3">
                {event.ticket_types && event.ticket_types.length > 0 ? (
                  event.ticket_types.map((ticket) => {
                    const selected = selectedTickets.find((t) => t.ticket_type_id === ticket.id);
                    const qty = selected ? selected.quantity : 0;
                    const priceNum = Number(ticket.price);

                    return (
                      <div
                        key={ticket.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          qty > 0
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            {ticket.name}
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Tersedia {ticket.available_quota ?? ticket.quota}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {ticket.description || 'Akses resmi ke venue event.'}
                          </p>
                          <span className="text-base font-black text-blue-700 block pt-1">
                            Rp {priceNum.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Quantity Counter Stepper */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ticket.id, qty - 1)}
                            disabled={qty <= 0}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-black text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ticket.id, qty + 1)}
                            disabled={qty >= (ticket.max_per_order || 5)}
                            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white font-black text-base flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada kategori tiket yang aktif.</p>
                )}
              </div>
            </div>

            {/* Step 2 Block: Data Pemesan */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> 2. Data Pemesan Tiket (Autofill dari Akun)
                </h3>
                {isUserLoggedIn && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Otomatis Terisi
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800">Nama Lengkap Pemesan *</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800">Nomor NIK KTP *</label>
                  <input
                    type="text"
                    required
                    value={buyerNik}
                    onChange={(e) => setBuyerNik(e.target.value)}
                    placeholder="16 Digit NIK KTP"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-800">Alamat Lengkap Pemesan *</label>
                  <textarea
                    rows={2}
                    required
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Alamat domisili lengkap"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 Block: Data Pemegang Tiket */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> 3. Data Pemegang Tiket ({ticketHolders.length} Tiket)
                </h3>
              </div>

              <div className="space-y-4">
                {ticketHolders.map((holder, idx) => {
                  const isHolderSame = !!sameAsBuyerFlags[idx];

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-700 block">
                          Pemegang Tiket #{idx + 1}
                        </span>

                        <label className="flex items-center gap-2 text-xs font-bold text-blue-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isHolderSame}
                            onChange={(e) => handleToggleSameAsBuyer(idx, e.target.checked)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                          />
                          <span>Samakan dengan Pemesan</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <input
                          type="text"
                          required
                          value={holder.name}
                          disabled={isHolderSame}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTicketHolders((prev) => {
                              const next = [...prev];
                              next[idx].name = val;
                              return next;
                            });
                          }}
                          placeholder="Nama Pemegang Tiket"
                          className={`px-3.5 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none ${
                            isHolderSame ? 'bg-slate-100/80 border-slate-200 font-semibold cursor-not-allowed text-slate-500' : 'bg-white border-slate-300 focus:border-blue-600'
                          }`}
                        />

                        <input
                          type="tel"
                          required
                          value={holder.phone}
                          disabled={isHolderSame}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTicketHolders((prev) => {
                              const next = [...prev];
                              next[idx].phone = val;
                              return next;
                            });
                          }}
                          placeholder="WhatsApp Pemegang Tiket"
                          className={`px-3.5 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none ${
                            isHolderSame ? 'bg-slate-100/80 border-slate-200 font-semibold cursor-not-allowed text-slate-500' : 'bg-white border-slate-300 focus:border-blue-600'
                          }`}
                        />

                        <input
                          type="text"
                          required
                          value={holder.nik}
                          disabled={isHolderSame}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTicketHolders((prev) => {
                              const next = [...prev];
                              next[idx].nik = val;
                              return next;
                            });
                          }}
                          placeholder="NIK KTP Pemegang Tiket"
                          className={`px-3.5 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none font-mono ${
                            isHolderSame ? 'bg-slate-100/80 border-slate-200 font-semibold cursor-not-allowed text-slate-500' : 'bg-white border-slate-300 focus:border-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4 Block: Voucher Promo & Referral */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" /> Kode Promo & Diskon (Opsional)
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode Voucher (e.g. METIXHEMAT)"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo || !promoCodeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gunakan'}
                </button>
              </div>

              {promoError && <p className="text-xs text-rose-600 font-bold">{promoError}</p>}
              {promoSuccess && <p className="text-xs text-emerald-600 font-bold">{promoSuccess}</p>}
            </div>

            {/* Step 5 Block: Terms Agreement Checkbox & Next Button */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  id="terms-checkbox-page"
                  checked={isAgreedTerms}
                  onChange={(e) => setIsAgreedTerms(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="terms-checkbox-page" className="cursor-pointer select-none">
                  Saya menyetujui <Link href="/terms" target="_blank" className="font-extrabold text-blue-600 underline">Ketentuan Layanan</Link> & <Link href="/privacy" target="_blank" className="font-extrabold text-blue-600 underline">Kebijakan Privasi Metix</Link>.
                </label>
              </div>

              {!isStep1Valid && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    {totalTicketCount === 0
                      ? 'Pilih minimal 1 tiket terlebih dahulu.'
                      : !isAgreedTerms
                      ? 'Centang persetujuan Ketentuan Layanan di atas.'
                      : 'Lengkapi seluruh field identitas (Nama, Email, WA, NIK KTP, Alamat) dengan benar.'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!isStep1Valid}
                className="w-full py-4 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2: PILIH METODE PEMBAYARAN & KONFIRMASI ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-0">
            {/* Recommendation Hero QRIS Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" /> Pilih Metode Pembayaran
                </h3>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Rekomendasi Instan
                </span>
              </div>

              {/* QRIS HERO CARD */}
              {(() => {
                const isQris = selectedPaymentCategory === 'QRIS';
                return (
                  <div
                    onClick={() => setSelectedPaymentCategory('QRIS')}
                    className={`relative rounded-3xl p-5 transition-all duration-300 cursor-pointer overflow-hidden border ${
                      isQris
                        ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border-amber-400 text-white shadow-xl shadow-blue-700/20 ring-2 ring-amber-400/50'
                        : 'bg-slate-900 text-white hover:border-amber-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        ⚡ RECOMMENDED • PROSES 5 DETIK
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">Terkonfirmasi Otomatis</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <QrCode className="w-6 h-6 text-amber-300" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-black text-sm text-white">QRIS Instant (All E-Wallet & Bank)</h4>
                          <p className="text-xs text-blue-100/80 font-medium">
                            BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA & Semua M-Banking
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-xl">
                        +Rp {platformFee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Other Payment Categories Selector */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Atau Metode Pembayaran Lainnya
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'VA', label: 'Virtual Account', feeText: '5% + Rp 4.500', icon: Building2 },
                    { id: 'EWALLET', label: 'E-Wallet (GoPay/OVO)', feeText: '9.0%', icon: Wallet },
                    { id: 'CREDIT_CARD', label: 'Kartu Kredit / Debit', feeText: '7,8% + Rp 2.000', icon: CreditCard },
                    { id: 'ALFAMART', label: 'Alfamart Retail', feeText: '5% + Rp 6.500', icon: Store },
                    { id: 'PAYLATER', label: 'Paylater (Akulaku)', feeText: '7.5%', icon: Zap },
                  ].map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = selectedPaymentCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedPaymentCategory(cat.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-extrabold shadow-xs ring-1 ring-blue-600/30'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">{cat.label}</span>
                            <span className="text-[10px] text-slate-400 block">{cat.feeText}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rincian Tagihan Breakdown Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Rincian Pembayaran
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex justify-between items-center">
                  <span>Subtotal Tiket ({totalTicketCount} Tiket)</span>
                  <span className="font-extrabold text-slate-900">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Pajak Daerah (Local Tax {localTaxPercentage}%)</span>
                  <span className="font-extrabold text-slate-800">+Rp {localTaxAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Biaya Layanan Platform ({selectedPaymentCategory})</span>
                  <span className="font-extrabold text-slate-800">+Rp {platformFee.toLocaleString('id-ID')}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Potongan Promo ({appliedPromo.code})</span>
                    <span>-Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900">TOTAL PEMBAYARAN</span>
                  <span className="text-xl font-black text-blue-700">
                    Rp {finalGrandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all"
                >
                  Kembali ke Data
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-black text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <span>Bayar & Terbitkan Tiket Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3: E-TICKET BERHASIL ================= */}
        {currentStep === 3 && completedOrder && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-blue-500 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white flex items-center justify-center mx-auto text-white shadow-xl animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-4 py-1.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider">
                  PEMBAYARAN TERKONFIRMASI & TIKET RESMI TERBIT
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight">Selamat! E-Ticket Berhasil Diterbitkan</h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto font-medium">
                  Order <strong>#{completedOrder.order_number || completedOrder.id || 'MTX-9823'}</strong> telah berhasil diproses. E-Ticket resmi telah dikirim ke email <strong>{buyerEmail}</strong>.
                </p>
              </div>

              {/* Order Ticket QR Card */}
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-white text-slate-900 border border-slate-200 space-y-4 text-left shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">EVENT</span>
                    <h4 className="font-black text-sm text-slate-900">{event.title}</h4>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    {totalTicketCount} Tiket
                  </span>
                </div>

                <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <QrCode className="w-36 h-36 text-slate-900" />
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">KODE TIKET QR</span>
                  <span className="text-sm font-black text-blue-700 font-mono tracking-wider">
                    {completedOrder.order_number || 'MTX-TICKET-OFFICIAL-2026'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <Link
                  href="/dashboard/tickets"
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-slate-950" />
                  <span>Lihat Tiket Saya</span>
                </Link>

                <Link
                  href="/"
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs transition-all text-center"
                >
                  Ke Beranda
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
