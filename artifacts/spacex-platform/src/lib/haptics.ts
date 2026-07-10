/** Shared haptics utility — triggers browser vibration API on supported mobile browsers. */
export function vib(ms: number | number[] = 10) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported — ignore */ }
}
