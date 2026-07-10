import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "@/lib/api";

export interface Purchase {
  id: string;
  amountUsd: number;
  requestedShares: number;
  pricePerShare: number;
  status: "pending_review" | "confirmed" | "rejected";
  discountPercent?: number;
  originalAmountUsd?: number;
  discountAmountUsd?: number;
  createdAt: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string | null;
  accreditedStatus: "pending" | "yes" | "no";
  totalSharesCredited: number;
  createdAt: string;
  isEnabled?: boolean;
}

interface DashboardSummary {
  totalShares: number;
  sharePrice: number;
  totalUsdValue: number;
  systemMode: "pre_ipo" | "post_ipo";
  pendingPurchases: number;
  confirmedPurchases: number;
}

interface AuthState {
  user: UserProfile | null;
  purchases: Purchase[];
  sharePrice: number;
  systemMode: "pre_ipo" | "post_ipo";
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithOtp: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  requestOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    annualIncome: string;
    netWorth: string;
    country: string;
    dateOfBirth: string;
    employmentStatus: string;
    sourceOfFunds: string;
    investmentExperience: string;
    accreditationStatus: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  verifyRegistration: (email: string, code: string) => Promise<{ ok: boolean; token?: string; error?: string }>;
  addPurchase: (requestedShares: number, agreedToTerms: boolean) => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CACHED_USER_KEY = "@spacex_cached_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    purchases: [],
    sharePrice: 130,
    systemMode: "post_ipo",
    isLoading: true,
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await getToken();
      if (!token) {
        // Try cached user for offline display
        const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (cached) {
          const user = JSON.parse(cached) as UserProfile;
          setState((s) => ({ ...s, user, isLoading: false }));
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
        return;
      }
      await fetchUserData(token);
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }

  async function fetchUserData(token?: string) {
    try {
      const [me, purchases, dashboard] = await Promise.all([
        apiFetch<UserProfile & { id: string }>("/auth/me", { token }),
        apiFetch<Purchase[]>("/purchases", { token }).catch(() => [] as Purchase[]),
        apiFetch<DashboardSummary>("/dashboard/summary", { token }).catch(() => null),
      ]);

      const user: UserProfile = {
        fullName: me.fullName,
        email: me.email,
        phone: me.phone ?? null,
        accreditedStatus: me.accreditedStatus as "pending" | "yes" | "no",
        totalSharesCredited: dashboard?.totalShares ?? me.totalSharesCredited ?? 0,
        createdAt: (me as unknown as { createdAt: string }).createdAt ?? new Date().toISOString(),
        isEnabled: (me as unknown as { isEnabled?: boolean }).isEnabled,
      };

      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));

      setState((s) => ({
        ...s,
        user,
        purchases,
        sharePrice: dashboard?.sharePrice ?? s.sharePrice,
        systemMode: dashboard?.systemMode ?? s.systemMode,
        isLoading: false,
      }));
    } catch {
      // If network fails, use cached user
      const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
      if (cached) {
        const user = JSON.parse(cached) as UserProfile;
        setState((s) => ({ ...s, user, isLoading: false }));
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    }
  }

  async function refreshData() {
    await fetchUserData();
  }

  async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
        token: null,
      });
      await setToken(data.token);
      await fetchUserData(data.token);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function requestOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await apiFetch("/auth/login/otp", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
        token: null,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function signInWithOtp(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const data = await apiFetch<{ token: string }>("/auth/login/verify", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), code },
        token: null,
      });
      await setToken(data.token);
      await fetchUserData(data.token);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function register(data: {
    fullName: string;
    email: string;
    phone: string;
    annualIncome: string;
    netWorth: string;
    country: string;
    dateOfBirth: string;
    employmentStatus: string;
    sourceOfFunds: string;
    investmentExperience: string;
    accreditationStatus: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      await apiFetch("/auth/create-account", {
        method: "POST",
        body: {
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          annualIncome: data.annualIncome,
          investmentAmount: "2000",
          accreditationStatus: data.accreditationStatus,
          employmentStatus: data.employmentStatus,
          sourceOfFunds: data.sourceOfFunds,
          investmentExperience: data.investmentExperience,
          netWorthRange: data.netWorth,
          country: data.country,
          dateOfBirth: data.dateOfBirth,
          hearAboutUs: "Mobile App",
        },
        token: null,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function verifyRegistration(email: string, code: string): Promise<{ ok: boolean; token?: string; error?: string }> {
    try {
      const data = await apiFetch<{ token: string; fullName: string; phone: string }>("/auth/create-account/verify", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), code },
        token: null,
      });
      await setToken(data.token);
      await fetchUserData(data.token);
      return { ok: true, token: data.token };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function signOut() {
    await clearToken();
    await AsyncStorage.removeItem(CACHED_USER_KEY);
    setState((s) => ({ ...s, user: null, purchases: [], isLoading: false }));
  }

  async function addPurchase(requestedShares: number, agreedToTerms: boolean) {
    const data = await apiFetch<Purchase>("/purchases", {
      method: "POST",
      body: { requestedShares, agreedToTerms },
    });
    const newPurchase: Purchase = {
      id: data.id,
      amountUsd: data.amountUsd,
      requestedShares: data.requestedShares,
      pricePerShare: data.pricePerShare,
      status: data.status,
      discountPercent: data.discountPercent,
      originalAmountUsd: data.originalAmountUsd,
      discountAmountUsd: data.discountAmountUsd,
      createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      purchases: [newPurchase, ...s.purchases],
      user: s.user
        ? {
            ...s.user,
            totalSharesCredited: s.user.totalSharesCredited + requestedShares,
          }
        : s.user,
    }));
    // Refresh to get server-accurate data
    setTimeout(() => { refreshData().catch(() => {}); }, 2000);
  }

  async function updateProfile(data: { fullName?: string; phone?: string }) {
    const updated = await apiFetch<UserProfile & { id: string }>("/auth/profile", {
      method: "PATCH",
      body: data,
    });
    const user: UserProfile = {
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone ?? null,
      accreditedStatus: updated.accreditedStatus as "pending" | "yes" | "no",
      totalSharesCredited: state.user?.totalSharesCredited ?? 0,
      createdAt: state.user?.createdAt ?? new Date().toISOString(),
      isEnabled: (updated as unknown as { isEnabled?: boolean }).isEnabled,
    };
    await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    setState((s) => ({ ...s, user }));
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signInWithOtp,
        requestOtp,
        signOut,
        register,
        verifyRegistration,
        addPurchase,
        updateProfile,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
