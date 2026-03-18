"use client";

import { Play, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "./ui/segmented-control";
import { Stepper } from "./ui/stepper";
import { CalendarMatrix, WeekDaySelector } from "./ui/calendar-matrix";
import { Button } from "./ui/button";
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
}

export function StrategyConfig({
  config,
  onConfigChange,
  onSimulate,
  isLoading,
  minDate,
  maxDate,
}: StrategyConfigProps) {
  const updateConfig = (updates: Partial<DCAConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="card-professional p-6 space-y-6">
      <h3 className="text-lg font-semibold text-text-1">定投策略配置</h3>

      {/* 定投频率 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-2">定投频率</label>
        <SegmentedControl
          options={[
            { value: "monthly", label: "每月" },
            { value: "weekly", label: "每周" },
          ]}
          value={config.frequency}
          onChange={(value: "monthly" | "weekly") =>
            updateConfig({ frequency: value })
          }
        />
      </div>

      {/* 定投日期 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-2">
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

      {/* 定投金额 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-2">每次定投金额</label>
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
        <label className="text-sm font-medium text-text-2">投资日期范围</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-text-3">开始日期</span>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => updateConfig({ startDate: e.target.value })}
              min={minDate}
              max={config.endDate}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-default bg-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-text-3">结束日期</span>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => updateConfig({ endDate: e.target.value })}
              min={config.startDate}
              max={maxDate}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-default bg-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 非交易日规则 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-2">非交易日处理</label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-text-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  当定投日遇到周末或节假日时：
                  <br />
                  <strong>顺延</strong>：在下一个交易日执行买入
                  <br />
                  <strong>跳过</strong>：跳过本次定投
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-4">
          <label
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all",
              config.nonTradeDayRule === "next"
                ? "bg-primary-50 border-2 border-primary"
                : "bg-gray-50 border-2 border-transparent hover:border-border-default"
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
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                config.nonTradeDayRule === "next"
                  ? "border-primary"
                  : "border-text-3"
              )}
            >
              {config.nonTradeDayRule === "next" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                config.nonTradeDayRule === "next" ? "text-primary" : "text-text-2"
              )}
            >
              顺延到下一交易日
            </span>
          </label>

          <label
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all",
              config.nonTradeDayRule === "skip"
                ? "bg-primary-50 border-2 border-primary"
                : "bg-gray-50 border-2 border-transparent hover:border-border-default"
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
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                config.nonTradeDayRule === "skip"
                  ? "border-primary"
                  : "border-text-3"
              )}
            >
              {config.nonTradeDayRule === "skip" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                config.nonTradeDayRule === "skip" ? "text-primary" : "text-text-2"
              )}
            >
              跳过
            </span>
          </label>
        </div>
      </div>

      {/* 开始模拟按钮 */}
      <Button
        className="w-full h-12 text-base font-medium"
        size="lg"
        onClick={onSimulate}
        disabled={isLoading || config.amount <= 0}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            计算中...
          </span>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            开始模拟
          </>
        )}
      </Button>
    </div>
  );
}
