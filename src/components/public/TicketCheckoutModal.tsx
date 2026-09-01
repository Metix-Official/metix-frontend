'use me';
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  User,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Download,
  Lock,
  LogIn,
  Users,
  IdCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchTicketTypes,
  getStoredToken,
  getStoredUser,
  fetchUserProfile,
  createReservation,
  checkoutOrder,
  initiateOrderPayment,
  API_BASE_URL,
  ApiEvent,
  ApiTicketType,
  UserProfile,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { AuthModal } from '@/components/public/AuthModal';

interface TicketCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ApiEvent | null;
}

interface SelectedTicket {
  ticketType: ApiTicketType;
  quantity: number;
  holderNames: string[];
}

export const TicketCheckoutModal: React.FC<TicketCheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);

  // User Auth State & In-place Auth Modal
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Customer Info
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerNik, setBuyerNik] = useState('');

  // Collapse States for Ticket Holder Names (Default to collapsed)
  const [isSection3Collapsed, setIsSection3Collapsed] = useState(true);
  const [collapsedHolderSections, setCollapsedHolderSections] = useState<Record<number, boolean>>({});

  const toggleCollapseHolder = (ticketTypeId: number) => {
    setCollapsedHolderSections((prev) => {
      const isCurrentlyCollapsed = prev[ticketTypeId] !== false; // default true
      return {
        ...prev,
        [ticketTypeId]: !isCurrentlyCollapsed,
      };
    });
  };

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      setSelectedTickets([]);
      setCompletedOrder(null);
      setErrorMessage(null);
      setIsLoadingTickets(true);

      // Check User Login Status & Auto-fill Profile
      const token = getStoredToken();
      const user = getStoredUser();

      if (token) {
        setIsUserLoggedIn(true);
        if (user) {
          setCurrentUser(user);
          setBuyerName(user.name || user.first_name || '');
          setBuyerEmail(user.email || '');
          setBuyerPhone(user.phone || '');
          setBuyerAddress(user.address || '');
          setBuyerNik(user.nik || '');
        }
        // Async fetch fresh profile to ensure latest details
        fetchUserProfile().then((freshUser) => {
          if (freshUser) {
            setCurrentUser(freshUser);
            setBuyerName(freshUser.name || freshUser.first_name || '');
            setBuyerEmail(freshUser.email || '');
            setBuyerPhone(freshUser.phone || '');
            setBuyerAddress(freshUser.address || '');
            setBuyerNik(freshUser.nik || '');
          }
        });
      } else {
        setIsUserLoggedIn(false);
        setCurrentUser(null);
        setBuyerName('');
        setBuyerEmail('');
        setBuyerPhone('');
        setBuyerAddress('');
        setBuyerNik('');
      }

      if (event.ticket_types && event.ticket_types.length > 0) {
        setTicketTypes(event.ticket_types);
      }

      fetchTicketTypes(event.id)
        .then((types) => {
          if (types && types.length > 0) {
            setTicketTypes(types);
          } else if (event.ticket_types && event.ticket_types.length > 0) {
            setTicketTypes(event.ticket_types);
          }
        })
        .finally(() => {
          setIsLoadingTickets(false);
        });
    }
  }, [isOpen, event?.id]);

  // Sync default holder names when buyerName is updated
  useEffect(() => {
    if (buyerName) {
      setSelectedTickets((prev) =>
        prev.map((item) => ({
          ...item,
          holderNames: item.holderNames.map((name) => (name.trim() === '' ? buyerName : name)),
        }))
      );
    }
  }, [buyerName]);

  // ALWAYS call useMemo BEFORE any conditional early return to respect React Rules of Hooks
  const totalPrice = useMemo(() => {
    return selectedTickets.reduce(
      (acc, item) => acc + Number(item.ticketType.price || 0) * item.quantity,
      0
    );
  }, [selectedTickets]);

  // Validation flags
  const isBuyerNameValid = buyerName.trim().length > 0;
  const isBuyerEmailValid = buyerEmail.trim().length > 0;
  const isBuyerPhoneValid = buyerPhone.trim().length > 0;
  const isBuyerAddressValid = buyerAddress.trim().length > 0;
  const isBuyerNikValid = buyerNik.trim().length > 0;

  const isFormValid =
    selectedTickets.length > 0 &&
    isBuyerNameValid &&
    isBuyerEmailValid &&
    isBuyerPhoneValid &&
    isBuyerAddressValid &&
    isBuyerNikValid;

  // Early return AFTER all hooks have been invoked
  if (!isOpen || !event) return null;

  const updateQuantity = (type: ApiTicketType, delta: number) => {
    const defaultHolder = buyerName || currentUser?.name || currentUser?.first_name || 'Pemegang Tiket';
    const maxPerOrder = type.max_per_order || 5;
    const currentStock = type.available_quota !== undefined ? type.available_quota : Math.max(0, (type.quota || 100) - (type.sold_quantity || 0));
    const maxAllowed = Math.min(maxPerOrder, currentStock);

    setSelectedTickets((prev) => {
      const existing = prev.find((item) => item.ticketType.id === type.id);

      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty > maxAllowed) {
          alert(`Maksimal pemesanan tiket "${type.name}" adalah ${maxAllowed} tiket.`);
          return prev;
        }
        if (newQty <= 0) {
          return prev.filter((item) => item.ticketType.id !== type.id);
        }

        let newHolders = [...existing.holderNames];
        if (delta > 0) newHolders.push(defaultHolder);
        else newHolders.pop();

        return prev.map((item) =>
          item.ticketType.id === type.id
            ? { ...item, quantity: newQty, holderNames: newHolders }
            : item
        );
      } else {
        if (delta <= 0) return prev;
        if (maxAllowed < 1) {
          alert(`Stok tiket "${type.name}" telah habis.`);
          return prev;
        }
        return [...prev, { ticketType: type, quantity: 1, holderNames: [defaultHolder] }];
      }
    });
  };

  const updateHolderName = (ticketTypeId: number, index: number, name: string) => {
    setSelectedTickets((prev) =>
      prev.map((item) => {
        if (item.ticketType.id === ticketTypeId) {
          const newHolders = [...item.holderNames];
          newHolders[index] = name;
          return { ...item, holderNames: newHolders };
        }
        return item;
      })
    );
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setIsUserLoggedIn(true);

    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setBuyerName(user.name || user.first_name || '');
      setBuyerEmail(user.email || '');
      setBuyerPhone(user.phone || '');
      setBuyerNik(user.nik || '');
    }

    fetchUserProfile().then((freshUser) => {
      if (freshUser) {
        setCurrentUser(freshUser);
        setBuyerName(freshUser.name || freshUser.first_name || '');
        setBuyerEmail(freshUser.email || '');
        setBuyerPhone(freshUser.phone || '');
        setBuyerNik(freshUser.nik || '');
      }
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUserLoggedIn) {
      handleOpenAuth('login');
      return;
    }

    if (selectedTickets.length === 0) {
      alert('Pilih minimal 1 tiket untuk melanjutkan pemesanan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const firstSelection = selectedTickets[0];
      const reservation = await createReservation({
        event_id: event.id,
        ticket_type_id: firstSelection.ticketType.id,
        quantity: firstSelection.quantity,
      });

      const orderData = await checkoutOrder({
        reservation_id: reservation.id,
      });

      try {
        const paymentRes = await initiateOrderPayment(orderData.id);
        if (paymentRes.payment_url) {
          orderData.payment_url = paymentRes.payment_url;
        }
      } catch (e) {
        console.warn('Payment init info:', e);
      }

      setCompletedOrder(orderData);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Pemesanan gagal. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 transition-all animate-in fade-in-0">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] z-10">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-2">
            <Ticket className="w-3.5 h-3.5 text-amber-300" /> Form Pemesanan Tiket Event
          </div>
          <h3 className="text-lg font-black tracking-tight leading-snug">{event.title}</h3>
          <p className="text-xs text-blue-100 font-medium truncate mt-0.5">
            {event.location || 'Venue Event'} — {event.category || 'Music Concert'}
          </p>
        </div>

        {/* Scrollable Body Container */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Blur Overlay when user is not logged in */}
          {!isUserLoggedIn && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/15 backdrop-blur-[3px] animate-in fade-in-0">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-center max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-md shadow-amber-600/10">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Silakan Login Terlebih Dahulu
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Anda harus masuk ke akun Metix Anda terlebih dahulu untuk memilih dan memesan tiket event ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Ke Akun Saya</span>
                </button>
              </div>
            </div>
          )}

          <div
            className={`p-6 overflow-y-auto space-y-5 flex-1 ${
              !isUserLoggedIn ? 'filter blur-[5px] select-none pointer-events-none opacity-40' : ''
            }`}
          >

          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-6 space-y-4 animate-in fade-in-0">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Pemesanan Tiket Berhasil!</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Nomor Order: <strong className="text-blue-700 font-mono">{completedOrder.order_number}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Nama Pemesan:</span>
                  <span className="font-extrabold text-slate-900">{buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-900">{buyerEmail}</span>
                </div>
                {buyerNik && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">NIK (KTP):</span>
                    <span className="font-mono font-bold text-slate-900">{buyerNik}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-black text-blue-700">Rp. {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href="/dashboard/tickets"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Ticket className="w-4 h-4" /> Lihat Tiket Saya
                </Link>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Ticket Selection */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-blue-600" /> 1. Pilih Tipe Tiket
                </span>

                {isLoadingTickets ? (
                  <Skeleton className="h-28 w-full rounded-2xl" />
                ) : ticketTypes.length > 0 ? (
                  <div className="space-y-2.5">
                    {ticketTypes.map((type) => {
                      const priceNum = Number(type.price || 0);
                      const availableStock = Math.max(0, (type.quota || 100) - (type.sold_quantity || 0));
                      const selectedItem = selectedTickets.find((i) => i.ticketType.id === type.id);
                      const qty = selectedItem ? selectedItem.quantity : 0;

                      return (
                        <div
                          key={type.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            qty > 0
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <h5 className="font-extrabold text-xs text-slate-900">{type.name}</h5>
                            <div className="text-sm font-black text-blue-700">
                              Rp. {priceNum.toLocaleString('id-ID')}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              Sisa Stok: {availableStock} pcs
                            </span>
                          </div>

                          {/* Counter Control */}
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(type, -1)}
                              disabled={qty <= 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-xs text-slate-900 px-2 min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(type, 1)}
                              disabled={availableStock <= qty}
                              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                    Belum ada tiket yang tersedia untuk dipesan pada event ini.
                  </div>
                )}
              </div>

              {/* Step 2: Buyer Info */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" /> 2. Data Pemesan Tiket
                  </span>

                  {isUserLoggedIn && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Otomatis Dari Akun
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">Nama Lengkap Pemesan *</label>
                      {!isBuyerNameValid && (
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-in fade-in-0">
                          Wajib diisi
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Lutfi Fahri"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                        !isBuyerNameValid
                          ? 'bg-rose-50/20 border border-rose-300 focus:border-rose-600 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">Alamat Email *</label>
                        {!isBuyerEmailValid && (
                          <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 animate-in fade-in-0">
                            Wajib diisi
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                          !isBuyerEmailValid
                            ? 'bg-rose-50/20 border border-rose-300 focus:border-rose-600 focus:bg-white'
                            : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">Nomor WhatsApp *</label>
                        {!isBuyerPhoneValid && (
                          <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 animate-in fade-in-0">
                            Wajib diisi
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="081234567890"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                          !isBuyerPhoneValid
                            ? 'bg-rose-50/20 border border-rose-300 focus:border-rose-600 focus:bg-white'
                            : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">Alamat Lengkap Pemesan *</label>
                      {!isBuyerAddressValid && (
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-in fade-in-0">
                          Wajib diisi
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="e.g. Jl. Jend. Sudirman No. 45, Jakarta Pusat"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                        !isBuyerAddressValid
                          ? 'bg-rose-50/20 border border-rose-300 focus:border-rose-600 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Nomor Induk Kependudukan (NIK KTP) *
                      </label>
                      {!isBuyerNikValid && (
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-in fade-in-0">
                          Wajib diisi
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      value={buyerNik}
                      onChange={(e) => setBuyerNik(e.target.value.replace(/\D/g, ''))}
                      placeholder="16 Digit NIK Sesuai KTP (e.g. 3171012304950001)"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none transition-all ${
                        !isBuyerNikValid
                          ? 'bg-rose-50/20 border border-rose-300 focus:border-rose-600 focus:bg-white'
                          : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Ticket Holder Names (Auto-filled with user name & editable - Collapsible) */}
              {selectedTickets.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in-0">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsSection3Collapsed(!isSection3Collapsed)}
                      className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>3. Nama Pemegang Tiket</span>
                      {isSection3Collapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform" />
                      )}
                    </button>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Otomatis & Bisa Diubah
                    </span>
                  </div>

                  {!isSection3Collapsed && (
                    <div className="space-y-3 transition-all">
                      {selectedTickets.map((st) => {
                        const isCardCollapsed = collapsedHolderSections[st.ticketType.id] !== false;
                        return (
                          <div
                            key={st.ticketType.id}
                            className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden transition-all"
                          >
                            {/* Card Header (Clickable to collapse/expand) */}
                            <button
                              type="button"
                              onClick={() => toggleCollapseHolder(st.ticketType.id)}
                              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">{st.ticketType.name}</span>
                                <span className="text-[10px] font-black text-blue-700 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                                  {st.quantity} Tiket
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <span>{isCardCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
                                {isCardCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </button>

                            {/* Card Body Inputs */}
                            {!isCardCollapsed && (
                              <div className="p-3.5 pt-0 space-y-2 border-t border-slate-200/60">
                                {st.holderNames.map((name, idx) => (
                                  <div key={idx} className="space-y-1 pt-1">
                                    <label className="text-[10px] font-bold text-slate-500 block">
                                      Nama Pemegang Tiket #{idx + 1} *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={name}
                                      onChange={(e) => updateHolderName(st.ticketType.id, idx, e.target.value)}
                                      placeholder={`Nama Pemegang Tiket #${idx + 1}`}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Total & Submit Button */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
                    <span className="text-lg font-black text-amber-400">
                      Rp. {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>

                {!isUserLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('login')}
                    className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Login Dulu Untuk Pesan Tiket
                  </button>
                ) : (
                  <div className="space-y-2">
                    {!isFormValid && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 shadow-2xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          {selectedTickets.length === 0
                            ? 'Pilih minimal 1 tiket untuk melanjutkan pemesanan.'
                            : 'Mohon lengkapi Nama, Email, Alamat, WhatsApp, dan NIK KTP (Semua Wajib Diisi).'}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Memproses Pemesanan...
                        </>
                      ) : (
                        <>
                          Pesan Tiket Sekarang <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
        </div>
      </div>

      {/* In-Place Seamless Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
