---
title: Liquid Glass UI redesign
---
# Liquid Glass UI Redesign

## What & Why
Apply an Apple iOS-style "Liquid Glass" visual design throughout the wallet app — transparent, blurred, layered glass panels with soft reflections, rounded corners, and subtle depth — while keeping every feature and route fully functional.

## Done looks like
- The app background is a rich deep gradient (dark navy to indigo), visible behind glass panels in both light and dark mode
- All cards, modals, dialogs, and the bottom navigation bar use backdrop-blur glass panels with semi-transparent backgrounds, light inner-top borders for the "glass rim" effect, and soft drop shadows
- Buttons have a refined glass-pill appearance for secondary/ghost variants; the primary action button retains strong contrast but gains a subtle inner glow
- The bottom navigation bar is a floating frosted-glass pill anchored at the bottom of the screen
- Token cards on the dashboard, the swap confirmation sheet, and the send confirmation sheet all render with the glass style
- All existing pages, routes, and admin flows continue to work exactly as before — no features removed, no navigation broken

## Out of scope
- Changing any backend logic, routes, or data models
- Redesigning the admin panel (admin pages keep their existing styling)
- Changing layout structure, page hierarchy, or navigation flow
- Adding new pages or features

## Tasks
1. **Expand glass CSS utilities** — Grow `liquid-glass.css` with a comprehensive set of utility classes: `glass-panel` (main card surface), `glass-nav` (bottom bar), `glass-modal` (dialogs/sheets), `glass-input` (text inputs), and `glass-button` (secondary/ghost buttons). Each class must include fallbacks for browsers without `backdrop-filter` support. Add keyframe animations for a subtle shimmer/shine sweep on panels.

2. **Update color variables for glass theme** — In `index.css`, adjust `:root` and `.dark` CSS variable values so `--background`, `--card`, `--sidebar`, `--popover`, and `--border` become translucent or deeper values that complement the glass overlay look. Add a `--glass-bg`, `--glass-border`, `--glass-shadow` set of variables for explicit glass use. Apply a CSS gradient mesh to the `body` element so the rich background colour shows through glass panels.

3. **Convert shared components to glass style** — Apply glass classes to the shared components that appear on every screen: `BottomNav` becomes a floating frosted-glass pill, `ProcessingOverlay` uses a glass modal backdrop, and `TokenCard` uses glass-panel surface. Do not alter component logic, only className/style.

4. **Convert user-facing page surfaces to glass** — Apply glass-panel styling to the main content cards and page headers on the high-traffic user pages: Dashboard, Send, Swap (including the confirmation bottom sheet), Market, Login, and Create Account. Admin pages are excluded. Do not change any route, state, or mutation logic.

## Relevant files
- `client/src/styles/liquid-glass.css`
- `client/src/index.css`
- `client/src/components/bottom-nav.tsx`
- `client/src/components/processing-overlay.tsx`
- `client/src/components/token-card.tsx`
- `client/src/pages/dashboard.tsx`
- `client/src/pages/send.tsx`
- `client/src/pages/swap.tsx`
- `client/src/pages/login.tsx`
- `client/src/pages/create-account.tsx`
- `client/src/pages/market.tsx`