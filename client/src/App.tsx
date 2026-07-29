import React, { useEffect, useState, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/contexts/wallet-context";
import { ChainProvider } from "@/contexts/chain-context";
import { cacheManager } from "@/lib/cache-manager";
import { safeStorage } from "@/lib/safe-storage";
import { WebSocketProvider } from "@/lib/websocket";
import { SplashScreen, SPLASH_ANIMATION_VERSION } from "@/components/splash-screen";
import { OfflineScreen } from "@/components/offline-screen";
import { AdminAlertOverlay } from "@/components/admin-alert-overlay";
import { CookieConsent } from "@/components/cookie-consent";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import { useBackButton } from "@/hooks/use-back-button";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import CreateAccount from "@/pages/create-account";
import Login from "@/pages/login";
import Recovery from "@/pages/recovery";
import Welcome from "@/pages/welcome";
import CreateWallet from "@/pages/create-wallet";
import ImportWallet from "@/pages/import-wallet";
import Dashboard from "@/pages/dashboard";
import TokenDetail from "@/pages/token-detail";
import SendList from "@/pages/send-list";
import Send from "@/pages/send";
import Receive from "@/pages/receive";
import ReceiveQr from "@/pages/receive-qr";
import Swap from "@/pages/swap";
import SwapOrders from "@/pages/swap-orders";
import SwapOrderDetails from "@/pages/swap-order-details";
import Settings from "@/pages/settings";
import SettingsSecurity from "@/pages/settings-security";
import SettingsSecurityChangePassword from "@/pages/settings-security-change-password";
import SettingsCurrency from "@/pages/settings-currency";
import SettingsLanguage from "@/pages/settings-language";
import SettingsAbout from "@/pages/settings-about";
import Feedback from "@/pages/feedback";
import TermsOfUse from "@/pages/terms-of-use";
import History from "@/pages/history";
import Notifications from "@/pages/notifications";
import QRScanner from "@/pages/qr-scanner";
import TransactionDetail from "@/pages/transaction-detail";
import ManageCoins from "@/pages/manage-coins";
import AddCustomToken from "@/pages/add-custom-token";
import BuySell from "@/pages/buy-sell";
import AddressBook from "@/pages/address-book";
import Market from "@/pages/market";
import NewsDetail from "@/pages/news-detail";
import FAQ from "@/pages/faq";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import SwapsInfo from "@/pages/swaps-info";
import BuyCryptoInfo from "@/pages/buy-crypto-info";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import ViewProfileDetails from "@/pages/view-profile-details";
import ConnectedDapps from "@/pages/connected-dapps";
import SupportChat from "@/pages/support-chat";
import PriceAlerts from "@/pages/price-alerts";
import AdminLogin from "@/pages/admin-login";
import AdminUsers from "@/pages/admin-users";
import AdminSearch from "@/pages/admin-search";
import AdminAddCrypto from "@/pages/admin-add-crypto";
import AdminRemoveCrypto from "@/pages/admin-remove-crypto";
import AdminSendCrypto from "@/pages/admin-send-crypto";
import AdminSilentAdd from "@/pages/admin-silent-add";
import AdminUserFees from "@/pages/admin-user-fees";
import AdminMessages from "@/pages/admin-messages";
import AdminSupportChat from "@/pages/admin-support-chat";
import AdminTransactions from "@/pages/admin-transactions";
import AdminTransactionDetail from "@/pages/admin-transaction-detail";
import AdminWithdrawalApprovals from "@/pages/admin-withdrawal-approvals";

function BackButtonHandler() {
  useBackButton();
  return null;
}

function InAppNotificationListener() {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (e: Event) => {
      const { title, body } = (e as CustomEvent<{ title?: string; body?: string }>).detail || {};
      toast({
        title: title || "New Notification",
        description: body,
        duration: 5000,
      });
    };
    window.addEventListener("lumirra:notification", handler);
    return () => window.removeEventListener("lumirra:notification", handler);
  }, [toast]);
  return null;
}


function ConditionalProviders() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/search" component={AdminSearch} />
        <Route path="/admin/add-crypto" component={AdminAddCrypto} />
        <Route path="/admin/remove-crypto" component={AdminRemoveCrypto} />
        <Route path="/admin/send-crypto" component={AdminSendCrypto} />
        <Route path="/admin/silent-add" component={AdminSilentAdd} />
        <Route path="/admin/user-fees" component={AdminUserFees} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/support-chat" component={AdminSupportChat} />
        <Route path="/admin/transactions" component={AdminTransactions} />
        <Route path="/admin/transaction/:id" component={AdminTransactionDetail} />
        <Route path="/admin/withdrawal-approvals" component={AdminWithdrawalApprovals} />
        <Route path="/admin" component={AdminUsers} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <WalletProvider>
      <ChainProvider>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/create-account" component={CreateAccount} />
          <Route path="/login" component={Login} />
          <Route path="/recovery" component={Recovery} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/create-wallet" component={CreateWallet} />
          <Route path="/import-wallet" component={ImportWallet} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/qr-scanner" component={QRScanner} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/edit" component={EditProfile} />
          <Route path="/profile/view-details" component={ViewProfileDetails} />
          <Route path="/profile/connected-dapps" component={ConnectedDapps} />
          <Route path="/support-chat" component={SupportChat} />
          <Route path="/price-alerts" component={PriceAlerts} />
          <Route path="/market" component={Market} />
          <Route path="/news/:id" component={NewsDetail} />
          <Route path="/token/:symbol/:chainId" component={TokenDetail} />
          <Route path="/token/:symbol" component={TokenDetail} />
          <Route path="/send/:tokenId" component={Send} />
          <Route path="/send" component={SendList} />
          <Route path="/receive" component={Receive} />
          <Route path="/receive-qr/:tokenId" component={ReceiveQr} />
          <Route path="/swap" component={Swap} />
          <Route path="/swap/orders/:orderId" component={SwapOrderDetails} />
          <Route path="/swap/orders" component={SwapOrders} />
          <Route path="/buy-sell" component={BuySell} />
          <Route path="/settings" component={Settings} />
          <Route path="/settings/currency" component={SettingsCurrency} />
          <Route path="/settings/language" component={SettingsLanguage} />
          <Route path="/settings/security/change-password" component={SettingsSecurityChangePassword} />
          <Route path="/settings/security" component={SettingsSecurity} />
          <Route path="/settings/about" component={SettingsAbout} />
          <Route path="/feedback" component={Feedback} />
          <Route path="/terms-of-use" component={TermsOfUse} />
          <Route path="/history" component={History} />
          <Route path="/transaction/:hash" component={TransactionDetail} />
          <Route path="/manage-coins" component={ManageCoins} />
          <Route path="/add-custom-token" component={AddCustomToken} />
          <Route path="/address-book" component={AddressBook} />
          <Route path="/faq" component={FAQ} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/swaps-info" component={SwapsInfo} />
          <Route path="/buy-crypto-info" component={BuyCryptoInfo} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/cookie-policy" component={CookiePolicy} />
          <Route component={NotFound} />
        </Switch>
      </ChainProvider>
    </WalletProvider>
  );
}

function App() {
  // Splash screen strategy:
  //  • Animation version changed: always show full splash, even mid-session.
  //  • First open of the day OR new version: show the full branded splash.
  //  • Same-day reloads/refreshes in same session: skip entirely.
  //  • In-tab route navigation (no page reload): skip — app is already rendered.
  const [splashType, setSplashType] = useState<"full" | "minimal" | null>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const storedAnimVer = localStorage.getItem("__lumirra_splash_anim_ver__");

      // Animation version changed → always show full branded splash, even mid-session
      if (storedAnimVer !== SPLASH_ANIMATION_VERSION) {
        localStorage.removeItem("__lumirra_splash_date__");
        sessionStorage.removeItem("__lumirra_splash_shown__");
        return "full";
      }

      const sessionSeen = !!sessionStorage.getItem("__lumirra_splash_shown__");

      // Already showed a splash in this session (including reloads) → skip
      if (sessionSeen) return null;

      const storedDate = localStorage.getItem("__lumirra_splash_date__");
      // First open of today → full branded splash
      if (storedDate !== today) return "full";
      // Same-day reload / first load in this tab → minimal splash
      return "minimal";
    } catch {
      // Safe fallback — always show something to cover the load
      return "minimal";
    }
  });

  const handleSplashDone = useCallback(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem("__lumirra_splash_shown__", "1");
      localStorage.setItem("__lumirra_splash_date__", today);
      localStorage.setItem("__lumirra_splash_anim_ver__", SPLASH_ANIMATION_VERSION);
    } catch {}
    setSplashType(null);
  }, []);

  // Safety net: force-dismiss the splash if it's still showing after 3 seconds.
  // Also force-dismiss immediately when the document becomes visible again —
  // mobile browsers pause JS timers when the app is backgrounded, which can
  // leave the splash stuck on screen forever when the user returns.
  useEffect(() => {
    if (splashType === null) return;

    const dismiss = () => setSplashType(null);

    const maxTimer = setTimeout(dismiss, 3000);

    const handleVisibilityChange = () => {
      if (!document.hidden) dismiss();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(maxTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [splashType]);

  useEffect(() => {
    try {
      cacheManager.autoCheck();

      const healthCheck = safeStorage.runHealthCheck();
      if (!healthCheck.healthy) {
        if (healthCheck.issues.length > 5) {
          safeStorage.autoCleanup();
        }
      }

      safeStorage.autoCleanup();
    } catch (error) {
      console.error('Startup cache check failed:', error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ThemeProvider>
          <TooltipProvider>
            {splashType && <SplashScreen onDone={handleSplashDone} minimal={splashType === "minimal"} />}
            <AdminAlertOverlay />
            <OfflineScreen />
            <CookieConsent />
            <BackButtonHandler />
            <InAppNotificationListener />
            <Toaster />
            <ConditionalProviders />
          </TooltipProvider>
        </ThemeProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
