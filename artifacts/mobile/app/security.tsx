import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

export default function SecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [biometrics, setBiometrics] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  function handleChangePassword() {
    Alert.alert(
      "Change Password",
      "A password reset link will be sent to your registered email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: () =>
            Alert.alert("Sent", "Check your email for the reset link."),
        },
      ]
    );
  }

  function handleEnable2FA() {
    Alert.alert(
      "Enable 2FA",
      "Two-factor authentication adds an extra layer of security. You'll need an authenticator app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Up",
          onPress: () => setTwoFA(true),
        },
      ]
    );
  }

  const SESSIONS = [
    {
      device: "iPhone 15 Pro",
      location: "San Francisco, CA",
      time: "Active now",
      current: true,
    },
    {
      device: "MacBook Pro",
      location: "San Francisco, CA",
      time: "2 hours ago",
      current: false,
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
      <Pressable
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>
          Security
        </Text>
      </Pressable>

      {/* Security Score */}
      <GlassCard intensity={60} padding={20} style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
              SECURITY SCORE
            </Text>
            <Text style={[styles.scoreValue, { color: colors.success }]}>
              Good
            </Text>
          </View>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: colors.success + "44" },
            ]}
          >
            <Text style={[styles.scoreNum, { color: colors.success }]}>78</Text>
            <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>
              /100
            </Text>
          </View>
        </View>
        <Text style={[styles.scoreTip, { color: colors.mutedForeground }]}>
          Enable 2FA to reach 100/100
        </Text>
      </GlassCard>

      {/* Authentication */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Authentication
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.listCard}>
          <View style={styles.settingRow}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Ionicons
                name="finger-print"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Biometric Login
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Face ID / Touch ID
              </Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{
                false: colors.muted,
                true: colors.primary + "88",
              }}
              thumbColor={biometrics ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: "rgba(255,255,255,0.06)" },
            ]}
          />
          <View style={styles.settingRow}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: colors.success + "22" },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Two-Factor Authentication
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {twoFA ? "Enabled via Authenticator" : "Not enabled — recommended"}
              </Text>
            </View>
            <Switch
              value={twoFA}
              onValueChange={(v) => {
                if (v) handleEnable2FA();
                else setTwoFA(false);
              }}
              trackColor={{
                false: colors.muted,
                true: colors.success + "88",
              }}
              thumbColor={twoFA ? colors.success : colors.mutedForeground}
            />
          </View>
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: "rgba(255,255,255,0.06)" },
            ]}
          />
          <View style={styles.settingRow}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: colors.warning + "22" },
              ]}
            >
              <Ionicons
                name="notifications"
                size={18}
                color={colors.warning}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Login Alerts
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Notify on new device sign-ins
              </Text>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={setLoginAlerts}
              trackColor={{
                false: colors.muted,
                true: colors.warning + "88",
              }}
              thumbColor={
                loginAlerts ? colors.warning : colors.mutedForeground
              }
            />
          </View>
        </GlassCard>
      </View>

      {/* Password */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Password
        </Text>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={handleChangePassword}
        >
          <GlassCard intensity={40} padding={16}>
            <View style={styles.passwordRow}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.rowLabel, { color: colors.foreground }]}
                >
                  Change Password
                </Text>
                <Text
                  style={[styles.rowSub, { color: colors.mutedForeground }]}
                >
                  Last changed 90 days ago
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
      </View>

      {/* Active Sessions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Active Sessions
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.listCard}>
          {SESSIONS.map((s, idx, arr) => (
            <View key={s.device}>
              <View style={styles.sessionRow}>
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Ionicons
                    name={
                      s.device.includes("iPhone")
                        ? "phone-portrait"
                        : "laptop"
                    }
                    size={18}
                    color={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.sessionHeader}>
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      {s.device}
                    </Text>
                    {s.current && (
                      <View
                        style={[
                          styles.currentBadge,
                          { backgroundColor: colors.success + "22" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.currentText,
                            { color: colors.success },
                          ]}
                        >
                          This device
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.rowSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {s.location} · {s.time}
                  </Text>
                </View>
                {!s.current && (
                  <Pressable
                    onPress={() =>
                      Alert.alert("Sign Out", `Sign out ${s.device}?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Sign Out", style: "destructive" },
                      ])
                    }
                  >
                    <Text
                      style={[
                        styles.revokeText,
                        { color: colors.destructive },
                      ]}
                    >
                      Revoke
                    </Text>
                  </Pressable>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scoreCard: {},
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  scoreValue: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 4 },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
  },
  scoreNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  scoreMax: { fontSize: 11, fontFamily: "Inter_500Medium", alignSelf: "flex-end", paddingBottom: 4 },
  scoreTip: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  listCard: { overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowDivider: { height: 1, marginHorizontal: 16 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  sessionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  currentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  currentText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  revokeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
