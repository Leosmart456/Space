import { createContext, useContext, ReactNode } from "react";
import { queryClient } from "./queryClient";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Module-level WebSocket manager — runs outside React to avoid hook issues
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_ATTEMPTS = 10;
  private started = false;
  private isConnected = false;

  start() {
    if (this.started) return;
    this.started = true;
    this.checkAuthAndConnect();

    // Resume WS connection when device comes back online
    window.addEventListener("online", () => {
      if (!this.isConnected) {
        this.reconnectAttempts = 0;
        this.checkAuthAndConnect();
      }
    });
  }

  private async checkAuthAndConnect() {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include", method: "GET" });
      if (res.ok) {
        this.connect();
      }
    } catch {
      // not authenticated yet — will be triggered again on login
    }
  }

  private startPollingFallback() {
    if (this.pollInterval) return;
    // When WS is down, silently re-fetch critical data every 30s.
    // invalidateQueries keeps existing cached data visible during refetch
    // so there is zero loading-state flicker.
    this.pollInterval = setInterval(() => {
      if (this.isConnected) {
        this.stopPollingFallback();
        return;
      }
      // Core financial data
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      // Prices & market
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      // Notifications badge
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      // Swap orders
      queryClient.invalidateQueries({ queryKey: ["/api/swap-orders"] });
    }, 30_000);
  }

  private stopPollingFallback() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  connect() {
    if (typeof window === "undefined") return;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.stopPollingFallback();
        // Immediately refresh core data on reconnect to catch anything missed
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
        } catch {}
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        this.ws = null;
        this.isConnected = false;
        // Start polling fallback so UI stays fresh while WS is down
        this.startPollingFallback();

        if (this.reconnectAttempts < this.MAX_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };
    } catch {}
  }

  reconnectNow() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectAttempts = 0;
    this.checkAuthAndConnect();
  }

  private playNotificationSound() {
    try {
      import("./sound").then(({ playNotificationSound }) => {
        playNotificationSound();
      }).catch(() => {
        const audio = new Audio("/notification.wav");
        audio.volume = 0.8;
        audio.play().catch(() => {});
      });
    } catch {}
  }

  private showSystemNotification(message: WebSocketMessage) {
    try {
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        const title = message.title || "Lumirra Wallet";
        const body = message.body || "You have a new notification.";
        const n = new Notification(title, {
          body,
          icon: "/favicon.png",
          tag: message.notificationId || "lumirra-notification",
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      }
    } catch {}
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "balance_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        break;
      case "notification_created":
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        // Play sound on any page — use the shared primed audio via sound.ts
        this.playNotificationSound();
        // Show OS-level notification when the user is on a different tab/window
        this.showSystemNotification(message);
        // Dispatch in-app event so WebView (and any active page) can show a toast
        try {
          window.dispatchEvent(new CustomEvent("lumirra:notification", {
            detail: { title: message.title, body: message.body },
          }));
        } catch {}
        break;
      case "transaction_created":
      case "transaction_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        break;
      case "swap_order_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/swap-orders"] });
        if (message.orderId) {
          queryClient.invalidateQueries({ queryKey: ["/api/swap-orders", message.orderId] });
        }
        break;

      // ── Prices / market data ───────────────────────────────────────────────
      // TanStack Query re-fetches in the background, keeping existing data
      // visible until fresh data arrives — no loading-state flicker.
      case "price_updated":
      case "prices_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
        queryClient.invalidateQueries({ queryKey: ["/api/market"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
        if (message.symbol) {
          queryClient.invalidateQueries({ queryKey: ["/api/prices", message.symbol] });
        }
        break;

      case "fee_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/fees", message.tokenSymbol] });
        queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
        break;
      case "user_fees_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/admin/user-fees"] });
        break;
      case "support_chat_message":
        queryClient.invalidateQueries({ queryKey: ["/api/support-chat"] });
        break;
      case "support_chat_unread_update":
        queryClient.setQueryData(["/api/support-chat/unread-count"], { unreadCount: message.unreadCount });
        queryClient.setQueryData(["/api/support-chat"], (old: any) => {
          if (old) return { ...old, unreadUserCount: message.unreadCount };
          return old;
        });
        break;
      case "support_chat_message_edited":
        queryClient.invalidateQueries({ queryKey: ["/api/support-chat"] });
        break;
      default:
        break;
    }
  }
}

// Singleton instance — start immediately at module load so no React hook is needed
export const wsManager = new WebSocketManager();
wsManager.start();

// Context
interface WebSocketContextType {
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({ reconnect: () => {} });

export function useWebSocket() {
  return useContext(WebSocketContext);
}

// No hooks used here — wsManager is already started at module level above
export function WebSocketProvider({ children }: { children: ReactNode }) {
  return (
    <WebSocketContext.Provider value={{ reconnect: () => wsManager.reconnectNow() }}>
      {children}
    </WebSocketContext.Provider>
  );
}
