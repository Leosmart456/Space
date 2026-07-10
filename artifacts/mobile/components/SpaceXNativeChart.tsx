import React, { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { getPriceHistory, getPriceQuote } from "@/lib/api";
import { PriceChart } from "@/components/PriceChart";

const BG = "#080c12";
const SCREEN_W = Dimensions.get("window").width;

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 252 },
  { label: "All", days: 99999 },
] as const;

type Period = (typeof PERIODS)[number]["label"];

interface Props {
  height?: number;
}

export function SpaceXNativeChart({ height = 320 }: Props) {
  const [period, setPeriod] = useState<Period>("1M");

  const { data: histData } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: getPriceHistory,
    staleTime: 4 * 3600_000,
    retry: 1,
  });
  const { data: quote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: getPriceQuote,
    staleTime: 60_000,
    retry: 1,
  });

  const points = histData?.points ?? [];

  const { prices, isUp } = useMemo(() => {
    const days = PERIODS.find((p) => p.label === period)?.days ?? 30;
    const slice = days >= 99999 ? points : points.slice(-days);
    const ps = slice.map((p) => p.close);
    const up =
      ps.length >= 2
        ? ps[ps.length - 1] >= ps[0]
        : (quote?.changePercent ?? 0) >= 0;
    return { prices: ps, isUp: up };
  }, [points, period, quote]);

  const currentPrice =
    quote?.price ?? points[points.length - 1]?.close ?? 130;
  const change = quote?.change ?? 0;
  const changePct = quote?.changePercent ?? 0;
  const changeColor = changePct >= 0 ? "#22c55e" : "#f7525f";

  // Chart fills the horizontal space inside the component minus internal padding
  const hPad = 16;
  const chartW = SCREEN_W - 80 - hPad * 2; // 80 = outer page padding (20px * 2 sides) + gap
  const HEADER_H = 72;
  const TABS_H = 40;
  const ATTR_H = 18;
  const chartH = Math.max(60, height - HEADER_H - TABS_H - ATTR_H);

  return (
    <View style={[styles.container, { height }]}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.leftGroup}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoGlyph}>✦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.company} numberOfLines={1}>
              Space Exploration Technologies
            </Text>
            <Text style={styles.ticker}>SPCX · Pre-IPO · USD</Text>
          </View>
        </View>
        <View style={styles.rightGroup}>
          <Text style={styles.price}>
            ${currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)} ({changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* ── Period tabs ─────────────────────────────── */}
      <View style={styles.tabs}>
        {PERIODS.map((p) => {
          const active = period === p.label;
          return (
            <Pressable
              key={p.label}
              onPress={() => setPeriod(p.label)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Chart ───────────────────────────────────── */}
      <View style={{ flex: 1, paddingHorizontal: hPad }}>
        <PriceChart
          width={chartW}
          height={chartH}
          positive={isUp}
          data={prices.length > 1 ? prices : undefined}
        />
      </View>

      {/* ── Attribution ─────────────────────────────── */}
      <Text style={styles.attr}>
        Proxy: RKLB via EODHD · SpaceX Pre-IPO Platform
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG,
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 6,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
    minWidth: 0,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  logoGlyph: { color: "#fff", fontSize: 15, fontWeight: "900" },
  company: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  ticker: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9.5,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  rightGroup: { alignItems: "flex-end", flexShrink: 0, paddingLeft: 8 },
  price: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  change: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 6,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.11)",
  },
  tabLabel: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  tabLabelActive: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  attr: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 8.5,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    paddingHorizontal: 12,
    paddingBottom: 7,
  },
});
