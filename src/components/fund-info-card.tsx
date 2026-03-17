"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Fund } from "@/lib/types";

interface FundInfoCardProps {
  fund: Fund;
}

export function FundInfoCard({ fund }: FundInfoCardProps) {
  const profitColor =
    fund.dayGrowth && parseFloat(fund.dayGrowth) >= 0
      ? "text-profit"
      : "text-loss";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{fund.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {fund.code}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">基金类型</p>
            <p className="font-medium">{fund.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">基金经理</p>
            <p className="font-medium">{fund.manager}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">基金公司</p>
            <p className="font-medium">{fund.company}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">成立日期</p>
            <p className="font-medium">{fund.establishDate}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">单位净值</p>
            <p className="text-xl font-semibold">{fund.nav?.toFixed(4) || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">累计净值</p>
            <p className="text-xl font-semibold">
              {fund.accumulatedNav?.toFixed(4) || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">日涨跌幅</p>
            <p className={`text-xl font-semibold ${profitColor}`}>
              {fund.dayGrowth
                ? parseFloat(fund.dayGrowth) >= 0
                  ? `+${fund.dayGrowth}%`
                  : `${fund.dayGrowth}%`
                : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
