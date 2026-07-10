import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

/** Minimal shape of the props React Navigation's `<Tabs tabBar={...} />` passes
 * through from expo-router. Declared locally (instead of importing
 * `BottomTabBarProps` from `@react-navigation/bottom-tabs`) because that
 * package is only a transitive dependency of expo-router here, not a direct
 * one, so its types aren't reliably resolvable from this package. */
type TabBarRoute = { key: string; name: string };
type TabBarDescriptor = {
  options: {
    title?: string;
    tabBarShowLabel?: boolean;
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  };
};
type LiquidTabBarProps = {
  state: { index: number; routes: TabBarRoute[] };
  descriptors: Record<string, TabBarDescriptor>;
  navigation: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit: (event: any) => any;
    navigate: (name: string) => void;
  };
};

/**
 * Custom animated bottom tab bar.
 *
 * Renders its own "liquid" pill highlight instead of relying on the OS-level
 * Liquid Glass tab bar, whose sliding highlight can visually detach from the
 * bar during fast tab switches. The pill here is clipped to the bar's own
 * bounds (`overflow: hidden`) so it can never escape the panel, animates with
 * a spring for a smooth glide, and gives each tap a small haptic + scale
 * "bounce" for tactile feedback.
 */
export function LiquidTabBar({ state, descriptors, navigation }: LiquidTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";

  const routeCount = state.routes.length;
  const barHeight = isWeb ? 64 : 56 + insets.bottom;

  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = routeCount > 0 ? barWidth / routeCount : 0;

  const pillX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      pillX.value = withSpring(state.index * tabWidth, {
        damping: 18,
        stiffness: 220,
        mass: 0.6,
      });
    }
  }, [state.index, tabWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: tabWidth,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          height: barHeight,
          paddingBottom: isWeb ? 8 : insets.bottom,
          overflow: "hidden",
        },
      ]}
    >
      {/* Background — frosted glass, contained within the bar */}
      <View style={StyleSheet.absoluteFill}>
        {isWeb ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
            ]}
          />
        ) : (
          <>
            <BlurView intensity={isAndroid ? 60 : 80} tint="dark" style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isAndroid ? "rgba(8, 12, 18, 0.75)" : "rgba(8, 12, 18, 0.45)",
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: "rgba(255,255,255,0.10)",
                },
              ]}
            />
          </>
        )}
      </View>

      {/* Sliding liquid pill — clipped to the bar, never escapes it */}
      {tabWidth > 0 && (
        <Animated.View style={[styles.pillTrack, pillStyle]} pointerEvents="none">
          <View
            style={[
              styles.pill,
              { backgroundColor: `${colors.primary}22`, borderColor: `${colors.primary}55` },
            ]}
          />
        </Animated.View>
      )}

      {/* Tab row */}
      <View
        style={styles.row}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.mutedForeground;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              focused={focused}
              color={color}
              label={label}
              icon={options.tabBarIcon}
              showLabel={options.tabBarShowLabel !== false}
              isWeb={isWeb}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

type TabButtonProps = {
  focused: boolean;
  color: string;
  label: string;
  icon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  showLabel: boolean;
  isWeb: boolean;
  onPress: () => void;
};

/** A single tab trigger with its own tap "bounce" — kept as a dedicated
 * component (rather than inline in a `.map`) so its Reanimated shared value
 * follows the Rules of Hooks correctly. */
function TabButton({ focused, color, label, icon, showLabel, isWeb, onPress }: TabButtonProps) {
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSequence(
      withSpring(0.85, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      style={styles.tab}
      hitSlop={8}
    >
      <Animated.View style={[styles.tabInner, scaleStyle]}>
        {icon?.({ focused, color, size: 22 })}
        {showLabel && <Animated.Text style={[styles.label, { color }]}>{label}</Animated.Text>}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  pillTrack: {
    position: "absolute",
    top: 4,
    bottom: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pill: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 1,
  },
});
