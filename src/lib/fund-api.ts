import type { Fund, NavPoint } from "./types";
import { FundCache, HOT_FUNDS } from "./fund-cache";

// 天天基金公开API
const FUND_INFO_URL = "http://fundgz.1234567.com.cn/js";
const FUND_NAV_URL = "http://api.fund.eastmoney.com/f10/lsjz";

// API客户端（服务端使用）
class FundApiClient {
  // 获取基金信息
  async getFundInfo(code: string): Promise<Fund> {
    // 检查缓存
    const cached = FundCache.getFundInfo(code);
    if (cached) {
      return cached;
    }

    // 使用天天基金的jsonp接口
    const url = `${FUND_INFO_URL}/${code}.js?rt=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`获取基金信息失败: ${response.status}`);
    }

    const text = await response.text();

    // 解析JSONP响应：jsonpgz({"fundcode":"010736",...});
    const jsonMatch = text.match(/jsonpgz\((.+)\)/);
    if (!jsonMatch) {
      throw new Error("解析基金信息失败");
    }

    const data = JSON.parse(jsonMatch[1]);

    const fundInfo: Fund = {
      code: data.fundcode,
      name: data.name,
      type: data.fundtype || "混合型",
      manager: data.fundmanager,
      company: data.fundcompany,
      establishDate: data.establishdate || "",
      nav: parseFloat(data.dwjz) || 0,
      accumulatedNav: parseFloat(data.ljjz) || 0,
      dayGrowth: data.jzrq ? data.gszzl : undefined,
    };

    // 保存到缓存
    FundCache.setFundInfo(code, fundInfo);

    return fundInfo;
  }

  // 获取历史净值（支持缓存和增量更新）
  async getNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    // 检查缓存
    const cache = FundCache.getNavHistory(code);

    if (cache) {
      // 缓存命中，直接返回（根据日期过滤）
      let result = cache.data;
      if (startDate) {
        result = result.filter(p => p.date >= startDate);
      }
      if (endDate) {
        result = result.filter(p => p.date <= endDate);
      }
      return result;
    }

    // 缓存未命中或已过期
    // 对于热门基金，尝试增量更新
    if (HOT_FUNDS.includes(code)) {
      return this.getNavHistoryWithCache(code, startDate, endDate);
    }

    // 非热门基金，直接获取全量数据
    return this.fetchAllNavHistory(code, startDate, endDate);
  }

  // 带缓存的净值获取（热门基金）
  private async getNavHistoryWithCache(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    // 尝试读取旧缓存（即使过期）用于增量更新
    const oldCache = this.readNavCache(code);

    if (oldCache) {
      // 有旧缓存，只获取新数据
      const newData = await this.fetchNavHistoryFrom(
        code,
        oldCache.lastNavDate
      );

      // 合并数据
      const merged = FundCache.updateNavHistory(code, newData, oldCache.data);

      // 根据日期过滤返回
      let result = merged;
      if (startDate) {
        result = result.filter(p => p.date >= startDate);
      }
      if (endDate) {
        result = result.filter(p => p.date <= endDate);
      }
      return result;
    }

    // 没有任何缓存，获取全量数据
    const allData = await this.fetchAllNavHistory(code, undefined, undefined);

    // 保存到缓存
    FundCache.setNavHistory(code, allData);

    // 根据日期过滤返回
    let result = allData;
    if (startDate) {
      result = result.filter(p => p.date >= startDate);
    }
    if (endDate) {
      result = result.filter(p => p.date <= endDate);
    }
    return result;
  }

  // 读取净值缓存（不过期检查）
  private readNavCache(code: string): { data: NavPoint[]; lastNavDate: string } | null {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), ".cache", "funds", `${code}_nav.json`);

      if (!fs.existsSync(filePath)) return null;

      const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return {
        data: cache.data,
        lastNavDate: cache.lastNavDate,
      };
    } catch {
      return null;
    }
  }

  // 获取指定日期之后的新净值数据
  private async fetchNavHistoryFrom(code: string, afterDate: string): Promise<NavPoint[]> {
    // 只获取第一页（最新的数据）
    const firstPage = await this.fetchNavPage(code, 1, 100);

    if (firstPage.data.length === 0) {
      return [];
    }

    // 转换并过滤
    const navPoints: NavPoint[] = firstPage.data
      .map((item) => ({
        date: item.FSRQ.split(" ")[0],
        nav: parseFloat(item.DWJZ) || 0,
        accumulatedNav: parseFloat(item.LJJZ) || 0,
        dayGrowth: item.JZZZL || "",
      }))
      .filter((p) => p.date > afterDate);

    console.log(`[FundAPI] 增量获取: ${code} 新增 ${navPoints.length} 条 (>${afterDate})`);

    return navPoints;
  }

  // 获取全量净值历史
  private async fetchAllNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    // 首先获取第一页以确定总条数和实际每页条数
    const firstPage = await this.fetchNavPage(code, 1, 100);
    const totalCount = firstPage.totalCount;
    const actualPageSize = firstPage.data.length || 20;

    if (totalCount === 0) {
      return [];
    }

    // 计算需要的页数
    const totalPages = Math.ceil(totalCount / actualPageSize);

    console.log(`[FundAPI] 总记录数: ${totalCount}, 实际每页: ${actualPageSize}, 总页数: ${totalPages}`);

    // 分批并发获取所有页面
    const batchSize = 10;
    let allData: NavRecord[] = [];

    for (let batch = 0; batch < Math.ceil(totalPages / batchSize); batch++) {
      const startPage = batch * batchSize + 1;
      const endPage = Math.min((batch + 1) * batchSize, totalPages);

      const pagePromises: Promise<{ totalCount: number; data: NavRecord[] }>[] = [];
      for (let i = startPage; i <= endPage; i++) {
        pagePromises.push(this.fetchNavPage(code, i, 100));
      }

      const pages = await Promise.all(pagePromises);
      for (const page of pages) {
        allData = allData.concat(page.data);
      }

      console.log(`[FundAPI] 已获取第 ${startPage}-${endPage} 页，累计 ${allData.length} 条`);
    }

    // 转换为NavPoint格式
    let navPoints: NavPoint[] = allData.map((item) => ({
      date: item.FSRQ.split(" ")[0],
      nav: parseFloat(item.DWJZ) || 0,
      accumulatedNav: parseFloat(item.LJJZ) || 0,
      dayGrowth: item.JZZZL || "",
    }));

    // 按日期升序排序
    navPoints.sort((a, b) => a.date.localeCompare(b.date));

    // 根据日期范围过滤
    if (startDate) {
      navPoints = navPoints.filter((p) => p.date >= startDate);
    }
    if (endDate) {
      navPoints = navPoints.filter((p) => p.date <= endDate);
    }

    console.log(`[FundAPI] 最终返回 ${navPoints.length} 条记录，时间范围: ${navPoints[0]?.date || 'N/A'} ~ ${navPoints[navPoints.length - 1]?.date || 'N/A'}`);

    return navPoints;
  }

  // 获取单页净值数据
  private async fetchNavPage(
    code: string,
    pageIndex: number,
    pageSize: number
  ): Promise<{ totalCount: number; data: NavRecord[] }> {
    const url = `${FUND_NAV_URL}?fundCode=${code}&pageIndex=${pageIndex}&pageSize=${pageSize}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "http://fund.eastmoney.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`获取净值数据失败: ${response.status}`);
    }

    const data = await response.json();
    return {
      totalCount: data.TotalCount || 0,
      data: data.Data?.LSJZList || [],
    };
  }
}

// 净值记录类型（东方财富API返回格式）
interface NavRecord {
  FSRQ: string; // 日期时间
  DWJZ: string; // 单位净值
  LJJZ: string; // 累计净值
  JZZZL: string; // 日涨跌幅
}

// 导出单例
export const fundApi = new FundApiClient();

// 导出类以供测试
export { FundApiClient };
