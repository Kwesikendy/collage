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
}

const STORAGE_KEY = 'collat_erp_store_v2';

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
      amount: 6500,
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

  return { clients, documents, payments, rentals, productionOrders };
}

function loadStore(): ErpStore {
  if (typeof window === 'undefined') {
    return createInitialStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as ErpStore;
    if (!Array.isArray(parsed.clients) || !Array.isArray(parsed.documents)) {
      const seed = createInitialStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    if (!Array.isArray(parsed.rentals) || !Array.isArray(parsed.productionOrders)) {
      const seed = createInitialStore();
      parsed.rentals = seed.rentals;
      parsed.productionOrders = seed.productionOrders;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return createInitialStore();
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
}

export function getDocumentPayments(documentId: string): Payment[] {
  const store = loadStore();
  return store.payments
    .filter((p) => p.documentId === documentId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

export function getOperationsData(): {
  rentals: RentalBooking[];
  productionOrders: ProductionOrder[];
} {
  const store = loadStore();
  return {
    rentals: store.rentals,
    productionOrders: store.productionOrders,
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
  return store.productionOrders;
}

export function deleteDocumentById(id: string): void {
  const store = loadStore();
  store.documents = store.documents.filter((d) => d.id !== id);
  store.payments = store.payments.filter((p) => p.documentId !== id);
  saveStore(store);
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
  const existing = store.documents.filter(
    (doc) => doc.issueDate.slice(0, 10) === issueDate && doc.kind === kind,
  );
  const next =
    existing.reduce((max, row) => {
      const sequence = Number(row.number.split('.').at(-1));
      return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
    }, 0) + 1;
  return `${prefix}.${String(next).padStart(2, '0')}`;
}

function hydrateDocument(store: ErpStore, doc: StoredDocument): SalesDocument {
  const client = store.clients.find((c) => c.id === doc.clientId);
  const paidCents = store.payments
    .filter((p) => p.documentId === doc.id)
    .reduce((sum, p) => sum + amountToCents(p.amount), 0);
  const totalCents = amountToCents(doc.total);
  const balanceCents = Math.max(0, totalCents - paidCents);

  return {
    ...doc,
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
    const activeClients = store.clients.filter((c) => c.status !== 'archived');
    const invoiceDocs = store.documents
      .filter(
        (d) =>
          d.kind === 'invoice' &&
          d.status !== 'draft' &&
          d.status !== 'cancelled',
      )
      .map((d) => hydrateDocument(store, d));

    const activeQuotes = store.documents.filter(
      (d) =>
        d.kind === 'quotation' &&
        ['draft', 'issued', 'accepted'].includes(d.status),
    );

    const collectedCents = store.payments.reduce(
      (sum, p) => sum + amountToCents(p.amount),
      0,
    );

    const outstandingCents = invoiceDocs.reduce(
      (sum, inv) => sum + amountToCents(inv.balance),
      0,
    );

    const recentClients: ActivityItem[] = [...store.clients]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((c) => ({
        id: `client:${c.id}`,
        title: 'Client record active',
        detail: `${c.companyName}${c.city ? ` · ${c.city}` : ''}`,
        date: c.createdAt,
        kind: 'client',
      }));

    const recentDocs: ActivityItem[] = [...store.documents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((d) => ({
        id: `document:${d.kind}:${d.id}`,
        title: d.kind === 'quotation' ? 'Quotation issued' : 'Invoice issued',
        detail: `${d.number} · ${d.subject}`,
        date: d.createdAt,
        kind: d.kind,
      }));

    const recentPayments: ActivityItem[] = [...store.payments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((p) => {
        const doc = store.documents.find((d) => d.id === p.documentId);
        const client = store.clients.find((c) => c.id === doc?.clientId);
        return {
          id: `payment:${doc?.id ?? p.id}`,
          title: 'Payment recorded',
          detail: `${client?.companyName ?? 'Client'} · ${doc?.number ?? 'Invoice'} · GHS ${Number(p.amount).toFixed(2)}`,
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
    const paidCents = store.payments
      .filter((p) => p.documentId === doc.id)
      .reduce((sum, p) => sum + amountToCents(p.amount), 0);
    const amountCents = amountToCents(input.amount);
    if (amountCents < 1) {
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

  throw new ApiError(404, `Endpoint not found: ${method} ${pathname}`, { error: 'Not found' }, { method, url: rawUrl });
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

  // If a remote API base URL is explicitly configured in production, try it first
  if (_baseUrl && rawUrl.startsWith('/api/')) {
    try {
      const finalUrl = `${_baseUrl}${rawUrl}`;
      const headers = new Headers(options.headers);
      if (typeof options.body === 'string' && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      if (_authTokenGetter && !headers.has('authorization')) {
        const token = await _authTokenGetter();
        if (token) headers.set('authorization', `Bearer ${token}`);
      }
      const response = await fetch(finalUrl, { ...options, method, headers });
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // Fall back to local store if remote server is unreachable
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
