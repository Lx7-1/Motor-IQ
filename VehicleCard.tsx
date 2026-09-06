import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Heart, MapPin, Gauge, Calendar, Zap, ShieldCheck } from "lucide-react";
import { VehicleSummary } from "@workspace/api-client-react/src/generated/api.schemas";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardFooter } from "./card";
import { useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";

interface VehicleCardProps {
  vehicle: VehicleSummary;
  onFavoriteToggle?: () => void;
}

export function VehicleCard({ vehicle, onFavoriteToggle }: VehicleCardProps) {
  const { t } = useTranslation();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (vehicle.is_favorited) {
      removeFav.mutate({ id: vehicle.id }, {
        onSuccess: () => onFavoriteToggle?.()
      });
    } else {
      addFav.mutate({ data: { vehicle_id: vehicle.id } }, {
        onSuccess: () => onFavoriteToggle?.()
      });
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: vehicle.currency,
    maximumFractionDigits: 0
  }).format(vehicle.price);

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer h-full flex flex-col bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {vehicle.cover_image ? (
            <img 
              src={vehicle.cover_image} 
              alt={vehicle.title} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">
              {t('favorites.no_image')}
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {vehicle.is_featured && (
              <Badge className="bg-warning text-warning-foreground border-none font-semibold">
                {t('favorites.featured')}
              </Badge>
            )}
            {vehicle.seller_type === 'dealer' && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur text-foreground border-none flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                {t('favorites.dealer')}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 w-8 h-8"
            onClick={handleFavorite}
          >
            <Heart className={`w-4 h-4 ${vehicle.is_favorited ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
          </Button>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-2">
            <div>
              <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{vehicle.title}</p>
            </div>
          </div>
          
          <div className="font-bold text-xl text-primary mt-1 mb-4">
            {formattedPrice}
            {vehicle.is_negotiable && <span className="text-xs font-normal text-muted-foreground ml-1">{t('favorites.negotiable')}</span>}
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{vehicle.year}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-accent" />
              <span>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : t('favorites.new')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              <span className="truncate">{vehicle.condition}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="truncate">{vehicle.city}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between border-t border-border/40 mt-4">
          <span>{t('favorites.views', { count: vehicle.views_count })}</span>
          <span>{new Date(vehicle.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
