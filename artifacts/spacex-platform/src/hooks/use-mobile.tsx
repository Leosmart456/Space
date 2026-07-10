// The platform is intentionally mobile-only: the desktop dashboard layout has
// been retired, so this always reports "mobile" regardless of viewport width.
// Desktop/tablet visitors still get the full mobile UI, scaled to a phone-width
// frame by the global CSS in index.css (see ".app-mobile-frame").
export function useIsMobile() {
  return true
}
