import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTransactionUSD } from "@/hooks/use-transaction-usd";
import { formatUSD, formatCrypto } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function TransactionDetail() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/transaction/:hash");
  const { walletId, isAuthenticated } = useWallet();
  const hash = params?.hash;

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/wallet", walletId, "transactions"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];
  const transaction = (transactions as any[]).find(tx => tx.hash === hash);
  const usdValue = useTransactionUSD(transaction);

  if (!isAuthenticated || !walletId || !hash) {
    return null;
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('transaction.notFound')}</p>
      </div>
    );
  }

  const isReceive = transaction.type === "receive";
  const isSend = transaction.type === "send";
  const isContract = transaction.type === "contract";
  const isConfirmed = transaction.status === "confirmed";
  const isPending = transaction.status === "pending";
  const isFailed = transaction.status === "failed";
  const chain = chains.find((c: any) => c.id === transaction.chainId);
  const chainName = chain?.name || transaction.chainId?.toUpperCase() || t('transaction.unknown');
  
  // Map chainId to native token symbol
  const nativeTokenMap: Record<string, string> = {
    'ethereum': 'ETH',
    'bnb': 'BNB',
    'tron': 'TRX',
    'solana': 'SOL',
  };
  const nativeToken = nativeTokenMap[transaction.chainId] || 'ETH';

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}.....${address.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
              className="hover-elevate"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {isContract ? t('transaction.smartContractCall') : t('transaction.transfer')}
            </h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Amount Section */}
      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-2xl text-center">
        <h2 className="text-4xl font-bold mb-2" data-testid="text-amount">
          {isReceive ? "+" : "-"}{formatCrypto(transaction.value)} {transaction.tokenSymbol}
        </h2>
        <p className="text-muted-foreground" data-testid="text-fiat-value">
          ≈ {formatUSD(usdValue.toString())}
        </p>
      </div>

      {/* Details Section */}
      <div className="container mx-auto px-3 sm:px-4 max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">{t('transaction.date')}</span>
                <span className="font-medium" data-testid="text-date">
                  {formatDate(transaction.timestamp)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">{t('transaction.status')}</span>
                <span className={`font-medium ${isConfirmed ? "text-success" : isPending ? "text-warning" : "text-destructive"}`} data-testid="text-status">
                  {isConfirmed ? t('transaction.completed') : isPending ? t('transaction.pending') : t('transaction.failed')}
                </span>
              </div>

              {(isSend || isReceive) && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground">{isReceive ? t('transaction.sender') : t('transaction.recipient')}</span>
                  <span className="font-medium text-sm" data-testid="text-address">
                    {isReceive
                      ? truncateAddress(transaction.fromVirtual || transaction.from)
                      : truncateAddress(transaction.toVirtual || transaction.to || transaction.from)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center justify-between p-4">
                <span className="text-muted-foreground">{t('transaction.networkFee')}</span>
                <span className="font-medium" data-testid="text-network-fee">
                  {transaction.networkFee || transaction.gasUsed || "0"} {nativeToken}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
