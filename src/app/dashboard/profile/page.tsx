'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchUserProfile, updateUserProfile, UserProfile, getPhotoUrl } from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { INDONESIA_PROVINCES } from '@/data/indonesiaRegions';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/components/ui/sonner';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Save,
  BadgeCheck,
  Camera,
  Loader2,
  Calendar,
  Building,
  Hash,
  AlertCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Core User Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nik, setNik] = useState('');
  const [address, setAddress] = useState('');

  // Buyer Profile Fields (Cascading Location)
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cascading cities based on selected province
  const availableCities = useMemo(() => {
    if (!province) return [];
    const foundProv = INDONESIA_PROVINCES.find(
      (p) => p.name.toLowerCase() === province.toLowerCase()
    );
    return foundProv ? foundProv.cities : [];
  }, [province]);

  const provinceOptions = useMemo(() => {
    return INDONESIA_PROVINCES.map((prov) => ({
      value: prov.name,
      label: prov.name,
      sublabel: `${prov.cities.length} Kota / Kabupaten`,
    }));
  }, []);

  const cityOptions = useMemo(() => {
    return availableCities.map((item) => ({
      value: item.name,
      label: item.name,
      sublabel: `Kode Pos: ${item.postalCode}`,
    }));
  }, [availableCities]);


  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfile();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        setPhone((data.phone || '').replace(/\D/g, '').slice(0, 13));
        setNik(((data as any).nik || '').replace(/\D/g, '').slice(0, 16));

        const bp = (data as any).buyer_profile || {};
        setDateOfBirth(bp.date_of_birth || (data as any).birth_date || '');

        const rawGender = (bp.gender || (data as any).gender || '').toUpperCase();
        if (['MALE', 'LAKI-LAKI', 'PRIA'].includes(rawGender)) {
          setGender('MALE');
        } else if (['FEMALE', 'PEREMPUAN', 'WANITA'].includes(rawGender)) {
          setGender('FEMALE');
        } else if (rawGender) {
          setGender('OTHER');
        }

        const initialProv = bp.province || '';
        const initialCity = bp.city || '';
        const initialPostal = bp.postal_code || '';

        setProvince(initialProv);
        setCity(initialCity);
        setPostalCode(initialPostal);
        setAddress(bp.address || data.address || '');

        if (data.profile_photo_url || data.photo) {
          setPhotoPreview(getPhotoUrl(data.profile_photo_url || data.photo));
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    clearFieldError('province');

    const foundProv = INDONESIA_PROVINCES.find(
      (p) => p.name.toLowerCase() === newProvince.toLowerCase()
    );

    // If city is not part of the new province, reset city and postal code
    if (foundProv) {
      const cityMatches = foundProv.cities.some(
        (c) => c.name.toLowerCase() === city.toLowerCase()
      );
      if (!cityMatches) {
        setCity('');
        setPostalCode('');
      }
    } else {
      setCity('');
      setPostalCode('');
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    clearFieldError('city');

    // Auto-fill postal code based on selected city!
    const foundCity = availableCities.find(
      (c) => c.name.toLowerCase() === newCity.toLowerCase()
    );
    if (foundCity && foundCity.postalCode) {
      setPostalCode(foundCity.postalCode);
      clearFieldError('postal_code');
    }
  };

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
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({ ...prev, photo: 'Ukuran foto maksimal adalah 5MB.' }));
        return;
      }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setFieldErrors((prev) => ({ ...prev, photo: 'Format foto harus berupa JPG, PNG, atau WebP.' }));
        return;
      }
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.photo;
        return copy;
      });
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Name validation
    if (!name.trim()) {
      errors.name = 'Nama lengkap wajib diisi.';
    } else if (name.trim().length < 2) {
      errors.name = 'Nama lengkap minimal 2 karakter.';
    }

    // 2. Phone validation (Indonesian format: 08xx or 628xx, 10-13 digits)
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const phoneRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;
    if (!cleanPhone) {
      errors.phone = 'Nomor telepon / WhatsApp wajib diisi.';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Format nomor HP tidak valid. Gunakan format Indonesia (contoh: 081234567890, 10-13 digit).';
    }

    // 3. NIK validation (optional, but if filled must be exactly 16 digits)
    if (nik.trim() && !/^[0-9]{16}$/.test(nik.trim())) {
      errors.nik = 'NIK harus berupa 16 digit angka sesuai KTP.';
    }

    // 4. Date of Birth validation
    if (!dateOfBirth) {
      errors.date_of_birth = 'Tanggal lahir wajib diisi.';
    } else {
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        errors.date_of_birth = 'Format tanggal lahir tidak valid.';
      } else if (dobDate >= today) {
        errors.date_of_birth = 'Tanggal lahir harus sebelum hari ini.';
      } else if (dobDate.getFullYear() < 1900) {
        errors.date_of_birth = 'Tahun kelahiran harus setelah tahun 1900.';
      }
    }

    // 5. Gender validation
    if (!gender) {
      errors.gender = 'Jenis kelamin wajib dipilih.';
    }

    // 6. Province validation
    if (!province.trim()) {
      errors.province = 'Silakan pilih Provinsi tempat tinggal Anda.';
    }

    // 7. City validation
    if (!city.trim()) {
      errors.city = 'Silakan pilih Kota / Kabupaten tempat tinggal Anda.';
    }

    // 8. Postal code validation (Indonesian: exactly 5 digits)
    if (!postalCode.trim()) {
      errors.postal_code = 'Kode pos wajib diisi.';
    } else if (!/^[0-9]{5}$/.test(postalCode.trim())) {
      errors.postal_code = 'Kode pos harus terdiri dari tepat 5 digit angka.';
    }

    // 9. Address validation
    if (!address.trim()) {
      errors.address = 'Alamat domisili lengkap wajib diisi.';
    } else if (address.trim().length < 5) {
      errors.address = 'Alamat domisili terlalu singkat (minimal 5 karakter).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const isValid = validateAllFields();
    if (!isValid) {
      setErrorMessage('Terdapat data profil yang belum lengkap atau format belum sesuai. Mohon periksa field bertanda merah.');
      toast.error('Gagal Menyimpan Profil', {
        description: 'Mohon periksa kolom yang bertanda merah dan lengkapi data dengan format yang valid.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      if (nik.trim()) {
        formData.append('nik', nik.trim());
      }
      formData.append('address', address.trim());
      formData.append('date_of_birth', dateOfBirth);
      formData.append('birth_date', dateOfBirth);
      formData.append('gender', gender);
      formData.append('province', province.trim());
      formData.append('city', city.trim());
      formData.append('postal_code', postalCode.trim());
      formData.append('country', 'ID');

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
        buyer_profile: {
          date_of_birth: dateOfBirth,
          gender: gender,
          address: finalAddress,
          city: city.trim(),
          province: province.trim(),
          postal_code: postalCode.trim(),
          country: 'ID',
        },
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
      setFieldErrors({});
      toast.success('Profil Berhasil Disimpan!', {
        description: 'Data profil Anda telah berhasil diperbarui dan tersimpan aman di database.',
        duration: 4000,
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal menyimpan profil ke server.';
      toast.error('Gagal Menyimpan Profil', {
        description: errorMsg,
        duration: 5000,
      });
      if (err?.errors && typeof err.errors === 'object') {
        const backendErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(err.errors)) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            backendErrors[key] = msgs[0];
          }
        }
        setFieldErrors(backendErrors);
        setErrorMessage('Terdapat kesalahan validasi dari server. Silakan periksa formulir.');
      } else {
        setErrorMessage(err?.message || 'Gagal menyimpan profil.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
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
                  {/* Avatar Container */}
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

                  {/* Name & Details */}
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

                    {fieldErrors.photo && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.photo}</span>
                      </p>
                    )}
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
          <form onSubmit={handleSave} noValidate className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Informasi Profil Pembeli
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Pastikan data diri Anda lengkap dan sesuai identitas resmi untuk kelancaran e-tiket
                </p>
              </div>

              {isSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in-0 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil berhasil disimpan!
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Nama Lengkap</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError('name');
                    }}
                    placeholder="Nama Lengkap"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                      fieldErrors.name
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Email Address (Disabled) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Email Address (Akun)</label>
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

              {/* Phone Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <span>Nomor Telepon / WhatsApp</span>
                    <span className="text-rose-500">*</span>
                  </label>
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
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 13));
                      clearFieldError('phone');
                    }}
                    placeholder="Contoh: 081234567890 (Hanya Angka)"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all font-mono ${
                      fieldErrors.phone
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Tanggal Lahir</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">Wajib</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      clearFieldError('date_of_birth');
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all cursor-pointer ${
                      fieldErrors.date_of_birth
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.date_of_birth && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.date_of_birth}</span>
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Jenis Kelamin</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">Wajib</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('MALE');
                      clearFieldError('gender');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                      gender === 'MALE'
                        ? 'bg-blue-50 text-blue-700 border-blue-600 shadow-xs'
                        : fieldErrors.gender
                          ? 'border-rose-300 bg-rose-50/20 text-slate-700 hover:bg-rose-50/40'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${gender === 'MALE' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'}`}>
                      {gender === 'MALE' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>Laki-Laki</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGender('FEMALE');
                      clearFieldError('gender');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                      gender === 'FEMALE'
                        ? 'bg-blue-50 text-blue-700 border-blue-600 shadow-xs'
                        : fieldErrors.gender
                          ? 'border-rose-300 bg-rose-50/20 text-slate-700 hover:bg-rose-50/40'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${gender === 'FEMALE' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'}`}>
                      {gender === 'FEMALE' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>Perempuan</span>
                  </button>
                </div>
                {fieldErrors.gender && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.gender}</span>
                  </p>
                )}
              </div>

              {/* NIK (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <span>NIK (Nomor Induk Kependudukan)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">(Opsional)</span>
                  </label>
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
                    onChange={(e) => {
                      setNik(e.target.value.replace(/\D/g, '').slice(0, 16));
                      clearFieldError('nik');
                    }}
                    placeholder="Contoh: 3171012345670001 (16 Angka)"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all font-mono ${
                      fieldErrors.nik
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.nik && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.nik}</span>
                  </p>
                )}
              </div>

              {/* Province (Searchable Select - shadcn) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Provinsi</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">Pencarian</span>
                </label>
                <SearchableSelect
                  value={province}
                  onChange={handleProvinceChange}
                  options={provinceOptions}
                  placeholder="-- Pilih atau Cari Provinsi --"
                  searchPlaceholder="Ketik nama provinsi (contoh: Jawa Barat, DKI Jakarta)..."
                  emptyText="Provinsi tidak ditemukan."
                  hasError={Boolean(fieldErrors.province)}
                  icon={<MapPin className="w-4 h-4 text-slate-400" />}
                />
                {fieldErrors.province && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.province}</span>
                  </p>
                )}
              </div>

              {/* City / Regency (Searchable Select - shadcn) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Kota / Kabupaten</span>
                  <span className="text-rose-500">*</span>
                  {province ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">Pencarian</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">Terkunci</span>
                  )}
                </label>
                <SearchableSelect
                  value={city}
                  onChange={handleCityChange}
                  options={cityOptions}
                  disabled={!province}
                  placeholder={province ? "-- Pilih atau Cari Kota / Kabupaten --" : "-- Pilih Provinsi Terlebih Dahulu --"}
                  searchPlaceholder="Ketik nama kota atau kabupaten..."
                  emptyText="Kota/Kabupaten tidak ditemukan."
                  hasError={Boolean(fieldErrors.city)}
                  icon={<Building className="w-4 h-4 text-slate-400" />}
                />
                {fieldErrors.city && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.city}</span>
                  </p>
                )}
              </div>

              {/* Postal Code (Auto-filled on City selection) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <span>Kode Pos</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                      <span>Otomatis Terisi</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">Dapat disesuaikan jika perlu</span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    name="postal_code"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                      clearFieldError('postal_code');
                    }}
                    placeholder="Contoh: 12340 (5 Digit Angka)"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all font-mono ${
                      fieldErrors.postal_code
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.postal_code && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.postal_code}</span>
                  </p>
                )}
              </div>

              {/* Residential Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Alamat Lengkap Domisili</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">Wajib</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    name="address"
                    rows={3}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      clearFieldError('address');
                    }}
                    placeholder="Isi alamat jalan, RT/RW, nomor rumah, kelurahan/kecamatan..."
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition-all ${
                      fieldErrors.address
                        ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600'
                    }`}
                  />
                </div>
                {fieldErrors.address && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Kolom bertanda <span className="text-rose-500 font-bold">*</span> wajib diisi dengan data valid.
              </p>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Perubahan Profil
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
