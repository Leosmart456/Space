import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wallet, Shield, Zap, Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
      {/* Theme toggle - top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Logo size="xl" className="drop-shadow-2xl" />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-semibold text-white mb-4 tracking-tight">
            Lumirra
          </h1>
          <p className="text-xl text-white/90 font-medium">
            Your Secure Crypto Vault
          </p>
        </div>

        {/* Action cards */}
        <div className="w-full max-w-md space-y-4 mb-12">
          <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-md border-white/20 p-6 hover-elevate">
            <Button
              size="lg"
              className="w-full text-lg font-semibold h-14"
              onClick={() => setLocation("/create-wallet")}
              data-testid="button-create-wallet"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Create New Wallet
            </Button>
          </Card>

          <Card className="bg-white/95 dark:bg-card/95 backdrop-blur-md border-white/20 p-6 hover-elevate">
            <Button
              size="lg"
              variant="outline"
              className="w-full text-lg font-semibold h-14 border-2"
              onClick={() => setLocation("/import-wallet")}
              data-testid="button-import-wallet"
            >
              Import Existing Wallet
            </Button>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="text-center text-white">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Secure & Private
            </h3>
            <p className="text-white/80 text-sm">
              Your keys, your crypto. Never stored on our servers.
            </p>
          </div>

          <div className="text-center text-white">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Globe className="h-8 w-8" />
              </div>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Multi-Chain
            </h3>
            <p className="text-white/80 text-sm">
              Support for Ethereum, BSC, Polygon and more chains.
            </p>
          </div>

          <div className="text-center text-white">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Zap className="h-8 w-8" />
              </div>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Fast & Easy
            </h3>
            <p className="text-white/80 text-sm">
              Send, receive and swap crypto in seconds.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-white/70 text-sm">
          <p>Protected by industry-standard encryption</p>
        </div>
      </div>
    </div>
  );
}
