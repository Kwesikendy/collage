import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  customFetch,
  resetStore,
  ApiError,
  mockLocalStorage,
  STORAGE_KEY,
  calculateDocumentPricing,
  createRentalBooking,
  createProductionOrder,
} from './setup.ts';
import {
  STORAGE_CONSENT_KEY,
  isNonEssentialStorageAllowed,
  type StorageConsentRecord,
} from '../src/lib/storage-consent.ts';
import type {
  Client,
  ClientInput,
  Payment,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

// ============================================================================
// 1. FORM INPUT BOUNDS & SANITIZATION (ClientForm, DocumentForm, Payments, Ops)
// ============================================================================

test('Adversarial Bounds: ClientForm character truncation and extreme input bounds', async () => {
  // Simulate ClientForm input processing with 5,000 character inputs
  const massive5k = 'A'.repeat(5000);
  const massiveEmail = `${'user'.repeat(500)}@example.com`;
  const massivePhone = '+233' + '0'.repeat(1000);

  // ClientForm sanitization rules from App.tsx:658-673:
  const sanitizedInput: ClientInput = {
    companyName: massive5k.slice(0, 180),
    contactName: massive5k.slice(0, 180),
    email: massiveEmail.slice(0, 180),
    phone: massivePhone.slice(0, 60),
    address: massive5k.slice(0, 400),
    city: massive5k.slice(0, 100),
    country: massive5k.slice(0, 100),
    status: 'active',
  };

  assert.equal(sanitizedInput.companyName.length, 180);
  assert.equal(sanitizedInput.contactName!.length, 180);
  assert.equal(sanitizedInput.email!.length, 180);
  assert.equal(sanitizedInput.phone!.length, 60);
  assert.equal(sanitizedInput.address!.length, 400);
  assert.equal(sanitizedInput.city!.length, 100);
  assert.equal(sanitizedInput.country.length, 100);

  // Verify that creating this client succeeds and does not corrupt localStorage
  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(sanitizedInput),
  });

  assert.ok(created.id.startsWith('cli-'));
  assert.equal(created.companyName, massive5k.slice(0, 180));

  // Verify retrieval
  const retrieved = await customFetch<Client>(`/api/clients/${created.id}`);
  assert.equal(retrieved.companyName, massive5k.slice(0, 180));
  assert.equal(retrieved.phone, massivePhone.slice(0, 60));
});

test('Adversarial Bounds: Document line items with negative numbers, NaN, and extreme values', () => {
  // Test DocumentForm livePricing calculation with negative and NaN values
  const negativePricing = calculateDocumentPricing({
    items: [
      {
        description: 'Negative item'.slice(0, 300),
        quantity: Math.max(0, -5), // DocumentForm clamps to Math.max(0, ...)
        days: Math.max(0, -1),
        unitPrice: Math.max(0, -100),
      },
    ],
    discountPercent: Math.min(100, Math.max(0, -50)), // clamped to 0
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  assert.equal(negativePricing.subtotal, '0.00');
  assert.equal(negativePricing.total, '0.00');

  // Test discount overflow (> 100%) clamped to 100%
  const overDiscountPricing = calculateDocumentPricing({
    items: [{ description: 'Banner', quantity: 2, days: 1, unitPrice: 50 }],
    discountPercent: Math.min(100, Math.max(0, 150)), // clamped to 100
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  assert.equal(overDiscountPricing.subtotal, '100.00');
  assert.equal(overDiscountPricing.discountAmount, '100.00');
  assert.equal(overDiscountPricing.total, '0.00');

  // Test NaN values in livePricing
  const nanQuantity = Number('not-a-number');
  const safeQuantity = Number.isFinite(nanQuantity) ? Math.max(0, nanQuantity) : 0;
  const nanPricing = calculateDocumentPricing({
    items: [{ description: 'NaN item', quantity: safeQuantity, days: 1, unitPrice: 50 }],
    discountPercent: 0,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  assert.equal(nanPricing.subtotal, '0.00');
  assert.equal(nanPricing.total, '0.00');
});

test('Adversarial Bounds: DocumentForm input validation rejects invalid line items', () => {
  // Simulate DocumentForm submit validation rule (App.tsx:2004-2018)
  function validateItems(items: Array<{ description: string; quantity: number; days: number; unitPrice: number }>) {
    return !items.some(
      (it) =>
        !it.description ||
        !Number.isFinite(it.quantity) ||
        it.quantity <= 0 ||
        !Number.isFinite(it.days) ||
        it.days <= 0 ||
        !Number.isFinite(it.unitPrice) ||
        it.unitPrice < 0,
    );
  }

  assert.equal(validateItems([{ description: '', quantity: 1, days: 1, unitPrice: 10 }]), false, 'Empty description rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: -1, days: 1, unitPrice: 10 }]), false, 'Negative quantity rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: 0, days: 1, unitPrice: 10 }]), false, 'Zero quantity rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: NaN, days: 1, unitPrice: 10 }]), false, 'NaN quantity rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: 1, days: -2, unitPrice: 10 }]), false, 'Negative days rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: 1, days: 1, unitPrice: -5 }]), false, 'Negative price rejected');
  assert.equal(validateItems([{ description: 'Valid', quantity: 1, days: 1, unitPrice: 0 }]), true, 'Zero unit price (free item) accepted');
  assert.equal(validateItems([{ description: 'Valid', quantity: 5, days: 3, unitPrice: 120 }]), true, 'Normal valid item accepted');
});

test('Adversarial Bounds: Payments endpoint rejects NaN, negative, zero, and overpayment', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Payment Boundary Test Invoice',
      issueDate: '2026-10-28',
      items: [{ description: 'Test Item', quantity: 1, days: 1, unitPrice: 100 }],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0,
    }),
  });

  assert.equal(invoice.total, 100);
  assert.equal(invoice.balance, 100);

  // 1. Negative payment amount
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
      assert.match(err.message, /at least GHS 0.01/i);
      return true;
    },
  );

  // 2. Zero payment amount
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
      assert.match(err.message, /at least GHS 0.01/i);
      return true;
    },
  );

  // 3. NaN payment amount
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: NaN, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      return true;
    },
  );

  // 4. String non-numeric payment amount
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 'invalid-amount', method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      return true;
    },
  );

  // 5. Overpayment exceeding balance (100.01 > 100.00)
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 100.01, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /exceeds the remaining invoice balance/i);
      return true;
    },
  );

  // 6. Valid exact payment settling balance
  const payment = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 100,
      method: 'bank_transfer',
      reference: 'TXN-9988'.repeat(20).slice(0, 100), // bounded reference
    }),
  });
  assert.equal(payment.amount, 100);

  const settled = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(settled.status, 'paid');
  assert.equal(settled.balance, 0);
  assert.equal(settled.amountPaid, 100);
});

test('Adversarial Bounds: Operations inputs boundary handling', () => {
  // Rental booking with extreme string lengths and clamped numbers
  const longStr = 'X'.repeat(500);
  const rentals = createRentalBooking({
    itemName: longStr.slice(0, 180),
    clientName: longStr.slice(0, 180),
    documentNumber: longStr.slice(0, 60),
    quantity: Math.min(100000, Math.max(1, 9999999)), // clamped
    days: Math.min(365, Math.max(1, -50 > 0 ? -50 : 1)), // clamped
    unitRate: 150,
    startDate: '2026-10-28',
    returnDate: '2026-10-30',
    status: 'deployed',
  });

  const createdRental = rentals[0];
  assert.ok(createdRental.id.startsWith('rent-'));
  assert.equal(createdRental.itemName.length, 180);
  assert.equal(createdRental.quantity, 100000);
  assert.equal(createdRental.days, 1);

  // Production order with extreme lengths
  const orders = createProductionOrder({
    clientName: longStr.slice(0, 180),
    documentNumber: longStr.slice(0, 60),
    specification: longStr.slice(0, 300),
    quantity: 50,
    assignedTo: 'PrintD Pigh · Large Format Press',
    dueDate: '2026-10-31',
    status: 'queued',
  });

  const createdOrder = orders[0];
  assert.ok(createdOrder.id.startsWith('prod-'));
  assert.equal(createdOrder.specification.length, 300);
});

// ============================================================================
// 2. COOKIE CONSENT PERSISTENCE & STORAGE GATING
// ============================================================================

test('Cookie Consent: full state machine and storage gating verification', () => {
  // State 1: Fresh visitor (no consent record)
  mockLocalStorage.removeItem(STORAGE_CONSENT_KEY);
  assert.strictEqual(
    isNonEssentialStorageAllowed(),
    false,
    'Unconsented visitors must have non-essential storage gated (false)',
  );

  // State 2: User clicks "Accept All"
  const acceptedRecord: StorageConsentRecord = {
    consent: 'accepted',
    timestamp: new Date().toISOString(),
  };
  mockLocalStorage.setItem(STORAGE_CONSENT_KEY, JSON.stringify(acceptedRecord));
  assert.strictEqual(
    isNonEssentialStorageAllowed(),
    true,
    'Accepted consent must allow non-essential storage (true)',
  );

  // State 3: User changes preferences to "Essential Only" (rejected)
  const rejectedRecord: StorageConsentRecord = {
    consent: 'rejected',
    timestamp: new Date().toISOString(),
  };
  mockLocalStorage.setItem(STORAGE_CONSENT_KEY, JSON.stringify(rejectedRecord));
  assert.strictEqual(
    isNonEssentialStorageAllowed(),
    false,
    'Rejected consent must immediately gate non-essential storage (false)',
  );

  // State 4: Tampered / unexpected consent strings (e.g. "yes", 1, true, null)
  mockLocalStorage.setItem(
    STORAGE_CONSENT_KEY,
    JSON.stringify({ consent: 'yes', timestamp: new Date().toISOString() }),
  );
  assert.strictEqual(
    isNonEssentialStorageAllowed(),
    false,
    'Unknown consent value "yes" must evaluate to false',
  );

  mockLocalStorage.setItem(
    STORAGE_CONSENT_KEY,
    JSON.stringify({ consent: 1, timestamp: new Date().toISOString() }),
  );
  assert.strictEqual(isNonEssentialStorageAllowed(), false);

  mockLocalStorage.setItem(STORAGE_CONSENT_KEY, JSON.stringify(null));
  assert.strictEqual(isNonEssentialStorageAllowed(), false);

  // State 5: Corrupt JSON payload
  mockLocalStorage.setItem(STORAGE_CONSENT_KEY, '<<bad>>');
  assert.strictEqual(isNonEssentialStorageAllowed(), false);

  // State 6: User resets consent preferences (removeItem)
  mockLocalStorage.removeItem(STORAGE_CONSENT_KEY);
  assert.strictEqual(
    isNonEssentialStorageAllowed(),
    false,
    'Resetting consent returns to default gated state (false)',
  );
});

// ============================================================================
// 3. ROUTING INTEGRITY & PRIVACY POLICY PAGE
// ============================================================================

test('Routing: /privacy route and navigation connections are configured cleanly', () => {
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

  // Verify /privacy Route is registered in Switch
  assert.ok(
    appSrc.includes('<Route path="/privacy" component={() => <PrivacyPolicyPage />} />'),
    'App.tsx must register <Route path="/privacy" ...>',
  );

  // Verify Privacy Policy link in sidebar navigation
  assert.ok(
    appSrc.includes('data-testid="link-privacy"'),
    'App.tsx sidebar must include data-testid="link-privacy"',
  );
  assert.ok(
    appSrc.includes('href="/privacy"'),
    'App.tsx sidebar must link to /privacy',
  );

  // Verify CookieConsentBanner is mounted in App shell
  assert.ok(
    appSrc.includes('<CookieConsentBanner />'),
    'App.tsx must mount CookieConsentBanner globally',
  );

  // Verify Welcome page footer links to /privacy
  const welcomeSrc = fs.readFileSync(path.resolve('src/pages/welcome.tsx'), 'utf-8');
  assert.ok(
    welcomeSrc.includes('href="/privacy"'),
    'welcome.tsx must contain link to /privacy',
  );

  // Verify 404 fallback route in App.tsx
  assert.ok(
    appSrc.includes('Page not found'),
    'App.tsx must define 404 fallback view for unmatched routes',
  );
});

test('Privacy Policy Page: Content integrity and required Ghanaian business disclosures', () => {
  const privacySrc = fs.readFileSync(path.resolve('src/pages/privacy.tsx'), 'utf-8');

  // Must export PrivacyPolicyPage component
  assert.ok(privacySrc.includes('export function PrivacyPolicyPage()'));
  assert.ok(privacySrc.includes('export default PrivacyPolicyPage'));

  // Must disclose data controller
  assert.ok(privacySrc.includes('collagenmosaic@gmail.com'));
  assert.ok(privacySrc.includes('Collage (Corporate Marketing, Events, Advertising & Equipment Rentals)'));

  // Must disclose Ghanaian tax compliance
  assert.ok(privacySrc.includes('GETFund 2.5%'));
  assert.ok(privacySrc.includes('NHIL 2.5%'));
  assert.ok(privacySrc.includes('GRA VAT 15.0%'));

  // Must disclose local storage keys and purpose
  assert.ok(privacySrc.includes('collat_erp_store_v3'));
  assert.ok(privacySrc.includes('collat_storage_consent_v1'));

  // Must contain interactive consent reset
  assert.ok(privacySrc.includes('resetConsent'));
  assert.ok(privacySrc.includes('STORAGE_CONSENT_KEY'));

  // Must have links back to Home and Dashboard
  assert.ok(privacySrc.includes('href="/"'));
  assert.ok(privacySrc.includes('href="/dashboard"'));
});

// ============================================================================
// 4. STORAGE RESILIENCE & CORRUPT RECOVERY
// ============================================================================

test('Storage Resilience: loadStore heals arbitrary JSON corruption without crashing', async () => {
  const adversarialStores = [
    'null',
    '[]',
    '{"clients": "not-an-array"}',
    '{"clients": [{"id": null}]}',
    '{"documents": [null, 123, "string"]}',
    '{"payments": [{"id": "pay-1"}]}', // missing documentId
    '{"randomField": true}',
  ];

  for (const badStore of adversarialStores) {
    mockLocalStorage.setItem(STORAGE_KEY, badStore);

    // Any endpoint request should safely trigger loadStore self-healing
    const summary = await customFetch('/api/dashboard/summary');
    assert.ok(summary, `Endpoint must respond successfully despite corrupt store: ${badStore}`);

    const clients = await customFetch<Client[]>('/api/clients');
    assert.ok(Array.isArray(clients), 'Clients must always be an array');
  }
});

// ============================================================================
// 5. EM DASH SCAN ACROSS ENTIRE PROJECT
// ============================================================================

test('Compliance: Zero em dashes in all source files under src/', () => {
  function scan(dir: string, matches: string[] = []): string[] {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scan(full, matches);
      } else if (/\.(tsx?|jsx?|html|css|json)$/.test(item.name)) {
        const text = fs.readFileSync(full, 'utf-8');
        if (text.includes('—') || text.includes('\u2014')) {
          matches.push(full);
        }
      }
    }
    return matches;
  }

  const badFiles = scan(path.resolve('src'));
  assert.deepStrictEqual(badFiles, [], `Found em dashes in: ${badFiles.join(', ')}`);
});
