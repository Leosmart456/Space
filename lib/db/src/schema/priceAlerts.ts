import { pgTable, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const priceAlertsTable = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  targetPrice: numeric("target_price", { precision: 18, scale: 4 }).notNull(),
  direction: boolean("direction").notNull(), // true = alert when price >= target, false = alert when price <= target
  triggered: boolean("triggered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
});
