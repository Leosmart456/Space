import { Wallet, ChartCandlestick, Repeat } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation('common');

  const navItems = [
    { nameKey: "bottomNav.wallet",  icon: Wallet,           path: "/dashboard", testId: "nav-wallet" },
    { nameKey: "bottomNav.market",  icon: ChartCandlestick, path: "/market",    testId: "nav-market" },
    { nameKey: "bottomNav.swap",    icon: Repeat,           path: "/swap",      testId: "nav-swap"   },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location === "/" || location === "/dashboard";
    return location.startsWith(path);
  };

  const activeIndex = navItems.findIndex((item) => isActive(item.path));
  const tabWidthPct = 100 / navItems.length;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)",
        maxWidth: "380px",
        zIndex: 40,
      }}
    >
      {/* glass-nav has overflow:hidden — clips the blob so it never escapes the pill */}
      <div className="glass-nav px-2 py-1.5">
        <div style={{ position: "relative" }}>

          {/* Water blob — rendered at nav row level, clipped by glass-nav's overflow:hidden.
              Animates its x position when activeIndex changes — always stays inside the pill. */}
          {activeIndex !== -1 && (
            <motion.div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${tabWidthPct}%`,
                pointerEvents: "none",
                originX: 0.5,
                originY: 0.5,
              }}
              animate={{
                x: `${activeIndex * 100}%`,
                borderRadius: [
                  "999px",
                  "44% 56% 52% 48% / 50% 48% 52% 50%",
                  "52% 48% 46% 54% / 48% 52% 48% 52%",
                  "999px",
                ],
                scaleX: [1, 1.12, 0.95, 1],
                scaleY: [1, 0.84, 1.10, 1],
                background: [
                  "radial-gradient(ellipse at 50% 50%, rgba(22,119,255,0.26) 0%, rgba(22,119,255,0.08) 65%, transparent 100%)",
                  "radial-gradient(ellipse at 50% 50%, rgba(22,119,255,0.38) 0%, rgba(22,119,255,0.14) 65%, transparent 100%)",
                  "radial-gradient(ellipse at 50% 50%, rgba(22,119,255,0.26) 0%, rgba(22,119,255,0.08) 65%, transparent 100%)",
                ],
              }}
              transition={{
                x: { type: "spring", stiffness: 160, damping: 36, mass: 1.1 },
                borderRadius: { duration: 0.85, ease: "easeInOut", times: [0, 0.35, 0.70, 1] },
                scaleX: { duration: 0.85, ease: [0.34, 1.2, 0.64, 1], times: [0, 0.35, 0.70, 1] },
                scaleY: { duration: 0.85, ease: [0.34, 1.2, 0.64, 1], times: [0, 0.35, 0.70, 1] },
                background: { duration: 0.85, ease: "easeInOut", times: [0, 0.35, 1] },
              }}
            />
          )}

          {/* Nav buttons — no overflow:hidden, just zIndex above the blob */}
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.nameKey}
                  onClick={() => setLocation(item.path)}
                  className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 select-none"
                  data-testid={item.testId}
                  whileTap={{ scale: 0.90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    flex: 1,
                    position: "relative",
                    zIndex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-300 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {t(item.nameKey)}
                  </span>
                </motion.button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
