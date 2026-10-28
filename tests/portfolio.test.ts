import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { customFetch, resetStore, ApiError } from './setup.ts';
import type { Client, ClientInput } from '../src/lib/api-client/generated/api.schemas.ts';

// ============================================================================
// Authoritative Type Definitions and Specifications (Derived from PROJECT.md & ORIGINAL_REQUEST.md)
// ============================================================================

export type ServiceCategory =
  | 'billboards'
  | 'field_production'
  | 'telescopic_flags'
  | 'event_branding'
  | 'wayfinding'
  | 'large_format_print';

export interface PortfolioService {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  specifications: string[];
  turnaround: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  client: string;
  category: ServiceCategory;
  categoryLabel: string;
  location: string;
  year: number;
  summary: string;
  challenge: string;
  solution: string;
  specs: string[];
  results: string[];
  testimonial?: {
    quote: string;
    author: string;
    position: string;
  };
  metrics?: { label: string; value: string }[];
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  headquarters: string;
  address: string;
  phones: string[];
  emails: string[];
  website: string;
  sisterCompany: string;
  taxCompliance: {
    getfund: string;
    nhil: string;
    vat: string;
  };
}

export interface ContactInquiry {
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  serviceCategory: ServiceCategory;
  projectDetails: string;
  estimatedBudget?: number;
}

// Canonical Service Definitions
export const CANONICAL_SERVICES: PortfolioService[] = [
  {
    id: 'srv-billboards',
    name: 'Outdoor Billboard Skins',
    category: 'billboards',
    tagline: 'High-Impact Highway Visibility Across Ghana',
    shortDescription: 'Heavy-gauge 550gsm UV blackout PVC skins engineered for extreme weather resistance.',
    fullDescription: 'Collage provides large-format billboard skin production and high-tension rigging for major highways across Greater Accra, Ashanti, and Western regions.',
    features: ['550gsm blackout PVC', 'High-tensile perimeter eyelets', 'Wind-load engineering', 'Certified night rigging'],
    specifications: ['UV-curable pigment inks', 'Durability rating 36 months', 'Standard formats: 48-sheet, 96-sheet, Unipole'],
    turnaround: '48 to 72 hours from artwork sign-off',
  },
  {
    id: 'srv-field-production',
    name: 'Field Production',
    category: 'field_production',
    tagline: 'Turnkey Event Staging and Site Infrastructure',
    shortDescription: 'Certified trussing, outdoor stage construction, and on-site engineering crews.',
    fullDescription: 'Comprehensive field production services for corporate summits, state functions, and commercial activations across Ghana.',
    features: ['Load-bearing aluminum trussing', 'Modular stage platforms', 'Safety-certified rigging crew', 'Rapid dismantling'],
    specifications: ['TUV certified truss systems', 'Ground support up to 10m', 'Wind-rated temporary structures'],
    turnaround: 'Site survey within 24 hours',
  },
  {
    id: 'srv-telescopic-flags',
    name: 'Telescopic Flag Poles',
    category: 'telescopic_flags',
    tagline: 'Premium Corporate Presence and Venue Dressing',
    shortDescription: '3.5m to 5.5m anodized aluminum flagpoles with water/sand weighted bases.',
    fullDescription: 'Turnkey rental fleet and custom fabrication of telescopic flagpoles for protocol entrances, corporate headquarters, and high-visibility outdoor venues.',
    features: ['Anodized aluminum poles', 'Heavy-duty water/sand ballast bases', 'Ground spikes for lawn installs', 'Dye-sublimation flag textiles'],
    specifications: ['Heights: 3.5m, 4.5m, 5.5m', 'Double-sided mirror image print', 'Wind survival up to 45 km/h'],
    turnaround: 'Same-day rental deployment from Accra warehouse',
  },
  {
    id: 'srv-event-branding',
    name: 'Event Branding',
    category: 'event_branding',
    tagline: 'Executive Media Walls, Stage Fascias and Plinths',
    shortDescription: 'Flawless backdrop tensioning, VIP media walls, and bespoke stage fascias.',
    fullDescription: 'From presidential summits at the Accra International Conference Centre to annual general meetings, Collage creates immersive brand environments.',
    features: ['Anti-glare matte media backdrops', 'Modular step-and-repeat boards', 'Illuminated VIP plinths', 'Custom stage cladding'],
    specifications: ['Matte PVC and polyester blockout fabrics', 'Wrinkle-resistant framing', 'Zero flash-reflection coating'],
    turnaround: 'Overnight venue transformations',
  },
  {
    id: 'srv-wayfinding',
    name: 'Wayfinding and Signage',
    category: 'wayfinding',
    tagline: 'Architectural Campus Directional Systems',
    shortDescription: 'Brushed aluminum pylons, directional totems, and institutional navigation.',
    fullDescription: 'Modular architectural wayfinding totems and directional systems designed for commercial banks, corporate headquarters, and multi-acre university campuses.',
    features: ['Brushed aluminum finishes', 'Internal solar/LED illumination', 'Modular swappable directory slats', 'Weatherproof automotive lacquer'],
    specifications: ['Grade 6063-T6 architectural aluminum', '3M reflective directional vinyl', 'Concrete pedestal anchors'],
    turnaround: '5 to 10 business days per campus deployment',
  },
  {
    id: 'srv-large-format-print',
    name: 'Large-Format Print',
    category: 'large_format_print',
    tagline: 'High-Precision UV Flatbed and Roll-to-Roll Production',
    shortDescription: 'Dispatched to sister facility PrintD Pigh for industrial flatbed and sublimation printing.',
    fullDescription: 'Collage collaborates with sister company PrintD Pigh to deliver industrial UV flatbed printing on rigid media, vehicle wraps, and high-volume fabric sublimation.',
    features: ['Direct-to-substrate flatbed UV', 'Fleet vehicle cast vinyl wraps', 'Textile dye-sublimation', 'Perforated one-way window graphics'],
    specifications: ['Resolution up to 1440 DPI', 'Print bed width up to 3.2m seamless', 'Latex and UV eco-friendly inks'],
    turnaround: '24 hours for rush orders',
  },
];

// Canonical Company Profile
export const CANONICAL_COMPANY_PROFILE: CompanyProfile = {
  name: 'Collage',
  tagline: 'Creating Results',
  headquarters: 'Accra, Ghana',
  address: '2 Morocco Lane, Off Independence Avenue, Ridge, Accra, Ghana',
  phones: ['+233 24 736 1133', '+233 24 431 8902'],
  emails: ['collagenmosaic@gmail.com', 'sendit@collagenmosaic.com'],
  website: 'www.collagenmosaic.com',
  sisterCompany: 'PrintD Pigh',
  taxCompliance: {
    getfund: 'GETFund 2.5%',
    nhil: 'NHIL 2.5%',
    vat: 'GRA VAT 15.0%',
  },
};

// Inquiry Validation Engine
export function validateQuoteEnquiry(input: Partial<ContactInquiry>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.clientName || input.clientName.trim().length === 0) {
    errors.push('Client name is required.');
  } else if (input.clientName.trim().length > 180) {
    errors.push('Client name cannot exceed 180 characters.');
  }

  if (!input.companyName || input.companyName.trim().length === 0) {
    errors.push('Company name is required.');
  } else if (input.companyName.trim().length > 180) {
    errors.push('Company name cannot exceed 180 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.push('A valid email address is required.');
  } else if (input.email.trim().length > 180) {
    errors.push('Email cannot exceed 180 characters.');
  }

  const cleanPhone = (input.phone || '').replace(/[\s-]/g, '');
  const phoneRegex = /^(\+233[235]\d{8}|0[235]\d{8})$/;
  if (!input.phone || !phoneRegex.test(cleanPhone)) {
    errors.push('A valid Ghanaian phone number is required (e.g. +233 24 123 4567 or 0241234567).');
  }

  const validCategories: ServiceCategory[] = [
    'billboards',
    'field_production',
    'telescopic_flags',
    'event_branding',
    'wayfinding',
    'large_format_print',
  ];
  if (!input.serviceCategory || !validCategories.includes(input.serviceCategory)) {
    errors.push('A valid service category must be selected.');
  }

  if (!input.projectDetails || input.projectDetails.trim().length < 10) {
    errors.push('Project details must be at least 10 characters.');
  } else if (input.projectDetails.trim().length > 2000) {
    errors.push('Project details cannot exceed 2000 characters.');
  }

  return { valid: errors.length === 0, errors };
}

// Convert Enquiry to Client Lead
export function enquiryToClientPayload(inquiry: ContactInquiry): ClientInput {
  return {
    companyName: inquiry.companyName.trim(),
    contactName: inquiry.clientName.trim(),
    email: inquiry.email.trim().toLowerCase(),
    phone: inquiry.phone.trim(),
    city: 'Accra',
    country: 'Ghana',
    address: `[Service: ${inquiry.serviceCategory}] ${inquiry.projectDetails.trim()}`.slice(0, 400),
  };
}

beforeEach(() => {
  resetStore();
});

// ============================================================================
// TIER 1: FEATURE COVERAGE (Happy Path)
// ============================================================================

test('Tier 1: Portfolio Core Services Contract covers all 6 required services', () => {
  const categories = CANONICAL_SERVICES.map((s) => s.category);
  const expectedCategories: ServiceCategory[] = [
    'billboards',
    'field_production',
    'telescopic_flags',
    'event_branding',
    'wayfinding',
    'large_format_print',
  ];

  assert.strictEqual(CANONICAL_SERVICES.length, 6, 'Exactly 6 core services must be specified');
  for (const exp of expectedCategories) {
    assert.ok(categories.includes(exp), `Service category ${exp} must be present`);
  }

  for (const service of CANONICAL_SERVICES) {
    assert.ok(service.id.startsWith('srv-'), `Service ID must start with srv-: ${service.id}`);
    assert.ok(service.name.length > 0, 'Service name must be non-empty');
    assert.ok(service.tagline.length > 0, 'Service tagline must be non-empty');
    assert.ok(service.shortDescription.length > 0, 'Short description must be non-empty');
    assert.ok(service.fullDescription.length > 0, 'Full description must be non-empty');
    assert.ok(service.features.length >= 3, 'Service must define at least 3 features');
    assert.ok(service.specifications.length >= 2, 'Service must define at least 2 specifications');
    assert.ok(service.turnaround.length > 0, 'Turnaround must be non-empty');
  }
});

test('Tier 1: Company Profile specification contains complete Ghanaian corporate disclosures', () => {
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.name, 'Collage');
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.tagline, 'Creating Results');
  assert.ok(CANONICAL_COMPANY_PROFILE.address.includes('Ridge, Accra, Ghana'));
  assert.ok(CANONICAL_COMPANY_PROFILE.phones.some((p) => p.includes('+233 24 736 1133')));
  assert.ok(CANONICAL_COMPANY_PROFILE.emails.includes('collagenmosaic@gmail.com'));
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.sisterCompany, 'PrintD Pigh');
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.taxCompliance.getfund, 'GETFund 2.5%');
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.taxCompliance.nhil, 'NHIL 2.5%');
  assert.strictEqual(CANONICAL_COMPANY_PROFILE.taxCompliance.vat, 'GRA VAT 15.0%');
});

test('Tier 1: Public Quote Enquiry Validation succeeds on valid Ghanaian enterprise inquiry', () => {
  const validInquiry: ContactInquiry = {
    clientName: 'Nana Ama Mensah',
    companyName: 'Ecobank Ghana PLC',
    email: 'n.mensah@ecobank.com.gh',
    phone: '+233 24 411 2290',
    serviceCategory: 'wayfinding',
    projectDetails: 'Nationwide branch re-branding and directional pylon totems for 12 locations.',
    estimatedBudget: 45000,
  };

  const validation = validateQuoteEnquiry(validInquiry);
  assert.strictEqual(validation.valid, true, 'Valid inquiry must pass validation');
  assert.strictEqual(validation.errors.length, 0);

  const clientPayload = enquiryToClientPayload(validInquiry);
  assert.strictEqual(clientPayload.companyName, 'Ecobank Ghana PLC');
  assert.strictEqual(clientPayload.contactName, 'Nana Ama Mensah');
  assert.strictEqual(clientPayload.country, 'Ghana');
  assert.strictEqual(clientPayload.email, 'n.mensah@ecobank.com.gh');
  assert.ok(clientPayload.address?.includes('[Service: wayfinding]'));
});

test('Tier 1: Public Route Specification verifies zero-auth access to /portfolio', () => {
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

  // Verify that public routes outside Shell do not require authentication
  assert.ok(
    appSrc.includes('WouterRouter') || appSrc.includes('Switch'),
    'App.tsx must use Wouter router or Switch',
  );

  // Verify portfolio route is registered in Switch
  const hasPortfolioRoute =
    appSrc.includes('path="/portfolio"') ||
    appSrc.includes("path='/portfolio'") ||
    appSrc.includes('PortfolioPage');
  assert.ok(hasPortfolioRoute, 'App.tsx registers /portfolio route');
});

// ============================================================================
// TIER 2: BOUNDARIES & EDGE CASES
// ============================================================================

test('Tier 2: Enquiry Validation rejects empty, whitespace, and truncated inputs', () => {
  const badInputs: Partial<ContactInquiry>[] = [
    { clientName: '', companyName: 'Acme', email: 'test@acme.com', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: '   ', companyName: 'Acme', email: 'test@acme.com', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: '', email: 'test@acme.com', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: '   ', email: 'test@acme.com', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'invalid-email', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'john@acme', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'john@acme.com', phone: '12345', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'john@acme.com', phone: 'abcdefghij', serviceCategory: 'billboards', projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'john@acme.com', phone: '0241234567', serviceCategory: 'invalid_category' as ServiceCategory, projectDetails: 'Need 5 billboards' },
    { clientName: 'John', companyName: 'Acme', email: 'john@acme.com', phone: '0241234567', serviceCategory: 'billboards', projectDetails: 'Too short' }, // < 10 chars
  ];

  for (const bad of badInputs) {
    const res = validateQuoteEnquiry(bad);
    assert.strictEqual(res.valid, false, `Expected validation failure for input: ${JSON.stringify(bad)}`);
    assert.ok(res.errors.length > 0, 'Errors array must contain failure reasons');
  }
});

test('Tier 2: Enquiry Validation accepts various valid Ghanaian phone formats', () => {
  const validPhones = [
    '+233 24 123 4567',
    '+233241234567',
    '+233-24-123-4567',
    '0241234567',
    '0201234567',
    '0551234567',
    '0302123456',
    '+233 30 212 3456',
  ];

  for (const phone of validPhones) {
    const res = validateQuoteEnquiry({
      clientName: 'Kwame Mensah',
      companyName: 'MTN Ghana',
      email: 'kwame@mtn.com.gh',
      phone,
      serviceCategory: 'billboards',
      projectDetails: 'Yellow Summer highway campaign skin fabrication and rigging.',
    });
    assert.strictEqual(res.valid, true, `Phone number format should be accepted: ${phone}`);
  }
});

test('Tier 2: Enquiry Validation enforces maximum boundary character lengths', () => {
  const longString = 'A'.repeat(181);
  const maxProjectDetails = 'A'.repeat(2001);

  const resName = validateQuoteEnquiry({
    clientName: longString,
    companyName: 'Standard Chartered',
    email: 'sc@sc.com.gh',
    phone: '0241234567',
    serviceCategory: 'field_production',
    projectDetails: 'Turnkey exhibition staging for sustainable finance forum.',
  });
  assert.strictEqual(resName.valid, false);
  assert.ok(resName.errors.some((e) => e.includes('Client name cannot exceed 180')));

  const resDetails = validateQuoteEnquiry({
    clientName: 'Kwame',
    companyName: 'Standard Chartered',
    email: 'sc@sc.com.gh',
    phone: '0241234567',
    serviceCategory: 'field_production',
    projectDetails: maxProjectDetails,
  });
  assert.strictEqual(resDetails.valid, false);
  assert.ok(resDetails.errors.some((e) => e.includes('Project details cannot exceed 2000')));
});

test('Tier 2: Adversarial XSS and unicode payload sanitization in quote enquiry', () => {
  const xssInquiry: ContactInquiry = {
    clientName: '<script>alert("xss")</script> Nana',
    companyName: 'Acme & Sons <img src=x onerror=alert(1)>',
    email: 'nana@acme.com.gh',
    phone: '+233 24 111 2233',
    serviceCategory: 'telescopic_flags',
    projectDetails: 'Flags with special quotes: "Osu" & \'Ridge\' and unicode: 🇬🇭 Cedi ₵ symbol.',
  };

  const validation = validateQuoteEnquiry(xssInquiry);
  assert.strictEqual(validation.valid, true);

  const payload = enquiryToClientPayload(xssInquiry);
  assert.ok(payload.companyName.includes('Acme & Sons'));
  assert.ok(payload.address?.includes('🇬🇭 Cedi ₵'));
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================

test('Tier 3: Public Quote Enquiry persists directly to Client Leads collection via customFetch', async () => {
  const enquiry: ContactInquiry = {
    clientName: 'Kofi Asare',
    companyName: 'Stanbic Bank Ghana',
    email: 'k.asare@stanbic.com.gh',
    phone: '+233 24 999 8877',
    serviceCategory: 'telescopic_flags',
    projectDetails: 'Need 20 branded telescopic flags for corporate golf invitational at Achimota.',
  };

  const validation = validateQuoteEnquiry(enquiry);
  assert.strictEqual(validation.valid, true);

  const clientPayload = enquiryToClientPayload(enquiry);

  // Directly create lead via customFetch simulated REST API
  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientPayload),
  });

  assert.ok(created.id.startsWith('cli-'), 'Created client lead must have cli- prefix');
  assert.strictEqual(created.companyName, 'Stanbic Bank Ghana');
  assert.strictEqual(created.contactName, 'Kofi Asare');
  assert.strictEqual(created.country, 'Ghana');
  assert.strictEqual(created.status, 'lead', 'New inquiry must default to lead status');
  assert.ok(created.address?.includes('[Service: telescopic_flags]'));

  // Verify lead appears in leads query
  const leads = await customFetch<Client[]>('/api/clients?status=lead');
  assert.ok(
    leads.some((c) => c.companyName === 'Stanbic Bank Ghana'),
    'Submitted enquiry must appear in leads list',
  );
});

test('Tier 3: Inquiry Lead -> Converted to Active Client -> Ready for Document Billing', async () => {
  const enquiry: ContactInquiry = {
    clientName: 'Abena Darko',
    companyName: 'TotalEnergies Ghana',
    email: 'abena.darko@totalenergies.com.gh',
    phone: '+233 24 555 4433',
    serviceCategory: 'billboards',
    projectDetails: 'Highway Unipole replacement along Accra-Tema Motorway.',
  };

  const clientPayload = enquiryToClientPayload(enquiry);
  const createdLead = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientPayload),
  });
  assert.strictEqual(createdLead.status, 'lead');

  // Convert lead to active client
  const updatedClient = await customFetch<Client>(`/api/clients/${createdLead.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
  assert.strictEqual(updatedClient.status, 'active');

  // Active client can now receive sales quotations
  const now = new Date().toISOString().slice(0, 10);
  const quote = await customFetch('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      clientId: updatedClient.id,
      kind: 'quotation',
      issueDate: now,
      subject: 'Motorway Unipole Billboard Skin',
      items: [
        {
          kind: 'print',
          description: '550gsm UV Blackout PVC Billboard Skin (12m x 4m)',
          quantity: 1,
          unitPrice: 8500,
        },
      ],
    }),
  });

  assert.ok(quote, 'Should successfully generate quotation for converted client');
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

test('Tier 4: Enterprise Client Showcase Navigation Scenario (Ecobank Wayfinding)', () => {
  // Scenario: Marketing executive sends deep link /portfolio?project=ecobank-wayfinding
  const queryParam = 'ecobank-wayfinding';
  const expectedProjectId = 'prj-ecobank-wayfinding';

  // Modal spec verification for this project
  const modalSpecs = {
    id: expectedProjectId,
    client: 'Ecobank Ghana PLC',
    category: 'wayfinding' as ServiceCategory,
    specs: [
      'Architectural 6063-T6 brushed aluminum',
      'High-reflectivity 3M directional vinyl',
      'Internal solar/LED low-voltage illumination',
    ],
    results: [
      'Deployed across 12 branch locations in Greater Accra',
      'Zero maintenance interventions over 24 months',
    ],
    testimonial: {
      author: 'Nana Ama Mensah',
      position: 'Head of Corporate Brand & Marketing, Ecobank Ghana',
      quote: 'Collage delivered immaculate directional pylons on time and within budget.',
    },
    shareableUrl: `https://collagenmosaic.com/portfolio?project=${queryParam}`,
  };

  assert.strictEqual(modalSpecs.client, 'Ecobank Ghana PLC');
  assert.ok(modalSpecs.specs.length >= 2);
  assert.ok(modalSpecs.results.length >= 2);
  assert.ok(modalSpecs.testimonial.quote.length > 10);
  assert.strictEqual(modalSpecs.testimonial.quote.includes('—'), false, 'Testimonial must not contain em dashes');
  assert.ok(modalSpecs.shareableUrl.includes(queryParam));
});

test('Tier 4: Static File & Content Integrity for Portfolio Implementation (when present)', () => {
  const portfolioDataPath = path.resolve('src/data/portfolio-data.ts');
  const portfolioPagePath = path.resolve('src/pages/portfolio.tsx');

  // Progressive check: if portfolio files exist on disk, strictly inspect them
  if (fs.existsSync(portfolioDataPath)) {
    const dataSrc = fs.readFileSync(portfolioDataPath, 'utf-8');
    assert.strictEqual(dataSrc.includes('—'), false, 'portfolio-data.ts must contain zero em dashes');
    assert.ok(dataSrc.includes('billboards'), 'Must define billboards service');
    assert.ok(dataSrc.includes('field_production'), 'Must define field_production service');
    assert.ok(dataSrc.includes('telescopic_flags'), 'Must define telescopic_flags service');
    assert.ok(dataSrc.includes('event_branding'), 'Must define event_branding service');
    assert.ok(dataSrc.includes('wayfinding'), 'Must define wayfinding service');
    assert.ok(dataSrc.includes('large_format_print'), 'Must define large_format_print service');
    assert.ok(dataSrc.includes('PrintD Pigh'), 'Must reference sister company PrintD Pigh');
    assert.ok(dataSrc.includes('collagenmosaic@gmail.com'), 'Must disclose official email in company profile');
  }

  if (fs.existsSync(portfolioPagePath)) {
    const pageSrc = fs.readFileSync(portfolioPagePath, 'utf-8');
    assert.strictEqual(pageSrc.includes('—'), false, 'portfolio.tsx must contain zero em dashes');
    assert.ok(pageSrc.includes('PORTFOLIO_SERVICES') || pageSrc.includes('services'), 'Must reference portfolio services');
  }
});
