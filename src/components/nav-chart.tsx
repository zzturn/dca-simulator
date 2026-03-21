"use client";

import { useMemo, useState } from "react";
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
import { Skeleton } from "./ui/skeleton";
import type { NavPoint, InvestmentRecord, TimeRange, DCAConfig } from "@/lib/types";
import { getTimeRangeStart } from "@/lib/date-utils";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface NavChartProps {
  navHistory: NavPoint[];
  investRecords?: InvestmentRecord[];
  frequency: DCAConfig["frequency"];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "6m", label: "6个月" },
  { value: "1y", label: "1年" },
  { value: "3y", label: "3年" },
  { value: "5y", label: "5年" },
  { value: "all", label: "全部" },
];

// 创建自定义 Dot 渲染函数
function createCustomDot(investDates: Set<string>) {
  return function CustomDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: { date: string } }) {
    if (!payload || cx === undefined || cy === undefined) {
      return null;
    }

    if (!investDates.has(payload.date)) {
      return null;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={2}
        fill="#EF4444"
        stroke="#fff"
        strokeWidth={0.5}
        style={{ cursor: "pointer" }}
      />
    );
  };
}

export function NavChart({
  navHistory,
  investRecords,
  frequency,
  timeRange,
  onTimeRangeChange,
  isLoading,
}: NavChartProps) {
  const [showAccumulated, setShowAccumulated] = useState(false);

  // 计算时间范围的起始时间戳
  const timeRangeStartTs = useMemo(() => {
    const startDate = getTimeRangeStart(timeRange);
    return startDate ? new Date(startDate).getTime() : null;
  }, [timeRange]);

  // 投资日期集合
  const investDates = useMemo(() => {
    if (frequency === "daily") return new Set<string>();
    return new Set(investRecords?.filter(r => r.amount > 0).map(r => r.date) || []);
  }, [investRecords, frequency]);

  // 图表数据
  const chartData = useMemo(() => {
    if (navHistory.length === 0) return [];

    const navMap = new Map(navHistory.map(p => [p.date, p]));

    const withTs = navHistory.map(p => ({
      ...p,
      ts: new Date(p.date).getTime(),
    }));

    if (withTs.length <= 1000) {
      return withTs;
    }

    const sampleRate = Math.ceil(withTs.length / 1000);
    const sampled: (NavPoint & { ts: number })[] = [];
    for (let i = 0; i < withTs.length; i += sampleRate) {
      sampled.push(withTs[i]);
    }
    const lastPoint = withTs[withTs.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
      sampled.push(lastPoint);
    }

    const sampledDates = new Set(sampled.map(p => p.date));
    investDates.forEach((date) => {
      if (!sampledDates.has(date)) {
        const navPoint = navMap.get(date);
        if (navPoint) {
          sampled.push({
            ...navPoint,
            ts: new Date(navPoint.date).getTime(),
          });
        }
      }
    });

    sampled.sort((a, b) => a.ts - b.ts);

    return sampled;
  }, [navHistory, investDates]);

  // XAxis domain
  const xAxisDomain = useMemo((): [number | string, number | string] => {
    if (timeRangeStartTs === null) return ["dataMin", "dataMax"];
    return [timeRangeStartTs, "dataMax"];
  }, [timeRangeStartTs]);

  // 计算X轴刻度 - 使用当前显示范围的边界值
  const tickValues = useMemo(() => {
    if (!chartData.length) return [];
    const maxTs = chartData[chartData.length - 1].ts;
    // 如果有时间范围限制，左侧标签显示时间范围起始点；否则显示数据起始点
    const minTs = timeRangeStartTs ?? chartData[0].ts;
    return [minTs, maxTs];
  }, [chartData, timeRangeStartTs]);

  // 投资点数据
  const investPointsMap = useMemo(() => {
    const map = new Map<string, { amount: number; shares: number }>();
    investRecords?.forEach((r) => {
      if (r.amount > 0) {
        map.set(r.date, { amount: r.amount, shares: r.shares });
      }
    });
    return map;
  }, [investRecords]);

  // 格式化X轴日期 - 显示完整日期
  const formatXAxis = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // 格式化时间戳
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
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
        date?: string;
        ts?: number;
        nav: number;
        accumulatedNav?: number;
        amount?: number;
        shares?: number;
      };
    }>;
    label?: number;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const allPayloads = payload.map((p) => p.payload).filter(Boolean);
    const firstPayload = allPayloads[0];

    const dateStr = label ? formatTimestamp(label) : (firstPayload?.date || "");

    const investRecord = firstPayload?.date
      ? investPointsMap.get(firstPayload.date)
      : dateStr
      ? investPointsMap.get(dateStr)
      : null;
    const isInvestPoint = !!investRecord;

    const navValue = firstPayload?.nav ?? payload.find((p) => p.dataKey === "nav")?.value;
    const accumulatedValue = firstPayload?.accumulatedNav ?? payload.find((p) => p.dataKey === "accumulatedNav")?.value;

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 min-w-[180px] border border-white/10">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-white">{dateStr}</p>
        </div>

        <div className="space-y-1.5">
          {navValue !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">单位净值</span>
              <span className="text-sm font-semibold text-blue-400">
                {navValue.toFixed(4)}
              </span>
            </div>
          )}
          {accumulatedValue !== undefined && showAccumulated && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">累计净值</span>
              <span className="text-sm font-semibold text-amber-400">
                {accumulatedValue.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {isInvestPoint && investRecord && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs font-medium text-[#f87171] mb-1.5">定投买入</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">金额</span>
                <span className="text-sm font-semibold text-[#f87171]">
                  {formatCurrency(investRecord.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">份额</span>
                <span className="text-sm font-medium text-slate-300">
                  {formatNumber(investRecord.shares, 2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-white/5 space-y-6">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-white/5 space-y-6 relative overflow-hidden">
      {/* 标题和时间切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <h3 className="text-lg font-bold text-white">净值走势</h3>
        <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTimeRangeChange(option.value)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                timeRange === option.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineStroke" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="accNavAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={xAxisDomain}
              scale="time"
              allowDataOverflow
              ticks={tickValues}
              tick={false}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => v.toFixed(2)}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              tickLine={{ stroke: "rgba(148, 163, 184, 0.1)" }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 单位净值渐变填充区域 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="none"
              fill="url(#chartGradient)"
              fillOpacity={1}
            />

            {/* 单位净值线 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="url(#lineStroke)"
              strokeWidth={2}
              fill="none"
              dot={createCustomDot(investDates)}
            />

            {/* 累计净值渐变填充区域 */}
            {showAccumulated && (
              <Area
                type="monotone"
                dataKey="accumulatedNav"
                stroke="none"
                fill="url(#accNavAreaGradient)"
                fillOpacity={1}
              />
            )}

            {/* 累计净值线 */}
            {showAccumulated && (
              <Area
                type="monotone"
                dataKey="accumulatedNav"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="none"
                dot={false}
              />
            )}
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

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-6 text-sm relative z-10">
        {frequency !== "daily" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f87171]" />
            <span className="text-slate-400">定投买入点</span>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={showAccumulated}
            onChange={(e) => setShowAccumulated(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-slate-400 group-hover:text-slate-300">显示累计净值</span>
        </label>
      </div>
    </div>
  );
}
