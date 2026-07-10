import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Platform } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setToken } from "@/lib/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function DevAutoLogin() {
  const { refreshData, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== "web" || isLoading) return;
    const params = new URLSearchParams(window.location.search);
    const devToken = params.get("devToken");
    if (devToken) {
      (async () => {
        await setToken(devToken);
        await refreshData();
        router.replace("/(tabs)");
      })();
    }
  }, [isLoading]);
  return null;
}

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inTabs = segments[0] === "(tabs)";
    if (!user && inTabs) {
      router.replace("/sign-in");
    } else if (user && !inTabs && (segments[0] as string) !== "(tabs)") {
      const publicRoutes = ["sign-in", "apply"];
      if (publicRoutes.includes(segments[0] as string)) {
        router.replace("/(tabs)");
      }
    }
  }, [user, isLoading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGuard />
      <DevAutoLogin />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="apply" options={{ headerShown: false }} />
        <Stack.Screen
          name="purchase/[id]"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="documents"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="security"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="support"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="accreditation"
          options={{ presentation: "card", headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Explicitly load the Ionicons font on all platforms —
    // Android does NOT auto-load @expo/vector-icons fonts, which causes
    // every glyph to render as a CJK character from the system fallback font.
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
