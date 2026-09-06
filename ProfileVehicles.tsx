import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetMyVehicles, useDeleteVehicle, usePublishVehicle } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Globe, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProfileVehicles() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const { data: vehicles, isLoading, refetch } = useGetMyVehicles();
  const deleteVehicle = useDeleteVehicle();
  const publishVehicle = usePublishVehicle();
  const { toast } = useToast();
  
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const filteredVehicles = Array.isArray(vehicles) ? vehicles.filter(v => filter === "all" || v.status === filter) : [];

  const handleDelete = () => {
    if (!vehicleToDelete) return;
    deleteVehicle.mutate({ id: vehicleToDelete }, {
      onSuccess: () => {
        toast({ title: "Listing deleted" });
        refetch();
        setVehicleToDelete(null);
      },
      onError: () => {
        toast({ title: "Failed to delete listing", variant: "destructive" });
        setVehicleToDelete(null);
      }
    });
  };

  const handlePublish = (id: string) => {
    publishVehicle.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Listing published successfully!" });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to publish listing", variant: "destructive" });
      }
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('profile_vehicles.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage your active, draft, and sold vehicles.</p>
        </div>
        <Link href="/create-listing">
          <Button>Create New Listing</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>{t('profile_vehicles.all')}</Button>
        <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>{t('profile_vehicles.active')}</Button>
        <Button variant={filter === "draft" ? "default" : "outline"} onClick={() => setFilter("draft")}>{t('profile_vehicles.draft')}</Button>
        <Button variant={filter === "sold" ? "default" : "outline"} onClick={() => setFilter("sold")}>{t('profile_vehicles.sold')}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl"></div>)}
        </div>
      ) : filteredVehicles && filteredVehicles.length > 0 ? (
        <div className="space-y-4">
          {filteredVehicles.map(vehicle => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 sm:h-auto bg-muted shrink-0 relative">
                  {vehicle.cover_image ? (
                    <img src={vehicle.cover_image} alt={vehicle.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">{t('favorites.no_image')}</div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant={vehicle.status === 'active' ? 'default' : vehicle.status === 'draft' ? 'secondary' : 'outline'} className="capitalize">
                      {vehicle.status}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl">{vehicle.title}</h3>
                      <span className="font-bold text-lg text-primary">{formatPrice(vehicle.price, vehicle.currency)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.city}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4"/> {t('favorites.views', { count: vehicle.views_count })}</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4"/> {vehicle.favorites_count} saves</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end mt-auto">
                    {vehicle.status === 'draft' && (
                      <Button variant="default" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handlePublish(vehicle.id)}>
                        <Globe className="w-4 h-4 mr-2" /> {t('profile_vehicles.publish')}
                      </Button>
                    )}
                    <Link href={`/vehicles/${vehicle.id}`}>
                      <Button variant="outline"><Eye className="w-4 h-4 mr-2" /> View</Button>
                    </Link>
                    {/* Placeholder for Edit, route doesn't exist yet but let's assume it might */}
                    <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> {t('profile_vehicles.edit')}</Button>
                    <Button variant="destructive" onClick={() => setVehicleToDelete(vehicle.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> {t('profile_vehicles.delete')}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-2xl bg-muted/20">
          <h3 className="text-xl font-bold mb-2">{t('profile_vehicles.no_vehicles')}</h3>
          <p className="text-muted-foreground mb-6">You don't have any vehicles matching this status.</p>
          <Link href="/create-listing"><Button>{t('profile_vehicles.start_selling')}</Button></Link>
        </div>
      )}

      <AlertDialog open={!!vehicleToDelete} onOpenChange={(o) => !o && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
