"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  dateRange?: DateRange;
  imgSrc: string;
};

function StatCard({ title, value, trend, dateRange, imgSrc }: StatCardProps) {
  const getTrendLabel = () => {
    if (!(dateRange?.from && dateRange?.to)) {
      return "";
    }
    const daysDiff = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `vs previous ${daysDiff} days`;
  };

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
            trend.isPositive ? "text-green-500" : "text-destructive",
          )}
        >
          {trend.isPositive ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
          <span>
            {Math.abs(trend.value)}% {getTrendLabel()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats({
  dateRange,
}: {
  dateRange?: DateRange;
}) {
  // Hardcoded data for now
  const stats = [
    {
      title: "Available Balance",
      value: "Rp 15.500.000",
      trend: {
        value: 12.5,
        isPositive: true,
      },
      imgSrc: "/wallet.svg",
    },
    {
      title: "Total Income",
      value: "Rp 8.250.000",
      trend: {
        value: 8.3,
        isPositive: true,
      },
      imgSrc: "/profits.svg",
    },
    {
      title: "Total Expense",
      value: "Rp 4.750.000",
      trend: {
        value: 5.2,
        isPositive: false,
      },
      imgSrc: "/reduce-cost.svg",
    },
    {
      title: "Savings Rate",
      value: "42.4%",
      trend: {
        value: 3.1,
        isPositive: true,
      },
      imgSrc: "/saving.svg",
    },
  ];

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
