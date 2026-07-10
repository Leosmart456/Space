import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
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

const INCOME_OPTIONS = [
  "Under $50K",
  "$50K–$100K",
  "$100K–$200K",
  "$200K–$500K",
  "$500K+",
];
const NETWORTH_OPTIONS = [
  "Under $500K",
  "$500K–$1M",
  "$1M–$2M",
  "$2M–$5M",
  "$5M+",
];
const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-Employed",
  "Retired",
  "Student",
  "Other",
];
const EXPERIENCE_OPTIONS = [
  "No experience",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];
const SOURCE_OPTIONS = [
  "Employment income",
  "Business income",
  "Investments",
  "Inheritance",
  "Other",
];

export default function ApplyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, verifyRegistration } = useAuth();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("United States");
  const [income, setIncome] = useState("");
  const [netWorth, setNetWorth] = useState("");
  const [employment, setEmployment] = useState("");
  const [experience, setExperience] = useState("");
  const [source, setSource] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  // Steps: 0=Personal, 1=Financial, 2=Review+Submit, 3=OTP Verify
  const steps = ["Personal Info", "Financial Profile", "Submit"];

  const canNextStep0 =
    fullName.trim().length > 1 &&
    email.includes("@") &&
    phone.length > 6 &&
    dateOfBirth.length > 4 &&
    country.trim().length > 1;

  const canNextStep1 =
    income !== "" &&
    netWorth !== "" &&
    employment !== "" &&
    experience !== "" &&
    source !== "";

  async function handleSubmit() {
    if (!canNextStep1 || isLoading) return;
    setIsLoading(true);
    try {
      const result = await register({
        fullName,
        email,
        phone,
        annualIncome: income,
        netWorth,
        country,
        dateOfBirth,
        employmentStatus: employment,
        sourceOfFunds: source,
        investmentExperience: experience,
        accreditationStatus: "yes",
      });
      if (result.ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep(3);
        Alert.alert(
          "Check Your Email",
          `We sent a 6-digit verification code to ${email}. Enter it below to complete your registration.`
        );
      } else {
        Alert.alert("Error", result.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim() || otpCode.length < 6 || isLoading) return;
    setIsLoading(true);
    try {
      const result = await verifyRegistration(email, otpCode.trim());
      if (result.ok) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Application Submitted!",
          "Your account is under review. Once approved, you'll be able to purchase shares.",
          [{ text: "Go to Dashboard", onPress: () => router.replace("/(tabs)") }]
        );
      } else {
        Alert.alert("Invalid Code", result.error ?? "Invalid or expired code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: isWeb ? 100 : insets.bottom + 80 },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      {/* Back button */}
      <Pressable
        onPress={() => {
          if (step === 3) {
            setStep(2);
            setOtpCode("");
          } else if (step > 0) {
            setStep((s) => s - 1);
          } else {
            router.back();
          }
        }}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
      </Pressable>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === 3 ? "Verify Email" : "Apply for Access"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {step === 3
            ? `Enter the 6-digit code sent to ${email}`
            : "Join thousands of accredited investors"}
        </Text>
      </View>

      {/* Step indicators (not shown on OTP step) */}
      {step < 3 && (
        <View style={styles.stepBar}>
          {steps.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      i < step
                        ? colors.primary
                        : i === step
                        ? colors.primary
                        : colors.muted,
                    borderColor:
                      i === step ? colors.primary : "transparent",
                  },
                ]}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      {
                        color:
                          i === step ? colors.primaryForeground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: i === step ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {s}
              </Text>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: i < step ? colors.primary : colors.border },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <View style={styles.form}>
          <InputField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Smith"
            icon="person-outline"
            colors={colors}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <InputField
            inputRef={emailRef}
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="investor@example.com"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            colors={colors}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
          />
          <InputField
            inputRef={phoneRef}
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            icon="call-outline"
            keyboardType="phone-pad"
            autoCapitalize="none"
            colors={colors}
            returnKeyType="next"
            onSubmitEditing={() => dobRef.current?.focus()}
          />
          <InputField
            inputRef={dobRef}
            label="Date of Birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="1990-01-15"
            icon="calendar-outline"
            autoCapitalize="none"
            colors={colors}
            returnKeyType="next"
            onSubmitEditing={() => countryRef.current?.focus()}
          />
          <InputField
            inputRef={countryRef}
            label="Country of Residence"
            value={country}
            onChangeText={setCountry}
            placeholder="United States"
            icon="globe-outline"
            colors={colors}
            returnKeyType="done"
          />
        </View>
      )}

      {/* Step 1: Financial Profile */}
      {step === 1 && (
        <View style={styles.form}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Annual Income
          </Text>
          <View style={styles.optionGrid}>
            {INCOME_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor:
                      income === opt ? colors.primary + "22" : colors.card,
                    borderColor:
                      income === opt ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setIncome(opt)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: income === opt ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
            Net Worth (excl. primary residence)
          </Text>
          <View style={styles.optionGrid}>
            {NETWORTH_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor:
                      netWorth === opt ? colors.primary + "22" : colors.card,
                    borderColor:
                      netWorth === opt ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setNetWorth(opt)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: netWorth === opt ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
            Employment Status
          </Text>
          <View style={styles.optionGrid}>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor:
                      employment === opt ? colors.primary + "22" : colors.card,
                    borderColor:
                      employment === opt ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setEmployment(opt)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: employment === opt ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
            Investment Experience
          </Text>
          <View style={styles.optionGrid}>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor:
                      experience === opt ? colors.primary + "22" : colors.card,
                    borderColor:
                      experience === opt ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setExperience(opt)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: experience === opt ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
            Source of Funds
          </Text>
          <View style={styles.optionGrid}>
            {SOURCE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor:
                      source === opt ? colors.primary + "22" : colors.card,
                    borderColor:
                      source === opt ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setSource(opt)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: source === opt ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={[
              styles.accreditedNote,
              { backgroundColor: colors.primary + "0d", borderColor: colors.primary + "22" },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
            <Text style={[styles.accreditedText, { color: colors.mutedForeground }]}>
              Accredited investors have $200K+ annual income or $1M+ net worth (excluding primary residence)
            </Text>
          </View>
        </View>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <View style={styles.form}>
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              Application Summary
            </Text>
            {[
              { label: "Name", value: fullName },
              { label: "Email", value: email },
              { label: "Phone", value: phone },
              { label: "Date of Birth", value: dateOfBirth },
              { label: "Country", value: country },
              { label: "Annual Income", value: income },
              { label: "Net Worth", value: netWorth },
              { label: "Employment", value: employment },
              { label: "Experience", value: experience },
              { label: "Source of Funds", value: source },
            ].map((row) => (
              <View key={row.label} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  {row.label}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={[
              styles.accreditedNote,
              { backgroundColor: colors.warning + "0d", borderColor: colors.warning + "22" },
            ]}
          >
            <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
            <Text style={[styles.accreditedText, { color: colors.mutedForeground }]}>
              After submitting, check your email for a 6-digit verification code to activate your account.
            </Text>
          </View>
        </View>
      )}

      {/* Step 3: OTP Verification */}
      {step === 3 && (
        <View style={styles.form}>
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
              <Ionicons name="keypad-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
          </View>
          <View
            style={[
              styles.accreditedNote,
              { backgroundColor: colors.primary + "0d", borderColor: colors.primary + "22" },
            ]}
          >
            <Ionicons name="mail-outline" size={14} color={colors.primary} />
            <Text style={[styles.accreditedText, { color: colors.mutedForeground }]}>
              Check {email} for your verification code. It expires in 15 minutes.
            </Text>
          </View>
        </View>
      )}

      {/* Next / Submit / Verify Button */}
      <Pressable
        style={({ pressed }) => [
          styles.nextBtn,
          {
            backgroundColor:
              (step === 0 && canNextStep0) ||
              (step === 1 && canNextStep1) ||
              step === 2 ||
              (step === 3 && otpCode.length >= 6)
                ? colors.primary
                : colors.muted,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => {
          if (step === 0 && canNextStep0) setStep(1);
          else if (step === 1 && canNextStep1) setStep(2);
          else if (step === 2) handleSubmit();
          else if (step === 3) handleVerifyOtp();
        }}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.nextText,
            {
              color:
                (step === 0 && canNextStep0) ||
                (step === 1 && canNextStep1) ||
                step === 2 ||
                (step === 3 && otpCode.length >= 6)
                  ? colors.primaryForeground
                  : colors.mutedForeground,
            },
          ]}
        >
          {step === 3
            ? isLoading
              ? "Verifying..."
              : "Verify & Activate"
            : step === 2
            ? isLoading
              ? "Submitting..."
              : "Submit Application"
            : "Continue"}
        </Text>
        {step < 2 && (
          <Ionicons
            name="arrow-forward"
            size={18}
            color={
              (step === 0 && canNextStep0) || (step === 1 && canNextStep1)
                ? colors.primaryForeground
                : colors.mutedForeground
            }
          />
        )}
      </Pressable>

      {step === 3 && (
        <Pressable
          onPress={() => {
            // Resend code by going back and resubmitting
            Alert.alert(
              "Resend Code",
              "Go back and resubmit your application to receive a new code.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Go Back", onPress: () => { setStep(2); setOtpCode(""); } },
              ]
            );
          }}
          style={({ pressed }) => [{ alignItems: "center", opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.nextText, { color: colors.primary, fontSize: 13 }]}>
            Resend verification code
          </Text>
        </Pressable>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  colors,
  inputRef,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <Ionicons name={icon} size={18} color={colors.mutedForeground} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "words"}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === "done"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  header: { gap: 4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stepBar: { flexDirection: "row", alignItems: "center" },
  stepItem: { flex: 1, alignItems: "center", gap: 4, position: "relative" },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  stepNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  stepLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  stepLine: {
    position: "absolute",
    top: 14,
    left: "50%",
    right: "-50%",
    height: 1,
    zIndex: -1,
  },
  form: { gap: 16 },
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
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  accreditedNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  accreditedText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 12, fontFamily: "Inter_500Medium", maxWidth: "55%", textAlign: "right" },
  nextBtn: {
    height: 54,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
