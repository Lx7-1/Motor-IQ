import { Router } from "express";
import { db } from "@workspace/db";
import {
  vehiclesTable,
  usersTable,
  dealerProfilesTable,
  brandsTable,
  vehicleModelsTable,
  conditionsTable,
  citiesTable,
  regionsTable,
  vehicleImagesTable,
  featuredListingsTable,
  vehicleReportsTable,
  exchangeRatesTable,
  favoritesTable,
} from "@workspace/db";
import { eq, and, isNull, sql, desc, like, inArray, or } from "drizzle-orm";
import { requireAdmin, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET /api/admin/stats
router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[totalUsers], [totalDealers], [totalListings], [activeListings], [pendingListings], [totalReports], [pendingReports], [todaySignups], [todayListings]] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(isNull(usersTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(dealerProfilesTable).where(isNull(dealerProfilesTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(isNull(vehiclesTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.status, "draft"), isNull(vehiclesTable.deletedAt))),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehicleReportsTable),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehicleReportsTable).where(eq(vehicleReportsTable.status, "pending")),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(and(isNull(usersTable.deletedAt), sql`${usersTable.createdAt} >= ${today}`)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(isNull(vehiclesTable.deletedAt), sql`${vehiclesTable.createdAt} >= ${today}`)),
  ]);

  res.json({
    total_users: totalUsers?.count ?? 0,
    total_dealers: totalDealers?.count ?? 0,
    total_listings: totalListings?.count ?? 0,
    active_listings: activeListings?.count ?? 0,
    pending_listings: pendingListings?.count ?? 0,
    total_reports: totalReports?.count ?? 0,
    pending_reports: pendingReports?.count ?? 0,
    today_signups: todaySignups?.count ?? 0,
    today_listings: todayListings?.count ?? 0,
  });
});

// GET /api/admin/vehicles
router.get("/admin/vehicles", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  const conds: any[] = [isNull(vehiclesTable.deletedAt)];
  if (statusFilter) conds.push(eq(vehiclesTable.status, statusFilter));
  if (keyword) conds.push(or(like(vehiclesTable.title, `%${keyword}%`), like(vehiclesTable.description, `%${keyword}%`)));

  const whereClause = and(...conds);
  const [vehicles, [{ count }]] = await Promise.all([
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
      .where(whereClause)
      .orderBy(desc(vehiclesTable.createdAt))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(whereClause),
  ]);

  const ids = vehicles.map((v) => v.id);
  const [images, featuredRows, favCounts] = ids.length > 0 ? await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable).where(inArray(featuredListingsTable.vehicleId, ids)),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
  ]) : [[], [], []];

  const coverMap = new Map((images as any[]).map((i) => [i.vehicleId, i.url]));
  const featuredSet = new Set((featuredRows as any[]).map((f) => f.vehicleId));
  const favCountMap = new Map((favCounts as any[]).map((f) => [f.vehicleId, f.count]));

  res.json({
    data: vehicles.map((v) => ({
      id: v.id, title: v.title, brand: v.brand_name ?? "", model: v.model_name ?? "", year: v.year,
      price: parseFloat(v.price), price_usd: null, currency: v.currency, mileage: v.mileage ?? null,
      condition: v.condition_name ?? "", city: v.city_name ?? "", region: v.region_name ?? "",
      cover_image: coverMap.get(v.id) ?? null, is_negotiable: v.is_negotiable,
      is_featured: featuredSet.has(v.id), seller_type: v.dealer_id ? "dealer" : "individual",
      views_count: v.views_count ?? 0, favorites_count: favCountMap.get(v.id) ?? 0, is_favorited: null,
      status: v.status, created_at: v.created_at instanceof Date ? v.created_at.toISOString() : v.created_at,
    })),
    total: count, page, limit, total_pages: Math.ceil(count / limit),
  });
});

// POST /api/admin/vehicles/:id/approve
router.post("/admin/vehicles/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(vehiclesTable).set({ status: "active" }).where(eq(vehiclesTable.id, rawId));
  res.json({ message: "Approved" });
});

// POST /api/admin/vehicles/:id/reject
router.post("/admin/vehicles/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(vehiclesTable).set({ status: "rejected" }).where(eq(vehiclesTable.id, rawId));
  res.json({ message: "Rejected" });
});

// GET /api/admin/users
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const keyword = req.query.keyword as string | undefined;
  const role = req.query.role as string | undefined;

  const conds: any[] = [isNull(usersTable.deletedAt)];
  if (keyword) conds.push(or(like(usersTable.displayName, `%${keyword}%`), like(usersTable.email, `%${keyword}%`)));
  if (role) conds.push(eq(usersTable.role, role));

  const whereClause = and(...conds);
  const [users, [{ count }]] = await Promise.all([
    db.select().from(usersTable).where(whereClause).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(whereClause),
  ]);

  const userIds = users.map((u) => u.id);
  const listingCounts = userIds.length > 0
    ? await db.select({ ownerId: vehiclesTable.ownerId, count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(inArray(vehiclesTable.ownerId, userIds), isNull(vehiclesTable.deletedAt))).groupBy(vehiclesTable.ownerId)
    : [];
  const countMap = new Map(listingCounts.map((l) => [l.ownerId, l.count]));

  res.json({
    data: users.map((u) => ({
      id: u.id, email: u.email, display_name: u.displayName, role: u.role,
      is_dealer: u.isDealer, listing_count: countMap.get(u.id) ?? 0,
      created_at: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    })),
    total: count, page,
  });
});

// GET /api/admin/dealers
router.get("/admin/dealers", requireAdmin, async (req, res): Promise<void> => {
  const verifiedFilter = req.query.verified;
  const conds: any[] = [isNull(dealerProfilesTable.deletedAt)];
  if (verifiedFilter === "true") conds.push(eq(dealerProfilesTable.isVerified, true));
  if (verifiedFilter === "false") conds.push(eq(dealerProfilesTable.isVerified, false));

  const dealers = await db.select().from(dealerProfilesTable).where(and(...conds)).orderBy(desc(dealerProfilesTable.createdAt));
  const cityIds = [...new Set(dealers.map((d) => d.cityId))];
  const cities = cityIds.length > 0 ? await db.select().from(citiesTable).where(inArray(citiesTable.id, cityIds)) : [];
  const cityMap = new Map(cities.map((c) => [c.id, c.name]));
  const dealerIds = dealers.map((d) => d.id);
  const counts = dealerIds.length > 0 ? await db.select({ dealerId: vehiclesTable.dealerId, count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(inArray(vehiclesTable.dealerId, dealerIds), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))).groupBy(vehiclesTable.dealerId) : [];
  const countMap = new Map(counts.map((c) => [c.dealerId!, c.count]));

  res.json(dealers.map((d) => ({ id: d.id, business_name: d.businessName, logo_url: d.logoUrl ?? null, city: cityMap.get(d.cityId) ?? "", is_verified: d.isVerified, listing_count: countMap.get(d.id) ?? 0, phone: d.phone ?? null, whatsapp: d.whatsapp ?? null })));
});

// POST /api/admin/dealers/:id/verify
router.post("/admin/dealers/:id/verify", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(dealerProfilesTable).set({ isVerified: true }).where(eq(dealerProfilesTable.id, rawId));
  res.json({ message: "Verified" });
});

// GET /api/admin/brands
router.get("/admin/brands", requireAdmin, async (req, res): Promise<void> => {
  const brands = await db.select().from(brandsTable).orderBy(brandsTable.name);
  res.json(brands.map((b) => ({ id: b.id, name: b.name, logo_url: b.logoUrl ?? null, listing_count: null })));
});

// POST /api/admin/brands
router.post("/admin/brands", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body;
  const [brand] = await db.insert(brandsTable).values({ name: body.name, logoUrl: body.logo_url ?? null }).returning();
  res.status(201).json({ id: brand.id, name: brand.name, logo_url: brand.logoUrl ?? null, listing_count: null });
});

// PATCH /api/admin/exchange-rate
router.patch("/admin/exchange-rate", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body;
  const [existing] = await db.select().from(exchangeRatesTable).limit(1);
  if (existing) {
    const [updated] = await db.update(exchangeRatesTable).set({ iqdPerUsd: body.iqd_per_usd.toString() }).where(eq(exchangeRatesTable.id, existing.id)).returning();
    res.json({ iqd_per_usd: parseFloat(updated.iqdPerUsd), updated_at: updated.updatedAt.toISOString() });
  } else {
    const [created] = await db.insert(exchangeRatesTable).values({ iqdPerUsd: body.iqd_per_usd.toString() }).returning();
    res.json({ iqd_per_usd: parseFloat(created.iqdPerUsd), updated_at: created.updatedAt.toISOString() });
  }
});

// POST /api/admin/featured/:vehicleId
router.post("/admin/featured/:vehicleId", requireAdmin, async (req, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  const body = req.body;
  await db.insert(featuredListingsTable).values({ vehicleId, expiresAt: body.expires_at ? new Date(body.expires_at) : null }).onConflictDoNothing();
  res.json({ message: "Featured" });
});

// DELETE /api/admin/featured/:vehicleId
router.delete("/admin/featured/:vehicleId", requireAdmin, async (req, res): Promise<void> => {
  const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
  await db.delete(featuredListingsTable).where(eq(featuredListingsTable.vehicleId, vehicleId));
  res.status(204).end();
});

// GET /api/admin/reports
router.get("/admin/reports", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const statusFilter = req.query.status as string | undefined;
  const conds: any[] = [];
  if (statusFilter) conds.push(eq(vehicleReportsTable.status, statusFilter));

  const reports = await db.select().from(vehicleReportsTable).where(conds.length > 0 ? and(...conds) : undefined).orderBy(desc(vehicleReportsTable.createdAt)).limit(20).offset((page - 1) * 20);

  const vehicleIds = [...new Set(reports.map((r) => r.vehicleId))];
  const vehicles = vehicleIds.length > 0 ? await db.select({ id: vehiclesTable.id, title: vehiclesTable.title }).from(vehiclesTable).where(inArray(vehiclesTable.id, vehicleIds)) : [];
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.title]));

  res.json(reports.map((r) => ({
    id: r.id, vehicle_id: r.vehicleId, vehicle_title: vehicleMap.get(r.vehicleId) ?? "",
    reporter_id: r.reporterId, reason: r.reason, description: r.description ?? null,
    status: r.status, created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

export default router;
