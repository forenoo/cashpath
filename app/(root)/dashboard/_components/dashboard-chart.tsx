"use client";

import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

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

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function DashboardChart() {
  const trpc = useTRPC();

  const { data: monthlyStats, isLoading } = useQuery(
    trpc.transaction.getMonthlyStats.queryOptions({ months: 6 }),
  );

  const [activeChart, setActiveChart] = useState<"income" | "expense" | "both">(
    "both",
  );

  const totals = useMemo(() => {
    if (!monthlyStats) return { income: 0, expense: 0 };
    return monthlyStats.reduce(
      (acc, curr) => ({
        income: acc.income + curr.income,
        expense: acc.expense + curr.expense,
      }),
      { income: 0, expense: 0 },
    );
  }, [monthlyStats]);

  const chartData = useMemo(() => {
    if (!monthlyStats) return [];
    return monthlyStats.map((stat) => ({
      month: stat.month,
      income: stat.income,
      expense: stat.expense,
    }));
  }, [monthlyStats]);

  if (isLoading) {
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
            <div className="flex flex-1 flex-col justify-center gap-2 border-t px-6 py-4 sm:border-t-0 sm:border-l sm:px-8.5 sm:py-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 border-t border-l px-6 py-4 sm:border-t-0 sm:px-8 sm:py-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <Skeleton className="h-62.5 w-full" />
        </CardContent>
      </Card>
    );
  }

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
            <span className="font-bold text-lg leading-none sm:text-xl">
              {formatCurrency(totals.income)}
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
            <span className="font-bold text-lg leading-none sm:text-xl">
              {formatCurrency(totals.expense)}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer className="h-62.5 w-full" config={chartConfig}>
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
                  className="[&>div>div>div]:gap-2"
                  indicator="line"
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {name === "income" ? "Pemasukan" : "Pengeluaran"}:
                      </span>
                      <span className="font-medium">
                        Rp {Number(value).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
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
