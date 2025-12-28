"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowUpRight, Receipt } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/trpc/client";

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Sumber</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow className="h-12" key={`skeleton-${crypto.randomUUID()}`}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function DashboardRecentTransactions() {
  const trpc = useTRPC();

  const { data: transactions, isLoading } = useQuery(
    trpc.transaction.getRecent.queryOptions({ limit: 5 }),
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>Transaksi terakhir Anda</CardDescription>
        </div>
        <Button
          asChild
          className="gap-1 w-full md:w-auto"
          size="sm"
          variant="outline"
        >
          <Link href="/transactions">
            Selengkapnya
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : !transactions || transactions.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Belum ada transaksi</EmptyTitle>
              <EmptyDescription>
                Transaksi Anda akan muncul di sini setelah Anda menambahkannya.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Sumber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow className="h-12" key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.name}
                  </TableCell>
                  <TableCell>
                    {transaction.category?.icon && (
                      <span className="mr-1">{transaction.category.icon}</span>
                    )}
                    {transaction.category?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "income"
                          ? "success"
                          : "destructive"
                      }
                    >
                      {transaction.type === "income"
                        ? "Pemasukan"
                        : "Pengeluaran"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      transaction.type === "income"
                        ? "text-green-500"
                        : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "dd MMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell>{transaction.wallet?.name ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
