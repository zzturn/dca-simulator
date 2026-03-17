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
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestmentRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface AssetChartProps {
  records: InvestmentRecord[];
}

export function AssetChart({ records }: AssetChartProps) {
  // 采样数据（超过500点时采样）
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
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          <p className="text-sm text-gray-700">
            累计投入: {formatCurrency(cost)}
          </p>
          <p className="text-sm text-gray-700">
            当前市值: {formatCurrency(current)}
          </p>
          <p
            className={`text-sm font-medium ${
              profit >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            收益: {formatCurrency(profit)}
          </p>
        </div>
      );
    }
    return null;
  };

  // 计算盈亏区域填充
  const isOverallProfit = records.length > 0 && records[records.length - 1].profit >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">资产曲线</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sampledData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isOverallProfit ? "#D84A4A" : "#3BA272"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isOverallProfit ? "#D84A4A" : "#3BA272"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* 成本线 */}
              <Area
                type="monotone"
                dataKey="totalCost"
                stroke="#8884d8"
                strokeDasharray="5 5"
                fill="transparent"
                name="累计投入"
              />
              {/* 市值曲线 */}
              <Area
                type="monotone"
                dataKey="currentValue"
                stroke={isOverallProfit ? "#D84A4A" : "#3BA272"}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                name="当前市值"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400" style={{ borderStyle: "dashed" }} />
            <span>累计投入</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-0.5"
              style={{
                backgroundColor: isOverallProfit ? "#D84A4A" : "#3BA272",
              }}
            />
            <span>当前市值</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
