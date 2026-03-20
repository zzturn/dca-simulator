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
import { LineChart, Calendar } from "lucide-react";

interface NavChartProps {
  navHistory: NavPoint[];
  investRecords?: InvestmentRecord[];
  frequency: DCAConfig["frequency"];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "5y", label: "5年" },
  { value: "3y", label: "3年" },
  { value: "1y", label: "1年" },
  { value: "6m", label: "6月" },
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
        r={4}
        fill="#EF4444"
        stroke="#fff"
        strokeWidth={2}
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

  // 投资日期集合（用于图表数据）- 每天定投时不显示买入点
  const investDates = useMemo(() => {
    // 每天定投时，不显示买入点（因为每天都有交易）
    if (frequency === "daily") return new Set<string>();
    return new Set(investRecords?.filter(r => r.amount > 0).map(r => r.date) || []);
  }, [investRecords, frequency]);

  // 图表数据始终使用全部数据，添加时间戳字段（实现横向滑动效果）
  // 同时确保投资日期的点被包含
  const chartData = useMemo(() => {
    if (navHistory.length === 0) return [];

    // 创建日期到数据点的映射
    const navMap = new Map(navHistory.map(p => [p.date, p]));

    // 添加时间戳
    const withTs = navHistory.map(p => ({
      ...p,
      ts: new Date(p.date).getTime(),
    }));

    // 数据量小，直接返回
    if (withTs.length <= 1000) {
      return withTs;
    }

    // 均匀采样
    const sampleRate = Math.ceil(withTs.length / 1000);
    const sampled: (NavPoint & { ts: number })[] = [];
    for (let i = 0; i < withTs.length; i += sampleRate) {
      sampled.push(withTs[i]);
    }
    const lastPoint = withTs[withTs.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
      sampled.push(lastPoint);
    }

    // 添加投资日期的点（确保红点能显示）
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

    // 按时间戳排序
    sampled.sort((a, b) => a.ts - b.ts);

    return sampled;
  }, [navHistory, investDates]);

  // XAxis domain - 控制显示范围（时间戳）
  const xAxisDomain = useMemo((): [number | string, number | string] => {
    if (timeRangeStartTs === null) return ["dataMin", "dataMax"];
    return [timeRangeStartTs, "dataMax"];
  }, [timeRangeStartTs]);

  // 投资点数据（用于 Tooltip）
  const investPointsMap = useMemo(() => {
    const map = new Map<string, { amount: number; shares: number }>();
    investRecords?.forEach((r) => {
      if (r.amount > 0) {
        map.set(r.date, { amount: r.amount, shares: r.shares });
      }
    });
    return map;
  }, [investRecords]);

  // 格式化X轴时间戳为日期
  const formatXAxis = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 格式化时间戳为日期字符串（用于 Tooltip）
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    label?: number; // 时间戳
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // 合并所有 payload 数据
    const allPayloads = payload.map((p) => p.payload).filter(Boolean);
    const firstPayload = allPayloads[0];

    // 格式化日期（label 是时间戳）
    const dateStr = label ? formatTimestamp(label) : (firstPayload?.date || "");

    // 检查是否是投资点
    const investRecord = firstPayload?.date
      ? investPointsMap.get(firstPayload.date)
      : dateStr
      ? investPointsMap.get(dateStr)
      : null;
    const isInvestPoint = !!investRecord;

    const navValue = firstPayload?.nav ?? payload.find((p) => p.dataKey === "nav")?.value;
    const accumulatedValue = firstPayload?.accumulatedNav ?? payload.find((p) => p.dataKey === "accumulatedNav")?.value;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-900">{dateStr}</p>
        </div>

        {/* 净值信息 */}
        <div className="space-y-1.5">
          {navValue !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">单位净值</span>
              <span className="text-sm font-semibold text-blue-500">
                {navValue.toFixed(4)}
              </span>
            </div>
          )}
          {accumulatedValue !== undefined && showAccumulated && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">累计净值</span>
              <span className="text-sm font-semibold text-amber-500">
                {accumulatedValue.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* 投资信息（如果是投资点） */}
        {isInvestPoint && investRecord && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-red-500 mb-1.5">定投买入</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">金额</span>
                <span className="text-sm font-semibold text-red-500">
                  {formatCurrency(investRecord.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">份额</span>
                <span className="text-sm font-medium text-slate-700">
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
      <div className="chart-container">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* 标题和时间切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
            <LineChart className="w-5 h-5" />
          </div>
          <h3 className="chart-title">净值走势</h3>
        </div>
        <div className="flex gap-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTimeRangeChange(option.value)}
              className={cn(
                "time-range-btn",
                timeRange === option.value && "active"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 图表 */}
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              {/* 净值线渐变填充 */}
              <linearGradient id="navAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              {/* 累计净值渐变填充 */}
              <linearGradient id="accNavAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={xAxisDomain}
              scale="time"
              allowDataOverflow
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(v) => v.toFixed(2)}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 单位净值渐变填充区域 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="none"
              fill="url(#navAreaGradient)"
              fillOpacity={1}
            />

            {/* 单位净值线 - 带投资点标记 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="#3B82F6"
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
      </div>

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
        {/* 每天定投时不显示买入点图例 */}
        {frequency !== "daily" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-500">定投买入点</span>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={showAccumulated}
            onChange={(e) => setShowAccumulated(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-slate-500 group-hover:text-slate-700">显示累计净值</span>
        </label>
      </div>
    </div>
  );
}
