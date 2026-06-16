import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { formatBalance } from "@/lib/format-balance";
import { useTranslation } from "react-i18next";

export default function SendList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not authenticated
  if (!isAuthenticated || !walletId) {
    setLocation("/");
    return null;
  }

  // Use all-tokens endpoint to include hidden tokens in send list
  const { data: allTokensData } = useQuery({
    queryKey: [`/api/wallet/${walletId}/all-tokens`],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  // Fetch real-time prices
  const { data: pricesData } = useQuery({
    queryKey: ["/api/prices"],
    enabled: !!walletId,
    refetchInterval: 60000,
  });

  const chains = (chainsData as any) || [];
  const allTokens = (allTokensData as any)?.tokens || [];

  // Merge tokens with real-time prices and sort by market cap
  const tokensWithPrices = allTokens.map((token: any) => {
    const coingeckoId = token.coingeckoId || token.symbol.toLowerCase();
    const priceInfo = (pricesData as any)?.[coingeckoId];
    
    return {
      ...token,
      usd_price: priceInfo?.usd || 0,
      usd_24h_change: priceInfo?.usd_24h_change || 0,
      usd_market_cap: priceInfo?.usd_market_cap || 0,
    };
  }).sort((a: any, b: any) => {
    return (b.usd_market_cap || 0) - (a.usd_market_cap || 0);
  });

  // Filter tokens based on search query
  const filteredTokens = tokensWithPrices.filter((token: any) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                data-testid="button-back"
                className="hover-elevate"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-semibold">{t('sendList.title')}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('sendList.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-muted"
              data-testid="input-search-token"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {filteredTokens.map((token: any) => {
            const chain = chains.find((c: any) => c.id === token.chainId);
            const balance = parseFloat(token.balance || "0");
            const fiatValue = balance * token.usd_price;
            const priceChange = token.usd_24h_change || 0;
            const isPositive = priceChange >= 0;

            return (
              <div
                key={token._id || token.id}
                className="flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer bg-card"
                onClick={() => setLocation(`/send/${token._id || token.id}`)}
                data-testid={`token-item-${token.symbol.toLowerCase()}`}
              >
                <div className="flex items-center gap-3">
                  {/* Token Icon */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-muted">
                      {token.icon ? (
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-primary font-bold text-sm">{token.symbol[0]}</span>
                      )}
                    </div>
                    {chain?.icon && token.symbol?.toUpperCase() !== chain.symbol?.toUpperCase() && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                        <img
                          src={chain.icon}
                          alt={chain.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Token Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{token.symbol}</span>
                      {chain && (
                        <span className="text-xs text-muted-foreground">
                          ({chain.networkStandard || chain.name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        ${token.usd_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                      <span className={isPositive ? 'text-success' : 'text-destructive'}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <div className="font-semibold" data-testid={`balance-${token.symbol.toLowerCase()}`}>
                    {formatBalance(balance)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${fiatValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('sendList.noTokens')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
