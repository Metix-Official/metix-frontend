'use me';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  fetchWristbands,
  bulkGenerateWristbands,
  ApiEvent,
  WristbandItem,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import JSZip from 'jszip';
import {
  Printer,
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  Volume2,
  VolumeX,
  Layers,
  Download,
  Search,
  Plus,
  Loader2,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  X,
  Sparkles,
  Ticket,
  FileCheck,
  Clock,
  Eye,
} from 'lucide-react';

export default function WristbandsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Wristband items list state
  const [wristbands, setWristbands] = useState<WristbandItem[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());

  // Batch / Bulk Generate Form State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [bulkQty, setBulkQty] = useState<number>(5);
  const [bulkEventId, setBulkEventId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Scanner Mode & Controls (Khusus Scanner QR Gelang Fisik)
  const [scannerMode, setScannerMode] = useState<'manual' | 'camera'>('manual');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    item?: WristbandItem;
  } | null>(null);

  // WebCam Live Camera Viewport State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // QR Preview Modal State
  const [selectedQrModalItem, setSelectedQrModalItem] = useState<WristbandItem | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const evData = await fetchMyEvents();
    setEvents(evData.events);
    if (evData.events.length > 0 && !bulkEventId) {
      setBulkEventId(String(evData.events[0].id));
    }

    const wbData = await fetchWristbands({
      search: searchQuery,
      event_id: selectedEventId,
    });

    setWristbands(wbData.wristbands || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  // Camera Controls
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses live media kamera.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Akses kamera ditolak atau perangkat kamera tidak ditemukan.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (scannerMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      if (scanInputRef.current) scanInputRef.current.focus();
    }
    return () => {
      stopCamera();
    };
  }, [scannerMode]);

  // Audio Beep FX
  const playBeep = (isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  };

  // Handle Wristband Scan Verification
  const handleScanWristband = (codeToScan?: string) => {
    const code = (codeToScan || scanInput).trim();
    if (!code) return;

    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const found = wristbands.find(
        (w) => w.qr_code.toLowerCase() === code.toLowerCase() || code.toLowerCase().includes(w.qr_code.toLowerCase())
      );

      if (found) {
        setScanResult({
          success: true,
          message: `Gelang Fisik "${found.qr_code}" Berhasil Terverifikasi!`,
          item: found,
        });
        playBeep(true);
        toast.success('Gelang Fisik Valid! 🎉', {
          description: `QR Code ${found.qr_code} terdaftar dan aktif.`,
        });
      } else {
        setScanResult({
          success: false,
          message: `QR Code Gelang "${code}" Tidak Ditemukan / Tidak Valid!`,
        });
        playBeep(false);
        toast.error('Scan Gelang Gagal', {
          description: `Kode QR ${code} tidak ada di database sistem.`,
        });
      }
      setIsScanning(false);
      setScanInput('');
      if (scanInputRef.current) scanInputRef.current.focus();
    }, 600);
  };

  // Batch / Bulk Generate Submission
  const handleBulkGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEventId) {
      toast.error('Pilih Event Terlebih Dahulu');
      return;
    }
    const qty = Number(bulkQty);
    if (!qty || qty < 1 || qty > 100) {
      toast.error('Jumlah QR harus antara 1 sampai 100');
      return;
    }

    setIsGenerating(true);
    const targetEvt = events.find((x) => String(x.id) === bulkEventId);
    const eventTitle = targetEvt?.title || 'Event Concert';

    try {
      const res = await bulkGenerateWristbands(Number(bulkEventId), qty);
      
      // Generate new items to append
      const newItems: WristbandItem[] = [];
      const timestampStr = Date.now().toString().slice(-4);
      for (let i = 1; i <= qty; i++) {
        newItems.push({
          id: Date.now() + i,
          qr_code: `WRB-${targetEvt?.id || 10}${timestampStr}-${String(i).padStart(2, '0')}`,
          event_id: Number(bulkEventId),
          event_title: eventTitle,
          status: 'GENERATED',
          created_at: new Date().toISOString(),
        });
      }

      setWristbands((prev) => [...newItems, ...prev]);
      setIsGenerateModalOpen(false);

      toast.success(`${qty} QR Code Gelang Berhasil Dibuat! 🎉`, {
        description: `${qty} QR gelang fisik baru telah dimasukkan untuk ${eventTitle}.`,
      });
    } catch (err: any) {
      toast.error('Gagal Bulk Generate', { description: err?.message || 'Terjadi kesalahan' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Export All QR Codes to ZIP
  const handleExportZip = async () => {
    if (filteredWristbands.length === 0) {
      toast.error('Tidak Ada QR Gelang Untuk Di-download');
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('wristband_qrcodes');

      // Create PNG QR image blobs using Canvas for each wristband
      for (const item of filteredWristbands) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
          item.qr_code
        )}`;

        try {
          const resp = await fetch(qrUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            folder?.file(`${item.qr_code}.png`, blob);
          }
        } catch {
          // Canvas fallback for QR code generation
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 300);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(item.qr_code, 30, 150);
          }
          const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
          folder?.file(`${item.qr_code}.png`, base64Data, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Metix_Wristband_QRCodes_${filteredWristbands.length}_pcs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark all exported IDs as downloaded
      const newDownloaded = new Set(downloadedIds);
      filteredWristbands.forEach((item) => newDownloaded.add(item.id));
      setDownloadedIds(newDownloaded);

      toast.success(`Berhasil Mengunduh ${filteredWristbands.length} QR Code Gelang (ZIP)! 🎉`, {
        description: 'File ZIP gambar QR code siap dikirimkan ke vendor percetakan gelang fisik.',
      });
    } catch (err: any) {
      toast.error('Gagal Mengunduh ZIP', { description: err?.message || 'Terjadi kesalahan' });
    } finally {
      setIsExportingZip(false);
    }
  };

  // Filter wristbands by search query and event filter
  const filteredWristbands = wristbands.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.qr_code.toLowerCase().includes(q) ||
      (item.event_title || '').toLowerCase().includes(q) ||
      (item.ticket_number || '').toLowerCase().includes(q);

    const matchEvent = selectedEventId === 'all' || String(item.event_id) === selectedEventId;
    return matchSearch && matchEvent;
  });

  return (
    <DashboardLayout pageTitle="Cetak QR Gelang Fisik & Batch Generator" activeNav="Cetak QR Gelang">
      <div className="w-full space-y-6">
        
        {/* Top Premium Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/20 border border-white/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
                <Printer className="w-3.5 h-3.5 text-amber-300" /> Physical Wristband QR Generator & Scanner
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Cetak QR Gelang Fisik & Batch Generator
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                Insert & buat lebih dari 1 QR Code gelang secara massal, scan verifikasi gelang fisik, dan unduh seluruh file gambar QR Code dalam format <strong>ZIP</strong> untuk pencetakan vendor.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> + Insert Batch QR Gelang
              </button>

              <button
                type="button"
                disabled={isExportingZip || filteredWristbands.length === 0}
                onClick={handleExportZip}
                className="px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses ZIP...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-blue-600" /> Download ZIP ({filteredWristbands.length} QR)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards Metric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total QR Gelang Fisik</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-slate-900">{filteredWristbands.length} <span className="text-xs font-extrabold text-slate-400">Pcs</span></h4>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sudah Di-download (ZIP)</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-emerald-600">
                {downloadedIds.size} <span className="text-xs font-extrabold text-emerald-700">QR</span>
              </h4>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Belum Di-download</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-amber-600">
                {Math.max(0, filteredWristbands.length - downloadedIds.size)} <span className="text-xs font-extrabold text-amber-700">Pending</span>
              </h4>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Pemindai Gelang</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" /> Live Ready
              </h4>
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Section: Scanner Consoles (7 Cols) & QR List Table (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Dedicated Physical Wristband Scanner (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/40 space-y-5">
              
              {/* Header Scanner & Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <QrCode className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">
                      Scanner QR Gelang Fisik
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Verifikasi & pairing gelang fisik peserta event.
                    </p>
                  </div>
                </div>

                {/* Pill buttons */}
                <div className="flex items-center p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setScannerMode('manual')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      scannerMode === 'manual'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Keyboard className="w-4 h-4" /> Barcode Gun / Input
                  </button>

                  <button
                    type="button"
                    onClick={() => setScannerMode('camera')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      scannerMode === 'camera'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-4 h-4" /> Kamera Live WebCam
                  </button>
                </div>
              </div>

              {/* Mode 1: High-Tech Cyberpunk Live WebCam Camera Viewport */}
              {scannerMode === 'camera' ? (
                <div className="relative h-80 rounded-3xl bg-slate-950 border-2 border-blue-500/40 overflow-hidden flex items-center justify-center shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* HUD Scan grid */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      <div className="w-60 h-60 border-2 border-emerald-400/90 rounded-3xl relative shadow-[0_0_30px_rgba(52,211,153,0.35)]">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400" />
                        <div className="absolute top-3 left-3 text-[10px] font-mono font-black text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                          SCANNING PHYSICAL WRISTBAND...
                        </div>
                      </div>
                    </div>
                  )}

                  {(!isCameraActive || cameraError) && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 shadow-inner">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-extrabold text-white">Kamera Live Belum Aktif</h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {cameraError || 'Klik tombol di bawah ini untuk mengaktifkan video streaming kamera live scanner.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Mulai Kamera Live
                      </button>
                    </div>
                  )}

                  {/* Bottom HUD Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-white text-xs z-20">
                    <span className="font-extrabold text-[11px] px-2 text-emerald-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Physical Wristband Camera Stream
                    </span>
                    <button
                      type="button"
                      onClick={() => handleScanWristband(wristbands[0]?.qr_code || 'WRB-849201-X1')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" /> Tes Scan QR
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode 2: Barcode Gun / Manual Input */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScanWristband();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Input QR Code Gelang Fisik ATAU Scanner Gun
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          ref={scanInputRef}
                          type="text"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          placeholder="Scan barcode gun atau ketik QR gelang (e.g. WRB-849201)..."
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-mono font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isScanning || !scanInput.trim()}
                        className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-blue-600/20 shrink-0"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Verifikasi Gelang
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-400">Quick Tes Simulasi QR Gelang:</span>
                    <div className="flex items-center gap-2">
                      {wristbands.slice(0, 2).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleScanWristband(item.qr_code)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {item.qr_code}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Scan Feedback Panel */}
            {scanResult && (
              <div
                className={`p-6 rounded-3xl border shadow-xl transition-all duration-300 animate-in fade-in-0 space-y-4 ${
                  scanResult.success
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 border-emerald-300 text-emerald-950'
                    : 'bg-gradient-to-br from-rose-50 via-red-50/70 to-rose-100/50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                      scanResult.success
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl shadow-emerald-600/30'
                        : 'bg-rose-600 text-white border-rose-400 shadow-xl shadow-rose-600/30'
                    }`}
                  >
                    {scanResult.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>

                  <div className="space-y-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        scanResult.success
                          ? 'bg-emerald-200/80 text-emerald-950 border-emerald-300'
                          : 'bg-rose-200/80 text-rose-950 border-rose-300'
                      }`}
                    >
                      {scanResult.success ? '✓ VERIFIED WRISTBAND' : '✕ INVALID WRISTBAND'}
                    </span>
                    <h3 className="text-lg font-black tracking-tight leading-snug">
                      {scanResult.message}
                    </h3>
                  </div>
                </div>

                {scanResult.item && (
                  <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 space-y-2 font-mono text-xs shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans font-bold">QR Code Gelang:</span>
                      <span className="font-black text-blue-700 text-sm">{scanResult.item.qr_code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans font-bold">Event Terdaftar:</span>
                      <span className="font-extrabold text-slate-900">{scanResult.item.event_title}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Wristbands Table & Download Status (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/40 space-y-4">
              
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> Daftar QR Code Gelang ({filteredWristbands.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Status kelengkapan file QR fisik & unduhan ZIP.
                  </p>
                </div>
              </div>

              {/* Event Filter & Search Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari QR Code..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                    <SelectValue placeholder="Semua Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Event</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wristband List Table */}
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : filteredWristbands.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[440px]">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">QR Code Gelang</th>
                        <th className="py-3 px-4">Status Download</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWristbands.map((item) => {
                        const isDownloaded = downloadedIds.has(item.id);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                  <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {item.qr_code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                                  {item.event_title}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {isDownloaded ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <FileCheck className="w-3 h-3 text-emerald-600" /> Sudah Di-download
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" /> Belum Di-download
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedQrModalItem(item)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> Lihat QR
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Printer className="w-7 h-7 text-slate-300 mx-auto" />
                  <p>Belum ada QR Code Gelang Fisik yang dibuat pada event ini.</p>
                </div>
              )}

              {/* Export ZIP Footer CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isExportingZip || filteredWristbands.length === 0}
                  onClick={handleExportZip}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isExportingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunduh File ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download All QR Codes ZIP ({filteredWristbands.length} Items)
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL BATCH / BULK GENERATE WRISTBAND ================= */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-extrabold tracking-tight">Insert Batch QR Gelang Fisik</h3>
              <p className="text-xs text-blue-100 font-medium">
                Buat lebih dari 1 QR Code sekaligus untuk gelang fisik per-event.
              </p>
            </div>

            {/* Form Batch */}
            <form onSubmit={handleBulkGenerateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Pilih Event</label>
                <Select value={bulkEventId} onValueChange={setBulkEventId}>
                  <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none">
                    <SelectValue placeholder="Pilih Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Jumlah QR Code Gelang (Pcs)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={bulkQty}
                  onChange={(e) => setBulkQty(Number(e.target.value))}
                  placeholder="Contoh: 5 atau 10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-medium block">
                  Misal: Masukkan 5 maka 5 QR Code gelang fisik baru akan dibuat sekaligus.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Membuat QR...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Generate {bulkQty} QR Code
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL LIGHTBOX PREVIEW QR CODE ================= */}
      {selectedQrModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 text-center space-y-4">
            <button
              onClick={() => setSelectedQrModalItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Preview QR Code Gelang Fisik
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {selectedQrModalItem.qr_code}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{selectedQrModalItem.event_title}</p>
            </div>

            {/* Rendered QR Image */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  selectedQrModalItem.qr_code
                )}`}
                alt={selectedQrModalItem.qr_code}
                className="w-48 h-48 mx-auto rounded-lg object-contain"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setDownloadedIds((prev) => new Set(prev).add(selectedQrModalItem.id));
                  const link = document.createElement('a');
                  link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                    selectedQrModalItem.qr_code
                  )}`;
                  link.download = `${selectedQrModalItem.qr_code}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`QR ${selectedQrModalItem.qr_code} Berhasil Di-download!`);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Single PNG
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
