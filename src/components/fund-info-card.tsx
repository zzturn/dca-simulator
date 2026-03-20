"use client";

import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Fund } from "@/lib/types";

interface FundInfoCardProps {
  fund: Fund;
}

export function FundInfoCard({ fund }: FundInfoCardProps) {
  const dayGrowthNum = fund.dayGrowth ? parseFloat(fund.dayGrowth) : 0;
  const isProfit = dayGrowthNum >= 0;

  return (
    <div className="card-professional p-6">
      {/* 基金名称行 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-500">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{fund.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-number text-base font-medium text-slate-600">
                {fund.code}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600">
                {fund.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 净值信息卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* 单位净值 */}
        <div className="p-4 rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500 mb-1">单位净值</p>
          <p className="text-2xl font-bold font-number text-slate-900">
            {fund.nav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 累计净值 */}
        <div className="p-4 rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500 mb-1">累计净值</p>
          <p className="text-2xl font-bold font-number text-slate-900">
            {fund.accumulatedNav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 日涨跌幅 */}
        <div
          className={cn(
            "p-4 rounded-xl",
            isProfit ? "bg-red-50" : "bg-emerald-50"
          )}
        >
          <p className={cn(
            "text-sm mb-1",
            isProfit ? "text-red-600/70" : "text-emerald-600/70"
          )}>日涨跌幅</p>
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-2xl font-bold font-number",
                isProfit ? "text-red-500" : "text-emerald-500"
              )}
            >
              {fund.dayGrowth
                ? `${isProfit ? "+" : ""}${fund.dayGrowth}%`
                : "-"}
            </p>
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            )}
          </div>
        </div>
      </div>

      {/* 基金详情 */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">基金经理:</span>
          <span className="text-slate-900 font-medium">{fund.manager}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">基金公司:</span>
          <span className="text-slate-900 font-medium">{fund.company}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">成立日期:</span>
          <span className="text-slate-900 font-medium">{fund.establishDate}</span>
        </div>
      </div>
    </div>
  );
}
