import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useSettings } from "@/hooks/useUser";
import { api, type Purchase, type PriceAlert, type OHLCPoint } from "@/lib/api";
import { motion } from "framer-motion";
import { format } from "date-fns";
import appLogo from "@/assets/logo.png";
import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, CartesianGrid, ReferenceLine, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Bell, PlusCircle, Briefcase, FileText, Clock, CheckCircle2, Users, Check, X, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileApp } from "@/components/mobile/MobileApp";
import { vib } from "@/lib/haptics";
import { RocketLaunchIcon } from "@/components/RocketLaunchIcon";

const STATIC_MARKET_STATS = [
  { label: "52-Week High", value: "$142.50" },
  { label: "52-Week Low", value: "$98.20" },
  { label: "Float", value: "Private" },
];

function fmtVal(v: number | undefined): string {
  if (v == null || v === 0) return "—";
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  return `${v.toLocaleString()}`;
}

const NEWS_ITEMS = [
  { id: "n1", headline: "Starship completes 7th integrated flight test", time: "2h ago", tag: "Mission" },
  { id: "n2", headline: "SpaceX wins $5.9B NASA lunar lander contract", time: "1d ago", tag: "Contract" },
  { id: "n3", headline: "Starlink surpasses 4 million subscribers globally", time: "3d ago", tag: "Starlink" },
];

function IpoCountdown({ ipoTargetDate }: { ipoTargetDate: string }) {
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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md p-4 md:p-5">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <p className="text-white/30 text-[0.58rem] tracking-[0.25em] uppercase mb-3" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        IPO COUNTDOWN
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "DAYS", value: time.days },
          { label: "HRS", value: time.hours },
          { label: "MIN", value: time.minutes },
          { label: "SEC", value: time.seconds },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-white font-black text-2xl md:text-3xl leading-none tabular-nums" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-white/30 text-[0.5rem] tracking-widest uppercase mt-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <p className="text-white/20 text-[0.58rem] text-center mt-2.5 tracking-wide">
        Expected IPO: {new Date(ipoTargetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </div>
  );
}

type Section = "overview" | "shares" | "purchase" | "apps";

// ── OHLCV price data generation (local fallback) ───────────────────────
function generateOHLCData(): OHLCPoint[] {
  const points: OHLCPoint[] = [];
  let prevClose = 108;
  const start = new Date("2025-06-02");
  const end = new Date("2026-06-05");
  let seed = 7919; let vSeed = 31337;
  function rng() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  function vrng() { vSeed = (vSeed * 22695477 + 1) >>> 0; return vSeed / 4294967296; }
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      const ret = 0.00028 + 0.009 * (rng() * 2 - 1);
      const close = Math.max(98, Math.min(162, prevClose * (1 + ret)));
      const open = prevClose;
      const high = Math.max(open, close) * (1 + 0.006 * rng());
      const low  = Math.min(open, close) * (1 - 0.006 * rng());
      const volume = Math.round(500_000 + vrng() * 4_500_000);
      const label = cur.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      points.push({ date: cur.toISOString().slice(0, 10), label,
        open: parseFloat(open.toFixed(2)), high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)), close: parseFloat(close.toFixed(2)), volume });
      prevClose = close;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return points;
}
const ALL_OHLC_DATA = generateOHLCData();

// ── TradingView-style Live Stock Chart ────────────────────────────────
type ChartPeriod = "1M" | "3M" | "6M" | "1Y";
const PERIOD_DAYS: Record<ChartPeriod, number> = { "1M": 22, "3M": 66, "6M": 132, "1Y": 260 };

function LiveStockChart({ sharePrice }: { sharePrice: number }) {
  const [period, setPeriod] = useState<ChartPeriod>("3M");
  const [livePrice, setLivePrice] = useState(sharePrice);
  const [flashDir, setFlashDir] = useState<"up" | "down" | null>(null);
  const lastRef = useRef(sharePrice);

  const { data: historyData } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: api.getPriceHistory,
    staleTime: 4 * 60 * 60 * 1000,
    retry: 1,
  });

  const { data: quoteData } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: api.getPriceQuote,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const sourceData: OHLCPoint[] = historyData?.points?.length ? historyData.points : ALL_OHLC_DATA;

  useEffect(() => {
    const base = quoteData?.price ?? sharePrice;
    lastRef.current = base;
    setLivePrice(base);
  }, [sharePrice, quoteData?.price]);

  useEffect(() => {
    const base = quoteData?.price ?? sharePrice;
    const id = setInterval(() => {
      const delta = (Math.random() - 0.47) * 1.2;
      const next = parseFloat((lastRef.current + delta).toFixed(2));
      const clamped = Math.max(base - 8, Math.min(base + 8, next));
      setFlashDir(clamped >= lastRef.current ? "up" : "down");
      lastRef.current = clamped;
      setLivePrice(clamped);
      setTimeout(() => setFlashDir(null), 600);
    }, 2000);
    return () => clearInterval(id);
  }, [sharePrice, quoteData?.price]);

  const sliced = sourceData.slice(-PERIOD_DAYS[period]);
  const chartData = sliced.map((d, i) => i === sliced.length - 1 ? { ...d, close: livePrice } : d);
  const periodStart = chartData[0]?.close ?? sharePrice;
  const pctChange = ((livePrice - periodStart) / periodStart) * 100;
  const isUp = pctChange >= 0;
  const priceColor = isUp ? "#22c55e" : "#ef4444";
  const labelEvery = period === "1M" ? 3 : period === "3M" ? 9 : period === "6M" ? 18 : 38;
  const maxVol = Math.max(...chartData.map((d) => d.volume));
  const lastD = chartData[chartData.length - 1];

  const TVTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: OHLCPoint & { close: number } }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: "#000000", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", minWidth: 155, fontFamily: "'Arial Black', Arial, sans-serif" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: "0.14em", marginBottom: 6 }}>{d.label}</p>
        {([
          { k: "O", v: `$${d.open.toFixed(2)}`, c: "rgba(255,255,255,0.65)" },
          { k: "H", v: `$${d.high.toFixed(2)}`, c: "#22c55e" },
          { k: "L", v: `$${d.low.toFixed(2)}`, c: "#ef4444" },
          { k: "C", v: `$${d.close.toFixed(2)}`, c: priceColor },
          { k: "Vol", v: `${(d.volume / 1_000_000).toFixed(2)}M`, c: "rgba(255,255,255,0.35)" },
        ] as { k: string; v: string; c: string }[]).map(({ k, v, c }) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 2 }}>
            <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 8 }}>{k}</span>
            <span style={{ color: c, fontWeight: 700, fontSize: 11 }}>{v}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#000000] shadow-[0_8px_48px_rgba(0,0,0,0.9)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/25 text-[0.52rem] tracking-[0.2em] uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>SPCX · NASDAQ</span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <span className="text-green-400 text-[0.46rem] font-black tracking-widest" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>LIVE</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span
                className={`font-black leading-none transition-colors duration-300 ${flashDir === "up" ? "text-green-400" : flashDir === "down" ? "text-red-400" : "text-white"}`}
                style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: "1.9rem" }}
              >
                ${livePrice.toFixed(2)}
              </span>
              <span className={`text-sm font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}%
              </span>
              <span className={`text-xs font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                ({isUp ? "+" : ""}{(livePrice - periodStart).toFixed(2)})
              </span>
            </div>
            {lastD && (
              <div className="flex gap-3 mt-2 flex-wrap">
                {[
                  { k: "O", v: lastD.open.toFixed(2), c: "text-white/50" },
                  { k: "H", v: lastD.high.toFixed(2), c: "text-green-400" },
                  { k: "L", v: lastD.low.toFixed(2), c: "text-red-400" },
                  { k: "C", v: livePrice.toFixed(2), c: isUp ? "text-green-400" : "text-red-400" },
                ].map(({ k, v, c }) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className="text-white/20 text-[0.52rem]" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{k}</span>
                    <span className={`text-[0.68rem] font-bold tabular-nums ${c}`}>${v}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-0.5 bg-white/[0.04] p-0.5 rounded-sm mt-1">
            {(["1M", "3M", "6M", "1Y"] as ChartPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-[0.52rem] font-black tracking-wider transition-all rounded-sm ${period === p ? "bg-white/15 text-white" : "text-white/25 hover:text-white/55"}`}
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price area chart */}
      <div style={{ height: 175 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 6, right: 46, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={priceColor} stopOpacity={0.28} />
                <stop offset="55%" stopColor={priceColor} stopOpacity={0.06} />
                <stop offset="100%" stopColor={priceColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.035)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.16)", fontSize: 8, fontFamily: "'Arial Black', Arial, sans-serif" }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickLine={false}
              interval={labelEvery - 1}
            />
            <YAxis
              orientation="right"
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
              axisLine={false}
              tickLine={{ stroke: "rgba(255,255,255,0.04)" }}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={46}
              tickCount={5}
            />
            <Tooltip content={<TVTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <ReferenceLine
              y={livePrice}
              stroke={priceColor}
              strokeDasharray="4 4"
              strokeWidth={1}
              strokeOpacity={0.55}
              label={{ value: `$${livePrice.toFixed(2)}`, position: "right", fill: priceColor, fontSize: 9, fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 700 }}
            />
            <Area
              type="monotoneX"
              dataKey="close"
              stroke={priceColor}
              strokeWidth={1.8}
              fill="url(#tvAreaGrad)"
              dot={false}
              activeDot={{ r: 3, fill: priceColor, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume bars */}
      <div style={{ height: 36 }} className="border-t border-white/[0.04]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 52, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" hide />
            <YAxis orientation="right" hide domain={[0, maxVol * 3]} />
            <Bar dataKey="volume" fill={priceColor} opacity={0.22} radius={[1, 1, 0, 0]} isAnimationActive={false} maxBarSize={5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-white/[0.08] text-[0.46rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>SPACEX (SPCX) · NASDAQ</span>
        <span className="text-white/[0.08] text-[0.46rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>SIMULATED · NOT EXCHANGE LISTED</span>
      </div>
    </div>
  );
}

function SpaceXLogo({ className = "" }: { className?: string }) {
  return <img src={appLogo} alt="SpaceX" className={className} />;
}

function statusBadge(status: string) {
  if (status === "confirmed") return "bg-white/[0.12] text-white border-white/20";
  if (status === "rejected") return "bg-white/[0.08] text-white/70 border-white/15";
  return "bg-white/[0.08] text-white/70 border-white/15";
}

function statusLabel(status: string) {
  if (status === "confirmed") return "Confirmed";
  if (status === "rejected") return "Rejected";
  return "Pending Order";
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
}

function HeroSparkline({ positive }: { positive: boolean }) {
  const { data: historyData } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: api.getPriceHistory,
    staleTime: 4 * 60 * 60 * 1000,
    retry: 1,
  });
  const color = positive ? "#22c55e" : "#ef4444";
  const points = historyData?.points?.slice(-30) ?? ALL_OHLC_DATA.slice(-30);
  const data = points.map((p: any) => ({ v: p.close }));

  return (
    <div style={{ height: 80 }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#heroSparkGrad)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
  badge,
  icon,
  verifyTag,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  icon: React.ReactNode;
  verifyTag?: boolean;
}) {
  return (
    <button
      onClick={() => { vib(); onClick(); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tracking-wide transition-all text-left ${
        active
          ? "bg-white text-black"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
      style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.06em", fontSize: "0.75rem" }}
    >
      <span className="w-4 shrink-0 flex items-center justify-center">{icon}</span>
      <span className="flex-1 uppercase">{label}</span>
      {verifyTag && (
        <span className="bg-yellow-400 text-black text-[0.55rem] px-1.5 py-0.5 font-black tracking-wider leading-tight">
          VERIFY
        </span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="bg-yellow-400 text-black text-xs px-1.5 py-0.5 font-black min-w-[1.2rem] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-2 md:mb-8">
      <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-0.5" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {sub}
      </p>
      <h1 className="text-white font-black text-xl md:text-3xl tracking-wide"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.04em" }}>
        {label}
      </h1>
    </div>
  );
}

function StatCard({ label, value, sub, accent, gainColor }: {
  label: string; value: string; sub?: string; accent?: boolean; gainColor?: string;
}) {
  return (
    <div className={`relative p-5 overflow-hidden rounded-2xl backdrop-blur-md border shadow-[0_2px_16px_rgba(0,0,0,0.4)] ${
      accent
        ? "border-white/[0.18] bg-gradient-to-br from-white/[0.1] to-white/[0.04]"
        : "border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02]"
    }`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <p className="text-white/40 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: "0.65rem" }}>
        {label}
      </p>
      <p className={`text-2xl font-black ${accent ? "text-white" : gainColor || "text-white"}`}
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-xs mt-1.5 tracking-wide">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, navigate] = useLocation();
  const { user, isLoading: userLoading, updateProfile } = useUser();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Desktop-only queries — disabled on mobile to avoid double data fetching
  // (MobileApp issues its own queries independently)
  const { data: summary } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboardSummary,
    enabled: !!isSignedIn && !isMobile,
    refetchInterval: 15_000,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: api.getPurchases,
    enabled: !!isSignedIn && !isMobile,
    refetchInterval: 15_000,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers"],
    queryFn: api.getTransfers,
    enabled: !!isSignedIn && !isMobile,
    refetchInterval: 15_000,
  });

  const { data: priceAlerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.getAlerts,
    enabled: !!isSignedIn && !isMobile,
    refetchInterval: 15_000,
  });

  const { data: liveQuote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: api.getPriceQuote,
    enabled: !!isSignedIn && !isMobile,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const { data: newsData } = useQuery({
    queryKey: ["spaceflightNews"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles/?limit=6&search=spacex&ordering=-published_at"
      );
      return res.json();
    },
    staleTime: 15 * 60 * 1000,
    retry: 1,
    enabled: !isMobile,
  });

  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState(true);
  const [alertCreating, setAlertCreating] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/");
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (!userLoading && user?.accreditedStatus === "pending") navigate("/onboarding");
  }, [user, userLoading, navigate]);

  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <SpaceXLogo className="h-6 w-auto text-white/20 animate-pulse" />
      </div>
    );
  }

  if (user?.isEnabled === false) {
    navigate("/");
    return null;
  }

  if (user?.accreditedStatus === "pending") {
    return null;
  }

  // On mobile viewports render the native-style iOS-matching mobile app
  if (isMobile) {
    return <MobileApp />;
  }

  const isPostIpo = summary?.systemMode === "post_ipo";
  const sharePrice = liveQuote?.price ?? summary?.sharePrice ?? settings?.sharePrice ?? 130;
  const minInvestment = settings?.minInvestment ?? 2000;
  const minShares = Math.ceil(minInvestment / sharePrice);
  const totalShares = summary?.totalShares ?? user?.totalSharesCredited ?? 0;
  const totalUsdValue = summary?.totalUsdValue ?? 0;

  const avgBuyPrice =
    (purchases as Purchase[]).length > 0
      ? (purchases as Purchase[]).reduce((sum, p) => sum + Number(p.pricePerShare), 0) / (purchases as Purchase[]).length
      : 0;
  const paperGainLoss = avgBuyPrice > 0 ? (sharePrice - avgBuyPrice) * totalShares : 0;
  const paperGainPct = avgBuyPrice > 0 ? ((sharePrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

  const navItems: { id: Section | "transfer_nav" | "transactions"; label: string; icon: React.ReactNode; badge?: number; onClick?: () => void; verifyTag?: boolean }[] = [
    {
      id: "overview", label: "Overview",
      icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="1" y="1" width="6" height="6" /><rect x="9" y="1" width="6" height="6" /><rect x="1" y="9" width="6" height="6" /><rect x="9" y="9" width="6" height="6" /></svg>
    },
    {
      id: "shares", label: "My Portfolio",
      badge: summary?.pendingPurchases,
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><polyline points="1,11 5,6 9,9 15,2" /><polyline points="11,2 15,2 15,6" /></svg>
    },
    {
      id: "purchase", label: "Buy Shares",
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><circle cx="8" cy="8" r="7" /><line x1="8" y1="4" x2="8" y2="12" /><line x1="4" y1="8" x2="12" y2="8" /></svg>
    },
    {
      id: "transfer_nav" as const, label: "Transfer",
      onClick: () => navigate("/transfer"),
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M1 4h11m0 0L8 1m4 3L8 7" /><path d="M15 12H4m0 0l4-3m-4 3l4 3" /></svg>
    },
    {
      id: "transactions" as const, label: "Transactions",
      onClick: () => navigate("/history"),
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="1" y="2" width="14" height="12" rx="1.2"/><line x1="4" y1="6" x2="12" y2="6"/><line x1="4" y1="9.5" x2="8.5" y2="9.5"/></svg>
    },
    {
      id: "apps", label: "Apps",
      icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="1" y="7" width="5" height="3" rx="0.5"/><line x1="3.5" y1="4" x2="3.5" y2="7"/><circle cx="2" cy="10" r="0.5" fill="currentColor" stroke="none"/><circle cx="5" cy="10" r="0.5" fill="currentColor" stroke="none"/><rect x="10" y="2" width="4" height="12" rx="0.5"/><line x1="12" y1="12" x2="12" y2="12" strokeLinecap="round" strokeWidth="2"/></svg>
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <SpaceXLogo className="h-14 w-auto text-white" />
        <p className="text-white/25 text-[0.6rem] tracking-[0.2em] uppercase mt-2"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          INVESTOR PORTAL
        </p>
        {isPostIpo && (
          <span className="inline-block mt-2 text-[0.6rem] bg-green-400 text-black font-black px-2 py-0.5 tracking-widest"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            POST-IPO
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={item.id !== "transfer_nav" && item.id !== "transactions" && section === (item.id as Section)}
            onClick={item.onClick ?? (() => setSection(item.id as Section))}
            badge={item.badge}
            verifyTag={item.verifyTag}
          />
        ))}
      </nav>

      <div
        className="px-4 py-4 border-t border-white/10 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => navigate("/profile")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/profile")}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/[0.15] shrink-0">
            <img src="/profile-avatar.avif" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-white/30 truncate">{user?.email}</p>
          </div>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-white/20 shrink-0">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-black text-white flex">
      {/* Desktop sidebar — collapsible */}
      <aside className={`hidden md:flex flex-col border-r border-white/[0.08] bg-black/90 backdrop-blur-xl shrink-0 transition-all duration-200 ${sidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-56"}`}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-black">
        {/* Desktop top bar with hamburger */}
        <div className="hidden md:flex items-center h-12 px-4 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl shrink-0">
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] hover:bg-white/[0.06] transition-colors"
          >
            <span className="block w-4 h-[1.5px] bg-white/50" />
            <span className="block w-4 h-[1.5px] bg-white/50" />
            <span className="block w-4 h-[1.5px] bg-white/50" />
          </button>
        </div>

        {/* Mobile top bar — fixed glass header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-16 border-b border-white/[0.08] bg-black/90 backdrop-blur-xl">
          <SpaceXLogo className="h-12 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => { vib(); navigate("/profile"); }}
              className="w-9 h-9 rounded-full overflow-hidden border border-white/[0.15] hover:opacity-80 transition-opacity"
            >
              <img src="/profile-avatar.avif" alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <main
          className={`flex-1 px-4 md:px-10 pt-20 pb-24 md:pt-6 md:pb-8 max-w-5xl w-full mx-auto ${section === "overview" ? "overflow-hidden" : "overflow-y-auto"}`}
          style={{ overscrollBehavior: "none" }}
        >

          {/* ── OVERVIEW (mirrors native mobile app home tab) ── */}
          {section === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-[18px] md:space-y-8 pb-2">

              {/* Greeting row — matches mobile "Good evening, Name" + mode badge + bell */}
              <div className="flex items-center justify-between md:hidden">
                <div>
                  <p className="text-white/[0.55] text-[13px]">{greeting()}</p>
                  <h2 className="text-white font-bold text-[22px] leading-tight tracking-tight">
                    {user?.fullName?.split(" ")[0] || "Investor"}
                  </h2>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/20 bg-white/[0.08]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    <span className="text-[11px] font-bold tracking-wide text-white/80">
                      {isPostIpo ? "POST-IPO" : "PRE-IPO"}
                    </span>
                  </div>
                  <button onClick={() => { vib(); navigate("/history"); }}>
                    <Bell className="w-[22px] h-[22px] text-white/[0.55]" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* Portfolio hero card — matches native mobile GlassCard style */}
              <div className="rounded-[22px] overflow-hidden" style={{ background: "#000000", border: "1px solid rgba(0,229,255,0.15)", boxShadow: "0 8px 40px rgba(0,229,255,0.06)" }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/[0.55] text-[10px] font-semibold tracking-widest uppercase">Portfolio Value</span>
                    <span className="text-white text-[13px] font-black tracking-wider">SPCX</span>
                  </div>
                  <p className="text-white font-black text-[46px] leading-none tracking-tight" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
                    ${totalUsdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {paperGainLoss >= 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    <span className={`text-sm font-bold ${paperGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {paperGainLoss >= 0 ? "+" : ""}${Math.abs(paperGainLoss).toLocaleString("en-US", { maximumFractionDigits: 0 })} ({paperGainPct >= 0 ? "+" : ""}{paperGainPct.toFixed(2)}%)
                    </span>
                    <span className="text-white/[0.55] text-xs">all time</span>
                  </div>

                  {/* Mini sparkline — red/green area chart under the value */}
                  <HeroSparkline positive={paperGainLoss >= 0} />

                  <div className="h-px my-3.5" style={{ background: "rgba(255,255,255,0.07)" }} />

                  <div className="flex">
                    {[
                      { label: "Share Price", value: `${sharePrice.toLocaleString()}` },
                      { label: "Your Shares", value: totalShares.toFixed(2) },
                      { label: "Invested", value: `${(avgBuyPrice > 0 ? avgBuyPrice * totalShares : 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
                    ].map((s, i, arr) => (
                      <div key={s.label} className="flex-1 flex flex-col items-center gap-1"
                        style={{ borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                        <p className="text-white/[0.55] text-[10px] font-medium tracking-wider uppercase">{s.label}</p>
                        <p className="text-white text-[15px] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transaction history link */}
                  <div className="h-px mt-3.5 mb-2.5" style={{ background: "rgba(255,255,255,0.07)" }} />
                  <div className="flex justify-center">
                    <button onClick={() => { vib(); navigate("/history"); }}
                      className="text-white/50 text-[11px] font-semibold tracking-widest uppercase underline underline-offset-2 hover:text-white transition-colors">
                      Transactions
                    </button>
                  </div>
                </div>
              </div>

              {/* IPO Countdown — pre-IPO only */}
              {!isPostIpo && settings?.ipoTargetDate && (
                <IpoCountdown ipoTargetDate={settings.ipoTargetDate} />
              )}

              {/* Quick action buttons — matches mobile row of 3 */}
              <div className="flex gap-2.5">
                <button onClick={() => setSection("purchase")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white hover:bg-white/90 transition-colors">
                  <PlusCircle className="w-[18px] h-[18px] text-black" strokeWidth={2} />
                  <span className="text-black text-[13px] font-semibold">Buy Shares</span>
                </button>
                <button onClick={() => { vib(); navigate("/history"); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-black border border-white/[0.1] hover:bg-white/[0.06] transition-colors">
                  <FileText className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                  <span className="text-white text-[13px] font-semibold">Transactions</span>
                </button>
                <button onClick={() => { vib(); navigate("/transfer"); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-black border border-white/[0.1] hover:bg-white/[0.06] transition-colors">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] text-white"><path d="M1 4h11m0 0L8 1m4 3L8 7" /><path d="M15 12H4m0 0l4-3m-4 3l4 3" /></svg>
                  <span className="text-white text-[13px] font-semibold">Transfer</span>
                </button>
              </div>

              {/* Order stats row — matches mobile 3-glass-card row */}
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <Clock className="w-5 h-5 text-white/60 mb-1.5" strokeWidth={1.8} />
                  <p className="text-white text-xl font-bold leading-none">
                    {(purchases as Purchase[]).filter(p => p.status === "pending_review").length}
                  </p>
                  <p className="text-white/[0.55] text-[11px] mt-1">Pending Orders</p>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <CheckCircle2 className="w-5 h-5 text-white/60 mb-1.5" strokeWidth={1.8} />
                  <p className="text-white text-xl font-bold leading-none">
                    {(purchases as Purchase[]).filter(p => p.status === "confirmed").length}
                  </p>
                  <p className="text-white/[0.55] text-[11px] mt-1">Confirmed Orders</p>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <Users className="w-5 h-5 text-white/60 mb-1.5" strokeWidth={1.8} />
                  <p className="text-white text-xl font-bold leading-none">84.4k</p>
                  <p className="text-white/[0.55] text-[11px] mt-1">Investors</p>
                </div>
              </div>

              {/* Recent Activity — matches mobile list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-base font-bold">Recent Activity</h3>
                  {(purchases as Purchase[]).length > 0 && (
                    <button onClick={() => { vib(); navigate("/history"); }} className="text-white/50 text-[13px] font-medium">See all</button>
                  )}
                </div>
                {(purchases as Purchase[]).length === 0 ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col items-center text-center gap-1.5">
                    <RocketLaunchIcon className="w-11 h-11 mb-1" />
                    <p className="text-white font-semibold text-sm">No purchases yet</p>
                    <p className="text-white/[0.55] text-xs">Tap Buy Shares above to reserve your first SPCX allocation.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    {(purchases as Purchase[]).slice(0, 4).map((p, idx, arr) => {
                      const statusColor = p.status === "confirmed" ? "#22c55e" : p.status === "rejected" ? "#ef4444" : "#f59e0b";
                      const statusText = p.status === "confirmed" ? "Confirmed" : p.status === "rejected" ? "Rejected" : "Pending";
                      return (
                        <button key={p.id} onClick={() => { vib(); navigate("/history"); }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left ${idx < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-semibold">SPCX Purchase</p>
                            <p className="text-white/[0.4] text-[11px] mt-0.5">
                              {Number(p.requestedShares).toFixed(2)} shares @ ${Number(p.pricePerShare).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <p className="text-white text-sm font-semibold">${Number(p.amountUsd).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                              <p className="text-[11px] font-semibold mt-0.5" style={{ color: statusColor }}>{statusText}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-white/[0.4] shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Market Data — matches mobile market stats card */}
              <div className="space-y-2.5">
                <h3 className="text-white text-base font-bold">Market Data</h3>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  {[STATIC_MARKET_STATS[0], STATIC_MARKET_STATS[1], { label: "Market Cap", value: fmtVal(quoteData?.valuation) }, STATIC_MARKET_STATS[2]].map((stat, idx, arr) => (
                    <div key={stat.label} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                      <span className="text-white/[0.55] text-sm">{stat.label}</span>
                      <span className="text-white text-sm font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SpaceX News — live from Spaceflight News API */}
              <div className="space-y-2.5">
                <h3 className="text-white text-base font-bold">SpaceX News</h3>
                {(newsData?.results?.length > 0
                  ? (newsData.results as any[]).slice(0, 6)
                  : NEWS_ITEMS.map((n) => ({ id: n.id, title: n.headline, publishedAt: null, newsSite: n.tag, summary: "", url: null, _fallbackTime: n.time }))
                ).map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors"
                    onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                    style={{ cursor: item.url ? "pointer" : "default" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.10] text-white/70 text-[11px] font-semibold">
                        {item.newsSite ?? item.tag}
                      </span>
                      <span className="text-white/[0.55] text-xs">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : item._fallbackTime ?? item.time}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium leading-snug">{item.title ?? item.headline}</p>
                    {item.summary && (
                      <p className="text-white/[0.45] text-xs mt-1.5 leading-relaxed line-clamp-2">{item.summary}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Valuation footer — matches mobile card */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-5 text-center">
                <p className="text-white/[0.55] text-xs mb-1">SpaceX Valuation</p>
                <p className="text-white text-2xl font-bold mb-1">{fmtVal(quoteData?.valuation)}</p>
                <p className="text-white/[0.55] text-xs">Most valuable private company in history</p>
              </div>
            </motion.div>
          )}

          {/* ── MY PORTFOLIO ─────────────────────── */}
          {section === "shares" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <SectionHeader label="MY PORTFOLIO" sub="SpaceX Equity Holdings" />

              {/* Holdings hero card — compact */}
              <div className="relative overflow-hidden rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-md p-3">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white/30 text-[0.52rem] tracking-[0.18em] uppercase mb-0.5"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      POSITION · SPACEX (SPCX) · NASDAQ
                    </p>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <p className="text-xl font-black text-white"
                        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                        {totalShares.toLocaleString()} <span className="text-white/30 text-base">shares</span>
                      </p>
                      {avgBuyPrice > 0 && (
                        <span className={`text-xs font-black ${paperGainLoss >= 0 ? "text-green-400" : "text-red-400"}`}
                          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                          {paperGainLoss >= 0 ? "+" : ""}{paperGainPct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <p className="text-white/25 text-[0.62rem] mt-0.5">
                      Value: <span className="text-white/70 font-semibold">${totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      {avgBuyPrice > 0 && <> · Avg <span className="text-white/70 font-semibold">${avgBuyPrice.toFixed(2)}</span></>}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/transfer?shares=${totalShares}`)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-white/15 text-white/50 text-[0.55rem] font-black tracking-widest uppercase hover:border-white/40 hover:text-white transition-all"
                    style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                      <path d="M1 4h11m0 0L8 1m4 3L8 7" /><path d="M15 12H4m0 0l4-3m-4 3l4 3" />
                    </svg>
                    TRANSFER
                  </button>
                </div>
              </div>

              {/* Compact stat chips — 3 col single row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Shares", value: totalShares.toLocaleString(), sub: "credited", hl: false },
                  { label: "Value", value: `$${totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `@ $${sharePrice}`, hl: false },
                  {
                    label: "P&L",
                    value: avgBuyPrice > 0 ? `${paperGainLoss >= 0 ? "+" : ""}$${Math.abs(paperGainLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—",
                    sub: avgBuyPrice > 0 ? `${paperGainPct >= 0 ? "+" : ""}${paperGainPct.toFixed(1)}%` : "no avg",
                    hl: avgBuyPrice > 0,
                    gain: paperGainLoss >= 0,
                  },
                ].map((s) => (
                  <div key={s.label} className="relative px-3 py-2 overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <p className="text-white/30 text-[0.5rem] tracking-widest uppercase mb-0.5" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.label}</p>
                    <p className={`text-sm font-black leading-none ${"hl" in s && s.hl ? (s.gain ? "text-green-400" : "text-red-400") : "text-white"}`}
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{s.value}</p>
                    <p className="text-white/25 text-[0.52rem] mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── View transactions shortcut */}
              <div className="flex items-center justify-between px-1">
                <p className="text-white/20 text-[0.6rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  {(purchases as Purchase[]).length} order{(purchases as Purchase[]).length !== 1 ? "s" : ""} placed
                </p>
                <button onClick={() => { vib(); navigate("/history"); }}
                  className="text-white/30 hover:text-white text-[0.6rem] tracking-widest uppercase transition-colors"
                  style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                  VIEW TRANSACTIONS ›
                </button>
              </div>

              {/* ── PRICE ALERTS ─────────────────── */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[0.65rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      PRICE ALERTS
                    </p>
                    <p className="text-white/20 text-[0.6rem] mt-0.5">Email notification when share price hits your target</p>
                  </div>
                  {(priceAlerts as PriceAlert[]).length > 0 && (
                    <span className="text-[0.6rem] text-white/30 tracking-widest" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      {(priceAlerts as PriceAlert[]).length} ACTIVE
                    </span>
                  )}
                </div>
                <div className="px-5 py-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-white/40 text-lg font-black" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>$</span>
                      <input
                        type="number"
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(e.target.value)}
                        placeholder={String(sharePrice)}
                        className="flex-1 min-w-0 bg-transparent border-b border-white/20 focus:border-white outline-none text-white text-xl font-black py-1 placeholder:text-white/15 transition-colors"
                        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                      />
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setAlertDirection(true)}
                        className={`text-[0.6rem] px-2.5 py-1.5 border tracking-widest uppercase transition-colors ${alertDirection ? "bg-white text-black border-white" : "border-white/20 text-white/40 hover:border-white/50"}`}
                        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                        ↑ ABOVE
                      </button>
                      <button onClick={() => setAlertDirection(false)}
                        className={`text-[0.6rem] px-2.5 py-1.5 border tracking-widest uppercase transition-colors ${!alertDirection ? "bg-white text-black border-white" : "border-white/20 text-white/40 hover:border-white/50"}`}
                        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                        ↓ BELOW
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        if (!alertTargetPrice || Number(alertTargetPrice) <= 0) return;
                        setAlertCreating(true);
                        try {
                          await api.createAlert(Number(alertTargetPrice), alertDirection);
                          qc.invalidateQueries({ queryKey: ["alerts"] });
                          setAlertTargetPrice("");
                        } finally { setAlertCreating(false); }
                      }}
                      disabled={alertCreating || !alertTargetPrice}
                      className="shrink-0 px-4 py-1.5 bg-white text-black text-[0.6rem] font-black tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-30"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                      {alertCreating ? "···" : "SET ALERT"}
                    </button>
                  </div>
                </div>
                {(priceAlerts as PriceAlert[]).length > 0 ? (
                  <div className="divide-y divide-white/[0.04]">
                    {(priceAlerts as PriceAlert[]).map((a) => (
                      <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black ${a.direction ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                            {a.direction ? "↑" : "↓"}
                          </span>
                          <div>
                            <span className="text-white font-black text-sm" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                              ${Number(a.targetPrice).toLocaleString()}
                            </span>
                            <span className="text-white/30 text-xs ml-2">{a.direction ? "or above" : "or below"}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => { await api.deleteAlert(a.id); qc.invalidateQueries({ queryKey: ["alerts"] }); }}
                          className="text-white/20 hover:text-white/60 transition-colors text-[0.6rem] tracking-widest uppercase"
                          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
                          REMOVE
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-white/20 text-xs">No alerts active. Enter a price target above to receive an email when the price crosses it.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BUY SHARES ──────────────────────── */}
          {section === "purchase" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionHeader label="PURCHASE ORDER" sub="SpaceX Pre-IPO Shares" />
              <PurchaseForm
                sharePrice={sharePrice}
                minShares={minShares}
                minInvestment={minInvestment}
                user={user}
                onSuccess={() => {
                  qc.invalidateQueries({ queryKey: ["purchases"] });
                  qc.invalidateQueries({ queryKey: ["dashboard"] });
                  navigate("/history");
                }}
              />
            </motion.div>
          )}

          {/* ── APPS ─────────────────────────────── */}
          {section === "apps" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 md:space-y-6">
              <SectionHeader label="APPS" sub="Tools & Games" />
              <SpaceTrivia />
            </motion.div>
          )}

        </main>

        {/* Mobile bottom navigation — floating glass pill */}
        <nav className="md:hidden fixed left-3 right-3 z-40" style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.4rem))' }}>
          <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] border border-white/[0.12]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />
            <div className="flex items-stretch justify-around px-1 py-1">
              {[
                { id: "overview" as Section, label: "Home", navigate: false, verify: false,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><circle cx="12" cy="12" r="8.5" strokeWidth="0.7"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><line x1="12" y1="3.5" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="20.5"/><line x1="3.5" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="20.5" y2="12"/></svg> },
                { id: "shares" as Section, label: "Portfolio", navigate: false, verify: false,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><line x1="3" y1="20.5" x2="21" y2="20.5" strokeWidth="0.6" strokeOpacity="0.45"/><line x1="3" y1="20.5" x2="3" y2="5" strokeWidth="0.6" strokeOpacity="0.45"/><polyline points="3,18 7,13 11,15.5 19,5.5" strokeWidth="1.6"/><circle cx="19" cy="5.5" r="1.6" fill="currentColor" stroke="none"/></svg> },
                { id: "purchase" as Section, label: "Buy", navigate: false, verify: false,
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><polygon points="12,3 20.5,7.5 20.5,16.5 12,21 3.5,16.5 3.5,7.5"/><line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.5"/><line x1="9" y1="12" x2="15" y2="12" strokeWidth="1.5"/></svg> },
                { id: "purchase" as Section, label: "Orders", navigate: true, verify: false, navPath: "/history",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg> },
                { id: "apps" as Section, label: "Transfer", navigate: true, verify: false, navPath: "/transfer",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4"><path d="M3 7h14m0 0-3-3m3 3-3 3"/><path d="M21 17H7m0 0 3-3m-3 3 3 3"/></svg> },
              ].map(({ id, label, icon, verify, navigate: isNavItem, navPath }) => (
                <button
                  key={`${label}-${id}`}
                  onClick={() => { vib(); isNavItem && navPath ? navigate(navPath) : setSection(id); }}
                  className={`relative flex flex-col items-center gap-0.5 py-2 px-1 flex-1 rounded-xl transition-all ${
                    !isNavItem && section === id
                      ? "text-white bg-white/[0.12]"
                      : "text-white/35 hover:text-white/65 hover:bg-white/[0.05]"
                  }`}
                >
                  {verify && (
                    <span className="absolute top-1 right-0.5 text-yellow-400 font-black leading-tight px-0.5 border border-yellow-400/40 bg-yellow-400/10"
                      style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontSize: "0.42rem", letterSpacing: "0.04em" }}>
                      VERIFY
                    </span>
                  )}
                  {icon}
                  <span className="text-[0.5rem] tracking-widest uppercase" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

// ── SpaceX Trivia Game ───────────────────────────────────────────────
const TRIVIA = [
  { q: "In what year was SpaceX founded?", options: ["1998", "2002", "2004", "2008"], answer: 1 },
  { q: "What is SpaceX's fully reusable mega-rocket called?", options: ["Falcon Heavy", "New Glenn", "Starship", "SLS"], answer: 2 },
  { q: "Which SpaceX satellite constellation provides global internet?", options: ["OneWeb", "Starlink", "Kuiper", "ViaSat"], answer: 1 },
  { q: "Who founded SpaceX?", options: ["Jeff Bezos", "Richard Branson", "Elon Musk", "Larry Page"], answer: 2 },
  { q: "What was SpaceX's first rocket to reach orbit?", options: ["Falcon 1", "Falcon 9", "Dragon", "Merlin"], answer: 0 },
];

function SpaceTrivia() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === TRIVIA[idx].answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= TRIVIA.length) { setDone(true); return; }
    setIdx((i) => i + 1);
    setSelected(null);
  }

  function restart() { setIdx(0); setSelected(null); setScore(0); setDone(false); }

  const q = TRIVIA[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm p-6 max-w-lg shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <p className="text-white/30 text-[0.65rem] tracking-widest uppercase mb-1"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        SPACEX TRIVIA
      </p>
      {done ? (
        <div className="text-center py-8">
          <p className="text-white font-black text-4xl mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>{score}/{TRIVIA.length}</p>
          <p className="text-white/40 text-sm mb-6">
            {score === TRIVIA.length ? "Perfect score! You know SpaceX inside out." : score >= 3 ? "Great effort, investor!" : "Keep learning — the stars await."}
          </p>
          <button onClick={restart}
            className="px-6 py-2.5 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            PLAY AGAIN
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5 mt-4">
            {TRIVIA.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 ${i <= idx ? "bg-white" : "bg-white/15"}`} />
            ))}
          </div>
          <p className="text-white font-semibold text-base mb-5 leading-snug">{q.q}</p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.answer;
              const isSelected = i === selected;
              const revealed = selected !== null;
              return (
                <button key={i} onClick={() => pick(i)} disabled={revealed}
                  className={`w-full text-left px-4 py-3 border text-sm transition-colors ${
                    !revealed ? "border-white/10 text-white/70 hover:border-white/40 hover:text-white" :
                    isCorrect ? "border-green-500/50 bg-green-500/10 text-green-300" :
                    isSelected ? "border-red-500/50 bg-red-500/10 text-red-300" :
                    "border-white/[0.05] text-white/20"
                  }`}>
                  {opt}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <button onClick={next}
              className="mt-5 w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              {idx + 1 >= TRIVIA.length ? "SEE RESULTS" : "NEXT QUESTION ›"}
            </button>
          )}
          <p className="text-white/20 text-xs mt-3 text-right">{idx + 1} / {TRIVIA.length}</p>
        </>
      )}
    </div>
  );
}

// ── Shared input component ───────────────────────────────────────────
function InputField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-white/30 text-[0.65rem] tracking-widest uppercase mb-1.5"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
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

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-white/30 text-[0.65rem] tracking-widest uppercase mb-1.5"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/40 transition-colors appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff40'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "16px" }}
      >
        <option value="" disabled className="bg-zinc-900">Select one…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-white/25 text-[0.6rem] tracking-[0.2em] uppercase shrink-0"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
        {label}
      </span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

// ── Expanded Purchase Form ───────────────────────────────────────────
function PurchaseForm({
  sharePrice,
  minShares,
  minInvestment,
  user,
  onSuccess,
}: {
  sharePrice: number;
  minShares: number;
  minInvestment: number;
  user: { fullName: string; email: string; phone: string | null } | undefined;
  onSuccess: () => void;
}) {
  const [shares, setShares] = useState<number | "">(minShares);

  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);
  const [decl4, setDecl4] = useState(false);
  const [decl5, setDecl5] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState<{ shares: number; total: number } | null>(null);

  const BULK_DISCOUNT_MIN_SHARES = 20;
  const BULK_DISCOUNT_PERCENT = 20;
  const numShares = Number(shares) || 0;
  const originalAmount = numShares * sharePrice;
  const discountApplies = numShares > BULK_DISCOUNT_MIN_SHARES;
  const discountAmount = discountApplies ? originalAmount * (BULK_DISCOUNT_PERCENT / 100) : 0;
  const totalAmount = originalAmount - discountAmount;
  const allDeclarations = decl1 && decl2 && decl4 && decl5;
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!numShares || numShares <= 0) { setError("Please enter a number of shares."); return; }
    if (!allDeclarations) { setError("You must agree to all declarations to proceed."); return; }

    setSubmitting(true);
    try {
      const [result] = await Promise.allSettled([
        api.createPurchase({ requestedShares: numShares, agreedToTerms: true }),
        new Promise(res => setTimeout(res, 10000)),
      ]);
      if (result.status === "rejected") throw result.reason;
      setSucceeded({ shares: numShares, total: totalAmount });
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm p-8 text-center">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {/* Checkmark */}
          <div className="w-14 h-14 rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-white">
              <polyline points="4,12 9,17 20,6" />
            </svg>
          </div>
          <p className="text-white/40 text-[0.6rem] tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>Order Submitted</p>
          <p className="text-white font-black text-3xl mb-1" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            {succeeded.shares.toLocaleString()} <span className="text-white/40 text-xl">shares</span>
          </p>
          <p className="text-white/50 text-sm mb-1">${succeeded.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
          <p className="text-white/30 text-xs mt-4 mb-7 leading-relaxed max-w-xs mx-auto">
            Your purchase order has been received. Payment instructions have been sent to your email. You will be notified once your order is confirmed.
          </p>
          <button
            onClick={onSuccess}
            className="w-full bg-white text-black font-black py-3 text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            VIEW MY ORDERS ›
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">

      {/* Fullscreen loading overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: "rgba(0,0,0,0.72)" }}>
          {/* Spinning ring */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-white animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 opacity-70">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>
          <p className="text-white font-black text-base tracking-[0.25em] uppercase mb-2" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
            Processing Order
          </p>
          <p className="text-white/40 text-xs tracking-widest uppercase">Please wait — do not close this page</p>
        </div>
      )}

      {/* Shares input hero */}
      <div className="rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-sm p-4">
        <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-2"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          NUMBER OF SHARES
        </p>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="number"
            min={1}
            step={1}
            value={shares}
            onChange={(e) => setShares(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="1"
            className="w-32 bg-transparent border-b-2 border-white/30 focus:border-white outline-none text-3xl font-black text-white py-0.5 placeholder:text-white/15 transition-colors"
            style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
          />
          <span className="text-white/30 text-sm">shares</span>
          {numShares > 0 && (
            <span className="ml-auto font-black text-base text-white"
              style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
              {discountApplies && (
                <span className="text-white/30 line-through font-normal mr-1.5 text-sm">
                  ${originalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
              ${totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        {discountApplies && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1.5 w-fit">
            <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" className="w-3.5 h-3.5 shrink-0"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            <p className="text-emerald-400 text-[0.7rem] font-semibold">
              20% bulk discount applied — you save ${discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
        {!discountApplies && numShares > 0 && (
          <p className="text-white/25 text-[0.65rem] mt-2">Buy more than {BULK_DISCOUNT_MIN_SHARES} shares to unlock a 20% bulk discount.</p>
        )}
      </div>

      {/* Declarations */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/25 text-[0.55rem] tracking-[0.2em] uppercase shrink-0"
          style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>
          DECLARATIONS
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="space-y-2">
        {[
          { state: decl1, set: setDecl1, text: "I confirm I am an accredited investor (income ≥ $200K or net worth ≥ $1M excl. primary residence)." },
          { state: decl2, set: setDecl2, text: "I understand this is a private placement, not a registered public offering." },
          { state: decl4, set: setDecl4, text: "I agree to the investment terms; my purchase is subject to manual review and approval." },
          { state: decl5, set: setDecl5, text: "I certify all information provided is true, accurate, and complete." },
        ].map(({ state, set, text }, i) => (
          <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
            <div className={`mt-0.5 w-3.5 h-3.5 border shrink-0 flex items-center justify-center transition-colors ${
              state ? "border-white bg-white" : "border-white/20 group-hover:border-white/50"
            }`}>
              {state && (
                <svg viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2" className="w-2 h-2">
                  <polyline points="1,6 4,9 11,2" />
                </svg>
              )}
            </div>
            <input type="checkbox" checked={state} onChange={(e) => set(e.target.checked)} className="sr-only" />
            <p className="text-white/45 text-[0.68rem] leading-snug group-hover:text-white/65 transition-colors">{text}</p>
          </label>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !allDeclarations || numShares <= 0}
        className="w-full bg-white text-black font-black py-3 text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.1em" }}
      >
        {submitting ? "SUBMITTING..." : `SUBMIT PURCHASE — ${totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ›`}
      </button>
    </form>
  );
}

