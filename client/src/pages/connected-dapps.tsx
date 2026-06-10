import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/wallet-context";

export default function ConnectedDapps() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();
  const [activeTab, setActiveTab] = useState<"web" | "mobile">("web");

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

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
              onClick={() => setLocation("/profile")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Connected dapps</h1>
            <div className="w-8" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("web")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "web"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
              data-testid="tab-web"
            >
              Web
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "mobile"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
              data-testid="tab-mobile"
            >
              Mobile
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon Placeholder */}
          <div className="mb-6 relative">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-16 w-16 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-500/20" />
              </div>
              <div className="h-16 w-16 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-yellow-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 w-16 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-purple-500/20" />
              </div>
              <div className="h-16 w-16 rounded-lg bg-green-500/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-green-500/20" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-background border-4 border-border flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-muted" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
            No dapp connections yet
          </h2>
          <p className="text-muted-foreground max-w-sm" data-testid="text-empty-description">
            The dapps you're connected to will appear here after you start using your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
