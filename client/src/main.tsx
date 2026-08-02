import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// When the frontend (Vercel) and backend (Railway) are on different domains,
// set VITE_BACKEND_URL=https://your-service.up.railway.app in Vercel's env vars.
// This interceptor transparently prefixes every /api/* and /ws fetch call so
// no individual component needs to know about the backend URL.
// Falls back to the hardcoded Railway URL in production builds where the env
// var is not injected at Vite build time.
const RAILWAY_BACKEND = "https://space-production-679e.up.railway.app";
const _backendUrl = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  (import.meta.env.PROD ? RAILWAY_BACKEND : "")
)?.replace(/\/$/, "");
if (_backendUrl) {
  const _origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.startsWith("/api") || url.startsWith("/ws")) {
      const prefixed = `${_backendUrl}${url}`;
      return _origFetch(typeof input === "string" ? prefixed : new Request(prefixed, input as Request), init);
    }
    return _origFetch(input, init);
  };
}

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
