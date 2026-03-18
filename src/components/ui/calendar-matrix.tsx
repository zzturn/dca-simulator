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
    <div className={cn("calendar-matrix", className)}>
      {days.map((day) => {
        const isSelected = selectedDays.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => handleDayClick(day)}
            className={cn(
              "calendar-day",
              isSelected && "selected"
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
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
];

export function WeekDaySelector({
  selectedDay,
  onChange,
  className,
}: WeekDaySelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDay === day.value;
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => onChange(day.value)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150",
              isSelected
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-2 hover:bg-gray-200"
            )}
            aria-pressed={isSelected}
          >
            周{day.label}
          </button>
        );
      })}
    </div>
  );
}
