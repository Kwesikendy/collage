import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import {
  amountToCents,
  calculateDocumentPricing,
  centsToAmount,
  type LineInput,
} from '../lib/api-client/document-finance.ts';
import type {
  ActivityItem,
  Client,
  ClientInput,
  ClientUpdate,
  DashboardSummary,
  DocumentInput,
  DocumentUpdate,
  Payment,
  PaymentInput,
  SalesDocument,
} from '../lib/api-client/generated/api.schemas.ts';
import type { ProductionOrder, RentalBooking } from '../lib/api-client/custom-fetch.ts';

const { Pool } = pg;

function loadDotEnvIfNeeded(): void {
  if (process.env.DATABASE_URL) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignore env read errors
  }
}

let poolInstance: pg.Pool | null = null;
let initPromise: Promise<void> | null = null;

export function getPool(): pg.Pool {
  loadDotEnvIfNeeded();
  if (!poolInstance) {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error('DATABASE_URL is not configured in environment.');
    }
    poolInstance = new Pool({
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }
  return poolInstance;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'admin' | 'staff';
  office: string;
  createdAt: string;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || randomBytes(16).toString('hex');
  const derived = scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

export class HttpApiError extends Error {
  readonly status: number;
  readonly payload: Record<string, unknown>;

  constructor(status: number, message: string, payload?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.payload = payload ?? { error: message };
  }
}

function buildSeedData() {
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

  const eugeniaPricing = calculateDocumentPricing({
    items: [
      { description: 'Polo rental', quantity: 4, days: 1, unitPrice: 70 },
      { description: 'Flag printing (1x3m)', quantity: 4, days: 1, unitPrice: 200 },
      { description: 'Logistics (Transpotation, Deployment)', quantity: 1, days: 1, unitPrice: 500 },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const ecobankPricing = calculateDocumentPricing({
    items: [
      { description: 'Telescopic Flag Print (Double-Sided Sublimation Fabric 4.2m)', quantity: 12, days: 1, unitPrice: 380 },
      { description: 'Telescopic Flag Pole & Heavy Water Base Rental (5m Complete Kit)', quantity: 12, days: 4, unitPrice: 95 },
      { description: 'On-Site Rigging, Installation & Dismantling Crew (AICC)', quantity: 1, days: 2, unitPrice: 650 },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const mtnPricing = calculateDocumentPricing({
    items: [
      { description: 'Corporate AGM Stage Backdrop & Wayfinding Totem Branding', quantity: 4, days: 1, unitPrice: 1450 },
      { description: 'Exhibition LED Floodlight & Truss System Rental', quantity: 6, days: 3, unitPrice: 180 },
    ],
    discountPercent: 5,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const qt1Pricing = calculateDocumentPricing({
    items: [
      { description: 'Executive Summit Directional Signage & Feather Banner Package', quantity: 16, days: 3, unitPrice: 160 },
      { description: 'Branded Registration Desk Fascia & Media Wall Print (Dispatched via PrintD Pigh)', quantity: 2, days: 1, unitPrice: 2200 },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const qt2Pricing = calculateDocumentPricing({
    items: [
      { description: 'Mining Safety Week Outdoor Billboard Skin & Telescopic Pole Rentals', quantity: 10, days: 5, unitPrice: 140 },
    ],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  const documents = [
    {
      id: 'doc-inv-00211026-01',
      number: '00211026.01',
      kind: 'invoice' as const,
      clientId: 'cli-eugenia',
      subject: 'TELESCOPIC FLAG PRINT AND POLE RENTALS',
      issueDate: '2026-10-21',
      dueDate: '2026-10-26',
      status: 'issued' as const,
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
      kind: 'invoice' as const,
      clientId: 'cli-ecobank-gh',
      subject: 'ANNUAL SUMMIT FLAG POLES & OUTDOOR WAYFINDING',
      issueDate: `${currentMonthPrefix}-22`,
      dueDate: `${currentMonthPrefix}-29`,
      status: 'partially_paid' as const,
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
      kind: 'invoice' as const,
      clientId: 'cli-mtn-gh',
      subject: 'CORPORATE AGM STAGE BACKDROP & EXHIBITION LIGHTING RENTAL',
      issueDate: `${currentMonthPrefix}-18`,
      dueDate: `${currentMonthPrefix}-25`,
      status: 'paid' as const,
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
      kind: 'quotation' as const,
      clientId: 'cli-kempinski-accra',
      subject: 'EXECUTIVE SUMMIT WAYFINDING & MEDIA WALL BRANDING',
      issueDate: `${currentMonthPrefix}-23`,
      dueDate: `${currentMonthPrefix}-30`,
      status: 'issued' as const,
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
      kind: 'quotation' as const,
      clientId: 'cli-goldfields',
      subject: 'SAFETY WEEK OUTDOOR BILLBOARD SKIN & POLE RENTALS',
      issueDate: `${currentMonthPrefix}-24`,
      dueDate: null,
      status: 'accepted' as const,
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

  return { clients, documents, payments, rentals, productionOrders };
}

export async function ensureDatabaseInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS collat_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          office TEXT NOT NULL DEFAULT 'Accra HQ',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS collat_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES collat_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS collat_clients (
          id TEXT PRIMARY KEY,
          company_name TEXT NOT NULL,
          contact_name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          country TEXT NOT NULL DEFAULT 'Ghana',
          status TEXT NOT NULL DEFAULT 'lead',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS collat_documents (
          id TEXT PRIMARY KEY,
          number TEXT NOT NULL,
          kind TEXT NOT NULL,
          client_id TEXT NOT NULL,
          subject TEXT NOT NULL,
          issue_date TEXT NOT NULL,
          due_date TEXT,
          status TEXT NOT NULL,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
          discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
          discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
          getfund_rate DOUBLE PRECISION NOT NULL DEFAULT 2.5,
          getfund_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
          nhil_rate DOUBLE PRECISION NOT NULL DEFAULT 2.5,
          nhil_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
          vat_rate DOUBLE PRECISION NOT NULL DEFAULT 15,
          vat_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
          total DOUBLE PRECISION NOT NULL DEFAULT 0,
          payment_terms TEXT NOT NULL,
          validity_days INTEGER NOT NULL DEFAULT 5,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS collat_payments (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          payment_date TEXT NOT NULL,
          method TEXT NOT NULL,
          reference TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS collat_rentals (
          id TEXT PRIMARY KEY,
          item_name TEXT NOT NULL,
          client_name TEXT NOT NULL,
          document_number TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          days INTEGER NOT NULL,
          unit_rate DOUBLE PRECISION NOT NULL,
          start_date TEXT NOT NULL,
          return_date TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS collat_production_orders (
          id TEXT PRIMARY KEY,
          job_code TEXT NOT NULL,
          client_name TEXT NOT NULL,
          document_number TEXT NOT NULL,
          specification TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          assigned_to TEXT NOT NULL,
          due_date TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Seed default admin users if none exist
      const userCountRes = await client.query<{ count: string }>('SELECT COUNT(*) AS count FROM collat_users');
      if (Number(userCountRes.rows[0]?.count ?? 0) === 0) {
        const nowIso = new Date().toISOString();
        const { hash, salt } = hashPassword('Collage2026!');
        await client.query(
          `INSERT INTO collat_users (id, email, password_hash, salt, first_name, last_name, full_name, role, office, created_at)
           VALUES
             ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
             ($11, $12, $3, $4, $13, $14, $15, $8, $9, $10)
           ON CONFLICT (email) DO NOTHING`,
          [
            'usr-kojo-nathan',
            'kojo@collage.com.gh',
            hash,
            salt,
            'Kojo',
            'Nathan',
            'Kojo Nathan',
            'admin',
            'Accra HQ',
            nowIso,
            'usr-admin-collage',
            'admin@collage.com.gh',
            'Kojo',
            'Admin',
            'Kojo Admin',
          ],
        );
      }

      // Seed ERP tables if collat_clients is empty
      const clientCountRes = await client.query<{ count: string }>('SELECT COUNT(*) AS count FROM collat_clients');
      if (Number(clientCountRes.rows[0]?.count ?? 0) === 0) {
        await seedErpTables(client);
      }
    } finally {
      client.release();
    }
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

async function seedErpTables(client: pg.PoolClient): Promise<void> {
  const seed = buildSeedData();

  for (const c of seed.clients) {
    await client.query(
      `INSERT INTO collat_clients (id, company_name, contact_name, email, phone, address, city, country, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.companyName, c.contactName, c.email, c.phone, c.address, c.city, c.country, c.status, c.createdAt, c.updatedAt],
    );
  }

  for (const d of seed.documents) {
    await client.query(
      `INSERT INTO collat_documents (
        id, number, kind, client_id, subject, issue_date, due_date, status, items,
        subtotal, discount_percent, discount_amount, getfund_rate, getfund_amount,
        nhil_rate, nhil_amount, vat_rate, vat_amount, total, payment_terms, validity_days,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21,
        $22, $23
      ) ON CONFLICT (id) DO NOTHING`,
      [
        d.id,
        d.number,
        d.kind,
        d.clientId,
        d.subject,
        d.issueDate,
        d.dueDate,
        d.status,
        JSON.stringify(d.items),
        d.subtotal,
        d.discountPercent,
        d.discountAmount,
        d.getfundRate,
        d.getfundAmount,
        d.nhilRate,
        d.nhilAmount,
        d.vatRate,
        d.vatAmount,
        d.total,
        d.paymentTerms,
        d.validityDays,
        d.createdAt,
        d.updatedAt,
      ],
    );
  }

  for (const p of seed.payments) {
    await client.query(
      `INSERT INTO collat_payments (id, document_id, amount, payment_date, method, reference, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.documentId, p.amount, p.paymentDate, p.method, p.reference, p.createdAt],
    );
  }

  for (const r of seed.rentals) {
    await client.query(
      `INSERT INTO collat_rentals (id, item_name, client_name, document_number, quantity, days, unit_rate, start_date, return_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.itemName, r.clientName, r.documentNumber, r.quantity, r.days, r.unitRate, r.startDate, r.returnDate, r.status],
    );
  }

  for (const o of seed.productionOrders) {
    await client.query(
      `INSERT INTO collat_production_orders (id, job_code, client_name, document_number, specification, quantity, assigned_to, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [o.id, o.jobCode, o.clientName, o.documentNumber, o.specification, o.quantity, o.assignedTo, o.dueDate, o.status],
    );
  }
}

export async function resetDatabaseToSeed(): Promise<void> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM collat_payments');
    await client.query('DELETE FROM collat_documents');
    await client.query('DELETE FROM collat_clients');
    await client.query('DELETE FROM collat_rentals');
    await client.query('DELETE FROM collat_production_orders');
    await seedErpTables(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function mapClientRow(row: Record<string, any>): Client {
  return {
    id: String(row.id),
    companyName: String(row.company_name),
    contactName: row.contact_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    country: String(row.country || 'Ghana'),
    status: row.status as Client['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPaymentRow(row: Record<string, any>): Payment {
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    amount: Number(row.amount),
    paymentDate: String(row.payment_date),
    method: row.method as Payment['method'],
    reference: row.reference ?? null,
    createdAt: String(row.created_at),
  };
}

function mapRentalRow(row: Record<string, any>): RentalBooking {
  return {
    id: String(row.id),
    itemName: String(row.item_name),
    clientName: String(row.client_name),
    documentNumber: String(row.document_number),
    quantity: Number(row.quantity),
    days: Number(row.days),
    unitRate: Number(row.unit_rate),
    startDate: String(row.start_date),
    returnDate: String(row.return_date),
    status: row.status as RentalBooking['status'],
  };
}

function mapProductionRow(row: Record<string, any>): ProductionOrder {
  return {
    id: String(row.id),
    jobCode: String(row.job_code),
    clientName: String(row.client_name),
    documentNumber: String(row.document_number),
    specification: String(row.specification),
    quantity: Number(row.quantity),
    assignedTo: String(row.assigned_to),
    dueDate: String(row.due_date),
    status: row.status as ProductionOrder['status'],
  };
}

function mapStoredDocRow(row: Record<string, any>) {
  return {
    id: String(row.id),
    number: String(row.number),
    kind: row.kind as 'quotation' | 'invoice',
    clientId: String(row.client_id),
    subject: String(row.subject),
    issueDate: String(row.issue_date),
    dueDate: row.due_date ? String(row.due_date) : null,
    status: row.status as SalesDocument['status'],
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    discountPercent: Number(row.discount_percent),
    discountAmount: Number(row.discount_amount),
    getfundRate: Number(row.getfund_rate),
    getfundAmount: Number(row.getfund_amount),
    nhilRate: Number(row.nhil_rate),
    nhilAmount: Number(row.nhil_amount),
    vatRate: Number(row.vat_rate),
    vatAmount: Number(row.vat_amount),
    total: Number(row.total),
    paymentTerms: String(row.payment_terms),
    validityDays: Number(row.validity_days),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function hydrateDoc(
  doc: ReturnType<typeof mapStoredDocRow>,
  clients: Client[],
  payments: Payment[],
): SalesDocument {
  const client = clients.find((c) => c.id === doc.clientId);
  const paidCents = payments
    .filter((p) => p.documentId === doc.id)
    .reduce((sum, p) => sum + amountToCents(p.amount), 0);
  const totalCents = amountToCents(doc.total ?? 0);
  const balanceCents = Math.max(0, totalCents - paidCents);

  return {
    ...doc,
    clientName: client?.companyName ?? 'Client',
    amountPaid: Number(centsToAmount(paidCents)),
    balance: Number(centsToAmount(balanceCents)),
  };
}

// --- Authentication & Sessions ---

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  office?: string;
}): Promise<{ token: string; user: AuthUser }> {
  await ensureDatabaseInitialized();
  const pool = getPool();

  const email = (input.email || '').trim().toLowerCase();
  const password = input.password || '';
  const firstName = (input.firstName || '').trim();
  const lastName = (input.lastName || '').trim();
  const office = (input.office || 'Accra HQ').trim() || 'Accra HQ';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpApiError(400, 'Please enter a valid work email address.');
  }
  if (password.length < 6) {
    throw new HttpApiError(400, 'Password must be at least 6 characters long.');
  }
  if (!firstName) {
    throw new HttpApiError(400, 'First name is required.');
  }

  const existing = await pool.query('SELECT id FROM collat_users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new HttpApiError(409, 'An account with this email already exists. Please sign in.');
  }

  const id = genId('usr');
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const { hash, salt } = hashPassword(password);
  const nowIso = new Date().toISOString();

  await pool.query(
    `INSERT INTO collat_users (id, email, password_hash, salt, first_name, last_name, full_name, role, office, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', $8, $9)`,
    [id, email, hash, salt, firstName, lastName, fullName, office, nowIso],
  );

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO collat_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, id, expiresAt.toISOString()],
  );

  return {
    token,
    user: {
      id,
      email,
      firstName,
      lastName,
      fullName,
      role: 'admin',
      office,
      createdAt: nowIso,
    },
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  await ensureDatabaseInitialized();
  const pool = getPool();

  const email = (input.email || '').trim().toLowerCase();
  const password = input.password || '';

  if (!email || !password) {
    throw new HttpApiError(400, 'Email and password are required.');
  }

  const res = await pool.query('SELECT * FROM collat_users WHERE email = $1', [email]);
  const row = res.rows[0];
  if (!row || !verifyPassword(password, String(row.password_hash), String(row.salt))) {
    throw new HttpApiError(401, 'Invalid email or password.');
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO collat_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, row.id, expiresAt.toISOString()],
  );

  return {
    token,
    user: {
      id: String(row.id),
      email: String(row.email),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      fullName: String(row.full_name),
      role: (row.role as 'admin' | 'staff') || 'admin',
      office: String(row.office || 'Accra HQ'),
      createdAt: String(row.created_at),
    },
  };
}

export async function getUserByToken(token: string | null | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  await ensureDatabaseInitialized();
  const pool = getPool();
  const res = await pool.query(
    `SELECT u.*
     FROM collat_sessions s
     JOIN collat_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    fullName: String(row.full_name),
    role: (row.role as 'admin' | 'staff') || 'admin',
    office: String(row.office || 'Accra HQ'),
    createdAt: String(row.created_at),
  };
}

export async function logoutToken(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await ensureDatabaseInitialized();
  const pool = getPool();
  await pool.query('DELETE FROM collat_sessions WHERE token = $1', [token]);
}

// --- Full Snapshot Sync ---

export async function getFullErpSnapshot() {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const [clientsRes, docsRes, paymentsRes, rentalsRes, prodRes] = await Promise.all([
    pool.query('SELECT * FROM collat_clients ORDER BY created_at DESC'),
    pool.query('SELECT * FROM collat_documents ORDER BY created_at DESC'),
    pool.query('SELECT * FROM collat_payments ORDER BY payment_date DESC, created_at DESC'),
    pool.query('SELECT * FROM collat_rentals ORDER BY created_at DESC'),
    pool.query('SELECT * FROM collat_production_orders ORDER BY created_at DESC'),
  ]);

  return {
    clients: clientsRes.rows.map(mapClientRow),
    documents: docsRes.rows.map(mapStoredDocRow),
    payments: paymentsRes.rows.map(mapPaymentRow),
    rentals: rentalsRes.rows.map(mapRentalRow),
    productionOrders: prodRes.rows.map(mapProductionRow),
  };
}

// --- ERP API Handlers ---

export async function getDashboardSummaryFromDb(): Promise<DashboardSummary> {
  const snapshot = await getFullErpSnapshot();
  const { clients, documents, payments } = snapshot;

  const activeClients = clients.filter((c) => c.status !== 'archived');
  const invoiceDocs = documents
    .filter((d) => d.kind === 'invoice' && d.status !== 'draft' && d.status !== 'cancelled')
    .map((d) => hydrateDoc(d, clients, payments));

  const activeQuotes = documents.filter(
    (d) => d.kind === 'quotation' && ['draft', 'issued', 'accepted'].includes(d.status),
  );

  const collectedCents = payments.reduce((sum, p) => sum + amountToCents(p.amount), 0);
  const outstandingCents = invoiceDocs.reduce((sum, inv) => sum + amountToCents(inv.balance), 0);

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

  return {
    totalClients: activeClients.length,
    activeQuotes: activeQuotes.length,
    openInvoices: invoiceDocs.filter((inv) => inv.balance > 0).length,
    collectedThisMonth: Number(centsToAmount(collectedCents)),
    outstandingBalance: Number(centsToAmount(outstandingCents)),
    recentActivity,
  };
}

export async function listClientsFromDb(params: { status?: string | null; search?: string | null }): Promise<Client[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const res = await pool.query('SELECT * FROM collat_clients ORDER BY created_at DESC');
  const status = params.status;
  const search = params.search?.trim().toLowerCase();

  return res.rows
    .map(mapClientRow)
    .filter((c) => {
      if (status && c.status !== status) return false;
      if (search) {
        const hay = `${c.companyName} ${c.contactName ?? ''} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
}

export async function createClientInDb(input: ClientInput): Promise<Client> {
  await ensureDatabaseInitialized();
  if (!input.companyName?.trim()) {
    throw new HttpApiError(400, 'Company name is required.');
  }
  const nowIso = new Date().toISOString();
  const created: Client = {
    id: genId('cli'),
    companyName: input.companyName.trim().slice(0, 200),
    contactName: input.contactName?.trim().slice(0, 200) || null,
    email: input.email?.trim().slice(0, 254) || null,
    phone: input.phone?.trim().slice(0, 50) || null,
    address: input.address?.trim().slice(0, 500) || null,
    city: input.city?.trim().slice(0, 100) || null,
    country: input.country?.trim().slice(0, 100) || 'Ghana',
    status: input.status ?? 'lead',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const pool = getPool();
  await pool.query(
    `INSERT INTO collat_clients (id, company_name, contact_name, email, phone, address, city, country, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      created.id,
      created.companyName,
      created.contactName,
      created.email,
      created.phone,
      created.address,
      created.city,
      created.country,
      created.status,
      created.createdAt,
      created.updatedAt,
    ],
  );
  return created;
}

export async function getClientByIdFromDb(id: string): Promise<Client> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const res = await pool.query('SELECT * FROM collat_clients WHERE id = $1', [id]);
  if (!res.rows[0]) {
    throw new HttpApiError(404, 'Client not found.');
  }
  return mapClientRow(res.rows[0]);
}

export async function updateClientInDb(id: string, input: ClientUpdate): Promise<Client> {
  const existing = await getClientByIdFromDb(id);
  const updated: Client = {
    ...existing,
    companyName: input.companyName !== undefined ? input.companyName.trim().slice(0, 200) : existing.companyName,
    contactName: input.contactName !== undefined ? input.contactName?.trim().slice(0, 200) || null : existing.contactName,
    email: input.email !== undefined ? input.email?.trim().slice(0, 254) || null : existing.email,
    phone: input.phone !== undefined ? input.phone?.trim().slice(0, 50) || null : existing.phone,
    address: input.address !== undefined ? input.address?.trim().slice(0, 500) || null : existing.address,
    city: input.city !== undefined ? input.city?.trim().slice(0, 100) || null : existing.city,
    country: input.country !== undefined ? input.country.trim().slice(0, 100) : existing.country,
    status: input.status !== undefined ? input.status : existing.status,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.companyName) {
    throw new HttpApiError(400, 'Company name is required.');
  }

  const pool = getPool();
  await pool.query(
    `UPDATE collat_clients
     SET company_name = $2, contact_name = $3, email = $4, phone = $5, address = $6, city = $7, country = $8, status = $9, updated_at = $10
     WHERE id = $1`,
    [
      id,
      updated.companyName,
      updated.contactName,
      updated.email,
      updated.phone,
      updated.address,
      updated.city,
      updated.country,
      updated.status,
      updated.updatedAt,
    ],
  );
  return updated;
}

export async function archiveClientInDb(id: string): Promise<Client> {
  const existing = await getClientByIdFromDb(id);
  const updatedAt = new Date().toISOString();
  const pool = getPool();
  await pool.query(`UPDATE collat_clients SET status = 'archived', updated_at = $2 WHERE id = $1`, [id, updatedAt]);
  return { ...existing, status: 'archived', updatedAt };
}

export async function listDocumentsFromDb(params: {
  kind?: string | null;
  status?: string | null;
  search?: string | null;
}): Promise<SalesDocument[]> {
  const snapshot = await getFullErpSnapshot();
  const { clients, documents, payments } = snapshot;
  const kind = params.kind;
  const status = params.status;
  const search = params.search?.trim().toLowerCase();

  return documents
    .map((d) => hydrateDoc(d, clients, payments))
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

export async function getDocumentByIdFromDb(id: string): Promise<SalesDocument> {
  const snapshot = await getFullErpSnapshot();
  const doc = snapshot.documents.find((d) => d.id === id);
  if (!doc) {
    throw new HttpApiError(404, 'Document not found.');
  }
  return hydrateDoc(doc, snapshot.clients, snapshot.payments);
}

export async function createDocumentInDb(input: DocumentInput): Promise<SalesDocument> {
  const snapshot = await getFullErpSnapshot();
  const client = snapshot.clients.find((c) => c.id === input.clientId);
  if (!client || client.status === 'archived') {
    throw new HttpApiError(400, 'Choose an active client before saving.');
  }
  const issueDate = dateOnly(input.issueDate);
  if (!issueDate) {
    throw new HttpApiError(400, 'An issue date is required.');
  }
  if (!Array.isArray(input.items)) {
    throw new HttpApiError(400, 'Items must be an array.');
  }

  const pricing = calculateDocumentPricing({
    items: input.items,
    discountPercent: input.discountPercent ?? 0,
    getfundRate: input.getfundRate ?? 2.5,
    nhilRate: input.nhilRate ?? 2.5,
    vatRate: input.vatRate ?? 15,
  });

  const prefix = documentPrefix(issueDate, input.kind);
  const existing = snapshot.documents.filter(
    (doc) => doc.issueDate.slice(0, 10) === issueDate && doc.kind === input.kind,
  );
  const nextSeq =
    existing.reduce((max, row) => {
      const seq = Number(row.number.split('.').at(-1));
      return Number.isFinite(seq) ? Math.max(max, seq) : max;
    }, 0) + 1;
  const number = `${prefix}.${String(nextSeq).padStart(2, '0')}`;
  const nowIso = new Date().toISOString();

  const created = {
    id: genId('doc'),
    number,
    kind: input.kind,
    clientId: input.clientId,
    subject: input.subject.trim().slice(0, 300),
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

  const pool = getPool();
  await pool.query(
    `INSERT INTO collat_documents (
      id, number, kind, client_id, subject, issue_date, due_date, status, items,
      subtotal, discount_percent, discount_amount, getfund_rate, getfund_amount,
      nhil_rate, nhil_amount, vat_rate, vat_amount, total, payment_terms, validity_days,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
      $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20, $21,
      $22, $23
    )`,
    [
      created.id,
      created.number,
      created.kind,
      created.clientId,
      created.subject,
      created.issueDate,
      created.dueDate,
      created.status,
      JSON.stringify(created.items),
      created.subtotal,
      created.discountPercent,
      created.discountAmount,
      created.getfundRate,
      created.getfundAmount,
      created.nhilRate,
      created.nhilAmount,
      created.vatRate,
      created.vatAmount,
      created.total,
      created.paymentTerms,
      created.validityDays,
      created.createdAt,
      created.updatedAt,
    ],
  );

  return hydrateDoc(created, snapshot.clients, snapshot.payments);
}

export async function updateDocumentInDb(id: string, input: DocumentUpdate): Promise<SalesDocument> {
  const snapshot = await getFullErpSnapshot();
  const doc = snapshot.documents.find((d) => d.id === id);
  if (!doc) {
    throw new HttpApiError(404, 'Document not found.');
  }

  if (input.subject !== undefined) doc.subject = input.subject.trim().slice(0, 300);
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

  const pool = getPool();
  await pool.query(
    `UPDATE collat_documents
     SET subject = $2, issue_date = $3, due_date = $4, status = $5, items = $6::jsonb,
         subtotal = $7, discount_percent = $8, discount_amount = $9,
         getfund_rate = $10, getfund_amount = $11, nhil_rate = $12, nhil_amount = $13,
         vat_rate = $14, vat_amount = $15, total = $16,
         payment_terms = $17, validity_days = $18, updated_at = $19
     WHERE id = $1`,
    [
      id,
      doc.subject,
      doc.issueDate,
      doc.dueDate,
      doc.status,
      JSON.stringify(doc.items),
      doc.subtotal,
      doc.discountPercent,
      doc.discountAmount,
      doc.getfundRate,
      doc.getfundAmount,
      doc.nhilRate,
      doc.nhilAmount,
      doc.vatRate,
      doc.vatAmount,
      doc.total,
      doc.paymentTerms,
      doc.validityDays,
      doc.updatedAt,
    ],
  );

  return hydrateDoc(doc, snapshot.clients, snapshot.payments);
}

export async function deleteDocumentInDb(id: string): Promise<void> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  await pool.query('DELETE FROM collat_payments WHERE document_id = $1', [id]);
  await pool.query('DELETE FROM collat_documents WHERE id = $1', [id]);
}

export async function convertQuotationInDb(id: string): Promise<SalesDocument> {
  const snapshot = await getFullErpSnapshot();
  const quotation = snapshot.documents.find((d) => d.id === id);
  if (!quotation || quotation.kind !== 'quotation') {
    throw new HttpApiError(404, 'Quotation not found.');
  }
  if (quotation.status === 'declined' || quotation.status === 'cancelled') {
    throw new HttpApiError(400, 'Declined or cancelled quotations cannot become invoices.');
  }

  const nowIso = new Date().toISOString();
  const issueDate = nowIso.slice(0, 10);
  const prefix = documentPrefix(issueDate, 'invoice');
  const existing = snapshot.documents.filter(
    (doc) => doc.issueDate.slice(0, 10) === issueDate && doc.kind === 'invoice',
  );
  const nextSeq =
    existing.reduce((max, row) => {
      const seq = Number(row.number.split('.').at(-1));
      return Number.isFinite(seq) ? Math.max(max, seq) : max;
    }, 0) + 1;
  const number = `${prefix}.${String(nextSeq).padStart(2, '0')}`;

  const createdInvoice = {
    id: genId('doc'),
    number,
    kind: 'invoice' as const,
    clientId: quotation.clientId,
    subject: quotation.subject,
    issueDate,
    dueDate: quotation.dueDate,
    status: 'issued' as const,
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

  const pool = getPool();
  await pool.query(`UPDATE collat_documents SET status = 'accepted', updated_at = $2 WHERE id = $1`, [id, nowIso]);
  await pool.query(
    `INSERT INTO collat_documents (
      id, number, kind, client_id, subject, issue_date, due_date, status, items,
      subtotal, discount_percent, discount_amount, getfund_rate, getfund_amount,
      nhil_rate, nhil_amount, vat_rate, vat_amount, total, payment_terms, validity_days,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
      $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20, $21,
      $22, $23
    )`,
    [
      createdInvoice.id,
      createdInvoice.number,
      createdInvoice.kind,
      createdInvoice.clientId,
      createdInvoice.subject,
      createdInvoice.issueDate,
      createdInvoice.dueDate,
      createdInvoice.status,
      JSON.stringify(createdInvoice.items),
      createdInvoice.subtotal,
      createdInvoice.discountPercent,
      createdInvoice.discountAmount,
      createdInvoice.getfundRate,
      createdInvoice.getfundAmount,
      createdInvoice.nhilRate,
      createdInvoice.nhilAmount,
      createdInvoice.vatRate,
      createdInvoice.vatAmount,
      createdInvoice.total,
      createdInvoice.paymentTerms,
      createdInvoice.validityDays,
      createdInvoice.createdAt,
      createdInvoice.updatedAt,
    ],
  );

  return hydrateDoc(createdInvoice, snapshot.clients, snapshot.payments);
}

export async function recordPaymentInDb(documentId: string, input: PaymentInput): Promise<Payment> {
  const snapshot = await getFullErpSnapshot();
  const doc = snapshot.documents.find((d) => d.id === documentId);
  if (!doc) {
    throw new HttpApiError(404, 'Document not found.');
  }
  if (doc.kind !== 'invoice') {
    throw new HttpApiError(400, 'Payments can only be recorded against invoices.');
  }

  const paidCents = snapshot.payments
    .filter((p) => p.documentId === doc.id)
    .reduce((sum, p) => sum + amountToCents(p.amount), 0);
  const amountCents = amountToCents(input.amount);
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || isNaN(input.amount) || amountCents < 1) {
    throw new HttpApiError(400, 'Payments must be at least GHS 0.01.');
  }
  const totalCents = amountToCents(doc.total);
  const balanceCents = totalCents - paidCents;
  if (amountCents > balanceCents) {
    throw new HttpApiError(400, 'Payment exceeds the remaining invoice balance.');
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

  const nextPaidCents = paidCents + amountCents;
  const nextStatus = nextPaidCents >= totalCents ? 'paid' : 'partially_paid';

  const pool = getPool();
  await pool.query(
    `INSERT INTO collat_payments (id, document_id, amount, payment_date, method, reference, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [payment.id, payment.documentId, payment.amount, payment.paymentDate, payment.method, payment.reference, payment.createdAt],
  );
  await pool.query(
    `UPDATE collat_documents SET status = $2, updated_at = $3 WHERE id = $1`,
    [doc.id, nextStatus, nowIso],
  );

  return payment;
}

export async function createRentalInDb(input: Omit<RentalBooking, 'id'>): Promise<RentalBooking[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const id = genId('rent');
  await pool.query(
    `INSERT INTO collat_rentals (id, item_name, client_name, document_number, quantity, days, unit_rate, start_date, return_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      input.itemName,
      input.clientName,
      input.documentNumber || '-',
      Number(input.quantity) || 1,
      Number(input.days) || 1,
      Number(input.unitRate) || 0,
      input.startDate,
      input.returnDate,
      input.status || 'reserved',
    ],
  );
  const res = await pool.query('SELECT * FROM collat_rentals ORDER BY created_at DESC');
  return res.rows.map(mapRentalRow);
}

export async function updateRentalStatusInDb(id: string, status: RentalBooking['status']): Promise<RentalBooking[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  await pool.query(`UPDATE collat_rentals SET status = $2 WHERE id = $1`, [id, status]);
  const res = await pool.query('SELECT * FROM collat_rentals ORDER BY created_at DESC');
  return res.rows.map(mapRentalRow);
}

export async function createProductionOrderInDb(
  input: Omit<ProductionOrder, 'id' | 'jobCode'>,
): Promise<ProductionOrder[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const countRes = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM collat_production_orders');
  const nextNum = String(Number(countRes.rows[0]?.count ?? 0) + 45).padStart(3, '0');
  const id = genId('prod');
  const jobCode = `PDP-2610-${nextNum}`;

  await pool.query(
    `INSERT INTO collat_production_orders (id, job_code, client_name, document_number, specification, quantity, assigned_to, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      jobCode,
      input.clientName,
      input.documentNumber || '-',
      input.specification,
      Number(input.quantity) || 1,
      input.assignedTo,
      input.dueDate,
      input.status || 'queued',
    ],
  );
  const res = await pool.query('SELECT * FROM collat_production_orders ORDER BY created_at DESC');
  return res.rows.map(mapProductionRow);
}

export async function updateProductionOrderStatusInDb(
  id: string,
  status: ProductionOrder['status'],
): Promise<ProductionOrder[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  await pool.query(`UPDATE collat_production_orders SET status = $2 WHERE id = $1`, [id, status]);
  const res = await pool.query('SELECT * FROM collat_production_orders ORDER BY created_at DESC');
  return res.rows.map(mapProductionRow);
}
