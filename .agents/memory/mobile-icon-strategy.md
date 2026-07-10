---
name: Mobile icon strategy
description: Which icon library to use in the mobile app tab layout and why
---

**Rule:** All tab icons must use `Ionicons` from `@expo/vector-icons` — never Feather or other libraries in the tab layout.

**Why:** Mixing Feather + Ionicons caused Android font loading failures, rendering icon glyphs as garbled Chinese/Japanese characters. Standardizing on Ionicons alone fixes Android rendering.

**iOS / Liquid Glass path:** `isLiquidGlassAvailable()` from `expo-glass-effect` gates native SF Symbols via `expo-router/unstable-native-tabs`. This only runs on iOS 26+ with Liquid Glass available. All other platforms fall through to `ClassicTabLayout` which uses Ionicons only.

**Mappings used:**
- Dashboard: `trending-up-outline`
- Portfolio: `briefcase-outline`
- Buy: `add-circle-outline`
- Profile: `person-outline`
