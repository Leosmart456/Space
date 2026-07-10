import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const AVATAR_KEY = "@spacex_avatar_uri";

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      {
        icon: "document-text-outline" as const,
        label: "Documents",
        sub: "Agreements & statements",
        route: "/documents",
      },
      {
        icon: "notifications-outline" as const,
        label: "Notifications",
        sub: "Manage alerts",
        route: "/notifications",
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        icon: "lock-closed-outline" as const,
        label: "Security",
        sub: "Password & 2FA",
        route: "/security",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: "help-circle-outline" as const,
        label: "Help & Support",
        sub: "support@spacexpreipo.com",
        route: "/support",
      },
      {
        icon: "information-circle-outline" as const,
        label: "About",
        sub: "Version 1.0.0",
        route: null,
      },
    ],
  },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, updateProfile, purchases, sharePrice, refreshData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const isVerified = user?.accreditedStatus === "yes";

  const initials = (user?.fullName ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalShares = user?.totalSharesCredited ?? 0;
  const portfolioValue = totalShares * sharePrice;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  // Load saved avatar
  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then((uri) => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) return;
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setEditing(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", (e as Error).message ?? "Failed to update profile.");
    }
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }

  return (
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <Pressable
          onPress={() => {
            if (editing) {
              handleSave();
            } else {
              setFullName(user?.fullName ?? "");
              setPhone(user?.phone ?? "");
              setEditing(true);
            }
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <View
            style={[
              styles.editBtn,
              {
                backgroundColor: editing ? colors.primary + "22" : colors.card,
                borderColor: editing ? colors.primary + "44" : colors.border,
              },
            ]}
          >
            <Ionicons
              name={editing ? "checkmark" : "pencil"}
              size={15}
              color={editing ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.editBtnText,
                { color: editing ? colors.primary : colors.mutedForeground },
              ]}
            >
              {editing ? "Save" : "Edit"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Avatar Hero Card */}
      <GlassCard intensity={60} padding={0} style={styles.heroCard}>
        <View style={styles.heroBg}>
          {/* Avatar */}
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.primary + "55",
                  },
                ]}
              >
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {initials}
                </Text>
              </View>
            )}
            {/* Camera overlay */}
            <View style={[styles.cameraOverlay, { backgroundColor: colors.background + "cc" }]}>
              <Ionicons name="camera" size={14} color={colors.foreground} />
            </View>
          </Pressable>

          {/* Name & badges */}
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user?.fullName ?? "Investor"}
              </Text>
              {isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                  <Ionicons name="shield-checkmark" size={11} color={colors.primary} />
                  <Text style={[styles.verifiedText, { color: colors.primary }]}>
                    VERIFIED
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {user?.email}
            </Text>

            {/* SpaceX tag */}
            <View style={[styles.spacexTag, { borderColor: "rgba(255,255,255,0.12)" }]}>
              <Text style={[styles.spacexTagText, { color: "rgba(255,255,255,0.45)" }]}>
                SPACEX PRE-IPO PLATFORM
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: "SHARES", value: totalShares.toFixed(2), color: colors.primary },
          {
            label: "VALUE",
            value: `$${portfolioValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            color: colors.foreground,
          },
          { label: "ORDERS", value: `${purchases.length}`, color: colors.foreground },
        ].map((stat) => (
          <GlassCard key={stat.label} intensity={40} padding={16} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </GlassCard>
        ))}
      </View>

      {/* Accreditation status strip */}
      <Pressable
        onPress={() => router.push("/accreditation" as any)}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
      >
        <GlassCard intensity={40} padding={14} style={styles.accredCard}>
          <View style={styles.accredRow}>
            <View
              style={[
                styles.accredIconBox,
                {
                  backgroundColor:
                    isVerified
                      ? colors.success + "18"
                      : user?.accreditedStatus === "no"
                      ? colors.destructive + "18"
                      : colors.warning + "18",
                },
              ]}
            >
              <Ionicons
                name={
                  isVerified
                    ? "shield-checkmark"
                    : user?.accreditedStatus === "no"
                    ? "close-circle"
                    : "time"
                }
                size={18}
                color={
                  isVerified
                    ? colors.success
                    : user?.accreditedStatus === "no"
                    ? colors.destructive
                    : colors.warning
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accredTitle, { color: colors.foreground }]}>
                {isVerified
                  ? "Accredited Investor"
                  : user?.accreditedStatus === "no"
                  ? "Accreditation Denied"
                  : "Accreditation Pending"}
              </Text>
              <Text style={[styles.accredSub, { color: colors.mutedForeground }]}>
                {isVerified
                  ? "Verified — tap to view certificate"
                  : user?.accreditedStatus === "no"
                  ? "Contact support to appeal"
                  : "Usually takes 2–3 business days"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />
          </View>
        </GlassCard>
      </Pressable>

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PERSONAL INFO
        </Text>
        <GlassCard intensity={40} padding={0} style={styles.infoCard}>
          {[
            { label: "Full Name", field: "name" },
            { label: "Email", field: "email" },
            { label: "Phone", field: "phone" },
            { label: "Member Since", field: "since" },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  {row.label}
                </Text>
                {editing && row.field === "name" ? (
                  <TextInput
                    style={[
                      styles.infoInput,
                      { color: colors.foreground, borderColor: colors.primary + "66" },
                    ]}
                    value={fullName}
                    onChangeText={setFullName}
                    autoFocus
                  />
                ) : editing && row.field === "phone" ? (
                  <TextInput
                    style={[
                      styles.infoInput,
                      { color: colors.foreground, borderColor: colors.border },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {row.field === "name"
                      ? user?.fullName
                      : row.field === "email"
                      ? user?.email
                      : row.field === "phone"
                      ? user?.phone || "—"
                      : memberSince}
                  </Text>
                )}
              </View>
              {idx < arr.length - 1 && (
                <View style={[styles.infoDivider, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
              )}
            </View>
          ))}
        </GlassCard>
      </View>

      {/* Menu Sections */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {section.title.toUpperCase()}
          </Text>
          <GlassCard intensity={40} padding={0} style={styles.menuCard}>
            {section.items.map((item, idx, arr) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => {
                    if (item.route) router.push(item.route as any);
                  }}
                >
                  <View
                    style={[
                      styles.menuIconBox,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={colors.foreground}
                    />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>
                      {item.sub}
                    </Text>
                  </View>
                  {item.route && (
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={colors.mutedForeground}
                    />
                  )}
                </Pressable>
                {idx < arr.length - 1 && (
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: "rgba(255,255,255,0.06)" },
                    ]}
                  />
                )}
              </View>
            ))}
          </GlassCard>
        </View>
      ))}

      {/* Sign Out */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          {
            borderColor: colors.destructive + "44",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={17} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>
          Sign Out
        </Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        SpaceX Pre-IPO Platform · v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  heroCard: { overflow: "hidden" },
  heroBg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 20,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarFallback: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: { fontSize: 26, fontFamily: "Inter_700Bold" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: { flex: 1, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  userName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  spacexTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 2,
  },
  spacexTagText: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  accredCard: {},
  accredRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accredIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  accredTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  accredSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  infoCard: { overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 13, fontFamily: "Inter_400Regular", maxWidth: "60%", textAlign: "right" },
  infoInput: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    borderBottomWidth: 1,
    paddingVertical: 2,
    minWidth: 120,
    textAlign: "right",
  },
  infoDivider: { height: 1, marginHorizontal: 16 },
  menuCard: { overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  menuDivider: { height: 1, marginLeft: 66 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
});
