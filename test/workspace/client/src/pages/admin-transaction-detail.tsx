import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatUSD, formatCrypto } from "@/lib/utils";

export default function AdminTransactionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/transaction/:id");
  const transactionId = params?.id;

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/admin/auth/me"],
  });

  useEffect(() => {
    if (!authLoading && !authData) {
      setLocation("/admin/login");
    }
  }, [authLoading, authData, setLocation]);

  const { data: transaction, isLoading } = useQuery({
    queryKey: [`/api/admin/transactions/${transactionId}`],
    enabled: !!authData && !!transactionId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];
  const tx = transaction as any;

  if (authLoading || !authData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Transaction not found</p>
      </div>
    );
  }

  const isSend = tx.action === "send";
  const chain = chains.find((c: any) => c.id === tx.chainId);

  const nativeTokenMap: Record<string, string> = {
    "ethereum": "ETH",
    "bnb": "BNB",
    "tron": "TRX",
    "solana": "SOL",
  };
  const nativeToken = nativeTokenMap[tx.chainId] || "ETH";

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 10)}...${address.substring(address.length - 7)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin/transactions")}
              data-testid="button-back"
              className="hover-elevate"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Transfer</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-2xl text-center">
        <h2 className="text-4xl font-bold mb-2" data-testid="text-amount">
          -{formatCrypto(tx.amount)} {tx.tokenSymbol}
        </h2>
        {tx.amountUSD && (
          <p className="text-muted-foreground" data-testid="text-fiat-value">
            ≈ {formatUSD(tx.amountUSD)}
          </p>
        )}
      </div>

      <div className="container mx-auto px-3 sm:px-4 max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium" data-testid="text-date">
                  {formatDate(tx.timestamp)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-success" data-testid="text-status">
                  Completed
                </span>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-sm" data-testid="text-recipient-address">
                  {truncateAddress(tx.recipientAddress || tx.userId?.walletAddress || "")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium" data-testid="text-network-fee">
                  {tx.feeAmount || "0.00000423"} {nativeToken}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
