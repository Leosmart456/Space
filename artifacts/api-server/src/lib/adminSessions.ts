import crypto from "crypto";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  return (process.env.ADMIN_PASSWORD ?? "") + (process.env.ADMIN_USERNAME ?? "");
}

export function createAdminSession(): string {
  const timestamp = String(Date.now());
  const hmac = crypto.createHmac("sha256", getSecret()).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) return false;
  const timestamp = token.slice(0, dotIdx);
  const hmac = token.slice(dotIdx + 1);
  const ts = Number(timestamp);
  if (isNaN(ts) || Date.now() - ts > SESSION_TTL_MS) return false;
  const expected = crypto.createHmac("sha256", getSecret()).update(timestamp).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function destroyAdminSession(_token: string | undefined): void {
  // Stateless tokens — logout is handled by clearing the cookie on the client
}
