"use client";

import { TrendingUp } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">定投收益模拟器</h1>
              <p className="text-xs text-slate-500">科学定投，稳健收益</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
