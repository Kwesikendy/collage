import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  HttpApiError,
  archiveClientInDb,
  convertQuotationInDb,
  createClientInDb,
  createDocumentInDb,
  createProductionOrderInDb,
  createRentalInDb,
  deleteDocumentInDb,
  ensureDatabaseInitialized,
  getClientByIdFromDb,
  getDashboardSummaryFromDb,
  getDocumentByIdFromDb,
  getFullErpSnapshot,
  getUserByToken,
  listClientsFromDb,
  listDocumentsFromDb,
  loginUser,
  logoutToken,
  recordPaymentInDb,
  registerUser,
  resetDatabaseToSeed,
  updateClientInDb,
  updateDocumentInDb,
  updateProductionOrderStatusInDb,
  updateRentalStatusInDb,
} from './neon-db.ts';

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new HttpApiError(400, 'Invalid JSON request body.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function extractBearerToken(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function createNeonApiMiddleware() {
  return async function neonApiMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) {
    const rawUrl = req.url || '/';
    if (!rawUrl.startsWith('/api/') && rawUrl !== '/api') {
      return next();
    }

    const method = (req.method || 'GET').toUpperCase();
    const urlObj = new URL(rawUrl, 'http://localhost:3000');
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    try {
      // GET /api/healthz
      if (method === 'GET' && pathname === '/api/healthz') {
        await ensureDatabaseInitialized();
        sendJson(res, 200, { status: 'ok', database: 'neon_postgresql_connected' });
        return;
      }

      // GET /api/sync
      if (method === 'GET' && pathname === '/api/sync') {
        const snapshot = await getFullErpSnapshot();
        sendJson(res, 200, snapshot);
        return;
      }

      // POST /api/reset-demo
      if (method === 'POST' && pathname === '/api/reset-demo') {
        await resetDatabaseToSeed();
        const snapshot = await getFullErpSnapshot();
        sendJson(res, 200, snapshot);
        return;
      }

      // --- Auth routes ---
      if (method === 'POST' && pathname === '/api/auth/register') {
        const body = await readJsonBody(req);
        const result = await registerUser(body);
        sendJson(res, 201, result);
        return;
      }

      if (method === 'POST' && pathname === '/api/auth/login') {
        const body = await readJsonBody(req);
        const result = await loginUser(body);
        sendJson(res, 200, result);
        return;
      }

      if (method === 'POST' && pathname === '/api/auth/logout') {
        const token = extractBearerToken(req);
        await logoutToken(token);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (method === 'GET' && pathname === '/api/auth/me') {
        const token = extractBearerToken(req);
        const user = await getUserByToken(token);
        if (!user) {
          sendJson(res, 401, { error: 'Not authenticated.' });
          return;
        }
        sendJson(res, 200, { user });
        return;
      }

      // --- Dashboard Summary ---
      if (method === 'GET' && pathname === '/api/dashboard/summary') {
        const summary = await getDashboardSummaryFromDb();
        sendJson(res, 200, summary);
        return;
      }

      // --- Clients ---
      if (method === 'GET' && pathname === '/api/clients') {
        const clients = await listClientsFromDb({
          status: searchParams.get('status'),
          search: searchParams.get('search'),
        });
        sendJson(res, 200, clients);
        return;
      }

      if (method === 'POST' && pathname === '/api/clients') {
        const body = await readJsonBody(req);
        const created = await createClientInDb(body);
        sendJson(res, 201, created);
        return;
      }

      const archiveMatch = pathname.match(/^\/api\/clients\/([^/]+)\/archive$/);
      if (method === 'POST' && archiveMatch) {
        const id = decodeURIComponent(archiveMatch[1]);
        const archived = await archiveClientInDb(id);
        sendJson(res, 200, archived);
        return;
      }

      const clientMatch = pathname.match(/^\/api\/clients\/([^/]+)$/);
      if (clientMatch) {
        const id = decodeURIComponent(clientMatch[1]);
        if (method === 'GET') {
          const client = await getClientByIdFromDb(id);
          sendJson(res, 200, client);
          return;
        }
        if (method === 'PATCH') {
          const body = await readJsonBody(req);
          const updated = await updateClientInDb(id, body);
          sendJson(res, 200, updated);
          return;
        }
      }

      // --- Documents ---
      if (method === 'GET' && pathname === '/api/documents') {
        const docs = await listDocumentsFromDb({
          kind: searchParams.get('kind'),
          status: searchParams.get('status'),
          search: searchParams.get('search'),
        });
        sendJson(res, 200, docs);
        return;
      }

      if (method === 'POST' && pathname === '/api/documents') {
        const body = await readJsonBody(req);
        const created = await createDocumentInDb(body);
        sendJson(res, 201, created);
        return;
      }

      const convertMatch = pathname.match(/^\/api\/documents\/([^/]+)\/convert$/);
      if (method === 'POST' && convertMatch) {
        const id = decodeURIComponent(convertMatch[1]);
        const invoice = await convertQuotationInDb(id);
        sendJson(res, 200, invoice);
        return;
      }

      const paymentMatch = pathname.match(/^\/api\/documents\/([^/]+)\/payments$/);
      if (paymentMatch) {
        const id = decodeURIComponent(paymentMatch[1]);
        if (method === 'POST') {
          const body = await readJsonBody(req);
          const payment = await recordPaymentInDb(id, body);
          sendJson(res, 201, payment);
          return;
        }
        if (method === 'GET') {
          const snapshot = await getFullErpSnapshot();
          const payments = snapshot.payments
            .filter((p) => p.documentId === id)
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
          sendJson(res, 200, payments);
          return;
        }
      }

      const docMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
      if (docMatch) {
        const id = decodeURIComponent(docMatch[1]);
        if (method === 'GET') {
          const doc = await getDocumentByIdFromDb(id);
          sendJson(res, 200, doc);
          return;
        }
        if (method === 'PATCH') {
          const body = await readJsonBody(req);
          const updated = await updateDocumentInDb(id, body);
          sendJson(res, 200, updated);
          return;
        }
        if (method === 'DELETE') {
          await deleteDocumentInDb(id);
          sendJson(res, 200, { ok: true });
          return;
        }
      }

      // --- Rentals & Production Orders ---
      if (method === 'GET' && pathname === '/api/operations') {
        const snapshot = await getFullErpSnapshot();
        sendJson(res, 200, {
          rentals: snapshot.rentals,
          productionOrders: snapshot.productionOrders,
        });
        return;
      }

      if (method === 'POST' && pathname === '/api/operations/rentals') {
        const body = await readJsonBody(req);
        const rentals = await createRentalInDb(body);
        sendJson(res, 201, { rentals });
        return;
      }

      const rentalMatch = pathname.match(/^\/api\/operations\/rentals\/([^/]+)$/);
      if (method === 'PATCH' && rentalMatch) {
        const id = decodeURIComponent(rentalMatch[1]);
        const body = await readJsonBody(req);
        const rentals = await updateRentalStatusInDb(id, body.status);
        sendJson(res, 200, { rentals });
        return;
      }

      if (method === 'POST' && pathname === '/api/operations/production') {
        const body = await readJsonBody(req);
        const productionOrders = await createProductionOrderInDb(body);
        sendJson(res, 201, { productionOrders });
        return;
      }

      const prodMatch = pathname.match(/^\/api\/operations\/production\/([^/]+)$/);
      if (method === 'PATCH' && prodMatch) {
        const id = decodeURIComponent(prodMatch[1]);
        const body = await readJsonBody(req);
        const productionOrders = await updateProductionOrderStatusInDb(id, body.status);
        sendJson(res, 200, { productionOrders });
        return;
      }

      sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
    } catch (err) {
      if (err instanceof HttpApiError) {
        sendJson(res, err.status, err.payload);
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  };
}
