'use me';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://metix-backend.lufexa.id/api'
).trim().replace(/\/+$/, '');

export function getPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
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
  phone?: string;
  gender?: string;
  birth_date?: string;
  role?: 'pembeli' | 'mitra';
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
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
  message: string;
  token_type: string;
  token: string;
  user: UserProfile;
}

export interface ApiTicketType {
  id: number;
  event_id: number;
  name: string;
  price: string | number;
  quota?: number;
  max_per_order?: number;
  sold_quantity?: number;
  reserved_quantity?: number;
  sale_start_at?: string;
  sale_end_at?: string;
  status?: string;
}

export interface ApiEvent {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  description?: string | null;
  desc?: string | null;
  terms?: string | null;
  terms_and_conditions?: string | null;
  syarat_ketentuan?: string | null;
  location?: string | null;
  address?: string | null;
  event_start_at: string;
  event_end_at: string;
  status: string;
  category?: string | null;
  banner?: string | null;
  venue_photo?: string | null;
  ticket_types?: ApiTicketType[];
  require_holder_name?: boolean;
}

export interface ApiTicketDetail {
  id: number;
  ticket_code: string;
  status: string;
  created_at?: string;
  event?: {
    id: number;
    title: string;
    location?: string;
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
}

export interface DashboardResponse {
  role?: 'pembeli' | 'mitra' | 'owner';
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

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors?.email ? data.errors.email[0] : null) ||
      'Email atau password yang Anda masukkan salah.';
    throw new Error(errorMsg);
  }

  // Store token and profile in localStorage upon success
  if (typeof window !== 'undefined') {
    localStorage.setItem('metix_token', data.token);
    localStorage.setItem('metix_user', JSON.stringify(data.user));
  }

  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
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
      phone: payload.phone,
      gender: payload.gender,
      birth_date: payload.birth_date,
      role: payload.role || 'pembeli',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Pendaftaran gagal. Silakan periksa kembali data Anda.';
    throw new Error(errorMsg);
  }

  // Store token and profile in localStorage upon success
  if (typeof window !== 'undefined') {
    localStorage.setItem('metix_token', data.token);
    localStorage.setItem('metix_user', JSON.stringify(data.user));
  }

  return data;
}

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

export async function logoutApi(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
  }
  logoutUser();
}

export async function fetchPublicEvents(params?: {
  search?: string;
  category?: string;
}): Promise<PublicEventsResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/public/events`);
    if (params?.search) {
      url.searchParams.append('search', params.search);
    }
    if (params?.category) {
      url.searchParams.append('category', params.category);
    }

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
    return {
      events: data?.events || [],
      categories: data?.categories || [],
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
    return data?.event || data || null;
  } catch (error) {
    console.warn('Failed to fetch event detail from API:', error);
    return null;
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const profile = data?.user || data;
    if (typeof window !== 'undefined' && profile) {
      localStorage.setItem('metix_user', JSON.stringify(profile));
    }
    return profile;
  } catch (error) {
    console.warn('Failed to fetch user profile from API:', error);
    return getStoredUser();
  }
}

export async function fetchUserTickets(): Promise<ApiTicketDetail[]> {
  const token = getStoredToken();
  let localTickets: ApiTicketDetail[] = [];
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('metix_local_tickets');
    if (stored) {
      try {
        localTickets = JSON.parse(stored);
      } catch {}
    }
  }

  if (!token) return localTickets;

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const serverTickets: ApiTicketDetail[] = data?.tickets?.data || [];

    const existingCodes = new Set(serverTickets.map((t) => t.ticket_code));
    const uniqueLocal = localTickets.filter((t) => !existingCodes.has(t.ticket_code));

    return [...uniqueLocal, ...serverTickets];
  } catch (error) {
    console.warn('Failed to fetch user tickets from API:', error);
    return localTickets;
  }
}

export async function fetchTicketTransfers(): Promise<{
  sentTransfers: ApiTicketTransferItem[];
  receivedTransfers: ApiTicketTransferItem[];
}> {
  const token = getStoredToken();
  if (!token) return { sentTransfers: [], receivedTransfers: [] };

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/transfers`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      sentTransfers: data?.sentTransfers?.data || data?.sentTransfers || [],
      receivedTransfers: data?.receivedTransfers?.data || data?.receivedTransfers || [],
    };
  } catch (error) {
    console.warn('Failed to fetch ticket transfers from API:', error);
    return { sentTransfers: [], receivedTransfers: [] };
  }
}

export async function fetchMyEvents(): Promise<{
  events: ApiEvent[];
  stats?: {
    totalEarnings?: number;
    withdrawn?: number;
    pendingWithdrawal?: number;
    balance?: number;
  };
}> {
  const token = getStoredToken();
  if (!token) return { events: [] };

  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      events: data?.events?.data || data?.events || [],
      stats: data?.dashboardStats,
    };
  } catch (error) {
    console.warn('Failed to fetch my events from API:', error);
    return { events: [] };
  }
}

export async function createEvent(formData: FormData): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
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

  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
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
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/publish`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
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
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
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
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/duplicate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function archiveEvent(eventId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/archive`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchTicketTypes(eventId: number): Promise<ApiTicketType[]> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/ticket-types`, {
      headers,
    });

    if (!response.ok) {
      const res2 = await fetch(`${API_BASE_URL}/events/${eventId}/ticket-types`, { headers });
      if (!res2.ok) throw new Error(`HTTP Error: ${res2.status}`);
      const data2 = await res2.json();
      return data2?.ticketTypes || data2 || [];
    }

    const data = await response.json();
    return data?.ticketTypes || data || [];
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

  const now = new Date();
  const defaultSaleStart = now.toISOString().replace('T', ' ').substring(0, 19);
  const nextYear = new Date(now.getFullYear() + 1, 11, 31);
  const defaultSaleEnd = nextYear.toISOString().replace('T', ' ').substring(0, 19);

  const fullPayload = {
    name: payload.name,
    price: payload.price,
    quota: payload.quota,
    max_per_order: payload.max_per_order || 5,
    sale_start_at: payload.sale_start_at || defaultSaleStart,
    sale_end_at: payload.sale_end_at || defaultSaleEnd,
    status: payload.status || 'active',
  };

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/ticket-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fullPayload),
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
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/ticket-types/${ticketTypeId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function createOfflineOrder(
  eventId: number,
  payload: CreateOfflineOrderPayload
): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/offline-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
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
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/offline-dashboard`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch offline dashboard from API:', error);
    return null;
  }
}

export async function processCheckIn(payload: CheckInPayload): Promise<CheckInResponse> {
  const token = getStoredToken();
  if (!token) throw new Error('Silakan login terlebih dahulu (Unauthenticated).');

  const response = await fetch(`${API_BASE_URL}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

export async function acceptTicketTransfer(transferId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/transfers/${transferId}/accept`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function rejectTicketTransfer(transferId: number, reason?: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/transfers/${transferId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchWithdrawals(params?: { status?: string }): Promise<ApiWithdrawalItem[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const url = new URL(`${API_BASE_URL}/owner/withdrawals`);
    if (params?.status) url.searchParams.append('status', params.status);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data?.withdrawals?.data || data?.withdrawals || [];
  } catch (error) {
    console.warn('Failed to fetch withdrawals from API:', error);
    return [];
  }
}

export async function approveWithdrawal(withdrawalId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function rejectWithdrawal(withdrawalId: number, notes?: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function requestWithdrawal(payload: {
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  notes?: string;
}): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/user/withdraw-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateUserProfile(formData: FormData): Promise<UserProfile> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Gagal memperbarui profil.');
  }

  const updatedProfile = data?.user || data;
  if (typeof window !== 'undefined' && updatedProfile) {
    localStorage.setItem('metix_user', JSON.stringify(updatedProfile));
  }
  return updatedProfile;
}

export async function fetchDashboardData(): Promise<DashboardResponse | null> {
  const token = getStoredToken();
  const user = getStoredUser();
  if (!token) return null;

  let role: 'pembeli' | 'mitra' | 'owner' = 'pembeli';
  let roleLabel = 'Pembeli Tiket';

  if (user) {
    const roleNames = user.roles ? user.roles.map((r) => r.name.toLowerCase()) : [];
    if (
      user.email === 'admin@metix.com' ||
      roleNames.includes('owner') ||
      roleNames.includes('admin') ||
      roleNames.includes('superadmin')
    ) {
      role = 'owner';
      roleLabel = 'Super Admin Platform';
    } else if (
      roleNames.includes('mitra') ||
      roleNames.includes('eo') ||
      roleNames.includes('organizer') ||
      user.mitra_status === 'approved' ||
      user.email === 'lutfifahri175@gmail.com'
    ) {
      role = 'mitra';
      roleLabel = 'Event Organizer (EO)';
    } else {
      role = 'pembeli';
      roleLabel = 'Pembeli Tiket';
    }
  }

  try {
    const endpoint = role === 'owner' ? `${API_BASE_URL}/owner/dashboard` : `${API_BASE_URL}/dashboard`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    let eventsList = data.eventsList || data.events || data.my_events || (Array.isArray(data.data) ? data.data : data.data?.events) || [];

    if ((role === 'mitra' || role === 'owner') && (!Array.isArray(eventsList) || eventsList.length === 0)) {
      try {
        const myEvts = await fetchMyEvents();
        if (myEvts.events && myEvts.events.length > 0) {
          eventsList = myEvts.events;
        }
      } catch (e) {
        console.warn('Failed to fetch fallback my events:', e);
      }
    }

    return {
      ...data,
      eventsList,
      role,
      roleLabel,
    };
  } catch (error) {
    console.warn('Failed to fetch dashboard data from API:', error);
    let eventsList: any[] = [];
    if (role === 'mitra' || role === 'owner') {
      try {
        const myEvts = await fetchMyEvents();
        if (myEvts.events) eventsList = myEvts.events;
      } catch {}
    }
    return {
      role,
      roleLabel,
      stats: {},
      tickets: { data: [] },
      eventsList,
    };
  }
}

export async function fetchOwnerUsers(params?: {
  search?: string;
  page?: number;
}): Promise<{ users: UserProfile[]; total: number }> {
  const token = getStoredToken();
  if (!token) return { users: [], total: 0 };

  try {
    const url = new URL(`${API_BASE_URL}/owner/users`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.page) url.searchParams.append('page', String(params.page));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const userList = data?.users?.data || data?.users || [];
    const total = data?.users?.total || userList.length;

    return { users: userList, total };
  } catch (error) {
    console.warn('Failed to fetch owner users from API:', error);
    return { users: [], total: 0 };
  }
}

export async function approveMitraUser(userId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/users/${userId}/approve-mitra`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function rejectMitraUser(userId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/users/${userId}/reject-mitra`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
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
  const token = getStoredToken();
  if (!token) return { wristbands: [], events: [] };

  try {
    const url = new URL(`${API_BASE_URL}/wristbands`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.event_id && params.event_id !== 'all') url.searchParams.append('event_id', params.event_id);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        wristbands: data.unpairedWristbands?.data || data.wristbands || [],
        events: data.events || [],
      };
    }
  } catch (error) {
    console.warn('Failed to fetch wristbands:', error);
  }
  return { wristbands: [], events: [] };
}

export async function bulkGenerateWristbands(
  eventId: number,
  quantity: number
): Promise<{ success: boolean; wristbands?: WristbandItem[]; message?: string }> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  try {
    const response = await fetch(`${API_BASE_URL}/wristbands/bulk-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id: eventId, quantity }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, wristbands: data.wristbands || [], message: data.message || 'Berhasil generate wristband!' };
    }
    return { success: false, message: data.message || 'Gagal generate wristband' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal generate wristband' };
  }
}

export async function updateUserRole(userId: number, role: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/owner/users/${userId}/roles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    return response.ok;
  } catch {
    return false;
  }
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
    const url = new URL(`${API_BASE_URL}/reports`);
    if (params?.event_id && params.event_id !== 'all') url.searchParams.append('event_id', params.event_id);
    if (params?.month) url.searchParams.append('month', params.month);
    if (params?.year) url.searchParams.append('year', params.year);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const rawOrders = data.recentOrders?.data || data.orders || [];
      const formattedOrders: ReportOrderItem[] = rawOrders.map((ord: any) => ({
        id: ord.id,
        order_number: ord.order_number || `ORD-${ord.id}`,
        buyer_name: ord.buyer_name || ord.user?.name || 'Pembeli Metix',
        buyer_email: ord.buyer_email || ord.user?.email || 'buyer@metix.id',
        buyer_phone: ord.buyer_phone || ord.user?.phone,
        event_id: ord.event_id || ord.event?.id,
        event_title: ord.event?.title || 'Event Metix',
        ticket_type_name: ord.ticket_type?.name || 'Reguler Ticket',
        quantity: ord.quantity || ord.total_quantity || 1,
        total_amount: Number(ord.total_amount || ord.grand_total || ord.amount || 0),
        payment_method: ord.payment_method || ord.payment_channel || 'Midtrans QRIS',
        status: ord.status === 'success' || ord.status === 'paid' ? 'paid' : ord.status === 'pending' ? 'pending' : 'paid',
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
  const token = getStoredToken();
  if (!token) return { logs: [], actionsList: [] };

  try {
    const url = new URL(`${API_BASE_URL}/owner/audit-logs`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.action && params.action !== 'all') url.searchParams.append('action', params.action);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const rawLogs = data.logs?.data || data.logs || [];
      const formattedLogs: AuditLogItem[] = rawLogs.map((log: any) => ({
        id: log.id,
        user_id: log.user_id || log.user?.id,
        user_name: log.user?.name || log.user_name || 'System User',
        user_email: log.user?.email || log.user_email || 'system@metix.id',
        action: log.action || 'SYSTEM_LOG',
        description: log.description || 'Aktivitas sistem tercatat.',
        ip_address: log.ip_address || '127.0.0.1',
        user_agent: log.user_agent || 'Browser Client',
        created_at: log.created_at || new Date().toISOString(),
        user: log.user,
      }));

      return {
        logs: formattedLogs,
        actionsList: data.actionsList || [],
      };
    }
  } catch (error) {
    console.warn('Failed to fetch audit logs:', error);
  }
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
    const response = await fetch(`${API_BASE_URL}/eo/admins`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.admins || [];
  } catch (error) {
    console.warn('Failed to fetch EO admins:', error);
    return [];
  }
}

export async function createEoAdmin(payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/eo/admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal menambahkan admin scan baru.';
    throw new Error(errorMsg);
  }

  return data?.admin;
}

export async function updateEoAdmin(adminId: number, payload: CreateEoAdminPayload): Promise<EoAdminUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/eo/admins/${adminId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      'Gagal memperbarui admin scan.';
    throw new Error(errorMsg);
  }

  return data?.admin;
}

export async function deleteEoAdmin(adminId: number): Promise<boolean> {
  const token = getStoredToken();
  if (!token) throw new Error('Unauthenticated');

  const response = await fetch(`${API_BASE_URL}/eo/admins/${adminId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Gagal menghapus admin scan.');
  }

  return true;
}

