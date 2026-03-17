"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DCAConfig } from "@/lib/types";
import { Play } from "lucide-react";

interface StrategyConfigProps {
  config: DCAConfig;
  onConfigChange: (config: DCAConfig) => void;
  onSimulate: () => void;
  isLoading?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function StrategyConfig({
  config,
  onConfigChange,
  onSimulate,
  isLoading,
  minDate,
  maxDate,
}: StrategyConfigProps) {
  const updateConfig = (updates: Partial<DCAConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">定投策略配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 定投频率 */}
        <div className="space-y-2">
          <Label>定投频率</Label>
          <RadioGroup
            value={config.frequency}
            onValueChange={(value: "monthly" | "weekly") =>
              updateConfig({ frequency: value })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly">每月</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">每周</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 定投日期 */}
        {config.frequency === "monthly" ? (
          <div className="space-y-2">
            <Label>每月定投日</Label>
            <Select
              value={config.dayOfMonth?.toString()}
              onValueChange={(value) =>
                updateConfig({ dayOfMonth: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择日期" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    每月{day}号
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>每周定投日</Label>
            <Select
              value={config.dayOfWeek?.toString()}
              onValueChange={(value) =>
                updateConfig({ dayOfWeek: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择星期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">周一</SelectItem>
                <SelectItem value="2">周二</SelectItem>
                <SelectItem value="3">周三</SelectItem>
                <SelectItem value="4">周四</SelectItem>
                <SelectItem value="5">周五</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 定投金额 */}
        <div className="space-y-2">
          <Label htmlFor="amount">每次定投金额（元）</Label>
          <Input
            id="amount"
            type="number"
            value={config.amount}
            onChange={(e) => updateConfig({ amount: parseInt(e.target.value) || 0 })}
            min={1}
            step={100}
          />
        </div>

        {/* 日期范围 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">开始日期</Label>
            <Input
              id="startDate"
              type="date"
              value={config.startDate}
              onChange={(e) => updateConfig({ startDate: e.target.value })}
              min={minDate}
              max={config.endDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">结束日期</Label>
            <Input
              id="endDate"
              type="date"
              value={config.endDate}
              onChange={(e) => updateConfig({ endDate: e.target.value })}
              min={config.startDate}
              max={maxDate}
            />
          </div>
        </div>

        {/* 非交易日规则 */}
        <div className="space-y-2">
          <Label>非交易日处理</Label>
          <RadioGroup
            value={config.nonTradeDayRule}
            onValueChange={(value: "next" | "skip") =>
              updateConfig({ nonTradeDayRule: value })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="next" id="next" />
              <Label htmlFor="next">顺延到下一交易日</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip">跳过</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 开始模拟按钮 */}
        <Button
          className="w-full"
          size="lg"
          onClick={onSimulate}
          disabled={isLoading || config.amount <= 0}
        >
          {isLoading ? (
            <span className="animate-pulse">计算中...</span>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              开始模拟
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
