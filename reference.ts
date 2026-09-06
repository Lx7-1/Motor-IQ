import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Vehicle Types ─────────────────────────────────────────────────────────────

export const vehicleTypesTable = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypesTable).omit({ id: true, createdAt: true });
export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type VehicleType = typeof vehicleTypesTable.$inferSelect;

// ── Fuel Types ────────────────────────────────────────────────────────────────

export const fuelTypesTable = pgTable("fuel_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFuelTypeSchema = createInsertSchema(fuelTypesTable).omit({ id: true, createdAt: true });
export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type FuelType = typeof fuelTypesTable.$inferSelect;

// ── Transmissions ─────────────────────────────────────────────────────────────

export const transmissionsTable = pgTable("transmissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransmissionSchema = createInsertSchema(transmissionsTable).omit({ id: true, createdAt: true });
export type InsertTransmission = z.infer<typeof insertTransmissionSchema>;
export type Transmission = typeof transmissionsTable.$inferSelect;

// ── Conditions ────────────────────────────────────────────────────────────────

export const conditionsTable = pgTable("conditions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConditionSchema = createInsertSchema(conditionsTable).omit({ id: true, createdAt: true });
export type InsertCondition = z.infer<typeof insertConditionSchema>;
export type Condition = typeof conditionsTable.$inferSelect;

// ── Colors ────────────────────────────────────────────────────────────────────

export const vehicleColorsTable = pgTable("vehicle_colors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  hexCode: text("hex_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleColorSchema = createInsertSchema(vehicleColorsTable).omit({ id: true, createdAt: true });
export type InsertVehicleColor = z.infer<typeof insertVehicleColorSchema>;
export type VehicleColor = typeof vehicleColorsTable.$inferSelect;

// ── Brands ────────────────────────────────────────────────────────────────────

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brandsTable).omit({ id: true, createdAt: true });
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brandsTable.$inferSelect;

// ── Models ────────────────────────────────────────────────────────────────────

export const vehicleModelsTable = pgTable("vehicle_models", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => brandsTable.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleModelSchema = createInsertSchema(vehicleModelsTable).omit({ id: true, createdAt: true });
export type InsertVehicleModel = z.infer<typeof insertVehicleModelSchema>;
export type VehicleModel = typeof vehicleModelsTable.$inferSelect;

// ── Regions ───────────────────────────────────────────────────────────────────

export const regionsTable = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRegionSchema = createInsertSchema(regionsTable).omit({ id: true, createdAt: true });
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regionsTable.$inferSelect;

// ── Cities ────────────────────────────────────────────────────────────────────

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").notNull().references(() => regionsTable.id),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameKu: text("name_ku").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true, createdAt: true });
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof citiesTable.$inferSelect;

// ── Exchange Rates ────────────────────────────────────────────────────────────

export const exchangeRatesTable = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  iqdPerUsd: text("iqd_per_usd").notNull().default("1310"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRatesTable).omit({ id: true, updatedAt: true });
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRatesTable.$inferSelect;
