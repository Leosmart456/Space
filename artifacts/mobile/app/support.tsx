import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const SUPPORT_EMAIL = "support@spacexpreipo.com";
const SUPPORT_PHONE = "+1 (310) 363-6000";

const FAQS = [
  {
    q: "When can I sell my SPCX shares?",
    a: "Shares become tradeable after the IPO event. You'll be notified when trading opens.",
  },
  {
    q: "How is my share price determined?",
    a: "The pre-IPO price is set by the latest valuation round and updated by our admin team.",
  },
  {
    q: "What is the minimum investment?",
    a: "The minimum reservation is $2,000 USD. There is no maximum.",
  },
  {
    q: "How do I transfer shares after IPO?",
    a: "After IPO, you can initiate a transfer to any major brokerage from the Portfolio tab.",
  },
  {
    q: "Is my investment FDIC insured?",
    a: "No. This is a private equity investment and is not covered by FDIC insurance.",
  },
  {
    q: "How do I contact support?",
    a: `Email us at ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE}. We respond within 1 business day.`,
  },
];

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Open email client with pre-filled message
      const subject = encodeURIComponent("SpaceX Pre-IPO Support Request");
      const body = encodeURIComponent(message.trim());
      const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setSent(true);
        setMessage("");
      } else {
        Alert.alert(
          "Message Ready",
          `Please email us at ${SUPPORT_EMAIL} with your question.`
        );
      }
    } catch {
      Alert.alert("Error", "Could not open email client. Please email us directly.");
    } finally {
      setSending(false);
    }
  }

  function handleEmailPress() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      Alert.alert("Email", SUPPORT_EMAIL, [{ text: "OK" }]);
    });
  }

  function handlePhonePress() {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert("Phone", SUPPORT_PHONE, [{ text: "OK" }]);
    });
  }

  const CONTACT = [
    {
      icon: "mail-outline" as const,
      label: "Email Support",
      value: SUPPORT_EMAIL,
      color: "#00d4ff",
      onPress: handleEmailPress,
    },
    {
      icon: "call-outline" as const,
      label: "Phone",
      value: SUPPORT_PHONE,
      color: "#00c48c",
      onPress: handlePhonePress,
    },
    {
      icon: "time-outline" as const,
      label: "Hours",
      value: "Mon–Fri, 9am–6pm PT",
      color: "#f5a623",
      onPress: null,
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
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Help & Support
        </Text>
      </Pressable>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Contact Us
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.listCard}>
          {CONTACT.map((item, idx, arr) => (
            <View key={item.label}>
              <Pressable
                style={({ pressed }) => [
                  styles.contactRow,
                  { opacity: pressed && item.onPress ? 0.7 : 1 },
                ]}
                onPress={item.onPress ?? undefined}
              >
                <View
                  style={[
                    styles.contactIcon,
                    { backgroundColor: item.color + "22" },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.contactLabel, { color: colors.mutedForeground }]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.contactValue,
                      {
                        color: item.onPress ? colors.primary : colors.foreground,
                        textDecorationLine: item.onPress ? "underline" : "none",
                      },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
                {item.onPress && (
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={colors.mutedForeground}
                  />
                )}
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
          ))}
        </GlassCard>
      </View>

      {/* Send Message */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Send a Message
        </Text>
        <GlassCard intensity={40} padding={16}>
          <TextInput
            style={[
              styles.messageInput,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  message.trim() ? colors.primary : colors.muted,
                opacity: pressed || sending ? 0.8 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            <Ionicons
              name="send"
              size={16}
              color={message.trim() ? "#000" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.sendBtnText,
                {
                  color: message.trim() ? "#000" : colors.mutedForeground,
                },
              ]}
            >
              {sending ? "Opening..." : sent ? "Email Opened ✓" : "Send via Email"}
            </Text>
          </Pressable>
          <Text style={[styles.emailNote, { color: colors.mutedForeground }]}>
            Opens your email app with a pre-filled message to {SUPPORT_EMAIL}
          </Text>
        </GlassCard>
      </View>

      {/* FAQs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          FAQs
        </Text>
        {FAQS.map((faq, idx) => (
          <Pressable
            key={idx}
            onPress={() =>
              setExpanded(expanded === faq.q ? null : faq.q)
            }
          >
            <GlassCard intensity={40} padding={16}>
              <View style={styles.faqHeader}>
                <Text
                  style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}
                >
                  {faq.q}
                </Text>
                <Ionicons
                  name={
                    expanded === faq.q ? "chevron-up" : "chevron-down"
                  }
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              {expanded === faq.q && (
                <Text
                  style={[
                    styles.faqA,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {faq.a}
                </Text>
              )}
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  listCard: { overflow: "hidden" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  contactValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  rowDivider: { height: 1, marginHorizontal: 16 },
  messageInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 110,
    marginBottom: 12,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 8,
  },
  sendBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emailNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  faqQ: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  faqA: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 10,
  },
});
