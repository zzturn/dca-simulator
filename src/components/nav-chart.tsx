"use client";

import { useMemo, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Line,
} from "recharts";
import { Skeleton } from "./ui/skeleton";
import type { NavPoint, InvestmentRecord, TimeRange, DCAConfig } from "@/lib/types";
import { getTimeRangeStart, formatDateToSlash } from "@/lib/date-utils";
import { ZoomIn, RotateCcw, Check } from "lucide-react";
import { TimeRangeSelector, NavChartTooltip } from "./charts";
import { useChartInteraction } from "@/hooks";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface NavChartProps {
  navHistory: NavPoint[];
  investRecords?: InvestmentRecord[];
  frequency: DCAConfig["frequency"];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onApplyRange?: (range: DateRange) => void;
  isLoading?: boolean;
}

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
  onApplyRange,
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

  // 图表数据 - 使用完整数据以支持每个交易日的详细信息
  // 包含每天的平均成本（从 investRecords 计算）
  const chartData = useMemo(() => {
    if (navHistory.length === 0) return [];

    // 创建日期到平均成本的映射
    const avgCostMap = new Map<string, number>();
    if (investRecords) {
      for (const record of investRecords) {
        if (record.totalShares > 0) {
          avgCostMap.set(record.date, record.totalCost / record.totalShares);
        }
      }
    }

    // 前向填充：对于没有投资记录的日期，使用前一天的平均成本
    let lastAvgCost: number | undefined;
    return navHistory.map(p => {
      const avgCost = avgCostMap.get(p.date);
      if (avgCost !== undefined) {
        lastAvgCost = avgCost;
      }
      return {
        ...p,
        ts: new Date(p.date).getTime(),
        avgCost: lastAvgCost, // 使用最近的有效平均成本
      };
    });
  }, [navHistory, investRecords]);

  // 使用图表交互 hook
  const {
    isDragging,
    dragStartTs,
    dragEndTs,
    customRange,
    chartRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetZoom,
  } = useChartInteraction({
    chartData,
    timeRangeStartTs,
    timeRangeEndTs: null,
    customRange: null,
  });

  // XAxis domain（支持自定义范围）
  const xAxisDomain = useMemo((): [number | string, number | string] => {
    if (customRange) {
      return [customRange.start, customRange.end];
    }
    if (timeRangeStartTs === null) return ["dataMin", "dataMax"];
    return [timeRangeStartTs, "dataMax"];
  }, [timeRangeStartTs, customRange]);

  // 将当前缩放区间应用到定投配置
  const handleApplyToDCA = useCallback(() => {
    if (customRange && onApplyRange) {
      const startDate = new Date(customRange.start);
      const endDate = new Date(customRange.end);
      const formatDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      onApplyRange({
        startDate: formatDateStr(startDate),
        endDate: formatDateStr(endDate),
      });
    }
  }, [customRange, onApplyRange]);

  // 重置到原始范围
  const handleResetZoom = useCallback(() => {
    resetZoom();
    onTimeRangeChange("all");
  }, [resetZoom, onTimeRangeChange]);

  // 计算X轴刻度 - 使用当前显示范围的边界值
  const tickValues = useMemo(() => {
    if (!chartData.length) return [];
    const maxTs = customRange ? customRange.end : chartData[chartData.length - 1].ts;
    // 如果有时间范围限制，左侧标签显示时间范围起始点；否则显示数据起始点
    const minTs = timeRangeStartTs ?? chartData[0].ts;
    return [minTs, maxTs];
  }, [chartData, timeRangeStartTs, customRange]);

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

  // 格式化X轴日期 - 使用共享函数
  const formatXAxis = formatDateToSlash;

  // 格式化时间戳 - 使用共享函数
  const formatTimestamp = formatDateToSlash;

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
        <TimeRangeSelector timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />
      </div>

      {/* 图表 */}
      <div
        ref={chartRef}
        className="h-64 relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          // ESC 重置缩放（可访问性支持）
          if (e.key === 'Escape' && customRange) {
            resetZoom();
          }
        }}
        tabIndex={0}
        role="img"
        aria-label={`净值走势图表，从 ${formatDateToSlash(chartData[0]?.ts)} 到 ${formatDateToSlash(chartData[chartData.length - 1]?.ts)}`}
        style={{ cursor: isDragging ? 'crosshair' : 'default' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            tabIndex={-1}
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
              <linearGradient id="selectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
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
            <Tooltip content={<NavChartTooltip showAccumulated={showAccumulated} investPointsMap={investPointsMap} />} />

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

            {/* 持仓成本线 - 动态显示每天的平均成本 */}
            <Line
              type="stepAfter"
              dataKey="avgCost"
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />

            {/* 拖拽选择区域 */}
            {isDragging && dragStartTs !== null && dragEndTs !== null && (
              <ReferenceArea
                x1={Math.min(dragStartTs, dragEndTs)}
                x2={Math.max(dragStartTs, dragEndTs)}
                fill="url(#selectionGradient)"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeOpacity={0.5}
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

        {/* 拖拽提示 */}
        {!customRange && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded-md">
            <ZoomIn className="w-3 h-3" />
            <span>拖拽放大</span>
          </div>
        )}

        {/* 重置按钮 */}
        {customRange && (
          <button
            onClick={handleResetZoom}
            className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-blue-400 bg-slate-900/80 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置</span>
          </button>
        )}
      </div>

      {/* 已选中区间提示和应用按钮 */}
      {customRange && onApplyRange && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 animate-slide-up">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-slate-400">已选中区间：</span>
            <span className="text-white font-medium">
              {formatTimestamp(customRange.start)} — {formatTimestamp(customRange.end)}
            </span>
          </div>
          <button
            onClick={handleApplyToDCA}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            应用到定投配置
          </button>
        </div>
      )}

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
