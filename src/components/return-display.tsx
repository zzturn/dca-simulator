"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./ui/animated-number";
import { formatCurrency } from "@/lib/utils";
import type { SimulationResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

interface ReturnDisplayProps {
  result: SimulationResult | null;
  className?: string;
}

export function ReturnDisplay({ result, className }: ReturnDisplayProps) {
  if (!result) {
    return (
      <div className={cn("card-professional p-8 text-center", className)}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="w-5 h-5 text-slate-400" />
          <span className="text-slate-500">等待模拟</span>
        </div>
        <div className="text-6xl font-bold font-number text-slate-300">--%</div>
        <p className="text-slate-400 mt-3 text-sm">配置定投参数后查看收益</p>
      </div>
    );
  }

  const isProfit = result.profit >= 0;

  return (
    <div className={cn(
      "card-professional p-8 text-center",
      isProfit && "bg-gradient-to-br from-red-50 to-orange-50/50 border-red-100",
      !isProfit && "bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100",
      className
    )}>
      {/* 标签 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
          isProfit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
        )}>
          {isProfit ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>模拟定投收益率</span>
        </div>
      </div>

      {/* 收益率大字报 */}
      <div
        className={cn(
          "text-7xl sm:text-8xl font-extrabold font-number",
          isProfit ? "text-red-500" : "text-emerald-500"
        )}
      >
        <AnimatedNumber
          value={result.profitRate * 100}
          decimals={2}
          prefix={isProfit ? "+" : ""}
          suffix="%"
          duration={800}
        />
      </div>

      {/* 累计收益 */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-slate-500">累计收益</span>
        <span
          className={cn(
            "text-xl font-bold font-number",
            isProfit ? "text-red-500" : "text-emerald-500"
          )}
        >
          <AnimatedNumber
            value={result.profit}
            decimals={2}
            prefix={isProfit ? "+" : ""}
            formatFn={(val) => formatCurrency(val).replace("¥", "¥ ")}
            duration={800}
          />
        </span>
      </div>
    </div>
  );
}
