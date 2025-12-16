"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "Januari", income: 8_500_000, expense: 4_200_000 },
  { month: "Februari", income: 7_800_000, expense: 5_100_000 },
  { month: "Maret", income: 9_200_000, expense: 4_800_000 },
  { month: "April", income: 8_100_000, expense: 5_500_000 },
  { month: "Mei", income: 8_750_000, expense: 4_600_000 },
  { month: "Juni", income: 8_250_000, expense: 4_750_000 },
];

const chartConfig = {
  income: {
    label: "Pemasukan",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function DashboardChart() {
  const [activeChart, setActiveChart] = useState<"income" | "expense" | "both">(
    "both",
  );

  const total = useMemo(
    () => ({
      income: chartData.length,
      expense: chartData.length,
    }),
    [],
  );

  return (
    <Card className="w-full py-0">
      <CardHeader className="p-0! flex flex-col items-stretch border-b sm:flex-row">
        <div className="sm:py-5! flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3">
          <CardTitle>Statistik Keuangan</CardTitle>
          <CardDescription>
            Menampilkan pemasukan dan pengeluaran 6 bulan terakhir
          </CardDescription>
        </div>
        <div className="flex">
          <button
            className="relative z-30 flex flex-1 cursor-pointer flex-col justify-center gap-2 border-t px-6 py-4 text-left transition-all even:border-l hover:bg-secondary data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8.5 sm:py-6"
            data-active={activeChart === "income"}
            onClick={() =>
              setActiveChart((prev) => (prev === "income" ? "both" : "income"))
            }
            type="button"
          >
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="size-4 text-green-500" />
              {chartConfig.income.label}
            </span>
            <span className="font-bold text-lg leading-none sm:text-3xl">
              {total.income.toLocaleString("id-ID")}
            </span>
          </button>
          <button
            className="relative z-30 flex flex-1 cursor-pointer flex-col justify-center gap-2 border-t px-6 py-4 text-left transition-all even:border-l hover:bg-secondary data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            data-active={activeChart === "expense"}
            onClick={() =>
              setActiveChart((prev) =>
                prev === "expense" ? "both" : "expense",
              )
            }
            type="button"
          >
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingDown className="size-4 text-destructive" />
              {chartConfig.expense.label}
            </span>
            <span className="font-bold text-lg leading-none sm:text-3xl">
              {total.expense.toLocaleString("id-ID")}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickFormatter={(value) => value.slice(0, 3)}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="[&>div>div>div]:gap-2"
                />
              }
              cursor={false}
            />
            <defs>
              <linearGradient id="fillIncome" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            {(activeChart === "income" || activeChart === "both") && (
              <Area
                dataKey="income"
                fill="url(#fillIncome)"
                fillOpacity={0.4}
                stroke="var(--color-income)"
                type="natural"
              />
            )}
            {(activeChart === "expense" || activeChart === "both") && (
              <Area
                dataKey="expense"
                fill="url(#fillExpense)"
                fillOpacity={0.4}
                stroke="var(--color-expense)"
                type="natural"
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
