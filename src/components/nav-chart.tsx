"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import type { NavPoint, InvestmentRecord, TimeRange } from "@/lib/types";
import { getTimeRangeStart } from "@/lib/date-utils";

interface NavChartProps {
  navHistory: NavPoint[];
  investRecords?: InvestmentRecord[];
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

export function NavChart({
  navHistory,
  investRecords,
  timeRange,
  onTimeRangeChange,
  isLoading,
}: NavChartProps) {
  const [showAccumulated, setShowAccumulated] = useState(true);

  // 过滤时间范围
  const filteredData = useMemo(() => {
    const startDate = getTimeRangeStart(timeRange);
    if (!startDate) return navHistory;
    return navHistory.filter((p) => p.date >= startDate);
  }, [navHistory, timeRange]);

  // 投资点
  const investPoints = useMemo(() => {
    if (!investRecords) return [];
    const startDate = getTimeRangeStart(timeRange);
    const filtered = startDate
      ? investRecords.filter((r) => r.date >= startDate)
      : investRecords;

    return filtered.map((r) => ({
      date: r.date,
      nav: r.nav,
    }));
  }, [investRecords, timeRange]);

  // 采样数据
  const chartData = useMemo(() => {
    if (filteredData.length <= 1000) return filteredData;

    const sampleRate = Math.ceil(filteredData.length / 1000);
    const sampled: typeof filteredData = [];
    for (let i = 0; i < filteredData.length; i += sampleRate) {
      sampled.push(filteredData[i]);
    }
    const lastPoint = filteredData[filteredData.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
      sampled.push(lastPoint);
    }

    const sampledDateSet = new Set(sampled.map((p) => p.date));
    const investDateSet = new Set(investPoints.map((p) => p.date));
    const missingPoints = filteredData.filter(
      (p) => investDateSet.has(p.date) && !sampledDateSet.has(p.date)
    );

    const combined = [...sampled, ...missingPoints];
    combined.sort((a, b) => a.date.localeCompare(b.date));

    return combined;
  }, [filteredData, investPoints]);

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
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border-default rounded-xl shadow-popup p-3">
          <p className="text-sm font-medium text-text-1 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === "nav"
                ? `单位净值: ${entry.value.toFixed(4)}`
                : `累计净值: ${entry.value.toFixed(4)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="card-professional p-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="card-professional p-6">
      {/* 标题和时间切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-text-1">净值走势</h3>
        <div className="flex gap-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTimeRangeChange(option.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-all duration-200",
                timeRange === option.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-2 hover:bg-gray-200"
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
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A5CFE" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#1A5CFE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: "#86909C" }}
              axisLine={{ stroke: "#E5E6EB" }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fill: "#86909C" }}
              tickFormatter={(v) => v.toFixed(2)}
              axisLine={{ stroke: "#E5E6EB" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="nav"
              stroke="#1A5CFE"
              name="单位净值"
              dot={false}
              strokeWidth={2}
            />
            {showAccumulated && (
              <Line
                type="monotone"
                dataKey="accumulatedNav"
                stroke="#00B42A"
                name="累计净值"
                dot={false}
                strokeWidth={2}
              />
            )}
            {/* 定投买入点 */}
            {investPoints.map((point, index) => (
              <ReferenceDot
                key={index}
                x={point.date}
                y={point.nav}
                r={3}
                fill="#F53F3F"
                stroke="#fff"
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-profit" />
          <span>定投买入点</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAccumulated}
            onChange={(e) => setShowAccumulated(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary"
          />
          <span>显示累计净值</span>
        </label>
      </div>
    </div>
  );
}
