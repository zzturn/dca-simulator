"use client";

import { useState, useCallback } from "react";
import { FundSearch } from "@/components/fund-search";
import { FundInfoCard } from "@/components/fund-info-card";
import { NavChart } from "@/components/nav-chart";
import { StrategyConfig } from "@/components/strategy-config";
import { ResultDashboard } from "@/components/result-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { Fund, NavPoint, DCAConfig, SimulationResult, TimeRange } from "@/lib/types";
import { simulateDCA } from "@/lib/dca-calculator";
import { formatDate } from "@/lib/date-utils";

export default function Home() {
  // 状态管理
  const [fundCode, setFundCode] = useState("");
  const [fundInfo, setFundInfo] = useState<Fund | null>(null);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // 定投配置
  const [config, setConfig] = useState<DCAConfig>({
    frequency: "monthly",
    dayOfMonth: 1,
    dayOfWeek: 1,
    amount: 1000,
    startDate: "",
    endDate: formatDate(new Date()),
    nonTradeDayRule: "next",
  });

  // 搜索基金
  const handleSearch = useCallback(async (code: string) => {
    setSearchLoading(true);
    setError(null);
    setFundInfo(null);
    setNavHistory([]);
    setResult(null);
    setFundCode(code);

    try {
      // 并发请求基金信息和净值数据
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

      // 设置默认开始日期为基金成立日期
      if (info.establishDate) {
        setConfig((prev) => ({
          ...prev,
          startDate: info.establishDate,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // 开始模拟
  const handleSimulate = useCallback(() => {
    if (navHistory.length === 0) return;

    setSimulateLoading(true);

    // 使用setTimeout让UI有机会更新
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
        setSimulateLoading(false);
      }
    }, 50);
  }, [config, navHistory]);

  // 获取日期范围限制
  const minDate = fundInfo?.establishDate;
  const maxDate = formatDate(new Date());

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">定投收益模拟器</h1>
        <p className="text-gray-500 mt-2">
          模拟基金定投收益，帮助您做出更明智的投资决策
        </p>
      </div>

      {/* 基金搜索 */}
      <div className="mb-8">
        <FundSearch onSearch={handleSearch} isLoading={searchLoading} />
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {searchLoading && (
        <div className="space-y-4 mb-8">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {/* 基金信息 + 净值走势 */}
      {fundInfo && !searchLoading && (
        <div className="space-y-6 mb-8">
          <FundInfoCard fund={fundInfo} />
          <NavChart
            navHistory={navHistory}
            investRecords={result?.records}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
      )}

      {/* 策略配置 + 结果 */}
      {fundInfo && !searchLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StrategyConfig
              config={config}
              onConfigChange={setConfig}
              onSimulate={handleSimulate}
              isLoading={simulateLoading}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>

          <div className="lg:col-span-2">
            {result ? (
              <ResultDashboard result={result} />
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <p>配置定投策略后，点击"开始模拟"查看结果</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      {!fundInfo && !searchLoading && (
        <Card className="mt-8">
          <CardContent className="py-8">
            <h2 className="text-xl font-semibold mb-4">使用说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                    1
                  </span>
                  <span className="font-medium">搜索基金</span>
                </div>
                <p>输入6位基金代码，如010736，获取基金信息和历史净值</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                    2
                  </span>
                  <span className="font-medium">配置策略</span>
                </div>
                <p>设置定投频率、金额、起止日期和非交易日处理规则</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
                    3
                  </span>
                  <span className="font-medium">查看结果</span>
                </div>
                <p>查看模拟收益、收益率、最大回撤等指标和资产曲线</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
