import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@spacex_jwt";

export function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}/api`;
  return "/api";
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * Explicit token to use:
   *  - `undefined` (default): attach stored JWT if available
   *  - `null`: send NO Authorization header (public/auth endpoints)
   *  - `string`: use this token directly
   */
  token?: string | null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;
  // Distinguish explicit null (no auth) from undefined (use stored token)
  const tokenOpt = "token" in options ? options.token : undefined;
  const base = getApiBase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (tokenOpt === null) {
    // Caller explicitly wants no Authorization header (public endpoints)
  } else if (typeof tokenOpt === "string" && tokenOpt) {
    headers["Authorization"] = `Bearer ${tokenOpt}`;
  } else {
    // undefined — attach stored token if available
    const stored = await getToken();
    if (stored) headers["Authorization"] = `Bearer ${stored}`;
  }

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export interface PriceQuote {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
}

export interface OHLCPoint {
  date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function getPriceQuote(): Promise<PriceQuote> {
  return apiFetch<PriceQuote>("/price/quote", { token: null });
}

export function getPriceHistory(): Promise<{ points: OHLCPoint[] }> {
  return apiFetch<{ points: OHLCPoint[] }>("/price/history", { token: null });
}
