import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const BG_IMAGE = require("@/assets/images/spacex_bg_1.jpg");
const LOGO_IMAGE = require("@/assets/images/icon.png");

type Mode = "password" | "otp-request" | "otp-verify";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, requestOtp, signInWithOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("password");

  const isWeb = Platform.OS === "web";

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        Alert.alert(
          "Sign In Failed",
          result.error ?? "Invalid email or password. Please try again."
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestOtp() {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await requestOtp(email.trim());
      if (result.ok) {
        setMode("otp-verify");
        Alert.alert(
          "Code Sent",
          `A 6-digit sign-in code has been sent to ${email.trim()}.`
        );
      } else {
        Alert.alert("Error", result.error ?? "Failed to send code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim() || otpCode.length < 6) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    try {
      const result = await signInWithOtp(email.trim(), otpCode.trim());
      if (!result.ok) {
        Alert.alert("Invalid Code", result.error ?? "Invalid or expired code. Please try again.");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      <ImageBackground
        source={BG_IMAGE}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.75)", "rgba(0,0,0,0.96)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: isWeb ? 67 : insets.top + 40,
              paddingBottom: isWeb ? 34 : insets.bottom + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={[styles.logoTitle, { color: colors.foreground }]}>
            SpaceX
          </Text>
          <Text style={[styles.logoSub, { color: colors.primary }]}>
            PRE-IPO INVESTOR PLATFORM
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card + "ee", borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {mode === "otp-verify" ? "Enter Your Code" : "Investor Sign In"}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {mode === "otp-verify"
              ? `We sent a 6-digit code to ${email}`
              : "Access your private share portfolio"}
          </Text>

          {mode === "otp-verify" ? (
            /* OTP Code Entry */
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Verification Code
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: colors.input, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="000000"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                    autoFocus
                  />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.signInBtn,
                  {
                    backgroundColor:
                      otpCode.length >= 6 ? colors.primary : colors.muted,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={handleVerifyOtp}
                disabled={isLoading || otpCode.length < 6}
              >
                <Text style={[styles.signInText, { color: colors.primaryForeground }]}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setMode("password"); setOtpCode(""); }}
                style={({ pressed }) => [styles.applyLink, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.applyText, { color: colors.mutedForeground }]}>
                  <Text style={{ color: colors.primary }}>← Back to sign in</Text>
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Email + Password */
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Email
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: colors.input, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="investor@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Password
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { backgroundColor: colors.input, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Sign In Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.signInBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <Text style={[styles.signInText, { color: colors.primaryForeground }]}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Text>
              </Pressable>

              {/* OTP alternative */}
              <Pressable
                onPress={handleRequestOtp}
                disabled={isLoading}
                style={({ pressed }) => [styles.otpLink, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.applyText, { color: colors.mutedForeground }]}>
                  Sign in with{" "}
                  <Text style={{ color: colors.primary }}>email code instead</Text>
                </Text>
              </Pressable>

              {/* Apply link */}
              <Pressable
                onPress={() => router.push("/apply")}
                style={({ pressed }) => [styles.applyLink, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.applyText, { color: colors.mutedForeground }]}>
                  Not an investor yet?{" "}
                  <Text style={{ color: colors.primary }}>Apply for access</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </View>

          {/* Bottom disclaimer */}
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            For accredited investors only. Not a securities offering.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 32,
  },
  brand: { alignItems: "center", gap: 12 },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: { width: 52, height: 52 },
  logoTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  logoSub: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 3 },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 16,
  },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  fields: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  signInBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  otpLink: { alignItems: "center", marginTop: -4 },
  applyLink: { alignItems: "center" },
  applyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
