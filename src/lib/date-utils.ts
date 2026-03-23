import { format, addDays, subDays, parseISO, isValid } from "date-fns";
import type { TimeRange } from "./types";

/**
 * 格式化日期为 YYYY/MM/DD 格式（用于图表显示）
 * @param dateOrTs - Date对象、日期字符串或时间戳
 */
export function formatDateToSlash(dateOrTs: Date | string | number): string {
  if (!dateOrTs) return "";
  const d = typeof dateOrTs === "number"
    ? new Date(dateOrTs)
    : typeof dateOrTs === "string"
      ? parseISO(dateOrTs)
      : dateOrTs;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

// 格式化日期为显示格式
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy年MM月dd日");
}

// 添加天数
export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return addDays(d, days);
}

// 获取时间范围的起始日期
export function getTimeRangeStart(range: TimeRange): string | null {
  const now = new Date();
  switch (range) {
    case "all":
      return null; // 全部
    case "5y":
      return formatDate(subDays(now, 365 * 5));
    case "3y":
      return formatDate(subDays(now, 365 * 3));
    case "1y":
      return formatDate(subDays(now, 365));
    case "6m":
      return formatDate(subDays(now, 180));
    default:
      return null;
  }
}

// 在交易日历中查找下一个交易日（向后查找，包含当天）
export function findNextTradeDay(
  dateStr: string,
  tradeDays: string[]
): string | null {
  // tradeDays 应该是升序排列的
  for (const day of tradeDays) {
    if (day >= dateStr) {
      return day;
    }
  }
  return null;
}

// 在交易日历中查找最近的交易日（向前查找，不包含当天）
export function findNearestTradeDay(
  dateStr: string,
  tradeDays: string[]
): string | null {
  // tradeDays 应该是升序排列的
  let nearest: string | null = null;
  for (const day of tradeDays) {
    if (day <= dateStr) {
      nearest = day;
    } else {
      break;
    }
  }
  return nearest;
}

// 检查日期是否有效
export function isValidDate(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date);
}

// 获取两个日期之间的所有月份的第一天
export function getMonthStartsBetween(
  startDate: string,
  endDate: string
): string[] {
  const starts: string[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    starts.push(formatDate(current));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return starts;
}

// 获取两个日期之间的所有周的开始（周一）
export function getWeekStartsBetween(
  startDate: string,
  endDate: string
): string[] {
  const starts: string[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // 找到第一个周一
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  let current = addDays(start, diff);

  while (current <= end) {
    starts.push(formatDate(current));
    current = addDays(current, 7);
  }

  return starts;
}
