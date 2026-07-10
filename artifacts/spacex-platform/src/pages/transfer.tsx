import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import MobileTransferPage from "@/components/mobile/MobileTransferPage";
import { BROKERS, BrokerLogo } from "@/lib/brokers";

const FONT = "'Arial Black', Arial, sans-serif";

// ── Step types ────────────────────────────────────────────────────────────────
type TransferStep = "form" | "otp" | "review" | "success";
type TransferMode = "internal" | "brokerage";
const OTP_RESEND_SECONDS = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-white/30 text-[0.6rem] tracking-widest uppercase mb-1.5" style={{ fontFamily: FONT }}>
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20 transition-colors rounded-none";

// ── Main component ────────────────────────────────────────────────────────────
export default function TransferPage() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useUser();

  const [step, setStep] = useState<TransferStep>("form");

  const [transferMode, setTransferMode] = useState<TransferMode>("internal");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [brokerageAccountNumber, setBrokerageAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [asset] = useState("SPCX");
  const [transferSubType, setTransferSubType] = useState<"full" | "partial">("full");
  const [notes, setNotes] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: api.getTransfers,
    refetchInterval: 30_000,
  });

  const createTransfer = useMutation({
    mutationFn: (body: Parameters<typeof api.createTransfer>[0]) => api.createTransfer(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });

  useEffect(() => () => { if (otpRef.current) clearInterval(otpRef.current); }, []);

  // ── OTP helpers ──
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

  // ── Validation ──
  function validateForm() {
    if (transferMode === "internal") {
      if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
        toast({ title: "Valid recipient email is required", variant: "destructive" });
        return false;
      }
    } else {
      if (!brokerageName.trim()) {
        toast({ title: "Select a destination broker", variant: "destructive" });
        return false;
      }
      if (!accountHolderName.trim()) {
        toast({ title: "Account holder name is required", variant: "destructive" });
        return false;
      }
      if (!brokerageAccountNumber.trim()) {
        toast({ title: "Brokerage account number is required", variant: "destructive" });
        return false;
      }
    }
    return true;
  }

  async function handleProceedToOtp() {
    if (!validateForm()) return;
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
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setStep("review");
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const result = await createTransfer.mutateAsync({
        otpCode: otp.trim(),
        mode: transferMode,
        recipientEmail: transferMode === "internal" ? recipientEmail.trim() : undefined,
        brokerageName: transferMode === "brokerage" ? brokerageName.trim() : undefined,
        accountHolderName: transferMode === "brokerage" ? accountHolderName.trim() : undefined,
        brokerageAccountNumber: transferMode === "brokerage" ? brokerageAccountNumber.trim() : undefined,
        amountToTransfer: amount ? Number(amount) : undefined,
        asset,
        transferSubType,
        notes: notes.trim() || undefined,
      });
      setSubmittedRequestId(result.requestId);
      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("code")) {
        toast({ title: "Verification failed", description: msg, variant: "destructive" });
        setStep("otp");
      } else {
        toast({ title: "Submission failed", description: msg, variant: "destructive" });
      }
    } finally { setSubmitting(false); }
  }

  function resetAll() {
    setStep("form");
    setTransferMode("internal");
    setRecipientEmail(""); setBrokerageName(""); setAccountHolderName(""); setBrokerageAccountNumber("");
    setAmount(""); setNotes(""); setTransferSubType("full");
    setOtp(""); setSubmittedRequestId(null);
  }

  function handleBack() {
    if (step === "form") { navigate("/dashboard"); return; }
    if (step === "success") { resetAll(); return; }
    if (step === "review") { setStep("otp"); return; }
    if (step === "otp") { setStep("form"); return; }
    setStep("form");
  }

  if (isMobile) {
    return <MobileTransferPage />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
          <span className="text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>
            {step === "form" ? "Dashboard" : step === "success" ? "New Transfer" : "Back"}
          </span>
        </button>
        <p className="text-white/20 text-[0.6rem] tracking-[0.25em] uppercase" style={{ fontFamily: FONT }}>Transfer</p>
        <div className="w-16" />
      </div>

      <div className="pt-14 pb-24 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── FORM ── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pt-6 space-y-4">
              <div className="mb-5">
                <p className="text-white/20 text-[0.55rem] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: FONT }}>Transfer Center</p>
                <h1 className="text-white font-black text-2xl" style={{ fontFamily: FONT }}>
                  {transferMode === "internal" ? "TRANSFER TO INVESTOR" : "TRANSFER TO BROKERAGE"}
                </h1>
                <p className="text-white/35 text-sm mt-2">
                  {transferMode === "internal"
                    ? "Transfer your SPCX shares to another investor registered on this platform."
                    : "Transfer your SPCX shares directly to your external brokerage account."}
                </p>
              </div>

              <Field label="Destination" required>
                <div className="grid grid-cols-2 gap-2">
                  {(["internal", "brokerage"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setTransferMode(m)}
                      className={`py-2.5 text-[0.65rem] font-black tracking-widest uppercase border transition-colors ${transferMode === m ? "bg-white text-black border-white" : "border-white/10 text-white/35 hover:border-white/30 hover:text-white/60"}`}
                      style={{ fontFamily: FONT }}>
                      {m === "internal" ? "Another Investor" : "External Brokerage"}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="space-y-3 mt-3">
                {transferMode === "internal" ? (
                  <Field label="Recipient Email" required>
                    <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Registered email of the recipient investor" className={inputCls} />
                  </Field>
                ) : (
                  <>
                    <Field label="Destination Broker" required>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
                        {BROKERS.map((b) => (
                          <button key={b.domain} type="button" onClick={() => setBrokerageName(b.name)}
                            title={b.name}
                            className={`aspect-square p-1.5 rounded-md border flex items-center justify-center bg-white transition-colors ${brokerageName === b.name ? "border-white ring-2 ring-white/70" : "border-white/10 hover:border-white/40"}`}>
                            <BrokerLogo name={b.name} domain={b.domain} fallbackUrl={b.logoUrl} />
                          </button>
                        ))}
                      </div>
                      {brokerageName && (
                        <p className="text-white/50 text-xs mt-1.5">Selected: <span className="text-white font-semibold">{brokerageName}</span></p>
                      )}
                    </Field>
                    <Field label="Account Holder Name" required>
                      <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="Full name on the brokerage account" className={inputCls} />
                    </Field>
                    <Field label="Brokerage Account Number" required>
                      <input type="text" value={brokerageAccountNumber} onChange={(e) => setBrokerageAccountNumber(e.target.value)} placeholder="Your account number at the destination broker" className={inputCls} />
                    </Field>
                  </>
                )}
                <Field label="Asset">
                  <input type="text" value="SPCX" readOnly className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </Field>
                <Field label="Amount / Shares">
                  <input type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Number of shares (leave blank for full transfer)" className={inputCls} />
                </Field>
                <Field label="Transfer Type" required>
                  <div className="grid grid-cols-2 gap-2">
                    {(["full", "partial"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setTransferSubType(t)}
                        className={`py-2.5 text-[0.65rem] font-black tracking-widest uppercase border transition-colors ${transferSubType === t ? "bg-white text-black border-white" : "border-white/10 text-white/35 hover:border-white/30 hover:text-white/60"}`}
                        style={{ fontFamily: FONT }}>
                        {t === "full" ? "Full Transfer" : "Partial Transfer"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Notes (Optional)">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes" className={`${inputCls} resize-none`} />
                </Field>
              </div>
              <button onClick={handleProceedToOtp} className="w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors" style={{ fontFamily: FONT }}>
                CONTINUE — VERIFY IDENTITY ›
              </button>

              <button onClick={() => { navigate("/history?tab=transfers"); }} className="w-full text-center text-white/40 hover:text-white text-[0.65rem] tracking-widest uppercase underline underline-offset-2 transition-colors pt-2" style={{ fontFamily: FONT }}>
                View Transfer History ›
              </button>
            </motion.div>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pt-10 flex flex-col items-center text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-white/60">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-black text-xl mb-2" style={{ fontFamily: FONT }}>VERIFY YOUR IDENTITY</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto">
                  {otpSending ? "Sending code…" : `A 6-digit code was sent to ${user?.email ?? "your email"}. Enter it to continue.`}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-3">
                <input type="text" inputMode="numeric" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-white/[0.05] border border-white/15 px-4 py-4 text-white text-2xl font-black tracking-[1em] text-center focus:outline-none focus:border-white/40 transition-colors"
                  style={{ fontFamily: FONT }}
                />
                <button onClick={handleOtpVerified} disabled={otp.length < 6}
                  className="w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40"
                  style={{ fontFamily: FONT }}>
                  VERIFY CODE ›
                </button>
                <button onClick={handleSendOtp} disabled={otpCooldown > 0 || otpSending} className="text-white/35 text-xs hover:text-white/60 transition-colors disabled:opacity-40">
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pt-6 space-y-4">
              <div className="mb-5">
                <p className="text-white/20 text-[0.55rem] tracking-[0.3em] uppercase mb-1" style={{ fontFamily: FONT }}>Review & Confirm</p>
                <h1 className="text-white font-black text-xl" style={{ fontFamily: FONT }}>CONFIRM TRANSFER</h1>
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
                  { label: "Amount", value: amount || "All holdings" },
                  { label: "Transfer Type", value: transferSubType === "full" ? "Full Transfer" : "Partial Transfer" },
                  ...(notes ? [{ label: "Notes", value: notes }] : []),
                ];
                return (
                  <div className="border border-white/[0.1] bg-white/[0.03]">
                    <div className="divide-y divide-white/[0.05]">
                      {reviewItems.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5">
                          <p className="text-white/30 text-[0.62rem] tracking-wide uppercase" style={{ fontFamily: FONT }}>{label}</p>
                          <p className="text-white text-xs font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40"
                style={{ fontFamily: FONT }}>
                {submitting ? "SUBMITTING…" : "SUBMIT TRANSFER REQUEST ›"}
              </button>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pt-16 flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-green-400">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-black text-xl mb-2" style={{ fontFamily: FONT }}>TRANSFER REQUEST SUBMITTED</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto">We'll email you at every stage — pending, under review, approved, and completed — so you always know where your transfer stands.</p>
              </div>
              {submittedRequestId && (
                <div className="border border-white/10 px-4 py-2.5 rounded-sm">
                  <p className="text-white/25 text-[0.6rem] tracking-[0.2em] uppercase mb-1" style={{ fontFamily: FONT }}>Reference</p>
                  <p className="text-white font-mono text-sm tracking-wider">{submittedRequestId}</p>
                </div>
              )}
              <div className="w-full max-w-xs space-y-2 mt-4">
                <button onClick={resetAll} className="w-full border border-white/15 text-white/60 font-black py-2.5 text-xs tracking-widest uppercase hover:border-white/30 hover:text-white transition-colors" style={{ fontFamily: FONT }}>
                  NEW TRANSFER
                </button>
                <button onClick={() => navigate("/dashboard")} className="w-full bg-white text-black font-black py-2.5 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors" style={{ fontFamily: FONT }}>
                  BACK TO DASHBOARD
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
