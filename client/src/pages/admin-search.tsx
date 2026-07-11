import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

export default function AdminSearch() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"email" | "id">("email");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async ({ query, type }: { query: string; type: "email" | "id" }) => {
      if (type === "email") {
        const res = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Search failed");
        }
        return res.json();
      } else {
        const isValidObjectId = query.length === 24 && /^[a-fA-F0-9]{24}$/.test(query);
        if (!isValidObjectId) {
          throw new Error("Invalid wallet ID format. Must be 24 hex characters.");
        }
        const res = await apiRequest("GET", `/api/admin/users/by-wallet/${query}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Search failed");
        }
        return res.json();
      }
    },
    onSuccess: (data) => {
      setIsSearching(false);
      if (Array.isArray(data.users)) {
        setSearchResults(data.users);
      } else if (data._id) {
        setSearchResults([data]);
      } else {
        setSearchResults([]);
      }
    },
    onError: (error: Error) => {
      setIsSearching(false);
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
      setSearchResults([]);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedUser(null);
      return;
    }
    setSearchResults([]);
    setSelectedUser(null);
    setIsSearching(true);
    searchMutation.mutate({ query: searchQuery, type: searchType });
  };

  return (
    <AdminLayout title="Search Users">
      <div className="p-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Search Users</CardTitle>
            <CardDescription className="text-xs">Search by email or wallet ID</CardDescription>
          </CardHeader>
          <CardContent className="py-3 space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="space-y-2">
                <Label>Search Type</Label>
                <Select
                  value={searchType}
                  onValueChange={(value: "email" | "id") => setSearchType(value)}
                >
                  <SelectTrigger data-testid="select-search-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="id">Wallet ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchType === "email" ? "Enter email..." : "Enter 24-character wallet ID..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Button type="submit" disabled={isSearching} data-testid="button-search">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Results ({searchResults.length})</h3>
                {searchResults.map((user: any) => (
                  <Card 
                    key={user._id} 
                    className={`hover-elevate cursor-pointer ${selectedUser?._id === user._id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedUser(user)}
                    data-testid={`user-result-${user._id}`}
                  >
                    <CardContent className="py-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {user._id}</p>
                        <p className="text-xs">Wallets: {user.wallets?.length || 0}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedUser && (
              <Card className="border-primary">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Selected User Details</CardTitle>
                </CardHeader>
                <CardContent className="py-3 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="font-mono text-sm break-all">{selectedUser._id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">PIN</Label>
                    <p className="font-mono text-primary font-semibold">{selectedUser.plainPassword || "Not set"}</p>
                  </div>
                  {selectedUser.wallets?.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                      <p className="font-mono text-sm break-all">{selectedUser.wallets[0].address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
