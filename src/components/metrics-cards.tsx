"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./ui/animated-number";
import type { SimulationResult } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface MetricsCardsProps {
  result: SimulationResult;
}

export function MetricsCards({ result }: MetricsCardsProps) {
  const isProfit = result.profit >= 0;

  const metrics = [
    {
      label: "累计投入",
      value: result.totalInvestment,
      format: (v: number) => formatCurrency(v),
    },
    {
      label: "当前市值",
      value: result.currentValue,
      format: (v: number) => formatCurrency(v),
    },
    {
      label: "累计收益",
      value: result.profit,
      format: (v: number) => `${v >= 0 ? "+" : ""}${formatCurrency(v)}`,
      highlight: true,
      isProfit: isProfit,
    },
    {
      label: "收益率",
      value: result.profitRate,
      format: (v: number) => formatPercent(v),
      highlight: true,
      isProfit: isProfit,
    },
    {
      label: "定投次数",
      value: result.investCount,
      format: (v: number) => `${v}次`,
      integer: true,
    },
    {
      label: "平均成本",
      value: result.averageCost,
      format: (v: number) => formatNumber(v, 4),
    },
    {
      label: "最大回撤",
      value: -result.maxDrawdown,
      format: (v: number) => formatPercent(v),
      warning: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={cn(
            "metric-card",
            metric.highlight && (metric.isProfit ? "bg-profit/5" : "bg-loss/5"),
            metric.warning && "bg-wealth/10"
          )}
        >
          <p className="metric-label">{metric.label}</p>
          <p
            className={cn(
              "metric-value mt-2",
              metric.highlight &&
                (metric.isProfit ? "text-profit" : "text-loss"),
              metric.warning && "text-wealth"
            )}
          >
            {metric.format(metric.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
