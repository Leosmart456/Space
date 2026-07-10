import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { PriceChart } from "@/components/PriceChart";
import { TradingViewChart } from "@/components/TradingViewChart";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getPriceHistory, getPriceQuote } from "@/lib/api";

const SCREEN_WIDTH = Dimensions.get("window").width;

const STATIC_MARKET_STATS = [
  { label: "52-Week High", value: "$142.50" },
  { label: "52-Week Low", value: "$98.20" },
  { label: "Float", value: "Private" },
];

const NEWS = [
  {
    id: "n1",
    headline: "Starship completes 7th integrated flight test",
    time: "2h ago",
    tag: "Mission",
  },
  {
    id: "n2",
    headline: "SpaceX wins $5.9B NASA lunar lander contract",
    time: "1d ago",
    tag: "Contract",
  },
  {
    id: "n3",
    headline: "Starlink surpasses 4 million subscribers globally",
    time: "3d ago",
    tag: "Starlink",
  },
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, purchases, sharePrice: settingsSharePrice, systemMode, refreshData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: quote, refetch: refetchQuote } = useQuery({
    queryKey: ["priceQuote"],
    queryFn: getPriceQuote,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["priceHistory"],
    queryFn: getPriceHistory,
    staleTime: 4 * 60 * 60 * 1000,
    retry: 1,
  });

  const { data: newsArticles } = useQuery({
    queryKey: ["spaceflightNews"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles/?limit=3&search=spacex&ordering=-published_at"
      );
      return res.json();
    },
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const sharePrice = quote?.price ?? settingsSharePrice;
  const fmtVal = (v: number | undefined) => {
    if (!v) return "—";
    if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(2)}T`;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    return `${v.toLocaleString()}`;
  };
  const marketStats = [
    ...STATIC_MARKET_STATS.slice(0, 2),
    { label: "Market Cap", value: fmtVal(quote?.valuation) },
    STATIC_MARKET_STATS[2],
  ];
  const chartData = useMemo(
    () => history?.points?.map((p) => p.close) ?? [],
    [history]
  );

  const confirmedPurchases = useMemo(
    () => purchases.filter((p) => p.status === "confirmed"),
    [purchases]
  );
  const totalInvested = useMemo(
    () => confirmedPurchases.reduce((s, p) => s + p.amountUsd, 0),
    [confirmedPurchases]
  );
  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;
  const gain = portfolioValue - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshData(), refetchQuote(), refetchHistory()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: isWeb ? 100 : insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting}
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.fullName?.split(" ")[0] ?? "Investor"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor:
                  systemMode === "post_ipo"
                    ? colors.primary + "22"
                    : colors.warning + "22",
                borderColor:
                  systemMode === "post_ipo"
                    ? colors.primary + "44"
                    : colors.warning + "44",
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    systemMode === "post_ipo" ? colors.primary : colors.warning,
                },
              ]}
            />
            <Text
              style={[
                styles.modeText,
                {
                  color:
                    systemMode === "post_ipo" ? colors.primary : colors.warning,
                },
              ]}
            >
              {systemMode === "post_ipo" ? "POST-IPO" : "PRE-IPO"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>

      {/* Portfolio Hero — Liquid Glass */}
      <GlassCard style={styles.heroCard} intensity={70} padding={0}>
        <LinearGradient
          colors={["#0d2240", "#080c12"]}
          style={styles.heroGradient}
        >
          <View style={styles.heroTop}>
            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              PORTFOLIO VALUE
            </Text>
            <View style={styles.tickerBadge}>
              <Text style={[styles.tickerText, { color: colors.primary }]}>
                SPCX
              </Text>
            </View>
          </View>
          <Text style={[styles.heroValue, { color: colors.foreground }]}>
            $
            {portfolioValue.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </Text>
          <View style={styles.heroChange}>
            <Ionicons
              name={gainPct >= 0 ? "trending-up" : "trending-down"}
              size={14}
              color={gainPct >= 0 ? colors.success : colors.destructive}
            />
            <Text
              style={[
                styles.changeAmt,
                {
                  color: gainPct >= 0 ? colors.success : colors.destructive,
                },
              ]}
            >
              {gain >= 0 ? "+" : ""}$
              {Math.abs(gain).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
              {"  "}({gainPct >= 0 ? "+" : ""}
              {gainPct.toFixed(2)}%)
            </Text>
            <Text style={[styles.periodText, { color: colors.mutedForeground }]}>
              all time
            </Text>
          </View>

          <PriceChart
            width={SCREEN_WIDTH - 64}
            height={80}
            positive={gainPct >= 0}
            data={chartData}
          />

          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text
                style={[styles.heroStatLabel, { color: colors.mutedForeground }]}
              >
                Share Price
              </Text>
              <Text style={[styles.heroStatValue, { color: colors.foreground }]}>
                ${sharePrice}
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: "rgba(255,255,255,0.08)" },
              ]}
            />
            <View style={styles.heroStat}>
              <Text
                style={[styles.heroStatLabel, { color: colors.mutedForeground }]}
              >
                Your Shares
              </Text>
              <Text style={[styles.heroStatValue, { color: colors.foreground }]}>
                {totalShares.toFixed(2)}
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: "rgba(255,255,255,0.08)" },
              ]}
            />
            <View style={styles.heroStat}>
              <Text
                style={[styles.heroStatLabel, { color: colors.mutedForeground }]}
              >
                Invested
              </Text>
              <Text style={[styles.heroStatValue, { color: colors.foreground }]}>
                $
                {totalInvested.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </GlassCard>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <Pressable
          style={({ pressed }) => [
            styles.quickBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.push("/(tabs)/buy")}
        >
          <Ionicons name="add-circle-outline" size={18} color="#000" />
          <Text style={styles.quickBtnTextDark}>Buy Shares</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickBtn,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => router.push("/(tabs)/transfer")}
        >
          <Ionicons
            name="briefcase-outline"
            size={18}
            color={colors.foreground}
          />
          <Text style={[styles.quickBtnText, { color: colors.foreground }]}>
            Portfolio
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.quickBtn,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => router.push("/documents")}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={colors.foreground}
          />
          <Text style={[styles.quickBtnText, { color: colors.foreground }]}>
            Documents
          </Text>
        </Pressable>
      </View>

      {/* Order Stats — Glass */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statGlass} intensity={50} padding={16}>
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.warning}
            style={{ marginBottom: 6 }}
          />
          <Text style={[styles.statBigNum, { color: colors.foreground }]}>
            {purchases.filter((p) => p.status === "pending_review").length}
          </Text>
          <Text style={[styles.statSmallLabel, { color: colors.mutedForeground }]}>
            Pending Orders
          </Text>
        </GlassCard>
        <GlassCard style={styles.statGlass} intensity={50} padding={16}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={colors.success}
            style={{ marginBottom: 6 }}
          />
          <Text style={[styles.statBigNum, { color: colors.foreground }]}>
            {confirmedPurchases.length}
          </Text>
          <Text style={[styles.statSmallLabel, { color: colors.mutedForeground }]}>
            Confirmed Orders
          </Text>
        </GlassCard>
        <GlassCard style={styles.statGlass} intensity={50} padding={16}>
          <Ionicons
            name="people-outline"
            size={20}
            color={colors.primary}
            style={{ marginBottom: 6 }}
          />
          <Text style={[styles.statBigNum, { color: colors.foreground }]}>
            18.4k
          </Text>
          <Text style={[styles.statSmallLabel, { color: colors.mutedForeground }]}>
            Investors
          </Text>
        </GlassCard>
      </View>

      {/* SPCX Price Chart */}
      <TradingViewChart height={320} />

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Activity
          </Text>
          {purchases.length > 0 && (
            <Pressable onPress={() => router.push({ pathname: "/(tabs)/portfolio", params: { tab: "history" } })}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                View More
              </Text>
            </Pressable>
          )}
        </View>
        {purchases.length === 0 ? (
          <GlassCard style={styles.emptyBox} intensity={40} padding={28}>
            <Ionicons
              name="trending-up-outline"
              size={36}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No purchases yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap Buy Shares above to reserve your first SPCX allocation.
            </Text>
          </GlassCard>
        ) : (
          <GlassCard intensity={40} padding={0} style={styles.activityCard}>
            {purchases.slice(0, 4).map((p, idx) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  styles.activityItem,
                  {
                    borderBottomColor:
                      idx < Math.min(purchases.length, 4) - 1
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => router.push(`/purchase/${p.id}`)}
              >
                <View
                  style={[
                    styles.activityIcon,
                    {
                      backgroundColor:
                        p.status === "confirmed"
                          ? colors.success + "22"
                          : p.status === "rejected"
                          ? colors.destructive + "22"
                          : colors.warning + "22",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      p.status === "confirmed"
                        ? "checkmark"
                        : p.status === "rejected"
                        ? "close"
                        : "time"
                    }
                    size={14}
                    color={
                      p.status === "confirmed"
                        ? colors.success
                        : p.status === "rejected"
                        ? colors.destructive
                        : colors.warning
                    }
                  />
                </View>
                <View style={styles.activityLeft}>
                  <Text
                    style={[styles.activityAmount, { color: colors.foreground }]}
                  >
                    $
                    {p.amountUsd.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.activitySub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {p.requestedShares.toFixed(2)} shares
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Text
                    style={[
                      styles.activityStatus,
                      {
                        color:
                          p.status === "confirmed"
                            ? colors.success
                            : p.status === "rejected"
                            ? colors.destructive
                            : colors.warning,
                      },
                    ]}
                  >
                    {p.status === "pending_review"
                      ? "Pending"
                      : p.status === "confirmed"
                      ? "Confirmed"
                      : "Rejected"}
                  </Text>
                  <Text
                    style={[
                      styles.activityDate,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.mutedForeground}
                />
              </Pressable>
            ))}
          </GlassCard>
        )}
      </View>

      {/* Market Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Market Data
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.marketCard}>
          {marketStats.map((stat, idx) => (
            <View key={stat.label}>
              <View style={styles.marketRow}>
                <Text
                  style={[styles.marketLabel, { color: colors.mutedForeground }]}
                >
                  {stat.label}
                </Text>
                <Text
                  style={[styles.marketValue, { color: colors.foreground }]}
                >
                  {stat.value}
                </Text>
              </View>
              {idx < marketStats.length - 1 && (
                <View
                  style={[
                    styles.mDivider,
                    { backgroundColor: "rgba(255,255,255,0.06)" },
                  ]}
                />
              )}
            </View>
          ))}
        </GlassCard>
      </View>

      {/* Latest News */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            SpaceX News
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/news" as any)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        {(newsArticles?.results?.length > 0
          ? (newsArticles.results as any[]).slice(0, 3).map((a: any) => ({
              id: String(a.id),
              headline: a.title,
              time: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              tag: a.newsSite || "SpaceX",
              url: a.url,
            }))
          : NEWS
        ).map((item: any) => (
          <Pressable
            key={item.id}
            onPress={item.url ? () => Linking.openURL(item.url) : undefined}
            style={({ pressed }) => [{ opacity: pressed && item.url ? 0.8 : 1 }]}
          >
            <GlassCard intensity={40} padding={14} style={styles.newsCard}>
              <View style={styles.newsRow}>
                <View
                  style={[
                    styles.newsTag,
                    { backgroundColor: colors.primary + "22" },
                  ]}
                >
                  <Text style={[styles.newsTagText, { color: colors.primary }]}>
                    {item.tag}
                  </Text>
                </View>
                <Text
                  style={[styles.newsTime, { color: colors.mutedForeground }]}
                >
                  {item.time}
                </Text>
              </View>
              <Text style={[styles.newsHeadline, { color: colors.foreground }]}>
                {item.headline}
              </Text>
            </GlassCard>
          </Pressable>
        ))}
      </View>

      {/* Valuation Footer */}
      <GlassCard intensity={30} padding={20} style={styles.valuationCard}>
        <Text style={[styles.valuationLabel, { color: colors.mutedForeground }]}>
          SpaceX Valuation
        </Text>
        <Text style={[styles.valuationValue, { color: colors.primary }]}>
          {fmtVal(quote?.valuation)}
        </Text>
        <Text style={[styles.valuationSub, { color: colors.mutedForeground }]}>
          Most valuable private company in history
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  heroCard: { overflow: "hidden" },
  heroGradient: { padding: 20, gap: 8 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  tickerBadge: {},
  tickerText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  heroValue: { fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  heroChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  changeAmt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  periodText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginVertical: 4 },
  heroStats: { flexDirection: "row", justifyContent: "space-between" },
  heroStat: { flex: 1, alignItems: "center", gap: 2 },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  heroStatValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statDivider: { width: 1 },
  quickActions: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickBtnTextDark: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },
  quickBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statGlass: { flex: 1, alignItems: "center" },
  statBigNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statSmallLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyBox: { alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  activityCard: { overflow: "hidden" },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activityLeft: { flex: 1 },
  activityAmount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  activitySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  activityRight: { alignItems: "flex-end", gap: 2 },
  activityStatus: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  activityDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  marketCard: { overflow: "hidden" },
  marketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  marketLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  marketValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mDivider: { height: 1, marginHorizontal: 16 },
  newsCard: { gap: 8, marginBottom: 0 },
  newsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  newsTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newsTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  newsTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  newsHeadline: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  valuationCard: { alignItems: "center", gap: 4 },
  valuationLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  valuationValue: { fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  valuationSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
