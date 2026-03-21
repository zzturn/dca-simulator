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
import { Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AssetChartProps {
  records: InvestmentRecord[];
}

// 盈利颜色
const PROFIT_COLOR = "#f87171";
// 亏损颜色
const LOSS_COLOR = "#4ade80";

export function AssetChart({ records }: AssetChartProps) {
  // 采样数据并计算盈亏数据
  const chartData = useMemo(() => {
    const processData = (data: InvestmentRecord[]) => {
      return data.map((r, i, arr) => {
        const isProfit = r.currentValue >= r.totalCost;
        const prevIsProfit = i > 0 ? arr[i - 1].currentValue >= arr[i - 1].totalCost : isProfit;
        const nextIsProfit = i < arr.length - 1 ? arr[i + 1].currentValue >= arr[i + 1].totalCost : isProfit;

        const isTransitionPoint = isProfit !== prevIsProfit || isProfit !== nextIsProfit;

        return {
          ...r,
          profitValue: (isProfit || isTransitionPoint) ? r.currentValue : null,
          lossValue: (!isProfit || isTransitionPoint) ? r.currentValue : null,
        };
      });
    };

    if (records.length <= 500) {
      return processData(records);
    }

    const sampleRate = Math.ceil(records.length / 500);
    const sampled = processData(records.filter((_, index) => index % sampleRate === 0));

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

    const entry = payload[0]?.payload;
    const current = entry?.currentValue || 0;
    const cost = entry?.totalCost || 0;
    const profit = current - cost;
    const profitRate = cost > 0 ? ((current - cost) / cost) * 100 : 0;
    const isProfit = profit >= 0;

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 min-w-[200px] border border-white/10">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-white">{label}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">累计投入</span>
            <span className="text-sm font-semibold text-blue-400">{formatCurrency(cost)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">当前市值</span>
            <span className="text-sm font-semibold text-white">{formatCurrency(current)}</span>
          </div>

          {/* 收益 */}
          <div className="pt-2 mt-2 border-t border-white/10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">收益</span>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <ArrowUpRight className="w-4 h-4 text-[#f87171]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[#4ade80]" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isProfit ? "text-[#f87171]" : "text-[#4ade80]"
                  )}
                >
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 mt-1">
              <span className="text-xs text-slate-500">收益率</span>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  isProfit
                    ? "bg-[#f87171]/20 text-[#f87171]"
                    : "bg-[#4ade80]/20 text-[#4ade80]"
                )}
              >
                {isProfit ? "+" : ""}{profitRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-[2rem] p-8 space-y-8 border border-white/5 relative overflow-hidden">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">资产曲线</h3>
          <p className="text-sm text-slate-400">可视化展示随时间累积的投入与盈利区间</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-xs font-bold text-slate-400">投入本金</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f87171] shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
            <span className="text-xs font-bold text-slate-400">盈利区间</span>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              {/* 盈利区域渐变 - 红色 */}
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PROFIT_COLOR} stopOpacity={0.15} />
                <stop offset="100%" stopColor={PROFIT_COLOR} stopOpacity={0} />
              </linearGradient>
              {/* 亏损区域渐变 - 绿色 */}
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LOSS_COLOR} stopOpacity={0.15} />
                <stop offset="100%" stopColor={LOSS_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              tickLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              tickLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 累计投入 - 虚线 */}
            <Area
              type="monotone"
              dataKey="totalCost"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="8 4"
              fill="transparent"
              dot={false}
              name="累计投入"
            />

            {/* 盈利区域 - 红色 */}
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

            {/* 亏损区域 - 绿色 */}
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
    </div>
  );
}
