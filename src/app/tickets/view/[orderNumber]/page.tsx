'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { fetchPublicOrderTickets } from '@/lib/api';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  Printer,
  Copy,
  Share2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
  ArrowLeft,
  Download,
  Tag,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

export default function PublicTicketViewPage() {
  const params = useParams();
  const router = useRouter();
  const rawOrderNumber = (params?.orderNumber as string) || '';

  // Clean order number from any accidental trailing characters (e.g. from WhatsApp auto-link formatting)
  const cleanOrderNumber = decodeURIComponent(rawOrderNumber)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim();

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!cleanOrderNumber) {
      setIsLoading(false);
      return;
    }

    const loadTicket = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchPublicOrderTickets(cleanOrderNumber);
        if (result && result.order) {
          setData(result);
        } else {
          setData(null);
          setErrorMessage(result?.error || 'Pesanan dengan nomor tersebut tidak ditemukan atau belum lunas.');
        }
      } catch (err: any) {
        console.error('Failed to load public ticket:', err);
        setData(null);
        setErrorMessage(err?.message || 'Terjadi kesalahan saat memuat tiket.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [cleanOrderNumber]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode tiket "${code}" disalin ke clipboard! 📋`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `E-Tiket: ${data?.event?.title || 'Metix'}`,
          text: `Berikut e-tiket resmi saya untuk ${data?.event?.title}:`,
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan e-tiket berhasil disalin ke clipboard! 🔗');
    }
  };

  const generateTicketPdfPage = async (doc: jsPDF, t: any, isFirstPage: boolean) => {
    if (!isFirstPage) {
      doc.addPage();
    }

    const eventTitle = data?.event?.title || 'Metix Official Event';
    const venue = data?.event?.venue_name
      ? `${data.event.venue_name}${data.event.city ? `, ${data.event.city}` : ''}`
      : 'Venue Acara';
    const ticketType = t.ticket_type_name || 'Regular Pass';
    const categoryName = t.category ? String(t.category).trim() : '';
    const fullCategoryTicket = categoryName ? `${categoryName} • ${ticketType}` : ticketType;
    const buyerName =
      t.holder_name && t.holder_name !== 'Pemegang Tiket'
        ? t.holder_name
        : (data?.order?.buyer_name || 'Pembeli Tiket');
    const buyerPhone = data?.order?.buyer_phone || '-';
    const orderNumber = data?.order?.order_number || cleanOrderNumber;
    const ticketCode = t.ticket_code || t.qr_token || 'MTX-TKT';

    let dateStr = '-';
    if (data?.event?.start_date) {
      try {
        const d = new Date(data.event.start_date);
        dateStr =
          d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }) + (data.event.start_time ? `, ${data.event.start_time} WIB` : '');
      } catch {
        dateStr = data.event.start_date;
      }
    }

    // Card Dimensions: 180mm x 140mm
    const cardX = 15;
    const cardY = 22;
    const cardWidth = 180;

    // 1. Outer Card Container
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardWidth, 138, 5, 5, 'FD');

    // 2. Top Banner Header (Height: 38mm)
    doc.setFillColor(30, 58, 138); // Deep Navy Blue #1e3a8a
    doc.roundedRect(cardX, cardY, cardWidth, 38, 5, 5, 'F');
    doc.rect(cardX, cardY + 30, cardWidth, 8, 'F');

    // Gold Badge (Shows Category if available)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(253, 224, 71); // Gold #fde047
    doc.text(
      categoryName ? `OFFICIAL PASS • ${categoryName.toUpperCase()}` : 'OFFICIAL E-TICKET PASS',
      cardX + 8,
      cardY + 11
    );

    // Event Title
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(eventTitle.substring(0, 42), cardX + 8, cardY + 21);

    // Ticket Code Tag
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(147, 197, 253);
    doc.text(`CODE: ${ticketCode}`, cardX + 8, cardY + 31);

    // 3. QR Code Section (Left Side)
    const qrValue = t.qr_token || t.ticket_code;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;

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
    } catch (e) {
      console.warn('QR fetch error, drawing code fallback:', e);
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
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), leftCol, startY);

      doc.setFontSize(isHighlight ? 11 : 9.5);
      doc.setTextColor(isHighlight ? 29 : 15, isHighlight ? 78 : 23, isHighlight ? 216 : 42);
      doc.text(value.substring(0, 42), leftCol, startY + 4.5);

      // Divider Line
      doc.setDrawColor(241, 245, 249);
      doc.line(leftCol, startY + 8, cardX + cardWidth - 8, startY + 8);
      startY += 12;
    };

    drawRow('Kategori & Jenis Tiket', fullCategoryTicket, true);
    drawRow('Nama Pembeli / Pemilik', buyerName);
    drawRow('No. WhatsApp / HP', buyerPhone);
    drawRow('No. Pesanan', orderNumber);
    drawRow('Waktu & Tanggal Event', dateStr);
    drawRow('Lokasi Venue', venue);

    // 5. Bottom Ticket Stub Footer Section
    const footerY = cardY + 118;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, footerY, cardWidth, 20, 0, 0, 'F');
    doc.roundedRect(cardX, cardY, cardWidth, 138, 5, 5, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Petunjuk Check-in: Tunjukkan PDF E-Ticket Pass ini kepada petugas gate venue event.', cardX + 8, footerY + 8);
    doc.text('QR Code hanya berlaku untuk 1x scan check-in di pintu masuk acara.', cardX + 8, footerY + 14);

    // Brand Logo Watermark
    doc.setFont('helvetica', 'black');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('METIX', cardX + cardWidth - 28, footerY + 12);

    // 6. Tear / Fold Divider Line
    const dividerY = 166;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(cardX, dividerY, cardX + cardWidth, dividerY);
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('- - - GUNTING ATAU LIPAT DI SINI (TEAR OR FOLD HERE) - - -', cardX + cardWidth / 2, dividerY - 1, { align: 'center' });

    // 7. Terms & Conditions Section
    const tcY = 171;
    const tcHeight = 110;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(cardX, tcY, cardWidth, tcHeight, 4, 4, 'FD');

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(cardX, tcY, cardWidth, 13, 4, 4, 'F');
    doc.rect(cardX, tcY + 8, cardWidth, 5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TERMS & CONDITIONS  *  SYARAT & KETENTUAN MASUK ACARA', cardX + 8, tcY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(253, 224, 71);
    doc.text('METIX OFFICIAL PASS', cardX + cardWidth - 8, tcY + 8.5, { align: 'right' });

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

    let itemY = tcY + 19;
    drawTcItem(leftColX, itemY, '1', 'Validasi 1x Scan (Single Entry)', 'QR Code e-tiket hanya berlaku untuk 1 (satu) kali pemindaian masuk. Tiket yang sudah di-scan tidak dapat digunakan kembali.');
    itemY += 16;
    drawTcItem(leftColX, itemY, '2', 'Wajib Membawa Identitas Asli', 'Pemegang tiket wajib menunjukkan kartu identitas resmi asli (KTP/SIM/Paspor) yang masih berlaku sesuai nama yang terdaftar.');
    itemY += 16;
    drawTcItem(leftColX, itemY, '3', 'Larangan Barang Terlarang', 'Dilarang membawa senjata tajam, obat terlarang, minuman keras, flare, laser pointer, dan barang membahayakan lainnya.');

    itemY = tcY + 19;
    drawTcItem(rightColX, itemY, '4', 'Kebijakan Tiket (Non-Refundable)', 'Tiket yang telah dibeli tidak dapat ditukar atau diuangkan kembali kecuali acara dibatalkan secara resmi oleh penyelenggara.');
    itemY += 16;
    drawTcItem(rightColX, itemY, '5', 'Hak Penyelenggara & Keamanan', 'Penyelenggara berhak menolak masuk atau mengeluarkan pengunjung yang tidak mematuhi norma ketertiban dan keamanan.');
    itemY += 16;
    drawTcItem(rightColX, itemY, '6', 'Dokumentasi & Publikasi', 'Pengunjung memberikan izin kepada penyelenggara untuk mengambil dokumentasi foto/video selama acara berlangsung.');

    const helpY = tcY + 94;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(cardX + 4, helpY, cardWidth - 8, 11, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text('LAYANAN BANTUAN METIX: support@metix.id | www.metix.id', cardX + 8, helpY + 7);

    doc.setFont('helvetica', 'black');
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.text('* VERIFIED AUTHENTIC PASS', cardX + cardWidth - 8, helpY + 7, { align: 'right' });
  };

  const handleDownloadPdf = async () => {
    if (!data || !data.order || !data.tickets || data.tickets.length === 0) {
      toast.error('Data tiket belum lengkap untuk diunduh.');
      return;
    }

    setIsDownloadingPdf(true);
    const toastId = toast.loading('Menyiapkan file PDF E-Tiket...');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < data.tickets.length; i++) {
        await generateTicketPdfPage(doc, data.tickets[i], i === 0);
      }

      const buyerCleanName = (data.order.buyer_name || 'Metix')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 25);
      const filename = `E-Tiket_${cleanOrderNumber}_${buyerCleanName}.pdf`;

      doc.save(filename);
      toast.success(`E-Tiket PDF berhasil diunduh! 📄`, { id: toastId });
    } catch (err: any) {
      console.error('jsPDF Download Error:', err);
      toast.error('Gagal mengunduh dokumen PDF E-Tiket: ' + (err?.message || 'Error'), { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
            <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight">Memuat E-Tiket Anda...</h3>
            <p className="text-xs text-slate-400">Menghubungkan ke server resmi Metix Pass</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.order) {
    const isUnpaid = errorMessage?.toLowerCase().includes('belum lunas') || errorMessage?.toLowerCase().includes('belum dapat diakses');

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${isUnpaid
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
          >
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${isUnpaid
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}
            >
              {isUnpaid ? 'Menunggu Pembayaran' : 'Tiket Tidak Ditemukan'}
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {isUnpaid ? 'E-Tiket Belum Diterbitkan' : 'E-Tiket Tidak Tersedia'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isUnpaid ? (
                <>
                  Pesanan <code className="font-mono text-amber-300 font-bold">{cleanOrderNumber || rawOrderNumber}</code>{' '}
                  belum lunas. Barcode e-tiket hanya diterbitkan dan dapat diakses setelah pembayaran QRIS/transaksi dinyatakan <b>LUNAS (PAID)</b>.
                </>
              ) : (
                errorMessage || (
                  <>
                    Pesanan dengan nomor <code className="font-mono text-amber-300 font-bold">{cleanOrderNumber || rawOrderNumber}</code> tidak ditemukan pada sistem Metix.
                  </>
                )
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Kembali ke Beranda Metix
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { order, event, tickets } = data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 print:hidden">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            <span className="text-xs font-black tracking-wider uppercase text-blue-400 border-l border-slate-700 pl-2">
              Pass E-Ticket
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Bagikan Tautan Tiket"
            >
              <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bagikan</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              title="Unduh E-Tiket sebagai file PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="printable-ticket-content" className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Verification Success Pill */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold block text-white">E-Tiket Terverifikasi Resmi</span>
              <span className="text-[11px] text-emerald-400">Pembayaran lunas via {order.payment_method || 'QRIS DOKU'}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
            LUNAS (PAID)
          </span>
        </div>

        {/* Event Header Banner Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          {event?.banner && (
            <div className="w-full h-44 sm:h-52 relative overflow-hidden bg-slate-800">
              <img
                src={event.banner}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 inline-block">
                {event.organizer_name || 'Metix Official Event'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {event.title}
              </h1>
            </div>

            {/* Event Time & Venue Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-blue-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waktu Acara</span>
                  <span className="font-extrabold text-white">{formatDate(event.start_date)}</span>
                  {event.start_time && (
                    <span className="text-[11px] text-slate-400 block">{event.start_time} WIB</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Venue</span>
                  <span className="font-extrabold text-white">{event.venue_name}</span>
                  {event.city && (
                    <span className="text-[11px] text-slate-400 block">{event.city}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order & Buyer Info Card with Pricing Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Nomor Pesanan:</span>
            <span className="font-mono font-black text-blue-400 text-sm">{order.order_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Nama Pemesan:</span>
            <span className="font-extrabold text-white">{order.buyer_name}</span>
          </div>
          {order.buyer_phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">No. WhatsApp / HP:</span>
              <span className="font-mono font-bold text-slate-300">{order.buyer_phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Metode Pembayaran:</span>
            <span className="font-extrabold text-slate-300 uppercase">{order.payment_method || 'QRIS DOKU'}</span>
          </div>

          {/* Rincian Subtotal, Pajak & Fee */}
          <div className="pt-2 border-t border-slate-800/90 space-y-1.5 text-slate-400">
            <div className="flex items-center justify-between">
              <span>Subtotal Tiket:</span>
              <span className="font-bold text-slate-200">
                Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {Number(order.local_tax_amount || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span>Pajak:</span>
                <span className="font-bold text-slate-200">
                  Rp {Number(order.local_tax_amount).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {Number(order.platform_fee || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span>Biaya Layanan (Platform Fee):</span>
                <span className="font-bold text-slate-200">
                  Rp {Number(order.platform_fee).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="font-bold text-slate-300">Total Pembayaran:</span>
            <span className="font-black text-amber-400 text-base">
              Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* List of Issued Tickets (Perforated Pass Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              <span>Tiket Masuk ({tickets.length} Tiket)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Tunjukkan barcode di bawah saat masuk</span>
          </div>

          <div className="space-y-4">
            {tickets.map((t: any, index: number) => {
              const qrValue = t.qr_token || t.ticket_code;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
                qrValue
              )}`;

              return (
                <div
                  key={t.id || index}
                  className="rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-xl relative"
                >
                  {/* Ticket Header Stub with Category and Name */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-950 text-white flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.category && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs">
                            <Tag className="w-2.5 h-2.5" />
                            {t.category}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                          Tiket Masuk #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {t.ticket_type_name}
                        </h4>
                        {t.category && (
                          <span className="text-xs font-bold text-blue-200">
                            • {t.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs">
                      {t.status === 'ACTIVE' ? 'SIAP DIGUNAKAN' : t.status}
                    </span>
                  </div>

                  {/* Perforated Cutline Dots Effect */}
                  <div className="relative flex items-center justify-between px-2 -my-2.5 z-10 print:hidden">
                    <div className="w-5 h-5 rounded-full bg-slate-950 -ml-5"></div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-800 mx-2"></div>
                    <div className="w-5 h-5 rounded-full bg-slate-950 -mr-5"></div>
                  </div>

                  {/* Ticket Body & QR Code */}
                  <div className="p-5 sm:p-6 text-center space-y-4">
                    {/* Buyer Identity Card on Ticket Pass */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 max-w-sm mx-auto text-left space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" /> Nama Pembeli / Pemegang
                        </span>
                        {order.buyer_phone && (
                          <span className="text-[10px] font-mono text-slate-400">{order.buyer_phone}</span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-black text-white tracking-tight">
                        {t.holder_name && t.holder_name !== 'Pemegang Tiket'
                          ? t.holder_name
                          : (order.buyer_name || 'Pembeli Tiket')}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/60 pt-1.5 mt-1">
                        <span className="truncate max-w-[190px]">
                          Kategori: <b className="text-amber-300">{t.category ? `${t.category} - ` : ''}{t.ticket_type_name}</b>
                        </span>
                        <span className="font-mono text-blue-400 font-bold shrink-0">{order.order_number}</span>
                      </div>
                    </div>

                    {/* Big Scannable QR Code */}
                    <div className="mx-auto w-56 h-56 p-2.5 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                      <img
                        crossOrigin="anonymous"
                        src={qrImageUrl}
                        alt={`QR Code ${t.ticket_code}`}
                        className="w-full h-full object-contain rounded-2xl"
                      />
                    </div>

                    {/* Barcode & Code Number */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                        Kode Barcode Tiket
                      </span>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-mono font-black text-amber-300">
                        <span>{t.ticket_code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(t.ticket_code)}
                          className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Salin Kode Tiket"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Scan QR code ini langsung di layar HP Anda kepada petugas Scanner di pintu masuk.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Guidelines Notice */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-slate-300">
          <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Petunjuk Masuk Venue
          </h4>
          <ul className="space-y-1.5 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
            <li>Tunjukkan barcode pada halaman ini kepada petugas pemeriksa di Gate Pintu Masuk.</li>
            <li>Pastikan kecerahan layar HP Anda disetel terang agar scanner dapat membaca barcode dengan cepat.</li>
            <li>Satu barcode tiket hanya dapat dipindai 1 kali untuk 1 orang pengunjung (*Single Entry*).</li>
            <li>Simpan atau *bookmark* halaman ini untuk akses cepat saat berada di venue.</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 print:hidden">
        <p>© {new Date().getFullYear()} Metix Ticketing Platform. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
