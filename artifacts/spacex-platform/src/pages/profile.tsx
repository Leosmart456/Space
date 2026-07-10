import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import appLogo from "@assets/xpsca_1778445100452.png";

const PROFILE_PHOTO_KEY = "spacex_profile_photo";

function SpaceXLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="SpaceX" className={className} />;
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-white/30 text-[0.65rem] tracking-widest uppercase mb-1.5"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-white/20 transition-colors rounded-lg"
      />
    </div>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, isLoading, updateProfile } = useUser();
  const { signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [certDownloading, setCertDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (saved) setPhotoUrl(saved);
    // Revoke any leftover blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous blob URL to avoid memory leak
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    // Use FileReader to get a data URL (safe for both preview and persistence)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem(PROFILE_PHOTO_KEY, dataUrl);
      setPhotoUrl(dataUrl);
      blobUrlRef.current = null;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({ fullName: editFullName, phone: editPhone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const totalShares = user?.totalSharesCredited ?? 0;
  const sharePrice = 130; // platform share price
  const portfolioValue = totalShares * sharePrice;
  const isAccredited = user?.accreditedStatus === "yes";
  const accColor = isAccredited ? "#22c55e" : user?.accreditedStatus === "no" ? "#ef4444" : "#f59e0b";
  const initials = (user?.fullName ?? user?.email ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <SpaceXLogo className="h-6 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-16 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M12 4l-6 6 6 6" />
          </svg>
          <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Dashboard
          </span>
        </button>
        <SpaceXLogo className="h-10 w-auto" />
        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="pt-24 pb-16 px-4 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Hero: Avatar + Name */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center text-2xl font-black"
                  style={{ borderColor: isAccredited ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.15)", background: photoUrl ? "transparent" : "rgba(255,255,255,0.07)", fontFamily: "'Arial Black', Arial, sans-serif" }}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    : <span style={{ color: "rgba(255,255,255,0.7)" }}>{initials}</span>
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                  style={{ background: "rgba(20,20,20,0.95)" }}
                  title="Change photo"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white/25 text-[0.55rem] tracking-[0.25em] uppercase mb-0.5"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  SPACEX PRE-IPO PLATFORM
                </p>
                <h1 className="text-white font-black text-xl tracking-tight leading-tight truncate"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {user?.fullName?.toUpperCase() || user?.email?.split("@")[0]?.toUpperCase() || "INVESTOR"}
                </h1>
                <p className="text-white/40 text-xs mt-0.5 truncate">{user?.email}</p>

                {/* Verified badge */}
                {isAccredited && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ color: "#22c55e", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      VERIFIED INVESTOR
                    </span>
                  </div>
                )}
                {!isAccredited && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: `${accColor}12`, border: `1px solid ${accColor}30` }}>
                    <span style={{ color: accColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      {user?.accreditedStatus === "no" ? "NOT ACCREDITED" : "PENDING VERIFICATION"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.07]">
              {[
                { label: "Shares", value: totalShares.toLocaleString(), color: "#00e5ff" },
                { label: "Value", value: `$${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "rgba(255,255,255,0.9)" },
                { label: "Status", value: user?.isEnabled ? "ACTIVE" : "DISABLED", color: user?.isEnabled ? "#22c55e" : "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <p className="text-white/30 text-[0.58rem] tracking-widest uppercase"
                    style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.label}</p>
                  <p className="font-black text-sm" style={{ color: s.color, fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accreditation CTA */}
          {user?.accreditedStatus !== "yes" && (
            <button
              onClick={() => navigate("/verify")}
              className="w-full flex items-center gap-4 rounded-2xl border p-4 text-left hover:bg-amber-500/5 transition-colors"
              style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}
            >
              <SectionIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,158,11,0.9)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </SectionIcon>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Complete Accreditation</p>
                <p className="text-white/40 text-xs mt-0.5">Verify your accredited investor status to unlock full access.</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {/* Edit profile card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 space-y-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-center gap-3 mb-1">
              <SectionIcon>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </SectionIcon>
              <p className="text-white/30 text-[0.65rem] tracking-widest uppercase"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Personal Information
              </p>
            </div>
            <InputField
              label="Full Name"
              value={editFullName}
              onChange={setEditFullName}
              placeholder="Your full legal name"
            />
            <InputField
              label="Email Address"
              value={user?.email || ""}
              disabled
            />
            <InputField
              label="Phone Number"
              value={editPhone}
              onChange={setEditPhone}
              placeholder="+1 (555) 000-0000"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-black font-black px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40 rounded-lg"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {saving ? "SAVING..." : saved ? (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> SAVED</>
              ) : "SAVE CHANGES"}
            </button>
          </div>

          {/* Documents card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <SectionIcon>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </SectionIcon>
              <p className="text-white/30 text-[0.65rem] tracking-widest uppercase"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Documents
              </p>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {[
                { name: "Investment Agreement", downloadable: false, status: "Available" },
                { name: "Accredited Investor Declaration", downloadable: false, status: "Available" },
                { name: "Share Certificate", downloadable: totalShares > 0, status: totalShares > 0 ? "Available" : "Pending shares" },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between py-3.5">
                  <span className="text-white/70 text-sm">{doc.name}</span>
                  {doc.downloadable ? (
                    <button
                      onClick={async () => {
                        setCertDownloading(true);
                        try { await api.downloadCertificate(); }
                        catch (e) { console.error(e); }
                        finally { setCertDownloading(false); }
                      }}
                      disabled={certDownloading}
                      className="flex items-center gap-1.5 text-[0.6rem] font-black tracking-widest uppercase border border-white/30 px-2.5 py-1 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-40 rounded"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                    >
                      {certDownloading ? "···" : (
                        <><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-2.5 h-2.5"><path d="M6 1v7M3 5.5l3 3 3-3"/><line x1="1" y1="11" x2="11" y2="11"/></svg>DOWNLOAD</>
                      )}
                    </button>
                  ) : (
                    <span className="text-white/25 text-xs">{doc.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Holdings summary */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <SectionIcon>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </SectionIcon>
              <p className="text-white/25 text-[0.65rem] tracking-widest uppercase"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                Holdings Summary
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Shares Owned</p>
                <p className="text-white font-black text-xl" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {totalShares.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Portfolio Value</p>
                <p className="text-white font-black text-xl" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  ${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Account Status</p>
                <p className={`font-black text-sm ${user?.isEnabled ? "text-green-400" : "text-red-400"}`}
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {user?.isEnabled ? "ACTIVE" : "DISABLED"}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-1"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Share Price</p>
                <p className="text-white font-black text-sm" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  ${sharePrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => { if (window.confirm("Sign out of your account?")) signOut(); }}
            className="w-full flex items-center justify-center gap-2 border border-white/[0.1] text-white/40 font-black py-3.5 text-xs tracking-widest uppercase hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all rounded-2xl"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            SIGN OUT
          </button>

        </motion.div>
      </div>
    </div>
  );
}
