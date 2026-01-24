"use client";

import React, { useMemo, useState } from "react";
import { DailyMetalPriceWidget } from "./DailyMetalPriceWidget";

const METAL_LABELS: Record<string, string> = {
  au: "Gold",
  ag: "Silver",
  pt: "Platinum",
  pd: "Palladium",
  cu: "Copper",
  al: "Aluminum",
};

export function MetalPricesWithPreloadedCharts() {
  const metals = useMemo(() => ["au", "ag", "pt", "pd", "cu", "al"], []);
  const [selected, setSelected] = useState<string>("au");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Popular Metals in USD (Dark Mode)</h1>

        <DailyMetalPriceWidget
          kind="prices"
          commodities={metals}
          currency="USD"
          dark
          disableIframePointerEvents
          className="w-full"
        />

        <div className="flex flex-wrap gap-2 pt-2">
          {metals.map((m) => {
            const active = m === selected;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelected(m)}
                className={[
                  "px-3 py-1 rounded border text-sm",
                  active
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-white border-white/30 hover:border-white",
                ].join(" ")}
              >
                {METAL_LABELS[m] ?? m.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          {(METAL_LABELS[selected] ?? selected.toUpperCase())} — One Year
        </h2>

        <div className="relative">
          {metals.map((m) => {
            const isActive = m === selected;

            return (
              <div
                key={m}
                style={
                  isActive
                    ? { position: "relative", width: "100%" }
                    : {
                        position: "absolute",
                        left: "-100000px",
                        top: 0,
                        width: "900px",
                        height: "600px",
                        overflow: "hidden",
                      }
                }
              >
                <DailyMetalPriceWidget
                  id={`DMPC_${m}`}
                  kind="charts"
                  commodity={m}
                  days={240}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
