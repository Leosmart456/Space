import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";

import { LiquidTabBar } from "@/components/LiquidTabBar";
import { useColors } from "@/hooks/useColors";

function tabHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function ClassicTabLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trending-up" : "trending-up-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "pie-chart" : "pie-chart-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "reader" : "reader-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
      <Tabs.Screen
        name="buy"
        options={{
          title: "Buy",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "rocket" : "rocket-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: "Transfer",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "swap-horizontal" : "swap-horizontal-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: tabHaptic,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}
