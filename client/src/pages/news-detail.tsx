import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWallet } from "@/contexts/wallet-context";
import { useTranslation } from "react-i18next";
import DOMPurify from "isomorphic-dompurify";

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

export default function NewsDetail() {
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/news/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useWallet();
  const newsId = params?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Fetch specific article by ID from dedicated endpoint
  const { data: article, isLoading, error } = useQuery<NewsArticle>({
    queryKey: [`/api/news/${newsId}`],
    enabled: !!newsId && isAuthenticated,
  });

  // Fetch crypto prices for token badges
  const { data: prices } = useQuery<any>({
    queryKey: ["/api/prices"],
    enabled: !!newsId && isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
                <h1 className="text-lg font-display font-semibold">{t('newsDetail.title')}</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-3 sm:px-4 py-12 max-w-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('newsDetail.failedToLoad')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('newsDetail.unableToFetch')}
          </p>
          <Button onClick={() => window.history.back()} data-testid="button-back-error">
            {t('newsDetail.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
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
                <h1 className="text-lg font-display font-semibold">{t('newsDetail.title')}</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-3 sm:px-4 py-12 max-w-2xl text-center">
          <p className="text-muted-foreground">{t('newsDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  // Sanitize HTML content using DOMPurify to prevent XSS attacks
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false,
    });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
              <h1 className="text-lg font-display font-semibold">{t('newsDetail.title')}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-2xl">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">
          {article.title}
        </h1>

        {/* Source and Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{article.source.title}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(article.published_at)}
          </span>
        </div>

        {/* Token Badges */}
        {article.currencies && article.currencies.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {article.currencies.map((currency: { code: string; title: string }) => {
              const priceChange = getTokenPriceChange(currency.code);
              if (!priceChange) return null;
              
              const isPositive = priceChange.change >= 0;
              
              return (
                <Badge
                  key={currency.code}
                  variant="secondary"
                  className={`text-xs ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  }`}
                  data-testid={`badge-token-${currency.code}`}
                >
                  {currency.code} {isPositive ? "+" : ""}
                  {priceChange.change.toFixed(2)}%
                </Badge>
              );
            })}
          </div>
        )}

        {/* Article Content */}
        {article.content || article.contentSnippet ? (
          <div className="prose dark:prose-invert max-w-none mb-6">
            <div 
              className="text-base leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHTML(article.content || article.contentSnippet || '')
              }}
              data-testid="article-content"
            />
          </div>
        ) : (
          <div className="bg-muted/50 border border-border rounded-lg p-6 mb-6">
            <p className="text-base text-muted-foreground text-center">
              {t('newsDetail.previewNotAvailable')}
            </p>
          </div>
        )}

        {/* Read Full Article Button */}
        <Button
          variant="default"
          className="w-full sm:w-auto gap-2"
          onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
          data-testid="button-read-article"
        >
          <ExternalLink className="h-4 w-4" />
          {t('newsDetail.readFullArticle', { source: article.source.title })}
        </Button>
      </div>
    </div>
  );
}
