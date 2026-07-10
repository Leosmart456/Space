import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Purchase } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface PurchaseCardProps {
  purchase: Purchase;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
  const colors = useColors();
  const router = useRouter();

  const statusConfig = {
    confirmed: {
      label: "Confirmed",
      color: colors.success,
      icon: "checkmark-circle" as const,
      bg: colors.success + "18",
    },
    pending_review: {
      label: "Pending Review",
      color: colors.warning,
      icon: "time" as const,
      bg: colors.warning + "18",
    },
    rejected: {
      label: "Rejected",
      color: colors.destructive,
      icon: "close-circle" as const,
      bg: colors.destructive + "18",
    },
  }[purchase.status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={() => router.push(`/purchase/${purchase.id}` as any)}
    >
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: statusConfig.bg }]}>
          <Ionicons
            name={statusConfig.icon}
            size={20}
            color={statusConfig.color}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.amount, { color: colors.foreground }]}>
            {formatCurrency(purchase.amountUsd)}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {purchase.requestedShares.toFixed(2)} shares @ ${purchase.pricePerShare}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(purchase.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.color }]}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.mutedForeground}
          style={{ marginTop: 4 }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1, gap: 3 },
  amount: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
