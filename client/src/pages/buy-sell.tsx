import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronDown, Check, Search, Landmark, CreditCard, Smartphone } from "lucide-react";
import { SiGooglepay, SiApplepay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/wallet-context";
import { useQuery } from "@tanstack/react-query";
import moonpayLogo from "@assets/0de69ab328f64be1b87dfdafb031fb57_1761696781474.png";

const FIAT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
];

const PAYMENT_METHODS = [
  { id: "bank_transfer", name: "Bank Transfer", logo: "bank" },
  { id: "debit_card", name: "Debit Card", logo: "card" },
  { id: "credit_card", name: "Credit Card", logo: "card" },
  { id: "google_pay", name: "Google Pay", logo: "google" },
  { id: "apple_pay", name: "Apple Pay", logo: "apple" },
  { id: "pix", name: "PIX", logo: "pix" },
];

// Chain address mapping - user's wallet address for each chain
const CHAIN_ADDRESSES: Record<string, string> = {
  "ethereum": "0xADBaa25dDce928FDa7E96c77f6c41C301a2501bb",
  "bnb": "0xADBaa25dDce928FDa7E96c77f6c41C301a2501bb",
  "tron": "TGDqQAP5bduoPKVgdbk7fGyW4DwEt3RRn8",
  "solana": "7nE4kXUvuzZXvE8C3Vm8YWKUypqLk6u8BvqBJxBp9kYW",
};

export default function BuySell() {
  const [, setLocation] = useLocation();
  const { walletAddress, walletId } = useWallet();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [fiatAmount, setFiatAmount] = useState("300");
  const [selectedFiat, setSelectedFiat] = useState(FIAT_CURRENCIES[0]);
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [showFiatSelector, setShowFiatSelector] = useState(false);
  const [showCryptoSelector, setShowCryptoSelector] = useState(false);
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [fiatSearch, setFiatSearch] = useState("");
  const [cryptoSearch, setCryptoSearch] = useState("");
  const [fiatSearchReadOnly, setFiatSearchReadOnly] = useState(true);
  const [cryptoSearchReadOnly, setCryptoSearchReadOnly] = useState(true);
  const [sellAmountReadOnly, setSellAmountReadOnly] = useState(true);
  const [sellAmount, setSellAmount] = useState("0");

  // Fetch wallet tokens (for sell section - user can only sell what they own)
  const { data: portfolioData } = useQuery({
    queryKey: ["/api/wallet", walletId, "portfolio"],
    enabled: !!walletId && activeTab === "sell",
  });

  // Fetch ALL available tokens (for buy section - show all possible tokens)
  const { data: availableTokensData } = useQuery({
    queryKey: ["/api/available-tokens"],
    enabled: activeTab === "buy",
  });

  // Fetch chains
  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  // Fetch prices for conversion
  const { data: pricesData } = useQuery({
    queryKey: ["/api/prices"],
  });

  const chains = (chainsData as any) || [];
  const portfolioTokens = (portfolioData as any)?.tokens || [];
  const availableTokens = (availableTokensData as any) || [];
  const tokens = activeTab === "buy" ? availableTokens : portfolioTokens;
  const prices = (pricesData as any) || {};

  // Handle URL parameters and set defaults
  useEffect(() => {
    // Check for mode parameter to switch tab
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'sell') {
      setActiveTab('sell');
    }
  }, []);

  // Reset selectedCrypto when switching tabs to ensure correct token list is used
  useEffect(() => {
    setSelectedCrypto(null);
  }, [activeTab]);

  // Set default to ETH or URL parameter token when tokens load
  useEffect(() => {
    if (tokens.length > 0 && !selectedCrypto) {
      // Check for URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      
      if (tokenParam) {
        // Try to find the token from URL parameter
        const paramToken = tokens.find((t: any) => 
          t.symbol.toUpperCase() === tokenParam.toUpperCase()
        );
        if (paramToken) {
          setSelectedCrypto(paramToken);
          return;
        }
      }
      
      // Default to ETH if no URL param or token not found
      const ethToken = tokens.find((t: any) => t.symbol === "ETH");
      if (ethToken) {
        setSelectedCrypto(ethToken);
      } else if (tokens.length > 0) {
        setSelectedCrypto(tokens[0]);
      }
    }
  }, [tokens, selectedCrypto, activeTab]);

  // Calculate crypto amount in real-time based on fiat amount (Buy tab)
  const calculateCryptoAmount = () => {
    if (!selectedCrypto || !fiatAmount || !prices) return "0.00";
    
    const tokenPrice = prices[selectedCrypto.coingeckoId];
    if (!tokenPrice) return "0.00";
    
    const fiatValue = parseFloat(fiatAmount) || 0;
    
    // Use the selected fiat currency's price if available, otherwise fall back to USD
    const currencyCode = selectedFiat.code.toLowerCase();
    const priceInSelectedCurrency = tokenPrice[currencyCode] || tokenPrice.usd;
    
    if (!priceInSelectedCurrency) return "0.00";
    
    const cryptoAmount = fiatValue / priceInSelectedCurrency;
    
    return cryptoAmount.toFixed(6);
  };
  
  // Calculate fiat amount in real-time based on crypto sell amount (Sell tab)
  const calculateFiatReceiveAmount = () => {
    if (!selectedCrypto || !sellAmount || !prices) return "0.00";
    
    const tokenPrice = prices[selectedCrypto.coingeckoId];
    if (!tokenPrice) return "0.00";
    
    const cryptoValue = parseFloat(sellAmount) || 0;
    
    // Use the selected fiat currency's price if available, otherwise fall back to USD
    const currencyCode = selectedFiat.code.toLowerCase();
    const priceInSelectedCurrency = tokenPrice[currencyCode] || tokenPrice.usd;
    
    if (!priceInSelectedCurrency) return "0.00";
    
    const fiatAmount = cryptoValue * priceInSelectedCurrency;
    
    return fiatAmount.toFixed(2);
  };

  const filteredFiatCurrencies = FIAT_CURRENCIES.filter(
    (currency) =>
      currency.code.toLowerCase().includes(fiatSearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(fiatSearch.toLowerCase())
  );

  const filteredCryptoTokens = tokens.filter((token: any) =>
    token.name.toLowerCase().includes(cryptoSearch.toLowerCase()) ||
    token.symbol.toLowerCase().includes(cryptoSearch.toLowerCase())
  );

  const handleBuy = () => {
    // Build dynamic MoonPay URL with selected values
    const params = new URLSearchParams({
      apiKey: "pk_live_GyP2tHBRCCE4g0C6HOZfX3ovu9xFMbd",
      baseCurrencyAmount: fiatAmount,
      baseCurrencyCode: selectedFiat.code.toLowerCase(),
      currencyCode: selectedCrypto.symbol.toLowerCase(),
      walletAddress: getReceivingAddress(),
    });
    
    const moonpayUrl = `https://buy.moonpay.com/?${params.toString()}`;
    window.open(moonpayUrl, "_blank");
  };

  // Get receiving address for selected crypto
  const getReceivingAddress = () => {
    if (!selectedCrypto) return walletAddress || CHAIN_ADDRESSES["ethereum"];
    const chainId = selectedCrypto.chainId;
    return CHAIN_ADDRESSES[chainId] || walletAddress || CHAIN_ADDRESSES["ethereum"];
  };

  // Get chain name for selected crypto
  const getChainName = () => {
    if (!selectedCrypto) return "Ethereum";
    const chain = chains.find((c: any) => c.id === selectedCrypto.chainId);
    return chain?.name || "Ethereum";
  };

  // Get chain symbol for selected crypto
  const getChainSymbol = () => {
    if (!selectedCrypto) return "ETH";
    const chain = chains.find((c: any) => c.id === selectedCrypto.chainId);
    return chain?.symbol || "ETH";
  };

  if (!selectedCrypto) {
    return null; // Loading state
  }

  const estimatedReceive = calculateCryptoAmount();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">Buy/Sell Crypto</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Buy/Sell Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "buy" ? "default" : "ghost"}
            onClick={() => setActiveTab("buy")}
            className="flex-1"
            data-testid="button-tab-buy"
          >
            Buy
          </Button>
          <Button
            variant={activeTab === "sell" ? "default" : "ghost"}
            onClick={() => setActiveTab("sell")}
            className="flex-1"
            data-testid="button-tab-sell"
          >
            Sell
          </Button>
        </div>

        {/* Buy Tab */}
        {activeTab === "buy" && (
          <div className="space-y-4">
            {/* Pay Section */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-sm text-muted-foreground mb-2">Pay</div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                  onClick={() => {
                    setFiatSearchReadOnly(true);
                    setFiatSearch("");
                    setShowFiatSelector(true);
                  }}
                  data-testid="button-select-fiat"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                    {selectedFiat.symbol}
                  </div>
                  <span className="font-semibold">{selectedFiat.code}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(e.target.value)}
                  className="text-right text-xl font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  data-testid="input-fiat-amount"
                />
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground">↕</span>
              </div>
            </div>

            {/* Estimated Receive Section */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-sm text-muted-foreground mb-2">Estimated Receive</div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                  onClick={() => {
                    setCryptoSearchReadOnly(true);
                    setCryptoSearch("");
                    setShowCryptoSelector(true);
                  }}
                  data-testid="button-select-crypto"
                >
                  <img
                    src={selectedCrypto.icon}
                    alt={selectedCrypto.code}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{selectedCrypto.symbol}</span>
                      <span className="text-xs text-muted-foreground">({getChainSymbol()})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{selectedCrypto.name}</div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-right text-xl font-semibold" data-testid="text-crypto-amount">
                  {estimatedReceive}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between py-3">
              <span className="font-medium">Payment Method</span>
              <Button
                variant="outline"
                onClick={() => setShowPaymentMethodSelector(true)}
                className="gap-2"
                data-testid="button-select-payment"
              >
                {selectedPaymentMethod.logo === "google" && <SiGooglepay className="h-5 w-5" />}
                {selectedPaymentMethod.logo === "apple" && <SiApplepay className="h-5 w-5" />}
                {selectedPaymentMethod.logo === "bank" && <Landmark className="h-5 w-5" />}
                {selectedPaymentMethod.logo === "card" && <CreditCard className="h-5 w-5" />}
                {selectedPaymentMethod.logo === "pix" && <Smartphone className="h-5 w-5" />}
                <span>{selectedPaymentMethod.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Receiving Address */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-success flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground mb-1">
                    Receiving Address ({getChainName()})
                  </div>
                  <div className="text-xs font-mono break-all" data-testid="text-receiving-address">
                    {getReceivingAddress()}
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleBuy}
              data-testid="button-buy"
            >
              Buy
            </Button>

            {/* Powered by MoonPay */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="text-provider-moonpay-buy">
              <span>Provided by:</span>
              <img src={moonpayLogo} alt="MoonPay" className="h-6" />
              <span>moonpay</span>
            </div>
          </div>
        )}

        {/* Sell Tab */}
        {activeTab === "sell" && (
          <div className="space-y-4">
            {/* Sell Section */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-sm text-muted-foreground mb-2">Sell</div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                  onClick={() => {
                    setCryptoSearchReadOnly(true);
                    setCryptoSearch("");
                    setShowCryptoSelector(true);
                  }}
                  data-testid="button-select-crypto-sell"
                >
                  <img
                    src={selectedCrypto.icon}
                    alt={selectedCrypto.code}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{selectedCrypto.symbol}</span>
                      <span className="text-xs text-muted-foreground">({getChainSymbol()})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Balance: {selectedCrypto.balance || "0"}</div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-right">
                  <Input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    onFocus={() => setSellAmountReadOnly(false)}
                    readOnly={sellAmountReadOnly}
                    className="text-right text-xl font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    data-testid="input-sell-amount"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-primary"
                    onClick={() => {
                      setSellAmount(selectedCrypto?.balance || "0");
                      setSellAmountReadOnly(false);
                    }}
                    data-testid="button-sell-max"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground">↕</span>
              </div>
            </div>

            {/* Estimated Receive Section */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-sm text-muted-foreground mb-2">Estimated Receive</div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                  onClick={() => {
                    setFiatSearchReadOnly(true);
                    setFiatSearch("");
                    setShowFiatSelector(true);
                  }}
                  data-testid="button-select-fiat-sell"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                    {selectedFiat.symbol}
                  </div>
                  <span className="font-semibold">{selectedFiat.code}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={calculateFiatReceiveAmount()}
                  readOnly
                  className="text-right text-xl font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  data-testid="input-receive-amount"
                />
              </div>
            </div>

            {/* Sell Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!sellAmount || parseFloat(sellAmount) <= 0}
              onClick={() => {
                // Open MoonPay sell URL
                const params = new URLSearchParams({
                  apiKey: "pk_live_GyP2tHBRCCE4g0C6HOZfX3ovu9xFMbd",
                  quoteCurrencyAmount: sellAmount,
                  baseCurrencyCode: selectedFiat.code.toLowerCase(),
                  quoteCurrencyCode: selectedCrypto.symbol.toLowerCase(),
                  refundWalletAddress: getReceivingAddress(),
                });
                const moonpayUrl = `https://sell.moonpay.com/?${params.toString()}`;
                window.open(moonpayUrl, "_blank");
              }}
              data-testid="button-sell"
            >
              Sell
            </Button>

            {/* Provided by MoonPay */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="text-provider-moonpay-sell">
              <span>Provided by:</span>
              <img src={moonpayLogo} alt="MoonPay" className="h-6" />
              <span>moonpay</span>
            </div>
          </div>
        )}
      </div>

      {/* Fiat Currency Selector Dialog */}
      <Dialog open={showFiatSelector} onOpenChange={setShowFiatSelector}>
        <DialogContent className="w-full h-full max-w-full max-h-full m-0 p-0 gap-0 rounded-none flex flex-col" data-testid="dialog-select-currency">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Select Currency</DialogTitle>
          </DialogHeader>
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={fiatSearch}
                onChange={(e) => setFiatSearch(e.target.value)}
                onFocus={() => setFiatSearchReadOnly(false)}
                readOnly={fiatSearchReadOnly}
                className="pl-10"
                data-testid="input-search-fiat"
              />
              {fiatSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-primary"
                  onClick={() => setFiatSearch("")}
                >
                  Paste
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {filteredFiatCurrencies.map((currency) => (
                <Button
                  key={currency.code}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    setSelectedFiat(currency);
                    setShowFiatSelector(false);
                    setFiatSearch("");
                  }}
                  data-testid={`button-fiat-${currency.code.toLowerCase()}`}
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-lg">
                    {currency.symbol}
                  </div>
                  <span className="font-semibold">{currency.code}</span>
                  {selectedFiat.code === currency.code && (
                    <Check className="h-5 w-5 text-success ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crypto Currency Selector Dialog */}
      <Dialog open={showCryptoSelector} onOpenChange={setShowCryptoSelector}>
        <DialogContent className="w-full h-full max-w-full max-h-full m-0 p-0 gap-0 rounded-none flex flex-col" data-testid="dialog-choose-currency">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Choose currency</DialogTitle>
          </DialogHeader>
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={cryptoSearch}
                onChange={(e) => setCryptoSearch(e.target.value)}
                onFocus={() => setCryptoSearchReadOnly(false)}
                readOnly={cryptoSearchReadOnly}
                className="pl-10"
                data-testid="input-search-crypto"
              />
              {cryptoSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-primary"
                  onClick={() => setCryptoSearch("")}
                >
                  Paste
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {filteredCryptoTokens.map((token: any) => {
                const chain = chains.find((c: any) => c.id === token.chainId);
                return (
                  <Button
                    key={`${token.id}`}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => {
                      setSelectedCrypto(token);
                      setShowCryptoSelector(false);
                      setCryptoSearch("");
                    }}
                    data-testid={`button-crypto-${token.symbol.toLowerCase()}`}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img
                        src={token.icon}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                      />
                      {chain?.icon && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                          <img 
                            src={chain.icon} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">
                        {token.symbol}
                        {chain?.symbol && (
                          <span className="text-xs text-muted-foreground ml-1.5">({chain.symbol})</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                    {selectedCrypto?.id === token.id && (
                      <Check className="h-5 w-5 text-success ml-auto" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selector Dialog */}
      <Dialog open={showPaymentMethodSelector} onOpenChange={setShowPaymentMethodSelector}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment-method">
          <DialogHeader>
            <DialogTitle>Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-2 text-muted-foreground"
              data-testid="button-payment-all"
            >
              All
            </Button>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3 border"
                  onClick={() => {
                    setSelectedPaymentMethod(method);
                    setShowPaymentMethodSelector(false);
                  }}
                  data-testid={`button-payment-${method.id}`}
                >
                  <div className="w-12 h-8 bg-white dark:bg-card rounded flex items-center justify-center">
                    {method.logo === "google" && <SiGooglepay className="h-6 w-6" />}
                    {method.logo === "apple" && <SiApplepay className="h-6 w-6" />}
                    {method.logo === "bank" && <Landmark className="h-6 w-6" />}
                    {method.logo === "card" && <CreditCard className="h-6 w-6" />}
                    {method.logo === "pix" && <Smartphone className="h-6 w-6" />}
                  </div>
                  <span className="font-medium">{method.name}</span>
                  {selectedPaymentMethod.id === method.id && (
                    <Check className="h-5 w-5 text-success ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
