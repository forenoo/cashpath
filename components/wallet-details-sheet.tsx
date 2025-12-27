"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BuildingIcon,
  CalendarIcon,
  ReceiptIcon,
  SmartphoneIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

type WalletWithStats = {
  id: string;
  name: string;
  type: "bank" | "e-wallet" | "cash";
  balance: number;
  userId: string;
  createdAt: Date;
  stats: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
  };
};

type WalletDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: WalletWithStats | null;
};

const walletTypeLabels = {
  bank: "Bank",
  "e-wallet": "E-Wallet",
  cash: "Tunai",
};

const walletTypeIcons = {
  bank: BuildingIcon,
  "e-wallet": SmartphoneIcon,
  cash: WalletIcon,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}jt`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

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

export function WalletDetailsSheet({
  open,
  onOpenChange,
  wallet,
}: WalletDetailsSheetProps) {
  const trpc = useTRPC();

  // Fetch wallet details with transactions
  const { data: walletDetails, isLoading: isLoadingDetails } = useQuery({
    ...trpc.wallet.getWalletDetails.queryOptions({
      walletId: wallet?.id ?? "",
      limit: 10,
    }),
    enabled: !!wallet?.id && open,
  });

  // Fetch monthly stats for chart
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useQuery({
    ...trpc.wallet.getWalletMonthlyStats.queryOptions({
      walletId: wallet?.id ?? "",
      months: 6,
    }),
    enabled: !!wallet?.id && open,
  });

  if (!wallet) {
    return null;
  }

  const Icon = walletTypeIcons[wallet.type];

  // Format chart data
  const chartData =
    monthlyStats?.map((item) => ({
      month: format(new Date(item.month + "-01"), "MMM", { locale: localeId }),
      income: item.income,
      expense: item.expense,
    })) ?? [];

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex flex-col gap-0 overflow-hidden p-0 max-w-full w-full sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">{wallet.name}</SheetTitle>
              <SheetDescription className="text-left">
                <Badge variant="outline" className="mt-1">
                  {walletTypeLabels[wallet.type]}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="space-y-6 px-6 py-4">
            {/* Balance Card */}
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">Saldo Saat Ini</p>
                <p className="font-bold text-2xl">
                  {formatCurrency(wallet.balance)}
                </p>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <TrendingUpIcon className="size-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    Pemasukan
                  </p>
                  <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                    {formatShortCurrency(wallet.stats.totalIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <TrendingDownIcon className="size-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    Pengeluaran
                  </p>
                  <p className="font-semibold text-red-600 dark:text-red-400 text-sm">
                    {formatShortCurrency(wallet.stats.totalExpense)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <ReceiptIcon className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">
                    Transaksi
                  </p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                    {wallet.stats.totalTransactions}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Tren 6 Bulan Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMonthly ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : chartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[200px] w-full"
                  >
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="fillIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
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
                        <linearGradient
                          id="fillExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
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
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                        tickFormatter={(value) => formatShortCurrency(value)}
                        width={60}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => (
                              <div className="flex items-center gap-2">
                                <span>
                                  {
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ]?.label
                                  }
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(value as number)}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="var(--color-income)"
                        fill="url(#fillIncome)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="var(--color-expense)"
                        fill="url(#fillExpense)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                    Belum ada data transaksi
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Recent Transactions */}
            <div>
              <h3 className="mb-3 font-semibold">Transaksi Terbaru</h3>
              {isLoadingDetails ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : walletDetails?.transactions &&
                walletDetails.transactions.length > 0 ? (
                <div className="space-y-2">
                  {walletDetails.transactions.map((tx) => (
                    <Card key={tx.id}>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-10 items-center justify-center rounded-full ${
                              tx.type === "income"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-red-100 dark:bg-red-900/30"
                            }`}
                          >
                            {tx.type === "income" ? (
                              <ArrowUpIcon className="size-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownIcon className="size-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.name}</p>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              <CalendarIcon className="size-3" />
                              <span>
                                {format(new Date(tx.date), "dd MMM yyyy", {
                                  locale: localeId,
                                })}
                              </span>
                              <span>•</span>
                              <span>{tx.category.name}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`font-semibold text-sm ${
                            tx.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <ReceiptIcon className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Belum ada transaksi di dompet ini
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
