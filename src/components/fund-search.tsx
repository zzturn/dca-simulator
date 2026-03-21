"use client";

import { useState } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FundSearchProps {
  onSearch: (code: string) => void;
  isLoading?: boolean;
}

export function FundSearch({ onSearch, isLoading }: FundSearchProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6 && /^\d{6}$/.test(code.trim())) {
      setError(false);
      onSearch(code.trim());
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setCode(numericValue.slice(0, 6));
    if (error) setError(false);
  };

  const popularFunds = [
    { code: "110020", name: "易方达沪深300" },
    { code: "160119", name: "南方中证500" },
    { code: "270042", name: "广发纳斯达克100" },
  ];

  return (
    <div className="hero-section py-16 px-4 relative overflow-hidden">
      {/* 装饰性发光 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto relative z-10">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-on-surface mb-2">
            定投收益模拟器
          </h2>
          <p className="text-on-surface-variant">
            输入基金代码，即刻模拟定投收益
          </p>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-muted">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <input
              type="text"
              placeholder="请输入6位基金代码"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              maxLength={6}
              className={cn(
                "hero-search pl-14 pr-6",
                error && "error"
              )}
              disabled={isLoading}
            />
          </div>
        </form>

        {/* 热门基金标签 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-on-surface-muted flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            热门:
          </span>
          {popularFunds.map((fund) => (
            <button
              key={fund.code}
              type="button"
              onClick={() => {
                setCode(fund.code);
                onSearch(fund.code);
              }}
              disabled={isLoading}
              className="hot-tag"
            >
              {fund.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
