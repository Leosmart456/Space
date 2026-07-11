import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowDown, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { useWallet } from "@/contexts/wallet-context";
import type { SwapOrder } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function SwapOrders() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useWallet();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Fetch all swap orders
  const { data: swapOrders, isLoading: ordersLoading } = useQuery<SwapOrder[]>({
    queryKey: ["/api/swap-orders"],
    enabled: !!isAuthenticated,
  });

  const formatOrderTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(",", "");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20 border-[hsl(var(--success))]/20" data-testid={`badge-status-completed`}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge variant="secondary" data-testid={`badge-status-${status}`}>
            <Clock className="h-3 w-3 mr-1" />
            {status === "pending" ? "Pending" : "Processing"}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" data-testid={`badge-status-failed`}>
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20 border-[hsl(var(--warning))]/20" data-testid={`badge-status-suspended`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline" data-testid={`badge-status-unknown`}>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background glass-bg pb-28">
      {/* Header */}
      <div className="glass-header sticky top-0 z-50">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/swap")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Swap History</h1>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Swap Orders List */}
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-3">
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Loading swap history...</div>
          </div>
        ) : swapOrders && swapOrders.length > 0 ? (
          swapOrders.map((order) => (
            <Card
              key={order.orderId}
              className="p-4 cursor-pointer hover-elevate active-elevate-2"
              onClick={() => setLocation(`/swap/orders/${order.orderId}`)}
              data-testid={`card-swap-order-${order.orderId}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-muted-foreground" data-testid={`text-order-time-${order.orderId}`}>
                      {formatOrderTime(order.orderTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Exchange */}
              <div className="space-y-2">
                {/* Source Token */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From</span>
                    <span className="font-medium" data-testid={`text-source-token-${order.orderId}`}>
                      {order.sourceToken}
                    </span>
                  </div>
                  <span className="font-semibold" data-testid={`text-source-amount-${order.orderId}`}>
                    {parseFloat(order.sourceAmount).toLocaleString()}
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Destination Token */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">To</span>
                    <span className="font-medium" data-testid={`text-dest-token-${order.orderId}`}>
                      {order.destToken}
                    </span>
                  </div>
                  <span className="font-semibold" data-testid={`text-dest-amount-${order.orderId}`}>
                    {parseFloat(order.destAmount || "0").toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order ID */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono" data-testid={`text-order-id-${order.orderId}`}>
                    {order.orderId.substring(0, 16)}...
                  </span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-state">
            <div className="text-muted-foreground mb-2">No swap history yet</div>
            <p className="text-sm text-muted-foreground">
              Your swap transactions will appear here
            </p>
            <Button
              className="mt-4"
              onClick={() => setLocation("/swap")}
              data-testid="button-go-to-swap"
            >
              Go to Swap
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
