import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ConvertQuotationParams,
  ConvertQuotationResponse,
  CreateDocumentBody,
  CreateDocumentResponse,
  GetDocumentParams,
  GetDocumentResponse,
  GetDocumentsQueryParams,
  GetDocumentsResponse,
  RecordPaymentBody,
  RecordPaymentParams,
  RecordPaymentResponse,
  UpdateDocumentBody,
  UpdateDocumentParams,
  UpdateDocumentResponse,
} from "@workspace/api-zod";
import {
  clientsTable,
  db,
  documentPaymentsTable,
  salesDocumentsTable,
  type StoredDocumentLine,
} from "@workspace/db";
import {
  amountToCents,
  calculateDocumentPricing,
  centsToAmount,
  type LineInput,
} from "../lib/document-finance";

const router: IRouter = Router();
const DOCUMENT_STATUSES = [
  "draft",
  "issued",
  "accepted",
  "declined",
  "partially_paid",
  "paid",
  "cancelled",
] as const;
type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

type DocumentRow = {
  document: typeof salesDocumentsTable.$inferSelect;
  clientName: string;
};

const asDocument = (
  row: DocumentRow,
  amountPaidCents: number,
) => {
  const totalCents = amountToCents(row.document.total);
  return {
    ...row.document,
    clientName: row.clientName,
    issueDate: new Date(`${row.document.issueDate}T00:00:00.000Z`),
    dueDate: row.document.dueDate
      ? new Date(`${row.document.dueDate}T00:00:00.000Z`)
      : null,
    subtotal: Number(row.document.subtotal),
    discountPercent: Number(row.document.discountPercent),
    discountAmount: Number(row.document.discountAmount),
    getfundRate: Number(row.document.getfundRate),
    getfundAmount: Number(row.document.getfundAmount),
    nhilRate: Number(row.document.nhilRate),
    nhilAmount: Number(row.document.nhilAmount),
    vatRate: Number(row.document.vatRate),
    vatAmount: Number(row.document.vatAmount),
    total: Number(row.document.total),
    amountPaid: Number(centsToAmount(amountPaidCents)),
    balance: Number(centsToAmount(Math.max(0, totalCents - amountPaidCents))),
  };
};

function dateOnly(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

async function mapDocuments(rows: DocumentRow[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.document.id);
  const payments = await db
    .select({
      documentId: documentPaymentsTable.documentId,
      amount: documentPaymentsTable.amount,
    })
    .from(documentPaymentsTable)
    .where(inArray(documentPaymentsTable.documentId, ids));

  const paidByDocument = new Map<string, number>();
  for (const payment of payments) {
    paidByDocument.set(
      payment.documentId,
      (paidByDocument.get(payment.documentId) ?? 0) +
        amountToCents(payment.amount),
    );
  }

  return rows.map((row) =>
    asDocument(row, paidByDocument.get(row.document.id) ?? 0),
  );
}

async function findDocument(id: string): Promise<DocumentRow | undefined> {
  const [row] = await db
    .select({
      document: salesDocumentsTable,
      clientName: clientsTable.companyName,
    })
    .from(salesDocumentsTable)
    .innerJoin(
      clientsTable,
      eq(salesDocumentsTable.clientId, clientsTable.id),
    )
    .where(eq(salesDocumentsTable.id, id))
    .limit(1);
  return row;
}

function pricingFromInput(input: {
  items: LineInput[];
  discountPercent?: number;
  getfundRate?: number;
  nhilRate?: number;
  vatRate?: number;
}) {
  return calculateDocumentPricing({
    items: input.items,
    discountPercent: input.discountPercent ?? 0,
    getfundRate: input.getfundRate ?? 2.5,
    nhilRate: input.nhilRate ?? 2.5,
    vatRate: input.vatRate ?? 15,
  });
}

function validLineAmounts(items: LineInput[]): boolean {
  return items.every(
    (item) =>
      item.quantity <= 10_000 &&
      item.days <= 3_650 &&
      item.unitPrice <= 1_000_000,
  );
}

function documentPrefix(date: string, kind: "quotation" | "invoice"): string {
  const [year, month, day] = date.split("-");
  const datePart = `00${day}${month}${year.slice(-2)}`;
  return kind === "invoice" ? datePart : `QT${datePart}`;
}

async function nextDocumentNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  issueDate: string,
  kind: "quotation" | "invoice",
): Promise<string> {
  const prefix = documentPrefix(issueDate, kind);
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${prefix}))`,
  );
  const existing = await tx
    .select({ number: salesDocumentsTable.number })
    .from(salesDocumentsTable)
    .where(
      and(
        eq(salesDocumentsTable.issueDate, issueDate),
        eq(salesDocumentsTable.kind, kind),
      ),
    );
  const next = existing.reduce((max, row) => {
    const sequence = Number(row.number.split(".").at(-1));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0) + 1;
  return `${prefix}.${String(next).padStart(2, "0")}`;
}

router.get("/documents", async (req, res): Promise<void> => {
  const query = GetDocumentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filters = [];
  if (query.data.kind) {
    filters.push(eq(salesDocumentsTable.kind, query.data.kind));
  }
  if (query.data.status) {
    if (
      !DOCUMENT_STATUSES.includes(query.data.status as DocumentStatus)
    ) {
      res.status(400).json({ error: "Unknown document status." });
      return;
    }
    filters.push(
      eq(salesDocumentsTable.status, query.data.status as DocumentStatus),
    );
  }
  if (query.data.search?.trim()) {
    const pattern = `%${query.data.search.trim()}%`;
    filters.push(
      or(
        ilike(salesDocumentsTable.number, pattern),
        ilike(salesDocumentsTable.subject, pattern),
        ilike(clientsTable.companyName, pattern),
      ),
    );
  }

  const rows = await db
    .select({
      document: salesDocumentsTable,
      clientName: clientsTable.companyName,
    })
    .from(salesDocumentsTable)
    .innerJoin(
      clientsTable,
      eq(salesDocumentsTable.clientId, clientsTable.id),
    )
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(salesDocumentsTable.createdAt));

  res.json(GetDocumentsResponse.parse(await mapDocuments(rows)));
});

router.post("/documents", async (req, res): Promise<void> => {
  const input = CreateDocumentBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  if (!validLineAmounts(input.data.items)) {
    res.status(400).json({ error: "Line item values are outside supported limits." });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, input.data.clientId))
    .limit(1);
  if (!client || client.status === "archived") {
    res.status(400).json({ error: "Choose an active client before saving." });
    return;
  }

  const pricing = pricingFromInput(input.data);
  const issueDate = dateOnly(input.data.issueDate);
  const dueDate = dateOnly(input.data.dueDate);
  if (!issueDate) {
    res.status(400).json({ error: "An issue date is required." });
    return;
  }
  const document = await db.transaction(async (tx) => {
    const number = await nextDocumentNumber(
      tx,
      issueDate,
      input.data.kind,
    );
    const [created] = await tx
      .insert(salesDocumentsTable)
      .values({
        number,
        kind: input.data.kind,
        clientId: input.data.clientId,
        subject: input.data.subject.trim(),
        issueDate,
        dueDate,
        status: input.data.status ?? "draft",
        items: pricing.items,
        subtotal: pricing.subtotal,
        discountPercent: pricing.discountPercent,
        discountAmount: pricing.discountAmount,
        getfundRate: pricing.getfundRate,
        getfundAmount: pricing.getfundAmount,
        nhilRate: pricing.nhilRate,
        nhilAmount: pricing.nhilAmount,
        vatRate: pricing.vatRate,
        vatAmount: pricing.vatAmount,
        total: pricing.total,
        paymentTerms: input.data.paymentTerms ?? "100% Down Payment",
        validityDays: input.data.validityDays ?? 5,
      })
      .returning();
    return created;
  });

  const row = await findDocument(document.id);
  if (!row) {
    res.status(500).json({ error: "The document could not be loaded after saving." });
    return;
  }
  res.status(201).json(
    CreateDocumentResponse.parse(asDocument(row, 0)),
  );
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const row = await findDocument(params.data.id);
  if (!row) {
    res.status(404).json({ error: "Document not found." });
    return;
  }
  const [document] = await mapDocuments([row]);
  res.json(GetDocumentResponse.parse(document));
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentParams.safeParse(req.params);
  const input = UpdateDocumentBody.safeParse(req.body);
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

  const [current] = await db
    .select()
    .from(salesDocumentsTable)
    .where(eq(salesDocumentsTable.id, params.data.id))
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Document not found." });
    return;
  }

  const requestedStatus = input.data.status;
  const canChangeStatus =
    !requestedStatus ||
    (current.status === "draft" &&
      ["draft", "issued", "cancelled"].includes(requestedStatus)) ||
    (current.kind === "quotation" &&
      current.status === "issued" &&
      ["accepted", "declined", "cancelled"].includes(requestedStatus));
  if (
    current.status !== "draft" &&
    input.data.items !== undefined &&
    current.kind === "invoice"
  ) {
    res.status(400).json({ error: "Only draft invoices can have their items edited." });
    return;
  }
  if (!canChangeStatus) {
    res.status(400).json({ error: "That document status change is not allowed." });
    return;
  }
  if (input.data.items && !validLineAmounts(input.data.items)) {
    res.status(400).json({ error: "Line item values are outside supported limits." });
    return;
  }

  const update: Partial<typeof salesDocumentsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.data.subject !== undefined) update.subject = input.data.subject.trim();
  if (input.data.issueDate !== undefined) {
    update.issueDate = dateOnly(input.data.issueDate) ?? undefined;
  }
  if (input.data.dueDate !== undefined) {
    update.dueDate = dateOnly(input.data.dueDate);
  }
  if (requestedStatus !== undefined) update.status = requestedStatus as never;
  if (input.data.paymentTerms !== undefined) {
    update.paymentTerms = input.data.paymentTerms;
  }
  if (input.data.validityDays !== undefined) {
    update.validityDays = input.data.validityDays;
  }

  const pricingInputs = {
    items: (input.data.items ?? current.items) as StoredDocumentLine[],
    discountPercent:
      input.data.discountPercent ?? Number(current.discountPercent),
    getfundRate: input.data.getfundRate ?? Number(current.getfundRate),
    nhilRate: input.data.nhilRate ?? Number(current.nhilRate),
    vatRate: input.data.vatRate ?? Number(current.vatRate),
  };
  if (
    input.data.items !== undefined ||
    input.data.discountPercent !== undefined ||
    input.data.getfundRate !== undefined ||
    input.data.nhilRate !== undefined ||
    input.data.vatRate !== undefined
  ) {
    const pricing = pricingFromInput(pricingInputs);
    Object.assign(update, pricing);
  }

  const [updated] = await db
    .update(salesDocumentsTable)
    .set(update)
    .where(eq(salesDocumentsTable.id, params.data.id))
    .returning();
  const row = await findDocument(updated.id);
  if (!row) {
    res.status(500).json({ error: "The document could not be loaded after updating." });
    return;
  }
  const [document] = await mapDocuments([row]);
  res.json(UpdateDocumentResponse.parse(document));
});

router.post("/documents/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertQuotationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quotation] = await db
    .select()
    .from(salesDocumentsTable)
    .where(eq(salesDocumentsTable.id, params.data.id))
    .limit(1);
  if (!quotation) {
    res.status(404).json({ error: "Quotation not found." });
    return;
  }
  if (quotation.kind !== "quotation" || quotation.status !== "accepted") {
    res.status(400).json({ error: "Only accepted quotations can become invoices." });
    return;
  }

  const invoice = await db.transaction(async (tx) => {
    const issueDate = new Date().toISOString().slice(0, 10);
    const number = await nextDocumentNumber(tx, issueDate, "invoice");
    const [created] = await tx
      .insert(salesDocumentsTable)
      .values({
        number,
        kind: "invoice",
        clientId: quotation.clientId,
        subject: quotation.subject,
        issueDate,
        dueDate: null,
        status: "draft",
        items: quotation.items,
        subtotal: quotation.subtotal,
        discountPercent: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        getfundRate: quotation.getfundRate,
        getfundAmount: quotation.getfundAmount,
        nhilRate: quotation.nhilRate,
        nhilAmount: quotation.nhilAmount,
        vatRate: quotation.vatRate,
        vatAmount: quotation.vatAmount,
        total: quotation.total,
        paymentTerms: quotation.paymentTerms,
        validityDays: quotation.validityDays,
      })
      .returning();
    return created;
  });

  const row = await findDocument(invoice.id);
  if (!row) {
    res.status(500).json({ error: "The invoice could not be loaded after conversion." });
    return;
  }
  res.status(201).json(
    ConvertQuotationResponse.parse(asDocument(row, 0)),
  );
});

router.post("/documents/:id/payments", async (req, res): Promise<void> => {
  const params = RecordPaymentParams.safeParse(req.params);
  const input = RecordPaymentBody.safeParse(req.body);
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

  const result = await db.transaction(async (tx) => {
    const [document] = await tx
      .select()
      .from(salesDocumentsTable)
      .where(eq(salesDocumentsTable.id, params.data.id))
      .for("update")
      .limit(1);
    if (!document) return { error: "Document not found.", status: 404 as const };
    if (
      document.kind !== "invoice" ||
      !["issued", "partially_paid"].includes(document.status)
    ) {
      return {
        error: "Payments can only be recorded against active invoices.",
        status: 400 as const,
      };
    }

    const existingPayments = await tx
      .select({ amount: documentPaymentsTable.amount })
      .from(documentPaymentsTable)
      .where(eq(documentPaymentsTable.documentId, document.id));
    const paidCents = existingPayments.reduce(
      (sum, payment) => sum + amountToCents(payment.amount),
      0,
    );
    const amountCents = amountToCents(input.data.amount);
    if (amountCents < 1) {
      return {
        error: "Payments must be at least GHS 0.01.",
        status: 400 as const,
      };
    }
    const balanceCents = amountToCents(document.total) - paidCents;
    if (amountCents > balanceCents) {
      return {
        error: "Payment exceeds the remaining invoice balance.",
        status: 400 as const,
      };
    }

    const [payment] = await tx
      .insert(documentPaymentsTable)
      .values({
        documentId: document.id,
        amount: centsToAmount(amountCents),
        paymentDate: dateOnly(input.data.paymentDate)!,
        method: input.data.method,
        reference: input.data.reference ?? null,
      })
      .returning();

    const nextPaidCents = paidCents + amountCents;
    await tx
      .update(salesDocumentsTable)
      .set({
        status: nextPaidCents >= amountToCents(document.total) ? "paid" : "partially_paid",
        updatedAt: new Date(),
      })
      .where(eq(salesDocumentsTable.id, document.id));
    return { ok: true as const, payment };
  });

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(
    RecordPaymentResponse.parse({
      ...result.payment,
      amount: Number(result.payment.amount),
      paymentDate: new Date(`${result.payment.paymentDate}T00:00:00.000Z`),
    }),
  );
});

export default router;
