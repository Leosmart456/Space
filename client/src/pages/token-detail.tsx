import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat2,
  ShoppingCart,
  Landmark,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { TransactionRow } from "@/components/transaction-row";
import { getTokenBySymbol } from "@shared/ethereum-tokens";
import { TradingViewChart } from "@/components/tradingview-chart";
import { useTheme } from "@/components/theme-provider";
import { getTokenInfo } from "@/lib/token-info";
import { formatBalance } from "@/lib/format-balance";
import { formatCrypto, formatUSD } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const TIME_PERIODS = ["1H", "1D", "1W", "1M", "1Y", "All"] as const;
type TimePeriod = typeof TIME_PERIODS[number];

export default function TokenDetail() {
  const { symbol, chainId } = useParams<{ symbol: string; chainId?: string }>();
  const [, setLocation] = useLocation();
  const {  walletId, isAuthenticated, isLoading } = useWallet();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1D");
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const { data: portfolioData } = useQuery({
    queryKey: ["/api/wallet", walletId, "portfolio"],
    enabled: !!walletId,
  });

  const { data: allTokensData } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/wallet", walletId, "transactions"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const portfolioTokens = (portfolioData as any)?.tokens || [];
  const allTokens = (allTokensData as any)?.tokens || [];
  
  // Try to find in portfolio first (visible tokens), then fall back to all tokens (includes hidden)
  let token = chainId 
    ? portfolioTokens.find(
        (t: any) => t.symbol.toUpperCase() === symbol?.toUpperCase() && t.chainId === chainId
      )
    : portfolioTokens.find(
        (t: any) => t.symbol.toUpperCase() === symbol?.toUpperCase()
      );
  
  // If not found in portfolio, check all tokens (including hidden ones)
  if (!token) {
    token = chainId 
      ? allTokens.find(
          (t: any) => t.symbol.toUpperCase() === symbol?.toUpperCase() && t.chainId === chainId
        )
      : allTokens.find(
          (t: any) => t.symbol.toUpperCase() === symbol?.toUpperCase()
        );
  }

  const chains = (chainsData as any) || [];
  const currentChain = chains.find((c: any) => c.id === token?.chainId);

  // Get CoinGecko ID from token metadata or shared catalog
  const tokenMetadata = getTokenBySymbol(symbol || "");
  const coingeckoId = token?.coingeckoId || tokenMetadata?.coingeckoId || symbol?.toLowerCase();

  // Fetch real-time price data for all coins
  const { data: pricesData, isLoading: isPriceLoading } = useQuery({
    queryKey: ["/api/prices"],
    enabled: !!coingeckoId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('tokenDetail.notFound')}</p>
      </div>
    );
  }

  // Extract price info for this specific token
  const priceInfo = (pricesData as any)?.[coingeckoId];
  const balance = parseFloat(token.balance || "0");
  const portfolioFiatValue = parseFloat(token.fiatValue || "0");
  
  // Determine current price with smart fallback logic
  let currentPrice: number;
  if (priceInfo?.usd !== undefined) {
    // Use live CoinGecko price when available
    currentPrice = priceInfo.usd;
  } else if (balance > 0 && portfolioFiatValue > 0) {
    // Calculate from portfolio when we have both balance and value
    currentPrice = portfolioFiatValue / balance;
  } else {
    // For zero-balance or missing data, default to 0 (will show loading indicator instead)
    currentPrice = 0;
  }
  
  const priceChange24h = priceInfo?.usd_24h_change || 0;
  const isPositive = priceChange24h >= 0;
  const priceChangeFormatted = `${isPositive ? '+' : ''}${priceChange24h.toFixed(2)}%`;
  const priceChangeValue = currentPrice * (priceChange24h / 100);
  
  // Calculate real-time fiat value
  const realTimeFiatValue = priceInfo?.usd 
    ? (balance * priceInfo.usd) 
    : portfolioFiatValue;

  // Filter transactions for this token (case-insensitive match)
  // If chainId is provided, also filter by chainId to show only transactions on the correct chain
  const allTransactions = transactions as any[];
  const tokenTransactions = chainId
    ? allTransactions.filter(
        (tx: any) => tx.tokenSymbol?.toUpperCase() === symbol?.toUpperCase() && tx.chainId === chainId
      )
    : allTransactions.filter(
        (tx: any) => tx.tokenSymbol?.toUpperCase() === symbol?.toUpperCase()
      );

  return (
    <div className="min-h-screen bg-background glass-bg pb-36">
      {/* Header */}
      <header className="glass-header fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
              className="hover-elevate"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="font-display font-semibold text-base sm:text-lg" data-testid="text-token-name">
                {token.symbol}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{currentChain?.name || "Ethereum"}</p>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 pt-16 pb-3 sm:pb-4 max-w-2xl">
        {/* Price Section */}
        <div className="text-center mb-4">
          {token.icon && (
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
              <img 
                src={token.icon} 
                alt={token.name} 
                className="w-full h-full rounded-full"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {currentChain?.icon && token.symbol?.toUpperCase() !== currentChain.symbol?.toUpperCase() && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-background border-2 border-background flex items-center justify-center overflow-hidden">
                  <img
                    src={currentChain.icon}
                    alt={currentChain.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
          {!priceInfo && (isPriceLoading || currentPrice === 0) ? (
            <div className="space-y-2">
              <div className="h-10 w-40 bg-muted/50 rounded-lg mx-auto animate-pulse"></div>
              <div className="h-5 w-28 bg-muted/50 rounded-lg mx-auto animate-pulse"></div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1.5" data-testid="text-token-price">
                ${currentPrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: currentPrice < 1 ? 6 : 2
                })}
              </h2>
              {priceInfo && (
                <div className={`flex items-center justify-center gap-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium" data-testid="text-price-change">
                    ${Math.abs(priceChangeValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ({priceChangeFormatted})
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chart */}
        <div className="mb-4 p-3 sm:p-4 rounded-2xl" style={{ background: 'transparent' }}>
            {/* Time Period Toggles */}
            <div className="flex items-center justify-between mb-3 gap-1">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="flex-1 text-xs px-2"
                  data-testid={`button-period-${period}`}
                >
                  {t(`tokenDetail.timePeriod${period}`)}
                </Button>
              ))}
            </div>

            {/* TradingView Real-time Chart */}
            <div className="relative rounded-lg overflow-hidden">
              <TradingViewChart
                symbol={coingeckoId || 'ethereum'}
                interval={
                  selectedPeriod === '1H' ? '5' :
                  selectedPeriod === '1D' ? '15' :
                  selectedPeriod === '1W' ? '60' :
                  selectedPeriod === '1M' ? '240' :
                  selectedPeriod === '1Y' ? 'D' :
                  'D'
                }
                theme={theme === 'dark' ? 'dark' : 'light'}
                height={300}
              />
            </div>
        </div>

        {/* Tabs - Trust Wallet Style */}
        <Tabs defaultValue="holdings" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="holdings" data-testid="tab-holdings">{t('tokenDetail.holdings')}</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">{t('tokenDetail.history')}</TabsTrigger>
            <TabsTrigger value="about" data-testid="tab-about">{t('tokenDetail.about')}</TabsTrigger>
          </TabsList>
          
          {/* Holdings Tab */}
          <TabsContent value="holdings" className="mt-0">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold" data-testid="text-my-balance">{t('tokenDetail.myBalance')}</h3>
              
              {/* Card border around the balance section */}
              <div
                className="rounded-2xl border px-4 py-4"
                style={{
                  borderColor: "rgba(22,119,255,0.18)",
                  background: "rgba(240,247,255,0.60)",
                  boxShadow: "0 2px 12px rgba(22,119,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {token.icon && (
                      <div className="relative w-12 h-12">
                        <img 
                          src={token.icon} 
                          alt={token.name} 
                          className="w-full h-full rounded-full"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-base" data-testid="text-token-name-balance">{token.name}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-token-balance">
                        {formatBalance(balance)} {token.symbol}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-base" data-testid="text-fiat-value">
                      {formatUSD(realTimeFiatValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">-</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('tokenDetail.recentTransactions')}</h3>
              
              {tokenTransactions.length > 0 ? (
                <div className="divide-y">
                  {tokenTransactions.slice(0, 10).map((tx: any) => (
                    <TransactionRow
                      key={tx.hash}
                      type={tx.type}
                      status={tx.status}
                      amount={tx.value}
                      tokenSymbol={tx.tokenSymbol}
                      timestamp={new Date(tx.timestamp).toLocaleString()}
                      hash={tx.hash}
                      onClick={() => setLocation(`/transaction/${tx.hash}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 mb-4 opacity-50">
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect x="20" y="40" width="60" height="40" rx="4" className="fill-muted-foreground/20" />
                      <rect x="30" y="50" width="40" height="4" rx="2" className="fill-muted-foreground/40" />
                      <rect x="30" y="60" width="30" height="4" rx="2" className="fill-muted-foreground/40" />
                    </svg>
                  </div>
                  <p className="text-foreground font-medium mb-2">{t('tokenDetail.noTransactions')}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('tokenDetail.cannotFindTransaction')}
                  </p>
                  <Button 
                    variant="default" 
                    size="lg"
                    className="bg-[#00D9A3] hover:bg-[#00D9A3]/90 text-black font-semibold"
                    onClick={() => setLocation(`/buy-sell?token=${symbol}`)}
                    data-testid="button-buy-token"
                  >
                    {t('tokenDetail.buyToken', { symbol: token.symbol })}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-0">
            {(() => {
              const tokenInfo = getTokenInfo(token.symbol);
              
              return (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('tokenDetail.aboutToken', { symbol: token.symbol })}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tokenInfo?.description || t('tokenDetail.defaultDescription', { name: token.name })}
                    </p>
                    {tokenInfo?.links?.website && (
                      <a 
                        href={tokenInfo.links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary mt-2 font-medium hover:underline inline-block"
                        data-testid="link-read-more"
                      >
                        {t('tokenDetail.readMore')}
                      </a>
                    )}
                  </div>

                  {/* Contract Security */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">{t('tokenDetail.contractSecurity')}</h3>
                    <div className="rounded-2xl p-4 border border-border/60 bg-background/40 backdrop-blur-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{t('tokenDetail.noRisksFound')}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">
                        {t('tokenDetail.scannedBy')}
                      </p>
                    </div>
                  </div>

                  {/* Honeypot Risk */}
                  <div>
                    <h3 className="text-base font-semibold mb-3">{t('tokenDetail.honeypotRisk')}</h3>
                    <div className="rounded-2xl p-4 border border-border/60 bg-background/40 backdrop-blur-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{t('tokenDetail.noRisksFound')}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground ml-7">
                        {t('tokenDetail.scannedBy')}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {tokenInfo && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">{t('tokenDetail.stats')}</h3>
                      <div className="rounded-2xl border border-border/60 bg-background/40 backdrop-blur-sm divide-y divide-border/60">
                        {tokenInfo.marketCap && (
                          <div className="flex items-center justify-between p-4">
                            <span className="text-sm text-muted-foreground">{t('tokenDetail.marketCap')}</span>
                            <span className="text-sm font-medium">{tokenInfo.marketCap}</span>
                          </div>
                        )}
                        {tokenInfo.circulatingSupply && (
                          <div className="flex items-center justify-between p-4">
                            <span className="text-sm text-muted-foreground">{t('tokenDetail.circulatingSupply')}</span>
                            <span className="text-sm font-medium">{tokenInfo.circulatingSupply}</span>
                          </div>
                        )}
                        {tokenInfo.totalSupply && (
                          <div className="flex items-center justify-between p-4">
                            <span className="text-sm text-muted-foreground">{t('tokenDetail.totalSupply')}</span>
                            <span className="text-sm font-medium">{tokenInfo.totalSupply}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {tokenInfo?.links && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">{t('tokenDetail.links')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {tokenInfo.links.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(tokenInfo.links.website, '_blank')}
                            data-testid="button-website"
                          >
                            {t('tokenDetail.officialWebsite')}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        {tokenInfo.links.explorer && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(tokenInfo.links.explorer, '_blank')}
                            data-testid="button-explorer"
                          >
                            {t('tokenDetail.explorer')}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        {tokenInfo.links.github && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(tokenInfo.links.github, '_blank')}
                            data-testid="button-github"
                          >
                            {t('tokenDetail.github')}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        {tokenInfo.links.twitter && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(tokenInfo.links.twitter, '_blank')}
                            data-testid="button-twitter"
                          >
                            {t('tokenDetail.twitter')}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

      </div>

      {/* Floating Glass Bottom Action Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "460px",
          zIndex: 40,
        }}
      >
        <div className="glass-nav px-3 py-3" style={{ border: "2px solid rgba(22,119,255,0.80)", boxShadow: "0 0 0 1px rgba(22,119,255,0.18), 0 8px 32px rgba(0,0,0,0.14)" }}>
          <div className="flex items-center justify-around">
            <button
              className="flex flex-col items-center gap-1.5"
              onClick={() => setLocation(`/send/${token._id || token.id}`)}
              data-testid="button-send"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass-action-icon">
                <ArrowUpRight className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t('common.send')}</span>
            </button>
            <button
              className="flex flex-col items-center gap-1.5"
              onClick={() => setLocation(`/receive-qr/${token._id || token.id}`)}
              data-testid="button-receive"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass-action-icon">
                <ArrowDownLeft className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t('common.receive')}</span>
            </button>
            <button
              className="flex flex-col items-center gap-1.5"
              onClick={() => setLocation(`/swap?from=${symbol}&chainId=${token.chainId}`)}
              data-testid="button-swap"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass-action-icon">
                <Repeat2 className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t('common.swap')}</span>
            </button>
            <button
              className="flex flex-col items-center gap-1.5"
              onClick={() => setLocation(`/buy-sell?token=${symbol}`)}
              data-testid="button-buy"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass-action-icon-buy">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t('common.buy')}</span>
            </button>
            <button
              className="flex flex-col items-center gap-1.5"
              onClick={() => setLocation(`/buy-sell?token=${symbol}&mode=sell`)}
              data-testid="button-sell"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass-action-icon">
                <Landmark className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t('common.sell')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
