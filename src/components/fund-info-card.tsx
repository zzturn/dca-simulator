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
    <div className="card-professional p-6 relative overflow-hidden">
      {/* 装饰性发光 */}
      <div className="absolute -top-10 -right-10 glow-primary opacity-30" />

      {/* 基金名称行 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-wealth/20 text-wealth">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-on-surface">{fund.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-number text-base font-medium text-on-surface-variant">
                {fund.code}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary-container text-primary-on-container">
                {fund.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 净值信息卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 relative z-10">
        {/* 单位净值 */}
        <div className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/50">
          <p className="text-sm text-on-surface-muted mb-1">单位净值</p>
          <p className="text-2xl font-bold font-number text-on-surface">
            {fund.nav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-on-surface-muted mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 累计净值 */}
        <div className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/50">
          <p className="text-sm text-on-surface-muted mb-1">累计净值</p>
          <p className="text-2xl font-bold font-number text-on-surface">
            {fund.accumulatedNav?.toFixed(4) || "-"}
          </p>
          <p className="text-xs text-on-surface-muted mt-1">{fund.navDate || fund.establishDate}</p>
        </div>

        {/* 日涨跌幅 */}
        <div
          className={cn(
            "p-4 rounded-xl border",
            isProfit
              ? "bg-profit-container/50 border-profit/20"
              : "bg-loss-container/50 border-loss/20"
          )}
        >
          <p className={cn(
            "text-sm mb-1",
            isProfit ? "text-profit-light/70" : "text-loss-light/70"
          )}>日涨跌幅</p>
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
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-muted">基金经理:</span>
          <span className="text-on-surface font-medium">{fund.manager}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface-muted">基金公司:</span>
          <span className="text-on-surface font-medium">{fund.company}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface-muted">成立日期:</span>
          <span className="text-on-surface font-medium">{fund.establishDate}</span>
        </div>
      </div>
    </div>
  );
}
