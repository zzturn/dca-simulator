import type { Fund, NavPoint } from "./types";

// 天天基金公开API
const FUND_INFO_URL = "http://fundgz.1234567.com.cn/js";
const FUND_NAV_URL = "http://api.fund.eastmoney.com/f10/lsjz";

// API客户端（服务端使用）
class FundApiClient {
  // 获取基金信息
  async getFundInfo(code: string): Promise<Fund> {
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

    return {
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
  }

  // 获取历史净值（自动分页）
  async getNavHistory(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<NavPoint[]> {
    // 首先获取第一页以确定总条数和实际每页条数
    const firstPage = await this.fetchNavPage(code, 1, 100);
    const totalCount = firstPage.totalCount;
    const actualPageSize = firstPage.data.length || 20; // API可能忽略pageSize，使用实际返回的条数

    if (totalCount === 0) {
      return [];
    }

    // 计算需要的页数（使用实际每页条数）
    const totalPages = Math.ceil(totalCount / actualPageSize);

    console.log(`[FundAPI] 总记录数: ${totalCount}, 实际每页: ${actualPageSize}, 总页数: ${totalPages}`);

    // 分批并发获取所有页面（每批10页，避免请求过多）
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
      date: item.FSRQ.split(" ")[0], // 日期
      nav: parseFloat(item.DWJZ) || 0, // 单位净值
      accumulatedNav: parseFloat(item.LJJZ) || 0, // 累计净值
      dayGrowth: item.JZZZL || "", // 日涨跌幅
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
    // 东方财富API返回格式：TotalCount在根级别
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
