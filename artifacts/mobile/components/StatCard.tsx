import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function StatCard({
  label,
  value,
  subValue,
  change,
  icon,
}: StatCardProps) {
  const colors = useColors();

  const changePositive = change !== undefined && change >= 0;
  const changeColor = changePositive ? colors.success : colors.destructive;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        {icon && (
          <Ionicons name={icon} size={16} color={colors.mutedForeground} />
        )}
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <View style={styles.footer}>
        {subValue && (
          <Text style={[styles.subValue, { color: colors.mutedForeground }]}>
            {subValue}
          </Text>
        )}
        {change !== undefined && (
          <View style={[styles.changeBadge, { backgroundColor: changeColor + "22" }]}>
            <Ionicons
              name={changePositive ? "trending-up" : "trending-down"}
              size={11}
              color={changeColor}
            />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changePositive ? "+" : ""}
              {change.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  subValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
