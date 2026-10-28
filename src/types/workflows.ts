// ============================================================================
// Authoritative Domain Models and Contracts (R3 Marketer, R4 HR, R5 Admin)
// ============================================================================

export type ServiceCategory =
  | 'billboards'
  | 'field_production'
  | 'telescopic_flags'
  | 'event_branding'
  | 'wayfinding'
  | 'large_format_print';

// ----------------------------------------------------------------------------
// R3 Marketer Models
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// R4 HR Models
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// R5 Admin Models
// ----------------------------------------------------------------------------
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
    campaigns?: number;
    staff?: number;
    notices?: number;
    attendance?: number;
    leaveRequests?: number;
    users?: number;
  };
  activeUsersCount: number;
  cspActive: boolean;
  consentActive: boolean;
}

// ----------------------------------------------------------------------------
// Evaluation and Calculation Engines
// ----------------------------------------------------------------------------

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
  const STORAGE_KEY = 'collat_erp_store_v3';
  let rawStore = '{}';
  if (typeof window !== 'undefined' && window.localStorage) {
    rawStore = window.localStorage.getItem(STORAGE_KEY) || '{}';
  }
  let bytesUsed = 0;
  try {
    bytesUsed = new Blob([rawStore]).size;
  } catch {
    bytesUsed = rawStore.length;
  }
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
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns.length : 0,
      staff: Array.isArray(parsed.staff) ? parsed.staff.length : 0,
      notices: Array.isArray(parsed.notices) ? parsed.notices.length : 0,
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance.length : 0,
      leaveRequests: Array.isArray(parsed.leaveRequests) ? parsed.leaveRequests.length : 0,
      users: Array.isArray(parsed.users) ? parsed.users.length : 0,
    },
    activeUsersCount: 3,
    cspActive: true,
    consentActive: true,
  };
}
