import { useState, useEffect, useCallback } from "react";
import type { DCAConfig, NavPoint, SimulationResult } from "@/lib/types";
import { simulateDCA } from "@/lib/dca-calculator";

interface UseDCASimulationResult {
  result: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  simulate: () => void;
}

export function useDCASimulation(
  config: DCAConfig,
  navHistory: NavPoint[]
): UseDCASimulationResult {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 即时模拟 - 当配置或净值历史变化时自动计算
  useEffect(() => {
    if (navHistory.length === 0 || !config.startDate) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const simResult = simulateDCA(config, navHistory);
        if (simResult) {
          setResult(simResult);
          setError(null);
        }
      } catch (err) {
        console.error("模拟计算失败:", err);
        setError(err instanceof Error ? err.message : "模拟计算失败");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [config, navHistory]);

  // 手动触发模拟
  const simulate = useCallback(() => {
    if (navHistory.length === 0) return;

    setIsLoading(true);

    setTimeout(() => {
      try {
        const simResult = simulateDCA(config, navHistory);
        if (simResult) {
          setResult(simResult);
        } else {
          setError("模拟计算失败，请检查配置");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "模拟计算失败");
      } finally {
        setIsLoading(false);
      }
    }, 50);
  }, [config, navHistory]);

  return {
    result,
    isLoading,
    error,
    simulate,
  };
}
