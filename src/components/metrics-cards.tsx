"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./ui/animated-number";
import type { SimulationResult } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  BarChart3,
  Hash,
  Target,
  AlertTriangle,
} from "lucide-react";

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
      icon: Wallet,
      iconBg: "bg-blue-50 text-blue-500",
    },
    {
      label: "当前市值",
      value: result.currentValue,
      format: (v: number) => formatCurrency(v),
      icon: BarChart3,
      iconBg: "bg-purple-50 text-purple-500",
    },
    {
      label: "累计收益",
      value: result.profit,
      format: (v: number) => `${v >= 0 ? "+" : ""}${formatCurrency(v)}`,
      highlight: true,
      isProfit: isProfit,
      icon: DollarSign,
      iconBg: isProfit ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500",
    },
    {
      label: "收益率",
      value: result.profitRate,
      format: (v: number) => formatPercent(v),
      highlight: true,
      isProfit: isProfit,
      icon: TrendingUp,
      iconBg: isProfit ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500",
    },
    {
      label: "定投次数",
      value: result.investCount,
      format: (v: number) => `${v}次`,
      integer: true,
      icon: Hash,
      iconBg: "bg-indigo-50 text-indigo-500",
    },
    {
      label: "平均成本",
      value: result.averageCost,
      format: (v: number) => formatNumber(v, 4),
      icon: Target,
      iconBg: "bg-amber-50 text-amber-500",
    },
    {
      label: "最大回撤",
      value: -result.maxDrawdown,
      format: (v: number) => formatPercent(v),
      warning: true,
      icon: AlertTriangle,
      iconBg: "bg-orange-50 text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className={cn(
              "metric-card group",
              metric.highlight && isProfit && "bg-gradient-to-br from-red-50 to-orange-50/50 border-red-100",
              metric.highlight && !isProfit && "bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100",
              metric.warning && "bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-100"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 图标 */}
            <div className={cn(
              "inline-flex p-2 rounded-xl mb-3 transition-transform group-hover:scale-105",
              metric.iconBg
            )}>
              <Icon className="w-4 h-4" />
            </div>

            {/* 标签 */}
            <p className="metric-label">{metric.label}</p>

            {/* 数值 */}
            <p
              className={cn(
                "metric-value",
                metric.highlight && isProfit && "text-red-500",
                metric.highlight && !isProfit && "text-emerald-500",
                metric.warning && "text-amber-600"
              )}
            >
              {metric.format(metric.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
