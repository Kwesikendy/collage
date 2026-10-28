import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  customFetch,
  resetStore,
  ApiError,
  getDocumentPayments,
  getOperationsData,
  updateRentalStatus,
  createRentalBooking,
  updateProductionOrderStatus,
  createProductionOrder,
  deleteDocumentById,
  resetErpDemoData,
  calculateDocumentPricing,
  amountToCents,
  centsToAmount,
} from './setup.ts';
import type { SalesDocument } from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('getOperationsData returns rentals and production orders with expected schemas', () => {
  const ops = getOperationsData();
  assert.ok(Array.isArray(ops.rentals));
  assert.ok(Array.isArray(ops.productionOrders));
  assert.ok(ops.rentals.length >= 3);
  assert.ok(ops.productionOrders.length >= 3);

  const rental = ops.rentals[0];
  assert.ok(rental.id);
  assert.ok(rental.itemName);
  assert.ok(rental.clientName);
  assert.ok(rental.documentNumber);
  assert.ok(typeof rental.quantity === 'number');
  assert.ok(typeof rental.days === 'number');
  assert.ok(typeof rental.unitRate === 'number');
  assert.ok(rental.startDate);
  assert.ok(rental.returnDate);
  assert.ok(['reserved', 'deployed', 'returned'].includes(rental.status));

  const prod = ops.productionOrders[0];
  assert.ok(prod.id);
  assert.ok(prod.jobCode.startsWith('PDP-'));
  assert.ok(prod.clientName);
  assert.ok(prod.documentNumber);
  assert.ok(prod.specification);
  assert.ok(typeof prod.quantity === 'number');
  assert.ok(prod.assignedTo);
  assert.ok(prod.dueDate);
  assert.ok(['queued', 'in_production', 'quality_check', 'delivered'].includes(prod.status));
});

test('updateRentalStatus updates rental status and persists to store', () => {
  const ops = getOperationsData();
  const rental = ops.rentals[0];
  const newStatus = rental.status === 'deployed' ? 'returned' : 'deployed';

  const updatedRentals = updateRentalStatus(rental.id, newStatus);
  const found = updatedRentals.find((r) => r.id === rental.id);
  assert.ok(found);
  assert.equal(found.status, newStatus);

  // Verify persistence via fresh getOperationsData call
  const freshOps = getOperationsData();
  const freshFound = freshOps.rentals.find((r) => r.id === rental.id);
  assert.equal(freshFound?.status, newStatus);
});

test('updateRentalStatus with non-existent ID safely returns rentals without crashing', () => {
  const original = getOperationsData().rentals;
  const result = updateRentalStatus('rent-non-existent-999', 'returned');
  assert.equal(result.length, original.length);
});

test('createRentalBooking prepends a new booking with generated rent- id', () => {
  const beforeCount = getOperationsData().rentals.length;
  const newRentals = createRentalBooking({
    itemName: '4.2m Telescopic Flag Poles and Bases',
    clientName: 'Standard Chartered Ghana',
    documentNumber: '00281026.01',
    quantity: 10,
    days: 4,
    unitRate: 150,
    startDate: '2026-10-28',
    returnDate: '2026-11-01',
    status: 'reserved',
  });

  assert.equal(newRentals.length, beforeCount + 1);
  const created = newRentals[0];
  assert.ok(created.id.startsWith('rent-'));
  assert.equal(created.itemName, '4.2m Telescopic Flag Poles and Bases');
  assert.equal(created.status, 'reserved');
});

test('updateProductionOrderStatus updates order status and persists to store', () => {
  const ops = getOperationsData();
  const order = ops.productionOrders[0];
  const nextStatus = order.status === 'delivered' ? 'queued' : 'delivered';

  const updatedOrders = updateProductionOrderStatus(order.id, nextStatus);
  const found = updatedOrders.find((o) => o.id === order.id);
  assert.ok(found);
  assert.equal(found.status, nextStatus);

  const fresh = getOperationsData().productionOrders.find((o) => o.id === order.id);
  assert.equal(fresh?.status, nextStatus);
});

test('updateProductionOrderStatus with non-existent ID safely returns orders without crashing', () => {
  const original = getOperationsData().productionOrders;
  const result = updateProductionOrderStatus('prod-unknown-999', 'delivered');
  assert.equal(result.length, original.length);
});

test('createProductionOrder prepends a new production order with auto-generated job code', () => {
  const beforeCount = getOperationsData().productionOrders.length;
  const updatedOrders = createProductionOrder({
    clientName: 'Vodafone Ghana',
    documentNumber: '00281026.05',
    specification: 'Rollup Banners Double-Sided (85x200cm)',
    quantity: 5,
    assignedTo: 'PrintD Pigh · Finishing & Mounting',
    dueDate: '2026-10-31',
    status: 'queued',
  });

  assert.equal(updatedOrders.length, beforeCount + 1);
  const created = updatedOrders[0];
  assert.ok(created.id.startsWith('prod-'));
  assert.ok(created.jobCode.startsWith('PDP-2610-'));
  assert.equal(created.clientName, 'Vodafone Ghana');
  assert.equal(created.status, 'queued');
});

test('getDocumentPayments retrieves payments for document sorted by paymentDate desc', async () => {
  // Find an invoice that already has payments in seed data
  const docs = await customFetch<SalesDocument[]>('/api/documents?kind=invoice');
  const docWithPayments = docs.find((d) => d.amountPaid > 0);
  assert.ok(docWithPayments, 'Seed data should have at least one invoice with payments');

  const payments = getDocumentPayments(docWithPayments.id);
  assert.ok(payments.length > 0);
  assert.ok(payments.every((p) => p.documentId === docWithPayments.id));

  for (let i = 0; i < payments.length - 1; i++) {
    assert.ok(payments[i].paymentDate >= payments[i + 1].paymentDate);
  }

  // Non-existent document returns empty array
  const emptyPayments = getDocumentPayments('doc-non-existent-999');
  assert.deepEqual(emptyPayments, []);
});

test('deleteDocumentById removes document and cascades deletion to linked payments', async () => {
  const docs = await customFetch<SalesDocument[]>('/api/documents?kind=invoice');
  const target = docs.find((d) => d.amountPaid > 0)!;
  assert.ok(target);

  // Verify payments exist before deletion
  const initialPayments = getDocumentPayments(target.id);
  assert.ok(initialPayments.length > 0);

  // Delete the document
  deleteDocumentById(target.id);

  // Verify document is gone
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

  // Verify linked payments were cascaded and removed
  const remainingPayments = getDocumentPayments(target.id);
  assert.equal(remainingPayments.length, 0);
});

test('resetErpDemoData restores initial authentic demo data', async () => {
  // Modify store: delete all documents
  const docs = await customFetch<SalesDocument[]>('/api/documents');
  for (const d of docs) {
    deleteDocumentById(d.id);
  }

  const emptyDocs = await customFetch<SalesDocument[]>('/api/documents');
  assert.equal(emptyDocs.length, 0);

  // Reset
  resetErpDemoData();

  // Verify restored
  const restoredDocs = await customFetch<SalesDocument[]>('/api/documents');
  assert.ok(restoredDocs.length > 0);
  const restoredClients = await customFetch<unknown[]>('/api/clients');
  assert.ok(restoredClients.length > 0);
});

test('calculateDocumentPricing correctly computes integer-cent totals for multi-day rental items', () => {
  const pricing = calculateDocumentPricing({
    items: [
      { description: 'LED Video Wall Panel Rental', quantity: 20, days: 3, unitPrice: 200 }, // 20 * 3 * 200 = 12000
      { description: 'Heavy Duty Truss Stand', quantity: 4, days: 3, unitPrice: 150 },        // 4 * 3 * 150 = 1800
    ], // Subtotal = 13800.00
    discountPercent: 5, // 5% discount on 13800 = 690.00 -> Taxable = 13110.00
    getfundRate: 2.5,   // 2.5% of 13110 = 327.75
    nhilRate: 2.5,      // 2.5% of 13110 = 327.75
    vatRate: 15,        // 15% of 13110 = 1966.50
  });

  assert.equal(pricing.subtotal, '13800.00');
  assert.equal(pricing.discountPercent, '5.00');
  assert.equal(pricing.discountAmount, '690.00');
  assert.equal(pricing.getfundAmount, '327.75');
  assert.equal(pricing.nhilAmount, '327.75');
  assert.equal(pricing.vatAmount, '1966.50');
  assert.equal(pricing.total, '15732.00'); // 13110 + 327.75 + 327.75 + 1966.50 = 15732.00
});

test('amountToCents and centsToAmount handle rounding and float precision without precision loss', () => {
  assert.equal(amountToCents(12.34), 1234);
  assert.equal(amountToCents('12.34'), 1234);
  assert.equal(amountToCents('0.01'), 1);
  assert.equal(amountToCents(0.01), 1);
  assert.equal(amountToCents('100'), 10000);

  assert.equal(centsToAmount(1234), '12.34');
  assert.equal(centsToAmount(1), '0.01');
  assert.equal(centsToAmount(10000), '100.00');
});
