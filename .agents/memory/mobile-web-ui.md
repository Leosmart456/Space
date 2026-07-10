---
name: Mobile web UI (MobileApp)
description: How the mobile view of spacex-platform works — architecture, rendering conditions, and data strategy.
---

## Rule
On viewports < 768 px, `DashboardPage` returns `<MobileApp />` (imported from `src/components/mobile/MobileApp.tsx`) immediately after the auth/loading checks.

**Why:** The desktop dashboard has a complex sidebar + multi-section layout that doesn't translate to mobile. The MobileApp is a self-contained bottom-tab shell matching the iOS Expo app design with a "2074 Quantum Glass" futuristic aesthetic.

## Architecture (current v2)
- **5-tab liquid glass bottom nav**: Dashboard, Portfolio, Transfer, Buy, Profile
- **Tab bar**: floating pill at bottom with `backdrop-blur(40px) saturate(200%)`, active tab has cyan glow indicator
- **Sub-page overlay pattern**: `subPage` state in MobileApp shell drives full-screen overlays (no router changes needed)
- **Sub-pages available**: notifications, documents, security, notif-settings, help, about, accredited

## Design system (2074 Quantum Glass)
- `D.bg = #030814`, `D.cyan = #00e5ff`, `D.violet = #8b5cf6`, `D.emerald = #10b981`
- `glass()` helper: `rgba(15,23,42,0.72)` + `backdrop-blur(24px) saturate(180%)` + border rgba(255,255,255,0.07)
- Active elements: `box-shadow: 0 0 Xpx rgba(0,229,255,0.Y)` glow
- Tab bar: `rgba(6,12,22,0.88)` pill, 66px height, floating 12px above bottom

## Data sources
- Share price: `api.getPriceQuote()` (live, 60s refresh) with fallback to `settings.sharePrice`
- Latest SpaceX mission: `GET https://api.spacexdata.com/v5/launches/latest` (1h stale, shown in news)
- Portfolio / purchases: `api.getPurchases()`, `useUser()`, `api.getPriceHistory()`
- Transfers: `api.getTransfers()` + `api.createTransfer()` (Transfer tab)
- Desktop queries in `DashboardPage` gated with `enabled: !!isSignedIn && !isMobile`

## Sub-pages navigation
- Notification bell → NotificationsPanel (derived from purchases)
- Dashboard "Docs" button → DocumentsPage
- Portfolio accreditation card → AccreditedPage  
- Profile "Documents & Agreements" → DocumentsPage
- Profile "Notification Settings" → NotificationSettingsPage
- Profile "Security Settings" → SecurityPage
- Profile "Help & Support" → HelpPage (FAQ + mailto)
- Profile "About" → AboutPage

## Accessibility notes
- Toggle has `role="switch"` + `aria-checked` + `label` prop
- Back buttons have `aria-label="Go back"`
- Notification bell has `aria-label="Open notifications"`
- Transfer submit button gates on `.trim()` not raw string truthiness
