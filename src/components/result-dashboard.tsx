"use client";

import type { SimulationResult } from "@/lib/types";
import { MetricsCards } from "./metrics-cards";
import { AssetChart } from "./asset-chart";

interface ResultDashboardProps {
  result: SimulationResult;
}

export function ResultDashboard({ result }: ResultDashboardProps) {
  return (
    <div className="space-y-6">
      <MetricsCards result={result} />
      <AssetChart records={result.records} />
    </div>
  );
}
