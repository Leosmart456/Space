import React, { useEffect, useRef, useState, memo } from "react";

interface TradingViewWidgetProps {
  height?: number | string;
}

function TradingViewWidget({ height = 420 }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    if (container.current.querySelector('script[src*="tradingview"]')) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: "area",
      fontColor: "rgba(200,210,220,0.7)",
      gridLineColor: "rgba(255,255,255,0.04)",
      volumeUpColor: "rgba(34,171,148,0.4)",
      volumeDownColor: "rgba(247,82,95,0.4)",
      backgroundColor: "rgba(0,0,0,0)",
      widgetFontColor: "rgba(200,210,220,0.85)",
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      chartOnly: false,
      scalePosition: "no-scale",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      valuesTracking: "1",
      changeMode: "price-and-percent",
      symbols: [["NASDAQ:SPCX|1D"]],
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
      fontSize: "10",
      headerFontSize: "medium",
      autosize: true,
      width: "100%",
      height: "100%",
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
    });

    container.current.appendChild(script);

    const observer = new MutationObserver(() => {
      const iframe = container.current?.querySelector("iframe");
      if (!iframe) return;
      observer.disconnect();
      const reveal = () => setTimeout(() => setReady(true), 600);
      if (iframe.contentDocument?.readyState === "complete") {
        reveal();
      } else {
        iframe.addEventListener("load", reveal);
      }
    });

    observer.observe(container.current, { childList: true, subtree: true });
    const fallback = setTimeout(() => setReady(true), 8000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      style={{
        position: "relative",
        height: h,
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        // Blend all four edges into the black page background
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)",
        WebkitMaskComposite: "source-in",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)",
        maskComposite: "intersect",
      }}
    >
      {/* Widget container — fully transparent background */}
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "calc(100% - 22px)", width: "100%", background: "transparent" }}
        />
        <div style={{ padding: "3px 4px 0", textAlign: "right", background: "transparent" }}>
          <a
            href="https://www.tradingview.com/symbols/NASDAQ-SPCX/"
            rel="noopener nofollow"
            target="_blank"
            style={{ color: "#60a5fa", fontSize: 10, textDecoration: "none" }}
          >
            SPCX chart
          </a>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}> · TradingView</span>
        </div>
      </div>

      {/* Fade-out loader overlay — transparent, not dark, so user sees skeleton not black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(8,12,18,0.85)",
          backdropFilter: "blur(4px)",
          opacity: ready ? 0 : 1,
          transition: ready ? "opacity 700ms ease" : "none",
          pointerEvents: "none",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!ready && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,255,0.6)" strokeWidth="1.5" style={{ animation: "spin 1.4s linear infinite" }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em" }}>Loading chart…</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
