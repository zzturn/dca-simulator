"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
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
    // 只允许数字输入
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
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 搜索框 */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-3">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Search className="w-6 h-6" />
              )}
            </div>
            <input
              type="text"
              placeholder="请输入6位基金代码，如 010736"
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
          <span className="text-sm text-text-3">热门:</span>
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
