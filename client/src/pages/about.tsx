import { ChevronLeft, Shield, Globe, Users, Zap, Lock, Heart, Code, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/Lumirra Logo Design (original)_1761875532047.png";

export default function About() {
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
          <h1 className="text-xl font-bold">About Lumirra</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-16">
          <img src={logoImage} alt="Lumirra" className="h-24 w-24 mx-auto mb-6" />
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#1677FF] to-[#2ED8FF] bg-clip-text text-transparent">
            Lumirra
          </h2>
          <p className="text-2xl text-muted-foreground font-light">
            Your Gateway to Decentralized Finance
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-16">
          <section>
            <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Cryptocurrency represents the future of finance—a world where individuals have direct control over their assets without intermediaries, borders, or limitations. However, accessing this future shouldn't require technical expertise or navigating complex platforms.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Lumirra exists to bridge the gap between cryptocurrency's promise and everyday usability. We're building a wallet that combines enterprise-grade security with consumer-friendly simplicity, making digital asset management accessible to everyone—from first-time buyers to experienced traders.
            </p>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Why Lumirra</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-xl mb-3">Self-Custody First</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Your private keys remain on your device, encrypted with your password. We never have access to your funds, cannot freeze your account, or prevent you from accessing your assets. True ownership means true control.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-xl mb-3">Multi-Chain Native</h4>
                <p className="text-muted-foreground leading-relaxed">
                  The blockchain ecosystem isn't limited to one network. Lumirra provides seamless access to Ethereum, BNB Smart Chain, TRON, and Solana from a single unified interface, eliminating the complexity of managing multiple wallets.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-xl mb-3">DeFi Made Simple</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Access decentralized exchanges, token swaps, and yield opportunities without leaving your wallet. No external accounts, no transferring between platforms—everything you need in one place.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-xl mb-3">Built for Everyone</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you're buying your first $50 of crypto or managing a diverse portfolio, Lumirra scales with you. Clean design, intelligent defaults, and advanced features when you need them.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Core Principles</h3>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Security Without Compromise</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement industry-standard cryptographic practices, undergo regular security audits, and follow open-source principles. Security isn't a feature—it's our foundation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Privacy by Design</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We don't track your transactions, sell your data, or require unnecessary personal information. Wallet operations happen on your device. Only essential data (encrypted wallet backups) touches our servers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">User-Centric Development</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Every feature we build starts with a simple question: "Does this make managing crypto easier?" Complexity for complexity's sake has no place in Lumirra.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Transparency & Trust</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe in open communication about how our wallet works, what data we collect (and don't), and our development roadmap. Trust is earned through transparency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Continuous Innovation</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    The crypto landscape evolves rapidly. We're committed to supporting new blockchains, integrating emerging DeFi protocols, and implementing features that enhance your wallet experience.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">What Sets Us Apart</h3>
            <div className="space-y-4">
              <div className="p-5 rounded-lg bg-muted/30 border-l-4 border-[#1677FF]">
                <h4 className="font-semibold mb-2">No Hidden Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Lumirra doesn't charge wallet creation, management, or transaction fees. You only pay blockchain network fees (which go to validators, not us) and transparent third-party service fees when using integrations like MoonPay.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-muted/30 border-l-4 border-[#1677FF]">
                <h4 className="font-semibold mb-2">Cross-Chain Simplified</h4>
                <p className="text-sm text-muted-foreground">
                  Managing multiple blockchain wallets is cumbersome. Lumirra provides a single interface for all your assets across Ethereum, BNB, TRON, and Solana, with automatic token discovery and real-time price tracking.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-muted/30 border-l-4 border-[#1677FF]">
                <h4 className="font-semibold mb-2">Built-In On-Ramps</h4>
                <p className="text-sm text-muted-foreground">
                  Buy cryptocurrency directly with credit cards, debit cards, or bank transfers. No need to create exchange accounts or transfer funds between platforms—purchase crypto and start using it immediately.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-muted/30 border-l-4 border-[#1677FF]">
                <h4 className="font-semibold mb-2">DEX Aggregation</h4>
                <p className="text-sm text-muted-foreground">
                  When swapping tokens, Lumirra automatically compares rates across multiple decentralized exchanges to ensure you get the best possible price for your trades.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold mb-6">Join Our Community</h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Lumirra is more than software—it's a community of individuals taking control of their financial future. Whether you're exploring cryptocurrency for the first time or you're an experienced DeFi user, we're here to support your journey into Web3.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're constantly improving based on user feedback. Have suggestions? Encounter issues? Want to see a specific feature? Reach out to our team—we're listening.
            </p>
          </section>
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#2ED8FF] text-white text-center">
          <h3 className="text-3xl font-bold mb-3">Ready to Take Control?</h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of users who manage their crypto with confidence
          </p>
          <Button
            onClick={() => window.location.href = "/create-account"}
            size="lg"
            className="bg-white text-[#1677FF] hover:bg-white/90"
            data-testid="button-create-account"
          >
            Create Your Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
