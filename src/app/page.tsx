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
  // 状态管理 - 默认选择 110020
  const [fundCode, setFundCode] = useState("110020");
  const [fundInfo, setFundInfo] = useState<Fund | null>(null);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(true); // 初始为 true，显示加载状态
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

  // 页面加载时自动搜索默认基金
  useEffect(() => {
    handleSearch("110020");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          setError(null); // 模拟成功，清除错误提示
        }
      } catch (err) {
        console.error("模拟计算失败:", err);
        setError(err instanceof Error ? err.message : "模拟计算失败");
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
        {/* 加载骨架屏 */}
        {searchLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* 基金名片骨架屏 */}
            <div className="card-professional p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* 净值走势图骨架屏 */}
            <div className="card-professional p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-12 rounded-lg" />
                  <Skeleton className="h-8 w-12 rounded-lg" />
                  <Skeleton className="h-8 w-12 rounded-lg" />
                  <Skeleton className="h-8 w-12 rounded-lg" />
                  <Skeleton className="h-8 w-12 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-[350px] w-full" />
              <div className="mt-4 flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* 策略配置 + 结果骨架屏 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧配置面板骨架屏 */}
              <div className="card-professional p-6 space-y-6">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 rounded-lg" />
                    <Skeleton className="h-10 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* 右侧结果骨架屏 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 收益大字报骨架屏 */}
                <div className="card-professional p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-4 w-16 mx-auto mb-2" />
                        <Skeleton className="h-8 w-24 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 核心指标骨架屏 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card-professional p-4">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>

                {/* 资产曲线骨架屏 */}
                <div className="card-professional p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              </div>
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
                frequency={config.frequency}
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
                  error={error}
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

      </main>
    </div>
  );
}
