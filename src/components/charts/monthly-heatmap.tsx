"use client";

import { useMemo, useState } from "react";
import type { InvestmentRecord } from "@/lib/types";
import {
  calculateMonthlyReturns,
  getReturnColor,
  formatReturnRate,
  getYearsFromMonthlyReturns,
  getYearData,
  MONTH_NAMES,
  type MonthlyReturn,
} from "@/lib/heatmap-utils";
import { cn } from "@/lib/utils";

interface MonthlyHeatmapProps {
  records: InvestmentRecord[];
  className?: string;
}

/**
 * 热力图单元格组件
 */
function HeatmapCell({
  data,
  onMouseEnter,
  onMouseLeave,
}: {
  data: MonthlyReturn | null;
  onMouseEnter: (e: React.MouseEvent, data: MonthlyReturn) => void;
  onMouseLeave: () => void;
}) {
  if (!data || !data.hasData) {
    return (
      <td>
        <div className="w-full aspect-square rounded-lg bg-slate-800/30" />
      </td>
    );
  }

  const { bgClass, opacity } = getReturnColor(data.returnRate);
  const isProfit = data.returnRate >= 0;

  return (
    <td
      className="relative"
      onMouseEnter={(e) => onMouseEnter(e, data)}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={cn(
          "w-full aspect-square rounded-lg transition-all duration-200 flex items-center justify-center",
          "hover:scale-110 hover:z-10 hover:shadow-lg cursor-pointer",
          bgClass
        )}
        style={{ opacity }}
      >
        <span
          className={cn(
            "text-[10px] font-bold",
            isProfit ? "text-white" : "text-slate-900"
          )}
        >
          {formatReturnRate(data.returnRate)}
        </span>
      </div>
    </td>
  );
}

/**
 * 热力图 Tooltip 组件
 */
function HeatmapTooltip({
  data,
  position,
}: {
  data: MonthlyReturn;
  position: { x: number; y: number };
}) {
  const isProfit = data.returnRate >= 0;
  const sign = data.returnRate >= 0 ? "+" : "";

  return (
    <div
      className="fixed z-50 bg-slate-900 border border-white/10 rounded-lg p-3 shadow-xl pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: "translateY(-100%)",
      }}
    >
      <div className="text-xs text-slate-400 mb-1">
        {data.year}年{data.month}月
      </div>
      <div
        className={cn(
          "text-sm font-bold",
          isProfit ? "text-financial-up" : "text-financial-down"
        )}
      >
        收益率: {sign}{(data.returnRate * 100).toFixed(2)}%
      </div>
      <div className="text-xs text-slate-500 mt-1">
        月初: ¥{data.startValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div className="text-xs text-slate-500">
        月末: ¥{data.endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

/**
 * 月度收益热力图组件
 * 类似 GitHub 贡献图的展示方式，显示每个月的收益/亏损分布
 */
export function MonthlyHeatmap({ records, className }: MonthlyHeatmapProps) {
  const [tooltipData, setTooltipData] = useState<{
    data: MonthlyReturn;
    position: { x: number; y: number };
  } | null>(null);

  // 计算月度收益数据
  const monthlyReturns = useMemo(
    () => calculateMonthlyReturns(records),
    [records]
  );

  // 获取所有年份
  const years = useMemo(
    () => getYearsFromMonthlyReturns(monthlyReturns),
    [monthlyReturns]
  );

  // 处理鼠标悬停
  const handleMouseEnter = (e: React.MouseEvent, data: MonthlyReturn) => {
    setTooltipData({
      data,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  if (records.length === 0 || years.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-slate-900/60 rounded-[2rem] p-8 border border-white/5 space-y-6", className)}>
      {/* 标题和图例 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">月度收益分布</h3>
          <p className="text-sm text-slate-400">直观查看历史各月份盈亏强弱分布</p>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-950 rounded-lg border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500">亏损</span>
            <div className="flex gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1].map((op) => (
                <div
                  key={op}
                  className="w-3 h-3 rounded-sm bg-financial-down"
                  style={{ opacity: op }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 0.8, 0.6, 0.4, 0.2].map((op) => (
                <div
                  key={op}
                  className="w-3 h-3 rounded-sm bg-financial-up"
                  style={{ opacity: op }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-500">盈利</span>
          </div>
        </div>
      </div>

      {/* 热力图表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="w-12"></th>
              {MONTH_NAMES.map((name) => (
                <th
                  key={name}
                  className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const yearData = getYearData(monthlyReturns, year);
              // 检查是否是当前年，需要标记未过去的月份
              const currentYear = new Date().getFullYear();
              const currentMonth = new Date().getMonth() + 1;
              const isCurrentYear = year === currentYear;

              return (
                <tr key={year}>
                  <td className="text-xs font-bold text-slate-400 pr-2">
                    {year}
                  </td>
                  {yearData.map((data, monthIndex) => {
                    const month = monthIndex + 1;
                    // 当前年未过去的月份显示占位符
                    if (isCurrentYear && month > currentMonth) {
                      return (
                        <td key={month}>
                          <div className="w-full aspect-square rounded-lg bg-slate-800/20 flex items-center justify-center">
                            <span className="text-[8px] text-slate-600">待更新</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <HeatmapCell
                        key={month}
                        data={data}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <HeatmapTooltip data={tooltipData.data} position={tooltipData.position} />
      )}
    </div>
  );
}
