/**
 * history.tsx — SpaceX Pre-IPO · History Page (/history)
 * Shows Purchases + Transfers sub-tabs. Mobile: MobileHistoryPage. Desktop: inline.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { api, type Purchase, type Transfer } from "@/lib/api";
import { useSettings } from "@/hooks/useUser";
import { motion } from "framer-motion";
import { format } from "date-fns";
import MobileHistoryPage from "@/components/mobile/MobileHistoryPage";
import { vib } from "@/lib/haptics";

const FONT = "'Arial Black', Arial, sans-serif";

// ── Status helpers (purchases) ─────────────────────────────────────────────
function purchaseStatusBadge(status: string) {
  if (status === "confirmed") return "bg-white/[0.12] text-white border-white/20";
  if (status === "rejected") return "bg-white/[0.08] text-white/70 border-white/15";
  return "bg-white/[0.08] text-white/70 border-white/15";
}
function purchaseStatusLabel(status: string) {
  if (status === "confirmed") return "Confirmed";
  if (status === "rejected") return "Rejected";
  return "Pending Order";
}

// ── Status helpers (transfers) ─────────────────────────────────────────────
function transferStatusColor(status: string) {
  const map: Record<string, string> = {
    pending_review: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    under_review: "text-blue-400 bg-blue-500/15 border-blue-500/25",
    awaiting_documents: "text-orange-400 bg-orange-500/15 border-orange-500/25",
    approved: "text-cyan-400 bg-cyan-500/15 border-cyan-500/25",
    processing: "text-purple-400 bg-purple-500/15 border-purple-500/25",
    completed: "text-green-400 bg-green-500/15 border-green-500/25",
    rejected: "text-red-400 bg-red-500/15 border-red-500/25",
    queued: "text-yellow-400 bg-yellow-500/15 border-yellow-500/25",
    transfer_requested: "text-blue-400 bg-blue-500/15 border-blue-500/25",
  };
  return map[status] ?? "text-white/40 bg-white/[0.05] border-white/10";
}

function transferStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_review: "Pending Review",
    under_review: "Under Review",
    awaiting_documents: "Awaiting Docs",
    approved: "Approved",
    processing: "Processing",
    completed: "Completed",
    rejected: "Rejected",
    queued: "Queued",
    transfer_requested: "Requested",
  };
  return map[status] ?? status;
}

function transferStatusHex(status: string) {
  const map: Record<string, string> = {
    pending_review: "#f59e0b",
    under_review: "#60a5fa",
    awaiting_documents: "#fb923c",
    approved: "#00e5ff",
    processing: "#a78bfa",
    completed: "#10b981",
    rejected: "#f43f5e",
    queued: "#fbbf24",
    transfer_requested: "#60a5fa",
  };
  return map[status] ?? "rgba(255,255,255,0.4)";
}

// ── Desktop: Purchase Detail ───────────────────────────────────────────────
function DesktopPurchaseDetail({ purchase, onBack, sharePrice }: { purchase: Purchase; onBack: () => void; sharePrice: number }) {
  const sc = purchase.status === "confirmed" ? "#10b981" : purchase.status === "rejected" ? "#ef4444" : "#f59e0b";
  const sl = purchase.status === "confirmed" ? "Confirmed" : purchase.status === "rejected" ? "Rejected" : "Pending Review";
  const currentValue = Number(purchase.requestedShares) * sharePrice;
  const gainLoss = currentValue - Number(purchase.amountUsd);
  const gainPct = Number(purchase.amountUsd) > 0 ? (gainLoss / Number(purchase.amountUsd)) * 100 : 0;

  const TIMELINE = [
    { label: "Order Placed", date: format(new Date(purchase.createdAt), "MMMM d, yyyy 'at' HH:mm 'UTC'"), done: true },
    { label: "Under Review", date: "KYC & accreditation check", done: purchase.status !== "pending_review" },
    {
      label: purchase.status === "rejected" ? "Rejected" : "Shares Credited",
      date: purchase.status === "confirmed" ? "Shares added to your portfolio" : purchase.status === "rejected" ? "Contact support to appeal" : "Awaiting confirmation",
      done: purchase.status === "confirmed" || purchase.status === "rejected",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
      <button onClick={() => { vib(); onBack(); }} className="flex items-center gap-2 text-white/40 hover:text-white text-xs tracking-widest uppercase transition-colors" style={{ fontFamily: FONT }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Orders
      </button>

      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: sc + "20", border: `2px solid ${sc}40` }}>
          {purchase.status === "confirmed"
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            : purchase.status === "rejected"
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          }
        </div>
        <span className="text-sm font-bold tracking-wide" style={{ color: sc }}>{sl}</span>
        <p className="text-white font-black text-4xl tracking-tight" style={{ fontFamily: FONT, fontVariantNumeric: "tabular-nums" }}>${Number(purchase.amountUsd).toLocaleString()}</p>
        <p className="text-white/40 text-sm">{Number(purchase.requestedShares).toFixed(4)} SPCX shares</p>
      </div>

      {purchase.status === "confirmed" && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 flex justify-between items-start">
          <div>
            <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-1" style={{ fontFamily: FONT }}>Current Value</p>
            <p className="text-white font-black text-2xl" style={{ fontFamily: FONT }}>${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-1" style={{ fontFamily: FONT }}>Gain / Loss</p>
            <p className="font-black text-lg" style={{ color: gainLoss >= 0 ? "#10b981" : "#ef4444", fontFamily: FONT }}>
              {gainLoss >= 0 ? "+" : ""}${Math.abs(gainLoss).toLocaleString("en-US", { maximumFractionDigits: 0 })} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
            </p>
          </div>
        </div>
      )}

      <div>
        <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-3" style={{ fontFamily: FONT }}>Order Details</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {[
            { label: "Order ID", value: `#${purchase.id.slice(-8).toUpperCase()}` },
            { label: "Ticker", value: "SPCX" },
            { label: "Price Per Share", value: `$${Number(purchase.pricePerShare).toLocaleString()}` },
            { label: "Shares", value: Number(purchase.requestedShares).toFixed(4) },
            { label: "Total Invested", value: `$${Number(purchase.amountUsd).toLocaleString()}` },
            { label: "Date", value: format(new Date(purchase.createdAt), "MMM d, yyyy") },
            { label: "Time", value: format(new Date(purchase.createdAt), "HH:mm 'UTC'") },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-white/40 text-sm">{row.label}</span>
              <span className="text-white text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-3" style={{ fontFamily: FONT }}>Order Timeline</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-0">
          {TIMELINE.map((step, idx) => (
            <div key={step.label} className="flex gap-4" style={{ minHeight: 60 }}>
              <div className="flex flex-col items-center" style={{ width: 24 }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef444420" : "#10b98120") : "rgba(255,255,255,0.05)", border: `1.5px solid ${step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef444460" : "#10b98160") : "rgba(255,255,255,0.1)"}` }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef4444" : "#10b981") : "rgba(255,255,255,0.2)"} strokeWidth="2.5">
                    {step.done
                      ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>)
                      : <circle cx="12" cy="12" r="8"/>
                    }
                  </svg>
                </div>
                {idx < TIMELINE.length - 1 && <div className="flex-1 mt-1" style={{ width: 2, background: step.done ? "#10b98130" : "rgba(255,255,255,0.06)", minHeight: 20 }} />}
              </div>
              <div style={{ paddingBottom: 16, flex: 1 }}>
                <p className="text-sm font-semibold" style={{ color: step.done ? "#fff" : "rgba(255,255,255,0.3)" }}>{step.label}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{step.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Desktop: Transfer Detail ───────────────────────────────────────────────
function DesktopTransferDetail({ transfer, onBack }: { transfer: Transfer; onBack: () => void }) {
  const sc = transferStatusHex(transfer.status);
  const sl = transferStatusLabel(transfer.status);
  const modeBadgeClass = transfer.mode === "internal" ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/25" : "text-violet-400 bg-violet-500/15 border-violet-500/25";
  const modeLabel = transfer.mode === "internal" ? (transfer.direction === "received" ? "Received / Same-Platform" : "Internal / Same-Platform") : "Brokerage";

  const TIMELINE = [
    { label: "Transfer Requested", date: format(new Date(transfer.createdAt), "MMMM d, yyyy 'at' HH:mm 'UTC'"), done: true },
    { label: "Under Review", date: "Compliance & verification check", done: ["under_review", "awaiting_documents", "approved", "processing", "completed", "rejected"].includes(transfer.status) },
    { label: "Approved / Processing", date: "Transfer initiated with destination", done: ["approved", "processing", "completed"].includes(transfer.status) },
    {
      label: transfer.status === "rejected" ? "Rejected" : "Completed",
      date: transfer.status === "completed" ? "Transfer successfully completed" : transfer.status === "rejected" ? "Transfer was not approved. Contact support." : "Awaiting completion",
      done: transfer.status === "completed" || transfer.status === "rejected",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
      <button onClick={() => { vib(); onBack(); }} className="flex items-center gap-2 text-white/40 hover:text-white text-xs tracking-widest uppercase transition-colors" style={{ fontFamily: FONT }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Transfers
      </button>

      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: sc + "20", border: `2px solid ${sc}40` }}>
          {transfer.status === "completed"
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            : transfer.status === "rejected"
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2"><path d="M1 4h11m0 0L8 1m4 3L8 7"/><path d="M23 20H12m0 0l4-3m-4 3l4 3"/></svg>
          }
        </div>
        <span className="text-sm font-bold tracking-wide" style={{ color: sc }}>{sl}</span>
        <span className={`inline-block text-[0.6rem] px-2.5 py-1 border font-black tracking-wide rounded ${modeBadgeClass}`} style={{ fontFamily: FONT }}>{modeLabel}</span>
        {transfer.amountToTransfer != null && (
          <p className="text-white font-black text-4xl tracking-tight" style={{ fontFamily: FONT }}>{transfer.amountToTransfer.toLocaleString("en-US", { maximumFractionDigits: 4 })} SPCX</p>
        )}
        <p className="text-white/40 text-sm">{transfer.requestId}</p>
      </div>

      <div>
        <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-3" style={{ fontFamily: FONT }}>Transfer Details</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {[
            { label: "Request ID", value: transfer.requestId },
            { label: "Mode", value: modeLabel },
            ...(transfer.mode === "brokerage" ? [
              { label: "Broker", value: transfer.brokerageName || "—" },
              { label: "Account Holder", value: transfer.accountHolderName || "—" },
              { label: "Account Number", value: transfer.brokerageAccountNumber || "—" },
            ] : [
              { label: transfer.direction === "received" ? "Sender Email" : "Recipient Email", value: transfer.counterpartyEmail || transfer.recipientEmail || "—" },
            ]),
            { label: "Asset", value: transfer.asset ?? "SPCX" },
            { label: "Amount", value: transfer.amountToTransfer != null ? `${transfer.amountToTransfer.toLocaleString("en-US", { maximumFractionDigits: 4 })} SPCX` : "All holdings" },
            { label: "Transfer Type", value: transfer.transferSubType === "full" ? "Full Transfer" : transfer.transferSubType === "partial" ? "Partial Transfer" : "—" },
            ...(transfer.notes ? [{ label: "Notes", value: transfer.notes }] : []),
            { label: "Date", value: format(new Date(transfer.createdAt), "MMM d, yyyy") },
          ].map(row => (
            <div key={row.label} className="flex items-start justify-between px-5 py-3.5 gap-4">
              <span className="text-white/40 text-sm">{row.label}</span>
              <span className="text-white text-sm font-semibold text-right" style={{ wordBreak: "break-all" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/30 text-[0.55rem] tracking-widest uppercase mb-3" style={{ fontFamily: FONT }}>Transfer Timeline</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          {TIMELINE.map((step, idx) => (
            <div key={step.label} className="flex gap-4" style={{ minHeight: 56 }}>
              <div className="flex flex-col items-center" style={{ width: 24 }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef444420" : "#10b98120") : "rgba(255,255,255,0.05)", border: `1.5px solid ${step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef444460" : "#10b98160") : "rgba(255,255,255,0.1)"}` }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? "#ef4444" : "#10b981") : "rgba(255,255,255,0.2)"} strokeWidth="2.5">
                    {step.done
                      ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>)
                      : <circle cx="12" cy="12" r="8"/>
                    }
                  </svg>
                </div>
                {idx < TIMELINE.length - 1 && <div className="flex-1 mt-1" style={{ width: 2, background: step.done ? "#10b98130" : "rgba(255,255,255,0.06)", minHeight: 16 }} />}
              </div>
              <div style={{ paddingBottom: 14, flex: 1 }}>
                <p className="text-sm font-semibold" style={{ color: step.done ? "#fff" : "rgba(255,255,255,0.3)" }}>{step.label}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{step.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main HistoryPage ───────────────────────────────────────────────────────
export default function HistoryPage() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const [subTab, setSubTab] = useState<"purchases" | "transfers">("purchases");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  // Read query params to auto-open tab/detail
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const id = params.get("id");
    if (tab === "transfers") {
      setSubTab("transfers");
      if (id) setSelectedTransferId(id);
    } else if (tab === "purchases") {
      setSubTab("purchases");
      if (id) setSelectedPurchaseId(id);
    }
  }, []);

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: api.getPurchases,
    refetchInterval: 30_000,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: api.getTransfers,
    refetchInterval: 30_000,
  });

  const { data: settings } = useSettings();
  const { data: quote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: api.getPriceQuote,
    staleTime: 60_000,
    retry: 1,
  });
  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;

  if (isMobile) {
    return <MobileHistoryPage />;
  }

  // Desktop: show detail if selected
  if (selectedPurchaseId) {
    const p = (purchases as Purchase[]).find(px => px.id === selectedPurchaseId);
    if (p) {
      return (
        <div className="min-h-screen bg-black text-white">
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
            <button onClick={() => { vib(); setSelectedPurchaseId(null); }} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M12 4l-6 6 6 6" /></svg>
              <span className="text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>Back</span>
            </button>
            <p className="text-white/20 text-[0.6rem] tracking-[0.25em] uppercase" style={{ fontFamily: FONT }}>Order Detail</p>
            <div className="w-16" />
          </div>
          <div className="pt-16 pb-16 px-4 max-w-2xl mx-auto">
            <DesktopPurchaseDetail purchase={p} onBack={() => setSelectedPurchaseId(null)} sharePrice={sharePrice} />
          </div>
        </div>
      );
    }
  }

  if (selectedTransferId) {
    const t = (transfers as Transfer[]).find(tx => tx.id === selectedTransferId);
    if (t) {
      return (
        <div className="min-h-screen bg-black text-white">
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
            <button onClick={() => { vib(); setSelectedTransferId(null); }} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M12 4l-6 6 6 6" /></svg>
              <span className="text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>Back</span>
            </button>
            <p className="text-white/20 text-[0.6rem] tracking-[0.25em] uppercase" style={{ fontFamily: FONT }}>Transfer Detail</p>
            <div className="w-16" />
          </div>
          <div className="pt-16 pb-16 px-4 max-w-2xl mx-auto">
            <DesktopTransferDetail transfer={t} onBack={() => setSelectedTransferId(null)} />
          </div>
        </div>
      );
    }
  }

  // Desktop list view
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 border-b border-white/[0.08] bg-black/95 backdrop-blur-xl">
        <button onClick={() => { vib(); navigate("/dashboard"); }} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M12 4l-6 6 6 6" /></svg>
          <span className="text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>Dashboard</span>
        </button>
        <p className="text-white/20 text-[0.6rem] tracking-[0.25em] uppercase" style={{ fontFamily: FONT }}>History</p>
        <div className="w-16" />
      </div>

      <div className="pt-16 pb-16 px-4 max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="mb-2">
          <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-0.5" style={{ fontFamily: FONT }}>Transaction History</p>
          <h1 className="text-white font-black text-xl md:text-3xl tracking-wide" style={{ fontFamily: FONT, letterSpacing: "0.04em" }}>HISTORY</h1>
        </div>

        {/* Sub-tab toggle */}
        <div className="flex gap-2 border-b border-white/[0.08] pb-0">
          {(["purchases", "transfers"] as const).map(t => (
            <button key={t} onClick={() => { vib(); setSubTab(t); }}
              className={`pb-2.5 px-1 text-[0.7rem] font-black tracking-widest uppercase transition-colors border-b-2 -mb-px ${subTab === t ? "text-white border-white" : "text-white/30 border-transparent hover:text-white/60"}`}
              style={{ fontFamily: FONT }}>
              {t === "purchases" ? "Purchases" : "Transfers"}
            </button>
          ))}
        </div>

        {/* ── PURCHASES TAB ── */}
        {subTab === "purchases" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {(purchases as Purchase[]).length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "TOTAL INVESTED", value: `$${(purchases as Purchase[]).reduce((s, p) => s + Number(p.amountUsd), 0).toLocaleString()}`, sub: "USD committed" },
                  { label: "TOTAL SHARES", value: (purchases as Purchase[]).reduce((s, p) => s + Number(p.requestedShares), 0).toLocaleString(undefined, { maximumFractionDigits: 2 }), sub: "equity units" },
                  { label: "ORDER COUNT", value: String((purchases as Purchase[]).length), sub: `${(purchases as Purchase[]).filter(p => p.status === "confirmed").length} confirmed` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-3 md:p-4">
                    <p className="text-white/20 text-[0.5rem] tracking-widest uppercase mb-1" style={{ fontFamily: FONT }}>{label}</p>
                    <p className="text-white font-black text-lg md:text-xl" style={{ fontFamily: FONT }}>{value}</p>
                    <p className="text-white/25 text-[0.55rem] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {(purchases as Purchase[]).length === 0 ? (
                <div className="px-5 py-20 text-center">
                  <p className="text-white/30 text-sm mb-1">No purchases yet.</p>
                  <button onClick={() => navigate("/dashboard")} className="mt-4 text-xs text-white/40 hover:text-white tracking-widest uppercase underline transition-colors" style={{ fontFamily: FONT }}>
                    Go to Dashboard ›
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-white/[0.06] hidden sm:grid gap-3" style={{ gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr 1fr 1fr" }}>
                    {["DATE & TIME", "SHARES", "PRICE/SH", "TOTAL", "STATUS", ""].map(h => (
                      <span key={h} className="text-white/20 text-[0.52rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[...(purchases as Purchase[])]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((p, idx) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                          className="px-5 py-4 flex flex-col sm:grid sm:items-center gap-2 hover:bg-white/[0.04] transition-colors cursor-pointer"
                          style={{ gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr 1fr 1fr" }}
                          onClick={() => { vib(); setSelectedPurchaseId(p.id); }}>
                          <div>
                            <p className="text-white text-xs font-semibold">{format(new Date(p.createdAt), "MMM d, yyyy")}</p>
                            <p className="text-white/25 text-[0.58rem] mt-0.5">{format(new Date(p.createdAt), "HH:mm 'UTC'")}</p>
                          </div>
                          <div>
                            <p className="text-white font-black text-sm" style={{ fontFamily: FONT }}>{Number(p.requestedShares).toLocaleString()}</p>
                            <p className="text-white/25 text-[0.58rem]">shares</p>
                          </div>
                          <div><p className="text-white/70 text-sm">${Number(p.pricePerShare).toLocaleString()}</p></div>
                          <div>
                            <p className="text-white font-semibold text-sm">${Number(p.amountUsd).toLocaleString()}</p>
                            <p className="text-white/25 text-[0.58rem]">USD</p>
                          </div>
                          <div>
                            <span className={`inline-block text-[0.6rem] px-2.5 py-1 border font-black tracking-wide ${purchaseStatusBadge(p.status)}`} style={{ fontFamily: FONT }}>
                              {purchaseStatusLabel(p.status)}
                            </span>
                          </div>
                          <div className="hidden sm:flex items-center justify-end">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-white/25"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TRANSFERS TAB ── */}
        {subTab === "transfers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {(transfers as Transfer[]).length === 0 ? (
                <div className="px-5 py-20 text-center">
                  <p className="text-white/30 text-sm mb-1">No transfers yet.</p>
                  <button onClick={() => navigate("/transfer")} className="mt-4 text-xs text-white/40 hover:text-white tracking-widest uppercase underline transition-colors" style={{ fontFamily: FONT }}>
                    Initiate a Transfer ›
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-white/[0.06] hidden sm:grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr" }}>
                    {["DATE", "DESTINATION", "MODE", "AMOUNT", "STATUS"].map(h => (
                      <span key={h} className="text-white/20 text-[0.52rem] tracking-widest uppercase" style={{ fontFamily: FONT }}>{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[...(transfers as Transfer[])]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((t, idx) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                          className="px-5 py-4 flex flex-col sm:grid sm:items-center gap-2 hover:bg-white/[0.04] transition-colors cursor-pointer"
                          style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr" }}
                          onClick={() => { vib(); setSelectedTransferId(t.id); }}>
                          <div>
                            <p className="text-white text-xs font-semibold">{format(new Date(t.createdAt), "MMM d, yyyy")}</p>
                            <p className="text-white/25 text-[0.58rem] mt-0.5">{t.requestId}</p>
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold truncate">
                              {t.mode === "internal"
                                ? t.direction === "received"
                                  ? `← ${t.counterpartyEmail ?? "Unknown"}`
                                  : `→ ${t.counterpartyEmail ?? t.recipientEmail}`
                                : t.brokerageName}
                            </p>
                          </div>
                          <div>
                            <span className={`inline-block text-[0.55rem] px-2 py-0.5 border font-black tracking-wide rounded ${t.mode === "internal" ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/25" : "text-violet-400 bg-violet-500/15 border-violet-500/25"}`} style={{ fontFamily: FONT }}>
                              {t.mode === "internal" ? (t.direction === "received" ? "Received" : "Internal") : "Brokerage"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white/70 text-xs">
                              {t.amountToTransfer != null ? `${t.amountToTransfer.toLocaleString("en-US", { maximumFractionDigits: 2 })} SPCX` : "All holdings"}
                            </p>
                          </div>
                          <div>
                            <span className={`inline-block text-[0.6rem] px-2.5 py-1 border font-black tracking-wide ${transferStatusColor(t.status)}`} style={{ fontFamily: FONT }}>
                              {transferStatusLabel(t.status)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
