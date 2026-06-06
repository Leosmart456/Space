import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser, useSettings } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { api, type Purchase } from "@/lib/api";
import { motion } from "framer-motion";
import { format } from "date-fns";

const AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000];

function statusBadge(status: string) {
  if (status === "confirmed") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (status === "rejected") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
}

function statusLabel(status: string) {
  if (status === "confirmed") return "Confirmed";
  if (status === "rejected") return "Rejected";
  return "Pending Order";
}

export default function PurchasePage() {
  const { user } = useUser();
  const { data: settings } = useSettings();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [amount, setAmount] = useState<number | "">(10_000);
  const [customAmount, setCustomAmount] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: api.getPurchases,
  });

  const sharePrice = settings?.sharePrice ?? 130;
  const requestedShares = amount ? Math.floor(Number(amount) / sharePrice) : 0;

  const createPurchase = useMutation({
    mutationFn: (body: { requestedShares: number; agreedToTerms: boolean }) => api.createPurchase(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (user?.accreditedStatus !== "yes") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Verification Required</h2>
          <p className="text-muted-foreground mb-6">You must complete accredited investor verification before purchasing shares.</p>
          <button
            onClick={() => navigate("/verify")}
            className="bg-primary text-black font-semibold px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Verify Now
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Please enter a valid investment amount.", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await createPurchase.mutateAsync({ requestedShares, agreedToTerms: true });
      toast({ title: "Purchase request submitted!", description: "Our team will review and process your order." });
      setAmount(10_000);
      setAgreed(false);
    } catch (e) {
      toast({ title: "Submission failed", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <button onClick={() => navigate("/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Purchase Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-8">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">New Purchase</span>
              <h1 className="text-2xl font-bold mt-2 mb-1">Buy SpaceX Shares</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Current price: <span className="text-primary font-semibold">${sharePrice.toLocaleString()} / share</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Preset amounts */}
                {!customAmount && (
                  <div>
                    <label className="block text-sm font-medium mb-3">Investment Amount</label>
                    <div className="grid grid-cols-3 gap-2">
                      {AMOUNTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAmount(a)}
                          className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                            amount === a
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          ${(a / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCustomAmount(true); setAmount(""); }}
                      className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Enter custom amount
                    </button>
                  </div>
                )}

                {customAmount && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        min={5000}
                        step={1000}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-input border border-border rounded-md px-3 py-2.5 pl-7 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="10000"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCustomAmount(false); setAmount(10_000); }}
                      className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Choose preset amount
                    </button>
                  </div>
                )}

                {/* Summary */}
                {amount && Number(amount) >= 5000 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investment Amount</span>
                      <span className="font-semibold">${Number(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Share Price</span>
                      <span>${sharePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Estimated Shares</span>
                      <span className="font-bold text-primary">{requestedShares.toLocaleString()} shares</span>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I understand this is a private placement and agree to the investment terms. I acknowledge that shares will be credited after manual review by the platform team. This is not a guaranteed purchase until confirmed.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !amount || Number(amount) < 5000 || !agreed}
                  className="w-full bg-primary text-black font-bold py-3.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Purchase Request"}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Purchase History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-lg font-semibold mb-6">Purchase History</h2>
              {purchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No purchase requests yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((p: Purchase) => (
                    <div key={p.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">${Number(p.amountUsd).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Shares requested</span>
                          <span>{Number(p.requestedShares).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per share</span>
                          <span>${Number(p.pricePerShare).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Submitted</span>
                          <span>{format(new Date(p.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
