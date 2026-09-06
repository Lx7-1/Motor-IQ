import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  useListVehicles, 
  useListBrands, 
  useListBrandModels,
  useListVehicleTypes,
  useListConditions,
  useListCities,
  useListRegions
} from "@workspace/api-client-react";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function Search() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Parse initial filters from URL
  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    brand_id: searchParams.get("brand_id") || "all",
    model_id: searchParams.get("model_id") || "all",
    vehicle_type_id: searchParams.get("vehicle_type_id") || "all",
    condition_id: searchParams.get("condition_id") || "all",
    city_id: searchParams.get("city_id") || "all",
    region_id: searchParams.get("region_id") || "all",
    sort: searchParams.get("sort") || "newest",
    is_negotiable: searchParams.get("is_negotiable") === "true",
    featured_only: searchParams.get("featured_only") === "true",
    page: 1,
    limit: 12
  });

  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [yearRange, setYearRange] = useState([1990, new Date().getFullYear()]);

  // Fetch reference data
  const { data: brands } = useListBrands();
  const { data: models } = useListBrandModels(Number(filters.brand_id), { 
    query: { enabled: filters.brand_id !== "all", queryKey: ['models', filters.brand_id] } 
  });
  const { data: vehicleTypes } = useListVehicleTypes();
  const { data: conditions } = useListConditions();
  const { data: cities } = useListCities();
  const { data: regions } = useListRegions();

  // Prepare query params
  const queryParams: any = {
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
  };
  
  if (filters.keyword) queryParams.keyword = filters.keyword;
  if (filters.brand_id !== "all") queryParams.brand_id = Number(filters.brand_id);
  if (filters.model_id !== "all") queryParams.model_id = Number(filters.model_id);
  if (filters.vehicle_type_id !== "all") queryParams.vehicle_type_id = Number(filters.vehicle_type_id);
  if (filters.condition_id !== "all") queryParams.condition_id = Number(filters.condition_id);
  if (filters.city_id !== "all") queryParams.city_id = Number(filters.city_id);
  if (filters.region_id !== "all") queryParams.region_id = Number(filters.region_id);
  if (filters.is_negotiable) queryParams.is_negotiable = true;
  if (filters.featured_only) queryParams.featured_only = true;
  if (priceRange[1] < 100000) queryParams.price_max = priceRange[1];
  if (priceRange[0] > 0) queryParams.price_min = priceRange[0];
  if (yearRange[1] < new Date().getFullYear()) queryParams.year_max = yearRange[1];
  if (yearRange[0] > 1990) queryParams.year_min = yearRange[0];

  const { data: searchResults, isLoading } = useListVehicles(queryParams);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value, page: 1 };
      if (key === 'brand_id') next.model_id = "all";
      if (key === 'region_id') next.city_id = "all";
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      brand_id: "all",
      model_id: "all",
      vehicle_type_id: "all",
      condition_id: "all",
      city_id: "all",
      region_id: "all",
      sort: "newest",
      is_negotiable: false,
      featured_only: false,
      page: 1,
      limit: 12
    });
    setPriceRange([0, 100000]);
    setYearRange([1990, new Date().getFullYear()]);
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t('search.filters')}</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground">
          {t('search.clear_filters')}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('search.keyword')}</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('search.search_placeholder')}
              className="pl-9"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('search.type')}</Label>
          <Select value={filters.vehicle_type_id} onValueChange={(v) => handleFilterChange('vehicle_type_id', v)}>
            <SelectTrigger><SelectValue placeholder={t('search.any_type')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.any_type')}</SelectItem>
              {Array.isArray(vehicleTypes) && vehicleTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('search.brand')}</Label>
          <Select value={filters.brand_id} onValueChange={(v) => handleFilterChange('brand_id', v)}>
            <SelectTrigger><SelectValue placeholder={t('search.any_brand')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.any_brand')}</SelectItem>
              {Array.isArray(brands) && brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filters.brand_id !== "all" && models && (
          <div className="space-y-2">
            <Label>{t('search.model')}</Label>
            <Select value={filters.model_id} onValueChange={(v) => handleFilterChange('model_id', v)}>
              <SelectTrigger><SelectValue placeholder={t('search.any_model')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('search.any_model')}</SelectItem>
                {models.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t('search.region')}</Label>
          <Select value={filters.region_id} onValueChange={(v) => handleFilterChange('region_id', v)}>
            <SelectTrigger><SelectValue placeholder={t('search.any_region')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.any_region')}</SelectItem>
              {Array.isArray(regions) && regions.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('search.city')}</Label>
          <Select value={filters.city_id} onValueChange={(v) => handleFilterChange('city_id', v)}>
            <SelectTrigger><SelectValue placeholder={t('search.any_city')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.any_city')}</SelectItem>
              {Array.isArray(cities) && cities.filter(c => filters.region_id === "all" || String(c.region_id) === filters.region_id).map(c => 
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('search.condition')}</Label>
          <Select value={filters.condition_id} onValueChange={(v) => handleFilterChange('condition_id', v)}>
            <SelectTrigger><SelectValue placeholder={t('search.any_condition')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('search.any_condition')}</SelectItem>
              {Array.isArray(conditions) && conditions.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <Label>{t('search.price_range')}</Label>
            <span className="text-xs text-muted-foreground">${priceRange[0]} - ${priceRange[1] >= 100000 ? '100K+' : priceRange[1]}</span>
          </div>
          <Slider 
            value={priceRange} 
            max={100000} 
            step={1000} 
            onValueChange={setPriceRange}
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <Label>{t('search.year_range')}</Label>
            <span className="text-xs text-muted-foreground">{yearRange[0]} - {yearRange[1]}</span>
          </div>
          <Slider 
            value={yearRange} 
            min={1990}
            max={new Date().getFullYear()} 
            step={1} 
            onValueChange={setYearRange}
          />
        </div>

        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="negotiable" className="cursor-pointer">{t('search.negotiable')}</Label>
            <Switch 
              id="negotiable" 
              checked={filters.is_negotiable} 
              onCheckedChange={(c) => handleFilterChange('is_negotiable', c)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="featured" className="cursor-pointer text-warning">{t('search.featured_only')}</Label>
            <Switch 
              id="featured" 
              checked={filters.featured_only} 
              onCheckedChange={(c) => handleFilterChange('featured_only', c)} 
            />
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:block w-72 shrink-0 border-r pr-8">
          <FilterSidebar />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('search.title')}</h1>
              <p className="text-muted-foreground">
                {t('search.showing_results', { count: searchResults?.total || 0 })}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    {t('search.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>{t('search.filters')}</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar />
                </SheetContent>
              </Sheet>

              <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('search.sort_by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('search.newest')}</SelectItem>
                  <SelectItem value="price_asc">{t('search.price_low')}</SelectItem>
                  <SelectItem value="price_desc">{t('search.price_high')}</SelectItem>
                  <SelectItem value="most_viewed">{t('favorites.views', { count: '' }).trim()}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : searchResults?.data && searchResults.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {searchResults.data.map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
              
              {searchResults.total_pages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  <Button 
                    variant="outline" 
                    disabled={filters.page === 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                  >
                    {t('common.show_less')}
                  </Button>
                  <div className="flex items-center px-4">
                    {t('search.showing_results', { count: '' })} {filters.page} {t('common.show_more')} {searchResults.total_pages}
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={filters.page === searchResults.total_pages}
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                  >
                    {t('common.show_more')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-muted/20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('search.no_results')}</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {t('search.no_results')}
              </p>
              <Button onClick={clearFilters}>{t('search.clear_filters')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
