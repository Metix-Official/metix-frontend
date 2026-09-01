let envUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://metix-backend.lufexa.id/api/v1').trim().replace(/\/+$/, '');

// Ensure /v1 is always appended to API_BASE_URL
if (!envUrl.endsWith('/v1')) {
  if (envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/v1`;
  } else {
    envUrl = `${envUrl}/api/v1`;
  }
}

export const API_BASE_URL = envUrl;

export function getPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  const backendBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  return `${backendBase}/${photoUrl.replace(/^\//, '')}`;
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
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  email_verified_at?: string | null;
  photo?: string | null;
  profile_photo_url?: string | null;
  mitra_status?: 'pending' | 'approved' | 'rejected' | null;
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
  name: string;
  price: string | number;
  quota?: number;
  available_quota?: number;
  max_per_order?: number;
  sold_quantity?: number;
  reserved_quantity?: number;
  sale_start_at?: string;
  sale_end_at?: string;
  status?: string;
}

export interface ApiEvent {
  id: number;
  user_id?: number;
  title: string;
  slug: string;
  description?: string | null;
  desc?: string | null;
  venue?: string | null;
  city?: string | null;
  location?: string | null;
  address?: string | null;
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
  require_holder_name?: boolean;
}

export interface ApiTicketDetail {
  id: number;
  ticket_code: string;
  qr_token?: string;
  status: string;
  created_at?: string;
  event?: {
    id: number;
    title: string;
    location?: string;
    venue?: string;
    city?: string;
    address?: string;
    event_start_at?: string;
    event_end_at?: string;
    banner?: string;
    venue_photo?: string;
  };
  ticket_type?: {
    name: string;
    price: string | number;
  };
  order?: {
    order_number?: string;
    buyer_name?: string;
    buyer_email?: string;
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
  payment_method: 'cash' | 'bank_transfer' | 'qris_offline';
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

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors?.email ? data.errors.email[0] : null) ||
      'Email atau password yang Anda masukkan salah.';
    const errObj: any = new Error(errorMsg);
    errObj.errors = data?.errors;
    throw errObj;
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
    message: data.message || 'Login berhasil',
    token: token,
    user: user,
  };
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
      password: payload.password || 'password123',
      password_confirmation: payload.password_confirmation || payload.password || 'password123',
      role: mappedRole,
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

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(token),
    });

    if (response.status === 401) {
      logoutUser();
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const profile = data?.user || data?.data || data;
    if (typeof window !== 'undefined' && profile) {
      localStorage.setItem('metix_user', JSON.stringify(profile));
    }
    return profile;
  } catch (error) {
    console.warn('Failed to fetch user profile from API:', error);
    return getStoredUser();
  }
}

export async function logoutApi(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(token),
      });
    } catch (e) {
      console.error('Logout error:', e);
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
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const rawEvents = data?.data || data?.events || [];
    const meta = data?.meta || {
      current_page: data?.current_page || 1,
      per_page: data?.per_page || 20,
      total: data?.total || rawEvents.length,
      last_page: data?.last_page || 1,
    };

    const categories = Array.from(
      new Set(
        rawEvents
          .map((e: any) => e.category)
          .filter((c: any) => Boolean(c))
      )
    ) as string[];

    return {
      events: rawEvents,
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

// ----------------------------------------------------------------------
// RESERVATIONS & CHECKOUT APIs
// ----------------------------------------------------------------------

export async function createReservation(payload: {
  event_id: number;
  ticket_type_id: number;
  quantity: number;
}): Promise<ApiReservation> {
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
    const errorMsg = data?.message || 'Gagal membuat reservasi tiket. Stok mungkin tidak mencukupi.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
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
}): Promise<{ valid: boolean; discount_amount: number; message: string }> {
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
    throw new Error(data?.message || 'Kode promo tidak valid atau telah kadaluarsa.');
  }

  return {
    valid: true,
    discount_amount: Number(data?.discount_amount || data?.data?.discount_amount || 0),
    message: data?.message || 'Kode promo berhasil diterapkan!',
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

export async function checkoutOrder(payload: {
  reservation_id: number;
  promo_code?: string;
  referral_code?: string;
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
    throw new Error(data?.message || 'Checkout gagal. Reservasi mungkin sudah kadaluarsa.');
  }

  return data?.data || data?.order || data;
}

export async function initiateOrderPayment(orderId: number): Promise<{ payment_url?: string; snap_token?: string }> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Gagal memproses inisialisasi pembayaran DOKU.');
  }

  return {
    payment_url: data?.payment_url || data?.data?.payment_url,
    snap_token: data?.snap_token || data?.data?.snap_token,
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
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || data?.tickets || [];
  } catch (error) {
    console.warn('Failed to fetch user tickets from API:', error);
    return [];
  }
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

export async function processCheckIn(payload: CheckInPayload): Promise<CheckInResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const eventId = payload.event_id || 1;
  const response = await fetch(`${API_BASE_URL}/scanner/events/${eventId}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({
      qr_token: payload.qr_token || payload.ticket_code,
      device_uuid: payload.device_uuid || 'WEB-SCANNER-01',
    }),
  });

  const data = await response.json().catch(() => ({}));
  return {
    success: response.ok,
    message: data?.message || (response.ok ? 'Check-in Berhasil' : 'Gagal check-in'),
    ticket: data?.ticket || data?.data?.ticket,
  };
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
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/scanner/events`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || data?.events || [];
  } catch {
    return [];
  }
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

    if (rawRole === 'OWNER' || roleNames.includes('OWNER') || user.email === 'admin@metix.com') {
      role = 'OWNER';
      roleLabel = 'Super Admin Platform';
    } else if (rawRole === 'EO' || roleNames.includes('EO') || user.email === 'lutfifahri175@gmail.com') {
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
    return {
      ...data,
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
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      events: data?.data || data?.events || [],
      stats: data?.stats,
    };
  } catch (error) {
    console.warn('Failed to fetch organizer events from API:', error);
    return { events: [] };
  }
}

export async function createEvent(formData: FormData): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/events`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal membuat event baru.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function updateEvent(eventId: number, formData: FormData): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  formData.append('_method', 'PUT');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui event.';
    throw new Error(errorMsg);
  }

  return true;
}

export async function publishEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/publish`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch {
    return false;
  }
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
  return publishEvent(eventId);
}

// ----------------------------------------------------------------------
// ORGANIZER TICKET TYPES APIs
// ----------------------------------------------------------------------

export async function fetchTicketTypes(eventId: number): Promise<ApiTicketType[]> {
  const token = getStoredToken();

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types`, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      const res2 = await fetch(`${API_BASE_URL}/public/events/${eventId}`, { headers: getHeaders(token) });
      if (!res2.ok) return [];
      const data2 = await res2.json();
      return data2?.data?.ticket_types || data2?.ticket_types || [];
    }

    const data = await response.json();
    return data?.data || data?.ticketTypes || data || [];
  } catch (error) {
    console.warn('Failed to fetch ticket types from API:', error);
    return [];
  }
}

export async function createTicketType(
  eventId: number,
  payload: {
    name: string;
    price: number;
    quota: number;
    max_per_order?: number;
    sale_start_at?: string;
    sale_end_at?: string;
    status?: 'active' | 'inactive';
  }
): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({
      name: payload.name,
      price: payload.price,
      quota: payload.quota,
      max_per_order: payload.max_per_order || 5,
    }),
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
// OTHER SUPPORTING APIs (POS, TRANSFERS, WITHDRAWALS, LOGS, TEAM)
// ----------------------------------------------------------------------

export async function createOfflineOrder(
  eventId: number,
  payload: CreateOfflineOrderPayload
): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/offline-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memproses pesanan kasir POS offline.';
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchOfflineDashboard(eventId: number): Promise<any> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/dashboard`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch offline dashboard from API:', error);
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
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/profile`, {
    method: 'POST',
    headers: getHeaders(token),
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Gagal memperbarui profil.');
  }

  const updatedProfile = data?.user || data?.data || data;
  if (typeof window !== 'undefined' && updatedProfile) {
    localStorage.setItem('metix_user', JSON.stringify(updatedProfile));
  }
  return updatedProfile;
}

export async function fetchOwnerUsers(params?: {
  search?: string;
  page?: number;
}): Promise<{ users: UserProfile[]; total: number }> {
  const token = getStoredToken();
  if (!token) return { users: [], total: 0 };

  try {
    const url = new URL(`${API_BASE_URL}/owner/organizers`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.page) url.searchParams.append('page', String(params.page));

    const response = await fetch(url.toString(), {
      headers: getHeaders(token),
    });

    if (!response.ok) return { users: [], total: 0 };

    const data = await response.json();
    const userList = data?.data || data?.organizers || [];
    const total = data?.meta?.total || userList.length;

    return { users: userList, total };
  } catch (error) {
    console.warn('Failed to fetch owner users from API:', error);
    return { users: [], total: 0 };
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

export interface ReportOrderItem {
  id: number;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  event_id?: number;
  event_title?: string;
  ticket_type_name?: string;
  quantity: number;
  total_amount: number;
  payment_method?: string;
  status: 'paid' | 'completed' | 'pending' | 'cancelled' | 'refunded';
  created_at: string;
}

export async function fetchSalesReportData(params?: {
  event_id?: string;
  month?: string;
  year?: string;
}): Promise<{
  orders: ReportOrderItem[];
  events: ApiEvent[];
  totalRevenue: number;
  totalTicketsSold: number;
}> {
  const token = getStoredToken();
  if (!token) return { orders: [], events: [], totalRevenue: 0, totalTicketsSold: 0 };

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/dashboard`, {
      headers: getHeaders(token),
    });

    if (response.ok) {
      const data = await response.json();
      const rawOrders = data.recent_orders || data.orders || [];
      const formattedOrders: ReportOrderItem[] = rawOrders.map((ord: any) => ({
        id: ord.id,
        order_number: ord.order_number || `ORD-${ord.id}`,
        buyer_name: ord.buyer_name || 'Pembeli Metix',
        buyer_email: ord.buyer_email || 'buyer@metix.id',
        buyer_phone: ord.buyer_phone,
        event_id: ord.event_id,
        event_title: ord.event?.title || 'Event Metix',
        ticket_type_name: ord.ticket_type?.name || 'Tiket Metix',
        quantity: ord.quantity || 1,
        total_amount: Number(ord.grand_total || ord.subtotal || 0),
        payment_method: ord.payment_method || 'DOKU Payment Gateway',
        status: ord.status === 'PAID' ? 'paid' : 'pending',
        created_at: ord.created_at || new Date().toISOString(),
      }));

      const totalRevenue = formattedOrders.reduce((sum, item) => sum + item.total_amount, 0);
      const totalTicketsSold = formattedOrders.reduce((sum, item) => sum + item.quantity, 0);

      return {
        orders: formattedOrders,
        events: data.events || [],
        totalRevenue,
        totalTicketsSold,
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
  return { logs: [], actionsList: [] };
}

export interface EoAdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  created_by?: number | null;
  created_at?: string;
  roles?: Array<{ id: number; name: string }>;
}

export interface CreateEoAdminPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export async function fetchEoAdmins(): Promise<EoAdminUser[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/organizer/team`, {
      headers: getHeaders(token),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || data?.team || [];
  } catch {
    return [];
  }
}

export async function createEoAdmin(payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan anggota tim scan baru.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
}

export async function updateEoAdmin(adminId: number, payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  return createEoAdmin(payload);
}

export async function deleteEoAdmin(adminId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/organizer/team/${adminId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus anggota tim.');
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
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  rejection_reason?: string | null;
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

export async function saveOrganizerProfile(formData: FormData): Promise<ApiOrganizerProfile> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const existingProfile = await fetchOrganizerProfile();
  const isUpdate = !!existingProfile;

  let response: Response;
  if (isUpdate) {
    formData.append('_method', 'PUT');
    response = await fetch(`${API_BASE_URL}/organizer/profile`, {
      method: 'POST',
      headers: getHeaders(token),
      body: formData,
    });
  } else {
    response = await fetch(`${API_BASE_URL}/organizer/profile`, {
      method: 'POST',
      headers: getHeaders(token),
      body: formData,
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menyimpan profil organisasi.';
    throw new Error(errorMsg);
  }

  return data?.data || data;
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
    });

    if (!response.ok) return { organizers: [] };

    const data = await response.json();
    return {
      organizers: data?.data || [],
      meta: data?.meta,
    };
  } catch (error) {
    console.warn('Failed to fetch owner organizers:', error);
    return { organizers: [] };
  }
}

export async function approveOwnerOrganizer(profileId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/approve`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menyetujui profil organizer.');
  }

  return true;
}

export async function rejectOwnerOrganizer(profileId: number, reason: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/owner/organizers/${profileId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(token),
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menolak profil organizer.');
  }

  return true;
}


