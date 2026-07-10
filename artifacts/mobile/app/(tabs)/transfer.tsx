import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { apiFetch, getApiBase, getPriceQuote } from "@/lib/api";

// ── Comprehensive worldwide broker list ───────────────────────────────────────
const ALL_BROKERS = [
  // United States
  { name: "Fidelity",              domain: "fidelity.com",           initials: "FI", color: "#22c55e", region: "🇺🇸 US" },
  { name: "Charles Schwab",        domain: "schwab.com",             initials: "CS", color: "#2563eb", region: "🇺🇸 US" },
  { name: "Interactive Brokers",   domain: "interactivebrokers.com", initials: "IB", color: "#e63946", region: "🇺🇸 US" },
  { name: "TD Ameritrade",         domain: "tdameritrade.com",       initials: "TD", color: "#16a34a", region: "🇺🇸 US" },
  { name: "Robinhood",             domain: "robinhood.com",          initials: "RH", color: "#22c55e", region: "🇺🇸 US" },
  { name: "Webull",                domain: "webull.com",             initials: "WB", color: "#f97316", region: "🇺🇸 US" },
  { name: "Vanguard",              domain: "vanguard.com",           initials: "VG", color: "#7c3aed", region: "🇺🇸 US" },
  { name: "Merrill Edge",          domain: "merrilledge.com",        initials: "ME", color: "#dc2626", region: "🇺🇸 US" },
  { name: "Moomoo",                domain: "moomoo.com",             initials: "MM", color: "#f59e0b", region: "🇺🇸 US" },
  { name: "E*TRADE",               domain: "etrade.com",             initials: "ET", color: "#6366f1", region: "🇺🇸 US" },
  { name: "Morgan Stanley",        domain: "morganstanley.com",      initials: "MS", color: "#1e40af", region: "🇺🇸 US" },
  { name: "SoFi Invest",           domain: "sofi.com",               initials: "SF", color: "#0ea5e9", region: "🇺🇸 US" },
  { name: "Public.com",            domain: "public.com",             initials: "PB", color: "#8b5cf6", region: "🇺🇸 US" },
  { name: "TradeStation",          domain: "tradestation.com",       initials: "TS", color: "#0284c7", region: "🇺🇸 US" },
  { name: "Tastytrade",            domain: "tastytrade.com",         initials: "TT", color: "#ec4899", region: "🇺🇸 US" },
  { name: "Ally Invest",           domain: "ally.com",               initials: "AI", color: "#f97316", region: "🇺🇸 US" },
  { name: "Alpaca",                domain: "alpaca.markets",         initials: "AL", color: "#eab308", region: "🇺🇸 US" },
  { name: "Pershing (BNY Mellon)", domain: "pershing.com",           initials: "PE", color: "#1d4ed8", region: "🇺🇸 US" },
  { name: "Raymond James",         domain: "raymondjames.com",       initials: "RJ", color: "#b45309", region: "🇺🇸 US" },
  { name: "Edward Jones",          domain: "edwardjones.com",        initials: "EJ", color: "#15803d", region: "🇺🇸 US" },
  { name: "Stifel",                domain: "stifel.com",             initials: "ST", color: "#dc2626", region: "🇺🇸 US" },
  { name: "LPL Financial",         domain: "lpl.com",                initials: "LP", color: "#0369a1", region: "🇺🇸 US" },
  { name: "Wealthfront",           domain: "wealthfront.com",        initials: "WF", color: "#16a34a", region: "🇺🇸 US" },
  { name: "Betterment",            domain: "betterment.com",         initials: "BT", color: "#0ea5e9", region: "🇺🇸 US" },
  { name: "M1 Finance",            domain: "m1.com",                 initials: "M1", color: "#7c3aed", region: "🇺🇸 US" },
  { name: "Acorns",                domain: "acorns.com",             initials: "AC", color: "#65a30d", region: "🇺🇸 US" },
  { name: "Stash",                 domain: "stash.com",              initials: "SH", color: "#0d9488", region: "🇺🇸 US" },
  { name: "Firstrade",             domain: "firstrade.com",          initials: "FR", color: "#2563eb", region: "🇺🇸 US" },
  // United Kingdom
  { name: "Hargreaves Lansdown",   domain: "hl.co.uk",               initials: "HL", color: "#0069b4", region: "🇬🇧 UK" },
  { name: "Freetrade",             domain: "freetrade.io",           initials: "FT", color: "#ff6b6b", region: "🇬🇧 UK" },
  { name: "AJ Bell",               domain: "ajbell.co.uk",           initials: "AJ", color: "#e63946", region: "🇬🇧 UK" },
  { name: "Interactive Investor",  domain: "ii.co.uk",               initials: "II", color: "#0284c7", region: "🇬🇧 UK" },
  { name: "Nutmeg",                domain: "nutmeg.com",             initials: "NU", color: "#22c55e", region: "🇬🇧 UK" },
  { name: "Moneybox",              domain: "moneyboxapp.com",        initials: "MB", color: "#f59e0b", region: "🇬🇧 UK" },
  { name: "CMC Markets",           domain: "cmcmarkets.com",         initials: "CM", color: "#1e40af", region: "🇬🇧 UK" },
  { name: "IG Group",              domain: "ig.com",                 initials: "IG", color: "#0f172a", region: "🇬🇧 UK" },
  // Europe
  { name: "DEGIRO",                domain: "degiro.com",             initials: "DG", color: "#ef4444", region: "🇪🇺 EU" },
  { name: "eToro",                 domain: "etoro.com",              initials: "ET", color: "#22c55e", region: "🇪🇺 EU" },
  { name: "Saxo Bank",             domain: "home.saxo",              initials: "SX", color: "#1e3a5f", region: "🇪🇺 EU" },
  { name: "XTB",                   domain: "xtb.com",                initials: "XT", color: "#dc2626", region: "🇪🇺 EU" },
  { name: "Plus500",               domain: "plus500.com",            initials: "P5", color: "#f97316", region: "🇪🇺 EU" },
  { name: "Trading 212",           domain: "trading212.com",         initials: "T2", color: "#0ea5e9", region: "🇪🇺 EU" },
  { name: "Trade Republic",        domain: "traderepublic.com",      initials: "TR", color: "#22c55e", region: "🇪🇺 EU" },
  { name: "Scalable Capital",      domain: "scalable.capital",       initials: "SC", color: "#6366f1", region: "🇪🇺 EU" },
  { name: "Flatex",                domain: "flatex.de",              initials: "FL", color: "#d97706", region: "🇪🇺 EU" },
  { name: "BUX",                   domain: "bux.com",                initials: "BX", color: "#ec4899", region: "🇪🇺 EU" },
  { name: "Revolut Invest",        domain: "revolut.com",            initials: "RV", color: "#1e293b", region: "🇪🇺 EU" },
  { name: "Swissquote",            domain: "swissquote.com",         initials: "SW", color: "#dc2626", region: "🇨🇭 CH" },
  { name: "Libertex",              domain: "libertex.com",           initials: "LB", color: "#7c3aed", region: "🇪🇺 EU" },
  { name: "Exness",                domain: "exness.com",             initials: "EX", color: "#0369a1", region: "🇪🇺 EU" },
  { name: "Admiral Markets",       domain: "admiralmarkets.com",     initials: "AM", color: "#b45309", region: "🇪🇺 EU" },
  { name: "Dukascopy",             domain: "dukascopy.com",          initials: "DK", color: "#475569", region: "🇨🇭 CH" },
  // Asia-Pacific
  { name: "Tiger Brokers",         domain: "tigersecurities.com",    initials: "TG", color: "#f97316", region: "🌏 APAC" },
  { name: "Futu (moomoo HK)",      domain: "futu.com",               initials: "FU", color: "#f59e0b", region: "🇭🇰 HK" },
  { name: "Rakuten Securities",    domain: "rakuten-sec.co.jp",      initials: "RK", color: "#dc2626", region: "🇯🇵 JP" },
  { name: "SBI Securities",        domain: "sbisec.co.jp",           initials: "SB", color: "#0284c7", region: "🇯🇵 JP" },
  { name: "Mirae Asset",           domain: "miraeasset.com",         initials: "MA", color: "#0369a1", region: "🇰🇷 KR" },
  { name: "CommSec",               domain: "commsec.com.au",         initials: "CB", color: "#eab308", region: "🇦🇺 AU" },
  { name: "Stake",                 domain: "stake.com",              initials: "SK", color: "#7c3aed", region: "🇦🇺 AU" },
  { name: "Superhero",             domain: "superhero.com.au",       initials: "SH", color: "#ef4444", region: "🇦🇺 AU" },
  { name: "Zerodha",               domain: "zerodha.com",            initials: "ZR", color: "#16a34a", region: "🇮🇳 IN" },
  { name: "Groww",                 domain: "groww.in",               initials: "GW", color: "#0ea5e9", region: "🇮🇳 IN" },
  { name: "Upstox",                domain: "upstox.com",             initials: "UP", color: "#7c3aed", region: "🇮🇳 IN" },
  { name: "Angel Broking",         domain: "angelbroking.com",       initials: "AB", color: "#d97706", region: "🇮🇳 IN" },
  { name: "Kotak Securities",      domain: "kotaksecurities.com",    initials: "KS", color: "#dc2626", region: "🇮🇳 IN" },
  { name: "ICICI Direct",          domain: "icicidirect.com",        initials: "IC", color: "#f97316", region: "🇮🇳 IN" },
  { name: "Phillip Securities",    domain: "poems.com.sg",           initials: "PS", color: "#0284c7", region: "🇸🇬 SG" },
  { name: "Maybank Securities",    domain: "maybank.com",            initials: "MY", color: "#eab308", region: "🇲🇾 MY" },
  { name: "CIMB Securities",       domain: "cimb.com",               initials: "CI", color: "#dc2626", region: "🇲🇾 MY" },
  // Middle East & Africa
  { name: "Sarwa",                 domain: "sarwa.co",               initials: "SA", color: "#22c55e", region: "🇦🇪 UAE" },
  { name: "Baraka",                domain: "getbaraka.com",          initials: "BA", color: "#0ea5e9", region: "🇦🇪 UAE" },
  { name: "StashAway",             domain: "stashaway.com",          initials: "SW", color: "#6366f1", region: "🇸🇬 SG" },
  { name: "Mubasher",              domain: "mubasher.net",           initials: "MU", color: "#0284c7", region: "🇸🇦 SA" },
  // Canada
  { name: "Questrade",             domain: "questrade.com",          initials: "QT", color: "#dc2626", region: "🇨🇦 CA" },
  { name: "TD Direct Investing",   domain: "td.com",                 initials: "TD", color: "#16a34a", region: "🇨🇦 CA" },
  { name: "Qtrade",                domain: "qtrade.ca",              initials: "QR", color: "#2563eb", region: "🇨🇦 CA" },
  { name: "Wealthsimple",          domain: "wealthsimple.com",       initials: "WS", color: "#22c55e", region: "🇨🇦 CA" },
  { name: "National Bank Direct",  domain: "nbc.ca",                 initials: "NB", color: "#dc2626", region: "🇨🇦 CA" },
  // Latin America
  { name: "XP Investimentos",      domain: "xp.com.br",              initials: "XP", color: "#f97316", region: "🇧🇷 BR" },
  { name: "BTG Pactual",           domain: "btgpactual.com",         initials: "BT", color: "#1e40af", region: "🇧🇷 BR" },
  { name: "nuInvest",              domain: "nuinvest.com.br",        initials: "NU", color: "#7c3aed", region: "🇧🇷 BR" },
  // Other
  { name: "Other",                 domain: "",                       initials: "OT", color: "#64748b", region: "🌍 Global" },
];

type Step = "choose" | "form-brokerage" | "form-internal" | "otp" | "review" | "success";

interface TransferRecord {
  id: string;
  mode: string;
  requestId: string;
  brokerageName?: string;
  recipientEmail?: string;
  status: string;
  createdAt: string;
}

function statusColor(s: string, colors: ReturnType<typeof useColors>): string {
  const map: Record<string, string> = {
    pending_review: colors.warning,
    under_review: "#60a5fa",
    awaiting_documents: "#fb923c",
    approved: "#22d3ee",
    processing: "#c084fc",
    completed: colors.success,
    rejected: colors.destructive,
    queued: "#fbbf24",
    transfer_requested: "#60a5fa",
  };
  return map[s] ?? colors.mutedForeground;
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending_review: "Pending Review", under_review: "Under Review",
    awaiting_documents: "Awaiting Docs", approved: "Approved",
    processing: "Processing", completed: "Completed",
    rejected: "Rejected", queued: "Queued", transfer_requested: "Requested",
  };
  return map[s] ?? s;
}

function BrokerBadge({ name, domain, initials, color, size = 28 }: {
  name: string; domain?: string; initials: string; color: string; size?: number;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = domain ? `${getApiBase()}/logos/${domain}` : null;

  if (logoFailed || !logoUrl) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + "22", borderWidth: 1, borderColor: color + "55", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: size * 0.32, color, fontFamily: "Inter_700Bold", letterSpacing: -0.5 }}>{initials.slice(0, 2)}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size * 0.75, height: size * 0.75 }}
        resizeMode="contain"
        onError={() => setLogoFailed(true)}
      />
    </View>
  );
}

function getBrokerInfo(name: string) {
  return ALL_BROKERS.find((b) => b.name === name) ?? { name, domain: "", initials: name.slice(0, 2).toUpperCase(), color: "#64748b", region: "" };
}

export default function TransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [step, setStep] = useState<Step>("choose");
  const [mode, setMode] = useState<"brokerage" | "internal">("brokerage");
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  // Brokerage form
  const [broker, setBroker] = useState("");
  const [brokerSearch, setBrokerSearch] = useState("");
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [transferSubType, setTransferSubType] = useState<"full" | "partial">("full");
  const [notes, setNotes] = useState("");

  // Dual amount input
  const [amountMode, setAmountMode] = useState<"shares" | "usd">("shares");
  const [amountInput, setAmountInput] = useState("");
  const [spcxPrice, setSpcxPrice] = useState<number | null>(null);

  // Internal form
  const [recipientEmail, setRecipientEmail] = useState("");
  const [internalAmountInput, setInternalAmountInput] = useState("");
  const [internalAmountMode, setInternalAmountMode] = useState<"shares" | "usd">("shares");
  const [internalSubType, setInternalSubType] = useState<"full" | "partial">("full");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransfers();
    getPriceQuote().then((q) => setSpcxPrice(q.price)).catch(() => {});
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  async function loadTransfers() {
    try {
      const data = await apiFetch<TransferRecord[]>("/dashboard/transfers");
      setTransfers(data);
    } catch { /* ignore */ }
  }

  function startOtpCooldown() {
    setOtpCooldown(60);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // Compute equivalent value for display
  function computeEquiv(input: string, mode: "shares" | "usd"): string | null {
    if (!spcxPrice || !input.trim() || isNaN(Number(input))) return null;
    const n = parseFloat(input);
    if (n <= 0) return null;
    if (mode === "shares") return `≈ $${(n * spcxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    return `≈ ${(n / spcxPrice).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SPCX`;
  }

  // Convert amount to shares for API submission.
  // Returns undefined if: no input, not a valid positive number, or USD mode with no price loaded.
  function toShares(input: string, mode: "shares" | "usd"): number | undefined {
    if (!input.trim() || isNaN(Number(input))) return undefined;
    const n = parseFloat(input);
    if (n <= 0) return undefined;
    if (mode === "shares") return n;
    // USD mode — require price to be loaded; never fall back to raw USD value as share count
    if (!spcxPrice) return undefined;
    return n / spcxPrice;
  }

  function validateAmount(input: string, mode: "shares" | "usd"): boolean {
    if (!input.trim()) return true; // empty = full transfer, always valid
    const n = parseFloat(input);
    if (isNaN(n) || n <= 0) {
      Alert.alert("Invalid amount", "Please enter a positive number.");
      return false;
    }
    if (mode === "usd" && !spcxPrice) {
      Alert.alert("Price unavailable", "Cannot convert USD to shares — current SPCX price hasn't loaded yet. Please enter the amount in shares instead.");
      return false;
    }
    return true;
  }

  async function sendOtp() {
    setOtpSending(true);
    try {
      await apiFetch<{ ok: boolean }>("/dashboard/transfers/send-otp", { method: "POST" });
      startOtpCooldown();
      Alert.alert("Code sent", `A 6-digit code was sent to ${user?.email ?? "your email"}.`);
    } catch (e) {
      Alert.alert("Error", (e as Error).message ?? "Failed to send code");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleContinueToOtp() {
    if (mode === "brokerage") {
      if (!broker) { Alert.alert("Required", "Please select a brokerage"); return; }
      if (!accountNumber.trim()) { Alert.alert("Required", "Account number is required"); return; }
      if (!holderName.trim()) { Alert.alert("Required", "Account holder name is required"); return; }
      if (!validateAmount(amountInput, amountMode)) return;
    } else {
      if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
        Alert.alert("Required", "Please enter a valid recipient email");
        return;
      }
      if (!validateAmount(internalAmountInput, internalAmountMode)) return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("otp");
    setOtpSending(true);
    try {
      await apiFetch<{ ok: boolean }>("/dashboard/transfers/send-otp", { method: "POST" });
      startOtpCooldown();
    } catch (e) {
      Alert.alert("Error", (e as Error).message ?? "Failed to send verification code");
    } finally {
      setOtpSending(false);
    }
  }

  function handleVerifyOtp() {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit verification code");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("review");
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        otpCode: otp.trim(),
        mode,
        asset: "SPCX",
      };
      if (mode === "brokerage") {
        body.brokerageName = broker;
        body.brokerageAccountNumber = accountNumber.trim();
        body.accountHolderName = holderName.trim();
        if (contactEmail.trim()) body.emailAddress = contactEmail.trim();
        const shares = toShares(amountInput, amountMode);
        if (shares) body.amountToTransfer = shares;
        body.transferSubType = transferSubType;
        if (notes.trim()) body.notes = notes.trim();
      } else {
        body.recipientEmail = recipientEmail.trim();
        const shares = toShares(internalAmountInput, internalAmountMode);
        if (shares) body.amountToTransfer = shares;
        body.transferSubType = internalSubType;
      }
      await apiFetch("/dashboard/transfers", { method: "POST", body });
      await loadTransfers();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("success");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (e as Error).message ?? "Submission failed";
      if (msg.toLowerCase().includes("verif") || msg.toLowerCase().includes("code")) {
        Alert.alert("Verification failed", msg);
        setStep("otp");
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStep("choose");
    setBroker(""); setAccountNumber(""); setHolderName(""); setContactEmail("");
    setAmountInput(""); setAmountMode("shares"); setNotes(""); setTransferSubType("full");
    setRecipientEmail(""); setInternalAmountInput(""); setInternalAmountMode("shares"); setInternalSubType("full");
    setOtp("");
  }

  const filteredBrokers = ALL_BROKERS.filter((b) =>
    b.name.toLowerCase().includes(brokerSearch.toLowerCase()) ||
    b.region.toLowerCase().includes(brokerSearch.toLowerCase())
  );

  const selectedBrokerInfo = broker ? getBrokerInfo(broker) : null;
  const s = styles(colors);

  // Amount input component (reusable for brokerage and internal)
  const AmountInput = ({
    value, onChange, mode: aMode, onModeChange, equiv,
  }: {
    value: string; onChange: (v: string) => void;
    mode: "shares" | "usd"; onModeChange: (m: "shares" | "usd") => void;
    equiv: string | null;
  }) => (
    <View style={{ gap: 8 }}>
      {/* Mode toggle */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {(["shares", "usd"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => { onModeChange(m); onChange(""); Haptics.selectionAsync(); }}
            style={[s.toggleBtn, {
              borderColor: aMode === m ? colors.primary : colors.border,
              backgroundColor: aMode === m ? colors.primary + "20" : "transparent",
              flex: 1,
            }]}
          >
            <Text style={{ color: aMode === m ? colors.primary : colors.mutedForeground, fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>
              {m === "shares" ? "In Shares (SPCX)" : "In USD ($)"}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* Input */}
      <View style={{ position: "relative" }}>
        <TextInput
          style={[s.input, { color: colors.foreground, paddingLeft: aMode === "usd" ? 30 : 14 }]}
          value={value}
          onChangeText={onChange}
          placeholder={aMode === "usd" ? "0.00" : "0"}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
        />
        {aMode === "usd" && (
          <Text style={{ position: "absolute", left: 14, top: 13, color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_600SemiBold" }}>$</Text>
        )}
      </View>
      {/* Equivalent display */}
      {equiv && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 2 }}>
          <Ionicons name="swap-horizontal" size={12} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{equiv}</Text>
          {spcxPrice && <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>· SPCX @ ${spcxPrice.toFixed(2)}</Text>}
        </View>
      )}
    </View>
  );

  // ── OTP + Review + Success rendered as full-screen modal (no tab bar) ──
  const isFullscreenStep = step === "otp" || step === "review" || step === "success";

  const FullscreenModal = (
    <Modal
      visible={isFullscreenStep}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (step === "otp") setStep(mode === "brokerage" ? "form-brokerage" : "form-internal");
        else if (step === "review") setStep("otp");
        else if (step === "success") resetAll();
      }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, paddingHorizontal: 20, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          {step !== "success" && (
            <View style={s.header}>
              <Pressable onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (step === "otp") setStep(mode === "brokerage" ? "form-brokerage" : "form-internal");
                else if (step === "review") setStep("otp");
              }} style={s.backBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[s.title, { color: colors.foreground }]}>
                {step === "otp" ? "Verify Identity" : "Review & Confirm"}
              </Text>
              <View style={{ width: 40 }} />
            </View>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <View style={{ alignItems: "center", gap: 24, paddingTop: 40 }}>
              {/* Icon */}
              <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: colors.primary + "40", backgroundColor: colors.primary + "10", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="mail-outline" size={42} color={colors.primary} />
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={[s.sectionTitle, { color: colors.foreground, textAlign: "center", fontSize: 24 }]}>Check Your Email</Text>
                <Text style={[s.subtitle, { color: colors.mutedForeground, textAlign: "center", maxWidth: 280 }]}>
                  {otpSending ? "Sending verification code…" : `We sent a 6-digit code to\n${user?.email ?? "your email"}`}
                </Text>
              </View>

              {/* OTP input */}
              <TextInput
                style={[s.otpInput, { color: colors.foreground, borderColor: otp.length === 6 ? colors.primary : colors.border, backgroundColor: colors.card }]}
                value={otp}
                onChangeText={(v) => {
                  const clean = v.replace(/\D/g, "").slice(0, 6);
                  setOtp(clean);
                  if (clean.length === 6) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                placeholder="• • • • • •"
                placeholderTextColor={colors.mutedForeground + "80"}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />

              <View style={{ width: "100%", gap: 12 }}>
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: otp.length === 6 ? colors.foreground : colors.border, opacity: otp.length < 6 ? 0.5 : 1 }]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length < 6}
                >
                  <Text style={[s.primaryBtnText, { color: otp.length === 6 ? colors.background : colors.mutedForeground }]}>Verify Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); sendOtp(); }}
                  disabled={otpCooldown > 0 || otpSending}
                  style={{ opacity: (otpCooldown > 0 || otpSending) ? 0.4 : 1, alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && (
            <View style={{ gap: 16 }}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Review & Confirm</Text>
              <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Please confirm your transfer details before submitting.</Text>

              {(() => {
                const brokerShares = toShares(amountInput, amountMode);
                const internalShares = toShares(internalAmountInput, internalAmountMode);
                const amountDisplay = (() => {
                  if (mode === "brokerage") {
                    if (!amountInput) return "All holdings";
                    if (amountMode === "usd") return `$${parseFloat(amountInput).toLocaleString()} USD${brokerShares ? ` (≈ ${brokerShares.toFixed(4)} SPCX)` : ""}`;
                    return `${amountInput} SPCX${spcxPrice && brokerShares ? ` (≈ $${(brokerShares * spcxPrice).toFixed(2)})` : ""}`;
                  } else {
                    if (!internalAmountInput) return "All holdings";
                    if (internalAmountMode === "usd") return `$${parseFloat(internalAmountInput).toLocaleString()} USD${internalShares ? ` (≈ ${internalShares.toFixed(4)} SPCX)` : ""}`;
                    return `${internalAmountInput} SPCX${spcxPrice && internalShares ? ` (≈ $${(internalShares * spcxPrice).toFixed(2)})` : ""}`;
                  }
                })();
                const reviewItems = mode === "brokerage"
                  ? [
                      { label: "Brokerage", value: broker },
                      { label: "Account Number", value: accountNumber },
                      { label: "Account Holder", value: holderName },
                      { label: "Contact Email", value: contactEmail || "—" },
                      { label: "Asset", value: "SPCX" },
                      { label: "Amount", value: amountDisplay },
                      { label: "Transfer Type", value: transferSubType === "full" ? "Full Transfer" : "Partial Transfer" },
                      ...(notes ? [{ label: "Notes", value: notes }] : []),
                    ]
                  : [
                      { label: "Recipient", value: recipientEmail },
                      { label: "Asset", value: "SPCX" },
                      { label: "Amount", value: amountDisplay },
                      { label: "Transfer Type", value: internalSubType === "full" ? "Full Transfer" : "Partial Transfer" },
                    ];
                return (
                  <GlassCard intensity={40} padding={0}>
                    {reviewItems.map(({ label, value }, i) => (
                      <View key={label} style={[s.reviewRow, i < reviewItems.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border + "55" } : {}]}>
                        <Text style={[s.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
                        <Text style={[s.reviewValue, { color: colors.foreground }]} numberOfLines={3}>{value}</Text>
                      </View>
                    ))}
                  </GlassCard>
                );
              })()}

              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: colors.foreground, opacity: submitting ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={[s.primaryBtnText, { color: colors.background }]}>
                  {submitting ? "Submitting…" : "Submit Transfer Request"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 60 }}>
              <View style={[s.successIcon, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
                <Ionicons name="checkmark-circle" size={52} color={colors.success} />
              </View>
              <View style={{ alignItems: "center", gap: 10 }}>
                <Text style={[s.sectionTitle, { color: colors.foreground, textAlign: "center", fontSize: 26 }]}>Request Submitted!</Text>
                <Text style={[s.subtitle, { color: colors.mutedForeground, textAlign: "center", maxWidth: 300 }]}>
                  Your transfer request has been received. We'll email you at every stage of the process.
                </Text>
              </View>
              <View style={{ width: "100%", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground }]} onPress={resetAll}>
                  <Text style={[s.primaryBtnText, { color: colors.background }]}>New Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.secondaryBtn, { borderColor: colors.border }]} onPress={() => { resetAll(); router.push("/(tabs)/" as Parameters<typeof router.push>[0]); }}>
                  <Text style={[s.primaryBtnText, { color: colors.foreground }]}>Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <>
      {FullscreenModal}

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: isWeb ? 100 : insets.bottom + 100, paddingHorizontal: 20, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            {step !== "choose" && (
              <Pressable onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("choose");
              }} style={s.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Text style={[s.title, { color: colors.foreground }]}>Transfer</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* STEP: CHOOSE */}
          {step === "choose" && (
            <View style={{ gap: 12 }}>
              <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
                Choose how you want to transfer your SPCX holdings.
              </Text>

              <Pressable
                style={({ pressed }) => [s.optionCard, { borderColor: pressed ? colors.primary + "55" : colors.border, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode("internal"); setStep("form-internal"); }}
              >
                <View style={[s.optionIcon, { backgroundColor: "#3b82f620", borderColor: "#3b82f640" }]}>
                  <Ionicons name="people-outline" size={22} color="#60a5fa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionTitle, { color: colors.foreground }]}>To Another SpaceX Investor</Text>
                  <Text style={[s.optionSub, { color: colors.mutedForeground }]}>Transfer SPCX shares to another registered investor</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.optionCard, { borderColor: pressed ? colors.success + "55" : colors.border, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode("brokerage"); setStep("form-brokerage"); }}
              >
                <View style={[s.optionIcon, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
                  <Ionicons name="business-outline" size={22} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionTitle, { color: colors.foreground }]}>To Another Brokerage</Text>
                  <Text style={[s.optionSub, { color: colors.mutedForeground }]}>Transfer to any brokerage worldwide</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>

              {transfers.length > 0 && (
                <View style={{ marginTop: 8, gap: 8 }}>
                  <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>RECENT TRANSFERS</Text>
                  {transfers.slice(0, 3).map((t) => (
                    <GlassCard key={t.id} intensity={30} padding={12}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                            {t.mode === "internal" ? t.recipientEmail : t.brokerageName}
                          </Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                            {t.requestId || "—"} · {new Date(t.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={[s.statusBadge, { borderColor: statusColor(t.status, colors) + "44" }]}>
                          <Text style={[s.statusText, { color: statusColor(t.status, colors) }]}>{statusLabel(t.status)}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* STEP: BROKERAGE FORM */}
          {step === "form-brokerage" && (
            <View style={{ gap: 14 }}>
              {/* Destination broker field */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Destination Brokerage *</Text>
                <Pressable
                  style={[s.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBrokerModalOpen(true); }}
                >
                  {selectedBrokerInfo ? (
                    <>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <BrokerBadge name={selectedBrokerInfo.name} domain={selectedBrokerInfo.domain} initials={selectedBrokerInfo.initials} color={selectedBrokerInfo.color} size={32} />
                        <View>
                          <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_600SemiBold" }}>{broker}</Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>{selectedBrokerInfo.region}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
                    </>
                  ) : (
                    <>
                      <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 }}>Select brokerage…</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
                    </>
                  )}
                </Pressable>
              </View>

              {/* Account number */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Brokerage Account Number *</Text>
                <TextInput style={[s.input, { color: colors.foreground }]} value={accountNumber} onChangeText={setAccountNumber} placeholder="Your account number" placeholderTextColor={colors.mutedForeground} />
              </View>

              {/* Account holder */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Account Holder Name *</Text>
                <TextInput style={[s.input, { color: colors.foreground }]} value={holderName} onChangeText={setHolderName} placeholder="Full legal name on the account" placeholderTextColor={colors.mutedForeground} />
              </View>

              {/* Email */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Email Address</Text>
                <TextInput style={[s.input, { color: colors.foreground }]} value={contactEmail} onChangeText={setContactEmail} placeholder="Contact email for the brokerage account" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" />
              </View>

              {/* Amount with dual mode */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Amount to Transfer</Text>
                <AmountInput
                  value={amountInput}
                  onChange={setAmountInput}
                  mode={amountMode}
                  onModeChange={setAmountMode}
                  equiv={computeEquiv(amountInput, amountMode)}
                />
              </View>

              {/* Transfer type */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Transfer Type *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["full", "partial"] as const).map((t) => (
                    <Pressable key={t} style={[s.typeBtn, { borderColor: transferSubType === t ? colors.foreground : colors.border, backgroundColor: transferSubType === t ? colors.foreground + "15" : "transparent", flex: 1 }]} onPress={() => { setTransferSubType(t); Haptics.selectionAsync(); }}>
                      <Text style={{ color: transferSubType === t ? colors.foreground : colors.mutedForeground, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                        {t === "full" ? "Full Transfer" : "Partial Transfer"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Notes (Optional)</Text>
                <TextInput style={[s.input, { color: colors.foreground, height: 70, textAlignVertical: "top", paddingTop: 10 }]} value={notes} onChangeText={setNotes} placeholder="Any additional notes for our team" placeholderTextColor={colors.mutedForeground} multiline />
              </View>

              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground }]} onPress={handleContinueToOtp}>
                <Text style={[s.primaryBtnText, { color: colors.background }]}>Continue — Verify Identity</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: INTERNAL FORM */}
          {step === "form-internal" && (
            <View style={{ gap: 14 }}>
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Recipient Email *</Text>
                <TextInput style={[s.input, { color: colors.foreground }]} value={recipientEmail} onChangeText={setRecipientEmail} placeholder="Registered email of the recipient" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Amount to Transfer</Text>
                <AmountInput
                  value={internalAmountInput}
                  onChange={setInternalAmountInput}
                  mode={internalAmountMode}
                  onModeChange={setInternalAmountMode}
                  equiv={computeEquiv(internalAmountInput, internalAmountMode)}
                />
              </View>
              <View>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Transfer Type *</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["full", "partial"] as const).map((t) => (
                    <Pressable key={t} style={[s.typeBtn, { borderColor: internalSubType === t ? colors.foreground : colors.border, backgroundColor: internalSubType === t ? colors.foreground + "15" : "transparent", flex: 1 }]} onPress={() => { setInternalSubType(t); Haptics.selectionAsync(); }}>
                      <Text style={{ color: internalSubType === t ? colors.foreground : colors.mutedForeground, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                        {t === "full" ? "Full" : "Partial"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground }]} onPress={handleContinueToOtp}>
                <Text style={[s.primaryBtnText, { color: colors.background }]}>Continue — Verify Identity</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Full-Screen Broker Picker ── */}
      <Modal
        visible={brokerModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => { setBrokerSearch(""); setBrokerModalOpen(false); }}
      >
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, backgroundColor: "#080c12" }}>
          {/* Header with search */}
          <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#ffffff10", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 }}>Select Broker</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBrokerSearch(""); setBrokerModalOpen(false); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#ffffff10" }}>
                <Text style={{ color: "#ffffff80", fontSize: 14, fontFamily: "Inter_500Medium" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff0e", borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
              <Ionicons name="search" size={16} color="#ffffff50" />
              <TextInput
                autoFocus
                style={{ flex: 1, color: "#fff", paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" }}
                placeholder="Search brokers, region…"
                placeholderTextColor="#ffffff40"
                value={brokerSearch}
                onChangeText={setBrokerSearch}
              />
              {brokerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBrokerSearch("")}>
                  <Ionicons name="close-circle" size={16} color="#ffffff40" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Broker list */}
          <FlatList
            data={filteredBrokers}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = broker === item.name;
              return (
                <TouchableOpacity
                  style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#ffffff07", flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: isSelected ? "#ffffff08" : "transparent" }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBroker(item.name);
                    setBrokerSearch("");
                    setBrokerModalOpen(false);
                  }}
                >
                  <BrokerBadge name={item.name} domain={item.domain} initials={item.initials} color={item.color} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 15, fontFamily: isSelected ? "Inter_700Bold" : "Inter_500Medium" }}>{item.name}</Text>
                    <Text style={{ color: "#ffffff50", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>{item.region}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={item.color} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
                <Ionicons name="search-outline" size={32} color="#ffffff20" />
                <Text style={{ color: "#ffffff40", fontSize: 14, fontFamily: "Inter_400Regular" }}>No brokers found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
}

function styles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, flex: 1, textAlign: "center" },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
    sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
    optionCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
    optionIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
    optionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
    optionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", backgroundColor: colors.card },
    toggleBtn: { paddingVertical: 9, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    typeBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    primaryBtn: { borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
    secondaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    otpInput: { width: "100%", borderWidth: 1.5, borderRadius: 16, paddingVertical: 22, fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: 22 },
    successIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: "center", alignItems: "center" },
    reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
    reviewLabel: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 0, minWidth: 100 },
    reviewValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  });
}
