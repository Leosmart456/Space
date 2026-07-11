# Lumirra Crypto Wallet - Design Guidelines

## Design Philosophy

**Trust-First Experience**: Clear, calm visuals that communicate security and value. The interface should feel professional, trustworthy, and modern - comparable to Trust Wallet's polish but with Lumirra's unique blue diamond identity.

**Approach**: Reference-based design drawing from Trust Wallet's multichain wallet patterns, combined with modern fintech aesthetics (think Coinbase meets Stripe's minimalism).

## Brand Identity

**Logo**: Blue diamond with bold "L" - this diamond motif should appear throughout the interface as a trust marker
**Personality**: Secure, innovative, transparent, value-focused
**Visual Language**: Clean geometry, rounded edges, glass-like UI cards with subtle gradients

## Color System

### Primary Palette
- **Lumirra Blue** (#1677FF): Main brand color for CTAs, highlights, primary actions
- **Sky Lumirra** (#4DA3FF): Hover states, active elements, gradients
- **Deep Lumirra** (#004ECC): Pressed states, dark mode accents
- **Diamond Cyan** (#2ED8FF): Accent color for gradients, secondary CTAs

### Semantic Colors
- **Success/Green** (#2ECC71): Transaction confirmations, success states
- **Error/Red** (#E74C3C): Failed transactions, critical alerts
- **Warning/Amber** (#F1C40F): Fee warnings, gas alerts

### Backgrounds & Text
- **Light Mode Background**: #F7FAFF (Glacier White)
- **Dark Mode Background**: #0B1320 (Midnight Navy)
- **Dark Mode Cards**: #101828
- **Primary Text**: #0B1320 (Sapphire Black)
- **Secondary Text**: #5B6670 (Cloud Gray)

### Brand Gradient
Use liberally for hero sections, logo glows, premium CTAs:
```
linear-gradient(135deg, #1677FF 0%, #2ED8FF 100%)
```

## Typography

**Fonts**: Poppins (headings), Inter (body/UI)

- **H1/Hero Headlines**: Poppins SemiBold, 28-36px mobile / 48-64px web
- **H2/Section Headers**: Poppins SemiBold, 20-24px
- **Body Text**: Inter Regular, 16px mobile / 18px web
- **UI Labels/Small**: Inter Medium, 12-14px
- **Button Text**: Inter SemiBold, 16px

## Layout & Spacing

**Spacing Scale**: Use 4, 8, 12, 16, 24, 32, 48, 64px units consistently
**Container Max Width**: 1200px for dashboard content, full-width for hero sections
**Card Border Radius**: 16px for main cards, 12px for buttons
**Grid**: Flexible grid for token cards (2-4 columns depending on viewport)

## Core Screens & Flows

### Welcome/Onboarding
- **Hero Section**: Full-viewport with gradient background (Lumirra Blue → Diamond Cyan), centered diamond logo with subtle glow effect
- **CTAs**: Two prominent buttons - "Create Wallet" (primary blue, filled) and "Restore Wallet" (outline)
- **Microcopy**: "Welcome to Lumirra — Your secure crypto vault"

### Seed Phrase Display
- **Layout**: Large card with diamond watermark background (subtle, 10% opacity)
- **Word Display**: 12/24 words in a grid (3-4 columns), each word in a subtle pill/chip
- **Warning Banner**: High-contrast yellow warning with clear security messaging
- **Actions**: "I wrote it down" checkbox, copy button, "Hide seed" toggle

### Dashboard/Home
- **Header Bar**: Blue gradient background, total portfolio value (large, bold), chain selector dropdown
- **Token Cards**: Horizontal swipeable cards showing: token icon, name, balance, fiat value
  - Card style: White background, soft shadow, rounded corners
  - Layout: 2-3 columns on tablet/desktop, single column mobile
- **Quick Actions Row**: Four icon buttons (Send, Receive, Swap, Connect) with labels
- **Recent Transactions**: List view with status badges (pending/confirmed/failed), timestamp, amounts

### Send Flow (Multi-Step)
- **Step 1**: Recipient input with QR scan button, address validation indicator
- **Step 2**: Asset selector + amount input with fiat conversion shown inline
- **Step 3**: Gas fee editor - preset options (Fast/Normal/Slow) + advanced slider
- **Step 4**: Confirmation modal with diamond emblem, large amount display, review details
- **Step 5**: Success screen with confetti animation (subtle), transaction hash with copy button

### Receive
- **Modal Layout**: Centered QR code (large, high contrast), address below with copy button
- **Background**: Blurred backdrop with glass-morphism card effect

### Swap Interface
- **Layout**: Two-panel design (From → To) with swap direction toggle in center
- **Quote Display**: Show price impact, slippage tolerance, aggregator source
- **CTA**: Large blue gradient button "Confirm Swap"

## Component Specifications

### Buttons
- **Primary**: Lumirra Blue (#1677FF) background, white text, 12px radius, shadow (0 4px 10px rgba(22,119,255,0.25))
- **Secondary**: 2px solid border, Lumirra Blue text, transparent background
- **Danger**: Error Red background, white text
- **Height**: 44px minimum for touch targets

### Cards
- **Background**: White (light mode), #101828 (dark mode)
- **Shadow**: 0 4px 12px rgba(11,19,32,0.05)
- **Border Radius**: 16px
- **Padding**: 16-24px

### Input Fields
- **Border**: 1px solid #D0D7E2
- **Focus Ring**: 2px solid Lumirra Blue
- **Placeholder**: #A0AEC0
- **Height**: 44px minimum

### Modals
- **Backdrop**: Blurred background with dark overlay (60% opacity)
- **Card**: White/dark card, centered, 16px radius, strong shadow
- **Header**: Bold title, close button (X)
- **Footer**: CTA buttons aligned right

## Visual Effects

### Shadows & Elevation
- **Cards**: 0 4px 12px rgba(11,19,32,0.05)
- **Buttons**: 0 4px 10px rgba(22,119,255,0.25)
- **Modals**: 0 12px 24px rgba(4,12,20,0.12)
- **Glow Effect**: 0 0 20px rgba(22,119,255,0.35) for diamond logo

### Animations (Use Sparingly)
- **Button Press**: 98% scale with 120ms easing
- **Transaction Success**: Subtle confetti particles + success toast
- **Seed Reveal**: Gentle upward reveal with shimmer on each word
- **Loading**: Rotating diamond spinner using Lumirra gradient
- **Durations**: 120-240ms for micro-interactions, 400-600ms for transitions

## Iconography
- **Style**: Geometric, 2px stroke weight for line icons
- **Size**: 24px standard, 32px for primary actions, 48px for hero elements
- **Color**: Lumirra Blue for primary actions, Cloud Gray for secondary
- **Diamond Emblem**: Use as unique trust marker in confirmations and headers

## Dark Mode
- Maintain blue accent brightness (#1677FF stays vibrant)
- Reduce shadows, add subtle outer glows instead
- Use #101828 for card surfaces
- Text: #E2E8F0 for primary, reduced opacity for secondary

## Images

**Hero Section**: Use a abstract/geometric illustration of a diamond with blockchain network nodes in the background, rendered with the Lumirra gradient (blue to cyan). This should feel premium and tech-forward.

**Token Icons**: Standard crypto token logos from established libraries
**Chain Badges**: Ethereum, BSC, Polygon logos/icons
**Illustrations**: Minimal geometric shapes with gradient overlays for empty states

## Accessibility
- Text contrast minimum 4.5:1 for body text, 3:1 for large text
- All interactive elements minimum 44px touch targets
- Keyboard navigation support throughout
- Screen reader labels on all controls
- Dynamic font scaling support

## Key UX Patterns
- **Confirmation Flow**: Always show: network, amount, recipient, gas fee before signing
- **Seed Safety**: Repeated warnings, "I understand" checkboxes, test word confirmation
- **Transaction Status**: Clear visual indicators (pending spinner, success checkmark, error X)
- **Gas Estimation**: Show presets AND allow manual adjustment
- **Network Switching**: Small modal with network icon and elastic dropdown animation