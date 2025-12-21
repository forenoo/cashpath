"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type GoalTransactionHistoryProps = {
  goalId: string;
  goalCreatedAt: Date;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const walletTypeIcons: Record<string, string> = {
  bank: "🏦",
  "e-wallet": "📱",
  cash: "💵",
};

export function GoalTransactionHistory({
  goalId,
  goalCreatedAt,
}: GoalTransactionHistoryProps) {
  const trpc = useTRPC();

  const { data: transactions, isLoading } = useQuery(
    trpc.goal.getTransactions.queryOptions({
      goalId,
      startDate: goalCreatedAt,
    }),
  );

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="gap-0">
          <CardTitle className="flex items-center gap-2 text-base">
            Riwayat Transaksi
          </CardTitle>
          <CardDescription>Riwayat alokasi dana ke goal ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i.toString()}`}
                className="flex items-center gap-3"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reverse transactions to show newest first
  const reversedTransactions = [...(transactions || [])].reverse();

  return (
    <Card className="border shadow-sm">
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center gap-2 text-base">
          Riwayat Transaksi
        </CardTitle>
        <CardDescription>Riwayat alokasi dana ke goal ini</CardDescription>
      </CardHeader>
      <CardContent>
        {!reversedTransactions || reversedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <TrendingUpIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Alokasikan dana dari dompet untuk melihat riwayat
            </p>
          </div>
        ) : (
          <ScrollArea className="h-70 pr-3">
            <div className="space-y-1">
              {reversedTransactions.map((transaction, index) => {
                const isPositive = transaction.transactionAmount > 0;

                return (
                  <Card
                    key={`${transaction.date}-${index}`}
                    className={cn(
                      "flex flex-row items-center gap-3 rounded-lg p-4 transition-colors",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        isPositive
                          ? "bg-green-100 dark:bg-green-950/50"
                          : "bg-red-100 dark:bg-red-950/50",
                      )}
                    >
                      {isPositive ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {isPositive ? "Alokasi" : "Penarikan"}
                        </p>
                        {transaction.wallet && (
                          <Badge
                            variant="outline"
                            className="text-xs h-5 px-1.5 shrink-0"
                          >
                            {walletTypeIcons[transaction.wallet.type] || "💳"}{" "}
                            {transaction.wallet.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(transaction.date),
                          "dd MMM yyyy, HH:mm",
                          {
                            locale: id,
                          },
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(transaction.transactionAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
