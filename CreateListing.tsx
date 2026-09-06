import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  useListVehicleTypes,
  useListBrands,
  useListBrandModels,
  useListTransmissions,
  useListFuelTypes,
  useListConditions,
  useListColors,
  useListRegions,
  useListRegionCities,
  useCreateVehicle,
  useAddVehicleImage,
  usePublishVehicle
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationPicker({ position, setPosition }: { position: [number, number] | null, setPosition: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function CreateListing() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<any>({
    vehicle_type_id: "",
    brand_id: "",
    model_id: "",
    year: new Date().getFullYear(),
    mileage: "",
    engine_size: "",
    horsepower: "",
    transmission_id: "",
    fuel_type_id: "",
    color_id: "",
    condition_id: "",
    vin: "",
    price: "",
    currency: "USD",
    is_negotiable: false,
    description: "",
    region_id: "",
    city_id: "",
    latitude: null,
    longitude: null,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  // APIs
  const { data: vehicleTypes } = useListVehicleTypes();
  const { data: brands } = useListBrands();
  const { data: models } = useListBrandModels(Number(formData.brand_id), { query: { enabled: !!formData.brand_id, queryKey: ['models', formData.brand_id] } });
  const { data: transmissions } = useListTransmissions();
  const { data: fuelTypes } = useListFuelTypes();
  const { data: conditions } = useListConditions();
  const { data: colors } = useListColors();
  const { data: regions } = useListRegions();
  const { data: cities } = useListRegionCities(Number(formData.region_id), { query: { enabled: !!formData.region_id, queryKey: ['cities', formData.region_id] } });

  const createVehicle = useCreateVehicle();
  const addImage = useAddVehicleImage();
  const publishVehicle = usePublishVehicle();

  const handleNext = () => {
    if (step === 1 && !formData.vehicle_type_id) {
      toast({ title: t('create_listing.please_select_type'), variant: "destructive" });
      return;
    }
    if (step === 2 && (!formData.brand_id || !formData.model_id || !formData.year || !formData.condition_id)) {
      toast({ title: t('create_listing.please_fill_required'), variant: "destructive" });
      return;
    }
    if (step === 3 && (!formData.price)) {
      toast({ title: t('create_listing.please_set_price'), variant: "destructive" });
      return;
    }
    if (step === 4 && (!formData.region_id || !formData.city_id)) {
      toast({ title: t('create_listing.please_select_location'), variant: "destructive" });
      return;
    }
    if (step === 5 && images.length === 0) {
      toast({ title: t('create_listing.please_upload_image'), variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 15) {
        toast({ title: t('create_listing.max_15_images'), variant: "destructive" });
        return;
      }
      setImages([...images, ...newFiles]);
      
      // Create local URLs for preview
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls([...imageUrls, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newUrls = [...imageUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setImageUrls(newUrls);

    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex(coverIndex - 1);
  };

  const handleSubmit = async () => {
    try {
      // 1. Create vehicle (draft)
      const vehiclePayload = {
        title: `${Array.isArray(brands) ? brands.find(b => b.id === Number(formData.brand_id))?.name : ''} ${Array.isArray(models) ? models.find(m => m.id === Number(formData.model_id))?.name : ''}`,
        brand_id: Number(formData.brand_id),
        model_id: Number(formData.model_id),
        vehicle_type_id: Number(formData.vehicle_type_id),
        year: Number(formData.year),
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        engine_size: formData.engine_size ? Number(formData.engine_size) : undefined,
        horsepower: formData.horsepower ? Number(formData.horsepower) : undefined,
        transmission_id: formData.transmission_id ? Number(formData.transmission_id) : undefined,
        fuel_type_id: formData.fuel_type_id ? Number(formData.fuel_type_id) : undefined,
        color_id: formData.color_id ? Number(formData.color_id) : undefined,
        condition_id: Number(formData.condition_id),
        vin: formData.vin || undefined,
        price: Number(formData.price),
        currency: formData.currency as "USD" | "IQD",
        is_negotiable: formData.is_negotiable,
        description: formData.description || undefined,
        region_id: Number(formData.region_id),
        city_id: Number(formData.city_id),
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: "draft" as "draft" | "active"
      };

      const vehicle = await createVehicle.mutateAsync({ data: vehiclePayload });

      // 2. Upload images (Mocking the actual file upload, in real app we'd upload to cloud storage then send URL)
      // For this demo, we'll just send mock URLs
      for (let i = 0; i < images.length; i++) {
        // Mock image URL
        const fakeUrl = `https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800`;
        await addImage.mutateAsync({
          id: vehicle.id,
          data: {
            url: fakeUrl,
            is_cover: i === coverIndex,
            sort_order: i
          }
        });
      }

      // 3. Publish
      await publishVehicle.mutateAsync({ id: vehicle.id });

      toast({ title: t('create_listing.published_success') });
      setLocation(`/vehicles/${vehicle.id}`);
      
    } catch (error) {
      console.error(error);
      toast({ title: t('create_listing.error_occurred'), variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{t('create_listing.title')}</h1>
        <Progress value={(step / 6) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
          <span>{t('create_listing.step_type')}</span>
          <span>{t('create_listing.step_details')}</span>
          <span>{t('create_listing.step_price')}</span>
          <span>{t('create_listing.step_location')}</span>
          <span>{t('create_listing.step_images')}</span>
          <span>{t('create_listing.step_preview')}</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 md:p-8 shadow-sm">
        
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">{t('create_listing.select_vehicle_type')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.isArray(vehicleTypes) && vehicleTypes.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => setFormData({ ...formData, vehicle_type_id: String(type.id) })}
                  className={`border-2 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    formData.vehicle_type_id === String(type.id) 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-4xl mb-3">{type.icon || '🏍️'}</span>
                  <span className="font-semibold">{type.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">{t('create_listing.vehicle_details')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('create_listing.brand')}</Label>
                <Select value={formData.brand_id} onValueChange={v => setFormData({ ...formData, brand_id: v, model_id: "" })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_brand')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(brands) && brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.model')}</Label>
                <Select value={formData.model_id} onValueChange={v => setFormData({ ...formData, model_id: v })} disabled={!formData.brand_id}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_model')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(models) && models.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.year')}</Label>
                <Input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} min={1950} max={new Date().getFullYear() + 1} />
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.condition')}</Label>
                <Select value={formData.condition_id} onValueChange={v => setFormData({ ...formData, condition_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_condition')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(conditions) && conditions.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.mileage')}</Label>
                <Input type="number" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} placeholder={t('create_listing.mileage_placeholder')} />
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.engine_size')}</Label>
                <Input type="number" value={formData.engine_size} onChange={e => setFormData({ ...formData, engine_size: e.target.value })} placeholder={t('create_listing.engine_placeholder')} />
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.transmission')}</Label>
                <Select value={formData.transmission_id} onValueChange={v => setFormData({ ...formData, transmission_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_transmission')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(transmissions) && transmissions.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.fuel_type')}</Label>
                <Select value={formData.fuel_type_id} onValueChange={v => setFormData({ ...formData, fuel_type_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_fuel_type')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(fuelTypes) && fuelTypes.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('create_listing.color')}</Label>
                <Select value={formData.color_id} onValueChange={v => setFormData({ ...formData, color_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_color')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(colors) && colors.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.vin_optional')}</Label>
                <Input value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value })} placeholder={t('create_listing.vin_placeholder')} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">{t('create_listing.price_description')}</h2>
            
            <div className="bg-muted/50 p-6 rounded-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('create_listing.price')}</Label>
                  <div className="flex">
                    <Select value={formData.currency} onValueChange={v => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger className="w-24 rounded-r-none border-r-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="IQD">IQD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      type="number" 
                      className="rounded-l-none" 
                      value={formData.price} 
                      onChange={e => setFormData({ ...formData, price: e.target.value })} 
                      placeholder={t('create_listing.price_placeholder')}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox 
                    id="negotiable" 
                    checked={formData.is_negotiable} 
                    onCheckedChange={(c) => setFormData({ ...formData, is_negotiable: c === true })} 
                  />
                  <Label htmlFor="negotiable" className="cursor-pointer">{t('create_listing.price_negotiable')}</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <Label>{t('create_listing.description')}</Label>
              <Textarea 
                placeholder={t('create_listing.description_placeholder')}
                className="h-40"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t('create_listing.description_hint')}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">{t('create_listing.location_title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label>{t('create_listing.region')}</Label>
                <Select value={formData.region_id} onValueChange={v => setFormData({ ...formData, region_id: v, city_id: "" })}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_region')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(regions) && regions.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('create_listing.city')}</Label>
                <Select value={formData.city_id} onValueChange={v => setFormData({ ...formData, city_id: v })} disabled={!formData.region_id}>
                  <SelectTrigger><SelectValue placeholder={t('create_listing.select_city')} /></SelectTrigger>
                  <SelectContent>
                    {Array.isArray(cities) && cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('create_listing.pin_location')}</Label>
              <div className="h-[300px] rounded-xl overflow-hidden border bg-muted z-0">
                <MapContainer center={[36.1912, 44.0091]} zoom={7} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    position={formData.latitude ? [formData.latitude, formData.longitude] : null} 
                    setPosition={(p) => setFormData({ ...formData, latitude: p[0], longitude: p[1] })} 
                  />
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground">{t('create_listing.pin_hint')}</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">{t('create_listing.upload_images')}</h2>
            <p className="text-muted-foreground mb-6">{t('create_listing.upload_hint')}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Label htmlFor="image-upload" className="border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">{t('create_listing.add_photos')}</span>
                <Input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </Label>

              {imageUrls.map((url, i) => (
                <div key={i} className={`relative rounded-xl h-32 group overflow-hidden border-2 ${coverIndex === i ? 'border-primary' : 'border-border'}`}>
                  <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" className="h-8 px-2 text-xs" onClick={() => setCoverIndex(i)}>
                      {t('create_listing.set_cover')}
                    </Button>
                  </div>
                  
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-destructive text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {coverIndex === i && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold text-center py-0.5">
                      {t('create_listing.cover')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 text-success">
              <CheckCircle2 className="w-8 h-8" />
              <h2 className="text-2xl font-bold text-foreground">{t('create_listing.ready_to_publish')}</h2>
            </div>
            
            <div className="bg-muted p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-4">{t('create_listing.summary')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">{t('create_listing.vehicle')}</span>
                  <span className="font-semibold">{Array.isArray(brands) ? brands.find(b => b.id === Number(formData.brand_id))?.name : ''} {Array.isArray(models) ? models.find(m => m.id === Number(formData.model_id))?.name : ''}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">{t('create_listing.year')}</span>
                  <span className="font-semibold">{formData.year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">{t('create_listing.price')}</span>
                  <span className="font-semibold">{formData.price} {formData.currency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">{t('create_listing.step_location')}</span>
                  <span className="font-semibold">{Array.isArray(cities) ? cities.find(c => c.id === Number(formData.city_id))?.name : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 text-primary rounded-xl border border-primary/20">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">{t('create_listing.final_check')}</p>
                <p>{t('create_listing.final_check_desc')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || createVehicle.isPending}>
            {t('create_listing.back')}
          </Button>
          
          {step < 6 ? (
            <Button onClick={handleNext}>{t('create_listing.next_step')}</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createVehicle.isPending} className="bg-success hover:bg-success/90 text-white">
              {createVehicle.isPending ? t('create_listing.publishing') : t('create_listing.publish_listing')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
