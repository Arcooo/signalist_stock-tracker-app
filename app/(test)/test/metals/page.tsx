"use client";

import { MetalChartSwitcher } from "./MetalChartSwitcher";
import { DailyMetalSpotPricesWidget } from "./DailyMetalPriceWidget";
import { use } from "react";

function CroppedSpotPrices({
    cropTopPx = 0, // adjust until the date/header disappears
}: {
    cropTopPx?: number;
}) {
    // We wrap the widget and then style its injected iframe (same-origin CSS can target the iframe element).
    const containerId = "spot_prices_panel";

    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold">Spot Prices</h2>

            <div
                id={containerId}
                style={{
                    position: "relative",
                    width: "100%",
                    height: 520, // set the visible height of the table panel
                    overflow: "hidden",
                    borderRadius: 8,
                }}
            >
                <DailyMetalSpotPricesWidget
                    id="DMP_SPOT_PRICES"
                    commodities={["au", "ag", "si", "cu", "al", "pt", "pd", "st"]}
                    currency="USD"
                    dark
                    disableIframePointerEvents
                    className="w-full"
                />



            </div>

        </section>
    );
}

export default function Page() {
    return (
        <main className="p-6">
            <div
                className="gap-6"
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 7fr) minmax(0, 3fr)", // 70/30
                    alignItems: "start",
                }}
            >
                <section className="min-w-0">
                    <MetalChartSwitcher />
                </section>

                <aside className="min-w-0">
                    <CroppedSpotPrices cropTopPx={0} />
                </aside>
            </div>

            {/* Mobile fallback: stack */}
            <style jsx>{`
        @media (max-width: 900px) {
          div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </main>
    );
}
