import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, ScanLine, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AddCustomToken() {
  const [, setLocation] = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [contractAddress, setContractAddress] = useState("");
  const [showNetworkSheet, setShowNetworkSheet] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [networkSearch, setNetworkSearch] = useState("");
  
  // Show error popup automatically when contract address is entered
  useEffect(() => {
    if (selectedNetwork && contractAddress.length > 10) {
      setShowErrorAlert(true);
    }
  }, [contractAddress, selectedNetwork]);

  // Fetch available chains
  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];

  // Filter networks based on search
  const filteredNetworks = chains.filter((chain: any) =>
    chain.name.toLowerCase().includes(networkSearch.toLowerCase())
  );

  // Group networks - Hot networks first
  const hotNetworks = ["ethereum", "bnb", "tron", "solana"];
  const hotChains = filteredNetworks.filter((chain: any) =>
    hotNetworks.includes(chain.id)
  );
  const otherChains = filteredNetworks.filter((chain: any) =>
    !hotNetworks.includes(chain.id)
  );

  const selectedChain = chains.find((c: any) => c.id === selectedNetwork);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/manage-coins")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Add Custom Token</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Network Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Network</label>
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-4"
            onClick={() => setShowNetworkSheet(true)}
            data-testid="button-select-network"
          >
            <span className={!selectedNetwork ? "text-muted-foreground" : ""}>
              {selectedNetwork ? selectedChain?.name : "Select Network"}
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Contract Address */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Contract Address</label>
          <div className="relative">
            <Input
              placeholder="Enter the contract address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="pr-12 h-12"
              data-testid="input-contract-address"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              data-testid="button-scan-qr"
            >
              <ScanLine className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          {contractAddress && selectedNetwork && (
            <p className="text-sm text-destructive mt-2">
              Token information not found
            </p>
          )}
        </div>
      </div>

      {/* Network Selection Sheet */}
      <Sheet open={showNetworkSheet} onOpenChange={setShowNetworkSheet}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 pt-4 pb-3 border-b">
              <div className="flex items-center justify-center relative">
                <SheetTitle>Select Network</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNetworkSheet(false)}
                  data-testid="button-close-sheet"
                  className="absolute right-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Search */}
            <div className="px-4 py-3 border-b">
              <Input
                placeholder="Search"
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="h-11"
                data-testid="input-search-network"
              />
            </div>

            {/* Network List */}
            <div className="flex-1 overflow-y-auto">
              {/* Hot Networks */}
              {hotChains.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-sm text-muted-foreground">Hot</div>
                  {hotChains.map((chain: any) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedNetwork(chain.id);
                        setShowNetworkSheet(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover-elevate active-elevate-2"
                      data-testid={`button-network-${chain.id}`}
                    >
                      {chain.icon && (
                        <img
                          src={chain.icon}
                          alt={chain.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <span className="font-medium">{chain.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Other Networks */}
              {otherChains.length > 0 && (
                <div>
                  {hotChains.length > 0 && (
                    <div className="px-4 py-2 text-sm text-muted-foreground border-t mt-2">
                      A
                    </div>
                  )}
                  {otherChains.map((chain: any) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedNetwork(chain.id);
                        setShowNetworkSheet(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover-elevate active-elevate-2"
                      data-testid={`button-network-${chain.id}`}
                    >
                      {chain.icon && (
                        <img
                          src={chain.icon}
                          alt={chain.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <span className="font-medium">{chain.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Error Alert Dialog */}
      <AlertDialog open={showErrorAlert} onOpenChange={setShowErrorAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Failed to retrieve token information.
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              (code=205)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setShowErrorAlert(false)}
              className="w-full sm:w-auto"
              data-testid="button-ok"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
