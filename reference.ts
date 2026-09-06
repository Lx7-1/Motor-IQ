import { Router } from "express";
import { db } from "@workspace/db";
import {
  vehicleTypesTable,
  fuelTypesTable,
  transmissionsTable,
  conditionsTable,
  vehicleColorsTable,
  brandsTable,
  vehicleModelsTable,
  vehiclesTable,
  exchangeRatesTable,
} from "@workspace/db";
import { eq, sql, isNull, and } from "drizzle-orm";

const router = Router();

// GET /api/vehicle-types
router.get("/vehicle-types", async (req, res): Promise<void> => {
  const types = await db.select().from(vehicleTypesTable).orderBy(vehicleTypesTable.id);
  res.json(types.map((t) => ({
    id: t.id,
    name: t.name,
    name_ar: t.nameAr,
    name_ku: t.nameKu,
    icon: t.icon ?? null,
    listing_count: null,
  })));
});

// GET /api/fuel-types
router.get("/fuel-types", async (req, res): Promise<void> => {
  const types = await db.select().from(fuelTypesTable).orderBy(fuelTypesTable.id);
  res.json(types.map((t) => ({ id: t.id, name: t.name, name_ar: t.nameAr, name_ku: t.nameKu })));
});

// GET /api/transmissions
router.get("/transmissions", async (req, res): Promise<void> => {
  const items = await db.select().from(transmissionsTable).orderBy(transmissionsTable.id);
  res.json(items.map((t) => ({ id: t.id, name: t.name, name_ar: t.nameAr, name_ku: t.nameKu })));
});

// GET /api/conditions
router.get("/conditions", async (req, res): Promise<void> => {
  const items = await db.select().from(conditionsTable).orderBy(conditionsTable.id);
  res.json(items.map((t) => ({ id: t.id, name: t.name, name_ar: t.nameAr, name_ku: t.nameKu })));
});

// GET /api/colors
router.get("/colors", async (req, res): Promise<void> => {
  const items = await db.select().from(vehicleColorsTable).orderBy(vehicleColorsTable.id);
  res.json(items.map((t) => ({
    id: t.id,
    name: t.name,
    name_ar: t.nameAr,
    name_ku: t.nameKu,
    hex_code: t.hexCode ?? null,
  })));
});

// GET /api/brands
router.get("/brands", async (req, res): Promise<void> => {
  const withCounts = req.query.with_counts === "true";
  const vehicleTypeId = req.query.vehicle_type_id ? Number(req.query.vehicle_type_id) : undefined;

  if (withCounts) {
    const counts = await db
      .select({
        id: brandsTable.id,
        name: brandsTable.name,
        logoUrl: brandsTable.logoUrl,
        listing_count: sql<number>`cast(count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null) as int)`,
      })
      .from(brandsTable)
      .leftJoin(vehiclesTable, eq(vehiclesTable.brandId, brandsTable.id))
      .groupBy(brandsTable.id)
      .orderBy(brandsTable.name);

    res.json(counts.map((b) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logoUrl ?? null,
      listing_count: b.listing_count,
    })));
  } else {
    const brands = await db.select().from(brandsTable).orderBy(brandsTable.name);
    res.json(brands.map((b) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logoUrl ?? null,
      listing_count: null,
    })));
  }
});

// GET /api/brands/:id/models
router.get("/brands/:id/models", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const brandId = parseInt(rawId, 10);
  if (isNaN(brandId)) {
    res.status(400).json({ error: "Invalid brand id" });
    return;
  }

  const models = await db
    .select()
    .from(vehicleModelsTable)
    .where(eq(vehicleModelsTable.brandId, brandId))
    .orderBy(vehicleModelsTable.name);

  res.json(models.map((m) => ({
    id: m.id,
    brand_id: m.brandId,
    name: m.name,
    listing_count: null,
  })));
});

// GET /api/exchange-rates
router.get("/exchange-rates", async (req, res): Promise<void> => {
  const [rate] = await db.select().from(exchangeRatesTable).orderBy(exchangeRatesTable.id).limit(1);
  if (!rate) {
    res.json({ iqd_per_usd: 1310, updated_at: new Date().toISOString() });
    return;
  }
  res.json({ iqd_per_usd: parseFloat(rate.iqdPerUsd), updated_at: rate.updatedAt.toISOString() });
});

export default router;
