"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSearch: (code: string) => void;
  isLoading?: boolean;
}

export function Header({ onSearch, isLoading }: HeaderProps) {
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

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-2xl font-bold tracking-tighter text-blue-400">FundAtelier</span>
        </div>

        {/* Centralized Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                "group relative bg-slate-900/60 backdrop-blur-md rounded-2xl p-0.5 border shadow-lg transition-all duration-300",
                error
                  ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "border-slate-700/50 focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              )}
            >
              <div className="flex items-center">
                <span
                  className={cn(
                    "ml-4 transition-colors",
                    error
                      ? "text-red-400"
                      : "text-slate-500 group-focus-within:text-blue-400"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </span>
                <input
                  type="text"
                  placeholder="搜索基金名称或代码 (如 110020)..."
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  maxLength={6}
                  disabled={isLoading}
                  className="w-full bg-transparent border-none py-2.5 pl-3 pr-12 text-sm text-white placeholder-slate-500 font-medium focus:ring-0 rounded-xl"
                />
                <div className="absolute right-3 hidden sm:flex items-center gap-1">
                  <kbd className="flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-800/50 border border-white/5 rounded tracking-widest">
                    ⌘ K
                  </kbd>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Placeholder to balance the logo flex */}
        <div className="w-32 hidden md:block"></div>
      </div>
    </nav>
  );
}
