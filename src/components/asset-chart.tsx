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
          ts: new Date(r.date).getTime(),
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
        ts: new Date(lastRecord.date).getTime(),
        profitValue: isProfit ? lastRecord.currentValue : null,
        lossValue: !isProfit ? lastRecord.currentValue : null,
      } as typeof sampled[0]);
    }

    return sampled;
  }, [records]);

  // 计算X轴刻度 - 只显示起始和结束日期
  const tickValues = useMemo(() => {
    if (!chartData.length) return [];
    const minTs = chartData[0].ts;
    const maxTs = chartData[chartData.length - 1].ts;
    return [minTs, maxTs];
  }, [chartData]);

  // 计算时间跨度（天）
  const timeSpanDays = useMemo(() => {
    if (!chartData.length) return 0;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    return Math.ceil((last.ts - first.ts) / (1000 * 60 * 60 * 24));
  }, [chartData]);

  // 格式化X轴日期 - 显示完整日期
  const formatXAxis = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
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
        date: string;
        currentValue: number;
        totalCost: number;
      };
    }>;
    label?: number;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0]?.payload;
    const current = entry?.currentValue || 0;
    const cost = entry?.totalCost || 0;
    const profit = current - cost;
    const profitRate = cost > 0 ? ((current - cost) / cost) * 100 : 0;
    const isProfit = profit >= 0;

    const dateStr = entry?.date || "";

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 min-w-[200px] border border-white/10">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-white">{formatDate(dateStr)}</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">资产曲线</h3>
          <p className="text-sm text-slate-400">可视化展示随时间累积的投入与盈利区间</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 border-t-2 border-dashed border-blue-500 rounded" />
            <span className="text-xs font-bold text-slate-400">投入本金</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f87171] shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
            <span className="text-xs font-bold text-slate-400">盈利区间</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-xs font-bold text-slate-400">亏损区间</span>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
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
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              ticks={tickValues}
              tickFormatter={() => ""}
              tick={{ fontSize: 1, fill: "transparent" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              tickLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              width={50}
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

        {/* 日期标签 - 独立于图表渲染，与图表绘图区域对齐 */}
        {tickValues.length === 2 && (
          <>
            <div className="absolute left-[50px] bottom-0 text-[11px] text-slate-500">
              {formatXAxis(tickValues[0])}
            </div>
            <div className="absolute right-0 bottom-0 text-[11px] text-slate-500">
              {formatXAxis(tickValues[1])}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
