"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import type { InvestmentRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AssetChartProps {
  records: InvestmentRecord[];
}

// 盈利颜色
const PROFIT_COLOR = "#EF4444";
// 亏损颜色
const LOSS_COLOR = "#10B981";

export function AssetChart({ records }: AssetChartProps) {
  // 采样数据并计算盈亏数据（带平滑转折点）
  const chartData = useMemo(() => {
    const processData = (data: InvestmentRecord[]) => {
      return data.map((r, i, arr) => {
        const isProfit = r.currentValue >= r.totalCost;
        const prevIsProfit = i > 0 ? arr[i - 1].currentValue >= arr[i - 1].totalCost : isProfit;
        const nextIsProfit = i < arr.length - 1 ? arr[i + 1].currentValue >= arr[i + 1].totalCost : isProfit;

        // 当前点或相邻点是转折点时，两边都显示（保持平滑）
        const isTransitionPoint = isProfit !== prevIsProfit || isProfit !== nextIsProfit;

        return {
          ...r,
          // 盈利时显示市值，转折点也显示
          profitValue: (isProfit || isTransitionPoint) ? r.currentValue : null,
          // 亏损时显示市值，转折点也显示
          lossValue: (!isProfit || isTransitionPoint) ? r.currentValue : null,
        };
      });
    };

    if (records.length <= 500) {
      return processData(records);
    }

    const sampleRate = Math.ceil(records.length / 500);
    const sampled = processData(records.filter((_, index) => index % sampleRate === 0));

    // 确保包含最后一条记录
    const lastRecord = records[records.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastRecord.date) {
      const isProfit = lastRecord.currentValue >= lastRecord.totalCost;
      sampled.push({
        ...lastRecord,
        profitValue: isProfit ? lastRecord.currentValue : null,
        lossValue: !isProfit ? lastRecord.currentValue : null,
      } as typeof sampled[0]);
    }

    return sampled;
  }, [records]);

  // 格式化X轴日期
  const formatXAxis = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 自定义Tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      dataKey: string;
      payload?: {
        currentValue: number;
        totalCost: number;
      };
    }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // 从 payload 中获取 currentValue 和 totalCost
    const entry = payload[0]?.payload;
    const current = entry?.currentValue || 0;
    const cost = entry?.totalCost || 0;
    const profit = current - cost;
    const profitRate = cost > 0 ? ((current - cost) / cost) * 100 : 0;
    const isProfit = profit >= 0;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-900">{label}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">累计投入</span>
            <span className="text-sm font-semibold text-slate-700">{formatCurrency(cost)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">当前市值</span>
            <span className="text-sm font-semibold text-slate-700">{formatCurrency(current)}</span>
          </div>

          {/* 收益 */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">收益</span>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  isProfit ? "text-red-500" : "text-emerald-500"
                )}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 mt-1">
              <span className="text-xs text-slate-400">收益率</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isProfit ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
              )}>
                {isProfit ? "+" : ""}{profitRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h3 className="chart-title">资产曲线</h3>
      </div>

      {/* 图表 */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              {/* 盈利区域渐变 - 红色 */}
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PROFIT_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={PROFIT_COLOR} stopOpacity={0} />
              </linearGradient>
              {/* 亏损区域渐变 - 绿色 */}
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LOSS_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={LOSS_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 累计投入 - 虚线 */}
            <Area
              type="monotone"
              dataKey="totalCost"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
              name="累计投入"
            />

            {/* 盈利区域 - 红色（只在盈利时显示） */}
            <Area
              type="monotone"
              dataKey="profitValue"
              stroke={PROFIT_COLOR}
              strokeWidth={2}
              fill="url(#profitGradient)"
              fillOpacity={1}
              dot={false}
              name="盈利市值"
              connectNulls={false}
            />

            {/* 亏损区域 - 绿色（只在亏损时显示） */}
            <Area
              type="monotone"
              dataKey="lossValue"
              stroke={LOSS_COLOR}
              strokeWidth={2}
              fill="url(#lossGradient)"
              fillOpacity={1}
              dot={false}
              name="亏损市值"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 border-t-2 border-dashed border-slate-400 rounded" />
          <span className="text-slate-500">累计投入</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 rounded-full bg-red-500" />
          <span className="text-slate-500">盈利区</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 rounded-full bg-emerald-500" />
          <span className="text-slate-500">亏损区</span>
        </div>
      </div>
    </div>
  );
}
