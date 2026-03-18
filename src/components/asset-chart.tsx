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

interface AssetChartProps {
  records: InvestmentRecord[];
}

export function AssetChart({ records }: AssetChartProps) {
  // 采样数据
  const sampledData = useMemo(() => {
    if (records.length <= 500) return records;

    const sampleRate = Math.ceil(records.length / 500);
    return records.filter((_, index) => index % sampleRate === 0);
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
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const current = payload.find((p) => p.dataKey === "currentValue")?.value || 0;
      const cost = payload.find((p) => p.dataKey === "totalCost")?.value || 0;
      const profit = current - cost;

      return (
        <div className="bg-white border border-border-default rounded-xl shadow-popup p-3">
          <p className="text-sm font-medium text-text-1 mb-2">{label}</p>
          <p className="text-sm text-text-2">
            累计投入: {formatCurrency(cost)}
          </p>
          <p className="text-sm text-text-2">
            当前市值: {formatCurrency(current)}
          </p>
          <p
            className={cn(
              "text-sm font-medium mt-1",
              profit >= 0 ? "text-profit" : "text-loss"
            )}
          >
            收益: {formatCurrency(profit)}
          </p>
        </div>
      );
    }
    return null;
  };

  // 判断整体盈亏
  const isOverallProfit = records.length > 0 && records[records.length - 1].profit >= 0;

  return (
    <div className="card-professional p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-6">资产曲线</h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sampledData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isOverallProfit ? "#F53F3F" : "#13C2C2"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={isOverallProfit ? "#F53F3F" : "#13C2C2"}
                  stopOpacity={0}
                />
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
              tick={{ fontSize: 12, fill: "#86909C" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: "#E5E6EB" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* 成本线 */}
            <Area
              type="monotone"
              dataKey="totalCost"
              stroke="#86909C"
              strokeDasharray="5 5"
              fill="transparent"
              name="累计投入"
              strokeWidth={1.5}
            />
            {/* 市值曲线 */}
            <Area
              type="monotone"
              dataKey="currentValue"
              stroke={isOverallProfit ? "#F53F3F" : "#13C2C2"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#assetGradient)"
              name="当前市值"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="mt-4 flex items-center gap-6 text-sm text-text-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-0.5 bg-text-3"
            style={{ borderStyle: "dashed" }}
          />
          <span>累计投入</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-0.5 rounded"
            style={{
              backgroundColor: isOverallProfit ? "#F53F3F" : "#13C2C2",
            }}
          />
          <span>当前市值</span>
        </div>
      </div>
    </div>
  );
}
