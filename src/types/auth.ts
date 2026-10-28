// ============================================================================
// Authoritative Domain Models and Contracts (Unified Auth & Adaptive Shell)
// ============================================================================

export type UserRole = 'admin' | 'marketer' | 'hr';

export interface WorkspaceUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  office: string;
  createdAt: string;
  lastLogin?: string;
}

export interface NavItemConfig {
  href: string;
  label: string;
  iconName: string;
  requiredRoles: UserRole[];
  badge?: string;
}

export const AUTH_STORAGE_KEY = 'collat_auth_user_v1';
export const AUTH_TOKEN_STORAGE_KEY = 'collat_auth_token_v1';

// Canonical Pre-Seeded Accounts
export const PRESEEDED_ACCOUNTS: Record<
  string,
  { user: WorkspaceUser; passwordHash: string; plainPassword: string }
> = {
  'admin@collage.com.gh': {
    user: {
      id: 'usr-admin-kojo',
      email: 'admin@collage.com.gh',
      firstName: 'Kojo',
      lastName: 'Nathan',
      fullName: 'Kojo Nathan',
      role: 'admin',
      office: 'Accra HQ (Ridge)',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    passwordHash: 'Collage2026!',
    plainPassword: 'Collage2026!',
  },
  'kojo@collage.com.gh': {
    user: {
      id: 'usr-kojo-nathan',
      email: 'kojo@collage.com.gh',
      firstName: 'Kojo',
      lastName: 'Nathan',
      fullName: 'Kojo Nathan',
      role: 'admin',
      office: 'Accra HQ (Ridge)',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    passwordHash: 'Collage2026!',
    plainPassword: 'Collage2026!',
  },
  'marketer@collage.com.gh': {
    user: {
      id: 'usr-marketer-nana',
      email: 'marketer@collage.com.gh',
      firstName: 'Nana',
      lastName: 'Mensah',
      fullName: 'Nana Mensah',
      role: 'marketer',
      office: 'Brand & Marketing Desk',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    passwordHash: 'Collage2026!',
    plainPassword: 'Collage2026!',
  },
  'hr@collage.com.gh': {
    user: {
      id: 'usr-hr-efua',
      email: 'hr@collage.com.gh',
      firstName: 'Efua',
      lastName: 'Baffour',
      fullName: 'Efua Baffour',
      role: 'hr',
      office: 'People & Culture Desk',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    passwordHash: 'Collage2026!',
    plainPassword: 'Collage2026!',
  },
};

// Canonical Navigation Items Matrix
export const ALL_WORKSPACE_NAV_ITEMS: NavItemConfig[] = [
  // Admin Navigation
  { href: '/dashboard', label: 'Overview', iconName: 'LayoutDashboard', requiredRoles: ['admin'] },
  { href: '/clients', label: 'Clients Directory', iconName: 'Users', requiredRoles: ['admin'] },
  { href: '/quotations', label: 'Quotations', iconName: 'FileText', requiredRoles: ['admin'] },
  { href: '/invoices', label: 'Tax Invoices', iconName: 'ReceiptText', requiredRoles: ['admin'] },
  { href: '/operations', label: 'Rentals & Production', iconName: 'Layers', requiredRoles: ['admin'] },
  { href: '/admin/users', label: 'User & Role Access', iconName: 'UserCheck', requiredRoles: ['admin'] },
  { href: '/admin/system', label: 'System Diagnostics', iconName: 'Activity', requiredRoles: ['admin'] },

  // Marketer Navigation
  { href: '/dashboard', label: 'Marketing Hub', iconName: 'Target', requiredRoles: ['marketer'] },
  { href: '/leads', label: 'Client Leads', iconName: 'UserPlus', requiredRoles: ['marketer'] },
  { href: '/campaigns', label: 'Campaign Tracker', iconName: 'Megaphone', requiredRoles: ['marketer'] },
  { href: '/portfolio-showcase', label: 'Showcase Links', iconName: 'Share2', requiredRoles: ['marketer'] },

  // HR Navigation
  { href: '/dashboard', label: 'People Hub', iconName: 'UsersRound', requiredRoles: ['hr'] },
  { href: '/staff', label: 'Staff Directory', iconName: 'Contact', requiredRoles: ['hr'] },
  { href: '/notices', label: 'Internal Notices', iconName: 'Bell', requiredRoles: ['hr'] },
  { href: '/attendance', label: 'Attendance & Tracking', iconName: 'CalendarCheck', requiredRoles: ['hr'] },
];

// Unified Authentication Engine
export function authenticateWithUnifiedAuth(
  emailInput: string,
  passwordInput: string,
): { success: boolean; user?: WorkspaceUser; error?: string } {
  const normalizedEmail = (emailInput || '').trim().toLowerCase();
  const trimmedPassword = (passwordInput || '').trim();

  if (!normalizedEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!trimmedPassword) {
    return { success: false, error: 'Password is required.' };
  }

  const account = PRESEEDED_ACCOUNTS[normalizedEmail];
  if (!account) {
    return { success: false, error: 'Invalid work email or account not found.' };
  }

  if (account.plainPassword !== trimmedPassword) {
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  const authenticatedUser: WorkspaceUser = {
    ...account.user,
    lastLogin: new Date().toISOString(),
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, `mock-token-${authenticatedUser.role}`);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  return { success: true, user: authenticatedUser };
}

// Session Retrieval
export function getActiveSessionUser(): WorkspaceUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.email && parsed.role) {
      return parsed as WorkspaceUser;
    }
  } catch {
    return null;
  }
  return null;
}

// Session Logout
export function clearActiveSession(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Role Navigation Filter
export function getNavigationForRole(role: UserRole): NavItemConfig[] {
  return ALL_WORKSPACE_NAV_ITEMS.filter((item) => item.requiredRoles.includes(role));
}

// Canonical Dashboard View Resolver
export function resolveCanonicalDashboard(role: UserRole): {
  viewId: string;
  title: string;
  accessibleTools: string[];
} {
  switch (role) {
    case 'admin':
      return {
        viewId: 'AdminDashboard',
        title: 'Executive Financial & Operations Ledger',
        accessibleTools: ['Financial Metrics', 'Rentals Queue', 'Production Orders', 'User Management', 'Diagnostics'],
      };
    case 'marketer':
      return {
        viewId: 'MarketerDashboard',
        title: 'Marketing Hub & Campaign Pipeline',
        accessibleTools: ['Leads Conversion', 'Campaign ROI', 'Showcase Links', 'Client Briefs'],
      };
    case 'hr':
      return {
        viewId: 'HrDashboard',
        title: 'People & Culture Operations Hub',
        accessibleTools: ['Staff Records', 'Attendance Log', 'Notice Board', 'Leave Approvals'],
      };
  }
}

// RoleGuard Evaluation Engine
export function evaluateRoleAccess(
  userRole: UserRole | null | undefined,
  allowedRoles: UserRole[],
): { allowed: boolean; reason?: string } {
  if (!userRole) {
    return { allowed: false, reason: 'Authentication required. Please sign in.' };
  }
  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Access restricted. Your active role (${userRole}) is not authorized for this view.`,
    };
  }
  return { allowed: true };
}
