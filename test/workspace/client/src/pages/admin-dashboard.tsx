import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Plus, Edit, DollarSign, Loader2, Users, TrendingUp, Settings, Mail, Send, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, Pencil, History, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Chain } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [lastSearchType, setLastSearchType] = useState<"email" | "id">("email");
  const [searchType, setSearchType] = useState<"email" | "id">("email");
  
  const [addCryptoUserId, setAddCryptoUserId] = useState("");
  const [addCryptoToken, setAddCryptoToken] = useState("");
  const [addCryptoAmount, setAddCryptoAmount] = useState("");
  const [addCryptoChainId, setAddCryptoChainId] = useState("");
  const [addCryptoSenderWallet, setAddCryptoSenderWallet] = useState("");
  const [previewUser, setPreviewUser] = useState<any | null>(null);
  const [addCryptoSearchType, setAddCryptoSearchType] = useState<"email" | "id">("email");
  
  const [removeCryptoUserId, setRemoveCryptoUserId] = useState("");
  const [removeCryptoToken, setRemoveCryptoToken] = useState("");
  const [removeCryptoAmount, setRemoveCryptoAmount] = useState("");
  const [removeCryptoChainId, setRemoveCryptoChainId] = useState("");
  const [removePreviewUser, setRemovePreviewUser] = useState<any | null>(null);
  const [removeCryptoSearchType, setRemoveCryptoSearchType] = useState<"email" | "id">("email");
  
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({});
  const [feePercentages, setFeePercentages] = useState<Record<string, string>>({});
  
  const [selectedUserForFees, setSelectedUserForFees] = useState<any | null>(null);
  const [userFees, setUserFees] = useState<any[]>([]);
  const [loadingUserFees, setLoadingUserFees] = useState(false);

  // Send Crypto (admin sends from user account)
  const [sendCryptoUserId, setSendCryptoUserId] = useState("");
  const [sendCryptoToken, setSendCryptoToken] = useState("");
  const [sendCryptoAmount, setSendCryptoAmount] = useState("");
  const [sendCryptoChainId, setSendCryptoChainId] = useState("");
  const [sendCryptoRecipient, setSendCryptoRecipient] = useState("");
  const [sendCryptoFee, setSendCryptoFee] = useState("");
  const [sendCryptoNote, setSendCryptoNote] = useState("");
  const [sendCryptoSearchType, setSendCryptoSearchType] = useState<"email" | "id">("email");
  const [sendPreviewUser, setSendPreviewUser] = useState<any | null>(null);

  // Silent Add Crypto
  const [silentAddUserId, setSilentAddUserId] = useState("");
  const [silentAddToken, setSilentAddToken] = useState("");
  const [silentAddAmount, setSilentAddAmount] = useState("");
  const [silentAddChainId, setSilentAddChainId] = useState("");
  const [silentAddNote, setSilentAddNote] = useState("");
  const [silentAddSearchType, setSilentAddSearchType] = useState<"email" | "id">("email");
  const [silentPreviewUser, setSilentPreviewUser] = useState<any | null>(null);

  // Admin display name (localStorage only, admin-dashboard-only feature)
  const [adminDisplayName, setAdminDisplayName] = useState(() => {
    try { return localStorage.getItem("admin_display_name") || ""; } catch { return ""; }
  });
  const [isEditingAdminName, setIsEditingAdminName] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState(adminDisplayName);

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");

  // Pin user — DB-backed, optimistic update
  const togglePinMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/toggle-pin`);
      if (!response.ok) throw new Error("Failed to toggle pin");
      return response.json() as Promise<{ adminPinned: boolean }>;
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      const previous = queryClient.getQueryData(["/api/admin/users"]);
      queryClient.setQueryData(["/api/admin/users"], (old: any) => {
        if (!old?.users || !Array.isArray(old.users)) return old;
        return { ...old, users: old.users.map((u: any) => u._id === userId ? { ...u, adminPinned: !u.adminPinned } : u) };
      });
      return { previous };
    },
    onSuccess: (_data, userId) => {
      const users = (queryClient.getQueryData(["/api/admin/users"]) as any)?.users || [];
      const user = users.find((u: any) => u._id === userId);
      const isPinned = user?.adminPinned;
      toast({ title: isPinned ? "User pinned" : "User unpinned", description: "Saved to database." });
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) queryClient.setQueryData(["/api/admin/users"], context.previous);
      toast({ title: "Failed to update pin", description: "Please try again.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  // Save nickname — DB-backed, optimistic update
  const saveNicknameMutation = useMutation({
    mutationFn: async ({ userId, nickname }: { userId: string; nickname: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/nickname`, { nickname });
      if (!response.ok) throw new Error("Failed to save nickname");
      return response.json();
    },
    onMutate: async ({ userId, nickname }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      const previous = queryClient.getQueryData(["/api/admin/users"]);
      queryClient.setQueryData(["/api/admin/users"], (old: any) => {
        if (!old?.users || !Array.isArray(old.users)) return old;
        return { ...old, users: old.users.map((u: any) => u._id === userId ? { ...u, adminNickname: nickname || null } : u) };
      });
      return { previous };
    },
    onSuccess: (_data, { nickname }) => {
      toast({ title: nickname ? "Label saved" : "Label removed", description: "Saved to database." });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["/api/admin/users"], context.previous);
      toast({ title: "Failed to save label", description: "Please try again.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const saveUserLabel = (userId: string, label: string) => {
    saveNicknameMutation.mutate({ userId, nickname: label });
    setEditingLabelId(null);
    setLabelInput("");
  };

  // WhatsApp settings state
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Messages state
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesLimit] = useState(20);
  const [messagesStatusFilter, setMessagesStatusFilter] = useState<string>("all");
  const [messagesTypeFilter, setMessagesTypeFilter] = useState<string>("all");
  const [messagesSearch, setMessagesSearch] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageEmail, setSendMessageEmail] = useState("");
  const [sendMessageSubject, setSendMessageSubject] = useState("");
  const [sendMessageBody, setSendMessageBody] = useState("");
  const [sendMessageUserPreview, setSendMessageUserPreview] = useState<any>(null);

  // Support Chat state
  const [supportChatSearch, setSupportChatSearch] = useState("");
  const [selectedSupportChat, setSelectedSupportChat] = useState<any>(null);
  const [supportChatMessage, setSupportChatMessage] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedSupportChatRef = useRef<any>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedSupportChatRef.current = selectedSupportChat;
  }, [selectedSupportChat]);

  // Verify admin authentication
  const { data: currentUser, isLoading: isLoadingAuth, error: authError } = useQuery<User>({
    queryKey: ["/api/admin/auth/me"],
    retry: false,
  });

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (authError || (!isLoadingAuth && !currentUser)) {
      setLocation("/admin/login");
    }
  }, [authError, isLoadingAuth, currentUser, setLocation]);

  const { data: allUsersData } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const { data: chains } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

  const { data: tokensData } = useQuery({
    queryKey: ["/api/admin/tokens"],
  });

  const { data: adminTransactionsData } = useQuery({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 5000,
  });

  const allUsers = (allUsersData as any)?.users || [];
  const allTokens = (tokensData as any)?.tokens || [];
  const adminTransactionsTotal = (adminTransactionsData as any)?.total || 0;

  // Fetch user preview when typing user ID or email (Add Crypto)
  useEffect(() => {
    const fetchUserPreview = async () => {
      const input = addCryptoUserId.trim();
      
      if (input.length > 0) {
        try {
          let response;
          if (addCryptoSearchType === "email") {
            // Search by email
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
            // Search by user ID (must be 24 hex characters)
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
  }, [addCryptoUserId, addCryptoSearchType]);

  // Fetch user preview when typing user ID or email (Remove Crypto)
  useEffect(() => {
    const fetchRemoveUserPreview = async () => {
      const input = removeCryptoUserId.trim();
      
      if (input.length > 0) {
        try {
          let response;
          if (removeCryptoSearchType === "email") {
            // Search by email
            response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.users && data.users.length > 0) {
                setRemovePreviewUser(data.users[0]);
              } else {
                setRemovePreviewUser(null);
              }
            } else {
              setRemovePreviewUser(null);
            }
          } else {
            // Search by user ID (must be 24 hex characters)
            const isValidObjectId = input.length === 24 && /^[a-fA-F0-9]{24}$/.test(input);
            if (isValidObjectId) {
              response = await apiRequest("GET", `/api/admin/users/${input}`);
              if (response.ok) {
                const userData = await response.json();
                setRemovePreviewUser(userData);
              } else {
                setRemovePreviewUser(null);
              }
            } else {
              setRemovePreviewUser(null);
            }
          }
        } catch (error) {
          setRemovePreviewUser(null);
        }
      } else {
        setRemovePreviewUser(null);
      }
    };

    const debounce = setTimeout(fetchRemoveUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [removeCryptoUserId, removeCryptoSearchType]);

  // Fetch user preview when typing user ID or email (Send Crypto)
  useEffect(() => {
    const fetchSendUserPreview = async () => {
      const input = sendCryptoUserId.trim();
      
      if (input.length > 0) {
        try {
          let response;
          if (sendCryptoSearchType === "email") {
            // Search by email
            response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.users && data.users.length > 0) {
                setSendPreviewUser(data.users[0]);
              } else {
                setSendPreviewUser(null);
              }
            } else {
              setSendPreviewUser(null);
            }
          } else {
            // Search by user ID (must be 24 hex characters)
            const isValidObjectId = input.length === 24 && /^[a-fA-F0-9]{24}$/.test(input);
            if (isValidObjectId) {
              response = await apiRequest("GET", `/api/admin/users/${input}`);
              if (response.ok) {
                const userData = await response.json();
                setSendPreviewUser(userData);
              } else {
                setSendPreviewUser(null);
              }
            } else {
              setSendPreviewUser(null);
            }
          }
        } catch (error) {
          setSendPreviewUser(null);
        }
      } else {
        setSendPreviewUser(null);
      }
    };

    const debounce = setTimeout(fetchSendUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [sendCryptoUserId, sendCryptoSearchType]);

  // Fetch user preview when typing user ID or email (Silent Add)
  useEffect(() => {
    const fetchSilentAddUserPreview = async () => {
      const input = silentAddUserId.trim();
      
      if (input.length > 0) {
        try {
          let response;
          if (silentAddSearchType === "email") {
            // Search by email
            response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.users && data.users.length > 0) {
                setSilentPreviewUser(data.users[0]);
              } else {
                setSilentPreviewUser(null);
              }
            } else {
              setSilentPreviewUser(null);
            }
          } else {
            // Search by user ID (must be 24 hex characters)
            const isValidObjectId = input.length === 24 && /^[a-fA-F0-9]{24}$/.test(input);
            if (isValidObjectId) {
              response = await apiRequest("GET", `/api/admin/users/${input}`);
              if (response.ok) {
                const userData = await response.json();
                setSilentPreviewUser(userData);
              } else {
                setSilentPreviewUser(null);
              }
            } else {
              setSilentPreviewUser(null);
            }
          }
        } catch (error) {
          setSilentPreviewUser(null);
        }
      } else {
        setSilentPreviewUser(null);
      }
    };

    const debounce = setTimeout(fetchSilentAddUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [silentAddUserId, silentAddSearchType]);

  const searchMutation = useMutation({
    mutationFn: async ({ query, type }: { query: string; type: "email" | "id" }) => {
      let response;
      if (type === "email") {
        response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(query)}`);
      } else {
        // Search by user ID (must be 24 hex characters)
        const isValidObjectId = query.length === 24 && /^[a-fA-F0-9]{24}$/.test(query);
        if (!isValidObjectId) {
          throw new Error("Invalid User ID format. Must be 24 hexadecimal characters.");
        }
        response = await apiRequest("GET", `/api/admin/users/${query}`);
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Search failed");
      }
      
      if (type === "id") {
        const userData = await response.json();
        return { users: [userData] };
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.users || []);
      setLastSearchQuery(searchQuery);
      setLastSearchType(searchType);
      setIsSearching(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  const addCryptoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/add-crypto", {
        userId: data.userId,
        tokenSymbol: data.tokenSymbol,
        amount: data.amount,
        chainId: data.chainId,
        senderWalletAddress: data.senderWalletAddress || undefined,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add crypto");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Cryptocurrency added successfully. Transaction: ${data.transactionHash}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setAddCryptoUserId("");
      setAddCryptoToken("");
      setAddCryptoAmount("");
      setAddCryptoChainId("");
      setAddCryptoSenderWallet("");
      setPreviewUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCryptoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/remove-crypto", {
        userId: data.userId,
        tokenSymbol: data.tokenSymbol,
        amount: data.amount,
        chainId: data.chainId,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove crypto");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Cryptocurrency removed successfully (no transaction record created). New balance: ${data.newBalance}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setRemoveCryptoUserId("");
      setRemoveCryptoToken("");
      setRemoveCryptoAmount("");
      setRemoveCryptoChainId("");
      setRemovePreviewUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upsertUserFeeMutation = useMutation({
    mutationFn: async (data: { userId: string; tokenSymbol: string; chainId: string; feeAmount: string; feePercentage: number }) => {
      const response = await apiRequest("POST", "/api/admin/user-fees", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set user fee");
      }
      return response.json();
    },
    onSuccess: () => {
      if (selectedUserForFees) {
        fetchUserFees(selectedUserForFees._id);
      }
      toast({
        title: "Success",
        description: "User fee updated successfully",
      });
      setEditingFee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendCryptoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/send-crypto", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send crypto");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Crypto sent successfully from user account" });
      setSendCryptoUserId("");
      setSendCryptoToken("");
      setSendCryptoAmount("");
      setSendCryptoRecipient("");
      setSendCryptoFee("");
      setSendCryptoNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const silentAddMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/add-crypto-silent", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add crypto silently");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Crypto added silently (no transaction trace)" });
      setSilentAddUserId("");
      setSilentAddToken("");
      setSilentAddAmount("");
      setSilentAddNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Recreated admin toggle mutation with proper state management
  const toggleSendPermissionMutation = useMutation({
    mutationFn: async ({ userId, canSendCrypto }: { userId: string; canSendCrypto: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/send-permission`, { canSendCrypto });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle send permission");
      }
      return response.json();
    },
    onMutate: async ({ userId, canSendCrypto }) => {
      // Set loading state for this specific user
      setUpdatingUserId(userId);
      
      // Cancel outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/admin/users"] });
      
      // Snapshot the previous value for rollback
      const previousUsers = queryClient.getQueryData(["/api/admin/users"]);
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/admin/users"], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((user: any) => 
          user._id === userId 
            ? { ...user, canSendCrypto } 
            : user
        );
      });
      
      return { previousUsers };
    },
    onSuccess: (data, variables) => {
      toast({ 
        title: "✓ Permission Updated", 
        description: `Send permission ${variables.canSendCrypto ? 'enabled' : 'disabled'} for this user` 
      });
      // Invalidate and refetch to ensure UI is in sync with backend
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error, variables, context) => {
      toast({ 
        title: "Failed to Update Permission", 
        description: error.message, 
        variant: "destructive" 
      });
      // Rollback to previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["/api/admin/users"], context.previousUsers);
      }
    },
    onSettled: () => {
      // Clear loading state
      setUpdatingUserId(null);
    },
  });

  // WhatsApp settings query
  const { data: whatsappSettings } = useQuery({
    queryKey: ["/api/settings", "whatsappNumber"],
    queryFn: async () => {
      const response = await fetch("/api/settings/whatsappNumber");
      if (!response.ok) throw new Error("Failed to fetch WhatsApp number");
      return response.json();
    },
  });

  // Update whatsappNumber state when settings data changes
  useEffect(() => {
    if (whatsappSettings?.value) {
      setWhatsappNumber(whatsappSettings.value);
    }
  }, [whatsappSettings]);

  // WhatsApp settings mutation
  const updateWhatsappMutation = useMutation({
    mutationFn: async (newNumber: string) => {
      const response = await apiRequest("PUT", "/api/settings/whatsappNumber", { value: newNumber });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update WhatsApp number");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "WhatsApp number updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "whatsappNumber"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Support chats query
  const supportChatsQuery = useQuery({
    queryKey: ["/api/admin/support-chat"],
    queryFn: async () => {
      const response = await fetch("/api/admin/support-chat", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch support chats");
      return response.json();
    },
    refetchInterval: 60000, // Reduced polling to 60 seconds as WebSocket provides real-time updates
  });

  const allSupportChats = (supportChatsQuery.data as any)?.chats || [];

  // WebSocket connection for real-time support chat updates with auto-reconnect
  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) return;

    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000; // Max 30 seconds
    let reconnectTimeout: NodeJS.Timeout;
    let isIntentionalClose = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Admin connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Admin WebSocket connected for support chat');
        reconnectAttempts = 0; // Reset on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Admin WebSocket message received:', data);
          
          if (data.type === 'support_chat_message') {
            // Refresh support chats list
            queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
            
            // If currently viewing this user's chat, refresh it (use ref to get latest value)
            const currentChat = selectedSupportChatRef.current;
            if (currentChat && data.userId === currentChat.userId) {
              fetch(`/api/admin/support-chat/${data.userId}`, {
                credentials: "include",
              })
                .then(res => res.json())
                .then(chatData => setSelectedSupportChat(chatData))
                .catch(console.error);
            }
          }
        } catch (error) {
          console.error('Admin WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Admin WebSocket disconnected');
        wsRef.current = null;
        
        // Only reconnect if not intentionally closed and still admin
        if (!isIntentionalClose && currentUser && currentUser.isAdmin) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
          reconnectAttempts++;
          console.log(`Admin reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [currentUser]); // Only depend on currentUser, not selectedSupportChat

  const filteredSupportChats = allSupportChats.filter((chat: any) => {
    const searchLower = supportChatSearch.toLowerCase();
    if (!searchLower) return true;
    return (
      chat.user?.firstName?.toLowerCase().includes(searchLower) ||
      chat.user?.lastName?.toLowerCase().includes(searchLower) ||
      chat.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Messages query params
  const messagesQueryParams = {
    page: messagesPage,
    limit: messagesLimit,
    ...(messagesStatusFilter !== "all" && { status: messagesStatusFilter }),
    ...(messagesTypeFilter !== "all" && { type: messagesTypeFilter }),
    ...(messagesSearch && { search: messagesSearch }),
  };

  // Messages query
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/admin/messages", messagesQueryParams],
    queryFn: async () => {
      const queryString = new URLSearchParams(
        Object.entries(messagesQueryParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      const url = `/api/admin/messages?${queryString}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  const messages = (messagesData as any)?.messages || [];
  const messagesPagination = (messagesData as any)?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  // Reply to message mutation
  const replyToMessageMutation = useMutation({
    mutationFn: async ({ messageId, replyMessage }: { messageId: string; replyMessage: string }) => {
      const res = await apiRequest("POST", `/api/admin/messages/${messageId}/reply`, {
        replyMessage,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send reply");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedMessage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send direct message mutation
  const sendDirectMessageMutation = useMutation({
    mutationFn: async ({ email, subject, message }: { email: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/admin/messages/send", {
        email,
        subject,
        message,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setSendMessageDialogOpen(false);
      setSendMessageEmail("");
      setSendMessageSubject("");
      setSendMessageBody("");
      setSendMessageUserPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update message status mutation
  const updateMessageStatusMutation = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/messages/${messageId}/status`, {
        status,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send support chat message mutation
  const sendSupportChatMutation = useMutation({
    mutationFn: async ({ optimisticId, userId, content }: { optimisticId: string; userId: string; content: string }) => {
      const formData = new FormData();
      formData.append("content", content);

      const response = await fetch(`/api/admin/support-chat/${userId}/messages`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onMutate: async ({ optimisticId, content }) => {
      // Add optimistic message immediately
      const optimisticMessage = {
        content,
        senderType: "admin",
        timestamp: new Date().toISOString(),
        optimisticId,
      };
      setOptimisticMessages(prev => [...prev, optimisticMessage]);
      
      return { optimisticId };
    },
    onSuccess: (data, variables, context) => {
      // Remove the optimistic message
      setOptimisticMessages(prev => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
      // Refresh the selected chat
      if (selectedSupportChat) {
        fetch(`/api/admin/support-chat/${selectedSupportChat.userId}`, {
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => setSelectedSupportChat(data))
          .catch(console.error);
      }
    },
    onError: (error: Error, variables, context) => {
      // Remove the failed optimistic message
      setOptimisticMessages(prev => prev.filter((msg: any) => msg.optimisticId !== context?.optimisticId));
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit support chat message mutation
  const editSupportChatMessageMutation = useMutation({
    mutationFn: async ({ userId, messageIndex, content }: { userId: string; messageIndex: number; content: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/support-chat/${userId}/messages/${messageIndex}`, {
        content,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to edit message");
      }
      return response.json();
    },
    onSuccess: () => {
      setEditingMessageIndex(null);
      setEditingContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
      // Refresh the selected chat
      if (selectedSupportChat) {
        fetch(`/api/admin/support-chat/${selectedSupportChat.userId}`, {
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => setSelectedSupportChat(data))
          .catch(console.error);
      }
      toast({
        title: "Success",
        description: "Message edited successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark support chat as read mutation
  const markSupportChatReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await apiRequest("PUT", `/api/admin/support-chats/${chatId}/mark-read`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark as read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat"] });
    },
  });

  // Mark support chat as read when selected
  useEffect(() => {
    if (selectedSupportChat?._id && selectedSupportChat.unreadAdminCount > 0) {
      markSupportChatReadMutation.mutate(selectedSupportChat._id);
    }
  }, [selectedSupportChat?._id]);

  // Clear optimistic messages when changing conversations
  useEffect(() => {
    setOptimisticMessages([]);
  }, [selectedSupportChat?._id]);

  // Fetch user preview for send message
  useEffect(() => {
    const fetchSendMessageUserPreview = async () => {
      const input = sendMessageEmail.trim();
      
      if (input.length > 0) {
        try {
          const response = await apiRequest("GET", `/api/admin/users/search?query=${encodeURIComponent(input)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.users && data.users.length > 0) {
              setSendMessageUserPreview(data.users[0]);
            } else {
              setSendMessageUserPreview(null);
            }
          } else {
            setSendMessageUserPreview(null);
          }
        } catch (error) {
          setSendMessageUserPreview(null);
        }
      } else {
        setSendMessageUserPreview(null);
      }
    };

    const debounce = setTimeout(fetchSendMessageUserPreview, 500);
    return () => clearTimeout(debounce);
  }, [sendMessageEmail]);

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

  const handleLogout = async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/auth/logout", {});
      if (response.ok) {
        setLocation("/admin/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/admin/login");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedUser(null);
      setLastSearchQuery("");
      setLastSearchType(searchType);
      return;
    }
    if (searchQuery.trim() === lastSearchQuery.trim() && searchType === lastSearchType) {
      return;
    }
    setSearchResults([]);
    setSelectedUser(null);
    setIsSearching(true);
    searchMutation.mutate({ query: searchQuery, type: searchType });
  };

  const handleAddCrypto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCryptoUserId || !addCryptoToken || !addCryptoAmount || !addCryptoChainId) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // If email was entered, require preview user to be resolved
    if (addCryptoUserId.includes('@') && !previewUser) {
      toast({
        title: "User Not Found",
        description: "Please wait for user preview to load or verify the email address",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(addCryptoAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    const selectedToken = allTokens.find((t: any) => t.symbol === addCryptoToken);
    if (!selectedToken) {
      toast({
        title: "Invalid Token",
        description: "Please select a valid token",
        variant: "destructive",
      });
      return;
    }
    
    // Use resolved user ID from preview if available, otherwise use input
    const resolvedUserId = previewUser?._id || addCryptoUserId;
    
    addCryptoMutation.mutate({
      userId: resolvedUserId,
      tokenSymbol: selectedToken.symbol,
      amount: amount.toString(),
      chainId: addCryptoChainId,
      senderWalletAddress: addCryptoSenderWallet.trim() || undefined,
    });
  };

  // Delete user mutation
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      setDeletingUserId(userId);
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: (_data, userId) => {
      // Optimistically remove the user from cache
      queryClient.setQueryData(["/api/admin/users"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.filter((u: any) => u._id !== userId),
        };
      });
      setDeletingUserId(null);
      toast({
        title: "User deleted",
        description: "User account and all related data have been deleted",
      });
    },
    onError: (error: any) => {
      setDeletingUserId(null);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user ${userEmail}? This will delete all their data including wallets, transactions, and notifications. This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleRemoveCrypto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeCryptoUserId || !removeCryptoToken || !removeCryptoAmount || !removeCryptoChainId) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // If email was entered, require preview user to be resolved
    if (removeCryptoUserId.includes('@') && !removePreviewUser) {
      toast({
        title: "User Not Found",
        description: "Please wait for user preview to load or verify the email address",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(removeCryptoAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    const selectedToken = allTokens.find((t: any) => t.symbol === removeCryptoToken);
    if (!selectedToken) {
      toast({
        title: "Invalid Token",
        description: "Please select a valid token",
        variant: "destructive",
      });
      return;
    }
    
    // Use resolved user ID from preview if available, otherwise use input
    const resolvedUserId = removePreviewUser?._id || removeCryptoUserId;
    
    removeCryptoMutation.mutate({
      userId: resolvedUserId,
      tokenSymbol: selectedToken.symbol,
      amount: amount.toString(),
      chainId: removeCryptoChainId,
    });
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0F1C] via-[#0D1425] to-[#0A0F1C] flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Professional Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="border-l border-border h-5" />
            <div className="flex items-center gap-2">
              {isEditingAdminName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    className="text-sm font-bold bg-transparent border-b border-primary outline-none w-32"
                    placeholder="Display name"
                    autoFocus
                    data-testid="input-admin-display-name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setAdminDisplayName(adminNameInput);
                        try { localStorage.setItem("admin_display_name", adminNameInput); } catch {}
                        setIsEditingAdminName(false);
                      }
                      if (e.key === "Escape") setIsEditingAdminName(false);
                    }}
                  />
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setAdminDisplayName(adminNameInput);
                      try { localStorage.setItem("admin_display_name", adminNameInput); } catch {}
                      setIsEditingAdminName(false);
                    }}
                  >Save</button>
                  <button
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => { setAdminNameInput(adminDisplayName); setIsEditingAdminName(false); }}
                  >Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold">
                    {adminDisplayName || "Admin Dashboard"}
                  </h1>
                  <button
                    onClick={() => { setAdminNameInput(adminDisplayName); setIsEditingAdminName(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit display name"
                    data-testid="button-edit-admin-name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/transactions")}
              data-testid="button-transaction-history"
            >
              <History className="h-4 w-4 mr-2" />
              Transaction History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Users</p>
                  <p className="text-xl font-bold">{allUsers.length}</p>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available Tokens</p>
                  <p className="text-xl font-bold">{allTokens.length}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custom Fees Configured</p>
                  <p className="text-xl font-bold">{userFees.length}</p>
                </div>
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover-elevate"
            onClick={() => setLocation("/admin/transactions")}
            data-testid="card-transactions"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin Transactions</p>
                  <p className="text-xl font-bold">{adminTransactionsTotal}</p>
                </div>
                <History className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-3">
          <TabsList className="grid w-full grid-cols-9 h-9">
            <TabsTrigger value="users" className="text-xs" data-testid="tab-users">All Users</TabsTrigger>
            <TabsTrigger value="search" className="text-xs" data-testid="tab-search">Search</TabsTrigger>
            <TabsTrigger value="crypto" className="text-xs" data-testid="tab-crypto">Add Crypto</TabsTrigger>
            <TabsTrigger value="remove" className="text-xs" data-testid="tab-remove">Remove</TabsTrigger>
            <TabsTrigger value="send-crypto" className="text-xs" data-testid="tab-send-crypto">Send Crypto</TabsTrigger>
            <TabsTrigger value="silent-add" className="text-xs" data-testid="tab-silent-add">Silent Add</TabsTrigger>
            <TabsTrigger value="user-fees" className="text-xs" data-testid="tab-user-fees">User Fees</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="support-chat" className="text-xs" data-testid="tab-support-chat">Support Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">All Users (Newest First)</CardTitle>
                <CardDescription className="text-xs">Total: {allUsers.length} users · Pinned: {allUsers.filter((u: any) => u.adminPinned).length}</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                {allUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No users found</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {[...allUsers]
                      .sort((a: any, b: any) => {
                        const aPinned = a.adminPinned ? 0 : 1;
                        const bPinned = b.adminPinned ? 0 : 1;
                        return aPinned - bPinned;
                      })
                      .map((user: any) => {
                      const isPinned = !!user.adminPinned;
                      const label = user.adminNickname || "";
                      const isEditingLabel = editingLabelId === user._id;
                      return (
                      <Card key={user._id} className={`hover-elevate ${isPinned ? "ring-1 ring-primary/40" : ""}`} data-testid={`user-card-${user._id}`}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                {/* Name row */}
                                <p className="font-semibold text-sm">
                                  {user.firstName} {user.lastName}
                                </p>
                                {/* Nickname row — always visible, fully clickable */}
                                <div className="mt-0.5">
                                  {isEditingLabel ? (
                                    <div className="flex items-center gap-1.5">
                                      <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <input
                                        value={labelInput}
                                        onChange={e => setLabelInput(e.target.value)}
                                        className="text-xs bg-muted border border-primary/50 rounded px-1.5 py-0.5 outline-none flex-1 min-w-0"
                                        placeholder="Add a label..."
                                        autoFocus
                                        onKeyDown={e => {
                                          if (e.key === "Enter") saveUserLabel(user._id, labelInput);
                                          if (e.key === "Escape") { setEditingLabelId(null); setLabelInput(""); }
                                        }}
                                      />
                                      <button className="text-xs text-primary font-medium flex-shrink-0" onClick={() => saveUserLabel(user._id, labelInput)}>Save</button>
                                      <button className="text-xs text-muted-foreground flex-shrink-0" onClick={() => { setEditingLabelId(null); setLabelInput(""); }}>Cancel</button>
                                    </div>
                                  ) : (
                                    <button
                                      className="flex items-center gap-1 group"
                                      onClick={() => { setEditingLabelId(user._id); setLabelInput(label); }}
                                      data-testid={`button-edit-label-${user._id}`}
                                      title={label ? "Edit nickname" : "Add nickname"}
                                    >
                                      <Tag className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                      {label ? (
                                        <span className="text-xs font-medium text-primary">{label}</span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Add label...</span>
                                      )}
                                      <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                {user.userId && (
                                  <p className="text-xs text-muted-foreground font-mono">ID: {user.userId}</p>
                                )}
                                {/* PIN — always visible, prominent */}
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-xs text-muted-foreground">PIN:</span>
                                  <span className="text-xs font-bold text-primary font-mono tracking-widest" data-testid={`text-password-${user._id}`}>
                                    {user.plainPassword || "Not set"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end flex-shrink-0">
                              {/* Pin toggle */}
                              <Button
                                size="icon"
                                variant={isPinned ? "default" : "ghost"}
                                title={isPinned ? "Unpin user" : "Pin user to top"}
                                onClick={() => togglePinMutation.mutate(user._id)}
                                disabled={togglePinMutation.isPending}
                                data-testid={`button-pin-user-${user._id}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                  <path d="M16 3a1 1 0 0 1 .993.883L17 4v2h1a3 3 0 0 1 2.995 2.824L21 9v2a1 1 0 0 1-1 1h-6v7a1 1 0 0 1-1.993.117L12 19v-7H6a1 1 0 0 1-1-1V9a3 3 0 0 1 3-3h1V4a1 1 0 0 1 1-1h4z" />
                                </svg>
                              </Button>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1.5 items-end">
                                <span className="text-xs font-medium text-muted-foreground">Send</span>
                                <Button
                                  size="sm"
                                  variant={user.canSendCrypto ? "destructive" : "default"}
                                  className="h-8 px-3 min-w-[80px]"
                                  disabled={updatingUserId === user._id}
                                  onClick={() => {
                                    if (updatingUserId) return;
                                    toggleSendPermissionMutation.mutate({ 
                                      userId: user._id, 
                                      canSendCrypto: !(user.canSendCrypto ?? false) 
                                    });
                                  }}
                                  data-testid={`button-toggle-send-permission-${user._id}`}
                                >
                                  {updatingUserId === user._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : user.canSendCrypto ? (
                                    "Disable"
                                  ) : (
                                    "Enable"
                                  )}
                                </Button>
                              </div>
                              {!user.isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-destructive"
                                  onClick={() => handleDeleteUser(user._id, user.email)}
                                  disabled={deletingUserId === user._id}
                                  data-testid={`button-delete-user-${user._id}`}
                                >
                                  {deletingUserId === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Search Users</CardTitle>
                <CardDescription className="text-xs">Search by email or wallet ID</CardDescription>
              </CardHeader>
              <CardContent className="py-3 space-y-3">
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="search-type">Search Type</Label>
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                    <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                    {searchResults.map((user: any) => (
                      <Card key={user._id} className="hover-elevate cursor-pointer" onClick={() => setSelectedUser(user)} data-testid={`user-result-${user._id}`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.userId && (
                                <p className="text-xs text-muted-foreground font-mono">ID: {user.userId}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {user.wallets?.length || 0} wallet(s)
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <Card className="border-[#1677FF]">
                    <CardHeader>
                      <CardTitle>Selected User Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                        <p className="font-mono text-sm">{selectedUser._id}</p>
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
          </TabsContent>

          <TabsContent value="crypto" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Add Cryptocurrency to User Account</CardTitle>
                <CardDescription className="text-xs">Credit cryptocurrency to a user's wallet</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <form onSubmit={handleAddCrypto} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="add-crypto-search-type">Search User By</Label>
                    <Select
                      value={addCryptoSearchType}
                      onValueChange={(value: "email" | "id") => setAddCryptoSearchType(value)}
                    >
                      <SelectTrigger data-testid="select-add-crypto-search-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userId">{addCryptoSearchType === "email" ? "User Email" : "User ID"} *</Label>
                    <Input
                      id="userId"
                      placeholder={addCryptoSearchType === "email" ? "Enter email (e.g., user@example.com)" : "Enter 24-character user ID"}
                      value={addCryptoUserId}
                      onChange={(e) => setAddCryptoUserId(e.target.value)}
                      data-testid="input-user-id"
                    />
                    {previewUser && (
                      <Card className="bg-green-500/10 border-green-500/50">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {previewUser.firstName?.[0]}{previewUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{previewUser.firstName} {previewUser.lastName}</p>
                              <p className="text-xs text-muted-foreground">{previewUser.email}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {previewUser._id}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chainId">Blockchain *</Label>
                    <Select
                      value={addCryptoChainId}
                      onValueChange={setAddCryptoChainId}
                    >
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
                    <Label htmlFor="token">Token *</Label>
                    <Select
                      value={addCryptoToken}
                      onValueChange={setAddCryptoToken}
                    >
                      <SelectTrigger data-testid="select-token">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allTokens
                          .filter((token: any) => !addCryptoChainId || token.chainId === addCryptoChainId)
                          .map((token: any, index: number) => (
                          <SelectItem key={`${token.chainId}-${token.symbol}-${index}`} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              {token.logo && (
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              )}
                              <span>{token.name} ({token.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (in crypto) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={addCryptoAmount}
                      onChange={(e) => setAddCryptoAmount(e.target.value)}
                      data-testid="input-amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderWallet">Sender Wallet Address (Optional)</Label>
                    <Input
                      id="senderWallet"
                      placeholder="0x..."
                      value={addCryptoSenderWallet}
                      onChange={(e) => setAddCryptoSenderWallet(e.target.value)}
                      data-testid="input-sender-wallet"
                    />
                    <p className="text-xs text-muted-foreground">
                      If provided, a received transaction entry will be created automatically
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
                    disabled={addCryptoMutation.isPending}
                    data-testid="button-add-crypto"
                  >
                    {addCryptoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Cryptocurrency
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remove" className="space-y-3 mt-3">
            <Card className="border-red-500/50">
              <CardHeader className="py-3">
                <CardTitle className="text-red-500 text-base">Remove Cryptocurrency from User Account</CardTitle>
                <CardDescription className="text-xs">Deduct cryptocurrency from a user's wallet (no transaction record created)</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <form onSubmit={handleRemoveCrypto} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="remove-crypto-search-type">Search User By</Label>
                    <Select
                      value={removeCryptoSearchType}
                      onValueChange={(value: "email" | "id") => setRemoveCryptoSearchType(value)}
                    >
                      <SelectTrigger data-testid="select-remove-crypto-search-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="removeUserId">{removeCryptoSearchType === "email" ? "User Email" : "User ID"} *</Label>
                    <Input
                      id="removeUserId"
                      placeholder={removeCryptoSearchType === "email" ? "Enter email (e.g., user@example.com)" : "Enter 24-character user ID"}
                      value={removeCryptoUserId}
                      onChange={(e) => setRemoveCryptoUserId(e.target.value)}
                      data-testid="input-remove-user-id"
                    />
                    {removePreviewUser && (
                      <Card className="bg-yellow-500/10 border-yellow-500/50">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {removePreviewUser.firstName?.[0]}{removePreviewUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{removePreviewUser.firstName} {removePreviewUser.lastName}</p>
                              <p className="text-xs text-muted-foreground">{removePreviewUser.email}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {removePreviewUser._id}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="removeChainId">Blockchain *</Label>
                    <Select
                      value={removeCryptoChainId}
                      onValueChange={setRemoveCryptoChainId}
                    >
                      <SelectTrigger data-testid="select-remove-chain-id">
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
                    <Label htmlFor="removeToken">Token *</Label>
                    <Select
                      value={removeCryptoToken}
                      onValueChange={setRemoveCryptoToken}
                    >
                      <SelectTrigger data-testid="select-remove-token">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allTokens
                          .filter((token: any) => !removeCryptoChainId || token.chainId === removeCryptoChainId)
                          .map((token: any, index: number) => (
                          <SelectItem key={`remove-${token.chainId}-${token.symbol}-${index}`} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              {token.logo && (
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              )}
                              <span>{token.name} ({token.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="removeAmount">Amount to Remove (in crypto) *</Label>
                    <Input
                      id="removeAmount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={removeCryptoAmount}
                      onChange={(e) => setRemoveCryptoAmount(e.target.value)}
                      data-testid="input-remove-amount"
                    />
                    <p className="text-xs text-red-500">
                      Warning: This will remove funds without creating any transaction record
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-red-600 to-red-700"
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
                        <Plus className="mr-2 h-4 w-4 rotate-45" />
                        Remove Cryptocurrency (No Trace)
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send-crypto" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Send Crypto from User Account</CardTitle>
                <CardDescription className="text-xs">Admin initiates a send transaction from a user's wallet</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!sendCryptoUserId || !sendCryptoToken || !sendCryptoAmount || !sendCryptoChainId || !sendCryptoRecipient) {
                    toast({
                      title: "Invalid Input",
                      description: "Please fill in all required fields",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (sendCryptoUserId.includes('@') && !sendPreviewUser) {
                    toast({
                      title: "User Not Found",
                      description: "Please wait for user preview to load or verify the email address",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const amount = parseFloat(sendCryptoAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid positive number",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const selectedToken = allTokens.find((t: any) => t.symbol === sendCryptoToken);
                  if (!selectedToken) {
                    toast({
                      title: "Invalid Token",
                      description: "Please select a valid token",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const resolvedUserId = sendPreviewUser?._id || sendCryptoUserId;
                  
                  sendCryptoMutation.mutate({
                    userId: resolvedUserId,
                    tokenSymbol: selectedToken.symbol,
                    amount: amount.toString(),
                    chainId: sendCryptoChainId,
                    recipientAddress: sendCryptoRecipient,
                    feeAmount: sendCryptoFee || undefined,
                    note: sendCryptoNote || undefined,
                  });
                }} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="send-crypto-search-type">Search User By</Label>
                    <Select
                      value={sendCryptoSearchType}
                      onValueChange={(value: "email" | "id") => setSendCryptoSearchType(value)}
                    >
                      <SelectTrigger data-testid="select-send-crypto-search-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sendUserId">{sendCryptoSearchType === "email" ? "User Email" : "User ID"} *</Label>
                    <Input
                      id="sendUserId"
                      placeholder={sendCryptoSearchType === "email" ? "Enter email (e.g., user@example.com)" : "Enter 24-character user ID"}
                      value={sendCryptoUserId}
                      onChange={(e) => setSendCryptoUserId(e.target.value)}
                      data-testid="input-send-user-id"
                    />
                    {sendPreviewUser && (
                      <Card className="bg-green-500/10 border-green-500/50">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {sendPreviewUser.firstName?.[0]}{sendPreviewUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{sendPreviewUser.firstName} {sendPreviewUser.lastName}</p>
                              <p className="text-xs text-muted-foreground">{sendPreviewUser.email}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {sendPreviewUser._id}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendChainId">Blockchain *</Label>
                    <Select
                      value={sendCryptoChainId}
                      onValueChange={setSendCryptoChainId}
                    >
                      <SelectTrigger data-testid="select-send-chain-id">
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
                    <Label htmlFor="sendToken">Token *</Label>
                    <Select
                      value={sendCryptoToken}
                      onValueChange={setSendCryptoToken}
                    >
                      <SelectTrigger data-testid="select-send-token">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allTokens
                          .filter((token: any) => !sendCryptoChainId || token.chainId === sendCryptoChainId)
                          .map((token: any, index: number) => (
                          <SelectItem key={`send-${token.chainId}-${token.symbol}-${index}`} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              {token.logo && (
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              )}
                              <span>{token.name} ({token.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendAmount">Amount (in crypto) *</Label>
                    <Input
                      id="sendAmount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={sendCryptoAmount}
                      onChange={(e) => setSendCryptoAmount(e.target.value)}
                      data-testid="input-send-amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendRecipient">Recipient Address *</Label>
                    <Input
                      id="sendRecipient"
                      placeholder="0x..."
                      value={sendCryptoRecipient}
                      onChange={(e) => setSendCryptoRecipient(e.target.value)}
                      data-testid="input-send-recipient"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendFee">Fee Amount (Optional)</Label>
                    <Input
                      id="sendFee"
                      type="number"
                      step="any"
                      placeholder="0.001"
                      value={sendCryptoFee}
                      onChange={(e) => setSendCryptoFee(e.target.value)}
                      data-testid="input-send-fee"
                    />
                    <p className="text-xs text-muted-foreground">
                      If not specified, default fee will be used
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendNote">Note (Optional)</Label>
                    <Input
                      id="sendNote"
                      placeholder="Optional note for this transaction"
                      value={sendCryptoNote}
                      onChange={(e) => setSendCryptoNote(e.target.value)}
                      data-testid="input-send-note"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#1677FF] to-[#2ED8FF]"
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
                        <Plus className="mr-2 h-4 w-4" />
                        Send Crypto from User Account
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="silent-add" className="space-y-3 mt-3">
            <Card className="border-yellow-500/50">
              <CardHeader className="py-3">
                <CardTitle className="text-yellow-500 text-base">Silent Add Crypto (No Transaction Trace)</CardTitle>
                <CardDescription className="text-xs">Add cryptocurrency to user's balance without creating a transaction record</CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!silentAddUserId || !silentAddToken || !silentAddAmount || !silentAddChainId) {
                    toast({
                      title: "Invalid Input",
                      description: "Please fill in all required fields",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (silentAddUserId.includes('@') && !silentPreviewUser) {
                    toast({
                      title: "User Not Found",
                      description: "Please wait for user preview to load or verify the email address",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const amount = parseFloat(silentAddAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid positive number",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const selectedToken = allTokens.find((t: any) => t.symbol === silentAddToken);
                  if (!selectedToken) {
                    toast({
                      title: "Invalid Token",
                      description: "Please select a valid token",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const resolvedUserId = silentPreviewUser?._id || silentAddUserId;
                  
                  silentAddMutation.mutate({
                    userId: resolvedUserId,
                    tokenSymbol: selectedToken.symbol,
                    amount: amount.toString(),
                    chainId: silentAddChainId,
                    note: silentAddNote || undefined,
                  });
                }} className="space-y-3">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>Warning:</strong> This operation adds crypto without creating any transaction record. Use with caution. This is useful for corrections or special cases.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silent-add-search-type">Search User By</Label>
                    <Select
                      value={silentAddSearchType}
                      onValueChange={(value: "email" | "id") => setSilentAddSearchType(value)}
                    >
                      <SelectTrigger data-testid="select-silent-add-search-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="silentAddUserId">{silentAddSearchType === "email" ? "User Email" : "User ID"} *</Label>
                    <Input
                      id="silentAddUserId"
                      placeholder={silentAddSearchType === "email" ? "Enter email (e.g., user@example.com)" : "Enter 24-character user ID"}
                      value={silentAddUserId}
                      onChange={(e) => setSilentAddUserId(e.target.value)}
                      data-testid="input-silent-add-user-id"
                    />
                    {silentPreviewUser && (
                      <Card className="bg-green-500/10 border-green-500/50">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {silentPreviewUser.firstName?.[0]}{silentPreviewUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{silentPreviewUser.firstName} {silentPreviewUser.lastName}</p>
                              <p className="text-xs text-muted-foreground">{silentPreviewUser.email}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {silentPreviewUser._id}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silentAddChainId">Blockchain *</Label>
                    <Select
                      value={silentAddChainId}
                      onValueChange={setSilentAddChainId}
                    >
                      <SelectTrigger data-testid="select-silent-add-chain-id">
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
                    <Label htmlFor="silentAddToken">Token *</Label>
                    <Select
                      value={silentAddToken}
                      onValueChange={setSilentAddToken}
                    >
                      <SelectTrigger data-testid="select-silent-add-token">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allTokens
                          .filter((token: any) => !silentAddChainId || token.chainId === silentAddChainId)
                          .map((token: any, index: number) => (
                          <SelectItem key={`silent-${token.chainId}-${token.symbol}-${index}`} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              {token.logo && (
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              )}
                              <span>{token.name} ({token.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silentAddAmount">Amount (in crypto) *</Label>
                    <Input
                      id="silentAddAmount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={silentAddAmount}
                      onChange={(e) => setSilentAddAmount(e.target.value)}
                      data-testid="input-silent-add-amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="silentAddNote">Note (Optional)</Label>
                    <Input
                      id="silentAddNote"
                      placeholder="Optional note for internal reference"
                      value={silentAddNote}
                      onChange={(e) => setSilentAddNote(e.target.value)}
                      data-testid="input-silent-add-note"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700"
                    disabled={silentAddMutation.isPending}
                    data-testid="button-silent-add"
                  >
                    {silentAddMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Crypto Silently (No Transaction Trace)
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-fees" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Per-User Transaction Fee Management
                </CardTitle>
                <CardDescription className="text-xs">Set custom transaction fees for individual users</CardDescription>
              </CardHeader>
              <CardContent className="py-3 space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>How it works:</strong> Custom user fees override global fees. When a user transfers or swaps, their custom fee (if set) will be applied instead of the global fee.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user-fee-search-type">Search User By</Label>
                  <Select
                    value={searchType}
                    onValueChange={(value: "email" | "id") => setSearchType(value)}
                  >
                    <SelectTrigger data-testid="select-user-fee-search-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="id">Wallet ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{searchType === "email" ? "User Email" : "Wallet ID"}</Label>
                  <Input
                    placeholder={searchType === "email" ? "Enter email..." : "Enter 24-character wallet ID..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2"
                    data-testid="input-user-fee-search"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Search Results:</Label>
                    {searchResults.map((user: any) => (
                      <Card 
                        key={user._id} 
                        className="cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setSelectedUser(user)}
                        data-testid={`user-result-${user._id}`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePhoto || ""} alt={user.email} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{user.email}</p>
                              <p className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="space-y-3">
                    <Card className="border-2 border-primary">
                      <CardHeader className="bg-primary/5 flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Managing Fees for: {selectedUser.email}
                          </CardTitle>
                          <CardDescription>
                            User ID: {selectedUser._id} • {selectedUser.firstName} {selectedUser.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(null);
                            setUserFees([]);
                            setEditingFee(null);
                          }}
                        >
                          Back
                        </Button>
                      </CardHeader>
                    </Card>
                    
                    {!selectedUserForFees ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedUserForFees(selectedUser);
                          fetchUserFees(selectedUser._id);
                        }}
                        data-testid="button-manage-user-fees"
                      >
                        Load All Tokens & Manage Fees
                      </Button>
                    ) : loadingUserFees ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Loading tokens...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allTokens.map((token: any) => {
                          const userFee = userFees.find((f: any) => f.tokenSymbol === token.symbol && f.chainId === token.chainId);
                          const isEditing = editingFee === `${token.symbol}-${token.chainId}`;
                          const feeKey = `${token.symbol}-${token.chainId}`;
                          
                          return (
                            <Card key={feeKey} data-testid={`user-fee-card-${feeKey}`}>
                              <CardContent className="pt-3 pb-3">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      {token.logo && <img src={token.logo} alt={token.symbol} className="w-6 h-6 rounded-full" />}
                                      <div>
                                        <p className="font-semibold">{token.name} ({token.symbol})</p>
                                        <p className="text-xs text-muted-foreground">{chains?.find((c: any) => c.id === token.chainId)?.name}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Fee Amount *</Label>
                                        <Input
                                          type="number"
                                          step="any"
                                          placeholder="0.001"
                                          value={feeAmounts[feeKey] || ""}
                                          onChange={(e) => setFeeAmounts({ ...feeAmounts, [feeKey]: e.target.value })}
                                          className="h-8"
                                          data-testid={`input-fee-amount-${feeKey}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Fee % *</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.5"
                                          value={feePercentages[feeKey] || ""}
                                          onChange={(e) => setFeePercentages({ ...feePercentages, [feeKey]: e.target.value })}
                                          className="h-8"
                                          data-testid={`input-fee-percentage-${feeKey}`}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => {
                                          const feeAmount = feeAmounts[feeKey];
                                          const feePercentage = parseFloat(feePercentages[feeKey] || "0");
                                          
                                          if (!feeAmount || feePercentage === 0) {
                                            toast({
                                              title: "Required Fields",
                                              description: "Both fee amount and percentage are required",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          
                                          upsertUserFeeMutation.mutate({
                                            userId: selectedUserForFees._id,
                                            tokenSymbol: token.symbol,
                                            chainId: token.chainId,
                                            feeAmount,
                                            feePercentage,
                                          });
                                        }}
                                        size="sm"
                                        className="flex-1"
                                        disabled={upsertUserFeeMutation.isPending}
                                        data-testid={`button-save-user-fee-${feeKey}`}
                                      >
                                        {upsertUserFeeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Fee"}
                                      </Button>
                                      <Button
                                        onClick={() => setEditingFee(null)}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        data-testid={`button-cancel-user-fee-${feeKey}`}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {token.logo && <img src={token.logo} alt={token.symbol} className="w-6 h-6 rounded-full" />}
                                      <div>
                                        <p className="font-semibold text-sm">{token.name} ({token.symbol})</p>
                                        <p className="text-xs text-muted-foreground">{chains?.find((c: any) => c.id === token.chainId)?.name}</p>
                                        {userFee ? (
                                          <p className="text-xs text-green-600 dark:text-green-400">
                                            Custom Fee: {userFee.feeAmount} ({userFee.feePercentage}%)
                                          </p>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">No custom fee (uses global fee)</p>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingFee(feeKey);
                                        setFeeAmounts({ ...feeAmounts, [feeKey]: userFee?.feeAmount || "" });
                                        setFeePercentages({ ...feePercentages, [feeKey]: userFee?.feePercentage?.toString() || "" });
                                      }}
                                      data-testid={`button-edit-user-fee-${feeKey}`}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      {userFee ? "Edit" : "Set Fee"}
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Support Messages
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Total: {messagesPagination.total} messages
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSendMessageDialogOpen(true)}
                    data-testid="button-send-direct-message"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Direct Message
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-3 space-y-3">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="status-filter" className="text-xs">Status</Label>
                    <Select
                      value={messagesStatusFilter}
                      onValueChange={setMessagesStatusFilter}
                    >
                      <SelectTrigger id="status-filter" data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type-filter" className="text-xs">Type</Label>
                    <Select
                      value={messagesTypeFilter}
                      onValueChange={setMessagesTypeFilter}
                    >
                      <SelectTrigger id="type-filter" data-testid="select-type-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="search-messages" className="text-xs">Search</Label>
                    <Input
                      id="search-messages"
                      placeholder="Search by name, email, message..."
                      value={messagesSearch}
                      onChange={(e) => setMessagesSearch(e.target.value)}
                      data-testid="input-search-messages"
                    />
                  </div>
                </div>

                {/* Messages List */}
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">
                    No messages found
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {messages.map((msg: any) => {
                      const statusColor = msg.status === "pending" ? "bg-yellow-500" : msg.status === "replied" ? "bg-green-500" : "bg-gray-500";
                      const statusText = msg.status === "pending" ? "Pending" : msg.status === "replied" ? "Replied" : "Closed";

                      return (
                        <Card key={msg._id} className="hover-elevate" data-testid={`message-card-${msg._id}`}>
                          <CardContent className="py-3 space-y-2">
                            {/* Message Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{msg.name}</p>
                                  <Badge className={`${statusColor} text-white text-xs`} data-testid={`badge-status-${msg._id}`}>
                                    {statusText}
                                  </Badge>
                                  {msg.type && (
                                    <Badge variant="outline" className="text-xs">
                                      {msg.type}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{msg.email}</p>
                                {msg.userId && (
                                  <p className="text-xs text-muted-foreground">
                                    User: {msg.userId.firstName} {msg.userId.lastName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Message Body */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Subject:</p>
                              <p className="text-sm">{msg.subject || "No subject"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Message:</p>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            </div>

                            {/* Reply History */}
                            {msg.replyHistory && msg.replyHistory.length > 0 && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-toggle-history-${msg._id}`}>
                                    View Reply History ({msg.replyHistory.length})
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2 mt-2">
                                  {msg.replyHistory.map((reply: any, idx: number) => (
                                    <div key={idx} className="border-l-2 border-primary pl-3 py-2 bg-muted/50 rounded">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-semibold">{reply.actor}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(reply.sentAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <p className="text-xs whitespace-pre-wrap">{reply.body}</p>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                              {msg.type === "inbound" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    setReplyDialogOpen(true);
                                  }}
                                  data-testid={`button-reply-${msg._id}`}
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              )}
                              <Select
                                value={msg.status}
                                onValueChange={(newStatus) => {
                                  updateMessageStatusMutation.mutate({
                                    messageId: msg._id,
                                    status: newStatus,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[140px] h-8" data-testid={`select-status-${msg._id}`}>
                                  <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Mark Pending</SelectItem>
                                  <SelectItem value="replied">Mark Replied</SelectItem>
                                  <SelectItem value="closed">Mark Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {messagesPagination.pages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page {messagesPagination.page} of {messagesPagination.pages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessagesPage(Math.max(1, messagesPage - 1))}
                        disabled={messagesPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessagesPage(Math.min(messagesPagination.pages, messagesPage + 1))}
                        disabled={messagesPage === messagesPagination.pages}
                        data-testid="button-next-page"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support-chat" className="space-y-3 mt-3">
            {/* Messenger-Style Chat Interface */}
            <Card className="overflow-hidden">
              <div className="flex h-[700px]">
                {/* Left Sidebar - Conversation List */}
                <div className="w-[350px] border-r flex flex-col bg-muted/30">
                  {/* Sidebar Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Messenger
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => supportChatsQuery.refetch()}
                        data-testid="button-refresh-support-chats"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        value={supportChatSearch}
                        onChange={(e) => setSupportChatSearch(e.target.value)}
                        className="pl-9 bg-background"
                        data-testid="input-support-chat-search"
                      />
                    </div>
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-y-auto">
                    {supportChatsQuery.isLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">Loading chats...</p>
                      </div>
                    ) : filteredSupportChats.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {supportChatSearch ? "No chats found" : "No conversations yet"}
                        </p>
                      </div>
                    ) : (
                      filteredSupportChats.map((chat: any) => {
                        const lastMessage = chat.messages?.[chat.messages.length - 1];
                        const isSelected = selectedSupportChat?._id === chat._id;
                        
                        return (
                          <div
                            key={chat._id}
                            className={`
                              flex items-center gap-3 p-3 cursor-pointer border-b
                              hover-elevate
                              ${isSelected ? 'bg-primary/10' : ''}
                            `}
                            onClick={() => {
                              setSelectedSupportChat(chat);
                            }}
                            data-testid={`support-chat-card-${chat._id}`}
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.user?.profilePicture} />
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                  {chat.userName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {chat.unreadAdminCount > 0 && (
                                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-primary-foreground">
                                    {chat.unreadAdminCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm truncate">
                                  {chat.userName}
                                </p>
                                {lastMessage && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {new Date(lastMessage.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                                      ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : new Date(lastMessage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {lastMessage 
                                  ? lastMessage.imageUrl 
                                    ? '📷 Photo' 
                                    : lastMessage.content
                                  : 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Panel - Active Chat */}
                <div className="flex-1 flex flex-col min-w-0">
                  {!selectedSupportChat ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a conversation from the list to start messaging
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedSupportChat.user?.profilePicture} />
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {selectedSupportChat.userName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{selectedSupportChat.userName}</p>
                          <p className="text-xs text-muted-foreground">{selectedSupportChat.userEmail}</p>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {!selectedSupportChat?.messages || (selectedSupportChat.messages.length === 0 && optimisticMessages.length === 0) ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                              <p className="text-sm text-muted-foreground">No messages yet</p>
                              <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
                            </div>
                          </div>
                        ) : (
                          [...(selectedSupportChat.messages || []), ...optimisticMessages].map((msg: any, index: number) => {
                            const isAdmin = msg.senderType === "admin";
                            const allMessages = [...(selectedSupportChat.messages || []), ...optimisticMessages];
                            const showDate = index === 0 || 
                              new Date(allMessages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                            
                            return (
                              <div key={index}>
                                {showDate && (
                                  <div className="flex items-center justify-center my-4">
                                    <div className="bg-muted px-3 py-1.5 rounded-full">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {new Date(msg.timestamp).toLocaleDateString([], { 
                                          weekday: "short", 
                                          month: "short", 
                                          day: "numeric" 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {msg.imageUrl && (
                                      <img
                                        src={msg.imageUrl}
                                        alt="Attachment"
                                        className="rounded-2xl mb-1 cursor-pointer hover:opacity-90 max-w-full"
                                        style={{ maxHeight: "300px" }}
                                        onClick={() => window.open(msg.imageUrl, "_blank")}
                                      />
                                    )}
                                    {msg.content && (
                                      <div>
                                        {editingMessageIndex === index && !msg.optimisticId ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={editingContent}
                                              onChange={(e) => setEditingContent(e.target.value)}
                                              className="min-h-[60px] resize-none"
                                              placeholder="Edit message..."
                                              data-testid="textarea-edit-message"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  if (editingContent.trim()) {
                                                    editSupportChatMessageMutation.mutate({
                                                      userId: selectedSupportChat.userId,
                                                      messageIndex: index,
                                                      content: editingContent,
                                                    });
                                                  }
                                                }}
                                                disabled={!editingContent.trim() || editSupportChatMessageMutation.isPending}
                                                data-testid="button-save-edit"
                                              >
                                                {editSupportChatMessageMutation.isPending ? (
                                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : null}
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setEditingMessageIndex(null);
                                                  setEditingContent("");
                                                }}
                                                disabled={editSupportChatMessageMutation.isPending}
                                                data-testid="button-cancel-edit"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="group relative">
                                            <div
                                              className={`rounded-2xl px-4 py-2.5 ${
                                                isAdmin
                                                  ? 'bg-[#0084ff] text-white'
                                                  : 'bg-muted/70'
                                              }`}
                                            >
                                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                            {isAdmin && !msg.optimisticId && (
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                  setEditingMessageIndex(index);
                                                  setEditingContent(msg.content);
                                                }}
                                                data-testid={`button-edit-message-${index}`}
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <span className="text-xs text-muted-foreground mt-1 px-2">
                                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                                        hour: "2-digit", 
                                        minute: "2-digit" 
                                      })}
                                      {msg.edited && <span className="ml-1">(edited)</span>}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t">
                        <div className="flex items-end gap-2">
                          <Textarea
                            placeholder="Type a message..."
                            value={supportChatMessage}
                            onChange={(e) => setSupportChatMessage(e.target.value)}
                            rows={1}
                            className="resize-none min-h-[40px] max-h-[120px]"
                            data-testid="textarea-support-chat-message"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && supportChatMessage.trim() && selectedSupportChat) {
                                e.preventDefault();
                                const optimisticId = `temp-${Date.now()}`;
                                const content = supportChatMessage;
                                setSupportChatMessage("");
                                sendSupportChatMutation.mutate({
                                  optimisticId,
                                  userId: selectedSupportChat.userId,
                                  content,
                                });
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={() => {
                              if (supportChatMessage.trim() && selectedSupportChat) {
                                const optimisticId = `temp-${Date.now()}`;
                                const content = supportChatMessage;
                                setSupportChatMessage("");
                                sendSupportChatMutation.mutate({
                                  optimisticId,
                                  userId: selectedSupportChat.userId,
                                  content,
                                });
                              }
                            }}
                            disabled={!supportChatMessage.trim() || sendSupportChatMutation.isPending}
                            className="bg-[#0084ff] hover:bg-[#0073e6] flex-shrink-0"
                            data-testid="button-send-support-message"
                          >
                            {sendSupportChatMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent data-testid="dialog-reply">
            <DialogHeader>
              <DialogTitle>Reply to Message</DialogTitle>
              <DialogDescription>
                Send a reply to {selectedMessage?.name} ({selectedMessage?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Original Message:</Label>
                <p className="text-sm whitespace-pre-wrap mt-1 p-2 bg-muted rounded">
                  {selectedMessage?.message}
                </p>
              </div>
              <div>
                <Label htmlFor="reply-message">Your Reply</Label>
                <Textarea
                  id="reply-message"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  data-testid="textarea-reply-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReplyDialogOpen(false);
                  setReplyMessage("");
                  setSelectedMessage(null);
                }}
                data-testid="button-cancel-reply"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedMessage && replyMessage.trim()) {
                    replyToMessageMutation.mutate({
                      messageId: selectedMessage._id,
                      replyMessage,
                    });
                  }
                }}
                disabled={!replyMessage.trim() || replyToMessageMutation.isPending}
                data-testid="button-send-reply"
              >
                {replyToMessageMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Direct Message Dialog */}
        <Dialog open={sendMessageDialogOpen} onOpenChange={setSendMessageDialogOpen}>
          <DialogContent data-testid="dialog-send-message">
            <DialogHeader>
              <DialogTitle>Send Direct Message</DialogTitle>
              <DialogDescription>
                Send a message to a user via email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="send-message-email">User Email or ID</Label>
                <Input
                  id="send-message-email"
                  placeholder="Enter user email..."
                  value={sendMessageEmail}
                  onChange={(e) => setSendMessageEmail(e.target.value)}
                  data-testid="input-send-message-email"
                />
                {sendMessageUserPreview && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p className="font-semibold">
                      {sendMessageUserPreview.firstName} {sendMessageUserPreview.lastName}
                    </p>
                    <p className="text-muted-foreground">{sendMessageUserPreview.email}</p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="send-message-subject">Subject</Label>
                <Input
                  id="send-message-subject"
                  placeholder="Enter subject..."
                  value={sendMessageSubject}
                  onChange={(e) => setSendMessageSubject(e.target.value)}
                  data-testid="input-send-message-subject"
                />
              </div>
              <div>
                <Label htmlFor="send-message-body">Message</Label>
                <Textarea
                  id="send-message-body"
                  placeholder="Type your message here..."
                  value={sendMessageBody}
                  onChange={(e) => setSendMessageBody(e.target.value)}
                  rows={5}
                  data-testid="textarea-send-message-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSendMessageDialogOpen(false);
                  setSendMessageEmail("");
                  setSendMessageSubject("");
                  setSendMessageBody("");
                  setSendMessageUserPreview(null);
                }}
                data-testid="button-cancel-send-message"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (sendMessageEmail.trim() && sendMessageSubject.trim() && sendMessageBody.trim()) {
                    sendDirectMessageMutation.mutate({
                      email: sendMessageEmail,
                      subject: sendMessageSubject,
                      message: sendMessageBody,
                    });
                  }
                }}
                disabled={
                  !sendMessageEmail.trim() ||
                  !sendMessageSubject.trim() ||
                  !sendMessageBody.trim() ||
                  sendDirectMessageMutation.isPending
                }
                data-testid="button-send-direct-message-confirm"
              >
                {sendDirectMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              WhatsApp Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="whatsapp-number">WhatsApp Support Number</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This number will be displayed on the contact page. Use E.164 format (e.g., +1234567890)
                </p>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp-number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+447426417715"
                    className="flex-1"
                    data-testid="input-whatsapp-number"
                  />
                  <Button
                    onClick={() => updateWhatsappMutation.mutate(whatsappNumber)}
                    disabled={updateWhatsappMutation.isPending || !whatsappNumber}
                    data-testid="button-update-whatsapp"
                  >
                    {updateWhatsappMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
                {whatsappSettings?.value && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Current: {whatsappSettings.value}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
