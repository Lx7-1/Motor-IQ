import { Router } from "express";
import { db } from "@workspace/db";
import { regionsTable, citiesTable, vehiclesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/regions
router.get("/regions", async (req, res): Promise<void> => {
  const withCounts = req.query.with_counts === "true";

  if (withCounts) {
    const regions = await db
      .select({
        id: regionsTable.id,
        name: regionsTable.name,
        nameAr: regionsTable.nameAr,
        nameKu: regionsTable.nameKu,
        listing_count: sql<number>`cast(count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null) as int)`,
      })
      .from(regionsTable)
      .leftJoin(vehiclesTable, eq(vehiclesTable.regionId, regionsTable.id))
      .groupBy(regionsTable.id)
      .orderBy(regionsTable.name);

    res.json(regions.map((r) => ({
      id: r.id,
      name: r.name,
      name_ar: r.nameAr,
      name_ku: r.nameKu,
      listing_count: r.listing_count,
    })));
  } else {
    const regions = await db.select().from(regionsTable).orderBy(regionsTable.name);
    res.json(regions.map((r) => ({
      id: r.id,
      name: r.name,
      name_ar: r.nameAr,
      name_ku: r.nameKu,
      listing_count: null,
    })));
  }
});

// GET /api/regions/:id/cities
router.get("/regions/:id/cities", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const regionId = parseInt(rawId, 10);
  if (isNaN(regionId)) {
    res.status(400).json({ error: "Invalid region id" });
    return;
  }

  const cities = await db
    .select()
    .from(citiesTable)
    .where(eq(citiesTable.regionId, regionId))
    .orderBy(citiesTable.name);

  res.json(cities.map((c) => ({
    id: c.id,
    region_id: c.regionId,
    name: c.name,
    name_ar: c.nameAr,
    name_ku: c.nameKu,
    listing_count: null,
  })));
});

// GET /api/cities
router.get("/cities", async (req, res): Promise<void> => {
  const withCounts = req.query.with_counts === "true";

  if (withCounts) {
    const cities = await db
      .select({
        id: citiesTable.id,
        regionId: citiesTable.regionId,
        name: citiesTable.name,
        nameAr: citiesTable.nameAr,
        nameKu: citiesTable.nameKu,
        listing_count: sql<number>`cast(count(${vehiclesTable.id}) filter (where ${vehiclesTable.status} = 'active' and ${vehiclesTable.deletedAt} is null) as int)`,
      })
      .from(citiesTable)
      .leftJoin(vehiclesTable, eq(vehiclesTable.cityId, citiesTable.id))
      .groupBy(citiesTable.id)
      .orderBy(citiesTable.name);

    res.json(cities.map((c) => ({
      id: c.id,
      region_id: c.regionId,
      name: c.name,
      name_ar: c.nameAr,
      name_ku: c.nameKu,
      listing_count: c.listing_count,
    })));
  } else {
    const cities = await db.select().from(citiesTable).orderBy(citiesTable.name);
    res.json(cities.map((c) => ({
      id: c.id,
      region_id: c.regionId,
      name: c.name,
      name_ar: c.nameAr,
      name_ku: c.nameKu,
      listing_count: null,
    })));
  }
});

export default router;
