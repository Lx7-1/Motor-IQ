import { pgTable, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { citiesTable, regionsTable } from "./reference";

// ── Dealer Profiles ───────────────────────────────────────────────────────────

export const dealerProfilesTable = pgTable("dealer_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => usersTable.id),
  businessName: text("business_name").notNull(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  description: text("description"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  website: text("website"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  regionId: integer("region_id").notNull().references(() => regionsTable.id),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  isVerified: boolean("is_verified").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDealerProfileSchema = createInsertSchema(dealerProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDealerProfile = z.infer<typeof insertDealerProfileSchema>;
export type DealerProfile = typeof dealerProfilesTable.$inferSelect;
