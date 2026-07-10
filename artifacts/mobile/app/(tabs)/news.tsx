import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const SCREEN_WIDTH = Dimensions.get("window").width;

const CATEGORIES = ["All", "Mission", "Starlink", "Starship", "Contract", "Launch"] as const;
type Category = (typeof CATEGORIES)[number];

interface NewsArticle {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  featured: boolean;
}

async function fetchSpaceXNews(): Promise<NewsArticle[]> {
  const res = await fetch(
    "https://api.spaceflightnewsapi.net/v4/articles/?limit=30&ordering=-published_at&search=spacex",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await res.json();
  return (data.results ?? []) as NewsArticle[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function inferCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  if (text.includes("starlink")) return "Starlink";
  if (text.includes("starship")) return "Starship";
  if (text.includes("falcon")) return "Launch";
  if (text.includes("contract") || text.includes("nasa") || text.includes("award")) return "Contract";
  if (text.includes("launch") || text.includes("mission") || text.includes("orbit")) return "Mission";
  return "News";
}

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: articles = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["spacexNews"],
    queryFn: fetchSpaceXNews,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const filtered =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => inferCategory(a.title, a.summary) === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  async function openArticle(url: string) {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>SpaceX News</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Live from the frontier
          </Text>
        </View>
        <View style={[styles.liveDot, { borderColor: colors.primary + "44" }]}>
          <View style={[styles.livePulse, { backgroundColor: colors.primary }]} />
          <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.pill,
              {
                backgroundColor:
                  activeCategory === cat ? colors.primary : colors.card,
                borderColor:
                  activeCategory === cat ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    activeCategory === cat ? "#000" : colors.mutedForeground,
                },
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Fetching latest news…
          </Text>
        </View>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <GlassCard intensity={40} padding={28} style={styles.errorBox}>
          <Ionicons name="wifi-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Couldn't load news
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            Check your connection and pull to refresh
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </GlassCard>
      )}

      {/* Featured Article */}
      {!isLoading && !isError && featured && (
        <Pressable
          onPress={() => openArticle(featured.url)}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <GlassCard intensity={60} padding={0} style={styles.featuredCard}>
            {featured.image_url ? (
              <Image
                source={{ uri: featured.image_url }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.featuredImagePlaceholder,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons name="rocket" size={40} color={colors.primary} />
              </View>
            )}
            {/* Overlay */}
            <View style={styles.featuredOverlay}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "dd" }]}>
                <Text style={styles.categoryBadgeText}>
                  {inferCategory(featured.title, featured.summary)}
                </Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={3}>
                {featured.title}
              </Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredSite}>{featured.news_site}</Text>
                <Text style={styles.featuredTime}>
                  {timeAgo(featured.published_at)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      )}

      {/* Article List */}
      {!isLoading && !isError && rest.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            More Stories
          </Text>
          <GlassCard intensity={40} padding={0} style={styles.listCard}>
            {rest.map((article, idx) => (
              <View key={article.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.articleRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => openArticle(article.url)}
                >
                  {article.image_url ? (
                    <Image
                      source={{ uri: article.image_url }}
                      style={styles.articleThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.articleThumbPlaceholder,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      <Ionicons name="rocket-outline" size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={styles.articleBody}>
                    <View style={styles.articleMeta}>
                      <View
                        style={[
                          styles.miniTag,
                          { backgroundColor: colors.primary + "22" },
                        ]}
                      >
                        <Text style={[styles.miniTagText, { color: colors.primary }]}>
                          {inferCategory(article.title, article.summary)}
                        </Text>
                      </View>
                      <Text style={[styles.articleTime, { color: colors.mutedForeground }]}>
                        {timeAgo(article.published_at)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.articleTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <Text
                      style={[styles.articleSite, { color: colors.mutedForeground }]}
                    >
                      {article.news_site}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                {idx < rest.length - 1 && (
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

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <GlassCard intensity={40} padding={28} style={styles.errorBox}>
          <Ionicons name="newspaper-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            No {activeCategory} articles
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            Try a different category
          </Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  livePulse: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  pills: { gap: 8, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  centered: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorBox: { alignItems: "center", gap: 10 },
  errorTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  errorSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#000" },
  featuredCard: { overflow: "hidden", borderRadius: 16 },
  featuredImage: { width: "100%", height: 200 },
  featuredImagePlaceholder: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    lineHeight: 22,
  },
  featuredMeta: { flexDirection: "row", justifyContent: "space-between" },
  featuredSite: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  featuredTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  listCard: { overflow: "hidden" },
  articleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  articleThumb: {
    width: 72,
    height: 60,
    borderRadius: 8,
  },
  articleThumbPlaceholder: {
    width: 72,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  articleBody: { flex: 1, gap: 4 },
  articleMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  miniTagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4 },
  articleTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  articleTitle: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  articleSite: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginHorizontal: 14 },
});
