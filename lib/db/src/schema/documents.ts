import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export type StoredDocumentLine = {
  description: string;
  quantity: number;
  days: number;
  unitPrice: number;
  total: number;
};

export const documentKindEnum = pgEnum("document_kind", [
  "quotation",
  "invoice",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "issued",
  "accepted",
  "declined",
  "partially_paid",
  "paid",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "mobile_money",
  "card",
  "other",
]);

export const salesDocumentsTable = pgTable("sales_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  kind: documentKindEnum("kind").notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "restrict" }),
  subject: text("subject").notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }),
  status: documentStatusEnum("status").notNull().default("draft"),
  items: jsonb("items").$type<StoredDocumentLine[]>().notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", {
    precision: 5,
    scale: 2,
  }).notNull(),
  discountAmount: numeric("discount_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  getfundRate: numeric("getfund_rate", { precision: 5, scale: 2 }).notNull(),
  getfundAmount: numeric("getfund_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  nhilRate: numeric("nhil_rate", { precision: 5, scale: 2 }).notNull(),
  nhilAmount: numeric("nhil_amount", { precision: 12, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paymentTerms: text("payment_terms").notNull().default("100% Down Payment"),
  validityDays: integer("validity_days").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const documentPaymentsTable = pgTable("document_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => salesDocumentsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSalesDocumentSchema = createInsertSchema(
  salesDocumentsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentPaymentSchema = createInsertSchema(
  documentPaymentsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertSalesDocument = typeof salesDocumentsTable.$inferInsert;
export type SalesDocument = typeof salesDocumentsTable.$inferSelect;
export type InsertDocumentPayment = typeof documentPaymentsTable.$inferInsert;
export type DocumentPayment = typeof documentPaymentsTable.$inferSelect;
