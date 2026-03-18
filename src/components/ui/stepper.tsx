"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  quickAmounts?: number[];
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 100,
  max = 100000,
  step = 100,
  quickAmounts = [500, 1000, 5000],
  className,
}: StepperProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleQuickAmount = (amount: number) => {
    const newValue = Math.min(max, value + amount);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="stepper">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          className="stepper-btn"
          aria-label="减少金额"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            className="w-full text-center text-2xl font-bold font-number text-text-1 bg-transparent border-none outline-none"
          />
          <span className="text-sm text-text-3">元/次</span>
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={value >= max}
          className="stepper-btn"
          aria-label="增加金额"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {quickAmounts.length > 0 && (
        <div className="flex justify-center gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAmount(amount)}
              className="quick-amount-btn"
            >
              +{amount >= 1000 ? `${amount / 1000}k` : amount}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
