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
import type { NavPoint, InvestmentRecord, TimeRange } from "@/lib/types";
import { getTimeRangeStart } from "@/lib/date-utils";
import { formatCurrency, formatNumber } from "@/lib/utils";

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

// 自定义Dot组件 - 显示投资点
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    date: string;
    nav: number;
    accumulatedNav: number;
    investAmount?: number;
    investShares?: number;
    isInvestPoint?: boolean;
  };
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (!payload?.isInvestPoint || cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#F53F3F"
      stroke="#fff"
      strokeWidth={1}
      style={{ cursor: "pointer" }}
    />
  );
}

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

  // 创建投资日期到投资记录的映射（只包含实际投资日，amount > 0）
  const investMap = useMemo(() => {
    const map = new Map<string, InvestmentRecord>();
    if (investRecords) {
      investRecords.forEach((r) => {
        // 只记录实际投资的日期（金额 > 0）
        if (r.amount > 0) {
          map.set(r.date, r);
        }
      });
    }
    return map;
  }, [investRecords]);

  // 采样数据（确保包含首尾和所有投资日期）
  const chartData = useMemo(() => {
    // 为每个数据点添加投资信息
    const enrichData = (data: NavPoint[]) =>
      data.map((p) => {
        const investRecord = investMap.get(p.date);
        return {
          ...p,
          investAmount: investRecord?.amount,
          investShares: investRecord?.shares,
          isInvestPoint: !!investRecord,
        };
      });

    if (filteredData.length <= 1000) {
      return enrichData(filteredData);
    }

    const sampleRate = Math.ceil(filteredData.length / 1000);
    const sampled: NavPoint[] = [];
    for (let i = 0; i < filteredData.length; i += sampleRate) {
      sampled.push(filteredData[i]);
    }
    const lastPoint = filteredData[filteredData.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
      sampled.push(lastPoint);
    }

    // 确保投资日期都在采样数据中
    const sampledDateSet = new Set(sampled.map((p) => p.date));
    const missingPoints = filteredData.filter(
      (p) => investMap.has(p.date) && !sampledDateSet.has(p.date)
    );

    const combined = [...sampled, ...missingPoints];
    combined.sort((a, b) => a.date.localeCompare(b.date));

    return enrichData(combined);
  }, [filteredData, investMap]);

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
      color: string;
      payload?: {
        date: string;
        nav: number;
        accumulatedNav: number;
        investAmount?: number;
        investShares?: number;
        isInvestPoint?: boolean;
      };
    }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const firstPayload = payload[0]?.payload;
    const isInvestPoint = firstPayload?.isInvestPoint && firstPayload?.investAmount != null;

    const navEntry = payload.find((p) => p.dataKey === "nav");
    const accumulatedEntry = payload.find((p) => p.dataKey === "accumulatedNav");

    return (
      <div className="bg-white border border-border-default rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-text-1 mb-2">{label}</p>

        {/* 净值信息 */}
        {navEntry && (
          <p className="text-sm" style={{ color: "#1A5CFE" }}>
            单位净值: {navEntry.value.toFixed(4)}
          </p>
        )}
        {accumulatedEntry && showAccumulated && (
          <p className="text-sm" style={{ color: "#FA8C16" }}>
            累计净值: {accumulatedEntry.value.toFixed(4)}
          </p>
        )}

        {/* 投资信息（如果是投资点） */}
        {isInvestPoint && (
          <div className="mt-2 pt-2 border-t border-border-default">
            <p className="text-xs text-text-3 mb-1">定投买入</p>
            <p className="text-sm text-profit font-medium">
              金额: {formatCurrency(firstPayload.investAmount as number)}
            </p>
            <p className="text-sm text-text-2">
              份额: {formatNumber(firstPayload.investShares as number, 2)}
            </p>
          </div>
        )}
      </div>
    );
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
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              {/* 净值线渐变填充 */}
              <linearGradient id="navAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A5CFE" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#1A5CFE" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#1A5CFE" stopOpacity={0} />
              </linearGradient>
              {/* 累计净值渐变填充 */}
              <linearGradient id="accNavAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FA8C16" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FA8C16" stopOpacity={0} />
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

            {/* 单位净值渐变填充区域 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="none"
              fill="url(#navAreaGradient)"
              fillOpacity={1}
            />

            {/* 单位净值线 - 只在投资点显示dot */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="#1A5CFE"
              strokeWidth={2}
              fill="none"
              dot={<CustomDot />}
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
                stroke="#FA8C16"
                strokeWidth={2}
                fill="none"
                dot={false}
              />
            )}
          </AreaChart>
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
