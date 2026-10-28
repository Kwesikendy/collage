import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { customFetch, resetStore, ApiError, calculateDocumentPricing } from './setup.ts';
import type {
  Client,
  DocumentInput,
  Payment,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('Adversarial: special characters, quotes, and unicode in client inputs are preserved safely', async () => {
  const xssCompanyName = `<script>alert("XSS")</script> & "O'Reilly" <Partners> 🇬🇭`;
  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify({
      companyName: xssCompanyName,
      contactName: `CEO & Founder <test@domain.com>`,
      city: `Accra / Osu "Re"`,
    }),
  });

  assert.equal(created.companyName, xssCompanyName);
  assert.equal(created.contactName, `CEO & Founder <test@domain.com>`);
  assert.equal(created.city, `Accra / Osu "Re"`);

  // Verify retrieval fidelity
  const fetched = await customFetch<Client>(`/api/clients/${created.id}`);
  assert.equal(fetched.companyName, xssCompanyName);
});

test('Adversarial: 100% discount reduces taxable base, taxes, and total to 0.00', () => {
  const pricing = calculateDocumentPricing({
    items: [{ description: 'Promotional Giveaway Banners', quantity: 10, days: 1, unitPrice: 100 }],
    discountPercent: 100,
    getfundRate: 2.5,
    nhilRate: 2.5,
    vatRate: 15,
  });

  assert.equal(pricing.subtotal, '1000.00');
  assert.equal(pricing.discountAmount, '1000.00');
  assert.equal(pricing.getfundAmount, '0.00');
  assert.equal(pricing.nhilAmount, '0.00');
  assert.equal(pricing.vatAmount, '0.00');
  assert.equal(pricing.total, '0.00');
});

test('Adversarial: document with zero items creates valid document with zero balance', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];

  const doc = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'quotation',
      clientId: client.id,
      subject: 'Empty Shell Quotation',
      issueDate: '2026-10-28',
      items: [],
      discountPercent: 0,
      getfundRate: 2.5,
      nhilRate: 2.5,
      vatRate: 15,
    }),
  });

  assert.equal(doc.subtotal, 0);
  assert.equal(doc.total, 0);
  assert.equal(doc.balance, 0);
});

test('Adversarial: boundary payment of exactly 0.01 GHS', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Micro Charge Item',
      issueDate: '2026-10-28',
      items: [{ description: 'Stamp', quantity: 1, days: 1, unitPrice: 0.01 }],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0,
    }),
  });

  assert.equal(invoice.total, 0.01);
  assert.equal(invoice.balance, 0.01);

  // Pay exactly 0.01
  const payment = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 0.01, method: 'momo' }),
  });

  assert.equal(payment.amount, 0.01);

  const reloaded = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(reloaded.status, 'paid');
  assert.equal(reloaded.balance, 0);
});

test('Adversarial: unhandled routes and verbs return 404 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/non-existent-endpoint');
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Endpoint not found/i);
      return true;
    },
  );

  await assert.rejects(
    async () => {
      await customFetch('/api/clients/cli-eugenia', { method: 'DELETE' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Endpoint not found/i);
      return true;
    },
  );
});
