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
        r={3}
        fill="#F53F3F"
        stroke="#fff"
        strokeWidth={1}
        style={{ cursor: "pointer" }}
      />
    );
  };
}

export function NavChart({
  navHistory,
  investRecords,
  timeRange,
  onTimeRangeChange,
  isLoading,
}: NavChartProps) {
  const [showAccumulated, setShowAccumulated] = useState(false);

  // 过滤时间范围
  const filteredData = useMemo(() => {
    const startDate = getTimeRangeStart(timeRange);
    if (!startDate) return navHistory;
    return navHistory.filter((p) => p.date >= startDate);
  }, [navHistory, timeRange]);

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

  // 投资日期集合（用于图表数据）
  const investDates = useMemo(() => {
    return new Set(investRecords?.filter(r => r.amount > 0).map(r => r.date) || []);
  }, [investRecords]);

  // 图表数据 - 采样 + 投资日期
  // 采样只依赖 filteredData（稳定），投资日期在采样后添加（不影响曲线形状）
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    // 第一步：从 filteredData 进行均匀采样（这部分是稳定的）
    let sampled: NavPoint[];
    if (filteredData.length <= 1000) {
      sampled = [...filteredData];
    } else {
      const sampleRate = Math.ceil(filteredData.length / 1000);
      sampled = [];
      for (let i = 0; i < filteredData.length; i += sampleRate) {
        sampled.push(filteredData[i]);
      }
      const lastPoint = filteredData[filteredData.length - 1];
      if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
        sampled.push(lastPoint);
      }
    }

    // 第二步：创建已采样日期的集合
    const sampledDates = new Set(sampled.map(p => p.date));

    // 第三步：添加投资日期（从 filteredData 获取对应的 NAV 点）
    // 这些点在曲线上已经存在，添加它们只是为了确保红点能显示
    const filteredDataMap = new Map(filteredData.map(p => [p.date, p]));
    Array.from(investDates).forEach((date) => {
      if (!sampledDates.has(date)) {
        const navPoint = filteredDataMap.get(date);
        if (navPoint) {
          sampled.push(navPoint);
        }
      }
    });

    // 按日期排序
    sampled.sort((a, b) => a.date.localeCompare(b.date));

    return sampled;
  }, [filteredData, investDates]);

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
        date: string;
        nav: number;
        accumulatedNav?: number;
        amount?: number;
        shares?: number;
      };
    }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // 合并所有 payload 数据
    const allPayloads = payload.map((p) => p.payload).filter(Boolean);
    const firstPayload = allPayloads[0];

    // 检查是否是投资点（来自散点或面积图）
    const investRecord = firstPayload?.amount
      ? { amount: firstPayload.amount, shares: firstPayload.shares! }
      : firstPayload?.date
      ? investPointsMap.get(firstPayload.date)
      : null;
    const isInvestPoint = !!investRecord;

    const navValue = firstPayload?.nav ?? payload.find((p) => p.dataKey === "nav")?.value;
    const accumulatedValue = firstPayload?.accumulatedNav ?? payload.find((p) => p.dataKey === "accumulatedNav")?.value;

    return (
      <div className="bg-white border border-border-default rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-text-1 mb-2">{label}</p>

        {/* 净值信息 */}
        {navValue !== undefined && (
          <p className="text-sm" style={{ color: "#1A5CFE" }}>
            单位净值: {navValue.toFixed(4)}
          </p>
        )}
        {accumulatedValue !== undefined && showAccumulated && (
          <p className="text-sm" style={{ color: "#FA8C16" }}>
            累计净值: {accumulatedValue.toFixed(4)}
          </p>
        )}

        {/* 投资信息（如果是投资点） */}
        {isInvestPoint && investRecord && (
          <div className="mt-2 pt-2 border-t border-border-default">
            <p className="text-xs text-text-3 mb-1">定投买入</p>
            <p className="text-sm text-profit font-medium">
              金额: {formatCurrency(investRecord.amount)}
            </p>
            <p className="text-sm text-text-2">
              份额: {formatNumber(investRecord.shares, 2)}
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

            {/* 单位净值线 - 带投资点标记 */}
            <Area
              type="monotone"
              dataKey="nav"
              stroke="#1A5CFE"
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
