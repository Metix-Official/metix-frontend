'use me';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchUserProfile, updateUserProfile, UserProfile, getPhotoUrl } from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { Skeleton } from '@/components/ui/Skeleton';
import { User, Mail, Phone, ShieldCheck, MapPin, CheckCircle2, Save, BadgeCheck, Camera, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nik, setNik] = useState('');
  const [address, setAddress] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfile();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        setPhone((data.phone || '').replace(/\D/g, '').slice(0, 13));
        setNik(((data as any).nik || '').replace(/\D/g, '').slice(0, 16));
        setAddress(data.address || '');

        if (data.profile_photo_url || data.photo) {
          setPhotoPreview(getPhotoUrl(data.profile_photo_url || data.photo));
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const displayName = profile?.name || profile?.first_name || 'Pengguna Metix';
  const displayEmail = profile?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const roleLabel = React.useMemo(() => {
    const role = getUserRole(profile);
    switch (role) {
      case ROLES.OWNER:
        return 'Super Admin Platform';
      case ROLES.EO:
        return 'Event Organizer (EO)';
      case ROLES.SCANNER:
        return 'Admin Scanner Staff';
      case ROLES.BUYER:
      default:
        return 'Pembeli Tiket (Customer)';
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('nik', nik);
      formData.append('address', address);

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const updated = await updateUserProfile(formData);
      const finalNik = nik || updated.nik || '';
      const finalAddress = address || updated.address || '';

      const merged: UserProfile = {
        ...updated,
        id: updated.id ?? profile?.id ?? 1,
        name: name || updated.name || profile?.name || 'Pengguna Metix',
        email: updated.email || profile?.email || '',
        phone: phone || updated.phone || null,
        nik: finalNik,
        address: finalAddress,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('metix_user', JSON.stringify(merged));
        window.dispatchEvent(new Event('user-profile-updated'));
      }

      setProfile(merged);
      if (updated.profile_photo_url || updated.photo) {
        setPhotoPreview(getPhotoUrl(updated.profile_photo_url || updated.photo));
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="My Profile" activeNav="Profil Saya">
      <div className="w-full space-y-6">
        {/* Profile Header Card */}
        {isLoading ? (
          <Skeleton className="h-44 sm:h-52 w-full rounded-2xl sm:rounded-3xl" />
        ) : (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            {/* Top Cover Banner */}
            <div className="h-20 sm:h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

              {/* Verified Pill Badge on Banner */}
              <div className="absolute right-3.5 top-3 sm:right-5 sm:top-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/30 backdrop-blur-md text-white border border-white/20 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Akun Terverifikasi</span>
                </span>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Avatar + Info Row */}
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
                  {/* Avatar Container: ONLY avatar has negative margin */}
                  <div className="relative shrink-0 group -mt-10 sm:-mt-14 z-10">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={displayName}
                        className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-xl shadow-slate-900/10 bg-white"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black border-4 border-white shadow-xl shadow-slate-900/10">
                        {initials}
                      </div>
                    )}

                    {/* Camera Floating Button on Avatar */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Ganti Foto Profil"
                      className="absolute -bottom-1 -right-1 p-1.5 sm:p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 border-2 border-white transition-transform active:scale-90 cursor-pointer flex items-center justify-center"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Name & Details (Cleanly below banner with comfortable spacing) */}
                  <div className="min-w-0 flex-1 pt-3 sm:pt-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-snug truncate">
                        {displayName}
                      </h2>
                      <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </p>

                    <div className="pt-0.5">
                      <span className="inline-flex items-center text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 sm:py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="flex items-center pt-2 sm:pt-0 sm:self-center border-t border-slate-100 sm:border-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti Foto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Details Form */}
        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : (
          <form onSubmit={handleSave} className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Informasi Pribadi
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Perbarui identitas, nomor telepon, dan alamat domisili Anda
                </p>
              </div>

              {isSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in-0 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil berhasil disimpan!
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    defaultValue={displayEmail}
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">Phone Number / WhatsApp</label>
                  <span className="text-[10px] text-slate-400 font-bold">{phone.length} / 13 digit</span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={13}
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="Contoh: 081234567890 (Hanya Angka)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">NIK (Nomor Induk Kependudukan)</label>
                  <span className="text-[10px] text-slate-400 font-bold">{nik.length} / 16 digit</span>
                </div>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={16}
                    name="nik"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="Contoh: 3171012345670001 (Hanya Angka)"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-700">Residential Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    name="address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Isi alamat tempat tinggal Anda..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
