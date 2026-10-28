import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { customFetch, resetStore, ApiError } from './setup.ts';
import type {
  Client,
  DocumentInput,
  DocumentUpdate,
  Payment,
  PaymentInput,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('GET /api/documents lists documents with clientName, amountPaid, and balance hydrated', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  assert.ok(Array.isArray(docs));
  assert.ok(docs.length > 0);

  for (const doc of docs) {
    assert.ok(doc.id);
    assert.ok(doc.number);
    assert.ok(['quotation', 'invoice'].includes(doc.kind));
    assert.ok(typeof doc.clientName === 'string', 'clientName should be hydrated');
    assert.ok(typeof doc.amountPaid === 'number', 'amountPaid should be a number');
    assert.ok(typeof doc.balance === 'number', 'balance should be a number');
    assert.ok(doc.balance >= 0, 'balance should not be negative');
    assert.equal(
      Math.round((doc.total - doc.amountPaid) * 100) / 100,
      doc.balance,
      'balance should equal total - amountPaid (rounded)',
    );
  }
});

test('GET /api/documents filtering by kind, status, and search query', async () => {
  const quotesOnly = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  assert.ok(quotesOnly.length > 0);
  assert.ok(quotesOnly.every((d) => d.kind === 'quotation'));

  const invoicesOnly = await customFetch<SalesDocument[]>('/api/documents?kind=invoice');
  assert.ok(invoicesOnly.length > 0);
  assert.ok(invoicesOnly.every((d) => d.kind === 'invoice'));

  const searchEcobank = await customFetch<SalesDocument[]>('/api/documents?search=Ecobank');
  assert.ok(searchEcobank.length > 0);
  assert.ok(
    searchEcobank.every(
      (d) =>
        d.clientName.toLowerCase().includes('ecobank') ||
        d.subject.toLowerCase().includes('ecobank') ||
        d.number.toLowerCase().includes('ecobank'),
    ),
  );
});

test('POST /api/documents creates quotation and applies statutory Ghanaian taxes (GETFund 2.5%, NHIL 2.5%, VAT 15%)', async () => {
  const clients = await customFetch<Client[]>('/api/clients?status=active');
  const client = clients[0];

  const payload: DocumentInput = {
    kind: 'quotation',
    clientId: client.id,
    subject: 'Corporate Branding & Banners',
    issueDate: '2026-10-28',
    dueDate: '2026-11-04',
    items: [
      {
        description: 'Telescopic Double Sided Flags',
        quantity: 2,
        days: 1,
        unitPrice: 500, // Subtotal: 1000
      },
      {
        description: 'Stage Backdrop Frame Rental',
        quantity: 1,
        days: 2,
        unitPrice: 250, // Subtotal: 500 -> Total Subtotal: 1500
      },
    ],
    discountPercent: 10, // 10% discount on 1500 = 150 -> Taxable: 1350
    getfundRate: 2.5,   // 2.5% of 1350 = 33.75
    nhilRate: 2.5,      // 2.5% of 1350 = 33.75
    vatRate: 15,        // 15% of (1350 + 33.75 + 33.75 = 1417.50) = 212.63
  };

  const doc = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  assert.ok(doc.id.startsWith('doc-'));
  assert.ok(doc.number.startsWith('QT00281026.'));
  assert.equal(doc.kind, 'quotation');
  assert.equal(doc.clientId, client.id);
  assert.equal(doc.clientName, client.companyName);
  assert.equal(doc.subtotal, 1500);
  assert.equal(doc.discountPercent, 10);
  assert.equal(doc.discountAmount, 150);
  assert.equal(doc.getfundRate, 2.5);
  assert.equal(doc.getfundAmount, 33.75);
  assert.equal(doc.nhilRate, 2.5);
  assert.equal(doc.nhilAmount, 33.75);
  assert.equal(doc.vatRate, 15);
  assert.equal(doc.vatAmount, 202.5);
  assert.equal(doc.total, 1620);
  assert.equal(doc.amountPaid, 0);
  assert.equal(doc.balance, 1620);
});

test('POST /api/documents rejects archived client with 400 ApiError', async () => {
  // Archive Eugenia client first
  await customFetch('/api/clients/cli-eugenia/archive', { method: 'POST' });

  const payload: DocumentInput = {
    kind: 'invoice',
    clientId: 'cli-eugenia',
    subject: 'Archived Client Order',
    issueDate: '2026-10-28',
    items: [{ description: 'Item 1', quantity: 1, days: 1, unitPrice: 100 }],
  };

  await assert.rejects(
    async () => {
      await customFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(payload),
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

test('POST /api/documents rejects missing issueDate with 400 ApiError', async () => {
  const payload = {
    kind: 'quotation',
    clientId: 'cli-ecobank-gh',
    subject: 'Missing Issue Date',
    issueDate: '',
    items: [{ description: 'Item 1', quantity: 1, days: 1, unitPrice: 100 }],
  };

  await assert.rejects(
    async () => {
      await customFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /An issue date is required/i);
      return true;
    },
  );
});

test('GET /api/documents/:id retrieves single document with hydrated balances', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  const target = docs[0];

  const fetched = await customFetch<SalesDocument>(`/api/documents/${target.id}`);
  assert.equal(fetched.id, target.id);
  assert.equal(fetched.number, target.number);
  assert.equal(fetched.clientName, target.clientName);
  assert.equal(fetched.balance, target.balance);
});

test('GET /api/documents/:id returns 404 ApiError for unknown id', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/documents/doc-unknown-id-404');
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Document not found/i);
      return true;
    },
  );
});

test('PATCH /api/documents/:id updates fields and recalculates pricing', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const target = docs[0];

  const updatePayload: DocumentUpdate = {
    subject: 'Updated Scope: Brand Assets & Stage Wall',
    items: [
      { description: 'Double sided banner print', quantity: 4, days: 1, unitPrice: 300 },
    ],
    discountPercent: 5,
  };

  const updated = await customFetch<SalesDocument>(`/api/documents/${target.id}`, {
    method: 'PATCH',
    body: JSON.stringify(updatePayload),
  });

  assert.equal(updated.id, target.id);
  assert.equal(updated.subject, 'Updated Scope: Brand Assets & Stage Wall');
  assert.equal(updated.subtotal, 1200);
  assert.equal(updated.discountPercent, 5);
  assert.equal(updated.discountAmount, 60); // 5% of 1200 = 60
});

test('PATCH /api/documents/:id returns 404 ApiError for unknown id', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/documents/doc-unknown-id-404', {
        method: 'PATCH',
        body: JSON.stringify({ subject: 'Nope' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Document not found/i);
      return true;
    },
  );
});

test('POST /api/documents/:id/convert converts quotation to invoice and advances status to accepted', async () => {
  const quotes = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const quote = quotes[0];

  const convertedInvoice = await customFetch<SalesDocument>(`/api/documents/${quote.id}/convert`, {
    method: 'POST',
  });

  assert.equal(convertedInvoice.kind, 'invoice');
  assert.equal(convertedInvoice.clientId, quote.clientId);
  assert.equal(convertedInvoice.subject, quote.subject);
  assert.ok(convertedInvoice.number.startsWith('00'));
  assert.equal(convertedInvoice.status, 'issued');

  // Verify the original quotation has advanced status 'accepted'
  const reloadedQuote = await customFetch<SalesDocument>(`/api/documents/${quote.id}`);
  assert.equal(reloadedQuote.status, 'accepted');
});

test('POST /api/documents/:id/convert returns 400 ApiError if quotation is declined or cancelled', async () => {
  const quotes = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const quote = quotes[0];

  // Set quote status to declined
  await customFetch(`/api/documents/${quote.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'declined' }),
  });

  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${quote.id}/convert`, { method: 'POST' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Declined or cancelled quotations cannot become invoices/i);
      return true;
    },
  );
});

test('POST /api/documents/:id/convert returns 404 ApiError for unknown or invoice id', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/documents/doc-unknown-404/convert', { method: 'POST' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Quotation not found/i);
      return true;
    },
  );

  // Calling convert on an existing invoice must return 404
  const invoices = await customFetch<SalesDocument[]>('/api/documents?kind=invoice');
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoices[0].id}/convert`, { method: 'POST' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Quotation not found/i);
      return true;
    },
  );
});

test('POST /api/documents/:id/payments records partial and full payments, correctly reducing balance and updating status', async () => {
  // Create a clean invoice with a known total
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Print and Signage Project',
      issueDate: '2026-10-28',
      items: [
        { description: 'Signage Panel', quantity: 1, days: 1, unitPrice: 1000 },
      ],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0, // Total = 1000.00
    }),
  });

  assert.equal(invoice.total, 1000);
  assert.equal(invoice.balance, 1000);

  // 1. Record partial payment of 400
  const partialPaymentPayload: PaymentInput = {
    amount: 400,
    paymentDate: '2026-10-28',
    method: 'bank_transfer',
    reference: 'TRX-ECO-001',
  };

  const payment1 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify(partialPaymentPayload),
  });

  assert.equal(payment1.amount, 400);
  assert.equal(payment1.documentId, invoice.id);
  assert.equal(payment1.method, 'bank_transfer');
  assert.equal(payment1.reference, 'TRX-ECO-001');

  // Verify invoice status is 'partially_paid' and balance is 600
  const partiallyPaidDoc = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(partiallyPaidDoc.status, 'partially_paid');
  assert.equal(partiallyPaidDoc.amountPaid, 400);
  assert.equal(partiallyPaidDoc.balance, 600);

  // 2. Reject overpayment (> remaining balance 600)
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 600.01, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payment exceeds the remaining invoice balance/i);
      return true;
    },
  );

  // 3. Record remaining payment of 600
  const payment2 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 600, method: 'momo', reference: 'MOMO-7712' }),
  });
  assert.equal(payment2.amount, 600);

  // Verify invoice status is 'paid' and balance is 0
  const fullyPaidDoc = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(fullyPaidDoc.status, 'paid');
  assert.equal(fullyPaidDoc.amountPaid, 1000);
  assert.equal(fullyPaidDoc.balance, 0);
});

test('POST /api/documents/:id/payments rejects payments on quotations with 400 ApiError', async () => {
  const quote = (await customFetch<SalesDocument[]>('/api/documents?kind=quotation'))[0];

  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${quote.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payments can only be recorded against invoices/i);
      return true;
    },
  );
});

test('POST /api/documents/:id/payments rejects non-positive payment amount with 400 ApiError', async () => {
  const invoice = (await customFetch<SalesDocument[]>('/api/documents?kind=invoice'))[0];

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

  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: -100, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payments must be at least GHS 0.01/i);
      return true;
    },
  );
});
