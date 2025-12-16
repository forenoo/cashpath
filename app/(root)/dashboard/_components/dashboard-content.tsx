"use client";

import { endOfDay, startOfDay, subDays } from "date-fns";
import Image from "next/image";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import DashboardChart from "./dashboard-chart";
import DashboardHeaderActions from "./dashboard-header-actions";
import DashboardRecentTransactions from "./dashboard-recent-transactions";
import DashboardStats from "./dashboard-stats";

export default function DashboardContent({ userName }: { userName: string }) {
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  });

  return (
    <>
      <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Image
            alt="greeting"
            className="-rotate-12 shrink-0"
            height={48}
            src="/waving.svg"
            width={48}
          />
          <div className="space-y-1">
            <h1 className="font-medium text-2xl md:text-3xl">
              Selamat Datang, {userName}
            </h1>
            <p className="text-muted-foreground">
              Lihat ringkasan keuangan Anda dan kelola transaksi Anda dengan
              mudah.
            </p>
          </div>
        </div>
        <DashboardHeaderActions
          dateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
        />
      </header>
      <DashboardStats dateRange={selectedDateRange} />
      <div className="pt-4">
        <DashboardChart />
      </div>
      <div className="pt-4 pb-6 md:pb-12">
        <DashboardRecentTransactions />
      </div>
    </>
  );
}
