"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavPoint, InvestmentRecord, TimeRange } from "@/lib/types";
import { getTimeRangeStart } from "@/lib/date-utils";

interface NavChartProps {
  navHistory: NavPoint[];
  investRecords?: InvestmentRecord[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
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

  // 采样数据（确保包含首尾和所有投资日期）
  const chartData = useMemo(() => {
    if (filteredData.length <= 1000) return filteredData;

    const sampleRate = Math.ceil(filteredData.length / 1000);

    // 采样时确保首尾都被包含
    const sampled: typeof filteredData = [];
    for (let i = 0; i < filteredData.length; i += sampleRate) {
      sampled.push(filteredData[i]);
    }
    // 确保最后一个点被包含
    const lastPoint = filteredData[filteredData.length - 1];
    if (sampled[sampled.length - 1]?.date !== lastPoint.date) {
      sampled.push(lastPoint);
    }

    // 确保投资日期都在采样数据中
    const sampledDateSet = new Set(sampled.map((p) => p.date));
    const investDateSet = new Set(investPoints.map((p) => p.date));

    // 添加缺失的投资日期对应的数据点
    const missingPoints = filteredData.filter(
      (p) => investDateSet.has(p.date) && !sampledDateSet.has(p.date)
    );

    const combined = [...sampled, ...missingPoints];
    // 按日期排序
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
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
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
      <Card>
        <CardHeader>
          <CardTitle>净值走势</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">净值走势</CardTitle>
        <Tabs value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRange)}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="5y">5年</TabsTrigger>
            <TabsTrigger value="3y">3年</TabsTrigger>
            <TabsTrigger value="1y">1年</TabsTrigger>
            <TabsTrigger value="6m">6月</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#1677FF"
                name="单位净值"
                dot={false}
                strokeWidth={2}
              />
              {showAccumulated && (
                <Line
                  type="monotone"
                  dataKey="accumulatedNav"
                  stroke="#52c41a"
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
                  r={2.5}
                  fill="#ff4d4f"
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff4d4f]" />
            <span>定投买入点</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAccumulated}
              onChange={(e) => setShowAccumulated(e.target.checked)}
              className="rounded"
            />
            <span>显示累计净值</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
