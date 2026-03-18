import type { DCAConfig, NavPoint, SimulationResult, InvestmentRecord } from "./types";
import { addDaysToDate, formatDate, findNextTradeDay, findNearestTradeDay } from "./date-utils";

// 生成定投日期列表
function generateInvestDates(
  config: DCAConfig,
  tradeDays: string[]
): string[] {
  const dates: string[] = [];
  const start = config.startDate;
  const end = config.endDate;

  if (config.frequency === "monthly") {
    // 每月定投
    const dayOfMonth = config.dayOfMonth || 1;

    // 从开始日期开始，每月固定日期
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      // 设置为本月第N天
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        dayOfMonth
      );

      const dateStr = formatDate(targetDate);

      // 确保在日期范围内
      if (dateStr >= start && dateStr <= end) {
        // 处理非交易日
        if (config.nonTradeDayRule === "next") {
          // 顺延到下一个交易日
          const nextTradeDay = findNextTradeDay(dateStr, tradeDays);
          if (nextTradeDay && nextTradeDay <= end) {
            dates.push(nextTradeDay);
          }
        } else {
          // 检查是否是交易日
          if (tradeDays.includes(dateStr)) {
            dates.push(dateStr);
          }
          // 非交易日跳过
        }
      }

      // 移到下个月
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    }
  } else {
    // 每周定投
    const dayOfWeek = config.dayOfWeek || 1; // 1=周一

    let currentDate = new Date(start);
    const endDate = new Date(end);

    // 找到第一个目标星期
    const currentDayOfWeek = currentDate.getDay();
    // 转换：JS中0=周日，我们需要1=周一
    const jsDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    const daysToAdd = (dayOfWeek - jsDayOfWeek + 7) % 7;

    currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);

      if (dateStr >= start && dateStr <= end) {
        // 处理非交易日
        if (config.nonTradeDayRule === "next") {
          const nextTradeDay = findNextTradeDay(dateStr, tradeDays);
          if (nextTradeDay && nextTradeDay <= end) {
            // 避免重复添加
            if (!dates.includes(nextTradeDay)) {
              dates.push(nextTradeDay);
            }
          }
        } else {
          if (tradeDays.includes(dateStr)) {
            dates.push(dateStr);
          }
        }
      }

      // 移到下周
      currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // 去重并排序
  return Array.from(new Set(dates)).sort();
}

// 模拟定投（核心算法）
export function simulateDCA(
  config: DCAConfig,
  navHistory: NavPoint[]
): SimulationResult | null {
  if (navHistory.length === 0) {
    return null;
  }

  // 创建交易日历和净值映射
  const tradeDays = navHistory.map((p) => p.date);
  const navMap = new Map<string, NavPoint>();
  for (const point of navHistory) {
    navMap.set(point.date, point);
  }

  // 生成定投日期
  const investDates = generateInvestDates(config, tradeDays);

  if (investDates.length === 0) {
    return null;
  }

  // 找到结束日期对应的净值（用于最终市值计算）
  // 在结束日期或之前找到最近的交易日净值
  const endNavPoint = findNearestTradeDay(config.endDate, tradeDays);
  const finalNav = endNavPoint ? (navMap.get(endNavPoint)?.nav || 0) : 0;

  if (finalNav === 0) {
    return null;
  }

  // 记录每次投资
  const records: InvestmentRecord[] = [];
  let totalShares = 0;
  let totalCost = 0;

  // 跟踪最大回撤（使用结束日期作为参考点）
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownDate = "";

  for (const date of investDates) {
    // 获取当日净值
    let navPoint = navMap.get(date);

    // 如果当日没有净值（停牌），尝试向前查找
    if (!navPoint) {
      const nearestDate = findNearestTradeDay(date, tradeDays);
      if (nearestDate) {
        navPoint = navMap.get(nearestDate);
      }
    }

    if (!navPoint) {
      // 无法获取净值，跳过本次投资
      continue;
    }

    const nav = navPoint.nav;
    const amount = config.amount;
    const shares = amount / nav;

    totalShares += shares;
    totalCost += amount;

    // 计算当前市值（使用结束日期对应的净值）
    const currentValue = totalShares * finalNav;
    const profit = currentValue - totalCost;
    const profitRate = totalCost > 0 ? profit / totalCost : 0;

    records.push({
      date,
      nav,
      amount,
      shares,
      totalShares,
      totalCost,
      currentValue,
      profit,
      profitRate,
    });

    // 更新最大回撤
    if (currentValue > peak) {
      peak = currentValue;
    }
    const drawdown = peak > 0 ? (peak - currentValue) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = date;
    }
  }

  if (records.length === 0) {
    return null;
  }

  const lastRecord = records[records.length - 1];

  return {
    config,
    records,
    totalInvestment: lastRecord.totalCost,
    totalShares: lastRecord.totalShares,
    averageCost: lastRecord.totalShares > 0 ? lastRecord.totalCost / lastRecord.totalShares : 0,
    currentNav: finalNav,
    currentValue: lastRecord.currentValue,
    profit: lastRecord.profit,
    profitRate: lastRecord.profitRate,
    investCount: records.length,
    maxDrawdown,
    maxDrawdownDate,
  };
}

// 获取投资点（用于图表显示）
export function getInvestPoints(
  records: InvestmentRecord[]
): { date: string; nav: number }[] {
  return records.map((r) => ({
    date: r.date,
    nav: r.nav,
  }));
}
