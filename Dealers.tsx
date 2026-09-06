import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useListDealers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dealers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: dealers, isLoading } = useListDealers();

  const filteredDealers = Array.isArray(dealers) ? dealers.filter(d => 
    d.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t('dealers.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('dealers.description')}
          </p>
        </div>
        
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('dealers.search_placeholder')} 
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredDealers && filteredDealers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDealers.map(dealer => (
            <Link key={dealer.id} href={`/dealers/${dealer.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-border/60 overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border group-hover:border-primary/50 transition-colors">
                      {dealer.logo_url ? (
                        <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">{dealer.business_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight mb-1 flex items-center gap-1.5 truncate">
                        {dealer.business_name}
                        {dealer.is_verified && <ShieldCheck className="w-4 h-4 text-accent shrink-0" />}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span className="truncate">{dealer.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-md">
                          {dealer.listing_count || 0} {t('dealers.listings')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border">
          <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('dealers.no_results')}</h3>
        </div>
      )}
    </div>
  );
}
