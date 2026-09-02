export const ROLES = {
  OWNER: 'OWNER',
  EO: 'EO',
  BUYER: 'BUYER',
  SCANNER: 'SCANNER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  status?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  photo?: string | null;
  profile_photo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function getUserRole(
  user?: { role?: string; roles?: Array<{ name: string }>; mitra_status?: string | null; organizer_status?: string | null } | null
): UserRole | null {
  if (!user) return null;
  
  const rawRole = (
    user.role ||
    (user.roles && user.roles[0]?.name) ||
    ''
  ).toUpperCase();

  if (rawRole === 'OWNER' || rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PLATFORM') {
    return ROLES.OWNER;
  }
  if (rawRole === 'EO' || rawRole === 'MITRA' || rawRole === 'ORGANIZER') {
    const status = (
      user.mitra_status ||
      (user as any).organizer_status ||
      (user as any).status ||
      ''
    ).toUpperCase();

    // If EO account status is pending approval or rejected, treat as BUYER until Owner approves
    if (status === 'PENDING' || status === 'PENDING_APPROVAL' || status === 'REJECTED') {
      return ROLES.BUYER;
    }

    return ROLES.EO;
  }
  if (rawRole === 'SCANNER' || rawRole === 'STAFF') {
    return ROLES.SCANNER;
  }
  if (rawRole === 'BUYER' || rawRole === 'PEMBELI') {
    return ROLES.BUYER;
  }

  return null;
}

export function hasRole(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined,
  role: UserRole
): boolean {
  return getUserRole(user) === role;
}

export function hasAnyRole(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined,
  roles: UserRole[]
): boolean {
  const currentRole = getUserRole(user);
  return currentRole !== null && roles.includes(currentRole);
}

export function isOwner(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): boolean {
  return hasRole(user, ROLES.OWNER);
}

export function isEo(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): boolean {
  return hasRole(user, ROLES.EO);
}

export function isOrganizer(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): boolean {
  return isEo(user);
}

export function isBuyer(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): boolean {
  return hasRole(user, ROLES.BUYER);
}

export function isScanner(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): boolean {
  return hasRole(user, ROLES.SCANNER);
}

/**
 * Route protection rules per role.
 * Returns true if the user with given role is allowed to view the pathname.
 */
export function canAccessRoute(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined,
  pathname: string
): boolean {
  const role = getUserRole(user);
  if (!role) return false;

  // Public paths inside /dashboard if any
  if (!pathname.startsWith('/dashboard')) {
    return true;
  }

  // Owner Routes
  if (role === ROLES.OWNER) {
    const ownerAllowed = [
      '/dashboard',
      '/dashboard/users',
      '/dashboard/withdrawals',
      '/dashboard/events',
      '/dashboard/reports',
      '/dashboard/audit-logs',
      '/dashboard/settings',
      '/dashboard/profile',
      '/dashboard/security',
    ];
    return ownerAllowed.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  // EO Routes
  if (role === ROLES.EO) {
    const eoAllowed = [
      '/dashboard',
      '/dashboard/events',
      '/dashboard/tickets',
      '/dashboard/pos',
      '/dashboard/checkin',
      '/dashboard/admins',
      '/dashboard/wristbands',
      '/dashboard/reports',
      '/dashboard/settings',
      '/dashboard/profile',
      '/dashboard/security',
    ];
    return eoAllowed.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  // Buyer Routes
  if (role === ROLES.BUYER) {
    const buyerAllowed = [
      '/dashboard',
      '/dashboard/tickets',
      '/dashboard/transfers',
      '/dashboard/profile',
      '/dashboard/settings',
      '/dashboard/security',
    ];
    return buyerAllowed.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  // Scanner Routes
  if (role === ROLES.SCANNER) {
    const scannerAllowed = [
      '/dashboard',
      '/dashboard/checkin',
      '/dashboard/profile',
      '/dashboard/security',
    ];
    return scannerAllowed.some((p) => pathname === p || pathname.startsWith(p + '/'));
  }

  return false;
}

/**
 * Get primary dashboard route for a given user role.
 */
export function getDefaultRoleDashboard(
  user: { role?: string; roles?: Array<{ name: string }> } | null | undefined
): string {
  const role = getUserRole(user);
  switch (role) {
    case ROLES.OWNER:
      return '/dashboard';
    case ROLES.EO:
      return '/dashboard';
    case ROLES.BUYER:
      return '/dashboard';
    case ROLES.SCANNER:
      return '/dashboard/checkin';
    default:
      return '/';
  }
}
