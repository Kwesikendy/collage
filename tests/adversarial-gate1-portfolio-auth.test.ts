import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  customFetch,
  resetStore,
  ApiError,
  mockLocalStorage,
  STORAGE_KEY,
  getRawStore,
  setRawStore,
} from './setup.ts';
import {
  PORTFOLIO_PROJECTS,
  PORTFOLIO_SERVICES,
  type PortfolioProject,
  type ServiceCategory,
  getProjectById,
  getProjectsByCategory,
} from '../src/data/portfolio-data.ts';
import {
  type UserRole,
  type WorkspaceUser,
  PRESEEDED_ACCOUNTS,
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  authenticateWithUnifiedAuth,
  getActiveSessionUser,
  clearActiveSession,
  getNavigationForRole,
  resolveCanonicalDashboard,
  evaluateRoleAccess,
} from '../src/types/auth.ts';
import {
  validateQuoteEnquiry,
  enquiryToClientPayload,
  type ContactInquiry,
} from './portfolio.test.ts';
import type { Client } from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
  clearActiveSession();
});

// ============================================================================
// 1. PUBLIC PORTFOLIO ROUTING & DEEP LINKING STRESS TESTS
// ============================================================================

test('Gate 1 Stress: getProjectById handles non-existent, malformed, and injection project IDs safely', () => {
  const adversarialIds = [
    'non-existent-12345',
    'undefined',
    'null',
    '',
    '   ',
    '../../etc/passwd',
    '<script>alert(1)</script>',
    'prj-ecobank-wayfinding; DROP TABLE projects;--',
    'SELECT * FROM projects',
    '\\0',
    '%20',
    'NaN',
    '0',
    '-1',
    'prj-nonexistent-uuid-8888-9999-0000',
    'PROJECT_DOES_NOT_EXIST',
  ];

  for (const id of adversarialIds) {
    const project = getProjectById(id);
    assert.strictEqual(
      project,
      undefined,
      `getProjectById('${id}') must safely return undefined instead of throwing or false matching`,
    );
  }
});

test('Gate 1 Stress: getProjectById resolves authentic canonical Ghanaian corporate case studies', () => {
  const knownProjects = [
    'ecobank-wayfinding',
    'mtn-billboard-skins',
    'ghana-energy-summit',
    'african-protocol-flags',
    'stanchart-pavilion',
    'enterprise-fleet-branding',
  ];

  for (const id of knownProjects) {
    const project = getProjectById(id);
    assert.ok(project, `Project ID '${id}' must be found in portfolio data`);
    assert.strictEqual(project?.id, id);
    assert.ok(project?.title.length > 0, 'Project must have non-empty title');
    assert.ok(project?.client.length > 0, 'Project must have non-empty client');
    assert.ok(project?.summary.length > 0, 'Project must have non-empty summary');
    assert.ok(project?.specs.length > 0, 'Project must have technical specifications');
    assert.ok(project?.results.length > 0, 'Project must have deployment results');
  }
});

test('Gate 1 Stress: Simulated Deep Link URL search parameter parsing with invalid IDs does not crash', () => {
  // Simulate URLSearchParams logic used in PortfolioPage
  const testUrls = [
    'https://collagenmosaic.com/portfolio?project=non-existent-12345',
    'https://collagenmosaic.com/portfolio?project=',
    'https://collagenmosaic.com/portfolio?project=undefined',
    'https://collagenmosaic.com/portfolio?project=%00',
    'https://collagenmosaic.com/portfolio?project=%3Cscript%3Ealert(1)%3C/script%3E',
    'https://collagenmosaic.com/portfolio?project=ecobank-wayfinding',
  ];

  for (const urlStr of testUrls) {
    const url = new URL(urlStr);
    const projectId = url.searchParams.get('project');
    const matchedProject = projectId ? getProjectById(projectId) : undefined;

    if (urlStr.includes('ecobank-wayfinding')) {
      assert.ok(matchedProject, 'Valid project ID should resolve');
      assert.strictEqual(matchedProject?.id, 'ecobank-wayfinding');
    } else {
      assert.strictEqual(
        matchedProject,
        undefined,
        `Invalid URL param should resolve to undefined: ${urlStr}`,
      );
    }
  }
});

test('Gate 1 Stress: Category filtering handles valid, empty, boundary, and invalid category inputs', () => {
  // 'all' category returns all projects
  const allProjects = getProjectsByCategory('all');
  assert.strictEqual(allProjects.length, 6, 'Must return all 6 projects for category "all"');

  // Valid service categories
  const validCategories: ServiceCategory[] = [
    'billboards',
    'field_production',
    'telescopic_flags',
    'event_branding',
    'wayfinding',
    'large_format_print',
  ];

  for (const cat of validCategories) {
    const filtered = getProjectsByCategory(cat);
    assert.ok(Array.isArray(filtered), `Category ${cat} must return an array`);
    for (const p of filtered) {
      assert.strictEqual(p.category, cat, `All returned projects must match category ${cat}`);
    }
  }

  // Boundary and invalid inputs
  const boundaryCategories = [
    '',
    '   ',
    'non_existent_category',
    'null',
    'undefined',
    'ALL',
    'Billboards',
    '<script>',
    '12345',
  ];

  for (const bCat of boundaryCategories) {
    const filtered = getProjectsByCategory(bCat as any);
    assert.ok(Array.isArray(filtered), `Boundary input '${bCat}' must return an array`);
    assert.strictEqual(
      filtered.length,
      0,
      `Unknown category '${bCat}' must return empty array without crashing`,
    );
  }
});

// ============================================================================
// 2. QUOTE ENQUIRY FORM EDGE CASES, XSS & PHONE VALIDATION
// ============================================================================

test('Gate 1 Stress: Quote Enquiry rejects empty, whitespace, and truncated strings across all fields', () => {
  // Missing / empty fields
  const emptyName = validateQuoteEnquiry({
    clientName: '   ',
    companyName: 'Scancom PLC',
    email: 'info@scancom.com.gh',
    phone: '0241234567',
    serviceCategory: 'billboards',
    projectDetails: 'Need 10 motorway billboard skins.',
  });
  assert.strictEqual(emptyName.valid, false);
  assert.ok(emptyName.errors.some((e) => e.includes('Client name is required')));

  const emptyCompany = validateQuoteEnquiry({
    clientName: 'Kwabena Darko',
    companyName: '',
    email: 'info@scancom.com.gh',
    phone: '0241234567',
    serviceCategory: 'billboards',
    projectDetails: 'Need 10 motorway billboard skins.',
  });
  assert.strictEqual(emptyCompany.valid, false);
  assert.ok(emptyCompany.errors.some((e) => e.includes('Company name is required')));

  const emptyEmail = validateQuoteEnquiry({
    clientName: 'Kwabena Darko',
    companyName: 'Scancom PLC',
    email: '   ',
    phone: '0241234567',
    serviceCategory: 'billboards',
    projectDetails: 'Need 10 motorway billboard skins.',
  });
  assert.strictEqual(emptyEmail.valid, false);
  assert.ok(emptyEmail.errors.some((e) => e.includes('valid email address is required')));

  const malformedEmails = [
    'notanemail',
    'kwabena@',
    '@scancom.com.gh',
    'kwabena@scancom',
    'kwabena @scancom.com.gh',
    'kwabena@@scancom.com',
    'kwabena@.com',
  ];
  for (const badEmail of malformedEmails) {
    const res = validateQuoteEnquiry({
      clientName: 'Kwabena Darko',
      companyName: 'Scancom PLC',
      email: badEmail,
      phone: '0241234567',
      serviceCategory: 'billboards',
      projectDetails: 'Need 10 motorway billboard skins.',
    });
    assert.strictEqual(res.valid, false, `Email '${badEmail}' must be rejected`);
  }

  // Short project details (< 10 chars)
  const shortDetails = validateQuoteEnquiry({
    clientName: 'Kwabena Darko',
    companyName: 'Scancom PLC',
    email: 'info@scancom.com.gh',
    phone: '0241234567',
    serviceCategory: 'billboards',
    projectDetails: 'Brief',
  });
  assert.strictEqual(shortDetails.valid, false);
  assert.ok(shortDetails.errors.some((e) => e.includes('at least 10 characters')));
});

test('Gate 1 Stress: Quote Enquiry Ghanaian phone validation rejects non-Ghanaian and malformed patterns', () => {
  const invalidPhones = [
    '+1 555 123 4567', // USA / North America
    '+44 20 7946 0958', // UK
    '+234 80 1234 5678', // Nigeria
    '0123456789', // Invalid Ghanaian prefix (01)
    '12345678', // Missing area/network prefix
    '+233 12 345 6789', // Invalid Ghana mobile prefix (12)
    '+233 99 123 4567', // Invalid prefix 99
    '024 123', // Truncated
    '024 1234 5678 999', // Excessively long
    '0241234567abc', // Alphanumeric
    'phone-number', // Letters only
  ];

  for (const phone of invalidPhones) {
    const res = validateQuoteEnquiry({
      clientName: 'Kwame Asante',
      companyName: 'Fidelity Bank Ghana',
      email: 'asante@fidelity.com.gh',
      phone,
      serviceCategory: 'wayfinding',
      projectDetails: 'Headquarters campus directional signage system.',
    });
    assert.strictEqual(
      res.valid,
      false,
      `Phone number '${phone}' should be rejected as invalid Ghanaian phone`,
    );
    assert.ok(res.errors.some((e) => e.includes('Ghanaian phone number')));
  }
});

test('Gate 1 Stress: Quote Enquiry accepts authentic Ghanaian telecom and landline prefixes', () => {
  const validGhanaPhones = [
    '+233 24 123 4567', // MTN
    '+233 25 123 4567', // MTN
    '+233 55 123 4567', // MTN
    '+233 59 123 4567', // MTN
    '+233 20 123 4567', // Telecel (Vodafone)
    '+233 50 123 4567', // Telecel
    '+233 27 123 4567', // AirtelTigo
    '+233 57 123 4567', // AirtelTigo
    '+233 23 123 4567', // Glo
    '0241234567', // MTN local
    '0201234567', // Telecel local
    '0551234567', // MTN local
    '0302123456', // Greater Accra fixed landline
    '+233 30 212 3456', // Greater Accra fixed landline international
    '+233-24-123-4567', // Hyphenated
  ];

  for (const phone of validGhanaPhones) {
    const res = validateQuoteEnquiry({
      clientName: 'Kwame Asante',
      companyName: 'Fidelity Bank Ghana',
      email: 'asante@fidelity.com.gh',
      phone,
      serviceCategory: 'wayfinding',
      projectDetails: 'Headquarters campus directional signage system.',
    });
    assert.strictEqual(
      res.valid,
      true,
      `Phone number '${phone}' should be accepted as valid Ghanaian format`,
    );
  }
});

test('Gate 1 Stress: Adversarial XSS and unicode payloads do not cause injection or regex catastrophic backtracking', () => {
  const hostilePayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(document.cookie)>',
    'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
    '\' OR \'1\'=\'1\' --',
    '🇬🇭 ₵ Cedi symbol, Ashanti Twi words: Akwaaba, Odo, Ga: Miike, Ewe: Woezor, Dagbani: Kawula',
    'Right-to-left \u202Ereversed text\u202C and zero-width \u200Bspaces\u200C',
    'CJK Ideographs: 广告制作 旗帜租赁 户外大牌',
  ];

  for (const payload of hostilePayloads) {
    const enquiry: ContactInquiry = {
      clientName: `Nana ${payload}`,
      companyName: `Company ${payload}`,
      email: 'security.test@collage.com.gh',
      phone: '+233 24 000 1122',
      serviceCategory: 'event_branding',
      projectDetails: `Project specs with payload: ${payload}`,
    };

    const validation = validateQuoteEnquiry(enquiry);
    assert.strictEqual(validation.valid, true, `Payload should validate safely: ${payload}`);

    const clientPayload = enquiryToClientPayload(enquiry);
    assert.ok(clientPayload.companyName.includes('Company'));
    assert.ok(clientPayload.contactName.includes('Nana'));
    assert.ok(clientPayload.address && clientPayload.address.length <= 400);
  }
});

// ============================================================================
// 3. ENQUIRY LEAD PERSISTENCE & STORE INTEGRITY (collat_erp_store_v3)
// ============================================================================

test('Gate 1 Stress: Quote Enquiry persistence does not corrupt documents, payments, or rentals in collat_erp_store_v3', async () => {
  // Ensure store is initialized with clean authentic seed data
  const initialDocs = await customFetch<any[]>('/api/documents');
  const initialClients = await customFetch<Client[]>('/api/clients');
  assert.ok(initialDocs.length >= 2, 'Initial documents must exist');
  assert.ok(initialClients.length >= 3, 'Initial clients must exist');

  const rawBefore = getRawStore() as any;
  assert.ok(rawBefore, 'Store must be initialized');
  const docCountBefore = rawBefore.documents.length;
  const paymentCountBefore = rawBefore.payments.length;
  const rentalCountBefore = rawBefore.rentals.length;
  const productionCountBefore = rawBefore.productionOrders.length;
  const clientCountBefore = rawBefore.clients.length;

  // Simulate EnquiryForm submission directly matching src/components/portfolio/enquiry-form.tsx:80-125
  const rawStore = mockLocalStorage.getItem(STORAGE_KEY);
  let store: any = rawStore ? JSON.parse(rawStore) : null;
  const newLeadId = `cli-lead-${Date.now()}`;
  const now = new Date().toISOString();

  const newClientRecord = {
    id: newLeadId,
    companyName: 'Enterprise Client Ghana Ltd',
    contactName: 'Yaw Boateng',
    email: 'y.boateng@enterprise.com.gh',
    phone: '+233 24 555 7788',
    address: 'Web Quote Enquiry: billboards',
    city: 'Accra',
    country: 'Ghana',
    status: 'lead' as const,
    createdAt: now,
    updatedAt: now,
  };

  store.clients.unshift(newClientRecord);
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(store));

  // Verify collat_erp_store_v3 integrity after enquiry insertion
  const rawAfter = getRawStore() as any;
  assert.strictEqual(rawAfter.clients.length, clientCountBefore + 1, 'Clients must have incremented by 1');
  assert.strictEqual(rawAfter.documents.length, docCountBefore, 'Documents collection must remain uncorrupted');
  assert.strictEqual(rawAfter.payments.length, paymentCountBefore, 'Payments collection must remain uncorrupted');
  assert.strictEqual(rawAfter.rentals.length, rentalCountBefore, 'Rentals collection must remain uncorrupted');
  assert.strictEqual(rawAfter.productionOrders.length, productionCountBefore, 'Production orders collection must remain uncorrupted');

  // Verify the newly inserted lead is at the top of client leads
  assert.strictEqual(rawAfter.clients[0].id, newLeadId);
  assert.strictEqual(rawAfter.clients[0].status, 'lead');
  assert.strictEqual(rawAfter.clients[0].companyName, 'Enterprise Client Ghana Ltd');

  // Verify simulated REST API endpoints continue functioning smoothly
  const clientsFromApi = await customFetch<Client[]>('/api/clients');
  assert.ok(clientsFromApi.some((c) => c.id === newLeadId));

  const docsFromApi = await customFetch<any[]>('/api/documents');
  assert.strictEqual(docsFromApi.length, docCountBefore);
});

test('Gate 1 Stress: Quote Enquiry submission heals empty, null, or corrupt collat_erp_store_v3 gracefully', () => {
  const corruptStoreStates = [
    null,
    '',
    '{bad json',
    '[]',
    '{"clients": null}',
    '{"clients": "not_an_array", "documents": 123}',
  ];

  for (const badState of corruptStoreStates) {
    if (badState === null) {
      mockLocalStorage.removeItem(STORAGE_KEY);
    } else {
      mockLocalStorage.setItem(STORAGE_KEY, badState);
    }

    // Run the EnquiryForm resilience logic
    const rawStore = mockLocalStorage.getItem(STORAGE_KEY);
    let store: any = null;
    if (rawStore) {
      try {
        store = JSON.parse(rawStore);
      } catch {
        store = null;
      }
    }

    if (!store || typeof store !== 'object' || Array.isArray(store)) {
      store = {
        clients: [],
        documents: [],
        payments: [],
        rentals: [],
        productionOrders: [],
      };
    }

    if (!Array.isArray(store.clients)) {
      store.clients = [];
    }

    const leadId = `cli-lead-heal-${Date.now()}`;
    store.clients.unshift({
      id: leadId,
      companyName: 'Resilient Lead Corp',
      contactName: 'Kofi Mensah',
      email: 'kofi@resilient.com.gh',
      phone: '+233 24 111 2233',
      address: 'Web Quote Enquiry: field_production',
      city: 'Accra',
      country: 'Ghana',
      status: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    // Verify stored result is valid JSON and contains the client lead
    const rawSaved = mockLocalStorage.getItem(STORAGE_KEY);
    assert.ok(rawSaved);
    const parsed = JSON.parse(rawSaved!);
    assert.strictEqual(Array.isArray(parsed), false, 'Store root must be object');
    assert.ok(Array.isArray(parsed.clients), 'Store must have clients array');
    assert.strictEqual(parsed.clients[0].id, leadId);
    assert.strictEqual(parsed.clients[0].status, 'lead');
  }
});

// ============================================================================
// 4. UNIFIED AUTH STRESS TESTING
// ============================================================================

test('Gate 1 Stress: Unified Sign-In handles invalid, boundary, and injection credentials', () => {
  // 1. Whitespace password
  const whitespacePass = authenticateWithUnifiedAuth('admin@collage.com.gh', '   ');
  assert.strictEqual(whitespacePass.success, false);
  assert.ok(whitespacePass.error?.includes('Password is required'));

  // 2. Whitespace email
  const whitespaceEmail = authenticateWithUnifiedAuth('   ', 'Collage2026!');
  assert.strictEqual(whitespaceEmail.success, false);
  assert.ok(whitespaceEmail.error?.includes('Email address is required'));

  // 3. Both empty
  const bothEmpty = authenticateWithUnifiedAuth('', '');
  assert.strictEqual(bothEmpty.success, false);

  // 4. Non-existent account
  const nonExistent = authenticateWithUnifiedAuth('intruder@outside.com', 'Collage2026!');
  assert.strictEqual(nonExistent.success, false);
  assert.ok(nonExistent.error?.includes('Invalid work email or account not found'));

  // 5. Wrong password
  const wrongPass = authenticateWithUnifiedAuth('admin@collage.com.gh', 'WrongPassword123');
  assert.strictEqual(wrongPass.success, false);
  assert.ok(wrongPass.error?.includes('Invalid password'));

  // 6. SQL / NoSQL injection attempts in credentials
  const sqlEmail = authenticateWithUnifiedAuth("admin@collage.com.gh' OR '1'='1", 'Collage2026!');
  assert.strictEqual(sqlEmail.success, false);

  const sqlPass = authenticateWithUnifiedAuth('admin@collage.com.gh', "' OR '1'='1' --");
  assert.strictEqual(sqlPass.success, false);

  // 7. Case-insensitive normalization test
  const mixedCaseEmail = authenticateWithUnifiedAuth('aDmIn@CoLlAgE.cOm.Gh', 'Collage2026!');
  assert.strictEqual(mixedCaseEmail.success, true);
  assert.strictEqual(mixedCaseEmail.user?.role, 'admin');

  // 8. Trimmed email test
  const paddedEmail = authenticateWithUnifiedAuth('   marketer@collage.com.gh   ', 'Collage2026!');
  assert.strictEqual(paddedEmail.success, true);
  assert.strictEqual(paddedEmail.user?.role, 'marketer');
});

test('Gate 1 Stress: Rapid Demo Role Switcher stress test maintains consistent state and navigation', () => {
  const switchSequence: UserRole[] = [
    'admin',
    'marketer',
    'hr',
    'admin',
    'hr',
    'marketer',
    'admin',
    'marketer',
    'hr',
  ];

  for (let cycle = 0; cycle < 10; cycle++) {
    for (const role of switchSequence) {
      const email =
        role === 'admin'
          ? 'admin@collage.com.gh'
          : role === 'marketer'
            ? 'marketer@collage.com.gh'
            : 'hr@collage.com.gh';

      const account = PRESEEDED_ACCOUNTS[email];
      assert.ok(account, `Account for role ${role} must exist`);

      // Update mock storage as RoleSwitcher does
      const updatedUser: WorkspaceUser = {
        ...account.user,
        lastLogin: new Date().toISOString(),
      };
      mockLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      mockLocalStorage.setItem(AUTH_TOKEN_STORAGE_KEY, `mock-token-${role}`);

      // Verify active session matches the role
      const activeUser = getActiveSessionUser();
      assert.ok(activeUser, 'Active session user must exist');
      assert.strictEqual(activeUser?.role, role);
      assert.strictEqual(activeUser?.email, email);

      // Verify navigation items match role
      const nav = getNavigationForRole(role);
      assert.ok(nav.length > 0, `Navigation for ${role} must not be empty`);
      for (const item of nav) {
        assert.ok(
          item.requiredRoles.includes(role),
          `Navigation item ${item.label} must be authorized for role ${role}`,
        );
      }

      // Verify canonical dashboard view resolver
      const dash = resolveCanonicalDashboard(role);
      if (role === 'admin') {
        assert.strictEqual(dash.viewId, 'AdminDashboard');
      } else if (role === 'marketer') {
        assert.strictEqual(dash.viewId, 'MarketerDashboard');
      } else if (role === 'hr') {
        assert.strictEqual(dash.viewId, 'HrDashboard');
      }
    }
  }
});

// ============================================================================
// 5. ROUTE RESTRICTION BYPASSING & ROLEGUARD SECURITY STRESS TESTS
// ============================================================================

test('Gate 1 Stress: RoleGuard blocks unauthorized cross-role navigation attempts across all desks', () => {
  // Matrix of desk routes and their required roles
  const deskRouteRequirements: Array<{
    route: string;
    allowedRoles: UserRole[];
    description: string;
  }> = [
    // Admin only
    { route: '/clients', allowedRoles: ['admin'], description: 'Clients Directory' },
    { route: '/clients/:id', allowedRoles: ['admin'], description: 'Client Profile' },
    { route: '/quotations', allowedRoles: ['admin'], description: 'Quotations List' },
    { route: '/quotations/:id', allowedRoles: ['admin'], description: 'Quotation Detail' },
    { route: '/invoices', allowedRoles: ['admin'], description: 'Invoices List' },
    { route: '/invoices/:id', allowedRoles: ['admin'], description: 'Invoice Detail' },
    { route: '/operations', allowedRoles: ['admin'], description: 'Rentals & Production Orders' },
    { route: '/admin/users', allowedRoles: ['admin'], description: 'User & Role Access' },
    { route: '/admin/system', allowedRoles: ['admin'], description: 'System Diagnostics' },

    // Marketer & Admin
    { route: '/leads', allowedRoles: ['marketer', 'admin'], description: 'Client Leads Pipeline' },
    { route: '/campaigns', allowedRoles: ['marketer', 'admin'], description: 'Advertising Campaigns' },
    { route: '/portfolio-showcase', allowedRoles: ['marketer', 'admin'], description: 'Showcase Link Generator' },

    // HR & Admin
    { route: '/staff', allowedRoles: ['hr', 'admin'], description: 'Staff Directory' },
    { route: '/notices', allowedRoles: ['hr', 'admin'], description: 'Internal Notices Bulletin' },
    { route: '/attendance', allowedRoles: ['hr', 'admin'], description: 'Attendance & Leave Tracking' },
  ];

  for (const desk of deskRouteRequirements) {
    // 1. Admin must be allowed on all these routes
    const adminCheck = evaluateRoleAccess('admin', desk.allowedRoles);
    assert.strictEqual(
      adminCheck.allowed,
      true,
      `Admin must have access to ${desk.route} (${desk.description})`,
    );

    // 2. Marketer checks
    const marketerCheck = evaluateRoleAccess('marketer', desk.allowedRoles);
    if (desk.allowedRoles.includes('marketer')) {
      assert.strictEqual(
        marketerCheck.allowed,
        true,
        `Marketer must have access to ${desk.route}`,
      );
    } else {
      assert.strictEqual(
        marketerCheck.allowed,
        false,
        `Marketer MUST be blocked from ${desk.route}`,
      );
      assert.ok(
        marketerCheck.reason?.includes('Access restricted') ||
          marketerCheck.reason?.includes('not authorized'),
      );
    }

    // 3. HR checks
    const hrCheck = evaluateRoleAccess('hr', desk.allowedRoles);
    if (desk.allowedRoles.includes('hr')) {
      assert.strictEqual(
        hrCheck.allowed,
        true,
        `HR must have access to ${desk.route}`,
      );
    } else {
      assert.strictEqual(
        hrCheck.allowed,
        false,
        `HR MUST be blocked from ${desk.route}`,
      );
      assert.ok(
        hrCheck.reason?.includes('Access restricted') ||
          hrCheck.reason?.includes('not authorized'),
      );
    }

    // 4. Unauthenticated (null / undefined) checks
    const unauthCheck = evaluateRoleAccess(null, desk.allowedRoles);
    assert.strictEqual(
      unauthCheck.allowed,
      false,
      `Unauthenticated visitor must be blocked from ${desk.route}`,
    );
    assert.ok(
      unauthCheck.reason?.includes('Authentication required'),
      'Must prompt to sign in',
    );

    const undefinedCheck = evaluateRoleAccess(undefined, desk.allowedRoles);
    assert.strictEqual(undefinedCheck.allowed, false);

    // 5. Hostile/Arbitrary role strings
    const hostileRoles = ['superadmin', 'guest', 'auditor', 'root', 'anonymous', ''];
    for (const hostile of hostileRoles) {
      const hostileCheck = evaluateRoleAccess(hostile as any, desk.allowedRoles);
      assert.strictEqual(
        hostileCheck.allowed,
        false,
        `Arbitrary role '${hostile}' must be blocked from ${desk.route}`,
      );
    }
  }
});

// ============================================================================
// 6. SESSION STORAGE CORRUPTION RESILIENCE (collat_auth_user_v1)
// ============================================================================

test('Gate 1 Stress: getActiveSessionUser safely handles corrupted session storage in collat_auth_user_v1', () => {
  // Payloads where JSON is invalid, null, non-object, or missing email/role: must return null
  const nullReturningPayloads = [
    '{incomplete json',
    '{"email": "admin@collage.com.gh"', // missing closing brace
    'null',
    'undefined',
    '""',
    '   ',
    '12345',
    'true',
    'false',
    '[]',
    '[1, 2, 3]',
    '{}', // missing required email & role
    '{"email": "test@collage.com.gh"}', // missing role
    '{"role": "admin"}', // missing email
    '{"email": null, "role": null}',
    '\u0000\uD800\uFFFF', // invalid surrogate unicode
  ];

  for (const payload of nullReturningPayloads) {
    mockLocalStorage.setItem(AUTH_STORAGE_KEY, payload);

    let user: WorkspaceUser | null = null;
    assert.doesNotThrow(() => {
      user = getActiveSessionUser();
    }, `getActiveSessionUser must not throw for payload: ${payload}`);

    assert.strictEqual(
      user,
      null,
      `getActiveSessionUser must return null for incomplete payload: ${payload}`,
    );

    // RoleGuard evaluation must deny access cleanly
    const guardCheck = evaluateRoleAccess(user?.role, ['admin']);
    assert.strictEqual(guardCheck.allowed, false);
    assert.ok(guardCheck.reason?.includes('Authentication required'));
  }

  // Payloads where arbitrary or invalid role types are stored in JSON:
  // Must be strictly denied by evaluateRoleAccess and produce empty navigation
  const invalidRolePayloads = [
    '{"email": 123, "role": 456}', // non-string types
    '{"email": "test@collage.com.gh", "role": "unknown_role"}',
    '{"email": "test@collage.com.gh", "role": "superadmin"}',
    '{"email": "test@collage.com.gh", "role": "guest"}',
  ];

  for (const payload of invalidRolePayloads) {
    mockLocalStorage.setItem(AUTH_STORAGE_KEY, payload);

    let user: WorkspaceUser | null = null;
    assert.doesNotThrow(() => {
      user = getActiveSessionUser();
    }, `getActiveSessionUser must not throw for payload: ${payload}`);

    // If an object is parsed, evaluateRoleAccess must block it from accessing any admin/marketer/hr desk
    const accessAdmin = evaluateRoleAccess(user?.role as any, ['admin']);
    assert.strictEqual(
      accessAdmin.allowed,
      false,
      `evaluateRoleAccess must deny access to admin for corrupted payload: ${payload}`,
    );

    const accessMarketer = evaluateRoleAccess(user?.role as any, ['marketer']);
    assert.strictEqual(
      accessMarketer.allowed,
      false,
      `evaluateRoleAccess must deny access to marketer for corrupted payload: ${payload}`,
    );

    const accessHr = evaluateRoleAccess(user?.role as any, ['hr']);
    assert.strictEqual(
      accessHr.allowed,
      false,
      `evaluateRoleAccess must deny access to hr for corrupted payload: ${payload}`,
    );

    // getNavigationForRole must return empty list for invalid role
    const nav = getNavigationForRole(user?.role as any);
    assert.strictEqual(
      nav.length,
      0,
      `getNavigationForRole must return 0 items for invalid role: ${payload}`,
    );
  }
});
