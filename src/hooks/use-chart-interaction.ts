import { useState, useCallback, useRef, useEffect } from "react";

// Y 轴宽度常量，与 YAxis width 属性保持一致
const Y_AXIS_WIDTH = 50;

interface UseChartInteractionResult {
  isDragging: boolean;
  dragStartTs: number | null;
  dragEndTs: number | null;
  customRange: { start: number; end: number } | null;
  chartRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  resetZoom: () => void;
  getTimestampFromEvent: (e: React.MouseEvent<HTMLDivElement>) => number | null;
}

interface ChartInteractionOptions {
  chartData: Array<{ ts: number }>;
  timeRangeStartTs: number | null;
  timeRangeEndTs: number | null;
  customRange: { start: number; end: number } | null;
  onRangeSelected?: (range: { start: number; end: number }) => void;
}

export function useChartInteraction({
  chartData,
  timeRangeStartTs,
  timeRangeEndTs,
  customRange: externalCustomRange,
}: ChartInteractionOptions): UseChartInteractionResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTs, setDragStartTs] = useState<number | null>(null);
  const [dragEndTs, setDragEndTs] = useState<number | null>(null);
  const [customRange, setCustomRange] = useState<{ start: number; end: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // P1 优化：缓存图表尺寸，避免每次 mousemove 都执行 getBoundingClientRect
  const chartMetricsRef = useRef<{ rect: DOMRect; chartWidth: number } | null>(null);

  // P1 优化：RAF 节流相关 refs
  const rafRef = useRef<number | null>(null);
  const pendingEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(null);

  // 获取图表坐标对应的时间戳（使用缓存的尺寸）
  const getTimestampFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, useCache: boolean = false) => {
      // 优先使用缓存的尺寸，否则重新获取
      let chartWidth: number;
      let rectLeft: number;

      if (useCache && chartMetricsRef.current) {
        chartWidth = chartMetricsRef.current.chartWidth;
        rectLeft = chartMetricsRef.current.rect.left;
      } else if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        chartWidth = rect.width - Y_AXIS_WIDTH;
        rectLeft = rect.left;
      } else {
        return null;
      }

      if (!chartData.length) return null;

      const mouseX = e.clientX - rectLeft - Y_AXIS_WIDTH;

      if (mouseX < 0 || mouseX > chartWidth) return null;

      const minTs = customRange?.start ?? timeRangeStartTs ?? chartData[0].ts;
      const maxTs = customRange?.end ?? timeRangeEndTs ?? chartData[chartData.length - 1].ts;

      const ratio = mouseX / chartWidth;
      return minTs + ratio * (maxTs - minTs);
    },
    [chartData, customRange, timeRangeStartTs, timeRangeEndTs]
  );

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      // P1 优化：缓存图表尺寸
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        chartMetricsRef.current = {
          rect,
          chartWidth: rect.width - Y_AXIS_WIDTH,
        };
      }

      const ts = getTimestampFromEvent(e, true);
      if (ts !== null) {
        setIsDragging(true);
        setDragStartTs(ts);
        setDragEndTs(ts);
      }
    },
    [getTimestampFromEvent]
  );

  // P1 优化：使用 RAF 节流的鼠标移动处理
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      // 存储待处理的事件
      pendingEventRef.current = e;

      // 如果已有 RAF 在等待，跳过
      if (rafRef.current !== null) return;

      // 使用 RAF 节流，确保每帧最多更新一次
      rafRef.current = requestAnimationFrame(() => {
        if (pendingEventRef.current) {
          const ts = getTimestampFromEvent(pendingEventRef.current, true);
          if (ts !== null) {
            setDragEndTs(ts);
          }
        }
        rafRef.current = null;
      });
    },
    [isDragging, getTimestampFromEvent]
  );

  // 鼠标松开完成拖拽 - 直接放大
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStartTs !== null && dragEndTs !== null) {
      const minTs = Math.min(dragStartTs, dragEndTs);
      const maxTs = Math.max(dragStartTs, dragEndTs);

      // 只有当选择范围大于 7 天时才应用
      if (maxTs - minTs > 7 * 24 * 60 * 60 * 1000) {
        setCustomRange({ start: minTs, end: maxTs });
      }
    }

    // 清理缓存和 RAF
    chartMetricsRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingEventRef.current = null;

    setIsDragging(false);
    setDragStartTs(null);
    setDragEndTs(null);
  }, [isDragging, dragStartTs, dragEndTs]);

  // 鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      // 清理缓存和 RAF
      chartMetricsRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingEventRef.current = null;

      setIsDragging(false);
      setDragStartTs(null);
      setDragEndTs(null);
    }
  }, [isDragging]);

  // 重置缩放
  const resetZoom = useCallback(() => {
    setCustomRange(null);
  }, []);

  // P0 修复：添加全局 mouseup 监听，防止拖拽时鼠标移出窗口后卡住
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  // 清理：组件卸载时取消 RAF
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    dragStartTs,
    dragEndTs,
    customRange: externalCustomRange ?? customRange,
    chartRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetZoom,
    getTimestampFromEvent: (e) => getTimestampFromEvent(e, false),
  };
}
