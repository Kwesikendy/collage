import type { IncomingMessage, ServerResponse } from 'node:http';
import { createNeonApiMiddleware } from '../src/server/api-middleware.ts';

const middleware = createNeonApiMiddleware();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await middleware(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}
