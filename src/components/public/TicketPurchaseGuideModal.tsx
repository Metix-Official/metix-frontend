'use client';

import React, { useState } from 'react';
import {
  X,
  Ticket,
  Search,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  Download,
  Clock,
  ExternalLink,
  Layers,
  Check,
  Calendar,
  MapPin,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

interface TicketPurchaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderTicket: () => void;
}

export const TicketPurchaseGuideModal: React.FC<TicketPurchaseGuideModalProps> = ({
  isOpen,
  onClose,
  onOrderTicket,
}) => {
  const [activeStep, setActiveStep] = useState(1);

  if (!isOpen) return null;

  const scrollToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    const element = document.getElementById(`step-guide-${stepNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Click Beli Tiket',
      subtitle: 'Jelajahi dan pilih event konser favorit Anda di halaman beranda.',
      content:
        'Buka halaman utama Metix dan temukan konser musik, festival, atau acara favorit yang ingin Anda tonton. Anda bisa memanfaatkan fitur pencarian artis, filter kategori musik, atau langsung menekan tombol "Beli Tiket" pada kartu event yang Anda inginkan.',
      mockupHighlight: 'Pilih Event & Klik Beli Tiket',
      tag: 'Langkah 1',
    },
    {
      number: 2,
      title: 'Click Beli Sekarang',
      subtitle: 'Masuk ke halaman detail acara dan klik tombol "Beli Sekarang".',
      content:
        'Pada halaman detail event, Anda dapat melihat informasi lengkap mengenai jadwal konser, lokasi panggung venue, daftar artis pengisi acara (lineup), serta denah panggung. Jika sudah mantap, klik tombol utama "Beli Sekarang" atau "Pesan Tiket" untuk lanjut.',
      mockupHighlight: 'Klik Tombol Beli Sekarang',
      tag: 'Langkah 2',
    },
    {
      number: 3,
      title: 'Login atau Register Akun',
      subtitle: 'Masuk ke akun Anda atau daftar baru jika belum memiliki akun.',
      content:
        'Untuk menjamin kepemilikan tiket dan barcode resmi, Anda wajib masuk ke akun Metix. Jika sudah punya akun, cukup masukkan Email dan Password Anda untuk Login. Jika belum memiliki akun, klik tombol "Daftar / Register" dan lengkapi Nama, Email, dan Password dalam 30 detik.',
      mockupHighlight: 'Autentikasi Akun (Login / Register)',
      tag: 'Langkah 3',
    },
    {
      number: 4,
      title: 'Pilih Jenis Tiket & Jumlah',
      subtitle: 'Tentukan kategori tiket (VIP / Festival) dan berapa lembar yang dipesan.',
      content:
        'Pilih jenis tiket yang tersedia (misalnya VIP Front Row, Festival Regular, atau Tribune Pass). Tentukan jumlah tiket yang ingin Anda pesan dengan menekan tombol (+) atau (-). Sistem akan secara otomatis menghitung subtotal pesanan Anda.',
      mockupHighlight: 'Kategori Tiket & Jumlah Lembar',
      tag: 'Langkah 4',
    },
    {
      number: 5,
      title: 'Data Pemesan (Autofill dari Akun)',
      subtitle: 'Identitas pemesan terisi otomatis dari profil akun yang telah masuk.',
      content:
        'Karena Anda telah login, formulir data pemesan tiket (Nama Lengkap, Nomor WhatsApp, dan Alamat Email) akan langsung terisi secara otomatis (autofill) dari profil akun Anda. Anda cukup memastikan data sudah valid agar pengiriman E-Tiket berjalan lancar.',
      mockupHighlight: 'Autofill Data Pemesan dari Akun',
      tag: 'Langkah 5',
    },
    {
      number: 6,
      title: 'Click Pilih Metode Bayar',
      subtitle: 'Periksa ringkasan rincian tagihan dan klik "Pilih Metode Bayar".',
      content:
        'Tinjau kembali rincian tiket yang dipesan, harga total, dan data identitas pemesan. Jika semua informasi sudah benar, klik tombol checkout biru "Pilih Metode Bayar" di bagian bawah untuk membuka gerbang pembayaran resmi.',
      mockupHighlight: 'Klik Pilih Metode Bayar',
      tag: 'Langkah 6',
    },
    {
      number: 7,
      title: 'Pilih Metode Bayar Rekomendasi (QRIS)',
      subtitle: 'Gunakan QRIS untuk proses pembayaran otomatis tercepat tanpa repot.',
      content:
        'Pada daftar saluran pembayaran, pilih opsi "QRIS Instan" (Sangat Direkomendasikan). QRIS dapat di-scan dari seluruh aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI, dll.) dan seluruh E-Wallet resmi (GoPay, OVO, Dana, ShopeePay) dengan verifikasi otomatis detik itu juga.',
      mockupHighlight: 'Metode Pembayaran QRIS (Rekomendasi)',
      tag: 'Langkah 7',
    },
    {
      number: 8,
      title: 'Bayar & Konfirmasi Transaksi',
      subtitle: 'Scan kode QRIS di layar Anda menggunakan aplikasi bank / e-wallet.',
      content:
        'Layar akan menampilkan kode QRIS resmi beserta hitung mundur waktu pembayaran (countdown timer) dan total tagihan yang pas. Buka aplikasi m-banking atau e-wallet di ponsel Anda, scan kode QR tersebut, lalu konfirmasi pembayaran.',
      mockupHighlight: 'Scan QRIS & Selesaikan Pembayaran',
      tag: 'Langkah 8',
    },
    {
      number: 9,
      title: 'Jika Merchant Tidak Keluar (Solusi)',
      subtitle: 'Buka menu "Tiket Saya" dan selesaikan pembayaran dari daftar pesanan.',
      content:
        'Jika pop-up merchant atau layar QRIS tidak muncul karena terhalang pop-up blocker atau browser tertutup, tenang! Pesanan Anda tersimpan aman. Cukup klik menu "Tiket Saya" di navigasi atas, cari transaksi yang berstatus "Menunggu Pembayaran", lalu klik "Bayar Sekarang" untuk membuka kembali kode bayar.',
      mockupHighlight: 'Menu Tiket Saya -> Bayar Sekarang',
      tag: 'Langkah 9',
    },
    {
      number: 10,
      title: 'Tiket Terbit (Siap Digunakan)',
      subtitle: 'E-Tiket resmi dengan QR Code unik langsung aktif untuk scan di gate event.',
      content:
        'Setelah pembayaran berhasil diverifikasi sistem, status pesanan otomatis berubah menjadi "LUNAS". E-Tiket resmi ber-QR Code unik langsung dapat diakses di menu "Tiket Saya" dan dikirimkan ke email Anda. Cukup perlihatkan QR code di ponsel Anda ke petugas scanner saat memasuki venue acara!',
      mockupHighlight: 'E-Tiket Ber-QR Code Resmi Terbit',
      tag: 'Langkah 10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 md:p-6 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background Soft Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4" />

      {/* Main Wide Modal Container (Tema LIGHT Elegan, Bersih, & Premium) */}
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-white text-slate-800 rounded-[32px] border border-slate-200/90 shadow-[0_25px_80px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Fixed Header Bar */}
        <header className="shrink-0 h-16 sm:h-20 px-6 sm:px-8 border-b border-slate-100 bg-white/95 backdrop-blur-xl flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Panduan Resmi
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• E-Ticketing Guide</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Cara Mudah Beli Tiket di Metix (10 Langkah Praktis)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Pesan Tiket Button in Header */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOrderTicket();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <span>Pesan Tiket Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Circular Close Button X */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all duration-200 hover:rotate-90 hover:scale-105 cursor-pointer shadow-xs"
              aria-label="Tutup Panduan"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Modal Body Content (Responsive Two-Column Split: Sticky Sidebar + Long Scrollable Steps) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT COLUMN: Sticky Info & 10 Steps Stepper (Tema LIGHT, menempel saat di-scroll) */}
          <aside className="lg:w-80 xl:w-96 shrink-0 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/80 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Title Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/70 border border-blue-200 text-[10px] font-black text-blue-800 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Panduan Lengkap</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Alur Pembelian
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Ikuti 10 langkah mudah berikut untuk memesan tiket konser resmi tanpa kendala.
                </p>
              </div>

              {/* Stepper Navigation List (10 Langkah dengan Scroll Halus) */}
              <div className="space-y-1 hidden sm:block max-h-[360px] xl:max-h-[420px] overflow-y-auto pr-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 sticky top-0 bg-slate-50/95 py-0.5">
                  Daftar 10 Langkah:
                </p>
                {steps.map((st) => (
                  <button
                    key={st.number}
                    type="button"
                    onClick={() => scrollToStep(st.number)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${activeStep === st.number
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-600'
                      : 'text-slate-600 hover:bg-white hover:text-blue-700 border border-transparent hover:border-slate-200/80 shadow-2xs'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4.5 h-4.5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 transition-colors ${activeStep === st.number
                          ? 'bg-white text-blue-700'
                          : 'bg-slate-200 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                          }`}
                      >
                        {st.number}
                      </span>
                      <span className="truncate max-w-[170px] xl:max-w-[210px] text-[11px]">
                        {st.title}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                ))}
              </div>

              {/* Security & Guarantee Trust Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jaminan Tiket Asli 100%</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Metix bermitra langsung dengan Event Organizer resmi. E-Tiket Anda dilengkapi QR code unik yang tidak dapat dipalsukan.
                </p>
              </div>
            </div>

            {/* Bottom CTA on Sticky Sidebar */}
            <div className="pt-4 hidden lg:block border-t border-slate-200/80 mt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOrderTicket();
                }}
                className="w-full py-3 px-4 rounded-2xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Ticket className="w-4 h-4 transition-transform group-hover:rotate-12" />
                <span>Pesan Tiket Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </aside>

          {/* RIGHT COLUMN: Long Scrollable Step-by-Step with Phone Mockups (Tema LIGHT) */}
          <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto space-y-12 scroll-smooth bg-white">
            <div className="space-y-1.5 pb-3 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-700 uppercase">
                <Check className="w-3 h-3" />
                <span>10 Langkah Sederhana</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Alur & Tata Cara Membeli Tiket
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Panduan praktis mulai dari memilih event konser hingga tiket resmi terbit siap di-scan.
              </p>
            </div>

            {/* 10 STEPS LOOP WITH SMARTPHONE MOCKUPS */}
            <div className="space-y-14">
              {steps.map((st) => (
                <section
                  key={st.number}
                  id={`step-guide-${st.number}`}
                  className="space-y-5 scroll-mt-6"
                >
                  {/* Step Header Title & Numbering Badge */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-blue-600 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25 mt-0.5">
                      {st.number}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {st.tag}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{st.subtitle}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {st.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                        {st.content}
                      </p>
                    </div>
                  </div>

                  {/* SMARTPHONE FRAME MOCKUP (Light Modern Silver / Titanium Finish) */}
                  <div className="relative max-w-md mx-auto sm:mx-0 pl-11">
                    <div className="relative rounded-[36px] bg-slate-100/95 border-4 border-slate-200/90 shadow-xl shadow-slate-200/60 p-4 pt-3 overflow-hidden text-slate-800">
                      {/* Phone Speaker Notch / Dynamic Island (Light Design) */}
                      <div className="w-28 h-4 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                      </div>

                      {/* Mockup Screen Content Container (Clean Light White) */}
                      <div className="bg-white rounded-2xl p-4 space-y-3.5 border border-slate-200 text-left min-h-[220px]">
                        {/* Mockup Status Bar */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-2">
                          <span>8:37 PM</span>
                          <span className="flex items-center gap-1">
                            <span>5G</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </span>
                        </div>

                        {/* STEP 1: Click Beli Tiket */}
                        {st.number === 1 && (
                          <div className="space-y-2.5">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-2.5">
                              <Search className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-semibold text-slate-700">Cari konser, artis, tempat...</span>
                            </div>

                            {/* Active Highlight Target Event Card */}
                            <div className="p-3 rounded-xl bg-blue-50/80 border-2 border-blue-600 shadow-md text-blue-950 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-black text-slate-900">Konser Musik Populer</span>
                                </div>
                                <span className="text-[10px] text-slate-500 block">Mulai dari Rp 350.000</span>
                              </div>
                              <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                                <span>Beli Tiket</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* STEP 2: Click Beli Sekarang */}
                        {st.number === 2 && (
                          <div className="space-y-2.5">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <span className="text-xs font-black text-slate-900 block">Soundrenaline Live Fest 2026</span>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-blue-600" /> 24 Okt 2026
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-red-500" /> GBK Senayan
                                </span>
                              </div>
                            </div>

                            {/* Button Beli Sekarang highlighted */}
                            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-between border-2 border-blue-500">
                              <div>
                                <span className="text-[10px] opacity-80 block">Tiket Resmi Tersedia</span>
                                <span className="text-xs font-black">Beli Sekarang / Pesan</span>
                              </div>
                              <span className="text-[11px] font-black bg-white text-blue-700 px-3 py-1 rounded-lg">
                                Klik Disini ✓
                              </span>
                            </div>
                          </div>
                        )}

                        {/* STEP 3: Login atau Register */}
                        {st.number === 3 && (
                          <div className="space-y-2.5">
                            {/* Tab Switcher */}
                            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs font-bold">
                              <span className="py-1 rounded-lg bg-white text-blue-700 shadow-xs flex items-center justify-center gap-1">
                                <LogIn className="w-3 h-3" /> Masuk (Login)
                              </span>
                              <span className="py-1 rounded-lg text-slate-500 flex items-center justify-center gap-1">
                                <UserPlus className="w-3 h-3" /> Daftar (Register)
                              </span>
                            </div>

                            {/* Form Input Preview */}
                            <div className="space-y-1.5">
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                                Email: <span className="font-bold text-slate-900">user@metix.id</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                                Password: <span className="font-bold text-slate-900">••••••••••</span>
                              </div>
                            </div>

                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Belum punya akun? Klik tab <b>Register</b> untuk buat akun baru.</span>
                            </div>
                          </div>
                        )}

                        {/* STEP 4: Pilih Jenis Tiket & Jumlah Kuantitas */}
                        {st.number === 4 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 block">Pilih Kategori & Jumlah:</span>

                            {/* Selected Ticket Category with Counter */}
                            <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-blue-600 flex items-center justify-between shadow-xs">
                              <div>
                                <span className="text-xs font-black text-slate-900 block">VIP Front Row Pass</span>
                                <span className="text-[10px] text-blue-700 font-bold">Rp 750.000 / tiket</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-black">
                                <span>-</span>
                                <span className="bg-white text-blue-700 px-1.5 rounded">2</span>
                                <span>+</span>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between opacity-60 text-xs">
                              <span className="text-slate-700 font-medium">Regular Festival Pass</span>
                              <span className="text-slate-400 font-bold">Pilih</span>
                            </div>

                            <div className="text-right text-[11px] font-bold text-slate-700 pt-1">
                              Subtotal (2 Tiket): <span className="text-blue-600 font-black">Rp 1.500.000</span>
                            </div>
                          </div>
                        )}

                        {/* STEP 5: Data Pemesan (Autofill dari Akun) */}
                        {st.number === 5 && (
                          <div className="space-y-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Autofill dari Profil Akun Berhasil ✓</span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-bold text-slate-800 truncate">Budi Santoso (KTP Terisi)</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">@</span>
                                <span className="font-bold text-slate-800 truncate">budi.santoso@email.com</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-bold text-slate-800">+62 812-3456-7890</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STEP 6: Click Pilih Metode Bayar */}
                        {st.number === 6 && (
                          <div className="space-y-2.5">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                              <div className="flex justify-between text-slate-500">
                                <span>2x VIP Front Row</span>
                                <span className="font-bold text-slate-800">Rp 1.500.000</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Biaya Layanan</span>
                                <span className="font-bold text-slate-800">Rp 10.000</span>
                              </div>
                              <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-900">
                                <span>Total Tagihan:</span>
                                <span className="text-blue-600">Rp 1.510.000</span>
                              </div>
                            </div>

                            {/* Active Action Button highlighted */}
                            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-between border-2 border-blue-400 cursor-pointer">
                              <span className="text-xs font-black">Pilih Metode Bayar</span>
                              <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-md">
                                Klik Lanjut &rarr;
                              </span>
                            </div>
                          </div>
                        )}

                        {/* STEP 7: Pilih Metode Bayar Rekomendasi (QRIS) */}
                        {st.number === 7 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 block">Pilihan Saluran Pembayaran:</span>

                            {/* QRIS Recommended Option */}
                            <div className="p-2.5 rounded-xl bg-blue-50 border-2 border-blue-600 flex items-center justify-between shadow-xs">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-900">QRIS Instan</span>
                                    <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded">
                                      Rekomendasi ⭐
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">Semua Bank & E-Wallet</span>
                                </div>
                              </div>
                              <div className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-500 opacity-60">
                              <span className="flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5" /> Virtual Account Bank
                              </span>
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                            </div>
                          </div>
                        )}

                        {/* STEP 8: Bayar & Konfirmasi */}
                        {st.number === 8 && (
                          <div className="space-y-2 text-center py-1">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-black text-blue-700">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Sisa Waktu Bayar: 14:59</span>
                            </div>

                            {/* QR Code Graphic Box */}
                            <div className="w-24 h-24 rounded-xl bg-white border-2 border-slate-300 mx-auto p-1.5 shadow-sm flex flex-col items-center justify-center">
                              <QrCode className="w-16 h-16 text-slate-900" />
                              <span className="text-[8px] font-black text-slate-600 tracking-wider">QRIS RESMI</span>
                            </div>

                            <div className="text-xs">
                              <span className="text-slate-500 block text-[10px]">Total yang Harus Dibayar:</span>
                              <span className="font-black text-slate-900 text-sm">Rp 1.510.000</span>
                            </div>
                          </div>
                        )}

                        {/* STEP 9: Jika Merchant Tidak Keluar (Solusi Tiket Saya) */}
                        {st.number === 9 && (
                          <div className="space-y-2">
                            {/* Fake Navbar Header */}
                            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                              <span>Beranda</span>
                              <span>Event</span>
                              <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Tiket Saya (1)</span>
                            </div>

                            {/* Transaction Card with Status Pending */}
                            <div className="p-2.5 rounded-xl bg-amber-50/80 border-2 border-amber-300 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-900">#MTX-88219 (Soundrenaline)</span>
                                <span className="text-[9px] font-black text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                                  Menunggu Bayar
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">Merchant tertutup? Lanjutkan disini:</p>
                              <div className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-xs text-center shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                                <RefreshCw className="w-3 h-3" />
                                <span>Bayar Sekarang (Buka QRIS)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* STEP 10: Tiket Terbit */}
                        {st.number === 10 && (
                          <div className="space-y-2 text-center py-0.5">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>STATUS: LUNAS & TERVERIFIKASI</span>
                            </div>

                            {/* E-Ticket Pass Card */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] font-black text-slate-900">
                                <span>E-Pass: Soundrenaline 2026</span>
                                <span className="text-blue-600">VIP Gate A</span>
                              </div>
                              <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 mx-auto p-1 flex items-center justify-center shadow-2xs">
                                <QrCode className="w-12 h-12 text-slate-900" />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 block tracking-widest">
                                #MTX-VIP-99201-VALID
                              </span>
                            </div>

                            <div className="p-1.5 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh PDF E-Tiket Resmi</span>
                            </div>
                          </div>
                        )}

                        {/* Interactive Highlight Footer on Mockup */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>{st.mockupHighlight}</span>
                          <span className="text-blue-600 font-bold">Metix App ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};
