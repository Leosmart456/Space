/**
 * MobileApp.tsx — SpaceX Pre-IPO · Mobile Web Experience
 * Design language: 2074 · Quantum Glass · Holographic UI
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useSettings } from "@/hooks/useUser";
import { api, type Purchase, type Transfer } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { RocketLaunchIcon } from "@/components/RocketLaunchIcon";

// ─── Design System: 2074 Quantum Glass ─────────────────────────────────────
export const D = {
  bg: "#000000",                        // exact landing-page black
  card: "rgba(0,0,0,0.72)",
  cardBright: "rgba(0,0,0,0.88)",
  border: "rgba(255,255,255,0.07)",
  borderGlow: "rgba(255,255,255,0.14)",
  cyan: "#00e5ff",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#f43f5e",
  fg: "#e2e8f0",
  fgStrong: "#ffffff",
  muted: "#475569",
  muted2: "#94a3b8",
  tabBar: "rgba(0,0,0,0.94)",
};

/** Trigger a brief haptic pulse on mobile browsers that support the Vibration API. */
function vib(ms: number | number[] = 10) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}

// ─── Tab & Page State Types ─────────────────────────────────────────────────
type Tab = "dashboard" | "portfolio" | "news" | "buy" | "profile";
type SubPage = "notifications" | "documents" | "security" | "help" | "about" | "accredited" | "notif-settings" | "order-detail";

// ─── CSS Helpers (applied as inline style objects) ──────────────────────────
const glass = (glow = false): React.CSSProperties => ({
  background: D.card,
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderRadius: 20,
  border: `1px solid ${glow ? D.borderGlow : D.border}`,
  ...(glow ? { boxShadow: "0 0 24px rgba(255,255,255,0.04)" } : {}),
});

const glowText: React.CSSProperties = {
  color: D.fgStrong,
  textShadow: "none",
};

// ─── Primitive: Glass Card ──────────────────────────────────────────────────
export function GlassCard({
  children,
  className = "",
  style = {},
  glow = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick ? () => { vib(); onClick(); } : undefined}
      className={`overflow-hidden ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} ${className}`}
      style={{ ...glass(glow), ...style }}
    >
      {children}
    </div>
  );
}

// ─── Primitive: SubPage Shell ───────────────────────────────────────────────
export function SubPageShell({
  title,
  subtitle,
  onBack,
  children,
  accent = "rgba(255,255,255,0.7)",
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto"
      style={{ background: `linear-gradient(180deg, #000000 0%, #000000 100%)` }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => { vib(); onBack(); }}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <p style={{ color: D.fgStrong, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{title}</p>
          {subtitle && <p style={{ color: D.muted2, fontSize: 12, marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 pb-24">{children}</div>
    </div>
  );
}

// ─── Primitive: Sparkline ───────────────────────────────────────────────────
function Sparkline({ data, positive, height = 80 }: { data: number[]; positive: boolean; height?: number }) {
  const color = positive ? D.emerald : D.red;
  const chartData = data.map((v) => ({ v }));
  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#mg2)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Primitive: Row Item ────────────────────────────────────────────────────
function RowItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span style={{ color: D.muted2, fontSize: 13 }}>{label}</span>
      <span style={{ color: valueColor ?? D.fg, fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Primitive: Toggle ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => { vib(); onChange(!checked); }}
      className="relative flex-shrink-0"
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: checked ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.1)",
        transition: "background 0.2s",
        border: `1px solid ${checked ? "rgba(255,255,255,0.5)" : D.border}`,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 22 : 3,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ─── Primitive: Loading Skeleton ────────────────────────────────────────────
function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.07)", width: i === 0 ? "60%" : i % 2 === 0 ? "80%" : "100%" }} />
      ))}
    </GlassCard>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <GlassCard className="p-4 flex items-center gap-3" style={{ borderColor: `rgba(255,255,255,0.12)`, background: `rgba(255,255,255,0.04)` }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p style={{ color: D.muted2, fontSize: 13 }}>{message}</p>
    </GlassCard>
  );
}

// ─── Status helpers ──────────────────────────────────────────────────────────
// All statuses use white — SpaceX monochrome aesthetic
function statusColor(s: string) { return s === "confirmed" ? "#4ade80" : s === "rejected" ? "#f87171" : "rgba(255,255,255,0.55)"; }
function statusLabel(s: string) { return s === "confirmed" ? "Confirmed" : s === "rejected" ? "Rejected" : "Pending"; }

// ─── Greeting ────────────────────────────────────────────────────────────────
function fmtVal(v: number | undefined): string {
  if (v == null || v === 0) return "—";
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  return `${v.toLocaleString()}`;
}

function greet() {
  const h = new Date().getHours();
  return h < 5 ? "Burning midnight oil," : h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════
const DOCS = [
  { name: "Investment Agreement", desc: "Your signed share reservation agreement", date: "On file", icon: "📄" },
  { name: "Risk Disclosure Statement", desc: "Private placement risk factors", date: "On file", icon: "⚠️" },
  { name: "Accreditation Certificate", desc: "Investor accreditation verification", date: "On file", icon: "🏅" },
  { name: "Terms of Service", desc: "Platform usage terms", date: "Updated Jun 2025", icon: "📋" },
  { name: "Privacy Policy", desc: "Data handling & privacy", date: "Updated Jun 2025", icon: "🔒" },
  { name: "W-9 Tax Form", desc: "US tax withholding certification", date: "On file", icon: "🏛️" },
];

function DocumentsPage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  return (
    <SubPageShell title="Documents" subtitle="Agreements & statements" onBack={onBack}>
      <GlassCard className="p-4" style={{ borderColor: `rgba(255,255,255,0.12)` }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 20 }}>💡</span>
          <p style={{ color: D.muted2, fontSize: 12, lineHeight: 1.6 }}>
            All executed documents are stored securely and sent to your registered email. Contact support for certified copies.
          </p>
        </div>
      </GlassCard>
      <div className="flex flex-col gap-2.5">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your Documents</p>
        <GlassCard>
          {DOCS.map((doc, idx) => (
            <div key={doc.name}>
              <button
                className="w-full flex items-center gap-3.5 px-4 py-4 text-left"
                onClick={() => { vib(); toast({ title: doc.name, description: "Contact support@spacexrocket.space to receive this document." }); }}
              >
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {doc.icon}
                </div>
                <div className="flex-1">
                  <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 600 }}>{doc.name}</p>
                  <p style={{ color: D.muted2, fontSize: 11, marginTop: 2 }}>{doc.desc}</p>
                  <p style={{ color: D.muted, fontSize: 10, marginTop: 1, letterSpacing: "0.03em" }}>{doc.date}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
              </button>
              {idx < DOCS.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 64 }} />}
            </div>
          ))}
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 4.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 11a16 16 0 0 0 6 6l1.04-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div className="flex-1">
            <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 600 }}>Request a Document</p>
            <p style={{ color: D.muted2, fontSize: 12, marginTop: 1 }}>support@spacexrocket.space</p>
          </div>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.18)`, color: "rgba(255,255,255,0.8)" }}
            onClick={() => { vib(); window.open("mailto:support@spacexrocket.space?subject=Document%20Request", "_blank", "noopener,noreferrer"); }}
          >
            Email
          </button>
        </div>
      </GlassCard>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: SECURITY
// ══════════════════════════════════════════════════════════════════════════════
function SecurityPage({ onBack }: { onBack: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [twoFa, setTwoFa] = useState(false);
  const [biometric, setBiometric] = useState(true);

  return (
    <SubPageShell title="Security" subtitle="Account protection settings" onBack={onBack} accent="rgba(255,255,255,0.7)">
      {/* Status */}
      <GlassCard className="p-4" style={{ borderColor: `rgba(255,255,255,0.12)`, background: `rgba(255,255,255,0.04)` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(255,255,255,0.10)` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>Account Secure</p>
            <p style={{ color: D.muted2, fontSize: 12, marginTop: 1 }}>No suspicious activity detected</p>
          </div>
        </div>
      </GlassCard>

      {/* Account info */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Account</p>
        <GlassCard>
          {[
            { label: "Email", value: user?.email ?? "—" },
            { label: "Account ID", value: `SPX-${user?.id?.slice(-8).toUpperCase() ?? "XXXXXXXX"}` },
            { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
          ].map((r, i, arr) => (
            <div key={r.label}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span style={{ color: D.muted2, fontSize: 13 }}>{r.label}</span>
                <span style={{ color: D.fg, fontSize: 13, fontWeight: 500, fontFamily: r.label === "Account ID" ? "monospace" : undefined }}>{r.value}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Security Settings */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Settings</p>
        <GlassCard>
          {[
            { label: "Two-Factor Authentication", sub: "Adds a verification code on login", value: twoFa, set: setTwoFa },
            { label: "Biometric Login", sub: "Face ID or fingerprint", value: biometric, set: setBiometric },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                <div className="flex-1">
                  <p style={{ color: D.fg, fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                  <p style={{ color: D.muted2, fontSize: 11, marginTop: 1 }}>{item.sub}</p>
                </div>
                <Toggle checked={item.value} onChange={item.set} />
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Change Password */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Password</p>
        <GlassCard className="p-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => { vib(); toast({ title: "Password Reset", description: "A password reset link has been sent to your email." }); }}
          >
            <div>
              <p style={{ color: D.fg, fontSize: 14, fontWeight: 500 }}>Change Password</p>
              <p style={{ color: D.muted2, fontSize: 11, marginTop: 1 }}>Send reset link to your email</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg" style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.18)` }}>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>Reset</span>
            </div>
          </button>
        </GlassCard>
      </div>

      {/* Recent Login Activity */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Login Activity</p>
        <GlassCard>
          {[
            { device: "iPhone · Safari", location: "New York, US", time: "Just now", current: true },
            { device: "Chrome · macOS", location: "New York, US", time: "2 days ago", current: false },
            { device: "Firefox · Windows", location: "Boston, US", time: "1 week ago", current: false },
          ].map((a, i, arr) => (
            <div key={i}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: a.current ? `rgba(255,255,255,0.1)` : "rgba(255,255,255,0.04)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.current ? "rgba(255,255,255,0.9)" : D.muted2} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div className="flex-1">
                  <p style={{ color: D.fg, fontSize: 13, fontWeight: 500 }}>{a.device} {a.current && <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginLeft: 4, fontWeight: 700 }}>CURRENT</span>}</p>
                  <p style={{ color: D.muted2, fontSize: 11, marginTop: 1 }}>{a.location} · {a.time}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 56 }} />}
            </div>
          ))}
        </GlassCard>
      </div>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: NOTIFICATION SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function NotificationSettingsPage({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({ orderUpdates: true, priceAlerts: true, news: false, marketing: false, systemAlerts: true });
  const toggle = (k: keyof typeof settings) => setSettings(s => ({ ...s, [k]: !s[k] }));
  const notifGroups = [
    { key: "orderUpdates" as const, label: "Order Updates", sub: "Purchase confirmations, rejections, and status changes" },
    { key: "priceAlerts" as const, label: "Price Alerts", sub: "When SPCX hits your target price" },
    { key: "news" as const, label: "SpaceX News", sub: "Mission updates and company announcements" },
    { key: "marketing" as const, label: "Promotions", sub: "Investment opportunities and platform updates" },
    { key: "systemAlerts" as const, label: "System Alerts", sub: "Security and account notifications" },
  ];
  return (
    <SubPageShell title="Notifications" subtitle="Manage your alert preferences" onBack={onBack} accent="rgba(255,255,255,0.7)">
      <GlassCard>
        {notifGroups.map((item, i, arr) => (
          <div key={item.key}>
            <div className="flex items-center justify-between px-4 py-4 gap-3">
              <div className="flex-1">
                <p style={{ color: D.fg, fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                <p style={{ color: D.muted2, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{item.sub}</p>
              </div>
              <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} label={item.label} />
            </div>
            {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-4" style={{ borderColor: `rgba(255,255,255,0.12)` }}>
        <p style={{ color: D.muted2, fontSize: 12, lineHeight: 1.6 }}>
          Email notifications are always active for critical account events. Push notifications require the SpaceX mobile app.
        </p>
      </GlassCard>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: HELP & SUPPORT
// ══════════════════════════════════════════════════════════════════════════════
const FAQS = [
  { q: "How do I buy shares?", a: "Tap the Buy tab, enter the number of SPCX shares you want (minimum varies by settings), agree to the terms, and submit. You'll receive payment instructions via email after admin review." },
  { q: "How long does confirmation take?", a: "Orders typically take 2–3 business days to confirm. You'll receive an email once your order is reviewed by our compliance team." },
  { q: "What payment methods are accepted?", a: "We accept bank wire transfers (ACH & SWIFT), Bitcoin (BTC), and Ethereum (ETH). Payment details are sent via email upon order approval." },
  { q: "How is the share price determined?", a: "The share price reflects the current fair-market value based on SpaceX's latest fundraising round, updated periodically by our finance team." },
  { q: "Can I sell my shares?", a: "Shares are subject to lock-up periods. Transfer requests can be submitted via the Transfer tab. Liquidity events occur at IPO or secondary market events." },
  { q: "What is accredited investor verification?", a: "US regulations require investors in private placements to meet income or net worth thresholds. We verify this via document submission during onboarding." },
];

function HelpPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SubPageShell title="Help & Support" subtitle="We're here to help" onBack={onBack}>
      {/* Contact Options */}
      <div className="flex gap-3">
        {[
          { label: "Email Us", icon: "✉️", action: () => window.open("mailto:support@spacexrocket.space", "_blank", "noopener,noreferrer") },
          { label: "Live Chat", icon: "💬", action: () => window.open("mailto:support@spacexrocket.space?subject=Live%20Chat%20Request", "_blank", "noopener,noreferrer") },
        ].map(btn => (
          <GlassCard key={btn.label} className="flex-1 p-4 flex flex-col items-center gap-2" onClick={() => { vib(); btn.action(); }} glow={btn.label === "Live Chat"}>
            <span style={{ fontSize: 24 }}>{btn.icon}</span>
            <p style={{ color: D.fg, fontSize: 13, fontWeight: 600 }}>{btn.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-3.5" style={{ background: `rgba(255,255,255,0.04)`, borderColor: `rgba(255,255,255,0.10)` }}>
        <p style={{ color: D.muted2, fontSize: 12, textAlign: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>support@spacexrocket.space</span> · Response within 24h
        </p>
        <p style={{ color: D.muted, fontSize: 11, textAlign: "center", marginTop: 4 }}>Mon – Fri, 9am – 6pm EST</p>
      </GlassCard>

      {/* FAQ */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Frequently Asked Questions</p>
        <div className="flex flex-col gap-2">
          {FAQS.map((faq, i) => (
            <GlassCard key={i} className="overflow-hidden">
              <button className="w-full flex items-start gap-3 px-4 py-4 text-left" onClick={() => { vib(); setOpen(open === i ? null : i); }}>
                <div className="flex-1">
                  <p style={{ color: D.fg, fontSize: 13, fontWeight: 600 }}>{faq.q}</p>
                  {open === i && <p style={{ color: D.muted2, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{faq.a}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2"
                  style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: ABOUT
// ══════════════════════════════════════════════════════════════════════════════
function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <SubPageShell title="About" subtitle="SpaceX Pre-IPO Platform" onBack={onBack}>
      <GlassCard className="p-6 flex flex-col items-center gap-3" glow>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.18)` }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div className="text-center">
          <p style={{ color: D.fgStrong, fontSize: 18, fontWeight: 700 }}>SpaceX Pre-IPO</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, marginTop: 2, letterSpacing: "0.06em" }}>INVESTOR PLATFORM</p>
        </div>
        <div className="w-full" style={{ height: 1, background: D.border }} />
        <div className="flex gap-8">
          {[{ label: "Version", value: "1.0.0" }, { label: "Build", value: "2025.07" }].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <p style={{ color: D.muted2, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              <p style={{ color: D.fg, fontSize: 14, fontWeight: 600 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 flex flex-col gap-3">
        <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: 700 }}>Our Mission</p>
        <p style={{ color: D.muted2, fontSize: 13, lineHeight: 1.65 }}>
          The SpaceX Pre-IPO Platform gives accredited investors access to SpaceX equity before the company goes public. We believe in democratizing access to transformative private investments.
        </p>
      </GlassCard>

      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Legal</p>
        <GlassCard>
          {[
            { label: "Terms of Service", action: () => {} },
            { label: "Privacy Policy", action: () => {} },
            { label: "Risk Disclosures", action: () => {} },
            { label: "Regulatory Filings", action: () => {} },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <button className="w-full flex items-center justify-between px-4 py-3.5" onClick={() => { vib(); item.action(); }}>
                <span style={{ color: D.fg, fontSize: 14 }}>{item.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
            </div>
          ))}
        </GlassCard>
      </div>

      <p style={{ color: D.muted, fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>
        © 2025 SpaceX Pre-IPO Platform. All rights reserved.{"\n"}This is not an offering. For accredited investors only.
      </p>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: ACCREDITED INVESTOR
// ══════════════════════════════════════════════════════════════════════════════
function AccreditedPage({ onBack, status }: { onBack: () => void; status: "pending" | "yes" | "no" }) {
  const color = status === "yes" ? "rgba(255,255,255,0.9)" : status === "no" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.65)";
  const statusLabel = status === "yes" ? "Verified Accredited Investor" : status === "no" ? "Accreditation Denied" : "Verification Pending";
  const statusDesc = status === "yes"
    ? "Your accreditation is verified. You are authorized to invest in private placements on this platform."
    : status === "no"
    ? "Your accreditation was not approved. Contact support to understand the reason and appeal the decision."
    : "Your accreditation documents are under review. This typically takes 2–3 business days.";

  return (
    <SubPageShell title="Accreditation" subtitle="Investor verification status" onBack={onBack} accent={color}>
      {/* Status Card */}
      <GlassCard className="p-5" style={{ background: `rgba(255,255,255,0.04)`, borderColor: `rgba(255,255,255,0.12)` }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `rgba(255,255,255,0.09)`, border: `2px solid rgba(255,255,255,0.25)` }}>
            {status === "yes"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : status === "no"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
          </div>
          <div>
            <p style={{ color, fontSize: 16, fontWeight: 700 }}>{statusLabel}</p>
            <p style={{ color: D.muted2, fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>{statusDesc}</p>
          </div>
        </div>
      </GlassCard>

      {/* What is Accreditation */}
      <GlassCard className="p-5 flex flex-col gap-3">
        <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: 700 }}>What is Accreditation?</p>
        <p style={{ color: D.muted2, fontSize: 13, lineHeight: 1.65 }}>
          US securities law requires investors in private placements to be "accredited." This means you meet one of the following criteria:
        </p>
        {[
          "Annual income ≥ $200,000 (or $300,000 joint) for the past 2 years",
          "Net worth ≥ $1,000,000 (excluding primary residence)",
          "Series 7, 65, or 82 licensed professional",
          "Knowledgeable employee of a private fund",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.2)` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
            </div>
            <p style={{ color: D.muted2, fontSize: 13, lineHeight: 1.5 }}>{item}</p>
          </div>
        ))}
      </GlassCard>

      {status !== "yes" && (
        <button
          className="w-full py-4 rounded-xl font-bold text-base"
          style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.2)`, color }}
          onClick={() => { vib(); window.open("mailto:support@spacexrocket.space?subject=Accreditation%20Inquiry", "_blank", "noopener,noreferrer"); }}
        >
          {status === "no" ? "Appeal Decision" : "Check Status"} →
        </button>
      )}
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: NOTIFICATIONS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsPanel({
  onBack,
  purchases,
  onNavigateToOrder,
}: {
  onBack: () => void;
  purchases: any[];
  onNavigateToOrder: (purchaseId: string) => void;
}) {
  const notifications = useMemo(() => {
    const items: { id: string; purchaseId?: string; iconEl: React.ReactNode; color: string; title: string; body: string; time: string; read: boolean }[] = [
      {
        id: "sys1", color: "rgba(255,255,255,0.8)", title: "Welcome to SpaceX Pre-IPO",
        body: "Your account is active. Start investing today.", time: "Platform", read: true,
        iconEl: (
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.15)` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        ),
      },
      {
        id: "sys2", color: D.muted2, title: "Share Price Updated",
        body: "SPCX is now $130 per share.", time: "Today", read: true,
        iconEl: (
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        ),
      },
    ];
    purchases.slice(0, 5).forEach((p: any) => {
      const t = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isConfirmed = p.status === "confirmed";
      const isRejected = p.status === "rejected";
      const accent = isConfirmed ? "rgba(255,255,255,0.85)" : isRejected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.65)";
      items.unshift({
        id: `p-${p.id}`,
        purchaseId: p.id,
        color: accent,
        title: isConfirmed ? "Order Confirmed" : isRejected ? "Order Rejected" : "Order Under Review",
        body: isConfirmed
          ? `${Number(p.amountUsd).toLocaleString()} · ${Number(p.requestedShares).toFixed(2)} SPCX shares credited.`
          : isRejected
          ? `${Number(p.amountUsd).toLocaleString()} reservation was not approved. Contact support.`
          : `${Number(p.amountUsd).toLocaleString()} reservation is being processed.`,
        time: t,
        read: isConfirmed || isRejected,
        iconEl: (
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: isConfirmed ? "rgba(74,222,128,0.10)" : isRejected ? "rgba(248,113,113,0.10)" : "rgba(255,255,255,0.06)", border: `1px solid ${isConfirmed ? "rgba(74,222,128,0.2)" : isRejected ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.10)"}` }}>
            {isConfirmed
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(74,222,128,0.2)"/><path d="M7.5 12.5l3 3 6-6" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : isRejected
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(248,113,113,0.2)"/><path d="M9 9l6 6M15 9l-6 6" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.06)"/><path d="M12 7.5V12l2.5 1.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </div>
        ),
      });
    });
    return items;
  }, [purchases]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SubPageShell title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} onBack={onBack} accent="rgba(255,255,255,0.7)">
      {notifications.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 p-8">
          <div className="w-14 h-14 rounded-[18px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <p style={{ color: D.fg, fontSize: 16, fontWeight: 600 }}>All caught up!</p>
          <p style={{ color: D.muted2, fontSize: 13, textAlign: "center" }}>No notifications yet. Activity will appear here.</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const isOrder = !!n.purchaseId;
            return (
              <GlassCard
                key={n.id}
                className={`p-4 ${isOrder ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
                style={{ borderColor: n.read ? D.border : `${n.color}30`, background: n.read ? D.card : `${n.color}06` }}
                onClick={isOrder ? () => { vib(); onNavigateToOrder(n.purchaseId!); } : undefined}
              >
                <div className="flex items-start gap-3">
                  {n.iconEl}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: n.read ? 500 : 700 }}>{n.title}</p>
                      <span style={{ color: D.muted, fontSize: 10, flexShrink: 0, marginTop: 2 }}>{n.time}</span>
                    </div>
                    <p style={{ color: D.muted2, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{n.body}</p>
                    {isOrder && (
                      <p style={{ color: n.color, fontSize: 11, fontWeight: 600, marginTop: 5 }}>Tap to view order details →</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardTab({ onNavigate, onSubPage, onOpenOrder, onGoTransfer }: { onNavigate: (tab: Tab) => void; onSubPage: (p: SubPage) => void; onOpenOrder?: (id: string) => void; onGoTransfer: () => void }) {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { data: settings } = useSettings();
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const { data: history } = useQuery({ queryKey: ["priceHistory"], queryFn: api.getPriceHistory, staleTime: 4 * 3600_000, retry: 1 });
  const { data: latestLaunch } = useQuery({
    queryKey: ["spacexLatest"],
    queryFn: () => fetch("https://api.spacexdata.com/v5/launches/latest").then(r => r.json()),
    staleTime: 3600_000, retry: 1,
  });

  const { data: newsArticles } = useQuery({
    queryKey: ["spaceflightNews"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles/?limit=5&search=spacex&ordering=-published_at"
      );
      return res.json();
    },
    staleTime: 15 * 60_000,
    retry: 1,
  });

  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;
  const chartData = useMemo(() => history?.points?.slice(-30).map((p: any) => p.close) ?? [], [history]);
  const confirmedPurchases = useMemo(() => purchases.filter(p => p.status === "confirmed"), [purchases]);
  const totalInvested = useMemo(() => confirmedPurchases.reduce((s, p) => s + p.amountUsd, 0), [confirmedPurchases]);
  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;
  const gain = portfolioValue - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const systemMode = settings?.systemMode ?? "pre_ipo";
  const firstName = user?.fullName?.split(" ")[0] ?? "Investor";
  const isPost = systemMode === "post_ipo";

  const FALLBACK_NEWS = [
    ...(latestLaunch ? [{ id: "live", headline: `Mission: ${latestLaunch.name}`, detail: latestLaunch.details?.slice(0, 80) ?? "Latest SpaceX mission.", time: latestLaunch.date_utc ? new Date(latestLaunch.date_utc).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent", tag: latestLaunch.success ? "✓ Success" : "Mission", tagColor: "rgba(255,255,255,0.75)", url: null }] : []),
    { id: "n1", headline: "Starship completes integrated flight test", detail: "Record altitude reached. Full reusability milestone achieved.", time: "2h ago", tag: "Mission", tagColor: "rgba(255,255,255,0.75)", url: null },
    { id: "n2", headline: "SpaceX wins $5.9B NASA lunar contract", detail: "SpaceX selected as the sole provider for Artemis lunar lander.", time: "1d ago", tag: "Contract", tagColor: "rgba(255,255,255,0.75)", url: null },
    { id: "n3", headline: "Starlink hits 4M subscribers globally", detail: "Revenue milestone strengthens SpaceX's market-leading position.", time: "3d ago", tag: "Starlink", tagColor: "rgba(255,255,255,0.75)", url: null },
  ];
  const NEWS = newsArticles?.results?.length > 0
    ? (newsArticles.results as any[]).slice(0, 5).map((a: any) => ({
        id: String(a.id),
        headline: a.title,
        detail: a.summary ? a.summary.slice(0, 100) + (a.summary.length > 100 ? "…" : "") : "",
        time: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tag: a.newsSite || "SpaceX",
        tagColor: "rgba(255,255,255,0.75)",
        url: a.url,
      }))
    : FALLBACK_NEWS;

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p style={{ color: D.muted2, fontSize: 11, fontWeight: 400 }}>{greet()}</p>
          <p style={{ color: D.fgStrong, fontSize: 20, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>{firstName}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: `rgba(255,255,255,0.08)`,
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          >
            <span className="animate-pulse w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.8)" }} />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
              {isPost ? "POST-IPO" : "PRE-IPO"}
            </span>
          </div>
          <button
            onClick={() => { vib(); onSubPage("notifications"); }}
            aria-label="Open notifications"
            className="w-9 h-9 rounded-[11px] flex items-center justify-center relative"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {purchases.filter(p => p.status === "pending_review").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: D.red, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                {purchases.filter(p => p.status === "pending_review").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Portfolio Hero */}
      <div className="rounded-[18px] overflow-hidden" style={{ background: "linear-gradient(135deg,#000000 0%,#000000 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: 14 }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: D.muted2, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Portfolio Value</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>SPCX</span>
          </div>
          <p style={{ color: D.fgStrong, fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            ${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {gainPct >= 0
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.emerald} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.red} strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            }
            <span style={{ color: gainPct >= 0 ? D.emerald : D.red, fontSize: 12, fontWeight: 700 }}>
              {gain >= 0 ? "+" : ""}${Math.abs(gain).toLocaleString("en-US", { maximumFractionDigits: 0 })} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
            </span>
            <span style={{ color: D.muted, fontSize: 10 }}>all time</span>
          </div>

          {/* Mini portfolio sparkline — inside the card */}
          {chartData.length > 1 && (
            <div style={{ height: 72, marginLeft: -14, marginRight: -14, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.map((v: number) => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mobileHeroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gainPct >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={gainPct >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={gainPct >= 0 ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#mobileHeroGrad)" isAnimationActive={false} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 0" }} />
          <div className="flex">
            {[
              { label: "Share Price", value: `${sharePrice}` },
              { label: "Your Shares", value: totalShares.toFixed(2) },
              { label: "Invested", value: `${totalInvested.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-0.5"
                style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <p style={{ color: D.muted2, fontSize: 9, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ color: D.fgStrong, fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button onClick={() => { vib(12); onNavigate("buy"); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] font-semibold text-sm"
          style={{ background: "#ffffff", color: "#000", fontWeight: 700 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Buy Shares
        </button>
        <button onClick={() => { vib(); setLocation("/history"); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] font-semibold text-sm border"
          style={{ background: D.card, borderColor: D.border, color: D.fg, backdropFilter: "blur(16px)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="2" width="14" height="12" rx="1.2" transform="translate(5,5)"/><line x1="9" y1="11" x2="17" y2="11"/><line x1="9" y1="14.5" x2="13.5" y2="14.5"/></svg>
          Transactions
        </button>
        <button onClick={() => { vib(); onGoTransfer(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] font-semibold text-sm border"
          style={{ background: D.card, borderColor: D.border, color: D.fg, backdropFilter: "blur(16px)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4h11m0 0L8 1m4 3L8 7"/><path d="M23 20H12m0 0l4-3m-4 3l4 3"/></svg>
          Transfer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-2">
        {[
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, count: purchases.filter(p => p.status === "pending_review").length, label: "Pending" },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, count: confirmedPurchases.length, label: "Confirmed" },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, count: "84.4k", label: "Investors" },
        ].map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[14px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(16px)" }}>
            {s.icon}
            <p style={{ color: D.fgStrong, fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.count}</p>
            <p style={{ color: D.muted2, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700 }}>Recent Activity</p>
          {purchases.length > 0 && <button onClick={() => { vib(); onNavigate("portfolio"); }} style={{ color: D.muted2, fontSize: 12, fontWeight: 600 }}>See all</button>}
        </div>
        {purchases.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-3 p-8">
            <RocketLaunchIcon className="w-12 h-12" />
            <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>No purchases yet</p>
            <p style={{ color: D.muted2, fontSize: 13, textAlign: "center" }}>Tap Buy Shares to reserve your first SPCX allocation.</p>
          </GlassCard>
        ) : (
          <GlassCard>
            {purchases.slice(0, 4).map((p, idx) => (
              <div key={p.id}>
                <button className="w-full text-left" onClick={() => { vib(); onOpenOrder?.(p.id); }} style={{ cursor: "pointer" }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700 }}>SPCX Purchase</p>
                      <p style={{ color: D.muted2, fontSize: 11, marginTop: 2 }}>
                        {p.requestedShares.toFixed(2)} shares @ ${Number(p.pricePerShare).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div style={{ textAlign: "right" }}>
                        <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${p.amountUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                        <span style={{ color: statusColor(p.status), fontSize: 11, fontWeight: 700 }}>{statusLabel(p.status)}</span>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </button>
                {idx < Math.min(purchases.length, 4) - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
              </div>
            ))}
          </GlassCard>
        )}
      </div>

      {/* SpaceX News */}
      <div>
        <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>SpaceX News</p>
        <div className="flex flex-col gap-2">
          {NEWS.map(item => (
            <GlassCard
              key={item.id}
              className="p-3 flex flex-col gap-2"
              onClick={(item as any).url ? () => { vib(); window.open((item as any).url, "_blank", "noopener,noreferrer"); } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {item.tag}
                </span>
                <span style={{ color: D.muted, fontSize: 10 }}>{item.time}</span>
              </div>
              <p style={{ color: D.fgStrong, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{item.headline}</p>
              {(item as any).detail && <p style={{ color: D.muted2, fontSize: 11, lineHeight: 1.4 }}>{(item as any).detail}</p>}
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Market Data */}
      <div>
        <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Market Data</p>
        <GlassCard>
          {[
            { label: "Share Price", value: `${sharePrice}`, accent: D.fgStrong },
            { label: "52-Week High", value: "$225.64", accent: undefined },
            { label: "52-Week Low", value: "$147.11", accent: undefined },
            { label: "Market Cap", value: fmtVal(quote?.valuation), accent: D.fgStrong },
            { label: "Float", value: "Private" },
          ].map((s, i, arr) => (
            <div key={s.label}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span style={{ color: D.muted2, fontSize: 12 }}>{s.label}</span>
                <span style={{ color: (s as any).accent ?? D.fg, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 12 }} />}
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Valuation */}
      <div className="rounded-[16px] p-4 flex flex-col items-center gap-1"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <p style={{ color: D.muted2, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>SpaceX Valuation</p>
        <p style={{ color: D.fgStrong, fontSize: 30, fontWeight: 800, letterSpacing: -1.5 }}>{fmtVal(quote?.valuation)}</p>
        <p style={{ color: D.muted2, fontSize: 11 }}>Most valuable private company in history</p>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT: MOBILE PRICE CHART (replaces TradingView iframe)
// ══════════════════════════════════════════════════════════════════════════════
const CHART_PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
] as const;
type ChartPeriod = (typeof CHART_PERIODS)[number]["label"];

function MobilePriceChart({ height = 300 }: { height?: number }) {
  const [period, setPeriod] = useState<ChartPeriod>("1M");

  const { data: histData } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: api.getPriceHistory,
    staleTime: 4 * 3600_000,
    retry: 1,
  });
  const { data: quote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: api.getPriceQuote,
    staleTime: 60_000,
    retry: 1,
  });

  const allPoints = (histData?.points ?? []) as { date: string; label: string; close: number }[];
  const days = CHART_PERIODS.find((p) => p.label === period)?.days ?? 30;
  const sliced = allPoints.slice(-days);
  const chartData = sliced.map((p) => ({ date: p.label, price: p.close }));

  const livePrice = quote?.price ?? allPoints[allPoints.length - 1]?.close ?? 130;
  const change = quote?.change ?? 0;
  const changePct = quote?.changePercent ?? 0;
  const isUp = changePct >= 0;
  const lineColor = isUp ? "#4ade80" : "#f87171";

  const interval = period === "1W" ? 1 : period === "1M" ? 4 : period === "3M" ? 9 : 30;

  return (
    <div style={{
      background: "#000000",
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      height,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>SPCX · NASDAQ</span>
            <span className="relative flex" style={{ width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: lineColor, opacity: 0.6, animation: "chartPing 1.4s ease-in-out infinite" }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: lineColor, display: "block" }} />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
              ${livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ color: lineColor, fontSize: 11, fontWeight: 700 }}>
              {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 2 }}>
          {CHART_PERIODS.map((p) => {
            const active = period === p.label;
            return (
              <button key={p.label} onClick={() => { vib(); setPeriod(p.label); }}
                style={{
                  padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: active ? 700 : 500,
                  background: active ? "rgba(255,255,255,0.14)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.35)",
                  border: "none", cursor: "pointer",
                }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="mobileAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                <stop offset="60%" stopColor={lineColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={interval}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#000000",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 12,
                padding: "6px 12px",
              }}
              formatter={(v: number) => [
                `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                "SPCX",
              ]}
              labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
              cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            {/* Signal reference line at the live price */}
            <ReferenceLine
              y={livePrice}
              stroke={lineColor}
              strokeDasharray="5 4"
              strokeWidth={1}
              strokeOpacity={0.5}
              label={{ value: `$${livePrice.toFixed(2)}`, position: "right", fill: lineColor, fontSize: 9, fontWeight: 700 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#mobileAreaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: lineColor, stroke: "#000000", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)} today
        </span>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9 }}>Yahoo Finance · SPCX</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PORTFOLIO
// ══════════════════════════════════════════════════════════════════════════════
const ALLOC = [
  { label: "Starship", pct: 42, color: "#4ade80" },
  { label: "Starlink", pct: 31, color: "#38bdf8" },
  { label: "Dragon",   pct: 16, color: "#c084fc" },
  { label: "Other",    pct: 11, color: "rgba(255,255,255,0.28)" },
];

function PortfolioTab({ onNavigate, onSubPage, onOpenOrder, historyTrigger = 0 }: { onNavigate: (tab: Tab) => void; onSubPage: (p: SubPage) => void; onOpenOrder?: (id: string) => void; historyTrigger?: number }) {
  const { user } = useUser();
  const { data: settings } = useSettings();
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const { data: history } = useQuery({ queryKey: ["priceHistory"], queryFn: api.getPriceHistory, staleTime: 4 * 3600_000, retry: 1 });
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const [histTab, setHistTab] = useState<"holdings" | "history">("holdings");
  useEffect(() => { if (historyTrigger > 0) setHistTab("history"); }, [historyTrigger]);

  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;
  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;
  const confirmed = useMemo(() => purchases.filter(p => p.status === "confirmed"), [purchases]);
  const totalInvested = useMemo(() => confirmed.reduce((s, p) => s + p.amountUsd, 0), [confirmed]);
  const gain = portfolioValue - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const chartData = useMemo(() => history?.points?.slice(-30).map((p: any) => p.close) ?? [], [history]);
  const acc = user?.accreditedStatus ?? "pending";
  const accColor = acc === "yes" ? "#4ade80" : acc === "no" ? "#f87171" : "rgba(255,255,255,0.55)";

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <p style={{ color: D.fgStrong, fontSize: 20, fontWeight: 800, letterSpacing: -0.5, paddingTop: 4 }}>Portfolio</p>

      {/* Hero */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: "linear-gradient(135deg,#000000 0%,#000000 100%)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ padding: "12px 14px" }}>
          <div className="flex items-center justify-between mb-1">
            <p style={{ color: D.muted2, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Total Value</p>
            <div className="flex items-center px-1.5 py-0.5 rounded-md" style={{ background: `rgba(255,255,255,0.09)` }}>
              <span style={{ color: gainPct >= 0 ? "#4ade80" : "#f87171", fontSize: 11, fontWeight: 700 }}>
                {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%
              </span>
            </div>
          </div>
          <p style={{ color: D.fgStrong, fontSize: 24, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
            ${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
          <div className="flex">
            {[
              { label: "Shares", value: totalShares.toFixed(2), color: D.fg },
              { label: "Invested", value: `${totalInvested.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: D.fg },
              { label: "Gain/Loss", value: `${gain >= 0 ? "+" : "-"}${Math.abs(gain).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: gain >= 0 ? "#4ade80" : "#f87171" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-0.5"
                style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <p style={{ color: D.muted2, fontSize: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPCX Price Chart */}
      <MobilePriceChart height={300} />

      {/* Accreditation */}
      <button className="w-full text-left" onClick={() => { vib(); onSubPage("accredited"); }}>
        <GlassCard className="p-4" style={{ borderColor: `${accColor}25` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: `${accColor}15` }}>
              {acc === "yes"
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accColor} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              }
            </div>
            <div className="flex-1">
              <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 600 }}>
                {acc === "yes" ? "Accredited Investor ✓" : acc === "no" ? "Accreditation Denied" : "Verification Pending"}
              </p>
              <p style={{ color: D.muted2, fontSize: 11, marginTop: 1 }}>
                {acc === "yes" ? "Tap to view verification details" : acc === "no" ? "Tap to appeal" : "Usually 2–3 business days · Tap to learn more"}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </GlassCard>
      </button>

      {/* Allocation */}
      {totalShares > 0 && (
        <GlassCard className="p-4 flex flex-col gap-4">
          <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: 700 }}>Segment Allocation</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {ALLOC.map(a => <div key={a.label} style={{ width: `${a.pct}%`, background: a.color, borderRadius: 2 }} />)}
          </div>
          <div className="flex flex-wrap gap-3">
            {ALLOC.map(a => (
              <div key={a.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span style={{ color: D.muted2, fontSize: 12 }}>{a.label}</span>
                <span style={{ color: D.fgStrong, fontSize: 12, fontWeight: 700 }}>{a.pct}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Tab Toggle */}
      <div className="flex rounded-[12px] p-1 gap-1" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}` }}>
        {(["holdings", "history"] as const).map(t => (
          <button key={t} onClick={() => { vib(); setHistTab(t); }}
            className="flex-1 py-2.5 rounded-[9px] text-sm font-semibold transition-all"
            style={{ background: histTab === t ? "rgba(255,255,255,0.12)" : "transparent", color: histTab === t ? D.fgStrong : D.muted2 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Holdings */}
      {histTab === "holdings" && (
        totalShares > 0 ? (
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ background: `rgba(255,255,255,0.08)`, border: `1px solid rgba(255,255,255,0.18)` }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em" }}>SPCX</span>
              </div>
              <div className="flex-1">
                <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700 }}>SpaceX</p>
                <p style={{ color: D.muted2, fontSize: 12, marginTop: 1 }}>{totalShares.toFixed(4)} shares @ ${sharePrice}/share</p>
              </div>
              <div className="flex flex-col items-end">
                <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                <p style={{ color: gainPct >= 0 ? D.emerald : D.red, fontSize: 12, fontWeight: 600 }}>{gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%</p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col items-center gap-3 p-8">
            <span style={{ fontSize: 36 }}>📈</span>
            <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>No holdings yet</p>
            <button onClick={() => { vib(12); onNavigate("buy"); }} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#ffffff", color: "#000000" }}>Buy Shares</button>
          </GlassCard>
        )
      )}

      {/* History */}
      {histTab === "history" && (
        purchases.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-3 p-8">
            <span style={{ fontSize: 36 }}>📋</span>
            <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>No history yet</p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {purchases.map(p => (
              <button key={p.id} className="w-full text-left" onClick={() => { vib(); onOpenOrder?.(p.id); }}>
                <GlassCard className="p-4" style={{ borderColor: `${statusColor(p.status)}20` }}>
                  <div className="flex items-start justify-between mb-3">
                    <p style={{ color: D.fgStrong, fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>${p.amountUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: `${statusColor(p.status)}18`, color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}30` }}>
                        {statusLabel(p.status)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      ["Shares", `${p.requestedShares.toFixed(2)} SPCX`],
                      ["Price per share", `${p.pricePerShare}`],
                      ["Date", new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span style={{ color: D.muted2, fontSize: 12 }}>{l}</span>
                        <span style={{ color: D.fg, fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginTop: 8 }}>Tap to view details →</p>
                </GlassCard>
              </button>
            ))}
          </div>
        )
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-PAGE: ORDER DETAIL
// ══════════════════════════════════════════════════════════════════════════════
function OrderDetailPage({ purchaseId, onBack }: { purchaseId: string; onBack: () => void }) {
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const { data: settings } = useSettings();
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, retry: 1 });
  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;
  const purchase = (purchases as Purchase[]).find(p => p.id === purchaseId);

  const sc = (s: string) => s === "confirmed" ? "#4ade80" : s === "rejected" ? "#f87171" : "rgba(255,255,255,0.55)";
  const sl = (s: string) => s === "confirmed" ? "Confirmed" : s === "rejected" ? "Rejected" : "Pending Review";

  if (!purchase) return (
    <SubPageShell title="Order Detail" subtitle="Purchase details" onBack={onBack}>
      <div className="flex flex-col items-center gap-3 py-16">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill={D.muted2}/></svg>
        <p style={{ color: D.muted2, fontSize: 15 }}>Order not found</p>
        <button onClick={() => { vib(); onBack(); }} style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Go back</button>
      </div>
    </SubPageShell>
  );

  const statusColor = sc(purchase.status);
  const statusLbl = sl(purchase.status);
  const currentValue = Number(purchase.requestedShares) * sharePrice;
  const gainLoss = currentValue - Number(purchase.amountUsd);
  const gainPct = (gainLoss / Number(purchase.amountUsd)) * 100;

  const TIMELINE = [
    {
      label: "Order Placed",
      date: new Date(purchase.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      done: true,
    },
    {
      label: "Under Review",
      date: "KYC & accreditation check",
      done: purchase.status !== "pending_review",
    },
    {
      label: purchase.status === "rejected" ? "Rejected" : "Shares Credited",
      date: purchase.status === "confirmed" ? "Shares added to your portfolio" : purchase.status === "rejected" ? "Contact support to appeal" : "Awaiting confirmation",
      done: purchase.status === "confirmed" || purchase.status === "rejected",
    },
  ];

  return (
    <SubPageShell title="Order Detail" subtitle={`#${purchase.id.slice(-8).toUpperCase()}`} onBack={onBack} accent={statusColor}>
      <div className="flex flex-col gap-4">

        {/* Status Hero */}
        <GlassCard className="p-6 flex flex-col items-center gap-2" glow>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
            style={{ background: `${statusColor}20`, border: `2px solid ${statusColor}40` }}>
            {purchase.status === "confirmed"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : purchase.status === "rejected"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
          </div>
          <span style={{ color: statusColor, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{statusLbl}</span>
          <p style={{ color: D.fgStrong, fontSize: 36, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
            ${Number(purchase.amountUsd).toLocaleString()}
          </p>
          <p style={{ color: D.muted2, fontSize: 13 }}>{Number(purchase.requestedShares).toFixed(4)} SPCX shares</p>
        </GlassCard>

        {/* Current value — confirmed only */}
        {purchase.status === "confirmed" && (
          <GlassCard className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p style={{ color: D.muted2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Current Value</p>
                <p style={{ color: D.fgStrong, fontSize: 22, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="items-end flex flex-col">
                <p style={{ color: D.muted2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Gain / Loss</p>
                <p style={{ color: gainLoss >= 0 ? D.emerald : D.red, fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  {gainLoss >= 0 ? "+" : ""}${Math.abs(gainLoss).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p style={{ color: gainLoss >= 0 ? D.emerald : D.red, fontSize: 12, fontWeight: 600 }}>
                  ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Order Details */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Order Details</p>
          <GlassCard>
            {[
              { label: "Order ID", value: `#${purchase.id.slice(-8).toUpperCase()}` },
              { label: "Ticker", value: "SPCX" },
              { label: "Price Per Share", value: `${Number(purchase.pricePerShare).toLocaleString()}` },
              { label: "Shares", value: Number(purchase.requestedShares).toFixed(4) },
              { label: "Total Invested", value: `${Number(purchase.amountUsd).toLocaleString()}` },
              { label: "Date", value: new Date(purchase.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Time", value: new Date(purchase.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + " UTC" },
            ].map((row, idx, arr) => (
              <div key={row.label}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span style={{ color: D.muted2, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: D.fgStrong, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                </div>
                {idx < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Timeline */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Order Timeline</p>
          <GlassCard className="p-4">
            {TIMELINE.map((step, idx) => (
              <div key={step.label} className="flex gap-4" style={{ minHeight: 60 }}>
                <div className="flex flex-col items-center" style={{ width: 24 }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)") : D.border}`,
                    }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)") : D.muted}
                      strokeWidth="2.5">
                      {step.done
                        ? (purchase.status === "rejected" && idx === TIMELINE.length - 1
                          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                          : <polyline points="20 6 9 17 4 12"/>)
                        : <circle cx="12" cy="12" r="8"/>
                      }
                    </svg>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: step.done ? "rgba(255,255,255,0.18)" : D.border, marginTop: 4, minHeight: 20 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 16, flex: 1 }}>
                  <p style={{ color: step.done ? D.fgStrong : D.muted2, fontSize: 14, fontWeight: 600 }}>{step.label}</p>
                  <p style={{ color: D.muted2, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{step.date}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>

      </div>
    </SubPageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: BUY
// ══════════════════════════════════════════════════════════════════════════════
function BuyTab() {
  const { user } = useUser();
  const { data: settings } = useSettings();
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rawShares, setRawShares] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ amount: 0, shares: 0 });

  const BULK_DISCOUNT_MIN_SHARES = 20;
  const BULK_DISCOUNT_PERCENT = 20;
  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;
  const isPostIpo = settings?.systemMode === "post_ipo";
  const minInvestment = settings?.minInvestment ?? 2000;
  const minShares = sharePrice > 0 ? Math.max(1, Math.ceil(minInvestment / sharePrice)) : 1;
  const shares = parseFloat(rawShares.replace(/,/g, "")) || 0;
  const originalAmt = shares * sharePrice;
  const discountApplies = shares > BULK_DISCOUNT_MIN_SHARES;
  const discountAmt = discountApplies ? originalAmt * (BULK_DISCOUNT_PERCENT / 100) : 0;
  const numAmt = originalAmt - discountAmt;
  const isValid = shares >= minShares && agreed;
  const PRESETS = [minShares, minShares * 2, minShares * 5, minShares * 10, minShares * 20];

  function fmt(raw: string) {
    const d = raw.replace(/[^0-9]/g, "");
    return d ? parseInt(d, 10).toLocaleString("en-US") : "";
  }

  const createPurchase = useMutation({
    mutationFn: (body: { requestedShares: number; agreedToTerms: boolean }) => api.createPurchase(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchases"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  async function handleConfirm() {
    if (!isValid) return;
    if (user?.accreditedStatus !== "yes") {
      toast({ title: "Verification Required", description: "Accreditation must be verified before purchasing.", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      await createPurchase.mutateAsync({ requestedShares: shares, agreedToTerms: true });
      setSuccessData({ amount: numAmt, shares });
      setShowReview(false); setSuccess(true); setRawShares(""); setAgreed(false);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-10">
        <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: `rgba(255,255,255,0.09)`, border: `2px solid rgba(255,255,255,0.3)` }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div className="text-center">
          <p style={{ color: D.fgStrong, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Order Submitted!</p>
          <p style={{ color: D.muted2, fontSize: 14, marginTop: 6, lineHeight: 1.55, maxWidth: 280 }}>Payment instructions sent to your email within 2–3 business days.</p>
        </div>
        <GlassCard className="w-full p-4 flex flex-col gap-3">
          {[
            { l: "Shares Requested", v: `${successData.shares.toLocaleString()} SPCX` },
            { l: "Estimated Cost", v: `${successData.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { l: "Status", v: "Pending Review", c: "rgba(255,255,255,0.7)" },
          ].map(r => <div key={r.l} className="flex justify-between"><span style={{ color: D.muted2, fontSize: 13 }}>{r.l}</span><span style={{ color: (r as any).c ?? D.fg, fontSize: 13, fontWeight: 600 }}>{r.v}</span></div>)}
        </GlassCard>
        <button onClick={() => { vib(12); setSuccess(false); }} className="px-10 py-4 rounded-[14px] font-bold text-base" style={{ background: "#ffffff", color: "#000000" }}>Continue</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <div className="pt-2">
        <p style={{ color: D.fgStrong, fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>Buy Shares</p>
        <p style={{ color: D.muted2, fontSize: 14, marginTop: 2 }}>{isPostIpo ? "Purchase SpaceX (SPCX) shares" : "Reserve SpaceX (SPCX) pre-IPO equity"}</p>
      </div>

      {/* Bulk discount promo banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 14, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#4ade80", fontSize: 13, fontWeight: 700, margin: 0 }}>20% Bulk Discount</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, marginTop: 1 }}>Buy more than {BULK_DISCOUNT_MIN_SHARES} shares and save 20% automatically</p>
        </div>
      </div>

      {/* Live Price */}
      <div className="rounded-[20px] p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.12)` }}>
        <div className="flex items-start justify-between">
          <div>
            <p style={{ color: D.muted2, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Live Price</p>
            <p style={{ color: D.fgStrong, fontSize: 36, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>${sharePrice.toLocaleString()}</p>
            <p style={{ color: D.muted2, fontSize: 11, fontWeight: 500, marginTop: 2 }}>SPCX · per share</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="px-2 py-0.5 rounded-md" style={{ background: `rgba(255,255,255,0.10)`, border: `1px solid rgba(255,255,255,0.18)` }}>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700 }}>● Live</span>
            </div>
            <p style={{ color: D.muted2, fontSize: 11 }}>Min {minShares.toLocaleString()} shares</p>
            <p style={{ color: D.muted2, fontSize: 11 }}>Mkt Cap {fmtVal(quote?.valuation)}</p>
          </div>
        </div>
      </div>

      {/* Shares Input */}
      <div className="flex flex-col gap-2">
        <label style={{ color: D.muted2, fontSize: 12, fontWeight: 600 }}>Number of Shares</label>
        <div className="flex items-center h-18 px-5 rounded-[16px] border-2 transition-all"
          style={{
            height: 72, background: D.card, backdropFilter: "blur(16px)",
            borderColor: shares > 0 && shares < minShares ? "rgba(255,80,80,0.6)" : shares >= minShares ? "rgba(255,255,255,0.5)" : D.border,
            boxShadow: shares >= minShares ? `0 0 16px rgba(255,255,255,0.08)` : "none",
          }}>
          <input
            type="text" inputMode="numeric" value={rawShares} onChange={e => setRawShares(fmt(e.target.value))}
            placeholder="0" className="flex-1 bg-transparent outline-none"
            style={{ color: D.fgStrong, fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
          />
          <span style={{ color: D.muted, fontSize: 12, fontWeight: 600 }}>SPCX shares</span>
        </div>
        {shares > 0 && shares < minShares && <p style={{ color: D.red, fontSize: 12 }}>Minimum {minShares.toLocaleString()} shares</p>}
        {shares >= minShares && !discountApplies && (
          <p style={{ color: D.muted2, fontSize: 12 }}>≈ ${numAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD · buy over {BULK_DISCOUNT_MIN_SHARES} shares for 20% off</p>
        )}
        {discountApplies && (
          <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 w-fit" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
            <span style={{ color: D.emerald, fontSize: 12, fontWeight: 700 }}>20% bulk discount applied</span>
            <span style={{ color: D.muted2, fontSize: 12 }}>— you save ${discountAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => {
          const active = shares === p;
          return (
            <button key={p} onClick={() => { vib(); setRawShares(p.toLocaleString("en-US")); }}
              className="py-2 px-3.5 rounded-[10px] text-sm font-semibold transition-all"
              style={{ background: active ? `rgba(255,255,255,0.14)` : "rgba(255,255,255,0.05)", border: `1px solid ${active ? "rgba(255,255,255,0.35)" : D.border}`, color: active ? D.fgStrong : D.fg }}>
              {p.toLocaleString()}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      {shares >= minShares && (
        <GlassCard className="p-4 flex flex-col gap-3" style={{ borderColor: `rgba(255,255,255,0.12)`, background: `rgba(255,255,255,0.04)` }}>
          <div className="flex justify-between items-baseline">
            <span style={{ color: D.muted2, fontSize: 13 }}>Estimated cost</span>
            <span style={{ color: D.fgStrong, fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {discountApplies && (
                <span style={{ color: D.muted, fontSize: 15, fontWeight: 400, textDecoration: "line-through", marginRight: 6 }}>
                  ${originalAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
              ${numAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ height: 1, background: D.border }} />
          {[
            ["Price per share", `${sharePrice}`],
            ["Shares requested", shares.toLocaleString()],
            ...(discountApplies ? [["Bulk discount (20%)", `-${discountAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}`]] : []),
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span style={{ color: D.muted2, fontSize: 13 }}>{l}</span>
              <span style={{ color: D.fg, fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Terms */}
      <button className="flex items-start gap-3" onClick={() => { vib(); setAgreed(v => !v); }}>
        <div className="w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{ background: agreed ? "rgba(255,255,255,0.92)" : "transparent", border: `1.5px solid ${agreed ? "rgba(255,255,255,0.5)" : D.border}` }}>
          {agreed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <p style={{ color: D.muted2, fontSize: 12, lineHeight: 1.55, textAlign: "left" }}>
          {isPostIpo ? "I agree to the terms of this share purchase" : "I am an accredited investor and agree to the terms of this private share reservation"}
        </p>
      </button>

      {/* CTA */}
      <button
        onClick={() => { if (isValid) { vib(); setShowReview(true); } }} disabled={!isValid}
        className="h-14 rounded-[14px] flex items-center justify-center gap-2 font-bold text-base transition-all"
        style={{ background: isValid ? "#ffffff" : "rgba(255,255,255,0.07)", color: isValid ? "#000000" : D.muted }}>
        {shares >= minShares ? `${isPostIpo ? "Buy" : "Reserve"} ${shares.toLocaleString()} Shares →` : "Enter Shares to Continue"}
      </button>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full rounded-t-[28px] flex flex-col" style={{ background: "#000000", border: `1px solid rgba(255,255,255,0.1)`, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex justify-center pt-4 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: D.border }} /></div>
            <div className="px-6 pb-10 pt-2 flex flex-col gap-5">
              <div>
                <p style={{ color: D.fgStrong, fontSize: 24, fontWeight: 800, marginTop: 8 }}>Review Order</p>
                <p style={{ color: D.muted2, fontSize: 13, marginTop: 2 }}>Confirm your share purchase</p>
              </div>
              <GlassCard>
                {[
                  { l: "Shares", v: `${shares.toLocaleString()} SPCX`, hi: true },
                  { l: "Price Per Share", v: `${sharePrice}`, hi: false },
                  ...(discountApplies ? [{ l: "Bulk Discount", v: `-20% (-${discountAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })})`, hi: false }] : []),
                  { l: "Estimated Cost", v: `${numAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, hi: false },
                  { l: "Settlement", v: "2–3 business days", hi: false },
                ].map((r, i, arr) => (
                  <div key={r.l}>
                    <div className="flex justify-between px-4 py-3.5">
                      <span style={{ color: D.muted2, fontSize: 13 }}>{r.l}</span>
                      <span style={{ color: r.hi ? D.fgStrong : D.fg, fontSize: 15, fontWeight: r.hi ? 700 : 600 }}>{r.v}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: D.border }} />}
                  </div>
                ))}
              </GlassCard>
              <GlassCard className="p-3.5" style={{ background: `rgba(255,255,255,0.04)`, borderColor: `rgba(255,255,255,0.10)` }}>
                <p style={{ color: D.muted2, fontSize: 12, lineHeight: 1.55 }}>Payment via bank wire or crypto. Instructions sent to email after admin review.</p>
              </GlassCard>
              <button onClick={() => { vib(12); handleConfirm(); }} disabled={submitting} className="h-14 rounded-[14px] font-bold text-base"
                style={{ background: "#ffffff", color: "#000000", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting..." : "Confirm Purchase"}
              </button>
              <button onClick={() => { vib(); setShowReview(false); }} style={{ color: D.muted, fontSize: 14, textAlign: "center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PROFILE
// ══════════════════════════════════════════════════════════════════════════════
// SVG icon library for profile page settings items
const ProfileIcon = {
  documents: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  bell: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  transfer: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  ),
  shield: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  help: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17" r="0.5" fill={color}/>
    </svg>
  ),
  about: (color: string) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <circle cx="12" cy="8" r="0.5" fill={color}/>
    </svg>
  ),
  camera: (color: string) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
};

function ProfileTab({ onSubPage, onGoTransfer }: { onSubPage: (p: SubPage) => void; onGoTransfer: () => void }) {
  const { user, updateProfile } = useUser();
  const { data: settings } = useSettings();
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(() => {
    try { return localStorage.getItem("spcx_profile_avatar"); } catch { return null; }
  });

  const { data: quoteP } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const sharePrice = quoteP?.price ?? settings?.sharePrice ?? 130;
  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;
  const initials = (user?.fullName ?? "").split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";
  const acc = user?.accreditedStatus ?? "pending";
  const accColor = acc === "yes" ? "#4ade80" : acc === "no" ? "#f87171" : "rgba(255,255,255,0.55)";
  const accLabel = acc === "yes" ? "Accredited Investor" : acc === "no" ? "Not Accredited" : "Pending Verification";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—";

  async function handleSave() {
    if (!fullName.trim()) return;
    try {
      await updateProfile.mutateAsync({ fullName: fullName.trim(), phone: phone.trim() });
      setEditing(false); toast({ title: "Profile updated" });
    } catch (e) { toast({ title: "Error", description: (e as Error).message, variant: "destructive" }); }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setAvatarDataUrl(url);
      try { localStorage.setItem("spcx_profile_avatar", url); } catch {}
      toast({ title: "Photo updated" });
    };
    reader.readAsDataURL(file);
  }

  const ICON_COLOR = "rgba(255,255,255,0.65)";
  const SECTIONS = [
    {
      title: "Account",
      items: [
        { iconEl: ProfileIcon.documents(ICON_COLOR), label: "Documents & Agreements", sub: "Agreements, statements & forms", action: () => onSubPage("documents"), color: ICON_COLOR },
        { iconEl: ProfileIcon.bell(ICON_COLOR), label: "Notification Settings", sub: "Manage your alert preferences", action: () => onSubPage("notif-settings"), color: ICON_COLOR },
        { iconEl: ProfileIcon.transfer(ICON_COLOR), label: "Transfer Shares", sub: "Move SPCX to another brokerage or investor", action: onGoTransfer, color: ICON_COLOR },
      ],
    },
    {
      title: "Security",
      items: [
        { iconEl: ProfileIcon.shield(ICON_COLOR), label: "Security Settings", sub: "Password, 2FA & login activity", action: () => onSubPage("security"), color: ICON_COLOR },
      ],
    },
    {
      title: "Support",
      items: [
        { iconEl: ProfileIcon.help(ICON_COLOR), label: "Help & Support", sub: "FAQ, contact & support hours", action: () => onSubPage("help"), color: ICON_COLOR },
        { iconEl: ProfileIcon.about(ICON_COLOR), label: "About", sub: "App version, legal & company info", action: () => onSubPage("about"), color: ICON_COLOR },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <p style={{ color: D.fgStrong, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Profile</p>
        <button
          onClick={() => { vib(12); editing ? handleSave() : (setFullName(user?.fullName ?? ""), setPhone(user?.phone ?? ""), setEditing(true)); }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border transition-all"
          style={{ background: editing ? `rgba(255,255,255,0.12)` : "rgba(255,255,255,0.05)", borderColor: editing ? `rgba(255,255,255,0.35)` : D.border, color: editing ? D.fgStrong : D.muted2 }}>
          {editing
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          }
          <span style={{ fontSize: 12, fontWeight: 600 }}>{editing ? "Save" : "Edit"}</span>
        </button>
      </div>

      {/* Avatar Hero — full-width card with photo upload */}
      <div className="rounded-[22px] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
        {/* Top gradient band */}
        <div style={{ height: 72, background: "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.03) 100%)", position: "relative" }} />
        <div className="px-4 pb-5" style={{ marginTop: -36 }}>
          {/* Avatar with camera button */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
            <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center overflow-hidden"
              style={{ border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 0 20px rgba(0,0,0,0.5)", background: avatarDataUrl ? "transparent" : "rgba(255,255,255,0.08)" }}>
              {avatarDataUrl
                ? <img src={avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span style={{ color: D.fgStrong, fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>{initials}</span>
              }
            </div>
            {/* Camera upload button */}
            <button
              onClick={() => { vib(); fileInputRef.current?.click(); }}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ background: "rgba(255,255,255,0.18)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", border: "2px solid rgba(0,0,0,0.9)" }}>
              {ProfileIcon.camera("#000")}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <p style={{ color: D.fgStrong, fontSize: 17, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>{user?.fullName || "—"}</p>
          <p style={{ color: D.muted2, fontSize: 12, marginTop: 2 }}>{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accColor, boxShadow: `0 0 6px ${accColor}` }} />
            <span style={{ color: accColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>{accLabel}</span>
            {acc === "yes" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.1)"/><path d="M8 12l2.5 2.5 5-5" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        {[
          { label: "Shares", value: totalShares.toFixed(2), color: D.fg },
          { label: "Portfolio", value: `${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: D.fg },
          { label: "Orders", value: `${purchases.length}`, color: D.fg },
        ].map(s => (
          <GlassCard key={s.label} className="flex-1 flex flex-col items-center gap-0.5 py-3">
            <p style={{ color: s.color, fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            <p style={{ color: D.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Personal Info */}
      <div className="flex flex-col gap-2">
        <p style={{ color: D.muted2, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Personal Info</p>
        <GlassCard>
          {[
            { label: "Full Name", field: "name" as const },
            { label: "Email", field: "email" as const },
            { label: "Phone", field: "phone" as const },
            { label: "Member Since", field: "since" as const },
          ].map((r, i, arr) => (
            <div key={r.label}>
              <div className="flex items-center justify-between px-4 py-3">
                <span style={{ color: D.muted2, fontSize: 13 }}>{r.label}</span>
                {editing && r.field === "name" ? (
                  <input className="bg-transparent outline-none text-right text-sm border-b" autoFocus
                    style={{ color: D.fgStrong, borderColor: `rgba(255,255,255,0.25)`, minWidth: 120 }} value={fullName} onChange={e => setFullName(e.target.value)} />
                ) : editing && r.field === "phone" ? (
                  <input className="bg-transparent outline-none text-right text-sm border-b"
                    style={{ color: D.fgStrong, borderColor: D.border, minWidth: 120 }} value={phone} onChange={e => setPhone(e.target.value)} />
                ) : (
                  <span style={{ color: D.fgStrong, fontSize: 13, fontWeight: 500, maxWidth: "58%", textAlign: "right", lineHeight: 1.4 }}>
                    {r.field === "name" ? user?.fullName : r.field === "email" ? user?.email : r.field === "phone" ? user?.phone || "—" : memberSince}
                  </span>
                )}
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Menu Sections */}
      {SECTIONS.map(section => (
        <div key={section.title} className="flex flex-col gap-2">
          <p style={{ color: D.muted2, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{section.title}</p>
          <GlassCard>
            {section.items.map((item, i, arr) => (
              <div key={item.label}>
                <button className="w-full flex items-center gap-3 px-3.5 py-3.5 text-left" onClick={() => { vib(); item.action(); }}>
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                    {item.iconEl}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ color: D.muted2, fontSize: 11, marginTop: 1.5 }}>{item.sub}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {i < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 58 }} />}
              </div>
            ))}
          </GlassCard>
        </div>
      ))}

      {/* Sign Out */}
      <button
        onClick={() => { vib(); if (window.confirm("Sign out of your account?")) signOut(); }}
        className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] border font-semibold transition-all active:scale-[0.98]"
        style={{ borderColor: `${D.red}25`, color: D.red, background: `${D.red}07` }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
      <p style={{ color: D.muted, fontSize: 11, textAlign: "center", letterSpacing: "0.03em" }}>SpaceX Pre-IPO · v1.0.0 · Quantum Glass Edition</p>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEWS TAB
// ══════════════════════════════════════════════════════════════════════════════
const NEWS_CATEGORIES = ["All", "Mission", "Starlink", "Starship", "Contract", "Launch"] as const;
type NewsCategory = typeof NEWS_CATEGORIES[number];

interface NewsArticle {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
}

function newsTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function inferNewsCategory(title: string, summary: string): string {
  const t = (title + " " + summary).toLowerCase();
  if (t.includes("starlink")) return "Starlink";
  if (t.includes("starship")) return "Starship";
  if (t.includes("falcon") || t.includes("launch") || t.includes("orbit") || t.includes("mission")) return "Mission";
  if (t.includes("contract") || t.includes("nasa") || t.includes("award")) return "Contract";
  return "Launch";
}

function NewsTab() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("All");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery<{ results: NewsArticle[] }>({
    queryKey: ["newsTab", refreshKey],
    queryFn: async () => {
      const res = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles/?limit=30&ordering=-published_at&search=spacex",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 5 * 60_000,
    retry: 2,
  });

  const articles = data?.results ?? [];
  const filtered = activeCategory === "All"
    ? articles
    : articles.filter(a => inferNewsCategory(a.title, a.summary) === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p style={{ color: D.fgStrong, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>SpaceX News</p>
          <p style={{ color: D.muted2, fontSize: 11, marginTop: 1 }}>Live from the frontier</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.85)" }} />
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {NEWS_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { vib(); setActiveCategory(cat); }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat ? "rgba(255,255,255,0.95)" : D.card,
              border: `1px solid ${activeCategory === cat ? "rgba(255,255,255,0.3)" : D.border}`,
              color: activeCategory === cat ? "#000000" : D.muted2,
              backdropFilter: "blur(16px)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `rgba(255,255,255,0.7) transparent transparent transparent` }} />
          <p style={{ color: D.muted2, fontSize: 13 }}>Fetching latest news…</p>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <GlassCard className="flex flex-col items-center gap-3 p-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5"><path d="M1 6s+.5-2 2.5-4 5.5-2 5.5 0-3 4-3 4"/><path d="M19 6s-.5-2-2.5-4-5.5-2-5.5 0 3 4 3 4"/><path d="M12 10v4m0 4h.01"/></svg>
          <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>Couldn't load news</p>
          <p style={{ color: D.muted2, fontSize: 12, textAlign: "center" }}>Check your connection and try again</p>
          <button onClick={() => { vib(); setRefreshKey(k => k + 1); refetch(); }}
            className="px-5 py-2 rounded-xl font-semibold text-sm mt-1"
            style={{ background: "rgba(255,255,255,0.95)", color: "#000000" }}>
            Retry
          </button>
        </GlassCard>
      )}

      {/* Featured Article */}
      {!isLoading && !isError && featured && (
        <a href={featured.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <div className="rounded-[18px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform"
            style={{ border: `1px solid ${D.border}` }}>
            {featured.image_url ? (
              <img src={featured.image_url} alt={featured.title}
                style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            ) : (
              <div className="flex items-center justify-center" style={{ height: 200, background: D.card }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
            )}
            {/* Overlay */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
              <div className="inline-flex items-center px-2 py-0.5 rounded-md mb-1.5"
                style={{ background: `rgba(255,255,255,0.92)` }}>
                <span style={{ color: "#000000", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>
                  {inferNewsCategory(featured.title, featured.summary)}
                </span>
              </div>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{featured.title}</p>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{featured.news_site}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{newsTimeAgo(featured.published_at)}</span>
              </div>
            </div>
          </div>
        </a>
      )}

      {/* More Stories */}
      {!isLoading && !isError && rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700 }}>More Stories</p>
          <GlassCard>
            {rest.map((article, idx) => (
              <div key={article.id}>
                <a href={article.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <div className="flex items-center gap-3 p-3 active:opacity-70 transition-opacity cursor-pointer">
                    {article.image_url ? (
                      <img src={article.image_url} alt=""
                        style={{ width: 72, height: 58, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                        style={{ width: 72, height: 58, background: D.card }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
                          style={{ background: `rgba(255,255,255,0.12)`, color: "rgba(255,255,255,0.75)" }}>
                          {inferNewsCategory(article.title, article.summary)}
                        </span>
                        <span style={{ color: D.muted, fontSize: 10 }}>{newsTimeAgo(article.published_at)}</span>
                      </div>
                      <p style={{ color: D.fg, fontSize: 13, fontWeight: 500, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                        {article.title}
                      </p>
                      <p style={{ color: D.muted2, fontSize: 10 }}>{article.news_site}</p>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </a>
                {idx < rest.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 14 }} />}
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <GlassCard className="flex flex-col items-center gap-3 p-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
          <p style={{ color: D.fg, fontSize: 14, fontWeight: 600 }}>No {activeCategory} articles</p>
          <p style={{ color: D.muted2, fontSize: 12 }}>Try a different category</p>
        </GlassCard>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN: MOBILE APP SHELL + LIQUID GLASS TAB BAR
// ══════════════════════════════════════════════════════════════════════════════
export const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "dashboard", label: "Dashboard",
    icon: a => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  },
  {
    id: "portfolio", label: "Portfolio",
    icon: a => a
      ? <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="14" rx="2" opacity="0.9"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      : <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  },
  {
    id: "news", label: "News",
    icon: a => a
      ? <svg width="21" height="21" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fillOpacity="0.9"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="8" y1="13" x2="16" y2="13" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/></svg>
      : <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
  },
  {
    id: "buy", label: "Buy",
    icon: a => a
      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="currentColor" fillOpacity="0.35"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill="currentColor" fillOpacity="0.85"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  },
  {
    id: "profile", label: "Profile",
    icon: a => a
      ? <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" opacity="0.85"/><circle cx="12" cy="7" r="4"/></svg>
      : <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export const TAB_INDEX: Record<Tab, number> = { dashboard: 0, portfolio: 1, news: 2, buy: 3, profile: 4 };
export const TAB_COUNT = 5;

function initialTabFromHash(): Tab {
  const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const valid: Tab[] = ["dashboard", "portfolio", "news", "buy", "profile"];
  return (valid as string[]).includes(hash) ? (hash as Tab) : "dashboard";
}

export function MobileApp() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>(initialTabFromHash);
  const [prevTab, setPrevTab] = useState<Tab>("dashboard");
  const [tabAnimating, setTabAnimating] = useState(false);
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [subPage, setSubPage] = useState<SubPage | null>(null);
  const [portfolioHistoryTrigger, setPortfolioHistoryTrigger] = useState(0);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tabAnimTimeoutRef.current) clearTimeout(tabAnimTimeoutRef.current);
    };
  }, []);

  const navigate = useCallback((tab: Tab) => {
    if (tab === activeTab) return;
    setPrevTab(activeTab);
    setTabAnimating(true);
    setActiveTab(tab);
    setSubPage(null);
    scrollRef.current?.scrollTo({ top: 0 });
    if (tabAnimTimeoutRef.current) clearTimeout(tabAnimTimeoutRef.current);
    tabAnimTimeoutRef.current = setTimeout(() => setTabAnimating(false), 420);
  }, [activeTab]);

  const openSubPage = useCallback((p: SubPage) => setSubPage(p), []);
  const closeSubPage = useCallback(() => {
    setSubPage(null);
    setSelectedPurchaseId(null);
  }, []);

  const openOrderDetail = useCallback((id: string) => {
    setSelectedPurchaseId(id);
    setSubPage("order-detail");
  }, []);

  const goToTransfer = useCallback(() => setLocation("/transfer"), [setLocation]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [activeTab]);

  const acc = user?.accreditedStatus ?? "pending";
  const activeIdx = TAB_INDEX[activeTab];

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#000000", fontFamily: "'Inter', -apple-system, sans-serif", WebkitFontSmoothing: "antialiased", fontFeatureSettings: '"cv11","ss01"' }}
    >
      <style>{`
        @keyframes chartPing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(2.2); opacity: 0; }
        }
        @keyframes liquidIn {
          0%   { opacity: 0; transform: translateY(12px) scale(0.97); }
          60%  { opacity: 1; transform: translateY(-3px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tabPillPop {
          0%   { transform: scaleX(1.18) scaleY(0.82); }
          45%  { transform: scaleX(0.92) scaleY(1.08); }
          70%  { transform: scaleX(1.04) scaleY(0.97); }
          100% { transform: scaleX(1) scaleY(1); }
        }
        @keyframes tabIconBounce {
          0%   { transform: scale(1) translateY(0); }
          30%  { transform: scale(1.22) translateY(-4px); }
          60%  { transform: scale(0.92) translateY(1px); }
          100% { transform: scale(1) translateY(0); }
        }
        .tab-content-enter { animation: liquidIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .tab-pill-pop { animation: tabPillPop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .tab-icon-bounce { animation: tabIconBounce 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .tab-btn { -webkit-tap-highlight-color: transparent; touch-action: manipulation; will-change: transform; }
        .tab-btn-ripple { position: absolute; inset: 6px; border-radius: 18px; background: rgba(255,255,255,0.08); opacity: 0; transform: scale(0.8); pointer-events: none; transition: opacity 0.18s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .tab-btn-pressed .tab-btn-ripple { opacity: 1; transform: scale(1); }
      `}</style>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 96 }}>
        <div key={activeTab} className={tabAnimating ? "tab-content-enter" : ""}>
          {activeTab === "dashboard" && <DashboardTab onNavigate={navigate} onSubPage={openSubPage} onOpenOrder={openOrderDetail} onGoTransfer={goToTransfer} />}
          {activeTab === "portfolio" && <PortfolioTab onNavigate={navigate} onSubPage={openSubPage} historyTrigger={portfolioHistoryTrigger} onOpenOrder={openOrderDetail} />}
          {activeTab === "news" && <NewsTab />}
          {activeTab === "buy" && <BuyTab />}
          {activeTab === "profile" && <ProfileTab onSubPage={openSubPage} onGoTransfer={goToTransfer} />}
        </div>
      </div>

      {/* Liquid Glass Tab Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center px-3 pb-3 pt-1"
        style={{ height: 82, background: "transparent" }}
      >
        {/* Frosted glass backing */}
        <div
          className="flex-1 flex items-center relative rounded-[28px]"
          style={{
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(48px) saturate(180%)",
            WebkitBackdropFilter: "blur(48px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 -1px 0 rgba(255,255,255,0.06) inset, 0 8px 40px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5)",
            padding: "6px 6px",
            height: 66,
          }}
        >
          {/* Sliding liquid pill indicator */}
          <div
            className={tabAnimating ? "tab-pill-pop" : ""}
            style={{
              position: "absolute",
              top: 6,
              bottom: 6,
              left: `calc(${activeIdx} * ${100 / TAB_COUNT}% + 6px)`,
              width: `calc(${100 / TAB_COUNT}% - 4px)`,
              background: "#22c55e",
              borderRadius: 20,
              boxShadow: "0 2px 20px rgba(34,197,94,0.35), 0 0 0 1px rgba(74,222,128,0.4) inset",
              transition: "left 0.38s cubic-bezier(0.34,1.56,0.64,1)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                onTouchStart={() => { vib(8); setPressedTab(tab.id); }}
                onTouchEnd={() => setPressedTab(null)}
                onTouchCancel={() => setPressedTab(null)}
                onMouseDown={() => setPressedTab(tab.id)}
                onMouseUp={() => setPressedTab(null)}
                onMouseLeave={() => setPressedTab(null)}
                className={`tab-btn flex-1 flex flex-col items-center justify-center gap-0.5 relative z-10${pressedTab === tab.id ? " tab-btn-pressed" : ""}`}
                style={{
                  color: isActive ? "#000000" : "rgba(255,255,255,0.38)",
                  height: "100%",
                  transition: "color 0.28s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: pressedTab === tab.id ? "scale(0.88)" : "scale(1)",
                }}
              >
                <span className="tab-btn-ripple" />
                <div className={isActive && tabAnimating ? "tab-icon-bounce" : ""}
                  style={{ transition: "transform 0.28s ease" }}>
                  {tab.icon(isActive)}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, letterSpacing: "0.03em", marginTop: -1, transition: "font-weight 0.2s ease" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-pages (overlaid) */}
      {subPage === "notifications" && <NotificationsPanel onBack={closeSubPage} purchases={purchases} onNavigateToOrder={(purchaseId) => { openOrderDetail(purchaseId); }} />}
      {subPage === "documents" && <DocumentsPage onBack={closeSubPage} />}
      {subPage === "security" && <SecurityPage onBack={closeSubPage} />}
      {subPage === "notif-settings" && <NotificationSettingsPage onBack={closeSubPage} />}
      {subPage === "help" && <HelpPage onBack={closeSubPage} />}
      {subPage === "about" && <AboutPage onBack={closeSubPage} />}
      {subPage === "accredited" && <AccreditedPage onBack={closeSubPage} status={acc} />}
      {subPage === "order-detail" && selectedPurchaseId && (
        <OrderDetailPage purchaseId={selectedPurchaseId} onBack={closeSubPage} />
      )}
    </div>
  );
}
