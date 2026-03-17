
# 一、产品概述

## 1.1 产品名称

定投收益模拟器（DCA Simulator）

## 1.2 产品目标

帮助用户回答一个核心问题：

> “如果我从某个时间开始，用某种定投策略投资某只基金，现在收益如何？”

## 1.3 核心价值

* 可视化：基金走势 + 投资行为叠加
* 可对比：不同策略的收益差异
* 可解释：收益拆解（本金 / 盈亏 / 收益率 / IRR）

---

# 二、核心功能拆解

## 2.1 基金查询 + 净值走势图

### 输入

* 基金代码（必填）

### 输出

* 基金净值走势（折线图）
* 支持时间切换：

  * 成立以来
  * 近5年
  * 近3年
  * 近1年
  * 近6个月

### 数据结构（前端）

```ts
type FundNav = {
  date: string;   // YYYY-MM-DD
  nav: number;    // 单位净值
}
```

### API建议（无需自建）

* 天天基金 / akshare / eastmoney API（可通过 serverless proxy）

---

## 2.2 定投策略配置

### 2.2.1 基础配置

| 参数   | 类型     | 默认值     |
| ---- | ------ | ------- |
| 定投金额 | number | 1000    |
| 起始日期 | date   | 必填      |
| 结束日期 | date   | 默认今天    |
| 策略类型 | enum   | monthly |

---

### 2.2.2 策略类型

#### A. 每月定投

```ts
type: "monthly"
day: number // 1-28（避免月末问题）
```

#### B. 每周定投

```ts
type: "weekly"
weekday: number // 1-7 (周一到周日)
```

---

### 2.2.3 非交易日处理

```ts
type TradeDayRule = 
  | "skip"       // 跳过
  | "next_trade" // 顺延到下一个交易日
```

---

## 2.3 定投执行逻辑（核心算法）

### Step 1：生成定投日期列表

伪代码：

```ts
function generateInvestDates(config, fundNavList):
  dates = []

  for date in range(startDate, endDate):
    if matchStrategy(date):
      if isTradeDay(date):
        dates.push(date)
      else:
        if rule == "next_trade":
          dates.push(findNextTradeDay(date))
        else:
          continue

  return dates
```

---

### Step 2：计算每次买入份额

```ts
shares = amount / nav
```

---

### Step 3：累计持仓

```ts
totalShares += shares
totalCost += amount
```

---

### Step 4：计算最终收益

```ts
finalValue = totalShares * latestNav

profit = finalValue - totalCost

returnRate = profit / totalCost
```

---

### Step 5（重要）：年化收益率 IRR

使用 XIRR（必须实现）

```ts
cashflow = [
  [-1000, date1],
  [-1000, date2],
  ...
  [finalValue, today]
]
```

使用牛顿法求解 IRR

---

# 三、结果展示（行业标准）

必须展示以下指标：

## 3.1 核心指标

| 指标    | 说明            |
| ----- | ------------- |
| 累计投入  | 总本金           |
| 当前市值  | 当前资产          |
| 累计收益  | 盈亏            |
| 收益率   | profit / cost |
| 年化收益率 | IRR           |

---

## 3.2 辅助指标（建议）

| 指标   | 说明                      |
| ---- | ----------------------- |
| 定投次数 | 执行次数                    |
| 平均成本 | totalCost / totalShares |
| 最大回撤 | 模拟过程中最大亏损               |

---

## 3.3 可视化（非常关键）

### 图1：净值走势 + 定投点

* 折线：净值
* 点：买入点

### 图2：资产曲线

* X轴：时间
* Y轴：总资产

---

# 四、UI设计（重点）

## 4.1 整体风格

关键词：

* 金融感（简洁、冷静）
* 数据优先
* 类似：支付宝基金页 / 天天基金

### 配色建议

* 主色：#1677FF（金融蓝）
* 盈利：#D84A4A（红）
* 亏损：#3BA272（绿）
* 背景：#F5F7FA

---

## 4.2 页面结构

### 页面布局（从上到下）

```
[Header]
  标题 + 简介

[基金搜索区]
  输入框 + 查询按钮

[走势图]
  时间切换tab + 折线图

[定投配置区]
  策略选择 + 参数设置

[结果展示区]
  核心指标卡片

[图表分析区]
  资产曲线
```

---

## 4.3 UI组件细节

### 1️⃣ 基金输入

* 输入框 + 自动补全
* 支持直接输入代码

---

### 2️⃣ 时间切换（Tabs）

```
[成立以来][5年][3年][1年][6月]
```

---

### 3️⃣ 策略配置（卡片式）

#### 示例：

```
定投方式：
(o) 每月   ( ) 每周

每月：
[6]号

金额：
[1000]

非交易日：
(o) 顺延
( ) 跳过
```

---

### 4️⃣ 结果卡片（重点UI）

```
累计投入     ¥50,000
当前市值     ¥63,200
累计收益     +¥13,200
收益率       +26.4%
年化收益     12.3%
```

👉 要求：

* 大字体
* 盈亏颜色明显

---

### 5️⃣ 图表库推荐

* Recharts（React）
* 或 ECharts（更强）

---

# 五、技术架构（Vercel）

## 5.1 技术选型

| 层   | 技术                      |
| --- | ----------------------- |
| 前端  | Next.js                 |
| UI  | TailwindCSS + shadcn/ui |
| 图表  | Recharts                |
| API | Vercel Serverless       |
| 数据  | 第三方基金API                |

---

## 5.2 项目结构

```
/app
  /page.tsx
  /components
    FundChart.tsx
    StrategyForm.tsx
    ResultPanel.tsx
  /lib
    calc.ts        // 核心算法
    date.ts
    fundApi.ts
/api
  /fund
```

---

## 5.3 核心模块

### calc.ts（必须独立）

```ts
export function simulateDCA(config, navList) {
  // 1. 生成日期
  // 2. 计算买入
  // 3. 累计收益
  // 4. 返回结果
}
```

---

# 六、边界情况处理

必须处理：

1. ❗基金停牌 → 无数据 → 跳过
2. ❗日期超出范围 → 自动裁剪
3. ❗净值缺失 → fallback最近交易日
4. ❗极端情况：

   * 只投1次
   * 全程下跌

---

# 七、可扩展能力（后续版本）

建议预留：

* 不同策略对比（多曲线）
* 智能定投（跌幅加仓）
* 回测排行榜
* 多基金组合

---

# 八、你这个产品的关键成败点

我直接讲重点（很现实）：

### 1️⃣ 不是“算对”，而是“解释清楚”

用户关心：

* 为什么赚？
* 为什么亏？

👉 所以图表 > 数字
