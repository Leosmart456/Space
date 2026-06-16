// Pre-loaded audio element, unlocked during a user gesture on the Confirm tap.
// Subsequent .play() calls on the same element are permitted by the browser
// even outside a user gesture context.
let primedAudio: HTMLAudioElement | null = null;

// When true, playNotificationSound() is a no-op.
// Set to true while the processing animation is active so the incoming
// WebSocket notification does not play the sound prematurely.
// Sound stays suppressed until the user reaches the dashboard.
let soundSuppressed = false;

export function setSoundSuppressed(suppressed: boolean): void {
  soundSuppressed = suppressed;
}

// Call this synchronously inside the Confirm button's click handler.
// It creates and starts the audio (to satisfy the browser's autoplay policy),
// then immediately pauses and resets — the element stays "unlocked" for later.
export function primeAudio(): void {
  try {
    primedAudio = new Audio("/notification.wav");
    primedAudio.volume = 0; // Silent during prime — just unlocking the element
    primedAudio.play().then(() => {
      if (primedAudio) {
        primedAudio.pause();
        primedAudio.currentTime = 0;
        primedAudio.volume = 0.8; // Restore volume for the real play
      }
    }).catch(() => {});
  } catch {
    primedAudio = null;
  }
}

// Play using the pre-unlocked element (e.g. when user arrives at dashboard).
// Falls back to a fresh Audio() if primeAudio() was never called.
// No-op if setSoundSuppressed(true) is active.
export function playNotificationSound(): void {
  if (soundSuppressed) return;
  try {
    if (primedAudio) {
      primedAudio.currentTime = 0;
      primedAudio.volume = 0.8;
      primedAudio.play().catch(() => {});
    } else {
      const a = new Audio("/notification.wav");
      a.volume = 0.8;
      a.play().catch(() => {});
    }
  } catch {
    // Silently ignore
  }
}

// Play the success sound unconditionally — bypasses the suppression flag.
// Used when the checkmark/tick appears in the ProcessingOverlay so the user
// gets immediate audio feedback regardless of WS suppression state.
export function playSuccessSound(): void {
  try {
    if (primedAudio) {
      primedAudio.currentTime = 0;
      primedAudio.volume = 0.8;
      primedAudio.play().catch(() => {});
    } else {
      const a = new Audio("/notification.wav");
      a.volume = 0.8;
      a.play().catch(() => {});
    }
  } catch {
    // Silently ignore
  }
}

// Signal that the dashboard should play the notification sound on next load.
// Call this just before navigating away from the send/swap page.
export function scheduleDashboardSound(): void {
  try {
    localStorage.setItem("lumirra-pending-success-sound", "1");
  } catch {}
}

// Check and consume the pending dashboard sound flag.
// Returns true if a sound should be played (and clears the flag).
export function consumePendingDashboardSound(): boolean {
  try {
    const pending = localStorage.getItem("lumirra-pending-success-sound");
    if (pending) {
      localStorage.removeItem("lumirra-pending-success-sound");
      return true;
    }
  } catch {}
  return false;
}
