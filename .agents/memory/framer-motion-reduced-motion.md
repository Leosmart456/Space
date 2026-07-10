---
name: Framer Motion reduced-motion gating
description: CSS prefers-reduced-motion media queries don't stop Framer Motion (layout/spring/animate) — must gate in JS too.
---

A `prefers-reduced-motion` CSS override only disables CSS transitions/keyframes; it has no effect on Framer Motion's JS-driven `layout`, `animate`, or spring transitions, which keep running.

**Why:** discovered while building a self-solving jigsaw puzzle animation (spacex-platform landing page broker showcase) — the CSS reduced-motion block was in place but motion-sensitive users would still see continuous spring-driven piece movement.

**How to apply:** use Framer Motion's `useReducedMotion()` hook in the component. Gate `layout` (`layout={!prefersReducedMotion}`) and use `transition={{ duration: 0 }}` when true, or skip the animation loop/timers entirely and render the final/settled state statically.
