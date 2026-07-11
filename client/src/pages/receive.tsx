import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Search, ChevronDown, QrCode, Copy } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { getWalletAddress } from "@shared/wallet-addresses";
import { useTranslation } from "react-i18next";

// Derive a short display address using the same slice format as transaction-detail.tsx
function getDisplayAddress(chainId: string, virtualAddresses: Record<string, string> | null): string {
  // Prefer the user's virtual address for this chain
  const virtual = virtualAddresses?.[chainId];
  const addr = virtual || getWalletAddress(chainId);
  if (!addr) return "";
  return `${addr.slice(0, 6)}.....${addr.slice(-6)}`;
}

interface ReceiveTokenProps {
  symbol: string;
  name: string;
  chainName: string;
  displayAddress: string;
  icon?: string;
  chainIcon?: string;
  chainId: string;
  chainSymbol?: string;
  onQrClick: () => void;
  onCopyClick: () => void;
}

function ReceiveToken({
  symbol,
  name,
  chainName,
  displayAddress,
  icon,
  chainIcon,
  chainId,
  chainSymbol,
  onQrClick,
  onCopyClick,
}: ReceiveTokenProps) {
  const [tokenIconError, setTokenIconError] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);
  
  // Hide chain badge for native tokens
  const isNativeToken = symbol === chainSymbol;

  return (
    <div
      className="flex items-center justify-between p-3 hover-elevate active-elevate-2 rounded-lg cursor-pointer"
      onClick={onQrClick}
      data-testid={`receive-token-${symbol.toLowerCase()}-${chainId}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white/10">
            {icon && !tokenIconError ? (
              <img
                src={icon}
                alt={symbol}
                className="w-full h-full object-cover"
                onError={() => setTokenIconError(true)}
                loading="lazy"
              />
            ) : (
              <span className="text-primary font-bold text-sm">{symbol[0]}</span>
            )}
          </div>
          {chainIcon && !isNativeToken && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
              {!chainIconError ? (
                <img
                  src={chainIcon}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setChainIconError(true)}
                  loading="lazy"
                />
              ) : (
                <span className="text-[9px] font-medium">{symbol[0]}</span>
              )}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground">{symbol}</p>
          <p className="text-xs text-muted-foreground truncate">{chainName}</p>
          <p className="text-xs text-muted-foreground font-mono">{displayAddress}</p>
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCopyClick();
          }}
          data-testid={`button-copy-${symbol.toLowerCase()}-${chainId}`}
        >
          <Copy className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export default function Receive() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated, isLoading, virtualAddresses } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Fetch ALL available tokens from wallet (not just portfolio)
  const { data: allTokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];
  const allTokens = (allTokensData as any)?.tokens || [];

  // Filter tokens based on search and selected chain
  const filteredTokens = allTokens.filter((token: any) => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === "all" || token.chainId === selectedChain;
    return matchesSearch && matchesChain;
  });

  // Group tokens into Popular and All crypto
  const popularSymbols = ["BTC", "ETH", "SOL", "BNB", "USDT", "USDC"];
  const popularTokens = filteredTokens.filter((token: any) =>
    popularSymbols.includes(token.symbol)
  );
  const allCryptoTokens = filteredTokens;

  const handleQrClick = (token: any) => {
    setLocation(`/receive-qr/${token._id}`);
  };

  const handleCopyClick = (token: any) => {
    const address = getWalletAddress(token.chainId);
    
    navigator.clipboard.writeText(address).then(() => {
      toast({
        title: t('receive.addressCopied'),
        description: t('receive.addressCopiedDescription', { symbol: token.symbol }),
      });
    });
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('receive.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('receive.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-receive"
          />
        </div>

        {/* Network Filter */}
        <div className="mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-0 hover:bg-transparent"
                data-testid="button-network-filter"
              >
                <span className="text-sm font-medium">
                  {selectedChain === "all"
                    ? t('receive.allNetworks')
                    : chains.find((c: any) => c.id === selectedChain)?.name || t('receive.allNetworks')}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => setSelectedChain("all")}
                data-testid="menu-filter-all"
                className="cursor-pointer"
              >
                {t('receive.allNetworks')}
              </DropdownMenuItem>
              {chains.map((chain: any) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  data-testid={`menu-filter-${chain.id}`}
                  className="cursor-pointer"
                >
                  {chain.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Popular Section */}
        {popularTokens.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('receive.popular')}</h2>
            <div className="space-y-1">
              {popularTokens.map((token: any) => {
                const tokenChain = chains.find((c: any) => c.id === token.chainId);
                const displayAddress = getDisplayAddress(token.chainId, virtualAddresses);
                
                return (
                  <ReceiveToken
                    key={`${token.symbol}-${token.chainId}`}
                    symbol={token.symbol}
                    name={token.name}
                    chainName={tokenChain?.name || ""}
                    displayAddress={displayAddress}
                    icon={token.icon}
                    chainIcon={tokenChain?.icon}
                    chainId={token.chainId}
                    chainSymbol={tokenChain?.symbol}
                    onQrClick={() => handleQrClick(token)}
                    onCopyClick={() => handleCopyClick(token)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* All crypto Section */}
        {allCryptoTokens.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('receive.allCrypto')}</h2>
            <div className="space-y-1">
              {allCryptoTokens.map((token: any) => {
                const tokenChain = chains.find((c: any) => c.id === token.chainId);
                const displayAddress = getDisplayAddress(token.chainId, virtualAddresses);
                
                return (
                  <ReceiveToken
                    key={`${token.symbol}-${token.chainId}`}
                    symbol={token.symbol}
                    name={token.name}
                    chainName={tokenChain?.name || ""}
                    displayAddress={displayAddress}
                    icon={token.icon}
                    chainIcon={tokenChain?.icon}
                    chainId={token.chainId}
                    chainSymbol={tokenChain?.symbol}
                    onQrClick={() => handleQrClick(token)}
                    onCopyClick={() => handleCopyClick(token)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredTokens.length === 0 && !tokensLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('receive.noTokens')}</p>
          </div>
        )}

        {/* Loading state */}
        {tokensLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
