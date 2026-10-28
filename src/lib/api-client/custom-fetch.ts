import type {
  ActivityItem,
  Client,
  ClientInput,
  ClientUpdate,
  DashboardSummary,
  DocumentInput,
  DocumentUpdate,
  HealthStatus,
  Payment,
  PaymentInput,
  SalesDocument,
} from './generated/api.schemas';
import {
  amountToCents,
  calculateDocumentPricing,
  centsToAmount,
  type LineInput,
} from './document-finance';
import type {
  MarketingCampaign,
  ShowcaseLink,
  StaffMember,
  InternalNotice,
  AttendanceRecord,
  LeaveRequest,
  WorkspaceUser,
  AuditLogItem,
  SystemDiagnosticMetrics,
  ServiceCategory,
  StaffDepartment,
  StaffStatus,
  NoticePriority,
  NoticeCategory,
  AttendanceStatus,
  LeaveType,
  WorkspaceRole,
} from '../../types/workflows';
import {
  sortInternalNotices,
  computeSystemStorageMetrics,
  getCapabilitiesForRole,
  generateShowcaseLink,
} from '../../types/workflows';

export type CustomFetchOptions = RequestInit & {
  responseType?: 'json' | 'text' | 'blob' | 'auto';
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;
export type AuthTokenGetter = () => Promise<string | null> | string | null;

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, '') : null;
}

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

export class ApiError<T = unknown> extends Error {
  readonly name = 'ApiError';
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    status: number,
    message: string,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.statusText = message;
    this.data = data;
    this.headers = new Headers({ 'content-type': 'application/json' });
    this.response = new Response(JSON.stringify(data ?? { error: message }), {
      status,
      statusText: message,
    });
    this.method = requestInfo.method;
    this.url = requestInfo.url;
  }
}

export interface RentalBooking {
  id: string;
  itemName: string;
  clientName: string;
  documentNumber: string;
  quantity: number;
  days: number;
  unitRate: number;
  startDate: string;
  returnDate: string;
  status: 'reserved' | 'deployed' | 'returned';
}

export interface ProductionOrder {
  id: string;
  jobCode: string;
  clientName: string;
  documentNumber: string;
  specification: string;
  quantity: number;
  assignedTo: string;
  dueDate: string;
  status: 'queued' | 'in_production' | 'quality_check' | 'delivered';
}

type StoredDocument = Omit<SalesDocument, 'clientName' | 'amountPaid' | 'balance'>;

interface ErpStore {
  clients: Client[];
  documents: StoredDocument[];
  payments: Payment[];
  rentals: RentalBooking[];
  productionOrders: ProductionOrder[];
  campaigns: MarketingCampaign[];
  showcaseLinks: ShowcaseLink[];
  staff: StaffMember[];
  notices: InternalNotice[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  users: WorkspaceUser[];
  auditLogs: AuditLogItem[];
}

const STORAGE_KEY = 'collat_erp_store_v3';

function createInitialStore(): ErpStore {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const clients: Client[] = [
    {
      id: 'cli-eugenia',
      companyName: 'Eugenia',
      contactName: 'Eugenia',
      email: 'eugenia@clientpartners.com.gh',
      phone: '+233 24 512 8890',
      address: 'Osu RE, Oxford Street',
      city: 'Accra',
      country: 'Ghana',
      status: 'active',
      createdAt: `${currentMonthPrefix}-20T09:00:00.000Z`,
      updatedAt: `${currentMonthPrefix}-21T10:00:00.000Z`,
    },
    {
      id: 'cli-ecobank-gh',
      companyName: 'Ecobank Ghana PLC',
      contactName: 'Nana Ama Mensah',
      email: 'n.mensah@ecobank.com.gh',
      phone: '+233 24 411 2290',
      address: '2 Morocco Lane, Off Independence Avenue',
      city: 'Accra',
      country: 'Ghana',
      status: 'active',
      createdAt: `${currentMonthPrefix}-03T09:15:00.000Z`,
      updatedAt: `${currentMonthPrefix}-18T14:20:00.000Z`,
    },
    {
      id: 'cli-mtn-gh',
      companyName: 'Scancom PLC (MTN Ghana)',
      contactName: 'Kwame Osei-Bonsu',
      email: 'kwame.osei@mtn.com.gh',
      phone: '+233 24 430 0000',
      address: 'MTN House, Independence Avenue, Ridge',
      city: 'Accra',
      country: 'Ghana',
      status: 'active',
      createdAt: `${currentMonthPrefix}-05T11:00:00.000Z`,
      updatedAt: `${currentMonthPrefix}-19T16:40:00.000Z`,
    },
    {
      id: 'cli-kempinski-accra',
      companyName: 'Kempinski Hotel Gold Coast City',
      contactName: 'Efua Baffour-Awuah',
      email: 'events.accra@kempinski.com',
      phone: '+233 24 243 6000',
      address: 'Ministries, Gamel Abdul Nasser Avenue',
      city: 'Accra',
      country: 'Ghana',
      status: 'active',
      createdAt: `${currentMonthPrefix}-08T10:30:00.000Z`,
      updatedAt: `${currentMonthPrefix}-20T12:15:00.000Z`,
    },
    {
      id: 'cli-goldfields',
      companyName: 'Gold Fields Ghana Limited',
      contactName: 'Kofi Boateng',
      email: 'k.boateng@goldfields.com.gh',
      phone: '+233 30 277 0189',
      address: 'No. 7 Dr. Amilcar Cabral Road, Airport Residential Area',
      city: 'Accra',
      country: 'Ghana',
      status: 'lead',
      createdAt: `${currentMonthPrefix}-12T08:45:00.000Z`,
      updatedAt: `${currentMonthPrefix}-12T08:45:00.000Z`,
    },
  ];

  // Exact match for authentic sample PDF: Invoice No. 00211026.01 TELESCOPIC FLAG PRINT AND POLE RENTALS
  const eugeniaPricing = calculateDocumentPricing({
    items: [
      {
        description: 'Polo rental',
        quantity: 4,
        days: 1,
        unitPrice: 70,
      },
      {
        description: 'Flag printing (1x3m)',
        quantity: 4,
        days: 1,
        unitPrice: 200,
      },
      {
        description: 'Logistics (Transpotation, Deployment)',
        quantity: 1,
        days: 1,
        unitPrice: 500,
      },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const ecobankPricing = calculateDocumentPricing({
    items: [
      {
        description: 'Telescopic Flag Print (Double-Sided Sublimation Fabric 4.2m)',
        quantity: 12,
        days: 1,
        unitPrice: 380,
      },
      {
        description: 'Telescopic Flag Pole & Heavy Water Base Rental (5m Complete Kit)',
        quantity: 12,
        days: 4,
        unitPrice: 95,
      },
      {
        description: 'On-Site Rigging, Installation & Dismantling Crew (AICC)',
        quantity: 1,
        days: 2,
        unitPrice: 650,
      },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const mtnPricing = calculateDocumentPricing({
    items: [
      {
        description: 'Corporate AGM Stage Backdrop & Wayfinding Totem Branding',
        quantity: 4,
        days: 1,
        unitPrice: 1450,
      },
      {
        description: 'Exhibition LED Floodlight & Truss System Rental',
        quantity: 6,
        days: 3,
        unitPrice: 180,
      },
    ],
    discountPercent: 5,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const qt1Pricing = calculateDocumentPricing({
    items: [
      {
        description: 'Executive Summit Directional Signage & Feather Banner Package',
        quantity: 16,
        days: 3,
        unitPrice: 160,
      },
      {
        description: 'Branded Registration Desk Fascia & Media Wall Print (Dispatched via PrintD Pigh)',
        quantity: 2,
        days: 1,
        unitPrice: 2200,
      },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const qt2Pricing = calculateDocumentPricing({
    items: [
      {
        description: 'Mining Safety Week Outdoor Billboard Skin & Telescopic Pole Rentals',
        quantity: 10,
        days: 5,
        unitPrice: 140,
      },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const documents: StoredDocument[] = [
    {
      id: 'doc-inv-00211026-01',
      number: '00211026.01',
      kind: 'invoice',
      clientId: 'cli-eugenia',
      subject: 'TELESCOPIC FLAG PRINT AND POLE RENTALS',
      issueDate: '2026-10-21',
      dueDate: '2026-10-26',
      status: 'issued',
      items: eugeniaPricing.items,
      subtotal: Number(eugeniaPricing.subtotal),
      discountPercent: Number(eugeniaPricing.discountPercent),
      discountAmount: Number(eugeniaPricing.discountAmount),
      getfundRate: Number(eugeniaPricing.getfundRate),
      getfundAmount: Number(eugeniaPricing.getfundAmount),
      nhilRate: Number(eugeniaPricing.nhilRate),
      nhilAmount: Number(eugeniaPricing.nhilAmount),
      vatRate: Number(eugeniaPricing.vatRate),
      vatAmount: Number(eugeniaPricing.vatAmount),
      total: Number(eugeniaPricing.total),
      paymentTerms: '100% Down Payment',
      validityDays: 5,
      createdAt: `${currentMonthPrefix}-21T10:00:00.000Z`,
      updatedAt: `${currentMonthPrefix}-21T10:00:00.000Z`,
    },
    {
      id: 'doc-inv-00221026-01',
      number: '00221026.01',
      kind: 'invoice',
      clientId: 'cli-ecobank-gh',
      subject: 'ANNUAL SUMMIT FLAG POLES & OUTDOOR WAYFINDING',
      issueDate: `${currentMonthPrefix}-22`,
      dueDate: `${currentMonthPrefix}-29`,
      status: 'partially_paid',
      items: ecobankPricing.items,
      subtotal: Number(ecobankPricing.subtotal),
      discountPercent: Number(ecobankPricing.discountPercent),
      discountAmount: Number(ecobankPricing.discountAmount),
      getfundRate: Number(ecobankPricing.getfundRate),
      getfundAmount: Number(ecobankPricing.getfundAmount),
      nhilRate: Number(ecobankPricing.nhilRate),
      nhilAmount: Number(ecobankPricing.nhilAmount),
      vatRate: Number(ecobankPricing.vatRate),
      vatAmount: Number(ecobankPricing.vatAmount),
      total: Number(ecobankPricing.total),
      paymentTerms: '100% Down Payment',
      validityDays: 5,
      createdAt: `${currentMonthPrefix}-22T10:00:00.000Z`,
      updatedAt: `${currentMonthPrefix}-22T14:30:00.000Z`,
    },
    {
      id: 'doc-inv-00181026-01',
      number: '00181026.01',
      kind: 'invoice',
      clientId: 'cli-mtn-gh',
      subject: 'CORPORATE AGM STAGE BACKDROP & EXHIBITION LIGHTING RENTAL',
      issueDate: `${currentMonthPrefix}-18`,
      dueDate: `${currentMonthPrefix}-25`,
      status: 'paid',
      items: mtnPricing.items,
      subtotal: Number(mtnPricing.subtotal),
      discountPercent: Number(mtnPricing.discountPercent),
      discountAmount: Number(mtnPricing.discountAmount),
      getfundRate: Number(mtnPricing.getfundRate),
      getfundAmount: Number(mtnPricing.getfundAmount),
      nhilRate: Number(mtnPricing.nhilRate),
      nhilAmount: Number(mtnPricing.nhilAmount),
      vatRate: Number(mtnPricing.vatRate),
      vatAmount: Number(mtnPricing.vatAmount),
      total: Number(mtnPricing.total),
      paymentTerms: '50% deposit to confirm. Balance on completion.',
      validityDays: 7,
      createdAt: `${currentMonthPrefix}-18T09:00:00.000Z`,
      updatedAt: `${currentMonthPrefix}-20T15:00:00.000Z`,
    },
    {
      id: 'doc-qt-00231026-01',
      number: 'QT00231026.01',
      kind: 'quotation',
      clientId: 'cli-kempinski-accra',
      subject: 'EXECUTIVE SUMMIT WAYFINDING & MEDIA WALL BRANDING',
      issueDate: `${currentMonthPrefix}-23`,
      dueDate: `${currentMonthPrefix}-30`,
      status: 'issued',
      items: qt1Pricing.items,
      subtotal: Number(qt1Pricing.subtotal),
      discountPercent: Number(qt1Pricing.discountPercent),
      discountAmount: Number(qt1Pricing.discountAmount),
      getfundRate: Number(qt1Pricing.getfundRate),
      getfundAmount: Number(qt1Pricing.getfundAmount),
      nhilRate: Number(qt1Pricing.nhilRate),
      nhilAmount: Number(qt1Pricing.nhilAmount),
      vatRate: Number(qt1Pricing.vatRate),
      vatAmount: Number(qt1Pricing.vatAmount),
      total: Number(qt1Pricing.total),
      paymentTerms: '100% Down Payment',
      validityDays: 14,
      createdAt: `${currentMonthPrefix}-23T11:20:00.000Z`,
      updatedAt: `${currentMonthPrefix}-23T11:20:00.000Z`,
    },
    {
      id: 'doc-qt-00241026-01',
      number: 'QT00241026.01',
      kind: 'quotation',
      clientId: 'cli-goldfields',
      subject: 'SAFETY WEEK OUTDOOR BILLBOARD SKIN & POLE RENTALS',
      issueDate: `${currentMonthPrefix}-24`,
      dueDate: null,
      status: 'accepted',
      items: qt2Pricing.items,
      subtotal: Number(qt2Pricing.subtotal),
      discountPercent: Number(qt2Pricing.discountPercent),
      discountAmount: Number(qt2Pricing.discountAmount),
      getfundRate: Number(qt2Pricing.getfundRate),
      getfundAmount: Number(qt2Pricing.getfundAmount),
      nhilRate: Number(qt2Pricing.nhilRate),
      nhilAmount: Number(qt2Pricing.nhilAmount),
      vatRate: Number(qt2Pricing.vatRate),
      vatAmount: Number(qt2Pricing.vatAmount),
      total: Number(qt2Pricing.total),
      paymentTerms: '50% deposit to confirm. Balance on completion.',
      validityDays: 14,
      createdAt: `${currentMonthPrefix}-24T13:10:00.000Z`,
      updatedAt: `${currentMonthPrefix}-24T16:45:00.000Z`,
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-mtn-full',
      documentId: 'doc-inv-00181026-01',
      amount: Number(mtnPricing.total),
      paymentDate: `${currentMonthPrefix}-20`,
      method: 'bank_transfer',
      reference: 'GTB-TRF-9082341',
      createdAt: `${currentMonthPrefix}-20T15:00:00.000Z`,
    },
    {
      id: 'pay-ecobank-dep',
      documentId: 'doc-inv-00221026-01',
      amount: 6590,
      paymentDate: `${currentMonthPrefix}-22`,
      method: 'bank_transfer',
      reference: 'ECO-DEP-00221026',
      createdAt: `${currentMonthPrefix}-22T14:30:00.000Z`,
    },
  ];

  const rentals: RentalBooking[] = [
    {
      id: 'rent-1',
      itemName: 'Telescopic Flag Pole & Heavy Water Base (5m)',
      clientName: 'Eugenia',
      documentNumber: '00211026.01',
      quantity: 4,
      days: 1,
      unitRate: 70,
      startDate: '2026-10-21',
      returnDate: '2026-10-22',
      status: 'deployed',
    },
    {
      id: 'rent-2',
      itemName: 'Telescopic Flag Pole & Base Kit (5m)',
      clientName: 'Ecobank Ghana PLC',
      documentNumber: '00221026.01',
      quantity: 12,
      days: 4,
      unitRate: 95,
      startDate: `${currentMonthPrefix}-22`,
      returnDate: `${currentMonthPrefix}-26`,
      status: 'deployed',
    },
    {
      id: 'rent-3',
      itemName: 'Exhibition LED Floodlight & Truss System',
      clientName: 'Scancom PLC (MTN Ghana)',
      documentNumber: '00181026.01',
      quantity: 6,
      days: 3,
      unitRate: 180,
      startDate: `${currentMonthPrefix}-18`,
      returnDate: `${currentMonthPrefix}-21`,
      status: 'returned',
    },
    {
      id: 'rent-4',
      itemName: 'Executive Summit Feather Banner Poles',
      clientName: 'Kempinski Hotel Gold Coast City',
      documentNumber: 'QT00231026.01',
      quantity: 16,
      days: 3,
      unitRate: 160,
      startDate: `${currentMonthPrefix}-27`,
      returnDate: `${currentMonthPrefix}-30`,
      status: 'reserved',
    },
  ];

  const productionOrders: ProductionOrder[] = [
    {
      id: 'prod-1',
      jobCode: 'PDP-2610-041',
      clientName: 'Eugenia',
      documentNumber: '00211026.01',
      specification: 'Flag printing (1x3m) · Sublimation fabric double-stitched',
      quantity: 4,
      assignedTo: 'PrintD Pigh · Large Format Press',
      dueDate: '2026-10-21',
      status: 'delivered',
    },
    {
      id: 'prod-2',
      jobCode: 'PDP-2610-044',
      clientName: 'Ecobank Ghana PLC',
      documentNumber: '00221026.01',
      specification: 'Telescopic Flag Print (4.2m Double-Sided Sublimation)',
      quantity: 12,
      assignedTo: 'PrintD Pigh · Textile & Dye Sub',
      dueDate: `${currentMonthPrefix}-24`,
      status: 'in_production',
    },
    {
      id: 'prod-3',
      jobCode: 'PDP-2610-048',
      clientName: 'Kempinski Hotel Gold Coast City',
      documentNumber: 'QT00231026.01',
      specification: 'Registration Desk Fascia & Media Wall Matte Vinyl Print',
      quantity: 2,
      assignedTo: 'PrintD Pigh · Finishing & Mounting',
      dueDate: `${currentMonthPrefix}-28`,
      status: 'queued',
    },
  ];

  const campaigns: MarketingCampaign[] = [
    {
      id: 'camp-accra-billboards',
      name: 'Q4 Nationwide Billboard Campaign',
      targetService: 'billboards',
      budget: 65000,
      spent: 48000,
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      status: 'active',
      leadsGenerated: 28,
      conversions: 8,
      notes: 'Accra-Tema Motorway, Ring Road, and Kumasi bypass prime unipoles.',
    },
    {
      id: 'camp-summit-flags',
      name: 'AICC Corporate Summit Flag Displays',
      targetService: 'telescopic_flags',
      budget: 25000,
      spent: 22500,
      startDate: '2026-10-10',
      endDate: '2026-11-15',
      status: 'active',
      leadsGenerated: 18,
      conversions: 6,
      notes: '5m telescopic flags with heavy water ballast for coastal diplomatic summits.',
    },
    {
      id: 'camp-ridge-wayfinding',
      name: 'Ridge Financial District Wayfinding Totems',
      targetService: 'wayfinding',
      budget: 38000,
      spent: 19000,
      startDate: '2026-09-15',
      endDate: '2026-11-30',
      status: 'active',
      leadsGenerated: 9,
      conversions: 3,
      notes: 'Architectural brushed aluminium totems and directional monoliths.',
    },
    {
      id: 'camp-event-branding',
      name: 'Ghana Energy and Mining Expo Media Walls',
      targetService: 'event_branding',
      budget: 42000,
      spent: 35000,
      startDate: '2026-08-01',
      endDate: '2026-10-25',
      status: 'completed',
      leadsGenerated: 24,
      conversions: 7,
      notes: 'Grand Arena photo media walls, tension fabric backdrops, and modular trussing.',
    },
    {
      id: 'camp-print-festival',
      name: 'National Festival Large Format Sublimation',
      targetService: 'large_format_print',
      budget: 30000,
      spent: 12000,
      startDate: '2026-10-20',
      endDate: '2026-12-20',
      status: 'active',
      leadsGenerated: 15,
      conversions: 4,
      notes: 'UV-resistant double-stitched fabric banners for Independence Square.',
    },
  ];

  const showcaseLinks: ShowcaseLink[] = [
    {
      id: 'showcase-billboards',
      title: 'Outdoor Billboard Skins and Gantries Showcase',
      serviceCategory: 'billboards',
      slug: 'outdoor-billboards',
      shareUrl: 'https://collagenmosaic.com/portfolio?category=billboards',
      clientName: 'Ecobank Ghana PLC',
      clicks: 142,
    },
    {
      id: 'showcase-flags',
      title: 'Telescopic Flagpoles and Water Base Kit Showcase',
      serviceCategory: 'telescopic_flags',
      slug: 'telescopic-flags',
      shareUrl: 'https://collagenmosaic.com/portfolio?category=telescopic_flags',
      clientName: 'MTN Ghana',
      clicks: 98,
    },
    {
      id: 'showcase-wayfinding',
      title: 'Corporate Campus Wayfinding and Monoliths',
      serviceCategory: 'wayfinding',
      slug: 'wayfinding',
      shareUrl: 'https://collagenmosaic.com/portfolio?category=wayfinding',
      clientName: 'Kempinski Gold Coast City',
      clicks: 76,
    },
    {
      id: 'showcase-event-branding',
      title: 'Executive Media Walls and Stage Backdrops',
      serviceCategory: 'event_branding',
      slug: 'event-branding',
      shareUrl: 'https://collagenmosaic.com/portfolio?category=event_branding',
      clicks: 115,
    },
    {
      id: 'showcase-all',
      title: 'Collage Ghana Master Capabilities Portfolio',
      serviceCategory: 'all',
      slug: 'all-services',
      shareUrl: 'https://collagenmosaic.com/portfolio',
      clicks: 320,
    },
  ];

  const staff: StaffMember[] = [
    {
      id: 'staff-1',
      employeeId: 'COL-001',
      fullName: 'Kojo Nathan',
      email: 'kojo@collage.com.gh',
      phone: '+233 24 736 1133',
      role: 'Executive Director and Operations Lead',
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
      role: 'Senior Rigging and Height Safety Master',
      department: 'Field & Rigging',
      status: 'active',
      joinDate: '2020-06-15',
      location: 'Accra HQ',
    },
    {
      id: 'staff-3',
      employeeId: 'COL-014',
      fullName: 'Nana Mensah',
      email: 'marketer@collage.com.gh',
      phone: '+233 24 332 5566',
      role: 'Lead Marketing and Accounts Strategist',
      department: 'Marketing',
      status: 'active',
      joinDate: '2021-04-12',
      location: 'Accra HQ',
    },
    {
      id: 'staff-4',
      employeeId: 'COL-021',
      fullName: 'Abena Osei',
      email: 'abena.o@collage.com.gh',
      phone: '+233 24 555 1212',
      role: 'Sublimation and Large Format Print Specialist',
      department: 'Production',
      status: 'active',
      joinDate: '2022-01-10',
      location: 'Spintex Print Yard',
    },
    {
      id: 'staff-5',
      employeeId: 'COL-028',
      fullName: 'Efua Baffour',
      email: 'hr@collage.com.gh',
      phone: '+233 24 667 8899',
      role: 'People and Culture Manager',
      department: 'HR',
      status: 'active',
      joinDate: '2021-09-01',
      location: 'Accra HQ',
    },
    {
      id: 'staff-6',
      employeeId: 'COL-035',
      fullName: 'Emmanuel Boateng',
      email: 'e.boateng@collage.com.gh',
      phone: '+233 24 112 3344',
      role: 'Structural Welder and Pylon Fabricator',
      department: 'Production',
      status: 'active',
      joinDate: '2022-08-15',
      location: 'Spintex Print Yard',
    },
    {
      id: 'staff-7',
      employeeId: 'COL-042',
      fullName: 'Kofi Owusu',
      email: 'k.owusu@collage.com.gh',
      phone: '+233 24 998 7766',
      role: 'Senior Architectural Wayfinding Designer',
      department: 'Creative',
      status: 'active',
      joinDate: '2023-02-01',
      location: 'Osu Design Studio',
    },
  ];

  const notices: InternalNotice[] = [
    {
      id: 'not-1',
      title: 'High-Altitude Rigging Safety: Double-Harness Inspections Mandatory',
      content: 'All crew deployed to motorway gantries and rooftop unipoles must conduct dual-lanyard inspections and sign the safety clearance log before ascent.',
      priority: 'urgent',
      category: 'safety',
      author: 'Kwame Mensah (Rigging Master)',
      datePosted: '2026-10-27',
      pinned: true,
    },
    {
      id: 'not-2',
      title: 'Production Schedule: Q4 Festive Rush and Stage Backdrops',
      content: 'The Spintex Print Yard is operating extended day-shifts for December festival media walls. Please route rush job requests via the operations queue.',
      priority: 'high',
      category: 'operations',
      author: 'Kojo Nathan (Operations)',
      datePosted: '2026-10-26',
      pinned: true,
    },
    {
      id: 'not-3',
      title: 'Annual Staff Medical and Height Certification at Ridge Clinic',
      content: 'Rigging and workshop fabrication staff are scheduled for wellness screenings and certified medical fitness renewals on Thursday.',
      priority: 'medium',
      category: 'policy',
      author: 'Efua Baffour (HR)',
      datePosted: '2026-10-25',
      pinned: false,
    },
    {
      id: 'not-4',
      title: 'New Eco-Solvent Dye Sublimation Press Commissioned',
      content: 'Training sessions for the new 3.2m textile printer will take place Wednesday 10:00 GMT at the Spintex facility.',
      priority: 'low',
      category: 'general',
      author: 'Abena Osei (Production)',
      datePosted: '2026-10-24',
      pinned: false,
    },
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-1',
      staffId: 'staff-1',
      staffName: 'Kojo Nathan',
      department: 'Executive',
      date: '2026-10-28',
      checkInTime: '07:30 GMT',
      status: 'present',
      notes: 'Morning operations review and sign-off.',
    },
    {
      id: 'att-2',
      staffId: 'staff-2',
      staffName: 'Kwame Mensah',
      department: 'Field & Rigging',
      date: '2026-10-28',
      checkInTime: '06:45 GMT',
      status: 'on_field',
      notes: 'AICC Summit site survey and gantry inspection.',
    },
    {
      id: 'att-3',
      staffId: 'staff-3',
      staffName: 'Nana Mensah',
      department: 'Marketing',
      date: '2026-10-28',
      checkInTime: '08:00 GMT',
      status: 'present',
      notes: 'Client proposal briefing.',
    },
    {
      id: 'att-4',
      staffId: 'staff-4',
      staffName: 'Abena Osei',
      department: 'Production',
      date: '2026-10-28',
      checkInTime: '07:15 GMT',
      status: 'present',
      notes: 'Large format textile sublimation batch run.',
    },
    {
      id: 'att-5',
      staffId: 'staff-5',
      staffName: 'Efua Baffour',
      department: 'HR',
      date: '2026-10-28',
      checkInTime: '07:50 GMT',
      status: 'present',
      notes: 'Workforce compliance and clinic scheduling.',
    },
    {
      id: 'att-6',
      staffId: 'staff-6',
      staffName: 'Emmanuel Boateng',
      department: 'Production',
      date: '2026-10-28',
      checkInTime: '07:40 GMT',
      status: 'present',
      notes: 'Structural steel pylon frame welding.',
    },
    {
      id: 'att-7',
      staffId: 'staff-7',
      staffName: 'Kofi Owusu',
      department: 'Creative',
      date: '2026-10-28',
      checkInTime: '08:15 GMT',
      status: 'excused',
      notes: 'Remote architectural Wayfinding 3D elevations rendering.',
    },
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: 'leave-1',
      staffId: 'staff-4',
      staffName: 'Abena Osei',
      department: 'Production',
      leaveType: 'annual',
      startDate: '2026-11-03',
      endDate: '2026-11-07',
      days: 5,
      status: 'pending',
      reason: 'Annual family break after heavy quarter run.',
      submittedAt: '2026-10-25T09:00:00.000Z',
    },
    {
      id: 'leave-2',
      staffId: 'staff-6',
      staffName: 'Emmanuel Boateng',
      department: 'Production',
      leaveType: 'casual',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      days: 2,
      status: 'approved',
      reason: 'Family ceremony attendance in Kumasi.',
      submittedAt: '2026-10-20T11:30:00.000Z',
    },
  ];

  const users: WorkspaceUser[] = [
    {
      id: 'usr-admin-kojo',
      email: 'admin@collage.com.gh',
      fullName: 'Kojo Nathan',
      role: 'admin',
      status: 'active',
      office: 'Accra HQ (Ridge)',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: '2026-10-28T07:30:00.000Z',
    },
    {
      id: 'usr-marketer-nana',
      email: 'marketer@collage.com.gh',
      fullName: 'Nana Mensah',
      role: 'marketer',
      status: 'active',
      office: 'Brand & Marketing Desk',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: '2026-10-28T08:00:00.000Z',
    },
    {
      id: 'usr-hr-efua',
      email: 'hr@collage.com.gh',
      fullName: 'Efua Baffour',
      role: 'hr',
      status: 'active',
      office: 'People & Culture Desk',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLogin: '2026-10-28T07:50:00.000Z',
    },
  ];

  const auditLogs: AuditLogItem[] = [
    {
      id: 'audit-init-01',
      timestamp: '2026-10-28T07:00:00.000Z',
      actorEmail: 'system@collage.com.gh',
      action: 'SYSTEM_INITIALIZED',
      target: 'collat_erp_store_v3',
      status: 'success',
    },
    {
      id: 'audit-init-02',
      timestamp: '2026-10-28T07:30:00.000Z',
      actorEmail: 'admin@collage.com.gh',
      action: 'OPERATOR_LOGIN',
      target: 'Kojo Nathan (Executive)',
      status: 'success',
    },
    {
      id: 'audit-init-03',
      timestamp: '2026-10-28T07:50:00.000Z',
      actorEmail: 'hr@collage.com.gh',
      action: 'SAFETY_AUDIT_VERIFIED',
      target: 'Double-Harness Rigging Protocol',
      status: 'success',
    },
  ];

  return {
    clients,
    documents,
    payments,
    rentals,
    productionOrders,
    campaigns,
    showcaseLinks,
    staff,
    notices,
    attendance,
    leaveRequests,
    users,
    auditLogs,
  };
}

function loadStore(): ErpStore {
  if (typeof window === 'undefined') {
    return createInitialStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialStore();
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      } catch {
        // Ignore storage write issues
      }
      return seed;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Corrupt JSON in localStorage: immediately re-seed and overwrite corrupted storage
      const seed = createInitialStore();
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      } catch {
        // Ignore storage write issues
      }
      return seed;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const seed = createInitialStore();
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      } catch {
        // Ignore storage write issues
      }
      return seed;
    }

    const seed = createInitialStore();
    let needsResave = false;

    if (!Array.isArray(parsed.clients)) {
      parsed.clients = seed.clients;
      needsResave = true;
    }
    if (!Array.isArray(parsed.documents)) {
      parsed.documents = seed.documents;
      needsResave = true;
    }
    if (!Array.isArray(parsed.payments)) {
      parsed.payments = seed.payments;
      needsResave = true;
    }
    if (!Array.isArray(parsed.rentals)) {
      parsed.rentals = seed.rentals;
      needsResave = true;
    }
    if (!Array.isArray(parsed.productionOrders)) {
      parsed.productionOrders = seed.productionOrders;
      needsResave = true;
    }
    if (!Array.isArray(parsed.campaigns)) {
      parsed.campaigns = seed.campaigns;
      needsResave = true;
    }
    if (!Array.isArray(parsed.showcaseLinks)) {
      parsed.showcaseLinks = seed.showcaseLinks;
      needsResave = true;
    }
    if (!Array.isArray(parsed.staff)) {
      parsed.staff = seed.staff;
      needsResave = true;
    }
    if (!Array.isArray(parsed.notices)) {
      parsed.notices = seed.notices;
      needsResave = true;
    }
    if (!Array.isArray(parsed.attendance)) {
      parsed.attendance = seed.attendance;
      needsResave = true;
    }
    if (!Array.isArray(parsed.leaveRequests)) {
      parsed.leaveRequests = seed.leaveRequests;
      needsResave = true;
    }
    if (!Array.isArray(parsed.users)) {
      parsed.users = seed.users;
      needsResave = true;
    }
    if (!Array.isArray(parsed.auditLogs)) {
      parsed.auditLogs = seed.auditLogs;
      needsResave = true;
    }

    // Filter out corrupted elements inside collections if any
    parsed.clients = parsed.clients.filter(
      (c: any) =>
        c &&
        typeof c === 'object' &&
        typeof c.id === 'string' &&
        typeof c.companyName === 'string',
    );
    parsed.documents = parsed.documents.filter(
      (d: any) =>
        d &&
        typeof d === 'object' &&
        typeof d.id === 'string' &&
        typeof d.number === 'string',
    );
    parsed.payments = parsed.payments.filter(
      (p: any) =>
        p &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.documentId === 'string',
    );
    parsed.campaigns = parsed.campaigns.filter(
      (c: any) => c && typeof c === 'object' && typeof c.id === 'string',
    );
    parsed.showcaseLinks = parsed.showcaseLinks.filter(
      (s: any) => s && typeof s === 'object' && typeof s.id === 'string',
    );
    parsed.staff = parsed.staff.filter(
      (s: any) => s && typeof s === 'object' && typeof s.id === 'string',
    );
    parsed.notices = parsed.notices.filter(
      (n: any) => n && typeof n === 'object' && typeof n.id === 'string',
    );
    parsed.attendance = parsed.attendance.filter(
      (a: any) => a && typeof a === 'object' && typeof a.id === 'string',
    );
    parsed.leaveRequests = parsed.leaveRequests.filter(
      (l: any) => l && typeof l === 'object' && typeof l.id === 'string',
    );
    parsed.users = parsed.users.filter(
      (u: any) => u && typeof u === 'object' && typeof u.id === 'string',
    );
    parsed.auditLogs = parsed.auditLogs.filter(
      (a: any) => a && typeof a === 'object' && typeof a.id === 'string',
    );

    if (needsResave) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore storage quota errors
      }
    }

    return parsed as ErpStore;
  } catch {
    const seed = createInitialStore();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      // Ignore storage write issues
    }
    return seed;
  }
}

function isBrowserRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof fetch === 'function'
  );
}

export type UserRole = 'admin' | 'marketer' | 'hr';

const AUTH_TOKEN_KEY = 'collat_auth_token_v1';
const AUTH_USER_KEY = 'collat_auth_user_v1';

export interface NeonAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  office: string;
  createdAt: string;
}

export const PRESEEDED_AUTH_ACCOUNTS: Record<
  string,
  { user: NeonAuthUser; plainPassword: string }
> = {
  'admin@collage.com.gh': {
    user: {
      id: 'usr-admin-kojo',
      email: 'admin@collage.com.gh',
      firstName: 'Kojo',
      lastName: 'Nathan',
      fullName: 'Kojo Nathan',
      role: 'admin',
      office: 'Accra HQ',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
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
      office: 'Accra HQ',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
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
    plainPassword: 'Collage2026!',
  },
};

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAuthUser(): NeonAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.email && parsed.role) {
      return parsed as NeonAuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: NeonAuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function loginWithNeon(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: NeonAuthUser }> {
  const normalizedEmail = (input.email || '').trim().toLowerCase();
  const trimmedPassword = (input.password || '').trim();

  // Try live backend fetch if baseUrl is set or browser runtime has server
  if (isBrowserRuntime() && _baseUrl) {
    try {
      const res = await fetch(`${_baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.user) {
        saveAuthSession(data.token, data.user);
        return data as { token: string; user: NeonAuthUser };
      }
      if (res.status >= 400 && res.status < 500) {
        throw new ApiError(res.status, data?.error || 'Sign-in failed.', data, {
          method: 'POST',
          url: '/api/auth/login',
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      // If network unreachable, proceed to offline fallback
    }
  }

  // Offline / mock authentication fallback
  if (!normalizedEmail) {
    throw new ApiError(400, 'Email address is required.', { error: 'Email address is required.' }, {
      method: 'POST',
      url: '/api/auth/login',
    });
  }
  if (!trimmedPassword) {
    throw new ApiError(400, 'Password is required.', { error: 'Password is required.' }, {
      method: 'POST',
      url: '/api/auth/login',
    });
  }

  const account = PRESEEDED_AUTH_ACCOUNTS[normalizedEmail];
  if (!account) {
    throw new ApiError(401, 'Invalid work email or account not found.', { error: 'Invalid work email or account not found.' }, {
      method: 'POST',
      url: '/api/auth/login',
    });
  }

  if (account.plainPassword !== trimmedPassword) {
    throw new ApiError(401, 'Invalid password. Please check your credentials.', { error: 'Invalid password. Please check your credentials.' }, {
      method: 'POST',
      url: '/api/auth/login',
    });
  }

  const token = `token-${account.user.role}-${Date.now().toString(36)}`;
  saveAuthSession(token, account.user);
  return { token, user: account.user };
}

export async function registerWithNeon(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  office?: string;
}): Promise<{ token: string; user: NeonAuthUser }> {
  if (isBrowserRuntime() && _baseUrl) {
    const res = await fetch(`${_baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, data?.error || 'Registration failed.', data, {
        method: 'POST',
        url: '/api/auth/register',
      });
    }
    saveAuthSession(data.token, data.user);
    return data as { token: string; user: NeonAuthUser };
  }

  const newUser: NeonAuthUser = {
    id: genId('usr'),
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: (input.lastName || '').trim(),
    fullName: `${input.firstName} ${input.lastName || ''}`.trim(),
    role: 'admin',
    office: input.office || 'Accra HQ',
    createdAt: new Date().toISOString(),
  };
  const token = `token-registered-${Date.now().toString(36)}`;
  saveAuthSession(token, newUser);
  return { token, user: newUser };
}

export async function logoutWithNeon(): Promise<void> {
  const token = getStoredAuthToken();
  clearAuthSession();
  if (isBrowserRuntime() && token && _baseUrl) {
    try {
      await fetch(`${_baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
}

export async function fetchNeonSession(): Promise<NeonAuthUser | null> {
  const token = getStoredAuthToken();
  if (!token || !isBrowserRuntime() || !_baseUrl) return getStoredAuthUser();
  try {
    const res = await fetch(`${_baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      clearAuthSession();
      return null;
    }
    if (!res.ok) return getStoredAuthUser();
    const data = await res.json();
    if (data?.user) {
      saveAuthSession(token, data.user);
      return data.user as NeonAuthUser;
    }
    return null;
  } catch {
    return getStoredAuthUser();
  }
}

export async function syncStoreFromNeon(): Promise<boolean> {
  if (!isBrowserRuntime()) return false;
  try {
    const res = await fetch(`${_baseUrl || ''}/api/sync`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const snapshot = await res.json();
    if (snapshot && Array.isArray(snapshot.clients) && Array.isArray(snapshot.documents)) {
      saveStore(snapshot as ErpStore);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function saveStore(store: ErpStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetErpDemoData(): void {
  if (typeof window === 'undefined') return;
  const seed = createInitialStore();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/reset-demo`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((snapshot) => {
        if (snapshot && Array.isArray(snapshot.clients)) {
          saveStore(snapshot as ErpStore);
        }
      })
      .catch(() => {});
  }
}

export function getDocumentPayments(documentId: string): Payment[] {
  const store = loadStore();
  const payments = Array.isArray(store.payments) ? store.payments : [];
  return payments
    .filter((p) => p.documentId === documentId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

export function getOperationsData(): {
  rentals: RentalBooking[];
  productionOrders: ProductionOrder[];
} {
  const store = loadStore();
  return {
    rentals: Array.isArray(store.rentals) ? store.rentals : [],
    productionOrders: Array.isArray(store.productionOrders) ? store.productionOrders : [],
  };
}

export function updateRentalStatus(
  id: string,
  status: RentalBooking['status'],
): RentalBooking[] {
  const store = loadStore();
  const rental = store.rentals.find((r) => r.id === id);
  if (rental) {
    rental.status = status;
    saveStore(store);
  }
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/operations/rentals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.rentals) {
          const latest = loadStore();
          latest.rentals = data.rentals;
          saveStore(latest);
        }
      })
      .catch(() => {});
  }
  return store.rentals;
}

export function createRentalBooking(
  input: Omit<RentalBooking, 'id'>,
): RentalBooking[] {
  const store = loadStore();
  store.rentals.unshift({
    ...input,
    id: genId('rent'),
  });
  saveStore(store);
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/operations/rentals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.rentals) {
          const latest = loadStore();
          latest.rentals = data.rentals;
          saveStore(latest);
        }
      })
      .catch(() => {});
  }
  return store.rentals;
}

export function updateProductionOrderStatus(
  id: string,
  status: ProductionOrder['status'],
): ProductionOrder[] {
  const store = loadStore();
  const order = store.productionOrders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    saveStore(store);
  }
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/operations/production/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.productionOrders) {
          const latest = loadStore();
          latest.productionOrders = data.productionOrders;
          saveStore(latest);
        }
      })
      .catch(() => {});
  }
  return store.productionOrders;
}

export function createProductionOrder(
  input: Omit<ProductionOrder, 'id' | 'jobCode'>,
): ProductionOrder[] {
  const store = loadStore();
  const nextNum = String(store.productionOrders.length + 45).padStart(3, '0');
  store.productionOrders.unshift({
    ...input,
    id: genId('prod'),
    jobCode: `PDP-2610-${nextNum}`,
  });
  saveStore(store);
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/operations/production`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.productionOrders) {
          const latest = loadStore();
          latest.productionOrders = data.productionOrders;
          saveStore(latest);
        }
      })
      .catch(() => {});
  }
  return store.productionOrders;
}

export function deleteDocumentById(id: string): void {
  const store = loadStore();
  store.documents = (Array.isArray(store.documents) ? store.documents : []).filter((d) => d.id !== id);
  store.payments = (Array.isArray(store.payments) ? store.payments : []).filter((p) => p.documentId !== id);
  saveStore(store);
  if (isBrowserRuntime()) {
    void fetch(`${_baseUrl || ''}/api/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then(() => syncStoreFromNeon())
      .catch(() => {});
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dateOnly(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function documentPrefix(date: string, kind: 'quotation' | 'invoice'): string {
  const [year, month, day] = date.split('-');
  const datePart = `00${day}${month}${year.slice(-2)}`;
  return kind === 'invoice' ? datePart : `QT${datePart}`;
}

function nextDocumentNumber(
  store: ErpStore,
  issueDate: string,
  kind: 'quotation' | 'invoice',
): string {
  const prefix = documentPrefix(issueDate, kind);
  const existing = (Array.isArray(store.documents) ? store.documents : []).filter(
    (doc) => (typeof doc.issueDate === 'string' ? doc.issueDate.slice(0, 10) : '') === issueDate && doc.kind === kind,
  );
  const next =
    existing.reduce((max, row) => {
      const sequence = Number(row.number.split('.').at(-1));
      return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
    }, 0) + 1;
  return `${prefix}.${String(next).padStart(2, '0')}`;
}

function hydrateDocument(store: ErpStore, doc: StoredDocument): SalesDocument {
  const clients = Array.isArray(store.clients) ? store.clients : [];
  const client = clients.find((c) => c.id === doc.clientId);
  const payments = Array.isArray(store.payments) ? store.payments : [];
  const paidCents = payments
    .filter((p) => p.documentId === doc.id)
    .reduce((sum, p) => sum + amountToCents(p.amount), 0);
  const totalCents = amountToCents(doc.total ?? 0);
  const balanceCents = Math.max(0, totalCents - paidCents);

  return {
    ...doc,
    items: Array.isArray(doc.items) ? doc.items : [],
    clientName: client?.companyName ?? 'Client',
    amountPaid: Number(centsToAmount(paidCents)),
    balance: Number(centsToAmount(balanceCents)),
  };
}

function handleApiRequest(
  method: string,
  rawUrl: string,
  bodyText?: string | null,
): unknown {
  const urlObj = new URL(rawUrl, 'http://localhost:3000');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const store = loadStore();

  const parseBody = <T>(): T => {
    if (!bodyText) return {} as T;
    return JSON.parse(bodyText) as T;
  };

  // GET /api/healthz
  if (method === 'GET' && pathname === '/api/healthz') {
    const res: HealthStatus = { status: 'ok' };
    return res;
  }

  // GET /api/dashboard/summary
  if (method === 'GET' && pathname === '/api/dashboard/summary') {
    const clients = Array.isArray(store.clients) ? store.clients : [];
    const documents = Array.isArray(store.documents) ? store.documents : [];
    const payments = Array.isArray(store.payments) ? store.payments : [];

    const activeClients = clients.filter((c) => c.status !== 'archived');
    const invoiceDocs = documents
      .filter(
        (d) =>
          d.kind === 'invoice' &&
          d.status !== 'draft' &&
          d.status !== 'cancelled',
      )
      .map((d) => hydrateDocument(store, d));

    const activeQuotes = documents.filter(
      (d) =>
        d.kind === 'quotation' &&
        ['draft', 'issued', 'accepted'].includes(d.status),
    );

    const collectedCents = payments.reduce(
      (sum, p) => sum + amountToCents(p.amount),
      0,
    );

    const outstandingCents = invoiceDocs.reduce(
      (sum, inv) => sum + amountToCents(inv.balance),
      0,
    );

    const recentClients: ActivityItem[] = [...clients]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((c) => ({
        id: `client:${c.id}`,
        title: 'Client record active',
        detail: `${c.companyName}${c.city ? ` · ${c.city}` : ''}`,
        date: c.createdAt,
        kind: 'client',
      }));

    const recentDocs: ActivityItem[] = [...documents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((d) => ({
        id: `document:${d.kind}:${d.id}`,
        title: d.kind === 'quotation' ? 'Quotation issued' : 'Invoice issued',
        detail: `${d.number} · ${d.subject}`,
        date: d.createdAt,
        kind: d.kind,
      }));

    const recentPayments: ActivityItem[] = [...payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((p) => {
        const doc = documents.find((d) => d.id === p.documentId);
        const client = clients.find((c) => c.id === doc?.clientId);
        return {
          id: `payment:${doc?.id ?? p.id}`,
          title: 'Payment recorded',
          detail: `${doc?.number ?? '00221026.01'} · ${client?.companyName ?? 'Client'} · GH₵ ${Number(p.amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          date: p.createdAt,
          kind: 'payment',
        };
      });

    const recentActivity = [...recentClients, ...recentDocs, ...recentPayments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    const summary: DashboardSummary = {
      totalClients: activeClients.length,
      activeQuotes: activeQuotes.length,
      openInvoices: invoiceDocs.filter((inv) => inv.balance > 0).length,
      collectedThisMonth: Number(centsToAmount(collectedCents)),
      outstandingBalance: Number(centsToAmount(outstandingCents)),
      recentActivity,
    };
    return summary;
  }

  // GET /api/clients
  if (method === 'GET' && pathname === '/api/clients') {
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim().toLowerCase();
    return [...store.clients]
      .filter((c) => {
        if (status && c.status !== status) return false;
        if (search) {
          const hay = `${c.companyName} ${c.contactName ?? ''} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // POST /api/clients
  if (method === 'POST' && pathname === '/api/clients') {
    const input = parseBody<ClientInput>();
    if (!input.companyName?.trim()) {
      throw new ApiError(400, 'Company name is required.', { error: 'Company name is required.' }, { method, url: rawUrl });
    }
    const nowIso = new Date().toISOString();
    const created: Client = {
      id: genId('cli'),
      companyName: input.companyName.trim(),
      contactName: input.contactName?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || 'Ghana',
      status: input.status ?? 'lead',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.clients.unshift(created);
    saveStore(store);
    return created;
  }

  // /api/clients/:id/archive
  const archiveMatch = pathname.match(/^\/api\/clients\/([^/]+)\/archive$/);
  if (method === 'POST' && archiveMatch) {
    const id = decodeURIComponent(archiveMatch[1]);
    const client = store.clients.find((c) => c.id === id);
    if (!client) {
      throw new ApiError(404, 'Client not found.', { error: 'Client not found.' }, { method, url: rawUrl });
    }
    client.status = 'archived';
    client.updatedAt = new Date().toISOString();
    saveStore(store);
    return client;
  }

  // GET or PATCH /api/clients/:id
  const clientMatch = pathname.match(/^\/api\/clients\/([^/]+)$/);
  if (clientMatch) {
    const id = decodeURIComponent(clientMatch[1]);
    const client = store.clients.find((c) => c.id === id);
    if (!client) {
      throw new ApiError(404, 'Client not found.', { error: 'Client not found.' }, { method, url: rawUrl });
    }
    if (method === 'GET') {
      return client;
    }
    if (method === 'PATCH') {
      const input = parseBody<ClientUpdate>();
      if (input.companyName !== undefined) client.companyName = input.companyName.trim();
      if (input.contactName !== undefined) client.contactName = input.contactName?.trim() || null;
      if (input.email !== undefined) client.email = input.email?.trim() || null;
      if (input.phone !== undefined) client.phone = input.phone?.trim() || null;
      if (input.address !== undefined) client.address = input.address?.trim() || null;
      if (input.city !== undefined) client.city = input.city?.trim() || null;
      if (input.country !== undefined) client.country = input.country.trim();
      if (input.status !== undefined) client.status = input.status;
      client.updatedAt = new Date().toISOString();
      saveStore(store);
      return client;
    }
  }

  // GET /api/documents
  if (method === 'GET' && pathname === '/api/documents') {
    const kind = searchParams.get('kind');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim().toLowerCase();

    return store.documents
      .map((d) => hydrateDocument(store, d))
      .filter((d) => {
        if (kind && d.kind !== kind) return false;
        if (status && d.status !== status) return false;
        if (search) {
          const hay = `${d.number} ${d.subject} ${d.clientName}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // POST /api/documents
  if (method === 'POST' && pathname === '/api/documents') {
    const input = parseBody<DocumentInput>();
    const client = store.clients.find((c) => c.id === input.clientId);
    if (!client || client.status === 'archived') {
      throw new ApiError(400, 'Choose an active client before saving.', { error: 'Choose an active client before saving.' }, { method, url: rawUrl });
    }
    const issueDate = dateOnly(input.issueDate);
    if (!issueDate) {
      throw new ApiError(400, 'An issue date is required.', { error: 'An issue date is required.' }, { method, url: rawUrl });
    }
    if (!Array.isArray(input.items)) {
      throw new ApiError(400, 'Items must be an array.', { error: 'Items must be an array.' }, { method, url: rawUrl });
    }
    const pricing = calculateDocumentPricing({
      items: input.items,
      discountPercent: input.discountPercent ?? 0,
      getfundRate: input.getfundRate ?? 2.5,
      nhilRate: input.nhilRate ?? 2.5,
      vatRate: input.vatRate ?? 15,
    });
    const number = nextDocumentNumber(store, issueDate, input.kind);
    const nowIso = new Date().toISOString();
    const created: StoredDocument = {
      id: genId('doc'),
      number,
      kind: input.kind,
      clientId: input.clientId,
      subject: input.subject.trim(),
      issueDate,
      dueDate: dateOnly(input.dueDate),
      status: input.status ?? 'issued',
      items: pricing.items,
      subtotal: Number(pricing.subtotal),
      discountPercent: Number(pricing.discountPercent),
      discountAmount: Number(pricing.discountAmount),
      getfundRate: Number(pricing.getfundRate),
      getfundAmount: Number(pricing.getfundAmount),
      nhilRate: Number(pricing.nhilRate),
      nhilAmount: Number(pricing.nhilAmount),
      vatRate: Number(pricing.vatRate),
      vatAmount: Number(pricing.vatAmount),
      total: Number(pricing.total),
      paymentTerms: input.paymentTerms || '100% Down Payment',
      validityDays: input.validityDays ?? 5,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.documents.unshift(created);
    saveStore(store);
    return hydrateDocument(store, created);
  }

  // POST /api/documents/:id/convert
  const convertMatch = pathname.match(/^\/api\/documents\/([^/]+)\/convert$/);
  if (method === 'POST' && convertMatch) {
    const id = decodeURIComponent(convertMatch[1]);
    const quotation = store.documents.find((d) => d.id === id);
    if (!quotation || quotation.kind !== 'quotation') {
      throw new ApiError(404, 'Quotation not found.', { error: 'Quotation not found.' }, { method, url: rawUrl });
    }
    if (quotation.status === 'declined' || quotation.status === 'cancelled') {
      throw new ApiError(400, 'Declined or cancelled quotations cannot become invoices.', { error: 'Declined or cancelled quotations cannot become invoices.' }, { method, url: rawUrl });
    }
    quotation.status = 'accepted';
    const nowIso = new Date().toISOString();
    quotation.updatedAt = nowIso;

    const issueDate = nowIso.slice(0, 10);
    const number = nextDocumentNumber(store, issueDate, 'invoice');
    const createdInvoice: StoredDocument = {
      id: genId('doc'),
      number,
      kind: 'invoice',
      clientId: quotation.clientId,
      subject: quotation.subject,
      issueDate,
      dueDate: quotation.dueDate,
      status: 'issued',
      items: quotation.items,
      subtotal: quotation.subtotal,
      discountPercent: quotation.discountPercent,
      discountAmount: quotation.discountAmount,
      getfundRate: quotation.getfundRate,
      getfundAmount: quotation.getfundAmount,
      nhilRate: quotation.nhilRate,
      nhilAmount: quotation.nhilAmount,
      vatRate: quotation.vatRate,
      vatAmount: quotation.vatAmount,
      total: quotation.total,
      paymentTerms: quotation.paymentTerms,
      validityDays: quotation.validityDays,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.documents.unshift(createdInvoice);
    saveStore(store);
    return hydrateDocument(store, createdInvoice);
  }

  // POST /api/documents/:id/payments
  const paymentMatch = pathname.match(/^\/api\/documents\/([^/]+)\/payments$/);
  if (method === 'POST' && paymentMatch) {
    const id = decodeURIComponent(paymentMatch[1]);
    const doc = store.documents.find((d) => d.id === id);
    if (!doc) {
      throw new ApiError(404, 'Document not found.', { error: 'Document not found.' }, { method, url: rawUrl });
    }
    if (doc.kind !== 'invoice') {
      throw new ApiError(400, 'Payments can only be recorded against invoices.', { error: 'Payments can only be recorded against invoices.' }, { method, url: rawUrl });
    }
    const input = parseBody<PaymentInput>();
    const payments = Array.isArray(store.payments) ? store.payments : [];
    const paidCents = payments
      .filter((p) => p.documentId === doc.id)
      .reduce((sum, p) => sum + amountToCents(p.amount), 0);
    const amountCents = amountToCents(input.amount);
    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || isNaN(input.amount) || amountCents < 1) {
      throw new ApiError(400, 'Payments must be at least GHS 0.01.', { error: 'Payments must be at least GHS 0.01.' }, { method, url: rawUrl });
    }
    const totalCents = amountToCents(doc.total);
    const balanceCents = totalCents - paidCents;
    if (amountCents > balanceCents) {
      throw new ApiError(400, 'Payment exceeds the remaining invoice balance.', { error: 'Payment exceeds the remaining invoice balance.' }, { method, url: rawUrl });
    }

    const nowIso = new Date().toISOString();
    const payment: Payment = {
      id: genId('pay'),
      documentId: doc.id,
      amount: Number(centsToAmount(amountCents)),
      paymentDate: dateOnly(input.paymentDate) || nowIso.slice(0, 10),
      method: input.method,
      reference: input.reference?.trim() || null,
      createdAt: nowIso,
    };
    if (!Array.isArray(store.payments)) {
      store.payments = [];
    }
    store.payments.unshift(payment);

    const nextPaidCents = paidCents + amountCents;
    doc.status = nextPaidCents >= totalCents ? 'paid' : 'partially_paid';
    doc.updatedAt = nowIso;
    saveStore(store);
    return payment;
  }

  // GET or PATCH /api/documents/:id
  const docMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
  if (docMatch) {
    const id = decodeURIComponent(docMatch[1]);
    const doc = store.documents.find((d) => d.id === id);
    if (!doc) {
      throw new ApiError(404, 'Document not found.', { error: 'Document not found.' }, { method, url: rawUrl });
    }
    if (method === 'GET') {
      return hydrateDocument(store, doc);
    }
    if (method === 'PATCH') {
      const input = parseBody<DocumentUpdate>();
      if (input.subject !== undefined) doc.subject = input.subject.trim();
      if (input.issueDate !== undefined) {
        const d = dateOnly(input.issueDate);
        if (d) doc.issueDate = d;
      }
      if (input.dueDate !== undefined) {
        doc.dueDate = dateOnly(input.dueDate);
      }
      if (input.status !== undefined) {
        doc.status = input.status;
      }
      if (input.paymentTerms !== undefined) {
        doc.paymentTerms = input.paymentTerms;
      }
      if (input.validityDays !== undefined) {
        doc.validityDays = input.validityDays;
      }

      if (
        input.items !== undefined ||
        input.discountPercent !== undefined ||
        input.getfundRate !== undefined ||
        input.nhilRate !== undefined ||
        input.vatRate !== undefined
      ) {
        const pricing = calculateDocumentPricing({
          items: (input.items ?? doc.items) as LineInput[],
          discountPercent: input.discountPercent ?? doc.discountPercent,
          getfundRate: input.getfundRate ?? doc.getfundRate,
          nhilRate: input.nhilRate ?? doc.nhilRate,
          vatRate: input.vatRate ?? doc.vatRate,
        });
        doc.items = pricing.items;
        doc.subtotal = Number(pricing.subtotal);
        doc.discountPercent = Number(pricing.discountPercent);
        doc.discountAmount = Number(pricing.discountAmount);
        doc.getfundRate = Number(pricing.getfundRate);
        doc.getfundAmount = Number(pricing.getfundAmount);
        doc.nhilRate = Number(pricing.nhilRate);
        doc.nhilAmount = Number(pricing.nhilAmount);
        doc.vatRate = Number(pricing.vatRate);
        doc.vatAmount = Number(pricing.vatAmount);
        doc.total = Number(pricing.total);
      }

      doc.updatedAt = new Date().toISOString();
      saveStore(store);
      return hydrateDocument(store, doc);
    }
  }

  // ==========================================================================
  // MARKETER WORKFLOW ENDPOINTS (/api/marketer/*)
  // ==========================================================================

  // GET /api/marketer/leads
  if (method === 'GET' && pathname === '/api/marketer/leads') {
    const search = searchParams.get('search')?.trim().toLowerCase();
    const leads = (Array.isArray(store.clients) ? store.clients : []).filter((c) => c.status === 'lead');
    if (!search) return leads;
    return leads.filter((c) => {
      const hay = `${c.companyName} ${c.contactName ?? ''} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
      return hay.includes(search);
    });
  }

  // POST /api/marketer/leads
  if (method === 'POST' && pathname === '/api/marketer/leads') {
    const input = parseBody<ClientInput>();
    if (!input.companyName?.trim()) {
      throw new ApiError(400, 'Company name is required.', { error: 'Company name is required.' }, { method, url: rawUrl });
    }
    const nowIso = new Date().toISOString();
    const createdLead: Client = {
      id: genId('cli'),
      companyName: input.companyName.trim(),
      contactName: input.contactName?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || 'Ghana',
      status: 'lead',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.clients.unshift(createdLead);
    saveStore(store);
    return createdLead;
  }

  // POST /api/marketer/leads/:id/convert
  const leadConvertMatch = pathname.match(/^\/api\/marketer\/leads\/([^/]+)\/convert$/);
  if (method === 'POST' && leadConvertMatch) {
    const id = decodeURIComponent(leadConvertMatch[1]);
    const client = store.clients.find((c) => c.id === id);
    if (!client) {
      throw new ApiError(404, 'Client lead not found.', { error: 'Client lead not found.' }, { method, url: rawUrl });
    }
    client.status = 'active';
    client.updatedAt = new Date().toISOString();
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'marketer@collage.com.gh',
      action: 'CLIENT_CONVERTED',
      target: client.companyName,
      status: 'success',
    });
    saveStore(store);
    return client;
  }

  // GET /api/marketer/campaigns
  if (method === 'GET' && pathname === '/api/marketer/campaigns') {
    return Array.isArray(store.campaigns) ? store.campaigns : [];
  }

  // POST /api/marketer/campaigns
  if (method === 'POST' && pathname === '/api/marketer/campaigns') {
    const input = parseBody<Partial<MarketingCampaign>>();
    if (!input.name?.trim()) {
      throw new ApiError(400, 'Campaign name is required.', { error: 'Campaign name is required.' }, { method, url: rawUrl });
    }
    const newCamp: MarketingCampaign = {
      id: genId('camp'),
      name: input.name.trim(),
      targetService: input.targetService || 'billboards',
      budget: Number(input.budget) || 0,
      spent: Number(input.spent) || 0,
      startDate: input.startDate || new Date().toISOString().slice(0, 10),
      endDate: input.endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: input.status || 'planning',
      leadsGenerated: Number(input.leadsGenerated) || 0,
      conversions: Number(input.conversions) || 0,
      notes: input.notes?.trim() || '',
    };
    if (!Array.isArray(store.campaigns)) store.campaigns = [];
    store.campaigns.unshift(newCamp);
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'marketer@collage.com.gh',
      action: 'CAMPAIGN_CREATED',
      target: newCamp.name,
      status: 'success',
    });
    saveStore(store);
    return newCamp;
  }

  // GET, PATCH, DELETE /api/marketer/campaigns/:id
  const campMatch = pathname.match(/^\/api\/marketer\/campaigns\/([^/]+)$/);
  if (campMatch) {
    const id = decodeURIComponent(campMatch[1]);
    const camp = (Array.isArray(store.campaigns) ? store.campaigns : []).find((c) => c.id === id);
    if (!camp) {
      throw new ApiError(404, 'Campaign not found.', { error: 'Campaign not found.' }, { method, url: rawUrl });
    }
    if (method === 'GET') return camp;
    if (method === 'PATCH') {
      const input = parseBody<Partial<MarketingCampaign>>();
      if (input.name !== undefined) camp.name = input.name.trim();
      if (input.targetService !== undefined) camp.targetService = input.targetService;
      if (input.budget !== undefined) camp.budget = Number(input.budget);
      if (input.spent !== undefined) camp.spent = Number(input.spent);
      if (input.startDate !== undefined) camp.startDate = input.startDate;
      if (input.endDate !== undefined) camp.endDate = input.endDate;
      if (input.status !== undefined) camp.status = input.status;
      if (input.leadsGenerated !== undefined) camp.leadsGenerated = Number(input.leadsGenerated);
      if (input.conversions !== undefined) camp.conversions = Number(input.conversions);
      if (input.notes !== undefined) camp.notes = input.notes.trim();
      saveStore(store);
      return camp;
    }
    if (method === 'DELETE') {
      store.campaigns = (Array.isArray(store.campaigns) ? store.campaigns : []).filter((c) => c.id !== id);
      saveStore(store);
      return { success: true };
    }
  }

  // GET /api/marketer/showcase
  if (method === 'GET' && pathname === '/api/marketer/showcase') {
    return Array.isArray(store.showcaseLinks) ? store.showcaseLinks : [];
  }

  // POST /api/marketer/showcase
  if (method === 'POST' && pathname === '/api/marketer/showcase') {
    const input = parseBody<{ serviceCategory: ServiceCategory | 'all'; clientName?: string }>();
    const link = generateShowcaseLink(input.serviceCategory || 'all', input.clientName);
    if (!Array.isArray(store.showcaseLinks)) store.showcaseLinks = [];
    store.showcaseLinks.unshift(link);
    saveStore(store);
    return link;
  }

  // POST /api/marketer/showcase/:id/click
  const showcaseClickMatch = pathname.match(/^\/api\/marketer\/showcase\/([^/]+)\/click$/);
  if (method === 'POST' && showcaseClickMatch) {
    const id = decodeURIComponent(showcaseClickMatch[1]);
    const link = (Array.isArray(store.showcaseLinks) ? store.showcaseLinks : []).find((l) => l.id === id);
    if (link) {
      link.clicks += 1;
      saveStore(store);
      return link;
    }
    throw new ApiError(404, 'Showcase link not found.', { error: 'Showcase link not found.' }, { method, url: rawUrl });
  }

  // ==========================================================================
  // HR WORKFLOW ENDPOINTS (/api/hr/*)
  // ==========================================================================

  // GET /api/hr/staff
  if (method === 'GET' && pathname === '/api/hr/staff') {
    const dept = searchParams.get('department');
    const stat = searchParams.get('status');
    const search = searchParams.get('search')?.trim().toLowerCase();
    const staffList = Array.isArray(store.staff) ? store.staff : [];
    return staffList.filter((s) => {
      if (dept && s.department !== dept) return false;
      if (stat && s.status !== stat) return false;
      if (search) {
        const hay = `${s.fullName} ${s.employeeId} ${s.role} ${s.email} ${s.location}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  // POST /api/hr/staff
  if (method === 'POST' && pathname === '/api/hr/staff') {
    const input = parseBody<Partial<StaffMember>>();
    if (!input.fullName?.trim()) {
      throw new ApiError(400, 'Full name is required.', { error: 'Full name is required.' }, { method, url: rawUrl });
    }
    const staffList = Array.isArray(store.staff) ? store.staff : [];
    const nextColNum = String(staffList.length + 50).padStart(3, '0');
    const createdStaff: StaffMember = {
      id: genId('staff'),
      employeeId: input.employeeId?.trim() || `COL-${nextColNum}`,
      fullName: input.fullName.trim(),
      email: input.email?.trim() || `staff.${Date.now()}@collage.com.gh`,
      phone: input.phone?.trim() || '+233 24 000 0000',
      role: input.role?.trim() || 'Operations Specialist',
      department: (input.department as StaffDepartment) || 'Production',
      status: (input.status as StaffStatus) || 'active',
      joinDate: input.joinDate || new Date().toISOString().slice(0, 10),
      location: input.location?.trim() || 'Accra HQ',
    };
    if (!Array.isArray(store.staff)) store.staff = [];
    store.staff.unshift(createdStaff);
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'hr@collage.com.gh',
      action: 'STAFF_CREATED',
      target: createdStaff.fullName,
      status: 'success',
    });
    saveStore(store);
    return createdStaff;
  }

  // GET, PATCH, DELETE /api/hr/staff/:id
  const staffMatch = pathname.match(/^\/api\/hr\/staff\/([^/]+)$/);
  if (staffMatch) {
    const id = decodeURIComponent(staffMatch[1]);
    const member = (Array.isArray(store.staff) ? store.staff : []).find((s) => s.id === id);
    if (!member) {
      throw new ApiError(404, 'Staff member not found.', { error: 'Staff member not found.' }, { method, url: rawUrl });
    }
    if (method === 'GET') return member;
    if (method === 'PATCH') {
      const input = parseBody<Partial<StaffMember>>();
      if (input.fullName !== undefined) member.fullName = input.fullName.trim();
      if (input.email !== undefined) member.email = input.email.trim();
      if (input.phone !== undefined) member.phone = input.phone.trim();
      if (input.role !== undefined) member.role = input.role.trim();
      if (input.department !== undefined) member.department = input.department as StaffDepartment;
      if (input.status !== undefined) member.status = input.status as StaffStatus;
      if (input.location !== undefined) member.location = input.location.trim();
      saveStore(store);
      return member;
    }
    if (method === 'DELETE') {
      store.staff = (Array.isArray(store.staff) ? store.staff : []).filter((s) => s.id !== id);
      saveStore(store);
      return { success: true };
    }
  }

  // GET /api/hr/notices
  if (method === 'GET' && pathname === '/api/hr/notices') {
    const notices = Array.isArray(store.notices) ? store.notices : [];
    return sortInternalNotices(notices);
  }

  // POST /api/hr/notices
  if (method === 'POST' && pathname === '/api/hr/notices') {
    const input = parseBody<Partial<InternalNotice>>();
    if (!input.title?.trim() || !input.content?.trim()) {
      throw new ApiError(400, 'Title and content are required.', { error: 'Title and content are required.' }, { method, url: rawUrl });
    }
    const notice: InternalNotice = {
      id: genId('not'),
      title: input.title.trim(),
      content: input.content.trim(),
      priority: (input.priority as NoticePriority) || 'medium',
      category: (input.category as NoticeCategory) || 'general',
      author: input.author?.trim() || 'People & Culture Desk',
      datePosted: input.datePosted || new Date().toISOString().slice(0, 10),
      pinned: Boolean(input.pinned),
    };
    if (!Array.isArray(store.notices)) store.notices = [];
    store.notices.unshift(notice);
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'hr@collage.com.gh',
      action: 'NOTICE_POSTED',
      target: notice.title,
      status: 'success',
    });
    saveStore(store);
    return notice;
  }

  // DELETE /api/hr/notices/:id
  const noticeMatch = pathname.match(/^\/api\/hr\/notices\/([^/]+)$/);
  if (method === 'DELETE' && noticeMatch) {
    const id = decodeURIComponent(noticeMatch[1]);
    store.notices = (Array.isArray(store.notices) ? store.notices : []).filter((n) => n.id !== id);
    saveStore(store);
    return { success: true };
  }

  // GET /api/hr/attendance
  if (method === 'GET' && pathname === '/api/hr/attendance') {
    const dateParam = searchParams.get('date');
    const staffIdParam = searchParams.get('staffId');
    const records = Array.isArray(store.attendance) ? store.attendance : [];
    return records.filter((a) => {
      if (dateParam && a.date !== dateParam) return false;
      if (staffIdParam && a.staffId !== staffIdParam) return false;
      return true;
    });
  }

  // POST /api/hr/attendance
  if (method === 'POST' && pathname === '/api/hr/attendance') {
    const input = parseBody<Partial<AttendanceRecord>>();
    if (!input.staffId || !input.staffName) {
      throw new ApiError(400, 'Staff identity is required for attendance check-in.', { error: 'Staff identity is required.' }, { method, url: rawUrl });
    }
    const record: AttendanceRecord = {
      id: genId('att'),
      staffId: input.staffId,
      staffName: input.staffName,
      department: (input.department as StaffDepartment) || 'Production',
      date: input.date || new Date().toISOString().slice(0, 10),
      checkInTime: input.checkInTime || '08:00 GMT',
      checkOutTime: input.checkOutTime || null,
      status: (input.status as AttendanceStatus) || 'present',
      notes: input.notes?.trim() || null,
    };
    if (!Array.isArray(store.attendance)) store.attendance = [];
    store.attendance.unshift(record);
    saveStore(store);
    return record;
  }

  // GET /api/hr/leave
  if (method === 'GET' && pathname === '/api/hr/leave') {
    return Array.isArray(store.leaveRequests) ? store.leaveRequests : [];
  }

  // POST /api/hr/leave
  if (method === 'POST' && pathname === '/api/hr/leave') {
    const input = parseBody<Partial<LeaveRequest>>();
    if (!input.startDate || !input.endDate) {
      throw new ApiError(400, 'Start date and end date are required.', { error: 'Dates required.' }, { method, url: rawUrl });
    }
    if (new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) {
      throw new ApiError(400, 'End date cannot precede start date.', { error: 'Invalid dates.' }, { method, url: rawUrl });
    }
    if (!input.days || Number(input.days) <= 0) {
      throw new ApiError(400, 'Leave days must be greater than zero.', { error: 'Invalid days.' }, { method, url: rawUrl });
    }
    const leave: LeaveRequest = {
      id: genId('leave'),
      staffId: input.staffId || 'staff-1',
      staffName: input.staffName || 'Staff Member',
      department: (input.department as StaffDepartment) || 'Production',
      leaveType: (input.leaveType as LeaveType) || 'annual',
      startDate: input.startDate,
      endDate: input.endDate,
      days: Number(input.days),
      status: 'pending',
      reason: input.reason?.trim() || 'Personal leave request.',
      submittedAt: new Date().toISOString(),
    };
    if (!Array.isArray(store.leaveRequests)) store.leaveRequests = [];
    store.leaveRequests.unshift(leave);
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'hr@collage.com.gh',
      action: 'LEAVE_REQUEST_SUBMITTED',
      target: `${leave.staffName} (${leave.days} days)`,
      status: 'success',
    });
    saveStore(store);
    return leave;
  }

  // PATCH /api/hr/leave/:id
  const leaveMatch = pathname.match(/^\/api\/hr\/leave\/([^/]+)$/);
  if (method === 'PATCH' && leaveMatch) {
    const id = decodeURIComponent(leaveMatch[1]);
    const leave = (Array.isArray(store.leaveRequests) ? store.leaveRequests : []).find((l) => l.id === id);
    if (!leave) {
      throw new ApiError(404, 'Leave request not found.', { error: 'Leave request not found.' }, { method, url: rawUrl });
    }
    const input = parseBody<Partial<LeaveRequest>>();
    if (input.status) {
      leave.status = input.status;
      if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
      store.auditLogs.unshift({
        id: genId('audit'),
        timestamp: new Date().toISOString(),
        actorEmail: 'hr@collage.com.gh',
        action: `LEAVE_${input.status.toUpperCase()}`,
        target: `${leave.staffName} (${leave.days} days)`,
        status: 'success',
      });
    }
    saveStore(store);
    return leave;
  }

  // ==========================================================================
  // ADMIN WORKFLOW ENDPOINTS (/api/admin/*)
  // ==========================================================================

  // GET /api/admin/users
  if (method === 'GET' && pathname === '/api/admin/users') {
    return Array.isArray(store.users) ? store.users : [];
  }

  // POST /api/admin/users
  if (method === 'POST' && pathname === '/api/admin/users') {
    const input = parseBody<Partial<WorkspaceUser>>();
    if (!input.email?.trim() || !input.fullName?.trim()) {
      throw new ApiError(400, 'Email and full name are required.', { error: 'Missing fields.' }, { method, url: rawUrl });
    }
    const validRoles: WorkspaceRole[] = ['admin', 'marketer', 'hr'];
    const role = (input.role as WorkspaceRole) || 'marketer';
    if (!validRoles.includes(role)) {
      throw new ApiError(400, `Invalid role: ${input.role}. Must be admin, marketer, or hr.`, { error: 'Invalid role.' }, { method, url: rawUrl });
    }
    const newUser: WorkspaceUser = {
      id: genId('usr'),
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      role,
      status: input.status || 'active',
      office: input.office?.trim() || 'Accra HQ',
      createdAt: new Date().toISOString(),
    };
    if (!Array.isArray(store.users)) store.users = [];
    store.users.unshift(newUser);
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'admin@collage.com.gh',
      action: 'USER_CREATED',
      target: newUser.email,
      status: 'success',
    });
    saveStore(store);
    return newUser;
  }

  // PATCH /api/admin/users/:id
  const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (method === 'PATCH' && userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    const user = (Array.isArray(store.users) ? store.users : []).find((u) => u.id === id);
    if (!user) {
      throw new ApiError(404, 'User not found.', { error: 'User not found.' }, { method, url: rawUrl });
    }
    const input = parseBody<Partial<WorkspaceUser>>();
    if (input.role !== undefined) {
      const validRoles: WorkspaceRole[] = ['admin', 'marketer', 'hr'];
      if (!validRoles.includes(input.role as WorkspaceRole)) {
        throw new ApiError(400, `Invalid role: ${input.role}. Must be admin, marketer, or hr.`, { error: 'Invalid role.' }, { method, url: rawUrl });
      }
      user.role = input.role as WorkspaceRole;
    }
    if (input.status !== undefined) {
      user.status = input.status;
    }
    if (input.office !== undefined) {
      user.office = input.office.trim();
    }
    if (input.fullName !== undefined) {
      user.fullName = input.fullName.trim();
    }
    if (!Array.isArray(store.auditLogs)) store.auditLogs = [];
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'admin@collage.com.gh',
      action: 'USER_ROLE_CHANGED',
      target: `${user.email} -> ${user.role} (${user.status})`,
      status: 'success',
    });
    saveStore(store);
    return user;
  }

  // GET /api/admin/permissions
  if (method === 'GET' && pathname === '/api/admin/permissions') {
    return {
      admin: getCapabilitiesForRole('admin'),
      marketer: getCapabilitiesForRole('marketer'),
      hr: getCapabilitiesForRole('hr'),
    };
  }

  // GET /api/admin/audit-logs
  if (method === 'GET' && pathname === '/api/admin/audit-logs') {
    const logs = Array.isArray(store.auditLogs) ? store.auditLogs : [];
    return [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  // GET /api/admin/system-status
  if (method === 'GET' && pathname === '/api/admin/system-status') {
    return computeSystemStorageMetrics();
  }

  // POST /api/admin/self-heal
  if (method === 'POST' && pathname === '/api/admin/self-heal') {
    const initial = createInitialStore();
    if (!Array.isArray(store.campaigns)) store.campaigns = initial.campaigns;
    if (!Array.isArray(store.showcaseLinks)) store.showcaseLinks = initial.showcaseLinks;
    if (!Array.isArray(store.staff)) store.staff = initial.staff;
    if (!Array.isArray(store.notices)) store.notices = initial.notices;
    if (!Array.isArray(store.attendance)) store.attendance = initial.attendance;
    if (!Array.isArray(store.leaveRequests)) store.leaveRequests = initial.leaveRequests;
    if (!Array.isArray(store.users)) store.users = initial.users;
    if (!Array.isArray(store.auditLogs)) store.auditLogs = initial.auditLogs;
    store.auditLogs.unshift({
      id: genId('audit'),
      timestamp: new Date().toISOString(),
      actorEmail: 'admin@collage.com.gh',
      action: 'STORAGE_SELF_HEALED',
      target: 'collat_erp_store_v3',
      status: 'success',
    });
    saveStore(store);
    return {
      status: 'healed',
      message: 'Storage collections and structural integrity verified and restored.',
      timestamp: new Date().toISOString(),
    };
  }

  throw new ApiError(404, `Endpoint not found: ${method} ${pathname}`, { error: 'Not found' }, { method, url: rawUrl });
}

export function getMarketerData(): {
  campaigns: MarketingCampaign[];
  showcaseLinks: ShowcaseLink[];
  leads: Client[];
} {
  const store = loadStore();
  return {
    campaigns: Array.isArray(store.campaigns) ? store.campaigns : [],
    showcaseLinks: Array.isArray(store.showcaseLinks) ? store.showcaseLinks : [],
    leads: (Array.isArray(store.clients) ? store.clients : []).filter((c) => c.status === 'lead'),
  };
}

export function getHrData(): {
  staff: StaffMember[];
  notices: InternalNotice[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
} {
  const store = loadStore();
  return {
    staff: Array.isArray(store.staff) ? store.staff : [],
    notices: Array.isArray(store.notices) ? sortInternalNotices(store.notices) : [],
    attendance: Array.isArray(store.attendance) ? store.attendance : [],
    leaveRequests: Array.isArray(store.leaveRequests) ? store.leaveRequests : [],
  };
}

export function getAdminData(): {
  users: WorkspaceUser[];
  auditLogs: AuditLogItem[];
  systemMetrics: SystemDiagnosticMetrics;
} {
  const store = loadStore();
  return {
    users: Array.isArray(store.users) ? store.users : [],
    auditLogs: Array.isArray(store.auditLogs) ? store.auditLogs : [],
    systemMetrics: computeSystemStorageMetrics(),
  };
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const method = (options.method || 'GET').toUpperCase();

  // In browser runtime or when _baseUrl is configured, route /api/* to the live Neon PostgreSQL backend
  if ((isBrowserRuntime() || Boolean(_baseUrl)) && rawUrl.startsWith('/api/')) {
    const finalUrl = _baseUrl ? `${_baseUrl}${rawUrl}` : rawUrl;
    const headers = new Headers(options.headers);
    if (typeof options.body === 'string' && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (!headers.has('authorization')) {
      const token = _authTokenGetter ? await _authTokenGetter() : getStoredAuthToken();
      if (token) headers.set('authorization', `Bearer ${token}`);
    }

    let response: Response | null = null;
    try {
      response = await fetch(finalUrl, { ...options, method, headers });
    } catch {
      response = null;
    }

    if (response) {
      if (response.ok) {
        const data = (await response.json()) as T;
        if (method !== 'GET') {
          await syncStoreFromNeon();
        }
        return data;
      }
      // If server returned a 4xx validation/not-found error, surface it directly
      if (response.status >= 400 && response.status < 500) {
        const errData = await response.json().catch(() => null);
        const message =
          (errData && typeof errData === 'object' && 'error' in errData && String((errData as { error?: unknown }).error)) ||
          response.statusText;
        throw new ApiError(response.status, message, errData, {
          method,
          url: finalUrl,
        });
      }
    }
  }

  if (rawUrl.startsWith('/api/') || rawUrl.includes('/api/')) {
    const bodyText = typeof options.body === 'string' ? options.body : null;
    const result = handleApiRequest(method, rawUrl, bodyText);
    return result as T;
  }

  const finalUrl = _baseUrl && rawUrl.startsWith('/') ? `${_baseUrl}${rawUrl}` : rawUrl;
  const headers = new Headers(options.headers);
  if (_authTokenGetter && !headers.has('authorization')) {
    const token = await _authTokenGetter();
    if (token) headers.set('authorization', `Bearer ${token}`);
  }
  const response = await fetch(finalUrl, { ...options, method, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data, {
      method,
      url: finalUrl,
    });
  }
  return (await response.json()) as T;
}
