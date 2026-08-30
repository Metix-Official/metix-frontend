'use me';
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  fetchTicketTypes,
  createOfflineOrder,
  fetchOfflineDashboard,
  ApiEvent,
  ApiTicketType,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';

interface CartItem {
  ticketType: ApiTicketType;
  quantity: number;
  holderNames: string[];
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

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'qris_offline'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [amountTenderedDisplay, setAmountTenderedDisplay] = useState<string>('');

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

  // Submission & Receipt Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Recent POS Orders State
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [posStats, setPosStats] = useState<any>({});

  const loadEvents = async () => {
    setIsLoading(true);
    const data = await fetchMyEvents();
    setEvents(data.events);
    if (data.events.length > 0) {
      const activeEvt = data.events.find((e) => e.status === 'published') || data.events[0];
      setSelectedEvent(activeEvt);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadTicketTypesAndPosDashboard = async (evtId: number) => {
    setIsTicketsLoading(true);
    const types = await fetchTicketTypes(evtId);
    setTicketTypes(types);

    const posData = await fetchOfflineDashboard(evtId);
    if (posData) {
      setRecentOrders(posData.latestOrders || []);
      setPosStats(posData.stats || {});
    }
    setIsTicketsLoading(false);
  };

  useEffect(() => {
    if (selectedEvent) {
      setCart([]);
      loadTicketTypesAndPosDashboard(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  // Quick fill customer details for walk-in buyers
  const handleQuickFillWalkIn = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setBuyerName('Pembeli Walk-in (Kasir)');
    setBuyerEmail(`walkin.${randomId}@metix.id`);
    setBuyerPhone('081234567890');
    setBuyerNik('');
  };

  // Cart operations
  const addToCart = (type: ApiTicketType) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.ticketType.id === type.id);
      const availableStock = Math.max(0, (type.quota || 100) - (type.sold_quantity || 0));

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
            const availableStock = Math.max(
              0,
              (item.ticketType.quota || 100) - (item.ticketType.sold_quantity || 0)
            );

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

  // Price calculations
  const grandTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.ticketType.price || 0) * item.quantity, 0);
  }, [cart]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const tendered = Number(amountTendered) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [paymentMethod, amountTendered, grandTotal]);

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
        alert(`Jumlah uang tunai yang diterima (Rp. ${tendered.toLocaleString('id-ID')}) kurang dari total tagihan (Rp. ${grandTotal.toLocaleString('id-ID')}).`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        buyer_nik: buyerNik || undefined,
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          ticket_type_id: c.ticketType.id,
          quantity: c.quantity,
          holder_names: c.holderNames,
        })),
      };

      const result = await createOfflineOrder(selectedEvent.id, payload);
      setSuccessOrder(result.order || result);

      // Reset Form
      setCart([]);
      setBuyerName('');
      setBuyerEmail('');
      setBuyerPhone('');
      setBuyerNik('');
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

  const printThermalReceipt = () => {
    window.print();
  };

  return (
    <DashboardLayout pageTitle="Kasir Offline (POS)" activeNav="Kasir Offline (POS)">
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-white" /> Point of Sale (POS) & Ticket Counter Console
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Kasir Tiket Offline & Cetak Struk
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Melayani penjualan tiket on-the-spot di lokasi venue, pembayaran tunai/QRIS/transfer, dan pencetakan e-tiket instant.
              </p>
            </div>

            {/* Event Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/20 shrink-0 min-w-[260px]">
              <Calendar className="w-4 h-4 text-amber-300 ml-1 shrink-0" />
              <Select
                value={selectedEvent?.id ? String(selectedEvent.id) : ''}
                onValueChange={(val) => {
                  const ev = events.find((x) => String(x.id) === val);
                  if (ev) setSelectedEvent(ev);
                }}
              >
                <SelectTrigger className="w-full bg-transparent border-0 text-white font-extrabold text-xs focus:ring-0 focus:outline-none shadow-none h-auto p-0 cursor-pointer hover:text-amber-200 transition-colors">
                  <SelectValue placeholder="Pilih Event POS" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      {ev.title} ({ev.status.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Metric Cards Summary POS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Penjualan Kasir POS</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                Rp {(posStats.totalRevenue || 0).toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Transaksi Selesai</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600">
                {posStats.totalOrdersCount || 0} Order
              </h4>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tiket Terjual (Offline)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">
                {posStats.totalTickets || 0} Tiket
              </h4>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pembayaran Tunai (Cash)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-amber-600">
                Rp {(posStats.salesByMethod?.cash || 0).toLocaleString('id-ID')}
              </h4>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main POS Interface (Grid 2 Column: Ticket Catalog + Checkout Cart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Ticket Catalog Cards (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-600" /> Katalog Tipe Tiket ({ticketTypes.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih tipe tiket yang ingin dibeli pelanggan untuk dimasukkan ke keranjang kasir.
                  </p>
                </div>

                <button
                  onClick={() => selectedEvent && loadTicketTypesAndPosDashboard(selectedEvent.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  title="Refresh Stok Tiket"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {isTicketsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Skeleton className="h-36 w-full rounded-2xl" />
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </div>
              ) : ticketTypes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {ticketTypes.map((type) => {
                    const priceNum = Number(type.price || 0);
                    const totalQuota = type.quota || 100;
                    const sold = type.sold_quantity || 0;
                    const availableStock = Math.max(0, totalQuota - sold);

                    const cartItem = cart.find((i) => i.ticketType.id === type.id);
                    const inCartQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div
                        key={type.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          inCartQty > 0
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-900 line-clamp-1">{type.name}</span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                availableStock > 10
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : availableStock > 0
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              Sisa: {availableStock} pcs
                            </span>
                          </div>

                          <div className="text-base font-black text-blue-700">
                            Rp. {priceNum.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Add to Cart / Quantity Controller */}
                        {inCartQty > 0 ? (
                          <div className="flex items-center justify-between bg-white border border-blue-200 rounded-xl p-1 shadow-2xs">
                            <button
                              onClick={() => updateQuantity(type.id, -1)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-xs text-blue-900 px-3">{inCartQty} pcs</span>
                            <button
                              onClick={() => updateQuantity(type.id, 1)}
                              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={availableStock < 1}
                            onClick={() => addToCart(type)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> + Tambah Ke Kasir
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                  Belum ada tipe tiket yang dibuat untuk event ini. Buat tipe tiket terlebih dahulu di menu "Event Saya".
                </div>
              )}
            </div>

            {/* Recent POS Transactions Table */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Riwayat Transaksi POS Hari Ini
              </h3>

              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No. Order</th>
                        <th className="py-3 px-4">Pembeli</th>
                        <th className="py-3 px-4">Metode</th>
                        <th className="py-3 px-4">Total (Rp)</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">{ord.order_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{ord.buyer_name}</td>
                          <td className="py-3 px-4 font-extrabold uppercase text-[10px] text-slate-500">
                            {ord.payment_method || 'Cash'}
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            Rp. {Number(ord.grand_total || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                  Belum ada transaksi POS offline hari ini.
                </div>
              )}
            </div>
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
                    <p className="text-xs text-slate-500 font-medium">{cart.length} Jenis Tiket Terpilih</p>
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
                              {item.quantity} x Rp. {Number(item.ticketType.price || 0).toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">
                              Rp. {(Number(item.ticketType.price || 0) * item.quantity).toLocaleString('id-ID')}
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
                      Keranjang kasir masih kosong. Klik "+ Tambah Ke Kasir" pada katalog tiket di sebelah kiri.
                    </div>
                  )}
                </div>

                {/* Payment Method Switcher */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Pilih Metode Pembayaran
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Tunai (Cash)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris_offline')}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'qris_offline'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span>QRIS Offline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Bank Transfer</span>
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
                      placeholder="e.g. 1.000.000"
                      className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                    />

                    {Number(amountTendered) > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-emerald-200/80">
                        <span className="text-emerald-900">Kembalian (Change):</span>
                        <span className="text-sm font-black text-emerald-700">
                          Rp. {changeDue.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Grand Total Bar */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Tagihan POS</span>
                    <span className="text-xl font-black text-amber-400">
                      Rp. {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <ShoppingBag className="w-6 h-6 text-amber-400" />
                </div>

                {/* Checkout Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-sm shadow-xl shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Memproses Transaksi POS...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" /> Cetak Tiket & Selesaikan Transaksi
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL STRUK / RECEIPT THERMAL KASIR ================= */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
              <button
                onClick={() => setSuccessOrder(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle2 className="w-7 h-7 text-emerald-200" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Transaksi POS Berhasil!</h3>
              <p className="text-xs text-emerald-100 font-medium">
                Pembayaran telah dikonfirmasi dan e-tiket telah dibuat.
              </p>
            </div>

            {/* Thermal Printable Receipt Preview Layout */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-800 bg-slate-50 border-b border-slate-200">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <img src="/mitex.png" alt="METIX Logo" className="h-6 w-auto mx-auto object-contain mb-1" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">TICKETING POS</h4>
                <p className="text-[10px] text-slate-500">{selectedEvent?.title}</p>
                <p className="text-[10px] text-slate-500">Struk Pembayaran Kasir Offline</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Order:</span>
                  <span className="font-bold text-slate-900">{successOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembeli:</span>
                  <span className="font-bold text-slate-900">{successOrder.buyer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode:</span>
                  <span className="font-bold uppercase text-slate-900">{successOrder.payment_method}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                {successOrder.order_items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span>
                      {it.quantity}x {it.ticket_type?.name || 'Tiket'}
                    </span>
                    <span className="font-bold">
                      Rp. {Number(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Change */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between font-extrabold">
                  <span>TOTAL:</span>
                  <span className="text-sm font-black text-blue-700">
                    Rp. {Number(successOrder.grand_total || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
              >
                Transaksi Baru
              </button>
              <button
                type="button"
                onClick={printThermalReceipt}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
