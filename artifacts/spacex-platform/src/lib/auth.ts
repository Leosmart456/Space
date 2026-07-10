const TOKEN_KEY = "spacex_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
