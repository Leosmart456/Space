import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { languageCodeToName, languageNameToCode } from "@/i18n";
import { safeStorage } from "@/lib/safe-storage";

export default function SettingsLanguage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('common');
  
  // Get current language from i18n and convert to display name
  const currentLanguageCode = i18n.language || 'en';
  const selectedLanguage = languageCodeToName[currentLanguageCode] || "English";

  // Mutation to save language preference to database
  const saveLanguageMutation = useMutation({
    mutationFn: async (data: { langCode: string; languageDisplayName: string; previousLang: string }) => {
      return apiRequest('PATCH', '/api/user/language', { language: data.langCode });
    },
    onSuccess: (_, variables) => {
      toast({
        title: t('settings.languageUpdated'),
        description: t('settings.languageDescription', { language: variables.languageDisplayName }),
      });
      
      setTimeout(() => {
        setLocation("/settings");
      }, 500);
    },
    onError: (error, variables) => {
      console.error('Failed to save language preference:', error);
      
      // Rollback language change on failure
      i18n.changeLanguage(variables.previousLang);
      safeStorage.setItem("language", variables.previousLang);
      
      toast({
        title: "Error",
        description: "Failed to save language preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = async (languageDisplayName: string) => {
    // Convert display name to language code
    const langCode = languageNameToCode[languageDisplayName];
    if (langCode) {
      // Save previous language for potential rollback
      const previousLang = i18n.language;
      
      // Change i18n language (this updates UI immediately)
      i18n.changeLanguage(langCode);
      
      // Save to localStorage for fallback
      safeStorage.setItem("language", langCode);
      
      // Save preference to database (will show toast on success/error)
      try {
        await saveLanguageMutation.mutateAsync({ langCode, languageDisplayName, previousLang });
      } catch (error) {
        // Error handling is in mutation's onError
      }
    }
  };

  // Only show languages with proper translations
  const languages = [
    "English",
    "Deutsch",     // German
    "Español",     // Spanish
    "Français",    // French
    "日本語",       // Japanese
    "Português",   // Portuguese
    "Русский"      // Russian
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
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">{t('settings.language')}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        <div className="space-y-2">
          {languages.map((language) => (
            <button
              key={language}
              onClick={() => handleLanguageChange(language)}
              className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-lg bg-card"
              data-testid={`language-${language}`}
            >
              <span className="text-foreground">{language}</span>
              {selectedLanguage === language && <Check className="h-5 w-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
