"use client";

import { TrendingUp } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-border-default">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-1">定投收益模拟器</h1>
          <p className="text-xs text-text-3">科学定投，稳健收益</p>
        </div>
      </div>
    </header>
  );
}
