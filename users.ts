import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable, regionsTable } from "./reference";

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  cityId: integer("city_id").references(() => citiesTable.id),
  regionId: integer("region_id").references(() => regionsTable.id),
  role: text("role").notNull().default("buyer"), // buyer, seller, dealer, admin
  isDealer: boolean("is_dealer").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
