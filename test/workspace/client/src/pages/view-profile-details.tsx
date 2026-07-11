import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/contexts/wallet-context";

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
  bio?: string | null;
  createdAt: string;
  walletCreatedAt?: string;
}

export default function ViewProfileDetails() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useWallet();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = `${profile.firstName}${profile.lastName}`;
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const walletDate = profile.walletCreatedAt 
    ? new Date(profile.walletCreatedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : "Not created yet";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border sticky top-0 z-50 bg-background">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover-elevate"
              onClick={() => setLocation("/profile")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">View Profile</h1>
            <div className="w-8" />
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile.profilePhoto || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold mb-1" data-testid="text-display-name">
            {displayName}
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="text-email">
            {profile.email}
          </p>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-base" data-testid="text-bio">
                {profile.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
              <p className="text-base" data-testid="text-profile-email">
                {profile.email}
              </p>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Wallet Created
              </h3>
              <p className="text-base" data-testid="text-wallet-date">
                {walletDate}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
