import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  customFetch,
  resetStore,
  ApiError,
  setRawStore,
  getRawStore,
  deleteDocumentById,
  getDocumentPayments,
  amountToCents,
  centsToAmount,
} from './setup.ts';
import type {
  Client,
  DocumentInput,
  Payment,
  PaymentInput,
  SalesDocument,
} from '../src/lib/api-client/generated/api.schemas.ts';

// Helper mirroring App.tsx dateFmt logic
const appDateFmt = (date?: string | null) => {
  if (!date || isNaN(Date.parse(date))) return '-';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return '-';
  }
};

// Helper mirroring App.tsx DocumentDetail date formatting expression
const renderDocumentDetailDate = (issueDate?: string | null) => {
  return issueDate && !isNaN(Date.parse(issueDate))
    ? new Date(issueDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : appDateFmt(issueDate);
};

// Helper mirroring App.tsx DocumentDetail items mapping expression
const renderDocumentDetailItems = (doc: { items?: unknown[] | null }) => {
  return (doc.items || []).map((item, i) => ({ index: i, item }));
};

// Helper mirroring App.tsx operations ledger dynamic generation
const buildLedgerRows = (allDocs: SalesDocument[]) => {
  return allDocs.slice(0, 10).map((d) => ({
    id: d.id,
    date: appDateFmt(d.issueDate).replace(/\s\d{4}$/, ''),
    reference: d.number,
    scope: `${d.clientName || 'Client'} · ${d.subject || 'Project'}`,
    statusLabel:
      d.status === 'paid'
        ? 'Reconciled'
        : d.status === 'accepted'
          ? 'Pending Approval'
          : d.status === 'cancelled'
            ? 'Cancelled'
            : d.status === 'draft'
              ? 'Draft'
              : 'Sent',
    actionLabel: d.kind === 'invoice' && d.status === 'paid' ? 'Receipt →' : 'Open →',
    href: `/${d.kind === 'quotation' ? 'quotations' : 'invoices'}/${d.id}`,
  }));
};

beforeEach(() => {
  resetStore();
});

// =========================================================================
// 1. Document Rendering: Malformed / Empty issueDate Handling
// =========================================================================

test('Document Rendering: malformed/empty issueDate strings do not throw RangeError and render fallback hyphen', () => {
  const malformedInputs = [
    '',
    'invalid-date',
    'not-a-date-at-all',
    '2026-13-45',
    '0000-00-00',
    null,
    undefined,
  ];

  for (const input of malformedInputs) {
    assert.doesNotThrow(() => {
      const formatted = renderDocumentDetailDate(input);
      assert.equal(formatted, '-', `Expected '-' for malformed input: ${String(input)}`);
    });
  }

  // Valid date formatting check
  const validFormatted = renderDocumentDetailDate('2026-10-28');
  assert.ok(validFormatted.includes('2026'));
  assert.ok(validFormatted.includes('October'));
});

test('Document Hydration: documents with null or missing issueDate in store hydrate safely on GET /api/documents', async () => {
  const store = getRawStore() as any;
  // Corrupt one document to have empty/null issueDate
  store.documents[0].issueDate = '';
  setRawStore(store);

  const docs = await customFetch<SalesDocument[]>('/api/documents');
  assert.ok(Array.isArray(docs));
  const corruptedDoc = docs.find((d) => d.id === store.documents[0].id);
  assert.ok(corruptedDoc);
  assert.equal(corruptedDoc.issueDate, '');

  // Verify DocumentDetail date render logic does not throw
  assert.doesNotThrow(() => {
    const rendered = renderDocumentDetailDate(corruptedDoc.issueDate);
    assert.equal(rendered, '-');
  });
});

// =========================================================================
// 2. Document Rendering: Missing / Null Items Array
// =========================================================================

test('Document Rendering: missing or null items array does not throw TypeError in DocumentDetail', () => {
  const nullItemsDoc = { items: null };
  const undefinedItemsDoc = { items: undefined };
  const emptyItemsDoc = { items: [] };

  assert.doesNotThrow(() => {
    const r1 = renderDocumentDetailItems(nullItemsDoc);
    assert.deepEqual(r1, []);
  });

  assert.doesNotThrow(() => {
    const r2 = renderDocumentDetailItems(undefinedItemsDoc);
    assert.deepEqual(r2, []);
  });

  assert.doesNotThrow(() => {
    const r3 = renderDocumentDetailItems(emptyItemsDoc);
    assert.deepEqual(r3, []);
  });
});

test('Document Hydration: document with null items in store hydrates items as empty array', async () => {
  const store = getRawStore() as any;
  store.documents[0].items = null;
  setRawStore(store);

  const doc = await customFetch<SalesDocument>(`/api/documents/${store.documents[0].id}`);
  assert.ok(Array.isArray(doc.items), 'items should be hydrated as array');
  assert.equal(doc.items.length, 0);
});

// =========================================================================
// 3. Workflow Transitions: Quotation Conversion
// =========================================================================

test('Lifecycle Transition: quotation conversion to invoice updates quotation status and produces valid invoice', async () => {
  const quotes = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const quote = quotes[0];

  const invoice = await customFetch<SalesDocument>(`/api/documents/${quote.id}/convert`, {
    method: 'POST',
  });

  assert.equal(invoice.kind, 'invoice');
  assert.equal(invoice.status, 'issued');
  assert.equal(invoice.clientId, quote.clientId);
  assert.equal(invoice.total, quote.total);
  assert.equal(invoice.balance, quote.total);
  assert.equal(invoice.amountPaid, 0);
  assert.ok(invoice.number.startsWith('00'));

  // Verify quotation status advanced to accepted
  const updatedQuote = await customFetch<SalesDocument>(`/api/documents/${quote.id}`);
  assert.equal(updatedQuote.status, 'accepted');
});

test('Lifecycle Transition: quotation conversion rejects declined or cancelled quotation with 400 ApiError', async () => {
  const quotes = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const quote = quotes[0];

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

// =========================================================================
// 4. Payment Validations & Lifecycle: Overpayment & Quotation Rejection
// =========================================================================

test('Payment Validation: payment against quotation is rejected with 400 ApiError', async () => {
  const quotes = await customFetch<SalesDocument[]>('/api/documents?kind=quotation');
  const quote = quotes[0];

  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${quote.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 100, method: 'cash' }),
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

test('Payment Validation: overpayment exceeding initial invoice balance is rejected with 400 ApiError', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Stage Lighting Rental',
      issueDate: '2026-10-28',
      items: [{ description: 'Spotlight 500W', quantity: 2, days: 1, unitPrice: 250 }],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0, // Total = 500
    }),
  });

  assert.equal(invoice.total, 500);

  // Attempt payment of 500.01 (overpayment by 1 pesewa)
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 500.01, method: 'momo' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payment exceeds the remaining invoice balance/i);
      return true;
    },
  );
});

test('Payment Lifecycle: partial payment -> partially_paid -> second overpayment rejected -> full settlement -> paid', async () => {
  const client = (await customFetch<Client[]>('/api/clients?status=active'))[0];
  const invoice = await customFetch<SalesDocument>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'invoice',
      clientId: client.id,
      subject: 'Digital Print Delivery',
      issueDate: '2026-10-28',
      items: [{ description: 'Flyers A5', quantity: 1000, days: 1, unitPrice: 1 }],
      discountPercent: 0,
      getfundRate: 0,
      nhilRate: 0,
      vatRate: 0, // Total = 1000
    }),
  });

  // 1. Partial payment of 400
  const p1 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 400, method: 'bank_transfer', reference: 'REF-001' }),
  });
  assert.equal(p1.amount, 400);

  const docP1 = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(docP1.status, 'partially_paid');
  assert.equal(docP1.amountPaid, 400);
  assert.equal(docP1.balance, 600);

  // 2. Overpayment attempt on remaining balance (600.01)
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

  // 3. Final settlement payment of remaining 600
  const p2 = await customFetch<Payment>(`/api/documents/${invoice.id}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: 600, method: 'cheque', reference: 'CHQ-9901' }),
  });
  assert.equal(p2.amount, 600);

  const docFinal = await customFetch<SalesDocument>(`/api/documents/${invoice.id}`);
  assert.equal(docFinal.status, 'paid');
  assert.equal(docFinal.amountPaid, 1000);
  assert.equal(docFinal.balance, 0);

  // 4. Overpayment attempt on already settled invoice
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${invoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Payment exceeds the remaining invoice balance/i);
      return true;
    },
  );
});

// =========================================================================
// 5. Operations Ledger & Deleted Documents Resilience
// =========================================================================

test('Deleted Documents: deleting document cascades payment deletion and omits document from ledger', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  const target = docs[0];

  // Record a payment on target if invoice
  if (target.kind === 'invoice' && target.balance > 0) {
    await customFetch(`/api/documents/${target.id}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amount: 10, method: 'cash' }),
    });
  }

  // Delete target document
  deleteDocumentById(target.id);

  // Verify document no longer exists
  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${target.id}`);
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      return true;
    },
  );

  // Verify associated payments are gone
  const remainingPayments = getDocumentPayments(target.id);
  assert.equal(remainingPayments.length, 0);

  // Verify ledger rows omit deleted document
  const refreshedDocs = await customFetch<SalesDocument[]>('/api/documents');
  assert.ok(!refreshedDocs.some((d) => d.id === target.id));

  const ledger = buildLedgerRows(refreshedDocs);
  assert.ok(!ledger.some((row) => row.id === target.id));
});

test('Deleted Documents: deleting all documents handles empty ledger and clearinghouse fallback safely', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  for (const doc of docs) {
    deleteDocumentById(doc.id);
  }

  const allDocs = await customFetch<SalesDocument[]>('/api/documents');
  assert.equal(allDocs.length, 0);

  // Build ledger with empty documents
  const ledger = buildLedgerRows(allDocs);
  assert.equal(ledger.length, 0);

  // Clearinghouse dock fallback simulation
  const openInvoices = allDocs.filter(
    (d) => d.kind === 'invoice' && d.balance > 0 && d.status !== 'cancelled',
  );
  const ecobankInvoice =
    openInvoices.find((d) => d.number === '00221026.01') ||
    allDocs.find((d) => d.number === '00221026.01') ||
    openInvoices[0];
  const eugeniaInvoice =
    openInvoices.find((d) => d.number === '00211026.01') ||
    allDocs.find((d) => d.number === '00211026.01') ||
    openInvoices[1];

  const ecobankHref = ecobankInvoice ? `/invoices/${ecobankInvoice.id}` : '/invoices';
  const eugeniaHref = eugeniaInvoice ? `/invoices/${eugeniaInvoice.id}` : '/invoices';

  assert.equal(ecobankHref, '/invoices');
  assert.equal(eugeniaHref, '/invoices');

  // Verify dashboard summary endpoint still functions cleanly when store has 0 documents
  const summary = await customFetch<any>('/api/dashboard/summary');
  assert.equal(summary.openInvoices, 0);
  assert.equal(summary.outstandingBalance, 0);
});


// =========================================================================
// 6. Adversarial Failure Mode Verification (Uncovered Edge Case Bugs)
// =========================================================================

test('Defect: POST /api/documents does not crash when store contains document with null issueDate', async () => {
  const store = getRawStore() as any;
  store.documents.push({
    id: 'doc-null-date',
    number: '00123456.99',
    kind: 'quotation',
    issueDate: null,
    total: 100,
  });
  setRawStore(store);

  // nextDocumentNumber in custom-fetch.ts executes doc.issueDate.slice(0, 10) safely without throwing raw TypeError
  await assert.doesNotReject(async () => {
    const created = await customFetch<SalesDocument>('/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'quotation',
        clientId: 'cli-eugenia',
        subject: 'Test doc with null date in store',
        issueDate: '2026-10-28',
        items: [{ description: 'Test', quantity: 1, days: 1, unitPrice: 10 }],
      }),
    });
    assert.ok(created.id);
    assert.ok(created.number);
  });
});

test('Defect: POST /api/documents rejects missing or null items with 400 ApiError instead of raw TypeError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'quotation',
          clientId: 'cli-eugenia',
          subject: 'Missing items payload',
          issueDate: '2026-10-28',
          items: null,
        }),
      });
    },
    (err: unknown) => {
      // Must return 400 ApiError instead of TypeError: Cannot read properties of null (reading 'map')
      assert.ok(
        err instanceof ApiError,
        `Expected 400 ApiError but got unhandled exception: ${err instanceof Error ? err.stack : String(err)}`,
      );
      assert.equal(err.status, 400);
      return true;
    },
  );
});

test('Defect: POST /api/documents/:id/payments rejects non-numeric payment amount with 400 ApiError instead of recording NaN payment', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents?kind=invoice');
  const target = docs[0];

  await assert.rejects(
    async () => {
      await customFetch(`/api/documents/${target.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: 'invalid-amount-xyz', method: 'cash' }),
      });
    },
    (err: unknown) => {
      assert.ok(
        err instanceof ApiError,
        `Expected 400 ApiError for non-numeric payment amount but got: ${String(err)}`,
      );
      assert.equal(err.status, 400);
      return true;
    },
  );
});
