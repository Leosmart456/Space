import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, ChevronDown, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCrypto, formatUSD } from "@/lib/utils";
import { useTransactionUSD } from "@/hooks/use-transaction-usd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

// Transaction row component that uses the hook
function TransactionRow({ tx, onClick }: { tx: any; onClick: () => void }) {
  const { t } = useTranslation();
  const isReceive = tx.type === "receive";
  const isSend = tx.type === "send";
  const isContract = tx.type === "contract";
  const isConfirmed = tx.status === "confirmed";
  const isPending = tx.status === "pending";
  const isFailed = tx.status === "failed";
  const usdValue = useTransactionUSD(tx);

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`row-transaction-${tx.hash}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isContract ? "bg-card border" :
        isReceive ? "bg-background border" :
        "bg-background border"
      }`}>
        {isContract ? (
          <FileText className="h-5 w-5 text-foreground" />
        ) : isReceive ? (
          <ArrowDownRight className="h-5 w-5 text-foreground" />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-foreground" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isContract ? t('history.smartContractCall') : t('history.transfer')}
          </span>
          {isConfirmed && (
            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
          )}
          {isPending && (
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          )}
          {isFailed && (
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {isReceive ? t('history.from') : isSend ? t('history.to') : t('history.from')}
          {truncateAddress(isReceive ? tx.from : tx.to || tx.from)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="font-medium">
          {isReceive ? "+" : "-"}{formatCrypto(tx.value)} {tx.tokenSymbol}
        </p>
        <p className="text-sm text-muted-foreground">
          ≈ {formatUSD(usdValue.toString())}
        </p>
      </div>
    </div>
  );
}

export default function History() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { walletId, isAuthenticated, isLoading } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/wallet", walletId, "transactions"],
    enabled: !!walletId,
  });

  const { data: chainsData } = useQuery({
    queryKey: ["/api/chains"],
  });

  const chains = (chainsData as any) || [];

  // Filter transactions by network
  const filteredTransactions = selectedNetwork === "all"
    ? transactions
    : (transactions as any[]).filter(tx => tx.chainId === selectedNetwork);

  // Group transactions by date
  const groupedTransactions = (filteredTransactions as any[]).reduce((groups: any, tx: any) => {
    const date = new Date(tx.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = t('history.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = t('history.yesterday');
    } else {
      dateKey = date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
    return groups;
  }, {});

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
            <h1 className="text-lg font-semibold">{t('history.title')}</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Network Filter */}
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-4xl">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-fit gap-2"
              data-testid="button-network-filter"
            >
              {selectedNetwork === "all" ? t('history.allNetworks') : chains.find((c: any) => c.id === selectedNetwork)?.name || t('history.allNetworks')}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setSelectedNetwork("all")}>
              {t('history.allNetworks')}
            </DropdownMenuItem>
            {chains.map((chain: any) => (
              <DropdownMenuItem key={chain.id} onClick={() => setSelectedNetwork(chain.id)}>
                {chain.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions List */}
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
        {transactionsLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]: [string, any]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{date}</h2>
                <div className="space-y-1">
                  {txs.map((tx: any) => (
                    <TransactionRow
                      key={tx.hash}
                      tx={tx}
                      onClick={() => setLocation(`/transaction/${tx.hash}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>{t('history.noTransactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
