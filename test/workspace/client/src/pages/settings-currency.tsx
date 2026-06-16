import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";

export default function SettingsCurrency() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  
  const [selectedCurrency, setSelectedCurrency] = useState(() => 
    safeStorage.getItem("fiatCurrency") || "USD"
  );
  const [currencySearch, setCurrencySearch] = useState("");

  // Mutation to save fiat currency preference to database
  const saveCurrencyMutation = useMutation({
    mutationFn: async (data: { currency: string; previousCurrency: string }) => {
      return apiRequest('PATCH', '/api/user/fiat-currency', { fiatCurrency: data.currency });
    },
    onSuccess: (_, variables) => {
      toast({
        title: t('settings.currencyUpdated'),
        description: t('settings.currencyDescription', { currency: variables.currency }),
      });
      
      setTimeout(() => {
        setLocation("/settings");
      }, 500);
    },
    onError: (error, variables) => {
      console.error('Failed to save currency preference:', error);
      
      // Rollback currency change on failure
      setSelectedCurrency(variables.previousCurrency);
      safeStorage.setItem("fiatCurrency", variables.previousCurrency);
      
      toast({
        title: "Error",
        description: "Failed to save currency preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCurrencyChange = async (currency: string) => {
    // Save previous currency for potential rollback
    const previousCurrency = selectedCurrency;
    
    // Update UI immediately
    setSelectedCurrency(currency);
    safeStorage.setItem("fiatCurrency", currency);
    
    // Save preference to database (will show toast on success/error)
    try {
      await saveCurrencyMutation.mutateAsync({ currency, previousCurrency });
    } catch (error) {
      // Error handling is in mutation's onError
    }
  };

  const currencies = [
    { code: "USD", symbol: "$", color: "bg-orange-500" },
    { code: "AED", symbol: "د.إ", color: "bg-emerald-500" },
    { code: "ALL", symbol: "L", color: "bg-red-500" },
    { code: "AMD", symbol: "֏", color: "bg-orange-500" },
    { code: "ANG", symbol: "ƒ", color: "bg-blue-600" },
    { code: "ARS", symbol: "AR$", color: "bg-blue-400" },
    { code: "AUD", symbol: "$", color: "bg-blue-600" },
    { code: "AZN", symbol: "₼", color: "bg-red-500" },
    { code: "BAM", symbol: "KM", color: "bg-blue-600" },
    { code: "BBD", symbol: "Bds$", color: "bg-blue-600" },
    { code: "EUR", symbol: "€", color: "bg-blue-600" },
    { code: "GBP", symbol: "£", color: "bg-blue-600" },
    { code: "JPY", symbol: "¥", color: "bg-red-500" },
    { code: "CNY", symbol: "¥", color: "bg-red-500" },
    { code: "INR", symbol: "₹", color: "bg-orange-500" },
    { code: "KRW", symbol: "₩", color: "bg-blue-600" },
    { code: "RUB", symbol: "₽", color: "bg-blue-600" },
    { code: "BRL", symbol: "R$", color: "bg-emerald-500" },
    { code: "CAD", symbol: "C$", color: "bg-red-500" },
    { code: "CHF", symbol: "Fr", color: "bg-red-500" },
    { code: "MXN", symbol: "Mex$", color: "bg-emerald-500" },
    { code: "SGD", symbol: "S$", color: "bg-red-500" },
    { code: "NZD", symbol: "NZ$", color: "bg-blue-600" },
    { code: "ZAR", symbol: "R", color: "bg-emerald-500" },
    { code: "THB", symbol: "฿", color: "bg-blue-600" },
    { code: "TRY", symbol: "₺", color: "bg-red-500" },
    { code: "SAR", symbol: "﷼", color: "bg-emerald-500" },
  ];

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(currencySearch.toLowerCase())
  );

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
            <h1 className="text-lg font-semibold flex-1 text-center mr-10">{t('settings.fiatCurrency')}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        <Input
          placeholder={t('common.search')}
          value={currencySearch}
          onChange={(e) => setCurrencySearch(e.target.value)}
          className="mb-4"
          data-testid="input-currency-search"
        />
        
        <div className="space-y-2">
          {filteredCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 rounded-lg bg-card"
              data-testid={`currency-${currency.code}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${currency.color} rounded-full flex items-center justify-center text-white font-semibold`}>
                  {currency.symbol}
                </div>
                <span className="text-foreground">{currency.code}</span>
              </div>
              {selectedCurrency === currency.code && <Check className="h-5 w-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
