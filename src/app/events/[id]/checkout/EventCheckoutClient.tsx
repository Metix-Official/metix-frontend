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
  createPublicOrder,
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
  const [isSameAsBuyer, setIsSameAsBuyer] = useState(true);
  const [ticketHolders, setTicketHolders] = useState<{ name: string; phone: string; nik: string; address: string }[]>([]);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Terms Agreement
  const [isAgreedTerms, setIsAgreedTerms] = useState(false);

  // Payment Category State
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string>('QRIS');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Load Event Detail & User Profile
  useEffect(() => {
    const rawId = params?.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    const fetchId = targetId || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : null);

    if (fetchId) {
      fetchPublicEventDetail(fetchId).then(async (data) => {
        if (data) {
          try {
            const types = await fetchTicketTypes(data.id);
            if (types && types.length > 0) {
              data.ticket_types = types;
            }
          } catch {
            // keep existing types or fallback
          }

          setEvent(data);

          // Auto-select first ticket if available
          if (data.ticket_types && data.ticket_types.length > 0) {
            setSelectedTickets([{ ticket_type_id: data.ticket_types[0].id, quantity: 1 }]);
          }
        }
        setIsLoadingEvent(false);
      });
    }

    // Auto-fill user identity from Profile / LocalStorage
    const token = getStoredToken();
    const user = getStoredUser();

    if (token) {
      setIsUserLoggedIn(true);
      const getAddressValue = (u: any) =>
        u?.address || u?.location || (typeof window !== 'undefined' ? localStorage.getItem('metix_user_address') : '') || 'Jakarta South, Indonesia';
      const getNikValue = (u: any) =>
        u?.nik || (typeof window !== 'undefined' ? localStorage.getItem('metix_user_nik') : '') || '3171023901920001';

      if (user) {
        setBuyerName(user.name || user.first_name || '');
        setBuyerEmail(user.email || '');
        setBuyerPhone(user.phone || '');
        setBuyerAddress(getAddressValue(user));
        setBuyerNik(getNikValue(user));
      }

      fetchUserProfile().then((freshUser) => {
        if (freshUser) {
          setBuyerName(freshUser.name || freshUser.first_name || '');
          setBuyerEmail(freshUser.email || '');
          setBuyerPhone(freshUser.phone || '');
          setBuyerAddress(getAddressValue(freshUser));
          setBuyerNik(getNikValue(freshUser));
        }
      });
    }
  }, [params]);

  // Reservation Timer Countdown
  useEffect(() => {
    if (currentStep === 3) return; // Stop countdown on success step
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // Calculate Ticket Subtotal
  const totalPrice = React.useMemo(() => {
    if (!event || !event.ticket_types) return 0;
    return selectedTickets.reduce((sum, item) => {
      const ticketType = event.ticket_types?.find((t) => t.id === item.ticket_type_id);
      const price = ticketType ? Number(ticketType.price) : 0;
      return sum + price * item.quantity;
    }, 0);
  }, [event, selectedTickets]);

  const totalTicketCount = React.useMemo(() => {
    return selectedTickets.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedTickets]);

  // Synchronize Holders List
  useEffect(() => {
    if (totalTicketCount <= 0) {
      setTicketHolders([]);
      return;
    }

    setTicketHolders((prev) => {
      const nextHolders = [...prev];
      if (nextHolders.length < totalTicketCount) {
        for (let i = nextHolders.length; i < totalTicketCount; i++) {
          nextHolders.push({
            name: i === 0 && isSameAsBuyer ? buyerName : '',
            phone: i === 0 && isSameAsBuyer ? buyerPhone : '',
            nik: i === 0 && isSameAsBuyer ? buyerNik : '',
            address: i === 0 && isSameAsBuyer ? buyerAddress : '',
          });
        }
      } else if (nextHolders.length > totalTicketCount) {
        nextHolders.splice(totalTicketCount);
      }

      if (isSameAsBuyer && nextHolders.length > 0) {
        nextHolders[0] = {
          name: buyerName,
          phone: buyerPhone,
          nik: buyerNik,
          address: buyerAddress,
        };
      }

      return nextHolders;
    });
  }, [totalTicketCount, isSameAsBuyer, buyerName, buyerPhone, buyerNik, buyerAddress]);

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
      const res = await applyPromoCode(promoCodeInput.trim(), event.id, totalPrice);
      if (res.valid) {
        setAppliedPromo({
          code: promoCodeInput.trim().toUpperCase(),
          discountAmount: res.discountAmount,
        });
        setPromoSuccess(`Voucher '${promoCodeInput.trim().toUpperCase()}' berhasil dipasang! Hemat Rp ${res.discountAmount.toLocaleString('id-ID')}`);
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
      const payload = {
        event_id: event.id,
        items: selectedTickets,
        buyer_details: {
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
          address: buyerAddress,
          nik: buyerNik,
        },
        ticket_holders: ticketHolders,
        payment_category: selectedPaymentCategory,
        promo_code: appliedPromo ? appliedPromo.code : undefined,
      };

      const response = await createPublicOrder(payload);
      setCompletedOrder(response);
      setCurrentStep(3); // Navigate to Success Step Timeline!
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat pesanan tiket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-slate-400">Memuat Halaman Pemesanan Tiket...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-black">Event Tidak Ditemukan</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-blue-600 font-bold text-xs">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Top Dynamic Background Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/events/${event.id}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Event</span>
          </Link>

          <div className="flex items-center gap-2">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase hidden sm:inline-block">
              • Secure Checkout
            </span>
          </div>
        </div>

        {/* Countdown Reservation Timer Badge */}
        {currentStep !== 3 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Batas Waktu: <strong>{formatTimer(timeLeft)}</strong></span>
          </div>
        )}
      </header>

      {/* STEPPER TIMELINE HEADER (1 -> 2 -> 3) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-4">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-800/90 shadow-2xl space-y-4">
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
                      ? 'bg-blue-600/20 border border-blue-500/40 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-pointer'
                      : 'bg-slate-950/40 border border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs mb-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-4 ring-blue-600/20'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <IconComp className="w-4 h-4" />}
                  </div>

                  <span className="text-xs font-black tracking-tight leading-tight block">
                    Tahap {item.step}: {item.title}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 hidden sm:block">
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CHECKOUT CONTAINER CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pb-20 space-y-8">
        
        {/* ================= TAHAP 1: PILIH TIKET & DATA PEMESAN ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-0">
            {/* Event Summary Card */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  {event.category || 'Music Concert'}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">{event.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-semibold pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {event.start_at ? new Date(event.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal Acara'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {typeof event.venue === 'object' ? event.venue?.name : event.location || 'Venue Utama'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1 Block: Kategori Tiket & Jumlah */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-400" /> 1. Kategori & Jumlah Tiket
                </h3>
                <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
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
                            ? 'bg-blue-600/15 border-blue-500/50 ring-1 ring-blue-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                            {ticket.name}
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Tersedia {ticket.available_quota ?? ticket.quota}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {ticket.description || 'Akses resmi ke venue event.'}
                          </p>
                          <span className="text-base font-black text-amber-300 block pt-1">
                            Rp {priceNum.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Quantity Counter Stepper */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ticket.id, qty - 1)}
                            disabled={qty <= 0}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-black text-base flex items-center justify-center cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-black text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ticket.id, qty + 1)}
                            disabled={qty >= (ticket.max_per_order || 5)}
                            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black text-base flex items-center justify-center cursor-pointer transition-colors shadow-md"
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
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> 2. Data Pemesan Tiket (Autofill dari Akun)
                </h3>
                {isUserLoggedIn && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Otomatis Terisi
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Nama Lengkap Pemesan *</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-300">Nomor NIK KTP *</label>
                  <input
                    type="text"
                    required
                    value={buyerNik}
                    onChange={(e) => setBuyerNik(e.target.value)}
                    placeholder="16 Digit NIK KTP"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-300">Alamat Lengkap Pemesan *</label>
                  <textarea
                    rows={2}
                    required
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Alamat domisili lengkap"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 Block: Data Pemegang Tiket */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" /> 3. Data Pemegang Tiket ({ticketHolders.length} Tiket)
                </h3>

                <label className="flex items-center gap-2 text-xs font-bold text-blue-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSameAsBuyer}
                    onChange={(e) => setIsSameAsBuyer(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span>Samakan dengan Pemesan</span>
                </label>
              </div>

              <div className="space-y-4">
                {ticketHolders.map((holder, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <span className="text-xs font-extrabold text-amber-300 block">
                      Pemegang Tiket #{idx + 1}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <input
                        type="text"
                        required
                        value={holder.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTicketHolders((prev) => {
                            const next = [...prev];
                            next[idx].name = val;
                            return next;
                          });
                        }}
                        placeholder="Nama Pemegang Tiket"
                        className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />

                      <input
                        type="tel"
                        required
                        value={holder.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTicketHolders((prev) => {
                            const next = [...prev];
                            next[idx].phone = val;
                            return next;
                          });
                        }}
                        placeholder="WhatsApp Pemegang Tiket"
                        className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />

                      <input
                        type="text"
                        required
                        value={holder.nik}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTicketHolders((prev) => {
                            const next = [...prev];
                            next[idx].nik = val;
                            return next;
                          });
                        }}
                        placeholder="NIK KTP Pemegang Tiket"
                        className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4 Block: Voucher Promo & Referral */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" /> Kode Promo & Diskon (Opsional)
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan Kode Voucher (e.g. METIXHEMAT)"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo || !promoCodeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gunakan'}
                </button>
              </div>

              {promoError && <p className="text-xs text-rose-400 font-bold">{promoError}</p>}
              {promoSuccess && <p className="text-xs text-emerald-400 font-bold">{promoSuccess}</p>}
            </div>

            {/* Step 5 Block: Terms Agreement Checkbox & Next Button */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  id="terms-checkbox-page"
                  checked={isAgreedTerms}
                  onChange={(e) => setIsAgreedTerms(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="terms-checkbox-page" className="cursor-pointer select-none">
                  Saya menyetujui <Link href="/terms" target="_blank" className="font-extrabold text-blue-400 underline">Ketentuan Layanan</Link> & <Link href="/privacy" target="_blank" className="font-extrabold text-blue-400 underline">Kebijakan Privasi Metix</Link>.
                </label>
              </div>

              {!isStep1Valid && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" /> Pilih Metode Pembayaran
                </h3>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Rekomendasi Instan
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
                        ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-amber-400 text-white shadow-xl ring-2 ring-amber-400/50'
                        : 'bg-slate-950 border-slate-800 text-white hover:border-amber-400/50'
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
                      <span className="text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-xl">
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
                            ? 'border-blue-500 bg-blue-600/20 text-white font-extrabold shadow-md'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-white block">{cat.label}</span>
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
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-black text-white border-b border-slate-800 pb-3">
                Rincian Pembayaran
              </h3>

              <div className="space-y-2.5 text-xs text-slate-300 font-medium">
                <div className="flex justify-between items-center">
                  <span>Subtotal Tiket ({totalTicketCount} Tiket)</span>
                  <span className="font-extrabold text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Pajak Daerah (Local Tax {localTaxPercentage}%)</span>
                  <span className="font-extrabold text-slate-200">+Rp {localTaxAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Biaya Layanan Platform ({selectedPaymentCategory})</span>
                  <span className="font-extrabold text-slate-200">+Rp {platformFee.toLocaleString('id-ID')}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>Potongan Promo ({appliedPromo.code})</span>
                    <span>-Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-black text-white">TOTAL PEMBAYARAN</span>
                  <span className="text-xl font-black text-amber-300">
                    Rp {finalGrandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-xs transition-all"
                >
                  Kembali ke Data
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="bg-gradient-to-br from-blue-900/60 via-slate-900 to-indigo-900/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-emerald-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  PEMBAYARAN TERKONFIRMASI & TIKET RESMI TERBIT
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight">Selamat! E-Ticket Berhasil Diterbitkan</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-medium">
                  Order <strong>#{completedOrder.order_number || completedOrder.id || 'MTX-9823'}</strong> telah berhasil diproses. E-Ticket resmi telah dikirim ke email <strong>{buyerEmail}</strong>.
                </p>
              </div>

              {/* Order Ticket QR Card */}
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 text-left shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">EVENT</span>
                    <h4 className="font-black text-sm text-white">{event.title}</h4>
                  </div>
                  <span className="text-xs font-black text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/30">
                    {totalTicketCount} Tiket
                  </span>
                </div>

                <div className="flex items-center justify-center p-4 bg-white rounded-2xl">
                  <QrCode className="w-36 h-36 text-slate-900" />
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">KODE TIKET QR</span>
                  <span className="text-sm font-black text-white font-mono tracking-wider">
                    {completedOrder.order_number || 'MTX-TICKET-OFFICIAL-2026'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <Link
                  href="/dashboard/tickets"
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Lihat Tiket Saya</span>
                </Link>

                <Link
                  href="/"
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-xs transition-all text-center"
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
