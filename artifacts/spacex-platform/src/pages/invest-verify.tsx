import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import appLogo from "@assets/xpsca_1778445100452.png";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function InvestVerifyPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("invest_email");
    if (!stored) {
      navigate("/invest");
      return;
    }
    setEmail(stored);
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleVerify() {
    setError("");
    setResendMsg("");

    if (!code.trim() || code.length < 6) {
      setError("Please enter the full 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const { token } = await api.createAccountVerify({ email, code: code.trim() });
      sessionStorage.removeItem("invest_email");
      setToken(token);
      refresh();
      navigate("/invest/set-password");
    } catch (err: unknown) {
      let msg = "Verification failed. Please try again.";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        if (typeof e["message"] === "string") msg = e["message"];
        if ((e as Record<string, unknown>)["code"] === "EXPIRED") {
          msg = "Your code has expired. Click 'Resend Code' to get a new one.";
        }
      }
      setError(msg);
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendMsg("");
    setError("");
    setResendLoading(true);
    try {
      await api.resendVerificationCode(email);
      setResendMsg("A new code has been sent to your email.");
      setCode("");
      setResendCooldown(60);
    } catch (err: unknown) {
      let msg = "Failed to resend code. Please go back and resubmit the form.";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        if (typeof e["message"] === "string") msg = e["message"];
        if ((e as Record<string, unknown>)["code"] === "NO_PENDING") {
          msg = "Your session expired. Please go back and resubmit the application form.";
        }
      }
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-6 md:px-16 h-20 border-b border-white/[0.06] shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center">
          <img src={appLogo} alt="SpaceX" className="h-14 w-auto" />
        </button>
        <div className="flex items-center gap-6">
          <span className="text-white/25 text-[0.6rem] tracking-[0.25em] uppercase hidden sm:block"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Step 2 of 3 — Verification
          </span>
          <button
            onClick={() => navigate("/invest")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-xs tracking-widest uppercase touch-manipulation"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] shrink-0">
        <div className="h-full bg-white/40 transition-all" style={{ width: "66%" }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-white/[0.12] mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-6 h-6 text-white/50">
                <rect x="2" y="4" width="20" height="16" rx="0"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
            </div>

            <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              SpaceX Investor Platform
            </p>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-wide uppercase mb-4"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.06em" }}>
              Check Your Email
            </h1>
            {email && (
              <p className="text-white/45 text-sm leading-relaxed">
                We've sent a 6-digit verification code to{" "}
                <span className="text-white/80 font-semibold">{email}</span>.
                Enter it below to continue.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-3"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); setResendMsg(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                className="w-full bg-white/[0.04] border border-white/[0.12] text-white text-center text-4xl tracking-[0.7em] font-mono px-4 py-6 focus:outline-none focus:border-white/40 placeholder:text-white/10 transition-colors"
              />
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {resendMsg && (
              <div className="border border-green-500/30 bg-green-500/5 px-4 py-3">
                <p className="text-green-400 text-xs leading-relaxed">{resendMsg}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 disabled:opacity-40 hover:bg-white/90 active:opacity-75 transition-colors cursor-pointer select-none touch-manipulation"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {loading ? "Verifying…" : "Verify & Continue →"}
            </button>

            <div className="text-center space-y-3 pt-2">
              <div>
                <p className="text-white/25 text-xs mb-2">
                  Didn't receive the email? Check your spam folder, or:
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-white/50 hover:text-white/80 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2 disabled:opacity-40 underline underline-offset-2"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {resendLoading
                    ? "Sending…"
                    : resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : "Resend Code"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/invest")}
                className="text-white/35 hover:text-white/65 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2 block w-full"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                ← Change email or edit application
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] px-6 md:px-16 py-5 flex items-center justify-between">
        <p className="text-white/20 text-[10px] tracking-widest uppercase"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          © 2026 SpaceX Pre-IPO Platform
        </p>
        <p className="text-white/20 text-[10px] tracking-widest uppercase hidden sm:block"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          Accredited Investors Only
        </p>
      </div>
    </div>
  );
}
