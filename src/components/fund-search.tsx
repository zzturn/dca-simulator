"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FundSearchProps {
  onSearch: (code: string) => void;
  isLoading?: boolean;
}

export function FundSearch({ onSearch, isLoading }: FundSearchProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSearch(code.trim());
    }
  };

  const popularFunds = [
    { code: "010736", name: "招商中证白酒指数" },
    { code: "000961", name: "天弘沪深300ETF联接" },
    { code: "161725", name: "招商中证白酒指数LOF" },
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="请输入6位基金代码，如：010736"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="flex-1"
          pattern="\d{6}"
        />
        <Button type="submit" disabled={isLoading || code.length !== 6}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">搜索</span>
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">热门基金：</span>
        {popularFunds.map((fund) => (
          <Button
            key={fund.code}
            variant="outline"
            size="sm"
            onClick={() => {
              setCode(fund.code);
              onSearch(fund.code);
            }}
            disabled={isLoading}
          >
            {fund.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
