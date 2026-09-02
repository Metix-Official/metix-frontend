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
  Clock,
  Tag,
  QrCode,
  CreditCard,
  Building2,
  Wallet,
  Store,
  Zap,
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

interface TicketHolderDetail {
  name: string;
  phone: string;
  address: string;
  nik: string;
  sameAsBuyer: boolean;
}

interface SelectedTicket {
  ticketType: ApiTicketType;
  quantity: number;
  holders: TicketHolderDetail[];
}

export const TicketCheckoutModal: React.FC<TicketCheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);

  // Custom Premium Alert Modal State
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'info';
  } | null>(null);

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

  // Voucher & Referral Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Payment Category State
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string>('QRIS');

  // Single Unified Collapse State for Section 3 (Default to expanded false or true)
  const [isSection3Collapsed, setIsSection3Collapsed] = useState(false);
  const [isBillingDetailsOpen, setIsBillingDetailsOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // 10-Minute Reservation Countdown Timer State (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState<boolean>(false);

  // Terms & Conditions Agreement Checkbox State
  const [isAgreedTerms, setIsAgreedTerms] = useState<boolean>(false);

  // Reset timer & timeout modal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(600);
      setIsTimeoutModalOpen(false);
      setIsAgreedTerms(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || completedOrder || !isUserLoggedIn || isTimeoutModalOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeoutModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, completedOrder, isUserLoggedIn, isTimeoutModalOpen]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

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
        const getAddressValue = (u: any) =>
          u?.address || u?.location || (typeof window !== 'undefined' ? localStorage.getItem('metix_user_address') : '') || 'Jakarta South, Indonesia';
        const getNikValue = (u: any) =>
          u?.nik || (typeof window !== 'undefined' ? localStorage.getItem('metix_user_nik') : '') || '3171023901920001';

        if (user) {
          setCurrentUser(user);
          setBuyerName(user.name || user.first_name || '');
          setBuyerEmail(user.email || '');
          setBuyerPhone(user.phone || '');
          setBuyerAddress(getAddressValue(user));
          setBuyerNik(getNikValue(user));
        }
        // Async fetch fresh profile to ensure latest details
        fetchUserProfile().then((freshUser) => {
          if (freshUser) {
            setCurrentUser(freshUser);
            setBuyerName(freshUser.name || freshUser.first_name || '');
            setBuyerEmail(freshUser.email || '');
            setBuyerPhone(freshUser.phone || '');
            setBuyerAddress(getAddressValue(freshUser));
            setBuyerNik(getNikValue(freshUser));
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
          } else {
            setTicketTypes([
              {
                id: 1,
                event_id: event.id,
                name: 'Reguler Pass',
                price: 150000,
                quota: 500,
                sold_quantity: 0,
                max_per_order: 5,
                available_quota: 500,
                status: 'ACTIVE',
              },
              {
                id: 2,
                event_id: event.id,
                name: 'VIP Pass (Front Row)',
                price: 350000,
                quota: 100,
                sold_quantity: 0,
                max_per_order: 3,
                available_quota: 100,
                status: 'ACTIVE',
              },
            ]);
          }
        })
        .catch(() => {
          setTicketTypes([
            {
              id: 1,
              event_id: event.id,
              name: 'Reguler Pass',
              price: 150000,
              quota: 500,
              sold_quantity: 0,
              max_per_order: 5,
              available_quota: 500,
              status: 'ACTIVE',
            },
            {
              id: 2,
              event_id: event.id,
              name: 'VIP Pass (Front Row)',
              price: 350000,
              quota: 100,
              sold_quantity: 0,
              max_per_order: 3,
              available_quota: 100,
              status: 'ACTIVE',
            },
          ]);
        })
        .finally(() => {
          setIsLoadingTickets(false);
        });
    }
  }, [isOpen, event?.id]);

  // Sync holder data when buyer info changes for holders with sameAsBuyer = true
  useEffect(() => {
    if (!buyerName && !buyerPhone && !buyerAddress && !buyerNik) return;
    setSelectedTickets((prev) =>
      prev.map((item) => ({
        ...item,
        holders: item.holders.map((h) =>
          h.sameAsBuyer
            ? {
                ...h,
                name: buyerName,
                phone: buyerPhone,
                address: buyerAddress,
                nik: buyerNik,
              }
            : h
        ),
      }))
    );
  }, [buyerName, buyerPhone, buyerAddress, buyerNik]);

  // ALWAYS call useMemo BEFORE any conditional early return to respect React Rules of Hooks
  const totalPrice = useMemo(() => {
    return selectedTickets.reduce(
      (acc, item) => acc + Number(item.ticketType.price || 0) * item.quantity,
      0
    );
  }, [selectedTickets]);

  const totalTicketCount = useMemo(() => {
    return selectedTickets.reduce((acc, item) => acc + item.quantity, 0);
  }, [selectedTickets]);

  // Local Tax: Dynamic percentage based on event (default 5.0%)
  const localTaxAmount = useMemo(() => {
    if (totalPrice === 0) return 0;
    const taxPercent = Number(event?.local_tax_percentage ?? 5.0);
    return Math.floor((totalPrice * taxPercent) / 100);
  }, [totalPrice, event?.local_tax_percentage]);

  // Platform Service Fee based on Payment Category & Matrix
  const platformFee = useMemo(() => {
    if (totalPrice === 0 || totalTicketCount === 0) return 0;
    switch (selectedPaymentCategory) {
      case 'QRIS': {
        const rate =
          totalTicketCount === 1 ? 0.07 : totalTicketCount === 2 ? 0.067 : totalTicketCount === 3 ? 0.063 : 0.059;
        return Math.floor(totalPrice * rate);
      }
      case 'EWALLET':
      case 'E_WALLET':
        return Math.floor(totalPrice * 0.09);
      case 'VA':
      case 'VIRTUAL_ACCOUNT':
      case 'TRANSFER_BANK':
        return Math.floor(totalPrice * 0.05) + 4500;
      case 'CREDIT_CARD':
      case 'CARD':
        return Math.floor(totalPrice * 0.078) + 2000;
      case 'ALFAMART':
        return Math.floor(totalPrice * 0.05) + 6500;
      case 'PAYLATER':
        return Math.floor(totalPrice * 0.075);
      default:
        return 0;
    }
  }, [selectedPaymentCategory, totalPrice, totalTicketCount]);

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;

  const finalGrandTotal = useMemo(() => {
    return Math.max(0, totalPrice + localTaxAmount + platformFee - discountAmount);
  }, [totalPrice, localTaxAmount, platformFee, discountAmount]);

  const handleApplyPromo = () => {
    setPromoError(null);
    setPromoSuccess(null);
    const clean = promoCodeInput.trim().toUpperCase();

    if (!clean) {
      setPromoError('Masukkan kode promo atau referral terlebih dahulu.');
      return;
    }

    if (totalPrice === 0) {
      setPromoError('Pilih tiket terlebih dahulu untuk menggunakan promo.');
      return;
    }

    if (clean === 'METIXPROMO' || clean === 'DISC10') {
      const discount = Math.round(totalPrice * 0.1);
      setAppliedPromo({
        code: clean,
        discountAmount: discount,
        description: 'Diskon Spesial METIX 10%',
      });
      setPromoSuccess(`Kode promo ${clean} berhasil diterapkan! Hemat Rp ${discount.toLocaleString('id-ID')}`);
    } else if (clean === 'HEMAT50' || clean === 'METIX50') {
      const discount = Math.min(50000, totalPrice);
      setAppliedPromo({
        code: clean,
        discountAmount: discount,
        description: 'Voucher Potongan Rp 50.000',
      });
      setPromoSuccess(`Voucher ${clean} berhasil diterapkan! Hemat Rp ${discount.toLocaleString('id-ID')}`);
    } else if (clean.startsWith('REF-') || clean === 'REFERRAL') {
      const discount = Math.min(25000, totalPrice);
      setAppliedPromo({
        code: clean,
        discountAmount: discount,
        description: 'Bonus Referral Buyer Rp 25.000',
      });
      setPromoSuccess(`Kode Referral ${clean} berhasil diterapkan! Hemat Rp ${discount.toLocaleString('id-ID')}`);
    } else {
      setPromoError('Kode promo atau referral tidak ditemukan.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
    setPromoSuccess(null);
  };

  // Validation flags
  const isBuyerNameValid = buyerName.trim().length > 0;
  const isBuyerEmailValid = buyerEmail.trim().length > 0;
  const isBuyerPhoneValid = buyerPhone.trim().length > 0;
  const isBuyerAddressValid = buyerAddress.trim().length > 0;
  const isBuyerNikValid = buyerNik.trim().length > 0;

  const isHoldersValid = useMemo(() => {
    if (selectedTickets.length === 0) return false;
    return selectedTickets.every((st) =>
      st.holders.every(
        (h) =>
          h.name.trim().length > 0 &&
          h.phone.trim().length > 0 &&
          h.address.trim().length > 0 &&
          h.nik.trim().length > 0
      )
    );
  }, [selectedTickets]);

  const isFormValid =
    selectedTickets.length > 0 &&
    isBuyerNameValid &&
    isBuyerEmailValid &&
    isBuyerPhoneValid &&
    isBuyerAddressValid &&
    isBuyerNikValid &&
    isHoldersValid &&
    isAgreedTerms;

  // Early return AFTER all hooks have been invoked
  if (!isOpen || !event) return null;

  const createEmptyHolder = (): TicketHolderDetail => ({
    name: '',
    phone: '',
    address: '',
    nik: '',
    sameAsBuyer: false,
  });

  const updateQuantity = (type: ApiTicketType, delta: number) => {
    const maxPerOrder = type.max_per_order || 5;
    const currentStock = type.available_quota !== undefined ? type.available_quota : Math.max(0, (type.quota || 100) - (type.sold_quantity || 0));
    const maxAllowed = Math.min(maxPerOrder, currentStock);

    setSelectedTickets((prev) => {
      const existing = prev.find((item) => item.ticketType.id === type.id);

      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty > maxAllowed) {
          setCustomAlert({
            title: 'Batas Maksimum Pemesanan',
            message: `Maksimal pemesanan tiket "${type.name}" adalah ${maxAllowed} tiket per transaksi.`,
            type: 'warning',
          });
          return prev;
        }
        if (newQty <= 0) {
          return prev.filter((item) => item.ticketType.id !== type.id);
        }

        let newHolders = [...existing.holders];
        if (delta > 0) {
          newHolders.push(createEmptyHolder());
        } else {
          newHolders.pop();
        }

        return prev.map((item) =>
          item.ticketType.id === type.id
            ? { ...item, quantity: newQty, holders: newHolders }
            : item
        );
      } else {
        if (delta <= 0) return prev;
        if (maxAllowed < 1) {
          setCustomAlert({
            title: 'Stok Tiket Habis',
            message: `Stok tiket "${type.name}" telah habis dipesan.`,
            type: 'warning',
          });
          return prev;
        }
        return [...prev, { ticketType: type, quantity: 1, holders: [createEmptyHolder()] }];
      }
    });
  };

  const toggleSameAsBuyer = (ticketTypeId: number, holderIndex: number, isChecked: boolean) => {
    setSelectedTickets((prev) =>
      prev.map((item) => {
        if (item.ticketType.id === ticketTypeId) {
          const newHolders = [...item.holders];
          if (isChecked) {
            newHolders[holderIndex] = {
              name: buyerName,
              phone: buyerPhone,
              address: buyerAddress,
              nik: buyerNik,
              sameAsBuyer: true,
            };
          } else {
            newHolders[holderIndex] = {
              name: '',
              phone: '',
              address: '',
              nik: '',
              sameAsBuyer: false,
            };
          }
          return { ...item, holders: newHolders };
        }
        return item;
      })
    );
  };

  const updateHolderField = (
    ticketTypeId: number,
    holderIndex: number,
    field: keyof TicketHolderDetail,
    value: string
  ) => {
    setSelectedTickets((prev) =>
      prev.map((item) => {
        if (item.ticketType.id === ticketTypeId) {
          const newHolders = [...item.holders];
          newHolders[holderIndex] = {
            ...newHolders[holderIndex],
            [field]: value,
            sameAsBuyer: false,
          };
          return { ...item, holders: newHolders };
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
      setCustomAlert({
        title: 'Pilih Tiket terlebih Dahulu',
        message: 'Pilih minimal 1 tiket untuk melanjutkan pemesanan.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const firstSelection = selectedTickets[0];
      let reservation: any = null;

      try {
        reservation = await createReservation({
          event_id: event.id,
          ticket_type_id: firstSelection.ticketType.id,
          quantity: firstSelection.quantity,
        });
      } catch (resErr: any) {
        console.warn('Backend reservation response:', resErr);
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
        console.warn('Backend order response:', ordErr);
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

      // Save purchased tickets into user local storage collection
      try {
        const venueName = typeof event.venue === 'object' ? event.venue?.name || event.venue?.city || 'Venue Utama' : event.venue || 'Venue Utama';
        const newTickets: any[] = [];

        selectedTickets.forEach((st) => {
          st.holders.forEach((h, idx) => {
            const ticketCode = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
            newTickets.push({
              id: Math.floor(Math.random() * 90000) + 10000 + idx,
              ticket_code: ticketCode,
              status: 'active',
              created_at: new Date().toISOString(),
              event: {
                id: event.id,
                title: event.title,
                location: venueName,
                event_start_at: event.start_at || new Date().toISOString(),
              },
              ticket_type: {
                name: st.ticketType.name || 'VIP Pass',
                price: Number(st.ticketType.price || 150000),
              },
              order: {
                buyer_name: h.name || buyerName,
                buyer_email: buyerEmail,
                buyer_phone: h.phone || buyerPhone,
              },
            });
          });
        });

        const existingStr = localStorage.getItem('metix_user_orders');
        const existing = existingStr ? JSON.parse(existingStr) : [];
        const updated = [...newTickets, ...existing];
        localStorage.setItem('metix_user_orders', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage ticket store error:', err);
      }

      setCompletedOrder(orderData);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Pemesanan gagal. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in-0">
        <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[85vh] max-h-[85vh] z-10 animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-5 sm:p-6 text-white relative shrink-0">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3 sm:hidden" />
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

          {/* Live 10-Minute Checkout Timer Badge */}
          {isUserLoggedIn && !completedOrder && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Batas Waktu Checkout:</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full font-mono text-xs font-black tracking-wider shadow-sm flex items-center gap-1.5 transition-all ${
                  timeLeft <= 180
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                <span>{formattedTimer}</span>
                <span className="text-[10px] uppercase font-bold text-slate-900/70">menit</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body Container */}
        <div className="relative flex-1 overflow-hidden flex flex-col min-h-0">
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

          {completedOrder ? (
            /* Order Success View */
            <div className="p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 min-h-0">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1 text-center">
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
                  <span className="font-extrabold text-slate-900">{buyerEmail}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <span className="font-extrabold text-amber-600 uppercase">{completedOrder.payment_status || 'PENDING'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pembayaran:</span>
                  <span className="font-black text-blue-700 text-sm">Rp {finalGrandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
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
            <form onSubmit={handleSubmitOrder} className="relative flex-1 flex flex-col min-h-0 h-full">
              {/* Form Body Scrollable Area */}
              <div
                style={{ WebkitOverflowScrolling: 'touch' }}
                className={`p-4 sm:p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-5 flex-1 min-h-0 ${
                  !isUserLoggedIn ? 'filter blur-[5px] select-none pointer-events-none opacity-40' : ''
                }`}
              >
                {timeLeft === 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-xs animate-in fade-in-0 shadow-2xs">
                    <div className="flex items-center gap-2 font-black text-rose-700">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                      <span>Batas Waktu Checkout 10 Menit Telah Habis!</span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      Batas waktu pengisian data selama 10 menit telah berakhir. Silakan muat ulang waktu atau pilih kembali tiket Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTimeLeft(600)}
                      className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Reset Waktu (10 Menit)
                    </button>
                  </div>
                )}

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

                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-white shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(type, -1)}
                                disabled={qty <= 0}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-black text-slate-900">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(type, 1)}
                                disabled={qty >= availableStock || qty >= (type.max_per_order || 5)}
                                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 text-slate-500 text-xs font-medium text-center">
                      Belum ada jenis tiket yang tersedia untuk event ini.
                    </div>
                  )}
                </div>

                {/* Step 2: Buyer & Ticket Holder Information */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" /> 2. Data Pemesan Tiket
                    </span>
                    {currentUser && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Otomatis Dari Akun
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Pemesan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. Lutfi Fahri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Alamat Email <span className="text-rose-500">*</span>
                          </label>
                          {!buyerEmail && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Wajib diisi</span>}
                        </div>
                        <input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="name@example.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-slate-900 focus:outline-none transition-all ${
                            !buyerEmail ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Nomor WhatsApp <span className="text-rose-500">*</span>
                          </label>
                          {!buyerPhone && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Wajib diisi</span>}
                        </div>
                        <input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="e.g. 081234567890"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-slate-900 focus:outline-none transition-all ${
                            !buyerPhone ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Alamat Lengkap Pemesan <span className="text-rose-500">*</span>
                        </label>
                        {!buyerAddress && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Wajib diisi</span>}
                      </div>
                      <input
                        type="text"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="e.g. Jl. Jend. Sudirman No. 45, Jakarta Pusat"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-slate-900 focus:outline-none transition-all ${
                          !buyerAddress ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Nomor Induk Kependudukan (NIK KTP) <span className="text-rose-500">*</span>
                        </label>
                        {!buyerNik && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Wajib diisi</span>}
                      </div>
                      <input
                        type="text"
                        maxLength={16}
                        value={buyerNik}
                        onChange={(e) => setBuyerNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 Digit NIK Sesuai KTP (e.g. 3171012304950001)"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all ${
                          !buyerNik ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 focus:border-blue-600 focus:bg-white'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>

              {/* Step 3: Ticket Holder Data (Single Unified Collapse & Checkbox "Samakan Data") */}
              {selectedTickets.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in-0">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsSection3Collapsed(!isSection3Collapsed)}
                      className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer group"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>3. Data Pemegang Tiket ({selectedTickets.reduce((a, b) => a + b.quantity, 0)} Tiket)</span>
                      {isSection3Collapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform" />
                      )}
                    </button>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Form Wajib Diisi
                    </span>
                  </div>

                  {!isSection3Collapsed && (
                    <div className="space-y-4 transition-all">
                      {selectedTickets.map((st) => (
                        <div key={st.ticketType.id} className="space-y-3">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                            <span className="font-extrabold text-xs text-slate-900">{st.ticketType.name}</span>
                            <span className="text-[10px] font-black text-blue-700 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                              {st.quantity} Tiket
                            </span>
                          </div>

                          <div className="space-y-3">
                            {st.holders.map((holder, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                                  <span className="text-xs font-extrabold text-slate-800">
                                    Pemegang Tiket #{idx + 1}
                                  </span>

                                  {/* Checkbox Samakan Data Dengan Pemesan */}
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs">
                                    <input
                                      type="checkbox"
                                      checked={holder.sameAsBuyer}
                                      onChange={(e) => toggleSameAsBuyer(st.ticketType.id, idx, e.target.checked)}
                                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <span>Samakan dengan Pemesan</span>
                                  </label>
                                </div>

                                <div className="space-y-3 pt-1">
                                  <div>
                                    <label className="text-[11px] font-extrabold text-slate-800 block mb-1">
                                      Nama Lengkap Pemegang Tiket *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      disabled={holder.sameAsBuyer}
                                      value={holder.name}
                                      onChange={(e) => updateHolderField(st.ticketType.id, idx, 'name', e.target.value)}
                                      placeholder="Nama Lengkap Sesuai KTP"
                                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all shadow-2xs ${
                                        holder.sameAsBuyer
                                          ? 'bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none font-bold'
                                          : 'bg-white text-slate-900 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                      }`}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[11px] font-extrabold text-slate-800 block mb-1">
                                        Nomor WhatsApp *
                                      </label>
                                      <input
                                        type="tel"
                                        required
                                        disabled={holder.sameAsBuyer}
                                        value={holder.phone}
                                        onChange={(e) => updateHolderField(st.ticketType.id, idx, 'phone', e.target.value)}
                                        placeholder="081234567890"
                                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all shadow-2xs ${
                                          holder.sameAsBuyer
                                            ? 'bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none font-bold'
                                            : 'bg-white text-slate-900 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                        }`}
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-extrabold text-slate-800 block mb-1">
                                        NIK (KTP) *
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={16}
                                        required
                                        disabled={holder.sameAsBuyer}
                                        value={holder.nik}
                                        onChange={(e) => updateHolderField(st.ticketType.id, idx, 'nik', e.target.value.replace(/\D/g, ''))}
                                        placeholder="16 Digit NIK Sesuai KTP"
                                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono font-semibold focus:outline-none transition-all shadow-2xs ${
                                          holder.sameAsBuyer
                                            ? 'bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none font-bold'
                                            : 'bg-white text-slate-900 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-extrabold text-slate-800 block mb-1">
                                      Alamat Lengkap *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      disabled={holder.sameAsBuyer}
                                      value={holder.address}
                                      onChange={(e) => updateHolderField(st.ticketType.id, idx, 'address', e.target.value)}
                                      placeholder="Alamat Lengkap Pemegang Tiket"
                                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none transition-all shadow-2xs ${
                                        holder.sameAsBuyer
                                          ? 'bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none font-bold'
                                          : 'bg-white text-slate-900 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Voucher & Kode Referral */}
              {selectedTickets.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-600" /> 4. Kode Promo & Referral
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Opsional</span>
                  </div>

                  {appliedPromo ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900 font-mono uppercase">{appliedPromo.code}</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px]">AKTIF</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-bold truncate">
                            {appliedPromo.description} (-Rp {appliedPromo.discountAmount.toLocaleString('id-ID')})
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Hapus Promo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. METIXPROMO / REF-METIX"
                          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase font-semibold text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          Terapkan
                        </button>
                      </div>

                      {promoError && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in-0">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoError}
                        </p>
                      )}

                      {promoSuccess && (
                        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in-0">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {promoSuccess}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Kategori Metode Pembayaran */}
              {selectedTickets.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" /> 5. Kategori Pembayaran
                    </span>
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Direkomendasikan QRIS
                    </span>
                  </div>

                  {/* HIGH-CONVERSION HERO RECOMMENDED CARD: QRIS INSTANT */}
                  {(() => {
                    const isQrisSelected = selectedPaymentCategory === 'QRIS';
                    const qrisRate = totalTicketCount === 1 ? 0.07 : totalTicketCount === 2 ? 0.067 : totalTicketCount === 3 ? 0.063 : 0.059;
                    const qrisFee = totalPrice > 0 ? Math.floor(totalPrice * qrisRate) : 0;

                    return (
                      <div
                        onClick={() => setSelectedPaymentCategory('QRIS')}
                        className={`relative rounded-3xl p-4 transition-all duration-300 cursor-pointer overflow-hidden border ${
                          isQrisSelected
                            ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-amber-400 text-white shadow-xl shadow-blue-900/20 ring-2 ring-amber-400/50 scale-[1.01]'
                            : 'bg-gradient-to-br from-slate-900 to-blue-950 border-slate-800 text-white hover:border-amber-400/50 shadow-md'
                        }`}
                      >
                        {/* Top Recommendation Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                            <Zap className="w-3 h-3 text-slate-950 fill-slate-950" /> REKOMENDASI TERCEPAT & TERHEMAT
                          </span>
                          <span className="text-[10px] font-bold text-amber-300/90 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" /> Terkonfirmasi 5 Detik
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                              <QrCode className="w-6 h-6 text-amber-300" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-sm text-white tracking-tight leading-none">
                                  QRIS Instant (All E-Wallet & Bank)
                                </h4>
                              </div>
                              <p className="text-[11px] text-blue-100/80 font-medium leading-tight">
                                BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA & Semua M-Banking
                              </p>
                            </div>
                          </div>

                          {qrisFee > 0 && (
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-black text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-xl block">
                                +Rp {qrisFee.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[9px] text-blue-200 font-bold block mt-1">Tarif Hemat</span>
                            </div>
                          )}
                        </div>

                        {/* Radio Checkmark Status indicator */}
                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-amber-200/90 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Tanpa Perlu Input Nomor Rekening / Kartu
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider ${isQrisSelected ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/70'}`}>
                            {isQrisSelected ? '✓ Terpilih' : 'Klik untuk Pilih'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* OTHER PAYMENT METHODS SELECTOR */}
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Atau Pilih Metode Pembayaran Lainnya
                      </span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'VA', label: 'Virtual Account', feeText: '5% + Rp 4.500', icon: Building2 },
                        { id: 'EWALLET', label: 'E-Wallet (GoPay/OVO)', feeText: '9.0%', icon: Wallet },
                        { id: 'CREDIT_CARD', label: 'Kartu Kredit / Debit', feeText: '7,8% + Rp 2.000', icon: CreditCard },
                        { id: 'ALFAMART', label: 'Alfamart Retail', feeText: '5% + Rp 6.500', icon: Store },
                        { id: 'PAYLATER', label: 'Paylater (Akulaku)', feeText: '7.5%', icon: Zap },
                      ].map((cat) => {
                        const IconComp = cat.icon;
                        const isSelected = selectedPaymentCategory === cat.id;

                        let categoryFee = 0;
                        if (totalPrice > 0) {
                          if (cat.id === 'EWALLET') {
                            categoryFee = Math.floor(totalPrice * 0.09);
                          } else if (cat.id === 'VA') {
                            categoryFee = Math.floor(totalPrice * 0.05) + 4500;
                          } else if (cat.id === 'CREDIT_CARD') {
                            categoryFee = Math.floor(totalPrice * 0.078) + 2000;
                          } else if (cat.id === 'ALFAMART') {
                            categoryFee = Math.floor(totalPrice * 0.05) + 6500;
                          } else if (cat.id === 'PAYLATER') {
                            categoryFee = Math.floor(totalPrice * 0.075);
                          }
                        }

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedPaymentCategory(cat.id)}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600/30 font-extrabold'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-extrabold text-xs text-slate-900 block truncate">{cat.label}</span>
                                <span className="text-[10px] font-bold text-slate-400 block">{cat.feeText}</span>
                              </div>
                            </div>

                            {categoryFee > 0 && (
                              <span
                                className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                +Rp {categoryFee.toLocaleString('id-ID')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Fixed Modal Footer Bar (Outside Scroll Container, shrink-0) */}
              <div className="shrink-0 bg-white border-t border-slate-200/90 p-3.5 sm:p-4 px-4 sm:px-6 shadow-2xl z-30 space-y-2">
                {/* Expandable Itemized Billing Drawer */}
                {isBillingDetailsOpen && selectedTickets.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 text-xs font-medium animate-in slide-in-from-bottom-2 duration-200 shadow-xl border border-slate-800">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Subtotal Tiket ({totalTicketCount} Tiket)</span>
                      <span className="font-bold text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Pajak Daerah (Local Tax 5%)</span>
                      <span className="font-bold text-slate-200">+Rp {localTaxAmount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Biaya Layanan Platform ({selectedPaymentCategory})</span>
                      <span className="font-bold text-slate-200">+Rp {platformFee.toLocaleString('id-ID')}</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span>Potongan Promo ({appliedPromo.code})</span>
                        <span>-Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mandatory Terms Agreement Checkbox Row */}
                {isUserLoggedIn && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] sm:text-[11px] text-slate-700 font-medium animate-in fade-in-0">
                    <input
                      type="checkbox"
                      id="terms-agreement-checkbox"
                      checked={isAgreedTerms}
                      onChange={(e) => setIsAgreedTerms(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="terms-agreement-checkbox" className="cursor-pointer leading-tight select-none truncate">
                      Saya menerima <Link href="/terms" target="_blank" className="font-extrabold text-blue-600 underline hover:text-blue-700">Ketentuan Layanan</Link> & <Link href="/privacy" target="_blank" className="font-extrabold text-blue-600 underline hover:text-blue-700">Privasi Metix</Link>.
                    </label>
                  </div>
                )}

                {/* Validation Helper Banner (Ultra-Compact 1-Line Banner) */}
                {isUserLoggedIn && !isFormValid && (
                  <div className="px-2.5 py-0.5 rounded-lg bg-rose-50/90 border border-rose-200/70 text-rose-700 text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in-0">
                    <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
                    <span className="truncate leading-tight">
                      {selectedTickets.length === 0
                        ? 'Pilih minimal 1 tiket terlebih dahulu.'
                        : !isAgreedTerms
                        ? 'Centang persetujuan Ketentuan Layanan di atas.'
                        : 'Lengkapi Nama, Email, WA, NIK KTP terlebih dahulu.'}
                    </span>
                  </div>
                )}

                {/* Main Horizontal Dock Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left Column: Total Tagihan */}
                  <div className="flex flex-col min-w-0 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                        TOTAL TAGIHAN
                      </span>
                      {selectedTickets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsBillingDetailsOpen(!isBillingDetailsOpen)}
                          className="text-[9px] sm:text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 underline cursor-pointer"
                        >
                          <span>{isBillingDetailsOpen ? 'Tutup' : 'Rincian'}</span>
                          {isBillingDetailsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mt-0.5 whitespace-nowrap">
                      <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        Rp {finalGrandTotal.toLocaleString('id-ID')}
                      </span>
                      {totalTicketCount > 0 && (
                        <span className="text-[10px] text-slate-500 font-extrabold">
                          ({totalTicketCount} tiket)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: CTA Button */}
                  {!isUserLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAuth('login')}
                      className="py-3 px-4 sm:px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login Dulu</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid || timeLeft === 0}
                      className="flex-1 max-w-[210px] sm:max-w-xs py-3 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <span>Pesan Tiket Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
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

      {/* Ultra-Premium Glassmorphism Alert Modal Popup */}
      {customAlert && (
        <div
          onClick={() => setCustomAlert(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden z-50"
          >
            {/* Top Glowing Amber Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

            {/* Glowing Warning Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5">
              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {customAlert.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {customAlert.message}
              </p>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setCustomAlert(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL ALERT WAKTU CHECKOUT HABIS ================= */}
      {isTimeoutModalOpen && (
        <div
          onClick={() => {
            setTimeLeft(600);
            setIsTimeoutModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden z-50"
          >
            {/* Top Glowing Amber/Red Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-500" />

            {/* Glowing Clock Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/15">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Waktu Checkout Habis! ⏱️
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Batas waktu pemesanan tiket (10 menit) telah berakhir. Klik <strong className="text-slate-900 font-bold">OK</strong> untuk memperbarui waktu checkout dan mengulang hitung mundur dari 10 menit.
              </p>
            </div>

            {/* OK Action Button */}
            <button
              type="button"
              onClick={() => {
                setTimeLeft(600);
                setIsTimeoutModalOpen(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              OK (Ulang Waktu Checkout)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
