/**
 * MobileTransferPage.tsx — SpaceX Pre-IPO · Mobile Web Transfer Flow
 * Quantum Glass design language
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { D, GlassCard, SubPageShell, TABS, TAB_INDEX } from "./MobileApp";
import { BROKERS, BrokerLogo } from "@/lib/brokers";

type TransferStep = "form" | "broker-picker" | "otp" | "review" | "success";
type TransferMode = "internal" | "brokerage";
type AmountMode = "shares" | "usd";
const OTP_RESEND_SECONDS = 60;

/** Trigger browser vibration on supported mobile browsers (noop elsewhere). */
function vib(ms: number | number[] = 10) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported — ignore */ }
}

// Fetch SPCX price directly
async function fetchSpcxPrice(): Promise<number | null> {
  try {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${base}/api/price/quote`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.price ?? null;
  } catch {
    return null;
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: D.card,
  border: `1px solid ${D.border}`,
  borderRadius: 12,
  padding: "13px 14px",
  color: D.fgStrong,
  fontSize: 14,
  outline: "none",
  backdropFilter: "blur(16px)",
  fontFamily: "inherit",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ color: D.muted2, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
      {children}{required && <span style={{ color: D.red, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={() => { if (!disabled) { vib(); onClick?.(); } }} disabled={disabled} className="w-full transition-all"
      style={{ padding: "15px 18px", borderRadius: 14, fontWeight: 700, fontSize: 14, fontFamily: "inherit",
        background: disabled ? "rgba(255,255,255,0.07)" : "#ffffff", color: disabled ? D.muted : "#000000" }}>
      {children}
    </button>
  );
}

function BrokerInitialsBadge({ name, size = 36 }: { name: string; size?: number }) {
  // Generate a consistent color from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: `hsla(${hue},70%,50%,0.15)`, border: `1px solid hsla(${hue},70%,60%,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.3, fontWeight: 800, color: `hsl(${hue},70%,65%)`, letterSpacing: "-0.5px" }}>{initials}</span>
    </div>
  );
}

// Dual amount input component
function AmountInput({ value, onChange, mode, onModeChange, spcxPrice }: {
  value: string; onChange: (v: string) => void;
  mode: AmountMode; onModeChange: (m: AmountMode) => void;
  spcxPrice: number | null;
}) {
  const equiv = (() => {
    if (!spcxPrice || !value.trim() || isNaN(Number(value))) return null;
    const n = parseFloat(value);
    if (n <= 0) return null;
    if (mode === "shares") return `≈ $${(n * spcxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    return `≈ ${(n / spcxPrice).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SPCX`;
  })();

  return (
    <div className="flex flex-col gap-2">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        {(["shares", "usd"] as const).map((m) => (
          <button key={m} onClick={() => { vib(); onModeChange(m); onChange(""); }}
            style={{ padding: "8px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer",
              background: mode === m ? "rgba(99,102,241,0.15)" : "transparent",
              color: mode === m ? "#818cf8" : D.muted2,
              border: `1px solid ${mode === m ? "rgba(99,102,241,0.4)" : D.border}` }}>
            {m === "shares" ? "In Shares (SPCX)" : "In USD ($)"}
          </button>
        ))}
      </div>
      {/* Input with prefix */}
      <div style={{ position: "relative" }}>
        {mode === "usd" && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: D.muted2, fontSize: 14, fontWeight: 600, pointerEvents: "none" }}>$</span>
        )}
        <input type="number" min={0} step="any" value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "usd" ? "0.00" : "0.0000"}
          style={{ ...inputStyle, paddingLeft: mode === "usd" ? 28 : 14 }} />
      </div>
      {/* Conversion display */}
      {equiv && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
          <span style={{ color: "#818cf8", fontSize: 12, fontWeight: 600 }}>{equiv}</span>
          {spcxPrice && <span style={{ color: D.muted2, fontSize: 11 }}>· SPCX @ ${spcxPrice.toFixed(2)}</span>}
        </div>
      )}
    </div>
  );
}

// Bottom tab bar — only shown when step is "form"
function TransferBottomNav({ onNavigate }: { onNavigate: (tab: keyof typeof TAB_INDEX) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center px-3 pb-3 pt-1" style={{ height: 82, background: "transparent" }}>
      <div className="flex-1 flex items-center relative rounded-[28px]"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(48px) saturate(180%)", WebkitBackdropFilter: "blur(48px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 -1px 0 rgba(255,255,255,0.06) inset, 0 8px 40px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5)",
          padding: "6px 6px", height: 66 }}>
        {TABS.map((tab) => {
          return (
            <button key={tab.id} onClick={() => { vib(); onNavigate(tab.id); }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative z-10"
              style={{ color: "rgba(255,255,255,0.38)", height: "100%" }}>
              {tab.icon(false)}
              <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.03em", marginTop: -1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MobileTransferPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useUser();

  const [step, setStep] = useState<TransferStep>("form");
  const [transferMode, setTransferMode] = useState<TransferMode>("internal");

  // Brokerage fields
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerSearch, setBrokerSearch] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [brokerageAccountNumber, setBrokerageAccountNumber] = useState("");

  // Amount with dual mode
  const [amountInput, setAmountInput] = useState("");
  const [amountMode, setAmountMode] = useState<AmountMode>("shares");
  const [spcxPrice, setSpcxPrice] = useState<number | null>(null);

  const [asset] = useState("SPCX");
  const [transferSubType, setTransferSubType] = useState<"full" | "partial">("full");
  const [notes, setNotes] = useState("");

  // Internal
  const [recipientEmail, setRecipientEmail] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const { data: transfers = [] } = useQuery({ queryKey: ["transfers"], queryFn: api.getTransfers, refetchInterval: 30_000 });

  const createTransfer = useMutation({
    mutationFn: (body: Parameters<typeof api.createTransfer>[0]) => api.createTransfer(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });

  useEffect(() => {
    fetchSpcxPrice().then(setSpcxPrice);
    return () => { if (otpRef.current) clearInterval(otpRef.current); };
  }, []);

  function startOtpCooldown() {
    setOtpCooldown(OTP_RESEND_SECONDS);
    otpRef.current = setInterval(() => {
      setOtpCooldown((c) => { if (c <= 1) { clearInterval(otpRef.current!); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleSendOtp() {
    setOtpSending(true);
    try {
      await api.sendTransferOtp();
      startOtpCooldown();
      toast({ title: "Code sent", description: `A 6-digit code was sent to ${user?.email ?? "your email"}.` });
    } catch (e) {
      toast({ title: "Failed to send code", description: String(e), variant: "destructive" });
    } finally { setOtpSending(false); }
  }

  function validateForm() {
    if (transferMode === "internal") {
      if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
        toast({ title: "Valid recipient email is required", variant: "destructive" }); return false;
      }
    } else {
      if (!brokerageName.trim()) { toast({ title: "Select a destination broker", variant: "destructive" }); return false; }
      if (!accountHolderName.trim()) { toast({ title: "Account holder name is required", variant: "destructive" }); return false; }
      if (!brokerageAccountNumber.trim()) { toast({ title: "Brokerage account number is required", variant: "destructive" }); return false; }
    }
    return true;
  }

  async function handleProceedToOtp() {
    if (!validateForm()) return;
    if (!validateAmount()) return;
    setStep("otp");
    setOtpSending(true);
    try {
      await api.sendTransferOtp();
      startOtpCooldown();
    } catch (e) {
      toast({ title: "Failed to send verification code", description: String(e), variant: "destructive" });
    } finally { setOtpSending(false); }
  }

  function handleOtpVerified() {
    if (!otp.trim() || otp.trim().length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" }); return;
    }
    setStep("review");
  }

  function toShares(input: string, mode: AmountMode): number | undefined {
    if (!input.trim() || isNaN(Number(input))) return undefined;
    const n = parseFloat(input);
    if (n <= 0) return undefined;
    if (mode === "shares") return n;
    // USD mode — never fall back to raw USD value as share count; require loaded price
    if (!spcxPrice) return undefined;
    return n / spcxPrice;
  }

  function validateAmount(): boolean {
    if (!amountInput.trim()) return true; // empty = full transfer
    const n = parseFloat(amountInput);
    if (isNaN(n) || n <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a positive number.", variant: "destructive" });
      return false;
    }
    if (amountMode === "usd" && !spcxPrice) {
      toast({ title: "Price unavailable", description: "SPCX price hasn't loaded yet. Enter the amount in shares instead.", variant: "destructive" });
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const shares = toShares(amountInput, amountMode);
      const result = await createTransfer.mutateAsync({
        otpCode: otp.trim(),
        mode: transferMode,
        recipientEmail: transferMode === "internal" ? recipientEmail.trim() : undefined,
        brokerageName: transferMode === "brokerage" ? brokerageName.trim() : undefined,
        accountHolderName: transferMode === "brokerage" ? accountHolderName.trim() : undefined,
        brokerageAccountNumber: transferMode === "brokerage" ? brokerageAccountNumber.trim() : undefined,
        amountToTransfer: shares,
        asset,
        transferSubType,
        notes: notes.trim() || undefined,
      });
      setSubmittedRequestId(result.requestId);
      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("code")) {
        toast({ title: "Verification failed", description: msg, variant: "destructive" }); setStep("otp");
      } else {
        toast({ title: "Submission failed", description: msg, variant: "destructive" });
      }
    } finally { setSubmitting(false); }
  }

  function resetAll() {
    setStep("form"); setTransferMode("internal");
    setRecipientEmail(""); setBrokerageName(""); setAccountHolderName(""); setBrokerageAccountNumber("");
    setAmountInput(""); setAmountMode("shares"); setNotes(""); setTransferSubType("full");
    setOtp(""); setSubmittedRequestId(null);
  }

  function handleBack() {
    if (step === "broker-picker") { setBrokerSearch(""); setStep("form"); return; }
    if (step === "form") { setLocation("/dashboard"); return; }
    if (step === "otp") { setStep("form"); return; }
    if (step === "review") { setStep("otp"); return; }
    if (step === "success") { resetAll(); return; }
    setStep("form");
  }

  const stepTitle = {
    form: transferMode === "internal" ? "Transfer to Investor" : "Transfer to Brokerage",
    "broker-picker": "Select Broker",
    otp: "Verify Identity",
    review: "Review & Confirm",
    success: "Request Submitted",
  }[step];

  const stepSubtitle = {
    form: transferMode === "internal" ? "Send SPCX shares to another investor" : "Send SPCX shares to your external broker",
    "broker-picker": "Choose your destination broker",
    otp: "Confirm it's you",
    review: undefined,
    success: undefined,
  }[step];

  const filteredBrokers = BROKERS.filter((b) =>
    b.name.toLowerCase().includes(brokerSearch.toLowerCase()) ||
    (b as typeof b & { region?: string }).region?.toLowerCase().includes(brokerSearch.toLowerCase())
  );

  const selectedBroker = BROKERS.find((b) => b.name === brokerageName);

  // Amount display string for review
  const amountDisplayForReview = (() => {
    if (!amountInput) return "All holdings";
    const n = parseFloat(amountInput);
    if (amountMode === "usd") {
      const s = toShares(amountInput, "usd");
      return `$${n.toLocaleString()} USD${s ? ` (≈ ${s.toFixed(4)} SPCX)` : ""}`;
    }
    const usd = spcxPrice ? n * spcxPrice : null;
    return `${n} SPCX${usd ? ` (≈ $${usd.toFixed(2)})` : ""}`;
  })();

  // ── FULL-SCREEN BROKER PICKER OVERLAY ───────────────────────────────────
  const BrokerPickerOverlay = step === "broker-picker" && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000000", display: "flex", flexDirection: "column", overflowY: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${D.border}`, background: "rgba(0,0,0,0.98)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { vib(); handleBack(); }} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ color: D.fgStrong, fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>Select Broker</span>
          </div>
          <span style={{ color: D.muted2, fontSize: 12 }}>{filteredBrokers.length} brokers</span>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input autoFocus type="text" value={brokerSearch} onChange={(e) => setBrokerSearch(e.target.value)}
            placeholder="Search brokers or region…"
            style={{ ...inputStyle, paddingLeft: 34, fontSize: 14, padding: "11px 12px 11px 34px" }} />
          {brokerSearch && (
            <button onClick={() => { vib(); setBrokerSearch(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: D.muted2 }}>✕</button>
          )}
        </div>
      </div>

      {/* Broker list */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        {filteredBrokers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="1.5" style={{ opacity: 0.4 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style={{ color: D.muted2, fontSize: 13 }}>No brokers found</p>
          </div>
        ) : (
          filteredBrokers.map((b) => {
            const isSelected = brokerageName === b.name;
            return (
              <button key={b.name} onClick={() => { vib(12); setBrokerageName(b.name); setBrokerSearch(""); setStep("form"); }}
                style={{ width: "100%", padding: "13px 16px", background: isSelected ? "rgba(255,255,255,0.06)" : "transparent", border: "none", borderBottom: `1px solid ${D.border}30`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <BrokerLogo name={b.name} domain={(b as { domain?: string }).domain ?? ""} fallbackUrl={(b as { logoUrl?: string }).logoUrl} size={40} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: isSelected ? 700 : 500, margin: 0 }}>{b.name}</p>
                  {(b as typeof b & { region?: string }).region && (
                    <p style={{ color: D.muted2, fontSize: 11, margin: "2px 0 0" }}>{(b as typeof b & { region?: string }).region}</p>
                  )}
                </div>
                {isSelected && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.emerald} strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── OTP FULL-SCREEN OVERLAY (no bottom nav) ──────────────────────────────
  const OtpOverlay = step === "otp" && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000000", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", paddingBottom: 40 }}>
        {/* Back button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <button onClick={() => { vib(); handleBack(); }}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>

        {/* Icon + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <p style={{ color: D.fgStrong, fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", margin: 0 }}>Check Your Email</p>
            <p style={{ color: D.muted2, fontSize: 14, marginTop: 8, lineHeight: 1.5, maxWidth: 260 }}>
              {otpSending ? "Sending verification code…" : `We sent a 6-digit code to ${user?.email ?? "your email"}`}
            </p>
          </div>
        </div>

        {/* OTP input */}
        <div className="flex flex-col gap-4">
          <input type="text" inputMode="numeric" maxLength={6} value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="• • • • • •"
            className="w-full text-center"
            style={{ ...inputStyle, fontSize: 32, fontWeight: 800, letterSpacing: "0.5em", padding: "20px 16px",
              borderColor: otp.length === 6 ? "rgba(99,102,241,0.6)" : D.border,
              boxShadow: otp.length === 6 ? "0 0 0 1px rgba(99,102,241,0.3)" : "none" }} />
          <PrimaryButton onClick={handleOtpVerified} disabled={otp.length < 6}>Verify Code →</PrimaryButton>
          <button onClick={() => { if (!otpCooldown && !otpSending) { vib(); handleSendOtp(); } }} disabled={otpCooldown > 0 || otpSending}
            style={{ color: D.muted2, fontSize: 12, background: "none", border: "none", cursor: "pointer", opacity: (otpCooldown > 0 || otpSending) ? 0.4 : 1, fontFamily: "inherit" }}>
            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── REVIEW FULL-SCREEN OVERLAY ──────────────────────────────────────────
  const ReviewOverlay = step === "review" && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000000", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => { vib(); handleBack(); }}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <p style={{ color: D.fgStrong, fontSize: 18, fontWeight: 800, margin: 0 }}>Review & Confirm</p>
            <p style={{ color: D.muted2, fontSize: 12, margin: "2px 0 0" }}>Please confirm your transfer details</p>
          </div>
        </div>

        {(() => {
          const reviewItems = [
            ...(transferMode === "internal"
              ? [{ label: "Recipient Email", value: recipientEmail }]
              : [
                  { label: "Destination Broker", value: brokerageName },
                  { label: "Account Holder", value: accountHolderName },
                  { label: "Account Number", value: brokerageAccountNumber },
                ]),
            { label: "Asset", value: asset },
            { label: "Amount", value: amountDisplayForReview },
            { label: "Transfer Type", value: transferSubType === "full" ? "Full Transfer" : "Partial Transfer" },
            ...(notes ? [{ label: "Notes", value: notes }] : []),
          ];
          return (
            <GlassCard className="overflow-hidden mb-4">
              <div>
                {reviewItems.map(({ label, value }, i) => (
                  <div key={label} className="flex items-start justify-between px-4 py-3" style={{ borderBottom: i < reviewItems.length - 1 ? `1px solid ${D.border}` : "none" }}>
                    <p style={{ color: D.muted2, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, marginRight: 12 }}>{label}</p>
                    <p style={{ color: D.fgStrong, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })()}

        <PrimaryButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Transfer Request →"}
        </PrimaryButton>
      </div>
    </div>
  );

  // ── SUCCESS FULL-SCREEN OVERLAY ─────────────────────────────────────────
  const SuccessOverlay = step === "success" && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", maxWidth: 320 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={D.emerald} strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <p style={{ color: D.fgStrong, fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", margin: 0 }}>Transfer Request Submitted</p>
          <p style={{ color: D.muted2, fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
            We'll email you at every stage — pending, under review, approved, and completed — so you always know where your transfer stands.
          </p>
        </div>
        {submittedRequestId && (
          <div style={{ border: `1px solid ${D.border}`, borderRadius: 12, padding: "10px 16px" }}>
            <p style={{ color: D.muted2, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Reference</p>
            <p style={{ color: D.fgStrong, fontFamily: "monospace", fontSize: 14, letterSpacing: "0.05em" }}>{submittedRequestId}</p>
          </div>
        )}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          <button onClick={() => { vib(); resetAll(); }} className="w-full py-3 rounded-[12px] text-xs font-bold" style={{ border: `1px solid ${D.border}`, color: D.fg, background: "transparent", fontFamily: "inherit", cursor: "pointer" }}>
            New Transfer
          </button>
          <PrimaryButton onClick={() => setLocation("/dashboard")}>Back to Dashboard</PrimaryButton>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {BrokerPickerOverlay}
      {OtpOverlay}
      {ReviewOverlay}
      {SuccessOverlay}

      <SubPageShell title={stepTitle} subtitle={stepSubtitle} onBack={handleBack}>
        {step === "form" && (
          <>
            <div className="flex flex-col gap-3">
              {/* Transfer mode toggle */}
              <div>
                <FieldLabel required>Destination</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(["internal", "brokerage"] as const).map((m) => (
                    <button key={m} onClick={() => { vib(); setTransferMode(m); }} className="py-2.5 rounded-[10px] text-xs font-bold transition-colors"
                      style={{ background: transferMode === m ? "#ffffff" : "transparent", color: transferMode === m ? "#000000" : D.muted2, border: `1px solid ${transferMode === m ? "#ffffff" : D.border}`, fontFamily: "inherit", cursor: "pointer" }}>
                      {m === "internal" ? "Another Investor" : "External Brokerage"}
                    </button>
                  ))}
                </div>
              </div>

              {transferMode === "internal" ? (
                <div>
                  <FieldLabel required>Recipient Email</FieldLabel>
                  <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Registered investor email" style={inputStyle} />
                </div>
              ) : (
                <>
                  {/* Destination broker — tap to open full-screen picker */}
                  <div>
                    <FieldLabel required>Destination Broker</FieldLabel>
                    <button onClick={() => { vib(); setBrokerSearch(""); setStep("broker-picker"); }}
                      style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", textAlign: "left", padding: "10px 14px" }}>
                      {brokerageName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                          <BrokerLogo name={brokerageName} domain={BROKERS.find((b) => b.name === brokerageName)?.domain ?? ""} fallbackUrl={BROKERS.find((b) => b.name === brokerageName)?.logoUrl} size={36} />
                          <div>
                            <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 600, margin: 0 }}>{brokerageName}</p>
                            {selectedBroker && (selectedBroker as { region?: string }).region && (
                              <p style={{ color: D.muted2, fontSize: 11, margin: "1px 0 0" }}>{(selectedBroker as { region?: string }).region}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: D.muted2, fontSize: 14, flex: 1 }}>Choose from 80+ brokers worldwide…</span>
                      )}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted2} strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div>
                    <FieldLabel required>Account Holder Name</FieldLabel>
                    <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="Full name on the brokerage account" style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel required>Brokerage Account Number</FieldLabel>
                    <input type="text" value={brokerageAccountNumber} onChange={(e) => setBrokerageAccountNumber(e.target.value)} placeholder="Your account number at the destination broker" style={inputStyle} />
                  </div>
                </>
              )}

              {/* Amount with dual mode */}
              <div>
                <FieldLabel>Amount to Transfer</FieldLabel>
                <AmountInput value={amountInput} onChange={setAmountInput} mode={amountMode} onModeChange={setAmountMode} spcxPrice={spcxPrice} />
              </div>

              {/* Transfer type */}
              <div>
                <FieldLabel required>Transfer Type</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(["full", "partial"] as const).map((t) => (
                    <button key={t} onClick={() => { vib(); setTransferSubType(t); }} className="py-2.5 rounded-[10px] text-xs font-bold transition-colors"
                      style={{ background: transferSubType === t ? "#ffffff" : "transparent", color: transferSubType === t ? "#000000" : D.muted2, border: `1px solid ${transferSubType === t ? "#ffffff" : D.border}`, fontFamily: "inherit", cursor: "pointer" }}>
                      {t === "full" ? "Full Transfer" : "Partial Transfer"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Notes (Optional)</FieldLabel>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes" style={{ ...inputStyle, resize: "none" }} />
              </div>
            </div>

            <PrimaryButton onClick={handleProceedToOtp}>Continue — Verify Identity →</PrimaryButton>

            <button onClick={() => { vib(); setLocation("/history?tab=transfers"); }}
              style={{ color: D.muted2, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center", textDecoration: "underline", textUnderlineOffset: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              View Transfer History ›
            </button>
          </>
        )}
      </SubPageShell>

      {/* Show bottom nav only on form step */}
      {step === "form" && <TransferBottomNav onNavigate={(tab) => setLocation(`/dashboard#${tab}`)} />}
    </>
  );
}
