import { Router } from "express";
import { db } from "@workspace/db";
import {
  vehiclesTable,
  vehicleImagesTable,
  brandsTable,
  vehicleModelsTable,
  vehicleTypesTable,
  fuelTypesTable,
  transmissionsTable,
  conditionsTable,
  vehicleColorsTable,
  regionsTable,
  citiesTable,
  usersTable,
  dealerProfilesTable,
  favoritesTable,
  featuredListingsTable,
  vehicleReportsTable,
  exchangeRatesTable,
} from "@workspace/db";
import { eq, and, sql, desc, asc, like, gte, lte, isNull, or, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

function buildVehicleSummary(
  v: any,
  coverImage: string | null,
  isFeatured: boolean,
  favCount: number,
  isFavorited: boolean | null,
  exchangeRate: number
) {
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
    cover_image: coverImage,
    is_negotiable: v.is_negotiable,
    is_featured: isFeatured,
    seller_type: v.dealer_id ? "dealer" : "individual",
    views_count: v.views_count ?? 0,
    favorites_count: favCount,
    is_favorited: isFavorited,
    status: v.status,
    created_at: v.created_at instanceof Date ? v.created_at.toISOString() : v.created_at,
  };
}

// GET /api/vehicles
router.get("/vehicles", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  // Build conditions
  const conds: any[] = [eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt)];

  if (req.query.brand_id) conds.push(eq(vehiclesTable.brandId, parseInt(req.query.brand_id as string)));
  if (req.query.model_id) conds.push(eq(vehiclesTable.modelId, parseInt(req.query.model_id as string)));
  if (req.query.vehicle_type_id) conds.push(eq(vehiclesTable.vehicleTypeId, parseInt(req.query.vehicle_type_id as string)));
  if (req.query.condition_id) conds.push(eq(vehiclesTable.conditionId, parseInt(req.query.condition_id as string)));
  if (req.query.fuel_type_id) conds.push(eq(vehiclesTable.fuelTypeId, parseInt(req.query.fuel_type_id as string)));
  if (req.query.transmission_id) conds.push(eq(vehiclesTable.transmissionId, parseInt(req.query.transmission_id as string)));
  if (req.query.region_id) conds.push(eq(vehiclesTable.regionId, parseInt(req.query.region_id as string)));
  if (req.query.city_id) conds.push(eq(vehiclesTable.cityId, parseInt(req.query.city_id as string)));
  if (req.query.color_id) conds.push(eq(vehiclesTable.colorId, parseInt(req.query.color_id as string)));
  if (req.query.year_min) conds.push(gte(vehiclesTable.year, parseInt(req.query.year_min as string)));
  if (req.query.year_max) conds.push(lte(vehiclesTable.year, parseInt(req.query.year_max as string)));
  if (req.query.price_min) conds.push(gte(vehiclesTable.price, req.query.price_min as string));
  if (req.query.price_max) conds.push(lte(vehiclesTable.price, req.query.price_max as string));
  if (req.query.mileage_max) conds.push(lte(vehiclesTable.mileage, parseInt(req.query.mileage_max as string)));
  if (req.query.seller_type === "dealer") conds.push(sql`${vehiclesTable.dealerId} is not null`);
  if (req.query.seller_type === "individual") conds.push(isNull(vehiclesTable.dealerId));
  if (req.query.is_negotiable === "true") conds.push(eq(vehiclesTable.isNegotiable, true));
  if (req.query.featured_only === "true") {
    const featuredIds = await db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable);
    if (featuredIds.length > 0) {
      conds.push(inArray(vehiclesTable.id, featuredIds.map((f) => f.vehicleId)));
    }
  }
  if (req.query.keyword) {
    const kw = `%${req.query.keyword}%`;
    conds.push(
      or(
        like(vehiclesTable.title, kw),
        like(vehiclesTable.description, kw)
      )
    );
  }

  const sortField = req.query.sort as string || "newest";
  let orderBy: any;
  switch (sortField) {
    case "oldest": orderBy = asc(vehiclesTable.createdAt); break;
    case "price_asc": orderBy = asc(vehiclesTable.price); break;
    case "price_desc": orderBy = desc(vehiclesTable.price); break;
    case "most_viewed": orderBy = desc(vehiclesTable.viewsCount); break;
    default: orderBy = desc(vehiclesTable.createdAt);
  }

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
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(vehiclesTable).where(whereClause),
  ]);

  const vehicleIds = vehicles.map((v) => v.id);

  // Get cover images and featured status
  const [images, featuredRows, favCounts, userFavs, rate] = await Promise.all([
    vehicleIds.length > 0
      ? db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, vehicleIds), eq(vehicleImagesTable.isCover, true)))
      : [],
    vehicleIds.length > 0
      ? db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable).where(inArray(featuredListingsTable.vehicleId, vehicleIds))
      : [],
    vehicleIds.length > 0
      ? db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, vehicleIds)).groupBy(favoritesTable.vehicleId)
      : [],
    req.userId && vehicleIds.length > 0
      ? db.select({ vehicleId: favoritesTable.vehicleId }).from(favoritesTable).where(and(eq(favoritesTable.userId, req.userId), inArray(favoritesTable.vehicleId, vehicleIds)))
      : [],
    db.select().from(exchangeRatesTable).limit(1),
  ]);

  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const featuredSet = new Set(featuredRows.map((f) => f.vehicleId));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));
  const userFavSet = new Set((userFavs as any[]).map((f) => f.vehicleId));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;

  const data = vehicles.map((v) =>
    buildVehicleSummary(
      v,
      coverMap.get(v.id) ?? null,
      featuredSet.has(v.id),
      favCountMap.get(v.id) ?? 0,
      req.userId ? userFavSet.has(v.id) : null,
      exchangeRate
    )
  );

  res.json({ data, total: count, page, limit, total_pages: Math.ceil(count / limit) });
});

// GET /api/vehicles/featured
router.get("/vehicles/featured", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 8;
  const featured = await db
    .select({ vehicleId: featuredListingsTable.vehicleId })
    .from(featuredListingsTable)
    .limit(limit);

  if (featured.length === 0) {
    res.json([]);
    return;
  }

  const ids = featured.map((f) => f.vehicleId);
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
    .where(and(inArray(vehiclesTable.id, ids), eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt)));

  const [images, favCounts, rate] = await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
    db.select().from(exchangeRatesTable).limit(1),
  ]);

  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;

  res.json(vehicles.map((v) => buildVehicleSummary(v, coverMap.get(v.id) ?? null, true, favCountMap.get(v.id) ?? 0, null, exchangeRate)));
});

// GET /api/vehicles/latest
router.get("/vehicles/latest", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 12;
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
    .where(and(eq(vehiclesTable.status, "active"), isNull(vehiclesTable.deletedAt)))
    .orderBy(desc(vehiclesTable.createdAt))
    .limit(limit);

  if (vehicles.length === 0) { res.json([]); return; }
  const ids = vehicles.map((v) => v.id);
  const [images, favCounts, featuredRows, rate] = await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select({ vehicleId: favoritesTable.vehicleId, count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(inArray(favoritesTable.vehicleId, ids)).groupBy(favoritesTable.vehicleId),
    db.select({ vehicleId: featuredListingsTable.vehicleId }).from(featuredListingsTable).where(inArray(featuredListingsTable.vehicleId, ids)),
    db.select().from(exchangeRatesTable).limit(1),
  ]);
  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const favCountMap = new Map(favCounts.map((f) => [f.vehicleId, f.count]));
  const featuredSet = new Set(featuredRows.map((f) => f.vehicleId));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;
  res.json(vehicles.map((v) => buildVehicleSummary(v, coverMap.get(v.id) ?? null, featuredSet.has(v.id), favCountMap.get(v.id) ?? 0, null, exchangeRate)));
});

// GET /api/vehicles/:id
router.get("/vehicles/:id", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.id, rawId), isNull(vehiclesTable.deletedAt)))
    .limit(1);

  if (!vehicle) { res.status(404).json({ error: "Not found" }); return; }

  // Increment view count
  await db.update(vehiclesTable).set({ viewsCount: sql`${vehiclesTable.viewsCount} + 1` }).where(eq(vehiclesTable.id, rawId));

  const [images, brand, model, vehicleType, fuelType, transmission, condition, color, region, city, seller, featured, rate] = await Promise.all([
    db.select().from(vehicleImagesTable).where(eq(vehicleImagesTable.vehicleId, rawId)).orderBy(asc(vehicleImagesTable.sortOrder)),
    vehicle.brandId ? db.select().from(brandsTable).where(eq(brandsTable.id, vehicle.brandId)).limit(1) : [],
    vehicle.modelId ? db.select().from(vehicleModelsTable).where(eq(vehicleModelsTable.id, vehicle.modelId)).limit(1) : [],
    vehicle.vehicleTypeId ? db.select().from(vehicleTypesTable).where(eq(vehicleTypesTable.id, vehicle.vehicleTypeId)).limit(1) : [],
    vehicle.fuelTypeId ? db.select().from(fuelTypesTable).where(eq(fuelTypesTable.id, vehicle.fuelTypeId)).limit(1) : [],
    vehicle.transmissionId ? db.select().from(transmissionsTable).where(eq(transmissionsTable.id, vehicle.transmissionId)).limit(1) : [],
    vehicle.conditionId ? db.select().from(conditionsTable).where(eq(conditionsTable.id, vehicle.conditionId)).limit(1) : [],
    vehicle.colorId ? db.select().from(vehicleColorsTable).where(eq(vehicleColorsTable.id, vehicle.colorId)).limit(1) : [],
    vehicle.regionId ? db.select().from(regionsTable).where(eq(regionsTable.id, vehicle.regionId)).limit(1) : [],
    vehicle.cityId ? db.select().from(citiesTable).where(eq(citiesTable.id, vehicle.cityId)).limit(1) : [],
    db.select().from(usersTable).where(eq(usersTable.id, vehicle.ownerId)).limit(1),
    db.select().from(featuredListingsTable).where(eq(featuredListingsTable.vehicleId, rawId)).limit(1),
    db.select().from(exchangeRatesTable).limit(1),
  ]);

  const [favCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(favoritesTable).where(eq(favoritesTable.vehicleId, rawId));
  let isFavorited: boolean | null = null;
  if (req.userId) {
    const [fav] = await db.select().from(favoritesTable).where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.vehicleId, rawId))).limit(1);
    isFavorited = !!fav;
  }

  let dealerData: any = null;
  if (vehicle.dealerId) {
    const [dealer] = await db.select().from(dealerProfilesTable).where(eq(dealerProfilesTable.id, vehicle.dealerId)).limit(1);
    if (dealer) {
      const [dCity] = await db.select().from(citiesTable).where(eq(citiesTable.id, dealer.cityId)).limit(1);
      dealerData = {
        id: dealer.id,
        business_name: dealer.businessName,
        logo_url: dealer.logoUrl ?? null,
        city: dCity?.name ?? "",
        is_verified: dealer.isVerified,
        listing_count: null,
        phone: dealer.phone ?? null,
        whatsapp: dealer.whatsapp ?? null,
      };
    }
  }

  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;
  const priceNum = parseFloat(vehicle.price);
  const priceUsd = vehicle.currency === "IQD" ? priceNum / exchangeRate : priceNum;
  const priceIqd = vehicle.currency === "USD" ? priceNum * exchangeRate : priceNum;

  const b = (brand as any[])[0];
  const m = (model as any[])[0];
  const vt = (vehicleType as any[])[0];
  const ft = (fuelType as any[])[0];
  const tr = (transmission as any[])[0];
  const co = (condition as any[])[0];
  const cl = (color as any[])[0];
  const rg = (region as any[])[0];
  const ct = (city as any[])[0];
  const sl = (seller as any[])[0];

  res.json({
    id: vehicle.id,
    title: vehicle.title,
    brand: b ? { id: b.id, name: b.name, logo_url: b.logoUrl ?? null } : null,
    model: m ? { id: m.id, brand_id: m.brandId, name: m.name } : null,
    vehicle_type: vt ? { id: vt.id, name: vt.name, name_ar: vt.nameAr, name_ku: vt.nameKu, icon: vt.icon ?? null } : null,
    year: vehicle.year,
    mileage: vehicle.mileage ?? null,
    engine_size: vehicle.engineSize ?? null,
    horsepower: vehicle.horsepower ?? null,
    transmission: tr ? { id: tr.id, name: tr.name, name_ar: tr.nameAr, name_ku: tr.nameKu } : null,
    fuel_type: ft ? { id: ft.id, name: ft.name, name_ar: ft.nameAr, name_ku: ft.nameKu } : null,
    color: cl ? { id: cl.id, name: cl.name, name_ar: cl.nameAr, name_ku: cl.nameKu, hex_code: cl.hexCode ?? null } : null,
    condition: co ? { id: co.id, name: co.name, name_ar: co.nameAr, name_ku: co.nameKu } : null,
    vin: vehicle.vin ?? null,
    price: priceNum,
    price_usd: priceUsd,
    price_iqd: priceIqd,
    currency: vehicle.currency,
    is_negotiable: vehicle.isNegotiable,
    description: vehicle.description ?? null,
    region: rg ? { id: rg.id, name: rg.name, name_ar: rg.nameAr, name_ku: rg.nameKu } : null,
    city: ct ? { id: ct.id, region_id: ct.regionId, name: ct.name, name_ar: ct.nameAr, name_ku: ct.nameKu } : null,
    latitude: vehicle.latitude ? parseFloat(vehicle.latitude) : null,
    longitude: vehicle.longitude ? parseFloat(vehicle.longitude) : null,
    images: images.map((img) => ({ id: img.id, url: img.url, thumbnail_url: img.thumbnailUrl ?? null, is_cover: img.isCover, sort_order: img.sortOrder })),
    seller: sl ? {
      id: sl.id,
      display_name: sl.displayName,
      avatar_url: sl.avatarUrl ?? null,
      phone: sl.phone ?? null,
      whatsapp: sl.whatsapp ?? null,
      role: sl.role,
      created_at: sl.createdAt instanceof Date ? sl.createdAt.toISOString() : sl.createdAt,
    } : null,
    dealer: dealerData,
    is_featured: (featured as any[]).length > 0,
    is_favorited: isFavorited,
    views_count: (vehicle.viewsCount ?? 0) + 1,
    favorites_count: favCount?.count ?? 0,
    status: vehicle.status,
    created_at: vehicle.createdAt instanceof Date ? vehicle.createdAt.toISOString() : vehicle.createdAt,
    updated_at: vehicle.updatedAt instanceof Date ? vehicle.updatedAt.toISOString() : vehicle.updatedAt,
  });
});

// GET /api/vehicles/:id/similar
router.get("/vehicles/:id/similar", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, rawId)).limit(1);
  if (!vehicle) { res.json([]); return; }

  const similar = await db
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
    .where(and(
      eq(vehiclesTable.status, "active"),
      isNull(vehiclesTable.deletedAt),
      eq(vehiclesTable.brandId, vehicle.brandId),
      sql`${vehiclesTable.id} != ${rawId}`
    ))
    .limit(6);

  if (similar.length === 0) { res.json([]); return; }
  const ids = similar.map((v) => v.id);
  const [images, rate] = await Promise.all([
    db.select().from(vehicleImagesTable).where(and(inArray(vehicleImagesTable.vehicleId, ids), eq(vehicleImagesTable.isCover, true))),
    db.select().from(exchangeRatesTable).limit(1),
  ]);
  const coverMap = new Map(images.map((i) => [i.vehicleId, i.url]));
  const exchangeRate = rate[0] ? parseFloat(rate[0].iqdPerUsd) : 1310;
  res.json(similar.map((v) => buildVehicleSummary(v, coverMap.get(v.id) ?? null, false, 0, null, exchangeRate)));
});

// POST /api/vehicles
router.post("/vehicles", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const body = req.body;
  const [vehicle] = await db.insert(vehiclesTable).values({
    title: body.title,
    brandId: body.brand_id,
    modelId: body.model_id,
    vehicleTypeId: body.vehicle_type_id,
    year: body.year,
    mileage: body.mileage ?? null,
    engineSize: body.engine_size ?? null,
    horsepower: body.horsepower ?? null,
    transmissionId: body.transmission_id ?? null,
    fuelTypeId: body.fuel_type_id ?? null,
    colorId: body.color_id ?? null,
    conditionId: body.condition_id,
    vin: body.vin ?? null,
    price: body.price.toString(),
    currency: body.currency ?? "USD",
    isNegotiable: body.is_negotiable ?? false,
    description: body.description ?? null,
    regionId: body.region_id,
    cityId: body.city_id,
    latitude: body.latitude?.toString() ?? null,
    longitude: body.longitude?.toString() ?? null,
    status: body.status ?? "draft",
    ownerId: req.userId!,
  }).returning();

  res.status(201).json({
    id: vehicle.id,
    title: vehicle.title,
    brand_id: vehicle.brandId,
    model_id: vehicle.modelId,
    vehicle_type_id: vehicle.vehicleTypeId,
    year: vehicle.year,
    mileage: vehicle.mileage ?? null,
    engine_size: vehicle.engineSize ?? null,
    horsepower: vehicle.horsepower ?? null,
    transmission_id: vehicle.transmissionId ?? null,
    fuel_type_id: vehicle.fuelTypeId ?? null,
    color_id: vehicle.colorId ?? null,
    condition_id: vehicle.conditionId,
    vin: vehicle.vin ?? null,
    price: parseFloat(vehicle.price),
    currency: vehicle.currency,
    is_negotiable: vehicle.isNegotiable,
    description: vehicle.description ?? null,
    region_id: vehicle.regionId,
    city_id: vehicle.cityId,
    latitude: vehicle.latitude ? parseFloat(vehicle.latitude) : null,
    longitude: vehicle.longitude ? parseFloat(vehicle.longitude) : null,
    status: vehicle.status,
    owner_id: vehicle.ownerId,
    dealer_id: vehicle.dealerId ?? null,
    created_at: vehicle.createdAt.toISOString(),
    updated_at: vehicle.updatedAt.toISOString(),
  });
});

// PATCH /api/vehicles/:id
router.patch("/vehicles/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, rawId), eq(vehiclesTable.ownerId, req.userId!))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const body = req.body;
  const updateData: any = {};
  if (body.title != null) updateData.title = body.title;
  if (body.price != null) updateData.price = body.price.toString();
  if (body.currency != null) updateData.currency = body.currency;
  if (body.is_negotiable != null) updateData.isNegotiable = body.is_negotiable;
  if (body.description != null) updateData.description = body.description;
  if (body.mileage != null) updateData.mileage = body.mileage;
  if (body.status != null) updateData.status = body.status;
  if (body.city_id != null) updateData.cityId = body.city_id;
  if (body.region_id != null) updateData.regionId = body.region_id;

  const [updated] = await db.update(vehiclesTable).set(updateData).where(eq(vehiclesTable.id, rawId)).returning();
  res.json({ id: updated.id, title: updated.title, brand_id: updated.brandId, model_id: updated.modelId, vehicle_type_id: updated.vehicleTypeId, year: updated.year, condition_id: updated.conditionId, price: parseFloat(updated.price), currency: updated.currency, is_negotiable: updated.isNegotiable, region_id: updated.regionId, city_id: updated.cityId, status: updated.status, owner_id: updated.ownerId, dealer_id: updated.dealerId ?? null, created_at: updated.createdAt.toISOString(), updated_at: updated.updatedAt.toISOString() });
});

// DELETE /api/vehicles/:id
router.delete("/vehicles/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, rawId), eq(vehiclesTable.ownerId, req.userId!))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(vehiclesTable).set({ deletedAt: new Date() }).where(eq(vehiclesTable.id, rawId));
  res.status(204).end();
});

// POST /api/vehicles/:id/publish
router.post("/vehicles/:id/publish", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, rawId), eq(vehiclesTable.ownerId, req.userId!))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(vehiclesTable).set({ status: "active" }).where(eq(vehiclesTable.id, rawId)).returning();
  res.json({ id: updated.id, status: updated.status, title: updated.title, brand_id: updated.brandId, model_id: updated.modelId, vehicle_type_id: updated.vehicleTypeId, year: updated.year, condition_id: updated.conditionId, price: parseFloat(updated.price), currency: updated.currency, is_negotiable: updated.isNegotiable, region_id: updated.regionId, city_id: updated.cityId, owner_id: updated.ownerId, dealer_id: updated.dealerId ?? null, created_at: updated.createdAt.toISOString(), updated_at: updated.updatedAt.toISOString() });
});

// POST /api/vehicles/:id/images
router.post("/vehicles/:id/images", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, rawId), eq(vehiclesTable.ownerId, req.userId!))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const body = req.body;
  // If marking as cover, unset other covers
  if (body.is_cover) {
    await db.update(vehicleImagesTable).set({ isCover: false }).where(eq(vehicleImagesTable.vehicleId, rawId));
  }

  const [image] = await db.insert(vehicleImagesTable).values({
    vehicleId: rawId,
    url: body.url,
    thumbnailUrl: body.thumbnail_url ?? null,
    isCover: body.is_cover ?? false,
    sortOrder: body.sort_order ?? 0,
  }).returning();

  res.status(201).json({ id: image.id, url: image.url, thumbnail_url: image.thumbnailUrl ?? null, is_cover: image.isCover, sort_order: image.sortOrder });
});

// DELETE /api/vehicles/:id/images/:imageId
router.delete("/vehicles/:id/images/:imageId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const imageId = Array.isArray(req.params.imageId) ? req.params.imageId[0] : req.params.imageId;
  const [existing] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, rawId), eq(vehiclesTable.ownerId, req.userId!))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(vehicleImagesTable).where(and(eq(vehicleImagesTable.id, imageId), eq(vehicleImagesTable.vehicleId, rawId)));
  res.status(204).end();
});

// POST /api/vehicles/:id/report
router.post("/vehicles/:id/report", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;
  await db.insert(vehicleReportsTable).values({
    vehicleId: rawId,
    reporterId: req.userId!,
    reason: body.reason,
    description: body.description ?? null,
    status: "pending",
  });
  res.status(201).json({ message: "Report submitted" });
});

export default router;
