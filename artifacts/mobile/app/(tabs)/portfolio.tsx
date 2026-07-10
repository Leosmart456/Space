import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useMemo, useState, useCallback } from "react";
import {
  Dimensions,
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
import { PurchaseCard } from "@/components/PurchaseCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const SCREEN_WIDTH = Dimensions.get("window").width;

const ALLOCATIONS = [
  { label: "Starship", pct: 42, color: "#00d4ff" },
  { label: "Starlink", pct: 31, color: "#00c48c" },
  { label: "Dragon", pct: 16, color: "#f5a623" },
  { label: "Other", pct: 11, color: "#8c96a9" },
];

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { purchases, user, sharePrice, refreshData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");

  // Every time this screen comes into focus, apply the tab param so that
  // "View More" from dashboard always lands on History regardless of prior state.
  useFocusEffect(
    useCallback(() => {
      if (params.tab === "history") setActiveTab("history");
    }, [params.tab])
  );

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;
  const confirmedPurchases = useMemo(
    () => purchases.filter((p) => p.status === "confirmed"),
    [purchases]
  );
  const totalInvested = useMemo(
    () => confirmedPurchases.reduce((s, p) => s + p.amountUsd, 0),
    [confirmedPurchases]
  );
  const gain = portfolioValue - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }

  const allocationBarWidth = SCREEN_WIDTH - 80;

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
      <Text style={[styles.title, { color: colors.foreground }]}>Portfolio</Text>

      {/* Performance Hero */}
      <GlassCard intensity={70} padding={0} style={styles.heroCard}>
        <LinearGradient colors={["#0d2240", "#080c12"]} style={styles.heroGrad}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
                TOTAL VALUE
              </Text>
              <Text style={[styles.heroValue, { color: colors.foreground }]}>
                $
                {portfolioValue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.heroGainBadge}>
              <Ionicons
                name={gainPct >= 0 ? "trending-up" : "trending-down"}
                size={13}
                color={gainPct >= 0 ? colors.success : colors.destructive}
              />
              <Text
                style={[
                  styles.heroGainText,
                  {
                    color:
                      gainPct >= 0 ? colors.success : colors.destructive,
                  },
                ]}
              >
                {gainPct >= 0 ? "+" : ""}
                {gainPct.toFixed(2)}%
              </Text>
            </View>
          </View>

          <PriceChart
            width={SCREEN_WIDTH - 80}
            height={70}
            positive={gainPct >= 0}
          />

          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={[styles.hsl, { color: colors.mutedForeground }]}>
                Shares
              </Text>
              <Text style={[styles.hsv, { color: colors.primary }]}>
                {totalShares.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.vDivider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.hsl, { color: colors.mutedForeground }]}>
                Invested
              </Text>
              <Text style={[styles.hsv, { color: colors.foreground }]}>
                $
                {totalInvested.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={[styles.vDivider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.hsl, { color: colors.mutedForeground }]}>
                Gain
              </Text>
              <Text
                style={[
                  styles.hsv,
                  {
                    color:
                      gain >= 0 ? colors.success : colors.destructive,
                  },
                ]}
              >
                {gain >= 0 ? "+" : ""}$
                {Math.abs(gain).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </GlassCard>

      {/* SPCX Price Chart */}
      <TradingViewChart height={300} />

      {/* Accreditation Bar */}
      <Pressable
        onPress={() => router.push("/accreditation" as any)}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
      >
        <GlassCard intensity={40} padding={14} style={styles.accredCard}>
          <View style={styles.accredRow}>
            <Ionicons
              name={
                user?.accreditedStatus === "yes"
                  ? "shield-checkmark"
                  : user?.accreditedStatus === "no"
                  ? "close-circle"
                  : "time"
              }
              size={18}
              color={
                user?.accreditedStatus === "yes"
                  ? colors.success
                  : user?.accreditedStatus === "no"
                  ? colors.destructive
                  : colors.warning
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.accredTitle, { color: colors.foreground }]}>
                {user?.accreditedStatus === "yes"
                  ? "Accredited Investor Verified"
                  : user?.accreditedStatus === "no"
                  ? "Accreditation Denied"
                  : "Accreditation Under Review"}
              </Text>
              <Text style={[styles.accredSub, { color: colors.mutedForeground }]}>
                {user?.accreditedStatus === "yes"
                  ? "Tap to view your verification details"
                  : user?.accreditedStatus === "no"
                  ? "Contact support to appeal this decision"
                  : "Usually takes 2–3 business days"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </GlassCard>
      </Pressable>

      {/* Allocation Breakdown */}
      {totalShares > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Segment Allocation
          </Text>
          <GlassCard intensity={40} padding={18} style={styles.allocCard}>
            {/* Stacked Bar */}
            <View style={[styles.allocBar, { width: allocationBarWidth }]}>
              {ALLOCATIONS.map((a) => (
                <View
                  key={a.label}
                  style={{
                    width: (allocationBarWidth * a.pct) / 100,
                    height: "100%",
                    backgroundColor: a.color,
                  }}
                />
              ))}
            </View>
            {/* Legend */}
            <View style={styles.allocLegend}>
              {ALLOCATIONS.map((a) => (
                <View key={a.label} style={styles.allocItem}>
                  <View style={[styles.allocDot, { backgroundColor: a.color }]} />
                  <Text style={[styles.allocLabel, { color: colors.mutedForeground }]}>
                    {a.label}
                  </Text>
                  <Text style={[styles.allocPct, { color: colors.foreground }]}>
                    {a.pct}%
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>
      )}

      {/* Tab Toggle */}
      <View
        style={[
          styles.tabToggle,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === "holdings" && {
              backgroundColor: colors.primary + "22",
            },
          ]}
          onPress={() => setActiveTab("holdings")}
        >
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === "holdings"
                    ? colors.primary
                    : colors.mutedForeground,
              },
            ]}
          >
            Holdings
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === "history" && {
              backgroundColor: colors.primary + "22",
            },
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === "history"
                    ? colors.primary
                    : colors.mutedForeground,
              },
            ]}
          >
            History
          </Text>
        </Pressable>
      </View>

      {/* Holdings View */}
      {activeTab === "holdings" && (
        <View style={styles.section}>
          {totalShares > 0 ? (
            <GlassCard intensity={40} padding={0} style={styles.holdingCard}>
              <View style={styles.holdingRow}>
                <View
                  style={[
                    styles.holdingIcon,
                    { backgroundColor: colors.primary + "22" },
                  ]}
                >
                  <Text style={[styles.holdingIconText, { color: colors.primary }]}>
                    SPCX
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.holdingName, { color: colors.foreground }]}>
                    SpaceX
                  </Text>
                  <Text
                    style={[styles.holdingSub, { color: colors.mutedForeground }]}
                  >
                    {totalShares.toFixed(4)} shares
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.holdingValue, { color: colors.foreground }]}>
                    $
                    {portfolioValue.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.holdingChange,
                      { color: gainPct >= 0 ? colors.success : colors.destructive },
                    ]}
                  >
                    {gainPct >= 0 ? "+" : ""}
                    {gainPct.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard intensity={40} padding={28} style={styles.emptyBox}>
              <Ionicons
                name="briefcase-outline"
                size={36}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No holdings yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Reserve your first SPCX shares via the Buy tab
              </Text>
              <Pressable
                style={[
                  styles.emptyBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push("/(tabs)/buy")}
              >
                <Text style={styles.emptyBtnText}>Buy Shares</Text>
              </Pressable>
            </GlassCard>
          )}
        </View>
      )}

      {/* History View */}
      {activeTab === "history" && (
        <View style={styles.section}>
          {purchases.length === 0 ? (
            <GlassCard intensity={40} padding={28} style={styles.emptyBox}>
              <Ionicons
                name="receipt-outline"
                size={36}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No purchases yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Your order history will appear here
              </Text>
            </GlassCard>
          ) : (
            purchases.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/purchase/${p.id}`)}
              >
                <PurchaseCard purchase={p} />
              </Pressable>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroCard: { overflow: "hidden" },
  heroGrad: { padding: 20, gap: 10 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroValue: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  heroGainBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroGainText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  heroFooter: { flexDirection: "row", justifyContent: "space-between" },
  heroStat: { flex: 1, alignItems: "center", gap: 2 },
  hsl: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  hsv: { fontSize: 14, fontFamily: "Inter_700Bold" },
  vDivider: { width: 1 },
  accredCard: {},
  accredRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accredTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  accredSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  allocCard: { gap: 16 },
  allocBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    flexDirection: "row",
  },
  allocLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  allocItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  allocDot: { width: 8, height: 8, borderRadius: 4 },
  allocLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  allocPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: "center",
  },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  holdingCard: { overflow: "hidden" },
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  holdingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  holdingIconText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  holdingName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  holdingSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  holdingValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  holdingChange: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  emptyBox: { alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#000" },
});
