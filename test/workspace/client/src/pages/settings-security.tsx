import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SettingsSecurity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [autoSigningOpen, setAutoSigningOpen] = useState(false);
  const [autoLockOpen, setAutoLockOpen] = useState(false);
  
  // Load from localStorage
  const [autoSigning, setAutoSigning] = useState(() => 
    localStorage.getItem("autoSigning") || "Off"
  );
  const [autoLock, setAutoLock] = useState(() => 
    localStorage.getItem("autoLock") || "30minute"
  );

  const handleAutoSigningChange = (status: string) => {
    setAutoSigning(status);
    localStorage.setItem("autoSigning", status);
    setAutoSigningOpen(false);
    const statusText = status === "On" ? t('common.on') : t('common.off');
    toast({
      description: t('security.autoSigningUpdated', { status: statusText }),
    });
  };

  const handleAutoLockChange = (time: string) => {
    setAutoLock(time);
    localStorage.setItem("autoLock", time);
    setAutoLockOpen(false);
    toast({
      description: t('security.autoLockUpdated', { time }),
    });
  };

  const autoLockOptions = [
    "1minute",
    "5minute",
    "15minute",
    "30minute",
    "1hour",
    "Never"
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
              data-testid="button-back"
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">{t('settings.security')}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        {/* Auto Signing */}
        <button
          onClick={() => setAutoSigningOpen(true)}
          className="bg-card rounded-xl mb-4 p-4 w-full hover-elevate active-elevate-2"
          data-testid="button-auto-signing"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground">{t('security.autoSigning')}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {autoSigning === "On" ? t('common.on') : t('common.off')}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            {t('security.autoSigningDescription')}
          </p>
        </button>

        {/* Auto Lock */}
        <button
          onClick={() => setAutoLockOpen(true)}
          className="bg-card rounded-xl mb-4 p-4 w-full hover-elevate active-elevate-2"
          data-testid="button-auto-lock"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground">{t('security.autoLock')}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{autoLock}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            {t('security.autoLockDescription')}
          </p>
        </button>

        {/* Change Password */}
        <Link href="/settings/security/change-password">
          <button
            className="bg-card rounded-xl mb-4 w-full flex items-center justify-between p-4 hover-elevate active-elevate-2"
            data-testid="button-change-password"
          >
            <span className="text-foreground">{t('security.changePassword')}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
      </div>

      {/* Auto Signing Dialog */}
      <Dialog open={autoSigningOpen} onOpenChange={setAutoSigningOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-auto-signing">
          <DialogHeader>
            <DialogTitle>{t('security.autoSigning')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {t('security.autoSigningDescription')}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleAutoSigningChange("On")}
              className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-lg"
              data-testid="option-auto-signing-on"
            >
              <span className="text-foreground">{t('common.on')}</span>
              {autoSigning === "On" && <Check className="h-5 w-5 text-primary" />}
            </button>
            
            <button
              onClick={() => handleAutoSigningChange("Off")}
              className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-lg"
              data-testid="option-auto-signing-off"
            >
              <span className="text-foreground">{t('common.off')}</span>
              {autoSigning === "Off" && <Check className="h-5 w-5 text-primary" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Lock Dialog */}
      <Dialog open={autoLockOpen} onOpenChange={setAutoLockOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-auto-lock">
          <DialogHeader>
            <DialogTitle>{t('security.autoLock')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {t('security.autoLockDescription')}
          </p>
          <div className="overflow-y-auto flex-1 space-y-2">
            {autoLockOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleAutoLockChange(option)}
                className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-lg"
                data-testid={`option-auto-lock-${option}`}
              >
                <span className="text-foreground">{option}</span>
                {autoLock === option && <Check className="h-5 w-5 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


