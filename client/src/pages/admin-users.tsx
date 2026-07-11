import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Copy, Check, ChevronDown, ChevronUp, Pin, PinOff, Tag, Search, X, Bell, BellOff, Ban, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

export default function AdminUsers() {
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [togglingPinFor, setTogglingPinFor] = useState<string | null>(null);
  const [savingNicknameFor, setSavingNicknameFor] = useState<string | null>(null);
  const [copiedUserIdFor, setCopiedUserIdFor] = useState<string | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [nicknameEdits, setNicknameEdits] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingAlertFor, setTogglingAlertFor] = useState<string | null>(null);
  const [savingAlertFor, setSavingAlertFor] = useState<string | null>(null);
  const [alertMessageEdits, setAlertMessageEdits] = useState<Record<string, string>>({});
  const [alertDurationValueEdits, setAlertDurationValueEdits] = useState<Record<string, number>>({});
  const [alertDurationUnitEdits, setAlertDurationUnitEdits] = useState<Record<string, string>>({});
  const [resetPinFor, setResetPinFor] = useState<string | null>(null);
  const [resetPinValues, setResetPinValues] = useState<Record<string, string>>({});
  const [resettingPinFor, setResettingPinFor] = useState<string | null>(null);

  const handleCopyUserId = (uid: string, mongoId: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUserIdFor(mongoId);
    toast({ title: "Copied", description: `ID ${uid} copied` });
    setTimeout(() => setCopiedUserIdFor(null), 2000);
  };

  const toggleExpandedAssets = (mongoId: string) => {
    setExpandedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(mongoId)) {
        next.delete(mongoId);
      } else {
        next.add(mongoId);
      }
      return next;
    });
  };

  const { data: allUsersData } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 5000,
  });

  const rawUsers = (allUsersData as any)?.users || [];

  const allUsers = [...rawUsers].sort((a: any, b: any) => {
    const aPinned = a.adminPinned ? 0 : 1;
    const bPinned = b.adminPinned ? 0 : 1;
    return aPinned - bPinned;
  });

  const pinnedCount = allUsers.filter((u: any) => u.adminPinned).length;

  const filteredUsers = searchQuery.trim()
    ? allUsers.filter((u: any) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          (u.email || "").toLowerCase().includes(q) ||
          (u.adminNickname || "").toLowerCase().includes(q) ||
          (u.userId || "").includes(q) ||
          (`${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase()).includes(q)
        );
      })
    : allUsers;

  const togglePinMutation = useMutation({
    mutationFn: async (userId: string) => {
      setTogglingPinFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/toggle-pin`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update pin");
      }
      return res.json();
    },
    onSuccess: (data, userId) => {
      setTogglingPinFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const pinned = data?.adminPinned;
      toast({
        title: pinned ? "User pinned" : "User unpinned",
        description: "Saved to database.",
      });
    },
    onError: (error: Error) => {
      setTogglingPinFor(null);
      toast({ title: "Failed to update pin", description: error.message, variant: "destructive" });
    },
  });

  const saveNicknameMutation = useMutation({
    mutationFn: async ({ userId, nickname }: { userId: string; nickname: string }) => {
      setSavingNicknameFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/nickname`, { nickname });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save label");
      }
      return res.json();
    },
    onSuccess: (_data, { userId, nickname }) => {
      setSavingNicknameFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setNicknameEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      toast({
        title: nickname.trim() ? "Label saved" : "Label removed",
        description: "Saved to database.",
      });
    },
    onError: (error: Error) => {
      setSavingNicknameFor(null);
      toast({ title: "Failed to save label", description: error.message, variant: "destructive" });
    },
  });

  const handleNicknameBlur = (userId: string, currentValue: string, originalNickname: string | null) => {
    const trimmed = currentValue.trim();
    const original = originalNickname || "";
    if (trimmed === original) {
      setNicknameEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      return;
    }
    saveNicknameMutation.mutate({ userId, nickname: trimmed });
  };

  const handleNicknameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, userId: string, currentValue: string, originalNickname: string | null) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setNicknameEdits((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      e.currentTarget.blur();
    }
  };

  const [togglingFeeMethodFor, setTogglingFeeMethodFor] = useState<string | null>(null);
  const [togglingForceMaxFor, setTogglingForceMaxFor] = useState<string | null>(null);

  const toggleSendPermissionMutation = useMutation({
    mutationFn: async ({ userId, canSendCrypto }: { userId: string; canSendCrypto: boolean }) => {
      setUpdatingUserId(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/send-permission`, {
        canSendCrypto,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update permission");
      }
      return res.json();
    },
    onSuccess: () => {
      setUpdatingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "Send permission updated" });
    },
    onError: (error: Error) => {
      setUpdatingUserId(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleFeeMethodMutation = useMutation({
    mutationFn: async (userId: string) => {
      setTogglingFeeMethodFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/fee-method`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update fee method");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setTogglingFeeMethodFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: data?.useFixedFee ? "Fixed fee enabled" : "Fixed fee disabled",
        description: "Saved to database.",
      });
    },
    onError: (error: Error) => {
      setTogglingFeeMethodFor(null);
      toast({ title: "Failed to update fee method", description: error.message, variant: "destructive" });
    },
  });

  const toggleForceMaxAmountMutation = useMutation({
    mutationFn: async (userId: string) => {
      setTogglingForceMaxFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/force-max-amount`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setTogglingForceMaxFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: data?.forceMaxAmount ? "Force Max Amount enabled" : "Force Max Amount disabled",
        description: "Saved to database.",
      });
    },
    onError: (error: Error) => {
      setTogglingForceMaxFor(null);
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      setTogglingAlertFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/alert`, { alertEnabled: enabled });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setTogglingAlertFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: data?.alertEnabled ? "Alert enabled" : "Alert disabled",
        description: "Setting saved.",
      });
    },
    onError: (error: Error) => {
      setTogglingAlertFor(null);
      toast({ title: "Failed to update alert", description: error.message, variant: "destructive" });
    },
  });

  const saveAlertSettingsMutation = useMutation({
    mutationFn: async ({ userId, alertMessage, alertDeadline }: { userId: string; alertMessage: string; alertDeadline: number | null }) => {
      setSavingAlertFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/alert`, { alertMessage, alertDeadline });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      setSavingAlertFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Alert settings saved", description: "Message and countdown deadline updated." });
    },
    onError: (error: Error) => {
      setSavingAlertFor(null);
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const clearDeadlineMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/alert`, { alertDeadline: null });
      if (!res.ok) throw new Error("Failed to clear");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Countdown cleared", description: "Account lock timer removed." });
    },
  });

  const [cancellingWithdrawalsFor, setCancellingWithdrawalsFor] = useState<string | null>(null);
  const cancelWithdrawalsMutation = useMutation({
    mutationFn: async (userId: string) => {
      setCancellingWithdrawalsFor(userId);
      const res = await apiRequest("POST", `/api/admin/users/${userId}/cancel-withdrawals`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCancellingWithdrawalsFor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Withdrawals cancelled",
        description: data.cancelled === 0
          ? "No pending withdrawals found."
          : `${data.cancelled} pending withdrawal${data.cancelled > 1 ? "s" : ""} cancelled and balance restored.`,
      });
    },
    onError: (error: Error) => {
      setCancellingWithdrawalsFor(null);
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: async ({ userId, newPin }: { userId: string; newPin: string }) => {
      setResettingPinFor(userId);
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/reset-pin`, { newPin });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reset PIN");
      }
      return res.json();
    },
    onSuccess: (data, { userId }) => {
      setResettingPinFor(null);
      setResetPinFor((prev) => (prev === userId ? null : prev));
      setResetPinValues((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "PIN reset",
        description: `User ${data.email} PIN reset to ${data.newPin || "new value"}. The previous PIN no longer works.`,
      });
    },
    onError: (error: Error) => {
      setResettingPinFor(null);
      toast({ title: "Failed to reset PIN", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      setDeletingUserId(userId);
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: (_data, userId) => {
      queryClient.setQueryData(["/api/admin/users"], (old: any) => {
        if (!old) return old;
        return { ...old, users: old.users.filter((u: any) => u._id !== userId) };
      });
      setDeletingUserId(null);
      toast({ title: "User deleted", description: "User account and all related data have been deleted" });
    },
    onError: (error: any) => {
      setDeletingUserId(null);
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (window.confirm(`Permanently delete user ${userEmail}? This will delete all their data. This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const avatarColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <AdminLayout title="All Users">
      <div className="p-4">
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base">All Users</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {searchQuery.trim()
                    ? `${filteredUsers.length} of ${allUsers.length} users`
                    : `${allUsers.length} user${allUsers.length !== 1 ? "s" : ""} total${pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ""}`}
                </CardDescription>
              </div>
            </div>
            {/* Search bar */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by email, name, tag or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid="input-search-users"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            {allUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No users found</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No users match your search</p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user: any) => {
                  const isPinned = !!user.adminPinned;
                  const isAssetsExpanded = expandedAssets.has(user._id);
                  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                  const avatarColor = getAvatarColor(displayName || user.email);
                  const totalTokens = user.wallets?.reduce((sum: number, w: any) => sum + (w.tokens?.length || 0), 0) || 0;

                  const nicknameValue = nicknameEdits.hasOwnProperty(user._id)
                    ? nicknameEdits[user._id]
                    : (user.adminNickname || "");

                  return (
                    <div
                      key={user._id}
                      className={`rounded-lg border bg-card overflow-hidden ${isPinned ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                      data-testid={`user-card-${user._id}`}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className={`text-sm font-semibold text-white ${avatarColor}`}>
                              {(user.firstName?.[0] || "")}{(user.lastName?.[0] || "")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm truncate">{displayName || "Unknown"}</p>
                              {isPinned && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Pinned</Badge>
                              )}
                              {user.isAdmin && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-0">Admin</Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>

                            {/* Nickname / Label row */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {savingNicknameFor === user._id ? (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              ) : (
                                <Input
                                  value={nicknameValue}
                                  placeholder="Add label..."
                                  className="h-5 text-[11px] px-1.5 py-0 border-0 border-b border-dashed border-muted-foreground/30 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary/50 text-muted-foreground focus:text-foreground w-full max-w-[180px]"
                                  data-testid={`input-nickname-${user._id}`}
                                  onChange={(e) =>
                                    setNicknameEdits((prev) => ({ ...prev, [user._id]: e.target.value }))
                                  }
                                  onFocus={() => {
                                    if (!nicknameEdits.hasOwnProperty(user._id)) {
                                      setNicknameEdits((prev) => ({ ...prev, [user._id]: user.adminNickname || "" }));
                                    }
                                  }}
                                  onBlur={(e) => handleNicknameBlur(user._id, e.target.value, user.adminNickname)}
                                  onKeyDown={(e) => handleNicknameKeyDown(e, user._id, nicknameValue, user.adminNickname)}
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {user.userId && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-muted-foreground">ID:</span>
                                  <span
                                    className="text-[11px] font-mono font-semibold text-primary tracking-wider"
                                    data-testid={`text-userid-${user._id}`}
                                  >
                                    {user.userId}
                                  </span>
                                  <button
                                    onClick={() => handleCopyUserId(user.userId, user._id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    data-testid={`button-copy-userid-${user._id}`}
                                  >
                                    {copiedUserIdFor === user._id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                              <span className="text-muted-foreground text-[11px]">·</span>
                              <span className="text-[11px] text-muted-foreground">
                                User PIN: <span className="font-mono font-semibold text-foreground" data-testid={`text-password-${user._id}`}>{user.plainPassword || "—"}</span>
                              </span>
                              {user.adminResetPin && (
                                <>
                                  <span className="text-muted-foreground text-[11px]">·</span>
                                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                    Admin PIN: <span className="font-mono font-semibold">active</span>
                                  </span>
                                </>
                              )}
                              <span className="text-muted-foreground text-[11px]">·</span>
                              <button
                                onClick={() => {
                                  setResetPinFor((prev) => (prev === user._id ? null : user._id));
                                  setResetPinValues((prev) => ({ ...prev, [user._id]: "" }));
                                }}
                                className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-0.5"
                                data-testid={`button-reset-pin-${user._id}`}
                              >
                                <KeyRound className="h-3 w-3" />{user.adminResetPin ? "Change Admin PIN" : "Set Admin PIN"}
                              </button>
                            </div>

                            {resetPinFor === user._id && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <Input
                                  value={resetPinValues[user._id] || ""}
                                  onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setResetPinValues((prev) => ({ ...prev, [user._id]: v }));
                                  }}
                                  placeholder="6-digit PIN"
                                  className="h-7 text-[11px] w-28 font-mono"
                                  data-testid={`input-reset-pin-${user._id}`}
                                  maxLength={6}
                                  type="text"
                                  inputMode="numeric"
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={resettingPinFor === user._id || (resetPinValues[user._id] || "").length !== 6}
                                  onClick={() => {
                                    const pin = resetPinValues[user._id];
                                    if (pin && pin.length === 6) {
                                      resetPinMutation.mutate({ userId: user._id, newPin: pin });
                                    }
                                  }}
                                  data-testid={`button-confirm-reset-pin-${user._id}`}
                                >
                                  {resettingPinFor === user._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : "Reset"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setResetPinFor(null);
                                    setResetPinValues((prev) => {
                                      const next = { ...prev };
                                      delete next[user._id];
                                      return next;
                                    });
                                  }}
                                  data-testid={`button-cancel-reset-pin-${user._id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}

                            <p className="text-[11px] text-muted-foreground mt-1">
                              Joined {new Date(user.createdAt).toLocaleDateString()} · {user.wallets?.length || 0} wallet
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              if (!togglingPinFor) togglePinMutation.mutate(user._id);
                            }}
                            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${isPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                            title={isPinned ? "Unpin user" : "Pin user to top"}
                            data-testid={`button-pin-user-${user._id}`}
                            disabled={togglingPinFor === user._id}
                          >
                            {togglingPinFor === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isPinned ? (
                              <Pin className="h-4 w-4" />
                            ) : (
                              <PinOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {totalTokens > 0 && (
                          <button
                            onClick={() => toggleExpandedAssets(user._id)}
                            className="w-full flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`button-expand-assets-${user._id}`}
                          >
                            <span>{isAssetsExpanded ? "Hide" : "View"} assets ({totalTokens} token{totalTokens !== 1 ? "s" : ""})</span>
                            {isAssetsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {isAssetsExpanded && (
                          <div className="mt-2 space-y-2">
                            {user.wallets?.map((wallet: any) => (
                              <div key={wallet._id} className="p-2 bg-muted/30 rounded-md border border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                                  Wallet: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                                </p>
                                {wallet.tokens?.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {wallet.tokens.map((tkn: any) => (
                                      <div key={tkn._id} className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">{tkn.symbol}</span>
                                          <span className="text-[8px] text-muted-foreground uppercase">({tkn.chainId})</span>
                                        </div>
                                        <span className="text-primary font-medium">{tkn.balance}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">No assets</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">Send:</span>
                          <Button
                            size="sm"
                            variant={user.canSendCrypto ? "destructive" : "default"}
                            className="h-7 text-xs"
                            disabled={updatingUserId === user._id}
                            onClick={() => {
                              if (updatingUserId) return;
                              toggleSendPermissionMutation.mutate({
                                userId: user._id,
                                canSendCrypto: !(user.canSendCrypto ?? false),
                              });
                            }}
                            data-testid={`button-toggle-send-permission-${user._id}`}
                          >
                            {updatingUserId === user._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.canSendCrypto ? "Disable" : "Enable"}
                          </Button>

                          <span className="text-xs text-muted-foreground">Fixed Fee:</span>
                          <Button
                            size="sm"
                            variant={user.useFixedFee ? "secondary" : "outline"}
                            className={`h-7 text-xs ${user.useFixedFee ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 border-amber-500/30" : ""}`}
                            disabled={togglingFeeMethodFor === user._id}
                            onClick={() => {
                              if (togglingFeeMethodFor) return;
                              toggleFeeMethodMutation.mutate(user._id);
                            }}
                            data-testid={`button-toggle-fee-method-${user._id}`}
                          >
                            {togglingFeeMethodFor === user._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.useFixedFee ? "On" : "Off"}
                          </Button>

                          <span className="text-xs text-muted-foreground">Force Max:</span>
                          <Button
                            size="sm"
                            variant={user.forceMaxAmount ? "secondary" : "outline"}
                            className={`h-7 text-xs ${user.forceMaxAmount ? "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30" : ""}`}
                            disabled={togglingForceMaxFor === user._id}
                            onClick={() => {
                              if (togglingForceMaxFor) return;
                              toggleForceMaxAmountMutation.mutate(user._id);
                            }}
                            data-testid={`button-toggle-force-max-${user._id}`}
                          >
                            {togglingForceMaxFor === user._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.forceMaxAmount ? "On" : "Off"}
                          </Button>

                          {!user.isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-orange-600 border-orange-300 hover:text-orange-700 hover:border-orange-400 ml-auto"
                                onClick={() => cancelWithdrawalsMutation.mutate(user._id)}
                                disabled={cancellingWithdrawalsFor === user._id}
                                data-testid={`button-cancel-withdrawals-${user._id}`}
                                title="Cancel all pending withdrawals silently — restores balance, no trace left"
                              >
                                {cancellingWithdrawalsFor === user._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <><Ban className="h-3 w-3 mr-1" />Cancel Withdrawals</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleDeleteUser(user._id, user.email)}
                                disabled={deletingUserId === user._id}
                                data-testid={`button-delete-user-${user._id}`}
                              >
                                {deletingUserId === user._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : "Delete"}
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Alert on Login section */}
                        {!user.isAdmin && (
                          <div className="mt-3 pt-2 border-t border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold text-muted-foreground">Alert on Login</span>
                              <Button
                                size="sm"
                                variant={user.alertEnabled ? "secondary" : "outline"}
                                className={`h-7 text-xs ml-auto ${user.alertEnabled ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" : ""}`}
                                disabled={togglingAlertFor === user._id}
                                onClick={() => toggleAlertMutation.mutate({ userId: user._id, enabled: !user.alertEnabled })}
                                data-testid={`button-toggle-alert-${user._id}`}
                              >
                                {togglingAlertFor === user._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : user.alertEnabled ? (
                                  <><Bell className="h-3 w-3 mr-1" />On</>
                                ) : (
                                  <><BellOff className="h-3 w-3 mr-1" />Off</>
                                )}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                placeholder="Type the message the user will see..."
                                value={alertMessageEdits[user._id] ?? (user.alertMessage || "")}
                                onChange={(e) =>
                                  setAlertMessageEdits((prev) => ({ ...prev, [user._id]: e.target.value }))
                                }
                                className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                data-testid={`input-alert-message-${user._id}`}
                              />

                              {user.alertDeadline && (
                                <div className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] ${user.alertDeadline <= Date.now() ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-700"}`}>
                                  <span>
                                    {user.alertDeadline <= Date.now()
                                      ? "Countdown expired — account locked"
                                      : `Locks at ${new Date(user.alertDeadline).toLocaleString()}`}
                                  </span>
                                  <button
                                    className="ml-2 underline text-[10px] opacity-70 hover:opacity-100"
                                    onClick={() => clearDeadlineMutation.mutate(user._id)}
                                    data-testid={`button-clear-deadline-${user._id}`}
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Lock in:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={alertDurationValueEdits[user._id] ?? 1}
                                  onChange={(e) =>
                                    setAlertDurationValueEdits((prev) => ({
                                      ...prev,
                                      [user._id]: Math.max(1, parseInt(e.target.value) || 1),
                                    }))
                                  }
                                  className="w-14 text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring text-center"
                                  data-testid={`input-alert-duration-${user._id}`}
                                />
                                <select
                                  value={alertDurationUnitEdits[user._id] ?? "hours"}
                                  onChange={(e) =>
                                    setAlertDurationUnitEdits((prev) => ({ ...prev, [user._id]: e.target.value }))
                                  }
                                  className="text-xs rounded-md border border-input bg-background px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                                  data-testid={`select-alert-unit-${user._id}`}
                                >
                                  <option value="minutes">min</option>
                                  <option value="hours">hrs</option>
                                  <option value="days">days</option>
                                </select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs ml-auto"
                                  disabled={savingAlertFor === user._id}
                                  onClick={() => {
                                    const value = alertDurationValueEdits[user._id] ?? 1;
                                    const unit = alertDurationUnitEdits[user._id] ?? "hours";
                                    const multipliers: Record<string, number> = {
                                      minutes: 60_000,
                                      hours: 3_600_000,
                                      days: 86_400_000,
                                    };
                                    const deadline = Date.now() + value * multipliers[unit];
                                    saveAlertSettingsMutation.mutate({
                                      userId: user._id,
                                      alertMessage: alertMessageEdits[user._id] ?? (user.alertMessage || ""),
                                      alertDeadline: deadline,
                                    });
                                  }}
                                  data-testid={`button-save-alert-${user._id}`}
                                >
                                  {savingAlertFor === user._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : "Set"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
