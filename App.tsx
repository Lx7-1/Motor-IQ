import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import RootLayout from "./components/layout/RootLayout";
import { Toaster } from "@/components/ui/toaster";
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';

import Home from "./pages/Home";
import Search from "./pages/Search";
import VehicleDetail from "./pages/VehicleDetail";
import CreateListing from "./pages/CreateListing";
import Dealers from "./pages/Dealers";
import DealerDetail from "./pages/DealerDetail";
import Profile from "./pages/Profile";
import ProfileVehicles from "./pages/ProfileVehicles";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import AdminRouter from "./pages/Admin";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const HAS_AUTH = !!clerkPubKey;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = HAS_AUTH ? {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(214 83% 17%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 60% 55%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 32% 91%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border/50",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
  },
} : null;

function SignInPage() {
  return (
    <RootLayout>
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background px-4 py-12">
        {HAS_AUTH ? (
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication not configured</h1>
            <p className="text-muted-foreground">Set VITE_CLERK_PUBLISHABLE_KEY in .env to enable sign in.</p>
          </div>
        )}
      </div>
    </RootLayout>
  );
}

function SignUpPage() {
  return (
    <RootLayout>
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background px-4 py-12">
        {HAS_AUTH ? (
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Registration not configured</h1>
            <p className="text-muted-foreground">Set VITE_CLERK_PUBLISHABLE_KEY in .env to enable sign up.</p>
          </div>
        )}
      </div>
    </RootLayout>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: any }) {
  if (!HAS_AUTH) {
    return (
      <RootLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication required</h1>
          <p className="text-muted-foreground">Set VITE_CLERK_PUBLISHABLE_KEY in .env to access this page.</p>
        </div>
      </RootLayout>
    );
  }

  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  
  return <Component />;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  const clerkContent = HAS_AUTH ? (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <SwitchRoutes />
      </QueryClientProvider>
    </ClerkProvider>
  ) : (
    <QueryClientProvider client={queryClient}>
      <SwitchRoutes />
    </QueryClientProvider>
  );

  return clerkContent;
}

function SwitchRoutes() {
  return (
    <>
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        
        <Route path="/">
          <RootLayout><Home /></RootLayout>
        </Route>
        <Route path="/search">
          <RootLayout><Search /></RootLayout>
        </Route>
        <Route path="/vehicles/:id">
          <RootLayout><VehicleDetail /></RootLayout>
        </Route>
        <Route path="/dealers">
          <RootLayout><Dealers /></RootLayout>
        </Route>
        <Route path="/dealers/:id">
          <RootLayout><DealerDetail /></RootLayout>
        </Route>

        <Route path="/create-listing">
          <ProtectedRoute component={CreateListing} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route path="/profile/vehicles">
          <ProtectedRoute component={ProfileVehicles} />
        </Route>
        <Route path="/favorites">
          <ProtectedRoute component={Favorites} />
        </Route>
        <Route path="/messages">
          <ProtectedRoute component={Messages} />
        </Route>

        <Route path="/admin/:rest*?">
          <ProtectedRoute component={AdminRouter} />
        </Route>
        
        <Route>
          <RootLayout>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
              <p className="text-muted-foreground">Page not found.</p>
            </div>
          </RootLayout>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

function HtmlLangDirManager() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.language?.split('-')[0] || 'en';
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' || lng === 'ckb' || lng === 'kmr' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return null;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <WouterRouter base={basePath}>
        <AppRoutes />
        <HtmlLangDirManager />
      </WouterRouter>
    </I18nextProvider>
  );
}

export default App;
