import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface TokenCardProps {
  symbol: string;
  name: string;
  balance: string;
  fiatValue: string;
  currencySymbol?: string;
  icon?: string;
  price?: string;
  priceChange?: string;
  chainSymbol?: string;
  chainIcon?: string;
  chainId?: string;
  onClick?: () => void;
}

export function TokenCard({
  symbol,
  name,
  balance,
  fiatValue,
  currencySymbol = "$",
  icon,
  price,
  priceChange = "+0.00",
  chainSymbol,
  chainIcon,
  chainId,
  onClick
}: TokenCardProps) {
  const isPositive = priceChange.startsWith("+") || parseFloat(priceChange) >= 0;
  const [tokenIconError, setTokenIconError] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);
  const { theme } = useTheme();

  const isNativeToken = symbol === chainSymbol;

  return (
    <div
      className="glass-panel liquid-panel cursor-pointer p-3"
      onClick={onClick}
      data-testid={chainId ? `card-token-${symbol.toLowerCase()}-${chainId}` : `card-token-${symbol.toLowerCase()}`}
    >
      <div className="glass-shine" />
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden glass-token-icon">
              {icon && !tokenIconError ? (
                <img
                  src={icon}
                  alt={symbol}
                  className="w-full h-full object-cover"
                  onError={() => setTokenIconError(true)}
                  loading="lazy"
                />
              ) : (
                <span className="text-primary font-bold text-xs sm:text-sm">{symbol[0]}</span>
              )}
            </div>
            {chainIcon && !isNativeToken && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: theme === "dark" ? "hsl(222,85%,9%)" : "white",
                  border: theme === "dark"
                    ? "1.5px solid rgba(255,255,255,0.15)"
                    : "1.5px solid rgba(0,0,0,0.10)",
                  boxShadow: theme === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.55)"
                    : "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                <div className="w-[76%] h-[76%] rounded-full overflow-hidden flex items-center justify-center">
                  {!chainIconError ? (
                    <img
                      src={chainIcon}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setChainIconError(true)}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[7px] sm:text-[8px] font-bold text-muted-foreground">{chainId?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm sm:text-base text-foreground truncate">{symbol}</p>
              {chainSymbol && (
                <span className="text-xs text-muted-foreground">({chainSymbol})</span>
              )}
            </div>
            {price && (
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-medium text-foreground">${price}</p>
                <span className={`text-xs font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive && parseFloat(priceChange) > 0 ? '+' : ''}{priceChange}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-sm sm:text-base text-foreground">{balance}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{currencySymbol}{fiatValue}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  testId?: string;
}

export function QuickActionButton({ icon, label, onClick, testId }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-150 active:scale-95"
      style={{
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.50) inset",
      }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.22)", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium text-white">{label}</span>
    </button>
  );
}
