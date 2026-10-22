import { and, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import {
  clientsTable,
  db,
  documentPaymentsTable,
  salesDocumentsTable,
} from "@workspace/db";

const router: IRouter = Router();
const cents = (value: string | number) =>
  Math.round(Number(value) * 100 + Number.EPSILON);
const fromCents = (value: number) => Number((value / 100).toFixed(2));

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [clients, documents, payments, recentClients, recentDocuments, recentPayments] =
    await Promise.all([
      db
        .select({ id: clientsTable.id })
        .from(clientsTable)
        .where(ne(clientsTable.status, "archived")),
      db
        .select()
        .from(salesDocumentsTable)
        .where(
          and(
            eq(salesDocumentsTable.kind, "invoice"),
            ne(salesDocumentsTable.status, "draft"),
            ne(salesDocumentsTable.status, "cancelled"),
          ),
        ),
      db
        .select()
        .from(documentPaymentsTable)
        .where(
          and(
            gte(documentPaymentsTable.paymentDate, monthStart),
            lte(documentPaymentsTable.paymentDate, today),
          ),
        ),
      db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt)).limit(4),
      db
        .select()
        .from(salesDocumentsTable)
        .orderBy(desc(salesDocumentsTable.createdAt))
        .limit(4),
      db
        .select({
          payment: documentPaymentsTable,
          documentNumber: salesDocumentsTable.number,
          clientName: clientsTable.companyName,
        })
        .from(documentPaymentsTable)
        .leftJoin(
          salesDocumentsTable,
          eq(documentPaymentsTable.documentId, salesDocumentsTable.id),
        )
        .leftJoin(clientsTable, eq(salesDocumentsTable.clientId, clientsTable.id))
        .orderBy(desc(documentPaymentsTable.createdAt))
        .limit(4),
    ]);

  const invoiceDocuments = documents.filter((doc) => doc.kind === "invoice");
  const quotationDocuments = await db
    .select({ id: salesDocumentsTable.id })
    .from(salesDocumentsTable)
    .where(
      and(
        eq(salesDocumentsTable.kind, "quotation"),
        inArray(salesDocumentsTable.status, ["draft", "issued", "accepted"]),
      ),
    );

  const paidByDocument = new Map<string, number>();
  const allPayments = await db.select().from(documentPaymentsTable);
  for (const payment of allPayments) {
    paidByDocument.set(
      payment.documentId,
      (paidByDocument.get(payment.documentId) ?? 0) + cents(payment.amount),
    );
  }

  const outstandingCents = invoiceDocuments.reduce((total, invoice) => {
    const balance = Math.max(
      0,
      cents(invoice.total) - (paidByDocument.get(invoice.id) ?? 0),
    );
    return total + balance;
  }, 0);

  const recentActivity = [
    ...recentClients.map((client) => ({
      id: `client-${client.id}`,
      title: "New client added",
      detail: client.companyName,
      date: client.createdAt,
      kind: "client" as const,
    })),
    ...recentDocuments.map((document) => ({
      id: `document-${document.id}`,
      title: document.kind === "quotation" ? "Quotation created" : "Invoice created",
      detail: `${document.number} · ${document.subject}`,
      date: document.createdAt,
      kind: document.kind,
    })),
    ...recentPayments.map(({ payment, documentNumber, clientName }) => ({
      id: `payment-${payment.id}`,
      title: "Payment recorded",
      detail: `${clientName ?? "Client"} · ${documentNumber ?? "Invoice"} · GHS ${payment.amount}`,
      date: payment.createdAt,
      kind: "payment" as const,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const summary = {
    totalClients: clients.length,
    activeQuotes: quotationDocuments.length,
    openInvoices: invoiceDocuments.filter(
      (invoice) => (paidByDocument.get(invoice.id) ?? 0) < cents(invoice.total),
    ).length,
    collectedThisMonth: fromCents(
      payments.reduce((total, payment) => total + cents(payment.amount), 0),
    ),
    outstandingBalance: fromCents(outstandingCents),
    recentActivity,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
