import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transferStatusEnum = pgEnum("transfer_status", ["queued", "transfer_requested", "completed"]);

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  brokerageName: text("brokerage_name").notNull(),
  brokerageAccountNumber: text("brokerage_account_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  status: transferStatusEnum("status").notNull().default("transfer_requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
