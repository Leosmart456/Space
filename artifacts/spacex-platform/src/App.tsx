import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import VerifyPage from "@/pages/verify";
import OnboardingPage from "@/pages/onboarding";
import SignInPage from "@/pages/sign-in";
import InvestPage from "@/pages/invest";
import InvestVerifyPage from "@/pages/invest-verify";
import InvestSetPasswordPage from "@/pages/invest-set-password";
import AdminPage from "@/pages/admin";
import TransferPage from "@/pages/transfer";
import HistoryPage from "@/pages/history";
import ProfilePage from "@/pages/profile";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { setToken } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return isSignedIn ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/verify">
        {() => <ProtectedRoute component={VerifyPage} />}
      </Route>
      <Route path="/onboarding">
        {() => <ProtectedRoute component={OnboardingPage} />}
      </Route>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/invest" component={InvestPage} />
      <Route path="/invest/verify" component={InvestVerifyPage} />
      <Route path="/invest/set-password" component={InvestSetPasswordPage} />
      <Route path="/transfer">
        {() => <ProtectedRoute component={TransferPage} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={HistoryPage} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/admin" component={AdminPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const DESKTOP_BREAKPOINT = 768;

function MobileOnlyScreen() {
  const [siteUrl, setSiteUrl] = useState("");
  useEffect(() => {
    setSiteUrl(window.location.origin + BASE + "/");
  }, []);
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <img src={`${BASE}/logo.png`} alt="SpaceX" className="h-6 w-auto mx-auto mb-10" />
        <p className="text-white text-2xl font-extrabold tracking-tight mb-3">Mobile only</p>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          The SpaceX Investor Platform is designed for mobile devices. Scan the QR code
          below with your phone to continue, or resize your browser to a mobile width.
        </p>
        {siteUrl && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(siteUrl)}`}
            alt="Scan to open on your phone"
            width={240}
            height={240}
            className="mx-auto rounded-xl border border-white/10"
          />
        )}
      </div>
    </div>
  );
}

function DesktopGate({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= DESKTOP_BREAKPOINT : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // The admin portal remains fully usable on desktop; every other route is
  // mobile-only and shows a "scan to continue on your phone" screen instead.
  if (isDesktop && location !== "/admin") {
    return <MobileOnlyScreen />;
  }
  return <>{children}</>;
}

function DevAutoLogin() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(window.location.search);
    const devToken = params.get("devToken");
    if (devToken) {
      setToken(devToken);
      window.location.href = window.location.pathname.replace(/\/$/, "") + "/dashboard";
    }
  }, [navigate]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <DevAutoLogin />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={BASE}>
            <DesktopGate>
              <Router />
            </DesktopGate>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
