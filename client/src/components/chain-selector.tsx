import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useChain } from "@/contexts/chain-context";
import { useQuery } from "@tanstack/react-query";

export function ChainSelector() {
  const { selectedChain, setSelectedChain } = useChain();

  // Fetch all available chains
  const { data: chains, isLoading } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chainList = (chains as any) || [];
  const currentChain = chainList.find((c: any) => c.id === selectedChain) || chainList[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 hover-elevate active-elevate-2"
          data-testid="button-chain-selector"
          disabled={isLoading}
        >
          <span className="text-base">{currentChain?.icon || "⟠"}</span>
          <span className="hidden sm:inline text-xs font-medium">
            {isLoading ? "Loading..." : (currentChain?.networkStandard || "ERC-20")}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Loading chains...
          </div>
        ) : chainList.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No chains available
          </div>
        ) : (
          chainList.map((chain: any) => (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`chain-option-${chain.id}`}
            >
              <span className="text-base">{chain.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{chain.name}</span>
                <span className="text-xs text-muted-foreground">{chain.networkStandard}</span>
              </div>
              {selectedChain === chain.id && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
