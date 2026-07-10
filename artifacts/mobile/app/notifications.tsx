import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

// All icons use Ionicons; colors are monochromatic (no colorful boxes)
const NOTIFICATIONS = [
  {
    id: "n1",
    icon: "checkmark-circle-outline" as const,
    title: "Order Confirmed",
    body: "Your reservation of 192.3 SPCX shares has been confirmed.",
    time: "2 days ago",
    read: false,
  },
  {
    id: "n2",
    icon: "rocket-outline" as const,
    title: "Starship Update",
    body: "Starship has successfully completed its 7th integrated flight test.",
    time: "3 days ago",
    read: false,
  },
  {
    id: "n3",
    icon: "trending-up-outline" as const,
    title: "Price Update",
    body: "SPCX share price updated to $130 following latest valuation round.",
    time: "1 week ago",
    read: true,
  },
  {
    id: "n4",
    icon: "shield-checkmark-outline" as const,
    title: "Accreditation Verified",
    body: "Your accredited investor status has been verified. You may now purchase shares.",
    time: "2 weeks ago",
    read: true,
  },
];

const SETTINGS = [
  { label: "Order Updates", sub: "Status changes on your purchases" },
  { label: "Market Alerts", sub: "Price and valuation updates" },
  { label: "Company News", sub: "SpaceX launches and announcements" },
  { label: "Email Digest", sub: "Weekly portfolio summary" },
];

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "settings">("inbox");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Order Updates": true,
    "Market Alerts": true,
    "Company News": false,
    "Email Digest": true,
  });

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

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
      {/* Back / Header */}
      <View style={styles.headerRow}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Notifications
        </Text>
        {unreadCount > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        ) : (
          <View style={styles.badgePlaceholder} />
        )}
      </View>

      {/* Tab Toggle */}
      <View
        style={[
          styles.tabToggle,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {(["inbox", "settings"] as const).map((t) => (
          <Pressable
            key={t}
            style={[
              styles.tabBtn,
              tab === t && { backgroundColor: colors.primary + "22" },
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === t ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t === "inbox" ? "Inbox" : "Settings"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Inbox */}
      {tab === "inbox" && (
        <View style={styles.section}>
          <GlassCard intensity={40} padding={0} style={styles.notifListCard}>
            {NOTIFICATIONS.map((n, idx) => (
              <View key={n.id}>
                <View
                  style={[
                    styles.notifRow,
                    !n.read && { backgroundColor: colors.primary + "08" },
                  ]}
                >
                  {/* Monochromatic icon box */}
                  <View
                    style={[
                      styles.notifIcon,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Ionicons
                      name={n.icon}
                      size={18}
                      color={n.read ? colors.mutedForeground : colors.foreground}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.notifHeader}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: n.read ? colors.mutedForeground : colors.foreground },
                        ]}
                      >
                        {n.title}
                      </Text>
                      {!n.read && (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.notifBody, { color: colors.mutedForeground }]}
                    >
                      {n.body}
                    </Text>
                    <Text
                      style={[styles.notifTime, { color: colors.mutedForeground }]}
                    >
                      {n.time}
                    </Text>
                  </View>
                </View>
                {idx < NOTIFICATIONS.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: "rgba(255,255,255,0.06)" },
                    ]}
                  />
                )}
              </View>
            ))}
          </GlassCard>
        </View>
      )}

      {/* Settings */}
      {tab === "settings" && (
        <View style={styles.section}>
          <GlassCard intensity={40} padding={0} style={styles.settingsCard}>
            {SETTINGS.map((s, idx, arr) => (
              <View key={s.label}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.settingLabel, { color: colors.foreground }]}
                    >
                      {s.label}
                    </Text>
                    <Text
                      style={[styles.settingSub, { color: colors.mutedForeground }]}
                    >
                      {s.sub}
                    </Text>
                  </View>
                  <Switch
                    value={toggles[s.label] ?? false}
                    onValueChange={(v) =>
                      setToggles((prev) => ({ ...prev, [s.label]: v }))
                    }
                    trackColor={{
                      false: colors.muted,
                      true: colors.primary + "88",
                    }}
                    thumbColor={
                      toggles[s.label] ? colors.primary : colors.mutedForeground
                    }
                  />
                </View>
                {idx < arr.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: "rgba(255,255,255,0.06)" },
                    ]}
                  />
                )}
              </View>
            ))}
          </GlassCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  badgePlaceholder: { width: 22 },
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
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { gap: 10 },
  notifListCard: { overflow: "hidden" },
  notifRow: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    alignItems: "flex-start",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  notifBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  settingsCard: { overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settingSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
});
