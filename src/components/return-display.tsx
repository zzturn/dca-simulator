"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./ui/animated-number";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { SimulationResult } from "@/lib/types";

interface ReturnDisplayProps {
  result: SimulationResult | null;
  className?: string;
}

export function ReturnDisplay({ result, className }: ReturnDisplayProps) {
  if (!result) {
    return (
      <div className={cn("card-professional p-8 text-center", className)}>
        <div className="text-6xl font-bold font-number text-text-4">--%</div>
        <p className="text-text-3 mt-2">模拟定投收益率</p>
      </div>
    );
  }

  const isProfit = result.profit >= 0;

  return (
    <div className={cn("card-professional p-8 text-center", className)}>
      {/* 收益率大字报 */}
      <div
        className={cn(
          "text-6xl font-bold font-number transition-colors duration-300",
          isProfit ? "text-profit" : "text-loss"
        )}
      >
        <AnimatedNumber
          value={result.profitRate * 100}
          decimals={2}
          prefix={isProfit ? "+" : ""}
          suffix="%"
          duration={600}
        />
      </div>
      <p className="text-text-3 mt-2">模拟定投收益率</p>

      {/* 累计收益 */}
      <div
        className={cn(
          "mt-4 text-lg font-medium",
          isProfit ? "text-profit" : "text-loss"
        )}
      >
        累计收益:{" "}
        <AnimatedNumber
          value={result.profit}
          decimals={2}
          prefix={isProfit ? "+" : ""}
          formatFn={(val) => formatCurrency(val).replace("¥", "¥ ")}
          duration={600}
        />
      </div>
    </div>
  );
}
