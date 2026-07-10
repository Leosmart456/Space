import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQuery } from "@tanstack/react-query";

import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getPriceQuote } from "@/lib/api";

const PRESETS = [
  { label: "$5k", value: 5000 },
  { label: "$10k", value: 10000 },
  { label: "$25k", value: 25000 },
  { label: "$50k", value: 50000 },
  { label: "$100k", value: 100000 },
];

function fmtVal(v: number | undefined): string {
  if (v == null || v === 0) return "—";
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  return `${v.toLocaleString()}`;
}

export default function BuyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sharePrice, addPurchase, user, refreshData } = useAuth();
  const { data: quote } = useQuery({ queryKey: ["priceQuote"], queryFn: getPriceQuote, staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
  const [amount, setAmount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  // Snapshot submitted values so success screen renders correctly after amount is cleared
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [submittedShares, setSubmittedShares] = useState(0);
  const [submittedDiscount, setSubmittedDiscount] = useState(0);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const BULK_DISCOUNT_MIN_SHARES = 20;
  const BULK_DISCOUNT_PERCENT = 20;

  const minInvestment = 2000;
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const requestedShares = numericAmount > 0 && sharePrice > 0 ? numericAmount / sharePrice : 0;
  const discountApplies = requestedShares > BULK_DISCOUNT_MIN_SHARES;
  const discountAmount = discountApplies ? numericAmount * (BULK_DISCOUNT_PERCENT / 100) : 0;
  const finalAmount = numericAmount - discountAmount;
  const isValid = numericAmount >= minInvestment && agreed;

  function formatAmount(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("en-US");
  }

  function handleReview() {
    if (!isValid) return;
    if (user?.accreditedStatus !== "yes") {
      Alert.alert(
        "Verification Required",
        "Your accredited investor status must be verified before purchasing.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!user?.isEnabled) {
      Alert.alert(
        "Account Pending",
        "Your account is still under review. You will be notified once approved.",
        [{ text: "OK" }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReview(true);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    // Snapshot before clearing so success screen renders correctly
    const snapAmount = numericAmount;
    const snapShares = requestedShares;
    try {
      await addPurchase(Math.round(requestedShares * 10000) / 10000, true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedAmount(snapAmount);
      setSubmittedShares(snapShares);
      setSubmittedDiscount(discountApplies ? Math.round(snapAmount * (BULK_DISCOUNT_PERCENT / 100) * 100) / 100 : 0);
      setShowReview(false);
      setOrderSuccess(true);
      setAmount("");
      setAgreed(false);
    } catch (e) {
      Alert.alert("Error", (e as Error).message ?? "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderSuccess) {
    return (
      <View
        style={[
          styles.successScreen,
          { backgroundColor: colors.background, paddingTop: topPad + 40 },
        ]}
      >
        <View
          style={[
            styles.successIcon,
            { backgroundColor: colors.success + "22" },
          ]}
        >
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Order Submitted!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Your reservation is under review. You'll receive payment instructions by email within 2–3 business days.
        </Text>
        <GlassCard intensity={50} padding={18} style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={[styles.srLabel, { color: colors.mutedForeground }]}>
              Shares Requested
            </Text>
            <Text style={[styles.srValue, { color: colors.foreground }]}>
              {submittedShares.toFixed(4)} SPCX
            </Text>
          </View>
          {submittedDiscount > 0 ? (
            <>
              <View style={styles.successRow}>
                <Text style={[styles.srLabel, { color: colors.mutedForeground }]}>
                  Original Amount
                </Text>
                <Text style={[styles.srValue, { color: colors.mutedForeground, textDecorationLine: "line-through" }]}>
                  ${submittedAmount > 0 ? submittedAmount.toLocaleString() : "—"}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.srLabel, { color: colors.success }]}>
                  20% Bulk Discount
                </Text>
                <Text style={[styles.srValue, { color: colors.success }]}>
                  -${submittedDiscount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.srLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  You Pay
                </Text>
                <Text style={[styles.srValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  ${(submittedAmount - submittedDiscount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.successRow}>
              <Text style={[styles.srLabel, { color: colors.mutedForeground }]}>
                Amount
              </Text>
              <Text style={[styles.srValue, { color: colors.foreground }]}>
                ${submittedAmount > 0 ? submittedAmount.toLocaleString() : "—"}
              </Text>
            </View>
          )}
          <View style={styles.successRow}>
            <Text style={[styles.srLabel, { color: colors.mutedForeground }]}>
              Status
            </Text>
            <Text style={[styles.srValue, { color: colors.warning }]}>
              Pending Review
            </Text>
          </View>
        </GlassCard>
        <Pressable
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setOrderSuccess(false); refreshData().catch(() => {}); }}
        >
          <Text style={styles.doneBtnText}>Back to Buy</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 16,
            paddingBottom: isWeb ? 100 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Buy Shares
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Reserve SpaceX (SPCX) pre-IPO shares
          </Text>
        </View>

        {/* Bulk discount promo banner */}
        <View style={[styles.promoBanner, { backgroundColor: colors.success + "14", borderColor: colors.success + "40" }]}>
          <View style={[styles.promoIcon, { backgroundColor: colors.success + "22" }]}>
            <Ionicons name="pricetag" size={16} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.promoTitle, { color: colors.success }]}>20% Bulk Discount</Text>
            <Text style={[styles.promoSub, { color: colors.mutedForeground }]}>
              Buy more than {BULK_DISCOUNT_MIN_SHARES} shares and save 20% automatically
            </Text>
          </View>
        </View>

        {/* Live Price Card */}
        <GlassCard intensity={60} padding={18}>
          <View style={styles.priceRow}>
            <View>
              <Text
                style={[styles.priceLabel, { color: colors.mutedForeground }]}
              >
                CURRENT PRICE
              </Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                ${sharePrice.toLocaleString()}
              </Text>
              <Text
                style={[styles.priceTicker, { color: colors.mutedForeground }]}
              >
                SPCX / share
              </Text>
            </View>
            <View style={styles.priceRight}>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: colors.success + "22" },
                ]}
              >
                <Ionicons
                  name="trending-up"
                  size={12}
                  color={colors.success}
                />
                <Text style={[styles.changeText, { color: colors.success }]}>
                  Live Price
                </Text>
              </View>
              <Text style={[styles.mktCapText, { color: colors.mutedForeground }]}>
                Mkt Cap {fmtVal(quote?.valuation)}
              </Text>
              <Text style={[styles.minText, { color: colors.mutedForeground }]}>
                Min ${minInvestment.toLocaleString()}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Amount Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            Investment Amount
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.card,
                borderColor:
                  numericAmount > 0 && numericAmount < minInvestment
                    ? colors.destructive
                    : numericAmount >= minInvestment
                    ? colors.primary + "88"
                    : colors.border,
              },
            ]}
          >
            <Text
              style={[styles.currencySymbol, { color: colors.mutedForeground }]}
            >
              $
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={amount}
              onChangeText={(t) => setAmount(formatAmount(t))}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              returnKeyType="done"
            />
            <Text style={[styles.inputSuffix, { color: colors.mutedForeground }]}>
              USD
            </Text>
          </View>
          {numericAmount > 0 && numericAmount < minInvestment && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Minimum investment is ${minInvestment.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Preset amounts */}
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.value}
              style={({ pressed }) => [
                styles.presetBtn,
                {
                  backgroundColor:
                    numericAmount === p.value
                      ? colors.primary + "22"
                      : colors.card,
                  borderColor:
                    numericAmount === p.value ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => setAmount(p.value.toLocaleString("en-US"))}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color:
                      numericAmount === p.value
                        ? colors.primary
                        : colors.foreground,
                  },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Share Preview */}
        {numericAmount >= minInvestment && (
          <GlassCard
            intensity={50}
            padding={16}
            style={{ borderColor: discountApplies ? colors.success + "55" : colors.primary + "44" }}
          >
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                Shares to receive
              </Text>
              <Text style={[styles.previewShares, { color: colors.primary }]}>
                {requestedShares.toFixed(4)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                Price per share
              </Text>
              <Text style={[styles.previewMeta, { color: colors.foreground }]}>
                ${sharePrice}
              </Text>
            </View>
            {discountApplies ? (
              <>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                    Original amount
                  </Text>
                  <Text style={[styles.previewMeta, { color: colors.mutedForeground, textDecorationLine: "line-through" }]}>
                    ${numericAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.success }]}>
                    Bulk discount (20%)
                  </Text>
                  <Text style={[styles.previewMeta, { color: colors.success }]}>
                    -${discountAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    You pay
                  </Text>
                  <Text style={[styles.previewMeta, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    ${finalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                    Est. value at IPO
                  </Text>
                  <Text style={[styles.previewMeta, { color: colors.success }]}>
                    ${(numericAmount * 1.35).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                {requestedShares > 0 && (
                  <Text style={[styles.previewNote, { color: colors.mutedForeground, marginTop: 4 }]}>
                    Buy over {BULK_DISCOUNT_MIN_SHARES} shares to unlock a 20% bulk discount.
                  </Text>
                )}
              </>
            )}
            {discountApplies && (
              <View style={[styles.discountBadge, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
                <Ionicons name="pricetag" size={12} color={colors.success} />
                <Text style={[styles.discountBadgeText, { color: colors.success }]}>
                  20% bulk discount applied — you save ${discountAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.previewDivider,
                { backgroundColor: discountApplies ? colors.success + "22" : colors.primary + "22" },
              ]}
            />
            <Text style={[styles.previewNote, { color: colors.mutedForeground }]}>
              Shares credited after admin review. Payment instructions sent by email. Order shown as "Pending" until confirmed.
            </Text>
          </GlassCard>
        )}

        {/* Terms */}
        <Pressable
          style={styles.termsRow}
          onPress={() => setAgreed((v) => !v)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreed ? colors.primary : "transparent",
                borderColor: agreed ? colors.primary : colors.border,
              },
            ]}
          >
            {agreed && (
              <Ionicons name="checkmark" size={14} color="#000" />
            )}
          </View>
          <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
            I am an accredited investor and agree to the terms of this private
            share reservation
          </Text>
        </Pressable>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: isValid ? colors.primary : colors.muted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleReview}
          disabled={!isValid}
        >
          <View style={styles.submitInner}>
            <Ionicons
              name="rocket-outline"
              size={18}
              color={isValid ? "#000" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.submitText,
                { color: isValid ? "#000" : colors.mutedForeground },
              ]}
            >
              {numericAmount >= minInvestment
                ? `Review Order — ${requestedShares.toFixed(2)} shares`
                : "Enter Amount to Continue"}
            </Text>
          </View>
        </Pressable>

        {/* Disclaimer */}
        <GlassCard intensity={30} padding={14}>
          <View style={styles.disclaimerInner}>
            <Ionicons
              name="shield-outline"
              size={14}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.disclaimerText, { color: colors.mutedForeground }]}
            >
              Private share reservation. Not a public offering. For accredited
              investors only. Min ${minInvestment.toLocaleString()}.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReview(false)}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View style={styles.modalHandle}>
            <View
              style={[styles.handle, { backgroundColor: colors.border }]}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + 40 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Review Order
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Confirm your share reservation details
            </Text>

            <GlassCard intensity={50} padding={0} style={styles.reviewCard}>
              {[
                {
                  label: "Shares",
                  value: `${requestedShares.toFixed(4)} SPCX`,
                  highlight: true,
                  strikethrough: false,
                  successColor: false,
                },
                {
                  label: "Price Per Share",
                  value: `${sharePrice}`,
                  highlight: false,
                  strikethrough: false,
                  successColor: false,
                },
                ...(discountApplies ? [
                  {
                    label: "Original Amount",
                    value: `${numericAmount.toLocaleString()}`,
                    highlight: false,
                    strikethrough: true,
                    successColor: false,
                  },
                  {
                    label: "Bulk Discount (20%)",
                    value: `-${discountAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                    highlight: false,
                    strikethrough: false,
                    successColor: true,
                  },
                  {
                    label: "You Pay",
                    value: `${finalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                    highlight: true,
                    strikethrough: false,
                    successColor: false,
                  },
                ] : [
                  {
                    label: "Investment Amount",
                    value: `${numericAmount.toLocaleString()}`,
                    highlight: false,
                    strikethrough: false,
                    successColor: false,
                  },
                ]),
                {
                  label: "Order Type",
                  value: "Market Reservation",
                  highlight: false,
                  strikethrough: false,
                  successColor: false,
                },
                {
                  label: "Settlement",
                  value: "2–3 business days",
                  highlight: false,
                  strikethrough: false,
                  successColor: false,
                },
              ].map((row, idx, arr) => (
                <View key={row.label}>
                  <View style={styles.reviewRow}>
                    <Text
                      style={[
                        styles.reviewLabel,
                        { color: row.successColor ? colors.success : colors.mutedForeground },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={[
                        styles.reviewValue,
                        {
                          color: row.successColor ? colors.success : row.highlight ? colors.primary : colors.foreground,
                          fontFamily: row.highlight ? "Inter_700Bold" : "Inter_600SemiBold",
                          textDecorationLine: row.strikethrough ? "line-through" : "none",
                          opacity: row.strikethrough ? 0.5 : 1,
                        },
                      ]}
                    >
                      {row.value}
                    </Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.reviewDivider,
                        { backgroundColor: "rgba(255,255,255,0.06)" },
                      ]}
                    />
                  )}
                </View>
              ))}
            </GlassCard>

            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: colors.warning + "11",
                  borderColor: colors.warning + "33",
                },
              ]}
            >
              <Ionicons name="information-circle" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.mutedForeground }]}>
                Payment instructions will be sent to your email after admin review. This is a non-binding reservation.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isSubmitting ? 0.8 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              <Text style={styles.confirmBtnText}>
                {isSubmitting ? "Submitting..." : "Confirm Reservation"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              onPress={() => setShowReview(false)}
            >
              <Text
                style={[styles.cancelText, { color: colors.mutedForeground }]}
              >
                Cancel
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceValue: { fontSize: 32, fontFamily: "Inter_700Bold" },
  priceTicker: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  priceRight: { alignItems: "flex-end", gap: 6 },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  mktCapText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  minText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  inputSection: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 64,
  },
  currencySymbol: {
    fontSize: 22,
    fontFamily: "Inter_500Medium",
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    paddingVertical: 0,
  },
  inputSuffix: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
  },
  presetText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  previewLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  previewShares: { fontSize: 24, fontFamily: "Inter_700Bold" },
  previewMeta: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  previewDivider: { height: 1, marginVertical: 4 },
  previewNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  promoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  promoTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  promoSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  discountBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  submitBtn: {
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  disclaimerInner: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  successScreen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  successCard: { width: "100%" },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  srLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  srValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  doneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  modalContainer: { flex: 1 },
  modalHandle: { alignItems: "center", paddingTop: 14, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  modalContent: { paddingHorizontal: 24, gap: 18 },
  modalTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 8 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -10 },
  reviewCard: { overflow: "hidden" },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  reviewLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  reviewValue: { fontSize: 15 },
  reviewDivider: { height: 1 },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
