import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Copy, Check, Hash } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DefaultAvatar } from "@/components/default-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface WalletData {
  id: string;
  address: string;
  name: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: wallets, isLoading: isWalletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
    enabled: isAuthenticated,
  });

  const handleCopyAddress = () => {
    const wallet = wallets?.[0];
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleCopyUserId = () => {
    const uid = (user as User)?.userId;
    if (uid) {
      navigator.clipboard.writeText(uid);
      setCopiedUserId(true);
      toast({ title: "Copied!", description: "Your user ID has been copied to clipboard" });
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const menuItems = [
    {
      label: "View profile",
      path: "/profile/view-details",
      testId: "button-view-profile",
    },
    {
      label: "Connected dapps",
      path: "/profile/connected-dapps",
      testId: "button-connected-dapps",
    },
  ];

  if (isLoading || isWalletsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = `${user.firstName}${user.lastName}`;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover-elevate"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <DefaultAvatar
            profilePhoto={user.profilePhoto}
            firstName={user.firstName}
            lastName={user.lastName}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold" data-testid="text-username">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="text-email">
              {user.email}
            </p>
          </div>
        </div>

        {/* User ID Card */}
        {(user as User)?.userId && (
          <Card className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    User ID
                  </p>
                  <p className="text-sm font-mono tracking-widest" data-testid="text-user-id">
                    {(user as User).userId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 flex-shrink-0 transition-all duration-200"
                  onClick={handleCopyUserId}
                  data-testid="button-copy-user-id"
                >
                  {copiedUserId ? (
                    <Check className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <Copy className="h-4 w-4 transition-transform hover:scale-110" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet ID Card */}
        {wallets && wallets.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Wallet Address
                  </p>
                  <p
                    className="text-sm font-mono truncate"
                    data-testid="text-wallet-address"
                  >
                    {wallets[0].address}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 flex-shrink-0 transition-all duration-200"
                  onClick={handleCopyAddress}
                  data-testid="button-copy-address"
                >
                  {copiedAddress ? (
                    <Check className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <Copy className="h-4 w-4 transition-transform hover:scale-110" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Profile Button */}
        <Button
          className="w-full mb-6"
          onClick={() => setLocation("/profile/edit")}
          data-testid="button-edit-profile"
        >
          Edit profile
        </Button>

        {/* Menu Items */}
        <div className="space-y-0">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center justify-between p-4 text-left hover-elevate active-elevate-2 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
              data-testid={item.testId}
            >
              <span className="text-base">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
