import { Switch, Route, Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetAdminStats, useAdminListVehicles, useAdminListUsers, useAdminListDealers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Car, Users, Store, Tag, DollarSign, Flag, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location] = useLocation();

  const links = [
    { href: "/admin", labelKey: "admin.overview", icon: LayoutDashboard },
    { href: "/admin/vehicles", labelKey: "admin.vehicles", icon: Car },
    { href: "/admin/users", labelKey: "admin.users", icon: Users },
    { href: "/admin/dealers", labelKey: "admin.dealers", icon: Store },
    { href: "/admin/brands", labelKey: "admin.brands", icon: Tag },
    { href: "/admin/exchange-rate", labelKey: "admin.exchange_rate", icon: DollarSign },
    { href: "/admin/reports", labelKey: "admin.reports", icon: Flag },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-lg text-primary flex items-center gap-2">
            <Settings className="w-5 h-5" /> {t('admin.panel')}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />
                  {t(link.labelKey)}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center px-6 md:hidden">
          <span className="font-bold">{t('admin.panel')}</span>
        </header>
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Overview() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard_overview')}</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.total_users')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.total_dealers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_dealers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.active_listings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.active_listings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.pending_approvals')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats?.pending_listings || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Minimal placeholder pages to complete routing
function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t(titleKey)}</h1>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
          <Settings className="w-12 h-12 mb-4 opacity-20" />
          <p>{t('admin.feature_description', { title: t(titleKey) })}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Overview} />
        <Route path="/admin/vehicles"><Placeholder titleKey="admin.vehicles_management" /></Route>
        <Route path="/admin/users"><Placeholder titleKey="admin.users_management" /></Route>
        <Route path="/admin/dealers"><Placeholder titleKey="admin.dealers_management" /></Route>
        <Route path="/admin/brands"><Placeholder titleKey="admin.brands_management" /></Route>
        <Route path="/admin/exchange-rate"><Placeholder titleKey="admin.exchange_rate_management" /></Route>
        <Route path="/admin/reports"><Placeholder titleKey="admin.reports_management" /></Route>
      </Switch>
    </AdminLayout>
  );
}
