import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, Loader2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

export default function AdminUserFees() {
  const { toast } = useToast();
  
  const [userId, setUserId] = useState("");
  const [searchType, setSearchType] = useState<"email" | "id">("email");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userFees, setUserFees] = useState<any[]>([]);
  const [loadingUserFees, setLoadingUserFees] = useState(false);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({});
  const [feePercentages, setFeePercentages] = useState<Record<string, string>>({});

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
                setSelectedUser(data.users[0]);
              } else {
                setSelectedUser(null);
              }
            } else {
              setSelectedUser(null);
            }
          } else {
            const isValidObjectId = input.length === 24 && /^[a-fA-F0-9]{24}$/.test(input);
            if (isValidObjectId) {
              response = await apiRequest("GET", `/api/admin/users/${input}`);
              if (response.ok) {
                const userData = await response.json();
                setSelectedUser(userData);
              } else {
                setSelectedUser(null);
              }
            } else {
              setSelectedUser(null);
            }
          }
        } catch (error) {
          setSelectedUser(null);
        }
      } else {
        setSelectedUser(null);
      }
    };

    const debounce = setTimeout(fetchUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [userId, searchType]);

  const fetchUserFees = async (userId: string) => {
    setLoadingUserFees(true);
    try {
      const response = await apiRequest("GET", `/api/admin/user-fees/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserFees(data || []);
      } else {
        setUserFees([]);
      }
    } catch (error) {
      console.error("Failed to fetch user fees:", error);
      setUserFees([]);
    } finally {
      setLoadingUserFees(false);
    }
  };

  useEffect(() => {
    if (selectedUser?._id) {
      fetchUserFees(selectedUser._id);
    } else {
      setUserFees([]);
    }
  }, [selectedUser?._id]);

  const updateFeeMutation = useMutation({
    mutationFn: async ({ userId, tokenSymbol, chainId, feeAmount, feePercentage }: { 
      userId: string; 
      tokenSymbol: string; 
      chainId: string;
      feeAmount?: string; 
      feePercentage?: string 
    }) => {
      const res = await apiRequest("POST", `/api/admin/user-fees`, {
        userId,
        tokenSymbol,
        chainId,
        feeAmount: feeAmount ? parseFloat(feeAmount).toString() : "0",
        feePercentage: feePercentage ? parseFloat(feePercentage) : 0,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update fee");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User fee updated successfully",
      });
      if (selectedUser?._id) {
        fetchUserFees(selectedUser._id);
      }
      setEditingFee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveFee = (tokenSymbol: string, chainId: string) => {
    if (!selectedUser?._id) return;
    
    updateFeeMutation.mutate({
      userId: selectedUser._id,
      tokenSymbol,
      chainId,
      feeAmount: feeAmounts[`${chainId}-${tokenSymbol}`],
      feePercentage: feePercentages[`${chainId}-${tokenSymbol}`],
    });
  };

  return (
    <AdminLayout title="User Fees">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Manage User Transaction Fees</CardTitle>
            <CardDescription className="text-xs">Set custom transaction fees for specific users</CardDescription>
          </CardHeader>
          <CardContent className="py-3 space-y-4">
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
              <Label>{searchType === "email" ? "User Email" : "User ID"}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchType === "email" ? "Enter email..." : "Enter 24-character user ID..."}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-search"
                />
              </div>
            </div>

            {selectedUser && (
              <Card className="bg-primary/10 border-primary/50">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <p className="text-xs text-muted-foreground font-mono">ID: {selectedUser._id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {selectedUser && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Token Fees for {selectedUser.firstName}</CardTitle>
              <CardDescription className="text-xs">
                {loadingUserFees ? "Loading fees..." : `${userFees.length} custom fees configured`}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-3">
              {loadingUserFees ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {allTokens.map((token: any) => {
                    const existingFee = userFees.find((f: any) => f.tokenSymbol === token.symbol && f.chainId === token.chainId);
                    const isEditing = editingFee === `${token.chainId}-${token.symbol}`;
                    
                    return (
                      <Card key={`${token.chainId}-${token.symbol}`} className="hover-elevate">
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {token.logo && (
                                <img src={token.logo} alt={token.symbol} className="w-6 h-6 rounded-full" />
                              )}
                              <div>
                                <p className="font-semibold text-sm">{token.symbol}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{token.chainId}</p>
                              </div>
                            </div>
                            
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="Amount"
                                    value={feeAmounts[`${token.chainId}-${token.symbol}`] || ""}
                                    onChange={(e) => setFeeAmounts({ ...feeAmounts, [`${token.chainId}-${token.symbol}`]: e.target.value })}
                                    className="w-24 h-8 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="% Fee"
                                    value={feePercentages[`${token.chainId}-${token.symbol}`] || ""}
                                    onChange={(e) => setFeePercentages({ ...feePercentages, [`${token.chainId}-${token.symbol}`]: e.target.value })}
                                    className="w-24 h-8 text-xs"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveFee(token.symbol, token.chainId)}
                                  disabled={updateFeeMutation.isPending}
                                  className="h-8"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingFee(null)}
                                  className="h-8"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="text-right text-xs">
                                  {existingFee ? (
                                    <>
                                      <p>Amount: {existingFee.feeAmount ?? "N/A"}</p>
                                      <p>Percent: {existingFee.feePercentage ?? "N/A"}%</p>
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">Default</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingFee(`${token.chainId}-${token.symbol}`);
                                    setFeeAmounts({ ...feeAmounts, [`${token.chainId}-${token.symbol}`]: existingFee?.feeAmount?.toString() || "" });
                                    setFeePercentages({ ...feePercentages, [`${token.chainId}-${token.symbol}`]: existingFee?.feePercentage?.toString() || "" });
                                  }}
                                  className="h-7"
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
