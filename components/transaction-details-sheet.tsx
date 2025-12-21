"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarIcon,
  Folder,
  ReceiptIcon,
  RepeatIcon,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import type { Transaction } from "@/app/(root)/transactions/_components/columns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

type TransactionDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
};

const frequencyLabels: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsSheetProps) {
  const trpc = useTRPC();

  // Check if this is a main template transaction
  const isMainTemplate =
    transaction?.isRecurring === true &&
    transaction?.recurringTemplateId === null;

  // Fetch recurring transactions if this is a main template
  const { data: recurringTransactions, isLoading: isLoadingRecurring } =
    useQuery({
      ...trpc.transaction.getRecurringTransactions.queryOptions({
        templateId: transaction?.id ?? "",
      }),
      enabled: isMainTemplate && !!transaction?.id,
    });

  if (!transaction) {
    return null;
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Detail Transaksi</SheetTitle>
          <SheetDescription>
            Informasi lengkap tentang transaksi ini
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)] px-6 py-4">
          <div className="space-y-6">
            {/* Transaction Name and Amount */}
            <div className="space-y-2">
              <h2 className="font-medium text-lg">{transaction.name}</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-xl ${
                    transaction.type === "income"
                      ? "text-green-500"
                      : "text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
                <Badge
                  variant={
                    transaction.type === "income" ? "success" : "destructive"
                  }
                >
                  {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(transaction.date), "dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Folder className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Kategori</p>
                  <p className="font-medium">{transaction.category.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Wallet className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Dompet</p>
                  <p className="font-medium">{transaction.wallet.name}</p>
                </div>
              </div>

              {transaction.isRecurring && (
                <div className="flex items-center gap-3">
                  <RepeatIcon className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm">Frekuensi</p>
                    <p className="font-medium">
                      {transaction.frequency
                        ? frequencyLabels[transaction.frequency]
                        : "Sekali"}
                    </p>
                  </div>
                </div>
              )}

              {transaction.description && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Deskripsi</p>
                  <p className="text-muted-foreground">
                    {transaction.description}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Section */}
            {transaction.receiptUrl && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ReceiptIcon className="size-5 text-muted-foreground" />
                    <h3 className="font-semibold">Bukti Transaksi</h3>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                        <Image
                          alt="Receipt"
                          className="object-contain"
                          fill
                          src={transaction.receiptUrl}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Recurring Transactions Section */}
            {isMainTemplate && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2">
                    <RepeatIcon className="size-5 text-muted-foreground" />
                    <h3 className="font-semibold">Transaksi Berulang</h3>
                  </div>
                  {isLoadingRecurring ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : recurringTransactions &&
                    recurringTransactions.length > 0 ? (
                    <>
                      <p className="text-muted-foreground text-sm">
                        {recurringTransactions.length} transaksi telah dibuat
                        dari template ini
                      </p>
                      <div className="space-y-2 mt-3">
                        {recurringTransactions.map((recurringTx) => (
                          <Card key={recurringTx.id}>
                            <CardContent className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {format(
                                    new Date(recurringTx.date),
                                    "dd MMM yyyy",
                                    { locale: localeId },
                                  )}
                                </p>
                                <p
                                  className={`text-sm ${
                                    recurringTx.type === "income"
                                      ? "text-green-500"
                                      : "text-destructive"
                                  }`}
                                >
                                  {recurringTx.type === "income" ? "+" : "-"}
                                  {formatCurrency(recurringTx.amount)}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {recurringTx.category.name}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Belum ada transaksi yang dibuat dari template ini
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
