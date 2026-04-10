import type { Fund, NavPoint } from "./types";
import { FundCache } from "./fund-cache";

// 请求去重：存储进行中的请求
const pendingFundInfoRequests = new Map<string, Promise<Fund>>();
const pendingNavHistoryRequests = new Map<string, Promise<NavPoint[]>>();
const pendingDiagramRequests = new Map<string, Promise<DiagramNavRecord[]>>();

// API 基础地址
const FUND_API_BASE = "https://tiantian-fund-api-phi.vercel.app/api/action";

// 带重试的 fetch
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
      await new Promise((r) => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

// fundVPageDiagram 返回的净值记录格式
interface DiagramNavRecord {
  FSRQ: string;   // 日期 (YYYY-MM-DD)
  DWJZ: string;   // 单位净值
  LJJZ: string;   // 累计净值
  JZZZL: string;  // 日涨跌幅
  NAVTYPE: string;
  RATE: string;
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
      return await request;
    } finally {
      pendingFundInfoRequests.delete(code);
    }
  }

  // 获取基金信息（并行调用详情 + 净值）
  private async fetchFundInfo(code: string): Promise<Fund> {
    const [detailInfo, navRecords] = await Promise.allSettled([
      this.fetchFundDetail(code),
      this.fetchDiagramNav(code),
    ]);

    const detail = detailInfo.status === "fulfilled" ? detailInfo.value : null;
    const navData = navRecords.status === "fulfilled" ? navRecords.value : null;

    if (!detail && !navData) {
      throw new Error("获取基金信息失败");
    }

    // 取最新净值记录
    const latestNav = navData && navData.length > 0 ? navData[navData.length - 1] : null;

    const fundInfo: Fund = {
      code,
      name: detail?.name || "",
      type: detail?.type || "混合型",
      manager: detail?.manager || "",
      company: detail?.company || "",
      establishDate: detail?.establishDate || "",
      navDate: latestNav?.FSRQ || "",
      nav: latestNav ? parseFloat(latestNav.DWJZ) || 0 : 0,
      accumulatedNav: latestNav ? parseFloat(latestNav.LJJZ) || 0 : 0,
      dayGrowth: latestNav?.JZZZL || "",
    };

    // 保存到缓存
    FundCache.setFundInfo(code, fundInfo);

    return fundInfo;
  }

  // 获取基金详情（fundMNDetailInformation）
  private async fetchFundDetail(code: string): Promise<Partial<Fund>> {
    try {
      const url = `${FUND_API_BASE}?action_name=fundMNDetailInformation&FCODE=${code}`;
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

  // 获取全量净值（fundVPageDiagram，带请求去重）
  // getFundInfo 和 getNavHistory 共享此方法，确保同一基金只发一次 HTTP 请求
  private async fetchDiagramNav(code: string): Promise<DiagramNavRecord[]> {
    const pending = pendingDiagramRequests.get(code);
    if (pending) {
      console.log(`[FundAPI] 复用进行中的净值请求: ${code}`);
      return pending;
    }

    const request = (async () => {
      const url = `${FUND_API_BASE}?action_name=fundVPageDiagram&FCODE=${code}&RANGE=ln`;
      const response = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`获取净值数据失败: ${response.status}`);
      }

      const data = await response.json();
      const records: DiagramNavRecord[] = data.data || [];

      console.log(`[FundAPI] fundVPageDiagram 返回 ${records.length} 条记录`);

      return records;
    })();

    pendingDiagramRequests.set(code, request);

    try {
      return await request;
    } finally {
      pendingDiagramRequests.delete(code);
    }
  }

  // 获取历史净值（支持缓存和请求去重）
  async getNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    // 检查缓存
    const cache = FundCache.getNavHistory(code);

    if (cache) {
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
      console.log(`[FundAPI] 复用进行中的净值历史请求: ${cacheKey}`);
      return pending;
    }

    // 创建新请求
    const request = this.buildNavHistory(code, startDate, endDate);
    pendingNavHistoryRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      pendingNavHistoryRequests.delete(cacheKey);
    }
  }

  // 转换并缓存净值数据
  private async buildNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    const records = await this.fetchDiagramNav(code);

    // 转换为NavPoint格式
    let navPoints: NavPoint[] = records.map((item) => ({
      date: item.FSRQ,
      nav: parseFloat(item.DWJZ) || 0,
      accumulatedNav: parseFloat(item.LJJZ) || 0,
      dayGrowth: item.JZZZL || "",
    }));

    // 按日期升序排序
    navPoints.sort((a, b) => a.date.localeCompare(b.date));

    // 保存到缓存（全量数据，不按日期过滤）
    FundCache.setNavHistory(code, navPoints);

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
}

// 导出单例
export const fundApi = new FundApiClient();

// 导出类以供测试
export { FundApiClient };
