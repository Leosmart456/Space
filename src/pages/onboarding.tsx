import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import appLogo from "@assets/xpsca_1778445100452.png";

function SpaceXLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="SpaceX" className={className} />;
}

const SECTIONS = ["Accreditation", "Declarations"];

function SectionAnchor({ id, label, index, activeSection }: {
  id: string; label: string; index: number; activeSection: number;
}) {
  return (
    <a href={`#${id}`} className="flex flex-col items-center gap-1 no-underline">
      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300
        ${index <= activeSection ? "bg-white" : "bg-white/15"}`} />
      <span className={`text-[0.55rem] tracking-widest uppercase hidden sm:block transition-colors duration-300
        ${index === activeSection ? "text-white" : index < activeSection ? "text-white/40" : "text-white/15"}`}
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}
      </span>
    </a>
  );
}

function CheckRow({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors
          ${checked ? "bg-white border-white" : "border-white/25 group-hover:border-white/50"}`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2">
            <path d="M1 4l3 3 5-6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-white/70 leading-relaxed select-none">{children}</span>
    </label>
  );
}

function SectionHeading({ num, total, title, sub }: { num: number; total: number; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <p className="text-white/25 text-[0.6rem] tracking-[0.2em] uppercase mb-1"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        Section {num} of {total} — {sub}
      </p>
      <h2 className="text-white font-black text-xl tracking-wide"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {title}
      </h2>
    </div>
  );
}

export default function OnboardingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading: userLoading, verifyInvestor } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const sectionRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  // ── Accreditation
  const [crit1, setCrit1] = useState(false);
  const [crit2, setCrit2] = useState(false);
  const [crit3, setCrit3] = useState(false);
  const [crit4, setCrit4] = useState(false);
  const [masterAccredited, setMasterAccredited] = useState(false);

  // ── Declarations
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);
  const [decl4, setDecl4] = useState(false);
  const [decl5, setDecl5] = useState(false);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.findIndex((r) => r.current === entry.target);
            if (idx !== -1) setActiveSection(idx);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sectionRefs.forEach((r) => { if (r.current) observer.observe(r.current); });
    return () => observer.disconnect();
  }, []);

  // Auth guards
  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!userLoading && user && user.accreditedStatus !== "pending") {
      navigate("/dashboard");
    }
  }, [user, userLoading, navigate]);

  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <SpaceXLogo className="h-6 w-auto animate-pulse" />
      </div>
    );
  }

  if (!user || user.accreditedStatus !== "pending") return null;

  function validate(): { section: number; message: string } | null {
    if (![decl1, decl2, decl3, decl4, decl5].every(Boolean))
      return { section: 1, message: "You must agree to all declarations" };
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: err.message, variant: "destructive" });
      sectionRefs[err.section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSubmitting(true);
    try {
      await verifyInvestor.mutateAsync({
        isAccredited: masterAccredited,
      });
      toast({ title: "Application submitted", description: "Welcome to the SpaceX investor portal." });
      navigate("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Already verified")) {
        navigate("/dashboard");
      } else {
        toast({ title: "Submission failed", description: msg, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <SpaceXLogo className="h-5 w-auto" />
        <span className="text-white/30 text-[0.6rem] tracking-[0.2em] uppercase"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          INVESTOR APPLICATION
        </span>
      </header>

      {/* Sticky progress bar */}
      <div className="sticky top-0 z-10 bg-black border-b border-white/[0.06] shrink-0">
        <div className="flex justify-around items-start px-6 py-3 max-w-2xl mx-auto w-full">
          {SECTIONS.map((label, i) => (
            <SectionAnchor
              key={label}
              id={`section-${i}`}
              label={label}
              index={i}
              activeSection={activeSection}
            />
          ))}
        </div>
      </div>

      {/* Welcome banner */}
      <div className="bg-white/[0.03] border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/60 text-sm leading-relaxed">
            Welcome, <span className="text-white font-semibold">{user.fullName}</span>. Your email has been verified.
            Please complete the final declarations below to activate your investor account.
          </p>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate>
          <div className="max-w-2xl mx-auto px-6 py-10 space-y-16">

            {/* ── Section 1: Accreditation */}
            <div ref={sectionRefs[0]} id="section-0">
              <SectionHeading num={1} total={2} title="ACCREDITED INVESTOR DECLARATION" sub="Eligibility" />
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                Under SEC Regulation D, only accredited investors may participate in this private placement.
                Review each criterion and tick any that apply to you.
              </p>

              <div className="border border-white/[0.07] divide-y divide-white/[0.05] mb-6">
                {[
                  {
                    s: crit1, set: setCrit1,
                    text: "My annual income exceeded $200,000 (or $300,000 jointly with my spouse) in each of the last two years, and I reasonably expect the same in the current year.",
                  },
                  {
                    s: crit2, set: setCrit2,
                    text: "My individual net worth, or joint net worth with my spouse, exceeds $1,000,000, excluding the value of my primary residence.",
                  },
                  {
                    s: crit3, set: setCrit3,
                    text: "I hold a FINRA Series 7, Series 65, or Series 82 license currently in good standing.",
                  },
                  {
                    s: crit4, set: setCrit4,
                    text: "I represent an entity with total assets exceeding $5,000,000, or all equity owners of the entity are themselves accredited investors.",
                  },
                ].map(({ s, set, text }, i) => (
                  <div key={i} className="p-4">
                    <CheckRow checked={s} onChange={set}>
                      <span className="text-white/30 font-black mr-2"
                        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                        {["A", "B", "C", "D"][i]}.
                      </span>
                      {text}
                    </CheckRow>
                  </div>
                ))}
              </div>

              <div className="border border-white/20 bg-white/[0.03] p-4">
                <CheckRow checked={masterAccredited} onChange={setMasterAccredited}>
                  <span className="text-white font-semibold">
                    I confirm that I meet one or more of the accredited investor criteria listed above,
                    and I understand that providing false information is a violation of securities law.
                  </span>
                </CheckRow>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* ── Section 2: Declarations */}
            <div ref={sectionRefs[1]} id="section-1">
              <SectionHeading num={2} total={2} title="FINAL DECLARATIONS" sub="Authorisation" />
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                By submitting this application you agree to the following statements. All boxes must be checked.
              </p>

              <div className="space-y-5">
                <CheckRow checked={decl1} onChange={setDecl1}>
                  I acknowledge that investing in private pre-IPO securities involves substantial risk, including the risk of total loss of my investment, and that this investment is illiquid and may remain so indefinitely.
                </CheckRow>
                <CheckRow checked={decl2} onChange={setDecl2}>
                  I understand that there is no guarantee of returns or profits from this investment, and that past performance of SpaceX or any related entity is not indicative of future results.
                </CheckRow>
                <CheckRow checked={decl3} onChange={setDecl3}>
                  I understand that my shares are subject to transfer restrictions and lock-up periods, and that I may not be able to sell or transfer my shares until after an IPO or other liquidity event, if at all.
                </CheckRow>
                <CheckRow checked={decl4} onChange={setDecl4}>
                  I certify that all information provided in this application is true, accurate, and complete to the best of my knowledge, and I will promptly notify the platform of any material change in my circumstances.
                </CheckRow>
                <CheckRow checked={decl5} onChange={setDecl5}>
                  I confirm that I am duly authorised to make this application and to bind myself (or the entity I represent) to the terms of this investment, and that I have read and understood the offering documents provided.
                </CheckRow>
              </div>

              <div className="border-t border-white/[0.07] mt-8 pt-6">
                <p className="text-white/20 text-xs leading-relaxed mb-8">
                  By submitting this application, you are entering into a legally binding self-certification of
                  your accredited investor status under SEC Regulation D, Rule 506(c). Submitting false information
                  may constitute securities fraud.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-10 py-4 bg-white text-black text-xs font-black tracking-widest uppercase
                    hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {submitting ? "SUBMITTING APPLICATION…" : "SUBMIT APPLICATION →"}
                </button>
              </div>
            </div>

            <div className="h-16" />
          </div>
        </form>
      </div>
    </div>
  );
}
