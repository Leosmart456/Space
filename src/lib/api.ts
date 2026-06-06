import { getToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body?.error || res.statusText) as Error & { code?: string };
    if (body?.code) err.code = body.code;
    throw err;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  getMe: () => apiFetch<User>("/auth/me"),
  updateProfile: (body: { fullName?: string; phone?: string }) =>
    apiFetch<User>("/auth/profile", { method: "PATCH", body: JSON.stringify(body) }),
  activateWithCode: (code: string) =>
    apiFetch<User>("/auth/activate", { method: "POST", body: JSON.stringify({ code }) }),

  // Create Account (new investor flow)
  createAccount: (body: {
    email: string; fullName: string; phone?: string;
    dateOfBirth: string; nationality?: string; citizenship?: string;
    streetAddress?: string; city?: string; stateProvince?: string; postalCode?: string;
    country: string;
    annualIncome: string; netWorthRange?: string; investmentAmount: string;
    investmentPurpose?: string; accreditationStatus: string;
    employmentStatus: string; sourceOfFunds: string;
    investmentExperience: string; hearAboutUs: string;
  }) =>
    apiFetch<{ ok: boolean }>("/auth/create-account", { method: "POST", body: JSON.stringify(body) }),
  createAccountVerify: (body: { email: string; code: string }) =>
    apiFetch<{ token: string; fullName: string; phone: string }>("/auth/create-account/verify", { method: "POST", body: JSON.stringify(body) }),
  resendVerificationCode: (email: string) =>
    apiFetch<{ ok: boolean }>("/auth/create-account/resend", { method: "POST", body: JSON.stringify({ email }) }),

  // Login (existing user)
  login: (body: { email: string; password: string }) =>
    apiFetch<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  loginOtp: (body: { email: string }) =>
    apiFetch<{ ok: boolean }>("/auth/login/otp", { method: "POST", body: JSON.stringify(body) }),
  loginVerify: (body: { email: string; code: string }) =>
    apiFetch<{ token: string }>("/auth/login/verify", { method: "POST", body: JSON.stringify(body) }),

  setPassword: (password: string) =>
    apiFetch<{ ok: boolean }>("/auth/set-password", { method: "POST", body: JSON.stringify({ password }) }),

  forgotPassword: (email: string) =>
    apiFetch<{ ok: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    apiFetch<{ ok: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, newPassword }) }),

  // Investor
  verifyInvestor: (body: VerifyInvestorBody) =>
    apiFetch<User>("/investor/verify", { method: "POST", body: JSON.stringify(body) }),

  // Settings
  getSettings: () => apiFetch<Settings>("/settings"),

  // Purchases
  getPurchases: () => apiFetch<Purchase[]>("/purchases"),
  createPurchase: (body: CreatePurchaseBody) =>
    apiFetch<Purchase>("/purchases", { method: "POST", body: JSON.stringify(body) }),

  // Dashboard
  getDashboardSummary: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  getTransfers: () => apiFetch<Transfer[]>("/dashboard/transfers"),
  createTransfer: (body: { brokerageName: string; brokerageAccountNumber: string; accountHolderName: string }) =>
    apiFetch<Transfer>("/dashboard/transfers", { method: "POST", body: JSON.stringify(body) }),

  // Admin
  adminMe: () => apiFetch<{ ok: boolean }>("/admin/me"),
  adminLogin: (username: string, password: string) =>
    apiFetch<{ success: boolean; message: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  adminLogout: () => apiFetch("/admin/logout", { method: "POST" }),
  getAdminStats: () => apiFetch<AdminStats>("/admin/stats"),
  getAdminUsers: () => apiFetch<AdminUser[]>("/admin/users"),
  creditShares: (userId: string, shares: number) =>
    apiFetch<AdminUser>(`/admin/users/${userId}/credit`, { method: "POST", body: JSON.stringify({ shares }) }),
  getAdminPurchases: () => apiFetch<AdminPurchase[]>("/admin/purchases"),
  updatePurchaseStatus: (id: string, status: "pending_review" | "confirmed" | "rejected") =>
    apiFetch<AdminPurchase>(`/admin/purchases/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  resendPaymentInstructions: (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/purchases/${id}/resend-instructions`, { method: "POST" }),
  updateSettings: (body: { sharePrice?: number; systemMode?: "pre_ipo" | "post_ipo"; minInvestment?: number; ipoTargetDate?: string | null; btcAddress?: string; ethAddress?: string }) =>
    apiFetch<Settings>("/admin/settings", { method: "PATCH", body: JSON.stringify(body) }),
  sendBroadcast: (subject: string, body: string) =>
    apiFetch<{ sent: number; message: string }>("/admin/broadcast", {
      method: "POST",
      body: JSON.stringify({ subject, body }),
    }),
  setUserAccess: (userId: string, enabled: boolean) =>
    apiFetch<AdminUser>(`/admin/users/${userId}/access`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  generateAccessCode: (userId: string) =>
    apiFetch<{ code: string; userId: string; email: string; fullName: string }>(`/admin/users/${userId}/generate-code`, { method: "POST" }),
  adminSetPassword: (userId: string, password: string) =>
    apiFetch<{ ok: boolean; userId: string; email: string }>(`/admin/users/${userId}/set-password`, { method: "POST", body: JSON.stringify({ password }) }),
  getSmtpStatus: () => apiFetch<SmtpStatus>("/admin/smtp-status"),
  getAdminTransfers: () => apiFetch<AdminTransfer[]>("/admin/transfers"),
  updateAdminTransferStatus: (id: string, status: "queued" | "transfer_requested" | "completed") =>
    apiFetch<AdminTransfer>(`/admin/transfers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Certificate
  downloadCertificate: async () => {
    const token = getToken();
    const res = await fetch(`${BASE}/api/certificate`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body?.error || res.statusText);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SpaceX-Certificate.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Price (Yahoo Finance proxy)
  getPriceHistory: () => apiFetch<{ points: OHLCPoint[] }>("/price/history"),
  getPriceQuote: () => apiFetch<{ price: number; prevClose: number; change: number; changePercent: number }>("/price/quote"),

  // Price Alerts
  getAlerts: () => apiFetch<PriceAlert[]>("/alerts"),
  createAlert: (targetPrice: number, direction: boolean) =>
    apiFetch<PriceAlert>("/alerts", { method: "POST", body: JSON.stringify({ targetPrice, direction }) }),
  deleteAlert: (id: string) =>
    apiFetch<{ ok: boolean }>(`/alerts/${id}`, { method: "DELETE" }),
};

export interface VerifyInvestorBody {
  isAccredited: boolean;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  sourceOfFunds?: string;
  investmentPurpose?: string;
  annualIncomeRange?: string;
  netWorthRange?: string;
}

export interface CreatePurchaseBody {
  requestedShares: number;
  agreedToTerms: boolean;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  sourceOfFunds?: string;
  investmentPurpose?: string;
  annualIncomeRange?: string;
  netWorthRange?: string;
  paymentMethod?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  accreditedStatus: "pending" | "yes" | "no";
  totalSharesCredited: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface Settings {
  sharePrice: number;
  systemMode: "pre_ipo" | "post_ipo";
  minInvestment: number;
  ipoTargetDate: string | null;
  btcAddress: string;
  ethAddress: string;
}

export interface Purchase {
  id: string;
  userId: string;
  amountUsd: number;
  requestedShares: number;
  pricePerShare: number;
  status: "pending_review" | "confirmed" | "rejected";
  createdAt: string;
}

export interface DashboardSummary {
  totalShares: number;
  sharePrice: number;
  totalUsdValue: number;
  systemMode: "pre_ipo" | "post_ipo";
  pendingPurchases: number;
  confirmedPurchases: number;
}

export interface Transfer {
  id: string;
  userId: string;
  brokerageName: string;
  brokerageAccountNumber: string;
  accountHolderName: string;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSharesCredited: number;
  totalUsdValue: number;
  pendingPurchases: number;
  confirmedPurchases: number;
  accreditedUsers: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  accreditedStatus: "pending" | "yes" | "no";
  totalSharesCredited: number;
  totalUsdValue: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface AdminPurchase {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  amountUsd: number;
  requestedShares: number;
  pricePerShare: number;
  status: "pending_review" | "confirmed" | "rejected";
  createdAt: string;
}

export interface SmtpStatus {
  status: "unchecked" | "ok" | "error" | "misconfigured";
  message: string;
  checkedAt: string | null;
}

export interface OHLCPoint {
  date: string; label: string;
  open: number; high: number; low: number; close: number; volume: number;
}

export interface PriceAlert {
  id: string;
  targetPrice: number;
  direction: boolean;
  createdAt: string;
}

export interface AdminTransfer {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  brokerageName: string;
  brokerageAccountNumber: string;
  accountHolderName: string;
  status: "queued" | "transfer_requested" | "completed";
  createdAt: string;
}
