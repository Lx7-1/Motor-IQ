import { Router } from "express";
import { db } from "@workspace/db";
import {
  dealerProfilesTable,
  usersTable,
  citiesTable,
  regionsTable,
  vehiclesTable,
  brandsTable,
  vehicleModelsTable,
  conditionsTable,
  vehicleImagesTable,
  favoritesTable,
  featuredListingsTable,
  exchangeRatesTable,
} from "@workspace/db";
import { eq, and, isNull, sql, desc, inArray } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

function dealerSummary(d: any, cityName: string, listingCount: number) {
  return {
    id: d.id,
    business_name: d.businessName,
    logo_url: d.logoUrl ?? null,
    city: cityName,
    is_verified: d.isVerified,
    listing_count: listingCount,
    phone: d.phone ?? null,
    whatsapp: d.whatsapp ?? null,
  };
}

// GET /api/dealers
router.get("/dealers", async (req, res): Promise<void> => {
  const cityId = req.query.city_id ? parseInt(req.query.city_id as string) : undefined;
  const limit = parseInt(req.query.limit as string) || 20;

  const conds: any[] = [isNull(dealerProfilesTable.deletedAt)];
  if (cityId) conds.push(eq(dealerProfilesTable.cityId, cityId));

  const dealers = await db
    .select({
      id: dealerProfilesTable.id,
      businessName: dealerProfilesTable.businessName,
      logoUrl: dealerProfilesTable.logoUrl,
      cityId: dealerProfilesTable.cityId,
      isVerified: dealerProfilesTable.isVerified,
      phone: dealerProfilesTable.phone,
      whatsapp: dealerProfilesTable.whatsapp,
    })
    .from(dealerProfilesTable)
    .where(and(...conds))
    .limit(limit);

  if (dealers.length === 0) { res.json([]); return; }
  const cityIds = [...new Set(dealers.map((d) => d.cityId))];
  const cities = await db.select().from(citiesTable).where(inArray(citiesTable.id, cityIds));
  const cityMap = new Map(cities.map((c) => [c.id, c.name]));

  const dealerIds = dealers.map((d) => d.id);
  const counts = await db
    .select({ dealerId: vehiclesTable.dealerId, count: sql<number>`cast(count(*) as int)` })
    .from(vehiclesTable)
    .where(and(inArray(vehiclesTable.dealerId, dealerIds), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt)))
    .groupBy(vehiclesTable.dealerId);
  const countMap = new Map(counts.map((c) => [c.dealerId!, c.count]));

  res.json(dealers.map((d) => dealerSummary(d, cityMap.get(d.cityId) ?? "", countMap.get(d.id) ?? 0)));
});

// GET /api/dealers/:id
router.get("/dealers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [dealer] = await db.select().from(dealerProfilesTable).where(and(eq(dealerProfilesTable.id, rawId), isNull(dealerProfilesTable.deletedAt))).limit(1);
  if (!dealer) { res.status(404).json({ error: "Not found" }); return; }

  const [[city], [region], [{ count }]] = await Promise.all([
    db.select().from(citiesTable).where(eq(citiesTable.id, dealer.cityId)).limit(1),
    db.select().from(regionsTable).where(eq(regionsTable.id, dealer.regionId)).limit(1),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.dealerId, rawId), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))),
  ]);

  res.json({
    id: dealer.id,
    user_id: dealer.userId,
    business_name: dealer.businessName,
    logo_url: dealer.logoUrl ?? null,
    banner_url: dealer.bannerUrl ?? null,
    description: dealer.description ?? null,
    phone: dealer.phone ?? null,
    whatsapp: dealer.whatsapp ?? null,
    website: dealer.website ?? null,
    facebook: dealer.facebook ?? null,
    instagram: dealer.instagram ?? null,
    city_id: dealer.cityId,
    region_id: dealer.regionId,
    city: city?.name ?? "",
    region: region?.name ?? "",
    latitude: dealer.latitude ? parseFloat(dealer.latitude) : null,
    longitude: dealer.longitude ? parseFloat(dealer.longitude) : null,
    is_verified: dealer.isVerified,
    listing_count: count,
    created_at: dealer.createdAt instanceof Date ? dealer.createdAt.toISOString() : dealer.createdAt,
  });
});

// GET /api/dealers/:id/vehicles
router.get("/dealers/:id/vehicles", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

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
    .where(and(eq(vehiclesTable.dealerId, rawId), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt)))
    .orderBy(desc(vehiclesTable.createdAt));

  const total = vehicles.length;
  if (total === 0) { res.json({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 }); return; }

  const ids = vehicles.map((v) => v.id);
  const [images, favCounts, rate] = await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
    db.select().from(exchangeRatesTable).limit(1),
  ]);
  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;

  res.json({
    data: vehicles.map((v) => {
      const priceNum = parseFloat(v.price);
      return {
        id: v.id, title: v.title, brand: v.brand_name ?? "", model: v.model_name ?? "", year: v.year,
        price: priceNum, price_usd: v.currency === "IQD" ? priceNum / exchangeRate : priceNum,
        currency: v.currency, mileage: v.mileage ?? null, condition: v.condition_name ?? "",
        city: v.city_name ?? "", region: v.region_name ?? "", cover_image: coverMap.get(v.id) ?? null,
        is_negotiable: v.is_negotiable, is_featured: false,
        seller_type: "dealer", views_count: v.views_count ?? 0,
        favorites_count: favCountMap.get(v.id) ?? 0, is_favorited: null,
        status: v.status, created_at: v.created_at instanceof Date ? v.created_at.toISOString() : v.created_at,
      };
    }),
    total, page: 1, limit: total, total_pages: 1,
  });
});

// GET /api/dealer-profile (current user's dealer profile)
router.get("/dealer-profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const [dealer] = await db.select().from(dealerProfilesTable).where(eq(dealerProfilesTable.userId, req.userId!)).limit(1);
  if (!dealer) { res.status(404).json({ error: "No dealer profile" }); return; }
  const [[city], [region], [{ count }]] = await Promise.all([
    db.select().from(citiesTable).where(eq(citiesTable.id, dealer.cityId)).limit(1),
    db.select().from(regionsTable).where(eq(regionsTable.id, dealer.regionId)).limit(1),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.dealerId, dealer.id), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))),
  ]);
  res.json({ id: dealer.id, user_id: dealer.userId, business_name: dealer.businessName, logo_url: dealer.logoUrl ?? null, banner_url: dealer.bannerUrl ?? null, description: dealer.description ?? null, phone: dealer.phone ?? null, whatsapp: dealer.whatsapp ?? null, website: dealer.website ?? null, facebook: dealer.facebook ?? null, instagram: dealer.instagram ?? null, city_id: dealer.cityId, region_id: dealer.regionId, city: city?.name ?? "", region: region?.name ?? "", latitude: dealer.latitude ? parseFloat(dealer.latitude) : null, longitude: dealer.longitude ? parseFloat(dealer.longitude) : null, is_verified: dealer.isVerified, listing_count: count, created_at: dealer.createdAt instanceof Date ? dealer.createdAt.toISOString() : dealer.createdAt });
});

// POST /api/dealer-profile
router.post("/dealer-profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const body = req.body;
  const [dealer] = await db.insert(dealerProfilesTable).values({
    userId: req.userId!,
    businessName: body.business_name,
    logoUrl: body.logo_url ?? null,
    bannerUrl: body.banner_url ?? null,
    description: body.description ?? null,
    phone: body.phone ?? null,
    whatsapp: body.whatsapp ?? null,
    website: body.website ?? null,
    facebook: body.facebook ?? null,
    instagram: body.instagram ?? null,
    cityId: body.city_id,
    regionId: body.region_id,
    latitude: body.latitude?.toString() ?? null,
    longitude: body.longitude?.toString() ?? null,
  }).returning();
  // Update user's dealer status
  await db.update(usersTable).set({ isDealer: true, role: "dealer" }).where(eq(usersTable.id, req.userId!));
  const [[city], [region]] = await Promise.all([
    db.select().from(citiesTable).where(eq(citiesTable.id, dealer.cityId)).limit(1),
    db.select().from(regionsTable).where(eq(regionsTable.id, dealer.regionId)).limit(1),
  ]);
  res.status(201).json({ id: dealer.id, user_id: dealer.userId, business_name: dealer.businessName, logo_url: dealer.logoUrl ?? null, banner_url: dealer.bannerUrl ?? null, description: dealer.description ?? null, phone: dealer.phone ?? null, whatsapp: dealer.whatsapp ?? null, website: dealer.website ?? null, facebook: dealer.facebook ?? null, instagram: dealer.instagram ?? null, city_id: dealer.cityId, region_id: dealer.regionId, city: city?.name ?? "", region: region?.name ?? "", latitude: dealer.latitude ? parseFloat(dealer.latitude) : null, longitude: dealer.longitude ? parseFloat(dealer.longitude) : null, is_verified: dealer.isVerified, listing_count: 0, created_at: dealer.createdAt.toISOString() });
});

// PATCH /api/dealer-profile
router.patch("/dealer-profile", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const body = req.body;
  const [existing] = await db.select().from(dealerProfilesTable).where(eq(dealerProfilesTable.userId, req.userId!)).limit(1);
  if (!existing) { res.status(404).json({ error: "No dealer profile" }); return; }
  const updateData: any = {};
  if (body.business_name != null) updateData.businessName = body.business_name;
  if (body.logo_url != null) updateData.logoUrl = body.logo_url;
  if (body.banner_url != null) updateData.bannerUrl = body.banner_url;
  if (body.description != null) updateData.description = body.description;
  if (body.phone != null) updateData.phone = body.phone;
  if (body.whatsapp != null) updateData.whatsapp = body.whatsapp;
  if (body.website != null) updateData.website = body.website;
  if (body.facebook != null) updateData.facebook = body.facebook;
  if (body.instagram != null) updateData.instagram = body.instagram;
  const [updated] = await db.update(dealerProfilesTable).set(updateData).where(eq(dealerProfilesTable.id, existing.id)).returning();
  const [[city], [region], [{ count }]] = await Promise.all([
    db.select().from(citiesTable).where(eq(citiesTable.id, updated.cityId)).limit(1),
    db.select().from(regionsTable).where(eq(regionsTable.id, updated.regionId)).limit(1),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.dealerId, updated.id), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))),
  ]);
  res.json({ id: updated.id, user_id: updated.userId, business_name: updated.businessName, logo_url: updated.logoUrl ?? null, banner_url: updated.bannerUrl ?? null, description: updated.description ?? null, phone: updated.phone ?? null, whatsapp: updated.whatsapp ?? null, website: updated.website ?? null, facebook: updated.facebook ?? null, instagram: updated.instagram ?? null, city_id: updated.cityId, region_id: updated.regionId, city: city?.name ?? "", region: region?.name ?? "", latitude: updated.latitude ? parseFloat(updated.latitude) : null, longitude: updated.longitude ? parseFloat(updated.longitude) : null, is_verified: updated.isVerified, listing_count: count, created_at: updated.createdAt.toISOString() });
});

export default router;
