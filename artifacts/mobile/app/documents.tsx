import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const DOCUMENTS = [
  {
    id: "d1",
    category: "Agreements",
    items: [
      {
        id: "i1",
        icon: "document-text" as const,
        title: "Share Purchase Agreement",
        desc: "Investor SPA — executed",
        date: "Jan 15, 2025",
        status: "signed",
        color: "#00c48c",
      },
      {
        id: "i2",
        icon: "shield" as const,
        title: "Accredited Investor Certificate",
        desc: "Form D — verified",
        date: "Jan 10, 2025",
        status: "signed",
        color: "#00c48c",
      },
      {
        id: "i3",
        icon: "reader" as const,
        title: "Private Placement Memorandum",
        desc: "PPM v3.1 — reviewed",
        date: "Dec 1, 2024",
        status: "viewed",
        color: "#00d4ff",
      },
    ],
  },
  {
    id: "d2",
    category: "Statements",
    items: [
      {
        id: "i4",
        icon: "stats-chart" as const,
        title: "Q1 2025 Portfolio Statement",
        desc: "Period: Jan–Mar 2025",
        date: "Apr 5, 2025",
        status: "available",
        color: "#f5a623",
      },
      {
        id: "i5",
        icon: "stats-chart" as const,
        title: "Q4 2024 Portfolio Statement",
        desc: "Period: Oct–Dec 2024",
        date: "Jan 10, 2025",
        status: "available",
        color: "#f5a623",
      },
    ],
  },
  {
    id: "d3",
    category: "Tax Documents",
    items: [
      {
        id: "i6",
        icon: "receipt" as const,
        title: "Form K-1 2024",
        desc: "Partnership income statement",
        date: "Mar 15, 2025",
        status: "available",
        color: "#8c96a9",
      },
    ],
  },
];

const STATUS_CONFIG = {
  signed: { label: "Signed", color: "#00c48c" },
  viewed: { label: "Viewed", color: "#00d4ff" },
  available: { label: "Available", color: "#f5a623" },
  pending: { label: "Pending", color: "#8c96a9" },
};

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  function handleOpen(title: string) {
    Alert.alert(title, "Document viewing is available in the full investor portal.", [
      { text: "OK" },
    ]);
  }

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
      <Pressable
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Documents
        </Text>
      </Pressable>

      <Text style={[styles.subTitle, { color: colors.mutedForeground }]}>
        Your investment agreements and statements
      </Text>

      {DOCUMENTS.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {section.category}
          </Text>
          <GlassCard intensity={40} padding={0} style={styles.docCard}>
            {section.items.map((doc, idx, arr) => {
              const sc =
                STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG];
              return (
                <View key={doc.id}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.docRow,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => handleOpen(doc.title)}
                  >
                    <View
                      style={[
                        styles.docIcon,
                        { backgroundColor: doc.color + "22" },
                      ]}
                    >
                      <Ionicons
                        name={doc.icon}
                        size={20}
                        color={doc.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.docTitle, { color: colors.foreground }]}
                      >
                        {doc.title}
                      </Text>
                      <Text
                        style={[
                          styles.docDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {doc.desc}
                      </Text>
                      <Text
                        style={[
                          styles.docDate,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {doc.date}
                      </Text>
                    </View>
                    <View style={styles.docRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: sc.color + "22" },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: sc.color }]}
                        >
                          {sc.label}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.mutedForeground}
                      />
                    </View>
                  </Pressable>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: "rgba(255,255,255,0.06)" },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </GlassCard>
        </View>
      ))}

      <GlassCard intensity={30} padding={16}>
        <View style={styles.infoRow}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={colors.mutedForeground}
          />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            All documents are encrypted and stored securely. Download via the
            investor portal.
          </Text>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  subTitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  docCard: { overflow: "hidden" },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  docTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  docDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  docRight: { alignItems: "flex-end", gap: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  rowDivider: { height: 1, marginHorizontal: 16 },
  infoRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
