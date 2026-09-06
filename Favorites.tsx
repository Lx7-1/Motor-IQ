import { useTranslation } from "react-i18next";
import { useListFavorites } from "@workspace/api-client-react";
import { VehicleCard } from "@/components/ui/VehicleCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Favorites() {
  const { t } = useTranslation();
  const { data: favorites, isLoading, refetch } = useListFavorites();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('favorites.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('favorites.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>)}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onFavoriteToggle={() => refetch()} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border rounded-3xl bg-muted/20 flex flex-col items-center">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('favorites.empty_title')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t('favorites.empty_desc')}
          </p>
          <Link href="/search">
            <Button>{t('favorites.browse_vehicles')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
