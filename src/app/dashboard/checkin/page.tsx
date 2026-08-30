'use me';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchMyEvents,
  processCheckIn,
  ApiEvent,
  CheckInResponse,
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
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  Volume2,
  VolumeX,
  Ticket,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ScanLine,
  VideoOff,
  Sparkles,
  ArrowRight,
  User,
  Radio,
  Activity,
  Check,
} from 'lucide-react';

interface ScanLogItem {
  id: string;
  code: string;
  holderName: string;
  typeName: string;
  eventName: string;
  status: 'valid' | 'invalid';
  timestamp: string;
  message: string;
}

export default function CheckInPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  // Scanner Mode & Controls
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('manual');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ticketInput, setTicketInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Camera Live WebCam Stream State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Active Scan Result State
  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null);

  // Gate Scan History Feed
  const [scanHistory, setScanHistory] = useState<ScanLogItem[]>([]);
  const [totalCheckInCount, setTotalCheckInCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

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

  // WebCam Live Camera Controls
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses media kamera.');
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
      console.warn('Camera access error:', err);
      setCameraError(err?.message || 'Izin kamera ditolak atau perangkat kamera tidak ditemukan.');
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
      if (inputRef.current) inputRef.current.focus();
    }
    return () => {
      stopCamera();
    };
  }, [scannerMode]);

  // Audio Beep FX Simulation
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
    } catch {
      // Audio context fallbacks
    }
  };

  const handleScanSubmit = async (codeToScan?: string) => {
    const code = codeToScan || ticketInput.trim();
    if (!code) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await processCheckIn({
        ticket_code: code,
        event_id: selectedEvent?.id,
      });

      setScanResult(result);
      playBeep(result.success);

      const logItem: ScanLogItem = {
        id: Math.random().toString(),
        code: result.ticket?.code || code,
        holderName: result.ticket?.holder_name || 'Pengunjung Gate',
        typeName: result.ticket?.type_name || 'Tiket Masuk',
        eventName: result.ticket?.event_name || selectedEvent?.title || 'Event',
        status: result.success ? 'valid' : 'invalid',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: result.message,
      };

      setScanHistory((prev) => [logItem, ...prev]);

      if (result.success) {
        setTotalCheckInCount((prev) => prev + 1);
      }

      setTicketInput('');
    } catch (err: any) {
      const errResult: CheckInResponse = {
        success: false,
        message: err?.message || 'Gagal memproses verifikasi gate.',
      };
      setScanResult(errResult);
      playBeep(false);
    } finally {
      setIsScanning(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanSubmit();
  };

  // Test Simulations
  const handleTestValidScan = () => {
    const randomCode = 'MTX-TCK-' + Math.floor(10000 + Math.random() * 90000);
    handleScanSubmit(randomCode);
  };

  const handleTestInvalidScan = () => {
    handleScanSubmit('INVALID-EXPIRED-CODE-0000');
  };

  return (
    <DashboardLayout pageTitle="Check-In QR Gate Scanner" activeNav="Check-In QR">
      <div className="w-full space-y-6">
        
        {/* Top Premium Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/20 border border-white/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Gate Validation Console
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Gate Check-In & Scanner E-Tiket
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-xl">
                Pemindaian kamera live webcam & barcode laser gun real-time. Terhubung langsung ke API database Metix.
              </p>
            </div>

            {/* Event Selector Dropdown Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/20 space-y-1.5 shrink-0 min-w-[280px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                Pilih Event Gate Scanner:
              </span>
              <div className="flex items-center gap-2 w-full">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <Select
                  value={selectedEvent?.id ? String(selectedEvent.id) : ''}
                  onValueChange={(val) => {
                    const ev = events.find((x) => String(x.id) === val);
                    if (ev) setSelectedEvent(ev);
                  }}
                >
                  <SelectTrigger className="w-full bg-transparent border-0 text-white font-extrabold text-xs focus:ring-0 focus:outline-none shadow-none h-auto p-0 cursor-pointer hover:text-amber-200 transition-colors">
                    <SelectValue placeholder="Pilih Event Gate Scanner" />
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
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Check-In Gate</span>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl font-black text-slate-900">{totalCheckInCount} <span className="text-xs font-extrabold text-slate-400">Pengunjung</span></h4>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Gate System</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Gate 1 — Active
              </h4>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Modus Pemindai</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-indigo-600">
                {scannerMode === 'camera' ? 'Live Camera' : 'Laser Barcode Gun'}
              </h4>
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Suara Beep Notifikasi</span>
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900">
                {soundEnabled ? 'Aktif (Sound ON)' : 'Mute (Sound OFF)'}
              </h4>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-2xl transition-all cursor-pointer border ${
                  soundEnabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Check-In Interface (Grid 2 Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Scanner HUD & Input Console (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/40 space-y-5">
              
              {/* Header Scanner & Pill Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-600" /> Mode Pemindai Gate (Scanner)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih metode pemindaian tiket pengunjung di pintu masuk venue.
                  </p>
                </div>

                {/* Mode Selector Pill Buttons */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
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
                  {/* HTML5 WebCam Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Futuristic HUD Scanning Grid Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      <div className="w-60 h-60 border-2 border-emerald-400/90 rounded-3xl relative shadow-[0_0_30px_rgba(52,211,153,0.35)]">
                        {/* 4 Corner Bracket HUD Lines */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400" />

                        <div className="absolute top-3 left-3 text-[10px] font-mono font-black text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                          SCANNING QR TOKEN...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback UI when Camera is Pending or Off */}
                  {(!isCameraActive || cameraError) && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 shadow-inner">
                        <VideoOff className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-extrabold text-white">Kamera Belum Aktif</h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {cameraError || 'Klik tombol di bawah ini untuk mengaktifkan video streaming kamera live.'}
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
                      <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Video Camera Stream Ready
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestValidScan}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" /> Tes Valid
                      </button>
                      <button
                        type="button"
                        onClick={handleTestInvalidScan}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Tes Invalid
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: High-Speed Barcode Scanner Gun / Input Form */
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Input Kode Tiket ATAU Scanner Gun
                    </label>

                    <div className="relative flex items-center">
                      <input
                        ref={inputRef}
                        type="text"
                        value={ticketInput}
                        onChange={(e) => setTicketInput(e.target.value)}
                        placeholder="Scan barcode gun atau ketik kode tiket e.g. MTX-TCK-94821..."
                        className="w-full pl-4 pr-32 py-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-sm font-mono font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
                      />

                      <button
                        type="submit"
                        disabled={isScanning || !ticketInput.trim()}
                        className="absolute right-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 shadow-md shadow-blue-600/20"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifikasi...
                          </>
                        ) : (
                          <>
                            Verifikasi Gate <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Simulation Pill Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-400">Tes Simulasi Scan API:</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestValidScan}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tes Valid Pass
                      </button>

                      <button
                        type="button"
                        onClick={handleTestInvalidScan}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Tes Kode Ganda / Expired
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Validation Result Display Card (Satisfying Green/Red Feedback) */}
            {scanResult && (
              <div
                className={`p-6 rounded-3xl border shadow-xl transition-all duration-300 animate-in fade-in-0 space-y-4 ${
                  scanResult.success
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 border-emerald-300 text-emerald-950'
                    : 'bg-gradient-to-br from-rose-50 via-red-50/70 to-rose-100/50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 ${
                        scanResult.success
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl shadow-emerald-600/30'
                          : 'bg-rose-600 text-white border-rose-400 shadow-xl shadow-rose-600/30'
                      }`}
                    >
                      {scanResult.success ? (
                        <Check className="w-10 h-10 stroke-[3]" />
                      ) : (
                        <XCircle className="w-10 h-10 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          scanResult.success
                            ? 'bg-emerald-200/80 text-emerald-950 border-emerald-300'
                            : 'bg-rose-200/80 text-rose-950 border-rose-300'
                        }`}
                      >
                        {scanResult.success ? '✓ ENTRY GRANTED — SILAKAN MASUK' : '✕ ENTRY DENIED — TIKE TAHAN / DITOLAK'}
                      </span>
                      <h3 className="text-xl font-black tracking-tight leading-snug">
                        {scanResult.message}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Ticket Details Panel */}
                {scanResult.ticket && (
                  <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 space-y-2.5 font-mono text-xs shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans font-bold">Kode Tiket:</span>
                      <span className="font-black text-blue-700 text-base">{scanResult.ticket.code}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans font-bold">Nama Pemegang:</span>
                      <span className="font-extrabold text-slate-900 text-sm">{scanResult.ticket.holder_name || 'Pengunjung Gate'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans font-bold">Tipe Kategori Tiket:</span>
                      <span className="font-black text-amber-700 text-sm bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {scanResult.ticket.type_name || 'VIP Pass'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Live Gate Attendance Stream Log (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-200/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Log Kedatangan Gate Real-Time
                </h3>
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {scanHistory.length} Log
                </span>
              </div>

              {scanHistory.length > 0 ? (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {scanHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                        item.status === 'valid'
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.status === 'valid' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="font-extrabold text-xs text-slate-900">{item.holderName}</span>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-slate-400">{item.timestamp}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pl-6">
                        <span className="font-mono text-slate-600 font-bold">{item.code}</span>
                        <span className="font-black text-blue-700 text-[10px] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {item.typeName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Belum ada aktivitas scan tiket di gate saat ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
