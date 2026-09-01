'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  fetchOrganizerProfile,
  saveOrganizerProfile,
  ApiOrganizerProfile,
  getPhotoUrl,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/sonner';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Pencil,
  Plus,
  Save,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';

export default function OrganizationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<ApiOrganizerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [organizationName, setOrganizationName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Validation Errors
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchOrganizerProfile();
    setProfile(data);

    if (data) {
      setOrganizationName(data.organization_name || '');
      setDescription(data.description || '');
      setAddress(data.address || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setLogoPreview(data.logo ? getPhotoUrl(data.logo) : null);
    } else {
      setIsEditing(true); // Open edit mode automatically if no profile exists yet
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    toast.loading('Memuat ulang profil organisasi...', { id: 'refresh-org' });
    await loadData();
    toast.success('Data profil organisasi berhasil diperbarui! 🔄', { id: 'refresh-org' });
  };

  // Phone Validation: Exactly 12 digits
  const handlePhoneChange = (val: string) => {
    // Keep only numbers
    const cleanNum = val.replace(/\D/g, '').slice(0, 12);
    setPhone(cleanNum);

    if (cleanNum.length > 0 && cleanNum.length !== 12) {
      setPhoneError('Nomor telepon wajib persis 12 digit angka (contoh: 081234567890).');
    } else {
      setPhoneError(null);
    }
  };

  // Email Validation: Standard email regex
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val.length > 0 && !emailRegex.test(val)) {
      setEmailError('Format email tidak valid (contoh: organizer@perusahaan.com).');
    } else {
      setEmailError(null);
    }
  };

  // Image File Preview Selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrorMessage(null);

    // Validate inputs
    let hasError = false;
    if (!organizationName.trim()) {
      setNameError('Nama organisasi wajib diisi.');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (phone.length !== 12) {
      setPhoneError('Nomor telepon wajib diisi tepat 12 digit angka.');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('Format email tidak valid.');
      hasError = true;
    }

    if (hasError) {
      toast.error('Gagal Menyimpan', {
        description: 'Mohon periksa kembali inputan form Anda.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('organization_name', organizationName.trim());
      formData.append('description', description.trim());
      formData.append('address', address.trim());
      formData.append('phone', phone.trim());
      formData.append('email', email.trim());

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const updated = await saveOrganizerProfile(formData);
      setProfile(updated);
      setIsEditing(false);

      toast.success('Profil Organisasi Berhasil Disimpan! 🎉', {
        description: 'Data organisasi Anda telah diperbarui dan dikirim untuk peninjauan.',
      });
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan profil organisasi.';
      setFormErrorMessage(msg);
      toast.error('Gagal Menyimpan Profil', {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (!profile) return null;

    const status = profile.status || 'PENDING_APPROVAL';

    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/90 text-amber-900 space-y-2 shadow-2xs animate-in fade-in-0">
            <div className="flex items-center gap-2.5 font-extrabold text-sm text-amber-800">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Status: Menunggu Persetujuan Admin (Pending Approval)</span>
            </div>
            <p className="text-xs font-medium text-amber-700 leading-relaxed">
              Profil organisasi Anda sedang dalam proses peninjauan oleh Super Admin Platform (Owner). Setelah disetujui, Anda akan mendapatkan hak akses penuh untuk merilis dan mempublikasikan event ke publik.
            </p>
          </div>
        );

      case 'ACTIVE':
        return (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 space-y-2 shadow-2xs animate-in fade-in-0">
            <div className="flex items-center gap-2.5 font-extrabold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Status: Profil Organisasi Terverifikasi & Aktif (Active)</span>
            </div>
            <p className="text-xs font-medium text-emerald-700 leading-relaxed">
              Selamat! Profil organisasi Anda telah disetujui oleh Owner. Anda dapat mempublikasikan event, menjual tiket secara online maupun offline POS, dan mencairkan hasil penjualan tiket.
            </p>
          </div>
        );

      case 'INACTIVE':
        return (
          <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 text-slate-800 space-y-2 shadow-2xs animate-in fade-in-0">
            <div className="flex items-center gap-2.5 font-extrabold text-sm text-slate-800">
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
              <span>Status: Profil Organisasi Non-aktif (Inactive)</span>
            </div>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Profil organisasi Anda saat ini dalam status non-aktif. Silakan hubungi Support / Admin Platform jika ini adalah kesalahan.
            </p>
          </div>
        );

      case 'REJECTED':
        return (
          <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200/90 text-rose-900 space-y-2 shadow-2xs animate-in fade-in-0">
            <div className="flex items-center gap-2.5 font-extrabold text-sm text-rose-800">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Status: Pengajuan Profil Organisasi Ditolak (Rejected)</span>
            </div>
            <p className="text-xs font-medium text-rose-700 leading-relaxed">
              Pengajuan organisasi Anda ditolak oleh Owner. Mohon periksa alasan di bawah, perbarui data profil Anda, lalu simpan ulang untuk mengajukan ulang persetujuan.
            </p>
            {profile.rejection_reason && (
              <div className="mt-2 p-3 rounded-2xl bg-white border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>Alasan Penolakan: {profile.rejection_reason}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active (Aktif)
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected (Ditolak)
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" /> Inactive
          </span>
        );
    }
  };

  return (
    <DashboardLayout pageTitle="Profil Organisasi (EO Partner)" activeNav="Profil Organisasi">
      <div className="w-full space-y-6">
        {/* Banner Hero Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-white" /> Event Organizer Entity Management
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Profil Organisasi & Partner Event
              </h2>
              <p className="text-xs text-blue-100 font-medium max-w-2xl">
                Kelola rincian entitas bisnis organisasi Anda, logo instansi, kontak telepon resmi (12 digit), email perusahaan, dan status verifikasi mitra.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>

              {profile && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Profil Organisasi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Alert Banner */}
        {renderStatusBanner()}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6">
            <Skeleton className="h-28 w-28 rounded-3xl" />
            <Skeleton className="h-8 w-64 rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : !isEditing && profile ? (
          /* ================= VIEW MODE (PROFILE OVERVIEW CARD) ================= */
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-slate-100">
              {/* Logo Display */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-md shrink-0 group">
                {profile.logo ? (
                  <img
                    src={getPhotoUrl(profile.logo) || undefined}
                    alt={profile.organization_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-3 text-center bg-gradient-to-tr from-blue-700 to-indigo-700">
                    <Building2 className="w-10 h-10 mb-1 opacity-90" />
                    <span className="text-[10px] font-extrabold uppercase">Belum ada logo</span>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile.organization_name}
                  </h3>
                  {getStatusBadge(profile.status)}
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Telepon (12 digit): <strong className="text-slate-900">{profile.phone || '-'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Email Organisasi: <strong className="text-slate-900">{profile.email || '-'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> Deskripsi Organisasi
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                  {profile.description || 'Belum ada deskripsi organisasi yang ditambahkan.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" /> Alamat Kantor / Headquarter
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                  {profile.address || 'Belum ada alamat kantor yang ditambahkan.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ================= EDIT / CREATE FORM MODE ================= */
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {profile ? 'Form Edit Profil Organisasi' : 'Form Buat Profil Organisasi Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Lengkapi rincian identitas perusahaan, upload logo resmi, serta isi kontak telepon (12 digit) dan email.
                </p>
              </div>

              {profile && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>

            {formErrorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Logo Organisasi / Perusahaan
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white text-[10px] p-2 text-center bg-gradient-to-tr from-blue-700 to-indigo-700">
                        <Building2 className="w-8 h-8 mb-1 opacity-80" />
                        <span>Preview Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      id="logo-file-input"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-file-input"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{logoFile ? 'Ganti File Logo' : 'Pilih Gambar Logo'}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Format gambar disarankan PNG/JPG/WEBP, maksimal ukuran 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Organization Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Nama Organisasi / Perusahaan Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => {
                    setOrganizationName(e.target.value);
                    if (e.target.value.trim()) setNameError(null);
                  }}
                  placeholder="e.g. PT Soundwave Event Asia"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all ${
                    nameError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {nameError && <p className="text-[11px] text-rose-600 font-bold">{nameError}</p>}
              </div>

              {/* Phone & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone field: Exactly 12 digits */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Nomor Telepon Resmi (Wajib 12 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="e.g. 081234567890"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all ${
                        phoneError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={phoneError ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                      {phoneError || 'Wajib diisi tepat 12 digit angka.'}
                    </span>
                    <span className="font-extrabold text-slate-500">{phone.length} / 12 digit</span>
                  </div>
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    Email Resmi Organisasi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="e.g. contact@soundwave.com"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all ${
                        emailError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {emailError && <p className="text-[11px] text-rose-600 font-bold">{emailError}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Alamat Lengkap Kantor / Headquarter
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Menara Soundwave Lt. 12, Jl. Jend. Sudirman Kav. 45, Jakarta Selatan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Deskripsi Singkat Organisasi / Pengalaman EO
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan profil singkat organisasi, pengalaman menggelar konser/event, armada tim, dll..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                {profile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !!phoneError || !!emailError}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Profil...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Profil Organisasi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
