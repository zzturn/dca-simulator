import { useState, useCallback } from "react";
import type { Fund, NavPoint } from "@/lib/types";

interface UseFundSearchResult {
  fundInfo: Fund | null;
  navHistory: NavPoint[];
  isLoading: boolean;
  error: string | null;
  search: (code: string) => Promise<void>;
  setFundInfo: (fund: Fund | null) => void;
  fundCode: string;
  setFundCode: (code: string) => void;
}

export function useFundSearch(): UseFundSearchResult {
  const [fundInfo, setFundInfo] = useState<Fund | null>(null);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundCode, setFundCode] = useState<string>("");

  const search = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    setFundInfo(null);
    setNavHistory([]);
    setFundCode(code);

    try {
      const [infoRes, navRes] = await Promise.all([
        fetch(`/api/fund/${code}`),
        fetch(`/api/fund/${code}/nav`),
      ]);

      if (!infoRes.ok) {
        const errData = await infoRes.json();
        throw new Error(errData.error || "获取基金信息失败");
      }

      if (!navRes.ok) {
        const errData = await navRes.json();
        throw new Error(errData.error || "获取净值数据失败");
      }

      const info: Fund = await infoRes.json();
      const nav: NavPoint[] = await navRes.json();

      setFundInfo(info);
      setNavHistory(nav);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fundInfo,
    navHistory,
    isLoading,
    error,
    search,
    setFundInfo,
    fundCode,
    setFundCode,
  };
}
