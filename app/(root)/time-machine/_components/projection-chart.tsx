"use client";

import { useMemo } from "react";
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

type ProjectionChartProps = {
  yearlyAmount: number;
  isNegative: boolean;
};

const chartConfig = {
  withoutInterest: {
    label: "Tanpa Bunga",
    color: "var(--chart-2)",
  },
  withInterest: {
    label: "Dengan Bunga 4%",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// Format currency for chart
function formatCurrencyShort(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return `${(absAmount / 1_000_000_000).toFixed(1)}M`;
  }
  if (absAmount >= 1_000_000) {
    return `${(absAmount / 1_000_000).toFixed(1)}jt`;
  }
  if (absAmount >= 1_000) {
    return `${(absAmount / 1_000).toFixed(0)}rb`;
  }
  return absAmount.toString();
}

export function ProjectionChart({
  yearlyAmount,
  isNegative,
}: ProjectionChartProps) {
  // Generate projection data for 5 years
  const chartData = useMemo(() => {
    const annualRate = 0.04;
    const data = [];
    const absYearly = Math.abs(yearlyAmount);

    for (let year = 0; year <= 5; year++) {
      // Without interest: simple accumulation
      const withoutInterest = absYearly * year;

      // With interest: Future Value of Annuity (only for positive/savings)
      // FV = P * ((1 + r)^n - 1) / r
      let withInterest = withoutInterest;
      if (year > 0 && !isNegative) {
        withInterest = Math.round(
          absYearly * (((1 + annualRate) ** year - 1) / annualRate),
        );
      }

      data.push({
        year: `Tahun ${year}`,
        withoutInterest,
        withInterest,
      });
    }

    return data;
  }, [yearlyAmount, isNegative]);

  // Calculate interest earned at year 5
  const interestEarned =
    chartData[5].withInterest - chartData[5].withoutInterest;

  if (isNegative) {
    return (
      <Card className="border-rose-500/30 bg-rose-500/5">
        <CardHeader>
          <CardTitle className="text-rose-600">
            Dampak Defisit Keuangan
          </CardTitle>
          <CardDescription>
            Skenario ini menunjukkan defisit yang perlu diatasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="max-w-md space-y-4">
              <p className="text-muted-foreground">
                Dengan skenario ini, kamu akan mengalami defisit sebesar{" "}
                <span className="font-semibold text-rose-600">
                  Rp {chartData[5].withoutInterest.toLocaleString("id-ID")}
                </span>{" "}
                dalam 5 tahun.
              </p>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="font-medium text-rose-600 text-sm">
                  💡 Tips: Coba kurangi pengeluaran atau tambah sumber pemasukan
                  untuk mencapai saldo positif.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pertumbuhan Tabungan 5 Tahun</CardTitle>
        <CardDescription>
          Proyeksi tabungan dengan dan tanpa bunga majemuk 4%/tahun
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-75 w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="year"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) => `Rp ${formatCurrencyShort(value)}`}
              tickLine={false}
              tickMargin={8}
              width={80}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {name === "withInterest"
                          ? "Dengan Bunga"
                          : "Tanpa Bunga"}
                      </span>
                      <span className="font-semibold tabular-nums">
                        Rp {Number(value).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                />
              }
              cursor={false}
            />
            <defs>
              <linearGradient
                id="fillWithoutInterest"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-withoutInterest)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-withoutInterest)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillWithInterest" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-withInterest)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-withInterest)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="withoutInterest"
              fill="url(#fillWithoutInterest)"
              fillOpacity={0.4}
              stroke="var(--color-withoutInterest)"
              type="monotone"
            />
            <Area
              dataKey="withInterest"
              fill="url(#fillWithInterest)"
              fillOpacity={0.4}
              stroke="var(--color-withInterest)"
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>

        {/* Interest Summary */}
        {interestEarned > 0 && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 p-4">
            <p className="text-sm">
              💰 Dengan menabung skenario ini dan mendapatkan bunga 4%/tahun,
              kamu bisa mendapat tambahan{" "}
              <span className="font-semibold text-emerald-600">
                Rp {interestEarned.toLocaleString("id-ID")}
              </span>{" "}
              dalam 5 tahun!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
