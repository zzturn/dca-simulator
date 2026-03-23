"use client";

import { Calendar } from "lucide-react";
import { formatDateToSlash } from "@/lib/date-utils";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface TooltipPayload {
  date?: string;
  ts?: number;
  nav: number;
  accumulatedNav?: number;
  avgCost?: number;
  amount?: number;
  shares?: number;
}

interface InvestPoint {
  amount: number;
  shares: number;
}

interface NavChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload?: TooltipPayload;
  }>;
  label?: number;
  showAccumulated?: boolean;
  investPointsMap: Map<string, InvestPoint>;
}

export function NavChartTooltip({
  active,
  payload,
  label,
  showAccumulated,
  investPointsMap,
}: NavChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const allPayloads = payload.map((p) => p.payload).filter(Boolean);
  const firstPayload = allPayloads[0];

  const dateStr = label ? formatDateToSlash(label) : (firstPayload?.date || "");

  const investRecord = firstPayload?.date
    ? investPointsMap.get(firstPayload.date)
    : dateStr
    ? investPointsMap.get(dateStr)
    : null;
  const isInvestPoint = !!investRecord;

  const navValue = firstPayload?.nav ?? payload.find((p) => p.dataKey === "nav")?.value;
  const accumulatedValue = firstPayload?.accumulatedNav ?? payload.find((p) => p.dataKey === "accumulatedNav")?.value;
  const avgCostValue = firstPayload?.avgCost;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 min-w-[180px] border border-white/10">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
        <Calendar className="w-4 h-4 text-slate-400" />
        <p className="text-sm font-medium text-white">{dateStr}</p>
      </div>

      <div className="space-y-1.5">
        {navValue !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">单位净值</span>
            <span className="text-sm font-semibold text-blue-400">
              {navValue.toFixed(4)}
            </span>
          </div>
        )}
        {accumulatedValue !== undefined && showAccumulated && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">累计净值</span>
            <span className="text-sm font-semibold text-amber-400">
              {accumulatedValue.toFixed(4)}
            </span>
          </div>
        )}
        {avgCostValue !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-400">持仓成本</span>
            <span className="text-sm font-semibold text-emerald-400">
              {avgCostValue.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {isInvestPoint && investRecord && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs font-medium text-[#f87171] mb-1.5">定投买入</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">金额</span>
              <span className="text-sm font-semibold text-[#f87171]">
                {formatCurrency(investRecord.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">份额</span>
              <span className="text-sm font-medium text-slate-300">
                {formatNumber(investRecord.shares, 2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
