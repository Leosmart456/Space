import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(() => document.cookie.includes("admin_session"));
  const qc = useQueryClient();

  const login = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.adminLogin(username, password),
    onSuccess: () => {
      setIsAdmin(true);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const logout = useMutation({
    mutationFn: () => api.adminLogout(),
    onSuccess: () => {
      setIsAdmin(false);
      qc.clear();
    },
  });

  return { isAdmin, login, logout };
}

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: api.getAdminStats });
}

export function useAdminUsers() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: api.getAdminUsers });

  const creditShares = useMutation({
    mutationFn: ({ userId, shares }: { userId: number; shares: number }) => api.creditShares(userId, shares),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return { ...query, creditShares };
}

export function useAdminPurchases() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "purchases"], queryFn: api.getAdminPurchases });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "pending_review" | "confirmed" | "rejected" }) =>
      api.updatePurchaseStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "purchases"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return { ...query, updateStatus };
}
