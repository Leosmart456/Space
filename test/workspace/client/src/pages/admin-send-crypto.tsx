import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chain } from "@shared/schema";
import AdminLayout from "@/components/admin-layout";

export default function AdminSendCrypto() {
  const { toast } = useToast();
  
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
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
            const isNumericId = /^\d{11}$/.test(input);
            if (isValidObjectId || isNumericId) {
              const searchParam = isNumericId ? `?query=${encodeURIComponent(input)}` : `/${input}`;
              if (isNumericId) {
                response = await apiRequest("GET", `/api/admin/users/search${searchParam}`);
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
                response = await apiRequest("GET", `/api/admin/users/${input}`);
                if (response.ok) {
                  const userData = await response.json();
                  setPreviewUser(userData);
                } else {
                  setPreviewUser(null);
                }
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

  const sendCryptoMutation = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      tokenSymbol: string; 
      amount: string; 
      chainId: string; 
      recipientAddress: string;
      fee?: string;
      note?: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/send-crypto", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send crypto");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cryptocurrency sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setUserId("");
      setToken("");
      setAmount("");
      setChainId("");
      setRecipient("");
      setFee("");
      setNote("");
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
    if (!userId || !token || !amount || !chainId || !recipient) {
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
    
    sendCryptoMutation.mutate({
      userId: resolvedUserId,
      tokenSymbol: selectedToken.symbol,
      amount: parsedAmount.toString(),
      chainId: chainId,
      recipientAddress: recipient,
      fee: fee || undefined,
      note: note || undefined,
    });
  };

  return (
    <AdminLayout title="Send Crypto">
      <div className="p-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Send Cryptocurrency from User Account</CardTitle>
            <CardDescription className="text-xs">Send crypto from a user's wallet to an external address (creates transaction record)</CardDescription>
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
                  <Card className="bg-blue-500/10 border-blue-500/50">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">✓</span>
                        </div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">User account found</p>
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
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Address *</Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  data-testid="input-recipient"
                />
              </div>

              <div className="space-y-2">
                <Label>Fee (Optional)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  data-testid="input-fee"
                />
              </div>

              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  data-testid="input-note"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={sendCryptoMutation.isPending}
                data-testid="button-send-crypto"
              >
                {sendCryptoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Cryptocurrency
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
