import { ChevronLeft, RefreshCw, Shield, Zap, TrendingUp, ArrowDownUp, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import swapMockup from "@assets/image_1761911686745.png";

export default function SwapsInfo() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Token Swaps</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Swap Tokens at the Best Rates
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Trade cryptocurrencies seamlessly with access to deep liquidity pools and competitive pricing from leading decentralized exchanges.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              size="lg"
              className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
              data-testid="button-start-swapping"
            >
              Start Swapping
            </Button>
          </div>
          <div className="flex justify-center">
            <img 
              src={swapMockup} 
              alt="Swap Interface" 
              className="max-w-full h-auto rounded-2xl shadow-2xl border border-border"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Best Market Prices</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aggregated rates from multiple liquidity sources ensure you always get the most competitive prices for your trades.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Instant Execution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Swaps execute in seconds with optimized smart contract interactions, minimizing wait times and maximizing efficiency.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Self-Custody</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your assets never leave your wallet during swaps. Non-custodial architecture means you maintain full control at all times.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <section>
            <h3 className="text-3xl font-bold mb-6">How Swaps Work</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Lumirra connects to decentralized exchange (DEX) protocols to enable peer-to-peer token exchanges without intermediaries. When you swap tokens, smart contracts automatically match your trade with available liquidity pools, executing the exchange at current market rates.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our aggregation technology scans multiple DEX protocols simultaneously to find optimal pricing and routing for your trade, ensuring you receive the maximum output for your input tokens.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Supported Networks</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">Ethereum (ERC-20)</h4>
                <p className="text-sm text-muted-foreground">Access to Uniswap, SushiSwap, and other leading Ethereum DEXs</p>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">BNB Smart Chain (BEP-20)</h4>
                <p className="text-sm text-muted-foreground">Trade on PancakeSwap and BSC's vibrant DeFi ecosystem</p>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">TRON (TRC-20)</h4>
                <p className="text-sm text-muted-foreground">Fast, low-cost swaps through TRON's network protocols</p>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">Solana (SPL)</h4>
                <p className="text-sm text-muted-foreground">Lightning-fast trades on Raydium, Orca, and Jupiter</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Key Features</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-5 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ArrowDownUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Price Aggregation</h4>
                  <p className="text-sm text-muted-foreground">Compare real-time rates from multiple DEXs to ensure optimal pricing for every swap.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-5 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Slippage Protection</h4>
                  <p className="text-sm text-muted-foreground">Set custom slippage tolerance (1%-5%) to control acceptable price variations during trade execution.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-5 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Transaction Preview</h4>
                  <p className="text-sm text-muted-foreground">Review exchange rates, network fees, and estimated output before confirming any transaction.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Understanding Swap Costs</h3>
            <div className="p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Network Fees (Gas)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each blockchain charges transaction fees to process swaps. These fees vary based on network congestion and transaction complexity. Ethereum typically has higher fees than BNB Chain, TRON, or Solana.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Liquidity Provider Fees</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  DEX protocols charge small fees (typically 0.1%-0.3%) that go to liquidity providers. These fees are built into the exchange rate you see.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Slippage</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Price changes can occur between transaction submission and confirmation. Your slippage tolerance setting determines the maximum acceptable price difference.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">How to Swap</h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <p className="text-muted-foreground pt-1">Select the token you want to trade from (Pay section)</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <p className="text-muted-foreground pt-1">Choose the token you want to receive (Receive section)</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <p className="text-muted-foreground pt-1">Enter the amount you wish to swap</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  4
                </div>
                <p className="text-muted-foreground pt-1">Review the exchange rate, fees, and expected output</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  5
                </div>
                <p className="text-muted-foreground pt-1">Adjust slippage tolerance if needed (default: 3%)</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  6
                </div>
                <p className="text-muted-foreground pt-1">Confirm the swap and wait for blockchain confirmation</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] text-white text-center">
          <h3 className="text-3xl font-bold mb-3">Ready to Swap?</h3>
          <p className="text-lg mb-6 opacity-90">
            Access decentralized exchange liquidity directly from your wallet
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            size="lg"
            className="bg-white text-[#1677FF] hover:bg-white/90"
            data-testid="button-go-to-wallet"
          >
            Open Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
