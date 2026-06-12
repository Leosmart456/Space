import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TokenCard, QuickActionButton } from "@/components/token-card";
import { AddTokenDialog } from "@/components/add-token-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DefaultAvatar } from "@/components/default-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft, Repeat2, Settings, Plus, Eye, EyeOff, Clock, Search, ChevronDown, MoreVertical, Coins, ArrowUp, Bell, ScanLine, ChevronUp, ChevronDown as ChevronDownIcon, Headphones, BellRing } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { useChain } from "@/contexts/chain-context";
import { formatBalance } from "@/lib/format-balance";
import { formatCurrency, convertCurrency, getCurrencySymbol } from "@/lib/currency";
import { BottomNav } from "@/components/bottom-nav";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { playNotificationSound, consumePendingDashboardSound } from "@/lib/sound";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated, isLoading } = useWallet();
  const { selectedChain, setSelectedChain } = useChain();
  const { t } = useTranslation('common');
  const [addTokenDialogOpen, setAddTokenDialogOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(() => {
    const saved = localStorage.getItem('balanceVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [clickedTokenId, setClickedTokenId] = useState<string | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  // Get selected fiat currency from localStorage
  const selectedCurrency = localStorage.getItem("fiatCurrency") || "USD";
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show in-app notification permission prompt on every dashboard visit if not yet granted
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // Only show the custom prompt when permission hasn't been granted yet
    if (Notification.permission === "granted") {
      // Already granted — silently ensure subscription is active
      const timer = setTimeout(async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          if (!existing) {
            const keyRes = await fetch("/api/push/vapid-public-key");
            const { publicKey } = await keyRes.json();
            const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
            const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
            const rawData = atob(base64);
            const applicationServerKey = Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
            const subJson = sub.toJSON();
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
            });
          }
        } catch {}
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Show the custom in-app prompt so the user can consciously accept
    if (Notification.permission === "default") {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Helper: request native permission and subscribe to push
  const requestNotificationPermission = async () => {
    setShowNotificationPrompt(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          const keyRes = await fetch("/api/push/vapid-public-key");
          const { publicKey } = await keyRes.json();
          const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
          const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
          const rawData = atob(base64);
          const applicationServerKey = Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
          const subJson = sub.toJSON();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
          });
        }
      }
    } catch {}
  };

  // Play pending success sound when returning to dashboard after a transfer
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      if (consumePendingDashboardSound()) {
        playNotificationSound();
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('balanceVisible', JSON.stringify(balanceVisible));
  }, [balanceVisible]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only activate pull-to-refresh when at the top of the page
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;

    // Only prevent default and show pull indicator when:
    // 1. User is pulling down (diff > 0)
    // 2. Page is at the top (scrollY === 0)
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, 120); // Max 120px pull
      setPullDistance(distance);
    } else {
      // User is scrolling normally, reset pull state
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance > 80) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(80); // Lock at 80px during refresh

      // Refetch all data
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });

      // Show "Updating" for 5 seconds
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 5000);
    } else {
      // Snap back
      setPullDistance(0);
    }
  };

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/wallet", walletId, "portfolio"],
    enabled: !!walletId,
  });

  // Fetch unread notification count
  const { data: notificationData, refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch(`/api/notifications/unread-count?walletId=${walletId}`);
      if (!res.ok) throw new Error("Failed to fetch notification count");
      return res.json();
    },
    enabled: !!walletId,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const unreadCount = notificationData?.count || 0;

  // Fetch support chat unread count (use separate endpoint that doesn't reset count)
  const { data: supportChatUnreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/support-chat/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/support-chat/unread-count", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    enabled: !!walletId,
    refetchInterval: 60000, // Fallback polling every 60 seconds (WebSocket is primary)
  });

  const supportChatUnreadCount = supportChatUnreadData?.unreadCount || 0;

  // Fetch user data for profile picture
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated && !!walletId,
  });

  // Fetch available chains
  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  // Fetch real-time prices for all tokens
  const { data: pricesData } = useQuery({
    queryKey: ["/api/prices"],
    enabled: !!walletId,
    refetchInterval: 60000, // Refresh every minute
  });

  const chains = (chainsData as any) || [];
  const allTokens = (portfolioData as any)?.tokens || [];
  
  // Filter out hidden tokens (isVisible === false)
  const visibleTokens = allTokens.filter((token: any) => token.isVisible !== false);
  
  // Filter tokens by selected chain ("all" shows all chains)
  const chainFilteredTokens = selectedChain === "all" 
    ? visibleTokens 
    : visibleTokens.filter((token: any) => token.chainId === selectedChain);
  
  // Filter tokens based on search query
  const filteredTokens = chainFilteredTokens.filter((token: any) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Note: The API already sorts tokens with balance > 0 first
  // Here we just use the tokens as they come from the API
  const tokens = filteredTokens;
  
  // Calculate real-time total portfolio value for selected chain only
  const totalValue = chainFilteredTokens.reduce((sum: number, token: any) => {
    const coingeckoId = token.coingeckoId || token.symbol.toLowerCase();
    const priceInfo = (pricesData as any)?.[coingeckoId];
    const balance = parseFloat(token.balance || "0");
    const storedFiatValue = parseFloat(token.fiatValue || "0");
    
    // Use real-time price if available, otherwise fall back to stored fiat value
    const tokenValue = priceInfo?.usd 
      ? (balance * priceInfo.usd)
      : storedFiatValue;
    
    return sum + tokenValue;
  }, 0);

  // Calculate 24h portfolio change
  const totalChange24h = chainFilteredTokens.reduce((sum: number, token: any) => {
    const coingeckoId = token.coingeckoId || token.symbol.toLowerCase();
    const priceInfo = (pricesData as any)?.[coingeckoId];
    const balance = parseFloat(token.balance || "0");
    
    if (priceInfo?.usd && priceInfo?.usd_24h_change) {
      const currentValue = balance * priceInfo.usd;
      const changeAmount = currentValue * (priceInfo.usd_24h_change / 100);
      return sum + changeAmount;
    }
    
    return sum;
  }, 0);

  const totalChange24hPercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;
  const isPositiveChange = totalChange24h >= 0;

  if (!isAuthenticated || !walletId) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background glass-bg">
      {/* Header - Fixed/Non-scrollable */}
      <header className="glass-header flex-shrink-0 z-50 sticky top-0">
        <div className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/settings")}
                data-testid="button-settings"
                className="hover-elevate active-elevate-2 h-8 w-8"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/notifications")}
                data-testid="button-notifications"
                className="hover-elevate active-elevate-2 relative h-8 w-8"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold text-[10px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/support-chat")}
                data-testid="button-support-chat"
                className="hover-elevate active-elevate-2 relative h-8 w-8"
              >
                <Headphones className="h-5 w-5" />
                {supportChatUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold text-[10px]">
                    {supportChatUnreadCount > 99 ? '99+' : supportChatUnreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-8 w-8 rounded-full hover-elevate active-elevate-2"
                onClick={() => setLocation("/profile")}
                data-testid="button-profile"
              >
                <DefaultAvatar
                  profilePhoto={user?.profilePhoto}
                  firstName={user?.firstName || ""}
                  lastName={user?.lastName || ""}
                  size="sm"
                />
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Pull-to-refresh indicator */}
        <div 
          className="flex items-center justify-center transition-opacity"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance > 20 ? 1 : 0,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isRefreshing ? (
              <div className="text-sm font-medium text-muted-foreground" data-testid="text-updating">
                {t('dashboard.updating')}
              </div>
            ) : (
              <>
                <ArrowUp 
                  className="h-6 w-6 text-primary transition-transform"
                  style={{
                    transform: pullDistance > 80 ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                  data-testid="icon-pull-arrow"
                />
                <div className="text-sm font-medium text-muted-foreground" data-testid="text-release-refresh">
                  {pullDistance > 80 ? t('dashboard.releaseToRefresh') : t('dashboard.pullToRefresh')}
                </div>
              </>
            )}
          </div>
        </div>

        <div 
          ref={contentRef}
          className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-6xl transition-transform"
          style={{ 
            transform: `translateY(${pullDistance}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {/* Portfolio value */}
        <div className="mb-3 sm:mb-4">
          <Card className="bg-gradient-to-br from-primary to-accent border-0 shadow-xl overflow-hidden relative">
            <div className="glass-shine-diagonal z-10" />
            <CardContent className="p-3 sm:p-4 relative z-20">
              <div className="mb-3">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/history")}
                    data-testid="button-transaction-history"
                    className="text-white hover:bg-white/20 gap-1 h-6 px-2"
                  >
                    <Clock className="h-3 w-3" />
                    <span className="text-xs underline">{t('dashboard.transactionHistory')}</span>
                  </Button>
                </div>
                {portfolioLoading ? (
                  <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse mx-auto"></div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <span className="text-white/90 text-xs font-medium">{t('dashboard.balance')}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        data-testid="button-toggle-balance"
                        className="h-5 w-5 text-white hover:bg-white/20 flex-shrink-0"
                      >
                        {balanceVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <h2 
                      className={`font-bold text-white mb-1.5 ${
                        formatCurrency(totalValue, selectedCurrency, balanceVisible).length > 15 
                          ? 'text-3xl sm:text-4xl' 
                          : formatCurrency(totalValue, selectedCurrency, balanceVisible).length > 12
                          ? 'text-4xl sm:text-5xl'
                          : 'text-4xl sm:text-5xl'
                      }`}
                      data-testid="text-portfolio-value"
                    >
                      {formatCurrency(totalValue, selectedCurrency, balanceVisible)}
                    </h2>
                    {balanceVisible && (
                      <>
                        <p className="text-sm sm:text-base text-white/80 text-center mb-1.5 font-bold" data-testid="text-btc-value">
                          {(() => {
                            const btcPrice = (pricesData as any)?.['bitcoin']?.usd;
                            if (!btcPrice || totalValue === 0) return '0.0';
                            const btcValue = totalValue / btcPrice;
                            // Show max 6 decimals, remove trailing zeros but keep at least one decimal
                            const formatted = btcValue.toFixed(6);
                            return formatted.replace(/\.?0+$/, '').replace(/\.$/, '.0');
                          })()} BTC
                        </p>
                        {totalValue > 0 && (
                          <div className={`flex items-center justify-center gap-1 text-xs sm:text-sm ${
                            isPositiveChange ? 'text-green-400' : 'text-red-400'
                          }`} data-testid="text-daily-change">
                            <span className="text-white/70">Today</span>
                            <span className="font-medium">
                              {isPositiveChange ? '+' : ''}{selectedCurrency === 'USD' ? '$' : ''}{Math.abs(totalChange24h).toFixed(2)}
                            </span>
                            {isPositiveChange ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDownIcon className="h-3 w-3" />
                            )}
                            <span className="font-medium">
                              {Math.abs(totalChange24hPercent).toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <QuickActionButton
                  icon={<ArrowUpRight className="h-4 w-4 text-white" />}
                  label={t('dashboard.send')}
                  onClick={() => setLocation("/send")}
                  testId="button-quick-send"
                />
                <QuickActionButton
                  icon={<ArrowDownLeft className="h-4 w-4 text-white" />}
                  label={t('dashboard.receive')}
                  onClick={() => setLocation("/receive")}
                  testId="button-quick-receive"
                />
                <QuickActionButton
                  icon={<Repeat2 className="h-4 w-4 text-white" />}
                  label={t('dashboard.swap')}
                  onClick={() => setLocation("/swap")}
                  testId="button-quick-swap"
                />
                <QuickActionButton
                  icon={<Plus className="h-4 w-4 text-white" />}
                  label={t('dashboard.buy')}
                  onClick={() => setLocation("/buy-sell")}
                  testId="button-buy"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter, and Menu */}
        <div className="mb-3 flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tokens"
            />
          </div>

          {/* Network Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                data-testid="button-network-selector"
              >
                {selectedChain === "all" ? (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                      <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                      <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                      <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                    </svg>
                    <span className="hidden sm:inline">{t('dashboard.all')}</span>
                  </>
                ) : (
                  <>
                    {chains.find((c: any) => c.id === selectedChain)?.icon ? (
                      <img 
                        src={chains.find((c: any) => c.id === selectedChain)?.icon} 
                        alt={chains.find((c: any) => c.id === selectedChain)?.symbol}
                        className="h-4 w-4 rounded-full"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-muted" />
                    )}
                    <span className="hidden sm:inline">{chains.find((c: any) => c.id === selectedChain)?.networkStandard || "ERC-20"}</span>
                  </>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setSelectedChain("all")}
                data-testid="menu-network-all"
                className="flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                </svg>
                <span>{t('dashboard.allNetworks')}</span>
                {selectedChain === "all" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              {chains.map((chain: any) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  data-testid={`menu-network-${chain.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {chain.icon ? (
                    <img src={chain.icon} alt={chain.symbol} className="h-5 w-5 rounded-full" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{chain.name}</span>
                    <span className="text-xs text-muted-foreground">{chain.networkStandard}</span>
                  </div>
                  {selectedChain === chain.id && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3-dots Menu */}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                data-testid="button-menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    setMenuOpen(false);
                    setLocation("/manage-coins");
                  }}
                  data-testid="button-manage-coins"
                >
                  <Coins className="h-4 w-4" />
                  Manage Coins
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tokens */}
        <div className="mb-3 sm:mb-4">
          {portfolioLoading ? (
            <div className="grid gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-14 animate-pulse">
                  <CardContent className="p-2.5">
                    <div className="h-full bg-muted/50 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {tokens.map((token: any) => {
                const coingeckoId = token.coingeckoId || token.symbol.toLowerCase();
                const priceInfo = (pricesData as any)?.[coingeckoId];
                const balance = parseFloat(token.balance || "0");
                const storedFiatValue = parseFloat(token.fiatValue || "0");
                
                // Use real-time price if available, otherwise fall back to stored value
                const fiatValueUSD = priceInfo?.usd 
                  ? balance * priceInfo.usd
                  : storedFiatValue;
                
                // Convert to selected currency
                const fiatValueInCurrency = convertCurrency(fiatValueUSD, selectedCurrency);
                const realTimeFiatValue = fiatValueInCurrency.toLocaleString('en-US', {
                  minimumFractionDigits: selectedCurrency === 'JPY' || selectedCurrency === 'KRW' ? 0 : 2,
                  maximumFractionDigits: selectedCurrency === 'JPY' || selectedCurrency === 'KRW' ? 0 : 2
                });
                
                const priceChange24h = priceInfo?.usd_24h_change || 0;
                const priceChangeFormatted = priceChange24h.toFixed(2);
                
                // Format current price per token
                const currentPrice = priceInfo?.usd 
                  ? priceInfo.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 20 })
                  : undefined;
                
                // Get chain info for this token
                const tokenChain = chains.find((c: any) => c.id === token.chainId);
                const tokenKey = `${token.symbol}-${token.chainId}`;
                const isShimmering = clickedTokenId === tokenKey;
                
                return (
                  <div 
                    key={tokenKey}
                    className={isShimmering ? 'shimmer-effect' : ''}
                    onAnimationEnd={() => setClickedTokenId(null)}
                  >
                    <TokenCard
                      symbol={token.symbol}
                      name={token.name}
                      balance={balanceVisible ? formatBalance(token.balance) : '••••'}
                      fiatValue={balanceVisible ? realTimeFiatValue : '••••'}
                      currencySymbol={getCurrencySymbol(selectedCurrency)}
                      icon={token.icon}
                      price={currentPrice}
                      priceChange={priceChangeFormatted}
                      chainSymbol={tokenChain?.symbol}
                      chainIcon={tokenChain?.icon}
                      chainId={token.chainId}
                      onClick={() => {
                        setClickedTokenId(tokenKey);
                        setTimeout(() => {
                          setLocation(`/token/${token.symbol.toLowerCase()}/${token.chainId}`);
                        }, 300);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manage Coins Button */}
        <div className="px-3 pb-4">
          <div className="border-t border-border/40 pt-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/manage-coins")}
              className="w-full h-12 px-3 bg-card hover:bg-card/80 relative"
              data-testid="button-manage-coins-bottom"
            >
              <Coins className="h-4 w-4 absolute left-3" />
              <span className="font-medium text-sm">Manage Coins</span>
              <ChevronDown className="h-4 w-4 absolute right-3 rotate-[-90deg]" />
            </Button>
          </div>
        </div>
        </div>
      </div>
      <AddTokenDialog
        open={addTokenDialogOpen}
        onOpenChange={setAddTokenDialogOpen}
      />

      {/* Notification Permission Dialog — always shows until user accepts or dismisses */}
      <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
        <DialogContent className="max-w-sm mx-auto" data-testid="dialog-notification-prompt">
          <DialogHeader className="items-center text-center gap-3 pt-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <BellRing className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">Enable Notifications</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              Stay updated on your transactions, transfers, and account activity. Allow notifications so you never miss an update.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 pb-1">
            <Button
              className="w-full"
              onClick={requestNotificationPermission}
              data-testid="button-allow-notifications"
            >
              Allow Notifications
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowNotificationPrompt(false)}
              data-testid="button-dismiss-notifications"
            >
              Not Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
