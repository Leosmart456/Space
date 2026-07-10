import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface TradingViewChartProps {
  height?: number;
}

const BG = "#080c12";

// Injected into the WebView page — watches for TradingView's inner iframe,
// then posts a message when that iframe fires its load event.
const INJECT_JS = `
(function () {
  var sent = false;
  function notify() {
    if (sent) return;
    sent = true;
    try { window.ReactNativeWebView.postMessage('tv-ready'); } catch(_) {}
  }
  // Watch for TradingView to inject its iframe into the page
  var obs = new MutationObserver(function () {
    var iframe = document.querySelector('iframe');
    if (!iframe) return;
    obs.disconnect();
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      setTimeout(notify, 1800);
    } else {
      iframe.addEventListener('load', function () { setTimeout(notify, 1800); });
    }
    // Hard fallback in case the iframe load event never fires (cross-origin block)
    setTimeout(notify, 10000);
  });
  obs.observe(document.body, { childList: true, subtree: true });
  // Absolute fallback if the observer itself misses everything
  setTimeout(notify, 8000);
})();
true;
`;

const TV_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  :root { color-scheme: dark; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    background: ${BG} !important;
    background-color: ${BG} !important;
    overflow: hidden;
    color-scheme: dark;
  }
  .tradingview-widget-container {
    width: 100%;
    height: 100%;
    background: ${BG} !important;
  }
  .tradingview-widget-container__widget {
    height: 100%;
    background: ${BG} !important;
  }
  iframe {
    background: ${BG} !important;
    color-scheme: dark;
  }
</style>
</head>
<body>
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <div class="tradingview-widget-copyright" style="text-align:right;padding:2px 4px 0;font-size:10px;color:rgba(255,255,255,0.2);">
    <a href="https://www.tradingview.com/" rel="noopener" target="_blank" style="color:#60a5fa;text-decoration:none;">SPCX chart · TradingView</a>
  </div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js" async>
  {
    "lineWidth": 2,
    "lineType": 0,
    "chartType": "area",
    "fontColor": "rgb(106, 109, 120)",
    "gridLineColor": "rgba(242, 242, 242, 0.06)",
    "volumeUpColor": "rgba(34, 171, 148, 0.5)",
    "volumeDownColor": "rgba(247, 82, 95, 0.5)",
    "backgroundColor": "${BG}",
    "widgetFontColor": "#DBDBDB",
    "upColor": "#22ab94",
    "downColor": "#f7525f",
    "borderUpColor": "#22ab94",
    "borderDownColor": "#f7525f",
    "wickUpColor": "#22ab94",
    "wickDownColor": "#f7525f",
    "colorTheme": "dark",
    "isTransparent": false,
    "locale": "en",
    "chartOnly": false,
    "scalePosition": "right",
    "scaleMode": "Normal",
    "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
    "valuesTracking": "1",
    "changeMode": "price-and-percent",
    "symbols": [["NASDAQ:SPCX|1D"]],
    "dateRanges": ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    "fontSize": "10",
    "headerFontSize": "medium",
    "autosize": true,
    "width": "100%",
    "height": "100%",
    "noTimeScale": false,
    "hideDateRanges": false,
    "hideMarketStatus": false,
    "hideSymbolLogo": false
  }
  </script>
</div>
</body>
</html>`;

export function TradingViewChart({ height = 320 }: TradingViewChartProps) {
  const overlayOpacity = useSharedValue(1);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === "tv-ready") {
      overlayOpacity.value = withTiming(0, { duration: 400 });
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: TV_HTML, baseUrl: "https://s3.tradingview.com" }}
        style={styles.webview}
        backgroundColor={BG}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={["*"]}
        mixedContentMode="always"
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        overScrollMode="never"
        androidLayerType="hardware"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={() => true}
        injectedJavaScript={INJECT_JS}
        onMessage={handleMessage}
      />
      {/* Dark overlay — fades out once TradingView's inner iframe has painted */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: BG,
  },
  webview: {
    flex: 1,
    backgroundColor: BG,
  },
  overlay: {
    backgroundColor: BG,
    zIndex: 10,
  },
});
