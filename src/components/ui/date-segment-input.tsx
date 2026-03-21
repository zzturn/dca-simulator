"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DateSegmentInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  label?: string;
}

// 将 Segment 组件移到外部，避免每次渲染时重新创建
interface SegmentProps {
  type: "year" | "month" | "day";
  val: number;
  width: string;
  isEditing: boolean;
  editValue: string;
  onStartEdit: (type: "year" | "month" | "day", e: React.MouseEvent) => void;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function Segment({
  type,
  val,
  width,
  isEditing,
  editValue,
  onStartEdit,
  onInput,
  onBlur,
  onKeyDown,
}: SegmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = String(val).padStart(type === "year" ? 4 : 2, "0");

  // 自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      data-segment={type}
      onClick={(e) => !isEditing && onStartEdit(type, e)}
      className={cn(
        "flex items-center justify-center rounded transition-colors",
        isEditing ? "bg-slate-800 px-0.5" : "px-0.5 hover:bg-slate-800/50 cursor-text"
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={onInput}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={cn(
            "bg-transparent text-white text-sm font-semibold text-center outline-none",
            width
          )}
          style={{ caretColor: "#60a5fa" }}
          maxLength={type === "year" ? 4 : 2}
        />
      ) : (
        <span className={cn("text-sm font-semibold text-white select-none", width)}>
          {display}
        </span>
      )}
    </div>
  );
}

export function DateSegmentInput({
  value,
  onChange,
  min,
  max,
  label,
}: DateSegmentInputProps) {
  // 解析日期
  const parts = value.split("-");
  const year = parseInt(parts[0]) || 2024;
  const month = parseInt(parts[1]) || 1;
  const day = parseInt(parts[2]) || 1;

  const [editingSegment, setEditingSegment] = useState<"year" | "month" | "day" | null>(null);
  const [editValue, setEditValue] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 获取月份的最大天数
  const getDaysInMonth = useCallback((y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  }, []);

  // 更新日期
  const updateDate = useCallback((newYear: number, newMonth: number, newDay: number) => {
    // 规范化
    newMonth = Math.max(1, Math.min(12, newMonth));
    const maxDays = getDaysInMonth(newYear, newMonth);
    newDay = Math.max(1, Math.min(maxDays, newDay));

    const newDate = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;

    // 检查范围
    if (min && newDate < min) {
      onChange(min);
    } else if (max && newDate > max) {
      onChange(max);
    } else {
      onChange(newDate);
    }
  }, [min, max, onChange, getDaysInMonth]);

  // 开始编辑
  const startEdit = useCallback((segment: "year" | "month" | "day", e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSegment(segment);
    setEditValue(segment === "year" ? String(year) : String(segment === "month" ? month : day));
  }, [year, month, day]);

  // 完成编辑
  const finishEdit = useCallback(() => {
    if (editingSegment) {
      const num = parseInt(editValue) || 0;
      if (editingSegment === "year") {
        updateDate(num || year, month, day);
      } else if (editingSegment === "month") {
        updateDate(year, num || month, day);
      } else {
        updateDate(year, month, num || day);
      }
    }
    setEditingSegment(null);
  }, [editingSegment, editValue, year, month, day, updateDate]);

  // 处理输入 - 只更新本地状态
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setEditValue(val);
  }, []);

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      finishEdit();
    } else if (e.key === "Escape") {
      setEditingSegment(null);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? 1 : -1;
      const num = parseInt(editValue) || 0;
      let newVal: number;

      if (editingSegment === "year") {
        newVal = Math.max(1970, Math.min(2100, num + delta));
      } else if (editingSegment === "month") {
        newVal = Math.max(1, Math.min(12, num + delta));
      } else {
        const maxDays = getDaysInMonth(year, month);
        newVal = Math.max(1, Math.min(maxDays, num + delta));
      }

      setEditValue(String(newVal));
    }
  }, [editingSegment, editValue, year, month, getDaysInMonth, finishEdit]);

  // 点击空白区域显示日历
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-segment]")) {
      dateInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</span>
      )}
      <div
        onClick={handleContainerClick}
        className={cn(
          "relative w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3",
          "hover:border-white/20 transition-all cursor-pointer",
          "flex items-center justify-between"
        )}
      >
        <div className="flex items-center gap-0.5">
          <Segment
            type="year"
            val={year}
            width="w-9"
            isEditing={editingSegment === "year"}
            editValue={editValue}
            onStartEdit={startEdit}
            onInput={handleInput}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
          />
          <span className="text-slate-500 text-sm font-bold">/</span>
          <Segment
            type="month"
            val={month}
            width="w-4"
            isEditing={editingSegment === "month"}
            editValue={editValue}
            onStartEdit={startEdit}
            onInput={handleInput}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
          />
          <span className="text-slate-500 text-sm font-bold">/</span>
          <Segment
            type="day"
            val={day}
            width="w-4"
            isEditing={editingSegment === "day"}
            editValue={editValue}
            onStartEdit={startEdit}
            onInput={handleInput}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          className="relative flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            dateInputRef.current?.click();
          }}
        >
          <svg
            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-300 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <input
            ref={dateInputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
