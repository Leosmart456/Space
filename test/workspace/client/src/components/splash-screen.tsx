import { useEffect, useState } from "react";

export const SPLASH_ANIMATION_VERSION = "fb-dots-v10";

interface SplashScreenProps {
  onDone: () => void;
  minimal?: boolean;
}

export function SplashScreen({ onDone, minimal = false }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  const bg = "hsl(218,60%,97%)";
  const dotIdle = "rgba(0,0,0,0.12)";
  const dotActive = "hsl(210,100%,44%)";

  useEffect(() => {
    const duration = minimal ? 700 : 1800;
    const fadeTimer = setTimeout(() => setFading(true), duration);
    const doneTimer = setTimeout(() => onDone(), duration + 400);

    // On mobile, browsers pause JS timers when the app is backgrounded.
    // If the user returns after the splash was supposed to be gone, dismiss it immediately.
    const handleVisibilityChange = () => {
      if (!document.hidden) onDone();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onDone, minimal]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        transition: "opacity 0.4s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Center: Logo + dots */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          animation: "splash-enter 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Logo — served from /public so it's always available */}
        <img
          src="/lumirra-logo.png"
          alt="Lumirra"
          style={{
            width: minimal ? 60 : 80,
            height: minimal ? 60 : 80,
            objectFit: "contain",
            filter:
              "drop-shadow(0 6px 22px rgba(22,119,255,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.18))",
            marginBottom: 20,
          }}
        />

        {/* Animated dots */}
        <DotsRow dotIdle={dotIdle} dotActive={dotActive} />
      </div>

      {/* Bottom: Brand name */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation:
            "splash-enter 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both",
        }}
      >
        <span
          style={{
            fontSize: minimal ? 22 : 26,
            fontWeight: 900,
            letterSpacing: "0.03em",
            color: "#1a2a4a",
            textShadow:
              "0 3px 16px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.14)",
            fontFamily: "inherit",
          }}
        >
          Lumirra Wallet
        </span>
        {/* Dark shadow band below text */}
        <div
          style={{
            width: 130,
            height: 6,
            marginTop: 6,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.18) 0%, transparent 80%)",
            borderRadius: "50%",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-enter {
          from { opacity: 0; transform: scale(0.88) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fb-dot {
          0%, 55%, 100% { transform: scale(0.7); background: ${dotIdle}; }
          27% { transform: scale(1.25); background: ${dotActive}; }
        }
      `}</style>
    </div>
  );
}

const CYCLE = 1.4;
const COUNT = 5;

function DotsRow({
  dotIdle,
  dotActive,
}: {
  dotIdle: string;
  dotActive: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: dotIdle,
            animation: `fb-dot ${CYCLE}s ease-in-out ${((i * CYCLE) / COUNT).toFixed(2)}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
