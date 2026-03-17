"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SimulationResult } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  BarChart3,
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
      title: "累计投入",
      value: formatCurrency(result.totalInvestment),
      icon: PiggyBank,
      color: "text-gray-700",
    },
    {
      title: "当前市值",
      value: formatCurrency(result.currentValue),
      icon: DollarSign,
      color: "text-gray-700",
    },
    {
      title: "累计收益",
      value: formatCurrency(result.profit),
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? "text-profit" : "text-loss",
    },
    {
      title: "收益率",
      value: formatPercent(result.profitRate),
      icon: BarChart3,
      color: isProfit ? "text-profit" : "text-loss",
    },
    {
      title: "定投次数",
      value: `${result.investCount}次`,
      icon: Target,
      color: "text-gray-700",
    },
    {
      title: "平均成本",
      value: formatNumber(result.averageCost, 4),
      icon: DollarSign,
      color: "text-gray-700",
    },
    {
      title: "最大回撤",
      value: formatPercent(-result.maxDrawdown),
      icon: AlertTriangle,
      color: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{metric.title}</p>
            <p className={`text-2xl font-bold mt-1 ${metric.color}`}>
              {metric.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
