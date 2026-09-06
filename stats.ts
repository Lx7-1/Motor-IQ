import { Router } from "express";
import { db } from "@workspace/db";
import {
  vehiclesTable,
  usersTable,
  dealerProfilesTable,
  brandsTable,
  citiesTable,
  favoritesTable,
} from "@workspace/db";
import { eq, sql, isNull, and, desc } from "drizzle-orm";

const router = Router();

// GET /api/stats/dashboard
router.get("/stats/dashboard", async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[total], [active], [users], [dealers], [todayListings]] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(isNull(vehiclesTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt))),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(isNull(usersTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(dealerProfilesTable).where(isNull(dealerProfilesTable.deletedAt)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(and(isNull(vehiclesTable.deletedAt), sql`${vehiclesTable.createdAt} >= ${today}`)),
  ]);

  res.json({
    total_listings: total?.count ?? 0,
    active_listings: active?.count ?? 0,
    total_users: users?.count ?? 0,
    total_dealers: dealers?.count ?? 0,
    today_listings: todayListings?.count ?? 0,
  });
});

// GET /api/stats/popular-brands
router.get("/stats/popular-brands", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;

  const brands = await db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      listing_count: sql<number>`cast(count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null) as int)`,
    })
    .from(brandsTable)
    .leftJoin(vehiclesTable, eq(vehiclesTable.brandId, brandsTable.id))
    .groupBy(brandsTable.id)
    .orderBy(desc(sql`count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null)`))
    .limit(limit);

  res.json(brands.map((b) => ({
    id: b.id,
    name: b.name,
    logo_url: b.logoUrl ?? null,
    listing_count: b.listing_count,
  })));
});

// GET /api/stats/popular-cities
router.get("/stats/popular-cities", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 8;

  const cities = await db
    .select({
      id: citiesTable.id,
      name: citiesTable.name,
      nameAr: citiesTable.nameAr,
      listing_count: sql<number>`cast(count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null) as int)`,
    })
    .from(citiesTable)
    .leftJoin(vehiclesTable, eq(vehiclesTable.cityId, citiesTable.id))
    .groupBy(citiesTable.id)
    .orderBy(desc(sql`count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null)`))
    .limit(limit);

  res.json(cities.map((c) => ({
    id: c.id,
    name: c.name,
    name_ar: c.nameAr,
    listing_count: c.listing_count,
  })));
});

export default router;
