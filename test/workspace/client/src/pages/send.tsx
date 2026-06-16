import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { QrScanner } from "@/components/qr-scanner";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { ArrowLeft, QrCode, AlertCircle, Clipboard, CheckCircle2, User, AtSign, Hash, ChevronRight } from "lucide-react";
import { useLocation, useParams } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { primeAudio, playSuccessSound, setSoundSuppressed, scheduleDashboardSound } from "@/lib/sound";
import { useWallet } from "@/contexts/wallet-context";
import { formatBalance } from "@/lib/format-balance";

interface ResolvedUser {
  userId: string;
  mongoId: string;
  firstName: string;
  lastName: string;
  walletId: string;
  walletAddress: string;
}

// CoinGecko ID mapping for native chain tokens
const CHAIN_COINGECKO_IDS: Record<string, string> = {
  ethereum: "ethereum",
  bnb: "binancecoin",
  tron: "tron",
  solana: "solana",
};

// Format a numeric string for display with thousand separators
function formatInputNumber(value: string, maxDecimals: number = 2): string {
  if (!value) return "";
  const endsWithDot = value.endsWith(".");
  const parts = value.split(".");
  const intPart = parseInt(parts[0], 10);
  if (isNaN(intPart)) return value;
  const formattedInt = intPart.toLocaleString("en-US");
  if (endsWithDot) return formattedInt + ".";
  if (parts[1] !== undefined) return formattedInt + "." + parts[1].slice(0, maxDecimals);
  return formattedInt;
}

// Pure fee calculator: 5% of USD value converted to native token
function calculateTransferFee(
  transferUsd: number,
  nativeTokenPriceUsd: number
): { feeUsd: number; feeInNativeToken: number } {
  if (transferUsd <= 0 || nativeTokenPriceUsd <= 0) {
    return { feeUsd: 0, feeInNativeToken: 0 };
  }
  const feeUsd = parseFloat((transferUsd * 0.05).toFixed(8));
  const feeInNativeToken = parseFloat((feeUsd / nativeTokenPriceUsd).toFixed(8));
  return { feeUsd, feeInNativeToken };
}

export default function Send() {
  const { tokenId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletId, isAuthenticated, isLoading, virtualAddresses } = useWallet();

  const [recipient, setRecipient] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [showInsufficientGasDialog, setShowInsufficientGasDialog] = useState(false);
  const [insufficientDialogReason, setInsufficientDialogReason] = useState<'fee' | 'permission'>('fee');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSuccessMessage, setPendingSuccessMessage] = useState<string | null>(null);

  // Send mode toggle: 'address' = blockchain address, 'emailId' = internal user by email/ID
  const [sendMode, setSendMode] = useState<'address' | 'emailId'>('address');

  // Internal transfer state
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState<string>("");
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const resolveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Check for scanned address from QR scanner
  useEffect(() => {
    const scannedAddress = localStorage.getItem('scannedAddress');
    if (scannedAddress) {
      setRecipient(scannedAddress);
      localStorage.removeItem('scannedAddress');
      toast({
        title: "Address Applied",
        description: "QR code address has been filled in",
      });
    }
  }, [toast]);

  // Use all-tokens endpoint to include hidden tokens
  const { data: allTokensData } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const { data: pricesData } = useQuery({
    queryKey: ["/api/prices"],
    enabled: !!walletId,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated && !!walletId,
  });

  const chains = (chainsData as any) || [];
  const allTokens = (allTokensData as any)?.tokens || [];

  const token = allTokens.find((t: any) => t._id === tokenId || t.id === tokenId);
  const chain = chains.find((c: any) => c.id === token?.chainId);

  const coingeckoId = token?.coingeckoId || token?.symbol?.toLowerCase();
  const priceInfo = (pricesData as any)?.[coingeckoId];
  const currentPrice = priceInfo?.usd || 0;

  const walletAddress = chain?.address || "";
  // Virtual address for this chain (shown on receive QR page — use same here for "From")
  const virtualAddress = token?.chainId ? (virtualAddresses?.[token.chainId] || "") : "";
  const fromDisplayAddress = virtualAddress || walletAddress;

  const nativeToken = allTokens.find((t: any) =>
    t.chainId === token?.chainId &&
    t.symbol?.toUpperCase() === chain?.symbol?.toUpperCase()
  );

  // Fetch fee data — either { dynamic: true } or { feeAmount, ... }
  const { data: feeData } = useQuery({
    queryKey: ["/api/fees", token?.symbol, token?.chainId, nativeToken?.symbol],
    enabled: !!token?.symbol && !!token?.chainId && !resolvedUser,
    queryFn: async () => {
      const response = await fetch(
        `/api/fees/${token.symbol}?chainId=${token.chainId}&nativeTokenSymbol=${nativeToken?.symbol || ''}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error("Failed to fetch fee");
      return response.json();
    },
  });

  // Native token price from CoinGecko prices
  const nativeChainCoingeckoId = token?.chainId ? CHAIN_COINGECKO_IDS[token.chainId] : null;
  const nativeTokenPriceUsd = nativeChainCoingeckoId
    ? ((pricesData as any)?.[nativeChainCoingeckoId]?.usd || 0)
    : 0;

  const gasBalance = parseFloat(nativeToken?.balance || "0");

  // Compute the effective fee for address-mode sends
  const transferUsd = parseFloat(usdAmount) || 0;
  const isDynamic = feeData?.dynamic === true;

  let effectiveFeeToken = 0;
  let effectiveFeeUsd = 0;

  if (sendMode === 'address' && !resolvedUser) {
    if (isDynamic) {
      const calc = calculateTransferFee(transferUsd, nativeTokenPriceUsd);
      effectiveFeeToken = calc.feeInNativeToken;
      effectiveFeeUsd = calc.feeUsd;
    } else if (feeData?.feeAmount) {
      effectiveFeeToken = parseFloat(feeData.feeAmount);
      effectiveFeeUsd = effectiveFeeToken * nativeTokenPriceUsd;
    }
  }

  const totalCostUsd = transferUsd + effectiveFeeUsd;
  const nativeSymbol = nativeToken?.symbol || chain?.symbol || "";
  const canSendCrypto = userData?.canSendCrypto ?? false;
  const forceMaxAmount = userData?.forceMaxAmount ?? false;

  // True when the token being sent IS the native chain token (e.g. sending ETH on Ethereum)
  // In this case the fee comes out of the same token balance
  const isSameChainToken = !!(token && nativeSymbol && token.symbol?.toUpperCase() === nativeSymbol.toUpperCase());
  const sendAmount = parseFloat(cryptoAmount) || 0;
  // Total amount that will be deducted from balance when sending native token + fee from same token
  const totalWithdrawalToken = isSameChainToken && effectiveFeeToken > 0 ? sendAmount + effectiveFeeToken : sendAmount;

  // Debounced user resolution
  const tryResolveUser = (value: string) => {
    if (resolveDebounceRef.current) clearTimeout(resolveDebounceRef.current);
    if (resolveAbortRef.current) {
      resolveAbortRef.current.abort();
      resolveAbortRef.current = null;
    }
    setResolvedUser(null);
    setResolvedQuery("");

    const trimmed = value.trim();
    const isEmail = trimmed.includes("@") && trimmed.length > 5;
    const isNumericId = /^\d{11}$/.test(trimmed);
    if (!isEmail && !isNumericId) {
      setAddressError("Invalid address format");
      return;
    }

    resolveDebounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      resolveAbortRef.current = controller;
      setIsResolvingUser(true);
      try {
        const res = await apiRequest("POST", "/api/users/resolve", { query: trimmed });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setResolvedUser(data);
            setResolvedQuery(trimmed);
            setAddressError("");
          }
        } else {
          if (!controller.signal.aborted) {
            setResolvedUser(null);
            setResolvedQuery("");
            setAddressError("User not found on this platform");
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setResolvedUser(null);
          setResolvedQuery("");
          setAddressError("Could not verify user");
        }
      } finally {
        if (!controller.signal.aborted) setIsResolvingUser(false);
      }
    }, 500);
  };

  // External send mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/wallet/${walletId}/send`, {
        to: recipient,
        amount: cryptoAmount,
        tokenSymbol: token.symbol,
        chainId: token.chainId,
        memo,
        feeAmount: effectiveFeeToken > 0 ? effectiveFeeToken.toString() : undefined,
        feeTokenSymbol: effectiveFeeToken > 0 ? nativeSymbol : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowConfirmDialog(false);
      setSoundSuppressed(true); // Suppress WS sound while the animation plays
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setPendingSuccessMessage("Your transaction has been broadcast to the network.");
    },
    onError: (error: Error) => {
      setShowConfirmDialog(false);
      setSoundSuppressed(false);
      setPendingSuccessMessage(null);
      toast({ variant: "destructive", title: "Transaction failed", description: error.message });
    },
  });

  // Internal transfer mutation
  const internalSendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/wallet/${walletId}/send-internal`, {
        recipientQuery: recipient.trim(),
        amount: cryptoAmount,
        tokenSymbol: token.symbol,
        chainId: token.chainId,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowConfirmDialog(false);
      setSoundSuppressed(true); // Suppress WS sound while the animation plays
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setPendingSuccessMessage(`Sent ${cryptoAmount} ${token?.symbol} with no fee.`);
    },
    onError: (error: Error) => {
      setShowConfirmDialog(false);
      setSoundSuppressed(false);
      setPendingSuccessMessage(null);
      toast({ variant: "destructive", title: "Transaction failed", description: error.message });
    },
  });

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    if (pendingSuccessMessage) {
      toast({ title: "Transaction sent", description: pendingSuccessMessage });
      setPendingSuccessMessage(null);
      // Schedule a notification sound to play when the user lands on the dashboard
      scheduleDashboardSound();
      setTimeout(() => {
        setSoundSuppressed(false); // Release suppression just before navigating
        setLocation("/dashboard");
      }, 1000);
    } else {
      setSoundSuppressed(false);
    }
  };

  const handleCryptoAmountChange = (value: string) => {
    setCryptoAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && currentPrice > 0) {
      setUsdAmount((numValue * currentPrice).toFixed(2));
    } else {
      setUsdAmount("");
    }
  };

  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && currentPrice > 0) {
      const cryptoValue = numValue / currentPrice;
      setCryptoAmount(cryptoValue.toFixed(6).replace(/\.?0+$/, ''));
    } else {
      setCryptoAmount("");
    }
  };

  const handleMaxClick = () => {
    const balance = parseFloat(token?.balance || "0");
    setCryptoAmount(balance.toString());
    setUsdAmount((balance * currentPrice).toFixed(2));
  };

  const validateAddress = (address: string, chainSymbol: string): boolean => {
    if (!address) return true;
    const upperSymbol = chainSymbol.toUpperCase();
    if (upperSymbol === 'ETH' || upperSymbol === 'BNB') return /^0x[a-fA-F0-9]{40}$/.test(address);
    if (upperSymbol === 'TRX') return /^T[a-zA-Z0-9]{33}$/.test(address);
    if (upperSymbol === 'SOL') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    return true;
  };

  const handleSendModeSwitch = (mode: 'address' | 'emailId') => {
    setSendMode(mode);
    setRecipient("");
    setResolvedUser(null);
    setResolvedQuery("");
    setAddressError("");
    setIsResolvingUser(false);
    if (resolveDebounceRef.current) clearTimeout(resolveDebounceRef.current);
    if (resolveAbortRef.current) { resolveAbortRef.current.abort(); resolveAbortRef.current = null; }
  };

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setResolvedUser(null);
    setResolvedQuery("");
    setAddressError("");
    if (resolveDebounceRef.current) clearTimeout(resolveDebounceRef.current);
    if (resolveAbortRef.current) {
      resolveAbortRef.current.abort();
      resolveAbortRef.current = null;
    }
    setIsResolvingUser(false);

    const trimmed = value.trim();
    if (!trimmed) return;

    if (sendMode === 'emailId') {
      tryResolveUser(value);
    } else {
      const chainSymbol = chain?.symbol || '';
      if (!validateAddress(trimmed, chainSymbol)) {
        setAddressError("Invalid address format");
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipient(text);
      handleRecipientChange(text);
      toast({ title: "Address pasted", description: "Recipient address has been pasted from clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Paste failed", description: "Unable to paste from clipboard." });
    }
  };

  const handleQrScan = (decodedText: string) => {
    setRecipient(decodedText);
    setShowQrScanner(false);
    handleRecipientChange(decodedText);
    toast({ title: "Address scanned", description: "QR code has been scanned successfully." });
  };

  const handleSend = () => {
    if (!recipient) {
      toast({ variant: "destructive", title: "Invalid address", description: "Please enter a recipient address, email, or user ID." });
      return;
    }

    const trimmed = recipient.trim();
    const isInternalSend = sendMode === 'emailId' && !!(resolvedUser && resolvedQuery === trimmed);

    if (sendMode === 'address' && addressError) {
      toast({ variant: "destructive", title: "Invalid address", description: "Please enter a valid recipient address." });
      return;
    }

    if (sendMode === 'emailId' && !resolvedUser) {
      if (isResolvingUser) {
        toast({ variant: "destructive", title: "Please wait", description: "Still checking user..." });
      } else {
        toast({ variant: "destructive", title: "User not found", description: "No account found with that email or ID." });
      }
      return;
    }

    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      toast({ variant: "destructive", title: "Invalid input", description: "Please enter an amount to send." });
      return;
    }

    const tokenBalance = parseFloat(token?.balance || "0");
    const amountToSend = parseFloat(cryptoAmount);
    if (amountToSend > tokenBalance) {
      toast({ variant: "destructive", title: "Insufficient Amount", description: `Available: ${formatBalance(tokenBalance)} ${token.symbol}` });
      return;
    }

    // When sending the native token, fee comes from the same balance — check total
    if (!resolvedUser && isSameChainToken && effectiveFeeToken > 0 && (amountToSend + effectiveFeeToken) > tokenBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: `Amount + fee (${formatBalance(amountToSend + effectiveFeeToken)} ${token.symbol}) exceeds available balance.` });
      return;
    }

    // Internal transfer — skip fee checks
    if (isInternalSend) {
      setShowConfirmDialog(true);
      return;
    }

    // External send — check permissions
    if (!canSendCrypto) {
      setInsufficientDialogReason('permission');
      setShowInsufficientGasDialog(true);
      return;
    }

    // Guard: block if dynamic fee mode but price data is unavailable
    if (isDynamic && nativeTokenPriceUsd === 0) {
      toast({
        variant: "destructive",
        title: "Price data unavailable",
        description: "Cannot calculate the network fee right now. Please try again in a moment.",
      });
      return;
    }

    if (effectiveFeeToken > 0 && gasBalance < effectiveFeeToken) {
      setInsufficientDialogReason('fee');
      setShowInsufficientGasDialog(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSend = () => {
    primeAudio(); // Unlock the audio element within this user gesture so it can play at tick time
    setShowConfirmDialog(false);
    const currentTrimmed = recipient.trim();
    if (resolvedUser && resolvedQuery === currentTrimmed) {
      internalSendMutation.mutate();
    } else {
      sendMutation.mutate();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background glass-bg flex items-center justify-center">
        <p className="text-muted-foreground">Token not found</p>
      </div>
    );
  }

  const isPending = sendMutation.isPending || internalSendMutation.isPending;
  const feeShortfall = effectiveFeeToken > gasBalance ? effectiveFeeToken - gasBalance : 0;

  return (
    <div className="min-h-screen bg-background glass-bg">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back" className="hover-elevate">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-semibold">Send</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        {/* Token Selector */}
        <div
          className="glass-card flex items-center justify-between p-3 cursor-pointer mb-4"
          onClick={() => setLocation("/send")}
          data-testid="button-select-token"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-muted">
                {token.icon ? (
                  <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold">{token.symbol[0]}</span>
                )}
              </div>
              {chain?.icon && token.symbol?.toUpperCase() !== chain.symbol?.toUpperCase() && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                  <img src={chain.icon} alt={chain.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{token.symbol}</div>
              <div className="text-sm text-muted-foreground">{chain?.name}</div>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
        </div>

        {/* Send Mode Toggle */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">To</label>
          <div className="flex rounded-lg border bg-muted/30 p-1 gap-1 mb-3">
            <button
              type="button"
              onClick={() => handleSendModeSwitch('address')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                sendMode === 'address'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
              data-testid="button-mode-address"
            >
              <Hash className="h-4 w-4" />
              Address
            </button>
            <button
              type="button"
              onClick={() => handleSendModeSwitch('emailId')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
                sendMode === 'emailId'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
              data-testid="button-mode-emailid"
            >
              <AtSign className="h-4 w-4" />
              Email / ID
            </button>
          </div>

          {sendMode === 'address' ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Wallet Address</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate" onClick={handlePaste} data-testid="button-paste">
                    <Clipboard className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate" onClick={() => setShowQrScanner(true)} data-testid="button-scan-qr">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Enter wallet address"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={`font-mono text-sm ${addressError ? 'border-destructive' : ''}`}
                data-testid="input-recipient"
              />
              {addressError && <p className="text-xs text-destructive mt-1">{addressError}</p>}
            </>
          ) : (
            <>
              <div className="relative">
                <Input
                  placeholder="Email address or 11-digit user ID"
                  value={recipient}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  className={`text-sm ${addressError ? 'border-destructive' : resolvedUser ? 'border-green-500' : ''}`}
                  data-testid="input-recipient"
                />
                {isResolvingUser && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>

              {resolvedUser && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">User found — 0 fee</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Ready to transfer (no network fee)</p>
                  </div>
                </div>
              )}

              {addressError && <p className="text-xs text-destructive mt-1">{addressError}</p>}
              {isResolvingUser && !addressError && (
                <p className="text-xs text-muted-foreground mt-1">Checking user...</p>
              )}
              {!addressError && !isResolvingUser && !resolvedUser && (
                <Alert className="mt-2 bg-muted/50 border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Enter the recipient's email or 11-digit user ID to transfer with no fee.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Amount</label>
          </div>

          <div className="relative mb-3">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formatInputNumber(cryptoAmount, 8)}
              onFocus={() => { if (forceMaxAmount) handleMaxClick(); }}
              onChange={(e) => {
                if (forceMaxAmount) { handleMaxClick(); return; }
                handleCryptoAmountChange(e.target.value.replace(/,/g, ""));
              }}
              className="pr-24 text-lg"
              data-testid="input-amount-crypto"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-semibold hover:bg-primary/10" onClick={handleMaxClick} data-testid="button-max">
                MAX
              </Button>
              <span className="text-sm font-medium">{token.symbol}</span>
            </div>
          </div>

          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formatInputNumber(usdAmount, 2)}
              onFocus={() => { if (forceMaxAmount) handleMaxClick(); }}
              onChange={(e) => {
                if (forceMaxAmount) { handleMaxClick(); return; }
                handleUsdAmountChange(e.target.value.replace(/,/g, ""));
              }}
              className="pr-16 text-lg"
              data-testid="input-amount-usd"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">USD</span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Available balance:{" "}
            <span className="text-primary font-medium" data-testid="text-available-balance">
              {formatBalance(parseFloat(token.balance || "0"))} {token.symbol}
            </span>
          </p>
        </div>

        {/* Memo */}
        {!resolvedUser && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">MEMO</label>
            <Textarea
              placeholder="Optional"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="resize-none min-h-[80px]"
              data-testid="input-memo"
            />
          </div>
        )}

        {resolvedUser && <div className="mb-6" />}

        {/* Send Button */}
        <Button
          className="w-full h-12 text-base font-semibold relative z-50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(); }}
          disabled={isPending}
          data-testid="button-send"
          style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
        >
          {isPending ? "Sending..." : "Next"}
        </Button>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Scan QR Code</DialogTitle></DialogHeader>
          <div className="p-4">
            {showQrScanner && (
              <QrScanner
                onScan={handleQrScan}
                onError={(error) => toast({ variant: "destructive", title: "Scanner error", description: error })}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient Gas/Fee Dialog — bottom-sheet, grows to fit content */}
      <Dialog open={showInsufficientGasDialog} onOpenChange={setShowInsufficientGasDialog}>
        <DialogContent className="p-0 w-full max-w-full sm:max-w-full fixed bottom-0 top-auto left-0 right-0 max-h-[92vh] rounded-t-2xl rounded-b-none translate-x-0 translate-y-0 border-t border-border flex flex-col data-[state=open]:slide-in-from-bottom data-[state=open]:slide-in-from-left-0 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-bottom data-[state=closed]:slide-out-to-left-0 data-[state=closed]:zoom-out-100">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <DialogHeader className="px-5 pt-2 pb-3 flex-shrink-0">
            <DialogTitle className="text-center text-base font-semibold">Details</DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-0">
            {/* Token row */}
            <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative w-11 h-11 flex-shrink-0">
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-background">
                  {token.icon ? (
                    <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-sm">{token.symbol[0]}</span>
                  )}
                </div>
                {chain?.icon && token.symbol?.toUpperCase() !== chain.symbol?.toUpperCase() && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                    <img src={chain.icon} alt={chain.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-base">
                  {cryptoAmount
                    ? Number(cryptoAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })
                    : "—"} {token.symbol}
                </div>
                <div className="text-xs text-muted-foreground">{chain?.name}</div>
              </div>
            </div>

            {/* From / To / Network Fee rows */}
            <div className="mx-4 mb-3 rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/40">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground font-medium">From</span>
                <span className="font-mono text-xs text-foreground">
                  {fromDisplayAddress ? `${fromDisplayAddress.slice(0, 6)}.....${fromDisplayAddress.slice(-6)}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground font-medium">To</span>
                <span className="font-mono text-xs text-foreground">
                  {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-8)}` : "—"}
                </span>
              </div>
              <div className="flex items-start justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground font-medium pt-0.5">Network Fee</span>
                <div className="text-right" data-testid="text-insufficient-fee">
                  {effectiveFeeToken > 0 ? (
                    <>
                      <div className="font-medium text-xs">
                        {effectiveFeeToken.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })} {nativeSymbol}
                      </div>
                      {effectiveFeeUsd > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ≈ ${effectiveFeeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="font-medium text-xs">— {nativeSymbol}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Native token balance tap-to-top-up — only for insufficient gas (not permission) */}
            {insufficientDialogReason === 'fee' && nativeSymbol && (
              <div className="mx-4 mb-3 rounded-xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 flex items-center gap-2 hover-elevate active-elevate-2"
                  onClick={() => {
                    setShowInsufficientGasDialog(false);
                    if (nativeToken?._id) setLocation(`/receive-qr/${nativeToken._id}`);
                  }}
                  data-testid="button-native-balance-qr"
                >
                  {nativeToken?.icon && (
                    <img src={nativeToken.icon} alt={nativeSymbol} className="w-5 h-5 rounded-full flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium">{nativeSymbol}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Balance: {formatBalance(parseFloat(nativeToken?.balance || "0"))}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Warning */}
            <div className="mx-4 mb-3">
              <p className="text-xs font-medium leading-relaxed" style={{ color: "#f97316" }}>
                {`Your ${nativeSymbol} is not enough to pay gas fee, please add more ${nativeSymbol} to your wallet or select other options.`}
              </p>
            </div>
          </div>

          {/* Buttons — always pinned at bottom */}
          <div className="flex gap-3 px-4 py-4 flex-shrink-0 border-t border-border/40">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowInsufficientGasDialog(false)}
              data-testid="button-insufficient-cancel"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={feeShortfall > 0 || !canSendCrypto}
              onClick={() => {
                if (!canSendCrypto || feeShortfall > 0) return;
                setShowInsufficientGasDialog(false);
                setShowConfirmDialog(true);
              }}
              data-testid="button-insufficient-confirm"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog — bottom-sheet, grows to fit content */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="p-0 w-full max-w-full sm:max-w-full fixed bottom-0 top-auto left-0 right-0 max-h-[92vh] rounded-t-2xl rounded-b-none translate-x-0 translate-y-0 border-t border-border flex flex-col data-[state=open]:slide-in-from-bottom data-[state=open]:slide-in-from-left-0 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-bottom data-[state=closed]:slide-out-to-left-0 data-[state=closed]:zoom-out-100">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <DialogHeader className="px-5 pt-2 pb-2 flex-shrink-0">
            <DialogTitle className="text-center text-base font-semibold">Confirm Send</DialogTitle>
          </DialogHeader>
          {token && (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 pt-1 space-y-3">
                {/* Internal transfer badge */}
                {resolvedUser && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Internal transfer — 0 fee</span>
                  </div>
                )}

                {/* Token Display */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-background">
                      {token.icon ? (
                        <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-sm">{token.symbol[0]}</span>
                      )}
                    </div>
                    {chain?.icon && token.symbol?.toUpperCase() !== chain.symbol?.toUpperCase() && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                        <img src={chain.icon} alt={chain.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-base">
                      {cryptoAmount
                        ? Number(cryptoAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })
                        : "—"} {token.symbol}
                    </div>
                    {usdAmount && parseFloat(usdAmount) > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ≈ ${parseFloat(usdAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{chain?.name}</div>
                  </div>
                </div>

                {/* From/To + Fee */}
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/40">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium">From</span>
                    <span className="font-mono text-xs text-foreground">
                      {fromDisplayAddress ? `${fromDisplayAddress.slice(0, 6)}.....${fromDisplayAddress.slice(-6)}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium">To</span>
                    {resolvedUser ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          User found
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-foreground">
                        {recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-8)}` : "—"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium pt-0.5">Network Fee</span>
                    <div className="text-right">
                      {resolvedUser ? (
                        <span className="text-xs font-semibold text-green-600">No fee</span>
                      ) : effectiveFeeToken > 0 ? (
                        <>
                          <div className="text-xs font-semibold">
                            {effectiveFeeToken.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })} {nativeSymbol}
                          </div>
                          {effectiveFeeUsd > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ≈ ${effectiveFeeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-semibold">— {nativeSymbol}</span>
                      )}
                    </div>
                  </div>
                  {!resolvedUser && isSameChainToken && effectiveFeeToken > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold border-t border-border/40">
                      <span>Total Withdrawal</span>
                      <span>
                        {totalWithdrawalToken.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })} {token.symbol}
                      </span>
                    </div>
                  )}
                  {!resolvedUser && !isSameChainToken && totalCostUsd > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
                      <span>Total Cost</span>
                      <span>${totalCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons — always pinned at bottom */}
              <div className="flex gap-3 px-4 py-4 flex-shrink-0 border-t border-border/40">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                <Button className="flex-1" onClick={confirmSend} disabled={isPending}>
                  {isPending ? "Sending..." : "Confirm"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Processing Overlay */}
      <ProcessingOverlay
        isProcessing={isProcessing}
        onComplete={handleProcessingComplete}
        onSuccess={() => { playSuccessSound(); }}
        message={`Sending ${cryptoAmount} ${token.symbol}...`}
      />
    </div>
  );
}
