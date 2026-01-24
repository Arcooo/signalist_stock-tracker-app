"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";

export type DailyMetalSpotPricesWidgetProps = {
  /** Metals to display (order here is what we will send to the widget) */
  commodities?: string[]; // e.g. ["au","ag","pt","pd"]

  /**
   * Optional: enforce a specific ordering.
   * Any metals present in `commodities` but not in `commodityOrder` will be appended
   * at the end in their original order.
   */
  commodityOrder?: string[]; // e.g. ["au","ag","pt","pd"]

  currency?: string; // e.g. "USD", "EUR", "CAD"
  unit?: "lb" | "kg" | "g" | "oz" | "mt" | "t";

  dark?: boolean;
  className?: string;
  id?: string;

  /** Optional: make the embedded iframe non-interactive */
  disableIframePointerEvents?: boolean;
};

const PYM_SRC = "https://dailymetalprice.com/js/pym.min.js";

declare global {
  interface Window {
    pym?: {
      Parent: new (
        id: string,
        url: string,
        config?: Record<string, unknown>
      ) => { remove?: () => void };
    };
  }
}

/** Global singleton loader so multiple widgets work reliably. */
let pymLoadPromise: Promise<void> | null = null;

function loadPymOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.pym?.Parent) return Promise.resolve();

  if (!pymLoadPromise) {
    pymLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${PYM_SRC}"]`
      );

      const waitForPym = () => {
        const start = Date.now();
        const tick = () => {
          if (window.pym?.Parent) return resolve();
          if (Date.now() - start > 8000) {
            return reject(new Error("pym script loaded but window.pym not available"));
          }
          requestAnimationFrame(tick);
        };
        tick();
      };

      if (existing) {
        waitForPym();
        return;
      }

      const script = document.createElement("script");
      script.src = PYM_SRC;
      script.async = true;
      script.type = "text/javascript";

      script.onload = () => waitForPym();
      script.onerror = () => reject(new Error("Failed to load pym.min.js"));

      document.body.appendChild(script);
    });
  }

  return pymLoadPromise;
}

function orderCommodities(
  commodities?: string[],
  commodityOrder?: string[]
): string[] | undefined {
  if (!commodities?.length) return undefined;

  // De-dupe while preserving original order
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const c of commodities) {
    const v = c.trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    deduped.push(v);
  }

  // If no order provided, keep caller order
  if (!commodityOrder?.length) return deduped;

  const allowed = new Set(deduped);

  // First, items in the explicit order (that are also in commodities)
  const ordered: string[] = [];
  for (const c of commodityOrder) {
    const v = c.trim();
    if (!v) continue;
    if (allowed.has(v) && !ordered.includes(v)) ordered.push(v);
  }

  // Then append leftovers in original order
  for (const c of deduped) {
    if (!ordered.includes(c)) ordered.push(c);
  }

  return ordered;
}

export function DailyMetalSpotPricesWidget({
  commodities,
  commodityOrder,
  currency,
  unit,
  dark,
  className,
  id,
  disableIframePointerEvents,
}: DailyMetalSpotPricesWidgetProps) {
  const reactId = useId();
  const parentRef = useRef<{ remove?: () => void } | null>(null);

  const containerId = useMemo(() => {
    if (id) return id;
    return `DMP_PRICES_${reactId}`.replace(/:/g, "_");
  }, [id, reactId]);

  const srcUrl = useMemo(() => {
    const base = "https://dailymetalprice.com/prices.php";
    const params = new URLSearchParams();

    const ordered = orderCommodities(commodities, commodityOrder);
    if (ordered?.length) params.set("c", ordered.join(","));

    if (currency) params.set("x", currency);
    if (unit) params.set("u", unit);
    if (dark) params.append("dark", "");

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [commodities, commodityOrder, currency, unit, dark]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadPymOnce();
        if (cancelled) return;
        if (!window.pym?.Parent) return;

        parentRef.current?.remove?.();
        parentRef.current = null;

        const el = document.getElementById(containerId);
        if (el) el.innerHTML = "";

        parentRef.current = new window.pym.Parent(containerId, srcUrl, {});
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
      parentRef.current?.remove?.();
      parentRef.current = null;
      const el2 = document.getElementById(containerId);
      if (el2) el2.innerHTML = "";
    };
  }, [containerId, srcUrl]);

  return (
    <>
      <div id={containerId} className={className} />

      {disableIframePointerEvents && (
        <style jsx>{`
          #${containerId} :global(iframe) {
            pointer-events: none;
          }
        `}</style>
      )}
    </>
  );
}
