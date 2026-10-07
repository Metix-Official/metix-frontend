'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  fetchTicketTypes,
  createOfflineOrder,
  fetchOfflineDashboard,
  fetchOfflineOrderStatus,
  simulateOfflineOrderPayment,
  fetchPromos,
  ApiEvent,
  ApiTicketType,
  ApiPromo,
  CreateOfflineOrderPayload,
} from '@/lib/api';
import jsPDF from 'jspdf';
import { toast } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  CreditCard,
  Calendar,
  Ticket,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  User,
  Mail,
  Phone,
  QrCode,
  Building2,
  Printer,
  RefreshCw,
  Zap,
  ShoppingBag,
  Receipt,
  Loader2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  Tag,
  ShieldCheck,
  ExternalLink,
  Clock,
  Check,
  ArrowRight,
  MessageSquare,
  Copy,
  Download,
} from 'lucide-react';

interface CartItem {
  ticketType: ApiTicketType;
  quantity: number;
  holderNames: string[];
}

function resolveVenueName(eventObj: any): string {
  if (!eventObj) return '';

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

  return '';
}

export default function PosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  // Tickets & Stock
  const [ticketTypes, setTicketTypes] = useState<ApiTicketType[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNik, setBuyerNik] = useState('');
  const [buyerDateOfBirth, setBuyerDateOfBirth] = useState('');
  const [buyerGender, setBuyerGender] = useState<'MALE' | 'FEMALE' | ''>('');

  // Payment State: QRIS DOKU is default recommended
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'cash'>('QRIS');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [amountTenderedDisplay, setAmountTenderedDisplay] = useState<string>('');

  // Promo Code State
  const [eventPromos, setEventPromos] = useState<ApiPromo[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<ApiPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Submission & Modals State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [isGeneratingReceiptPdf, setIsGeneratingReceiptPdf] = useState(false);

  // QRIS Modal & Live Polling State
  const [activeQrisOrder, setActiveQrisOrder] = useState<{
    order: any;
    payment: any;
    pricing: any;
  } | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [qrisTimeLeft, setQrisTimeLeft] = useState<number>(900); // 15 mins countdown

  // Recent POS Orders State
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [posStats, setPosStats] = useState<any>({});

  // Ticket Category Grouping & Filter State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');

  const groupedTicketTypes = useMemo(() => {
    const groups: Record<string, ApiTicketType[]> = {};

    ticketTypes.forEach((type) => {
      const rawCat = type.category ? type.category.trim() : '';
      const catName = rawCat !== '' ? rawCat : 'Kategori Umum';
      if (!groups[catName]) {
        groups[catName] = [];
      }
      groups[catName].push(type);
    });

    return groups;
  }, [ticketTypes]);

  const categoryNames = useMemo(() => Object.keys(groupedTicketTypes), [groupedTicketTypes]);

  const handleAmountTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmountTenderedDisplay('');
      setAmountTendered('');
      return;
    }
    const num = parseInt(rawValue, 10);
    setAmountTendered(String(num));
    setAmountTenderedDisplay(num.toLocaleString('id-ID'));
  };

  const loadEvents = async () => {
    setIsLoading(true);
    const data = await fetchMyEvents();
    setEvents(data.events);
    // Default null: User must choose an event before tickets and pricing are loaded
    setSelectedEvent(null);
    setTicketTypes([]);
    setCart([]);
    setRecentOrders([]);
    setPosStats({});
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadTicketTypesAndPosDashboard = async (evtId: number) => {
    setIsTicketsLoading(true);
    const types = await fetchTicketTypes(evtId);
    setTicketTypes(types);

    const promos = await fetchPromos(evtId);
    setEventPromos(promos);

    const posData = await fetchOfflineDashboard(evtId);
    if (posData) {
      const ordersList = posData.latestOrders || posData.orders || posData.data?.latestOrders || [];
      const statsObj = posData.stats || posData.data?.stats || {};
      setRecentOrders(ordersList);
      setPosStats(statsObj);
    }
    setIsTicketsLoading(false);
  };

  useEffect(() => {
    if (selectedEvent) {
      setCart([]);
      loadTicketTypesAndPosDashboard(selectedEvent.id);
    } else {
      setTicketTypes([]);
      setCart([]);
      setRecentOrders([]);
      setPosStats({});
    }
  }, [selectedEvent?.id]);

  // Auto-poll QRIS payment status while modal is open
  useEffect(() => {
    if (!activeQrisOrder || !selectedEvent || activeQrisOrder.order.status === 'paid') return;

    const interval = setInterval(async () => {
      try {
        setIsCheckingPayment(true);
        const statusRes = await fetchOfflineOrderStatus(selectedEvent.id, activeQrisOrder.order.id);
        const currentStatus = statusRes?.status || statusRes?.order?.status;
        if (currentStatus === 'paid') {
          toast.success('Pembayaran QRIS DOKU Berhasil Dikonfirmasi! 🎉');
          setSuccessOrder({
            ...activeQrisOrder.order,
            ...statusRes,
            status: 'paid',
            tickets: statusRes.tickets || [],
          });
          setActiveQrisOrder(null);
          loadTicketTypesAndPosDashboard(selectedEvent.id);
        }
      } catch (err) {
        console.warn('Polling QRIS status error:', err);
      } finally {
        setIsCheckingPayment(false);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeQrisOrder?.order?.id, selectedEvent?.id]);

  // Countdown timer for active QRIS modal
  useEffect(() => {
    if (!activeQrisOrder) return;
    setQrisTimeLeft(900);
    const timer = setInterval(() => {
      setQrisTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQrisOrder?.order?.id]);

  // Quick fill customer details for walk-in buyers
  const handleQuickFillWalkIn = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setBuyerName('Pembeli Walk-in (Kasir)');
    setBuyerEmail(`walkin.${randomId}@metix.id`);
    setBuyerPhone('081234567890');
    setBuyerNik('');
    setBuyerDateOfBirth('2000-01-01');
    setBuyerGender('MALE');
  };

  const getAvailableStock = (type: ApiTicketType) => {
    if (type.available !== undefined) return type.available;
    const sold = type.sold_count ?? type.sold_quantity ?? 0;
    return Math.max(0, (type.quota || 100) - sold);
  };

  // Cart operations
  const addToCart = (type: ApiTicketType) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.ticketType.id === type.id);
      const availableStock = getAvailableStock(type);

      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`Stok tiket "${type.name}" tidak mencukupi (Tersisa: ${availableStock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.ticketType.id === type.id
            ? {
              ...item,
              quantity: item.quantity + 1,
              holderNames: [...item.holderNames, ''],
            }
            : item
        );
      } else {
        if (availableStock < 1) {
          alert(`Stok tiket "${type.name}" telah habis.`);
          return prev;
        }
        return [...prev, { ticketType: type, quantity: 1, holderNames: [''] }];
      }
    });
  };

  const updateQuantity = (typeId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.ticketType.id === typeId) {
            const newQty = item.quantity + delta;
            const availableStock = getAvailableStock(item.ticketType);

            if (newQty > availableStock) {
              alert(`Stok tiket "${item.ticketType.name}" terbatas (${availableStock} pcs).`);
              return item;
            }

            if (newQty <= 0) return null;

            let newHolders = [...item.holderNames];
            if (delta > 0) newHolders.push('');
            else newHolders.pop();

            return {
              ...item,
              quantity: newQty,
              holderNames: newHolders,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (typeId: number) => {
    setCart((prev) => prev.filter((i) => i.ticketType.id !== typeId));
  };

  // Price calculations (Synchronized with Online Checkout and Backend PaymentFeeCalculator)
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.ticketType.price || 0) * item.quantity, 0);
  }, [cart]);

  const totalTicketCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.min_purchase && subtotal < appliedPromo.min_purchase) {
      return 0;
    }
    let d = 0;
    if (appliedPromo.discount_type === 'PERCENTAGE') {
      d = (subtotal * (Number(appliedPromo.discount_value) || 0)) / 100;
      if (appliedPromo.max_discount && d > appliedPromo.max_discount) {
        d = Number(appliedPromo.max_discount);
      }
    } else {
      d = Number(appliedPromo.discount_value) || 0;
    }
    return Math.min(subtotal, d);
  }, [appliedPromo, subtotal]);

  // Local Tax Percentage & Amount
  const localTaxPercentage = useMemo(() => {
    return selectedEvent?.local_tax_percentage !== undefined ? Number(selectedEvent.local_tax_percentage) : 5.0;
  }, [selectedEvent?.local_tax_percentage]);

  const localTaxAmount = useMemo(() => {
    if (subtotal <= 0) return 0;
    return Math.floor(subtotal * (localTaxPercentage / 100));
  }, [subtotal, localTaxPercentage]);

  // Platform Fee (Keuntungan Metix - dihitung via tiering QRIS sama dengan online checkout)
  const platformFee = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (paymentMethod === 'cash') return 0;
    const rate = totalTicketCount === 1 ? 0.07 : totalTicketCount === 2 ? 0.067 : totalTicketCount === 3 ? 0.063 : 0.059;
    return Math.floor(subtotal * rate);
  }, [subtotal, totalTicketCount, paymentMethod]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + localTaxAmount + platformFee - discountAmount);
  }, [subtotal, localTaxAmount, platformFee, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const tendered = Number(amountTendered) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [paymentMethod, amountTendered, grandTotal]);

  const handleApplyPromo = () => {
    setPromoError(null);
    if (!promoInput.trim()) {
      setAppliedPromo(null);
      return;
    }
    const cleanCode = promoInput.trim().toUpperCase();
    const found = eventPromos.find((p) => p.code.toUpperCase() === cleanCode);
    if (!found) {
      setPromoError(`Kode promo "${cleanCode}" tidak ditemukan.`);
      setAppliedPromo(null);
      return;
    }
    if (found.ticket_type_id) {
      const hasMatchingTicket = cart.some((c) => c.ticketType.id === found.ticket_type_id);
      if (!hasMatchingTicket) {
        setPromoError(`Kode promo "${found.code}" hanya berlaku untuk tiket: ${found.ticket_type?.name || 'tertentu'}.`);
        setAppliedPromo(null);
        return;
      }
    }
    if (found.min_purchase && subtotal < Number(found.min_purchase)) {
      setPromoError(`Kode promo mensyaratkan minimal pembelian Rp ${Number(found.min_purchase).toLocaleString('id-ID')}.`);
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(found);
    toast.success(`Kode Promo "${found.code}" Berhasil Diterapkan! 🎉`);
  };

  // Submit Order via API
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (cart.length === 0) {
      alert('Pilih minimal 1 tiket untuk dimasukkan ke keranjang kasir.');
      return;
    }

    if (paymentMethod === 'cash') {
      const tendered = Number(amountTendered) || 0;
      if (tendered < grandTotal) {
        alert(`Jumlah uang tunai yang diterima (Rp ${tendered.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${grandTotal.toLocaleString('id-ID')}).`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: CreateOfflineOrderPayload = {
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        buyer_nik: buyerNik || undefined,
        date_of_birth: buyerDateOfBirth || null,
        gender: buyerGender || null,
        promo_code: appliedPromo?.code || (promoInput.trim() ? promoInput.trim().toUpperCase() : undefined),
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          ticket_type_id: c.ticketType.id,
          quantity: c.quantity,
          holder_names: c.holderNames,
        })),
      };

      const result = await createOfflineOrder(selectedEvent.id, payload);
      const createdOrder = result?.data?.order || result?.order || result;
      const paymentInfo = result?.data?.payment || result?.payment;
      const pricingInfo = result?.data?.pricing || result?.pricing;

      if (paymentMethod === 'QRIS' && paymentInfo) {
        // Open QRIS modal for buyer to scan
        setActiveQrisOrder({
          order: createdOrder,
          payment: paymentInfo,
          pricing: pricingInfo,
        });
      } else {
        // Cash payment completed immediately
        setSuccessOrder(createdOrder);
        toast.success('Pesanan Tunai POS Berhasil Dibuat!');
      }

      if (createdOrder) {
        setRecentOrders((prev) => {
          const num = createdOrder.order_number || ('POS-' + createdOrder.id);
          const filtered = prev.filter((o) => o.order_number !== num);
          const totalQty = cart.reduce((sum, c) => sum + Number(c.quantity || 1), 0);
          const itemsSummary = cart.map((c) => `${c.quantity}x ${c.ticketType.name}`).join(', ');
          return [{
            id: createdOrder.id,
            order_number: num,
            buyer_name: createdOrder.buyer_name || buyerName || 'Pembeli Walk-in (Kasir)',
            buyer_phone: createdOrder.buyer_phone || buyerPhone,
            total_tickets: totalQty,
            items_summary: itemsSummary,
            payment_method: createdOrder.payment_method || paymentMethod,
            grand_total: createdOrder.grand_total || grandTotal || 0,
            status: createdOrder.status || (paymentMethod === 'QRIS' ? 'pending' : 'paid'),
          }, ...filtered];
        });

        // Deduct ticket stock immediately in UI
        setTicketTypes((prev) =>
          prev.map((t) => {
            const cartItem = cart.find((c) => c.ticketType.id === t.id);
            if (cartItem) {
              const addedQty = cartItem.quantity;
              const currentSold = t.sold_count ?? t.sold_quantity ?? 0;
              const newSold = currentSold + addedQty;
              const currentAvail = t.available !== undefined ? t.available : Math.max(0, (t.quota || 100) - currentSold);
              return {
                ...t,
                sold_count: newSold,
                sold_quantity: newSold,
                available: Math.max(0, currentAvail - addedQty),
              };
            }
            return t;
          })
        );
      }

      // Reset Form Inputs
      setCart([]);
      setBuyerName('');
      setBuyerEmail('');
      setBuyerPhone('');
      setBuyerNik('');
      setBuyerDateOfBirth('');
      setBuyerGender('');
      setAmountTendered('');
      setAmountTenderedDisplay('');

      // Refresh tickets & stats
      loadTicketTypesAndPosDashboard(selectedEvent.id);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses transaksi kasir POS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeQrisOrder || !selectedEvent) return;
    setIsSimulatingPayment(true);
    try {
      const res = await simulateOfflineOrderPayment(selectedEvent.id, activeQrisOrder.order.id);
      toast.success('Simulasi Pembayaran Berhasil! E-Tiket Diterbitkan.');
      setSuccessOrder({
        ...activeQrisOrder.order,
        ...res?.data,
        status: 'paid',
      });
      setActiveQrisOrder(null);
      loadTicketTypesAndPosDashboard(selectedEvent.id);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal simulasi pembayaran.');
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const formatPhoneNumberForWa = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const generateWhatsAppTicketMessage = (order: any, event: ApiEvent | null): string => {
    const bName = order.buyer_name || buyerName || 'Pelanggan';
    const eventTitle = event?.title || 'Event Metix';
    const orderNumber = order.order_number || ('POS-' + order.id);
    const grandTotal = Number(order.grand_total || order.total_amount || 0).toLocaleString('id-ID');
    const paymentMethodName = (order.payment_method || 'QRIS').toUpperCase();

    let ticketsText = '';
    if (order.tickets && order.tickets.length > 0) {
      ticketsText = order.tickets
        .map((t: any, idx: number) => `   ${idx + 1}. ${t.ticket_type_name || 'Tiket'}: *${t.ticket_code}*`)
        .join('\n');
    } else if (order.items && order.items.length > 0) {
      ticketsText = order.items
        .map((i: any, idx: number) => `   ${idx + 1}. ${i.name || i.ticket_type_name || 'Tiket'} (${i.quantity}x)`)
        .join('\n');
    }

    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : 'https://metix.id';
    const ticketLink = `${frontendUrl}/tickets/view/${orderNumber}`;

    return `Halo Kak *${bName}*,

Terima kasih telah melakukan pembelian tiket di Box-Office Metix! 🎉
Pembayaran Anda via *${paymentMethodName} (DOKU)* telah *BERHASIL (LUNAS)*.

📋 *DETAIL PESANAN*:
• Acara: *${eventTitle}*
• No. Pesanan: *${orderNumber}*
• Total Bayar: *Rp ${grandTotal}*
• Status: *LUNAS (PAID)*

🎟️ *KODE E-TIKET ANDA*:
${ticketsText}

🔗 *LINK E-TIKET RESMI (BARCODE HP)*:
${ticketLink}

_Tunjukkan pesan ini atau barcode tiket pada link di atas kepada petugas di pintu masuk (Gate Check-in) untuk proses scan masuk. Selamat menikmati acara!_ 🙌
*- Tim Metix Ticketing-*`;
  };

  const handleSendTicketToWhatsApp = () => {
    if (!successOrder) return;
    const phone = successOrder.buyer_phone || buyerPhone;
    if (!phone) {
      toast.error('Nomor WhatsApp / HP pembeli belum terisi.');
      return;
    }
    const cleanPhone = formatPhoneNumberForWa(phone);
    const message = generateWhatsAppTicketMessage(successOrder, selectedEvent);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success('Membuka WhatsApp untuk mengirim tiket... 🚀');
  };

  const handleCopyTicketText = () => {
    if (!successOrder) return;
    const message = generateWhatsAppTicketMessage(successOrder, selectedEvent);
    navigator.clipboard.writeText(message);
    toast.success('Format pesan e-tiket berhasil disalin ke clipboard! 📋');
  };

  // Generate & Direct Download Thermal Receipt PDF (No window.print popup)
  const handleDownloadReceiptPdf = async () => {
    if (!successOrder) return;
    setIsGeneratingReceiptPdf(true);
    toast.loading('Menyiapkan file PDF Struk Pembayaran...', { id: 'receipt-pdf' });

    try {
      const orderNumber = successOrder.order_number || ('POS-' + successOrder.id);
      const buyerName = successOrder.buyer_name || buyerPhone || 'Pelanggan Walk-in';
      const eventTitle = selectedEvent?.title || 'Metix Official Event';
      const paymentMethodName = (successOrder.payment_method || 'QRIS').toUpperCase();
      const items = successOrder.items || [];
      const tickets = successOrder.tickets || [];
      const totalAmount = Number(successOrder.grand_total || successOrder.total_amount || 0);
      const subtotal = Number(successOrder.subtotal !== undefined ? successOrder.subtotal : totalAmount);
      const tax = Number(successOrder.local_tax_amount || 0);
      const fee = Number(successOrder.platform_fee || 0);

      const frontendUrl = typeof window !== 'undefined' ? window.location.origin : 'https://metix.id';
      const ticketLink = `${frontendUrl}/tickets/view/${encodeURIComponent(orderNumber)}`;

      // Calculate dynamic thermal receipt height in mm
      const dynamicHeight = Math.max(
        175,
        45 + 35 + (items.length * 7) + (tax > 0 || fee > 0 ? 30 : 18) + (tickets.length * 8) + 40 + 20
      );

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, dynamicHeight],
      });

      const pageWidth = 80;
      let y = 10;

      // 1. Header
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('METIX OFFICIAL', pageWidth / 2, y, { align: 'center' });
      y += 5.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138); // Blue 900
      doc.text(eventTitle.substring(0, 36), pageWidth / 2, y, { align: 'center' });
      y += 4.5;

      const venueName = resolveVenueName(selectedEvent);
      if (venueName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(venueName.substring(0, 42), pageWidth / 2, y, { align: 'center' });
        y += 4;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52); // Emerald 800
      doc.text('*** PEMBAYARAN LUNAS (PAID) ***', pageWidth / 2, y, { align: 'center' });
      y += 4.5;

      // Dashed Separator
      const drawDashedLine = (currentY: number) => {
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.line(6, currentY, pageWidth - 6, currentY);
        doc.setLineDashPattern([], 0);
      };

      drawDashedLine(y);
      y += 4;

      // 2. Order Metadata Table
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      const drawMetaRow = (label: string, value: string, isBoldValue = false) => {
        doc.setFont('courier', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(label, 6, y);

        doc.setFont('courier', isBoldValue ? 'bold' : 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(value.substring(0, 24), pageWidth - 6, y, { align: 'right' });
        y += 4;
      };

      const dateNow = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + `, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

      drawMetaRow('No. Order:', orderNumber, true);
      drawMetaRow('Waktu:', dateNow);
      drawMetaRow('Pembeli:', buyerName, true);
      drawMetaRow('Metode Bayar:', paymentMethodName, true);

      drawDashedLine(y);
      y += 4.5;

      // 3. Purchased Items
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      items.forEach((it: any) => {
        const itemQtyName = `${it.quantity}x ${it.name || it.ticket_type_name || 'Tiket'}`;
        const itemPrice = `Rp ${Number(it.subtotal || 0).toLocaleString('id-ID')}`;

        doc.setFont('courier', 'normal');
        doc.text(itemQtyName.substring(0, 26), 6, y);
        doc.setFont('courier', 'bold');
        doc.text(itemPrice, pageWidth - 6, y, { align: 'right' });
        y += 4.5;
      });

      drawDashedLine(y);
      y += 4;

      // 4. Financial Totals
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      if (tax > 0 || fee > 0) {
        doc.text('Subtotal Tiket:', 6, y);
        doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });
        y += 4;

        if (tax > 0) {
          doc.text('Pajak Daerah:', 6, y);
          doc.text(`Rp ${tax.toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });
          y += 4;
        }

        if (fee > 0) {
          doc.text('Biaya Layanan Metix:', 6, y);
          doc.text(`Rp ${fee.toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });
          y += 4;
        }
      }

      // Grand Total
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL BAYAR:', 6, y);
      doc.setTextColor(29, 78, 216); // Blue 700
      doc.text(`Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 6, y, { align: 'right' });
      y += 5.5;

      drawDashedLine(y);
      y += 4;

      // 5. Ticket Codes Section
      if (tickets.length > 0) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('KODE BARCODE E-TIKET:', 6, y);
        y += 4;

        tickets.forEach((t: any, idx: number) => {
          const tName = `${t.ticket_type_name || 'Tiket'} #${idx + 1}`;
          const tCode = t.ticket_code || '-';

          doc.setFont('courier', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(tName.substring(0, 20), 6, y);

          doc.setFont('courier', 'bold');
          doc.setTextColor(29, 78, 216);
          doc.text(tCode, pageWidth - 6, y, { align: 'right' });
          y += 4;
        });

        drawDashedLine(y);
        y += 4;
      }

      // 6. QR Code for direct E-Ticket verification
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(
        ticketLink
      )}`;

      try {
        const qrRes = await fetch(qrUrl);
        const qrBlob = await qrRes.blob();
        const reader = new FileReader();
        const qrBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(qrBlob);
        });

        const qrSize = 28;
        const qrX = (pageWidth - qrSize) / 2;
        doc.addImage(qrBase64, 'PNG', qrX, y, qrSize, qrSize);
        y += qrSize + 3;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text('SCAN QR DI ATAS UNTUK LIHAT E-TIKET', pageWidth / 2, y, { align: 'center' });
        y += 3.5;
      } catch {
        // Fallback text if QR fetch fails
        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Link E-Tiket: ${ticketLink.substring(0, 40)}`, pageWidth / 2, y, { align: 'center' });
        y += 4;
      }

      // 7. Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('Simpan struk ini sebagai bukti pembayaran sah.', pageWidth / 2, y, { align: 'center' });
      y += 3;
      doc.text('Powered by METIX Official', pageWidth / 2, y, { align: 'center' });

      // Save & Direct Download without window.print popup!
      doc.save(`STRUK-${orderNumber}.pdf`);
      toast.success('Struk PDF Berhasil Diunduh! 📄', { id: 'receipt-pdf' });
    } catch (err: any) {
      console.error('Gagal generate PDF struk:', err);
      toast.error('Gagal mengunduh PDF struk: ' + (err?.message || 'Terjadi kesalahan'), { id: 'receipt-pdf' });
    } finally {
      setIsGeneratingReceiptPdf(false);
    }
  };

  const handleOpenTicketView = (orderNumber: string) => {
    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : 'https://metix.id';
    window.open(`${frontendUrl}/tickets/view/${encodeURIComponent(orderNumber)}`, '_blank');
  };

  const handleCopyTicketLink = (orderNumber: string) => {
    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : 'https://metix.id';
    const link = `${frontendUrl}/tickets/view/${encodeURIComponent(orderNumber)}`;
    navigator.clipboard.writeText(link);
    toast.success(`Tautan E-Tiket (${orderNumber}) disalin ke clipboard! 📋`);
  };

  const handleSendWhatsAppForOrder = (order: any) => {
    const isPaid = String(order.status || '').toLowerCase() === 'paid';
    if (!isPaid) {
      toast.warning('Pesanan ini masih berstatus Pending. Tiket baru aktif setelah pembayaran lunas.');
    }

    let phone = order.buyer_phone || '';
    if (!phone) {
      const inputPhone = window.prompt(
        `Kirim e-tiket untuk #${order.order_number}\nMasukkan nomor WhatsApp pembeli (contoh: 0812xxxx):`,
        ''
      );
      if (!inputPhone) {
        handleCopyTicketLink(order.order_number);
        toast.info('Tautan e-tiket disalin ke clipboard sebagai cadangan.');
        return;
      }
      phone = inputPhone;
    }

    const cleanPhone = formatPhoneNumberForWa(phone);
    const message = generateWhatsAppTicketMessage(order, selectedEvent);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success('Membuka WhatsApp untuk mengirim tiket... 🚀');
  };

  return (
    <DashboardLayout pageTitle="Kasir Offline (POS)" activeNav="Kasir Offline (POS)">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 text-white p-6 sm:p-7 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <QrCode className="w-3.5 h-3.5 text-amber-300" /> Point of Sale (POS) Console
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Kasir Tiket On-The-Spot & Box-Office
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Layanan penjualan tiket langsung di venue acara dengan integrasi pembayaran instan <strong>QRIS DOKU</strong> dan <strong>Tunai (Cash)</strong>.
            </p>
          </div>
        </div>

        {/* Metric Cards Summary POS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Penjualan POS</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {selectedEvent ? (posStats.totalRevenue || 0).toLocaleString('id-ID') : '0'}
              </h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Transaksi Lunas</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">
                {selectedEvent ? (posStats.totalOrdersCount || 0) : 0} Order
              </h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Penjualan QRIS DOKU</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">
                Rp {selectedEvent ? (posStats.salesByMethod?.qris || 0).toLocaleString('id-ID') : '0'}
              </h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Penjualan Tunai (Cash)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-amber-600">
                Rp {selectedEvent ? (posStats.salesByMethod?.cash || 0).toLocaleString('id-ID') : '0'}
              </h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Left (Ticket Catalog 7 cols) & Right (Checkout Console 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ticket Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Katalog Tiket Venue</h3>
                    <p className="text-xs text-slate-500 font-medium">Pilih tiket untuk menambahkannya ke keranjang kasir.</p>
                  </div>
                </div>

                {/* Event Selector & Refresh Button */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Select
                    value={selectedEvent?.id ? String(selectedEvent.id) : 'none'}
                    onValueChange={(val) => {
                      if (!val || val === 'none') {
                        setSelectedEvent(null);
                        setTicketTypes([]);
                        setCart([]);
                        setRecentOrders([]);
                        setPosStats({});
                        return;
                      }
                      const ev = events.find((x) => String(x.id) === val);
                      if (ev) setSelectedEvent(ev);
                    }}
                  >
                    <SelectTrigger className="h-9 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs min-w-[170px] max-w-[240px] cursor-pointer">
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <SelectValue placeholder="Pilih Event" />
                      </div>
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-2xl shadow-xl border-slate-200 p-1 min-w-[200px]">
                      <SelectItem
                        value="none"
                        className="rounded-xl text-xs font-bold py-2 text-slate-400 cursor-pointer"
                      >
                        Pilih Event
                      </SelectItem>
                      {(events.some((e) => String(e.status || '').toLowerCase() === 'published')
                        ? events.filter((e) => String(e.status || '').toLowerCase() === 'published')
                        : events
                      ).map((ev) => (
                        <SelectItem
                          key={ev.id}
                          value={String(ev.id)}
                          className="rounded-xl text-xs font-bold py-2 cursor-pointer"
                        >
                          🎫 {ev.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    disabled={!selectedEvent}
                    onClick={() => selectedEvent && loadTicketTypesAndPosDashboard(selectedEvent.id)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-2xs"
                    title="Refresh Tiket"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTicketsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isTicketsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Memuat daftar jenis tiket event...
                </div>
              ) : ticketTypes.length > 0 ? (
                <div className="space-y-6">
                  {/* Category Filter Pills (if multiple categories exist) */}
                  {categoryNames.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryTab('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${selectedCategoryTab === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                      >
                        Semua ({ticketTypes.length})
                      </button>
                      {categoryNames.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategoryTab(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${selectedCategoryTab === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                          {cat} ({groupedTicketTypes[cat]?.length || 0})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grouped Ticket Categories */}
                  {Object.entries(groupedTicketTypes)
                    .filter(([catName]) => selectedCategoryTab === 'ALL' || selectedCategoryTab === catName)
                    .map(([catName, types]) => (
                      <div key={catName} className="space-y-3">
                        {/* Category Section Header Strip */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                              {catName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                            {types.length} Jenis Tiket
                          </span>
                        </div>

                        {/* Tickets Grid in this Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {types.map((type) => {
                            const availableStock = getAvailableStock(type);
                            const isSoldOut = availableStock <= 0;
                            const inCart = cart.find((i) => i.ticketType.id === type.id);

                            return (
                              <div
                                key={type.id}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${isSoldOut
                                  ? 'bg-slate-50/60 border-slate-200 opacity-60'
                                  : inCart
                                    ? 'bg-blue-50/40 border-blue-300 shadow-sm'
                                    : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                                  }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{type.name}</h4>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isSoldOut
                                        ? 'bg-rose-100 text-rose-700'
                                        : availableStock <= 10
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                    >
                                      {isSoldOut ? 'Habis' : `Sisa ${availableStock}`}
                                    </span>
                                  </div>
                                  <p className="text-sm font-black text-blue-700">
                                    Rp {Number(type.price || 0).toLocaleString('id-ID')}
                                  </p>
                                  {type.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                      {type.description}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  {inCart ? (
                                    <div className="flex items-center gap-2 w-full justify-between">
                                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(type.id, -1)}
                                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-black text-blue-700">
                                          {inCart.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(type.id, 1)}
                                          className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className="text-xs font-extrabold text-slate-900">
                                        Rp {(Number(type.price || 0) * inCart.quantity).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isSoldOut}
                                      onClick={() => addToCart(type)}
                                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Tambah Ke Kasir
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              ) : !selectedEvent ? (
                <div className="py-16 px-4 text-center bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200/90 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-black text-slate-800">
                      Pilih Event Terlebih Dahulu
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Silakan pilih salah satu event pada dropdown di atas untuk memuat katalog tiket, harga tiket, dan kuota tersedia.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  Belum ada kategori tiket aktif pada event ini.
                </div>
              )}
            </div>

            {/* Riwayat Transaksi POS Hari Ini */}
            {(() => {
              const paidOrders = recentOrders.filter(
                (ord: any) => String(ord.status || '').toLowerCase() === 'paid'
              );

              return (
                <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi POS Hari Ini</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {paidOrders.length > 0 ? `${paidOrders.length} transaksi terakhir di meja kasir venue.` : 'Transaksi lunas di meja kasir venue.'}
                        </p>
                      </div>
                    </div>
                    {paidOrders.length > 0 && (
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                        {paidOrders.length} Order
                      </span>
                    )}
                  </div>

                  {paidOrders.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                      {!selectedEvent
                        ? 'Pilih event terlebih dahulu untuk melihat riwayat transaksi.'
                        : 'Belum ada transaksi POS offline lunas hari ini.'}
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[380px] sm:max-h-[420px] rounded-2xl border border-slate-200/80 shadow-2xs overscroll-contain">
                      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-2xs">
                          <tr className="text-[10px] uppercase font-extrabold text-slate-500">
                            <th className="py-2.5 px-3 whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">No. Order</th>
                            <th className="py-2.5 px-3 sticky top-0 bg-slate-50 border-b border-slate-200">Pembeli</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">Jml Tiket</th>
                            <th className="py-2.5 px-3 whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">Metode</th>
                            <th className="py-2.5 px-3 whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">Total</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">Status</th>
                            <th className="py-2.5 px-3 text-right whitespace-nowrap sticky top-0 bg-slate-50 border-b border-slate-200">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {paidOrders.map((ord: any) => {
                            const ticketQty = ord.total_tickets
                              || (Array.isArray(ord.tickets) && ord.tickets.length > 0 ? ord.tickets.length : null)
                              || (Array.isArray(ord.items) && ord.items.length > 0 ? ord.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0) : null)
                              || 1;
                            const itemsTooltip = ord.items_summary
                              || (Array.isArray(ord.items) && ord.items.length > 0 ? ord.items.map((it: any) => `${it.quantity || 1}x ${it.name || it.ticket_type_name || 'Tiket'}`).join(', ') : `${ticketQty} Tiket`);

                            return (
                              <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                                  {ord.order_number}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className="font-semibold text-slate-900 block max-w-[130px] sm:max-w-[160px] truncate"
                                    title={ord.buyer_name || 'Pembeli POS'}
                                  >
                                    {ord.buyer_name || 'Pembeli POS'}
                                  </span>
                                  {ord.buyer_phone && (
                                    <span
                                      className="text-[10px] text-slate-400 font-mono block max-w-[130px] truncate"
                                      title={ord.buyer_phone}
                                    >
                                      {ord.buyer_phone}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-black text-xs shadow-2xs"
                                    title={itemsTooltip}
                                  >
                                    <Ticket className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>{ticketQty}</span>
                                    <span className="text-[10px] font-bold text-blue-500">Tiket</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-extrabold uppercase text-[10px] text-slate-500 whitespace-nowrap">
                                  {ord.payment_method || 'QRIS'}
                                </td>
                                <td className="py-3 px-3 font-black text-slate-900 whitespace-nowrap">
                                  Rp {Number(ord.grand_total || ord.total_amount || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Paid
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                                    {/* Button 1: Detail QR / Buka E-Tiket */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenTicketView(ord.order_number)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-[11px] whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-2xs"
                                      title="Buka Halaman Barcode E-Tiket"
                                    >
                                      <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span>Lihat QR</span>
                                    </button>

                                    {/* Button 2: Kirim WhatsApp */}
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsAppForOrder(ord)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-2xs"
                                      title="Kirim E-Tiket ke WhatsApp Pembeli"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Kirim WA</span>
                                    </button>

                                    {/* Button 3: Salin Link (Jika WA bermasalah) */}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyTicketLink(ord.order_number)}
                                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shrink-0 transition-all cursor-pointer"
                                      title="Salin Tautan E-Tiket ke Clipboard"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Checkout Cart & Customer Details Console (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/50 space-y-5 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Ringkasan Kasir</h3>
                    <p className="text-xs text-slate-500 font-medium">{cart.length} Jenis Tiket ({totalTicketCount} Pcs)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickFillWalkIn}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" /> Walk-in Quick Fill
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Pembeli */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Data Pembeli Tiket
                  </span>

                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Nama Lengkap Pembeli *"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="Email Pembeli *"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Nomor WA / HP *"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Tanggal Lahir (date_of_birth) & Gender (gender = FEMALE | MALE) untuk Analisa Demografi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                          Tanggal Lahir (Demografi)
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs h-[34px]"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                {buyerDateOfBirth ? (
                                  <span className="font-bold text-slate-800">{format(new Date(buyerDateOfBirth), 'dd MMM yyyy')}</span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Pilih Tanggal Lahir</span>
                                )}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <CalendarPicker
                              mode="single"
                              selected={buyerDateOfBirth ? new Date(buyerDateOfBirth) : undefined}
                              defaultMonth={buyerDateOfBirth ? new Date(buyerDateOfBirth) : new Date(2000, 0, 1)}
                              onSelect={(d) => {
                                if (!d) return;
                                setBuyerDateOfBirth(format(d, 'yyyy-MM-dd'));
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                          Jenis Kelamin (Gender)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 h-[34px]">
                          <button
                            type="button"
                            onClick={() => setBuyerGender('MALE')}
                            className={`px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${buyerGender === 'MALE'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            <span>Laki-laki</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuyerGender('FEMALE')}
                            className={`px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${buyerGender === 'FEMALE'
                              ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            <span>Perempuan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items in Cart */}
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Daftar Pesanan Tiket ({cart.length})
                  </span>

                  {cart.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.ticketType.id}
                          className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-xs text-slate-900 block">{item.ticketType.name}</span>
                            <span className="text-[11px] text-blue-700 font-black">
                              {item.quantity} x Rp {Number(item.ticketType.price || 0).toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">
                              Rp {(Number(item.ticketType.price || 0) * item.quantity).toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.ticketType.id)}
                              className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      {!selectedEvent
                        ? 'Pilih event terlebih dahulu untuk mulai memilih tiket kasir.'
                        : 'Keranjang kasir masih kosong. Klik "+ Tambah Ke Kasir" pada katalog tiket di sebelah kiri.'}
                    </div>
                  )}
                </div>

                {/* Input Kode Promo / Kupon Diskon */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" /> Kode Promo / Kupon Diskon
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        if (appliedPromo) setAppliedPromo(null);
                        setPromoError(null);
                      }}
                      placeholder="e.g. DISKON50K"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      Terapkan
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoError}
                    </p>
                  )}

                  {appliedPromo && discountAmount > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in-0">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>Kupon <strong>{appliedPromo.code}</strong> Terpasang</span>
                      </div>
                      <span className="font-black text-emerald-700">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Payment Method Switcher: QRIS DOKU vs Cash */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Metode Pembayaran
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Escrow DOKU Metix
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${paymentMethod === 'QRIS'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                          <QrCode className="w-4 h-4" />
                        </div>
                        {paymentMethod === 'QRIS' && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="font-extrabold text-xs">QRIS DOKU</div>
                      <div className="text-[10px] text-slate-500 font-medium">Uang masuk ke Merchant DOKU</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        {paymentMethod === 'cash' && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="font-extrabold text-xs">Tunai (Cash)</div>
                      <div className="text-[10px] text-slate-500 font-medium">Kas Fisik di Meja Kasir</div>
                    </button>
                  </div>
                </div>

                {/* Cash Calculator Input (If Cash method selected) */}
                {paymentMethod === 'cash' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-emerald-900">Uang Tunai Diterima (Rp)</label>
                      {grandTotal > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAmountTendered(String(grandTotal));
                            setAmountTenderedDisplay(grandTotal.toLocaleString('id-ID'));
                          }}
                          className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          Uang Pas (Rp {grandTotal.toLocaleString('id-ID')})
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={amountTenderedDisplay ?? ''}
                      onChange={handleAmountTenderedChange}
                      placeholder="e.g. 500.000"
                      className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                    />

                    {Number(amountTendered) > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-emerald-200/80">
                        <span className="text-emerald-900">Kembalian (Change):</span>
                        <span className="text-sm font-black text-emerald-700">
                          Rp {changeDue.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Breakdown & Grand Total Bar */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span>Subtotal Tiket:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                    <span>Pajak ({localTaxPercentage}%) : </span>
                    <span>+ Rp {localTaxAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {paymentMethod === 'QRIS' && (
                    <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                      <span className="flex items-center gap-1">
                        Biaya Layanan Doku (QRIS):
                      </span>
                      <span>+ Rp {platformFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span>Diskon ({appliedPromo?.code}):</span>
                      <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Total Tagihan Pembeli
                      </span>
                      <span className="text-xl font-black text-amber-400">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      {paymentMethod === 'QRIS' ? (
                        <span className="text-emerald-400 font-bold block flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" /> Masuk ke DOKU
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold block">Kasir Tunai</span>
                      )}
                      <span>{totalTicketCount} Tiket</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold text-sm shadow-xl shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Memproses Transaksi POS...
                    </>
                  ) : paymentMethod === 'QRIS' ? (
                    <>
                      <QrCode className="w-5 h-5 text-amber-300" /> Tampilkan QRIS DOKU ke Pembeli
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" /> Cetak Tiket & Selesaikan Kasir Tunai
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL QRIS MERCHANT DOKU INTERAKTIF ================= */}
      {activeQrisOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in-0">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 px-5 py-4 text-white text-center relative shadow-sm">
              <button
                type="button"
                onClick={() => setActiveQrisOrder(null)}
                className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Official Merchant QRIS (DOKU)
              </div>
              <h3 className="text-lg font-black tracking-tight">Pindai QRIS untuk Bayar</h3>
              <p className="text-[11px] text-blue-100 font-medium line-clamp-1">
                Uang masuk otomatis ke rekening Merchant DOKU Metix & komisi terhitung.
              </p>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-center">
              {/* QR Code Container */}
              <div className="mx-auto w-52 h-52 sm:w-56 sm:h-56 p-2 bg-white rounded-3xl border-2 border-indigo-300 shadow-lg flex flex-col items-center justify-center relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                    activeQrisOrder.payment?.payment_url || activeQrisOrder.order.order_number
                  )}`}
                  alt="QRIS DOKU Code"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>

              {/* Supported Payment Logos / Notice */}
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-800">
                  Bisa di-scan: BCA, Livin, GoPay, OVO, DANA, ShopeePay & Semua M-Banking
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Masa berlaku QRIS: <strong className="text-slate-900 font-mono font-black">{formatCountdown(qrisTimeLeft)}</strong></span>
                </div>
              </div>

              {/* Live Polling Status Indicator */}
              <div className="p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  <span className="text-[11px] sm:text-xs">Menunggu Pembayaran dari Pembeli...</span>
                </div>
                {isCheckingPayment && (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                )}
              </div>

              {/* Financial Breakdown Table */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5 text-left font-medium">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>No. Pesanan:</span>
                  <span className="font-mono font-bold text-slate-900">{activeQrisOrder.order.order_number}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal Tiket (Hak EO):</span>
                  <span className="font-bold text-slate-900">
                    Rp {Number(activeQrisOrder.pricing?.subtotal || activeQrisOrder.order.subtotal || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Pajak Daerah ({activeQrisOrder.order.local_tax_percentage || localTaxPercentage}%):</span>
                  <span className="font-bold text-slate-900">
                    + Rp {Number(activeQrisOrder.pricing?.local_tax_amount || activeQrisOrder.order.local_tax_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold text-[11px]">
                  <span>Biaya Layanan Metix (QRIS):</span>
                  <span>
                    + Rp {Number(activeQrisOrder.pricing?.platform_fee || activeQrisOrder.order.platform_fee || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="text-blue-700">
                    Rp {Number(activeQrisOrder.order.grand_total || activeQrisOrder.pricing?.total_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                {activeQrisOrder.payment?.payment_url && (
                  <a
                    href={activeQrisOrder.payment.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka Laman DOKU
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveQrisOrder(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL STRUK / RECEIPT THERMAL KASIR ================= */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md overflow-y-auto animate-in fade-in-0">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white text-center relative shadow-sm">
              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center mx-auto mb-1.5 shadow-inner">
                <CheckCircle2 className="w-6 h-6 text-emerald-200" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Transaksi POS Berhasil!</h3>
              <p className="text-xs text-emerald-100 font-medium">
                Pembayaran telah lunas dikonfirmasi dan e-tiket telah terbit.
              </p>
            </div>

            {/* Scrollable Printable Thermal Layout */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 font-mono text-xs text-slate-800 bg-slate-50 border-b border-slate-200">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <img src="/mitex.png" alt="METIX Logo" className="h-6 w-auto mx-auto object-contain mb-1" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">METIX BOX-OFFICE POS</h4>
                <p className="text-[10px] text-slate-500">{selectedEvent?.title}</p>
                <p className="text-[10px] text-emerald-700 font-bold">PEMBAYARAN LUNAS (PAID)</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Order:</span>
                  <span className="font-bold text-slate-900">{successOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembeli:</span>
                  <span className="font-bold text-slate-900">{successOrder.buyer_name || 'Pembeli Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-bold uppercase text-slate-900">{successOrder.payment_method || 'QRIS'}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                {successOrder.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>
                      {it.quantity}x {it.name || it.ticket_type_name || 'Tiket'}
                    </span>
                    <span className="font-bold">
                      Rp {Number(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Breakdown */}
              <div className="space-y-1 text-xs pt-1 border-b border-dashed border-slate-300 pb-3">
                {successOrder.subtotal !== undefined && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Subtotal:</span>
                    <span>Rp {Number(successOrder.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {successOrder.local_tax_amount !== undefined && Number(successOrder.local_tax_amount) > 0 && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Pajak Daerah:</span>
                    <span>Rp {Number(successOrder.local_tax_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {successOrder.platform_fee !== undefined && Number(successOrder.platform_fee) > 0 && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Biaya Layanan Metix:</span>
                    <span>Rp {Number(successOrder.platform_fee).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold pt-1">
                  <span>TOTAL BAYAR:</span>
                  <span className="text-sm font-black text-blue-700">
                    Rp {Number(successOrder.grand_total || successOrder.total_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Generated Tickets Codes */}
              {successOrder.tickets && successOrder.tickets.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Kode Barcode E-Tiket:</span>
                  <div className="space-y-1">
                    {successOrder.tickets.map((t: any, i: number) => (
                      <div key={t.id || i} className="p-1.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700">{t.ticket_type_name || 'Tiket'} #{i + 1}</span>
                        <span className="font-mono font-black text-blue-700">{t.ticket_code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Quick Action Banner */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-emerald-600 text-white shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block text-[11px] font-black text-emerald-950 truncate">Kirim Tiket ke WhatsApp</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold block truncate">
                      {successOrder.buyer_phone || buyerPhone || 'Nomor HP'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendTicketToWhatsApp}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> Kirim Sekarang
                </button>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="shrink-0 p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTicketToWhatsApp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" /> Kirim ke WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleCopyTicketText}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
                  title="Salin Teks Format E-Tiket"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Teks
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuccessOrder(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Transaksi Baru
                </button>
                <button
                  type="button"
                  disabled={isGeneratingReceiptPdf}
                  onClick={handleDownloadReceiptPdf}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-60"
                >
                  {isGeneratingReceiptPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingReceiptPdf ? 'Mengunduh PDF...' : 'Cetak Struk'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
