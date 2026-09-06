import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetVehicle, useListSimilarVehicles, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, Share2, AlertTriangle, MapPin, Calendar, 
  Gauge, Zap, Hash, Palette, Fuel, Settings, 
  ShieldCheck, Phone, MessageCircle, MessageSquare
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToast } from "@/hooks/use-toast";

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function VehicleDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/vehicles/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  
  const { data: vehicle, isLoading, refetch } = useGetVehicle(id, { query: { enabled: !!id } });
  const { data: similarVehicles } = useListSimilarVehicles(id, { query: { enabled: !!id } });
  
  const [currency, setCurrency] = useState<'USD' | 'IQD'>('USD');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const handleFavorite = () => {
    if (!vehicle) return;
    
    if (vehicle.is_favorited) {
      removeFav.mutate({ id: vehicle.id }, {
        onSuccess: () => refetch()
      });
    } else {
      addFav.mutate({ data: { vehicle_id: vehicle.id } }, {
        onSuccess: () => refetch()
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vehicle?.title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: t('vehicle_detail.link_copied') });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded mb-4"></div>
      <div className="h-[400px] w-full bg-muted rounded-2xl mb-8"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 bg-muted rounded-2xl"></div>
          <div className="h-40 bg-muted rounded-2xl"></div>
        </div>
        <div className="h-80 bg-muted rounded-2xl"></div>
      </div>
    </div>;
  }

  if (!vehicle) {
    return <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t('vehicle_detail.not_found')}</h1>
      <Link href="/search"><Button className="mt-4">{t('vehicle_detail.back_to_search')}</Button></Link>
    </div>;
  }

  const price = currency === 'USD' ? vehicle.price_usd || vehicle.price : vehicle.price_iqd || vehicle.price;
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(price);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-6 gap-2">
        <Link href="/" className="hover:text-primary">{t('vehicle_detail.home')}</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-primary">{t('vehicle_detail.bikes')}</Link>
        <span>/</span>
        <Link href={`/search?brand_id=${vehicle.brand.id}`} className="hover:text-primary">{vehicle.brand.name}</Link>
        <span>/</span>
        <span className="text-foreground">{vehicle.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content (Images + Specs) */}
        <div className="lg:col-span-2 lg:w-2/3 flex flex-col gap-8">
          
          {/* Gallery */}
          <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
            <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {vehicle.images.length > 0 ? (
                  vehicle.images.map((img) => (
                    <div className="flex-[0_0_100%] min-w-0 h-full relative" key={img.id}>
                      <img src={img.url} alt={vehicle.title} className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center bg-muted text-muted-foreground">
                    {t('vehicle_detail.no_images')}
                  </div>
                )}
              </div>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Badge className="bg-accent text-accent-foreground font-semibold px-3 py-1 text-sm border-none">
                  {vehicle.condition.name}
                </Badge>
                {vehicle.is_featured && (
                  <Badge className="bg-warning text-warning-foreground font-semibold px-3 py-1 text-sm border-none">
                    {t('vehicle_detail.featured')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {vehicle.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {vehicle.images.map((img, i) => (
                  <button 
                    key={img.id}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`relative w-20 h-20 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                      i === selectedIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.thumbnail_url || img.url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{vehicle.title}</h1>
                <p className="text-lg text-muted-foreground">{vehicle.brand.name} {vehicle.model.name}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleFavorite}>
                  <Heart className={`w-5 h-5 ${vehicle.is_favorited ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="text-xl font-semibold mb-4">{t('vehicle_detail.overview')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {t('vehicle_detail.year')}</span>
                <span className="font-semibold">{vehicle.year}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Gauge className="w-4 h-4"/> {t('vehicle_detail.mileage')}</span>
                <span className="font-semibold">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} ${t('vehicle_detail.km')}` : `0 ${t('vehicle_detail.km')}`}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Fuel className="w-4 h-4"/> {t('vehicle_detail.fuel')}</span>
                <span className="font-semibold">{vehicle.fuel_type?.name || t('vehicle_detail.na')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Settings className="w-4 h-4"/> {t('vehicle_detail.transmission')}</span>
                <span className="font-semibold">{vehicle.transmission?.name || t('vehicle_detail.na')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Zap className="w-4 h-4"/> {t('vehicle_detail.engine')}</span>
                <span className="font-semibold">{vehicle.engine_size ? `${vehicle.engine_size}${t('vehicle_detail.cc')}` : t('vehicle_detail.na')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Palette className="w-4 h-4"/> {t('vehicle_detail.color')}</span>
                <span className="font-semibold">{vehicle.color?.name || t('vehicle_detail.na')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {t('vehicle_detail.location')}</span>
                <span className="font-semibold">{vehicle.city.name}, {vehicle.region.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Hash className="w-4 h-4"/> {t('vehicle_detail.vin')}</span>
                <span className="font-semibold">{vehicle.vin || t('vehicle_detail.na')}</span>
              </div>
            </div>

            {vehicle.description && (
              <>
                <Separator className="my-6" />
                <h3 className="text-xl font-semibold mb-4">{t('vehicle_detail.description')}</h3>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{vehicle.description}</p>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Sidebar (Pricing + Seller Info + Map) */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          {/* Price Card */}
          <Card className="shadow-lg border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">{t('vehicle_detail.price')}</span>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button 
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${currency === 'USD' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => setCurrency('IQD')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${currency === 'IQD' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    IQD
                  </button>
                </div>
              </div>
              
              <div className="text-4xl font-extrabold text-primary mb-2 tracking-tight">
                {formattedPrice}
              </div>
              
              {vehicle.is_negotiable && (
                <Badge variant="secondary" className="mb-4">{t('vehicle_detail.price_negotiable')}</Badge>
              )}
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('vehicle_detail.seller_info')}</h3>
              
              {vehicle.dealer ? (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
                    {vehicle.dealer.logo_url ? (
                      <img src={vehicle.dealer.logo_url} alt={vehicle.dealer.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold">{vehicle.dealer.business_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {vehicle.dealer.business_name}
                      {vehicle.dealer.is_verified && <ShieldCheck className="w-5 h-5 text-accent" />}
                    </h4>
                    <p className="text-sm text-muted-foreground">{t('vehicle_detail.active_listings', { count: vehicle.dealer.listing_count })}</p>
                    <Link href={`/dealers/${vehicle.dealer.id}`} className="text-sm text-primary hover:underline">{t('vehicle_detail.view_showroom')}</Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
                    {vehicle.seller.avatar_url ? (
                      <img src={vehicle.seller.avatar_url} alt={vehicle.seller.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold">{vehicle.seller.display_name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{vehicle.seller.display_name}</h4>
                    <p className="text-sm text-muted-foreground">{t('vehicle_detail.private_seller')}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(vehicle.dealer?.phone || vehicle.seller.phone) && (
                  <Button className="w-full justify-start gap-2 bg-slate-900 hover:bg-slate-800 text-white" size="lg">
                    <Phone className="w-5 h-5" />
                    {t('vehicle_detail.call')} {vehicle.dealer?.phone || vehicle.seller.phone}
                  </Button>
                )}
                
                {(vehicle.dealer?.whatsapp || vehicle.seller.whatsapp) && (
                  <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg">
                    <MessageCircle className="w-5 h-5" />
                    {t('vehicle_detail.whatsapp')}
                  </Button>
                )}
                
                <Button className="w-full justify-start gap-2" variant="outline" size="lg">
                  <MessageSquare className="w-5 h-5" />
                  {t('vehicle_detail.send_message')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location Map */}
          <Card className="shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                {t('vehicle_detail.location')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{vehicle.city.name}, {vehicle.region.name}</p>
            </div>
            <div className="h-64 bg-muted relative z-0">
              {vehicle.latitude && vehicle.longitude ? (
                <MapContainer center={[vehicle.latitude, vehicle.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={[vehicle.latitude, vehicle.longitude]}>
                    <Popup>
                      {vehicle.city.name}
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {t('vehicle_detail.exact_location_not_provided')}
                </div>
              )}
            </div>
          </Card>

          <Button variant="ghost" className="text-muted-foreground hover:text-destructive w-full">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('vehicle_detail.report_listing')}
          </Button>

        </div>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles && similarVehicles.length > 0 && (
        <div className="mt-16 pt-10 border-t">
          <h2 className="text-2xl font-bold tracking-tight mb-8">{t('vehicle_detail.similar_vehicles')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarVehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
