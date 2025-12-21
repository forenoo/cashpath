"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type StatCardProps = {
  title: string;
  value: string;
  trend: {
    value: number;
    isPositive: boolean;
    isNeutral?: boolean;
  };
  dateRange?: DateRange;
  imgSrc: string;
  isLoading?: boolean;
};

function StatCard({
  title,
  value,
  trend,
  dateRange,
  imgSrc,
  isLoading,
}: StatCardProps) {
  const getTrendLabel = () => {
    if (!(dateRange?.from && dateRange?.to)) {
      return "";
    }
    const daysDiff = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `vs ${daysDiff} hari sebelumnya`;
  };

  if (isLoading) {
    return (
      <Card className="gap-4">
        <CardHeader className="flex flex-row items-center space-y-0">
          <Image
            alt={title}
            className="size-5"
            height={40}
            src={imgSrc}
            width={40}
          />
          <CardTitle className="font-medium text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center space-y-0">
        <Image
          alt={title}
          className="size-5"
          height={40}
          src={imgSrc}
          width={40}
        />
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-bold font-spacegrotesk text-3xl">{value}</p>
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            trend.isNeutral
              ? "text-muted-foreground"
              : trend.isPositive
                ? "text-green-500"
                : "text-destructive",
          )}
        >
          {trend.isNeutral ? (
            <Minus className="size-3" />
          ) : trend.isPositive ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
          <span>
            {trend.isNeutral
              ? "Tidak ada perubahan"
              : `${Math.abs(trend.value).toFixed(1)}% ${getTrendLabel()}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function calculateTrend(
  current: number,
  previous: number,
): { value: number; isPositive: boolean; isNeutral?: boolean } {
  if (previous === 0 && current === 0) {
    return { value: 0, isPositive: true, isNeutral: true };
  }
  if (previous === 0) {
    return { value: 100, isPositive: current > 0 };
  }
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: percentChange,
    isPositive: percentChange >= 0,
    isNeutral: percentChange === 0,
  };
}

export default function DashboardStats({
  dateRange,
}: {
  dateRange?: DateRange;
}) {
  const trpc = useTRPC();

  // Calculate previous period for comparison
  const currentPeriod = useMemo(() => {
    const from = dateRange?.from ?? startOfDay(subDays(new Date(), 29));
    const to = dateRange?.to ?? endOfDay(new Date());
    return { startDate: from, endDate: to };
  }, [dateRange]);

  const previousPeriod = useMemo(() => {
    if (!(currentPeriod.startDate && currentPeriod.endDate)) return null;
    const daysDiff = Math.ceil(
      (currentPeriod.endDate.getTime() - currentPeriod.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return {
      startDate: startOfDay(subDays(currentPeriod.startDate, daysDiff)),
      endDate: endOfDay(subDays(currentPeriod.startDate, 1)),
    };
  }, [currentPeriod]);

  // Fetch current period stats
  const { data: currentStats, isLoading: isLoadingCurrent } = useQuery(
    trpc.transaction.getStats.queryOptions(currentPeriod),
  );

  // Fetch previous period stats for trend comparison
  const { data: previousStats, isLoading: isLoadingPrevious } = useQuery(
    trpc.transaction.getStats.queryOptions(previousPeriod ?? currentPeriod),
  );

  // Fetch wallets for total balance
  const { data: wallets, isLoading: isLoadingWallets } = useQuery(
    trpc.wallet.getAll.queryOptions(),
  );

  const isLoading = isLoadingCurrent || isLoadingPrevious || isLoadingWallets;

  // Calculate total balance from all wallets
  const totalBalance = useMemo(() => {
    if (!wallets) return 0;
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  }, [wallets]);

  // Calculate savings rate
  const savingsRate = useMemo(() => {
    if (!currentStats || currentStats.totalIncome === 0) return 0;
    const savings = currentStats.totalIncome - currentStats.totalExpense;
    return (savings / currentStats.totalIncome) * 100;
  }, [currentStats]);

  const previousSavingsRate = useMemo(() => {
    if (!previousStats || previousStats.totalIncome === 0) return 0;
    const savings = previousStats.totalIncome - previousStats.totalExpense;
    return (savings / previousStats.totalIncome) * 100;
  }, [previousStats]);

  const stats = useMemo(
    () => [
      {
        title: "Saldo Tersedia",
        value: formatCurrency(totalBalance),
        trend: calculateTrend(
          currentStats?.balance ?? 0,
          previousStats?.balance ?? 0,
        ),
        imgSrc: "/wallet.svg",
      },
      {
        title: "Total Pemasukan",
        value: formatCurrency(currentStats?.totalIncome ?? 0),
        trend: calculateTrend(
          currentStats?.totalIncome ?? 0,
          previousStats?.totalIncome ?? 0,
        ),
        imgSrc: "/profits.svg",
      },
      {
        title: "Total Pengeluaran",
        value: formatCurrency(currentStats?.totalExpense ?? 0),
        trend: {
          ...calculateTrend(
            currentStats?.totalExpense ?? 0,
            previousStats?.totalExpense ?? 0,
          ),
          // For expenses, decreasing is positive (good)
          isPositive:
            (currentStats?.totalExpense ?? 0) <=
            (previousStats?.totalExpense ?? 0),
        },
        imgSrc: "/reduce-cost.svg",
      },
      {
        title: "Tingkat Tabungan",
        value: `${savingsRate.toFixed(1)}%`,
        trend: calculateTrend(savingsRate, previousSavingsRate),
        imgSrc: "/saving.svg",
      },
    ],
    [
      totalBalance,
      currentStats,
      previousStats,
      savingsRate,
      previousSavingsRate,
    ],
  );

  return (
    <div className="pt-7">
      {/* Mobile Carousel */}
      <Carousel
        className="md:hidden"
        opts={{
          align: "start",
        }}
      >
        <CarouselContent className="-ml-2">
          {stats.map((stat) => (
            <CarouselItem className="basis-[90%] pl-2" key={stat.title}>
              <StatCard
                dateRange={dateRange}
                imgSrc={stat.imgSrc}
                isLoading={isLoading}
                title={stat.title}
                trend={stat.trend}
                value={stat.value}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop Grid */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            dateRange={dateRange}
            imgSrc={stat.imgSrc}
            isLoading={isLoading}
            key={stat.title}
            title={stat.title}
            trend={stat.trend}
            value={stat.value}
          />
        ))}
      </div>
    </div>
  );
}
