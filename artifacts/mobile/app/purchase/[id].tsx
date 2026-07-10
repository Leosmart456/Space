import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { purchases, sharePrice } = useAuth();

  const purchase = purchases.find((p) => p.id === id);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  if (!purchase) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topPad + 16,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
          Order not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const statusColor =
    purchase.status === "confirmed"
      ? colors.success
      : purchase.status === "rejected"
      ? colors.destructive
      : colors.warning;

  const statusLabel =
    purchase.status === "confirmed"
      ? "Confirmed"
      : purchase.status === "rejected"
      ? "Rejected"
      : "Pending Review";

  const statusIcon =
    purchase.status === "confirmed"
      ? ("checkmark-circle" as const)
      : purchase.status === "rejected"
      ? ("close-circle" as const)
      : ("time" as const);

  const currentValue = purchase.requestedShares * sharePrice;
  const gainLoss = currentValue - purchase.amountUsd;
  const gainPct = (gainLoss / purchase.amountUsd) * 100;

  const TIMELINE = [
    {
      label: "Order Placed",
      date: new Date(purchase.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      done: true,
    },
    {
      label: "Under Review",
      date: "KYC & accreditation check",
      done: purchase.status !== "pending_review",
    },
    {
      label:
        purchase.status === "rejected" ? "Rejected" : "Shares Credited",
      date:
        purchase.status === "confirmed"
          ? "Shares added to your portfolio"
          : purchase.status === "rejected"
          ? "Contact support to appeal"
          : "Awaiting confirmation",
      done: purchase.status === "confirmed" || purchase.status === "rejected",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: isWeb ? 100 : insets.bottom + 40,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable
        style={({ pressed }) => [
          styles.backBtn,
          { opacity: pressed ? 0.6 : 1 },
        ]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Order Detail
        </Text>
      </Pressable>

      {/* Status Hero */}
      <GlassCard intensity={60} padding={24} style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: statusColor + "22" }]}>
          <Ionicons name={statusIcon} size={36} color={statusColor} />
        </View>
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {statusLabel}
        </Text>
        <Text style={[styles.orderAmount, { color: colors.foreground }]}>
          ${purchase.amountUsd.toLocaleString()}
        </Text>
        <Text style={[styles.orderSub, { color: colors.mutedForeground }]}>
          {purchase.requestedShares.toFixed(4)} SPCX shares
        </Text>
        {!!purchase.discountPercent && (
          <View style={[styles.discountBadge, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
            <Ionicons name="pricetag" size={12} color={colors.success} />
            <Text style={[styles.discountBadgeText, { color: colors.success }]}>
              {purchase.discountPercent}% bulk discount — saved ${Number(purchase.discountAmountUsd ?? 0).toLocaleString()}
            </Text>
          </View>
        )}
      </GlassCard>

      {/* Value Card */}
      {purchase.status === "confirmed" && (
        <GlassCard intensity={40} padding={18}>
          <View style={styles.valueRow}>
            <View>
              <Text style={[styles.valLabel, { color: colors.mutedForeground }]}>
                Current Value
              </Text>
              <Text style={[styles.valAmount, { color: colors.foreground }]}>
                ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.valLabel, { color: colors.mutedForeground }]}>
                Gain / Loss
              </Text>
              <Text
                style={[
                  styles.valGain,
                  { color: gainLoss >= 0 ? colors.success : colors.destructive },
                ]}
              >
                {gainLoss >= 0 ? "+" : ""}$
                {Math.abs(gainLoss).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}{" "}
                ({gainPct >= 0 ? "+" : ""}
                {gainPct.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Order Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Order Details
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.detailCard}>
          {[
            { label: "Order ID", value: `#${purchase.id.slice(-8).toUpperCase()}`, discount: false },
            { label: "Ticker", value: "SPCX", discount: false },
            {
              label: "Price Per Share",
              value: `${purchase.pricePerShare}`,
              discount: false,
            },
            {
              label: "Shares",
              value: purchase.requestedShares.toFixed(4),
              discount: false,
            },
            ...(purchase.discountPercent ? [
              {
                label: "Original Amount",
                value: `${Number(purchase.originalAmountUsd ?? purchase.amountUsd).toLocaleString()}`,
                discount: false,
                strikethrough: true,
              },
              {
                label: `Bulk Discount (${purchase.discountPercent}%)`,
                value: `-${Number(purchase.discountAmountUsd ?? 0).toLocaleString()}`,
                discount: true,
              },
            ] : []),
            {
              label: purchase.discountPercent ? "You Paid" : "Total Invested",
              value: `${purchase.amountUsd.toLocaleString()}`,
              discount: false,
            },
            {
              label: "Date",
              value: new Date(purchase.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              discount: false,
            },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: (row as { discount?: boolean }).discount ? colors.success : colors.mutedForeground }]}
                >
                  {row.label}
                </Text>
                <Text style={[
                  styles.detailValue,
                  {
                    color: (row as { discount?: boolean }).discount ? colors.success : colors.foreground,
                    textDecorationLine: (row as { strikethrough?: boolean }).strikethrough ? "line-through" : "none",
                    opacity: (row as { strikethrough?: boolean }).strikethrough ? 0.5 : 1,
                  },
                ]}>
                  {row.value}
                </Text>
              </View>
              {idx < arr.length - 1 && (
                <View
                  style={[
                    styles.rowDivider,
                    { backgroundColor: "rgba(255,255,255,0.06)" },
                  ]}
                />
              )}
            </View>
          ))}
        </GlassCard>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Order Timeline
        </Text>
        <GlassCard intensity={40} padding={18}>
          {TIMELINE.map((step, idx) => (
            <View key={step.label} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: step.done
                        ? purchase.status === "rejected" && idx === TIMELINE.length - 1
                          ? colors.destructive
                          : colors.success
                        : colors.muted,
                      borderColor: step.done
                        ? purchase.status === "rejected" && idx === TIMELINE.length - 1
                          ? colors.destructive + "44"
                          : colors.success + "44"
                        : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      step.done
                        ? purchase.status === "rejected" && idx === TIMELINE.length - 1
                          ? "close"
                          : "checkmark"
                        : "ellipse-outline"
                    }
                    size={10}
                    color={step.done ? "#000" : colors.mutedForeground}
                  />
                </View>
                {idx < TIMELINE.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: step.done
                          ? colors.success + "44"
                          : colors.border,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineLabel,
                    {
                      color: step.done ? colors.foreground : colors.mutedForeground,
                    },
                  ]}
                >
                  {step.label}
                </Text>
                <Text
                  style={[
                    styles.timelineDate,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {step.date}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  statusCard: { alignItems: "center", gap: 8 },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statusLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  orderAmount: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  orderSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  valAmount: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 4 },
  valGain: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  detailCard: { overflow: "hidden" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rowDivider: { height: 1, marginHorizontal: 16 },
  timelineItem: { flexDirection: "row", gap: 14, minHeight: 60 },
  timelineLeft: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: { flex: 1, width: 2, marginTop: 4, minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  timelineDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  notFound: { fontSize: 16, fontFamily: "Inter_500Medium", marginTop: 12 },
  backLink: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 12 },
  discountBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: "center" as const,
  },
  discountBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
