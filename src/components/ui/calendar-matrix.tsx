"use client";

import { cn } from "@/lib/utils";

interface CalendarMatrixProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  maxDays?: number;
  mode?: "single" | "multiple";
  className?: string;
}

export function CalendarMatrix({
  selectedDays,
  onChange,
  maxDays = 28,
  mode = "single",
  className,
}: CalendarMatrixProps) {
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const handleDayClick = (day: number) => {
    if (mode === "single") {
      onChange([day]);
    } else {
      if (selectedDays.includes(day)) {
        onChange(selectedDays.filter((d) => d !== day));
      } else {
        onChange([...selectedDays, day].sort((a, b) => a - b));
      }
    }
  };

  return (
    <div className={cn("grid grid-cols-7 gap-1", className)}>
      {days.map((day) => {
        const isSelected = selectedDays.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => handleDayClick(day)}
            className={cn(
              "w-full aspect-square flex items-center justify-center text-xs font-bold rounded-lg cursor-pointer transition-all duration-150",
              isSelected
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5"
            )}
            aria-pressed={isSelected}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

// 周选择器
interface WeekDaySelectorProps {
  selectedDay: number; // 1-7, 1=周一
  onChange: (day: number) => void;
  className?: string;
}

const WEEKDAYS = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
];

export function WeekDaySelector({
  selectedDay,
  onChange,
  className,
}: WeekDaySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDay === day.value;
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => onChange(day.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
              isSelected
                ? "border-blue-500/30 bg-blue-600/20 text-blue-400"
                : "border-white/5 bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
            aria-pressed={isSelected}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
