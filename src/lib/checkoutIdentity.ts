export type CheckoutIdentityType = 'KTP' | 'PASSPORT';

export interface BuyerProfileLike {
  name?: string | null;
  first_name?: string | null;
  email?: string | null;
  nik?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  whatsapp?: string | null;
  no_hp?: string | null;
  address?: string | null;
  location?: string | null;
}

export function extractBuyerFormDefaults(user: BuyerProfileLike | null | undefined) {
  const rawNik = String(user?.nik || '').trim();
  const identityType = inferIdentityTypeFromValue(rawNik);
  return {
    name: user?.name || user?.first_name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || user?.whatsapp || user?.no_hp || '',
    address: user?.address || user?.location || '',
    identityType,
    identityNumber: sanitizeIdentityNumber(rawNik, identityType),
  };
}

export function inferIdentityTypeFromValue(value?: string | null): CheckoutIdentityType {
  const clean = (value || '').trim();
  if (clean !== '' && /[A-Za-z]/.test(clean)) {
    return 'PASSPORT';
  }
  return 'KTP';
}

export function sanitizeIdentityNumber(value: string, type: CheckoutIdentityType): string {
  if (type === 'PASSPORT') {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  }
  return value.replace(/\D/g, '').slice(0, 16);
}

export function isValidIdentityNumber(value: string, type: CheckoutIdentityType): boolean {
  if (type === 'PASSPORT') {
    return /^[A-Z0-9]{6,20}$/.test(value.trim().toUpperCase());
  }
  return /^\d{16}$/.test(value.trim().replace(/\D/g, ''));
}

export function isValidIndonesianPhone(value: string): boolean {
  const digits = value.trim().replace(/\D/g, '');
  return (
    /^(08|628|\+628|8)\d{8,11}$/.test(digits) ||
    (digits.length >= 10 && digits.length <= 13)
  );
}

export function getIdentityValidationMeta(value: string, type: CheckoutIdentityType) {
  const clean = value.trim();
  const isValid = isValidIdentityNumber(clean, type);

  if (type === 'PASSPORT') {
    return {
      isValid,
      placeholder: 'Nomor Passport (cth: A1234567)',
      badgeText: isValid ? '✓ Passport Valid' : `${clean.length} karakter`,
      errorText: 'Nomor Passport harus 6–20 huruf/angka.',
      successText: 'Nomor Passport terverifikasi',
      helperText: '6–20 karakter huruf/angka sesuai halaman identitas Passport.',
      maxLength: 20,
      inputMode: 'text' as const,
    };
  }

  return {
    isValid,
    placeholder: '16 Digit Angka NIK KTP (cth: 3171012345670001)',
    badgeText: isValid ? '✓ 16 Digit Lengkap' : `${clean.length}/16 digit`,
    errorText: `NIK KTP harus tepat 16 angka (saat ini ${clean.length} digit, kurang ${Math.max(0, 16 - clean.length)} digit)`,
    successText: 'NIK KTP 16 digit terverifikasi',
    helperText: 'Wajib 16 digit angka sesuai kartu identitas KTP.',
    maxLength: 16,
    inputMode: 'numeric' as const,
  };
}
