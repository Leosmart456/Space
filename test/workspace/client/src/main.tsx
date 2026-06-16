import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// ── Prevent pull-to-refresh & overscroll on Android WebView ──────────────────
// CSS overscroll-behavior:none covers most cases but Android Chrome/WebView
// still allows the native pull-to-refresh gesture via touch events. We block
// it here imperatively for 100% coverage.
(function blockPullToRefresh() {
  let startY = 0;
  let startX = 0;

  document.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;

      // Only intercept clearly downward swipes (pull-to-refresh gesture)
      if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
        const el = e.target as Element | null;
        // Walk up the DOM: if any ancestor is scrollable AND scrolled, let it scroll
        let node = el;
        while (node && node !== document.documentElement) {
          const style = window.getComputedStyle(node);
          const overflow = style.overflowY;
          const isScrollable = overflow === "auto" || overflow === "scroll";
          if (isScrollable && (node as HTMLElement).scrollTop > 0) {
            return; // Element has scroll position — allow it
          }
          node = node.parentElement;
        }
        // At document root or non-scrolled container — block the gesture
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Also block the browser's context menu on long-press (native feel)
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    // Allow context menu on inputs/textareas for copy-paste
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }
    e.preventDefault();
  });
})();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Once React has rendered its first frame, fade out the pure-HTML splash.
function dismissHtmlSplash() {
  const el = document.getElementById("html-splash");
  if (!el) return;
  el.style.opacity = "0";
  setTimeout(() => el.remove(), 450);
}

createRoot(rootElement).render(<App />);

// Use two rAF frames to guarantee the first React paint has occurred
requestAnimationFrame(() => requestAnimationFrame(dismissHtmlSplash));
