import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const ROOT_PAGES = new Set(["/", "/dashboard", "/login", "/create-account", "/welcome"]);

let backPressCount = 0;
let backPressTimer: ReturnType<typeof setTimeout> | null = null;

export function useBackButton() {
  const [location] = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const current = locationRef.current;
      const isRoot = ROOT_PAGES.has(current);

      if (isRoot) {
        // Re-push so the user doesn't accidentally leave
        window.history.pushState(null, "", current);

        backPressCount++;
        if (backPressTimer) clearTimeout(backPressTimer);

        if (backPressCount >= 2) {
          backPressCount = 0;
          // Signal the Android WebView to close the app
          // Works when the WebView's activity listens for this event
          if ((window as any).Android?.exitApp) {
            (window as any).Android.exitApp();
          } else {
            // Fallback: navigate to a blank page (WebView treats this as exit)
            window.history.go(-(window.history.length));
          }
        } else {
          showExitToast();
          backPressTimer = setTimeout(() => {
            backPressCount = 0;
          }, 2500);
        }
      }
      // Non-root pages: let the browser handle history.back() normally (wouter routes)
    };

    // Ensure there's always a state to pop from on root pages
    if (ROOT_PAGES.has(location)) {
      window.history.pushState(null, "", location);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location]);
}

function showExitToast() {
  const existing = document.getElementById("__exit-toast__");
  if (existing) return;

  const toast = document.createElement("div");
  toast.id = "__exit-toast__";
  toast.textContent = "Press back again to exit";
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "calc(24px + env(safe-area-inset-bottom))",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(30,40,70,0.92)",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "20px",
    fontSize: "14px",
    fontFamily: "sans-serif",
    zIndex: "999999",
    pointerEvents: "none",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
    whiteSpace: "nowrap",
  });
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2400);
}
