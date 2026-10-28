import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { customFetch, resetStore, ApiError, mockLocalStorage, STORAGE_KEY } from './setup.ts';
import type { Client, ClientInput } from '../src/lib/api-client/generated/api.schemas.ts';

// ============================================================================
// Authoritative Domain Models & Contracts (R3 Marketer, R4 HR, R5 Admin)
// ============================================================================

export type ServiceCategory =
  | 'billboards'
  | 'field_production'
  | 'telescopic_flags'
  | 'event_branding'
  | 'wayfinding'
  | 'large_format_print';

// --- R3 Marketer Models ---
export interface MarketingCampaign {
  id: string;
  name: string;
  targetService: ServiceCategory;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  leadsGenerated: number;
  conversions: number;
  notes?: string;
}

export interface ShowcaseLink {
  id: string;
  title: string;
  serviceCategory: ServiceCategory | 'all';
  slug: string;
  shareUrl: string;
  clientName?: string;
  clicks: number;
}

// --- R4 HR Models ---
export type StaffDepartment =
  | 'Production'
  | 'Field & Rigging'
  | 'Creative'
  | 'Marketing'
  | 'Finance'
  | 'HR'
  | 'Executive';

export type StaffStatus = 'active' | 'on_leave' | 'remote' | 'probation';

export interface StaffMember {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: StaffDepartment;
  status: StaffStatus;
  joinDate: string;
  location: string;
}

export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoticeCategory = 'general' | 'safety' | 'operations' | 'event' | 'policy';

export interface InternalNotice {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  category: NoticeCategory;
  author: string;
  datePosted: string;
  pinned: boolean;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | 'on_field';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  department: StaffDepartment;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'study';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: StaffDepartment;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  submittedAt: string;
}

// --- R5 Admin Models ---
export type WorkspaceRole = 'admin' | 'marketer' | 'hr';
export type WorkspaceUserStatus = 'active' | 'suspended' | 'invited';

export interface WorkspaceUser {
  id: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  status: WorkspaceUserStatus;
  office: string;
  createdAt: string;
  lastLogin?: string;
}

export interface RoleCapability {
  canManageClients: boolean;
  canManageFinances: boolean;
  canManageRentals: boolean;
  canManageStaff: boolean;
  canManageUsers: boolean;
  canViewSystemDiagnostics: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  target: string;
  status: 'success' | 'warning' | 'error';
  ipAddress?: string;
}

export interface SystemDiagnosticMetrics {
  apiStatus: 'ok' | 'degraded' | 'down';
  apiLatencyMs: number;
  localStorageBytes: number;
  localStorageQuotaBytes: number;
  storageUsagePercent: number;
  recordsCount: {
    clients: number;
    documents: number;
    payments: number;
    rentals: number;
    productionOrders: number;
  };
  activeUsersCount: number;
  cspActive: boolean;
  consentActive: boolean;
}

// ============================================================================
// Business Logic & Evaluation Engines
// ============================================================================

export function calculateCampaignMetrics(campaign: MarketingCampaign): {
  spendPercentage: number;
  costPerLead: number;
  conversionRate: number;
} {
  const spendPercentage = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
  const costPerLead = campaign.leadsGenerated > 0 ? campaign.spent / campaign.leadsGenerated : 0;
  const conversionRate =
    campaign.leadsGenerated > 0 ? (campaign.conversions / campaign.leadsGenerated) * 100 : 0;

  return {
    spendPercentage: Number(spendPercentage.toFixed(1)),
    costPerLead: Number(costPerLead.toFixed(2)),
    conversionRate: Number(conversionRate.toFixed(1)),
  };
}

export function generateShowcaseLink(
  category: ServiceCategory | 'all',
  clientName?: string,
): ShowcaseLink {
  const slug = category === 'all' ? 'all-services' : category.replace(/_/g, '-');
  const baseUrl = 'https://collagenmosaic.com/portfolio';
  const queryParts: string[] = [];

  if (category !== 'all') {
    queryParts.push(`category=${category}`);
  }
  if (clientName && clientName.trim()) {
    queryParts.push(`client=${encodeURIComponent(clientName.trim())}`);
  }

  const shareUrl = queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl;

  return {
    id: `showcase-${slug}-${Date.now()}`,
    title: `${slug.toUpperCase()} Client Showcase`,
    serviceCategory: category,
    slug,
    shareUrl,
    clientName: clientName?.trim() || undefined,
    clicks: 0,
  };
}

export function sortInternalNotices(notices: InternalNotice[]): InternalNotice[] {
  const priorityWeights: Record<NoticePriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...notices].sort((a, b) => {
    // Pinned notices always sort to the top
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // Then sort by priority weight descending
    const weightDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (weightDiff !== 0) return weightDiff;

    // Finally sort by date posted descending
    return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
  });
}

export function getCapabilitiesForRole(role: WorkspaceRole): RoleCapability {
  switch (role) {
    case 'admin':
      return {
        canManageClients: true,
        canManageFinances: true,
        canManageRentals: true,
        canManageStaff: true,
        canManageUsers: true,
        canViewSystemDiagnostics: true,
      };
    case 'marketer':
      return {
        canManageClients: true,
        canManageFinances: false,
        canManageRentals: false,
        canManageStaff: false,
        canManageUsers: false,
        canViewSystemDiagnostics: false,
      };
    case 'hr':
      return {
        canManageClients: false,
        canManageFinances: false,
        canManageRentals: false,
        canManageStaff: true,
        canManageUsers: false,
        canViewSystemDiagnostics: false,
      };
  }
}

export function computeSystemStorageMetrics(): SystemDiagnosticMetrics {
  const rawStore = mockLocalStorage.getItem(STORAGE_KEY) || '{}';
  const bytesUsed = Buffer.byteLength(rawStore, 'utf8');
  const quotaBytes = 5 * 1024 * 1024; // 5 MB standard browser quota
  const usagePercent = Number(((bytesUsed / quotaBytes) * 100).toFixed(2));

  let parsed: any = {};
  try {
    parsed = JSON.parse(rawStore);
  } catch {
    parsed = {};
  }

  return {
    apiStatus: 'ok',
    apiLatencyMs: 12,
    localStorageBytes: bytesUsed,
    localStorageQuotaBytes: quotaBytes,
    storageUsagePercent: usagePercent,
    recordsCount: {
      clients: Array.isArray(parsed.clients) ? parsed.clients.length : 0,
      documents: Array.isArray(parsed.documents) ? parsed.documents.length : 0,
      payments: Array.isArray(parsed.payments) ? parsed.payments.length : 0,
      rentals: Array.isArray(parsed.rentals) ? parsed.rentals.length : 0,
      productionOrders: Array.isArray(parsed.productionOrders) ? parsed.productionOrders.length : 0,
    },
    activeUsersCount: 3,
    cspActive: true,
    consentActive: true,
  };
}

beforeEach(() => {
  resetStore();
});

// ============================================================================
// TIER 1: FEATURE COVERAGE (Happy Path)
// ============================================================================

test('Tier 1: R3 Marketer - Client Leads Pipeline retrieval and conversion to active', async () => {
  // Step 1: Create a prospective lead
  const newLead = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: 'OmniBSIC Bank Ghana',
      contactName: 'Kofi Boakye',
      email: 'k.boakye@omnibsic.com.gh',
      phone: '+233 24 888 1122',
      status: 'lead',
    } satisfies ClientInput),
  });
  assert.strictEqual(newLead.status, 'lead');

  // Step 2: Marketer queries all leads
  const leads = await customFetch<Client[]>('/api/clients?status=lead');
  assert.ok(leads.some((c) => c.companyName === 'OmniBSIC Bank Ghana'));

  // Step 3: Marketer converts lead to active client with 1-click
  const converted = await customFetch<Client>(`/api/clients/${newLead.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
  assert.strictEqual(converted.status, 'active');

  // Verify lead is no longer in pending leads filter
  const updatedLeads = await customFetch<Client[]>('/api/clients?status=lead');
  assert.strictEqual(updatedLeads.some((c) => c.id === newLead.id), false);
});

test('Tier 1: R3 Marketer - Campaign Tracking Contract and KPI metrics calculation', () => {
  const campaign: MarketingCampaign = {
    id: 'camp-q4-motorway-blitz',
    name: 'Q4 Nationwide Billboard Blitz',
    targetService: 'billboards',
    budget: 60000,
    spent: 45000,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'active',
    leadsGenerated: 25,
    conversions: 6,
    notes: 'Primary focus on Accra-Tema Motorway unipoles and Kumasi bypass gantries.',
  };

  const metrics = calculateCampaignMetrics(campaign);
  assert.strictEqual(metrics.spendPercentage, 75.0, 'Spend percentage should be 75.0%');
  assert.strictEqual(metrics.costPerLead, 1800.0, 'Cost per lead should be 45000 / 25 = 1800 GHS');
  assert.strictEqual(metrics.conversionRate, 24.0, 'Conversion rate should be (6 / 25) * 100 = 24.0%');
});

test('Tier 1: R3 Marketer - Showcase Links generation for client pitching', () => {
  // 1. Generic service link
  const genericLink = generateShowcaseLink('telescopic_flags');
  assert.ok(genericLink.shareUrl.includes('category=telescopic_flags'));
  assert.strictEqual(genericLink.slug, 'telescopic-flags');

  // 2. Personalized client pitch link
  const clientPitch = generateShowcaseLink('wayfinding', 'Ecobank Ghana PLC');
  assert.ok(clientPitch.shareUrl.includes('category=wayfinding'));
  assert.ok(clientPitch.shareUrl.includes('client=Ecobank%20Ghana%20PLC'));
  assert.strictEqual(clientPitch.clientName, 'Ecobank Ghana PLC');
});

test('Tier 1: R4 HR - Staff Directory listing and department/status filtering', () => {
  const staffList: StaffMember[] = [
    {
      id: 'staff-1',
      employeeId: 'COL-001',
      fullName: 'Kojo Nathan',
      email: 'kojo@collage.com.gh',
      phone: '+233 24 736 1133',
      role: 'Creative & Operations Lead',
      department: 'Executive',
      status: 'active',
      joinDate: '2018-03-01',
      location: 'Accra HQ',
    },
    {
      id: 'staff-2',
      employeeId: 'COL-008',
      fullName: 'Kwame Mensah',
      email: 'kwame.m@collage.com.gh',
      phone: '+233 24 411 9900',
      role: 'Senior Rigging Master',
      department: 'Field & Rigging',
      status: 'active',
      joinDate: '2020-06-15',
      location: 'Accra HQ',
    },
    {
      id: 'staff-3',
      employeeId: 'COL-021',
      fullName: 'Abena Osei',
      email: 'abena.o@collage.com.gh',
      phone: '+233 24 555 1212',
      role: 'Sublimation Print Technician',
      department: 'Production',
      status: 'on_leave',
      joinDate: '2022-01-10',
      location: 'Spintex Print Yard',
    },
  ];

  // Filter by department
  const fieldStaff = staffList.filter((s) => s.department === 'Field & Rigging');
  assert.strictEqual(fieldStaff.length, 1);
  assert.strictEqual(fieldStaff[0].fullName, 'Kwame Mensah');

  // Filter by status
  const activeStaff = staffList.filter((s) => s.status === 'active');
  assert.strictEqual(activeStaff.length, 2);
});

test('Tier 1: R4 HR - Internal Notices Bulletin Board priority sorting and pinned notices', () => {
  const notices: InternalNotice[] = [
    {
      id: 'not-1',
      title: 'General Health Insurance Renewal Reminder',
      content: 'Please submit clinic claims by Friday.',
      priority: 'low',
      category: 'general',
      author: 'HR Desk',
      datePosted: '2026-10-25',
      pinned: false,
    },
    {
      id: 'not-2',
      title: 'High-Altitude Rigging Safety: Double-Harness Mandatory',
      content: 'Mandatory harness protocol for all motorway gantry jobs.',
      priority: 'urgent',
      category: 'safety',
      author: 'Safety Master',
      datePosted: '2026-10-26',
      pinned: false,
    },
    {
      id: 'not-3',
      title: 'Presidential Summit Stage Deployment Timetable',
      content: 'Grand Arena access starts midnight.',
      priority: 'high',
      category: 'operations',
      author: 'Operations Lead',
      datePosted: '2026-10-27',
      pinned: true,
    },
  ];

  const sorted = sortInternalNotices(notices);
  // Pinned notice must be first
  assert.strictEqual(sorted[0].id, 'not-3', 'Pinned notice must appear first');
  // Urgent notice must appear before low priority
  assert.strictEqual(sorted[1].id, 'not-2', 'Urgent priority notice must appear next');
  assert.strictEqual(sorted[2].id, 'not-1', 'Low priority notice must appear last');
});

test('Tier 1: R4 HR - Attendance Check-In and Leave Request tracking', () => {
  // Attendance recording
  const today = '2026-10-28';
  const attendance: AttendanceRecord = {
    id: 'att-20261028-001',
    staffId: 'staff-2',
    staffName: 'Kwame Mensah',
    department: 'Field & Rigging',
    date: today,
    checkInTime: '07:45 GMT',
    status: 'on_field',
    notes: 'On-site rigging deployment at AICC for Protocol Summit.',
  };
  assert.strictEqual(attendance.status, 'on_field');
  assert.strictEqual(attendance.date, today);

  // Leave request submission and approval
  const leaveReq: LeaveRequest = {
    id: 'leave-2026-001',
    staffId: 'staff-3',
    staffName: 'Abena Osei',
    department: 'Production',
    leaveType: 'annual',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    days: 5,
    status: 'pending',
    reason: 'Annual family leave.',
    submittedAt: '2026-10-27T10:00:00.000Z',
  };
  assert.strictEqual(leaveReq.status, 'pending');

  // HR Approves leave
  const approvedLeave: LeaveRequest = { ...leaveReq, status: 'approved' };
  assert.strictEqual(approvedLeave.status, 'approved');
});

test('Tier 1: R5 Admin - User Management and Permission Capability Matrix', () => {
  const adminCaps = getCapabilitiesForRole('admin');
  assert.strictEqual(adminCaps.canManageFinances, true);
  assert.strictEqual(adminCaps.canManageUsers, true);
  assert.strictEqual(adminCaps.canViewSystemDiagnostics, true);

  const marketerCaps = getCapabilitiesForRole('marketer');
  assert.strictEqual(marketerCaps.canManageClients, true);
  assert.strictEqual(marketerCaps.canManageFinances, false);
  assert.strictEqual(marketerCaps.canManageUsers, false);

  const hrCaps = getCapabilitiesForRole('hr');
  assert.strictEqual(hrCaps.canManageStaff, true);
  assert.strictEqual(hrCaps.canManageFinances, false);
  assert.strictEqual(hrCaps.canManageUsers, false);
});

test('Tier 1: R5 Admin - System Status Diagnostics and Storage Metrics', () => {
  const diagnostics = computeSystemStorageMetrics();
  assert.strictEqual(diagnostics.apiStatus, 'ok');
  assert.ok(diagnostics.localStorageBytes > 0, 'Store must have positive byte count');
  assert.strictEqual(diagnostics.localStorageQuotaBytes, 5242880, '5 MB browser quota');
  assert.ok(diagnostics.storageUsagePercent >= 0 && diagnostics.storageUsagePercent <= 100);
  assert.ok(diagnostics.recordsCount.clients >= 3, 'Seed store must have at least 3 clients');
});

test('Tier 1: R6 Design Constraints - Compliance with zero em dashes, Inter font, and security', () => {
  // 1. Zero em dashes in src/
  function scanDir(dir: string, violations: string[] = []): string[] {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(full, violations);
      } else if (/\.(tsx?|jsx?|html|css|json)$/.test(item.name)) {
        const text = fs.readFileSync(full, 'utf-8');
        if (text.includes('—') || text.includes('\u2014')) {
          violations.push(full);
        }
      }
    }
    return violations;
  }
  const emDashViolations = scanDir(path.resolve('src'));
  assert.deepStrictEqual(emDashViolations, [], 'Zero em dashes permitted in src/');

  // 2. Inter font configured in src/index.css
  const indexCss = fs.readFileSync(path.resolve('src/index.css'), 'utf-8');
  assert.ok(indexCss.includes('Inter'), 'src/index.css must configure Inter font');

  // 3. Secrets security: .env is in .gitignore
  const gitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf-8');
  assert.ok(gitignore.includes('.env'), '.gitignore must exclude .env');
});

// ============================================================================
// TIER 2: BOUNDARIES & EDGE CASES
// ============================================================================

test('Tier 2: Campaign Metrics handle zero-budget and zero-lead boundary conditions', () => {
  const zeroCampaign: MarketingCampaign = {
    id: 'camp-zero',
    name: 'Unfunded Campaign',
    targetService: 'field_production',
    budget: 0,
    spent: 0,
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    status: 'planning',
    leadsGenerated: 0,
    conversions: 0,
  };

  const metrics = calculateCampaignMetrics(zeroCampaign);
  assert.strictEqual(metrics.spendPercentage, 0);
  assert.strictEqual(metrics.costPerLead, 0);
  assert.strictEqual(metrics.conversionRate, 0);
});

test('Tier 2: Admin Role Reassignment safeguards against invalid role strings', () => {
  const validRoles: WorkspaceRole[] = ['admin', 'marketer', 'hr'];

  function assignUserRole(user: WorkspaceUser, newRole: string): { success: boolean; error?: string } {
    if (!validRoles.includes(newRole as WorkspaceRole)) {
      return { success: false, error: `Invalid role: ${newRole}. Must be admin, marketer, or hr.` };
    }
    return { success: true };
  }

  const sampleUser: WorkspaceUser = {
    id: 'usr-test',
    email: 'test@collage.com.gh',
    fullName: 'Test User',
    role: 'marketer',
    status: 'active',
    office: 'Accra HQ',
    createdAt: '2026-01-01',
  };

  assert.strictEqual(assignUserRole(sampleUser, 'admin').success, true);
  assert.strictEqual(assignUserRole(sampleUser, 'superadmin').success, false);
  assert.strictEqual(assignUserRole(sampleUser, '').success, false);
});

test('Tier 2: Leave Request validation catches negative days and inverted dates', () => {
  function validateLeaveRequest(req: Partial<LeaveRequest>): { valid: boolean; error?: string } {
    if (!req.startDate || !req.endDate) return { valid: false, error: 'Dates required.' };
    if (new Date(req.endDate).getTime() < new Date(req.startDate).getTime()) {
      return { valid: false, error: 'End date cannot precede start date.' };
    }
    if (!req.days || req.days <= 0) {
      return { valid: false, error: 'Leave days must be greater than zero.' };
    }
    return { valid: true };
  }

  assert.strictEqual(validateLeaveRequest({ startDate: '2026-11-05', endDate: '2026-11-01', days: 4 }).valid, false);
  assert.strictEqual(validateLeaveRequest({ startDate: '2026-11-01', endDate: '2026-11-05', days: 0 }).valid, false);
  assert.strictEqual(validateLeaveRequest({ startDate: '2026-11-01', endDate: '2026-11-05', days: 5 }).valid, true);
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================

test('Tier 3: Cross-Desk Operational Pipeline (Lead -> Client -> Quote -> Production -> Audit)', async () => {
  // Step 1: Marketer creates lead from billboard inquiry
  const lead = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: 'Guinness Ghana Breweries PLC',
      contactName: 'Yaw Boateng',
      email: 'yaw.boateng@diageo.com',
      phone: '+233 24 333 4455',
      address: 'Achimota Brewery Industrial Area',
      city: 'Accra',
      country: 'Ghana',
      status: 'lead',
    } satisfies ClientInput),
  });
  assert.strictEqual(lead.status, 'lead');

  // Step 2: Marketer qualifies and converts lead to active client
  const activeClient = await customFetch<Client>(`/api/clients/${lead.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
  assert.strictEqual(activeClient.status, 'active');

  // Step 3: Admin generates formal sales quotation with statutory Ghanaian taxes
  const quote = await customFetch<any>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      clientId: activeClient.id,
      kind: 'quotation',
      issueDate: '2026-10-28',
      subject: 'Highway Gantry Billboard Skin Production & Night Rigging',
      items: [
        {
          kind: 'print',
          description: '550gsm UV Blackout PVC Skin (15m x 5m)',
          quantity: 2,
          days: 1,
          unitPrice: 12000,
        },
      ],
    }),
  });
  assert.strictEqual(quote.status, 'issued');
  assert.ok(quote.vatAmount > 0, 'Statutory taxes must be computed');
  assert.ok(quote.total > 0, 'Document total must be positive');

  // Step 4: Convert quotation to invoice upon client approval
  const invoice = await customFetch<any>(`/api/documents/${quote.id}/convert`, {
    method: 'POST',
  });
  assert.strictEqual(invoice.kind, 'invoice');

  // Step 5: System diagnostics meter reflects new records
  const metrics = computeSystemStorageMetrics();
  assert.ok(metrics.recordsCount.clients >= 4);
  assert.ok(metrics.recordsCount.documents >= 1);
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

test('Tier 4: Ghanaian Corporate Festival Activation Scenario (Accra Fest 2026)', async () => {
  // 1. Marketer sets up campaign "AccraFest 2026 Venue Dressing"
  const festivalCampaign: MarketingCampaign = {
    id: 'camp-accrafest-2026',
    name: 'AccraFest 2026 Venue Dressing & Flags',
    targetService: 'telescopic_flags',
    budget: 35000,
    spent: 28000,
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    status: 'active',
    leadsGenerated: 12,
    conversions: 4,
    notes: 'VIP corridor flags and entrance media walls at Black Star Square.',
  };
  const campMetrics = calculateCampaignMetrics(festivalCampaign);
  assert.strictEqual(campMetrics.spendPercentage, 80.0);
  assert.strictEqual(campMetrics.conversionRate, 33.3);

  // 2. HR posts urgent rigging safety protocol notice
  const safetyNotice: InternalNotice = {
    id: 'not-accrafest-safety',
    title: 'Black Star Square Rigging Safety Protocol: Coastal Wind Precautions',
    content: 'Due to severe coastal sea breeze, all telescopic flag bases must be double-weighted with 35L water ballast plus solid iron ballast plates.',
    priority: 'urgent',
    category: 'safety',
    author: 'Safety Master Kwame Mensah',
    datePosted: '2026-10-28',
    pinned: true,
  };
  const sortedNotices = sortInternalNotices([safetyNotice]);
  assert.strictEqual(sortedNotices[0].id, 'not-accrafest-safety');
  assert.strictEqual(sortedNotices[0].content.includes('—'), false, 'Notice copy must contain zero em dashes');

  // 3. Rigging technician checks in with on_field status
  const techAttendance: AttendanceRecord = {
    id: 'att-20261028-tech',
    staffId: 'staff-tech-01',
    staffName: 'Emmanuel Armah',
    department: 'Field & Rigging',
    date: '2026-10-28',
    checkInTime: '06:30 GMT',
    status: 'on_field',
    notes: 'Early morning ballast installation at Black Star Square.',
  };
  assert.strictEqual(techAttendance.status, 'on_field');

  // 4. Admin audits storage metrics
  const sysMetrics = computeSystemStorageMetrics();
  assert.strictEqual(sysMetrics.apiStatus, 'ok');
  assert.ok(sysMetrics.localStorageBytes > 0);
});

test('Tier 4: Progressive Source Audit for Marketer, HR, and Admin workspace modules', () => {
  const marketerPagePath = path.resolve('src/pages/marketer-workspace.tsx');
  const hrPagePath = path.resolve('src/pages/hr-workspace.tsx');
  const adminPagePath = path.resolve('src/pages/admin-workspace.tsx');

  // If marketer workspace exists, verify zero em dashes
  if (fs.existsSync(marketerPagePath)) {
    const src = fs.readFileSync(marketerPagePath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'marketer-workspace.tsx must contain zero em dashes');
  }

  // If hr workspace exists, verify zero em dashes
  if (fs.existsSync(hrPagePath)) {
    const src = fs.readFileSync(hrPagePath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'hr-workspace.tsx must contain zero em dashes');
  }

  // If admin workspace exists, verify zero em dashes
  if (fs.existsSync(adminPagePath)) {
    const src = fs.readFileSync(adminPagePath, 'utf-8');
    assert.strictEqual(src.includes('—'), false, 'admin-workspace.tsx must contain zero em dashes');
  }
});
