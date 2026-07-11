import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { useWallet } from "@/contexts/wallet-context";
import { useTranslation } from "react-i18next";

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  published_at: string;
  source: {
    title: string;
    domain: string;
  };
  currencies?: Array<{
    code: string;
    title: string;
  }>;
  contentSnippet?: string;
  content?: string;
}

export default function Market() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, walletId } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Fetch wallet tokens to filter news
  const { data: portfolio } = useQuery({
    queryKey: ["/api/wallet", walletId, "portfolio"],
    enabled: !!walletId,
  });

  // Fetch crypto prices for token badges
  const { data: prices } = useQuery<any>({
    queryKey: ["/api/prices"],
  });

  // Fetch user data for profile picture
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated && !!walletId,
  });

  // Fetch news from backend
  const { data: newsData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/news"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (!isAuthenticated || !walletId) {
    return null;
  }

  const news = (newsData as any)?.results || [];

  // Filter news based on search query
  const filteredNews = news.filter((article: NewsArticle) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) {
      return t('market.minsAgo', { mins: diffInMins });
    } else if (diffInHours < 24) {
      return t('market.hoursAgo', { hours: diffInHours });
    } else {
      return t('market.daysAgo', { days: diffInDays });
    }
  };

  const getTokenPriceChange = (currencyCode: string) => {
    if (!prices) return null;
    
    // Map currency codes to CoinGecko IDs
    const symbolToCoinGeckoId: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'TRX': 'tron',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
    };
    
    const coingeckoId = symbolToCoinGeckoId[currencyCode] || currencyCode.toLowerCase();
    const priceInfo = prices[coingeckoId];
    if (!priceInfo) return null;
    
    return {
      change: priceInfo.usd_24h_change || 0,
      symbol: currencyCode,
    };
  };

  return (
    <div className="min-h-screen bg-background glass-bg pb-28">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-display font-bold">{t('market.title')}</h1>
            <ThemeToggle />
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('market.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-muted"
              data-testid="input-search-news"
            />
          </div>
        </div>
      </header>

      {/* News Feed */}
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('market.failedToLoad')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('market.unableToFetch')}
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry-news">
              {t('market.retry')}
            </Button>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article: NewsArticle) => (
            <Card
              key={article.id}
              className="p-4 cursor-pointer hover-elevate transition-all"
              onClick={() => setLocation(`/news/${article.id}`)}
              data-testid={`card-news-${article.id}`}
            >
              {/* Source and Time */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {article.source.title}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(article.published_at)}
                </span>
              </div>
              
              {/* Title */}
              <h3 className="font-semibold text-base mb-2 line-clamp-2">
                {article.title}
              </h3>
              
              {/* Content Snippet */}
              {article.contentSnippet && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {article.contentSnippet}
                </p>
              )}
              
              {/* Token Badges */}
              {article.currencies && article.currencies.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {article.currencies.slice(0, 3).map((currency) => {
                    const priceChange = getTokenPriceChange(currency.code);
                    if (!priceChange) return null;
                    
                    const isPositive = priceChange.change >= 0;
                    
                    // Get token logo URL from CoinGecko with proper filenames
                    const symbolToLogoUrl: Record<string, string> = {
                      'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
                      'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
                      'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
                      'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
                      'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
                      'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
                      'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
                      'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
                      'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
                      'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
                      'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
                      'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
                      'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
                    };
                    const logoUrl = symbolToLogoUrl[currency.code] || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png';
                    
                    return (
                      <Badge
                        key={currency.code}
                        variant="secondary"
                        className={`text-xs gap-1 ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        }`}
                        data-testid={`badge-token-${currency.code}`}
                      >
                        <img 
                          src={logoUrl} 
                          alt={currency.code}
                          className="w-4 h-4 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {currency.code} {isPositive ? "+" : ""}
                        {priceChange.change.toFixed(2)}%
                      </Badge>
                    );
                  })}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? t('market.noNewsFound') : t('market.noNewsAvailable')}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
