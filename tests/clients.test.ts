import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { customFetch, resetStore, ApiError } from './setup.ts';
import type { Client, ClientInput, ClientUpdate } from '../src/lib/api-client/generated/api.schemas.ts';

beforeEach(() => {
  resetStore();
});

test('GET /api/clients returns list of clients sorted by createdAt desc', async () => {
  const clients = await customFetch<Client[]>('/api/clients');
  assert.ok(Array.isArray(clients));
  assert.ok(clients.length >= 3, 'Seed data should contain at least 3 clients');

  for (let i = 0; i < clients.length - 1; i++) {
    const current = new Date(clients[i].createdAt).getTime();
    const next = new Date(clients[i + 1].createdAt).getTime();
    assert.ok(current >= next, `Clients should be sorted by createdAt desc: ${clients[i].createdAt} >= ${clients[i + 1].createdAt}`);
  }
});

test('GET /api/clients?status=active filters by active status', async () => {
  const activeClients = await customFetch<Client[]>('/api/clients?status=active');
  assert.ok(Array.isArray(activeClients));
  assert.ok(activeClients.length > 0);
  for (const c of activeClients) {
    assert.equal(c.status, 'active');
  }
});

test('GET /api/clients?search=... searches across company, contact, email, and phone', async () => {
  const searchEugenia = await customFetch<Client[]>('/api/clients?search=Eugenia');
  assert.ok(searchEugenia.length >= 1);
  assert.ok(
    searchEugenia.some((c) => c.companyName.toLowerCase().includes('eugenia')),
  );

  const nonExistent = await customFetch<Client[]>('/api/clients?search=NonExistentCorp999');
  assert.equal(nonExistent.length, 0);
});

test('POST /api/clients creates a client with defaults for country (Ghana) and status (lead)', async () => {
  const payload: ClientInput = {
    companyName: 'Accra Logistics Hub',
  };

  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  assert.ok(created.id.startsWith('cli-'));
  assert.equal(created.companyName, 'Accra Logistics Hub');
  assert.equal(created.country, 'Ghana');
  assert.equal(created.status, 'lead');
  assert.ok(created.createdAt);
  assert.ok(created.updatedAt);

  // Verify it appears in listing
  const list = await customFetch<Client[]>('/api/clients?search=Logistics');
  assert.ok(list.some((c) => c.id === created.id));
});

test('POST /api/clients creates a client with full custom details', async () => {
  const payload: ClientInput = {
    companyName: 'Kumasi Tech Park',
    contactName: 'Kwame Mensah',
    email: 'kwame@kumasi-tech.gh',
    phone: '+233 20 123 4567',
    address: 'Adum High Street',
    city: 'Kumasi',
    country: 'Ghana',
    status: 'active',
  };

  const created = await customFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  assert.equal(created.companyName, 'Kumasi Tech Park');
  assert.equal(created.contactName, 'Kwame Mensah');
  assert.equal(created.email, 'kwame@kumasi-tech.gh');
  assert.equal(created.phone, '+233 20 123 4567');
  assert.equal(created.city, 'Kumasi');
  assert.equal(created.status, 'active');
});

test('POST /api/clients rejects empty or whitespace-only companyName with 400 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ companyName: '' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Company name is required/i);
      return true;
    },
  );

  await assert.rejects(
    async () => {
      await customFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ companyName: '     ' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Company name is required/i);
      return true;
    },
  );
});

test('GET /api/clients/:id retrieves client by id', async () => {
  const client = await customFetch<Client>('/api/clients/cli-eugenia');
  assert.equal(client.id, 'cli-eugenia');
  assert.equal(client.companyName, 'Eugenia');
});

test('GET /api/clients/:id with unknown id returns 404 ApiError', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/clients/cli-unknown-id-404');
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Client not found/i);
      return true;
    },
  );
});

test('PATCH /api/clients/:id partially updates client fields and updates updatedAt', async () => {
  const original = await customFetch<Client>('/api/clients/cli-eugenia');
  const updatePayload: ClientUpdate = {
    phone: '+233 55 999 8888',
    city: 'Tema',
  };

  const updated = await customFetch<Client>('/api/clients/cli-eugenia', {
    method: 'PATCH',
    body: JSON.stringify(updatePayload),
  });

  assert.equal(updated.id, 'cli-eugenia');
  assert.equal(updated.companyName, original.companyName, 'Unmodified fields must be preserved');
  assert.equal(updated.phone, '+233 55 999 8888');
  assert.equal(updated.city, 'Tema');
  assert.ok(new Date(updated.updatedAt).getTime() >= new Date(original.updatedAt).getTime());
});

test('PATCH /api/clients/:id returns 404 ApiError for unknown id', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/clients/cli-unknown-id-404', {
        method: 'PATCH',
        body: JSON.stringify({ phone: '+233 00 000 0000' }),
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Client not found/i);
      return true;
    },
  );
});

test('POST /api/clients/:id/archive sets status to archived', async () => {
  const archived = await customFetch<Client>('/api/clients/cli-eugenia/archive', {
    method: 'POST',
  });

  assert.equal(archived.id, 'cli-eugenia');
  assert.equal(archived.status, 'archived');

  // Verify client is now retrieved with archived status
  const fetched = await customFetch<Client>('/api/clients/cli-eugenia');
  assert.equal(fetched.status, 'archived');
});

test('POST /api/clients/:id/archive returns 404 ApiError for unknown id', async () => {
  await assert.rejects(
    async () => {
      await customFetch('/api/clients/cli-unknown-id-404/archive', {
        method: 'POST',
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.match(err.message, /Client not found/i);
      return true;
    },
  );
});
