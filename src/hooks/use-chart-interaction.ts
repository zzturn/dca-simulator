import { useState, useCallback, useRef } from "react";

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

  // 获取图表坐标对应的时间戳
  const getTimestampFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartRef.current || !chartData.length) return null;

      const rect = chartRef.current.getBoundingClientRect();
      const chartWidth = rect.width - 50; // 减去 Y 轴宽度
      const mouseX = e.clientX - rect.left - 50; // 减去 Y 轴偏移

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
      const ts = getTimestampFromEvent(e);
      if (ts !== null) {
        setIsDragging(true);
        setDragStartTs(ts);
        setDragEndTs(ts);
      }
    },
    [getTimestampFromEvent]
  );

  // 鼠标移动更新拖拽范围
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const ts = getTimestampFromEvent(e);
      if (ts !== null) {
        setDragEndTs(ts);
      }
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
    setIsDragging(false);
    setDragStartTs(null);
    setDragEndTs(null);
  }, [isDragging, dragStartTs, dragEndTs]);

  // 鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartTs(null);
      setDragEndTs(null);
    }
  }, [isDragging]);

  // 重置缩放
  const resetZoom = useCallback(() => {
    setCustomRange(null);
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
    getTimestampFromEvent,
  };
}
