import { useState } from "react";
import { useLocation } from "wouter";
import appLogo from "@assets/xpsca_1778445100452.png";
import { api } from "@/lib/api";

export default function InvestSetPasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][strength];

  async function handleSubmit() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.setPassword(password);
      navigate("/");
    } catch (err: unknown) {
      let msg = "Failed to set password. Please try again.";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        if (typeof e["message"] === "string") msg = e["message"];
      }
      setError(msg);
      setLoading(false);
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
            Step 3 of 3 — Secure Your Account
          </span>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] shrink-0">
        <div className="h-full bg-white/40 transition-all" style={{ width: "100%" }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-white/[0.12] mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-6 h-6 text-white/50">
                <rect x="3" y="11" width="18" height="11" rx="0"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              SpaceX Investor Platform
            </p>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-wide uppercase mb-4"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.06em" }}>
              Create Password
            </h1>
            <p className="text-white/45 text-sm leading-relaxed">
              Set a password to secure your investor account. You'll use this to sign in going forward.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-3"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.12] text-white px-4 py-4 pr-12 focus:outline-none focus:border-white/40 placeholder:text-white/15 transition-colors text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-0.5 flex-1 transition-all duration-300"
                        style={{ backgroundColor: i <= strength ? strengthColor : "rgba(255,255,255,0.1)" }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: strengthColor, fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-3"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full bg-white/[0.04] border border-white/[0.12] text-white px-4 py-4 pr-12 focus:outline-none focus:border-white/40 placeholder:text-white/15 transition-colors text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="mt-1.5 text-red-400 text-[10px] tracking-wide">Passwords do not match</p>
              )}
              {confirm.length > 0 && password === confirm && password.length >= 8 && (
                <p className="mt-1.5 text-green-400 text-[10px] tracking-wide">✓ Passwords match</p>
              )}
            </div>

            <div className="text-white/20 text-[10px] leading-relaxed space-y-0.5 pt-1">
              <p className={password.length >= 8 ? "text-green-400/60" : ""}>• At least 8 characters</p>
              <p className={/[A-Z]/.test(password) ? "text-green-400/60" : ""}>• One uppercase letter</p>
              <p className={/[0-9]/.test(password) ? "text-green-400/60" : ""}>• One number</p>
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 disabled:opacity-40 hover:bg-white/90 active:opacity-75 transition-colors cursor-pointer select-none touch-manipulation"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {loading ? "Saving…" : "Save Password & Continue →"}
            </button>

            <p className="text-center text-white/20 text-[10px] tracking-wide">
              You can update your password anytime from your account settings.
            </p>
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
