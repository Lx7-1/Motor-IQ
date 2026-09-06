import { Router } from "express";
import { db } from "@workspace/db";
import {
  favoritesTable,
  vehiclesTable,
  brandsTable,
  vehicleModelsTable,
  conditionsTable,
  citiesTable,
  regionsTable,
  vehicleImagesTable,
  featuredListingsTable,
  exchangeRatesTable,
} from "@workspace/db";
import { eq, and, sql, isNull, inArray, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/favorites
router.get("/favorites", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const favRows = await db
    .select({ vehicleId: favoritesTable.vehicleId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.userId!))
    .orderBy(desc(favoritesTable.createdAt));

  if (favRows.length === 0) { res.json([]); return; }

  const ids = favRows.map((f) => f.vehicleId);
  const [vehicles, images, featuredRows, favCounts, rate] = await Promise.all([
    db
      .select({
        id: vehiclesTable.id,
        title: vehiclesTable.title,
        year: vehiclesTable.year,
        price: vehiclesTable.price,
        currency: vehiclesTable.currency,
        mileage: vehiclesTable.mileage,
        is_negotiable: vehiclesTable.isNegotiable,
        status: vehiclesTable.status,
        dealer_id: vehiclesTable.dealerId,
        views_count: vehiclesTable.viewsCount,
        created_at: vehiclesTable.createdAt,
        brand_name: brandsTable.name,
        model_name: vehicleModelsTable.name,
        condition_name: conditionsTable.name,
        city_name: citiesTable.name,
        region_name: regionsTable.name,
      })
      .from(vehiclesTable)
      .leftJoin(brandsTable, eq(vehiclesTable.brandId, brandsTable.id))
      .leftJoin(vehicleModelsTable, eq(vehiclesTable.modelId, vehicleModelsTable.id))
      .leftJoin(conditionsTable, eq(vehiclesTable.conditionId, conditionsTable.id))
      .leftJoin(citiesTable, eq(vehiclesTable.cityId, citiesTable.id))
      .leftJoin(regionsTable, eq(vehiclesTable.regionId, regionsTable.id))
      .where(and(inArray(vehiclesTable.id, ids), isNull(vehiclesTable.deletedAt))),
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable).where(inArray(featuredListingsTable.vehicleId, ids)),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
    db.select().from(exchangeRatesTable).limit(1),
  ]);

  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const featuredSet = new Set(featuredRows.map((f) => f.vehicleId));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;

  res.json(vehicles.map((v) => {
    const priceNum = parseFloat(v.price);
    const priceUsd = v.currency === "IQD" ? priceNum / exchangeRate : priceNum;
    return {
      id: v.id,
      title: v.title,
      brand: v.brand_name ?? "",
      model: v.model_name ?? "",
      year: v.year,
      price: priceNum,
      price_usd: priceUsd,
      currency: v.currency,
      mileage: v.mileage ?? null,
      condition: v.condition_name ?? "",
      city: v.city_name ?? "",
      region: v.region_name ?? "",
      cover_image: coverMap.get(v.id) ?? null,
      is_negotiable: v.is_negotiable,
      is_featured: featuredSet.has(v.id),
      seller_type: v.dealer_id ? "dealer" : "individual",
      views_count: v.views_count ?? 0,
      favorites_count: favCountMap.get(v.id) ?? 0,
      is_favorited: true,
      status: v.status,
      created_at: v.created_at instanceof Date ? v.created_at.toISOString() : v.created_at,
    };
  }));
});

// POST /api/favorites/:vehicleId
router.post("/favorites/:vehicleId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  const existing = await db.select().from(favoritesTable).where(and(eq(favoritesTable.userId, req.userId!), eq(favoritesTable.vehicleId, vehicleId))).limit(1);
  if (existing.length === 0) {
    await db.insert(favoritesTable).values({ userId: req.userId!, vehicleId });
  }
  res.status(201).json({ vehicle_id: vehicleId, is_favorited: true });
});

// DELETE /api/favorites/:vehicleId
router.delete("/favorites/:vehicleId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, req.userId!), eq(favoritesTable.vehicleId, vehicleId)));
  res.json({ vehicle_id: vehicleId, is_favorited: false });
});

export default router;
