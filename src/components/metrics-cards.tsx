"use client";

import { cn } from "@/lib/utils";
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
  Calendar,
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
      iconBg: "bg-primary-container text-primary",
    },
    {
      label: "当前市值",
      value: result.currentValue,
      format: (v: number) => formatCurrency(v),
      icon: BarChart3,
      iconBg: "bg-secondary-container text-secondary",
    },
    {
      label: "累计收益",
      value: result.profit,
      format: (v: number) => `${v >= 0 ? "+" : ""}${formatCurrency(v)}`,
      highlight: true,
      isProfit: isProfit,
      icon: DollarSign,
      iconBg: isProfit ? "bg-profit-container text-profit" : "bg-loss-container text-loss",
    },
    {
      label: "收益率",
      value: result.profitRate,
      format: (v: number) => formatPercent(v),
      highlight: true,
      isProfit: isProfit,
      icon: TrendingUp,
      iconBg: isProfit ? "bg-profit-container text-profit" : "bg-loss-container text-loss",
    },
    {
      label: "定投次数",
      value: result.investCount,
      format: (v: number) => `${v}次`,
      integer: true,
      icon: Hash,
      iconBg: "bg-tertiary-container text-tertiary",
    },
    {
      label: "平均成本",
      value: result.averageCost,
      format: (v: number) => formatNumber(v, 4),
      icon: Target,
      iconBg: "bg-wealth/20 text-wealth",
    },
    {
      label: "盈利天数占比",
      value: result.profitDaysRatio,
      format: (v: number) => formatPercent(v),
      highlight: true,
      isProfit: result.profitDaysRatio >= 0.5,
      icon: Calendar,
      iconBg: result.profitDaysRatio >= 0.5 ? "bg-profit-container text-profit" : "bg-loss-container text-loss",
    },
    {
      label: "最大回撤",
      value: -result.maxDrawdown,
      format: (v: number) => formatPercent(v),
      warning: true,
      icon: AlertTriangle,
      iconBg: "bg-warning/20 text-warning",
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
              "metric-card group relative overflow-hidden",
              metric.highlight && isProfit && "bg-gradient-to-br from-profit-container/50 to-surface-container border-profit/20",
              metric.highlight && !isProfit && "bg-gradient-to-br from-loss-container/50 to-surface-container border-loss/20",
              metric.warning && "bg-gradient-to-br from-warning/10 to-surface-container border-warning/20"
            )}
            style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
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
                metric.highlight && isProfit && "text-profit-light",
                metric.highlight && !isProfit && "text-loss-light",
                metric.warning && "text-warning"
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
