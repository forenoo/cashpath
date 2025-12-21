"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarDays,
  CalendarRange,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Frequency } from "@/lib/validations/simulation";

type ScenarioSummaryProps = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  frequency: Frequency;
  projections: {
    monthly: number;
    yearly: number;
    fiveYear: number;
    fiveYearWithInterest: number;
  };
};

// Format currency to Indonesian Rupiah with abbreviation
function formatCurrencyShort(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return `Rp ${(absAmount / 1_000_000_000).toFixed(1)}M`;
  }
  if (absAmount >= 1_000_000) {
    return `Rp ${(absAmount / 1_000_000).toFixed(1)}jt`;
  }
  if (absAmount >= 1_000) {
    return `Rp ${(absAmount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${absAmount.toLocaleString("id-ID")}`;
}

// Format currency fully
function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function ScenarioSummary({
  totalIncome,
  totalExpense,
  net,
  frequency,
  projections,
}: ScenarioSummaryProps) {
  const isPositive = net > 0;
  const isNegative = net < 0;
  const frequencyLabel = frequency === "daily" ? "/hari" : "/bulan";

  return (
    <div className="space-y-6">
      {/* Net Summary Card */}
      <Card
        className={cn(
          "border-2 transition-all",
          isPositive && "border-emerald-500/50 bg-emerald-500/5",
          isNegative && "border-rose-500/50 bg-rose-500/5",
          net === 0 && "border-border bg-muted/20",
        )}
      >
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            {/* Income */}
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Total Pemasukan</p>
              <p className="font-semibold text-emerald-600 text-xl tabular-nums">
                +{formatCurrencyShort(totalIncome)}
                <span className="font-normal text-muted-foreground text-sm">
                  {frequencyLabel}
                </span>
              </p>
            </div>

            {/* Expense */}
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Total Pengeluaran</p>
              <p className="font-semibold text-rose-600 text-xl tabular-nums">
                -{formatCurrencyShort(totalExpense)}
                <span className="font-normal text-muted-foreground text-sm">
                  {frequencyLabel}
                </span>
              </p>
            </div>

            {/* Net */}
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">
                {isPositive
                  ? "Tabungan Bersih"
                  : isNegative
                    ? "Defisit"
                    : "Saldo"}
              </p>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {isPositive && <ArrowUp className="size-5 text-emerald-600" />}
                {isNegative && <ArrowDown className="size-5 text-rose-600" />}
                <p
                  className={cn(
                    "font-bold text-2xl tabular-nums",
                    isPositive && "text-emerald-600",
                    isNegative && "text-rose-600",
                    net === 0 && "text-muted-foreground",
                  )}
                >
                  {net === 0 ? "Rp 0" : formatCurrencyShort(Math.abs(net))}
                  <span className="font-normal text-muted-foreground text-sm">
                    {frequencyLabel}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Cards */}
      {net !== 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProjectionCard
            title="1 Bulan"
            value={projections.monthly}
            icon={Calendar}
            description="Dampak bulanan"
            isNegative={isNegative}
          />
          <ProjectionCard
            title="1 Tahun"
            value={projections.yearly}
            icon={CalendarDays}
            description="Dampak tahunan"
            isNegative={isNegative}
          />
          <ProjectionCard
            title="5 Tahun"
            value={projections.fiveYear}
            icon={CalendarRange}
            description="Tanpa bunga"
            isNegative={isNegative}
          />
          <ProjectionCard
            title="5 Tahun + Bunga"
            value={projections.fiveYearWithInterest}
            icon={TrendingUp}
            description="Dengan bunga 4%/tahun"
            isNegative={isNegative}
            highlight={!isNegative}
            bonus={
              isPositive
                ? projections.fiveYearWithInterest - projections.fiveYear
                : 0
            }
          />
        </div>
      )}

      {/* Empty state message */}
      {net === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            Tambahkan pemasukan dan pengeluaran untuk melihat proyeksi
            keuanganmu.
          </p>
        </div>
      )}
    </div>
  );
}

type ProjectionCardProps = {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isNegative: boolean;
  highlight?: boolean;
  bonus?: number;
};

function ProjectionCard({
  title,
  value,
  icon: Icon,
  description,
  isNegative,
  highlight,
  bonus,
}: ProjectionCardProps) {
  return (
    <Card
      className={cn(
        "transition-all gap-2",
        highlight && "border-primary bg-primary/5",
        isNegative && "border-rose-500/30 bg-rose-500/5",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon
          className={cn(
            "size-4",
            isNegative ? "text-rose-500" : "text-emerald-500",
          )}
        />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "font-bold text-2xl tabular-nums",
            isNegative ? "text-rose-600" : "text-emerald-600",
          )}
          title={formatCurrencyFull(value)}
        >
          {isNegative ? "-" : "+"}
          {formatCurrencyShort(value)}
        </div>
        <p className="text-muted-foreground text-xs">{description}</p>
        {bonus !== undefined && bonus > 0 && (
          <p className="mt-1 text-primary text-xs">
            +{formatCurrencyShort(bonus)} dari bunga
          </p>
        )}
      </CardContent>
    </Card>
  );
}
