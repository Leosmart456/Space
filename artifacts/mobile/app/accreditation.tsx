import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
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

const REQUIREMENTS = [
  {
    icon: "cash-outline" as const,
    title: "Annual Income ≥ $200,000",
    desc: "Or $300,000 combined with spouse for last 2 years",
    color: "#00d4ff",
  },
  {
    icon: "wallet-outline" as const,
    title: "Net Worth ≥ $1,000,000",
    desc: "Excluding primary residence",
    color: "#00c48c",
  },
  {
    icon: "business-outline" as const,
    title: "Licensed Professional",
    desc: "Series 7, 65, or 82 license holder",
    color: "#f5a623",
  },
  {
    icon: "people-outline" as const,
    title: "Knowledgeable Employee",
    desc: "Employee of a registered investment fund",
    color: "#8c96a9",
  },
];

const TIMELINE_STEPS = [
  {
    key: "submitted",
    label: "Application Submitted",
    desc: "Your investor profile has been received",
    done: true,
  },
  {
    key: "review",
    label: "KYC & Document Review",
    desc: "Identity and income verification in progress",
    done: true,
  },
  {
    key: "verification",
    label: "Accreditation Verified",
    desc: "Status confirmed — eligible to purchase shares",
    done: true,
    forStatus: "yes" as const,
  },
];

export default function AccreditationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const status = user?.accreditedStatus ?? "pending";

  const statusMap = {
    yes: {
      label: "Verified Accredited Investor",
      sublabel: "You meet SEC Rule 501 accreditation requirements",
      color: colors.success,
      icon: "shield-checkmark" as const,
      gradColors: ["#003d2a", "#080c12"] as const,
    },
    pending: {
      label: "Verification In Progress",
      sublabel: "Our team is reviewing your investor profile",
      color: colors.warning,
      icon: "time" as const,
      gradColors: ["#3d2e00", "#080c12"] as const,
    },
    no: {
      label: "Accreditation Not Approved",
      sublabel: "You do not currently meet SEC accreditation criteria",
      color: colors.destructive,
      icon: "close-circle" as const,
      gradColors: ["#3d0000", "#080c12"] as const,
    },
  }[status];

  function handleAppeal() {
    Alert.alert(
      "Appeal Decision",
      "You can appeal this decision by contacting our investor relations team.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          onPress: () => router.push("/support" as any),
        },
      ]
    );
  }

  const steps = TIMELINE_STEPS.map((s) => ({
    ...s,
    done: s.forStatus === "yes" ? status === "yes" : s.done,
    failed: s.forStatus === "yes" && status === "no",
  }));

  const statusItems =
    status === "yes"
      ? [
          { icon: "checkmark-circle" as const, color: colors.success, text: "You can purchase SPCX shares immediately" },
          { icon: "checkmark-circle" as const, color: colors.success, text: "No investment cap applies to your account" },
          { icon: "checkmark-circle" as const, color: colors.success, text: "Status valid for 12 months from verification date" },
        ]
      : status === "pending"
      ? [
          { icon: "time" as const, color: colors.warning, text: "Share purchases are on hold until verified" },
          { icon: "time" as const, color: colors.warning, text: "Review typically takes 2–3 business days" },
          { icon: "time" as const, color: colors.warning, text: "You'll be notified by email when complete" },
        ]
      : [
          { icon: "close-circle" as const, color: colors.destructive, text: "You cannot currently purchase SPCX shares" },
          { icon: "information-circle" as const, color: colors.warning, text: "You may appeal this decision via Support" },
          { icon: "information-circle" as const, color: colors.warning, text: "Re-application available after 90 days" },
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
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Accreditation
        </Text>
      </Pressable>

      {/* Status Hero */}
      <GlassCard intensity={70} padding={0} style={styles.heroCard}>
        <LinearGradient
          colors={statusMap.gradColors as any}
          style={styles.heroGrad}
        >
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: statusMap.color + "22" },
            ]}
          >
            <Ionicons name={statusMap.icon} size={44} color={statusMap.color} />
          </View>
          <Text style={[styles.heroLabel, { color: statusMap.color }]}>
            {statusMap.label}
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {statusMap.sublabel}
          </Text>

          {/* Status pill */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusMap.color + "22",
                borderColor: statusMap.color + "44",
              },
            ]}
          >
            <View
              style={[styles.pillDot, { backgroundColor: statusMap.color }]}
            />
            <Text style={[styles.pillText, { color: statusMap.color }]}>
              {status === "yes"
                ? "ACCREDITED"
                : status === "pending"
                ? "UNDER REVIEW"
                : "NOT APPROVED"}
            </Text>
          </View>
        </LinearGradient>
      </GlassCard>

      {/* What this means */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          What This Means
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.listCard}>
          {statusItems.map((item, idx, arr) => (
            <View key={idx}>
              <View style={styles.benefitRow}>
                <Ionicons name={item.icon} size={18} color={item.color} />
                <Text style={[styles.benefitText, { color: colors.foreground }]}>
                  {item.text}
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

      {/* Verification Timeline */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Verification Progress
        </Text>
        <GlassCard intensity={40} padding={18}>
          {steps.map((step, idx) => (
            <View key={step.key} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: step.failed
                        ? colors.destructive
                        : step.done
                        ? colors.success
                        : colors.muted,
                      borderColor: step.failed
                        ? colors.destructive + "44"
                        : step.done
                        ? colors.success + "44"
                        : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      step.failed
                        ? "close"
                        : step.done
                        ? "checkmark"
                        : "ellipse-outline"
                    }
                    size={11}
                    color={
                      step.failed || step.done ? "#000" : colors.mutedForeground
                    }
                  />
                </View>
                {idx < steps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor:
                          step.done || step.failed
                            ? step.failed
                              ? colors.destructive + "44"
                              : colors.success + "44"
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
                      color:
                        step.done || step.failed
                          ? colors.foreground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {step.label}
                </Text>
                <Text
                  style={[
                    styles.timelineDesc,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>

      {/* Requirements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          SEC Accreditation Criteria
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.listCard}>
          {REQUIREMENTS.map((req, idx, arr) => (
            <View key={req.title}>
              <View style={styles.reqRow}>
                <View
                  style={[
                    styles.reqIcon,
                    { backgroundColor: req.color + "22" },
                  ]}
                >
                  <Ionicons name={req.icon} size={18} color={req.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.reqTitle, { color: colors.foreground }]}
                  >
                    {req.title}
                  </Text>
                  <Text
                    style={[styles.reqDesc, { color: colors.mutedForeground }]}
                  >
                    {req.desc}
                  </Text>
                </View>
                {status === "yes" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success}
                  />
                )}
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

      {/* Action buttons */}
      {status === "no" && (
        <Pressable
          style={({ pressed }) => [
            styles.appealBtn,
            { borderColor: colors.warning + "44", opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleAppeal}
        >
          <Ionicons name="mail-outline" size={18} color={colors.warning} />
          <Text style={[styles.appealText, { color: colors.warning }]}>
            Appeal This Decision
          </Text>
        </Pressable>
      )}

      {status === "pending" && (
        <GlassCard intensity={30} padding={16}>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Need help? Our investor relations team is available Mon–Fri 9am–6pm
              PT.{" "}
              <Text
                style={{ color: colors.primary }}
                onPress={() => router.push("/support" as any)}
              >
                Contact support →
              </Text>
            </Text>
          </View>
        </GlassCard>
      )}

      {status === "yes" && (
        <GlassCard intensity={30} padding={16}>
          <View style={styles.infoRow}>
            <Ionicons
              name="shield-outline"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Accreditation is verified annually. You'll receive a renewal
              notice 30 days before expiry.
            </Text>
          </View>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  heroCard: { overflow: "hidden" },
  heroGrad: { padding: 28, alignItems: "center", gap: 10 },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  heroLabel: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  listCard: { overflow: "hidden" },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  benefitText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  rowDivider: { height: 1, marginHorizontal: 16 },
  timelineItem: { flexDirection: "row", gap: 14, minHeight: 56 },
  timelineLeft: { alignItems: "center", width: 24 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: { flex: 1, width: 2, marginTop: 4, minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  timelineDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reqIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  reqTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reqDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  appealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  appealText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  infoRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
