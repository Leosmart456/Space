import { pgTable, text, serial, timestamp, numeric, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accreditedStatusEnum = pgEnum("accredited_status", ["pending", "yes", "no"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  accreditedStatus: accreditedStatusEnum("accredited_status").notNull().default("pending"),
  totalSharesCredited: numeric("total_shares_credited", { precision: 18, scale: 6 }).notNull().default("0"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  accessCode: text("access_code"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
