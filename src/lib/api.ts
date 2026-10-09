let envUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://metix-backend.lufexa.id/api/v1'
).trim().replace(/\/+$/, '');

// Ensure /v1 is always appended to API_BASE_URL
if (!envUrl.endsWith('/v1')) {
  if (envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/v1`;
  } else {
    envUrl = `${envUrl}/api/v1`;
  }
}

export const API_BASE_URL = envUrl;

export function getPhotoUrl(photoUrl?: string | null, eventId?: number | string, isEoProfile?: boolean): string | null {
  if (photoUrl && (photoUrl.startsWith('data:image') || photoUrl.startsWith('blob:'))) {
    return photoUrl;
  }



  if (!photoUrl || photoUrl === 'organizers/logo_default.png' || photoUrl === 'logo_default.png' || photoUrl.includes('logo_default')) {
    return null;
  }

  if (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('data:image') ||
    photoUrl.startsWith('blob:')
  ) {
    return photoUrl;
  }

  const backendBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  const cleanPath = photoUrl.replace(/^\//, '');
  if (cleanPath.startsWith('storage/')) {
    return `${backendBase}/${cleanPath}`;
  }
  return `${backendBase}/storage/${cleanPath}`;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  role?: 'BUYER' | 'EO' | 'pembeli' | 'mitra';
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role?: 'OWNER' | 'EO' | 'BUYER' | 'SCANNER' | string;
  nik?: string | null;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  email_verified_at?: string | null;
  photo?: string | null;
  profile_photo_url?: string | null;
  mitra_status?: 'pending' | 'approved' | 'rejected' | null;
  organizer_status?: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | string | null;
  rejection_reason?: string | null;
  buyer_profile?: {
    id?: number;
    user_id?: number;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  organizer_profile?: {
    id?: number;
    organization_name?: string;
    status?: string;
    rejection_reason?: string | null;
  } | null;
  roles?: Array<{ id: number; name: string }>;
}

export interface LoginResponse {
  success?: boolean;
  message: string;
  token_type?: string;
  token?: string;
  user?: UserProfile;
  errors?: Record<string, string[]>;
}

export interface ApiTicketType {
  id: number;
  event_id: number;
  category?: string;
  name: string;
  description?: string;
  price: string | number;
  quota?: number;
  available?: number;
  available_quota?: number;
  max_per_order?: number;
  sold_count?: number;
  sold_quantity?: number;
  reserved_quantity?: number;
  sale_start_at?: string;
  sale_end_at?: string;
  status?: string;
}

export interface ApiPromo {
  id: number;
  event_id: number;
  ticket_type_id?: number | null;
  ticket_type?: ApiTicketType | { id: number; name: string; category?: string; price?: number } | null;
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_discount?: number | null;
  min_purchase?: number | null;
  quota?: number | null;
  used_count?: number;
  max_usage_per_user?: number | null;
  start_at: string;
  end_at: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiLineupItem {
  id?: number | string;
  event_id?: number | string;
  name: string;
  image?: string | null;
  description?: string | null;
  role?: string;
  perform_time?: string;
  photo?: string | null;
}

export interface ApiSocialMedia {
  instagram?: string;
  tiktok?: string;
  website?: string;
  whatsapp?: string;
  youtube?: string;
}

export function parseSocialMediaObject(rawSocials: any, eventData?: any): {
  instagram: string;
  tiktok: string;
  website: string;
  whatsapp: string;
  youtube: string;
} {
  const res = { instagram: '', tiktok: '', website: '', whatsapp: '', youtube: '' };

  if (!rawSocials && eventData) {
    rawSocials = eventData.social_media || eventData.socials || eventData.social_medias;
  }

  if (typeof rawSocials === 'string') {
    try {
      rawSocials = JSON.parse(rawSocials);
    } catch { }
  }

  if (Array.isArray(rawSocials)) {
    rawSocials.forEach((item: any) => {
      if (!item) return;
      const name = String(item.name || item.type || item.platform || '').toLowerCase();
      const val = String(item.url || item.link || item.description || item.value || '').trim();
      if (name.includes('insta')) res.instagram = val;
      else if (name.includes('tik')) res.tiktok = val;
      else if (name.includes('web') || name.includes('site')) res.website = val;
      else if (name.includes('wa') || name.includes('what')) res.whatsapp = val;
      else if (name.includes('you') || name.includes('tube')) res.youtube = val;
    });
  } else if (rawSocials && typeof rawSocials === 'object') {
    res.instagram = String(rawSocials.instagram || rawSocials.Instagram || '').trim();
    res.tiktok = String(rawSocials.tiktok || rawSocials.TikTok || '').trim();
    res.website = String(rawSocials.website || rawSocials.Website || '').trim();
    res.whatsapp = String(rawSocials.whatsapp || rawSocials.WhatsApp || '').trim();
    res.youtube = String(rawSocials.youtube || rawSocials.YouTube || '').trim();
  }

  if (eventData) {
    if (!res.instagram && eventData.instagram) res.instagram = String(eventData.instagram).trim();
    if (!res.tiktok && eventData.tiktok) res.tiktok = String(eventData.tiktok).trim();
    if (!res.website && eventData.website) res.website = String(eventData.website).trim();
    if (!res.whatsapp && eventData.whatsapp) res.whatsapp = String(eventData.whatsapp).trim();
    if (!res.youtube && eventData.youtube) res.youtube = String(eventData.youtube).trim();
  }

  return res;
}

export interface ApiEvent {
  id: number;
  user_id?: number;
  organizer_id?: number;
  venue_id?: number;
  title: string;
  slug: string;
  description?: string | null;
  desc?: string | null;
  venue?: {
    id?: number;
    name?: string;
    address?: string;
    city?: string;
    latitude?: number | string;
    longitude?: number | string;
    capacity?: number | string;
  } | string | any | null;
  venue_name?: string | null;
  city?: string | null;
  location?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacity?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  published_at?: string | null;
  start_time?: string;
  end_time?: string;
  event_start_at?: string;
  event_end_at?: string;
  status: string;
  category?: string | null;
  banner?: string | null;
  venue_photo?: string | null;
  terms?: string | null;
  terms_and_conditions?: string | null;
  syarat_ketentuan?: string | null;
  ticket_types?: ApiTicketType[];
  local_tax_percentage?: number | string | null;
  require_holder_name?: boolean;
  setting?: ApiEventSetting | null;
  organizer?: any;
  lineups?: ApiLineupItem[];
  facilities?: string[];
  social_media?: ApiSocialMedia;
}

export interface ApiTicketDetail {
  id: number;
  ticket_code: string;
  order_number?: string;
  qr_token?: string;
  status: string;
  pdf_url?: string;
  qr_code_url?: string;
  created_at?: string;
  event?: {
    id: number;
    title: string;
    location?: string;
    venue?: string;
    city?: string;
    address?: string;
    event_start_at?: string;
    start_at?: string;
    event_end_at?: string;
    banner?: string;
    venue_photo?: string;
  };
  ticket_type?: {
    name: string;
    category?: string;
    price: string | number;
  };
  category?: string;
  holder_name?: string;
  attendee?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  order?: {
    id?: number | string;
    order_number?: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_phone?: string;
    status?: string;
    payment_status?: string;
    grand_total?: number | string;
    total_amount?: number | string;
    payment_method?: string;
    created_at?: string;
  };
}

export interface ApiReservation {
  id: number;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  status: string;
  expires_at: string;
  created_at?: string;
  event?: ApiEvent;
  ticket_type?: ApiTicketType;
}

export interface ApiOrder {
  id: number;
  order_number: string;
  reservation_id?: number;
  user_id?: number;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  subtotal: number | string;
  discount_amount?: number | string;
  grand_total: number | string;
  payment_method?: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | string;
  payment_url?: string | null;
  snap_token?: string | null;
  created_at?: string;
  tickets?: ApiTicketDetail[];
}

export interface ApiTicketTransferItem {
  id: number;
  uuid?: string;
  ticket_id: number;
  from_user_id: number;
  to_user_id?: number | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  status: string;
  created_at?: string;
  ticket?: ApiTicketDetail;
  from_user?: UserProfile;
  to_user?: UserProfile;
}

export interface ApiWithdrawalItem {
  id: number;
  user_id: number;
  amount: number | string;
  status: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
  notes?: string | null;
  processed_at?: string | null;
  created_at?: string;
  user?: UserProfile;
}

export interface PublicEventsResponse {
  events: ApiEvent[];
  categories: string[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface DashboardResponse {
  role?: 'BUYER' | 'EO' | 'OWNER' | 'SCANNER' | 'pembeli' | 'mitra' | 'owner';
  roleLabel?: string;
  tickets?: any;
  transfers?: any;
  transfersCount?: number;
  incomingTransfers?: any[];
  notifications?: any[];
  eventsList?: any[];
  orders?: {
    total?: number;
    paid?: number;
    pending?: number;
    cancelled?: number;
  };
  stats?: {
    totalEvents?: number;
    totalOrders?: number;
    totalRevenue?: number;
    totalUsers?: number;
    revenueToday?: number;
    revenueThisMonth?: number;
    commissionEarned?: number;
    activeEventsCount?: number;
    pendingMitraApprovals?: number;
    ticketsCount?: number;
    activeTicketsCount?: number;
    transfersCount?: number;
    checkinsCount?: number;
  };
  revenue?: {
    total_gross?: number;
    online?: number;
    offline?: number;
  };
  sales_channels?: {
    online?: {
      revenue: number;
      tickets_sold: number;
      orders_count: number;
    };
    offline?: {
      revenue: number;
      tickets_sold: number;
      orders_count: number;
    };
    comparison?: Array<{
      channel: string;
      revenue: number;
      tickets: number;
    }>;
  };
  demographics?: {
    gender?: {
      female: number;
      male: number;
      other: number;
      total: number;
      female_percentage: number;
      male_percentage: number;
    };
    age_groups?: Array<{
      bracket: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    total_profiles?: number;
  };
  ticket_types_by_event?: Array<{
    event_id: number;
    event_title: string;
    event_slug?: string;
    event_status?: string;
    start_at?: string;
    end_at?: string;
    total_quota: number;
    total_sold: number;
    total_revenue: number;
    ticket_types: Array<{
      id: number;
      name: string;
      price: number;
      quota: number;
      sold_count: number;
      remaining: number;
      percentage: number;
      revenue: number;
      status?: string;
    }>;
  }>;
}

export interface OfflineOrderItem {
  ticket_type_id: number;
  quantity: number;
  holder_names?: string[];
}

export interface CreateOfflineOrderPayload {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_nik?: string;
  date_of_birth?: string | null;
  gender?: 'MALE' | 'FEMALE' | string | null;
  promo_code?: string;
  payment_method: 'QRIS' | 'cash' | 'bank_transfer' | string;
  items: OfflineOrderItem[];
}

export interface CheckInPayload {
  ticket_code?: string;
  qr_token?: string;
  event_id?: number;
  device_uuid?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  ticket?: {
    code: string;
    holder_name?: string;
    event_name?: string;
    type_name?: string;
    status?: string;
  };
}

// ----------------------------------------------------------------------
// HELPER FOR AUTH HEADER & LOCAL STORAGE
// ----------------------------------------------------------------------

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('metix_token');
  }
  return null;
}

export function getStoredUser(): UserProfile | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('metix_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    const user = getStoredUser();
    if (user) {
      recordAuditLog('AUTH_LOGOUT', `Pengguna ${user.name} (${user.email}) melakukan logout dari sistem`);
    }
    localStorage.removeItem('metix_token');
    localStorage.removeItem('metix_user');
  }
}

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const authToken = token !== undefined ? token : getStoredToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// ----------------------------------------------------------------------
// AUTHENTICATION APIs
// ----------------------------------------------------------------------

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const user = data.user || data.data?.user;
      const token = data.token || data.data?.token;

      if (user) {
        user.phone = user.phone || (user as any).phone_number || (user as any).whatsapp || (user as any).no_hp || null;
      }

      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('metix_token', token);
        if (user) {
          localStorage.setItem('metix_user', JSON.stringify(user));
          recordAuditLog('AUTH_LOGIN', `Login berhasil sebagai ${user.name} (${user.email} - Role: ${user.role || 'USER'})`);
        }
      }

      return {
        user,
        token,
        message: data.message || 'Login berhasil',
      };
    }

    throw new Error(data?.message || data?.error || 'Email atau password yang Anda masukkan salah.');
  } catch (err: any) {
    if (err?.message) {
      throw err;
    }
    throw new Error('Gagal terhubung ke server API. Pastikan backend berjalan.');
  }
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
  let mappedRole = payload.role || 'BUYER';
  if (mappedRole === 'pembeli') mappedRole = 'BUYER';
  if (mappedRole === 'mitra') mappedRole = 'EO';

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation || payload.password,
      role: mappedRole,
      phone: payload.phone,
      phone_number: payload.phone,
      gender: payload.gender,
      birth_date: payload.birth_date,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Pendaftaran gagal. Silakan periksa kembali data Anda.';
    const errObj: any = new Error(errorMsg);
    errObj.errors = data?.errors;
    throw errObj;
  }

  const user = data.user || data.data?.user;
  const token = data.token || data.data?.token;

  if (user) {
    user.phone = user.phone || user.phone_number || payload.phone || null;
  }

  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('metix_token', token);
    if (user) {
      localStorage.setItem('metix_user', JSON.stringify(user));
    }
  }

  return {
    success: true,
    message: data.message || 'Registrasi berhasil',
    token: token,
    user: user,
  };
}

export async function requestOtpApi(payload: { email: string; purpose?: 'LOGIN' | 'REGISTER'; phone?: string }): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      data?.message ||
      'Gagal meminta kode OTP.';
    throw new Error(errorMsg);
  }

  return {
    success: true,
    message: data.message || 'Kode OTP berhasil dikirim ke email Anda',
  };
}

export async function loginOtpApi(payload: { email: string; otp: string }): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Kode OTP salah atau telah kadaluarsa.';
    throw new Error(errorMsg);
  }

  const user = data.user || data.data?.user;
  const token = data.token || data.data?.token;

  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('metix_token', token);
    if (user) {
      localStorage.setItem('metix_user', JSON.stringify(user));
    }
  }

  return {
    success: true,
    message: data.message || 'Login OTP berhasil',
    token,
    user,
  };
}

export async function registerOtpApi(payload: RegisterPayload & { otp: string }): Promise<LoginResponse> {
  let mappedRole = payload.role || 'BUYER';
  if (mappedRole === 'pembeli') mappedRole = 'BUYER';
  if (mappedRole === 'mitra') mappedRole = 'EO';

  const response = await fetch(`${API_BASE_URL}/auth/otp/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      otp: payload.otp,
      password: payload.password,
      password_confirmation: payload.password_confirmation || payload.password,
      role: mappedRole,
      phone: payload.phone,
      gender: payload.gender,
      birth_date: payload.birth_date,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Registrasi OTP gagal. Silakan periksa kembali data Anda.';
    throw new Error(errorMsg);
  }

  const user = data.user || data.data?.user;
  const token = data.token || data.data?.token;

  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('metix_token', token);
    if (user) {
      localStorage.setItem('metix_user', JSON.stringify(user));
    }
  }

  return {
    success: true,
    message: data.message || 'Registrasi OTP berhasil',
    token,
    user,
  };
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  if (token.startsWith('scanner_token_')) {
    return getStoredUser();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (response.status === 401) {
      const stored = getStoredUser();
      if (stored && (stored.role === 'SCANNER' || stored.role === 'mitra')) {
        return stored;
      }
      logoutUser();
      return null;
    }

    if (!response.ok) {
      return getStoredUser();
    }

    const data = await response.json();
    const user: UserProfile = data?.data || data?.user || data;

    if (user) {
      user.phone = user.phone || (user as any).phone_number || (user as any).whatsapp || (user as any).no_hp || null;

      if (user.organizer_profile && user.organizer_profile.status) {
        user.organizer_status = user.organizer_profile.status;
        user.mitra_status =
          user.organizer_profile.status === 'ACTIVE'
            ? 'approved'
            : user.organizer_profile.status === 'REJECTED'
              ? 'rejected'
              : 'pending';
        if (user.organizer_profile.rejection_reason) {
          user.rejection_reason = user.organizer_profile.rejection_reason;
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('metix_user', JSON.stringify(user));
      }
    }

    return user;
  } catch {
    return getStoredUser();
  }
}

export async function logoutApi(): Promise<void> {
  const token = getStoredToken();
  if (token && !token.startsWith('scanner_token_')) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(token),
      }).catch(() => {
        // Ignore network disconnection during logout
      });
    } catch {
      // Ignore errors during logout
    }
  }
  logoutUser();
}

// ----------------------------------------------------------------------
// PUBLIC EVENTS APIs
// ----------------------------------------------------------------------

export async function fetchPublicEvents(params?: {
  search?: string;
  city?: string;
  category?: string;
  page?: number;
}): Promise<PublicEventsResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/public/events`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.city) url.searchParams.append('city', params.city);
    if (params?.category) url.searchParams.append('category', params.category);
    if (params?.page) url.searchParams.append('page', String(params.page));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    const rawEvents = data?.data || data?.events || [];
    const allEvents = rawEvents;

    const meta = data?.meta || {
      current_page: data?.current_page || 1,
      per_page: data?.per_page || 20,
      total: allEvents.length,
      last_page: data?.last_page || 1,
    };

    const categories = Array.from(
      new Set(
        allEvents
          .map((e: any) =>
            typeof e.category === 'string'
              ? e.category
              : e.category && typeof e.category === 'object'
                ? e.category.name || e.category.title || ''
                : String(e.category || '')
          )
          .filter((c: any) => Boolean(c) && String(c).trim() !== '' && c !== '[object Object]')
      )
    ) as string[];

    return {
      events: allEvents,
      categories,
      meta,
    };
  } catch (error) {
    console.warn('Failed to fetch public events from API:', error);
    return { events: [], categories: [] };
  }
}

export async function fetchPublicEventDetail(slugOrId: string | number): Promise<ApiEvent | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/events/${slugOrId}`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || data?.event || data || null;
  } catch (error) {
    console.warn('Failed to fetch event detail from API:', error);
    return null;
  }
}

export async function fetchOrganizerEventDetail(eventId: number | string): Promise<ApiEvent | null> {
  const token = getStoredToken();
  if (!token || !eventId) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const eventData = data?.data || data?.event || data;
      if (eventData) return eventData;
    }
  } catch { }

  return fetchPublicEventDetail(eventId);
}

export async function fetchEventLineupsApi(eventId: number | string): Promise<ApiLineupItem[]> {
  const token = getStoredToken();
  if (!eventId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.data || data?.lineups || data;
      if (Array.isArray(list)) return list;
    }
  } catch { }

  try {
    const res = await fetch(`${API_BASE_URL}/public/events/${eventId}/lineups`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.data || data?.lineups || data;
      if (Array.isArray(list)) return list;
    }
  } catch { }

  return [];
}

export async function fetchEventFacilitiesApi(eventId: number | string): Promise<string[]> {
  const token = getStoredToken();
  if (!eventId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.data || data?.facilities || data;
      if (Array.isArray(list)) {
        return list.map((f: any) => (typeof f === 'string' ? f : String(f?.name || f?.title || f?.facility || ''))).filter(Boolean);
      }
    }
  } catch { }

  return [];
}

export async function fetchEventSocialMediaApi(eventId: number | string): Promise<ApiSocialMedia | null> {
  const token = getStoredToken();
  if (!eventId) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const raw = data?.data || data?.social_media || data?.socials || data;
      const parsed = parseSocialMediaObject(raw);
      if (parsed) {
        return parsed;
      }
    }
  } catch { }

  return null;
}

// ----------------------------------------------------------------------
// RESERVATIONS & CHECKOUT APIs
// ----------------------------------------------------------------------

export async function createReservation(payload: {
  event_id: number;
  ticket_type_id?: number;
  quantity?: number;
  items?: { ticket_type_id: number; quantity: number }[];
}): Promise<ApiReservation & { reservation_ids?: number[] }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      data?.message ||
      'Gagal membuat reservasi tiket. Stok mungkin tidak mencukupi.';
    throw new Error(errorMsg);
  }

  const rawRes = data?.data?.reservation || data?.reservation || data?.data || data;
  const resId = rawRes?.id || rawRes?.reservation_id || data?.id || data?.reservation_id || data?.data?.id || data?.data?.reservation_id;
  const reservationIds = data?.data?.reservation_ids || data?.reservation_ids || [Number(resId)];

  return {
    ...rawRes,
    id: Number(resId),
    reservation_ids: reservationIds,
  };
}

export async function fetchReservationDetail(reservationId: number): Promise<ApiReservation | null> {
  const token = getStoredToken();
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data;
  } catch {
    return null;
  }
}

export async function cancelReservation(reservationId: number): Promise<boolean> {
  const token = getStoredToken();
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function applyPromoCode(payload: {
  promo_code: string;
  event_id: number;
  subtotal: number;
  reservation_id?: number;
  ticket_type_id?: number;
  ticket_type_ids?: number[];
  items?: { ticket_type_id: number; quantity: number }[];
}): Promise<{
  valid: boolean;
  discount_amount: number;
  message: string;
  promo?: {
    code: string;
    name: string;
    ticket_type_id?: number | null;
    ticket_type_name?: string | null;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
  };
}> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/promos/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.errors?.promo_code?.[0] ||
      data?.message ||
      'Kode promo tidak valid atau telah kadaluarsa.';
    throw new Error(errorMsg);
  }

  const resData = data?.data || data;
  const discountVal = Number(
    resData?.discount_amount ??
    resData?.discount ??
    0
  );

  return {
    valid: true,
    discount_amount: discountVal,
    message: data?.message || 'Kode promo berhasil diterapkan!',
    promo: resData?.promo,
  };
}

export async function applyReferralCode(payload: {
  referral_code: string;
}): Promise<{ valid: boolean; message: string }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/referrals/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Kode referral tidak ditemukan.');
  }

  return {
    valid: true,
    message: data?.message || 'Kode referral berhasil diterapkan!',
  };
}

export async function previewCheckout(payload: {
  reservation_id: number;
  reservation_ids?: number[];
  promo_code?: string;
  referral_code?: string;
  payment_category?: string;
}): Promise<any> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/checkout/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Gagal menghitung rincian simulasi checkout.');
  }

  return data?.data || data;
}

export async function checkoutOrder(payload: {
  reservation_id: number;
  reservation_ids?: number[];
  promo_code?: string;
  referral_code?: string;
  payment_category?: string;
  payment_method?: string;
  nik?: string;
  address?: string;
}): Promise<ApiOrder> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      data?.message ||
      'Checkout gagal. Reservasi mungkin sudah kadaluarsa.';
    throw new Error(errorMsg);
  }

  return data?.data?.order || data?.data || data?.order || data;
}

export async function initiateOrderPayment(orderId: number, options: Record<string, any> = {}): Promise<{ payment_url?: string; snap_token?: string; payment_code?: string; va_number?: string; payment?: any }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(options),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      data?.message ||
      'Gagal memproses inisialisasi pembayaran DOKU.';
    throw new Error(errorMsg);
  }

  const paymentObj = data?.data?.payment || data?.payment || data?.data || data;
  const paymentUrl = paymentObj?.payment_url || data?.payment_url || data?.data?.payment_url;
  const paymentCode = paymentObj?.payment_code || paymentObj?.va_number || data?.payment_code || data?.va_number;

  return {
    payment_url: paymentUrl,
    snap_token: data?.snap_token || paymentObj?.snap_token,
    payment_code: paymentCode,
    va_number: paymentCode,
    payment: paymentObj,
  };
}

export async function fetchPaymentStatus(orderId: number): Promise<{ status: string; order?: ApiOrder }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    return { status: 'PENDING' };
  }

  const data = await response.json();
  return {
    status: data?.status || data?.data?.status || 'PENDING',
    order: data?.order || data?.data?.order,
  };
}

// ----------------------------------------------------------------------
// USER TICKETS & SCANNER APIs
// ----------------------------------------------------------------------

export async function fetchUserTickets(): Promise<ApiTicketDetail[]> {
  const token = getStoredToken();
  const user = getStoredUser();
  const currentUserEmail = (user?.email || '').toLowerCase().trim();
  const currentUserId = user?.id;

  let apiTickets: ApiTicketDetail[] = [];
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        // Support standard array, Laravel Resource Pagination (data.data.data), or data.tickets
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
            ? data.data.data
            : Array.isArray(data?.tickets)
              ? data.tickets
              : Array.isArray(data)
                ? data
                : [];
        if (Array.isArray(list) && list.length > 0) {
          apiTickets = list.map((t: any, idx: number) => {
            const rawCode = t.ticket_code || t.code || t.ticket_number || t.qr_token;
            const orderNum = t.order?.order_number || t.order_number;
            const finalCode = rawCode || (orderNum ? `TKT-${orderNum}-${idx + 1}` : `TKT-${t.id || idx + 1}`);

            const ordStatus = String(t.order?.status || t.order_status || t.order?.payment_status || '').toLowerCase();
            const isUnpaidOrder = ['pending', 'unpaid', 'waiting_payment', 'waiting_for_payment', 'draft'].includes(ordStatus);
            const resolvedStatus = isUnpaidOrder ? 'pending_payment' : (t.status ? String(t.status).toLowerCase() : 'active');

            return {
              ...t,
              ticket_type: t.ticket_type || t.ticketType,
              ticket_code: finalCode,
              qr_token: t.qr_token || finalCode,
              order_number: orderNum || t.order_number,
              status: resolvedStatus,
            };
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user tickets from API:', error);
    }
  }

  return apiTickets;
}

export async function fetchUserOrders(): Promise<any[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data)
            ? data
            : [];
      return list;
    }
  } catch (error) {
    console.warn('Failed to fetch user orders:', error);
  }

  return [];
}

export async function fetchTicketDetail(ticketId: number): Promise<ApiTicketDetail | null> {
  const token = getStoredToken();
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data?.ticket || data;
  } catch {
    return null;
  }
}

export function getTicketQrUrl(ticketId: number): string {
  const token = getStoredToken();
  const url = new URL(`${API_BASE_URL}/tickets/${ticketId}/qr`);
  if (token) url.searchParams.append('token', token);
  return url.toString();
}

export function getTicketPdfUrl(ticket: ApiTicketDetail): string {
  if (ticket.pdf_url) return ticket.pdf_url;
  const token = getStoredToken();
  const url = new URL(`${API_BASE_URL}/tickets/${ticket.id}/pdf`);
  if (token) url.searchParams.append('token', token);
  return url.toString();
}

export async function processCheckIn(payload: CheckInPayload): Promise<CheckInResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const rawCode = (payload.qr_token || payload.ticket_code || '').trim();
  const cleanedCode = rawCode
    .replace(/^CODE:\s*/i, '')
    .replace(/[\r\n\t]+/g, '')
    .trim();

  if (!cleanedCode) {
    return {
      success: false,
      message: 'Kode tiket tidak boleh kosong.',
    };
  }

  // 1. Smart order & ticket pre-lookup to identify true event_id and ticket metadata
  let matchedOrder: any = null;
  let resolvedTicketCode = cleanedCode;

  try {
    const ordersRes = await fetch(`${API_BASE_URL}/orders`, { headers: getHeaders(token) });
    if (ordersRes.ok) {
      const oData = await ordersRes.json();
      const oList = Array.isArray(oData?.data)
        ? oData.data
        : Array.isArray(oData?.data?.data)
          ? oData.data.data
          : Array.isArray(oData)
            ? oData
            : [];

      const cleanLower = cleanedCode.toLowerCase();
      matchedOrder = oList.find((o: any) => {
        const oNum = (o?.order_number || o?.code || '').trim().toLowerCase();
        if (oNum && (oNum === cleanLower || cleanLower.includes(oNum) || oNum.includes(cleanLower))) return true;

        const tkts = o?.tickets || o?.ticket_items || o?.items || [];
        return tkts.some((tk: any) => {
          const tc = (tk?.ticket_code || tk?.code || tk?.qr_token || tk?.ticket_number || '').trim().toLowerCase();
          return tc && (tc === cleanLower || cleanLower.includes(tc));
        });
      });

      if (matchedOrder) {
        const tkts = matchedOrder.tickets || matchedOrder.ticket_items || matchedOrder.items || [];
        const foundTicket = tkts.find((tk: any) => {
          const tc = (tk?.ticket_code || tk?.code || tk?.qr_token || tk?.ticket_number || '').trim().toLowerCase();
          return tc && (tc === cleanLower || cleanLower.includes(tc));
        }) || tkts[0];

        if (foundTicket) {
          resolvedTicketCode = foundTicket.ticket_code || foundTicket.qr_token || foundTicket.code || resolvedTicketCode;
        }
      }
    }
  } catch {
    // Continue with direct scan if pre-lookup is unavailable
  }

  // Pre-lookup in organizer reports if /orders didn't have the order (for EO accounts)
  if (!matchedOrder) {
    try {
      const repRes = await fetch(`${API_BASE_URL}/organizer/reports`, { headers: getHeaders(token) });
      if (repRes.ok) {
        const repData = await repRes.json();
        const repOrders = repData?.data?.orders || repData?.orders || [];
        const cleanLower = cleanedCode.toLowerCase();
        matchedOrder = repOrders.find((o: any) => {
          const oNum = (o?.order_number || o?.code || '').trim().toLowerCase();
          return oNum && (oNum === cleanLower || cleanLower.includes(oNum) || oNum.includes(cleanLower));
        });
      }
    } catch { }
  }

  const targetEventId = payload.event_id;
  const deviceUuid = payload.device_uuid || 'WEB-SCANNER-01';

  if (!targetEventId) {
    return {
      success: false,
      message: 'Silakan pilih event penugasan Anda terlebih dahulu sebelum melakukan scan tiket.',
    };
  }

  // Codes to test with backend scan
  const codesToTry = [resolvedTicketCode];
  if (cleanedCode !== resolvedTicketCode && !codesToTry.includes(cleanedCode)) {
    codesToTry.push(cleanedCode);
  }

  for (const codeAttempt of codesToTry) {
    try {
      const response = await fetch(`${API_BASE_URL}/scanner/events/${targetEventId}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify({
          qr_token: codeAttempt,
          ticket_code: codeAttempt,
          code: codeAttempt,
          order_number: cleanedCode,
          device_uuid: deviceUuid,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const isSuccess = response.ok && data?.success !== false;

      if (isSuccess) {
        const rawTicket = data?.ticket || data?.data?.ticket || data?.data;
        const returnedTicket = {
          code: rawTicket?.ticket_code || rawTicket?.code || codeAttempt,
          holder_name: rawTicket?.holder_name || rawTicket?.order?.buyer_name || rawTicket?.buyer_name || matchedOrder?.buyer_name || 'Pengunjung Gate',
          event_name: rawTicket?.event_name || rawTicket?.event?.title || matchedOrder?.event?.title || 'Event Metix',
          type_name: rawTicket?.type_name || rawTicket?.ticket_type?.name || 'Tiket Masuk',
          status: 'used',
        };

        return {
          success: true,
          message: data?.message || 'Check-In Berhasil! Tiket Valid.',
          ticket: returnedTicket,
        };
      }

      let errMsg = data?.message || data?.error || 'Gagal memvalidasi tiket untuk event ini.';
      if (data?.errors && typeof data.errors === 'object') {
        const errArr = Object.values(data.errors).flat();
        if (errArr.length > 0) {
          errMsg = `${errMsg} (${errArr.join(', ')})`;
        }
      }

      return {
        success: false,
        message: errMsg,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Koneksi ke server scanner terganggu. Silakan periksa jaringan Anda.',
      };
    }
  }

  return {
    success: false,
    message: `Kode tiket [${cleanedCode}] tidak valid atau tidak ditemukan.`,
  };
}

export async function resetTicketScan(payload: { ticket_code: string; event_id?: number }): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const eventId = payload.event_id || 1;
  const response = await fetch(`${API_BASE_URL}/scanner/events/${eventId}/scan-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({
      qr_token: payload.ticket_code,
      ticket_code: payload.ticket_code,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok && data?.success !== false) {
    return {
      success: true,
      message: data?.message || 'Status tiket berhasil dikembalikan menjadi Siap Check-In (ACTIVE).',
    };
  }

  throw new Error(data?.message || 'Gagal mengembalikan status tiket.');
}

export async function fetchScannerDashboard(): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/scanner/dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchScannerEvents(): Promise<ApiEvent[]> {
  const token = getStoredToken();

  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/scanner/events`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        const list = data?.data || data?.events || [];
        if (list && list.length > 0) return list;
      }
    } catch {
      // Ignore API errors
    }

    // Fallback: If user is an organizer, load organizer's events
    try {
      const myEvts = await fetchMyEvents();
      if (myEvts?.events && myEvts.events.length > 0) {
        return myEvts.events;
      }
    } catch { }
  }

  return [];
}

export async function fetchScannerCheckIns(eventId: number | string): Promise<any[]> {
  const token = getStoredToken();
  if (!token || !eventId) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/scanner/events/${eventId}/check-ins`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const list = data?.data || data?.check_ins || (Array.isArray(data) ? data : []);
      if (Array.isArray(list)) {
        return list.map((item: any) => {
          const tkt = item.ticket || {};
          const att = tkt.attendee || {};
          const evt = item.event || tkt.event || {};
          const typeObj = tkt.ticket_type || tkt.ticketType || {};
          const userObj = item.checked_in_by || item.checked_in_by_user || item.scanner_user;
          const checkedInUserId = item.checked_in_by_id || (typeof userObj === 'object' ? userObj?.id : userObj) || null;
          const checkedInUserEmail = item.checked_in_by_email || (typeof userObj === 'object' ? userObj?.email : null) || null;

          return {
            id: String(item.id || Date.now() + Math.random()),
            code: item.ticket_code || tkt.ticket_code || tkt.qr_token || item.code || '',
            holderName: item.attendee_name || att.full_name || tkt.holder_name || '',
            buyerEmail: att.email || tkt.owner?.email || item.buyer_email || '',
            typeName: item.ticket_type || typeObj.name || '',
            eventName: evt.title || item.event_name || '',
            status: 'valid',
            timestamp: item.checked_in_at
              ? new Date(item.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            message: 'Check-In Valid (API Real-time)',
            scanner_user: typeof userObj === 'object' ? userObj.name || userObj.email : String(userObj || ''),
            checked_in_by_id: checkedInUserId,
            checked_in_by_email: checkedInUserEmail,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch real-time scanner check-ins from API:', err);
  }

  return [];
}

// ----------------------------------------------------------------------
// ROLE DASHBOARDS APIs
// ----------------------------------------------------------------------

export async function fetchOwnerDashboard(): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchOrganizerDashboard(): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchBuyerDashboard(): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/buyer/dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchDashboardData(): Promise<DashboardResponse | null> {
  const token = getStoredToken();
  const user = getStoredUser();
  if (!token) return null;

  let role: 'BUYER' | 'EO' | 'OWNER' | 'SCANNER' = 'BUYER';
  let roleLabel = 'Pembeli Tiket';

  if (user) {
    const rawRole = (user.role || '').toUpperCase();
    const roleNames = user.roles ? user.roles.map((r) => r.name.toUpperCase()) : [];

    if (rawRole === 'OWNER' || roleNames.includes('OWNER') || roleNames.includes('SUPER ADMIN')) {
      role = 'OWNER';
      roleLabel = 'Super Admin Platform';
    } else if (rawRole === 'EO' || rawRole === 'MITRA' || roleNames.includes('EO') || roleNames.includes('MITRA')) {
      role = 'EO';
      roleLabel = 'Event Organizer (EO)';
    } else if (rawRole === 'SCANNER' || roleNames.includes('SCANNER')) {
      role = 'SCANNER';
      roleLabel = 'Admin Scanner Staff';
    } else {
      role = 'BUYER';
      roleLabel = 'Pembeli Tiket';
    }
  }

  try {
    let endpoint = `${API_BASE_URL}/buyer/dashboard`;
    if (role === 'OWNER') endpoint = `${API_BASE_URL}/owner/dashboard`;
    if (role === 'EO') endpoint = `${API_BASE_URL}/organizer/dashboard`;
    if (role === 'SCANNER') endpoint = `${API_BASE_URL}/scanner/dashboard`;

    const response = await fetch(endpoint, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const rawData = data?.data || data;

    let normalizedStats = data?.stats || rawData?.stats;
    if (role === 'OWNER') {
      normalizedStats = {
        totalEvents: rawData?.events?.total ?? normalizedStats?.totalEvents ?? 0,
        totalRevenue: rawData?.revenue?.total_gross ?? normalizedStats?.totalRevenue ?? 0,
        totalUsers: rawData?.users?.total ?? normalizedStats?.totalUsers ?? 0,
        totalOrganizers: rawData?.users?.organizers ?? normalizedStats?.totalOrganizers ?? 0,
        pendingMitraApprovals: rawData?.users?.pending_organizers ?? 0,
        activeOrganizers: rawData?.users?.active_organizers ?? rawData?.users?.organizers ?? 0,
        totalOrders: rawData?.orders?.total ?? normalizedStats?.totalOrders ?? 0,
        commissionEarned: rawData?.revenue?.platform_commission ?? normalizedStats?.commissionEarned ?? Math.round((rawData?.revenue?.total_gross || 0) * 0.05),
        ...(normalizedStats || {}),
      };
    } else if (role === 'EO') {
      normalizedStats = {
        totalEvents: rawData?.events?.total ?? normalizedStats?.totalEvents ?? 0,
        totalOrders: rawData?.orders?.paid ?? rawData?.orders?.total ?? normalizedStats?.totalOrders ?? 0,
        totalRevenue: rawData?.revenue?.total_gross ?? normalizedStats?.totalRevenue ?? 0,
        checkinsCount: rawData?.check_ins?.total ?? 0,
        scannersCount: rawData?.scanners?.total ?? 0,
        ...(normalizedStats || {}),
      };
    }

    return {
      ...data,
      stats: normalizedStats || data?.stats,
      role,
      roleLabel,
    };
  } catch (error) {
    console.warn('Failed to fetch dashboard data from API:', error);
    return {
      role,
      roleLabel,
      stats: {},
      tickets: { data: [] },
      eventsList: [],
    };
  }
}

// ----------------------------------------------------------------------
// ORGANIZER EVENT MANAGEMENT APIs
// ----------------------------------------------------------------------

export async function fetchMyEvents(): Promise<{
  events: ApiEvent[];
  stats?: any;
}> {
  const token = getStoredToken();
  if (!token) return { events: [] };

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    let eventsList: ApiEvent[] = data?.data || data?.events || [];

    const storedUser = getStoredUser();
    const userRole = (storedUser?.role || '').toUpperCase();

    if (userRole !== 'OWNER') {
      const profile = await fetchOrganizerProfile();
      if (profile && profile.id) {
        const filtered = eventsList.filter((e) => {
          const orgId = e.organizer?.id || e.organizer_id;
          return !orgId || Number(orgId) === Number(profile.id);
        });
        if (filtered.length > 0) {
          eventsList = filtered;
        }
      }
    }

    return {
      events: eventsList,
      stats: data?.stats,
    };
  } catch (error) {
    console.warn('Failed to fetch organizer events from API:', error);
    return { events: [] };
  }
}

export interface FetchMasterEventsParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface FetchMasterEventsResponse {
  events: ApiEvent[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchMasterEvents(params?: FetchMasterEventsParams): Promise<FetchMasterEventsResponse> {
  const token = getStoredToken();
  if (!token) return { events: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };

  try {
    const url = new URL(`${API_BASE_URL}/owner/events`);
    if (params?.search && params.search.trim()) url.searchParams.append('search', params.search.trim());
    if (params?.status && params.status !== 'all') url.searchParams.append('status', params.status);
    if (params?.page) url.searchParams.append('page', String(params.page));
    if (params?.per_page) url.searchParams.append('per_page', String(params.per_page));

    let res = await fetch(url.toString(), {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Fallback to organizer/events
      const fallbackUrl = new URL(`${API_BASE_URL}/organizer/events`);
      if (params?.search && params.search.trim()) fallbackUrl.searchParams.append('search', params.search.trim());
      if (params?.status && params.status !== 'all') fallbackUrl.searchParams.append('status', params.status);
      if (params?.page) fallbackUrl.searchParams.append('page', String(params.page));
      if (params?.per_page) fallbackUrl.searchParams.append('per_page', String(params.per_page));

      res = await fetch(fallbackUrl.toString(), {
        headers: getHeaders(token),
        cache: 'no-store',
      });
    }

    if (!res.ok) return { events: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };

    const data = await res.json();
    const eventList: ApiEvent[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.events) ? data.events : []);
    const meta = data?.meta || {
      current_page: Number(params?.page || 1),
      last_page: 1,
      per_page: Number(params?.per_page || 15),
      total: eventList.length,
    };

    return { events: eventList, meta };
  } catch (err) {
    console.warn('Failed to fetch master events:', err);
    return { events: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
  }
}

export async function updateOwnerEventStatusApi(
  eventId: number | string,
  status: string
): Promise<ApiEvent> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/owner/events/${eventId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Gagal memperbarui status event.');
  }

  return data?.data || data;
}

export async function updateOwnerEventVenueApi(
  eventId: number | string,
  payload: {
    name: string;
    address?: string;
    city?: string;
    capacity?: number;
    latitude?: number;
    longitude?: number;
  }
): Promise<ApiEvent> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/owner/events/${eventId}/venue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Gagal menyimpan venue dan lokasi event.');
  }

  return data?.data || data;
}

export interface ApiEventFacilityItem {
  id: number;
  event_id?: number;
  name: string;
  image?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchEventFacilitiesList(eventId: number | string): Promise<ApiEventFacilityItem[]> {
  const token = getStoredToken();
  if (!token || !eventId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data || data?.facilities || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function createEventFacilityApi(
  eventId: number | string,
  payload: { name: string; description?: string; image?: File | string | null }
): Promise<ApiEventFacilityItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.description) {
    formData.append('description', payload.description);
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image) {
    formData.append('image', payload.image);
  }

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan fasilitas event.';
    throw new Error(errorMsg);
  }

  return data?.data?.facility || data?.data || data?.facility || data;
}

export async function updateEventFacilityApi(
  eventId: number | string,
  facilityId: number | string,
  payload: { name: string; description?: string; image?: File | string | null }
): Promise<ApiEventFacilityItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('name', payload.name);
  if (payload.description !== undefined) {
    formData.append('description', payload.description || '');
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image) {
    formData.append('image', payload.image);
  }

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities/${facilityId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui fasilitas event.';
    throw new Error(errorMsg);
  }

  return data?.data?.facility || data?.data || data?.facility || data;
}

export async function deleteEventFacilityApi(
  eventId: number | string,
  facilityId: number | string
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities/${facilityId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus fasilitas event.');
  }

  return true;
}

export interface ApiEventLineupItem {
  id: number;
  event_id?: number;
  name: string;
  image?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchEventLineupsList(eventId: number | string): Promise<ApiEventLineupItem[]> {
  const token = getStoredToken();
  if (!token || !eventId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data || data?.lineups || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function createEventLineupApi(
  eventId: number | string,
  payload: { name: string; description?: string; image?: File | string | null }
): Promise<ApiEventLineupItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.description) {
    formData.append('description', payload.description);
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image) {
    formData.append('image', payload.image);
  }

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan lineup event.';
    throw new Error(errorMsg);
  }

  return data?.data?.lineup || data?.data || data?.lineup || data;
}

export async function updateEventLineupApi(
  eventId: number | string,
  lineupId: number | string,
  payload: { name: string; description?: string; image?: File | string | null }
): Promise<ApiEventLineupItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('name', payload.name);
  if (payload.description !== undefined) {
    formData.append('description', payload.description || '');
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  } else if (typeof payload.image === 'string' && payload.image) {
    formData.append('image', payload.image);
  }

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups/${lineupId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui lineup event.';
    throw new Error(errorMsg);
  }

  return data?.data?.lineup || data?.data || data?.lineup || data;
}

export async function deleteEventLineupApi(
  eventId: number | string,
  lineupId: number | string
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups/${lineupId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus lineup event.');
  }

  return true;
}

export interface ApiEventSocialMediaItem {
  id: number;
  event_id?: number;
  name: string;
  image?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchEventSocialMediasList(eventId: number | string): Promise<ApiEventSocialMediaItem[]> {
  const token = getStoredToken();
  if (!token || !eventId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data || data?.social_medias || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function createEventSocialMediaApi(
  eventId: number | string,
  payload: { name: string; url?: string; description?: string }
): Promise<ApiEventSocialMediaItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      image: payload.url || null,
      description: payload.description || null,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan media sosial event.';
    throw new Error(errorMsg);
  }

  return data?.data?.social_media || data?.data || data;
}

export async function updateEventSocialMediaApi(
  eventId: number | string,
  socialMediaId: number | string,
  payload: { name: string; url?: string; description?: string }
): Promise<ApiEventSocialMediaItem> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias/${socialMediaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      image: payload.url !== undefined ? payload.url : null,
      description: payload.description !== undefined ? payload.description : null,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui media sosial event.';
    throw new Error(errorMsg);
  }

  return data?.data?.social_media || data?.data || data;
}

export async function deleteEventSocialMediaApi(
  eventId: number | string,
  socialMediaId: number | string
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu.');

  const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias/${socialMediaId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus media sosial event.');
  }

  return true;
}

export interface ApiEventScannerItem {
  id: number;
  event_id?: number;
  name: string;
  email: string;
  phone?: string | null;
  role_in_team?: string;
  scan_count?: number;
  scan_quota?: number;
  status?: string;
  joined_at?: string;
}

export async function fetchEventScannersList(eventId: number | string): Promise<ApiEventScannerItem[]> {
  const token = getStoredToken();
  if (!token || !eventId) return [];

  // 1. Try dedicated endpoint GET /organizer/events/{event}/scanners
  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/scanners`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.data || [];
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch { }

  // 2. Fallback to /organizer/team if event scanners endpoint unavailable
  try {
    const res = await fetch(`${API_BASE_URL}/organizer/team`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data || [];
    if (Array.isArray(list)) {
      return list.filter((m: any) => Number(m.event_id) === Number(eventId));
    }
    return [];
  } catch {
    return [];
  }
}

export async function assignScannerToEvent(eventId: number | string, scannerUserId: number | string): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !eventId || !scannerUserId) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/scanners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({
        scanner_user_id: Number(scannerUserId),
        status: 'ACTIVE',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unassignScannerFromEvent(eventId: number | string, scannerUserId: number | string): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !eventId || !scannerUserId) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/scanners/${scannerUserId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface CreateVenuePayload {
  name: string;
  address: string;
  city: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacity?: number | string | null;
}

export async function createVenue(payload: CreateVenuePayload): Promise<{ id: number; name: string } | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({
        name: payload.name,
        address: payload.address || 'Jl. Utama',
        city: payload.city || 'Jakarta',
        latitude: payload.latitude !== undefined && payload.latitude !== null && !isNaN(Number(payload.latitude)) ? Number(payload.latitude) : -6.2088,
        longitude: payload.longitude !== undefined && payload.longitude !== null && !isNaN(Number(payload.longitude)) ? Number(payload.longitude) : 106.8456,
        capacity: payload.capacity && !isNaN(Number(payload.capacity)) ? Number(payload.capacity) : 5000,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.warn('Failed to create venue in backend:', errorJson);
      return null;
    }

    const resData = await response.json();
    const createdVenue = resData?.data || resData;
    if (createdVenue && createdVenue.id) {
      return { id: Number(createdVenue.id), name: createdVenue.name };
    }
  } catch (error) {
    console.warn('Error in createVenue:', error);
  }

  return null;
}

export async function saveEventLineupsApi(eventId: number | string, lineups: ApiLineupItem[]): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !eventId) return false;

  const validLineups = (lineups || []).filter((item) => item && item.name && item.name.trim());

  // Fetch current lineups in DB
  let currentItems: any[] = [];
  try {
    const listRes = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups?per_page=100`, {
      headers: getHeaders(token),
    });
    if (listRes.ok) {
      const listData = await listRes.json().catch(() => ({}));
      currentItems = Array.isArray(listData?.data) ? listData.data : (listData?.data?.data || []);
    }
  } catch { }

  const payloadItemIds = new Set(validLineups.map((item) => String(item.id)).filter(Boolean));

  // Delete items that are no longer present in payload
  for (const item of currentItems) {
    if (item?.id && !payloadItemIds.has(String(item.id))) {
      try {
        await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups/${item.id}`, {
          method: 'DELETE',
          headers: getHeaders(token),
        });
      } catch { }
    }
  }

  // Create or Update items
  for (const item of validLineups) {
    try {
      const jsonPayload = {
        event_id: Number(eventId),
        name: item.name.trim(),
        image: item.image || '',
        description: item.description || item.role || '',
      };

      const isExisting =
        item.id &&
        !String(item.id).startsWith('new_') &&
        !isNaN(Number(item.id)) &&
        currentItems.some((c) => String(c.id) === String(item.id));

      if (isExisting) {
        const res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups/${item.id}`, {
          method: 'PUT',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        });
        if (!res.ok) {
          await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups`, {
            method: 'POST',
            headers: {
              ...getHeaders(token),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonPayload),
          });
        }
      } else {
        await fetch(`${API_BASE_URL}/organizer/events/${eventId}/lineups`, {
          method: 'POST',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        });
      }
    } catch (e) {
      console.warn('saveEventLineupsApi item failed:', e);
    }
  }
  return true;
}

export async function saveEventFacilitiesApi(eventId: number | string, facilities: string[]): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !eventId) return false;

  const cleanList = (facilities || []).map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean);

  // First fetch existing facilities for this event and clear them to prevent duplication on edit
  try {
    const listRes = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities?per_page=100`, {
      headers: getHeaders(token),
    });
    if (listRes.ok) {
      const listData = await listRes.json().catch(() => ({}));
      const items = Array.isArray(listData?.data) ? listData.data : (listData?.data?.data || []);
      for (const item of items) {
        if (item?.id) {
          await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities/${item.id}`, {
            method: 'DELETE',
            headers: getHeaders(token),
          }).catch(() => { });
        }
      }
    }
  } catch { }

  if (cleanList.length === 0) return true;

  for (const fac of cleanList) {
    try {
      const jsonPayload = {
        event_id: Number(eventId),
        name: fac,
        description: fac,
        facility: fac,
      };

      let res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facilities`, {
        method: 'POST',
        headers: {
          ...getHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      if (!res.ok && res.status === 404) {
        await fetch(`${API_BASE_URL}/organizer/events/${eventId}/facility`, {
          method: 'POST',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        });
      }
    } catch (e) {
      console.warn('saveEventFacilitiesApi failed for item:', fac, e);
    }
  }
  return true;
}

export async function saveEventSocialMediaApi(eventId: number | string, socials: ApiSocialMedia): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !eventId || !socials) return false;

  const list: Array<{ name: string; url: string }> = [
    { name: 'Instagram', url: socials.instagram || '' },
    { name: 'TikTok', url: socials.tiktok || '' },
    { name: 'Website', url: socials.website || '' },
    { name: 'WhatsApp', url: socials.whatsapp || '' },
    { name: 'YouTube', url: socials.youtube || '' },
  ].filter((s) => s.url.trim() !== '');

  for (const item of list) {
    try {
      const jsonPayload = {
        name: item.name,
        description: item.url,
      };

      let res = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-medias`, {
        method: 'POST',
        headers: {
          ...getHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      if (!res.ok && res.status === 404) {
        await fetch(`${API_BASE_URL}/organizer/events/${eventId}/social-media`, {
          method: 'POST',
          headers: {
            ...getHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: Number(eventId),
            instagram: socials.instagram || '',
            tiktok: socials.tiktok || '',
            website: socials.website || '',
            whatsapp: socials.whatsapp || '',
            youtube: socials.youtube || '',
          }),
        });
      }
    } catch (e) {
      console.warn('saveEventSocialMediaApi failed for item:', item, e);
    }
  }
  return true;
}

export async function createEvent(formData: FormData): Promise<boolean> {
  let token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  // Auto-sync fresh user profile from API database before submission
  try {
    const freshUser = await fetchUserProfile();
    if (freshUser) {
      const freshToken = getStoredToken();
      if (freshToken) token = freshToken;
    }
  } catch { }

  const orgProfile = await fetchOrganizerProfile().catch(() => null);
  if (orgProfile && orgProfile.id) {
    formData.set('organizer_id', String(orgProfile.id));
  } else {
    const user = getStoredUser();
    if (user) {
      const orgId = (user as any).organizer_id || (user as any).organizer?.id || user.id;
      if (orgId) formData.set('organizer_id', String(orgId));
    }
  }

  // Sanitize venue_id so exists:venues,id validation passes
  const venueId = formData.get('venue_id');
  if (!venueId || isNaN(Number(venueId))) {
    formData.delete('venue_id');
  }

  const localPreview = formData.get('_local_banner_preview');
  formData.delete('_local_banner_preview');

  // Extract lineups, facilities, socials for dedicated sub-resource API calls
  const rawLineups = formData.get('lineups');
  let parsedLineups: ApiLineupItem[] = [];
  if (typeof rawLineups === 'string') {
    try {
      parsedLineups = JSON.parse(rawLineups);
    } catch { }
  }

  const rawFacilities = formData.get('facilities');
  let parsedFacilities: string[] = [];
  if (typeof rawFacilities === 'string') {
    try {
      parsedFacilities = JSON.parse(rawFacilities);
    } catch { }
  }

  const rawSocials = formData.get('social_media');
  let parsedSocials: ApiSocialMedia | null = null;
  if (typeof rawSocials === 'string') {
    try {
      parsedSocials = JSON.parse(rawSocials);
    } catch { }
  }

  try {
    let response = await fetch(`${API_BASE_URL}/organizer/events`, {
      method: 'POST',
      headers: getHeaders(token),
      body: formData,
    });

    // If 403 or 401 occurs, auto-refresh user session from database and retry once
    if (response.status === 403 || response.status === 401) {
      const freshProfile = await fetchOrganizerProfile().catch(() => null);
      if (freshProfile && freshProfile.id) {
        formData.set('organizer_id', String(freshProfile.id));
      }
      token = getStoredToken() || token;

      response = await fetch(`${API_BASE_URL}/organizer/events`, {
        method: 'POST',
        headers: getHeaders(token),
        body: formData,
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        'Gagal membuat event baru.'
      );
    }

    const newEvt = data?.data || data?.event;
    const createdId = newEvt?.id;

    if (createdId) {
      if (localPreview && typeof window !== 'undefined') {
        try {
        } catch { }
      }

      // Synchronize sub-resource APIs for Lineup, Facilities, Social Media
      await saveEventLineupsApi(createdId, parsedLineups || []);
      await saveEventFacilitiesApi(createdId, parsedFacilities || []);
      if (parsedSocials) {
        await saveEventSocialMediaApi(createdId, parsedSocials);
      }
    }

    return true;
  } catch (error: any) {
    console.error('Backend createEvent failed:', error);
    throw error;
  }
}

export async function updateEvent(eventId: number, formData: FormData): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  formData.append('_method', 'PUT');

  const user = getStoredUser();
  if (user && !formData.has('organizer_id')) {
    const orgId = (user as any).organizer_id || (user as any).organizer?.id || user.id || 1;
    formData.set('organizer_id', String(orgId));
  }

  // Sanitize venue_id so exists:venues,id validation passes
  const venueId = formData.get('venue_id');
  if (!venueId || isNaN(Number(venueId))) {
    formData.delete('venue_id');
  }

  const localPreview = formData.get('_local_banner_preview');
  formData.delete('_local_banner_preview');

  // Extract lineups, facilities, socials for dedicated sub-resource API calls
  const rawLineups = formData.get('lineups');
  let parsedLineups: ApiLineupItem[] = [];
  if (typeof rawLineups === 'string') {
    try {
      parsedLineups = JSON.parse(rawLineups);
    } catch { }
  }

  const rawFacilities = formData.get('facilities');
  let parsedFacilities: string[] = [];
  if (typeof rawFacilities === 'string') {
    try {
      parsedFacilities = JSON.parse(rawFacilities);
    } catch { }
  }

  const rawSocials = formData.get('social_media');
  let parsedSocials: ApiSocialMedia | null = null;
  if (typeof rawSocials === 'string') {
    try {
      parsedSocials = JSON.parse(rawSocials);
    } catch { }
  }

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui event.';
    throw new Error(errorMsg);
  }

  if (eventId) {
    if (localPreview && typeof window !== 'undefined') {
      try {
      } catch { }
    }

    // Synchronize sub-resource APIs for Lineup, Facilities, Social Media
    await saveEventLineupsApi(eventId, parsedLineups || []);
    await saveEventFacilitiesApi(eventId, parsedFacilities || []);
    if (parsedSocials) {
      await saveEventSocialMediaApi(eventId, parsedSocials);
    }
  }

  return true;
}

export async function publishEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/publish`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal mempublikasikan event.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function cancelEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/cancel`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal membatalkan event.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function revertToDraftEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/draft`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal mengembalikan event ke Draft.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function deleteEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function duplicateEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ duplicate_from: eventId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function archiveEvent(eventId: number): Promise<boolean> {
  return cancelEvent(eventId);
}

// ----------------------------------------------------------------------
// ORGANIZER TICKET TYPES APIs
// ----------------------------------------------------------------------

export async function fetchTicketTypes(eventId: number | string): Promise<ApiTicketType[]> {
  const token = getStoredToken();
  let types: ApiTicketType[] = [];

  try {
    if (token && (typeof eventId === 'number' || (typeof eventId === 'string' && !isNaN(Number(eventId))))) {
      const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types`, {
        headers: getHeaders(token),
      });
      if (response.ok) {
        const data = await response.json();
        types = data?.data || data?.ticketTypes || data || [];
      }
    }

    if (types.length === 0) {
      const resPublic = await fetch(`${API_BASE_URL}/public/events/${eventId}`, {
        headers: getHeaders(token),
      });
      if (resPublic.ok) {
        const dataPublic = await resPublic.json();
        const eventData = dataPublic?.data || dataPublic;
        const resTypes = eventData?.ticket_types || eventData?.ticketTypes || [];
        if (Array.isArray(resTypes) && resTypes.length > 0) {
          types = resTypes;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch ticket types from API:', error);
  }

  return types;
}

export async function createTicketType(
  eventId: number,
  payload: {
    category?: string;
    name: string;
    description?: string;
    price: number;
    quota: number;
    max_per_order?: number;
    sale_start_at?: string | null;
    sale_end_at?: string | null;
    status?: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | string;
  }
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const bodyData: any = {
    name: payload.name,
    price: payload.price,
    quota: payload.quota,
    max_per_order: payload.max_per_order || 5,
  };

  if (payload.category) bodyData.category = payload.category;
  if (payload.description !== undefined) bodyData.description = payload.description || null;
  if (payload.status) bodyData.status = payload.status;

  if (payload.sale_start_at && String(payload.sale_start_at).trim() !== '') {
    let startVal = String(payload.sale_start_at).trim().replace('T', ' ');
    if (startVal.length === 16) startVal += ':00';
    bodyData.sale_start_at = startVal;
  } else {
    bodyData.sale_start_at = null;
  }

  if (payload.sale_end_at && String(payload.sale_end_at).trim() !== '') {
    let endVal = String(payload.sale_end_at).trim().replace('T', ' ');
    if (endVal.length === 16) endVal += ':00';
    bodyData.sale_end_at = endVal;
  } else {
    bodyData.sale_end_at = null;
  }

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan tipe tiket.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function updateTicketType(
  eventId: number,
  ticketTypeId: number,
  payload: {
    category?: string;
    name?: string;
    description?: string;
    price?: number;
    quota?: number;
    max_per_order?: number;
    sale_start_at?: string | null;
    sale_end_at?: string | null;
    status?: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | string;
  }
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const bodyData: any = { ...payload };

  if (bodyData.sale_start_at !== undefined) {
    if (bodyData.sale_start_at && String(bodyData.sale_start_at).trim() !== '') {
      let startVal = String(bodyData.sale_start_at).trim().replace('T', ' ');
      if (startVal.length === 16) startVal += ':00';
      bodyData.sale_start_at = startVal;
    } else {
      bodyData.sale_start_at = null;
    }
  }

  if (bodyData.sale_end_at !== undefined) {
    if (bodyData.sale_end_at && String(bodyData.sale_end_at).trim() !== '') {
      let endVal = String(bodyData.sale_end_at).trim().replace('T', ' ');
      if (endVal.length === 16) endVal += ':00';
      bodyData.sale_end_at = endVal;
    } else {
      bodyData.sale_end_at = null;
    }
  }

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types/${ticketTypeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({
      ...bodyData,
      _method: 'PUT',
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui tipe tiket.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function deleteTicketType(eventId: number, ticketTypeId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types/${ticketTypeId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// ORGANIZER PROMO CODES APIs
// ----------------------------------------------------------------------

export async function fetchPromos(eventId: number): Promise<ApiPromo[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || data?.promos || data || [];
  } catch (error) {
    console.warn('Failed to fetch promos from API:', error);
    return [];
  }
}

export async function createPromo(
  eventId: number,
  payload: {
    code: string;
    name: string;
    description?: string;
    ticket_type_id?: number | null;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    min_purchase?: number;
    quota?: number;
    max_usage_per_user?: number;
    start_at: string;
    end_at: string;
  }
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal membuat kode promo.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function updatePromo(
  eventId: number,
  promoId: number,
  payload: {
    code?: string;
    name?: string;
    description?: string;
    ticket_type_id?: number | null;
    discount_type?: 'PERCENTAGE' | 'FIXED';
    discount_value?: number;
    min_purchase?: number;
    quota?: number;
    max_usage_per_user?: number;
    start_at?: string;
    end_at?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | string;
  }
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const formattedPayload = {
    ...payload,
    status: payload.status ? payload.status.toUpperCase() : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos/${promoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({
        ...formattedPayload,
        _method: 'PUT',
      }),
    });

    if (response.ok) return true;

    if (response.status === 405) {
      const putRes = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos/${promoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify(payload),
      });
      if (putRes.ok) return true;
      const data = await putRes.json().catch(() => ({}));
      throw new Error(data?.message || 'Gagal memperbarui kode promo.');
    }

    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui kode promo.';
    throw new Error(errorMsg);
  } catch (error: any) {
    if (error?.message && error.message !== 'Failed to fetch') {
      throw error;
    }
    const putRes = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos/${promoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(payload),
    });
    if (!putRes.ok) {
      const data = await putRes.json().catch(() => ({}));
      throw new Error(data?.message || 'Gagal memperbarui kode promo.');
    }
    return true;
  }
}

export async function deletePromo(eventId: number, promoId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/promos/${promoId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// OTHER SUPPORTING APIs (POS, TRANSFERS, WITHDRAWALS, LOGS, TEAM)
// ----------------------------------------------------------------------

export async function createOfflineOrder(
  eventId: number,
  payload: CreateOfflineOrderPayload
): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/offline-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return data;
    }

    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memproses pesanan kasir POS offline.';
    throw new Error(errorMsg);
  } catch (err: any) {
    throw err;
  }
}

export async function fetchOfflineDashboard(eventId: number): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/offline-dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    console.warn('Failed to fetch offline dashboard from API:', error);
    return null;
  }
}

export async function fetchOfflineOrderStatus(eventId: number, orderId: number): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/offline-orders/${orderId}/status`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    console.warn('Failed to fetch offline order status from API:', error);
    return null;
  }
}

export async function simulateOfflineOrderPayment(eventId: number, orderId: number): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/offline-orders/${orderId}/simulate-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return data;
    }
    throw new Error(data?.message || 'Gagal simulasi pembayaran QRIS.');
  } catch (err: any) {
    throw err;
  }
}

export async function fetchPublicOrderTickets(orderNumber: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/orders/${encodeURIComponent(orderNumber)}/tickets`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { error: data?.message || 'Pesanan atau e-tiket tidak ditemukan.' };
    }

    return data?.data || data;
  } catch (error) {
    console.warn('Failed to fetch public order tickets:', error);
    return null;
  }
}

export async function fetchTicketTransfers(): Promise<{
  sentTransfers: ApiTicketTransferItem[];
  receivedTransfers: ApiTicketTransferItem[];
}> {
  return { sentTransfers: [], receivedTransfers: [] };
}

export async function acceptTicketTransfer(transferId: number): Promise<boolean> {
  return true;
}

export async function rejectTicketTransfer(transferId: number, reason?: string): Promise<boolean> {
  return true;
}

export async function fetchWithdrawals(params?: { status?: string }): Promise<ApiWithdrawalItem[]> {
  return [];
}

export async function approveWithdrawal(withdrawalId: number): Promise<boolean> {
  return true;
}

export async function rejectWithdrawal(withdrawalId: number, notes?: string): Promise<boolean> {
  return true;
}

export async function requestWithdrawal(payload: {
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  notes?: string;
}): Promise<boolean> {
  return true;
}

export async function updateUserProfile(formData: FormData): Promise<UserProfile> {
  const token = getStoredToken();
  const currentUser = getStoredUser();

  const name = (formData.get('name') as string) || currentUser?.name || 'Pengguna Metix';
  const phone = (formData.get('phone') as string) || currentUser?.phone || null;
  const nik = (formData.get('nik') as string) || (currentUser as any)?.nik || null;
  const address = (formData.get('address') as string) || currentUser?.address || null;

  if (token) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'POST',
      headers: getHeaders(token),
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const updated = data?.user || data?.data || data;
      if (typeof window !== 'undefined' && updated) {
        localStorage.setItem('metix_user', JSON.stringify(updated));
      }
      return updated;
    } else {
      const errData = await response.json().catch(() => null);
      const error: any = new Error(errData?.message || 'Gagal menyimpan profil.');
      if (errData?.errors) {
        error.errors = errData.errors;
      }
      throw error;
    }
  }

  const updatedUser: UserProfile = {
    ...(currentUser || { id: 1, email: '' }),
    name: name,
    phone: phone,
    nik: nik,
    address: address,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('metix_user', JSON.stringify(updatedUser));
  }

  return updatedUser;
}

export interface OwnerUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  nik?: string | null;
  address?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  role: 'OWNER' | 'EO' | 'BUYER' | 'SCANNER' | string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | string;
  date_of_birth?: string | null;
  gender?: string | null;
  buyer_address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FetchOwnerUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface FetchOwnerUsersResponse {
  users: OwnerUserItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchOwnerUsers(params?: FetchOwnerUsersParams): Promise<FetchOwnerUsersResponse> {
  const token = getStoredToken();
  if (!token) {
    return { users: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
  }

  try {
    const url = new URL(`${API_BASE_URL}/owner/users`);
    if (params?.search && params.search.trim()) {
      url.searchParams.append('search', params.search.trim());
    }
    if (params?.role && params.role !== 'all') {
      url.searchParams.append('role', params.role);
    }
    if (params?.status && params.status !== 'all') {
      url.searchParams.append('status', params.status);
    }
    if (params?.page) {
      url.searchParams.append('page', String(params.page));
    }
    if (params?.per_page) {
      url.searchParams.append('per_page', String(params.per_page));
    }

    const response = await fetch(url.toString(), {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      return { users: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
    }

    const data = await response.json();
    const userList: OwnerUserItem[] = Array.isArray(data?.data) ? data.data : [];
    const meta = data?.meta || {
      current_page: Number(params?.page || 1),
      last_page: 1,
      per_page: Number(params?.per_page || 15),
      total: userList.length,
    };

    return { users: userList, meta };
  } catch (error) {
    console.warn('Failed to fetch owner users from API:', error);
    return { users: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
  }
}

export async function deleteOwnerUser(userId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateOwnerUser(
  userId: number,
  payload: Partial<OwnerUserItem> & { password?: string }
): Promise<{ success: boolean; user?: OwnerUserItem; message?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, message: 'Unauthenticated' };

  try {
    const response = await fetch(`${API_BASE_URL}/owner/users/${userId}`, {
      method: 'PUT',
      headers: {
        ...getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg =
        data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Gagal memperbarui data user');
      return { success: false, message: errMsg };
    }

    return {
      success: true,
      user: data?.data || data?.user,
      message: data?.message || 'Data user berhasil diperbarui',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Terjadi kesalahan koneksi' };
  }
}

export async function approveMitraUser(profileId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/approve`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function rejectMitraUser(profileId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/reject`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface WristbandItem {
  id: number;
  qr_code: string;
  event_id?: number;
  event_title?: string;
  ticket_number?: string | null;
  status: 'GENERATED' | 'PRINTED' | 'ACTIVATED' | 'USED' | 'VOID';
  downloaded?: boolean;
  downloaded_at?: string | null;
  created_at: string;
}

export async function fetchWristbands(params?: {
  search?: string;
  event_id?: string;
}): Promise<{
  wristbands: WristbandItem[];
  events: ApiEvent[];
}> {
  return { wristbands: [], events: [] };
}

export async function bulkGenerateWristbands(
  eventId: number,
  quantity: number
): Promise<{ success: boolean; wristbands?: WristbandItem[]; message?: string }> {
  return { success: true, message: 'Wristband berhasil dibuat' };
}

export async function updateUserRole(userId: number, role: string): Promise<boolean> {
  return true;
}

export interface ReportTicketItem {
  id: number;
  ticket_code: string;
  ticket_type: string;
  category?: string;
  price?: number;
  full_name: string;
  email?: string;
  phone?: string;
  identity_type?: string;
  identity_number?: string;
  status?: string;
}

export interface ReportOrderItem {
  id: number;
  order_number: string;
  subtotal: number;
  tax_amount?: number;
  platform_fee?: number;
  buyer_name: string;
  full_name: string;
  attendees?: string[];
  buyer_email: string;
  buyer_phone?: string;
  event_id?: number;
  event_title?: string;
  ticket_type_name?: string;
  category?: string;
  ticket_category?: string;
  quantity: number;
  total_amount: number;
  payment_method?: string;
  status: 'paid' | 'completed' | 'pending' | 'unpaid' | 'waiting_payment' | 'expired' | 'cancelled' | 'canceled' | 'refunded' | string;
  created_at: string;
  tickets?: ReportTicketItem[];
}

export async function fetchSalesReportData(params?: {
  event_id?: string;
  month?: string;
  year?: string;
  status?: string;
}): Promise<{
  orders: ReportOrderItem[];
  events: ApiEvent[];
  totalRevenue: number;
  totalTicketsSold: number;
}> {
  const token = getStoredToken();
  if (!token) return { orders: [], events: [], totalRevenue: 0, totalTicketsSold: 0 };

  try {
    const query = new URLSearchParams();
    if (params?.event_id && params.event_id !== 'all') query.append('event_id', params.event_id);
    if (params?.month && params.month !== 'all') query.append('month', params.month);
    if (params?.year && params.year !== 'all') query.append('year', params.year);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    const url = `${API_BASE_URL}/organizer/reports?${query.toString()}`;
    const response = await fetch(url, {
      headers: getHeaders(token),
    });

    if (response.ok) {
      const resData = await response.json();
      const payload = resData.data || resData;
      const rawOrders = payload.orders || [];
      const formattedOrders: ReportOrderItem[] = rawOrders.map((ord: any) => {
        const rawSubtotal = Number(ord.subtotal ?? 0);
        const rawTotal = Number(ord.total_amount ?? 0);
        const rawTax = Number(ord.local_tax_amount ?? ord.local_tax ?? ord.tax_amount ?? ord.tax ?? 0);
        const rawFee = Number(ord.platform_fee ?? ord.fee_platform ?? 0);

        let subtotal = rawSubtotal;
        let tax = rawTax;
        let fee = rawFee;

        // Fallbacks if backend only provided total_amount or subtotal
        if (subtotal === 0 && rawTotal > 0) {
          subtotal = Math.round(rawTotal / 1.12);
        } else if (subtotal > 0 && rawTotal === subtotal && fee === 0 && tax === 0) {
          tax = Math.round(subtotal * 0.05);
          fee = Math.round(subtotal * 0.07);
        }

        if (tax === 0 && subtotal > 0) {
          tax = Math.round(subtotal * 0.05);
        }
        if (fee === 0 && subtotal > 0) {
          fee = Math.round(subtotal * 0.07);
        }

        const totalAmount = rawTotal > 0 ? rawTotal : (subtotal + tax + fee);

        return {
          id: ord.id,
          order_number: ord.order_number || `ORD-${ord.id}`,
          subtotal: subtotal,
          tax_amount: tax,
          platform_fee: fee,
          buyer_name: ord.buyer_name || 'Pembeli Metix',
          full_name: ord.full_name || ord.buyer_name || 'Pengunjung Gate',
          attendees: ord.attendees || [],
          buyer_email: ord.buyer_email || 'buyer@metix.id',
          buyer_phone: ord.buyer_phone,
          event_id: ord.event_id,
          event_title: ord.event_title || 'Event Metix',
          ticket_type_name: ord.ticket_type_name || 'Tiket Metix',
          quantity: ord.quantity || 1,
          total_amount: totalAmount,
          payment_method: ord.payment_method || 'Midtrans QRIS & VA',
          status: String(ord.status || 'pending').toLowerCase(),
          created_at: ord.created_at || new Date().toISOString(),
          tickets: ord.tickets || [],
        };
      });

      return {
        orders: formattedOrders,
        events: payload.events || [],
        totalRevenue: payload.total_revenue || 0,
        totalTicketsSold: payload.total_tickets_sold || 0,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch sales reports data:', error);
  }
  return { orders: [], events: [], totalRevenue: 0, totalTicketsSold: 0 };
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export async function fetchAuditLogs(params?: {
  search?: string;
  action?: string;
}): Promise<{
  logs: AuditLogItem[];
  actionsList: string[];
}> {
  const token = getStoredToken();
  let apiLogs: AuditLogItem[] = [];

  // Fetch real API audit logs directly from backend
  if (token) {
    try {
      const url = new URL(`${API_BASE_URL}/owner/audit-logs`);
      if (params?.search) url.searchParams.append('search', params.search);
      if (params?.action && params.action !== 'all') url.searchParams.append('action', params.action);

      const response = await fetch(url.toString(), {
        headers: getHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data?.data || data?.logs || [];
        apiLogs = Array.isArray(raw) ? raw : (raw?.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs from API:', err);
    }
  }

  const rawLogs = [...apiLogs];
  rawLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Extract unique actions list for dropdown filter
  const actionsSet = new Set<string>();
  rawLogs.forEach((l) => {
    if (l.action) actionsSet.add(l.action);
  });
  const actionsList = Array.from(actionsSet);

  return {
    logs: rawLogs,
    actionsList,
  };
}

export function recordAuditLog(action: string, description: string): void {
  // Audit logs are recorded directly by the backend database
}

export interface EoAdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  scan_quota?: number | null;
  scan_count?: number;
  event_id?: number | string | null;
  event_title?: string | null;
  created_by?: number | null;
  created_at?: string;
  roles?: Array<{ id: number; name: string }>;
}

export interface CreateEoAdminPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  scan_quota?: number | null;
  event_id?: number | string | null;
  event_title?: string | null;
}

export function incrementStaffScanCount(email?: string): void {
  // Real check-in counts are computed directly from backend check_ins table
}

export async function fetchEoAdmins(): Promise<EoAdminUser[]> {
  const token = getStoredToken();
  if (!token) return [];

  let staffList: EoAdminUser[] = [];

  try {
    let response = await fetch(`${API_BASE_URL}/organizer/team`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (!response.ok && response.status === 404) {
      response = await fetch(`${API_BASE_URL}/organizer/scanners`, {
        headers: getHeaders(token),
        cache: 'no-store',
      });
    }

    if (response.ok) {
      const data = await response.json();
      const list = data?.data || data?.team || data?.scanners || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length > 0) {
        staffList = list.map((item: any) => {
          const evtObj = item.event || (Array.isArray(item.events) ? item.events[0] : null) || item.assigned_event;
          const evtId = item.event_id || evtObj?.id || item.user?.event_id || (Array.isArray(item.event_ids) ? item.event_ids[0] : null);
          const evtTitle = item.event_title || evtObj?.title || evtObj?.name || item.user?.event_title;

          return {
            id: item.id || item.user_id || item.user?.id || Date.now(),
            name: item.name || item.user?.name || item.full_name || 'Staff Scanner',
            email: item.email || item.user?.email || '',
            phone: item.phone || item.user?.phone || null,
            scan_quota: item.scan_quota !== undefined ? item.scan_quota : (item.quota ?? item.user?.scan_quota ?? 200),
            scan_count: Number(item.scan_count ?? item.scanned_count ?? item.user?.scan_count ?? 0),
            event_id: evtId ? Number(evtId) : null,
            event_title: evtTitle || (evtId ? `Event #${evtId}` : 'Semua Event (Global)'),
            created_at: item.joined_at || item.created_at || item.user?.created_at || new Date().toISOString(),
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch EO admins from API:', err);
  }

  // Fallback to /organizer/dashboard if team returned empty
  if (staffList.length === 0) {
    try {
      const dashRes = await fetch(`${API_BASE_URL}/organizer/dashboard`, {
        headers: getHeaders(token),
        cache: 'no-store',
      });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        const rawScanners = dashData?.data?.scanners?.list || dashData?.scanners?.list || [];
        if (Array.isArray(rawScanners) && rawScanners.length > 0) {
          staffList = rawScanners.map((sc: any) => ({
            id: sc.user_id || sc.id || Date.now(),
            name: sc.name || 'Petugas Scanner',
            email: sc.email || '',
            phone: sc.phone || null,
            scan_quota: 200,
            scan_count: Number(sc.scanned_count ?? sc.scan_count ?? 0),
            event_id: sc.event_id ? Number(sc.event_id) : null,
            event_title: sc.event_title || 'Event',
            created_at: sc.last_scanned_at || new Date().toISOString(),
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to fallback fetch scanners from dashboard:', err);
    }
  }

  return staffList;
}

export async function createEoAdmin(payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const jsonPayload = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    password_confirmation: payload.password,
    phone: payload.phone && !['-', '—', 'none', 'null'].includes(String(payload.phone).trim()) ? String(payload.phone).trim() : null,
    role: 'scanner',
    scan_quota: payload.scan_quota !== undefined ? payload.scan_quota : 200,
    quota: payload.scan_quota !== undefined ? payload.scan_quota : 200,
    event_id: payload.event_id || null,
    event_ids: payload.event_id ? [payload.event_id] : [],
    events: payload.event_id ? [payload.event_id] : [],
  };

  let response = await fetch(`${API_BASE_URL}/organizer/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(jsonPayload),
  });

  if (!response.ok && response.status === 404) {
    response = await fetch(`${API_BASE_URL}/organizer/scanners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(jsonPayload),
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan akun staff scanner baru ke API server.';
    throw new Error(errorMsg);
  }

  const createdUser = data?.data || data?.user || data?.team || data;

  if (payload.event_id && createdUser?.id) {
    try {
      await fetch(`${API_BASE_URL}/organizer/events/${payload.event_id}/scanners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify({
          user_id: createdUser.id,
          scanner_id: createdUser.id,
          email: payload.email,
        }),
      });
    } catch { }
  }

  const evtObj = createdUser?.event || (Array.isArray(createdUser?.events) ? createdUser.events[0] : null);
  const evtId = payload.event_id || createdUser?.event_id || evtObj?.id || null;

  return {
    id: createdUser?.id || createdUser?.user_id || Date.now(),
    name: createdUser?.name || createdUser?.user?.name || payload.name,
    email: createdUser?.email || createdUser?.user?.email || payload.email,
    phone: createdUser?.phone || createdUser?.user?.phone || payload.phone || null,
    scan_quota: payload.scan_quota !== undefined ? payload.scan_quota : (createdUser?.scan_quota ?? createdUser?.quota ?? 200),
    scan_count: createdUser?.scan_count || 0,
    event_id: evtId ? Number(evtId) : null,
    event_title: payload.event_title || createdUser?.event_title || evtObj?.title || (evtId ? `Event #${evtId}` : 'Semua Event (Global)'),
    created_at: createdUser?.created_at || createdUser?.joined_at || new Date().toISOString(),
  };
}

export async function updateEoAdmin(adminId: number, payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const jsonPayload = {
    id: adminId,
    user_id: adminId,
    name: payload.name,
    email: payload.email,
    password: payload.password || undefined,
    password_confirmation: payload.password || undefined,
    phone: payload.phone && !['-', '—', 'none', 'null'].includes(String(payload.phone).trim()) ? String(payload.phone).trim() : null,
    role: 'scanner',
    scan_quota: payload.scan_quota !== undefined ? payload.scan_quota : 200,
    quota: payload.scan_quota !== undefined ? payload.scan_quota : 200,
    event_id: payload.event_id || null,
    event_ids: payload.event_id ? [payload.event_id] : [],
    events: payload.event_id ? [payload.event_id] : [],
  };

  let response: Response | null = null;

  // 1. Try PUT /organizer/team/${adminId}
  try {
    const res = await fetch(`${API_BASE_URL}/organizer/team/${adminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(jsonPayload),
    });
    if (res.ok) response = res;
    else response = res;
  } catch { }

  // 2. Try POST /organizer/events/${event_id}/scanners if event_id is supplied
  if (!response || !response.ok) {
    if (payload.event_id) {
      try {
        const res = await fetch(`${API_BASE_URL}/organizer/events/${payload.event_id}/scanners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getHeaders(token),
          },
          body: JSON.stringify(jsonPayload),
        });
        if (res.ok) response = res;
      } catch { }
    }
  }

  // 2. Try PUT /organizer/scanners/${adminId}
  if (!response || !response.ok) {
    try {
      const res = await fetch(`${API_BASE_URL}/organizer/scanners/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify(jsonPayload),
      });
      if (res.ok) response = res;
    } catch { }
  }

  // 3. Try POST /organizer/scanners
  if (!response || !response.ok) {
    try {
      const res = await fetch(`${API_BASE_URL}/organizer/scanners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify(jsonPayload),
      });
      if (res.ok) response = res;
    } catch { }
  }

  // 4. Try POST /organizer/team (which acts as upsert or create/update)
  if (!response || !response.ok) {
    try {
      const res = await fetch(`${API_BASE_URL}/organizer/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(token),
        },
        body: JSON.stringify(jsonPayload),
      });
      if (res.ok) response = res;
      else if (!response) response = res;
    } catch { }
  }

  const data = response ? await response.json().catch(() => ({})) : {};

  if (!response || !response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui akun staff scanner di API server.';
    throw new Error(errorMsg);
  }

  const updatedUser = data?.data || data?.user || data?.team || data;
  const evtObj = updatedUser?.event || (Array.isArray(updatedUser?.events) ? updatedUser.events[0] : null);
  const evtId = payload.event_id || updatedUser?.event_id || evtObj?.id || null;

  return {
    id: updatedUser?.id || adminId,
    name: updatedUser?.name || payload.name,
    email: updatedUser?.email || payload.email,
    phone: updatedUser?.phone || payload.phone || null,
    scan_quota: payload.scan_quota !== undefined ? payload.scan_quota : (updatedUser?.scan_quota ?? updatedUser?.quota ?? 200),
    scan_count: updatedUser?.scan_count || 0,
    event_id: evtId ? Number(evtId) : null,
    event_title: payload.event_title || updatedUser?.event_title || evtObj?.title || (evtId ? `Event #${evtId}` : 'Semua Event (Global)'),
    created_at: updatedUser?.created_at || new Date().toISOString(),
  };
}

export async function deleteEoAdmin(adminId: number): Promise<boolean> {
  const token = getStoredToken();
  const currentUser = getStoredUser();
  const storageKey = currentUser?.email ? `metix_cached_scanners_${currentUser.email.toLowerCase()}` : 'metix_cached_scanners';

  if (token) {
    try {
      let response = await fetch(`${API_BASE_URL}/organizer/team/${adminId}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      });

      if (!response.ok && response.status === 404) {
        await fetch(`${API_BASE_URL}/organizer/scanners/${adminId}`, {
          method: 'DELETE',
          headers: getHeaders(token),
        });
      }
    } catch (e) {
      console.warn('Backend API delete team staff warning:', e);
    }
  }



  return true;
}

// ----------------------------------------------------------------------
// ORGANIZER PROFILE (ORGANISASI) APIs
// ----------------------------------------------------------------------

export interface ApiOrganizerProfile {
  id?: number;
  user_id?: number;
  organization_name: string;
  logo?: string | null;
  logo_url?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  email?: string | null;
  legal_document?: string | null;
  legal_document_url?: string | null;
  status?: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  rejection_reason?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchOrganizerProfile(): Promise<ApiOrganizerProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/profile`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data?.profile || data || null;
  } catch (error) {
    console.warn('Failed to fetch organizer profile:', error);
    return null;
  }
}

export async function saveOrganizerProfile(payload: {
  organization_name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  _local_logo_preview?: string;
}): Promise<ApiOrganizerProfile> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  if (payload._local_logo_preview && typeof window !== 'undefined') {
  }

  const existingProfile = await fetchOrganizerProfile();
  const isUpdate = !!existingProfile;
  const method = isUpdate ? 'PUT' : 'POST';

  let logoString: string | null = null;
  if (payload.logo && !payload.logo.startsWith('data:image') && !payload.logo.includes('logo_default')) {
    logoString = payload.logo.slice(0, 250);
  } else if (existingProfile?.logo && !existingProfile.logo.startsWith('data:image') && !existingProfile.logo.includes('logo_default')) {
    logoString = existingProfile.logo.slice(0, 250);
  } else if (payload._local_logo_preview) {
    logoString = `organizers/logo_${Date.now()}.png`;
  }

  const bodyData: Record<string, any> = {
    organization_name: payload.organization_name,
    description: payload.description || '',
    address: payload.address || '',
    phone: payload.phone || '',
    email: payload.email || '',
    logo: logoString,
  };

  const response = await fetch(`${API_BASE_URL}/organizer/profile`, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(bodyData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menyimpan profil organisasi.';
    throw new Error(errorMsg);
  }

  const resultProfile: ApiOrganizerProfile = data?.data || data;
  if (typeof window !== 'undefined' && resultProfile) {
    try {
      const storedEos = null;
      const list: ApiOrganizerProfile[] = storedEos ? JSON.parse(storedEos) : [];
      const updatedList = [resultProfile, ...list.filter((o) => o.id !== resultProfile.id && o.email !== resultProfile.email)];
    } catch { }
  }

  return resultProfile;
}

// ----------------------------------------------------------------------
// OWNER ORGANIZER APPROVAL APIs
// ----------------------------------------------------------------------

export async function fetchOwnerOrganizers(params?: {
  search?: string;
  status?: string;
  page?: number;
}): Promise<{
  organizers: ApiOrganizerProfile[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}> {
  const token = getStoredToken();
  if (!token) return { organizers: [] };

  try {
    const url = new URL(`${API_BASE_URL}/owner/organizers`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.status) url.searchParams.append('status', params.status);
    if (params?.page) url.searchParams.append('page', String(params.page));

    const response = await fetch(url.toString(), {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const organizers = data?.data || data?.organizers || [];
      return {
        organizers,
        meta: data?.meta || {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: organizers.length,
        },
      };
    }
  } catch (error) {
    console.warn('Failed to fetch owner organizers from API:', error);
  }

  return { organizers: [] };
}

export async function approveOwnerOrganizer(profileId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/approve`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function rejectOwnerOrganizer(profileId: number, reason: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ reason }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// BANK ACCOUNTS & WITHDRAWALS APIs (EO PARTNER)
// ----------------------------------------------------------------------

export interface ApiBankAccount {
  id: number;
  organizer_profile_id?: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiWithdrawal {
  id: number;
  organizer_profile_id?: number;
  organizer_bank_account_id: number;
  reference_number: string;
  amount: number;
  fee: number;
  net_amount: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  proof_of_transfer?: string | null;
  rejection_reason?: string | null;
  requested_at?: string | null;
  processed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  bank_account?: ApiBankAccount;
}

export async function fetchOrganizerBankAccounts(): Promise<ApiBankAccount[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/bank-accounts`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || data?.accounts || [];
  } catch (error) {
    console.warn('Failed to fetch organizer bank accounts:', error);
    return [];
  }
}

export async function createOrganizerBankAccount(payload: {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary?: boolean;
}): Promise<ApiBankAccount> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/bank-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan rekening bank baru.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
}

export async function updateOrganizerBankAccount(
  bankId: number,
  payload: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_primary?: boolean;
  }
): Promise<ApiBankAccount> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/bank-accounts/${bankId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui rekening bank.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
}

export async function deleteOrganizerBankAccount(bankId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/bank-accounts/${bankId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus rekening bank.');
  }

  return true;
}

export async function setPrimaryOrganizerBankAccount(bankId: number): Promise<ApiBankAccount> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/bank-accounts/${bankId}/set-primary`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Gagal menjadikan sebagai rekening utama.');
  }

  return data?.data || data;
}

export async function fetchOrganizerWithdrawals(params?: {
  status?: string;
  page?: number;
}): Promise<{
  withdrawals: ApiWithdrawal[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  balance?: {
    total_revenue: number;
    total_withdrawn: number;
    pending_withdrawal: number;
    available_balance: number;
  } | null;
}> {
  const token = getStoredToken();
  if (!token) return { withdrawals: [] };

  try {
    const url = new URL(`${API_BASE_URL}/organizer/withdrawals`);
    if (params?.status && params.status !== 'all') url.searchParams.append('status', params.status);
    if (params?.page) url.searchParams.append('page', String(params.page));

    const response = await fetch(url.toString(), {
      headers: getHeaders(token),
    });

    if (!response.ok) return { withdrawals: [] };

    const data = await response.json();
    let rawList = data?.data?.data || data?.data || data?.withdrawals || [];
    if (!Array.isArray(rawList)) {
      rawList = Array.isArray(data) ? data : [];
    }

    const meta = data?.meta || (data?.data?.current_page ? {
      current_page: data.data.current_page,
      last_page: data.data.last_page,
      per_page: data.data.per_page,
      total: data.data.total,
    } : undefined);

    const balance = data?.data?.balance || data?.balance || null;

    return {
      withdrawals: rawList,
      meta,
      balance,
    };
  } catch (error) {
    console.warn('Failed to fetch organizer withdrawals:', error);
    return { withdrawals: [] };
  }
}

export async function createWithdrawalRequest(payload: {
  organizer_bank_account_id: number;
  amount: number;
}): Promise<ApiWithdrawal> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/withdrawals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal membuat pengajuan penarikan dana.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
}

export async function fetchWithdrawalDetail(withdrawalId: number): Promise<ApiWithdrawal | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/withdrawals/${withdrawalId}`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    console.warn('Failed to fetch withdrawal detail:', error);
    return null;
  }
}

// ----------------------------------------------------------------------
// EVENT SETTING APIs (EO PARTNER)
// ----------------------------------------------------------------------

export interface ApiEventSetting {
  allow_ticket_transfer: boolean;
  transfer_fee: number;
  max_ticket_per_order: number;
  reservation_timeout: number;
  require_identity: boolean;
}

export async function fetchEventSetting(eventId: number): Promise<ApiEventSetting | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/settings`, {
      headers: getHeaders(token),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data?.setting || data?.data || data?.setting || null;
    }
  } catch {
    // Ignore fetch error silently
  }

  return null;
}

export async function updateEventSetting(
  eventId: number,
  payload: {
    allow_ticket_transfer?: boolean;
    transfer_fee?: number;
    max_ticket_per_order?: number;
    reservation_timeout?: number;
    require_identity?: boolean;
  }
): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data?.setting || data?.data || data;
    }
  } catch {
    // Fallback gracefully if server endpoint returns error
  }

  return payload;
}

// ----------------------------------------------------------------------
// OWNER WITHDRAWAL APPROVAL & TRANSFER APIs
// ----------------------------------------------------------------------

export async function fetchOwnerWithdrawals(params?: {
  status?: string;
  page?: number;
}): Promise<{
  withdrawals: ApiWithdrawal[];
  meta?: any;
  summary?: {
    total_completed_amount: number;
    total_pending_amount: number;
    total_count: number;
  } | null;
}> {
  const token = getStoredToken();
  if (!token) return { withdrawals: [] };

  try {
    const url = new URL(`${API_BASE_URL}/owner/withdrawals`);
    if (params?.status && params.status !== 'all') {
      url.searchParams.append('status', params.status);
    }
    if (params?.page) {
      url.searchParams.append('page', String(params.page));
    }

    const response = await fetch(url.toString(), {
      headers: getHeaders(token),
    });

    if (!response.ok) return { withdrawals: [] };

    const data = await response.json();
    const list = data?.data?.data || data?.data || data?.withdrawals || [];
    const meta = data?.data?.current_page ? data.data : undefined;
    const summary = data?.data?.summary || data?.summary || null;
    return { withdrawals: list, meta, summary };
  } catch (error) {
    console.warn('Failed to fetch owner withdrawals:', error);
    return { withdrawals: [] };
  }
}

export async function approveOwnerWithdrawal(withdrawalId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menyetujui penarikan.');
  }

  return true;
}

export async function completeOwnerWithdrawal(
  withdrawalId: number,
  proofOfTransfer?: string | File
): Promise<{ success: boolean; data?: any }> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  let body: any;
  const headers = getHeaders(token);

  if (proofOfTransfer instanceof File) {
    const formData = new FormData();
    formData.append('proof_of_transfer', proofOfTransfer);
    body = formData;
    delete (headers as any)['Content-Type'];
  } else {
    (headers as any)['Content-Type'] = 'application/json';
    body = JSON.stringify({
      proof_of_transfer: proofOfTransfer || undefined,
    });
  }

  const response = await fetch(`${API_BASE_URL}/owner/withdrawals/${withdrawalId}/complete`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Gagal menyelesaikan penarikan.');
    throw new Error(errorMsg);
  }

  const resJson = await response.json().catch(() => ({}));
  return { success: true, data: resJson?.data || resJson };
}

export async function rejectOwnerWithdrawal(
  withdrawalId: number,
  reason: string
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({
      rejection_reason: reason,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menolak penarikan.');
  }

  return true;
}

export interface ApiPlatformFeeItem {
  id: number;
  category: string;
  name: string;
  percentage: number | string;
  fixed_fee: number | string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchOwnerPlatformFees(): Promise<ApiPlatformFeeItem[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/owner/platform-fees`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || data || [];
  } catch {
    return [];
  }
}

export async function updateOwnerPlatformFees(
  fees: Array<{ id: number; percentage: number; fixed_fee: number }>
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/platform-fees`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({ fees }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal memperbarui pengaturan platform fee.');
  }

  return true;
}

// ----------------------------------------------------------------------
// MEDIA UPLOAD API
// ----------------------------------------------------------------------
export async function uploadMedia(
  file: File,
  folder: string = 'banners'
): Promise<{ path: string; url: string }> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal mengunggah berkas gambar.'
    );
  }

  return data.data;
}


// ----------------------------------------------------------------------
// SECURITY & SESSION APIs
// ----------------------------------------------------------------------

export interface ActiveSession {
  id: number;
  name: string;
  is_current: boolean;
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: string | null;
  created_at: string | null;
}

export interface SessionsResponse {
  current_session: {
    ip_address: string;
    user_agent: string;
    token_id?: number | null;
  };
  sessions: ActiveSession[];
}

export async function fetchActiveSessions(): Promise<SessionsResponse | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
      headers: getHeaders(token),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function revokeOtherSessions(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  const response = await fetch(`${API_BASE_URL}/auth/sessions/revoke-others`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json?.message || 'Gagal menonaktifkan sesi lain.');
  }

  return true;
}

export async function updateAccountPassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Sesi autentikasi telah habis.');

  const response = await fetch(`${API_BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      ...getHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err: any = new Error(json?.message || 'Gagal memperbarui password.');
    if (json?.errors) {
      err.errors = json.errors;
    }
    throw err;
  }

  return true;
}

// ----------------------------------------------------------------------
// MANUAL SYNC PAID ORDER API (SUPER ADMIN / OWNER)
// ----------------------------------------------------------------------
export async function manualSyncPaidOrder(invoiceNumber: string): Promise<{ success: boolean; message: string; data?: any }> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/orders/manual-sync-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({ invoice_number: invoiceNumber }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Gagal memproses update status pembayaran.');
  }

  return data;
}

// ----------------------------------------------------------------------
// MASTER ORDER & ORDER ITEMS API (OWNER)
// ----------------------------------------------------------------------
export interface MasterOrderItem {
  id: number;
  order_id: number;
  ticket_type_id: number;
  ticket_type_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
  ticket_type?: {
    id: number;
    name: string;
    category?: string | null;
    price: number;
    quota?: number | null;
    sold_count?: number | null;
    status?: string | null;
    description?: string | null;
  } | null;
}

export interface MasterOrder {
  id: number;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  event?: {
    id: number;
    title: string;
    slug: string;
    banner?: string;
    start_time?: string;
    location_name?: string;
  } | null;
  subtotal: number;
  local_tax: number;
  local_tax_amount: number;
  platform_fee: number;
  payment_fee: number;
  discount_amount: number;
  payment_method: string;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | string;
  expires_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  items_count?: number;
  items?: MasterOrderItem[];
  payments?: any[];
}

export interface MasterOrdersResponse {
  success: boolean;
  message: string;
  data: MasterOrder[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MasterOrderDetailResponse {
  success: boolean;
  message: string;
  data: MasterOrder;
}

export interface MasterOrderItemsResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    order_number: string;
    buyer_name: string;
    buyer_email: string;
    event_title: string;
    status: string;
    total_amount: number;
  };
  data: MasterOrderItem[];
}

export async function fetchMasterOrders(params?: {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<MasterOrdersResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.per_page) queryParams.set('per_page', String(params.per_page));

  const url = `${API_BASE_URL}/owner/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat daftar master order.');
  }

  return {
    success: true,
    message: json.message || 'Berhasil',
    data: json.data || [],
    meta: json.meta || {
      current_page: params?.page || 1,
      last_page: 1,
      per_page: params?.per_page || 15,
      total: (json.data || []).length,
    },
  };
}

export async function fetchMasterOrderDetail(orderId: number | string): Promise<MasterOrder> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat detail order.');
  }

  return json.data;
}

export async function fetchMasterOrderItems(orderId: number | string): Promise<MasterOrderItemsResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/orders/${orderId}/items`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat data order items.');
  }

  return json;
}

// ----------------------------------------------------------------------
// MASTER PAYMENTS API (OWNER)
// ----------------------------------------------------------------------
export interface MasterPayment {
  id: number;
  order_id: number;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  event_title: string;
  event_id?: number;
  provider: string;
  payment_method: string;
  provider_transaction_id: string;
  invoice_number: string;
  amount: number;
  payment_url?: string | null;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | string;
  paid_at?: string | null;
  expired_at?: string | null;
  created_at?: string | null;
  raw_response?: any;
}

export interface MasterPaymentsResponse {
  success: boolean;
  message: string;
  data: MasterPayment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchMasterPayments(params?: {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<MasterPaymentsResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.per_page) queryParams.set('per_page', String(params.per_page));

  const url = `${API_BASE_URL}/owner/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat daftar pembayaran.');
  }

  return {
    success: true,
    message: json.message || 'Berhasil',
    data: json.data || [],
    meta: json.meta || {
      current_page: params?.page || 1,
      last_page: 1,
      per_page: params?.per_page || 15,
      total: (json.data || []).length,
    },
  };
}

// ----------------------------------------------------------------------
// MASTER PAYMENT WEBHOOKS API (OWNER)
// ----------------------------------------------------------------------
export interface MasterPaymentWebhook {
  id: number;
  provider: string;
  event_type: string;
  reference_id: string;
  payload: any;
  signature: string;
  status: string;
  processed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MasterPaymentWebhooksResponse {
  success: boolean;
  message: string;
  data: MasterPaymentWebhook[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchMasterPaymentWebhooks(params?: {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<MasterPaymentWebhooksResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.per_page) queryParams.set('per_page', String(params.per_page));

  const url = `${API_BASE_URL}/owner/payment-webhooks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat data payment webhooks.');
  }

  return {
    success: true,
    message: json.message || 'Berhasil',
    data: json.data || [],
    meta: json.meta || {
      current_page: params?.page || 1,
      last_page: 1,
      per_page: params?.per_page || 15,
      total: (json.data || []).length,
    },
  };
}

export interface OtpVerificationItem {
  id: number;
  user_id: number | null;
  destination: string;
  type: 'EMAIL' | 'WHATSAPP' | string;
  code_hash: string;
  plain_code?: string | null;
  expires_at: string | null;
  verified_at: string | null;
  attempts: number;
  status: 'VERIFIED' | 'ACTIVE' | 'EXPIRED' | string;
  is_verified: boolean;
  is_expired: boolean;
  created_at: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
}

export interface OtpVerificationsResponse {
  success: boolean;
  message?: string;
  data: OtpVerificationItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchOtpVerifications(params?: {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<OtpVerificationsResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.type && params.type !== 'all') queryParams.set('type', params.type);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.per_page) queryParams.set('per_page', String(params.per_page));

  const url = `${API_BASE_URL}/owner/otp-verifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || 'Gagal memuat data OTP verifications.');
  }

  return {
    success: true,
    message: json.message || 'Berhasil',
    data: json.data || [],
    meta: json.meta || {
      current_page: params?.page || 1,
      last_page: 1,
      per_page: params?.per_page || 20,
      total: (json.data || []).length,
    },
  };
}





