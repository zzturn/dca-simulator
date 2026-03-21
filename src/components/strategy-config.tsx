"use client";

import { useState, useRef, useEffect } from "react";
import { Info, AlertCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarMatrix } from "./ui/calendar-matrix";
import { DateSegmentInput } from "./ui/date-segment-input";
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
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (updates: Partial<DCAConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  // 当进入编辑模式时，聚焦输入框并选中所有文字
  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingAmount]);

  // 格式化金额显示（添加千分位）
  const formatAmount = (amount: number) => {
    return amount.toLocaleString("zh-CN");
  };

  // 处理金额输入框失焦
  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^\d]/g, "")) || 0;
    updateConfig({ amount: Math.max(100, Math.min(100000, value)) });
    setIsEditingAmount(false);
  };

  // 处理金额输入框键盘事件
  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setIsEditingAmount(false);
    }
  };

  // 将日期格式从 YYYY-MM-DD 转换为 YYYY/MM/DD 格式显示
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.replace(/-/g, "/");
  };

  return (
    <div className="space-y-6">
      {/* 定投频率 */}
      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">定投频率</label>
        <div className="flex gap-1 p-1 bg-slate-950 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => updateConfig({ frequency: "daily" })}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all",
              config.frequency === "daily"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            )}
          >
            每天
          </button>
          <button
            type="button"
            onClick={() => updateConfig({ frequency: "weekly" })}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all",
              config.frequency === "weekly"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            )}
          >
            每周
          </button>
          <button
            type="button"
            onClick={() => updateConfig({ frequency: "monthly" })}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all",
              config.frequency === "monthly"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            )}
          >
            每月
          </button>
        </div>

        {/* 定投日选择 - 每天定投时不显示 */}
        {config.frequency !== "daily" && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">定投日选择</span>
            {config.frequency === "weekly" ? (
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 1, label: "周一" },
                  { value: 2, label: "周二" },
                  { value: 3, label: "周三" },
                  { value: 4, label: "周四" },
                  { value: 5, label: "周五" },
                ].map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => updateConfig({ dayOfWeek: day.value })}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                      config.dayOfWeek === day.value
                        ? "border-blue-500/30 bg-blue-600/20 text-blue-400"
                        : "border-white/5 bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            ) : (
              <CalendarMatrix
                selectedDays={config.dayOfMonth ? [config.dayOfMonth] : [1]}
                onChange={(days) => updateConfig({ dayOfMonth: days[0] })}
                mode="single"
                maxDays={28}
              />
            )}
          </div>
        )}
      </div>

      {/* 定投金额 - 可点击编辑的文字样式 */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">每期定投金额</label>
        <div className="flex items-baseline gap-1">
          <span className="text-slate-400">¥</span>
          {isEditingAmount ? (
            <input
              ref={amountInputRef}
              type="text"
              defaultValue={config.amount}
              onBlur={handleAmountBlur}
              onKeyDown={handleAmountKeyDown}
              className="bg-transparent border-none outline-none text-2xl font-bold text-white min-w-[80px] caret-blue-400"
              style={{ caretColor: "#60a5fa" }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingAmount(true)}
              className="group flex items-center gap-1 text-2xl font-bold text-white hover:text-blue-400 transition-colors"
            >
              {formatAmount(config.amount)}
              <Pencil className="w-4 h-4 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          )}
        </div>
      </div>

      {/* 日期范围 - YYYY/MM/DD 格式 */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">模拟周期</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">开始日期</span>
            <DateSegmentInput
              value={config.startDate}
              onChange={(value) => updateConfig({ startDate: value })}
              min={minDate}
              max={config.endDate}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">结束日期</span>
            <DateSegmentInput
              value={config.endDate}
              onChange={(value) => updateConfig({ endDate: value })}
              min={config.startDate}
              max={maxDate}
            />
          </div>
        </div>
      </div>

      {/* 非交易日规则 - 每日定投时隐藏 */}
      {config.frequency !== "daily" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">非交易日处理</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs glass-panel">
                  <p className="text-sm text-on-surface">
                    当定投日遇到周末或节假日时：
                    <br />
                    <strong className="text-blue-400">顺延</strong>：在下一个交易日执行买入
                    <br />
                    <strong className="text-blue-400">跳过</strong>：跳过本次定投
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-3">
            <label
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border-2",
                config.nonTradeDayRule === "next"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-800/50 border-transparent text-slate-400 hover:border-white/10"
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
                    ? "border-blue-400 bg-blue-400"
                    : "border-slate-500"
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
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border-2",
                config.nonTradeDayRule === "skip"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                  : "bg-slate-800/50 border-transparent text-slate-400 hover:border-white/10"
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
                    ? "border-blue-400 bg-blue-400"
                    : "border-slate-500"
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">模拟计算失败</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 开始模拟按钮 */}
      <button
        className={cn(
          "w-full py-5 bg-blue-600 text-white text-lg font-extrabold rounded-2xl shadow-xl shadow-blue-900/40",
          "hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all",
          "flex items-center justify-center gap-3",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
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
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            开始模拟
          </>
        )}
      </button>
    </div>
  );
}
