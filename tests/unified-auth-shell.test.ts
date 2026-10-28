import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mockLocalStorage } from './setup.ts';

// ============================================================================
// Authoritative Specifications and Contract Engines (R2 Unified Auth & Adaptive Shell)
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

  // Persist session to local storage
  try {
    mockLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
  } catch {
    // Ignore storage issues in test context
  }

  return { success: true, user: authenticatedUser };
}

// Session Retrieval
export function getActiveSessionUser(): WorkspaceUser | null {
  const raw = mockLocalStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
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
  mockLocalStorage.removeItem(AUTH_STORAGE_KEY);
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

beforeEach(() => {
  clearActiveSession();
});

// ============================================================================
// TIER 1: FEATURE COVERAGE (Happy Path)
// ============================================================================

test('Tier 1: Pre-Seeded Multi-Role Accounts Contract covers Admin, Marketer, and HR', () => {
  const emails = Object.keys(PRESEEDED_ACCOUNTS);
  assert.ok(emails.includes('admin@collage.com.gh'), 'Must seed admin@collage.com.gh');
  assert.ok(emails.includes('marketer@collage.com.gh'), 'Must seed marketer@collage.com.gh');
  assert.ok(emails.includes('hr@collage.com.gh'), 'Must seed hr@collage.com.gh');

  const admin = PRESEEDED_ACCOUNTS['admin@collage.com.gh'].user;
  assert.strictEqual(admin.role, 'admin');
  assert.strictEqual(admin.fullName, 'Kojo Nathan');

  const marketer = PRESEEDED_ACCOUNTS['marketer@collage.com.gh'].user;
  assert.strictEqual(marketer.role, 'marketer');
  assert.strictEqual(marketer.fullName, 'Nana Mensah');

  const hr = PRESEEDED_ACCOUNTS['hr@collage.com.gh'].user;
  assert.strictEqual(hr.role, 'hr');
  assert.strictEqual(hr.fullName, 'Efua Baffour');
});

test('Tier 1: Unified Sign-In successfully authenticates all three canonical personas', () => {
  // 1. Admin login
  const adminRes = authenticateWithUnifiedAuth('admin@collage.com.gh', 'Collage2026!');
  assert.strictEqual(adminRes.success, true);
  assert.strictEqual(adminRes.user?.role, 'admin');
  assert.strictEqual(getActiveSessionUser()?.email, 'admin@collage.com.gh');

  // 2. Marketer login
  const marketerRes = authenticateWithUnifiedAuth('marketer@collage.com.gh', 'Collage2026!');
  assert.strictEqual(marketerRes.success, true);
  assert.strictEqual(marketerRes.user?.role, 'marketer');
  assert.strictEqual(getActiveSessionUser()?.email, 'marketer@collage.com.gh');

  // 3. HR login
  const hrRes = authenticateWithUnifiedAuth('hr@collage.com.gh', 'Collage2026!');
  assert.strictEqual(hrRes.success, true);
  assert.strictEqual(hrRes.user?.role, 'hr');
  assert.strictEqual(getActiveSessionUser()?.email, 'hr@collage.com.gh');
});

test('Tier 1: Adaptive Navigation correctly filters navigation items per authenticated role', () => {
  const adminNav = getNavigationForRole('admin');
  const marketerNav = getNavigationForRole('marketer');
  const hrNav = getNavigationForRole('hr');

  // Admin verification
  assert.strictEqual(adminNav.length, 7);
  assert.ok(adminNav.some((n) => n.href === '/quotations'));
  assert.ok(adminNav.some((n) => n.href === '/invoices'));
  assert.ok(adminNav.some((n) => n.href === '/admin/users'));
  assert.strictEqual(adminNav.some((n) => n.href === '/campaigns'), false);

  // Marketer verification
  assert.strictEqual(marketerNav.length, 4);
  assert.ok(marketerNav.some((n) => n.href === '/leads'));
  assert.ok(marketerNav.some((n) => n.href === '/campaigns'));
  assert.ok(marketerNav.some((n) => n.href === '/portfolio-showcase'));
  assert.strictEqual(marketerNav.some((n) => n.href === '/invoices'), false);
  assert.strictEqual(marketerNav.some((n) => n.href === '/staff'), false);

  // HR verification
  assert.strictEqual(hrNav.length, 4);
  assert.ok(hrNav.some((n) => n.href === '/staff'));
  assert.ok(hrNav.some((n) => n.href === '/notices'));
  assert.ok(hrNav.some((n) => n.href === '/attendance'));
  assert.strictEqual(hrNav.some((n) => n.href === '/invoices'), false);
  assert.strictEqual(hrNav.some((n) => n.href === '/campaigns'), false);
});

test('Tier 1: Canonical /dashboard dynamically resolves role-specific views without URL typing', () => {
  const adminDashboard = resolveCanonicalDashboard('admin');
  assert.strictEqual(adminDashboard.viewId, 'AdminDashboard');
  assert.ok(adminDashboard.accessibleTools.includes('Financial Metrics'));

  const marketerDashboard = resolveCanonicalDashboard('marketer');
  assert.strictEqual(marketerDashboard.viewId, 'MarketerDashboard');
  assert.ok(marketerDashboard.accessibleTools.includes('Campaign ROI'));

  const hrDashboard = resolveCanonicalDashboard('hr');
  assert.strictEqual(hrDashboard.viewId, 'HrDashboard');
  assert.ok(hrDashboard.accessibleTools.includes('Staff Records'));
});

test('Tier 1: RoleGuard grants access to authorized roles and denies unauthorized roles', () => {
  // Admin-only route guard
  assert.strictEqual(evaluateRoleAccess('admin', ['admin']).allowed, true);
  assert.strictEqual(evaluateRoleAccess('marketer', ['admin']).allowed, false);
  assert.strictEqual(evaluateRoleAccess('hr', ['admin']).allowed, false);

  // Marketer & Admin route guard
  assert.strictEqual(evaluateRoleAccess('marketer', ['marketer', 'admin']).allowed, true);
  assert.strictEqual(evaluateRoleAccess('admin', ['marketer', 'admin']).allowed, true);
  assert.strictEqual(evaluateRoleAccess('hr', ['marketer', 'admin']).allowed, false);

  // HR & Admin route guard
  assert.strictEqual(evaluateRoleAccess('hr', ['hr', 'admin']).allowed, true);
  assert.strictEqual(evaluateRoleAccess('admin', ['hr', 'admin']).allowed, true);
  assert.strictEqual(evaluateRoleAccess('marketer', ['hr', 'admin']).allowed, false);
});

// ============================================================================
// TIER 2: BOUNDARIES & EDGE CASES
// ============================================================================

test('Tier 2: Unified Sign-In handles whitespace and case-insensitive email inputs', () => {
  // Case-insensitive email
  const res1 = authenticateWithUnifiedAuth('ADMIN@COLLAGE.COM.GH', 'Collage2026!');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.user?.role, 'admin');

  // Leading and trailing whitespace
  const res2 = authenticateWithUnifiedAuth('  marketer@collage.com.gh  ', 'Collage2026!');
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.user?.role, 'marketer');
});

test('Tier 2: Unified Sign-In rejects empty, invalid, and unknown credentials', () => {
  // Empty email
  const emptyEmail = authenticateWithUnifiedAuth('', 'Collage2026!');
  assert.strictEqual(emptyEmail.success, false);
  assert.ok(emptyEmail.error?.includes('Email address is required'));

  // Empty password
  const emptyPass = authenticateWithUnifiedAuth('admin@collage.com.gh', '');
  assert.strictEqual(emptyPass.success, false);
  assert.ok(emptyPass.error?.includes('Password is required'));

  // Unknown email
  const unknownEmail = authenticateWithUnifiedAuth('stranger@gmail.com', 'Collage2026!');
  assert.strictEqual(unknownEmail.success, false);
  assert.ok(unknownEmail.error?.includes('Invalid work email'));

  // Wrong password
  const wrongPass = authenticateWithUnifiedAuth('admin@collage.com.gh', 'WrongPassword123');
  assert.strictEqual(wrongPass.success, false);
  assert.ok(wrongPass.error?.includes('Invalid password'));
});

test('Tier 2: Storage Resilience handles corrupted session payloads in localStorage', () => {
  // Null store
  mockLocalStorage.removeItem(AUTH_STORAGE_KEY);
  assert.strictEqual(getActiveSessionUser(), null);

  // Corrupted JSON
  mockLocalStorage.setItem(AUTH_STORAGE_KEY, '{invalid json');
  assert.strictEqual(getActiveSessionUser(), null);

  // Empty object
  mockLocalStorage.setItem(AUTH_STORAGE_KEY, '{}');
  assert.strictEqual(getActiveSessionUser(), null);

  // Missing role
  mockLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: 'test@collage.com.gh' }));
  assert.strictEqual(getActiveSessionUser(), null);
});

test('Tier 2: RoleGuard handles unauthenticated or null user sessions cleanly', () => {
  const unauthRes = evaluateRoleAccess(null, ['admin']);
  assert.strictEqual(unauthRes.allowed, false);
  assert.ok(unauthRes.reason?.includes('Authentication required'));

  const emptyRolesRes = evaluateRoleAccess('admin', []);
  assert.strictEqual(emptyRolesRes.allowed, false);
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================

test('Tier 3: Dynamic Persona Switch Flow in Demo Mode updates Session and Navigation', () => {
  // Step 1: Sign in as Marketer
  const loginMarketer = authenticateWithUnifiedAuth('marketer@collage.com.gh', 'Collage2026!');
  assert.strictEqual(loginMarketer.success, true);
  let session = getActiveSessionUser();
  assert.strictEqual(session?.role, 'marketer');

  // Verify navigation is marketer-specific
  let nav = getNavigationForRole(session!.role);
  assert.strictEqual(nav.some((n) => n.href === '/campaigns'), true);
  assert.strictEqual(nav.some((n) => n.href === '/invoices'), false);

  // Step 2: Switch Persona to HR (Demo Role Switcher in header)
  const hrUser = PRESEEDED_ACCOUNTS['hr@collage.com.gh'].user;
  mockLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(hrUser));

  session = getActiveSessionUser();
  assert.strictEqual(session?.role, 'hr');
  nav = getNavigationForRole(session!.role);
  assert.strictEqual(nav.some((n) => n.href === '/staff'), true);
  assert.strictEqual(nav.some((n) => n.href === '/campaigns'), false);

  // Step 3: Switch Persona to Admin
  const adminUser = PRESEEDED_ACCOUNTS['admin@collage.com.gh'].user;
  mockLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));

  session = getActiveSessionUser();
  assert.strictEqual(session?.role, 'admin');
  nav = getNavigationForRole(session!.role);
  assert.strictEqual(nav.some((n) => n.href === '/admin/users'), true);
});

test('Tier 3: Cross-Role Route Restriction enforces strict boundary enforcement', () => {
  // Marketer signs in
  authenticateWithUnifiedAuth('marketer@collage.com.gh', 'Collage2026!');
  const marketerUser = getActiveSessionUser()!;

  // Marketer navigates to permitted route /campaigns
  const marketerToCampaigns = evaluateRoleAccess(marketerUser.role, ['marketer']);
  assert.strictEqual(marketerToCampaigns.allowed, true);

  // Marketer attempts to access /admin/users directly
  const marketerToAdmin = evaluateRoleAccess(marketerUser.role, ['admin']);
  assert.strictEqual(marketerToAdmin.allowed, false);
  assert.ok(marketerToAdmin.reason?.includes('Access restricted'));

  // Marketer attempts to access /invoices directly
  const marketerToInvoices = evaluateRoleAccess(marketerUser.role, ['admin']);
  assert.strictEqual(marketerToInvoices.allowed, false);

  // Marketer attempts to access /attendance directly
  const marketerToAttendance = evaluateRoleAccess(marketerUser.role, ['hr']);
  assert.strictEqual(marketerToAttendance.allowed, false);
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

test('Tier 4: Complete Multi-Operator Day at Collage Ghana HQ', () => {
  // Morning: Nana Mensah (Marketer) arrives, signs in via 1-click persona
  const marketerSession = authenticateWithUnifiedAuth('marketer@collage.com.gh', 'Collage2026!');
  assert.strictEqual(marketerSession.success, true);
  assert.strictEqual(marketerSession.user?.fullName, 'Nana Mensah');

  // Nana views canonical dashboard
  const marketerDash = resolveCanonicalDashboard(marketerSession.user!.role);
  assert.strictEqual(marketerDash.viewId, 'MarketerDashboard');
  assert.ok(marketerDash.accessibleTools.includes('Leads Conversion'));

  // Midday: Efua Baffour (HR) logs in to update workshop attendance
  const hrSession = authenticateWithUnifiedAuth('hr@collage.com.gh', 'Collage2026!');
  assert.strictEqual(hrSession.success, true);
  assert.strictEqual(hrSession.user?.fullName, 'Efua Baffour');

  const hrDash = resolveCanonicalDashboard(hrSession.user!.role);
  assert.strictEqual(hrDash.viewId, 'HrDashboard');
  assert.ok(hrDash.accessibleTools.includes('Attendance Log'));

  // Afternoon: Kojo Nathan (Admin) reviews tax compliance & operations ledger
  const adminSession = authenticateWithUnifiedAuth('admin@collage.com.gh', 'Collage2026!');
  assert.strictEqual(adminSession.success, true);
  assert.strictEqual(adminSession.user?.fullName, 'Kojo Nathan');

  const adminDash = resolveCanonicalDashboard(adminSession.user!.role);
  assert.strictEqual(adminDash.viewId, 'AdminDashboard');
  assert.ok(adminDash.accessibleTools.includes('Rentals Queue'));
});

test('Tier 4: Progressive Source Code & Zero Em Dash Audit on Auth & Shell modules', () => {
  const authTypesPath = path.resolve('src/types/auth.ts');
  const roleGuardPath = path.resolve('src/components/auth/role-guard.tsx');
  const adaptiveShellPath = path.resolve('src/components/shell/adaptive-shell.tsx');

  // If auth types exist, check for zero em dashes and required exports
  if (fs.existsSync(authTypesPath)) {
    const src = fs.readFileSync(authTypesPath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'auth.ts must contain zero em dashes');
    assert.ok(src.includes('admin'), 'Must declare admin role');
    assert.ok(src.includes('marketer'), 'Must declare marketer role');
    assert.ok(src.includes('hr'), 'Must declare hr role');
  }

  // If role guard exists, check for zero em dashes
  if (fs.existsSync(roleGuardPath)) {
    const src = fs.readFileSync(roleGuardPath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'role-guard.tsx must contain zero em dashes');
    assert.ok(src.includes('RoleGuard') || src.includes('allowedRoles'), 'Must declare RoleGuard');
  }

  // If adaptive shell exists, check for zero em dashes
  if (fs.existsSync(adaptiveShellPath)) {
    const src = fs.readFileSync(adaptiveShellPath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'adaptive-shell.tsx must contain zero em dashes');
  }
});
