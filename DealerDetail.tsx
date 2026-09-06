import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetDealer, useGetDealerVehicles } from "@workspace/api-client-react";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Phone, MessageCircle, Globe, Facebook, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DealerDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/dealers/:id");
  const id = params?.id || "";

  const { data: dealer, isLoading: isLoadingDealer } = useGetDealer(id, { query: { enabled: !!id } });
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useGetDealerVehicles(id, { query: { enabled: !!id } });

  if (isLoadingDealer) {
    return <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-64 bg-muted rounded-2xl mb-8"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-muted rounded-2xl"></div>)}
      </div>
    </div>;
  }

  if (!dealer) {
    return <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">{t('dealer_detail.not_found')}</h1>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dealer Banner/Header */}
      <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm mb-12 relative">
        <div className="h-48 md:h-64 bg-slate-900 relative">
          {dealer.banner_url ? (
            <img src={dealer.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary to-slate-900 opacity-80"></div>
          )}
        </div>
        
        <div className="px-6 md:px-10 pb-8 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-background bg-muted overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            {dealer.logo_url ? (
              <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover bg-white" />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground">{dealer.business_name.charAt(0)}</span>
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2 mb-2">
              {dealer.business_name}
              {dealer.is_verified && <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />}
            </h1>
            <div className="flex items-center text-muted-foreground text-sm sm:text-base gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{dealer.city}, {dealer.region}</span>
            </div>
          </div>

          <div className="flex gap-3 sm:pb-2 w-full sm:w-auto">
            {dealer.phone && (
              <Button className="flex-1 sm:flex-none gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                <Phone className="w-4 h-4" /> <span className="hidden sm:inline">{t('dealer_detail.call')}</span>
              </Button>
            )}
            {dealer.whatsapp && (
              <Button className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">{t('dealer_detail.whatsapp')}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 md:px-10 py-6 border-t border-border/50 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">{t('dealer_detail.about_us')}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {dealer.description || t('dealer_detail.no_description')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">{t('dealer_detail.links_social')}</h3>
              <div className="flex flex-col gap-2">
                {dealer.website && (
                  <a href={dealer.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Globe className="w-4 h-4" /> {new URL(dealer.website).hostname.replace('www.', '')}
                  </a>
                )}
                {dealer.facebook && (
                  <a href={dealer.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Facebook className="w-4 h-4" /> {t('dealer_detail.facebook_page')}
                  </a>
                )}
                {dealer.instagram && (
                  <a href={dealer.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                    <Instagram className="w-4 h-4" /> {t('dealer_detail.instagram_profile')}
                  </a>
                )}
                {!dealer.website && !dealer.facebook && !dealer.instagram && (
                  <span className="text-sm text-muted-foreground">{t('dealer_detail.no_links')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('dealer_detail.inventory')}</h2>
        <Badge variant="outline" className="text-sm font-normal">
          {t('dealer_detail.listings_count', { count: vehiclesData?.total || 0 })}
        </Badge>
      </div>

      {isLoadingVehicles ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>)}
        </div>
      ) : vehiclesData?.data && vehiclesData.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehiclesData.data.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-2xl bg-muted/20">
          <p className="text-muted-foreground">{t('dealer_detail.no_active_listings')}</p>
        </div>
      )}
    </div>
  );
}
