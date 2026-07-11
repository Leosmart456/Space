import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { 
  Menu, Users, Search, Plus, Minus, Send, EyeOff, 
  DollarSign, Mail, MessageSquare, History, LogOut,
  ChevronRight, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

const navItems = [
  { path: "/admin", label: "All Users", icon: Users },
  { path: "/admin/search", label: "Search Users", icon: Search },
  { path: "/admin/add-crypto", label: "Add Crypto", icon: Plus },
  { path: "/admin/remove-crypto", label: "Remove Crypto", icon: Minus },
  { path: "/admin/send-crypto", label: "Send Crypto", icon: Send },
  { path: "/admin/silent-add", label: "Silent Add", icon: EyeOff },
  { path: "/admin/user-fees", label: "User Fees", icon: DollarSign },
  { path: "/admin/messages", label: "Messages", icon: Mail },
  { path: "/admin/support-chat", label: "Support Chat", icon: MessageSquare },
  { path: "/admin/transactions", label: "Transaction History", icon: History },
  { path: "/admin/withdrawal-approvals", label: "Pending Withdrawals", icon: Clock },
];

export default function AdminLayout({ children, title, headerActions }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: currentUser, isLoading: isLoadingAuth, error: authError } = useQuery<User>({
    queryKey: ["/api/admin/auth/me"],
    retry: false,
  });

  const { data: allUsersData } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 5000,
  });

  const { data: adminTransactionsData } = useQuery({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 5000,
  });

  const { data: supportChatData } = useQuery({
    queryKey: ["/api/admin/support-chat"],
    refetchInterval: 5000,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["/api/admin/messages"],
    refetchInterval: 10000,
  });

  const { data: withdrawalApprovalsData } = useQuery({
    queryKey: ["/api/admin/withdrawal-approvals"],
    refetchInterval: 15000,
  });

  const allUsers = (allUsersData as any)?.users || [];
  const adminTransactionsTotal = (adminTransactionsData as any)?.total || 0;
  const supportChats = (supportChatData as any)?.chats || [];
  const unreadChats = supportChats.filter((chat: any) => 
    chat.messages?.some((msg: any) => !msg.isFromAdmin && !msg.readByAdmin)
  ).length;
  const unreadMessages = (messagesData as any)?.messages?.filter((msg: any) => msg.status === 'pending').length || 0;
  const pendingWithdrawals = (withdrawalApprovalsData as any)?.approvals?.length || 0;

  useEffect(() => {
    if (authError || (!isLoadingAuth && !currentUser)) {
      setLocation("/admin/login");
    }
  }, [authError, isLoadingAuth, currentUser, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/auth/logout");
      queryClient.clear();
      setLocation("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMenuOpen(true)}
              data-testid="button-admin-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">Admin Menu</SheetTitle>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-2 pb-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dashboard
                </p>
                <div className="grid grid-cols-2 gap-2 px-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{allUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{adminTransactionsTotal}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="px-2">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Navigation
                </p>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location === item.path || 
                      (item.path === "/admin" && location === "/admin");
                    const Icon = item.icon;
                    
                    let badgeCount = 0;
                    if (item.path === "/admin/support-chat") badgeCount = unreadChats;
                    if (item.path === "/admin/messages") badgeCount = unreadMessages;
                    if (item.path === "/admin/transactions") badgeCount = adminTransactionsTotal;
                    if (item.path === "/admin/withdrawal-approvals") badgeCount = pendingWithdrawals;

                    return (
                      <SheetClose asChild key={item.path}>
                        <Link href={item.path}>
                          <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover-elevate"
                            }`}
                            data-testid={`nav-${item.path.replace("/admin/", "").replace("/admin", "users")}`}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {badgeCount > 0 && (
                              <Badge 
                                variant={isActive ? "secondary" : "default"} 
                                className="h-5 min-w-[20px] px-1.5 text-xs"
                              >
                                {badgeCount}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 opacity-50" />
                          </div>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="border-t p-4">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main className="pb-20">
        {children}
      </main>
    </div>
  );
}
