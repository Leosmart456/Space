import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AdminUser, type AdminPurchase, type AdminTransfer, type SmtpStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";

const FONT = "'Arial Black', Arial, sans-serif";

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-green-500/15 text-green-400 border-green-500/25",
    rejected: "bg-red-500/15 text-red-400 border-red-500/25",
    pending_review: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    completed: "bg-green-500/15 text-green-400 border-green-500/25",
    transfer_requested: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    queued: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  };
  const label: Record<string, string> = {
    confirmed: "Confirmed", rejected: "Rejected", pending_review: "Pending",
    completed: "Completed", transfer_requested: "Requested", queued: "Queued",
  };
  return (
    <span className={`text-[0.65rem] px-2 py-0.5 border font-black tracking-widest uppercase ${map[status] ?? "bg-white/10 text-white/50 border-white/15"}`}
      style={{ fontFamily: FONT }}>
      {label[status] ?? status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/40 text-[0.6rem] tracking-[0.18em] uppercase mb-1.5" style={{ fontFamily: FONT }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 ${props.className ?? ""}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full bg-white/[0.06] border border-white/[0.1] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 resize-none"
    />
  );
}

function Btn({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "success" | "blue" }) {
  const base = "text-[0.65rem] font-black tracking-widest uppercase px-4 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-white text-black hover:bg-white/90",
    ghost: "bg-white/[0.06] text-white/60 border border-white/[0.1] hover:text-white hover:bg-white/[0.1]",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25",
    success: "bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25",
    blue: "bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25",
  };
  return <button {...props} style={{ fontFamily: FONT, ...props.style }} className={`${base} ${styles[variant]} ${props.className ?? ""}`}>{children}</button>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-white/[0.04] border border-white/[0.08] p-6 ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase mb-4" style={{ fontFamily: FONT }}>{children}</p>
  );
}

function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.adminLogin(username, password);
      onLogin();
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-white/25 text-[0.6rem] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: FONT }}>SPACEX PRE-IPO</p>
          <h1 className="text-white text-3xl font-black tracking-wide" style={{ fontFamily: FONT }}>ADMIN PANEL</h1>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Username">
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Btn type="submit" disabled={loading} className="w-full py-3">
              {loading ? "SIGNING IN..." : "SIGN IN ›"}
            </Btn>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

type Tab = "overview" | "users" | "purchases" | "transfers" | "settings" | "broadcast";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: adminMe, isLoading: adminChecking, isError: adminUnauth } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: api.adminMe,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const isAdmin = !!adminMe?.ok;

  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: api.getAdminStats, enabled: isAdmin });
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: api.getAdminUsers, enabled: isAdmin && tab === "users" });
  const { data: purchases = [] } = useQuery({ queryKey: ["admin", "purchases"], queryFn: api.getAdminPurchases, enabled: isAdmin && tab === "purchases" });
  const { data: transfers = [] } = useQuery<AdminTransfer[]>({ queryKey: ["admin", "transfers"], queryFn: api.getAdminTransfers, enabled: isAdmin && tab === "transfers" });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings, enabled: isAdmin });
  const { data: smtpStatus } = useQuery<SmtpStatus>({ queryKey: ["admin", "smtp-status"], queryFn: api.getSmtpStatus, enabled: isAdmin && tab === "overview", staleTime: 60_000 });

  const [creditUserId, setCreditUserId] = useState<string | null>(null);
  const [creditShares, setCreditShares] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({});
  const [setPasswordUserId, setSetPasswordUserId] = useState<string | null>(null);
  const [setPasswordValue, setSetPasswordValue] = useState("");

  const [sharePrice, setSharePrice] = useState("");
  const [minInvestmentInput, setMinInvestmentInput] = useState("");
  const [systemMode, setSystemMode] = useState<"pre_ipo" | "post_ipo" | "">(""); 
  const [ipoDateInput, setIpoDateInput] = useState("");
  const [btcAddressInput, setBtcAddressInput] = useState("");
  const [ethAddressInput, setEthAddressInput] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const setPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => api.adminSetPassword(userId, password),
    onSuccess: (data) => { setSetPasswordUserId(null); setSetPasswordValue(""); toast({ title: `Password set for ${data.email}` }); },
    onError: (e) => toast({ title: "Failed to set password", description: String(e), variant: "destructive" }),
  });

  const generateCodeMutation = useMutation({
    mutationFn: (userId: string) => api.generateAccessCode(userId),
    onSuccess: (data) => { setGeneratedCodes((prev) => ({ ...prev, [data.userId]: data.code })); },
    onError: (e) => toast({ title: "Failed to generate code", description: String(e), variant: "destructive" }),
  });

  const creditMutation = useMutation({
    mutationFn: ({ userId, shares }: { userId: string; shares: number }) => api.creditShares(userId, shares),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setCreditUserId(null); setCreditShares("");
      toast({ title: "Shares credited successfully" });
    },
    onError: (e) => toast({ title: "Failed to credit shares", description: String(e), variant: "destructive" }),
  });

  const accessMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) => api.setUserAccess(userId, enabled),
    onSuccess: (_, { enabled }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: enabled ? "User access granted" : "User access revoked" });
    },
    onError: (e) => toast({ title: "Failed to update access", description: String(e), variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending_review" | "confirmed" | "rejected" }) => api.updatePurchaseStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "purchases"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Status updated" });
    },
    onError: (e) => toast({ title: "Update failed", description: String(e), variant: "destructive" }),
  });

  const settingsMutation = useMutation({
    mutationFn: (body: { sharePrice?: number; systemMode?: "pre_ipo" | "post_ipo"; minInvestment?: number; ipoTargetDate?: string | null; btcAddress?: string; ethAddress?: string }) => api.updateSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Settings updated" });
    },
    onError: (e) => toast({ title: "Update failed", description: String(e), variant: "destructive" }),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => api.sendBroadcast(broadcastSubject, broadcastBody),
    onSuccess: (data) => {
      toast({ title: `Broadcast sent to ${data.sent} users` });
      setBroadcastSubject(""); setBroadcastBody("");
    },
    onError: (e) => toast({ title: "Broadcast failed", description: String(e), variant: "destructive" }),
  });

  const updateTransferMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "queued" | "transfer_requested" | "completed" }) => api.updateAdminTransferStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "transfers"] }); toast({ title: "Transfer status updated" }); },
    onError: (e) => toast({ title: "Update failed", description: String(e), variant: "destructive" }),
  });

  const logoutMutation = useMutation({
    mutationFn: api.adminLogout,
    onSuccess: () => { qc.clear(); qc.invalidateQueries({ queryKey: ["admin", "me"] }); },
  });

  if (adminChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/20 text-xs animate-pulse" style={{ fontFamily: FONT }}>LOADING...</p>
      </div>
    );
  }

  if (!isAdmin || adminUnauth) {
    return <AdminLoginPage onLogin={() => qc.invalidateQueries({ queryKey: ["admin", "me"] })} />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "purchases", label: "Purchases" },
    { id: "transfers", label: "Transfers" },
    { id: "settings", label: "Settings" },
    { id: "broadcast", label: "Broadcast" },
  ];

  const thClass = "text-left px-5 py-3 text-white/30 text-[0.6rem] tracking-[0.15em] uppercase font-normal border-b border-white/[0.06]";
  const tdClass = "px-5 py-4 text-sm text-white/80 border-b border-white/[0.04] last-of-type:border-0";

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top nav */}
      <nav className="border-b border-white/[0.08] bg-black/95 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-white/40">
                <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
                <rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" />
              </svg>
              <span className="text-white font-black text-sm tracking-widest uppercase" style={{ fontFamily: FONT }}>Admin</span>
            </div>
            <span className="text-white/20 text-xs">SpaceX Pre-IPO Platform</span>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-white/30 text-xs hover:text-white transition-colors tracking-widest uppercase"
            style={{ fontFamily: FONT }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tab nav */}
        <div className="flex gap-0 mb-8 border-b border-white/[0.08]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-[0.65rem] tracking-[0.15em] uppercase font-black transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-white text-white"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
              style={{ fontFamily: FONT }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Users", value: stats.totalUsers },
                  { label: "Accredited", value: stats.accreditedUsers },
                  { label: "Shares Credited", value: stats.totalSharesCredited.toLocaleString() },
                  { label: "Portfolio Value", value: `$${(stats.totalUsdValue / 1_000_000).toFixed(1)}M` },
                  { label: "Pending", value: stats.pendingPurchases },
                  { label: "Confirmed", value: stats.confirmedPurchases },
                ].map((s) => (
                  <div key={s.label} className="relative bg-white/[0.04] border border-white/[0.08] p-4">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-white/30 text-[0.55rem] tracking-[0.18em] uppercase mb-2" style={{ fontFamily: FONT }}>{s.label}</p>
                    <p className="text-white font-black text-2xl" style={{ fontFamily: FONT }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <Card>
              <CardTitle>Platform Status</CardTitle>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-white/40 text-xs">Share Price</span>
                  <p className="text-white font-black mt-0.5" style={{ fontFamily: FONT }}>${settings?.sharePrice ?? "150"}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Mode</span>
                  <p className={`font-black mt-0.5 ${settings?.systemMode === "post_ipo" ? "text-green-400" : "text-white"}`} style={{ fontFamily: FONT }}>
                    {settings?.systemMode === "post_ipo" ? "POST-IPO" : "PRE-IPO"}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Email / SMTP</CardTitle>
                {smtpStatus && (
                  <span className={`text-[0.6rem] font-black tracking-widest uppercase px-2 py-0.5 border ${
                    smtpStatus.status === "ok"
                      ? "bg-green-500/15 text-green-400 border-green-500/25"
                      : smtpStatus.status === "unchecked"
                      ? "bg-white/10 text-white/40 border-white/15"
                      : "bg-red-500/15 text-red-400 border-red-500/25"
                  }`} style={{ fontFamily: FONT }}>
                    {smtpStatus.status === "ok" ? "Connected" : smtpStatus.status === "unchecked" ? "Unchecked" : "Error"}
                  </span>
                )}
              </div>
              {smtpStatus ? (
                <>
                  <p className="text-white/40 text-sm">{smtpStatus.message}</p>
                  {smtpStatus.checkedAt && (
                    <p className="text-white/20 text-xs mt-1">Last checked: {format(new Date(smtpStatus.checkedAt), "MMM d, yyyy HH:mm:ss")}</p>
                  )}
                </>
              ) : (
                <p className="text-white/20 text-xs animate-pulse">Checking SMTP status…</p>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase" style={{ fontFamily: FONT }}>All Investors ({users.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={thClass} style={{ fontFamily: FONT }}>Name</th>
                      <th className={thClass} style={{ fontFamily: FONT }}>Email</th>
                      <th className={`${thClass} text-center`} style={{ fontFamily: FONT }}>Access</th>
                      <th className={`${thClass} text-center`} style={{ fontFamily: FONT }}>Accredited</th>
                      <th className={`${thClass} text-right`} style={{ fontFamily: FONT }}>Shares</th>
                      <th className={`${thClass} text-right`} style={{ fontFamily: FONT }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: AdminUser) => (
                      <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className={tdClass}><span className="text-white font-medium">{u.fullName}</span></td>
                        <td className={tdClass}>{u.email}</td>
                        <td className={`${tdClass} text-center`}>
                          <button
                            onClick={() => accessMutation.mutate({ userId: u.id, enabled: !u.isEnabled })}
                            disabled={accessMutation.isPending}
                            className={`text-[0.6rem] font-black tracking-widest uppercase px-2.5 py-1 border transition-colors disabled:opacity-40 ${
                              u.isEnabled
                                ? "bg-green-500/15 text-green-400 border-green-500/25 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25"
                                : "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-green-500/15 hover:text-green-400 hover:border-green-500/25"
                            }`}
                            style={{ fontFamily: FONT }}
                          >
                            {u.isEnabled ? "Enabled" : "Disabled"}
                          </button>
                        </td>
                        <td className={`${tdClass} text-center`}>
                          <Badge status={u.accreditedStatus === "yes" ? "confirmed" : u.accreditedStatus === "no" ? "rejected" : "pending_review"} />
                        </td>
                        <td className={`${tdClass} text-right font-black text-white`} style={{ fontFamily: FONT }}>
                          {u.totalSharesCredited.toLocaleString()}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex flex-col items-end gap-2">
                            {creditUserId === u.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="number"
                                  value={creditShares}
                                  onChange={(e) => setCreditShares(e.target.value)}
                                  placeholder="# shares"
                                  className="w-24 bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-xs text-white focus:outline-none"
                                />
                                <Btn onClick={() => creditMutation.mutate({ userId: u.id, shares: Number(creditShares) })} disabled={!creditShares || creditMutation.isPending}>
                                  Credit
                                </Btn>
                                <button onClick={() => setCreditUserId(null)} className="text-white/30 text-xs hover:text-white">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setCreditUserId(u.id)} className="text-white/40 text-xs hover:text-white transition-colors">Credit Shares</button>
                            )}
                            {setPasswordUserId === u.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="password"
                                  value={setPasswordValue}
                                  onChange={(e) => setSetPasswordValue(e.target.value)}
                                  placeholder="New password"
                                  autoFocus
                                  className="w-32 bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-xs text-white focus:outline-none"
                                />
                                <Btn variant="blue" onClick={() => setPasswordMutation.mutate({ userId: u.id, password: setPasswordValue })} disabled={setPasswordValue.length < 6 || setPasswordMutation.isPending}>
                                  Save
                                </Btn>
                                <button onClick={() => { setSetPasswordUserId(null); setSetPasswordValue(""); }} className="text-white/30 text-xs hover:text-white">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setSetPasswordUserId(u.id); setSetPasswordValue(""); }} className="text-blue-400/60 text-xs hover:text-blue-400 transition-colors">Set Password</button>
                            )}
                            {!u.isEnabled && (
                              generatedCodes[u.id] ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono tracking-widest bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 px-2 py-0.5 select-all">
                                    {generatedCodes[u.id]}
                                  </span>
                                  <button onClick={() => navigator.clipboard.writeText(generatedCodes[u.id])} className="text-white/30 text-xs hover:text-white">Copy</button>
                                  <button onClick={() => generateCodeMutation.mutate(u.id)} className="text-white/30 text-xs hover:text-white">↻</button>
                                </div>
                              ) : (
                                <button onClick={() => generateCodeMutation.mutate(u.id)} disabled={generateCodeMutation.isPending} className="text-yellow-400/60 text-xs hover:text-yellow-400 transition-colors disabled:opacity-40">Generate Code</button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── PURCHASES ── */}
        {tab === "purchases" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.08]">
                <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase" style={{ fontFamily: FONT }}>All Purchase Requests ({purchases.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={thClass} style={{ fontFamily: FONT }}>Date</th>
                      <th className={thClass} style={{ fontFamily: FONT }}>Investor</th>
                      <th className={`${thClass} text-right`} style={{ fontFamily: FONT }}>Amount</th>
                      <th className={`${thClass} text-right`} style={{ fontFamily: FONT }}>Shares</th>
                      <th className={`${thClass} text-center`} style={{ fontFamily: FONT }}>Status</th>
                      <th className={`${thClass} text-right`} style={{ fontFamily: FONT }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p: AdminPurchase) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className={tdClass}>{format(new Date(p.createdAt), "MMM d, yyyy")}</td>
                        <td className={tdClass}>
                          <p className="text-white font-medium">{p.userFullName}</p>
                          <p className="text-white/30 text-xs">{p.userEmail}</p>
                        </td>
                        <td className={`${tdClass} text-right font-black text-white`} style={{ fontFamily: FONT }}>${Number(p.amountUsd).toLocaleString()}</td>
                        <td className={`${tdClass} text-right`}>{Number(p.requestedShares).toLocaleString()}</td>
                        <td className={`${tdClass} text-center`}><Badge status={p.status} /></td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex gap-2 justify-end flex-wrap">
                            {p.status !== "confirmed" && (
                              <Btn variant="success" onClick={() => updateStatusMutation.mutate({ id: p.id, status: "confirmed" })}>Confirm</Btn>
                            )}
                            {p.status !== "rejected" && (
                              <Btn variant="danger" onClick={() => updateStatusMutation.mutate({ id: p.id, status: "rejected" })}>Reject</Btn>
                            )}
                            <Btn variant="blue" onClick={async () => {
                              try {
                                await api.resendPaymentInstructions(p.id);
                                toast({ title: "Payment instructions resent", description: `Email sent to ${p.userEmail}` });
                              } catch {
                                toast({ title: "Failed to resend", variant: "destructive" });
                              }
                            }}>Resend Email</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── TRANSFERS ── */}
        {tab === "transfers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <p className="text-white/40 text-[0.6rem] tracking-[0.2em] uppercase" style={{ fontFamily: FONT }}>All Transfer Requests ({transfers.length})</p>
                <div className="flex items-center gap-4 text-[0.6rem] text-white/30" style={{ fontFamily: FONT }}>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Queued</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />Requested</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Completed</span>
                </div>
              </div>
              {transfers.length === 0 ? (
                <div className="px-5 py-16 text-center text-white/20 text-sm">No transfer requests yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {["Date", "Investor", "Brokerage", "Account #", "Holder Name", "Status", "Actions"].map((h, i) => (
                          <th key={h} className={`${thClass} ${i >= 5 ? "text-center" : ""} ${i === 6 ? "text-right" : ""}`} style={{ fontFamily: FONT }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t: AdminTransfer) => (
                        <tr key={t.id} className={`hover:bg-white/[0.02] transition-colors ${t.status === "queued" ? "bg-yellow-500/[0.03]" : ""}`}>
                          <td className={tdClass}>{format(new Date(t.createdAt), "MMM d, yyyy")}</td>
                          <td className={tdClass}>
                            <p className="text-white font-medium">{t.userFullName}</p>
                            <p className="text-white/30 text-xs">{t.userEmail}</p>
                          </td>
                          <td className={tdClass}>{t.brokerageName}</td>
                          <td className={`${tdClass} font-mono text-xs`}>{t.brokerageAccountNumber}</td>
                          <td className={tdClass}>{t.accountHolderName}</td>
                          <td className={`${tdClass} text-center`}><Badge status={t.status} /></td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex gap-2 justify-end">
                              {t.status === "queued" && (
                                <Btn variant="blue" onClick={() => updateTransferMutation.mutate({ id: t.id, status: "transfer_requested" })} disabled={updateTransferMutation.isPending}>Approve</Btn>
                              )}
                              {t.status === "transfer_requested" && (
                                <Btn variant="success" onClick={() => updateTransferMutation.mutate({ id: t.id, status: "completed" })} disabled={updateTransferMutation.isPending}>Complete</Btn>
                              )}
                              {t.status === "completed" && <span className="text-white/20 text-xs">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg space-y-4">

            <Card>
              <CardTitle>Share Price</CardTitle>
              <p className="text-white/40 text-sm mb-4">
                Current: <span className="text-white font-black" style={{ fontFamily: FONT }}>${settings?.sharePrice ?? 150}</span> per share.
              </p>
              <div className="flex gap-3">
                <Input type="number" value={sharePrice} onChange={(e) => setSharePrice(e.target.value)} placeholder={String(settings?.sharePrice ?? "150")} className="flex-1" />
                <Btn onClick={() => settingsMutation.mutate({ sharePrice: Number(sharePrice) })} disabled={!sharePrice || settingsMutation.isPending}>Update</Btn>
              </div>
            </Card>

            <Card>
              <CardTitle>Minimum Investment</CardTitle>
              <p className="text-white/40 text-sm mb-4">
                Current: <span className="text-white font-black" style={{ fontFamily: FONT }}>${(settings?.minInvestment ?? 2000).toLocaleString()}</span> USD minimum per order.
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                  <Input type="number" value={minInvestmentInput} onChange={(e) => setMinInvestmentInput(e.target.value)} placeholder={String(settings?.minInvestment ?? "2000")} min={1} className="pl-7" />
                </div>
                <Btn onClick={() => settingsMutation.mutate({ minInvestment: Number(minInvestmentInput) })} disabled={!minInvestmentInput || settingsMutation.isPending}>Update</Btn>
              </div>
            </Card>

            <Card>
              <CardTitle>IPO Target Date</CardTitle>
              <p className="text-white/40 text-sm mb-4">
                Current: <span className="text-white font-black" style={{ fontFamily: FONT }}>
                  {settings?.ipoTargetDate ? new Date(settings.ipoTargetDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not set"}
                </span>. Powers the live countdown widget.
              </p>
              <div className="flex gap-3">
                <Input type="date" value={ipoDateInput} onChange={(e) => setIpoDateInput(e.target.value)} className="flex-1" />
                <Btn onClick={() => settingsMutation.mutate({ ipoTargetDate: ipoDateInput || null })} disabled={settingsMutation.isPending}>
                  {ipoDateInput ? "Set Date" : "Clear"}
                </Btn>
              </div>
              <p className="text-white/20 text-xs mt-2">Leave blank and click Clear to remove the countdown.</p>
            </Card>

            <Card>
              <CardTitle>Platform Mode</CardTitle>
              <p className="text-white/40 text-sm mb-4">
                Current: <span className={`font-black ${settings?.systemMode === "post_ipo" ? "text-green-400" : "text-white"}`} style={{ fontFamily: FONT }}>
                  {settings?.systemMode === "post_ipo" ? "POST-IPO" : "PRE-IPO"}
                </span>. POST-IPO unlocks brokerage transfer requests.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => settingsMutation.mutate({ systemMode: "pre_ipo" })}
                  disabled={settingsMutation.isPending}
                  className={`flex-1 py-2.5 text-[0.65rem] font-black tracking-widest uppercase border transition-colors disabled:opacity-40 ${
                    settings?.systemMode !== "post_ipo" ? "bg-white text-black border-white" : "border-white/[0.1] text-white/30 hover:border-white/30"
                  }`}
                  style={{ fontFamily: FONT }}
                >
                  PRE-IPO
                </button>
                <button
                  onClick={() => settingsMutation.mutate({ systemMode: "post_ipo" })}
                  disabled={settingsMutation.isPending}
                  className={`flex-1 py-2.5 text-[0.65rem] font-black tracking-widest uppercase border transition-colors disabled:opacity-40 ${
                    settings?.systemMode === "post_ipo" ? "bg-green-500 text-black border-green-500" : "border-white/[0.1] text-white/30 hover:border-green-500/50"
                  }`}
                  style={{ fontFamily: FONT }}
                >
                  POST-IPO
                </button>
              </div>
            </Card>

            <Card>
              <CardTitle>Bitcoin (BTC) Payment Address</CardTitle>
              <p className="text-white/40 text-sm mb-3">Shown to investors in automated payment instruction emails.</p>
              <div className="mb-3 px-3 py-2 bg-white/[0.04] border border-white/[0.08]">
                <p className="text-white/25 text-[0.55rem] uppercase tracking-widest mb-0.5" style={{ fontFamily: FONT }}>Current Address</p>
                <p className="font-mono text-xs text-white/70 break-all">{settings?.btcAddress ?? "bc1qx2vuy9ndykk7h5u57pun9xd8pknq6jfp4km82t"}</p>
              </div>
              <div className="flex gap-3">
                <Input type="text" value={btcAddressInput} onChange={(e) => setBtcAddressInput(e.target.value)} placeholder="bc1q… or 1… or 3…" className="flex-1 font-mono text-xs" />
                <Btn onClick={() => { settingsMutation.mutate({ btcAddress: btcAddressInput }); setBtcAddressInput(""); }} disabled={!btcAddressInput.trim() || settingsMutation.isPending}>Update</Btn>
              </div>
            </Card>

            <Card>
              <CardTitle>Ethereum (ETH) Payment Address</CardTitle>
              <p className="text-white/40 text-sm mb-3">Your ETH receiving wallet shown to investors who pay via ETH.</p>
              <div className="mb-3 px-3 py-2 bg-white/[0.04] border border-white/[0.08]">
                <p className="text-white/25 text-[0.55rem] uppercase tracking-widest mb-0.5" style={{ fontFamily: FONT }}>Current Address</p>
                <p className="font-mono text-xs text-white/70 break-all">{settings?.ethAddress ?? "0xCBF1857DD3A4C30A6972c2d35e9EED19728cea57"}</p>
              </div>
              <div className="flex gap-3">
                <Input type="text" value={ethAddressInput} onChange={(e) => setEthAddressInput(e.target.value)} placeholder="0x…" className="flex-1 font-mono text-xs" />
                <Btn onClick={() => { settingsMutation.mutate({ ethAddress: ethAddressInput }); setEthAddressInput(""); }} disabled={!ethAddressInput.trim() || settingsMutation.isPending}>Update</Btn>
              </div>
            </Card>

          </motion.div>
        )}

        {/* ── BROADCAST ── */}
        {tab === "broadcast" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <Card>
              <CardTitle>Send Broadcast Email</CardTitle>
              <p className="text-white/40 text-sm mb-6">Sends an email to all registered users on the platform.</p>
              <div className="space-y-4">
                <Field label="Subject">
                  <Input type="text" value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} placeholder="Important update about your SpaceX investment" />
                </Field>
                <Field label="Message">
                  <Textarea value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)} rows={8} placeholder="Write your message here..." />
                </Field>
                <Btn
                  onClick={() => broadcastMutation.mutate()}
                  disabled={!broadcastSubject || !broadcastBody || broadcastMutation.isPending}
                  className="w-full py-3"
                >
                  {broadcastMutation.isPending ? "SENDING..." : "SEND TO ALL USERS ›"}
                </Btn>
              </div>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}
