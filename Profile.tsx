import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, ShieldCheck } from "lucide-react";

export default function Profile() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    whatsapp: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || ""
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: formData }, {
      onSuccess: (data) => {
        toast({ title: t('profile.updated_success') });
        queryClient.setQueryData(getGetProfileQueryKey(), data);
      },
      onError: () => {
        toast({ title: t('profile.update_failed'), variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="container max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-64 bg-muted rounded-2xl"></div>
    </div>;
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('profile.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.public_profile')}</CardTitle>
          <CardDescription>
            {t('profile.public_profile_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-muted border flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg flex items-center gap-2">
                  {profile?.email}
                  {profile?.is_dealer && <ShieldCheck className="w-5 h-5 text-accent" />}
                </p>
                <p className="text-sm text-muted-foreground">{profile?.is_dealer ? t('profile.verified_dealer') : t('profile.private_seller')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">{t('profile.display_name')}</Label>
              <Input 
                id="display_name" 
                value={formData.display_name}
                onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('profile.phone_number')}</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('profile.phone_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">{t('profile.whatsapp_number')}</Label>
                <Input 
                  id="whatsapp" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder={t('profile.whatsapp_placeholder')}
                />
              </div>
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t('profile.saving') : t('profile.save_changes')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
