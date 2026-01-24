"use client";

import React, { memo, useEffect, useId, useRef } from "react";

type TradingViewSymbolProfileProps = {
  symbol: string; // e.g. "NASDAQ:AAPL"
  width?: number | "100%";
  height?: number;
  colorTheme?: "light" | "dark";
  isTransparent?: boolean;
  locale?: string;
  className?: string;
};

function TradingViewSymbolProfile({
  symbol,
  width = 400,
  height = 550,
  colorTheme = "dark",
  isTransparent = false,
  locale = "en",
  className,
}: TradingViewSymbolProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId(); // ensures uniqueness across multiple instances

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: if already initialized for this render, wipe clean
    container.innerHTML = "";

    // Create a stable mount node for the script/widget
    const mount = document.createElement("div");
    mount.setAttribute("data-tv-mount", widgetId);
    container.appendChild(mount);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js";
    script.type = "text/javascript";
    script.async = true;

    // TradingView reads config from script.innerHTML
    script.innerHTML = JSON.stringify({
      symbol,
      width,
      height,
      colorTheme,
      isTransparent,
      locale,
    });

    mount.appendChild(script);

    // Cleanup: remove everything we injected (handles route changes + strict mode)
    return () => {
      container.innerHTML = "";
    };
  }, [symbol, width, height, colorTheme, isTransparent, locale, widgetId]);

  return (
    <div
      className={className ?? "tradingview-widget-container"}
      style={{
        // Prevent layout shift and make SSR/CSR consistent
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
      }}
      ref={containerRef}
    />
  );
}

export default memo(TradingViewSymbolProfile);
