'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Ticket,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Check,
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
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarNavRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  const steps = [
    {
      number: 1,
      title: 'Click Beli Tiket',
      subtitle: 'Jelajahi dan pilih event konser favorit Anda di halaman beranda.',
      content:
        'Buka halaman utama Metix dan temukan konser musik, festival, atau acara favorit yang ingin Anda tonton. Anda bisa memanfaatkan fitur pencarian artis, filter kategori musik, atau langsung menekan tombol "Beli Tiket" pada kartu event yang Anda inginkan.',
      image: '/guide/Cara_beli_tiket.png',
      tag: 'Langkah 1',
    },
    {
      number: 2,
      title: 'Click Beli Sekarang',
      subtitle: 'Masuk ke halaman detail acara dan klik tombol "Beli Sekarang".',
      content:
        'Pada halaman detail event, Anda dapat melihat informasi lengkap mengenai jadwal konser, lokasi panggung venue, daftar artis pengisi acara (lineup), serta denah panggung. Jika sudah mantap, klik tombol utama "Beli Sekarang" atau "Pesan Tiket" untuk lanjut.',
      image: '/guide/Cara_beli_sekarang.png',
      tag: 'Langkah 2',
    },
    {
      number: 3,
      title: 'Login atau Register Akun',
      subtitle: 'Masuk ke akun Anda atau daftar baru jika belum memiliki akun.',
      content:
        'Untuk menjamin kepemilikan tiket dan barcode resmi, Anda wajib masuk ke akun Metix. Jika sudah punya akun, cukup masukkan Email dan Password Anda untuk Login. Jika belum memiliki akun, klik tombol "Daftar / Register" dan lengkapi Nama, Email, dan Password dalam 30 detik.',
      image: '/guide/Login_atau_register.png',
      tag: 'Langkah 3',
    },
    {
      number: 4,
      title: 'Pilih Jenis Tiket & Jumlah',
      subtitle: 'Tentukan kategori tiket (VIP / Festival) dan berapa lembar yang dipesan.',
      content:
        'Pilih jenis tiket yang tersedia (misalnya VIP Front Row, Festival Regular, atau Tribune Pass). Tentukan jumlah tiket yang ingin Anda pesan dengan menekan tombol (+) atau (-). Sistem akan secara otomatis menghitung subtotal pesanan Anda.',
      image: '/guide/Pilih_jenis_tiket.png',
      tag: 'Langkah 4',
    },
    {
      number: 5,
      title: 'Data Pemesan (Autofill dari Akun)',
      subtitle: 'Identitas pemesan terisi otomatis dari profil akun yang telah masuk.',
      content:
        'Karena Anda telah login, formulir data pemesan tiket (Nama Lengkap, Nomor WhatsApp, dan Alamat Email) akan langsung terisi secara otomatis (autofill) dari profil akun Anda. Anda cukup memastikan data sudah valid agar pengiriman E-Tiket berjalan lancar.',
      image: '/guide/data_pemesanan.png',
      tag: 'Langkah 5',
    },
    {
      number: 6,
      title: 'Click Pilih Metode Bayar',
      subtitle: 'Periksa ringkasan rincian tagihan dan klik "Pilih Metode Bayar".',
      content:
        'Tinjau kembali rincian tiket yang dipesan, harga total, dan data identitas pemesan. Jika semua informasi sudah benar, klik tombol checkout biru "Pilih Metode Bayar" di bagian bawah untuk membuka gerbang pembayaran resmi.',
      image: '/guide/cara_pilih_metode.png',
      tag: 'Langkah 6',
    },
    {
      number: 7,
      title: 'Pilih Metode Bayar Rekomendasi (QRIS)',
      subtitle: 'Gunakan QRIS untuk proses pembayaran otomatis tercepat tanpa repot.',
      content:
        'Pada daftar saluran pembayaran, pilih opsi "QRIS Instan" (Sangat Direkomendasikan). QRIS dapat di-scan dari seluruh aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI, dll.) dan seluruh E-Wallet resmi (GoPay, OVO, Dana, ShopeePay) dengan verifikasi otomatis detik itu juga.',
      image: '/guide/pilih_metode_bayar.png',
      tag: 'Langkah 7',
    },
    {
      number: 8,
      title: 'Bayar & Konfirmasi Transaksi',
      subtitle: 'Scan kode QRIS di layar Anda menggunakan aplikasi bank / e-wallet.',
      content:
        'Layar akan menampilkan kode QRIS resmi beserta hitung mundur waktu pembayaran (countdown timer) dan total tagihan yang pas. Buka aplikasi m-banking atau e-wallet di ponsel Anda, scan kode QR tersebut, lalu konfirmasi pembayaran.',
      image: '/guide/merchant_qris.png',
      tag: 'Langkah 8',
    },
    {
      number: 9,
      title: 'Jika Merchant Tidak Keluar (Solusi)',
      subtitle: 'Buka menu "Tiket Saya" dan selesaikan pembayaran dari daftar pesanan.',
      content:
        'Jika pop-up merchant atau layar QRIS tidak muncul karena terhalang pop-up blocker atau browser tertutup, tenang! Pesanan Anda tersimpan aman. Cukup klik menu "Tiket Saya" di navigasi atas, cari transaksi yang berstatus "Menunggu Pembayaran", lalu klik "Bayar Sekarang" untuk membuka kembali kode bayar.',
      image: '/guide/merchant_qris.png',
      tag: 'Langkah 9',
    },
    {
      number: 10,
      title: 'Tiket Terbit (Siap Digunakan)',
      subtitle: 'E-Tiket resmi dengan QR Code unik langsung aktif untuk scan di gate event.',
      content:
        'Setelah pembayaran berhasil diverifikasi sistem, status pesanan otomatis berubah menjadi "LUNAS". E-Tiket resmi ber-QR Code unik langsung dapat diakses di menu "Tiket Saya" dan dikirimkan ke email Anda. Cukup perlihatkan QR code di ponsel Anda ke petugas scanner saat memasuki venue acara!',
      image: '/guide/tiket_terbit.png',
      tag: 'Langkah 10',
    },
  ];

  // Auto-scroll sidebar navigation list to keep active step visible in viewport
  useEffect(() => {
    if (!isOpen) return;
    const activeButton = document.getElementById(`sidebar-step-btn-${activeStep}`);
    const navContainer = sidebarNavRef.current;
    if (activeButton && navContainer) {
      const navRect = navContainer.getBoundingClientRect();
      const btnRect = activeButton.getBoundingClientRect();
      if (btnRect.top < navRect.top + 8) {
        navContainer.scrollTop -= navRect.top + 8 - btnRect.top;
      } else if (btnRect.bottom > navRect.bottom - 8) {
        navContainer.scrollTop += btnRect.bottom - (navRect.bottom - 8);
      }
    }
  }, [activeStep, isOpen]);

  // Click on sidebar step: smoothly scroll right column to target step
  const scrollToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    isProgrammaticScroll.current = true;
    const container = mainRef.current;
    const element = document.getElementById(`step-guide-${stepNumber}`);
    if (container && element) {
      const containerRect = container.getBoundingClientRect();
      const elRect = element.getBoundingClientRect();
      const targetScroll = container.scrollTop + (elRect.top - containerRect.top) - 16;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 700);
    }
  };

  // Scrollspy: Detect which step is visible on screen as user scrolls / drags right column
  const handleMainScroll = () => {
    if (isProgrammaticScroll.current || !mainRef.current) return;
    const container = mainRef.current;
    const containerRect = container.getBoundingClientRect();

    // 1. If at or near the very top, always snap to Step 1
    if (container.scrollTop < 80) {
      setActiveStep(1);
      return;
    }

    // 2. If at or near the bottom, snap to Step 10
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 80) {
      setActiveStep(10);
      return;
    }

    // 3. Find matching step whose top has crossed the upper viewing threshold (160px)
    const detectionLine = containerRect.top + 160;
    let matchedStep = 1;
    for (const st of steps) {
      const el = document.getElementById(`step-guide-${st.number}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        if (elRect.top <= detectionLine) {
          matchedStep = st.number;
        }
      }
    }
    setActiveStep((prev) => (prev !== matchedStep ? matchedStep : prev));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 md:p-6 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background Soft Glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4" />

      {/* Main Wide Modal Container (Tema LIGHT Elegan, Bersih, & Premium) */}
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-white text-slate-800 rounded-[32px] border border-slate-200/90 shadow-[0_25px_80px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Fixed Header Bar (Soft, Elegan, & Harmonis) */}
        <header className="shrink-0 h-16 sm:h-20 px-6 sm:px-8 border-b border-slate-100/90 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/40 backdrop-blur-xl flex items-center justify-between z-30">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shadow-xs ring-4 ring-blue-50/50 shrink-0">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  Panduan Resmi
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • E-Ticketing Guide
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-0.5">
                Cara Mudah Beli Tiket di Metix
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Pesan Tiket Button in Header (Flat Design) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOrderTicket();
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-none"
            >
              <span>Pesan Tiket Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Circular Close Button X */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 flex items-center justify-center transition-all duration-200 hover:rotate-90 active:scale-95 cursor-pointer shadow-2xs"
              aria-label="Tutup Panduan"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* Modal Body Content (Responsive Two-Column Split: Sticky Sidebar + Long Scrollable Steps) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT COLUMN: Sticky Info & 10 Steps Stepper (Mengikuti dan menyesuaikan saat di-scroll) */}
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

              {/* Stepper Navigation List (Auto-scrolls & tracks visible step) */}
              <div
                ref={sidebarNavRef}
                className="space-y-1 hidden sm:block max-h-[360px] xl:max-h-[420px] overflow-y-auto pr-1 scroll-smooth"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 sticky top-0 bg-slate-50/95 py-0.5 z-10">
                  Daftar 10 Langkah:
                </p>
                {steps.map((st) => (
                  <button
                    key={st.number}
                    id={`sidebar-step-btn-${st.number}`}
                    type="button"
                    onClick={() => scrollToStep(st.number)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer group ${activeStep === st.number
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-600 ring-2 ring-blue-400/30'
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

            {/* Bottom CTA on Sticky Sidebar (Flat Design) */}
            <div className="pt-4 hidden lg:block border-t border-slate-200/80 mt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOrderTicket();
                }}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
              >
                <Ticket className="w-4 h-4" />
                <span>Pesan Tiket Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* RIGHT COLUMN: Long Scrollable Step-by-Step with Auto Scrollspy Detection */}
          <main
            ref={mainRef}
            onScroll={handleMainScroll}
            className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto space-y-12 scroll-smooth bg-white"
          >
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

            {/* 10 STEPS LOOP WITH COMPACT IMAGES */}
            <div className="space-y-12">
              {steps.map((st) => (
                <section
                  key={st.number}
                  id={`step-guide-${st.number}`}
                  className="space-y-4 scroll-mt-6"
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

                  {/* Step Illustration Image (Agak Kecil, Menyesuaikan, Tanpa Bingkai HP) */}
                  {st.image && (
                    <div className="pl-11 max-w-md sm:max-w-lg">
                      <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50/70 p-2 shadow-xs hover:shadow-md transition-all group">
                        <img
                          src={st.image}
                          alt={`Panduan ${st.title}`}
                          className="w-full max-h-[260px] sm:max-h-[300px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
