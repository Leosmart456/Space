import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, LogOut, Cookie, Database, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/wallet-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { languageCodeToName } from "@/i18n";

const CONSENT_KEY = "lumirra-cookie-consent";

interface ConsentData {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  timestamp: number;
}

function loadConsent(): ConsentData | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveConsent(data: ConsentData) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
  } catch {}
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearWallet, isAuthenticated, isLoading } = useWallet();
  const { t, i18n } = useTranslation('common');
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [siteDataOpen, setSiteDataOpen] = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);

  // Cookie consent state
  const [consentFunctional, setConsentFunctional] = useState(() => loadConsent()?.functional ?? true);
  const [consentAnalytics, setConsentAnalytics] = useState(() => loadConsent()?.analytics ?? false);

  // Load from localStorage
  const [selectedCurrency, setSelectedCurrency] = useState(() =>
    localStorage.getItem("fiatCurrency") || "USD"
  );
  
  // Get current language from i18n and convert to display name
  const currentLanguageCode = i18n.language || 'en';
  const selectedLanguage = languageCodeToName[currentLanguageCode] || "English";

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearWallet();
      toast({
        title: t('settings.loggedOut'),
        description: t('settings.loggedOutDescription'),
      });
      setLocation("/");
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    const preserve = ["fiatCurrency", "transactionCost", "theme", "i18nextLng"];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserve.includes(key)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(key => localStorage.removeItem(key));
    toast({
      title: t('settings.cacheCleared'),
      description: t('settings.cacheDescription'),
    });
  };

  const handleSaveCookiePreferences = () => {
    saveConsent({ necessary: true, functional: consentFunctional, analytics: consentAnalytics, timestamp: Date.now() });
    setCookiesOpen(false);
    toast({ title: "Cookie preferences saved" });
  };

  const handleClearAllSiteData = () => {
    queryClient.clear();
    const keysToKeep = ["app-version"];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) toRemove.push(key);
    }
    toRemove.forEach(key => localStorage.removeItem(key));
    try { sessionStorage.clear(); } catch {}
    if ("caches" in window) {
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
    }
    setClearDataConfirm(false);
    setSiteDataOpen(false);
    toast({
      title: "All site data cleared",
      description: "You have been logged out. Reload the app to start fresh.",
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  const getSiteDataSummary = () => {
    try {
      const keys = Object.keys(localStorage).length;
      const sizeKb = Object.keys(localStorage)
        .reduce((acc, k) => acc + (localStorage.getItem(k)?.length ?? 0), 0) / 1024;
      return `${keys} items · ~${sizeKb.toFixed(1)} KB`;
    } catch {
      return "Unavailable";
    }
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">{t('settings.title')}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        {/* First Group - Security & Cache */}
        <div className="bg-card rounded-xl mb-4">
          <button
            onClick={() => setLocation("/settings/security")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-t-xl border-b border-border"
            data-testid="button-security"
          >
            <span className="text-foreground">{t('settings.security')}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-b-xl"
            data-testid="button-clear-cache"
          >
            <span className="text-foreground">{t('settings.clearCache')}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Second Group - Preferences */}
        <div className="bg-card rounded-xl mb-4">
          <button
            onClick={() => setLocation("/settings/currency")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-t-xl border-b border-border"
            data-testid="button-fiat-currency"
          >
            <span className="text-foreground">{t('settings.fiatCurrency')}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$ {selectedCurrency}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
          
          <button
            onClick={() => setLocation("/settings/language")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-b-xl"
            data-testid="button-language"
          >
            <span className="text-foreground">{t('settings.language')}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedLanguage}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* Privacy & Cookies Group */}
        <div className="bg-card rounded-xl mb-4">
          <button
            onClick={() => setCookiesOpen(true)}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-t-xl border-b border-border"
            data-testid="button-cookie-preferences"
          >
            <div className="flex items-center gap-3">
              <Cookie className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Privacy & Cookies</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => setSiteDataOpen(true)}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 border-b border-border"
            data-testid="button-site-data"
          >
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Site Data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{getSiteDataSummary()}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>

          <button
            onClick={() => setLocation("/privacy-policy")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 border-b border-border"
            data-testid="button-privacy-policy"
          >
            <span className="text-foreground">Privacy Policy</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => setLocation("/cookie-policy")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-b-xl"
            data-testid="button-cookie-policy"
          >
            <span className="text-foreground">Cookie Policy</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Third Group - Help & Info */}
        <div className="bg-card rounded-xl mb-4">
          <button
            onClick={() => setLocation("/faq")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-t-xl border-b border-border"
            data-testid="button-help-center"
          >
            <span className="text-foreground">{t('settings.helpCenter')}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => setLocation("/contact")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 border-b border-border"
            data-testid="button-support"
          >
            <span className="text-foreground">{t('settings.support')}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => setLocation("/settings/about")}
            className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-b-xl"
            data-testid="button-about"
          >
            <span className="text-foreground">{t('settings.about')}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm text-muted-foreground">V4.9.2</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('settings.logOut')}
        </Button>
      </div>

      {/* Privacy & Cookies Dialog */}
      <Dialog open={cookiesOpen} onOpenChange={setCookiesOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-cookie-preferences">
          <DialogHeader>
            <DialogTitle>Privacy & Cookies</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-4">
              <Switch checked disabled className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Necessary</p>
                <p className="text-sm text-muted-foreground">Required for authentication, security, and wallet operation. Cannot be disabled.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Switch
                checked={consentFunctional}
                onCheckedChange={setConsentFunctional}
                className="mt-0.5 shrink-0"
                data-testid="toggle-functional-cookies"
              />
              <div>
                <p className="font-medium text-foreground">Functional</p>
                <p className="text-sm text-muted-foreground">Remembers theme, language, and currency preferences between visits.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Switch
                checked={consentAnalytics}
                onCheckedChange={setConsentAnalytics}
                className="mt-0.5 shrink-0"
                data-testid="toggle-analytics-cookies"
              />
              <div>
                <p className="font-medium text-foreground">Analytics</p>
                <p className="text-sm text-muted-foreground">Anonymous usage data to help us improve Lumirra. No personal data shared.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveCookiePreferences} className="flex-1" data-testid="button-save-cookie-preferences">
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConsentFunctional(true);
                setConsentAnalytics(true);
                saveConsent({ necessary: true, functional: true, analytics: true, timestamp: Date.now() });
                setCookiesOpen(false);
                toast({ title: "All cookies accepted" });
              }}
              className="flex-1"
              data-testid="button-accept-all-cookies"
            >
              Accept All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Site Data Dialog */}
      <Dialog open={siteDataOpen} onOpenChange={setSiteDataOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-site-data">
          <DialogHeader>
            <DialogTitle>Site Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stored items</span>
                <span className="font-medium">{Object.keys(localStorage).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approx. size</span>
                <span className="font-medium">
                  {(Object.keys(localStorage).reduce((acc, k) => acc + (localStorage.getItem(k)?.length ?? 0), 0) / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cache storage</span>
                <span className="font-medium text-muted-foreground">Browser-managed</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed">
              Clearing app cache removes price data and query caches but preserves your wallet and settings.
              Clearing all site data will log you out — your funds stay safe on-chain.
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleClearCache();
                  setSiteDataOpen(false);
                }}
                data-testid="button-clear-cache-site-data"
              >
                Clear App Cache
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setClearDataConfirm(true)}
                data-testid="button-clear-all-data"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Site Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm clear all data */}
      <AlertDialog open={clearDataConfirm} onOpenChange={setClearDataConfirm}>
        <AlertDialogContent data-testid="dialog-confirm-clear-data">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Site Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all locally stored data including your wallet session. You will be logged out immediately.
              Your funds are safe — they remain on the blockchain. You will need your seed phrase to restore access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllSiteData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-clear-data"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
