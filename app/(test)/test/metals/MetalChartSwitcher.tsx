"use client";

import React, { useMemo, useState } from "react";

const METAL_LABELS: Record<string, string> = {
  au: "Gold",
  ag: "Silver",
  cu: "Copper",
  al: "Aluminum",
  pt: "Platinum",
  pd: "Palladium",
  st: "Steel Rebar",
};

export function MetalChartSwitcher() {
  const metals = useMemo(() => ["au", "ag", "cu", "al", "pt", "pd", "st"], []);
  const [selected, setSelected] = useState<string>("au");

  const src = `https://dailymetalprice.com/charts.php?c=${encodeURIComponent(
    selected
  )}&d=120`;

  return (
    <div className="space-y-4">
      {/* <h1 className="text-xl font-semibold">Metals — One Year Charts</h1> */}

      <div className="flex flex-wrap gap-2">
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
                  : "bg-transparent border-white/30 hover:border-white",
              ].join(" ")}
            >
              {METAL_LABELS[m] ?? m.toUpperCase()}
            </button>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold">
        {(METAL_LABELS[selected] ?? selected.toUpperCase())} — 3 Months
      </h2>

      {/* Non-clickable chart */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height:650,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <iframe
          key={selected}
          title={`DailyMetalPrice chart ${selected}`}
          src={src}
          style={{
            width: "100%",
            height: "67%",
            border: 0,
            pointerEvents: "none", // 🔒 disables all interaction
            transform: `translateY(-${20}px)`,
          }}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
