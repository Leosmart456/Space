import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 60,
  padding = 20,
}: GlassCardProps) {
  const colors = useColors();

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint="systemThinMaterialDark"
        style={[
          styles.base,
          {
            padding,
            borderColor: "rgba(255,255,255,0.12)",
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          padding,
          backgroundColor: "rgba(13,17,25,0.85)",
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
});
