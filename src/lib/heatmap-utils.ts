import type { InvestmentRecord } from "./types";

/**
 * 月度收益数据结构
 */
export interface MonthlyReturn {
  year: number;
  month: number; // 1-12
  returnRate: number; // 月度收益率 (-1 到 正无穷)
  startValue: number; // 月初市值
  endValue: number; // 月末市值
  hasData: boolean; // 是否有有效数据
}

/**
 * 热力图单元格颜色配置
 */
export interface HeatmapColor {
  bgClass: string; // Tailwind 背景类
}

// 月份名称常量
export const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

/**
 * 计算月度收益率
 * 基于每日资产记录，计算每个月的收益率
 */
export function calculateMonthlyReturns(
  records: InvestmentRecord[]
): MonthlyReturn[] {
  if (records.length === 0) return [];

  // 按年月分组
  const monthlyData = new Map<string, { records: InvestmentRecord[] }>();

  for (const record of records) {
    const date = new Date(record.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData.has(key)) {
      monthlyData.set(key, { records: [] });
    }
    monthlyData.get(key)!.records.push(record);
  }

  // 计算每月收益率
  const results: MonthlyReturn[] = [];

  // 使用 Array.from 避免 downlevelIteration 问题
  Array.from(monthlyData.entries()).forEach(([key, data]) => {
    const [year, month] = key.split("-").map(Number);
    const sortedRecords = data.records.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (sortedRecords.length < 2) {
      // 数据不足，无法计算收益率
      results.push({
        year,
        month,
        returnRate: 0,
        startValue: sortedRecords[0]?.currentValue ?? 0,
        endValue: sortedRecords[0]?.currentValue ?? 0,
        hasData: false,
      });
      return; // forEach 中使用 return 代替 continue
    }

    const startValue = sortedRecords[0].currentValue;
    const endValue = sortedRecords[sortedRecords.length - 1].currentValue;

    // 计算收益率：(月末市值 - 月初市值) / 月初市值
    const returnRate = startValue > 0
      ? (endValue - startValue) / startValue
      : 0;

    results.push({
      year,
      month,
      returnRate,
      startValue,
      endValue,
      hasData: true,
    });
  });

  // 按年份降序、月份升序排序
  return results.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.month - b.month;
  });
}

/**
 * 根据收益率获取热力图颜色
 * 使用 3 级颜色阶梯，高级感配色
 * 盈利：透亮珊瑚红 → 标准金融红 → 稳重深红
 * 亏损：晶莹薄荷绿 → 标准金融绿 → 深邃森林绿
 */
export function getReturnColor(returnRate: number): HeatmapColor {
  const absRate = Math.abs(returnRate);

  if (returnRate > 0) {
    // 盈利 - 3 级红色阶梯
    let level: number;
    if (absRate < 0.02) level = 1;       // 0~2%
    else if (absRate < 0.05) level = 2;  // 2~5%
    else level = 3;                       // 5%+

    return { bgClass: `bg-profit-${level}` };
  } else if (returnRate < 0) {
    // 亏损 - 3 级绿色阶梯
    let level: number;
    if (absRate < 0.02) level = 1;       // 0~2%
    else if (absRate < 0.05) level = 2;  // 2~5%
    else level = 3;                       // 5%+

    return { bgClass: `bg-loss-${level}` };
  } else {
    // 持平 - 使用中性色
    return { bgClass: "bg-slate-600/50" };
  }
}

/**
 * 格式化收益率显示
 */
export function formatReturnRate(returnRate: number): string {
  const sign = returnRate >= 0 ? "+" : "";
  const percentage = (returnRate * 100).toFixed(1);
  return `${sign}${percentage}`;
}

/**
 * 获取所有年份列表（按降序排列）
 */
export function getYearsFromMonthlyReturns(
  monthlyReturns: MonthlyReturn[]
): number[] {
  const years = new Set(monthlyReturns.map((r) => r.year));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * 获取指定年份的月度数据（填充空缺月份）
 */
export function getYearData(
  monthlyReturns: MonthlyReturn[],
  year: number
): (MonthlyReturn | null)[] {
  const yearData = monthlyReturns.filter((r) => r.year === year);
  const monthMap = new Map(yearData.map((r) => [r.month, r]));

  // 返回 1-12 月的数据，空缺为 null
  return Array.from({ length: 12 }, (_, i) => monthMap.get(i + 1) || null);
}
