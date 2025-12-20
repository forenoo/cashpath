"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

type SavingsProgressChartProps = {
  goalId: string;
  goalCreatedAt: Date;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function SavingsProgressChart({
  goalId,
  goalCreatedAt,
}: SavingsProgressChartProps) {
  const trpc = useTRPC();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(goalCreatedAt),
    to: endOfDay(new Date()),
  });

  const { data: transactions, isLoading } = useQuery(
    trpc.goal.getTransactions.queryOptions({
      goalId,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
    }),
  );

  // Process transaction data into daily cumulative data points
  const chartData = useMemo(() => {
    const startDate = dateRange?.from || goalCreatedAt;
    const endDate = dateRange?.to || new Date();

    if (!transactions || transactions.length === 0) {
      // Return single point at creation date with 0 balance, and today with 0
      const result: Array<{
        date: string;
        displayDate: string;
        amount: number;
      }> = [];

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        result.push({
          date: format(currentDate, "yyyy-MM-dd"),
          displayDate: format(currentDate, "dd MMM", { locale: id }),
          amount: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result.length > 0
        ? result
        : [
            {
              date: format(goalCreatedAt, "yyyy-MM-dd"),
              displayDate: format(goalCreatedAt, "dd MMM", { locale: id }),
              amount: 0,
            },
          ];
    }

    // Group transactions by date - transactions already contain cumulative balance
    const dateMap = new Map<string, number>();

    // Process each transaction - the amount field is already cumulative
    transactions.forEach((transaction) => {
      const dateKey = format(new Date(transaction.date), "yyyy-MM-dd");
      // Store the cumulative balance at this date
      dateMap.set(dateKey, transaction.amount);
    });

    // Generate daily data points
    const result: Array<{
      date: string;
      displayDate: string;
      amount: number;
    }> = [];

    let currentBalance = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = format(currentDate, "yyyy-MM-dd");

      // If there's a transaction on this date, update balance
      if (dateMap.has(dateKey)) {
        currentBalance = dateMap.get(dateKey) || 0;
      }

      result.push({
        date: dateKey,
        displayDate: format(currentDate, "dd MMM", { locale: id }),
        amount: currentBalance,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [transactions, goalCreatedAt, dateRange]);

  const chartConfig = {
    amount: {
      label: "Total Tabungan",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Progress Tabungan</CardTitle>
          <CardDescription>
            Grafik perkembangan tabungan untuk goal ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Progress Tabungan</CardTitle>
            <CardDescription>
              Grafik perkembangan tabungan untuk goal ini
            </CardDescription>
          </div>
          <DatePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto"
          />
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data transaksi
          </div>
        ) : (
          <ChartContainer className="h-[250px] w-full" config={chartConfig}>
            <AreaChart accessibilityLayer data={chartData}>
              <defs>
                <linearGradient id="fillAmount" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="displayDate"
                tickLine={false}
                tickMargin={8}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return value.toString();
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => {
                      const dataPoint = chartData.find(
                        (d) => d.displayDate === value,
                      );
                      if (dataPoint) {
                        return format(new Date(dataPoint.date), "dd MMM yyyy", {
                          locale: id,
                        });
                      }
                      return value;
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
                cursor={false}
              />
              <Area
                dataKey="amount"
                fill="url(#fillAmount)"
                fillOpacity={0.4}
                stroke="var(--color-amount)"
                type="natural"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
