import { and, desc, ilike, or, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ArchiveClientParams,
  ArchiveClientResponse,
  CreateClientBody,
  CreateClientResponse,
  GetClientParams,
  GetClientResponse,
  GetClientsQueryParams,
  GetClientsResponse,
  UpdateClientBody,
  UpdateClientParams,
  UpdateClientResponse,
} from "@workspace/api-zod";
import { clientsTable, db } from "@workspace/db";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const query = GetClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filters = [];
  if (query.data.status) {
    filters.push(eq(clientsTable.status, query.data.status));
  }
  if (query.data.search?.trim()) {
    const pattern = `%${query.data.search.trim()}%`;
    filters.push(
      or(
        ilike(clientsTable.companyName, pattern),
        ilike(clientsTable.contactName, pattern),
        ilike(clientsTable.email, pattern),
        ilike(clientsTable.phone, pattern),
      ),
    );
  }

  const clients = await db
    .select()
    .from(clientsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(clientsTable.createdAt));

  res.json(GetClientsResponse.parse(clients));
});

router.post("/clients", async (req, res): Promise<void> => {
  const input = CreateClientBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }

  const [client] = await db
    .insert(clientsTable)
    .values(input.data)
    .returning();
  res.status(201).json(CreateClientResponse.parse(client));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id))
    .limit(1);
  if (!client) {
    res.status(404).json({ error: "Client not found." });
    return;
  }

  res.json(GetClientResponse.parse(client));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  const input = UpdateClientBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({
      error: !params.success
        ? params.error.message
        : !input.success
          ? input.error.message
          : "Invalid request.",
    });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set({ ...input.data, updatedAt: new Date() })
    .where(eq(clientsTable.id, params.data.id))
    .returning();
  if (!client) {
    res.status(404).json({ error: "Client not found." });
    return;
  }

  res.json(UpdateClientResponse.parse(client));
});

router.post("/clients/:id/archive", async (req, res): Promise<void> => {
  const params = ArchiveClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(clientsTable.id, params.data.id))
    .returning();
  if (!client) {
    res.status(404).json({ error: "Client not found." });
    return;
  }

  res.json(ArchiveClientResponse.parse(client));
});

export default router;
