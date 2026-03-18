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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-text-1">{fund.name}</h2>
          <Star className="w-5 h-5 text-wealth fill-wealth" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-number text-lg font-medium text-text-1">
            {fund.code}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-md bg-primary-50 text-primary">
            {fund.type}
          </span>
        </div>
      </div>

      {/* 净值信息卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 单位净值 */}
        <div className="p-4 rounded-xl bg-gray-50">
          <p className="text-sm text-text-3 mb-1">单位净值</p>
          <p className="text-2xl font-bold font-number text-text-1">
            {fund.nav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-text-4 mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 累计净值 */}
        <div className="p-4 rounded-xl bg-gray-50">
          <p className="text-sm text-text-3 mb-1">累计净值</p>
          <p className="text-2xl font-bold font-number text-text-1">
            {fund.accumulatedNav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-text-4 mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 日涨跌幅 */}
        <div
          className={cn(
            "p-4 rounded-xl",
            isProfit ? "bg-profit/5" : "bg-loss/5"
          )}
        >
          <p className="text-sm text-text-3 mb-1">日涨跌幅</p>
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-2xl font-bold font-number",
                isProfit ? "text-profit" : "text-loss"
              )}
            >
              {fund.dayGrowth
                ? `${isProfit ? "+" : ""}${fund.dayGrowth}%`
                : "-"}
            </p>
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-profit" />
            ) : (
              <TrendingDown className="w-5 h-5 text-loss" />
            )}
          </div>
        </div>
      </div>

      {/* 基金详情 */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-3">基金经理:</span>
          <span className="text-text-1 font-medium">{fund.manager}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-3">基金公司:</span>
          <span className="text-text-1 font-medium">{fund.company}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-3">成立日期:</span>
          <span className="text-text-1 font-medium">{fund.establishDate}</span>
        </div>
      </div>
    </div>
  );
}
