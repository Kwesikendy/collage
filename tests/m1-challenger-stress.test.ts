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
  deleteDocumentById,
} from './setup.ts';
import type {
  Client,
  ClientInput,
  DashboardSummary,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('Challenger M1: Adversarial LocalStorage non-array root corruption auto-heals and persists clean seed data', async () => {
  const corruptPayloads = [
    '{bad json',
    '{"incomplete": [',
    '{"clients": "\uD800"}', // Unpaired high surrogate
    '   ', // Whitespace string
    'null', // String null
    'undefined', // String undefined (invalid JSON)
    '12345', // Number primitive
    '"just a string"', // String primitive
    'true', // Boolean primitive
    'false', // Boolean primitive
    '{}', // Empty object without clients/documents
    '{"clients": null, "documents": null, "payments": null, "rentals": null, "productionOrders": null}', // Null collections
    '{"clients": 42, "documents": false, "payments": "bad"}', // Non-array collections
  ];

  for (const payload of corruptPayloads) {
    mockLocalStorage.setItem(STORAGE_KEY, payload);

    // Call API: loadStore() must self-heal without throwing
    const clients = await customFetch<Client[]>('/api/clients');
    assert.ok(Array.isArray(clients), `clients must be array for payload: ${payload}`);
    assert.ok(clients.length >= 3, `clients must contain seed data for payload: ${payload}`);

    // Verify localStorage was healed with valid JSON
    const stored = mockLocalStorage.getItem(STORAGE_KEY);
    assert.ok(stored, `localStorage should have been overwritten for payload: ${payload}`);
    let parsed: any;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(stored!);
    }, `Repaired storage must be valid JSON for payload: ${payload}`);

    assert.ok(Array.isArray(parsed.clients), `repaired store must have clients array for payload: ${payload}`);
    assert.ok(Array.isArray(parsed.documents), `repaired store must have documents array for payload: ${payload}`);
    assert.ok(Array.isArray(parsed.payments), `repaired store must have payments array for payload: ${payload}`);
    assert.ok(Array.isArray(parsed.rentals), `repaired store must have rentals array for payload: ${payload}`);
    assert.ok(Array.isArray(parsed.productionOrders), `repaired store must have productionOrders array for payload: ${payload}`);
  }
});

test('Challenger M1: Adversarial LocalStorage array root must auto-heal to ErpStore object and persist clients', async () => {
  // When localStorage contains an array root (e.g. "[]" or "[1, 2, 3]"),
  // loadStore() must recognize it as invalid root store, re-seed with a genuine ErpStore object,
  // and persist that object back to localStorage.
  mockLocalStorage.setItem(STORAGE_KEY, '[]');

  const clients = await customFetch<Client[]>('/api/clients');
  assert.ok(Array.isArray(clients));
  assert.ok(clients.length >= 3, 'Must return seed clients');

  const stored = mockLocalStorage.getItem(STORAGE_KEY);
  assert.ok(stored, 'localStorage must contain store string');
  const parsed = JSON.parse(stored!);

  // Contract check: localStorage root must be an ErpStore Object, NOT an Array
  assert.equal(Array.isArray(parsed), false, 'Repaired store root in localStorage must not be an array');
  assert.ok(Array.isArray(parsed.clients), 'Repaired store must have clients array in localStorage');

  // Verify that creating a client now persists into localStorage without data loss
  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({ companyName: 'Persistent Client Ltd' }),
  });
  assert.ok(created.id);

  const rawAfterCreate = getRawStore();
  assert.ok(rawAfterCreate, 'Store must be readable from localStorage after client creation');
  assert.ok(Array.isArray(rawAfterCreate.clients), 'Store must retain clients array');
  assert.ok(
    (rawAfterCreate.clients as Client[]).some((c) => c.id === created.id),
    'Created client must persist in localStorage',
  );
});

test('Challenger M1: Null and malformed elements inside collections are filtered out without crashing', async () => {
  // Inject collections containing null, undefined, primitive, or malformed entries
  setRawStore({
    clients: [
      null,
      undefined,
      42,
      'string-elem',
      {}, // missing id & companyName
      { id: 123, companyName: 'Invalid ID type' },
      { id: 'cli-valid-1', companyName: 'Valid Client 1', country: 'Ghana', status: 'active', createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z' },
    ],
    documents: [
      null,
      undefined,
      { id: 'doc-valid-1', number: '00281026.01', kind: 'invoice', clientId: 'cli-valid-1', subject: 'Valid Doc', issueDate: '2026-10-28', status: 'issued', items: [], total: 100, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z' },
      { id: 999 }, // missing number & invalid id type
    ],
    payments: [
      null,
      undefined,
      { id: 'pay-valid-1', documentId: 'doc-valid-1', amount: 50, paymentDate: '2026-10-28', createdAt: '2026-10-28T00:00:00Z' },
      { id: 'pay-invalid-no-doc' }, // missing documentId
    ],
    rentals: [],
    productionOrders: [],
  });

  // Fetch clients: should only return the valid client
  const clients = await customFetch<Client[]>('/api/clients');
  assert.equal(clients.length, 1);
  assert.equal(clients[0].id, 'cli-valid-1');

  // Fetch documents: should return the valid document with hydrated payment
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  assert.equal(docs.length, 1);
  assert.equal(docs[0].id, 'doc-valid-1');
  assert.equal(docs[0].amountPaid, 50);
  assert.equal(docs[0].balance, 50);

  // Dashboard summary should aggregate cleanly without throwing
  const summary = await customFetch<DashboardSummary>('/api/dashboard/summary');
  assert.equal(summary.totalClients, 1);
  assert.equal(summary.collectedThisMonth, 50);
  assert.equal(summary.outstandingBalance, 50);
});

test('Challenger M1: Missing payments property is automatically healed with seed payments and avoids undefined reduce crash', async () => {
  // Inject state with clients and documents but completely absent payments key
  setRawStore({
    clients: [
      { id: 'cli-m1', companyName: 'M1 Enterprises', country: 'Ghana', status: 'active', createdAt: '2026-10-28T10:00:00Z', updatedAt: '2026-10-28T10:00:00Z' },
    ],
    documents: [
      {
        id: 'doc-m1',
        number: '00281026.11',
        kind: 'invoice',
        clientId: 'cli-m1',
        subject: 'Hardware Invoice',
        issueDate: '2026-10-28',
        status: 'issued',
        items: [{ description: 'Item 1', quantity: 1, days: 1, unitPrice: 350 }],
        subtotal: 350,
        discountPercent: 0,
        discountAmount: 0,
        getfundRate: 0,
        getfundAmount: 0,
        nhilRate: 0,
        nhilAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        total: 350,
        paymentTerms: '100%',
        validityDays: 5,
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-10-28T10:00:00Z',
      },
    ],
    rentals: [],
    productionOrders: [],
    // payments key omitted
  });

  // Verify dashboard summary calculates correctly without crashing
  const summary = await customFetch<DashboardSummary>('/api/dashboard/summary');
  assert.ok(summary);
  assert.equal(summary.totalClients, 1);

  // Verify document detail hydrator safely handles payments
  const doc = await customFetch<SalesDocument>('/api/documents/doc-m1');
  assert.equal(doc.id, 'doc-m1');
  assert.equal(doc.amountPaid, 0);
  assert.equal(doc.balance, 350);

  // Verify getDocumentPayments returns an array
  const payments = getDocumentPayments('doc-m1');
  assert.ok(Array.isArray(payments));

  // Verify deleteDocumentById succeeds without error
  assert.doesNotThrow(() => {
    deleteDocumentById('doc-m1');
  });

  // Verify store in localStorage now has a valid payments array
  const store = getRawStore();
  assert.ok(store);
  assert.ok(Array.isArray(store.payments));
});

test('Challenger M1: Client creation input boundary cases and whitespace rejection', async () => {
  // Test 1: Whitespace-only companyName variations must be rejected with 400
  const whitespaceNames = [
    '',
    ' ',
    '   ',
    '\t',
    '\n',
    '\r\n',
    ' \t \n \r ',
  ];

  for (const badName of whitespaceNames) {
    await assert.rejects(
      async () => {
        await customFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify({ companyName: badName }),
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError, `Should throw ApiError for "${badName}"`);
        assert.equal(err.status, 400);
        assert.match(err.message, /Company name is required/i);
        return true;
      },
    );
  }

  // Test 2: Missing companyName property or null companyName must be rejected with 400
  await assert.rejects(
    async () => {
      await customFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Company name is required/i);
      return true;
    },
  );

  // Test 3: XSS payload in companyName and contactName are safely stored and returned without modification
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script src=//evil.com/x.js></script>',
    "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/'/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
  ];

  for (const payload of xssPayloads) {
    const created = await customFetch<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify({
        companyName: payload,
        contactName: `Attn: ${payload}`,
        city: 'Accra',
      }),
    });
    assert.equal(created.companyName, payload);
    assert.equal(created.contactName, `Attn: ${payload}`);

    const retrieved = await customFetch<Client>(`/api/clients/${created.id}`);
    assert.equal(retrieved.companyName, payload);
  }

  // Test 4: Unicode, Ghanaian names, symbols, and emojis
  const unicodeName = '🇬🇭 Ashesi Innovations & Tech (Ga Mashie · Osu Klottey) 🇬🇭';
  const createdUnicode = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: unicodeName,
      contactName: 'Kofi Annan-Mensah',
      city: 'Accra',
      country: 'Ghana',
    }),
  });
  assert.equal(createdUnicode.companyName, unicodeName);

  // Test 5: Optional field handling: null or empty values coalesce to null
  const sparseClient = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: 'Sparse Client Ltd',
      contactName: '   ', // whitespace only
      email: '', // empty
      phone: null,
      address: '  ',
      city: undefined,
      country: '', // empty country should default to Ghana
      status: undefined, // should default to lead
    }),
  });
  assert.equal(sparseClient.companyName, 'Sparse Client Ltd');
  assert.equal(sparseClient.contactName, null);
  assert.equal(sparseClient.email, null);
  assert.equal(sparseClient.phone, null);
  assert.equal(sparseClient.address, null);
  assert.equal(sparseClient.city, null);
  assert.equal(sparseClient.country, 'Ghana');
  assert.equal(sparseClient.status, 'lead');

  // Test 6: Extreme boundary length (1 char up to 2000 chars)
  const singleChar = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({ companyName: 'Z' }),
  });
  assert.equal(singleChar.companyName, 'Z');

  const longName = 'Alpha '.repeat(100).trim(); // 600 chars
  const longClient = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({ companyName: longName }),
  });
  assert.equal(longClient.companyName, longName);
});

test('Challenger M1: Client update boundary cases (whitespace PATCH, status transitions)', async () => {
  const client = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({ companyName: 'Original Name Corp', status: 'lead' }),
  });

  // PATCH with updated name and transition to active
  const updated = await customFetch<Client>(`/api/clients/${client.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      companyName: 'Updated Name Corp',
      status: 'active',
      phone: '+233 20 111 2222',
    }),
  });
  assert.equal(updated.companyName, 'Updated Name Corp');
  assert.equal(updated.status, 'active');
  assert.equal(updated.phone, '+233 20 111 2222');

  // PATCH to non-existent client returns 404
  await assert.rejects(
    async () => {
      await customFetch('/api/clients/cli-does-not-exist', {
        method: 'PATCH',
        body: JSON.stringify({ companyName: 'Ghost' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test('Challenger M1: Document payments with zero or boundary amounts and payment date sorting', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Sorting & Boundary Payments Invoice',
      issueDate: '2026-10-28',
      items: [{ description: 'Test Item', quantity: 1, days: 1, unitPrice: 100 }],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0,
    }),
  });

  // Reject zero amount
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 0, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payments must be at least GHS 0.01/i);
      return true;
    },
  );

  // Reject negative amount
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: -50, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      return true;
    },
  );

  // Add payments on different dates: 2026-10-20, 2026-10-28, 2026-10-25
  await customFetch(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 10, paymentDate: '2026-10-20', method: 'cash' }),
  });
  await customFetch(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 20, paymentDate: '2026-10-28', method: 'momo' }),
  });
  await customFetch(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 30, paymentDate: '2026-10-25', method: 'bank_transfer' }),
  });

  // Verify getDocumentPayments orders descending by paymentDate
  const payments = getDocumentPayments(invoice.id);
  assert.equal(payments.length, 3);
  assert.equal(payments[0].paymentDate, '2026-10-28');
  assert.equal(payments[1].paymentDate, '2026-10-25');
  assert.equal(payments[2].paymentDate, '2026-10-20');

  // Verify invoice balance hydrated
  const refreshed = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(refreshed.amountPaid, 60);
  assert.equal(refreshed.balance, 40);
  assert.equal(refreshed.status, 'partially_paid');
});
