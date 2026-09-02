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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfile();
      const storedNik = typeof window !== 'undefined' ? localStorage.getItem('metix_user_nik') : null;
      const storedAddress = typeof window !== 'undefined' ? localStorage.getItem('metix_user_address') : null;

      if (data) {
        const mergedProfile: UserProfile = {
          ...data,
          id: data.id ?? 1,
          name: data.name || 'Pengguna Metix',
          email: data.email || 'guest@gmail.com',
          nik: data.nik || storedNik || '3171023901920001',
          address: data.address || data.location || storedAddress || 'Jakarta South, Indonesia',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('metix_user_nik', mergedProfile.nik || '');
          localStorage.setItem('metix_user_address', mergedProfile.address || '');
        }

        setProfile(mergedProfile);
        if (data.profile_photo_url || data.photo) {
          setPhotoPreview(getPhotoUrl(data.profile_photo_url || data.photo));
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const displayName = profile?.name || profile?.first_name || 'Pengguna Metix';
  const displayEmail = profile?.email || 'guest@gmail.com';
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
      const formData = new FormData(e.currentTarget);
      const nikInput = formData.get('nik') as string;
      const addressInput = formData.get('address') as string;

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const updated = await updateUserProfile(formData);
      const finalNik = nikInput || updated.nik || '3171023901920001';
      const finalAddress = addressInput || updated.address || 'Jakarta South, Indonesia';

      const merged = {
        ...updated,
        nik: finalNik,
        address: finalAddress,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('metix_user_nik', finalNik);
        localStorage.setItem('metix_user_address', finalAddress);
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
          <Skeleton className="h-48 w-full rounded-3xl" />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Interactive Photo Upload Circle */}
            <div className="relative group shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={displayName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-blue-600 shadow-md shadow-blue-600/20"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-blue-600/20">
                  {initials}
                </div>
              )}

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
                <span>Ubah Foto</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-600" /> {roleLabel}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {displayEmail}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> Upload Foto Baru API
                </button>

                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Profile
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Details Form */}
        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : (
          <form onSubmit={handleSave} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Personal Information
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Update your identity details, phone number, and address
                </p>
              </div>

              {isSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in-0">
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
                    defaultValue={displayName}
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
                <label className="text-xs font-extrabold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="phone"
                    defaultValue={profile?.phone || '081234567890'}
                    placeholder="0812..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">NIK (Nomor Induk Kependudukan)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="nik"
                    defaultValue={profile?.nik || '3171023901920001'}
                    placeholder="3171..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
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
                    defaultValue={profile?.address || 'Jakarta South, Indonesia'}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile & Photo via API
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
