import { useState } from "react";
import { useLocation } from "wouter";
import appLogo from "@assets/xpsca_1778445100452.png";
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

const NET_WORTH_RANGES = [
  "Under $500,000","$500,000 – $1,000,000","$1,000,000 – $5,000,000",
  "$5,000,000 – $25,000,000","Over $25,000,000",
];

const INVESTMENT_AMOUNTS = [
  "$2,000 – $10,000","$10,000 – $25,000","$25,000 – $100,000",
  "$100,000 – $500,000","Over $500,000",
];

const INVESTMENT_PURPOSE_OPTIONS = [
  "Long-Term Capital Growth","Portfolio Diversification",
  "Speculation / High-Risk Appetite","Retirement Planning",
  "Wealth Preservation","Other",
];

const ACCREDITATION_OPTIONS = [
  "Yes — income over $200K (or $300K joint) for 2+ years",
  "Yes — net worth over $1M (excluding primary residence)",
  "Yes — licensed investment professional (Series 7/65/82)",
  "Not yet accredited, but interested in learning more",
];

const EMPLOYMENT_OPTIONS = [
  "Employed (full-time)","Self-Employed","Business Owner / Entrepreneur",
  "Retired","Student","Unemployed / Other",
];

const SOURCE_OF_FUNDS_OPTIONS = [
  "Employment Income","Business Revenue","Investment Returns / Capital Gains",
  "Inheritance or Gift","Savings","Other",
];

const EXPERIENCE_OPTIONS = [
  "First-time investor","Less than 2 years","2–5 years","5–10 years","10+ years",
];

const HEAR_ABOUT_OPTIONS = [
  "Online advertisement","Social media","Friend or referral",
  "News article","Search engine","Other",
];

const inputCls = "w-full bg-white/[0.03] border border-white/[0.1] text-white px-4 py-3 text-sm focus:outline-none focus:border-white/35 placeholder:text-white/15 transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/35 text-[0.58rem] tracking-[0.22em] uppercase mb-2"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}{required && <span className="text-white/22 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder, required }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; required?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className={selectCls} style={{ colorScheme: "dark" }}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
  );
}

function RadioGroup({ name, options, value, onChange }: {
  name: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt} className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-colors ${value === opt ? "border-white/30 bg-white/[0.05]" : "border-white/[0.08] hover:border-white/20"}`}>
          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${value === opt ? "border-white" : "border-white/25"}`}>
            {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <input type="radio" name={name} value={opt} checked={value === opt}
            onChange={() => onChange(opt)} className="sr-only" />
          <span className="text-white/55 text-xs leading-relaxed">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white/20 text-[0.6rem] tracking-[0.3em] uppercase mb-4 pb-2 border-b border-white/[0.06]"
      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
      {children}
    </p>
  );
}

export default function InvestPage() {
  const [, navigate] = useLocation();

  // Personal Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [citizenship, setCitizenship] = useState("");

  // Residential Address
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  // Financial Profile
  const [annualIncome, setAnnualIncome] = useState("");
  const [netWorthRange, setNetWorthRange] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentPurpose, setInvestmentPurpose] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [investmentExperience, setInvestmentExperience] = useState("");

  // Accreditation & Discovery
  const [accreditationStatus, setAccreditationStatus] = useState("");
  const [hearAboutUs, setHearAboutUs] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxDob = new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) { setError("Please fill in your name and email."); return; }
    if (!dateOfBirth) { setError("Please enter your date of birth."); return; }
    if (!nationality.trim()) { setError("Please enter your nationality."); return; }
    if (!citizenship) { setError("Please select your citizenship country."); return; }
    if (!streetAddress.trim()) { setError("Please enter your street address."); return; }
    if (!city.trim()) { setError("Please enter your city."); return; }
    if (!postalCode.trim()) { setError("Please enter your postal code."); return; }
    if (!country) { setError("Please select your country of residence."); return; }
    if (!annualIncome) { setError("Please select your annual income range."); return; }
    if (!netWorthRange) { setError("Please select your net worth range."); return; }
    if (!investmentAmount) { setError("Please select your intended investment amount."); return; }
    if (!investmentPurpose) { setError("Please select your investment purpose."); return; }
    if (!employmentStatus) { setError("Please select your employment status."); return; }
    if (!sourceOfFunds) { setError("Please select your source of funds."); return; }
    if (!investmentExperience) { setError("Please select your investment experience."); return; }
    if (!accreditationStatus) { setError("Please select your accreditation status."); return; }
    if (!hearAboutUs) { setError("Please tell us how you heard about us."); return; }
    setLoading(true);
    setError("");
    try {
      await api.createAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth,
        nationality: nationality.trim(),
        citizenship,
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        stateProvince: stateProvince.trim() || undefined,
        postalCode: postalCode.trim(),
        country,
        annualIncome,
        netWorthRange,
        investmentAmount,
        investmentPurpose,
        accreditationStatus,
        employmentStatus,
        sourceOfFunds,
        investmentExperience,
        hearAboutUs,
      });
      sessionStorage.setItem("invest_email", email.trim());
      navigate("/invest/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 md:px-16 h-20 border-b border-white/[0.06] shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center">
          <img src={appLogo} alt="SpaceX" className="h-14 w-auto" />
        </button>
        <div className="flex items-center gap-6">
          <span className="text-white/25 text-[0.6rem] tracking-[0.25em] uppercase hidden sm:block"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Step 1 of 2 — Application
          </span>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-xs tracking-widest uppercase"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-white/[0.06] shrink-0">
        <div className="h-full bg-white/40 transition-all" style={{ width: "50%" }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <p className="text-white/30 text-[0.58rem] tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              SpaceX Investor Platform
            </p>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-wide uppercase mb-3"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.06em" }}>
              Investor Application
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-lg">
              Complete all fields below to apply for pre-IPO share access. All information is kept strictly confidential. Fields marked * are required.
            </p>
          </div>

          <form id="invest-form" onSubmit={handleSubmit} className="space-y-8">

            {/* ── Personal Information ── */}
            <div>
              <SectionLabel>Personal Information</SectionLabel>
              <div className="space-y-4">
                <Field label="Full Legal Name" required>
                  <input type="text" value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(""); }}
                    placeholder="John Smith" required autoComplete="name"
                    className={inputCls} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email Address" required>
                    <input type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="john@example.com" required autoComplete="email"
                      className={inputCls} />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000" autoComplete="tel"
                      className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date of Birth" required>
                    <input type="date" value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required max={maxDob}
                      className={inputCls}
                      style={{ colorScheme: "dark" }} />
                  </Field>
                  <Field label="Nationality" required>
                    <input type="text" value={nationality}
                      onChange={(e) => { setNationality(e.target.value); setError(""); }}
                      placeholder="e.g. American, British…"
                      className={inputCls} />
                  </Field>
                </div>

                <Field label="Citizenship Country" required>
                  <SelectField value={citizenship} onChange={setCitizenship}
                    options={COUNTRIES} placeholder="Select country…" required />
                </Field>
              </div>
            </div>

            {/* ── Residential Address ── */}
            <div>
              <SectionLabel>Residential Address</SectionLabel>
              <div className="space-y-4">
                <Field label="Street Address" required>
                  <input type="text" value={streetAddress}
                    onChange={(e) => { setStreetAddress(e.target.value); setError(""); }}
                    placeholder="123 Main Street, Apt 4B" autoComplete="street-address"
                    className={inputCls} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" required>
                    <input type="text" value={city}
                      onChange={(e) => { setCity(e.target.value); setError(""); }}
                      placeholder="Los Angeles" autoComplete="address-level2"
                      className={inputCls} />
                  </Field>
                  <Field label="State / Province">
                    <input type="text" value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="California" autoComplete="address-level1"
                      className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Postal Code" required>
                    <input type="text" value={postalCode}
                      onChange={(e) => { setPostalCode(e.target.value); setError(""); }}
                      placeholder="90001" autoComplete="postal-code"
                      className={inputCls} />
                  </Field>
                  <Field label="Country of Residence" required>
                    <SelectField value={country} onChange={setCountry}
                      options={COUNTRIES} placeholder="Select country…" required />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Financial Profile ── */}
            <div>
              <SectionLabel>Financial Profile</SectionLabel>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Annual Income (USD)" required>
                    <SelectField value={annualIncome} onChange={setAnnualIncome}
                      options={INCOME_RANGES} placeholder="Select range…" required />
                  </Field>
                  <Field label="Net Worth (excl. primary residence)" required>
                    <SelectField value={netWorthRange} onChange={setNetWorthRange}
                      options={NET_WORTH_RANGES} placeholder="Select range…" required />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Intended Investment Amount" required>
                    <SelectField value={investmentAmount} onChange={setInvestmentAmount}
                      options={INVESTMENT_AMOUNTS} placeholder="Select amount…" required />
                  </Field>
                  <Field label="Employment Status" required>
                    <SelectField value={employmentStatus} onChange={setEmploymentStatus}
                      options={EMPLOYMENT_OPTIONS} placeholder="Select status…" required />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Source of Funds" required>
                    <SelectField value={sourceOfFunds} onChange={setSourceOfFunds}
                      options={SOURCE_OF_FUNDS_OPTIONS} placeholder="Select source…" required />
                  </Field>
                  <Field label="Investment Experience" required>
                    <SelectField value={investmentExperience} onChange={setInvestmentExperience}
                      options={EXPERIENCE_OPTIONS} placeholder="Select experience…" required />
                  </Field>
                </div>

                <Field label="Purpose of Investment" required>
                  <SelectField value={investmentPurpose} onChange={setInvestmentPurpose}
                    options={INVESTMENT_PURPOSE_OPTIONS} placeholder="Select purpose…" required />
                </Field>
              </div>
            </div>

            {/* ── Accreditation Status ── */}
            <div>
              <SectionLabel>Accredited Investor Status *</SectionLabel>
              <RadioGroup
                name="accreditation"
                options={ACCREDITATION_OPTIONS}
                value={accreditationStatus}
                onChange={setAccreditationStatus}
              />
            </div>

            {/* ── How did you hear about us ── */}
            <div>
              <SectionLabel>How Did You Hear About Us? *</SectionLabel>
              <RadioGroup
                name="hear-about"
                options={HEAR_ABOUT_OPTIONS}
                value={hearAboutUs}
                onChange={setHearAboutUs}
              />
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <div className="pt-2 pb-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black text-xs tracking-[0.2em] uppercase py-4 disabled:opacity-35 hover:bg-white/90 transition-colors touch-manipulation"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                {loading ? "Sending Verification Code…" : "Continue to Verification →"}
              </button>
              <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
                A 6-digit code will be sent to your email to confirm your identity. For accredited investors only.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
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
