"use client";

import { Play, Info, AlertCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "./ui/segmented-control";
import { Stepper } from "./ui/stepper";
import { CalendarMatrix, WeekDaySelector } from "./ui/calendar-matrix";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type { DCAConfig } from "@/lib/types";

interface StrategyConfigProps {
  config: DCAConfig;
  onConfigChange: (config: DCAConfig) => void;
  onSimulate: () => void;
  isLoading?: boolean;
  minDate?: string;
  maxDate?: string;
  error?: string | null;
}

export function StrategyConfig({
  config,
  onConfigChange,
  onSimulate,
  isLoading,
  minDate,
  maxDate,
  error,
}: StrategyConfigProps) {
  const updateConfig = (updates: Partial<DCAConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="card-professional p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
          <Settings className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">定投策略配置</h3>
      </div>

      {/* 定投频率 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">定投频率</label>
        <SegmentedControl
          options={[
            { value: "monthly", label: "每月" },
            { value: "weekly", label: "每周" },
            { value: "daily", label: "每天" },
          ]}
          value={config.frequency}
          onChange={(value: "monthly" | "weekly" | "daily") =>
            updateConfig({ frequency: value })
          }
        />
      </div>

      {/* 定投日期 - 每天定投时不显示 */}
      {config.frequency !== "daily" && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">
            {config.frequency === "monthly" ? "每月定投日" : "每周定投日"}
          </label>
          {config.frequency === "monthly" ? (
            <CalendarMatrix
              selectedDays={config.dayOfMonth ? [config.dayOfMonth] : [1]}
              onChange={(days) => updateConfig({ dayOfMonth: days[0] })}
              mode="single"
              maxDays={28}
            />
          ) : (
            <WeekDaySelector
              selectedDay={config.dayOfWeek || 1}
              onChange={(day) => updateConfig({ dayOfWeek: day })}
            />
          )}
        </div>
      )}

      {/* 定投金额 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">每次定投金额</label>
        <Stepper
          value={config.amount}
          onChange={(value) => updateConfig({ amount: value })}
          min={100}
          max={100000}
          step={100}
          quickAmounts={[500, 1000, 5000]}
        />
      </div>

      {/* 日期范围 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">投资日期范围</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-500">开始日期</span>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => updateConfig({ startDate: e.target.value })}
              min={minDate}
              max={config.endDate}
              className="input-glass"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-slate-500">结束日期</span>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => updateConfig({ endDate: e.target.value })}
              min={config.startDate}
              max={maxDate}
              className="input-glass"
            />
          </div>
        </div>
      </div>

      {/* 非交易日规则 - 每日定投时隐藏 */}
      {config.frequency !== "daily" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">非交易日处理</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    当定投日遇到周末或节假日时：
                    <br />
                    <strong className="text-blue-600">顺延</strong>：在下一个交易日执行买入
                    <br />
                    <strong className="text-blue-600">跳过</strong>：跳过本次定投
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-3">
            <label
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                config.nonTradeDayRule === "next"
                  ? "bg-blue-50 border-2 border-blue-400 text-blue-600"
                  : "bg-slate-50 border-2 border-transparent text-slate-600 hover:border-slate-200"
              )}
            >
              <input
                type="radio"
                name="nonTradeDayRule"
                value="next"
                checked={config.nonTradeDayRule === "next"}
                onChange={() => updateConfig({ nonTradeDayRule: "next" })}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                  config.nonTradeDayRule === "next"
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300"
                )}
              >
                {config.nonTradeDayRule === "next" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm font-medium">顺延</span>
            </label>

            <label
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                config.nonTradeDayRule === "skip"
                  ? "bg-blue-50 border-2 border-blue-400 text-blue-600"
                  : "bg-slate-50 border-2 border-transparent text-slate-600 hover:border-slate-200"
              )}
            >
              <input
                type="radio"
                name="nonTradeDayRule"
                value="skip"
                checked={config.nonTradeDayRule === "skip"}
                onChange={() => updateConfig({ nonTradeDayRule: "skip" })}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                  config.nonTradeDayRule === "skip"
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300"
                )}
              >
                {config.nonTradeDayRule === "skip" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm font-medium">跳过</span>
            </label>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-600 font-medium">模拟计算失败</p>
              <p className="text-sm text-red-500/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 开始模拟按钮 */}
      <button
        className={cn(
          "w-full h-12 text-base font-medium rounded-xl",
          "bg-blue-500 text-white",
          "transition-all duration-200",
          "hover:bg-blue-600 active:scale-[0.99]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
        onClick={onSimulate}
        disabled={isLoading || config.amount <= 0}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            计算中...
          </span>
        ) : (
          <>
            <Play className="w-5 h-5" />
            开始模拟
          </>
        )}
      </button>
    </div>
  );
}
