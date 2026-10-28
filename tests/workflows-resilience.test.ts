import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  customFetch,
  resetStore,
  ApiError,
  setRawStore,
  getRawStore,
  mockLocalStorage,
  STORAGE_KEY,
  getDocumentPayments,
  getOperationsData,
} from './setup.ts';
import type {
  Client,
  ClientInput,
  DashboardSummary,
  DocumentInput,
  Payment,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('Client Lifecycle: create -> retrieve -> update -> archive -> prevent document creation', async () => {
  // Step 1: Create client with lead status
  const clientInput: ClientInput = {
    companyName: 'Volta Digital Media',
    contactName: 'Elorm Kudzo',
    email: 'elorm@voltadigital.gh',
    phone: '+233 24 000 1122',
    address: 'Ho Central Commercial Road',
    city: 'Ho',
    country: 'Ghana',
    status: 'lead',
  };

  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientInput),
  });

  assert.ok(created.id.startsWith('cli-'));
  assert.equal(created.companyName, 'Volta Digital Media');
  assert.equal(created.status, 'lead');

  // Step 2: Retrieve client by ID
  const retrieved = await customFetch<Client>(`/api/clients/${created.id}`);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.email, 'elorm@voltadigital.gh');

  // Step 3: Update client details and promote to active
  const updated = await customFetch<Client>(`/api/clients/${created.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'active',
      phone: '+233 24 999 3344',
      city: 'Ho Airport Area',
    }),
  });

  assert.equal(updated.status, 'active');
  assert.equal(updated.phone, '+233 24 999 3344');
  assert.equal(updated.city, 'Ho Airport Area');

  // Verify client is returned in active filter
  const activeClients = await customFetch<Client[]>('/api/clients?status=active');
  assert.ok(activeClients.some((c) => c.id === created.id));

  // Step 4: Archive client
  const archived = await customFetch<Client>(`/api/clients/${created.id}/archive`, {
    method: 'POST',
  });
  assert.equal(archived.status, 'archived');

  // Step 5: Verify client is in archived filter and not in active filter
  const archivedClients = await customFetch<Client[]>('/api/clients?status=archived');
  assert.ok(archivedClients.some((c) => c.id === created.id));

  const refreshedActiveClients = await customFetch<Client[]>('/api/clients?status=active');
  assert.ok(!refreshedActiveClients.some((c) => c.id === created.id));

  // Step 6: Verify document creation fails when targeting this archived client
  await assert.rejects(
    async () => {
      await customFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'quotation',
          clientId: created.id,
          subject: 'Banner Production for Festival',
          issueDate: '2026-10-28',
          items: [{ description: 'Banner 1x3m', quantity: 2, days: 1, unitPrice: 200 }],
        }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Choose an active client before saving/i);
      return true;
    },
  );
});

test('Document Lifecycle: quote -> convert to invoice -> partial payment -> full settlement -> ledger reconciliation', async () => {
  // Step 1: Ensure active client
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  assert.ok(client);

  // Step 2: Create quotation
  const quoteInput: DocumentInput = {
    kind: 'quotation',
    clientId: client.id,
    subject: 'Annual Trade Fair Branding Package',
    issueDate: '2026-10-28',
    dueDate: '2026-11-15',
    items: [
      { description: 'Exhibition Booth Vinyl Wraps', quantity: 2, days: 1, unitPrice: 1500 },
      { description: 'Illuminated Pylon Sign Rental', quantity: 1, days: 3, unitPrice: 500 },
    ], // Subtotal = 3000 + 1500 = 4500
    discountPercent: 0,
    getfundRate: 0,
    nhilRate: 0,
    vatRate: 0, // Flat total 4500.00 for clean ledger math
  };

  const quotation = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(quoteInput),
  });

  assert.ok(quotation.id.startsWith('doc-'));
  assert.equal(quotation.kind, 'quotation');
  assert.equal(quotation.total, 4500);
  assert.equal(quotation.balance, 4500);

  // Step 3: Convert quotation to invoice
  const invoice = await customFetch<SalesDocument>(`/api/documents/${quotation.id}/convert`, {
    method: 'POST',
  });

  assert.equal(invoice.kind, 'invoice');
  assert.equal(invoice.clientId, client.id);
  assert.equal(invoice.total, 4500);
  assert.equal(invoice.amountPaid, 0);
  assert.equal(invoice.balance, 4500);
  assert.equal(invoice.status, 'issued');

  // Verify quotation is marked as accepted
  const reloadedQuote = await customFetch<SalesDocument>(`/api/documents/${quotation.id}`);
  assert.equal(reloadedQuote.status, 'accepted');

  // Step 4: Record partial payment of 2000
  const payment1 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 2000,
      paymentDate: '2026-10-28',
      method: 'bank_transfer',
      reference: 'TX-BANK-0091',
    }),
  });

  assert.equal(payment1.amount, 2000);

  // Verify invoice status is 'partially_paid' and balance is 2500
  const invoiceAfterP1 = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(invoiceAfterP1.status, 'partially_paid');
  assert.equal(invoiceAfterP1.amountPaid, 2000);
  assert.equal(invoiceAfterP1.balance, 2500);

  // Verify dashboard reflects invoice in openInvoices
  const summary1 = await customFetch<DashboardSummary>('/api/dashboard/summary');
  assert.ok(summary1.openInvoices >= 1);

  // Step 5: Record second payment of 2500 completing full invoice balance
  const payment2 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 2500,
      paymentDate: '2026-10-29',
      method: 'cheque',
      reference: 'CHQ-77881',
    }),
  });

  assert.equal(payment2.amount, 2500);

  // Verify invoice status is 'paid' and balance is 0
  const invoiceAfterP2 = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(invoiceAfterP2.status, 'paid');
  assert.equal(invoiceAfterP2.amountPaid, 4500);
  assert.equal(invoiceAfterP2.balance, 0);

  // Step 6: Verify payments ledger
  const receipts = getDocumentPayments(invoice.id);
  assert.equal(receipts.length, 2);
  assert.equal(receipts[0].amount, 2500); // Sorted desc by paymentDate
  assert.equal(receipts[1].amount, 2000);
});

test('Resilience: corrupted JSON in localStorage auto-heals without throwing exceptions', async () => {
  // Inject corrupted JSON string directly into localStorage
  mockLocalStorage.setItem(STORAGE_KEY, '{"clients": [INVALID_JSON_CORRUPT');

  // API call should not crash; it should detect corruption, re-seed, and return valid results
  const clients = await customFetch<Client[]>('/api/clients');
  assert.ok(Array.isArray(clients));
  assert.ok(clients.length >= 3);

  // Verify that localStorage was repaired and contains valid JSON
  const rawAfter = mockLocalStorage.getItem(STORAGE_KEY);
  assert.ok(rawAfter);
  assert.doesNotThrow(() => JSON.parse(rawAfter!));
});

test('Resilience: missing payments array in localStorage is safely restored', async () => {
  // Inject state without payments property
  setRawStore({
    clients: [
      {
        id: 'cli-test',
        companyName: 'Resilience Test Co',
        country: 'Ghana',
        status: 'active',
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z',
      },
    ],
    documents: [
      {
        id: 'doc-test-1',
        number: '00281026.99',
        kind: 'invoice',
        clientId: 'cli-test',
        subject: 'Resilience Test Invoice',
        issueDate: '2026-10-28',
        status: 'issued',
        items: [],
        subtotal: 500,
        discountPercent: 0,
        discountAmount: 0,
        getfundRate: 0,
        getfundAmount: 0,
        nhilRate: 0,
        nhilAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        total: 500,
        paymentTerms: '100%',
        validityDays: 5,
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z',
      },
    ],
    rentals: [],
    productionOrders: [],
    // payments array is intentionally omitted
  });

  // Fetching documents should not crash when hydrating payments
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  assert.ok(Array.isArray(docs));
  assert.equal(docs.length, 1);
  assert.equal(docs[0].id, 'doc-test-1');
  assert.equal(docs[0].amountPaid, 0);
  assert.equal(docs[0].balance, 500);

  // Verifying payments helper also recovers safely
  const payments = getDocumentPayments('doc-test-1');
  assert.ok(Array.isArray(payments));

  // Verify repaired store now contains payments array
  const rawStore = getRawStore();
  assert.ok(rawStore);
  assert.ok(Array.isArray(rawStore.payments));
});

test('Resilience: missing rentals and productionOrders arrays are restored while preserving clients and documents', () => {
  setRawStore({
    clients: [
      {
        id: 'cli-survivor',
        companyName: 'Survivor Ltd',
        country: 'Ghana',
        status: 'active',
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-10-28T10:00:00.000Z',
      },
    ],
    documents: [],
    payments: [],
    // rentals and productionOrders omitted
  });

  const ops = getOperationsData();
  assert.ok(Array.isArray(ops.rentals));
  assert.ok(Array.isArray(ops.productionOrders));
  assert.ok(ops.rentals.length > 0);
  assert.ok(ops.productionOrders.length > 0);

  // Check that the existing client wasn't wiped out
  const rawStore = getRawStore();
  assert.ok(rawStore);
  assert.equal((rawStore.clients as Client[])[0]?.id, 'cli-survivor');
});

test('Resilience: non-object or null state in localStorage resets to seed data', async () => {
  mockLocalStorage.setItem(STORAGE_KEY, 'null');
  const clients1 = await customFetch<Client[]>('/api/clients');
  assert.ok(clients1.length >= 3);

  mockLocalStorage.setItem(STORAGE_KEY, '"a primitive string"');
  const clients2 = await customFetch<Client[]>('/api/clients');
  assert.ok(clients2.length >= 3);
});
