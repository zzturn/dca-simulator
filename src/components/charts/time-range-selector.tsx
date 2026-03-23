"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/lib/types";

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "6m", label: "6个月" },
  { value: "1y", label: "1年" },
  { value: "3y", label: "3年" },
  { value: "5y", label: "5年" },
  { value: "all", label: "全部" },
];

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-white/5">
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onTimeRangeChange(option.value)}
          className={cn(
            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
            timeRange === option.value
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
