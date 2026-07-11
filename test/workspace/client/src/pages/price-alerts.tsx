import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, BellOff, Plus, Trash2, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/wallet-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PriceAlert {
  _id: string;
  userId: string;
  tokenSymbol: string;
  tokenName: string;
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
}

export default function PriceAlerts() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  // Fetch price alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery<PriceAlert[]>({
    queryKey: ["/api/price-alerts"],
    enabled: isAuthenticated,
  });

  const alerts: PriceAlert[] = alertsData || [];

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (data: { tokenSymbol: string; tokenName: string; targetPrice: number; condition: string }) => {
      return await apiRequest("POST", "/api/price-alerts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
      toast({
        title: "Alert created",
        description: "Your price alert has been created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create price alert",
        variant: "destructive",
      });
    },
  });

  // Toggle alert mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/price-alerts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
      toast({
        title: "Alert updated",
        description: "Alert status has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/price-alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
      toast({
        title: "Alert deleted",
        description: "Price alert has been deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTokenSymbol("");
    setTokenName("");
    setTargetPrice("");
    setCondition("above");
  };

  const handleCreateAlert = () => {
    if (!tokenSymbol || !tokenName || !targetPrice) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      tokenSymbol: tokenSymbol.toUpperCase(),
      tokenName,
      targetPrice: price,
      condition,
    });
  };

  const handleToggleAlert = (alert: PriceAlert) => {
    toggleAlertMutation.mutate({ id: alert._id, isActive: !alert.isActive });
  };

  const handleDeleteAlert = (id: string) => {
    if (window.confirm("Are you sure you want to delete this price alert?")) {
      deleteAlertMutation.mutate(id);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-auth" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-page-title">Price Alerts</h1>
              <p className="text-sm text-muted-foreground">Get notified when prices hit your targets</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-alert"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoadingAlerts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-alerts" />
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No price alerts yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first alert to get notified when crypto prices reach your targets
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-alert">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert._id} data-testid={`card-alert-${alert._id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.condition === "above" ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className="font-semibold" data-testid={`text-alert-token-${alert._id}`}>
                          {alert.tokenName} ({alert.tokenSymbol})
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-alert-condition-${alert._id}`}>
                        Notify when price goes {alert.condition} ${alert.targetPrice.toLocaleString()}
                      </p>
                      {alert.lastNotifiedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last notified: {new Date(alert.lastNotifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => handleToggleAlert(alert)}
                          disabled={toggleAlertMutation.isPending}
                          data-testid={`switch-alert-active-${alert._id}`}
                        />
                        {alert.isActive ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert._id)}
                        disabled={deleteAlertMutation.isPending}
                        data-testid={`button-delete-alert-${alert._id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
            <DialogDescription>
              Get notified when a cryptocurrency reaches your target price
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token-symbol">Token Symbol</Label>
              <Input
                id="token-symbol"
                placeholder="BTC"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                data-testid="input-token-symbol"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                placeholder="Bitcoin"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                data-testid="input-token-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as "above" | "below")}>
                <SelectTrigger data-testid="select-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price goes above</SelectItem>
                  <SelectItem value="below">Price goes below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-price">Target Price (USD)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                placeholder="50000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                data-testid="input-target-price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel-alert"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlert}
              disabled={createAlertMutation.isPending}
              data-testid="button-submit-alert"
            >
              {createAlertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
