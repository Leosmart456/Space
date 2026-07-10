import { pgTable, serial, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const purchaseStatusEnum = pgEnum("purchase_status", ["pending_review", "confirmed", "rejected"]);

export const purchasesTable = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amountUsd: numeric("amount_usd", { precision: 18, scale: 2 }).notNull(),
  requestedShares: numeric("requested_shares", { precision: 18, scale: 6 }).notNull(),
  pricePerShare: numeric("price_per_share", { precision: 18, scale: 4 }).notNull(),
  status: purchaseStatusEnum("status").notNull().default("pending_review"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
