import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineScreen() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      setShowReconnecting(false);
    };
    const handleOnline = () => {
      setShowReconnecting(true);
      setTimeout(() => {
        setOffline(false);
        setShowReconnecting(false);
      }, 800);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(222,85%,6%)",
        color: "#fff",
        fontFamily: "sans-serif",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <WifiOff size={48} color="hsl(210,100%,56%)" />
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 12,
          letterSpacing: 0.5,
        }}
      >
        {showReconnecting ? "Reconnecting…" : "No Internet Connection"}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          maxWidth: 280,
          lineHeight: 1.6,
        }}
      >
        {showReconnecting
          ? "Connection restored. Loading your wallet…"
          : "Please check your Wi-Fi or mobile data and try again. Your wallet data is safe."}
      </p>
      {!showReconnecting && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 36,
            padding: "12px 32px",
            borderRadius: 12,
            border: "none",
            background: "hsl(210,100%,56%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
