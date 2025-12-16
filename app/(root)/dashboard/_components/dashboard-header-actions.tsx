"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useTRPC } from "@/trpc/client";

export default function DashboardHeaderActions({
  dateRange,
  onDateRangeChange,
}: {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}) {
  const trpc = useTRPC();

  const { data: categories } = useQuery(trpc.category.getAll.queryOptions());
  const { data: wallets } = useQuery(trpc.wallet.getAll.queryOptions());

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DatePicker
        className="w-full sm:w-auto"
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />
      <AddTransactionSheet
        categories={categories ?? []}
        wallets={wallets ?? []}
      >
        <Button className="w-full sm:w-auto">
          <Plus className="size-4" />
          Catat Keuangan
        </Button>
      </AddTransactionSheet>
    </div>
  );
}
