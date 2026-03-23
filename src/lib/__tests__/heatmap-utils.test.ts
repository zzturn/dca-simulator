import { describe, it, expect } from "vitest";
import {
  calculateMonthlyReturns,
  getReturnColor,
  formatReturnRate,
  getYearsFromMonthlyReturns,
  getYearData,
  MONTH_NAMES,
  type MonthlyReturn,
} from "../heatmap-utils";
import type { InvestmentRecord } from "../types";

// 测试数据工厂
function createMockRecord(
  date: string,
  currentValue: number
): InvestmentRecord {
  return {
    date,
    nav: 1.0,
    amount: 1000,
    shares: 1000,
    totalShares: 1000,
    totalCost: 1000,
    currentValue,
    profit: currentValue - 1000,
    profitRate: (currentValue - 1000) / 1000,
  };
}

describe("heatmap-utils", () => {
  describe("MONTH_NAMES", () => {
    it("should have 12 month names", () => {
      expect(MONTH_NAMES).toHaveLength(12);
      expect(MONTH_NAMES[0]).toBe("1月");
      expect(MONTH_NAMES[11]).toBe("12月");
    });
  });

  describe("calculateMonthlyReturns", () => {
    it("should return empty array for empty records", () => {
      expect(calculateMonthlyReturns([])).toEqual([]);
    });

    it("should calculate monthly returns correctly", () => {
      const records: InvestmentRecord[] = [
        // 2024年1月: 从 1000 涨到 1100 (10% 收益)
        createMockRecord("2024-01-01", 1000),
        createMockRecord("2024-01-15", 1050),
        createMockRecord("2024-01-31", 1100),
        // 2024年2月: 从 1100 跌到 1000 (-9.09% 亏损)
        createMockRecord("2024-02-01", 1100),
        createMockRecord("2024-02-15", 1050),
        createMockRecord("2024-02-28", 1000),
      ];

      const result = calculateMonthlyReturns(records);

      expect(result).toHaveLength(2);

      // 排序逻辑：年份降序，月份升序
      // 2024年1月 (月份升序，排在前面)
      expect(result[0].year).toBe(2024);
      expect(result[0].month).toBe(1);
      expect(result[0].returnRate).toBeCloseTo(0.1, 3);
      expect(result[0].hasData).toBe(true);

      // 2024年2月 (月份升序，排在后面)
      expect(result[1].year).toBe(2024);
      expect(result[1].month).toBe(2);
      expect(result[1].returnRate).toBeCloseTo(-0.0909, 3);
      expect(result[1].hasData).toBe(true);
    });

    it("should handle single record per month (no return rate)", () => {
      const records: InvestmentRecord[] = [
        createMockRecord("2024-01-15", 1000),
      ];

      const result = calculateMonthlyReturns(records);

      expect(result).toHaveLength(1);
      expect(result[0].hasData).toBe(false);
      expect(result[0].returnRate).toBe(0);
    });

    it("should handle records across multiple years", () => {
      const records: InvestmentRecord[] = [
        createMockRecord("2023-12-01", 1000),
        createMockRecord("2023-12-31", 1200),
        createMockRecord("2024-01-01", 1200),
        createMockRecord("2024-01-31", 1300),
      ];

      const result = calculateMonthlyReturns(records);

      expect(result).toHaveLength(2);
      expect(result[0].year).toBe(2024);
      expect(result[1].year).toBe(2023);
    });

    it("should sort by year descending, month ascending", () => {
      const records: InvestmentRecord[] = [
        createMockRecord("2023-06-01", 1000),
        createMockRecord("2023-06-30", 1100),
        createMockRecord("2023-03-01", 1000),
        createMockRecord("2023-03-31", 900),
        createMockRecord("2024-01-01", 1000),
        createMockRecord("2024-01-31", 1050),
      ];

      const result = calculateMonthlyReturns(records);

      expect(result[0].year).toBe(2024);
      expect(result[0].month).toBe(1);
      expect(result[1].year).toBe(2023);
      expect(result[1].month).toBe(3);
      expect(result[2].year).toBe(2023);
      expect(result[2].month).toBe(6);
    });
  });

  describe("getReturnColor", () => {
    it("should return profit-3 color for 10% profit (high profit)", () => {
      const color = getReturnColor(0.1); // 10% profit (5%+ 区间)
      expect(color.bgClass).toBe("bg-profit-3");
    });

    it("should return loss-3 color for 10% loss (high loss)", () => {
      const color = getReturnColor(-0.1); // 10% loss (5%+ 区间)
      expect(color.bgClass).toBe("bg-loss-3");
    });

    it("should return neutral color for zero returns", () => {
      const color = getReturnColor(0);
      expect(color.bgClass).toBe("bg-slate-600/50");
    });

    it("should return profit-1 for small profit (0-2%)", () => {
      expect(getReturnColor(0.01).bgClass).toBe("bg-profit-1");
      expect(getReturnColor(0.019).bgClass).toBe("bg-profit-1");
    });

    it("should return profit-2 for 2-5% profit", () => {
      expect(getReturnColor(0.02).bgClass).toBe("bg-profit-2");
      expect(getReturnColor(0.049).bgClass).toBe("bg-profit-2");
    });

    it("should return profit-3 for 5%+ profit", () => {
      expect(getReturnColor(0.06).bgClass).toBe("bg-profit-3");
      expect(getReturnColor(0.50).bgClass).toBe("bg-profit-3");
    });

    it("should return loss-1 for small loss (0-2%)", () => {
      expect(getReturnColor(-0.01).bgClass).toBe("bg-loss-1");
      expect(getReturnColor(-0.019).bgClass).toBe("bg-loss-1");
    });

    it("should return loss-2 for 2-5% loss", () => {
      expect(getReturnColor(-0.02).bgClass).toBe("bg-loss-2");
      expect(getReturnColor(-0.049).bgClass).toBe("bg-loss-2");
    });

    it("should return loss-3 for 5%+ loss", () => {
      expect(getReturnColor(-0.06).bgClass).toBe("bg-loss-3");
      expect(getReturnColor(-0.50).bgClass).toBe("bg-loss-3");
    });
  });

  describe("formatReturnRate", () => {
    it("should format positive returns with + sign", () => {
      expect(formatReturnRate(0.1)).toBe("+10.0");
      expect(formatReturnRate(0.055)).toBe("+5.5");
    });

    it("should format negative returns with - sign", () => {
      expect(formatReturnRate(-0.1)).toBe("-10.0");
      expect(formatReturnRate(-0.055)).toBe("-5.5");
    });

    it("should format zero returns", () => {
      expect(formatReturnRate(0)).toBe("+0.0");
    });
  });

  describe("getYearsFromMonthlyReturns", () => {
    it("should return empty array for empty data", () => {
      expect(getYearsFromMonthlyReturns([])).toEqual([]);
    });

    it("should return unique years in descending order", () => {
      const data: MonthlyReturn[] = [
        { year: 2022, month: 1, returnRate: 0, startValue: 0, endValue: 0, hasData: false },
        { year: 2024, month: 1, returnRate: 0, startValue: 0, endValue: 0, hasData: false },
        { year: 2023, month: 1, returnRate: 0, startValue: 0, endValue: 0, hasData: false },
        { year: 2024, month: 2, returnRate: 0, startValue: 0, endValue: 0, hasData: false },
      ];

      const years = getYearsFromMonthlyReturns(data);

      expect(years).toEqual([2024, 2023, 2022]);
    });
  });

  describe("getYearData", () => {
    it("should return 12 elements (one for each month)", () => {
      const data: MonthlyReturn[] = [
        { year: 2024, month: 1, returnRate: 0.1, startValue: 1000, endValue: 1100, hasData: true },
        { year: 2024, month: 6, returnRate: -0.05, startValue: 1100, endValue: 1045, hasData: true },
      ];

      const yearData = getYearData(data, 2024);

      expect(yearData).toHaveLength(12);
    });

    it("should fill missing months with null", () => {
      const data: MonthlyReturn[] = [
        { year: 2024, month: 1, returnRate: 0.1, startValue: 1000, endValue: 1100, hasData: true },
        { year: 2024, month: 12, returnRate: -0.05, startValue: 1100, endValue: 1045, hasData: true },
      ];

      const yearData = getYearData(data, 2024);

      expect(yearData[0]).not.toBeNull(); // 1月
      expect(yearData[1]).toBeNull(); // 2月
      expect(yearData[5]).toBeNull(); // 6月
      expect(yearData[11]).not.toBeNull(); // 12月
    });

    it("should return all nulls for year with no data", () => {
      const data: MonthlyReturn[] = [
        { year: 2023, month: 1, returnRate: 0.1, startValue: 1000, endValue: 1100, hasData: true },
      ];

      const yearData = getYearData(data, 2024);

      expect(yearData).toHaveLength(12);
      expect(yearData.every((d) => d === null)).toBe(true);
    });
  });
});
