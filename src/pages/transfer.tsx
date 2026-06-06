import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Transfer } from "@/lib/api";
import { useSettings } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import appLogo from "@assets/xpsca_1778445100452.png";

const BROKERS = [
  "Robinhood",
  "Fidelity",
  "Charles Schwab",
  "TD Ameritrade",
  "E*TRADE",
  "Interactive Brokers",
  "Webull",
  "Vanguard",
  "Merrill Edge",
  "Morgan Stanley",
  "SoFi Invest",
  "Public.com",
  "Firstrade",
  "TradeStation",
  "Moomoo",
  "Tastytrade",
  "Ally Invest",
  "Alpaca",
  "Apex Clearing",
  "Pershing (BNY Mellon)",
  "Raymond James",
  "Edward Jones",
  "Stifel",
  "LPL Financial",
  "Wealthfront",
  "Betterment",
  "Stash",
  "Acorns",
  "Cash App Investing",
  "Saxo Bank",
  "eToro",
  "Degiro",
  "Freetrade",
  "Trading 212",
  "Hargreaves Lansdown",
  "Other",
];

function IpoCountdownLock({ ipoTargetDate }: { ipoTargetDate: string }) {
  const calcTime = () => {
    const diff = new Date(ipoTargetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, expired: false };
  };
  const [time, setTime] = useState(calcTime);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => setTime(calcTime()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [ipoTargetDate]);
  if (time.expired) return null;
  return (
    <div className="mt-4">
      <p className="text-white/20 text-[0.55rem] tracking-[0.25em] uppercase mb-2 text-center" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        IPO COUNTDOWN
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "DAYS", value: time.days },
          { label: "HRS", value: time.hours },
          { label: "MIN", value: time.minutes },
          { label: "SEC", value: time.seconds },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="border border-white/[0.08] bg-white/[0.03] py-1.5 rounded-sm">
              <p className="text-white font-black text-lg leading-none tabular-nums" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                {String(value).padStart(2, "0")}
              </p>
            </div>
            <p className="text-white/20 text-[0.45rem] tracking-widest uppercase mt-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>
      <p className="text-white/15 text-[0.52rem] text-center mt-2 tracking-wide">
        Expected: {new Date(ipoTargetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}

function SpaceXLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="SpaceX" className={className} />;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20 transition-colors"
      />
    </div>
  );
}

export default function TransferPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const qc = useQueryClient();

  const prefillShares = new URLSearchParams(search).get("shares") ?? "";

  const [brokerage, setBrokerage] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [shareQty, setShareQty] = useState(prefillShares);
  const [submitting, setSubmitting] = useState(false);

  const isPostIpo = settings?.systemMode === "post_ipo";

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: api.getTransfers,
    enabled: isPostIpo,
    refetchInterval: 15_000,
  });

  const createTransfer = useMutation({
    mutationFn: (body: { brokerageName: string; brokerageAccountNumber: string; accountHolderName: string }) =>
      api.createTransfer(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brokerage || !accountNumber || !holderName || !shareQty) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    const qty = Number(shareQty);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      toast({ title: "Invalid share quantity", description: "Please enter a whole number greater than 0.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await createTransfer.mutateAsync({
        brokerageName: brokerage,
        brokerageAccountNumber: accountNumber,
        accountHolderName: holderName,
      });
      toast({
        title: isPostIpo ? "Transfer request submitted" : "Transfer request queued",
        description: isPostIpo
          ? "Our team will process your brokerage transfer within 2–3 business days."
          : "Your request is queued and will activate automatically when the SpaceX IPO goes live. The admin has been notified.",
      });
      setBrokerage("");
      setAccountNumber("");
      setHolderName("");
      setShareQty("");
    } catch (e) {
      toast({ title: "Submission failed", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
          <span className="text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Dashboard
          </span>
        </button>
        <SpaceXLogo className="h-7 w-auto" />
        <div className="w-16" />
      </div>

      {/* Transfer form — always visible, padded for fixed header + bottom nav */}
      <div className="pt-14 pb-24 px-3 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

          {/* Page header */}
          <div className="mb-1 pt-2">
            <div className="flex items-center gap-2 mb-2">
              {isPostIpo ? (
                <span className="inline-flex items-center gap-1.5 text-[0.55rem] font-black tracking-widest text-green-400 uppercase border border-green-500/30 px-2 py-0.5 bg-green-500/10"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                  SpaceX is now public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[0.55rem] font-black tracking-widest text-amber-400 uppercase border border-amber-500/30 px-2 py-0.5 bg-amber-500/10"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                  Pre-IPO mode
                </span>
              )}
            </div>
            <p className="text-white/25 text-[0.55rem] tracking-[0.25em] uppercase mb-0.5"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Brokerage Transfer
            </p>
            <h1 className="text-white font-black text-lg md:text-2xl tracking-wide"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              TRANSFER CENTER
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* Transfer form */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md p-4 h-full ${isPostIpo ? "border-green-500/20" : "border-amber-500/20"}`}>
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${isPostIpo ? "via-green-400/20" : "via-amber-400/20"}`} />

                {/* Pre-IPO amber info banner */}
                {!isPostIpo && (
                  <div className="mb-3 flex items-start gap-2 px-3 py-2 border border-amber-500/25 bg-amber-500/[0.07] rounded-sm">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5">
                      <circle cx="10" cy="10" r="8" />
                      <line x1="10" y1="6" x2="10" y2="10.5" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="10" cy="13.5" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                    <p className="text-amber-300/80 text-[0.6rem] leading-relaxed tracking-wide">
                      <span className="font-black text-amber-400" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>PRE-IPO MODE</span> — Your request will be queued and activated the moment the SpaceX IPO goes live.
                    </p>
                  </div>
                )}

                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-3"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Submit Transfer Request
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Broker dropdown */}
                  <div>
                    <label className="block text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      Brokerage<span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <select
                      value={brokerage}
                      onChange={(e) => setBrokerage(e.target.value)}
                      required
                      className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 transition-colors appearance-none cursor-pointer"
                      style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff40'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                        backgroundSize: "14px",
                      }}
                    >
                      <option value="" disabled className="bg-zinc-900">Select your broker…</option>
                      {BROKERS.map((b) => (
                        <option key={b} value={b} className="bg-zinc-900">{b}</option>
                      ))}
                    </select>
                  </div>

                  <InputField
                    label="Account Number"
                    value={accountNumber}
                    onChange={setAccountNumber}
                    placeholder="Your brokerage account number"
                    required
                  />
                  <InputField
                    label="Account Holder Name"
                    value={holderName}
                    onChange={setHolderName}
                    placeholder="Full name on the account"
                    required
                  />

                  {/* Share quantity */}
                  <div>
                    <label className="block text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      Shares to Transfer<span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={shareQty}
                      onChange={(e) => setShareQty(e.target.value)}
                      placeholder="e.g. 500"
                      required
                      className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40 placeholder:text-white/20 transition-colors"
                    />
                    <p className="text-white/20 text-[0.6rem] mt-1">Whole shares only.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                  >
                    {submitting ? "SUBMITTING..." : "REQUEST TRANSFER ›"}
                  </button>
                </form>

                <div className="mt-3 p-3 border border-white/[0.07] bg-white/[0.02]">
                  <p className="text-white/25 text-[0.6rem] leading-relaxed">
                    Our operations team will contact you within 2–3 business days to coordinate the transfer.
                  </p>
                </div>

                {/* Countdown (pre-IPO only, shown inside form card on mobile to avoid scroll) */}
                {!isPostIpo && settings?.ipoTargetDate && (
                  <IpoCountdownLock ipoTargetDate={settings.ipoTargetDate} />
                )}
              </div>
            </motion.div>

            {/* Transfer history */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm p-4 h-full">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-3"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  Transfer Requests
                </p>
                {(transfers as Transfer[]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-white/10 mb-2">
                      <path d="M3 7h14m0 0-3-3m3 3-3 3" /><path d="M21 17H7m0 0 3-3m-3 3 3 3" />
                    </svg>
                    <p className="text-white/25 text-xs tracking-wide"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      No transfer requests yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(transfers as Transfer[]).map((t) => (
                      <div key={t.id} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-sm text-white"
                            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                            {t.brokerageName}
                          </span>
                          {t.status === "completed" ? (
                            <span className="text-[0.55rem] font-black tracking-widest uppercase bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5"
                              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                              Completed
                            </span>
                          ) : (
                            <span className="text-[0.55rem] font-black tracking-widest uppercase bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5"
                              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                              Requested
                            </span>
                          )}
                        </div>
                        <p className="text-white/30 text-xs">Acct: {t.brokerageAccountNumber}</p>
                        <p className="text-white/30 text-xs">Holder: {t.accountHolderName}</p>
                        <p className="text-white/20 text-xs mt-1">
                          {format(new Date(t.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mobile bottom navigation — same glass pill as dashboard */}
      <nav className="md:hidden fixed left-3 right-3 z-40" style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.4rem))' }}>
        <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] border border-white/[0.12]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />
          <div className="flex items-stretch justify-around px-1 py-1">
            {[
              { label: "Home", path: "/dashboard", active: false,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><circle cx="12" cy="12" r="8.5" strokeWidth="0.7"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><line x1="12" y1="3.5" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="20.5"/><line x1="3.5" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="20.5" y2="12"/></svg> },
              { label: "Portfolio", path: "/dashboard", active: false,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><line x1="3" y1="20.5" x2="21" y2="20.5" strokeWidth="0.6" strokeOpacity="0.45"/><line x1="3" y1="20.5" x2="3" y2="5" strokeWidth="0.6" strokeOpacity="0.45"/><polyline points="3,18 7,13 11,15.5 19,5.5" strokeWidth="1.6"/><circle cx="19" cy="5.5" r="1.6" fill="currentColor" stroke="none"/></svg> },
              { label: "Buy", path: "/dashboard", active: false,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><polygon points="12,3 20.5,7.5 20.5,16.5 12,21 3.5,16.5 3.5,7.5"/><line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.5"/><line x1="9" y1="12" x2="15" y2="12" strokeWidth="1.5"/></svg> },
              { label: "Transfer", path: "/transfer", active: true,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><path d="M3 7h14m0 0-3-3m3 3-3 3"/><path d="M21 17H7m0 0 3-3m-3 3 3 3"/></svg> },
              { label: "Apps", path: "/dashboard", active: false,
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg> },
            ].map(({ label, path, active, icon }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-1 flex-1 rounded-xl transition-all ${
                  active
                    ? "text-white bg-white/[0.12]"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.05]"
                }`}
              >
                {icon}
                <span className="text-[0.5rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
