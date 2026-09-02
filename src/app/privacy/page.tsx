'use me';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Mail,
  Building2,
  Calendar,
  KeyRound,
  Share2,
  Search,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string>('pengumpulan');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections = [
    { id: 'pengumpulan', title: '1. Pengumpulan Informasi Pribadi', icon: Database },
    { id: 'penggunaan', title: '2. Penggunaan Informasi Data', icon: UserCheck },
    { id: 'keamanan', title: '3. Keamanan & Keheningan Data', icon: Lock },
    { id: 'pihak-ketiga', title: '4. Pembagian Data Pihak Ketiga', icon: Share2 },
    { id: 'hak-pengguna', title: '5. Hak & Pengendalian Pengguna', icon: KeyRound },
    { id: 'cookies', title: '6. Cookies & Pelacakan', icon: Eye },
    { id: 'kontak', title: '7. Kontak & Pengaduan Privasi', icon: Mail },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <img src="/mitex.png" alt="METIX Logo" className="h-7 w-auto object-contain" />
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase hidden sm:inline-block">
              Privacy Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/terms"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-all"
          >
            Syarat & Ketentuan
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-12 pb-10 px-4 sm:px-8 max-w-6xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Kebijakan Privasi Resmi & SOP Perlindungan Data (UU PDP)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Perlindungan Data & Privasi Pengguna Metix
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Kami berkomitmen penuh menjaga privasi dan keamanan data pribadi Anda sesuai Standar Operasional Prosedur (SOP) dan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Terakhir Diperbarui: <strong>September 2026</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Status Regulasi: <strong>Terverifikasi & Kompatibel</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-24 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        {/* Sidebar Table of Contents Navigation */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="sticky top-20 bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-slate-800 space-y-2 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
              <span>Daftar Isi SOP</span>
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </h3>

            <div className="space-y-1 pt-1">
              {sections.map((sec) => {
                const IconComp = sec.icon;
                const isActive = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Document */}
        <section className="lg:col-span-3 space-y-8">
          {/* Section 1: Pengumpulan Informasi */}
          <div id="pengumpulan" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">1. Pengumpulan Informasi Pribadi</h2>
                <p className="text-xs text-slate-400 font-medium">Jenis data yang kami kumpulkan saat Anda mendaftar & bertransaksi</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Platform <strong>Metix</strong> mengumpulkan informasi pribadi dari Anda saat Anda membuat akun, memesan tiket event, mendaftar sebagai Event Organizer (EO), atau menghubungi pusat layanan kami. Jenis data yang kami kumpulkan meliputi:
              </p>

              <ul className="space-y-2 pl-4 list-disc text-slate-300">
                <li>
                  <strong className="text-white">Identitas Pengguna:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp, tanggal lahir, dan jenis kelamin.
                </li>
                <li>
                  <strong className="text-white">Verifikasi NIK KTP:</strong> Nomor Induk Kependudukan (NIK) hanya diminta untuk event tertentu yang memerlukan verifikasi identitas resmi pemegang tiket (penegakan anti-calo & verifikasi gate scanner).
                </li>
                <li>
                  <strong className="text-white">Data Transaksi & Pembayaran:</strong> Rincian nomor order, tiket yang dibeli, serta metode pembayaran yang dipilih (Rincian nomor kartu kredit atau akun bank diproses secara aman oleh Payment Gateway DOKU dan tidak disimpan secara mentah di server Metix).
                </li>
                <li>
                  <strong className="text-white">Data Perangkat & Log Akses:</strong> Alamat IP, jenis peramban (browser), sistem operasi, serta data waktu akses demi keamanan jaringan.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Penggunaan Informasi */}
          <div id="penggunaan" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">2. Penggunaan Informasi Data</h2>
                <p className="text-xs text-slate-400 font-medium">Tujuan dan pemanfaatan data untuk kelancaran layanan tiket</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Seluruh data yang kami kumpulkan digunakan secara ketat untuk kepentingan operasional penerbitan tiket dan peningkatan layanan pengguna:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs block">🎫 Penerbitan & Validasi E-Ticket</span>
                  <p className="text-xs text-slate-400">
                    Membuat E-Ticket resmi lengkap dengan QR Code unik dan mengirimkan resi pembayaran ke email Anda.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs block">📱 Scan Gate Check-in Event</span>
                  <p className="text-xs text-slate-400">
                    Memfasilitasi petugas scanner venue dalam mencocokkan identitas tiket pada saat memasuki area acara.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs block">🔔 Notifikasi & Pengumuman Acara</span>
                  <p className="text-xs text-slate-400">
                    Mengirimkan pemberitahuan penting terkait perubahan jadwal event, penundaan, atau instruksi penukaran gelang venue.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-white text-xs block">🛡️ Pencegahan Penipuan & Calo</span>
                  <p className="text-xs text-slate-400">
                    Mendeteksi pembelian massal otomatis (botting) dan transaksi mencurigakan demi menjaga keadilan kuota tiket.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Keamanan Data */}
          <div id="keamanan" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">3. Keamanan & Keheningan Data (SSL & ENKRIPSI)</h2>
                <p className="text-xs text-slate-400 font-medium">Standar perlindungan teknis dan enkripsi database</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Keamanan data Anda adalah prioritas utama Metix. Kami menerapkan perlindungan berlapisan untuk mencegah akses tidak sah, kebocoran, atau pengubahan data:
              </p>

              <ul className="space-y-2 pl-4 list-disc text-slate-300">
                <li>
                  <strong className="text-white">Enkripsi SSL/TLS (HTTPS):</strong> Seluruh komunikasi data antara peramban Anda dan server Metix dilindungi enkripsi 256-bit kelas perbankan.
                </li>
                <li>
                  <strong className="text-white">Penyimpanan Kata Sandi Terenkripsi:</strong> Password akun disimpan menggunakan algoritma Hashing Bcrypt yang tidak dapat dibaca oleh staf internal sekalipun.
                </li>
                <li>
                  <strong className="text-white">Akses Terbatas (Role-Based Access Control):</strong> Hanya staf berwenang yang memiliki izin khusus untuk mengakses data transaksi untuk keperluan penanganan kendala pengguna.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Pembagian Data Pihak Ketiga */}
          <div id="pihak-ketiga" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">4. Pembagian Data Kepada Pihak Ketiga</h2>
                <p className="text-xs text-slate-400 font-medium">Mitra resmi yang bekerjasama dengan Metix</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Metix <strong>TIDAK PERNAH menjual atau menyewakan</strong> data pribadi Anda kepada pihak ketiga untuk kepentingan pemasaran tanpa izin Anda. Data hanya dibagikan kepada mitra resmi berikut untuk keperluan pelaksanaan acara:
              </p>

              <div className="space-y-2">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-xs">Event Organizer (EO) Penyelenggara Event</span>
                    <p className="text-xs text-slate-400">
                      Nama dan data pemegang tiket dibagikan kepada EO penyelenggara event terkait khusus untuk keperluan manifes penonton dan pintu masuk venue.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-xs">Payment Gateway Resmi (DOKU)</span>
                    <p className="text-xs text-slate-400">
                      Data transaksi dikirimkan secara terenkripsi ke DOKU untuk memproses verifikasi transaksi pembayaran online.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Hak Pengguna */}
          <div id="hak-pengguna" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">5. Hak & Pengendalian Data Pengguna</h2>
                <p className="text-xs text-slate-400 font-medium">Hak Anda atas data pribadi yang tersimpan</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>Sesuai dengan UU PDP, Anda memiliki hak penuh atas data pribadi Anda:</p>

              <ul className="space-y-2 pl-4 list-disc text-slate-300">
                <li><strong className="text-white">Hak Mengakses & Memperbarui:</strong> Anda dapat melihat dan mengubah informasi profil di menu Pengaturan Akun kapan saja.</li>
                <li><strong className="text-white">Hak Penghapusan Akun (Right to be Forgotten):</strong> Anda berhak mengajukan permohonan penghapusan akun dan data pribadi dari server Metix selama tidak ada kewajiban transaksi yang aktif.</li>
                <li><strong className="text-white">Hak Menolak Notifikasi Pemasaran:</strong> Anda dapat menghentikan berlangganan email rekomendasi event dengan mengeklik tombol *unsubscribe* di bagian bawah email.</li>
              </ul>
            </div>
          </div>

          {/* Section 6: Cookies */}
          <div id="cookies" className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">6. Penggunaan Cookies & Pelacakan Sesi</h2>
                <p className="text-xs text-slate-400 font-medium">Penggunaan data browser untuk pengalaman pengguna</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Metix menggunakan *Cookies* dan *Local Storage* peramban untuk menyimpan token login sesi Anda (`metix_token`) agar Anda tidak perlu mengetikkan kata sandi setiap kali berpindah halaman. Anda dapat mematikan fitur cookies pada pengaturan browser Anda, namun hal tersebut dapat menyebabkan beberapa fungsi situs tidak berjalan maksimal.
              </p>
            </div>
          </div>

          {/* Section 7: Kontak & Pengaduan */}
          <div id="kontak" className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-900/40 rounded-3xl p-6 sm:p-8 border border-blue-500/30 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">7. Kontak & Pengaduan Privasi</h2>
                <p className="text-xs text-blue-200 font-medium">Tim Layanan Perlindungan Data Metix</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <p>
                Jika Anda memiliki pertanyaan, saran, atau permohonan terkait pengurusan privasi data pribadi Anda, silakan hubungi tim Resmi kami melalui:
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Email Dukungan Privasi: <strong className="text-white">privacy@metix.id</strong> / <strong className="text-white">support@metix.id</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Kantor Operasional: <strong className="text-white">PT Metix Digital Indonesia — Jakarta, Indonesia</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-8 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 METIX Platform. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <span>•</span>
            <Link href="/privacy" className="text-blue-400 font-bold hover:underline">Kebijakan Privasi</Link>
            <span>•</span>
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
