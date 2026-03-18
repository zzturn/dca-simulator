// 基金信息
export interface Fund {
  code: string;
  name: string;
  type: string;
  manager: string;
  company: string;
  establishDate: string;
  navDate?: string; // 净值日期
  nav?: number; // 最新单位净值
  accumulatedNav?: number; // 最新累计净值
  dayGrowth?: string; // 日涨跌幅
}

// 净值数据点
export interface NavPoint {
  date: string;
  nav: number; // 单位净值
  accumulatedNav: number; // 累计净值
  dayGrowth: string; // 日涨跌幅
}

// 定投配置
export interface DCAConfig {
  frequency: "monthly" | "weekly" | "daily"; // 定投频率
  dayOfMonth?: number; // 每月几号 (1-28)
  dayOfWeek?: number; // 每周周几 (1-7, 1=周一)
  amount: number; // 每次定投金额
  startDate: string; // 开始日期
  endDate: string; // 结束日期
  nonTradeDayRule: "next" | "skip"; // 非交易日规则：顺延或跳过
}

// 投资记录
export interface InvestmentRecord {
  date: string; // 投资日期
  nav: number; // 当日净值
  amount: number; // 投资金额
  shares: number; // 买入份额
  totalShares: number; // 累计份额
  totalCost: number; // 累计成本
  currentValue: number; // 当前市值
  profit: number; // 累计收益
  profitRate: number; // 收益率
}

// 模拟结果
export interface SimulationResult {
  config: DCAConfig;
  records: InvestmentRecord[]; // 投资记录
  totalInvestment: number; // 累计投入
  totalShares: number; // 累计份额
  averageCost: number; // 平均成本
  currentNav: number; // 当前净值
  currentValue: number; // 当前市值
  profit: number; // 累计收益
  profitRate: number; // 收益率
  investCount: number; // 定投次数
  maxDrawdown: number; // 最大回撤
  maxDrawdownDate: string; // 最大回撤日期
}

// 时间范围
export type TimeRange = "all" | "5y" | "3y" | "1y" | "6m";

// API响应类型
export interface FundInfoApiResponse {
  fundcode: string;
  name: string;
  type: string;
  manager: string;
  fundmanager: string;
  fundcompany: string;
  establishmentdate: string;
  dwjz: string;
  ljjz: string;
  jzrq: string;
  dayGrowth: string;
}

export interface NavHistoryApiResponse {
  fundcode: string;
  name: string;
  jzrq: string;
  dwjz: string;
  ljjz: string;
  jzzzl: string;
}

export interface PagedNavResponse {
  fundcode: string;
  name: string;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  data: NavHistoryApiResponse[];
}
