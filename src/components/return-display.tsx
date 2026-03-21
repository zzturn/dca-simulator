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
      <div
        className={cn(
          "glass-panel rounded-[2rem] p-10 relative overflow-hidden",
          className
        )}
      >
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">累计收益率</h3>
            <div className="text-7xl font-black text-slate-500 tracking-tight">--%</div>
          </div>
          <div className="flex flex-col justify-center items-end space-y-2 text-right">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">累计收益</h3>
            <div className="text-4xl font-bold text-slate-400">--</div>
            <div className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium">
              等待模拟
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProfit = result.profit >= 0;

  return (
    <div
      className={cn(
        "glass-panel rounded-[2rem] p-10 relative overflow-hidden",
        isProfit ? "border-profit/20" : "border-loss/20",
        className
      )}
    >
      {/* 装饰性发光 */}
      <div
        className={cn(
          "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl",
          isProfit ? "bg-blue-500/10" : "bg-green-500/10"
        )}
      />
      <div
        className={cn(
          "absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl",
          isProfit ? "bg-[#f87171]/5" : "bg-[#4ade80]/5"
        )}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 左侧：累计收益率 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">累计收益率</h3>
          <div
            className={cn(
              "text-7xl font-black tracking-tight",
              isProfit ? "text-[#f87171]" : "text-[#4ade80]"
            )}
            style={{
              textShadow: isProfit
                ? "0 0 40px rgba(248, 113, 113, 0.4)"
                : "0 0 40px rgba(74, 222, 128, 0.4)",
            }}
          >
            <AnimatedNumber
              value={result.profitRate * 100}
              decimals={2}
              prefix={isProfit ? "+" : ""}
              suffix="%"
              duration={800}
            />
          </div>
        </div>

        {/* 右侧：累计收益 */}
        <div className="flex flex-col justify-center items-end space-y-2 text-right">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">累计收益</h3>
          <div className="text-4xl font-bold text-white">
            <AnimatedNumber
              value={result.profit}
              decimals={2}
              prefix={result.profit >= 0 ? "+¥ " : "-¥ "}
              formatFn={(val) => Math.abs(val).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
              duration={800}
            />
          </div>
          <div className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium">
            截至 {result.endDate}
          </div>
        </div>
      </div>
    </div>
  );
}
