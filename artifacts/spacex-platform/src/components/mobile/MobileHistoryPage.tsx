/**
 * MobileHistoryPage.tsx — SpaceX Pre-IPO · Mobile History (Purchases + Transfers)
 * Quantum Glass design language — mirrors MobileTransferPage pattern
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, type Purchase, type Transfer } from "@/lib/api";
import { useSettings } from "@/hooks/useUser";
import { D, GlassCard, SubPageShell } from "./MobileApp";
import { format } from "date-fns";
import { vib } from "@/lib/haptics";

type HistorySubTab = "purchases" | "transfers";

// ─── Status helpers for purchases ───────────────────────────────────────────
function purchaseStatusColor(s: string) {
  return s === "confirmed" ? "#4ade80" : s === "rejected" ? "#f87171" : "rgba(255,255,255,0.55)";
}
function purchaseStatusLabel(s: string) {
  return s === "confirmed" ? "Confirmed" : s === "rejected" ? "Rejected" : "Pending";
}

// ─── Status helpers for transfers ────────────────────────────────────────────
function transferStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending_review: "#f59e0b",
    under_review: "#60a5fa",
    awaiting_documents: "#fb923c",
    approved: D.cyan,
    processing: "#a78bfa",
    completed: D.emerald,
    rejected: D.red,
    queued: "#fbbf24",
    transfer_requested: "#60a5fa",
  };
  return map[status] ?? D.muted2;
}

function transferStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_review: "Pending Review",
    under_review: "Under Review",
    awaiting_documents: "Awaiting Documents",
    approved: "Approved",
    processing: "Processing",
    completed: "Completed",
    rejected: "Rejected",
    queued: "Queued",
    transfer_requested: "Requested",
  };
  return map[status] ?? status;
}

// ─── Purchase detail view ─────────────────────────────────────────────────────
function PurchaseDetail({ purchase, onBack }: { purchase: Purchase; onBack: () => void }) {
  const { data: settings } = useSettings();
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: api.getPriceQuote, staleTime: 60_000, retry: 1 });
  const sharePrice = quote?.price ?? settings?.sharePrice ?? 130;

  const statusColor = purchaseStatusColor(purchase.status);
  const statusLbl = purchaseStatusLabel(purchase.status);
  const currentValue = Number(purchase.requestedShares) * sharePrice;
  const gainLoss = currentValue - Number(purchase.amountUsd);
  const gainPct = Number(purchase.amountUsd) > 0 ? (gainLoss / Number(purchase.amountUsd)) * 100 : 0;

  const TIMELINE = [
    { label: "Order Placed", date: format(new Date(purchase.createdAt), "MMMM d, yyyy 'at' HH:mm"), done: true },
    { label: "Under Review", date: "KYC & accreditation check", done: purchase.status !== "pending_review" },
    {
      label: purchase.status === "rejected" ? "Rejected" : "Shares Credited",
      date: purchase.status === "confirmed" ? "Shares added to your portfolio" : purchase.status === "rejected" ? "Contact support to appeal" : "Awaiting confirmation",
      done: purchase.status === "confirmed" || purchase.status === "rejected",
    },
  ];

  return (
    <SubPageShell title="Order Detail" subtitle={`#${purchase.id.slice(-8).toUpperCase()}`} onBack={onBack} accent={statusColor}>
      <div className="flex flex-col gap-4">
        {/* Status Hero */}
        <GlassCard className="p-6 flex flex-col items-center gap-2" glow>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
            style={{ background: `${statusColor}20`, border: `2px solid ${statusColor}40` }}>
            {purchase.status === "confirmed"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : purchase.status === "rejected"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
          </div>
          <span style={{ color: statusColor, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{statusLbl}</span>
          <p style={{ color: D.fgStrong, fontSize: 36, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
            ${Number(purchase.amountUsd).toLocaleString()}
          </p>
          <p style={{ color: D.muted2, fontSize: 13 }}>{Number(purchase.requestedShares).toFixed(4)} SPCX shares</p>
          {!!purchase.discountPercent && (
            <span style={{ color: D.emerald, fontSize: 12, fontWeight: 700, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 6, padding: "3px 8px", marginTop: 2 }}>
              {purchase.discountPercent}% bulk discount — saved ${Number(purchase.discountAmountUsd ?? 0).toLocaleString()}
            </span>
          )}
        </GlassCard>

        {/* Current value — confirmed only */}
        {purchase.status === "confirmed" && (
          <GlassCard className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p style={{ color: D.muted2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Current Value</p>
                <p style={{ color: D.fgStrong, fontSize: 22, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="items-end flex flex-col">
                <p style={{ color: D.muted2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Gain / Loss</p>
                <p style={{ color: gainLoss >= 0 ? D.emerald : D.red, fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  {gainLoss >= 0 ? "+" : ""}${Math.abs(gainLoss).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p style={{ color: gainLoss >= 0 ? D.emerald : D.red, fontSize: 12, fontWeight: 600 }}>
                  ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Order Details */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Order Details</p>
          <GlassCard>
            {[
              { label: "Order ID", value: `#${purchase.id.slice(-8).toUpperCase()}` },
              { label: "Ticker", value: "SPCX" },
              { label: "Price Per Share", value: `${Number(purchase.pricePerShare).toLocaleString()}` },
              { label: "Shares", value: Number(purchase.requestedShares).toFixed(4) },
              ...(purchase.discountPercent ? [{ label: "Bulk Discount", value: `-${purchase.discountPercent}% (-${Number(purchase.discountAmountUsd ?? 0).toLocaleString()})` }] : []),
              { label: "Total Invested", value: `${Number(purchase.amountUsd).toLocaleString()}` },
              { label: "Date", value: format(new Date(purchase.createdAt), "MMM d, yyyy") },
              { label: "Time", value: format(new Date(purchase.createdAt), "HH:mm") + " UTC" },
            ].map((row, idx, arr) => (
              <div key={row.label}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span style={{ color: D.muted2, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: D.fgStrong, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                </div>
                {idx < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Timeline */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Order Timeline</p>
          <GlassCard className="p-4">
            {TIMELINE.map((step, idx) => (
              <div key={step.label} className="flex gap-4" style={{ minHeight: 60 }}>
                <div className="flex flex-col items-center" style={{ width: 24 }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)") : D.border}`,
                    }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={step.done ? (purchase.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)") : D.muted}
                      strokeWidth="2.5">
                      {step.done
                        ? (purchase.status === "rejected" && idx === TIMELINE.length - 1
                          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                          : <polyline points="20 6 9 17 4 12"/>)
                        : <circle cx="12" cy="12" r="8"/>
                      }
                    </svg>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: step.done ? "rgba(255,255,255,0.18)" : D.border, marginTop: 4, minHeight: 20 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 16, flex: 1 }}>
                  <p style={{ color: step.done ? D.fgStrong : D.muted2, fontSize: 14, fontWeight: 600 }}>{step.label}</p>
                  <p style={{ color: D.muted2, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{step.date}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </SubPageShell>
  );
}

// ─── Transfer detail view ─────────────────────────────────────────────────────
function TransferDetail({ transfer, onBack }: { transfer: Transfer; onBack: () => void }) {
  const sc = transferStatusColor(transfer.status);
  const sl = transferStatusLabel(transfer.status);

  const TIMELINE = [
    { label: "Transfer Requested", date: format(new Date(transfer.createdAt), "MMMM d, yyyy 'at' HH:mm"), done: true },
    { label: "Under Review", date: "Compliance & verification check", done: ["under_review", "awaiting_documents", "approved", "processing", "completed", "rejected"].includes(transfer.status) },
    { label: "Approved / Processing", date: "Transfer initiated with destination", done: ["approved", "processing", "completed"].includes(transfer.status) },
    {
      label: transfer.status === "rejected" ? "Rejected" : "Completed",
      date: transfer.status === "completed" ? "Transfer successfully completed" : transfer.status === "rejected" ? "Transfer was not approved. Contact support." : "Awaiting completion",
      done: transfer.status === "completed" || transfer.status === "rejected",
    },
  ];

  const modeBadgeColor = transfer.mode === "internal" ? D.cyan : "#a78bfa";
  const modeLabel = transfer.mode === "internal" ? (transfer.direction === "received" ? "Received / Same-Platform" : "Internal / Same-Platform") : "Brokerage";

  return (
    <SubPageShell title="Transfer Detail" subtitle={transfer.requestId} onBack={onBack} accent={sc}>
      <div className="flex flex-col gap-4">
        {/* Status Hero */}
        <GlassCard className="p-6 flex flex-col items-center gap-2" glow>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
            style={{ background: `${sc}20`, border: `2px solid ${sc}40` }}>
            {transfer.status === "completed"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : transfer.status === "rejected"
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2"><path d="M1 4h11m0 0L8 1m4 3L8 7"/><path d="M23 20H12m0 0l4-3m-4 3l4 3"/></svg>
            }
          </div>
          <span style={{ color: sc, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{sl}</span>
          <div className="px-3 py-1 rounded-full mt-1" style={{ background: `${modeBadgeColor}18`, border: `1px solid ${modeBadgeColor}35` }}>
            <span style={{ color: modeBadgeColor, fontSize: 11, fontWeight: 700 }}>{modeLabel}</span>
          </div>
          {transfer.amountToTransfer != null && (
            <p style={{ color: D.fgStrong, fontSize: 28, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
              {transfer.amountToTransfer.toLocaleString("en-US", { maximumFractionDigits: 4 })} SPCX
            </p>
          )}
        </GlassCard>

        {/* Transfer Details */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Transfer Details</p>
          <GlassCard>
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
            ].map((row, idx, arr) => (
              <div key={row.label}>
                <div className="flex items-start justify-between px-4 py-3.5 gap-3">
                  <span style={{ color: D.muted2, fontSize: 13, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: D.fgStrong, fontSize: 13, fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
                </div>
                {idx < arr.length - 1 && <div style={{ height: 1, background: D.border, marginLeft: 16 }} />}
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Timeline */}
        <div>
          <p style={{ color: D.fgStrong, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Transfer Timeline</p>
          <GlassCard className="p-4">
            {TIMELINE.map((step, idx) => (
              <div key={step.label} className="flex gap-4" style={{ minHeight: 56 }}>
                <div className="flex flex-col items-center" style={{ width: 24 }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.35)") : D.border}`,
                    }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={step.done ? (transfer.status === "rejected" && idx === TIMELINE.length - 1 ? D.red : "rgba(255,255,255,0.85)") : D.muted}
                      strokeWidth="2.5">
                      {step.done
                        ? (transfer.status === "rejected" && idx === TIMELINE.length - 1
                          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                          : <polyline points="20 6 9 17 4 12"/>)
                        : <circle cx="12" cy="12" r="8"/>
                      }
                    </svg>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: step.done ? "rgba(255,255,255,0.18)" : D.border, marginTop: 4, minHeight: 16 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 14, flex: 1 }}>
                  <p style={{ color: step.done ? D.fgStrong : D.muted2, fontSize: 14, fontWeight: 600 }}>{step.label}</p>
                  <p style={{ color: D.muted2, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{step.date}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </SubPageShell>
  );
}

// ─── Main mobile history page ─────────────────────────────────────────────────
export default function MobileHistoryPage() {
  const [, setLocation] = useLocation();
  const [subTab, setSubTab] = useState<HistorySubTab>("purchases");
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

  // Show purchase detail
  if (selectedPurchaseId) {
    const p = (purchases as Purchase[]).find(px => px.id === selectedPurchaseId);
    if (p) {
      return <PurchaseDetail purchase={p} onBack={() => setSelectedPurchaseId(null)} />;
    }
  }

  // Show transfer detail
  if (selectedTransferId) {
    const t = (transfers as Transfer[]).find(tx => tx.id === selectedTransferId);
    if (t) {
      return <TransferDetail transfer={t} onBack={() => setSelectedTransferId(null)} />;
    }
  }

  return (
      <SubPageShell title="History" subtitle="Purchases & Transfers" onBack={() => setLocation("/dashboard")}>
        {/* Sub-tab toggle */}
        <div className="flex rounded-[12px] p-1 gap-1" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}` }}>
          {(["purchases", "transfers"] as const).map(t => (
            <button key={t} onClick={() => { vib(); setSubTab(t); }}
              className="flex-1 py-2.5 rounded-[9px] text-sm font-semibold transition-all capitalize"
              style={{ background: subTab === t ? "rgba(255,255,255,0.12)" : "transparent", color: subTab === t ? D.fgStrong : D.muted2 }}>
              {t === "purchases" ? "Purchases" : "Transfers"}
            </button>
          ))}
        </div>

        {/* ── Purchases tab ── */}
        {subTab === "purchases" && (
          <>
            {/* Summary stats */}
            {(purchases as Purchase[]).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "TOTAL INVESTED", value: `$${(purchases as Purchase[]).reduce((s, p) => s + Number(p.amountUsd), 0).toLocaleString()}`, sub: "USD committed" },
                  { label: "TOTAL SHARES", value: (purchases as Purchase[]).reduce((s, p) => s + Number(p.requestedShares), 0).toLocaleString(undefined, { maximumFractionDigits: 2 }), sub: "equity units" },
                  { label: "ORDER COUNT", value: String((purchases as Purchase[]).length), sub: `${(purchases as Purchase[]).filter(p => p.status === "confirmed").length} confirmed` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-[14px] p-3 flex flex-col gap-1 min-w-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}` }}>
                    <p style={{ color: D.muted2, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
                    <p style={{ color: D.fgStrong, fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                    <p style={{ color: D.muted, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {(purchases as Purchase[]).length === 0 ? (
              <GlassCard className="flex flex-col items-center gap-3 p-8">
                <span style={{ fontSize: 36 }}>📋</span>
                <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>No purchases yet</p>
                <p style={{ color: D.muted2, fontSize: 13, textAlign: "center" }}>Your equity purchases will appear here.</p>
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-2">
                {[...(purchases as Purchase[])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(p => (
                    <button key={p.id} className="w-full text-left" onClick={() => { vib(); setSelectedPurchaseId(p.id); }}>
                      <GlassCard className="p-4" style={{ borderColor: `${purchaseStatusColor(p.status)}20` }}>
                        <div className="flex items-start justify-between mb-3">
                          <p className="flex-1 min-w-0 truncate pr-2" style={{ color: D.fgStrong, fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>${Number(p.amountUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ background: `${purchaseStatusColor(p.status)}18`, color: purchaseStatusColor(p.status), border: `1px solid ${purchaseStatusColor(p.status)}30` }}>
                              {purchaseStatusLabel(p.status)}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {[
                            ["Shares", `${Number(p.requestedShares).toFixed(2)} SPCX`],
                            ["Price/share", `${Number(p.pricePerShare).toLocaleString()}`],
                            ["Date", format(new Date(p.createdAt), "MMM d, yyyy")],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between gap-2">
                              <span className="flex-1 min-w-0 truncate" style={{ color: D.muted2, fontSize: 12 }}>{l}</span>
                              <span className="flex-shrink-0 text-right" style={{ color: D.fg, fontSize: 12, fontWeight: 500 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginTop: 8 }}>Tap to view details →</p>
                      </GlassCard>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        {/* ── Transfers tab ── */}
        {subTab === "transfers" && (
          <>
            {(transfers as Transfer[]).length === 0 ? (
              <GlassCard className="flex flex-col items-center gap-3 p-8">
                <span style={{ fontSize: 36 }}>🔄</span>
                <p style={{ color: D.fg, fontSize: 15, fontWeight: 600 }}>No transfers yet</p>
                <p style={{ color: D.muted2, fontSize: 13, textAlign: "center" }}>Your transfer history will appear here.</p>
              </GlassCard>
            ) : (
              <div className="flex flex-col gap-2">
                {[...(transfers as Transfer[])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(t => (
                    <button key={t.id} className="w-full text-left" onClick={() => { vib(); setSelectedTransferId(t.id); }}>
                      <GlassCard className="p-4" style={{ borderColor: `${transferStatusColor(t.status)}20` }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <p style={{ color: D.fgStrong, fontSize: 14, fontWeight: 700 }} className="truncate">
                              {t.mode === "internal"
                                ? t.direction === "received" ? `← ${t.counterpartyEmail ?? "Unknown"}` : `→ ${t.counterpartyEmail ?? t.recipientEmail}`
                                : t.brokerageName}
                            </p>
                            <p style={{ color: D.muted2, fontSize: 11, marginTop: 2 }}>{t.requestId}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: `${transferStatusColor(t.status)}18`, color: transferStatusColor(t.status), border: `1px solid ${transferStatusColor(t.status)}30` }}>
                              {transferStatusLabel(t.status)}
                            </span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ background: t.mode === "internal" ? `${D.cyan}15` : "rgba(167,139,250,0.15)", color: t.mode === "internal" ? D.cyan : "#a78bfa", border: `1px solid ${t.mode === "internal" ? `${D.cyan}30` : "rgba(167,139,250,0.3)"}` }}>
                            {t.mode === "internal" ? (t.direction === "received" ? "Received" : "Internal") : "Brokerage"}
                          </span>
                          {t.amountToTransfer != null && (
                            <span style={{ color: D.muted2, fontSize: 11 }}>{t.amountToTransfer.toLocaleString("en-US", { maximumFractionDigits: 4 })} SPCX</span>
                          )}
                          <span style={{ color: D.muted, fontSize: 11, marginLeft: "auto" }}>{format(new Date(t.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, marginTop: 8 }}>Tap to view details →</p>
                      </GlassCard>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        <div style={{ height: 24 }} />
      </SubPageShell>
  );
}
