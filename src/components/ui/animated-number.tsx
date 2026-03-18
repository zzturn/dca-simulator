"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatFn?: (value: number) => string;
  /** 是否为整数，动画过程中不会显示小数 */
  integer?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 800,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
  formatFn,
  integer = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    // 如果值相同，不需要动画
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutExpo 缓动函数
      const easeProgress = 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    // 取消之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatValue = (val: number): string => {
    // 如果是整数模式，先四舍五入
    const valueToFormat = integer ? Math.round(val) : val;

    if (formatFn) {
      return formatFn(valueToFormat);
    }
    if (integer) {
      return valueToFormat.toString();
    }
    return valueToFormat.toFixed(decimals);
  };

  return (
    <span className={cn("font-number tabular-nums", className)}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
}
