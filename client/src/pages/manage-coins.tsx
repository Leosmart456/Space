import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Search, Plus, ArrowUp } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ManageCoins() {
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated, isLoading } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const { data: allTokensData } = useQuery({
    queryKey: ["/api/wallet", walletId, "all-tokens"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];
  const tokens = (allTokensData as any)?.tokens || [];

  // Filter tokens based on search
  const searchFilteredTokens = tokens.filter((token: any) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.contractAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: visible tokens first (by displayOrder ascending), hidden tokens after
  const filteredTokens = [...searchFilteredTokens].sort((a: any, b: any) => {
    const aVisible = a.isVisible !== false;
    const bVisible = b.isVisible !== false;
    if (aVisible && !bVisible) return -1;
    if (!aVisible && bVisible) return 1;
    // Both visible: sort by displayOrder
    if (aVisible && bVisible) {
      const aOrder = a.displayOrder ?? 999;
      const bOrder = b.displayOrder ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    }
    // Both hidden: alphabetical
    return a.name.localeCompare(b.name);
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ tokenId, isVisible }: { tokenId: string; isVisible: boolean }) => {
      const response = await fetch(`/api/wallet/${walletId}/tokens/${tokenId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isVisible }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update token visibility");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "all-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId] });
    },
  });

  const moveToTopMutation = useMutation({
    mutationFn: async ({ tokenId, displayOrder }: { tokenId: string; displayOrder: number }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/wallet/${walletId}/tokens/${tokenId}/order`,
        { displayOrder }
      );
      if (!response.ok) throw new Error("Failed to update token order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "all-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId, "portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", walletId] });
      toast({ title: "Token pinned to top", description: "This token will appear first in your wallet." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed", description: "Could not update token order." });
    },
  });

  const handleMoveToTop = (token: any) => {
    // Find the minimum displayOrder among all currently visible tokens (excluding this one)
    const visibleOrders = filteredTokens
      .filter((t: any) => t.id !== token.id && t.isVisible !== false)
      .map((t: any) => t.displayOrder ?? 999);
    const minOrder = visibleOrders.length > 0 ? Math.min(...visibleOrders) : 1;
    const newOrder = minOrder - 1;
    moveToTopMutation.mutate({ tokenId: token.id, displayOrder: newOrder });
  };

  if (!isAuthenticated || !walletId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
              className="hover-elevate"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-display font-semibold">Manage Coins</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Search and Add */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter token name or token contract address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tokens"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setLocation("/add-custom-token")}
            data-testid="button-add-token"
            className="shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {filteredTokens.map((token: any) => {
            const isVisible = token.isVisible !== false;
            return (
              <Card
                key={token.id}
                className="p-3 hover-elevate cursor-pointer"
                data-testid={`card-token-${token.symbol.toLowerCase()}-${token.chainId}`}
                onClick={() => setLocation(`/token/${token.symbol.toLowerCase()}/${token.chainId}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Token Icon with Chain Badge */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white/10">
                      {token.icon && !imageErrors[`token-${token.id}`] ? (
                        <img
                          src={token.icon}
                          alt={token.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => {
                            setImageErrors(prev => ({ ...prev, [`token-${token.id}`]: true }));
                          }}
                        />
                      ) : (
                        <span className="text-primary font-bold text-sm">{token.symbol[0]}</span>
                      )}
                    </div>
                    {/* Chain Badge */}
                    {(() => {
                      const chain = chains.find((c: any) => c.id === token.chainId);
                      const isNativeToken = token.symbol === chain?.symbol;
                      return chain?.icon && !isNativeToken ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                          {!imageErrors[`chain-${chain.id}`] ? (
                            <img
                              src={chain.icon}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={() => {
                                setImageErrors(prev => ({ ...prev, [`chain-${chain.id}`]: true }));
                              }}
                            />
                          ) : (
                            <span className="text-[8px] font-medium">{token.symbol[0]}</span>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {token.symbol}
                      {(() => {
                        const chain = chains.find((c: any) => c.id === token.chainId);
                        return chain?.symbol ? (
                          <span className="text-sm text-muted-foreground ml-1.5">
                            ({chain.symbol})
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {token.name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Move-to-top arrow — only shown for enabled (visible) tokens */}
                    {isVisible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover-elevate"
                        onClick={() => handleMoveToTop(token)}
                        disabled={moveToTopMutation.isPending}
                        title="Move to top"
                        data-testid={`button-pin-${token.symbol.toLowerCase()}-${token.chainId}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => {
                        toggleVisibilityMutation.mutate({ tokenId: token.id, isVisible: checked });
                      }}
                      data-testid={`switch-${token.symbol.toLowerCase()}-${token.chainId}`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tokens found</p>
          </div>
        )}
      </div>
    </div>
  );
}
