"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/header";
import { FundSearch } from "@/components/fund-search";
import { FundInfoCard } from "@/components/fund-info-card";
import { NavChart } from "@/components/nav-chart";
import { StrategyConfig } from "@/components/strategy-config";
import { ReturnDisplay } from "@/components/return-display";
import { MetricsCards } from "@/components/metrics-cards";
import { AssetChart } from "@/components/asset-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

  // 定投配置 - 设置一个默认盈利的起始日期
  const [config, setConfig] = useState<DCAConfig>({
    frequency: "monthly",
    dayOfMonth: 1,
    dayOfWeek: 1,
    amount: 1000,
    startDate: "2020-01-01",
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

      // 设置默认开始日期
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

  // 即时模拟 - 配置变化时自动触发
  useEffect(() => {
    if (navHistory.length === 0 || !config.startDate) {
      return;
    }

    // 使用防抖
    const timer = setTimeout(() => {
      try {
        const simResult = simulateDCA(config, navHistory);
        if (simResult) {
          setResult(simResult);
        }
      } catch (err) {
        console.error("模拟计算失败:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [config, navHistory]);

  // 手动触发模拟
  const handleSimulate = useCallback(() => {
    if (navHistory.length === 0) return;

    setSimulateLoading(true);

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
    <div className="min-h-screen bg-app-bg">
      {/* 顶部导航 */}
      <Header />

      {/* Hero 搜索区 */}
      <div className="bg-gradient-to-b from-white to-app-bg">
        <FundSearch onSearch={handleSearch} isLoading={searchLoading} />
      </div>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 pb-8 max-w-7xl">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-profit/10 border border-profit/20 animate-fade-in">
            <p className="text-profit font-medium">{error}</p>
          </div>
        )}

        {/* 加载骨架屏 */}
        {searchLoading && (
          <div className="space-y-6">
            <Skeleton className="h-[180px] w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[500px] rounded-2xl" />
              <Skeleton className="h-[500px] lg:col-span-2 rounded-2xl" />
            </div>
          </div>
        )}

        {/* 基金信息展示 */}
        {fundInfo && !searchLoading && (
          <div className="animate-slide-up">
            {/* 基金名片 */}
            <div className="mb-6">
              <FundInfoCard fund={fundInfo} />
            </div>

            {/* 净值走势图 */}
            <div className="mb-6">
              <NavChart
                navHistory={navHistory}
                investRecords={result?.records}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            </div>

            {/* 策略配置 + 结果 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧配置面板 */}
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

              {/* 右侧结果展示 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 收益大字报 */}
                <ReturnDisplay result={result} />

                {/* 核心指标 */}
                {result && <MetricsCards result={result} />}

                {/* 资产曲线 */}
                {result && <AssetChart records={result.records} />}
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 - 无基金时显示 */}
        {!fundInfo && !searchLoading && (
          <div className="card-professional p-8 mt-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-text-1 mb-6">
              使用说明
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-text-1 mb-2">搜索基金</h3>
                  <p className="text-sm text-text-3">
                    输入6位基金代码，如 010736，获取基金信息和历史净值数据
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-text-1 mb-2">配置策略</h3>
                  <p className="text-sm text-text-3">
                    设置定投频率、金额、起止日期和非交易日处理规则
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-text-1 mb-2">查看结果</h3>
                  <p className="text-sm text-text-3">
                    实时查看模拟收益、收益率、最大回撤等指标和资产曲线
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
