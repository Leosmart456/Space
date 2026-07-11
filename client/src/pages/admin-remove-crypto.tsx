import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chain } from "@shared/schema";
import AdminLayout from "@/components/admin-layout";

export default function AdminRemoveCrypto() {
  const { toast } = useToast();
  
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState("");
  const [searchType, setSearchType] = useState<"email" | "id">("email");
  const [previewUser, setPreviewUser] = useState<any | null>(null);

  const { data: chains } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

  const { data: tokensData } = useQuery({
    queryKey: ["/api/admin/tokens"],
  });

  const allTokens = (tokensData as any)?.tokens || [];

  useEffect(() => {
    const fetchUserPreview = async () => {
      const input = userId.trim();
      if (input.length > 0) {
        try {
          let response;
          if (searchType === "email") {
            response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.users && data.users.length > 0) {
                setPreviewUser(data.users[0]);
              } else {
                setPreviewUser(null);
              }
            } else {
              setPreviewUser(null);
            }
          } else {
            const isValidObjectId = input.length === 24 && /^[a-fA-F0-9]{24}$/.test(input);
            if (isValidObjectId) {
              response = await apiRequest("GET", `/api/admin/users/${input}`);
              if (response.ok) {
                const userData = await response.json();
                setPreviewUser(userData);
              } else {
                setPreviewUser(null);
              }
            } else {
              setPreviewUser(null);
            }
          }
        } catch (error) {
          setPreviewUser(null);
        }
      } else {
        setPreviewUser(null);
      }
    };

    const debounce = setTimeout(fetchUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [userId, searchType]);

  const removeCryptoMutation = useMutation({
    mutationFn: async (data: { userId: string; tokenSymbol: string; amount: string; chainId: string }) => {
      const res = await apiRequest("POST", "/api/admin/remove-crypto", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove crypto");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cryptocurrency removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserId("");
      setToken("");
      setAmount("");
      setChainId("");
      setPreviewUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !token || !amount || !chainId) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (userId.includes('@') && !previewUser) {
      toast({
        title: "User Not Found",
        description: "Please wait for user preview to load or verify the email address",
        variant: "destructive",
      });
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    const selectedToken = allTokens.find((t: any) => t.symbol === token);
    if (!selectedToken) {
      toast({
        title: "Invalid Token",
        description: "Please select a valid token",
        variant: "destructive",
      });
      return;
    }
    
    const resolvedUserId = previewUser?._id || userId;
    
    removeCryptoMutation.mutate({
      userId: resolvedUserId,
      tokenSymbol: selectedToken.symbol,
      amount: parsedAmount.toString(),
      chainId: chainId,
    });
  };

  return (
    <AdminLayout title="Remove Crypto">
      <div className="p-4">
        <Card className="border-destructive/50">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-destructive">Remove Cryptocurrency from User Account</CardTitle>
            <CardDescription className="text-xs">Deduct cryptocurrency from a user's wallet (no transaction record created)</CardDescription>
          </CardHeader>
          <CardContent className="py-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Search User By</Label>
                <Select value={searchType} onValueChange={(value: "email" | "id") => setSearchType(value)}>
                  <SelectTrigger data-testid="select-search-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="id">User ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{searchType === "email" ? "User Email" : "User ID"} *</Label>
                <Input
                  placeholder={searchType === "email" ? "Enter email (e.g., user@example.com)" : "Enter 24-character user ID"}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  data-testid="input-user-id"
                />
                {previewUser && (
                  <Card className="bg-yellow-500/10 border-yellow-500/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {previewUser.firstName?.[0]}{previewUser.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{previewUser.firstName} {previewUser.lastName}</p>
                          <p className="text-xs text-muted-foreground">{previewUser.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-2">
                <Label>Blockchain *</Label>
                <Select value={chainId} onValueChange={setChainId}>
                  <SelectTrigger data-testid="select-chain-id">
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains?.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name} ({chain.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Token *</Label>
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger data-testid="select-token">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allTokens
                      .filter((t: any) => !chainId || t.chainId === chainId)
                      .map((t: any, index: number) => (
                      <SelectItem key={`${t.chainId}-${t.symbol}-${index}`} value={t.symbol}>
                        <div className="flex items-center gap-2">
                          {t.logo && <img src={t.logo} alt={t.symbol} className="w-5 h-5 rounded-full" />}
                          <span>{t.name} ({t.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (in crypto) *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                />
              </div>

              <Button 
                type="submit" 
                variant="destructive"
                className="w-full"
                disabled={removeCryptoMutation.isPending}
                data-testid="button-remove-crypto"
              >
                {removeCryptoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Minus className="mr-2 h-4 w-4" />
                    Remove Cryptocurrency
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
