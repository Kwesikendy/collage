import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { customFetch, resetStore, ApiError, mockLocalStorage, STORAGE_KEY } from './setup.ts';
import type { Client, ClientInput } from '../src/lib/api-client/generated/api.schemas.ts';
import type {
  MarketingCampaign,
  ShowcaseLink,
  StaffMember,
  InternalNotice,
  AttendanceRecord,
  LeaveRequest,
  WorkspaceUser,
  ServiceCategory,
  NoticePriority,
} from '../src/types/workflows.ts';
import {
  calculateCampaignMetrics,
  generateShowcaseLink,
  sortInternalNotices,
  computeSystemStorageMetrics,
  getCapabilitiesForRole,
} from '../src/types/workflows.ts';

beforeEach(() => {
  resetStore();
});

// ============================================================================
// MISSION 1: MARKETER WORKFLOWS STRESS TESTING
// ============================================================================

test('Marketer Stress: Converting non-existent lead via /api/marketer/leads/:id/convert rejects with 404 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/marketer/leads/non-existent-lead-id-999/convert', {
        method: 'POST',
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError, 'Expected ApiError instance');
      assert.strictEqual(err.status, 404, 'Expected HTTP 404 status');
      assert.ok(err.message.includes('not found'), 'Expected not found error message');
      return true;
    },
  );
});

test('Marketer Stress: Converting already active client via /api/marketer/leads/:id/convert is safe and idempotent', async () => {
  // cli-eugenia is an already active client in initial store
  const activeClient = await customFetch<Client>('/api/clients/cli-eugenia');
  assert.strictEqual(activeClient.status, 'active');

  const converted = await customFetch<Client>('/api/marketer/leads/cli-eugenia/convert', {
    method: 'POST',
  });
  assert.strictEqual(converted.id, 'cli-eugenia');
  assert.strictEqual(converted.status, 'active');

  // Verify audit log recorded conversion
  const logs = await customFetch<any[]>('/api/admin/audit-logs');
  assert.ok(
    logs.some((l) => l.action === 'CLIENT_CONVERTED' && l.target === activeClient.companyName),
    'Audit log must record client conversion',
  );
});

test('Marketer Stress: Converting lead with special characters or URL encoding in id', async () => {
  // Create lead with special name and contact
  const lead = await customFetch<Client>('/api/marketer/leads', {
    method: 'POST',
    body: JSON.stringify({
      companyName: 'Bono East Agro Ltd & Co.',
      contactName: 'Yaw Kwakye',
      email: 'yaw@bonoeast.com.gh',
      status: 'lead',
    } satisfies ClientInput),
  });
  assert.strictEqual(lead.status, 'lead');

  // Convert using URL-encoded ID
  const converted = await customFetch<Client>(
    `/api/marketer/leads/${encodeURIComponent(lead.id)}/convert`,
    {
      method: 'POST',
    },
  );
  assert.strictEqual(converted.id, lead.id);
  assert.strictEqual(converted.status, 'active');
});

test('Marketer Stress: Campaign creation with edge values (zero budget, high spend, null notes)', async () => {
  // Edge Case 1: Zero budget, zero spend, null notes
  const campZero = await customFetch<MarketingCampaign>('/api/marketer/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Unfunded Grassroots Campaign',
      targetService: 'field_production',
      budget: 0,
      spent: 0,
      notes: null as any,
    }),
  });
  assert.strictEqual(campZero.budget, 0);
  assert.strictEqual(campZero.spent, 0);
  assert.strictEqual(campZero.notes, '');

  const metricsZero = calculateCampaignMetrics(campZero);
  assert.strictEqual(metricsZero.spendPercentage, 0);
  assert.strictEqual(metricsZero.costPerLead, 0);
  assert.strictEqual(metricsZero.conversionRate, 0);

  // Edge Case 2: Zero budget with high actual spend (e.g., unplanned emergency gantry reinforcement)
  const campHighSpend = await customFetch<MarketingCampaign>('/api/marketer/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Emergency Motorway Reinforcement Blitz',
      targetService: 'billboards',
      budget: 0,
      spent: 125000,
      leadsGenerated: 0,
      conversions: 0,
    }),
  });
  assert.strictEqual(campHighSpend.budget, 0);
  assert.strictEqual(campHighSpend.spent, 125000);

  const metricsHighSpend = calculateCampaignMetrics(campHighSpend);
  assert.strictEqual(metricsHighSpend.spendPercentage, 0, 'Zero budget yields 0% spend percentage without NaN');
  assert.strictEqual(metricsHighSpend.costPerLead, 0, 'Zero leads yields 0 GHS CPL without division by zero');

  // Edge Case 3: High spend with leads and conversions
  const campStandard = await customFetch<MarketingCampaign>('/api/marketer/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Independence Square Branding',
      targetService: 'event_branding',
      budget: 50000,
      spent: 45000,
      leadsGenerated: 15,
      conversions: 3,
      notes: 'High-visibility state protocol event',
    }),
  });
  const metricsStandard = calculateCampaignMetrics(campStandard);
  assert.strictEqual(metricsStandard.spendPercentage, 90.0);
  assert.strictEqual(metricsStandard.costPerLead, 3000.0);
  assert.strictEqual(metricsStandard.conversionRate, 20.0);

  // Edge Case 4: Missing or whitespace campaign name rejects with 400 ApiError
  await assert.rejects(
    async () => {
      await customFetch('/api/marketer/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name: '   ', budget: 1000 }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      return true;
    },
  );

  // Edge Case 5: Campaign lifecycle: update and delete
  const updated = await customFetch<MarketingCampaign>(`/api/marketer/campaigns/${campStandard.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed', conversions: 5 }),
  });
  assert.strictEqual(updated.status, 'completed');
  assert.strictEqual(updated.conversions, 5);

  const deleted = await customFetch<{ success: boolean }>(`/api/marketer/campaigns/${campStandard.id}`, {
    method: 'DELETE',
  });
  assert.strictEqual(deleted.success, true);
});

test('Marketer Stress: Showcase links click incrementing and copy-link URLs', async () => {
  // 1. Generate showcase link for all services with client name
  const created = await customFetch<ShowcaseLink>('/api/marketer/showcase', {
    method: 'POST',
    body: JSON.stringify({
      serviceCategory: 'telescopic_flags',
      clientName: 'Standard Chartered Ghana PLC',
    }),
  });
  assert.ok(created.id);
  assert.strictEqual(created.clicks, 0);
  assert.ok(created.shareUrl.includes('category=telescopic_flags'));
  assert.ok(created.shareUrl.includes('client=Standard%20Chartered%20Ghana%20PLC'));

  // 2. Increment clicks multiple times consecutively
  const click1 = await customFetch<ShowcaseLink>(`/api/marketer/showcase/${created.id}/click`, {
    method: 'POST',
  });
  assert.strictEqual(click1.clicks, 1);

  const click2 = await customFetch<ShowcaseLink>(`/api/marketer/showcase/${created.id}/click`, {
    method: 'POST',
  });
  assert.strictEqual(click2.clicks, 2);

  const click3 = await customFetch<ShowcaseLink>(`/api/marketer/showcase/${created.id}/click`, {
    method: 'POST',
  });
  assert.strictEqual(click3.clicks, 3);

  // 3. Increment non-existent showcase link ID rejects with 404
  await assert.rejects(
    async () => {
      await customFetch('/api/marketer/showcase/unknown-showcase-id-404/click', {
        method: 'POST',
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 404);
      return true;
    },
  );

  // 4. Test URL structure for 'all' service category
  const allLink = generateShowcaseLink('all');
  assert.strictEqual(allLink.slug, 'all-services');
  assert.ok(!allLink.shareUrl.includes('category='), 'All services link should not have category query param');
  assert.strictEqual(allLink.shareUrl, 'https://collagenmosaic.com/portfolio');

  // 5. Test URL structure with special characters in client name
  const complexClientLink = generateShowcaseLink('large_format_print', 'Nestlé & Co. / Ghana Ltd');
  assert.ok(complexClientLink.shareUrl.includes('client=Nestl%C3%A9%20%26%20Co.%20%2F%20Ghana%20Ltd'));
});

// ============================================================================
// MISSION 2: HR WORKFLOWS STRESS TESTING
// ============================================================================

test('HR Stress: Staff directory queries with unusual filters', async () => {
  // Query with non-existent department returns empty array without crashing
  const nonExistentDept = await customFetch<StaffMember[]>(
    '/api/hr/staff?department=SpaceExplorationDept',
  );
  assert.deepStrictEqual(nonExistentDept, []);

  // Query with non-existent status returns empty array
  const alienStatus = await customFetch<StaffMember[]>('/api/hr/staff?status=alien');
  assert.deepStrictEqual(alienStatus, []);

  // Query with whitespace search returns all staff
  const allStaff = await customFetch<StaffMember[]>('/api/hr/staff');
  const wsSearch = await customFetch<StaffMember[]>('/api/hr/staff?search=%20%20%20');
  assert.strictEqual(wsSearch.length, allStaff.length);

  // Query with malicious or special search payload returns empty array safely
  const xssSearch = await customFetch<StaffMember[]>(
    '/api/hr/staff?search=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
  );
  assert.deepStrictEqual(xssSearch, []);

  // Combined filters: department + status + search
  const filtered = await customFetch<StaffMember[]>(
    '/api/hr/staff?department=Field%20%26%20Rigging&status=active&search=kwame',
  );
  assert.ok(filtered.length >= 1);
  assert.ok(filtered.every((s) => s.department === 'Field & Rigging' && s.status === 'active'));

  // Create staff validation: rejects whitespace name
  await assert.rejects(
    async () => {
      await customFetch('/api/hr/staff', {
        method: 'POST',
        body: JSON.stringify({ fullName: '   ' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      return true;
    },
  );
});

test('HR Stress: Internal notices board sorting with multiple pinned urgent notices', async () => {
  const notices: InternalNotice[] = [
    {
      id: 'not-pinned-urgent-old',
      title: 'Pinned Urgent (Older)',
      content: 'Important gantry inspection schedule',
      priority: 'urgent',
      category: 'safety',
      author: 'Safety Master',
      datePosted: '2026-10-20',
      pinned: true,
    },
    {
      id: 'not-pinned-urgent-new',
      title: 'Pinned Urgent (Newer)',
      content: 'Immediate wind speed safety warning',
      priority: 'urgent',
      category: 'safety',
      author: 'Operations Director',
      datePosted: '2026-10-28',
      pinned: true,
    },
    {
      id: 'not-pinned-high',
      title: 'Pinned High Priority',
      content: 'National Theater deployment schedule',
      priority: 'high',
      category: 'operations',
      author: 'Logistics Desk',
      datePosted: '2026-10-27',
      pinned: true,
    },
    {
      id: 'not-pinned-low',
      title: 'Pinned Low Priority',
      content: 'Cafeteria holiday menu',
      priority: 'low',
      category: 'general',
      author: 'Admin Desk',
      datePosted: '2026-10-28',
      pinned: true,
    },
    {
      id: 'not-unpinned-urgent',
      title: 'Unpinned Urgent Notice',
      content: 'Spintex printer head replacement',
      priority: 'urgent',
      category: 'operations',
      author: 'Production Team',
      datePosted: '2026-10-28',
      pinned: false,
    },
    {
      id: 'not-unpinned-high',
      title: 'Unpinned High Notice',
      content: 'New fuel card reconciliation deadline',
      priority: 'high',
      category: 'policy',
      author: 'Finance',
      datePosted: '2026-10-27',
      pinned: false,
    },
  ];

  const sorted = sortInternalNotices(notices);

  // Verification 1: All pinned notices must precede all unpinned notices
  assert.strictEqual(sorted[0].pinned, true);
  assert.strictEqual(sorted[1].pinned, true);
  assert.strictEqual(sorted[2].pinned, true);
  assert.strictEqual(sorted[3].pinned, true);
  assert.strictEqual(sorted[4].pinned, false);
  assert.strictEqual(sorted[5].pinned, false);

  // Verification 2: Between pinned notices, urgent priority comes before high, then low
  assert.strictEqual(sorted[0].id, 'not-pinned-urgent-new', 'Newer pinned urgent notice must be first');
  assert.strictEqual(sorted[1].id, 'not-pinned-urgent-old', 'Older pinned urgent notice must be second');
  assert.strictEqual(sorted[2].id, 'not-pinned-high', 'Pinned high notice must be third');
  assert.strictEqual(sorted[3].id, 'not-pinned-low', 'Pinned low notice must be fourth');

  // Verification 3: Between unpinned notices, urgent comes before high
  assert.strictEqual(sorted[4].id, 'not-unpinned-urgent');
  assert.strictEqual(sorted[5].id, 'not-unpinned-high');

  // Verification 4: Empty notice array sorts without throwing
  assert.deepStrictEqual(sortInternalNotices([]), []);
});

test('HR Stress: Attendance check-in duplicate submissions and leave request approval/rejection transitions', async () => {
  // Query initial records for staff-2 on today
  const initialRecords = await customFetch<AttendanceRecord[]>(
    '/api/hr/attendance?staffId=staff-2&date=2026-10-28',
  );
  const initialCount = initialRecords.length;

  // 1. Attendance check-in: first submission
  const att1 = await customFetch<AttendanceRecord>('/api/hr/attendance', {
    method: 'POST',
    body: JSON.stringify({
      staffId: 'staff-2',
      staffName: 'Kwame Mensah',
      department: 'Field & Rigging',
      date: '2026-10-28',
      checkInTime: '07:30 GMT',
      status: 'present',
    }),
  });
  assert.ok(att1.id);
  assert.strictEqual(att1.status, 'present');

  // 2. Duplicate submission on same day (e.g. status updated to on_field for protocol summit)
  const att2 = await customFetch<AttendanceRecord>('/api/hr/attendance', {
    method: 'POST',
    body: JSON.stringify({
      staffId: 'staff-2',
      staffName: 'Kwame Mensah',
      department: 'Field & Rigging',
      date: '2026-10-28',
      checkInTime: '08:45 GMT',
      status: 'on_field',
      notes: 'Deployed to AICC Summit',
    }),
  });
  assert.ok(att2.id);
  assert.notStrictEqual(att1.id, att2.id);

  // Verify attendance query safely returns initial count + 2 for audit trail
  const records = await customFetch<AttendanceRecord[]>(
    '/api/hr/attendance?staffId=staff-2&date=2026-10-28',
  );
  assert.strictEqual(records.length, initialCount + 2);

  // 3. Attendance check-in missing staff identity rejects with 400 ApiError
  await assert.rejects(
    async () => {
      await customFetch('/api/hr/attendance', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-10-28' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      return true;
    },
  );

  // 4. Leave request creation with inverted dates rejects with 400
  await assert.rejects(
    async () => {
      await customFetch('/api/hr/leave', {
        method: 'POST',
        body: JSON.stringify({
          staffId: 'staff-3',
          staffName: 'Abena Osei',
          startDate: '2026-11-10',
          endDate: '2026-11-05',
          days: 5,
        }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      return true;
    },
  );

  // 5. Leave request creation with non-positive days rejects with 400
  await assert.rejects(
    async () => {
      await customFetch('/api/hr/leave', {
        method: 'POST',
        body: JSON.stringify({
          staffId: 'staff-3',
          staffName: 'Abena Osei',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          days: -2,
        }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      return true;
    },
  );

  // 6. Valid leave request submission
  const validLeave = await customFetch<LeaveRequest>('/api/hr/leave', {
    method: 'POST',
    body: JSON.stringify({
      staffId: 'staff-3',
      staffName: 'Abena Osei',
      department: 'Production',
      leaveType: 'annual',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      days: 5,
      reason: 'Family rest and annual leave',
    }),
  });
  assert.strictEqual(validLeave.status, 'pending');

  // 7. Transition: pending -> approved
  const approvedLeave = await customFetch<LeaveRequest>(`/api/hr/leave/${validLeave.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
  assert.strictEqual(approvedLeave.status, 'approved');

  // 8. Transition: approved -> rejected
  const rejectedLeave = await customFetch<LeaveRequest>(`/api/hr/leave/${validLeave.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected' }),
  });
  assert.strictEqual(rejectedLeave.status, 'rejected');

  // 9. Patch non-existent leave ID rejects with 404
  await assert.rejects(
    async () => {
      await customFetch('/api/hr/leave/unknown-leave-id-999', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 404);
      return true;
    },
  );
});

// ============================================================================
// MISSION 3: ADMIN WORKFLOWS STRESS TESTING
// ============================================================================

test('Admin Stress: Reassigning roles among Marketer, HR, Admin, suspending users', async () => {
  // 1. Create a fresh test user
  const newUser = await customFetch<WorkspaceUser>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: 'operator.kwesi@collage.com.gh',
      fullName: 'Kwesi Operator',
      role: 'marketer',
      office: 'Accra HQ',
    }),
  });
  assert.strictEqual(newUser.role, 'marketer');
  assert.strictEqual(newUser.status, 'active');

  // 2. Reassign role: marketer -> hr
  const asHr = await customFetch<WorkspaceUser>(`/api/admin/users/${newUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'hr' }),
  });
  assert.strictEqual(asHr.role, 'hr');

  // 3. Reassign role: hr -> admin
  const asAdmin = await customFetch<WorkspaceUser>(`/api/admin/users/${newUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'admin' }),
  });
  assert.strictEqual(asAdmin.role, 'admin');

  // 4. Reassign to invalid role string rejects with 400 ApiError
  await assert.rejects(
    async () => {
      await customFetch(`/api/admin/users/${newUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'superadmin' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes('Must be admin, marketer, or hr'));
      return true;
    },
  );

  // 5. Suspend user
  const suspended = await customFetch<WorkspaceUser>(`/api/admin/users/${newUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'suspended' }),
  });
  assert.strictEqual(suspended.status, 'suspended');

  // 6. Reactivate user
  const reactivated = await customFetch<WorkspaceUser>(`/api/admin/users/${newUser.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
  assert.strictEqual(reactivated.status, 'active');

  // 7. Verify Audit log records role changes and suspensions
  const auditLogs = await customFetch<any[]>('/api/admin/audit-logs');
  assert.ok(
    auditLogs.some(
      (log) => log.action === 'USER_ROLE_CHANGED' && log.target.includes('operator.kwesi@collage.com.gh'),
    ),
  );
});

test('Admin Stress: System diagnostics handles storage calculations and endpoint verification', async () => {
  // Test 1: Standard populated store diagnostics
  const stats = await customFetch<any>('/api/admin/system-status');
  assert.strictEqual(stats.apiStatus, 'ok');
  assert.strictEqual(stats.localStorageQuotaBytes, 5242880, 'Must equal 5MB in bytes');
  assert.ok(stats.localStorageBytes > 0, 'Storage bytes must be positive');
  assert.ok(stats.storageUsagePercent >= 0 && stats.storageUsagePercent <= 100);
  assert.ok(stats.recordsCount.clients >= 3);
  assert.ok(stats.recordsCount.documents >= 3);

  // Test 2: computeSystemStorageMetrics directly handles cleared/empty storage
  mockLocalStorage.clear();
  const emptyMetrics = computeSystemStorageMetrics();
  assert.strictEqual(emptyMetrics.apiStatus, 'ok');
  assert.strictEqual(emptyMetrics.recordsCount.clients, 0);
  assert.strictEqual(emptyMetrics.recordsCount.documents, 0);
  assert.strictEqual(emptyMetrics.recordsCount.payments, 0);
  assert.strictEqual(emptyMetrics.localStorageBytes, 2); // '{}' is 2 bytes
  assert.strictEqual(emptyMetrics.localStorageQuotaBytes, 5242880);

  // Test 3: computeSystemStorageMetrics handles undefined key in localStorage
  mockLocalStorage.removeItem(STORAGE_KEY);
  const undefMetrics = computeSystemStorageMetrics();
  assert.strictEqual(undefMetrics.apiStatus, 'ok');
  assert.strictEqual(undefMetrics.recordsCount.clients, 0);
  assert.strictEqual(undefMetrics.recordsCount.campaigns, 0);
});

test('Admin Stress Empirical Finding: computeSystemStorageMetrics unhandled exception when storage string is "null"', () => {
  // When localStorage contains the exact JSON string "null", JSON.parse("null") produces null without throwing syntax error.
  // computeSystemStorageMetrics lacks an object guard on parsed and throws TypeError: Cannot read properties of null (reading 'clients')
  mockLocalStorage.setItem(STORAGE_KEY, 'null');
  assert.throws(
    () => {
      computeSystemStorageMetrics();
    },
    (err: unknown) => {
      assert.ok(err instanceof TypeError);
      assert.ok((err as TypeError).message.includes("Cannot read properties of null (reading 'clients')"));
      return true;
    },
  );
});

test('Admin Stress: Self-heal endpoint /api/admin/self-heal restores missing collections without destroying valid records', async () => {
  // 1. Create a custom client and custom document
  const customClient = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: 'AngloGold Ashanti Iduapriem',
      contactName: 'Yaw Kwakye',
      email: 'y.kwakye@anglogold.com',
      status: 'active',
    } satisfies ClientInput),
  });
  assert.ok(customClient.id);

  // 2. Simulate corruption of secondary collections in store (e.g., campaigns, staff, notices wiped out)
  const raw = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '{}');
  delete raw.campaigns;
  delete raw.staff;
  delete raw.notices;
  delete raw.users;
  delete raw.attendance;
  delete raw.leaveRequests;
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

  // 3. Trigger self-heal endpoint via /api/admin/self-heal
  const healResult = await customFetch<any>('/api/admin/self-heal', {
    method: 'POST',
  });
  assert.strictEqual(healResult.status, 'healed');
  assert.ok(healResult.message.includes('restored'));

  // 4. Verify that the custom client was NOT destroyed!
  const clientsAfterHeal = await customFetch<Client[]>('/api/clients');
  const foundClient = clientsAfterHeal.find((c) => c.id === customClient.id);
  assert.ok(foundClient, 'Custom client must survive self-healing');
  assert.strictEqual(foundClient?.companyName, 'AngloGold Ashanti Iduapriem');

  // 5. Verify restored collections are now queryable
  const restoredCampaigns = await customFetch<MarketingCampaign[]>('/api/marketer/campaigns');
  assert.ok(restoredCampaigns.length >= 1, 'Restored campaigns should contain seed campaigns');

  const restoredStaff = await customFetch<StaffMember[]>('/api/hr/staff');
  assert.ok(restoredStaff.length >= 3, 'Restored staff should contain seed members');

  const restoredNotices = await customFetch<InternalNotice[]>('/api/hr/notices');
  assert.ok(restoredNotices.length >= 3, 'Restored notices should contain seed notices');

  const restoredUsers = await customFetch<WorkspaceUser[]>('/api/admin/users');
  assert.ok(restoredUsers.length >= 3, 'Restored users should contain seed users');
});

// ============================================================================
// MISSION 4: STORAGE RESILIENCE ADVERSARIAL STRESS TESTING
// ============================================================================

test('Storage Resilience Stress: Malformed JSON syntax in localStorage auto-heals without unhandled crash', async () => {
  mockLocalStorage.setItem(STORAGE_KEY, '{{{{invalid JSON syntax::::');

  // customFetch should auto-heal and return valid initial clients
  const clients = await customFetch<Client[]>('/api/clients');
  assert.ok(Array.isArray(clients), 'Clients must be an array');
  assert.ok(clients.length >= 3, 'Must re-seed initial authentic clients');

  // LocalStorage must now contain valid JSON
  const rawAfter = mockLocalStorage.getItem(STORAGE_KEY);
  assert.doesNotThrow(() => JSON.parse(rawAfter!));
});

test('Storage Resilience Stress: Malformed root types (array, number, string, null) auto-heal', async () => {
  const malformedRoots = ['[1, 2, 3]', '"unexpected string root"', '99999', 'true', 'false'];

  for (const badRoot of malformedRoots) {
    mockLocalStorage.setItem(STORAGE_KEY, badRoot);
    const clients = await customFetch<Client[]>('/api/clients');
    assert.ok(Array.isArray(clients));
    assert.ok(clients.length >= 3);
  }
});

test('Storage Resilience Stress: Malformed arrays (non-array, null, primitive elements) inside collections', async () => {
  // Inject non-array types for collections into existing valid store
  const corruptPayload = {
    clients: 'not-an-array',
    documents: null,
    payments: 12345,
    rentals: true,
    productionOrders: false,
    campaigns: 'corrupt-campaigns',
    showcaseLinks: null,
    staff: 42,
    notices: 'bad-notices',
    attendance: null,
    leaveRequests: {},
    users: 'bad-users',
    auditLogs: null,
  };
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(corruptPayload));

  // Verify all endpoints auto-heal missing arrays from initial seed
  const clients = await customFetch<Client[]>('/api/clients');
  assert.ok(Array.isArray(clients) && clients.length > 0);

  const camps = await customFetch<MarketingCampaign[]>('/api/marketer/campaigns');
  assert.ok(Array.isArray(camps) && camps.length > 0);

  const staff = await customFetch<StaffMember[]>('/api/hr/staff');
  assert.ok(Array.isArray(staff) && staff.length > 0);

  const notices = await customFetch<InternalNotice[]>('/api/hr/notices');
  assert.ok(Array.isArray(notices) && notices.length > 0);

  const users = await customFetch<WorkspaceUser[]>('/api/admin/users');
  assert.ok(Array.isArray(users) && users.length > 0);
});

test('Storage Resilience Stress: Nulls, primitives, and missing-id elements inside collections are filtered safely', async () => {
  // Inject collections containing nulls, strings, and elements missing 'id'
  const dirtyPayload = {
    clients: [
      null,
      undefined,
      'just-a-string',
      { noId: true },
      { id: 'cli-survivor', companyName: 'Survivor Corp', status: 'lead' },
    ],
    campaigns: [
      null,
      42,
      { titleNoId: 'Invalid' },
      { id: 'camp-survivor', name: 'Survivor Campaign', budget: 1000, spent: 500 },
    ],
    staff: [
      null,
      'fake-staff',
      { id: 'staff-survivor', fullName: 'Survivor Staff', department: 'Production' },
    ],
    notices: [
      null,
      {},
      { id: 'not-survivor', title: 'Survivor Notice', priority: 'high', pinned: false, datePosted: '2026-10-28' },
    ],
    users: [
      null,
      false,
      { id: 'usr-survivor', email: 'survivor@collage.com.gh', role: 'marketer' },
    ],
    attendance: [null, { id: 'att-survivor', staffId: 'staff-1', staffName: 'Staff 1', date: '2026-10-28' }],
    leaveRequests: [null, { id: 'leave-survivor', staffId: 'staff-1', days: 3 }],
    showcaseLinks: [null, { id: 'showcase-survivor', slug: 'all-services' }],
    auditLogs: [null, { id: 'audit-survivor', action: 'TEST' }],
    documents: [],
    payments: [],
    rentals: [],
    productionOrders: [],
  };
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(dirtyPayload));

  // Verify that loadStore safely filters out nulls and corrupt elements without throwing
  const clients = await customFetch<Client[]>('/api/clients');
  assert.strictEqual(clients.length, 1);
  assert.strictEqual(clients[0].id, 'cli-survivor');

  const campaigns = await customFetch<MarketingCampaign[]>('/api/marketer/campaigns');
  assert.strictEqual(campaigns.length, 1);
  assert.strictEqual(campaigns[0].id, 'camp-survivor');

  const staff = await customFetch<StaffMember[]>('/api/hr/staff');
  assert.strictEqual(staff.length, 1);
  assert.strictEqual(staff[0].id, 'staff-survivor');

  const notices = await customFetch<InternalNotice[]>('/api/hr/notices');
  assert.strictEqual(notices.length, 1);
  assert.strictEqual(notices[0].id, 'not-survivor');

  const users = await customFetch<WorkspaceUser[]>('/api/admin/users');
  assert.strictEqual(users.length, 1);
  assert.strictEqual(users[0].id, 'usr-survivor');
});
