import fs from "fs";
import path from "path";
import type { Fund, NavPoint } from "./types";

// 缓存目录
const CACHE_DIR = path.join(process.cwd(), ".cache", "funds");

// 热门基金代码（需要缓存的）
export const HOT_FUNDS = ["110020", "160119", "270042"];

// 缓存数据结构
interface FundInfoCache {
  data: Fund;
  cachedAt: number; // 时间戳
}

interface NavHistoryCache {
  data: NavPoint[];
  cachedAt: number;
  lastNavDate: string; // 最新净值日期
}

// 缓存配置
const FUND_INFO_TTL = 24 * 60 * 60 * 1000; // 24小时
const NAV_CACHE_TTL = 6 * 60 * 60 * 1000; // 6小时（即使日期没变，也定期刷新）

// 确保缓存目录存在
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayStr(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// 获取昨天的日期字符串
function getYesterdayStr(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// 判断是否需要更新净值数据
function shouldUpdateNav(cache: NavHistoryCache | null): boolean {
  if (!cache) return true;

  // 缓存时间过期
  if (Date.now() - cache.cachedAt > NAV_CACHE_TTL) {
    return true;
  }

  // 如果最新净值日期早于昨天，可能需要更新
  // (周末或节假日可能没有新数据，但我们仍然检查)
  const yesterday = getYesterdayStr();
  if (cache.lastNavDate < yesterday) {
    return true;
  }

  return false;
}

// 缓存操作类
export class FundCache {
  // 获取基金信息缓存
  static getFundInfo(code: string): Fund | null {
    if (!HOT_FUNDS.includes(code)) return null;

    try {
      ensureCacheDir();
      const filePath = path.join(CACHE_DIR, `${code}_info.json`);

      if (!fs.existsSync(filePath)) return null;

      const cache: FundInfoCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // 检查是否过期
      if (Date.now() - cache.cachedAt > FUND_INFO_TTL) {
        return null;
      }

      console.log(`[Cache] 命中: ${code} 基金信息`);
      return cache.data;
    } catch {
      return null;
    }
  }

  // 保存基金信息缓存
  static setFundInfo(code: string, data: Fund): void {
    if (!HOT_FUNDS.includes(code)) return;

    try {
      ensureCacheDir();
      const filePath = path.join(CACHE_DIR, `${code}_info.json`);
      const cache: FundInfoCache = {
        data,
        cachedAt: Date.now(),
      };
      fs.writeFileSync(filePath, JSON.stringify(cache));
      console.log(`[Cache] 保存: ${code} 基金信息`);
    } catch (err) {
      console.error(`[Cache] 保存失败: ${code}_info`, err);
    }
  }

  // 获取净值历史缓存
  static getNavHistory(code: string): NavHistoryCache | null {
    if (!HOT_FUNDS.includes(code)) return null;

    try {
      ensureCacheDir();
      const filePath = path.join(CACHE_DIR, `${code}_nav.json`);

      if (!fs.existsSync(filePath)) return null;

      const cache: NavHistoryCache = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      // 检查是否需要更新
      if (shouldUpdateNav(cache)) {
        console.log(`[Cache] 过期: ${code} 净值历史，需要更新`);
        return null;
      }

      console.log(`[Cache] 命中: ${code} 净值历史 (${cache.data.length} 条)`);
      return cache;
    } catch {
      return null;
    }
  }

  // 保存净值历史缓存
  static setNavHistory(code: string, data: NavPoint[]): void {
    if (!HOT_FUNDS.includes(code)) return;

    try {
      ensureCacheDir();
      const filePath = path.join(CACHE_DIR, `${code}_nav.json`);

      // 获取最新净值日期
      const lastNavDate = data.length > 0 ? data[data.length - 1].date : getTodayStr();

      const cache: NavHistoryCache = {
        data,
        cachedAt: Date.now(),
        lastNavDate,
      };
      fs.writeFileSync(filePath, JSON.stringify(cache));
      console.log(`[Cache] 保存: ${code} 净值历史 (${data.length} 条，最新: ${lastNavDate})`);
    } catch (err) {
      console.error(`[Cache] 保存失败: ${code}_nav`, err);
    }
  }

  // 更新净值历史（增量追加新数据）
  static updateNavHistory(code: string, newData: NavPoint[], existingData: NavPoint[]): NavPoint[] {
    if (newData.length === 0) return existingData;

    // 创建日期集合用于去重
    const existingDates = new Set(existingData.map(p => p.date));
    const uniqueNewData = newData.filter(p => !existingDates.has(p.date));

    if (uniqueNewData.length === 0) {
      return existingData;
    }

    // 合并并排序
    const merged = [...existingData, ...uniqueNewData];
    merged.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[Cache] 增量更新: ${code} 新增 ${uniqueNewData.length} 条`);

    // 保存更新后的缓存
    this.setNavHistory(code, merged);

    return merged;
  }

  // 清除指定基金的缓存
  static clearCache(code: string): void {
    try {
      const infoPath = path.join(CACHE_DIR, `${code}_info.json`);
      const navPath = path.join(CACHE_DIR, `${code}_nav.json`);

      if (fs.existsSync(infoPath)) fs.unlinkSync(infoPath);
      if (fs.existsSync(navPath)) fs.unlinkSync(navPath);

      console.log(`[Cache] 清除: ${code}`);
    } catch (err) {
      console.error(`[Cache] 清除失败: ${code}`, err);
    }
  }

  // 预热缓存（启动时加载热门基金数据）
  static async warmup(fetchNavHistory: (code: string) => Promise<NavPoint[]>): Promise<void> {
    console.log("[Cache] 开始预热热门基金缓存...");

    for (const code of HOT_FUNDS) {
      const cache = this.getNavHistory(code);
      if (!cache) {
        console.log(`[Cache] 预热: ${code} 缓存不存在，将在首次访问时获取`);
      }
    }
  }
}
