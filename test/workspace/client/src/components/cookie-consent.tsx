import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie, Settings2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

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

export function CookieConsent() {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(() => !loadConsent());
  const [manageOpen, setManageOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  const acceptAll = () => {
    saveConsent({ necessary: true, functional: true, analytics: true, timestamp: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  const acceptNecessary = () => {
    saveConsent({ necessary: true, functional: false, analytics: false, timestamp: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  const savePreferences = () => {
    saveConsent({ necessary: true, functional, analytics, timestamp: Date.now() });
    setVisible(false);
    setManageOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Cookie banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[99998] p-4 md:p-6"
        data-testid="cookie-banner"
      >
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-lg p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              <Cookie className="h-6 w-6 text-[#1677FF]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground mb-1">We use cookies</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to keep the app secure and personalise your experience.
                Read our{" "}
                <button
                  onClick={() => navigate("/cookie-policy")}
                  className="text-[#1677FF] underline-offset-2 hover:underline"
                  data-testid="link-cookie-policy"
                >
                  Cookie Policy
                </button>{" "}
                and{" "}
                <button
                  onClick={() => navigate("/privacy-policy")}
                  className="text-[#1677FF] underline-offset-2 hover:underline"
                  data-testid="link-privacy-policy"
                >
                  Privacy Policy
                </button>.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
                  data-testid="button-accept-all-cookies"
                >
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={acceptNecessary}
                  data-testid="button-accept-necessary"
                >
                  Necessary Only
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setManageOpen(true)}
                  data-testid="button-manage-cookies"
                >
                  <Settings2 className="h-4 w-4 mr-1.5" />
                  Manage
                </Button>
              </div>
            </div>

            <button
              onClick={acceptNecessary}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
              data-testid="button-dismiss-cookie-banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Manage preferences dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-cookie-preferences">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Necessary */}
            <div className="flex items-start gap-4">
              <Switch checked disabled className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Necessary</p>
                <p className="text-sm text-muted-foreground">
                  Essential for the app to work — authentication, security tokens, and session management. Cannot be disabled.
                </p>
              </div>
            </div>

            {/* Functional */}
            <div className="flex items-start gap-4">
              <Switch
                checked={functional}
                onCheckedChange={setFunctional}
                className="mt-0.5 shrink-0"
                data-testid="toggle-functional-cookies"
              />
              <div>
                <p className="font-medium text-foreground">Functional</p>
                <p className="text-sm text-muted-foreground">
                  Remembers your preferences — theme, language, currency, and wallet settings.
                </p>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-start gap-4">
              <Switch
                checked={analytics}
                onCheckedChange={setAnalytics}
                className="mt-0.5 shrink-0"
                data-testid="toggle-analytics-cookies"
              />
              <div>
                <p className="font-medium text-foreground">Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Helps us understand how people use Lumirra so we can improve the experience. No personal data is shared with third parties.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={savePreferences} className="flex-1" data-testid="button-save-cookie-preferences">
              Save Preferences
            </Button>
            <Button onClick={acceptAll} variant="outline" className="flex-1" data-testid="button-accept-all-from-manage">
              Accept All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useCookieConsent() {
  const consent = loadConsent();
  return {
    hasConsented: consent !== null,
    functional: consent?.functional ?? false,
    analytics: consent?.analytics ?? false,
    resetConsent: () => {
      try { localStorage.removeItem(CONSENT_KEY); } catch {}
    },
  };
}
