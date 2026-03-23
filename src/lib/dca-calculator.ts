import type { DCAConfig, NavPoint, SimulationResult, InvestmentRecord } from "./types";
import { formatDate, findNextTradeDay, findNearestTradeDay } from "./date-utils";

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
  } else if (config.frequency === "weekly") {
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
  } else {
    // 每个交易日定投（每日定投）
    // 直接使用所有在日期范围内的交易日
    for (const tradeDay of tradeDays) {
      if (tradeDay >= start && tradeDay <= end) {
        dates.push(tradeDay);
      }
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
  const endNavPoint = findNearestTradeDay(config.endDate, tradeDays);
  const finalNav = endNavPoint ? (navMap.get(endNavPoint)?.nav || 0) : 0;

  if (finalNav === 0) {
    return null;
  }

  // 创建投资日期集合，用于快速查找
  const investDateSet = new Set(investDates);

  // 计算每个交易日的持仓情况
  // 累计份额和成本按投资日期累加
  let totalShares = 0;
  let totalCost = 0;

  // 记录每次投资（简化版，只记录投资信息）
  const investRecords: Array<{
    date: string;
    nav: number;
    amount: number;
    shares: number;
  }> = [];

  // 用于计算每日资产的映射
  const dailyHoldings = new Map<string, { shares: number; cost: number }>();

  // 遍历所有交易日，计算每日持仓
  for (const date of tradeDays) {
    if (date < config.startDate || date > config.endDate) {
      continue;
    }

    // 如果是投资日，增加持仓
    if (investDateSet.has(date)) {
      const navPoint = navMap.get(date);
      if (navPoint) {
        const nav = navPoint.nav;
        const amount = config.amount;
        const shares = amount / nav;

        totalShares += shares;
        totalCost += amount;

        investRecords.push({
          date,
          nav,
          amount,
          shares,
        });
      }
    }

    // 记录当日收盘时的持仓
    dailyHoldings.set(date, {
      shares: totalShares,
      cost: totalCost,
    });
  }

  // 生成每日资产记录（用于图表显示）
  const records: InvestmentRecord[] = [];
  let peakNav = 0;
  let maxDrawdown = 0;
  let maxDrawdownDate = "";

  for (const date of tradeDays) {
    if (date < config.startDate || date > config.endDate) {
      continue;
    }

    const holding = dailyHoldings.get(date);
    if (!holding || holding.shares === 0) {
      continue;
    }

    const navPoint = navMap.get(date);
    if (!navPoint) {
      continue;
    }

    const currentValue = holding.shares * navPoint.nav;
    const profit = currentValue - holding.cost;
    const profitRate = holding.cost > 0 ? profit / holding.cost : 0;

    // 只在有持仓时记录
    records.push({
      date,
      nav: navPoint.nav,
      amount: 0, // 非投资日为0
      shares: 0, // 非投资日为0
      totalShares: holding.shares,
      totalCost: holding.cost,
      currentValue,
      profit,
      profitRate,
    });

    // 更新最大回撤（基于净值计算）
    const currentNav = navPoint.nav;
    if (currentNav > peakNav) {
      peakNav = currentNav;
    }
    const drawdown = peakNav > 0 ? (peakNav - currentNav) / peakNav : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = date;
    }
  }

  if (records.length === 0) {
    return null;
  }

  const lastRecord = records[records.length - 1];

  // 计算盈利天数占比
  const profitableDays = records.filter(r => r.currentValue >= r.totalCost).length;
  const profitDaysRatio = records.length > 0 ? profitableDays / records.length : 0;

  // 为投资记录添加投资信息
  const investmentDates = new Map<string, { amount: number; shares: number }>();
  for (const inv of investRecords) {
    investmentDates.set(inv.date, { amount: inv.amount, shares: inv.shares });
  }

  // 更新records中的投资信息
  const enrichedRecords = records.map((r) => {
    const inv = investmentDates.get(r.date);
    return {
      ...r,
      amount: inv?.amount || 0,
      shares: inv?.shares || 0,
    };
  });

  return {
    config,
    records: enrichedRecords,
    totalInvestment: lastRecord.totalCost,
    totalShares: lastRecord.totalShares,
    averageCost: lastRecord.totalShares > 0 ? lastRecord.totalCost / lastRecord.totalShares : 0,
    currentNav: finalNav,
    currentValue: lastRecord.currentValue,
    profit: lastRecord.profit,
    profitRate: lastRecord.profitRate,
    investCount: investRecords.length,
    maxDrawdown,
    maxDrawdownDate,
    profitDaysRatio,
  };
}

// 获取投资点（用于图表显示）
export function getInvestPoints(
  records: InvestmentRecord[]
): { date: string; nav: number }[] {
  return records
    .filter((r) => r.amount > 0)
    .map((r) => ({
      date: r.date,
      nav: r.nav,
    }));
}
