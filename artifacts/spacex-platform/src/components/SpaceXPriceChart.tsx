import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type OHLCPoint } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import appLogo from "@assets/xpsca_1778445100452.png";

const BG = "#000000";

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 99999 },
] as const;

type Period = (typeof PERIODS)[number]["label"];

export default function SpaceXPriceChart({ height = 420 }: { height?: number }) {
  const [period, setPeriod] = useState<Period>("1M");

  const { data: histData } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: api.getPriceHistory,
    staleTime: 4 * 3600_000,
    retry: 1,
  });
  const { data: quote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: api.getPriceQuote,
    staleTime: 60_000,
    retry: 1,
  });

  const allPoints: OHLCPoint[] = histData?.points ?? [];

  const chartData = useMemo(() => {
    const days = PERIODS.find((p) => p.label === period)?.days ?? 30;
    const slice = days >= 99999 ? allPoints : allPoints.slice(-days);
    return slice.map((p) => ({ date: p.label, price: p.close }));
  }, [allPoints, period]);

  const isUp =
    chartData.length >= 2
      ? chartData[chartData.length - 1].price >= chartData[0].price
      : (quote?.changePercent ?? 0) >= 0;

  const color = isUp ? "#22c55e" : "#f7525f";
  const gradId = isUp ? "spcxUp" : "spcxDn";

  const currentPrice =
    quote?.price ?? allPoints[allPoints.length - 1]?.close ?? 130;
  const change = quote?.change ?? 0;
  const changePct = quote?.changePercent ?? 0;

  return (
    <div
      style={{
        background: BG,
        borderRadius: 20,
        overflow: "hidden",
        height,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px 6px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#fff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={appLogo}
              alt="SpaceX"
              style={{ width: 38, height: 38, objectFit: "contain" }}
            />
          </div>
          <div>
            <p
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Space Exploration Technologies Corp
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10.5,
                margin: "2px 0 0",
              }}
            >
              SPCX · Pre-IPO · USD
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -0.5,
            }}
          >
            $
            {currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            style={{
              color: changePct >= 0 ? "#22c55e" : "#f7525f",
              fontSize: 11,
              fontWeight: 600,
              margin: "2px 0 0",
            }}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)} ({changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%) · 1D
          </p>
        </div>
      </div>

      {/* ── Period tabs ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "4px 16px 6px",
          flexShrink: 0,
        }}
      >
        {PERIODS.map((p) => {
          const active = period === p.label;
          return (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
                border: active
                  ? "1px solid rgba(255,255,255,0.15)"
                  : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* ── Chart ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              width={54}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#000000",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(v: number) => [
                `$${v.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                "Price",
              ]}
              labelStyle={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}
              cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3, fill: color, stroke: BG, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Attribution ─────────────────────────────────────── */}
      <div
        style={{
          textAlign: "right",
          padding: "2px 14px 8px",
          color: "rgba(255,255,255,0.18)",
          fontSize: 9,
          flexShrink: 0,
        }}
      >
        Proxy: RKLB via EODHD · SpaceX Pre-IPO Platform
      </div>
    </div>
  );
}
