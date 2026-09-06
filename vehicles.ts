import { pgTable, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { dealerProfilesTable } from "./dealers";
import {
  brandsTable,
  vehicleModelsTable,
  vehicleTypesTable,
  fuelTypesTable,
  transmissionsTable,
  conditionsTable,
  vehicleColorsTable,
  citiesTable,
  regionsTable,
} from "./reference";

// ── Vehicles ──────────────────────────────────────────────────────────────────

export const vehiclesTable = pgTable("vehicles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  brandId: integer("brand_id").notNull().references(() => brandsTable.id),
  modelId: integer("model_id").notNull().references(() => vehicleModelsTable.id),
  vehicleTypeId: integer("vehicle_type_id").notNull().references(() => vehicleTypesTable.id),
  year: integer("year").notNull(),
  mileage: integer("mileage"),
  engineSize: integer("engine_size"),
  horsepower: integer("horsepower"),
  transmissionId: integer("transmission_id").references(() => transmissionsTable.id),
  fuelTypeId: integer("fuel_type_id").references(() => fuelTypesTable.id),
  colorId: integer("color_id").references(() => vehicleColorsTable.id),
  conditionId: integer("condition_id").notNull().references(() => conditionsTable.id),
  vin: text("vin"),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"), // USD or IQD
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  description: text("description"),
  regionId: integer("region_id").notNull().references(() => regionsTable.id),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  status: text("status").notNull().default("draft"), // draft, active, sold, rejected
  ownerId: text("owner_id").notNull().references(() => usersTable.id),
  dealerId: text("dealer_id").references(() => dealerProfilesTable.id),
  viewsCount: integer("views_count").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, viewsCount: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;

// ── Vehicle Images ────────────────────────────────────────────────────────────

export const vehicleImagesTable = pgTable("vehicle_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isCover: boolean("is_cover").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleImageSchema = createInsertSchema(vehicleImagesTable).omit({ id: true, createdAt: true });
export type InsertVehicleImage = z.infer<typeof insertVehicleImageSchema>;
export type VehicleImage = typeof vehicleImagesTable.$inferSelect;

// ── Favorites ─────────────────────────────────────────────────────────────────

export const favoritesTable = pgTable("favorites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({ id: true, createdAt: true });
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favoritesTable.$inferSelect;

// ── Messages ──────────────────────────────────────────────────────────────────

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => usersTable.id),
  receiverId: text("receiver_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

// ── Reports ───────────────────────────────────────────────────────────────────

export const vehicleReportsTable = pgTable("vehicle_reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id").notNull().references(() => usersTable.id),
  reason: text("reason").notNull(), // spam, fraud, inappropriate, duplicate, other
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, resolved, dismissed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleReportSchema = createInsertSchema(vehicleReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicleReport = z.infer<typeof insertVehicleReportSchema>;
export type VehicleReport = typeof vehicleReportsTable.$inferSelect;

// ── Featured Listings ─────────────────────────────────────────────────────────

export const featuredListingsTable = pgTable("featured_listings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().unique().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeaturedListingSchema = createInsertSchema(featuredListingsTable).omit({ id: true, createdAt: true });
export type InsertFeaturedListing = z.infer<typeof insertFeaturedListingSchema>;
export type FeaturedListing = typeof featuredListingsTable.$inferSelect;
