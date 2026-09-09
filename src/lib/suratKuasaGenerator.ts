import jsPDF from 'jspdf';

export interface SuratKuasaData {
  // Pemberi Kuasa
  pemberiNama?: string;
  pemberiNik?: string;
  pemberiEmail?: string;
  pemberiPhone?: string;

  // Penerima Kuasa
  penerimaNama?: string;
  penerimaNik?: string;
  penerimaEmail?: string;
  penerimaPhone?: string;

  // Detail Tiket
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  ticketType?: string;
  ticketCode?: string;
  orderNumber?: string;

  // Dokumen Meta
  docCity?: string;
  docDate?: string;
  docNumber?: string;
  verificationCode?: string;

  // Mode Cetak Kosong
  isBlank?: boolean;
}

/**
 * Helper untuk generate dokumen resmi Surat Kuasa Transfer Tiket (A4 Portrait)
 */
export function generateSuratKuasaPdf(data: SuratKuasaData): void {
  const isBlank = Boolean(data.isBlank);

  // Buat dokumen jsPDF ukuran A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 210;
  const marginX = 16;
  const contentW = pageW - marginX * 2; // 178mm
  const rightX = marginX + contentW; // 194mm

  // Layout koordinat kolom & field
  const labelX = marginX + 5;
  const sepX = marginX + 38;
  const valX = marginX + 41;
  const col2LabelX = marginX + 94;
  const col2SepX = marginX + 124;
  const col2ValX = marginX + 127;

  // Helper fungsi untuk menghasilkan string titik yang rata presisi
  const makeDotLine = (startX: number, targetEndX: number, fontFam: string = 'helvetica', fontSty: string = 'normal', sizePt: number = 7.5): string => {
    doc.setFont(fontFam, fontSty);
    doc.setFontSize(sizePt);
    const availableWidth = targetEndX - startX;
    let dots = '';
    while (doc.getTextWidth(dots + '.') <= availableWidth) {
      dots += '.';
    }
    return dots;
  };

  // Garis titik-titik seragam dengan lebar presisi
  const dotsFull = makeDotLine(valX, rightX - 5, 'helvetica', 'normal', 8);
  const dotsCol1 = makeDotLine(valX, col2LabelX - 5, 'helvetica', 'normal', 7.5);
  const dotsCol2 = makeDotLine(col2ValX, rightX - 5, 'helvetica', 'normal', 7.5);

  const pNama = isBlank ? dotsFull : (data.pemberiNama || dotsFull);
  const pNik = isBlank ? dotsFull : (data.pemberiNik || dotsFull);
  const pEmail = isBlank ? dotsFull : (data.pemberiEmail || dotsFull);
  const pPhone = isBlank ? dotsFull : (data.pemberiPhone || dotsFull);

  const rNama = isBlank ? dotsFull : (data.penerimaNama || dotsFull);
  const rNik = isBlank ? dotsFull : (data.penerimaNik || dotsFull);
  const rEmail = isBlank ? dotsFull : (data.penerimaEmail || dotsFull);
  const rPhone = isBlank ? dotsFull : (data.penerimaPhone || dotsFull);

  const evTitle = isBlank ? dotsCol1 : (data.eventTitle || dotsCol1);
  const evDate = isBlank ? dotsCol1 : (data.eventDate || dotsCol1);
  const evLoc = isBlank ? dotsCol1 : (data.eventLocation || dotsCol1);
  const tkType = isBlank ? dotsCol2 : (data.ticketType || dotsCol2);
  const tkCode = isBlank ? dotsCol2 : (data.ticketCode || dotsCol2);
  const ordNo = isBlank ? dotsCol2 : (data.orderNumber || dotsCol2);

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const city = isBlank ? '........................' : (data.docCity || 'Jakarta');
  const dDate = isBlank ? '.................................... 20....' : (data.docDate || todayStr);

  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const docNo = data.docNumber || `SKT/MTX/${yearMonth}/${randomHex}`;
  const verifyCode = data.verificationCode || `VRF-${randomHex}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ==========================================
  // 1. KOP SURAT RESMI METIX (Y: 10 - 27)
  // ==========================================
  // Logo & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138); // Deep Navy #1e3a8a
  doc.text('METIX INDONESIA', marginX, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text('OFFICIAL DIGITAL TICKETING SYSTEM & LEGAL AUTHORIZATION', marginX, 19.5);

  // Kontak di Sebelah Kanan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PT Metix Digital Nusantara', rightX, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Portal Bantuan: support@metix.id | www.metix.id', rightX, 18, { align: 'right' });

  // Garis Pembatas Kop Surat
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.7);
  doc.line(marginX, 25, rightX, 25);

  doc.setDrawColor(217, 119, 6); // Amber / Gold
  doc.setLineWidth(0.3);
  doc.line(marginX, 26, rightX, 26);

  // ==========================================
  // 2. JUDUL DOKUMEN & NOMOR (Y: 31 - 42)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('SURAT KUASA PENGALIHAN / TRANSFER TIKET', pageW / 2, 33, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor Dokumen: ${docNo}`, pageW / 2, 38, { align: 'center' });

  // ==========================================
  // 3. PEMBUKA
  // ==========================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Yang bertanda tangan di bawah ini:', marginX, 45);

  // ==========================================
  // 4. KOTAK PEMBERI KUASA (Y: 48 - 77)
  // ==========================================
  const box1Y = 48;
  const box1H = 28;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, box1Y, contentW, box1H, 2, 2, 'FD');

  // Badge Header
  doc.setFillColor(224, 231, 255); // Indigo 100
  doc.rect(marginX, box1Y, 52, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 58, 138);
  doc.text('PEMBERI KUASA (Pemilik Tiket Asli)', marginX + 3, box1Y + 3.6);

  // Isi Pemberi Kuasa

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Baris 1: Nama
  doc.text('Nama Lengkap', labelX, box1Y + 10);
  doc.text(':', sepX, box1Y + 10);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(pNama, valX, box1Y + 10);

  // Baris 2: NIK
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Identitas', labelX, box1Y + 14.5);
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184); // Slate 400 note kecil
  doc.text('(NIK/Paspor)', labelX + 20.8, box1Y + 14.5);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(':', sepX, box1Y + 14.5);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(pNik, valX, box1Y + 14.5);

  // Baris 3: Email
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Alamat Email', labelX, box1Y + 19);
  doc.text(':', sepX, box1Y + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isBlank ? 148 : 30, isBlank ? 163 : 41, isBlank ? 184 : 59);
  doc.text(pEmail, valX, box1Y + 19);

  // Baris 4: Telepon
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Telepon / WhatsApp', labelX, box1Y + 23.5);
  doc.text(':', sepX, box1Y + 23.5);
  doc.setTextColor(isBlank ? 148 : 71, isBlank ? 163 : 85, isBlank ? 184 : 105);
  doc.text(pPhone, valX, box1Y + 23.5);

  // Penutup PEMBERI KUASA
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Selanjutnya dalam surat ini disebut sebagai PEMBERI KUASA.', marginX + 2, box1Y + 32);

  // ==========================================
  // 5. PENGHUBUNG & KOTAK PENERIMA KUASA (Y: 89 - 118)
  // ==========================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Dengan ini memberikan kuasa penuh dan sah kepada:', marginX, 87);

  const box2Y = 90;
  const box2H = 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, box2Y, contentW, box2H, 2, 2, 'FD');

  // Badge Header
  doc.setFillColor(209, 250, 229); // Emerald 100
  doc.rect(marginX, box2Y, 52, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text('PENERIMA KUASA (Penerima Tiket)', marginX + 3, box2Y + 3.6);

  // Isi Penerima Kuasa
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Baris 1: Nama
  doc.text('Nama Lengkap', labelX, box2Y + 10);
  doc.text(':', sepX, box2Y + 10);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(rNama, valX, box2Y + 10);

  // Baris 2: NIK
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Identitas', labelX, box2Y + 14.5);
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184); // Slate 400 note kecil
  doc.text('(NIK/Paspor)', labelX + 20.8, box2Y + 14.5);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(':', sepX, box2Y + 14.5);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(rNik, valX, box2Y + 14.5);

  // Baris 3: Email
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Alamat Email', labelX, box2Y + 19);
  doc.text(':', sepX, box2Y + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isBlank ? 148 : 30, isBlank ? 163 : 41, isBlank ? 184 : 59);
  doc.text(rEmail, valX, box2Y + 19);

  // Baris 4: Telepon
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Telepon / WhatsApp', labelX, box2Y + 23.5);
  doc.text(':', sepX, box2Y + 23.5);
  doc.setTextColor(isBlank ? 148 : 71, isBlank ? 163 : 85, isBlank ? 184 : 105);
  doc.text(rPhone, valX, box2Y + 23.5);

  // Penutup PENERIMA KUASA
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Selanjutnya dalam surat ini disebut sebagai PENERIMA KUASA.', marginX + 2, box2Y + 32);

  // ==========================================
  // 6. MAKSUD DAN TUJUAN & DETAIL TIKET (Y: 128 - 165)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MAKSUD DAN TUJUAN', marginX, 129);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  const clauseText =
    'Dengan surat kuasa ini, PEMBERI KUASA memberikan kewenangan kepada PENERIMA KUASA untuk menerima, menukarkan wristband/tiket fisik, serta menggunakan tiket acara resmi berikut:';
  doc.text(clauseText, marginX, 133.5, { maxWidth: contentW });

  // Kotak Rincian Tiket
  const box3Y = 138;
  const box3H = 26;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.roundedRect(marginX, box3Y, contentW, box3H, 2, 2, 'FD');

  // Kiri
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Nama Event', labelX, box3Y + 6.5);
  doc.text(':', sepX, box3Y + 6.5);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(isBlank ? dotsCol1 : evTitle.substring(0, 32), valX, box3Y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal Acara', labelX, box3Y + 12);
  doc.text(':', sepX, box3Y + 12);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 15, isBlank ? 163 : 23, isBlank ? 184 : 42);
  doc.text(isBlank ? dotsCol1 : evDate, valX, box3Y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Lokasi Acara', labelX, box3Y + 17.5);
  doc.text(':', sepX, box3Y + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isBlank ? 148 : 30, isBlank ? 163 : 41, isBlank ? 184 : 59);
  doc.text(isBlank ? dotsCol1 : evLoc.substring(0, 32), valX, box3Y + 17.5);

  // Kanan
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jenis / Kategori', col2LabelX, box3Y + 6.5);
  doc.text(':', col2SepX, box3Y + 6.5);
  doc.setFont('helvetica', isBlank ? 'normal' : 'bold');
  doc.setTextColor(isBlank ? 148 : 30, isBlank ? 163 : 58, isBlank ? 184 : 138);
  doc.text(isBlank ? dotsCol2 : tkType, col2ValX, box3Y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kode Tiket Resmi', col2LabelX, box3Y + 12);
  doc.text(':', col2SepX, box3Y + 12);
  if (isBlank) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(dotsCol2, col2ValX, box3Y + 12);
  } else {
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(tkCode, col2ValX, box3Y + 12);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Order / Ref', col2LabelX, box3Y + 17.5);
  doc.text(':', col2SepX, box3Y + 17.5);
  if (isBlank) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(dotsCol2, col2ValX, box3Y + 17.5);
  } else {
    doc.setFont('courier', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(ordNo, col2ValX, box3Y + 17.5);
  }

  // ==========================================
  // 7. KLAUSUL HUKUM & PELEPASAN TANGGUNG JAWAB (Y: 169 - 192)
  // ==========================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const legal1 =
    'Surat kuasa ini dibuat sebagai bukti persetujuan PEMBERI KUASA atas proses transfer kepemilikan/penggunaan tiket kepada PENERIMA KUASA melalui sistem ticketing Metix.';
  doc.text(legal1, marginX, 169, { maxWidth: contentW });

  const legal2 =
    'Dengan ditandatanganinya surat kuasa ini, PEMBERI KUASA menyatakan bahwa proses transfer tiket dilakukan atas kehendak dan persetujuan sendiri serta membebaskan pihak penyelenggara dan Metix dari tuntutan yang timbul akibat pemberian kuasa tersebut, sepanjang proses dilakukan sesuai dengan ketentuan yang berlaku.';
  doc.text(legal2, marginX, 175.5, { maxWidth: contentW });

  const legal3 =
    'Demikian Surat Kuasa Transfer Tiket ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.';
  doc.text(legal3, marginX, 186, { maxWidth: contentW });

  // ==========================================
  // 8. KOTA & TANGGAL PENANDATANGANAN (Y: 192)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${city}, ${dDate}`, rightX, 192, { align: 'right' });

  // ==========================================
  // 9. AREA TANDA TANGAN & MATERAI (Y: 197 - 245)
  // ==========================================
  const ttdY = 197;

  // Kolom Kiri: PEMBERI KUASA
  const leftCenter = marginX + 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PEMBERI KUASA', leftCenter, ttdY, { align: 'center' });

  // Kotak Materai Rp 10.000 (Dashed)
  const materaiX = leftCenter - 14;
  const materaiY = ttdY + 4;
  const materaiW = 28;
  const materaiH = 20;

  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(materaiX, materaiY, materaiW, materaiH);
  doc.setLineDashPattern([], 0); // Reset

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MATERAI', leftCenter, materaiY + 7, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text('Rp 10.000', leftCenter, materaiY + 11.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Ttd terkena materai)', leftCenter, materaiY + 16, { align: 'center' });

  // Garis Tanda Tangan Pemberi Kuasa
  const signLineLeftY = materaiY + materaiH + 6;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(leftCenter - 27, signLineLeftY, leftCenter + 27, signLineLeftY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const pSignName = isBlank ? '( ............................................................ )' : `( ${data.pemberiNama || 'Pemilik Tiket'} )`;
  doc.text(pSignName, leftCenter, signLineLeftY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tanda Tangan Basah Asli', leftCenter, signLineLeftY + 8, { align: 'center' });

  // Kolom Kanan: PENERIMA KUASA
  const rightCenter = rightX - 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PENERIMA KUASA', rightCenter, ttdY, { align: 'center' });

  // Ruang Tanda Tangan Penerima Kuasa
  const signLineRightY = signLineLeftY;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(rightCenter - 27, signLineRightY, rightCenter + 27, signLineRightY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const rSignName = isBlank ? '( ............................................................ )' : `( ${data.penerimaNama || 'Penerima Tiket'} )`;
  doc.text(rSignName, rightCenter, signLineRightY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tanda Tangan Basah Asli', rightCenter, signLineRightY + 8, { align: 'center' });

  // ==========================================
  // 10. PERSYARATAN WAJIB PENUKARAN DI VENUE (Y: 251 - 269)
  // ==========================================
  const noteBoxY = 249;
  const noteBoxH = 19;
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(254, 202, 202); // Rose 200
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, noteBoxY, contentW, noteBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28); // Rose 700
  doc.text('DOKUMEN WAJIB YANG HARUS DIBAWA PENERIMA KUASA SAAT PENUKARAN TIKET / DI VENUE:', marginX + 3, noteBoxY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(127, 29, 29);
  doc.text('1. Surat Kuasa ASLI ini yang telah ditandatangani basah oleh kedua belah pihak di atas Materai Rp 10.000.', marginX + 4, noteBoxY + 8.5);
  doc.text('2. Fotokopi / Foto Identitas Diri Asli (KTP / SIM / Paspor) yang sah dari Pemberi Kuasa dan Penerima Kuasa.', marginX + 4, noteBoxY + 12);
  doc.text('3. Salinan E-Tiket Resmi / QR Code asli yang diterbitkan oleh platform Metix.', marginX + 4, noteBoxY + 15.5);

  // ==========================================
  // 11. FOOTER RESMI DOKUMEN DIGITAL METIX (Y: 274 - 285)
  // ==========================================
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.line(marginX, 273, rightX, 273);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DOKUMEN DIGITAL METIX', marginX, 278);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Dokumen: ${docNo}  |  Dibuat melalui: Metix Ticketing System`, marginX, 282);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`KODE VERIFIKASI: ${verifyCode}`, rightX, 278, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Halaman 1 / 1  •  Dokumen Sah & Berlaku', rightX, 282, { align: 'right' });

  // Simpan File PDF
  const filename = isBlank
    ? `Surat-Kuasa-Transfer-Tiket-Template-Metix.pdf`
    : `Surat-Kuasa-Transfer-${(data.ticketCode || 'Tiket').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;

  doc.save(filename);
}
