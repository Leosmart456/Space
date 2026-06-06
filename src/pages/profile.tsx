import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import appLogo from "@assets/xpsca_1778445100452.png";

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
      <label
        className="block text-white/30 text-[0.65rem] tracking-widest uppercase mb-1.5"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-white/20 transition-colors"
      />
    </div>
  );
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, isLoading, updateProfile } = useUser();
  const { signOut } = useAuth();

  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [certDownloading, setCertDownloading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  const totalShares = user?.totalSharesCredited ?? 0;

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

          {/* Page header */}
          <div className="mb-6">
            <p className="text-white/25 text-[0.6rem] tracking-[0.25em] uppercase mb-1"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Investor Account
            </p>
            <h1 className="text-white font-black text-2xl tracking-wide"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              PROFILE
            </h1>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-black tracking-widest uppercase ${
              user?.accreditedStatus === "yes"
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : user?.accreditedStatus === "no"
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
            }`} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              {user?.accreditedStatus === "yes"
                ? "✓ Accredited Investor"
                : user?.accreditedStatus === "no"
                ? "✗ Not Accredited"
                : "⚠ Pending Verification"}
            </div>
            {user?.accreditedStatus !== "yes" && (
              <button
                onClick={() => navigate("/verify")}
                className="text-white/30 text-[0.6rem] tracking-widest uppercase underline underline-offset-2 hover:text-white transition-colors"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                Verify ›
              </button>
            )}
          </div>

          {/* Edit profile card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-6 space-y-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <p className="text-white/30 text-[0.65rem] tracking-widest uppercase"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Personal Information
            </p>
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
              className="bg-white text-black font-black px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-40 flex items-center gap-2"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
            >
              {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE CHANGES"}
            </button>
          </div>

          {/* Documents card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-white/30 text-[0.65rem] tracking-widest uppercase mb-4"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Documents
            </p>
            <div className="divide-y divide-white/[0.06]">
              {[
                { name: "Investment Agreement", downloadable: false, status: "Available" },
                { name: "Accredited Investor Declaration", downloadable: false, status: "Available" },
                {
                  name: "Share Certificate",
                  downloadable: totalShares > 0,
                  status: totalShares > 0 ? "Available" : "Pending shares",
                },
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
                      className="flex items-center gap-1.5 text-[0.6rem] font-black tracking-widest uppercase border border-white/30 px-2.5 py-1 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-40"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                    >
                      {certDownloading ? "···" : (
                        <>
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-2.5 h-2.5">
                            <path d="M6 1v7M3 5.5l3 3 3-3" /><line x1="1" y1="11" x2="11" y2="11" />
                          </svg>
                          DOWNLOAD
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-white/25 text-xs">{doc.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-white/25 text-[0.65rem] tracking-widest uppercase mb-4"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              Holdings Summary
            </p>
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
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Account Status</p>
                <p className={`font-black text-sm ${user?.isEnabled ? "text-green-400" : "text-red-400"}`}
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {user?.isEnabled ? "ACTIVE" : "DISABLED"}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className="w-full border border-white/[0.1] text-white/40 font-black py-3.5 text-xs tracking-widest uppercase hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            SIGN OUT
          </button>

        </motion.div>
      </div>
    </div>
  );
}
