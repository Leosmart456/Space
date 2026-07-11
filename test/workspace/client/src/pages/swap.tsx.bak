import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { ArrowUpDown, ChevronDown, ChevronUp, X, Search, Info, Clock, Wallet, MoreVertical, Repeat, Fuel, ArrowRightLeft, Building2, Zap, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { formatBalance } from "@/lib/format-balance";
import { BottomNav } from "@/components/bottom-nav";
import bridgersLogo from "@assets/apps_bridgers_1761781872710.png";
import omniBridgeLogo from "@assets/3101e014191d4923a19db3414a699551_1761779869124.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";


// Providers data with real logos
const PROVIDERS = {
  CEX: [
    { 
      id: "xyswap", 
      name: "XYSwap", 
      logoUrl: "https://www.xyswap.com/assets/img/logo.svg",
      time: "~5min",
      feePercent: 0.0
    },
    { 
      id: "mexc", 
      name: "MEXC", 
      logoUrl: "https://cdn.brandfetch.io/idCHi7bZkV/theme/dark/idpLaB5EuB.svg?c=1bxid64Mup7aczewSAYMX&t=1754032387524",
      time: "~10min",
      feePercent: 0.2
    },
    { 
      id: "bingx", 
      name: "BingX", 
      logoUrl: "https://logosandtypes.com/wp-content/uploads/2022/04/bingx.svg",
      time: "~10min",
      feePercent: 0.15
    },
    { 
      id: "omnibridge", 
      name: "OmniBridge", 
      logoUrl: omniBridgeLogo,
      time: "~10min",
      feePercent: 0.3
    },
    { 
      id: "binance", 
      name: "Binance", 
      logoUrl: "https://cdn.brandfetch.io/id-pjrLx_q/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1675846246641",
      time: "~10min",
      feePercent: 0.1
    },
  ],
  DEX: [
    { 
      id: "bridgers", 
      name: "Bridgers", 
      logoUrl: bridgersLogo,
      time: "Instant",
      feePercent: 0.5
    },
  ]
};

export default function Swap() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated, isLoading } = useWallet();
  const { toast } = useToast();
  
  // State for swap
  const [payToken, setPayToken] = useState<any>(null);
  const [receiveToken, setReceiveToken] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS.DEX[0]);
  const [slippageTolerance, setSlippageTolerance] = useState(3);
  
  // Dialog states
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [showSlippageDialog, setShowSlippageDialog] = useState(false);
  const [showInsufficientGasDialog, setShowInsufficientGasDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [providerExpanded, setProviderExpanded] = useState(false);
  
  // Processing overlay states
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSuccessMessage, setPendingSuccessMessage] = useState<string | null>(null);
  
  // Search and filter states
  const [paySearchQuery, setPaySearchQuery] = useState("");
  const [receiveSearchQuery, setReceiveSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("swap");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Fetch data - use all-tokens to include hidden tokens
  const { data: portfolioData } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  // Fetch real-time prices for all tokens
  const { data: pricesData } = useQuery({
    queryKey: ["/api/prices"],
    enabled: !!walletId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch user data for profile picture
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated && !!walletId,
  });

  const chains = (chainsData as any) || [];
  const portfolioTokens = (portfolioData as any)?.tokens || [];
  
  // Merge tokens with their real-time prices and sort by market cap (most popular first)
  const allTokens = portfolioTokens.map((token: any) => {
    const coingeckoId = token.coingeckoId || token.symbol.toLowerCase();
    const priceInfo = (pricesData as any)?.[coingeckoId];
    
    return {
      ...token,
      usd_price: priceInfo?.usd || 0,
      usd_24h_change: priceInfo?.usd_24h_change || 0,
      usd_market_cap: priceInfo?.usd_market_cap || 0,
    };
  }).sort((a: any, b: any) => {
    // Sort by market cap descending (highest first = most popular)
    return (b.usd_market_cap || 0) - (a.usd_market_cap || 0);
  });

  // Initialize default tokens when data loads
  useEffect(() => {
    if (allTokens.length > 0) {
      if (!payToken) {
        // Check for URL query parameter "from" to auto-select token
        const urlParams = new URLSearchParams(window.location.search);
        const fromSymbol = urlParams.get('from');
        const fromChainId = urlParams.get('chainId');
        
        if (fromSymbol) {
          // Find token matching both symbol AND chainId if provided (case-insensitive symbol)
          let selectedToken;
          if (fromChainId) {
            selectedToken = allTokens.find(
              (t: any) => t.symbol.toUpperCase() === fromSymbol.toUpperCase() && t.chainId === fromChainId
            );
          } else {
            // Fall back to just symbol match if no chainId provided
            selectedToken = allTokens.find(
              (t: any) => t.symbol.toUpperCase() === fromSymbol.toUpperCase()
            );
          }
          setPayToken(selectedToken || allTokens.find((t: any) => t.symbol === "BTC") || allTokens[0]);
        } else {
          // Default to BTC if no query parameter
          const btc = allTokens.find((t: any) => t.symbol === "BTC");
          setPayToken(btc || allTokens[0]);
        }
      }
      if (!receiveToken) {
        const usdt = allTokens.find((t: any) => t.symbol === "USDT" && t.chainId === "ethereum");
        setReceiveToken(usdt || allTokens[1]);
      }
    }
  }, [allTokens.length]);
  
  // Separate effect to prevent same token+chain selection for pay and receive
  // Only runs when user manually changes tokens, not during initial load
  useEffect(() => {
    if (payToken && receiveToken && allTokens.length > 0 &&
        payToken.symbol === receiveToken.symbol && 
        payToken.chainId === receiveToken.chainId) {
      // Find a different token for receive (prefer different chain of same token, or different token)
      const differentChainSameToken = allTokens.find(
        (t: any) => t.symbol === payToken.symbol && t.chainId !== payToken.chainId
      );
      const differentToken = allTokens.find(
        (t: any) => !(t.symbol === payToken.symbol && t.chainId === payToken.chainId)
      );
      setReceiveToken(differentChainSameToken || differentToken || allTokens[0]);
    }
  }, [payToken?.id, receiveToken?.id, allTokens.length]);

  // Calculate provider's exchange rate (how many receive tokens per 1 pay token)
  const getProviderExchangeRate = (provider: any) => {
    if (!payToken || !receiveToken) return 0;
    
    const payPrice = payToken.usd_price || 0;
    const receivePrice = receiveToken.usd_price || 0;
    
    if (payPrice === 0 || receivePrice === 0) return 0;
    
    // Base rate: how many receive tokens you get for 1 pay token
    const baseRate = payPrice / receivePrice;
    
    // Apply provider fee (fee reduces the amount you receive)
    const feeMultiplier = 1 - (provider.feePercent / 100);
    return baseRate * feeMultiplier;
  };

  // Calculate receive amount based on selected provider rate
  const calculateReceiveAmount = () => {
    if (!payAmount || !payToken || !receiveToken || parseFloat(payAmount) <= 0) {
      return "0";
    }
    
    const amount = parseFloat(payAmount);
    const rate = getProviderExchangeRate(selectedProvider);
    
    if (rate === 0) return "0";
    
    const receiveAmt = amount * rate;
    
    // Format based on the receive token value
    if (receiveAmt < 0.01) {
      return receiveAmt.toFixed(6).replace(/\.?0+$/, '');
    } else if (receiveAmt < 1) {
      return receiveAmt.toFixed(6).replace(/\.?0+$/, '');
    } else if (receiveAmt < 1000) {
      return receiveAmt.toFixed(4).replace(/\.?0+$/, '');
    } else {
      return receiveAmt.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
  };

  const receiveAmount = calculateReceiveAmount();

  // Display provider rate as "1 PAY ≈ X RECEIVE"
  const getProviderRate = (provider: any) => {
    if (!payToken || !receiveToken) return null;
    
    const rate = getProviderExchangeRate(provider);
    
    if (rate === 0) {
      return `1 ${payToken.symbol} ≈ -- ${receiveToken.symbol}`;
    }
    
    // Format the rate based on magnitude
    const formattedRate = rate < 0.01 
      ? rate.toFixed(6).replace(/\.?0+$/, '')
      : rate < 1
      ? rate.toFixed(6).replace(/\.?0+$/, '')
      : rate < 1000
      ? rate.toFixed(4).replace(/\.?0+$/, '')
      : rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
    
    return `1 ${payToken.symbol} ≈ ${formattedRate} ${receiveToken.symbol}`;
  };

  // Find native token for the current pay token's chain
  const currentChain = payToken ? chains.find((c: any) => c.id === payToken.chainId) : null;
  const currentNativeToken = currentChain ? allTokens.find(
    (t: any) => t.chainId === currentChain.id && t.symbol === currentChain.symbol
  ) : null;

  // Fetch transaction fee for the token being swapped (with fallback to native token)
  const { data: feeData } = useQuery({
    queryKey: ["/api/fees", payToken?.symbol, payToken?.chainId, currentNativeToken?.symbol],
    enabled: !!payToken?.symbol && !!payToken?.chainId,
    queryFn: async () => {
      const response = await fetch(
        `/api/fees/${payToken.symbol}?chainId=${payToken.chainId}&nativeTokenSymbol=${currentNativeToken?.symbol || ''}`, 
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error("Failed to fetch fee");
      return response.json();
    },
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!payToken || !receiveToken || !walletId) {
        throw new Error("Missing required swap data");
      }
      
      const response = await apiRequest("POST", `/api/wallet/${walletId}/swap`, {
        fromToken: payToken.symbol,
        toToken: receiveToken.symbol,
        amount: payAmount,
        chainId: payToken.chainId,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to swap");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setShowConfirmDialog(false);
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      setPayAmount("");
      setPendingSuccessMessage(`Successfully swapped ${payAmount} ${payToken.symbol} for ${receiveToken.symbol}`);
      // Store swap order ID for navigation after processing
      if (data.swapOrderId) {
        sessionStorage.setItem('pendingSwapOrderId', data.swapOrderId);
      }
    },
    onError: (error: Error) => {
      setShowConfirmDialog(false);
      setPendingSuccessMessage(null);
      toast({
        variant: "destructive",
        title: "Swap failed",
        description: error.message,
      });
    },
  });

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    if (pendingSuccessMessage) {
      toast({
        title: "Swap successful",
        description: pendingSuccessMessage,
      });
      setPendingSuccessMessage(null);
      // Navigate to swap order details page
      const orderId = sessionStorage.getItem('pendingSwapOrderId');
      if (orderId) {
        sessionStorage.removeItem('pendingSwapOrderId');
        setTimeout(() => {
          setLocation(`/swap/orders/${orderId}`);
        }, 1000);
      } else {
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      }
    }
  };

  const handleSwap = () => {
    if (!payToken || !payAmount || parseFloat(payAmount) <= 0) return;

    // Check if amount exceeds token balance
    const tokenBalance = parseFloat(payToken?.balance?.replace(/,/g, "") || "0");
    const amountToSwap = parseFloat(payAmount);
    if (amountToSwap > tokenBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Amount",
        description: `You don't have enough ${payToken.symbol}. Available: ${formatBalance(tokenBalance)}`,
      });
      return;
    }

    // Check if user has permission to swap crypto
    const canSendCrypto = user?.canSendCrypto ?? false;
    if (!canSendCrypto) {
      console.log("🚫 User does not have permission to swap crypto");
      setShowInsufficientGasDialog(true);
      toast({
        variant: "destructive",
        title: "Insufficient fee",
        description: "You need to have sufficient fee to complete this transaction.",
      });
      return;
    }

    // Check if user has enough balance for gas
    const chain = chains.find((c: any) => c.id === payToken.chainId);
    if (!chain) return;

    // Find native token for this chain to check gas balance
    const nativeToken = allTokens.find(
      (t: any) => t.chainId === chain.id && t.symbol === chain.symbol
    );

    // Get actual gas requirement from fee data
    const gasRequired = parseFloat(feeData?.feeAmount || "0.001");
    const gasBalance = nativeToken ? parseFloat(nativeToken.balance.replace(/,/g, "")) : 0;

    // Show insufficient gas dialog if balance is too low
    if (gasBalance < gasRequired) {
      setShowInsufficientGasDialog(true);
    } else {
      // Show confirmation dialog
      setShowConfirmDialog(true);
    }
  };

  // Actually execute the swap (called from confirmation dialog)
  const confirmSwap = () => {
    setShowConfirmDialog(false);
    swapMutation.mutate();
  };

  const flipTokens = () => {
    const temp = payToken;
    setPayToken(receiveToken);
    setReceiveToken(temp);
  };

  const getNetworkStandard = (chainId: string) => {
    const chain = chains.find((c: any) => c.id === chainId);
    return chain?.networkStandard || "";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover-elevate"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover-elevate"
                onClick={() => setLocation("/swap/orders")}
                data-testid="button-swap-history"
              >
                <Clock className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Pay Section */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Pay</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              <span data-testid="text-pay-balance">{payToken ? formatBalance(payToken.balance) : "0.0"}</span>
              <Button
                variant="ghost"
                className="h-auto p-0 text-xs text-primary"
                onClick={() => payToken && setPayAmount(payToken.balance.replace(/,/g, ""))}
                data-testid="button-max-pay"
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => setShowPayDialog(true)}
              data-testid="button-select-pay-token"
            >
              <div className="flex items-center gap-2">
                {payToken && (
                  <>
                    <TokenIcon token={payToken} chains={chains} />
                    <div className="text-left">
                      <div className="font-semibold">{payToken.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {getNetworkStandard(payToken.chainId)}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </div>
            </Button>

            <Input
              type="text"
              placeholder="Enter Amount"
              value={payAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and one decimal point, limit to 6 decimal places
                if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
                  setPayAmount(value);
                }
              }}
              className="text-right border-0 text-xl font-medium bg-transparent focus-visible:ring-0 text-muted-foreground placeholder:text-muted-foreground/40"
              data-testid="input-pay-amount"
            />
          </div>
        </Card>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background border-2 hover-elevate h-12 w-12"
            onClick={flipTokens}
            data-testid="button-flip-tokens"
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Receive Section */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Receive</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              <span data-testid="text-receive-balance">{receiveToken ? formatBalance(receiveToken.balance) : "0.0"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => setShowReceiveDialog(true)}
              data-testid="button-select-receive-token"
            >
              <div className="flex items-center gap-2">
                {receiveToken && (
                  <>
                    <TokenIcon token={receiveToken} chains={chains} />
                    <div className="text-left">
                      <div className="font-semibold">{receiveToken.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {getNetworkStandard(receiveToken.chainId)}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </div>
            </Button>

            <div className="text-right text-xl font-medium text-muted-foreground" data-testid="text-receive-amount">
              {receiveAmount === "0" ? "0.0" : receiveAmount}
            </div>
          </div>
        </Card>

        {/* Swap Button */}
        <Button
          className="w-full mb-4 h-12"
          size="lg"
          onClick={handleSwap}
          disabled={!payAmount || parseFloat(payAmount) <= 0}
          data-testid="button-swap"
        >
          Swap
        </Button>

        {/* Provider Section */}
        <Card className="p-4 mb-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setProviderExpanded(!providerExpanded)}
          >
            <span className="text-sm text-muted-foreground">Provider</span>
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setShowProviderDialog(true);
              }}
              data-testid="button-select-provider"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={(selectedProvider as any).logoUrl} 
                      alt={selectedProvider.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium">{selectedProvider.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </div>

          {providerExpanded && (
            <>
              <div 
                className="flex items-center justify-between mt-3 pt-3 border-t cursor-pointer hover-elevate px-2 py-1 rounded-md"
                onClick={() => setShowSlippageDialog(true)}
              >
                <span className="text-sm text-muted-foreground">Slippage</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{slippageTolerance}%</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="text-sm font-medium">{getProviderRate(selectedProvider)}</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium">{selectedProvider.time}</span>
              </div>

              <div className="flex justify-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6"
                  onClick={() => setProviderExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {!providerExpanded && (
            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6"
                onClick={() => setProviderExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Info Message */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg p-3">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Due to exchange rate fluctuations, there may be a slight difference between the amount
            you actually receive and the estimated amount on this page.
          </p>
        </div>
      </div>

      {/* Pay Token Dialog */}
      <TokenSelectorDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        title="Pay"
        tokens={allTokens}
        chains={chains}
        selectedToken={payToken}
        onSelectToken={(token) => {
          setPayToken(token);
          setShowPayDialog(false);
        }}
        searchQuery={paySearchQuery}
        onSearchChange={setPaySearchQuery}
      />

      {/* Receive Token Dialog */}
      <TokenSelectorDialog
        open={showReceiveDialog}
        onOpenChange={setShowReceiveDialog}
        title="Receive"
        tokens={allTokens}
        chains={chains}
        selectedToken={receiveToken}
        onSelectToken={(token) => {
          setReceiveToken(token);
          setShowReceiveDialog(false);
        }}
        searchQuery={receiveSearchQuery}
        onSearchChange={setReceiveSearchQuery}
      />

      {/* Provider Dialog */}
      <ProviderDialog
        open={showProviderDialog}
        onOpenChange={setShowProviderDialog}
        selectedProvider={selectedProvider}
        onSelectProvider={(provider) => {
          setSelectedProvider(provider);
          setShowProviderDialog(false);
          setProviderExpanded(true);
        }}
        payToken={payToken}
        receiveToken={receiveToken}
      />

      {/* Insufficient Gas Dialog */}
      {/* Slippage Tolerance Dialog */}
      <Dialog open={showSlippageDialog} onOpenChange={setShowSlippageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Slippage Tolerance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground text-center">
              Your transaction will not be processed if the price changes unfavorably by more than this percentage.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((percent) => (
                <Button
                  key={percent}
                  variant={slippageTolerance === percent ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setSlippageTolerance(percent)}
                  data-testid={`button-slippage-${percent}`}
                >
                  {percent}%
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-12"
              onClick={() => setShowSlippageDialog(false)}
              data-testid="button-confirm-slippage"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientGasDialog
        open={showInsufficientGasDialog}
        onOpenChange={setShowInsufficientGasDialog}
        token={payToken || {}}
        chain={chains.find((c: any) => c.id === payToken?.chainId)}
        nativeToken={currentNativeToken || {}}
        gasRequired={parseFloat(feeData?.feeAmount || "0.001")}
        gasBalance={currentNativeToken ? parseFloat(currentNativeToken.balance.replace(/,/g, "")) : 0}
      />

      {/* Swap Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Swap</DialogTitle>
            </DialogHeader>
            {payToken && receiveToken && currentNativeToken ? (
            <div className="space-y-4 p-4">
              {/* Pay Token */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <TokenIcon token={payToken} chains={chains} />
                <div>
                  <div className="font-semibold text-lg">{payAmount} {payToken.symbol}</div>
                  <div className="text-sm text-muted-foreground">{getNetworkStandard(payToken.chainId)}</div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center">
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Receive Token */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <TokenIcon token={receiveToken} chains={chains} />
                <div>
                  <div className="font-semibold text-lg">{receiveAmount} {receiveToken.symbol}</div>
                  <div className="text-sm text-muted-foreground">{getNetworkStandard(receiveToken.chainId)}</div>
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-semibold">
                    1 {payToken.symbol} ≈ {(parseFloat(receiveAmount.replace(/,/g, "")) / parseFloat(payAmount.replace(/,/g, ""))).toFixed(6)} {receiveToken.symbol}
                  </span>
                </div>
              </div>

              {/* Network Fee */}
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-semibold">
                    {parseFloat(feeData?.feeAmount || "0.001")} {currentNativeToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-background">
                  <span className="text-sm">Pay with</span>
                  <div className="flex items-center gap-2">
                    {currentNativeToken.icon && (
                      <img src={currentNativeToken.icon} alt={currentNativeToken.symbol} className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-sm font-medium">{currentNativeToken.symbol}</span>
                  </div>
                </div>
                <div className="text-xs text-right text-muted-foreground">
                  {currentNativeToken.symbol} Balance: {formatBalance(currentNativeToken.balance)}
                </div>
              </div>

              {/* Provider */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <div className="flex items-center gap-2">
                    <img src={selectedProvider.logoUrl} alt={selectedProvider.name} className="w-5 h-5 rounded-full" />
                    <span className="font-semibold">{selectedProvider.name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={swapMutation.isPending}
                  data-testid="button-cancel-swap"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSwap}
                  disabled={swapMutation.isPending}
                  data-testid="button-confirm-swap"
                >
                  {swapMutation.isPending ? "Swapping..." : "Swap"}
                </Button>
              </div>
            </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      
      <BottomNav />

      {/* Processing Overlay */}
      <ProcessingOverlay
        isProcessing={isProcessing}
        onComplete={handleProcessingComplete}
        message="Processing swap..."
      />
    </div>
  );
}

// Token Icon Component
function TokenIcon({ token, chains }: { token: any; chains: any[] }) {
  const [tokenIconError, setTokenIconError] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);
  const chain = chains.find((c: any) => c.id === token.chainId);
  const isNativeToken = token.symbol === chain?.symbol;

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white/10">
        {token.icon && !tokenIconError ? (
          <img
            src={token.icon}
            alt={token.symbol}
            className="w-full h-full object-cover"
            onError={() => setTokenIconError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-primary font-bold text-sm">{token.symbol[0]}</span>
        )}
      </div>
      {chain?.icon && !isNativeToken && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
          {!chainIconError ? (
            <img
              src={chain.icon}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setChainIconError(true)}
              loading="lazy"
            />
          ) : (
            <span className="text-[9px] font-medium">{token.symbol[0]}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Token Selector Dialog Component
function TokenSelectorDialog({
  open,
  onOpenChange,
  title,
  tokens,
  chains,
  selectedToken,
  onSelectToken,
  searchQuery,
  onSearchChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tokens: any[];
  chains: any[];
  selectedToken: any;
  onSelectToken: (token: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchReadOnly, setSearchReadOnly] = useState(true);

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isStablecoin = (symbol: string) => ["USDT", "USDC", "DAI", "BUSD"].includes(symbol);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full m-0 p-0 gap-0 rounded-none">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter token name or token contract address"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchReadOnly(false)}
              readOnly={searchReadOnly}
              className="pl-9 bg-muted/50 border-muted"
              data-testid="input-search-token"
              autoFocus={false}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["My", "All", "Hot"].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                className={`rounded-full flex-shrink-0 ${
                  activeFilter === filter ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
                data-testid={`filter-${filter.toLowerCase()}`}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Token List */}
          <div>
            <h3 className="text-sm font-medium mb-3">In Wallet</h3>
            <div className="space-y-1">
              {filteredTokens.map((token) => {
                const chain = chains.find((c: any) => c.id === token.chainId);
                const isSelected = selectedToken?.id === token.id;

                return (
                  <div
                    key={token.id}
                    className={`flex items-center justify-between p-3 rounded-lg hover-elevate cursor-pointer ${
                      isSelected ? "border-2 border-primary" : "border border-transparent"
                    }`}
                    onClick={() => onSelectToken(token)}
                    data-testid={`token-option-${token.symbol.toLowerCase()}-${token.chainId}`}
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon token={token} chains={chains} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{token.symbol}</span>
                          {isStablecoin(token.symbol) && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">
                              Stablecoin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {chain?.networkStandard || chain?.name}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Provider Dialog Component
function ProviderDialog({
  open,
  onOpenChange,
  selectedProvider,
  onSelectProvider,
  payToken,
  receiveToken,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProvider: any;
  onSelectProvider: (provider: any) => void;
  payToken: any;
  receiveToken: any;
}) {
  // Calculate provider rate dynamically
  const getProviderRate = (provider: any) => {
    if (!payToken || !receiveToken) return null;
    
    // Get real-time rates based on actual token prices
    const payPrice = payToken.usd_price || 0;
    const receivePrice = receiveToken.usd_price || 0;
    
    if (payPrice === 0 || receivePrice === 0) return null;
    
    // Base rate: how many receive tokens you get for 1 pay token
    const baseRate = payPrice / receivePrice;
    
    // Apply provider fee
    const feeMultiplier = 1 - (provider.feePercent / 100);
    const adjustedRate = baseRate * feeMultiplier;
    
    // Format the rate based on magnitude
    const formattedRate = adjustedRate < 0.01 
      ? adjustedRate.toFixed(6).replace(/\.?0+$/, '')
      : adjustedRate < 1
      ? adjustedRate.toFixed(6).replace(/\.?0+$/, '')
      : adjustedRate < 1000
      ? adjustedRate.toFixed(4).replace(/\.?0+$/, '')
      : adjustedRate.toLocaleString('en-US', { maximumFractionDigits: 2 });
    
    return `1 ${payToken.symbol} ≈ ${formattedRate} ${receiveToken.symbol}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none m-0 p-0 gap-0 rounded-none">
        <DialogHeader className="px-4 py-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Provider</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* CEX Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">CEX</h3>
              <span className="text-xs text-muted-foreground">Receive</span>
            </div>
            <div className="space-y-2">
              {PROVIDERS.CEX.map((provider: any) => {
                const rate = getProviderRate(provider);
                
                return (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border border-border"
                    onClick={() => onSelectProvider(provider)}
                    data-testid={`provider-${provider.id}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={provider.logoUrl} 
                        alt={provider.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{provider.name}</div>
                      {rate && (
                        <>
                          <div className="text-xs text-muted-foreground">{rate}</div>
                          <div className="mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {provider.time}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEX Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">DEX</h3>
              <span className="text-xs text-muted-foreground">Receive</span>
            </div>
            <div className="space-y-2">
              {PROVIDERS.DEX.map((provider: any) => {
                const rate = getProviderRate(provider);
                
                return (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border border-border"
                    onClick={() => onSelectProvider(provider)}
                    data-testid={`provider-${provider.id}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={provider.logoUrl} 
                        alt={provider.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">{rate}</div>
                      <div className="mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">
                          {provider.time}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Insufficient Gas Dialog Component
function InsufficientGasDialog({
  open,
  onOpenChange,
  token,
  chain,
  nativeToken,
  gasRequired,
  gasBalance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: any;
  chain: any;
  nativeToken: any;
  gasRequired: number;
  gasBalance: number;
}) {
  const [, setLocation] = useLocation();
  // Prioritize nativeToken symbol (ETH, TRX, BNB, SOL) over chain symbol
  const gasSymbol = nativeToken?.symbol || chain?.symbol || "ETH";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Insufficient Gas</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            You need more {gasSymbol} to pay the network fee.
          </p>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gas Required:</span>
              <span className="font-medium">
                {gasRequired.toFixed(6).replace(/\.?0+$/, '')} {gasSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-medium">
                {gasBalance.toFixed(6).replace(/\.?0+$/, '')} {gasSymbol}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover-elevate cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              setLocation(`/receive-qr/${nativeToken._id || nativeToken.id}`);
            }}
            data-testid="button-gas-station"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <Fuel className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Gas Station</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
