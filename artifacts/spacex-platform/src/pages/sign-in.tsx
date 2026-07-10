import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import SiteNav from "@/components/site-nav";

type Step =
  | "sign-in"
  | "otp-email"
  | "otp-code"
  | "forgot-email"
  | "forgot-code"
  | "forgot-done";

type LoginMode = "password" | "otp";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();

  const [loginMode, setLoginMode] = useState<LoginMode>("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [step, setStep] = useState<Step>("sign-in");
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpShowPassword, setFpShowPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");

  function switchMode(mode: LoginMode) {
    setLoginMode(mode);
    setStep("sign-in");
    setError("");
    setOtpError("");
    setOtpCode("");
  }

  function extractError(err: unknown, fallback: string): string {
    if (!err || typeof err !== "object") return fallback;
    const e = err as Record<string, unknown>;
    if (typeof e["message"] === "string") return e["message"];
    return fallback;
  }

  async function handleSubmit() {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    setError("");
    try {
      const { token } = await api.login({ email: email.trim(), password });
      setToken(token);
      refresh();
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      if (e?.["code"] === "PENDING_VERIFICATION") {
        sessionStorage.setItem("invest_email", email.trim().toLowerCase());
        navigate("/invest/verify");
        return;
      }
      setError(extractError(err, "Sign-in failed. Please try again."));
      setLoading(false);
    }
  }

  async function handleOtpRequest() {
    if (!otpEmail.trim()) { setOtpError("Please enter your email address."); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      await api.loginOtp({ email: otpEmail.trim() });
      setStep("otp-code");
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      if (e?.["code"] === "PENDING_VERIFICATION") {
        sessionStorage.setItem("invest_email", otpEmail.trim().toLowerCase());
        navigate("/invest/verify");
        return;
      }
      setOtpError(extractError(err, "Failed to send code. Please try again."));
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleOtpVerify() {
    if (!otpCode.trim() || otpCode.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const { token } = await api.loginVerify({ email: otpEmail.trim(), code: otpCode.trim() });
      setToken(token);
      refresh();
      navigate("/dashboard");
    } catch (err: unknown) {
      setOtpError(extractError(err, "Invalid or expired code. Please try again."));
      setOtpLoading(false);
    }
  }

  async function handleForgotSend() {
    if (!fpEmail.trim()) { setFpError("Please enter your email address."); return; }
    setFpLoading(true);
    setFpError("");
    try {
      await api.forgotPassword(fpEmail.trim());
      setStep("forgot-code");
    } catch (err: unknown) {
      setFpError(extractError(err, "Failed to send reset code."));
    } finally {
      setFpLoading(false);
    }
  }

  async function handleForgotReset() {
    if (!fpCode.trim()) { setFpError("Please enter the code from your email."); return; }
    if (fpNewPassword.length < 8) { setFpError("Password must be at least 8 characters."); return; }
    setFpLoading(true);
    setFpError("");
    try {
      await api.resetPassword(fpEmail.trim(), fpCode.trim(), fpNewPassword);
      setStep("forgot-done");
    } catch (err: unknown) {
      setFpError(extractError(err, "Reset failed. Please try again."));
    } finally {
      setFpLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white/[0.04] border border-white/[0.1] text-white px-4 py-3.5 text-sm focus:outline-none focus:border-white/35 placeholder:text-white/15 transition-colors";

  const btnCls = "w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 hover:bg-white/90 active:opacity-70 transition-colors cursor-pointer select-none touch-manipulation disabled:opacity-40";

  const isForgotFlow = step === "forgot-email" || step === "forgot-code" || step === "forgot-done";
  const isOtpCodeStep = step === "otp-code";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SiteNav active="sign-in" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 pt-32">
        <div className="w-full max-w-sm">

          {step === "forgot-email" && (
            <>
              <div className="text-center mb-10">
                <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Password Reset
                </p>
                <h1 className="text-white font-black text-3xl tracking-wide uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.08em" }}>
                  Forgot Password
                </h1>
                <p className="text-white/35 text-xs mt-3 leading-relaxed">
                  Enter your account email and we'll send you a reset code.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    Email Address
                  </label>
                  <input type="email" value={fpEmail} onChange={(e) => { setFpEmail(e.target.value); setFpError(""); }} onKeyDown={(e) => { if (e.key === "Enter") handleForgotSend(); }} placeholder="john@example.com" autoFocus autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={inputCls} />
                </div>
                {fpError && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3"><p className="text-red-400 text-xs leading-relaxed">{fpError}</p></div>}
                <button type="button" onClick={handleForgotSend} disabled={fpLoading} className={btnCls} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {fpLoading ? "Sending…" : "Send Reset Code →"}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => { setStep("sign-in"); setFpError(""); }} className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    ← Back to Login
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "forgot-code" && (
            <>
              <div className="text-center mb-10">
                <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Password Reset
                </p>
                <h1 className="text-white font-black text-2xl tracking-wide uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.06em" }}>
                  Enter New Password
                </h1>
                <p className="text-white/35 text-xs mt-3 leading-relaxed">
                  Check your email for a 6-digit code and choose a new password.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Reset Code</label>
                  <input type="text" value={fpCode} onChange={(e) => { setFpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setFpError(""); }} placeholder="000000" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${inputCls} text-center tracking-[0.5em] text-lg font-mono`} />
                </div>
                <div>
                  <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>New Password</label>
                  <div className="relative">
                    <input type={fpShowPassword ? "text" : "password"} value={fpNewPassword} onChange={(e) => { setFpNewPassword(e.target.value); setFpError(""); }} onKeyDown={(e) => { if (e.key === "Enter") handleForgotReset(); }} placeholder="Min. 8 characters" autoComplete="new-password" className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setFpShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors touch-manipulation p-1" tabIndex={-1}>
                      {fpShowPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                {fpError && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3"><p className="text-red-400 text-xs leading-relaxed">{fpError}</p></div>}
                <button type="button" onClick={handleForgotReset} disabled={fpLoading} className={btnCls} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {fpLoading ? "Resetting…" : "Reset Password →"}
                </button>
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => { setStep("forgot-email"); setFpError(""); }} className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>← Resend Code</button>
                  <button type="button" onClick={() => { setStep("sign-in"); setFpError(""); }} className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Cancel</button>
                </div>
              </div>
            </>
          )}

          {step === "forgot-done" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-white/70"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 className="text-white font-black text-2xl tracking-wide uppercase mb-3" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Password Reset</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8">Your password has been updated. You can now log in with your new password.</p>
              <button onClick={() => { setStep("sign-in"); setPassword(""); setError(""); switchMode("password"); }} className="text-xs bg-white text-black font-black px-8 py-3.5 tracking-[0.2em] uppercase hover:bg-white/90 transition-colors touch-manipulation" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Log In →
              </button>
            </div>
          )}

          {!isForgotFlow && (
            <>
              <div className="text-center mb-8">
                <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>SpaceX Investor Platform</p>
                <h1 className="text-white font-black text-3xl tracking-wide uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.08em" }}>Login</h1>
              </div>

              <div className="flex border border-white/[0.1] mb-8">
                <button type="button" onClick={() => switchMode("password")} className={`flex-1 py-2.5 text-[0.6rem] tracking-[0.2em] uppercase transition-colors touch-manipulation ${loginMode === "password" ? "bg-white text-black font-black" : "bg-transparent text-white/40 hover:text-white/60 font-black"}`} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Password
                </button>
                <button type="button" onClick={() => switchMode("otp")} className={`flex-1 py-2.5 text-[0.6rem] tracking-[0.2em] uppercase transition-colors touch-manipulation ${loginMode === "otp" ? "bg-white text-black font-black" : "bg-transparent text-white/40 hover:text-white/60 font-black"}`} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Email Code
                </button>
              </div>

              {loginMode === "password" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Email Address</label>
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="john@example.com" autoFocus autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={inputCls} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/35 text-[0.58rem] tracking-[0.22em] uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Password</label>
                      <button type="button" onClick={() => { setFpEmail(email); setStep("forgot-email"); setFpError(""); }} className="text-white/30 hover:text-white/60 text-[0.58rem] tracking-widest uppercase transition-colors touch-manipulation" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} placeholder="••••••••" autoComplete="current-password" className={`${inputCls} pr-12`} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors touch-manipulation p-1" tabIndex={-1}>
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {error && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3"><p className="text-red-400 text-xs leading-relaxed">{error}</p></div>}
                  <button type="button" onClick={handleSubmit} disabled={loading} className={btnCls} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    {loading ? "Logging In…" : "Login →"}
                  </button>
                  <div className="pt-2 text-center">
                    <p className="text-white/25 text-[0.65rem] leading-relaxed">
                      No password set?{" "}
                      <button type="button" onClick={() => switchMode("otp")} className="text-white/50 hover:text-white underline underline-offset-2 transition-colors touch-manipulation">
                        Login with email code instead
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {loginMode === "otp" && !isOtpCodeStep && (
                <div className="space-y-4">
                  <p className="text-white/35 text-xs leading-relaxed -mt-2 mb-2">
                    We'll send a one-time 6-digit code to your registered email address.
                  </p>
                  <div>
                    <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Email Address</label>
                    <input type="email" value={otpEmail} onChange={(e) => { setOtpEmail(e.target.value); setOtpError(""); }} onKeyDown={(e) => { if (e.key === "Enter") handleOtpRequest(); }} placeholder="john@example.com" autoFocus autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={inputCls} />
                  </div>
                  {otpError && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3"><p className="text-red-400 text-xs leading-relaxed">{otpError}</p></div>}
                  <button type="button" onClick={handleOtpRequest} disabled={otpLoading} className={btnCls} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    {otpLoading ? "Sending…" : "Send Code →"}
                  </button>
                </div>
              )}

              {loginMode === "otp" && isOtpCodeStep && (
                <div className="space-y-4">
                  <p className="text-white/35 text-xs leading-relaxed -mt-2 mb-2">
                    A 6-digit code was sent to <span className="text-white/70">{otpEmail}</span>. Enter it below.
                  </p>
                  <div>
                    <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Login Code</label>
                    <input type="text" value={otpCode} onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }} onKeyDown={(e) => { if (e.key === "Enter") handleOtpVerify(); }} placeholder="000000" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${inputCls} text-center tracking-[0.5em] text-lg font-mono`} />
                  </div>
                  {otpError && <div className="border border-red-500/30 bg-red-500/5 px-4 py-3"><p className="text-red-400 text-xs leading-relaxed">{otpError}</p></div>}
                  <button type="button" onClick={handleOtpVerify} disabled={otpLoading} className={btnCls} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                    {otpLoading ? "Verifying…" : "Verify & Login →"}
                  </button>
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => { setStep("sign-in"); setOtpCode(""); setOtpError(""); }} className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>← Resend Code</button>
                    <button type="button" onClick={() => switchMode("otp")} className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors touch-manipulation py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Change Email</button>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/[0.06] text-center mt-6">
                <p className="text-white/25 text-[0.65rem] leading-relaxed">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => window.location.href = "/invest"} className="text-white/50 hover:text-white underline underline-offset-2 transition-colors touch-manipulation">
                    Create Account
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
