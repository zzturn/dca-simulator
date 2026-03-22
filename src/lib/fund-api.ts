import type { Fund, NavPoint } from "./types";
import { FundCache } from "./fund-cache";

// 请求去重：存储进行中的请求
const pendingFundInfoRequests = new Map<string, Promise<Fund>>();
const pendingNavHistoryRequests = new Map<string, Promise<NavPoint[]>>();

// API 地址
const FUND_INFO_URL = "http://fundgz.1234567.com.cn/js";
const FUND_NAV_URL = "http://api.fund.eastmoney.com/f10/lsjz";
const FUND_NAV_MOBILE_URL = "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNHisNetList";
const FUND_DETAIL_API = "https://tiantian-fund-api-phi.vercel.app/api/action";

// 移动端 API 请求参数
const MOBILE_API_PARAMS = {
  product: "EFund",
  deviceid: "874C427C-7C24-4980-A835-66FD40B67605",
  MobileKey: "874C427C-7C24-4980-A835-66FD40B67605",
  plat: "Iphone",
  PhoneType: "IOS15.1.0",
  OSVersion: "15.5",
  version: "6.5.5",
  ServerVersion: "6.5.5",
  Version: "6.5.5",
  appVersion: "6.5.5",
};

// 带重试的 fetch
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (retries > 0 && (err instanceof Error && (err.name === "AbortError" || err.message.includes("closed")))) {
      console.log(`[FundAPI] 重试 ${retries}: ${url}`);
      await new Promise((r) => setTimeout(r, 1000)); // 等待1秒
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

// API客户端（服务端使用）
class FundApiClient {
  // 获取基金信息（带请求去重）
  async getFundInfo(code: string): Promise<Fund> {
    // 检查缓存
    const cached = FundCache.getFundInfo(code);
    if (cached) {
      return cached;
    }

    // 检查是否有进行中的相同请求
    const pending = pendingFundInfoRequests.get(code);
    if (pending) {
      console.log(`[FundAPI] 复用进行中的请求: ${code}`);
      return pending;
    }

    // 创建新请求
    const request = this.fetchFundInfo(code);
    pendingFundInfoRequests.set(code, request);

    try {
      const result = await request;
      return result;
    } finally {
      // 请求完成后清理
      pendingFundInfoRequests.delete(code);
    }
  }

  // 实际获取基金信息的逻辑
  private async fetchFundInfo(code: string): Promise<Fund> {
    // 并行获取基本信息、详情和最新净值（用于累计净值）
    const [basicInfo, detailInfo, latestNav] = await Promise.allSettled([
      this.fetchBasicInfo(code),
      this.fetchFundDetail(code),
      this.fetchLatestNav(code),
    ]);

    // 合并信息
    const basic = basicInfo.status === "fulfilled" ? basicInfo.value : null;
    const detail = detailInfo.status === "fulfilled" ? detailInfo.value : null;
    const navData = latestNav.status === "fulfilled" ? latestNav.value : null;

    if (!basic && !detail) {
      throw new Error("获取基金信息失败");
    }

    const fundInfo: Fund = {
      code: basic?.code || code,
      name: detail?.name || basic?.name || "",
      type: detail?.type || basic?.type || "混合型",
      manager: detail?.manager || basic?.manager || "",
      company: detail?.company || basic?.company || "",
      establishDate: detail?.establishDate || basic?.establishDate || "",
      navDate: navData?.date || "",
      nav: basic?.nav || navData?.nav || 0,
      accumulatedNav: navData?.accumulatedNav || basic?.accumulatedNav || 0,
      dayGrowth: navData?.dayGrowth || basic?.dayGrowth, // 优先使用净值历史中的日涨跌幅
    };

    // 保存到缓存
    FundCache.setFundInfo(code, fundInfo);

    return fundInfo;
  }

  // 获取最新净值记录（用于获取累计净值、净值日期和日涨跌幅）
  private async fetchLatestNav(code: string): Promise<{ nav: number; accumulatedNav: number; date: string; dayGrowth: string } | null> {
    try {
      const url = `${FUND_NAV_URL}?fundCode=${code}&pageIndex=1&pageSize=1`;
      const response = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "http://fund.eastmoney.com/",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const list = data.Data?.LSJZList;

      if (!list || list.length === 0) {
        return null;
      }

      const latest = list[0];
      return {
        nav: parseFloat(latest.DWJZ) || 0,
        accumulatedNav: parseFloat(latest.LJJZ) || 0,
        date: latest.FSRQ?.split(" ")[0] || "",
        dayGrowth: latest.JZZZL || "", // 日涨跌幅
      };
    } catch (err) {
      console.error(`[FundAPI] 获取最新净值失败: ${code}`, err);
      return null;
    }
  }

  // 获取基本信息（来自 fundgz API）
  private async fetchBasicInfo(code: string): Promise<Partial<Fund>> {
    const url = `${FUND_INFO_URL}/${code}.js?rt=${Date.now()}`;
    const response = await fetchWithRetry(url, {
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

    return {
      code: data.fundcode,
      name: data.name,
      nav: parseFloat(data.dwjz) || 0,
      dayGrowth: data.gszzl,
    };
  }

  // 获取基金详情（使用 tiantian-fund-api）
  private async fetchFundDetail(code: string): Promise<Partial<Fund>> {
    try {
      const url = `${FUND_DETAIL_API}?action_name=fundMNDetailInformation&FCODE=${code}`;
      const response = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        console.error(`[FundAPI] 获取详情失败: ${code}, status: ${response.status}`);
        return {};
      }

      const json = await response.json();

      if (!json.Datas) {
        console.error(`[FundAPI] 详情无数据: ${code}`);
        return {};
      }

      const data = json.Datas;

      // 简化基金类型显示
      let fundType = data.FTYPE || "混合型";
      if (fundType.includes("指数型")) fundType = "指数型";
      else if (fundType.includes("股票型")) fundType = "股票型";
      else if (fundType.includes("债券型")) fundType = "债券型";
      else if (fundType.includes("混合型")) fundType = "混合型";
      else if (fundType.includes("货币型")) fundType = "货币型";
      else if (fundType.includes("QDII")) fundType = "QDII";

      const result: Partial<Fund> = {
        name: data.SHORTNAME,
        type: fundType,
        manager: data.JJJL,
        company: data.JJGS,
        establishDate: data.ESTABDATE,
      };

      console.log(`[FundAPI] 详情获取成功: ${code}`, result);

      return result;
    } catch (err) {
      console.error(`[FundAPI] 获取详情失败: ${code}`, err);
      return {};
    }
  }

  // 获取历史净值（支持缓存、增量更新和请求去重）
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

    // 检查是否有进行中的相同请求
    const cacheKey = `${code}:${startDate || ''}:${endDate || ''}`;
    const pending = pendingNavHistoryRequests.get(cacheKey);
    if (pending) {
      console.log(`[FundAPI] 复用进行中的净值请求: ${cacheKey}`);
      return pending;
    }

    // 创建新请求
    const request = this.fetchNavHistoryWithCache(code, startDate, endDate);
    pendingNavHistoryRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      // 请求完成后清理
      pendingNavHistoryRequests.delete(cacheKey);
    }
  }

  // 带缓存的净值获取（所有基金）
  private async fetchNavHistoryWithCache(
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

  // 获取全量净值历史（使用移动端 API，一次请求获取所有数据）
  private async fetchAllNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    console.log(`[FundAPI] 使用移动端API获取净值历史: ${code}`);

    const bodyParams = new URLSearchParams({
      FCODE: code,
      pageIndex: "1",
      pagesize: "5000", // 一次获取所有数据
      ...MOBILE_API_PARAMS,
    });

    const response = await fetchWithRetry(FUND_NAV_MOBILE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "validmark": "aKVEnBbJF9Nip2Wjf4de/fSvA8W3X3iB4L6vT0Y5cxvZbEfEm17udZKUD2qy37dLRY3bzzHLDv+up/Yn3OTo5Q==",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      throw new Error(`获取净值数据失败: ${response.status}`);
    }

    const data = await response.json();
    const records: NavRecordMobile[] = data.Datas || [];

    console.log(`[FundAPI] 移动端API返回 ${records.length} 条记录 (TotalCount: ${data.TotalCount})`);

    // 转换为NavPoint格式
    let navPoints: NavPoint[] = records.map((item) => ({
      date: item.FSRQ,
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

    const response = await fetchWithRetry(url, {
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

// 移动端API净值记录类型
interface NavRecordMobile {
  FSRQ: string; // 日期 (YYYY-MM-DD)
  DWJZ: string; // 单位净值
  LJJZ: string; // 累计净值
  JZZZL: string; // 日涨跌幅
  NAVTYPE: string;
  RATE: string;
  MUI: string;
  SYI: string;
}

// 导出单例
export const fundApi = new FundApiClient();

// 导出类以供测试
export { FundApiClient };
