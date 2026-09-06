import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  vehiclesTable,
  brandsTable,
  vehicleModelsTable,
  conditionsTable,
  citiesTable,
  regionsTable,
  vehicleImagesTable,
  featuredListingsTable,
  favoritesTable,
} from "@workspace/db";
import { eq, and, isNull, sql, inArray, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/profile
router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl ?? null,
    phone: user.phone ?? null,
    whatsapp: user.whatsapp ?? null,
    city_id: user.cityId ?? null,
    region_id: user.regionId ?? null,
    role: user.role,
    is_dealer: user.isDealer,
    created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  });
});

// PATCH /api/profile
router.patch("/profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const body = req.body;
  const updateData: any = {};
  if (body.display_name != null) updateData.displayName = body.display_name;
  if (body.avatar_url != null) updateData.avatarUrl = body.avatar_url;
  if (body.phone != null) updateData.phone = body.phone;
  if (body.whatsapp != null) updateData.whatsapp = body.whatsapp;
  if (body.city_id != null) updateData.cityId = body.city_id;
  if (body.region_id != null) updateData.regionId = body.region_id;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.userId!)).returning();
  res.json({
    id: updated.id,
    email: updated.email,
    display_name: updated.displayName,
    avatar_url: updated.avatarUrl ?? null,
    phone: updated.phone ?? null,
    whatsapp: updated.whatsapp ?? null,
    city_id: updated.cityId ?? null,
    region_id: updated.regionId ?? null,
    role: updated.role,
    is_dealer: updated.isDealer,
    created_at: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
  });
});

// GET /api/profile/vehicles
router.get("/profile/vehicles", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const statusFilter = req.query.status as string | undefined;
  const conds: any[] = [eq(vehiclesTable.ownerId, req.userId!), isNull(vehiclesTable.deletedAt)];
  if (statusFilter) conds.push(eq(vehiclesTable.status, statusFilter));

  const vehicles = await db
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
    .where(and(...conds))
    .orderBy(desc(vehiclesTable.createdAt));

  if (vehicles.length === 0) { res.json([]); return; }
  const ids = vehicles.map((v) => v.id);
  const [images, featuredRows, favCounts] = await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable).where(inArray(featuredListingsTable.vehicleId, ids)),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
  ]);
  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const featuredSet = new Set(featuredRows.map((f) => f.vehicleId));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));

  res.json(vehicles.map((v) => ({
    id: v.id,
    title: v.title,
    brand: v.brand_name ?? "",
    model: v.model_name ?? "",
    year: v.year,
    price: parseFloat(v.price),
    price_usd: null,
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
    is_favorited: null,
    status: v.status,
    created_at: v.created_at instanceof Date ? v.created_at.toISOString() : v.created_at,
  })));
});

export default router;
