import { useState } from "react";
import { Link } from "wouter";
import { Trans, useTranslation } from "react-i18next";
import { 
  useGetDashboardStats, 
  useListFeaturedVehicles, 
  useListLatestVehicles,
  useGetPopularBrands,
  useGetPopularCities 
} from "@workspace/api-client-react";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ChevronRight, CheckCircle2, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  
  const { data: stats } = useGetDashboardStats();
  const { data: featured } = useListFeaturedVehicles({ limit: 4 });
  const { data: latest } = useListLatestVehicles({ limit: 8 });
  const { data: brands } = useGetPopularBrands({ limit: 6 });
  const { data: cities } = useGetPopularCities({ limit: 4 });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex items-center justify-center overflow-hidden bg-primary text-primary-foreground min-h-[80vh]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary z-10"></div>
          {/* Abstract pattern / noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="container relative z-20 px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto">
            <Trans i18nKey="home.hero_title" components={[<span className="text-accent" />]} />
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto font-medium">
            {t('home.hero_subtitle')}
          </p>

          <div className="w-full max-w-3xl bg-background rounded-2xl p-2 md:p-3 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center bg-muted/50 rounded-xl px-4 py-2 md:py-0">
              <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
              <Input 
                placeholder={t('home.search_placeholder')}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground text-base h-12 px-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href={searchQuery ? `/search?keyword=${encodeURIComponent(searchQuery)}` : '/search'} className="w-full md:w-auto shrink-0">
              <Button size="lg" className="w-full h-12 rounded-xl text-base px-8 bg-accent text-accent-foreground hover:bg-accent/90">
                {t('home.search_bikes')}
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-primary-foreground/70 text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>{t('home.vehicles_count', { count: stats?.total_listings || "10,000" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>{t('home.dealers_count', { count: stats?.total_dealers || "500" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span>{t('home.secure')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      {Array.isArray(featured) && featured.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{t('home.premium_picks')}</h2>
                <p className="text-muted-foreground text-lg">{t('home.premium_subtitle')}</p>
              </div>
              <Link href="/search?featured_only=true" className="hidden md:flex items-center text-primary font-medium hover:text-primary/80 transition-colors">
                {t('home.view_all')} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
            <Link href="/search?featured_only=true" className="flex md:hidden items-center justify-center mt-8 text-primary font-medium">
              {t('home.view_all_premium')} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </section>
      )}

      {/* Popular Brands */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">{t('home.shop_by_brand')}</h2>
            <p className="text-muted-foreground text-lg">{t('home.brand_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.isArray(brands) && brands.map(brand => (
              <Link key={brand.id} href={`/search?brand_id=${brand.id}`}>
                <div className="bg-background border border-border/60 hover:border-accent hover:shadow-md transition-all duration-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group cursor-pointer h-full">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="font-bold text-xl">{brand.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">{brand.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('home.listings_count', { count: brand.listing_count })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{t('home.fresh_arrivals')}</h2>
              <p className="text-muted-foreground text-lg">{t('home.arrivals_subtitle')}</p>
            </div>
            <Link href="/search" className="hidden md:flex items-center text-primary font-medium hover:text-primary/80 transition-colors">
              {t('home.browse_all')} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.isArray(latest) && latest.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <Link href="/search">
              <Button size="lg" className="px-8 rounded-full">{t('home.explore_all')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.trusted_dealers')}</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                {t('home.trusted_dealers_desc')}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.fast_selling')}</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                {t('home.fast_selling_desc')}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.smart_search')}</h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                {t('home.smart_search_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold tracking-tight">{t('home.popular_locations')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(cities) && cities.map((city, i) => (
              <Link key={city.id} href={`/search?city_id=${city.id}`}>
                <div className="relative overflow-hidden rounded-2xl aspect-[2/1] group cursor-pointer">
                  <div className="absolute inset-0 bg-slate-800">
                     {/* Placeholder gradient for cities */}
                     <div className={`absolute inset-0 opacity-80 mix-blend-multiply bg-gradient-to-br ${
                       i % 4 === 0 ? 'from-blue-600 to-indigo-900' :
                       i % 4 === 1 ? 'from-emerald-500 to-teal-900' :
                       i % 4 === 2 ? 'from-orange-500 to-red-900' :
                       'from-purple-600 to-violet-900'
                     }`}></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-accent" />
                        {city.name}
                      </h3>
                      <p className="text-sm text-white/80">{city.name_ar}</p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur">
                      {city.listing_count}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
