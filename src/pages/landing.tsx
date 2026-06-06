import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { setToken } from "@/lib/auth";
import { motion, useScroll, useTransform } from "framer-motion";
import appLogo from "@assets/xpsca_1778445100452.png";
import missionVideo from "@assets/videoplayback_(1)_1778429580494.mp4";

import { useUser } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const COUNTRIES = [
  "United States","United Kingdom","Canada","Australia","Germany","France","Singapore","UAE",
  "Switzerland","Netherlands","Japan","South Korea","Hong Kong","New Zealand","Sweden","Norway",
  "Denmark","Ireland","Luxembourg","Belgium","Austria","Finland","Portugal","Spain","Italy",
  "Brazil","Mexico","India","South Africa","Nigeria","Kenya","Ghana","Other",
];

const INCOME_RANGES = [
  "Under $50,000","$50,000 – $100,000","$100,000 – $200,000",
  "$200,000 – $500,000","$500,000 – $1,000,000","Over $1,000,000",
];

const INVESTMENT_AMOUNTS = [
  "$2,000 – $10,000","$10,000 – $25,000","$25,000 – $100,000",
  "$100,000 – $500,000","Over $500,000",
];

const ACCREDITATION_OPTIONS = [
  "Yes — income over $200K (or $300K joint) for 2+ years",
  "Yes — net worth over $1M (excluding primary residence)",
  "Yes — licensed investment professional (Series 7/65/82)",
  "Not yet accredited, but interested in learning more",
];

function OverlayField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}{required && <span className="text-white/25 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.1] text-white px-4 py-3 text-sm focus:outline-none focus:border-white/30 placeholder:text-white/15 transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function InvestOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "code">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [accreditationStatus, setAccreditationStatus] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();

  const formComplete =
    fullName.trim() && email.trim() && dateOfBirth &&
    country && annualIncome && investmentAmount && accreditationStatus;

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!formComplete) return;
    setLoading(true);
    setError("");
    try {
      await api.createAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        country,
        dateOfBirth,
        citizenship: country,
        annualIncome,
        investmentAmount,
        accreditationStatus,
        employmentStatus: "employed",
        sourceOfFunds: "income",
        investmentExperience: "intermediate",
        hearAboutUs: "other",
      });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { token } = await api.createAccountVerify({ email: email.trim(), code: code.trim() });
      setToken(token);
      refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-lg bg-black border border-white/[0.12] shadow-2xl flex flex-col"
        style={{ maxHeight: "96vh" }}
      >
        {/* Top stripe */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent shrink-0" />

        {/* Header — fixed */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.07] shrink-0">
          <div>
            <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-0.5"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              SpaceX Investor Platform
            </p>
            <h2 className="text-white font-black text-base sm:text-lg tracking-widest uppercase"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.08em" }}>
              {step === "form" ? "Investor Application" : "Verify Your Email"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors ml-4 shrink-0" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
          {step === "form" ? (
            <form id="invest-form" onSubmit={handleApply} className="space-y-4">
              <p className="text-white/40 text-sm leading-relaxed pb-2">
                Complete the form below to apply for investor access. All fields marked * are required.
              </p>

              {/* Row: Full Name */}
              <OverlayField label="Full Legal Name" required>
                <input type="text" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(""); }}
                  placeholder="John Smith" required autoComplete="name"
                  className={inputCls} />
              </OverlayField>

              {/* Row: Email */}
              <OverlayField label="Email Address" required>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="john@example.com" required autoComplete="email"
                  className={inputCls} />
              </OverlayField>

              {/* Row: Phone + DOB side by side */}
              <div className="grid grid-cols-2 gap-3">
                <OverlayField label="Phone Number">
                  <input type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000" autoComplete="tel"
                    className={inputCls} />
                </OverlayField>
                <OverlayField label="Date of Birth" required>
                  <input type="date" value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
                    className={inputCls}
                    style={{ colorScheme: "dark" }} />
                </OverlayField>
              </div>

              {/* Country */}
              <OverlayField label="Country of Residence" required>
                <div className="relative">
                  <select value={country} onChange={(e) => setCountry(e.target.value)} required className={selectCls} style={{ colorScheme: "dark" }}>
                    <option value="" disabled>Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </OverlayField>

              {/* Annual Income */}
              <OverlayField label="Annual Income (USD)" required>
                <div className="relative">
                  <select value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} required className={selectCls} style={{ colorScheme: "dark" }}>
                    <option value="" disabled>Select range…</option>
                    {INCOME_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </OverlayField>

              {/* Investment Amount */}
              <OverlayField label="Intended Investment Amount" required>
                <div className="relative">
                  <select value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} required className={selectCls} style={{ colorScheme: "dark" }}>
                    <option value="" disabled>Select amount…</option>
                    {INVESTMENT_AMOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </OverlayField>

              {/* Accreditation */}
              <OverlayField label="Accredited Investor Status" required>
                <div className="space-y-2">
                  {ACCREDITATION_OPTIONS.map((opt) => (
                    <label key={opt} className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-colors ${accreditationStatus === opt ? "border-white/30 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/20"}`}>
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${accreditationStatus === opt ? "border-white" : "border-white/25"}`}>
                        {accreditationStatus === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input type="radio" name="accreditation" value={opt} checked={accreditationStatus === opt}
                        onChange={() => setAccreditationStatus(opt)} className="sr-only" required />
                      <span className="text-white/60 text-xs leading-relaxed">{opt}</span>
                    </label>
                  ))}
                </div>
              </OverlayField>

              {error && <p className="text-red-400 text-xs leading-relaxed pt-1">{error}</p>}
            </form>
          ) : (
            <form id="invest-form" onSubmit={handleVerify} className="space-y-5">
              <p className="text-white/40 text-sm leading-relaxed pb-2">
                We emailed a 6-digit code to{" "}
                <span className="text-white/65 font-semibold">{email}</span>.
                Enter it below to complete your application.
              </p>

              <OverlayField label="Verification Code" required>
                <input
                  type="text" inputMode="numeric" value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="000000" maxLength={6} required autoComplete="one-time-code" autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.12] text-white text-center text-3xl tracking-[0.6em] font-mono px-4 py-5 focus:outline-none focus:border-white/35 placeholder:text-white/10 transition-colors"
                />
              </OverlayField>

              {error && <p className="text-red-400 text-xs leading-relaxed">{error}</p>}

              <button type="button" onClick={() => { setStep("form"); setCode(""); setError(""); }}
                className="w-full text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors py-2 text-center"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                ← Change email or details
              </button>
            </form>
          )}
        </div>

        {/* Footer CTA — fixed at bottom */}
        <div className="shrink-0 px-6 sm:px-8 py-5 border-t border-white/[0.07]">
          <button
            type="submit"
            form="invest-form"
            disabled={loading || (step === "form" ? !formComplete : code.length < 6)}
            className="w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 disabled:opacity-35 hover:bg-white/90 transition-colors"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            {loading
              ? (step === "form" ? "Sending Code…" : "Verifying…")
              : (step === "form" ? "Send Verification Code →" : "Verify & Complete Registration →")}
          </button>
          {step === "form" && (
            <p className="text-white/20 text-xs text-center mt-3 leading-relaxed">
              A 6-digit verification code will be sent to your email. For accredited investors only.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1920&q=90&auto=format&fit=crop",
    headline: "SPACEX IS NOW\nPUBLIC",
    sub: "SpaceX (SPCX) is now trading on Nasdaq. Accredited investors can buy shares directly through our platform at $130/share.",
  },
  {
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1920&q=90&auto=format&fit=crop",
    headline: "REDEFINING\nSPACE TRAVEL",
    sub: "SpaceX has disrupted aerospace forever. Own a piece of the company leading humanity to the stars.",
  },
  {
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1920&q=90&auto=format&fit=crop",
    headline: "THE IPO\nHAS LAUNCHED",
    sub: "SpaceX went public June 12, 2026 on Nasdaq under ticker SPCX. Shares are now available to verified investors.",
  },
];

const stats = [
  { label: "Company Valuation", value: "$1.77T" },
  { label: "Accredited Investors", value: "12,000+" },
  { label: "Share Price", value: "$130" },
  { label: "Listed On Nasdaq", value: "SPCX" },
];

const vehicles = [
  {
    name: "FALCON 9",
    desc: "The world's first orbital-class reusable rocket. 300+ missions.",
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&q=85&auto=format&fit=crop",
  },
  {
    name: "STARSHIP",
    desc: "Fully reusable. Designed for Earth orbit, the Moon, Mars, and beyond.",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&q=85&auto=format&fit=crop",
  },
  {
    name: "STARLINK",
    desc: "Global satellite internet. $8B+ annual revenue and growing.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=85&auto=format&fit=crop",
  },
];

const faqs = [
  {
    q: "WHO CAN INVEST IN SPACEX SHARES?",
    a: "Only accredited investors as defined by SEC regulations — individuals with $200K+ annual income or $1M+ net worth excluding primary residence.",
  },
  {
    q: "HOW ARE SHARES PRICED?",
    a: "SpaceX (SPCX) IPO-ed at $135/share on June 12, 2026. Our platform offers shares at $130 — reflecting the current post-IPO market price. You'll see the live price when placing an order.",
  },
  {
    q: "WHAT IS THE MINIMUM INVESTMENT?",
    a: "There is no minimum investment amount. You may purchase any number of shares at the current share price.",
  },
  {
    q: "HOW DO I RECEIVE MY SHARES?",
    a: "After your purchase is confirmed, shares are credited to your account. You can then initiate a transfer to your brokerage (Fidelity, Schwab, Interactive Brokers, etc.) at any time.",
  },
  {
    q: "SPACEX IS NOW PUBLIC — HOW DOES THIS AFFECT ME?",
    a: "SpaceX listed on Nasdaq (SPCX) on June 12, 2026. Our platform now operates in post-IPO mode. Shares purchased through us are transferable to your brokerage for public trading.",
  },
];

function SpaceXLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="SpaceX" className={className} />;
}

const YOUTUBE_VIDEO_ID = "sX1Y2JMK6g8";

function HeroSlider({ onInvest, onSignIn }: { onInvest: () => void; onSignIn: () => void }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fading background images */}
      {HERO_SLIDES.map((s, i) => (
        <motion.div
          key={s.image}
          className="absolute inset-0"
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <img
            src={s.image}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.45)" }}
          />
        </motion.div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-40 md:pb-44 px-5 md:px-16 lg:px-24">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1
            className="text-white font-black mb-4 leading-none"
            style={{
              fontSize: "clamp(2.5rem, 9vw, 6rem)",
              fontFamily: "'Arial Black', Arial, sans-serif",
              whiteSpace: "pre-line",
              letterSpacing: "0.04em",
              wordBreak: "break-word",
            }}
          >
            {slide.headline}
          </h1>
          <p className="text-white/70 text-sm md:text-lg max-w-xl mb-6 tracking-wide leading-relaxed">
            {slide.sub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onInvest}
              className="px-6 py-3 bg-white text-black font-bold tracking-widest text-xs uppercase hover:bg-white/90 transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
            >
              APPLY FOR ACCESS ›
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-3 border border-white/50 text-white font-bold tracking-widest text-xs uppercase hover:border-white transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
            >
              INVESTOR LOGIN ›
            </button>
          </div>
        </motion.div>
      </div>

      {/* Slide dots — bottom left */}
      <div className="absolute bottom-8 left-5 md:left-16 flex gap-2 z-10">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-white scale-125" : "bg-white/30"}`}
          />
        ))}
      </div>

      {/* Scroll indicator — bottom center */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none">
        <span className="text-white/35 text-[0.6rem] tracking-[0.25em] uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-white/40">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.volume = 1;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    const startPlay = () => { if (!v.paused) return; void v.play().catch(() => {}); };
    v.load();
    startPlay();
    v.addEventListener("canplay", startPlay);
    v.addEventListener("loadeddata", startPlay);

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && v.paused) startPlay(); },
      { threshold: 0.1 }
    );
    observer.observe(v);

    return () => {
      v.removeEventListener("canplay", startPlay);
      v.removeEventListener("loadeddata", startPlay);
      observer.disconnect();
    };
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) {
      // Both removeAttribute AND setting the property are required for cross-browser unmuting
      v.removeAttribute("muted");
      v.muted = false;
      v.volume = 1;
      // Re-trigger play in case the browser paused on unmute
      void v.play().catch(() => {});
    } else {
      v.muted = true;
    }
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 pt-20 pb-8"
      >
        <p className="text-white/40 text-xs tracking-widest uppercase mb-2">MISSION</p>
        <h2
          className="text-white font-black text-3xl md:text-5xl tracking-wide"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
        >
          WATCH THE VISION
        </h2>
      </motion.div>

      {/* Full-bleed video — 16:9 aspect ratio container */}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {/* Gradient top */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: "18%", background: "linear-gradient(to bottom, #000 0%, transparent 100%)" }}
        />
        {/* Gradient bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: "18%", background: "linear-gradient(to top, #000 0%, transparent 100%)" }}
        />

        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onStalled={() => { const v = videoRef.current; if (v) { v.load(); void v.play().catch(() => {}); } }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        >
          <source src={missionVideo} type="video/mp4" />
        </video>

      </div>

      {/* Bottom spacer */}
      <div className="h-16 bg-black" />
    </section>
  );
}

function StatBar() {
  return (
    <section className="bg-black border-y border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="text-3xl md:text-4xl font-black text-white mb-1"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-white/40 tracking-widest uppercase">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VehicleCard({ name, desc, image, index }: { name: string; desc: string; image: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="group relative overflow-hidden bg-black"
      style={{ aspectRatio: "4/5" }}
    >
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ filter: "brightness(0.55)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div
          className="text-white font-black text-xl tracking-widest mb-2"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
        >
          {name}
        </div>
        <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

const BROKERS = [
  { name: "Fidelity",             logoUrl: "/brokers/fidelity.svg" },
  { name: "Charles Schwab",       logoUrl: "/brokers/schwab.svg" },
  { name: "Interactive Brokers",  logoUrl: "/brokers/ibkr.svg" },
  { name: "TD Ameritrade",        logoUrl: "/brokers/tdameritrade.svg" },
  { name: "Robinhood",            logoUrl: "/brokers/robinhood.svg" },
  { name: "eToro",                logoUrl: "/brokers/etoro.svg" },
  { name: "Trading 212",          logoUrl: "/brokers/trading212.svg" },
  { name: "Saxo Bank",            logoUrl: "/brokers/saxo.svg" },
  { name: "DEGIRO",               logoUrl: "/brokers/degiro.svg" },
  { name: "Hargreaves Lansdown",  logoUrl: "/brokers/hl.svg" },
  { name: "CMC Markets",          logoUrl: "/brokers/cmc.svg" },
  { name: "IG Group",             logoUrl: "/brokers/ig.svg" },
  { name: "Merrill Edge",         logoUrl: "/brokers/merrill.svg" },
  { name: "Vanguard",             logoUrl: "/brokers/vanguard.svg" },
  { name: "Webull",               logoUrl: "/brokers/webull.svg" },
  { name: "Moomoo",               logoUrl: "/brokers/moomoo.svg" },
  { name: "Freetrade",            logoUrl: "/brokers/freetrade.svg" },
  { name: "Plus500",              logoUrl: "/brokers/plus500.svg" },
  { name: "XTB",                  logoUrl: "/brokers/xtb.svg" },
  { name: "Firstrade",            logoUrl: "/brokers/firstrade.svg" },
];

function BrokersSection() {
  return (
    <section className="bg-black py-24 px-6 md:px-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-white/40 text-xs tracking-widest uppercase mb-2">TRANSFERS &amp; COMPATIBILITY</p>
          <h2
            className="text-white font-black text-3xl md:text-5xl tracking-wide"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
          >
            COMPATIBLE<br />BROKERS
          </h2>
          <p className="text-white/40 text-sm mt-4 max-w-xl leading-relaxed">
            When SpaceX goes public, your shares can be transferred directly to your brokerage account. We support all major global brokers.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 bg-white/[0.04]">
          {BROKERS.map((broker, i) => (
            <motion.div
              key={broker.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="bg-black p-5 flex flex-col items-center justify-center gap-3 group hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-lg overflow-hidden">
                <img
                  src={broker.logoUrl}
                  alt={broker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-white/40 text-[0.6rem] tracking-widest uppercase text-center group-hover:text-white/70 transition-colors"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                {broker.name}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-white/20 text-xs mt-8 text-center tracking-wide">
          Brokerage transfers are available after the IPO. Transfer functionality is currently locked (Pre-IPO mode).
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="bg-black py-24 px-6 md:px-16">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-white font-black text-3xl md:text-4xl tracking-widest mb-12"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.08em" }}
        >
          FAQ
        </motion.h2>
        <div className="divide-y divide-white/10">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                className="w-full text-left py-5 flex justify-between items-center gap-4 group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="text-white/80 text-sm font-bold tracking-widest group-hover:text-white transition-colors"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.08em" }}
                >
                  {faq.q}
                </span>
                <span className="text-white/40 text-xl shrink-0 group-hover:text-white transition-colors">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-white/50 text-sm leading-relaxed pb-5">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user, isLoading: userLoading } = useUser();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 100], ["rgba(0,0,0,0)", "rgba(0,0,0,0.95)"]);

  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || userLoading || !user) return;
    if (!user.isEnabled) return; // stay on landing, show access-code screen
    if (user.accreditedStatus === "pending") { navigate("/onboarding"); return; }
    navigate("/dashboard");
  }, [isLoaded, isSignedIn, userLoading, user, navigate]);

  const isPending = isLoaded && isSignedIn && !userLoading && user?.isEnabled === false;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError("");
    try {
      await api.activateWithCode(accessCode.trim());
      setCodeSuccess(true);
      await qc.invalidateQueries({ queryKey: ["me"] });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err: unknown) {
      setCodeError(err instanceof Error ? err.message : "Invalid access code. Please try again.");
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    qc.clear();
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Nav */}
        <div className="flex items-center justify-between px-6 md:px-16 h-20 border-b border-white/[0.06]">
          <SpaceXLogo className="h-14 w-auto text-white" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs tracking-widest uppercase px-3 py-2 border border-white/10 hover:border-white/30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Access code form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-8 bg-white/[0.03]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 text-white/30">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <p className="text-white/30 text-[0.6rem] tracking-[0.3em] uppercase text-center mb-2"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Access Required
            </p>
            <h2 className="text-white font-black text-2xl tracking-wide uppercase text-center mb-3"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Enter Access Code
            </h2>
            <p className="text-white/40 text-sm text-center leading-relaxed mb-8">
              Your account has been registered. An access code will be sent to{" "}
              <span className="text-white/60">{user?.email}</span> once our team approves your application.
            </p>

            {codeSuccess ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-400">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-green-400 text-sm font-semibold">Access granted — redirecting…</p>
              </div>
            ) : (
              <form onSubmit={handleActivate} className="space-y-4">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setCodeError(""); }}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="w-full bg-white/[0.04] border border-white/15 text-white text-center text-xl tracking-[0.5em] font-mono px-4 py-4 focus:outline-none focus:border-white/40 placeholder:text-white/15 placeholder:tracking-widest"
                  style={{ fontFamily: "monospace" }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {codeError && (
                  <p className="text-red-400 text-xs text-center">{codeError}</p>
                )}
                <button
                  type="submit"
                  disabled={codeLoading || accessCode.length < 6}
                  className="w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 disabled:opacity-40 hover:bg-white/90 transition-colors"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {codeLoading ? "Verifying…" : "Unlock Access"}
                </button>
                <p className="text-white/20 text-xs text-center">
                  Don't have a code yet? Our team will email it to you once your application is reviewed.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-50 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
          <SpaceXLogo className="h-16 w-auto text-white" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate("/about")} className="text-xs text-white/55 hover:text-white transition-colors tracking-widest uppercase font-bold px-3 py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>About</button>
            <button onClick={() => navigate("/contact")} className="text-xs text-white/55 hover:text-white transition-colors tracking-widest uppercase font-bold px-3 py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Contact</button>
            {(!isLoaded || !isSignedIn) && (
              <>
                <button onClick={() => navigate("/sign-in")} className="text-xs text-white/55 hover:text-white transition-colors tracking-widest uppercase font-bold px-3 py-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Sign In</button>
                <button onClick={() => navigate("/invest")} className="text-xs bg-white text-black font-black px-5 py-2 tracking-widest uppercase hover:bg-white/90 transition-colors" style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}>Invest</button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 touch-manipulation"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <motion.span animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block w-6 h-px bg-white origin-center transition-all" />
            <motion.span animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }} className="block w-6 h-px bg-white" />
            <motion.span animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block w-6 h-px bg-white origin-center transition-all" />
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="md:hidden overflow-hidden bg-black border-t border-white/[0.08]"
        >
          <div className="flex flex-col px-6 py-4 gap-0">
            {[
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
              ...(!isSignedIn ? [
                { label: "Sign In", path: "/sign-in" },
                { label: "Invest", path: "/invest" },
              ] : []),
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { setMobileMenuOpen(false); navigate(path); }}
                className="w-full text-left py-4 text-sm text-white/70 hover:text-white tracking-[0.2em] uppercase border-b border-white/[0.06] last:border-0 touch-manipulation"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.nav>


      {/* Hero */}
      <HeroSlider onInvest={() => navigate("/invest")} onSignIn={() => navigate("/sign-in")} />

      {/* Stats */}
      <StatBar />

      {/* YouTube video section */}
      <VideoSection />

      {/* Investment vehicles / why spacex */}
      <section className="bg-black py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-white/40 text-xs tracking-widest uppercase mb-2">WHY INVEST</p>
            <h2
              className="text-white font-black text-3xl md:text-5xl tracking-wide"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
            >
              THE FUTURE IS<br />BEING BUILT NOW
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-white/5">
            {vehicles.map((v, i) => (
              <VehicleCard key={v.name} {...v} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works — SpaceX mission-style */}
      <section className="bg-black py-24 px-6 md:px-16 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-white/40 text-xs tracking-widest uppercase mb-2">PROCESS</p>
            <h2
              className="text-white font-black text-3xl md:text-5xl tracking-wide"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
            >
              HOW IT WORKS
            </h2>
          </motion.div>

          <div className="space-y-0 divide-y divide-white/10">
            {[
              { step: "01", title: "CREATE ACCOUNT", desc: "Sign up with your email and complete your investor profile." },
              { step: "02", title: "VERIFY ACCREDITED STATUS", desc: "Confirm you meet SEC accredited investor requirements to unlock purchase access." },
              { step: "03", title: "SUBMIT PURCHASE REQUEST", desc: "Enter the number of shares you wish to acquire and complete the investment application." },
              { step: "04", title: "SHARES CREDITED", desc: "Our team reviews your request and credits the shares to your account dashboard." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-8 items-start py-8"
              >
                <div
                  className="text-white/15 font-black text-5xl md:text-6xl font-mono shrink-0 w-20"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3
                    className="text-white font-black text-base tracking-widest mb-2"
                    style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed CTA with rocket image */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1920&q=90&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.3)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative z-10 px-5 md:px-16 lg:px-24 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-white font-black text-3xl md:text-5xl tracking-wide mb-6"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.05em" }}
            >
              SECURE YOUR POSITION<br />BEFORE THE IPO
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-lg leading-relaxed">
              Access is strictly limited to accredited investors. Create your account today and join the select group securing equity in the most valuable private company in history.
            </p>
            <button
              onClick={() => navigate("/invest")}
              className="px-8 py-4 bg-white text-black font-black tracking-widest text-sm uppercase hover:bg-white/90 transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.12em" }}
            >
              APPLY FOR INVESTOR ACCESS ›
            </button>
          </motion.div>
        </div>
      </section>

      {/* Compatible Brokers */}
      <BrokersSection />

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-10 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <img src={appLogo} alt="SpaceX" className="h-4 w-auto opacity-70" />
          <div className="text-xs text-white/30 max-w-md leading-relaxed">
            © 2026 SpaceX Pre-IPO Share Platform. All rights reserved.<br />
            This platform is for accredited investors only. Registered private securities platform. All investments are professionally managed and secured.
          </div>
          <div className="flex flex-col gap-1 text-xs text-white/30">
            <a href="tel:+14809726080" className="hover:text-white/60 transition-colors touch-manipulation">
              +1 (480) 972-6080
            </a>
            <a href="mailto:reply@spacexrocket.space" className="hover:text-white/60 transition-colors touch-manipulation">
              reply@spacexrocket.space
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
