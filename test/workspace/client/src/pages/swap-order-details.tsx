import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowDown, Copy, Check, ExternalLink, CheckCircle, Clock, AlertCircle, XCircle, MoreVertical } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SwapOrder } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ETHEREUM_TOKENS } from "@shared/ethereum-tokens";
import { BNB_TOKENS } from "@shared/bnb-tokens";
import { TRON_TOKENS } from "@shared/tron-tokens";
import { SOLANA_TOKENS } from "@shared/solana-tokens";

export default function SwapOrderDetails() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [chainIconErrors, setChainIconErrors] = useState<{ [key: string]: boolean }>({});
  
  // Get all tokens for icon lookup
  const allTokens = [
    ...ETHEREUM_TOKENS,
    ...BNB_TOKENS,
    ...TRON_TOKENS,
    ...SOLANA_TOKENS,
  ];

  // Fetch chains data for chain icons
  const { data: chains } = useQuery<any[]>({
    queryKey: ["/api/chains"],
  });

  // Extract orderId from route params
  const [, params] = useRoute("/swap/orders/:orderId");
  const orderId = params?.orderId || "";

  // Fetch swap order details
  const { data: swapOrder, isLoading } = useQuery<SwapOrder>({
    queryKey: ["/api/swap-orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/swap-orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch swap order");
      }
      return response.json();
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "pending" || data?.status === "processing") {
        return 3000;
      }
      return false;
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateId = (id: string) => {
    if (!id || id.length < 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  const formatOrderTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(",", "");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center" data-testid="div-loading">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!swapOrder) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6">
          <h2 className="text-xl font-semibold" data-testid="text-error-title">Order Not Found</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-error-message">
            The swap order you're looking for doesn't exist.
          </p>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-return-dashboard">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Helper to truncate transaction hashes and addresses
  const truncateHash = (hash: string | null | undefined) => {
    if (!hash || hash.length < 12) return hash || "N/A";
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 5)}`;
  };

  // Get blockchain explorer URL for transaction hash
  const getExplorerUrl = (txHash: string | null | undefined, chainId: string) => {
    if (!txHash) return null;
    
    const normalized = chainId.toLowerCase();
    switch (normalized) {
      case "ethereum":
        return `https://etherscan.io/tx/${txHash}`;
      case "bnb":
      case "bsc":
        return `https://bscscan.com/tx/${txHash}`;
      case "polygon":
        return `https://polygonscan.com/tx/${txHash}`;
      case "tron":
        return `https://tronscan.org/#/transaction/${txHash}`;
      case "solana":
        return `https://solscan.io/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  // Get token icon URL from token registry
  const getTokenIcon = (tokenSymbol: string) => {
    const tokenInfo = allTokens.find(t => t.symbol === tokenSymbol);
    return tokenInfo?.icon || null;
  };

  // Get token's native chain from token registries
  const getTokenNativeChain = (tokenSymbol: string): string | null => {
    if (ETHEREUM_TOKENS.find(t => t.symbol === tokenSymbol)) return 'ethereum';
    if (BNB_TOKENS.find(t => t.symbol === tokenSymbol)) return 'bnb';
    if (TRON_TOKENS.find(t => t.symbol === tokenSymbol)) return 'tron';
    if (SOLANA_TOKENS.find(t => t.symbol === tokenSymbol)) return 'solana';
    return null;
  };

  // Get chain icon URL from chains data
  const getChainIcon = (chainId: string) => {
    if (!chains) return null;
    const chain = chains.find((c: any) => c.id === chainId);
    return chain?.icon || null;
  };

  // Get chain info to determine if token is native
  const getChainNativeSymbol = (chainId: string) => {
    if (!chains) return null;
    const chain = chains.find((c: any) => c.id === chainId);
    return chain?.symbol || null;
  };

  // Check if token is native to chain
  const isNativeToken = (tokenSymbol: string, chainId: string) => {
    const nativeSymbol = getChainNativeSymbol(chainId);
    return tokenSymbol === nativeSymbol;
  };

  // Handle chain icon errors
  const handleChainIconError = (key: string) => {
    setChainIconErrors(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/swap/orders")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2" data-testid="text-page-title">Order Details</h1>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-more-options"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2" data-testid="div-status">
            {swapOrder.status === "completed" ? (
              <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20 border-[hsl(var(--success))]/20 flex items-center gap-1.5 px-3 py-1" data-testid="badge-success">
                <CheckCircle className="h-4 w-4" />
                <span>Success</span>
              </Badge>
            ) : swapOrder.status === "pending" || swapOrder.status === "processing" ? (
              <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1" data-testid="badge-pending">
                <Clock className="h-4 w-4" />
                <span>{swapOrder.status === "pending" ? "Pending" : "Processing"}</span>
              </Badge>
            ) : swapOrder.status === "failed" ? (
              <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1" data-testid="badge-failed">
                <XCircle className="h-4 w-4" />
                <span>Failed</span>
              </Badge>
            ) : (
              <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20 border-[hsl(var(--warning))]/20 flex items-center gap-1.5 px-3 py-1" data-testid="badge-suspended">
                <AlertCircle className="h-4 w-4" />
                <span>Suspended</span>
              </Badge>
            )}
          </div>

          {/* Token Exchange Display */}
          <div className="space-y-3">
            {/* Source Token */}
            <div className="flex items-center gap-3" data-testid="div-source-token">
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {getTokenIcon(swapOrder.sourceToken) ? (
                    <img 
                      src={getTokenIcon(swapOrder.sourceToken)!} 
                      alt={swapOrder.sourceToken}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {swapOrder.sourceToken.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Chain Logo Badge - always show for all tokens */}
                {getChainIcon(swapOrder.chainId) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                    {!chainIconErrors['source'] ? (
                      <img 
                        src={getChainIcon(swapOrder.chainId)!} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={() => handleChainIconError('source')}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[9px] font-medium">{swapOrder.chainId[0].toUpperCase()}</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-source-amount">
                  {parseFloat(swapOrder.sourceAmount).toLocaleString()} {swapOrder.sourceToken}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-source-network">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {swapOrder.chainId === "bnb" ? "BEP20" : swapOrder.chainId === "ethereum" ? "ERC20" : swapOrder.chainId === "tron" ? "TRC20" : swapOrder.chainId === "solana" ? "SPL" : swapOrder.chainId.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Destination Token */}
            <div className="flex items-center gap-3" data-testid="div-dest-token">
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {getTokenIcon(swapOrder.destToken) ? (
                    <img 
                      src={getTokenIcon(swapOrder.destToken)!} 
                      alt={swapOrder.destToken}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {swapOrder.destToken.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Chain Logo Badge - use destination token's native chain, always show */}
                {(() => {
                  const destChainId = getTokenNativeChain(swapOrder.destToken);
                  const chainIcon = destChainId ? getChainIcon(destChainId) : null;
                  
                  return chainIcon ? (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                      {!chainIconErrors['dest'] ? (
                        <img 
                          src={chainIcon} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={() => handleChainIconError('dest')}
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[9px] font-medium">{destChainId![0].toUpperCase()}</span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-dest-amount">
                  {parseFloat(swapOrder.destAmount || "0").toLocaleString()} {swapOrder.destToken}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-dest-network">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {(() => {
                      const destChainId = getTokenNativeChain(swapOrder.destToken);
                      if (destChainId === "bnb") return "BEP20";
                      if (destChainId === "ethereum") return "ERC20";
                      if (destChainId === "tron") return "TRC20";
                      if (destChainId === "solana") return "SPL";
                      return destChainId?.toUpperCase() || "Unknown";
                    })()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3" data-testid="div-order-details">
            {/* Order ID */}
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium font-mono" data-testid="text-order-id">
                  {truncateId(swapOrder.orderId)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(swapOrder.orderId, "Order ID")}
                  data-testid="button-copy-order-id"
                >
                  {copiedField === "Order ID" ? (
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Order Time */}
              <span className="text-sm text-muted-foreground">Order Time</span>
              <span className="text-sm font-medium text-right" data-testid="text-order-time">
                {formatOrderTime(swapOrder.orderTime)}
              </span>

              {/* Receiving Address */}
              <span className="text-sm text-muted-foreground">Receiving Address</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium font-mono" data-testid="text-receiving-address">
                  {truncateHash(swapOrder.receivingAddress)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(swapOrder.receivingAddress || "", "Receiving Address")}
                  data-testid="button-copy-receiving-address"
                >
                  {copiedField === "Receiving Address" ? (
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* TXID of Transfer-out */}
              <span className="text-sm text-muted-foreground">TXID of Transfer-out</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium font-mono" data-testid="text-txid-out">
                  {truncateHash(swapOrder.sendTxHash)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const url = getExplorerUrl(swapOrder.sendTxHash, swapOrder.chainId);
                    if (url) window.open(url, "_blank");
                  }}
                  disabled={!swapOrder.sendTxHash}
                  data-testid="button-view-txid-out"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* TXID of Transfer-in */}
              <span className="text-sm text-muted-foreground">TXID of Transfer-in</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium font-mono" data-testid="text-txid-in">
                  {truncateHash(swapOrder.receiveTxHash)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const url = getExplorerUrl(swapOrder.receiveTxHash, swapOrder.chainId);
                    if (url) window.open(url, "_blank");
                  }}
                  disabled={!swapOrder.receiveTxHash}
                  data-testid="button-view-txid-in"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Provider */}
              <span className="text-sm text-muted-foreground">Provider</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium" data-testid="text-provider">
                  {swapOrder.provider || "XY Swap"}
                </span>
              </div>

              {/* Rate */}
              <span className="text-sm text-muted-foreground">Rate</span>
              <span className="text-sm font-medium text-right" data-testid="text-rate">
                {swapOrder.rate || `1 ${swapOrder.sourceToken} ≈ ${(parseFloat(swapOrder.destAmount || "0") / parseFloat(swapOrder.sourceAmount)).toFixed(6)} ${swapOrder.destToken}`}
              </span>
            </div>
          </div>

          {/* Need Help Link */}
          <div className="text-center pt-4" data-testid="div-help">
            <span className="text-sm text-muted-foreground">Need Help? </span>
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => setLocation("/contact")}
              data-testid="button-contact-support"
            >
              Contact customer support
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
