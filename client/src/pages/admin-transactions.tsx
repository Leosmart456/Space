import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, ChevronLeft, ChevronRight, RefreshCw, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatCrypto } from "@/lib/utils";
import AdminLayout from "@/components/admin-layout";

interface AdminTransaction {
  _id: string;
  adminId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  action: "send" | "add";
  chainId: string;
  tokenSymbol: string;
  amount: string;
  amountUSD: string | null;
  recipientAddress: string | null;
  feeAmount: string | null;
  note: string | null;
  timestamp: string;
}

function TransactionRow({ tx, onClick }: { tx: AdminTransaction; onClick: () => void }) {
  const isSend = tx.action === "send";
  const isAdd = tx.action === "add";

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`row-admin-transaction-${tx._id}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isSend ? "bg-destructive/10" : "bg-success/10"
      }`}>
        {isSend ? (
          <ArrowUpRight className="h-5 w-5 text-destructive" />
        ) : (
          <ArrowDownRight className="h-5 w-5 text-success" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isSend ? "Sent Crypto" : "Added Crypto"}
          </span>
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
        </div>
        <p className="text-sm text-muted-foreground truncate">
          To: {tx.userId?.firstName} {tx.userId?.lastName} ({tx.userId?.email})
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(tx.timestamp)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`font-medium ${isSend ? "text-destructive" : "text-success"}`}>
          {isSend ? "-" : "+"}{formatCrypto(tx.amount)} {tx.tokenSymbol}
        </p>
        {tx.amountUSD && (
          <p className="text-sm text-muted-foreground">
            ≈ {formatUSD(tx.amountUSD)}
          </p>
        )}
        <Badge variant="outline" className="text-xs mt-1">
          {tx.chainId.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/admin/auth/me"],
  });

  useEffect(() => {
    if (!authLoading && !authData) {
      setLocation("/admin/login");
    }
  }, [authLoading, authData, setLocation]);

  const { data: transactionsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [`/api/admin/transactions?page=${page}`],
    enabled: !!authData,
    refetchInterval: 5000,
  });

  const transactions = (transactionsData as any)?.transactions || [];
  const totalPages = (transactionsData as any)?.totalPages || 1;

  const groupedTransactions = transactions.reduce((groups: any, tx: AdminTransaction) => {
    const date = new Date(tx.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
    return groups;
  }, {});

  if (authLoading || !authData) {
    return null;
  }

  return (
    <AdminLayout 
      title="Transactions" 
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh"
          className="hover-elevate"
        >
          <RefreshCw className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      }
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Send className="h-3 w-3" />
              Sent
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Plus className="h-3 w-3" />
              Added
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                  {date}
                </h3>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {(txs as AdminTransaction[]).map((tx) => (
                      <TransactionRow
                        key={tx._id}
                        tx={tx}
                        onClick={() => setLocation(`/admin/transaction/${tx._id}`)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm">Admin transactions will appear here when you send or add crypto to users.</p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
