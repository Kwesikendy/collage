import { createInsertSchema } from "drizzle-zod";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const staffRoleEnum = pgEnum("staff_role", [
  "admin",
  "operations",
  "finance",
  "sales",
  "field",
]);

export const staffStatusEnum = pgEnum("staff_status", [
  "active",
  "pending",
  "suspended",
]);

export const staffMembersTable = pgTable("staff_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: staffRoleEnum("role").notNull().default("operations"),
  status: staffStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertStaffMemberSchema = createInsertSchema(
  staffMembersTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStaffMember = typeof staffMembersTable.$inferInsert;
export type StaffMember = typeof staffMembersTable.$inferSelect;
