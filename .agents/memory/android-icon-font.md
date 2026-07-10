---
name: Android Ionicons font loading
description: Why Ionicons must be explicitly loaded in useFonts() on Android
---

**Rule:** Always spread `...Ionicons.font` (and any other @expo/vector-icons font) inside the `useFonts()` call in `app/_layout.tsx`.

**Why:** Android does NOT auto-load @expo/vector-icons TTF fonts. Without explicit loading, every icon glyph falls back to the system font. On Chinese/CJK Android devices, the Ionicons Unicode codepoints map to CJK characters (e.g. "鑫", "林", "票"), making all icons appear as garbled Chinese text. iOS Expo Go auto-loads these fonts; Android does not.

**How to apply:**
```tsx
import { Ionicons } from "@expo/vector-icons";
const [fontsLoaded] = useFonts({
  Inter_400Regular,
  // ... other fonts
  ...Ionicons.font,  // loads ionicons.ttf
});
```

If adding other icon sets (MaterialIcons, FontAwesome, etc.), spread their `.font` property here too.
