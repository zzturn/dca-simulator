"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/header";
import { NavChart } from "@/components/nav-chart";
import { StrategyConfig } from "@/components/strategy-config";
import { ReturnDisplay } from "@/components/return-display";
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
  const [searchLoading, setSearchLoading] = useState(true);
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

  // 即时模拟
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

  // 从图表选中区间应用到定投配置
  const handleApplyRange = useCallback((range: { startDate: string; endDate: string }) => {
    setConfig((prev) => ({
      ...prev,
      startDate: range.startDate,
      endDate: range.endDate,
    }));
    // 重置时间范围显示
    setTimeRange("all");
  }, []);

  const minDate = fundInfo?.establishDate;
  const maxDate = formatDate(new Date());

  return (
    <div className="min-h-screen bg-surface">
      {/* 顶部导航 */}
      <Header onSearch={handleSearch} isLoading={searchLoading} />

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-10 space-y-10 relative z-10">
        {/* 加载骨架屏 */}
        {searchLoading && (
          <div className="space-y-10">
            {/* 基金头部骨架屏 */}
            <header>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-20 h-6 rounded-lg" />
                    <Skeleton className="w-28 h-6 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-64 rounded-lg" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-16 rounded-lg" />
                  <Skeleton className="h-14 w-36 rounded-lg" />
                </div>
              </div>
            </header>

            {/* 配置面板 + 结果骨架屏 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 左侧配置面板骨架屏 */}
              <aside className="lg:col-span-4 bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 space-y-8 sticky top-28">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
              </aside>

              {/* 右侧结果骨架屏 */}
              <div className="lg:col-span-8 space-y-8">
                {/* 收益大字报骨架屏 */}
                <div className="glass-panel rounded-[2rem] p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24 rounded-lg" />
                      <Skeleton className="h-20 w-40 rounded-xl" />
                    </div>
                    <div className="flex flex-col justify-center items-end space-y-2">
                      <Skeleton className="h-5 w-20 rounded-lg" />
                      <Skeleton className="h-10 w-36 rounded-lg" />
                      <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* 统计卡片骨架屏 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5">
                      <Skeleton className="h-4 w-16 rounded-lg" />
                      <Skeleton className="h-7 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>

                {/* 净值走势图骨架屏 */}
                <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-12 rounded-lg" />
                      ))}
                    </div>
                  </div>
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>

                {/* 资产曲线骨架屏 */}
                <div className="bg-slate-900/60 rounded-[2rem] p-8 space-y-8 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-24 rounded-lg" />
                      <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 基金信息展示 */}
        {fundInfo && !searchLoading && (
          <div className="animate-slide-up space-y-10">
            {/* 基金头部 */}
            <header>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg tracking-widest uppercase border border-white/5">
                      {fundInfo.code}
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                      {fundInfo.type}
                    </span>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white">{fundInfo.name}</h1>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">单位净值</div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl font-black text-blue-400 tracking-tighter">
                      {fundInfo.nav?.toFixed(4) || "-"}
                    </div>
                    <div
                      className={cn(
                        "font-bold text-xl",
                        fundInfo.dayGrowth && parseFloat(fundInfo.dayGrowth) >= 0
                          ? "text-[#f87171]"
                          : "text-[#4ade80]"
                      )}
                    >
                      {fundInfo.dayGrowth
                        ? `${parseFloat(fundInfo.dayGrowth) >= 0 ? "+" : ""}${fundInfo.dayGrowth}%`
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* 主 Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 左侧: 配置面板 */}
              <aside className="lg:col-span-4 bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 space-y-8 sticky top-28 backdrop-blur-sm">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">模拟参数</h2>
                  <p className="text-sm text-slate-400">配置您的定期定额投资策略</p>
                </div>
                <StrategyConfig
                  config={config}
                  onConfigChange={setConfig}
                  onSimulate={handleSimulate}
                  isLoading={simulateLoading}
                  minDate={minDate}
                  maxDate={maxDate}
                  error={error}
                />
              </aside>

              {/* 右侧: 结果展示 */}
              <div className="lg:col-span-8 space-y-8">
                {/* 收益大字报 */}
                <ReturnDisplay result={result} />

                {/* Bento Grid 关键指标 */}
                {result && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">累计投入</div>
                      <div className="text-xl font-bold text-white">
                        ¥{(result.totalInvestment / 10000).toFixed(2)}万
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">期末市值</div>
                      <div className="text-xl font-bold text-white">
                        ¥{(result.currentValue / 10000).toFixed(2)}万
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">持仓均价</div>
                      <div className="text-xl font-bold text-white">¥{result.averageCost.toFixed(4)}</div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">定投总期数</div>
                      <div className="text-xl font-bold text-white">{result.investCount} 期</div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">盈利天数占比</div>
                      <div className={cn(
                        "text-xl font-bold",
                        result.profitDaysRatio >= 0.5 ? "text-[#f87171]" : "text-[#4ade80]"
                      )}>
                        {(result.profitDaysRatio * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-6 rounded-[1.5rem] space-y-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">最大回撤</div>
                      <div className="text-xl font-bold text-[#4ade80]">
                        -{(result.maxDrawdown * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* 净值走势图 */}
                <NavChart
                  navHistory={navHistory}
                  investRecords={result?.records}
                  frequency={config.frequency}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  onApplyRange={handleApplyRange}
                  averageCost={result?.averageCost}
                />

                {/* 资产曲线 */}
                {result && <AssetChart records={result.records} />}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-slate-950 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xl font-bold text-white">DCA Simulator</span>
          <p className="mt-4 text-xs text-amber-500/80">
            ⚠️ 投资有风险，入市需谨慎。本工具仅供参考，不构成任何投资建议。
          </p>
        </div>
      </footer>
    </div>
  );
}
