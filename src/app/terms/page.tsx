'use me';
'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { AuthModal } from '@/components/public/AuthModal';
import { useLanguage } from '@/hooks/useLanguage';

export default function TermsPage() {
  const { lang, setLang } = useLanguage('id');
  const [activeTab, setActiveTab] = useState<string>('definisi');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Bilingual Navigation Items
  const navItems = [
    { id: 'definisi', label: lang === 'id' ? 'Definisi' : 'Definitions' },
    { id: 'umum', label: lang === 'id' ? 'Ketentuan Umum' : 'General Terms' },
    { id: 'e-ticket', label: lang === 'id' ? 'Pembelian, Pembayaran & E-Ticket' : 'Purchase, Payment & E-Tickets' },
    { id: 'tanggung-jawab', label: lang === 'id' ? 'Tanggung Jawab' : 'Responsibilities' },
    { id: 'hak-cipta', label: lang === 'id' ? 'Hak Kekayaan Intelektual' : 'Intellectual Property' },
    { id: 'pemasaran', label: lang === 'id' ? 'Materi Pemasaran' : 'Marketing Materials' },
    { id: 'sengketa', label: lang === 'id' ? 'Penyelesaian Sengketa' : 'Dispute Resolution' },
    { id: 'lain-lain', label: lang === 'id' ? 'Lain - Lain' : 'Miscellaneous' },
  ];

  // Bilingual Content Dictionary
  const content = {
    id: {
      heroTitle: 'Syarat Dan Ketentuan',
      heroUpdated: 'Diperbarui: 23 September 2026 • 20:00 • GMT +7',
      welcomeTitle: 'Selamat Datang di Metix Indonesia!',
      welcomeIntro1: 'Terima kasih sudah menyempatkan waktu untuk membaca dan mempelajari segala sesuatu yang berkaitan dengan Metix Indonesia. Sebelumnya, kenalan dulu yuk dengan Metix!',
      welcomeIntro2: 'Metix sendiri merupakan one stop solution untuk kebutuhan acara keren kamu, mulai dari pembuatan acara yang akan kamu jual sampai dengan pendaftaran Event Kamu di website resmi Kami. Metix Indonesia berkedudukan di Indonesia, dan kami telah menjangkau serta berkolaborasi dengan penyelenggara acara seluruh Indonesia hingga luar negeri. Yuk saatnya cari atau buat event impianmu! Kami akan selalu siap membantu.',
      noticeBold: 'Dengan mengakses website ini kami berasumsi bahwa kamu telah setuju dengan seluruh syarat dan ketentuan yang berlaku secara penuh.',
      noticeSub: 'Jangan menggunakan atau bertransaksi di website ini jika Anda tidak setuju.',
      sections: {
        definisi: {
          title: 'Definisi',
          p1: '"Customer, Pengguna, Kamu dan Anda" adalah seluruh pengguna layanan Metix Indonesia khususnya para pembeli tiket yang melakukan transaksi atau pembelian hanya dari website resmi Metix Indonesia.',
          p2: '"Data Pribadi" adalah data pribadi Anda yang Kami kumpulkan dan simpan yang mengidentifikasikan atau dapat digunakan untuk mengidentifikasi Anda baik yang diberikan oleh Anda dan/atau yang kami kumpulkan dari Anda maupun pihak ketiga. Penggunaan data pribadi ini akan kami atur dalam "Kebijakan Privasi".',
          p3: '"E-Ticket" adalah bukti resmi kepemilikan tiket dalam bentuk digital yang diterbitkan oleh platform Metix setelah pembayaran terverifikasi.',
        },
        umum: {
          title: 'Ketentuan Umum',
          text: 'Seluruh transaksi penjualan tiket di platform Metix tunduk pada hukum yang berlaku di Republik Indonesia. Pengguna wajib memberikan informasi data pribadi yang benar, akurat, dan terbaru saat melakukan pembelian atau pendaftaran akun.',
        },
        eTicket: {
          title: 'Pembelian, Pembayaran & E-Ticket',
          list: [
            'Pembayaran tiket wajib dilakukan melalui metode pembayaran resmi yang disediakan di platform Metix.',
            'E-Ticket yang telah diterbitkan akan dikirimkan melalui email dan dapat diakses kapan saja melalui akun Metix pengguna.',
            'Tiket yang telah dibeli tidak dapat ditukar atau dikembalikan uangnya (non-refundable), kecuali jika acara dibatalkan secara resmi oleh penyelenggara.',
          ],
        },
        tanggungJawab: {
          title: 'Tanggung Jawab',
          text: 'Metix bertanggung jawab atas keabsahan transaksi digital di platform resmi Kami. Metix tidak bertanggung jawab atas perubahan jadwal, lokasi, atau kualitas konten acara yang merupakan tanggung jawab penuh dari pihak Promotor / Penyelenggara Event.',
        },
        hakCipta: {
          title: 'Hak Kekayaan Intelektual',
          text: 'Seluruh merk dagang, logo, desain UI, dan kode program Metix adalah hak cipta terdaftar milik Metix Indonesia. Dilarang meniru, menyalin, atau memperbanyak tanpa izin tertulis dari Kami.',
        },
        pemasaran: {
          title: 'Materi Pemasaran',
          text: 'Materi promosi dan gambar acara yang diunggah di situs merupakan hak milik atau lisensi dari masing-masing penyelenggara acara.',
        },
        sengketa: {
          title: 'Penyelesaian Sengketa',
          text: 'Segala perselisihan yang timbul dari penggunaan layanan Metix akan diselesaikan secara musyawarah mufakat. Apabila tidak tercapai mufakat, perselisihan akan diselesaikan melalui Badan Arbitrase atau Pengadilan Negeri di Indonesia.',
        },
        lainLain: {
          title: 'Lain - Lain',
          text: 'Metix berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku serta merta setelah diunggah di halaman ini.',
        },
      },
    },
    en: {
      heroTitle: 'Terms & Conditions',
      heroUpdated: 'Last Updated: September 23, 2026 • 20:00 • GMT +7',
      welcomeTitle: 'Welcome to Metix Indonesia!',
      welcomeIntro1: 'Thank you for taking the time to read and learn about everything related to Metix Indonesia. First, let us introduce Metix!',
      welcomeIntro2: 'Metix is a one-stop solution for all your event needs, ranging from creating and selling event tickets to registering your events on our official website. Metix Indonesia is based in Indonesia, and we have collaborated with event organizers across Indonesia and abroad. Explore or create your dream event with us!',
      noticeBold: 'By accessing this website, we assume you accept these terms and conditions in full.',
      noticeSub: 'Do not continue to use or transact on this website if you do not agree with all the terms stated.',
      sections: {
        definisi: {
          title: 'Definitions',
          p1: '"Customer, User, You" refers to all users of Metix Indonesia services, specifically ticket buyers purchasing through the official Metix Indonesia platform.',
          p2: '"Personal Data" refers to your personal information collected and stored by us that identifies or can be used to identify you, as governed under our "Privacy Policy".',
          p3: '"E-Ticket" refers to the official digital proof of ticket ownership issued by the Metix platform after verified payment.',
        },
        umum: {
          title: 'General Terms',
          text: 'All ticket sales transactions on the Metix platform are governed by the applicable laws of the Republic of Indonesia. Users must provide truthful, accurate, and up-to-date personal information during purchases or account registration.',
        },
        eTicket: {
          title: 'Purchase, Payment & E-Tickets',
          list: [
            'Ticket payments must be completed through official payment channels provided on the Metix platform.',
            'Issued E-Tickets will be delivered via email and accessible anytime through the user’s Metix account.',
            'Purchased tickets are non-refundable and non-exchangeable, unless the event is officially cancelled by the Event Organizer.',
          ],
        },
        tanggungJawab: {
          title: 'Responsibilities',
          text: 'Metix is responsible for digital transaction validity on our official platform. Metix is not liable for schedule changes, venue shifts, or event content quality, which remain the sole responsibility of the Event Organizer / Promoter.',
        },
        hakCipta: {
          title: 'Intellectual Property',
          text: 'All trademarks, logos, UI designs, and software code on Metix are registered copyright of Metix Indonesia. Reproduction, copying, or imitation without prior written consent is strictly prohibited.',
        },
        pemasaran: {
          title: 'Marketing Materials',
          text: 'Promotional materials and event graphics uploaded on the site remain the intellectual property or licensed content of their respective Event Organizers.',
        },
        sengketa: {
          title: 'Dispute Resolution',
          text: 'Any disputes arising from the use of Metix services shall first be settled through amicable negotiation. If consensus cannot be reached, the dispute will be resolved through arbitration or district courts in Indonesia.',
        },
        lainLain: {
          title: 'Miscellaneous',
          text: 'Metix reserves the right to amend these Terms and Conditions at any time without prior notice. Amendments take immediate effect upon being published on this page.',
        },
      },
    },
  };

  const curr = content[lang];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          onOpenAuthModal={handleOpenAuthModal}
          lang={lang}
          onLangChange={setLang}
        />

        {/* Hero Section Banner */}
        <div className="bg-blue-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {curr.heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                {curr.heroUpdated}
              </p>
            </div>

            {/* Language Switcher Pill Toggle */}
            <div className="flex items-center bg-blue-900/40 backdrop-blur-xs p-1 rounded-full border border-blue-500/40 w-fit">
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('id')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === 'id'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Indonesia
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sticky Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs sm:text-sm transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white font-extrabold shadow-lg shadow-blue-600/30'
                      : 'text-slate-800 font-bold hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 leading-relaxed">
              
              {/* Introduction Banner */}
              <div className="space-y-4 pb-6 border-b border-slate-100">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {curr.welcomeTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {curr.welcomeIntro1}
                </p>
                <p className="text-xs sm:text-sm text-slate-600">
                  {curr.welcomeIntro2}
                </p>
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-800 space-y-1.5">
                  <p className="font-bold text-blue-950">
                    {curr.noticeBold}
                  </p>
                  <p className="text-slate-600">
                    {curr.noticeSub}
                  </p>
                </div>
              </div>

              {/* Detailed Content Sections */}
              <div className="space-y-10 text-xs sm:text-sm text-slate-700">
                
                {/* 1. Definisi */}
                <section id="definisi" className="space-y-3 pt-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.definisi.title}
                  </h3>
                  <div className="space-y-3 text-slate-600">
                    <p>{curr.sections.definisi.p1}</p>
                    <p>{curr.sections.definisi.p2}</p>
                    <p>{curr.sections.definisi.p3}</p>
                  </div>
                </section>

                {/* 2. Ketentuan Umum */}
                <section id="umum" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.umum.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.umum.text}
                  </p>
                </section>

                {/* 3. Pembelian, Pembayaran & E-Ticket */}
                <section id="e-ticket" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.eTicket.title}
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600">
                    {curr.sections.eTicket.list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>

                {/* 4. Tanggung Jawab */}
                <section id="tanggung-jawab" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.tanggungJawab.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.tanggungJawab.text}
                  </p>
                </section>

                {/* 5. Hak Kekayaan Intelektual */}
                <section id="hak-cipta" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.hakCipta.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.hakCipta.text}
                  </p>
                </section>

                {/* 6. Materi Pemasaran */}
                <section id="pemasaran" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.pemasaran.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.pemasaran.text}
                  </p>
                </section>

                {/* 7. Penyelesaian Sengketa */}
                <section id="sengketa" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.sengketa.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.sengketa.text}
                  </p>
                </section>

                {/* 8. Lain - Lain */}
                <section id="lain-lain" className="space-y-3 pt-8 border-t border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {curr.sections.lainLain.title}
                  </h3>
                  <p className="text-slate-600">
                    {curr.sections.lainLain.text}
                  </p>
                </section>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
