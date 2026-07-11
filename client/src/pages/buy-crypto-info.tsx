import { ChevronLeft, CreditCard, Shield, Zap, Globe, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import buyMockup from "@assets/image_1761911657612.png";

export default function BuyCryptoInfo() {
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
          <h1 className="text-xl font-bold">Buy Crypto</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Buy Crypto with Your Card
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Purchase cryptocurrency instantly using credit cards, debit cards, or bank transfers. Fast, secure, and straightforward—no exchange accounts required.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              size="lg"
              className="bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
              data-testid="button-start-buying"
            >
              Buy Now
            </Button>
          </div>
          <div className="flex justify-center">
            <img 
              src={buyMockup} 
              alt="Buy Crypto Interface" 
              className="max-w-full h-auto rounded-2xl shadow-2xl border border-border"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Instant Processing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Receive cryptocurrency in your wallet within minutes. Most purchases are processed instantly or within 5-10 minutes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Bank-Level Security</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Powered by MoonPay with PCI-DSS compliance, 3D Secure authentication, and enterprise-grade encryption for all transactions.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Global Coverage</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Available in 160+ countries with support for 40+ fiat currencies including USD, EUR, GBP, CAD, AUD, and more.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <section>
            <h3 className="text-3xl font-bold mb-6">Why Buy Through Lumirra</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Traditional cryptocurrency exchanges require account creation, verification, and learning complex trading interfaces. Lumirra simplifies this process by integrating directly with MoonPay, a licensed payment processor trusted by millions of users worldwide.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Purchase crypto with the same ease as shopping online—enter an amount, select your payment method, complete verification, and receive cryptocurrency directly in your Lumirra wallet. No external accounts, no transfers between platforms.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Supported Payment Methods</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-lg bg-muted/50 border border-border flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Credit & Debit Cards</h4>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, and major card providers worldwide</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Bank Transfers</h4>
                  <p className="text-sm text-muted-foreground">ACH, SEPA, Faster Payments, and regional banking systems</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Apple Pay</h4>
                  <p className="text-sm text-muted-foreground">Quick checkout with biometric authentication</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/50 border border-border flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Google Pay</h4>
                  <p className="text-sm text-muted-foreground">Seamless mobile payment integration</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Available Cryptocurrencies</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-2">Ethereum Network (ERC-20)</h4>
                <p className="text-sm text-muted-foreground">ETH, USDT, USDC, DAI, LINK, UNI, and 100+ tokens</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-2">BNB Smart Chain (BEP-20)</h4>
                <p className="text-sm text-muted-foreground">BNB, BUSD, USDT, CAKE, and popular BSC tokens</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-2">TRON Network (TRC-20)</h4>
                <p className="text-sm text-muted-foreground">TRX, USDT, and TRON ecosystem tokens</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="font-semibold mb-2">Solana Network (SPL)</h4>
                <p className="text-sm text-muted-foreground">SOL, USDC, RAY, and Solana-based assets</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Fees & Limits</h3>
            <div className="p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border space-y-5">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Transaction Fees
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  MoonPay charges a service fee ranging from 1% to 4.5%, depending on your payment method and region. Card payments typically have higher fees than bank transfers. The exact fee is displayed before you confirm your purchase.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Purchase Limits
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Daily limits:</strong> $500-$10,000 depending on verification level
                  <br />
                  <strong>Monthly limits:</strong> $2,000-$50,000 with full verification
                  <br />
                  <strong>Minimum purchase:</strong> $30 equivalent in most currencies
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-green-500" />
                  Verification Requirements
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lower amounts ($500 or less) may only require basic information. Higher purchases require identity verification (KYC) to comply with global financial regulations. This includes government-issued ID and sometimes proof of address.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">How to Buy</h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <p className="text-muted-foreground pt-1">Navigate to Buy/Sell from your wallet dashboard</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <p className="text-muted-foreground pt-1">Select the cryptocurrency you want to purchase</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <p className="text-muted-foreground pt-1">Enter the amount in your local currency (USD, EUR, etc.)</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  4
                </div>
                <p className="text-muted-foreground pt-1">Choose your preferred payment method</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  5
                </div>
                <p className="text-muted-foreground pt-1">Complete identity verification if required</p>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                  6
                </div>
                <p className="text-muted-foreground pt-1">Confirm payment and receive crypto directly in your wallet</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Security & Privacy</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-lg bg-muted/30 flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">PCI-DSS Compliant</h4>
                  <p className="text-sm text-muted-foreground">Payment Card Industry Data Security Standard certified processing</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/30 flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">3D Secure</h4>
                  <p className="text-sm text-muted-foreground">Additional authentication layer for card transactions</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/30 flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">No Storage</h4>
                  <p className="text-sm text-muted-foreground">Lumirra never stores your payment information</p>
                </div>
              </div>
              <div className="p-5 rounded-lg bg-muted/30 flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Encrypted Transfer</h4>
                  <p className="text-sm text-muted-foreground">End-to-end encryption for all financial data</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] text-white text-center">
          <h3 className="text-3xl font-bold mb-3">Start Buying Today</h3>
          <p className="text-lg mb-6 opacity-90">
            Purchase cryptocurrency in minutes with your preferred payment method
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
