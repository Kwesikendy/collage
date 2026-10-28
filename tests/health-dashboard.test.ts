import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { customFetch, resetStore, ApiError } from './setup.ts';
import type { DashboardSummary, HealthStatus } from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('GET /api/healthz returns status ok', async () => {
  const res = await customFetch<HealthStatus>('/api/healthz');
  assert.equal(res.status, 'ok');
});

test('non-GET requests to /api/healthz return 404 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/healthz', { method: 'POST' });
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
      await customFetch('/api/healthz', { method: 'DELETE' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test('GET /api/dashboard/summary returns aggregated KPIs and activity', async () => {
  const summary = await customFetch<DashboardSummary>('/api/dashboard/summary');

  assert.ok(typeof summary.totalClients === 'number');
  assert.ok(summary.totalClients >= 0);
  assert.ok(typeof summary.activeQuotes === 'number');
  assert.ok(summary.activeQuotes >= 0);
  assert.ok(typeof summary.openInvoices === 'number');
  assert.ok(summary.openInvoices >= 0);
  assert.ok(typeof summary.collectedThisMonth === 'number');
  assert.ok(typeof summary.outstandingBalance === 'number');
  assert.ok(Array.isArray(summary.recentActivity));
  assert.ok(summary.recentActivity.length <= 8);

  for (const item of summary.recentActivity) {
    assert.ok(item.id, 'Activity item should have an id');
    assert.ok(item.title, 'Activity item should have a title');
    assert.ok(item.detail, 'Activity item should have detail text');
    assert.ok(item.date, 'Activity item should have a date');
    assert.ok(['client', 'quotation', 'invoice', 'payment'].includes(item.kind));
  }
});

test('non-GET requests to /api/dashboard/summary return 404 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/dashboard/summary', { method: 'POST' });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      return true;
    },
  );
});
