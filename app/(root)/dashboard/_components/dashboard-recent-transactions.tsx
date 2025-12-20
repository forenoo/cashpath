"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Transaction = {
  id: string;
  name: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  date: Date;
  wallet: string;
};

const recentTransactions: Transaction[] = [
  {
    id: "1",
    name: "Gaji Bulanan",
    category: "Gaji",
    type: "income",
    amount: 8_500_000,
    date: new Date("2024-01-25"),
    wallet: "Bank BCA",
  },
  {
    id: "2",
    name: "Belanja Groceries",
    category: "Makanan",
    type: "expense",
    amount: 450_000,
    date: new Date("2024-01-24"),
    wallet: "GoPay",
  },
  {
    id: "3",
    name: "Freelance Project",
    category: "Freelance",
    type: "income",
    amount: 2_500_000,
    date: new Date("2024-01-23"),
    wallet: "Bank BCA",
  },
  {
    id: "4",
    name: "Netflix Subscription",
    category: "Hiburan",
    type: "expense",
    amount: 186_000,
    date: new Date("2024-01-22"),
    wallet: "GoPay",
  },
  {
    id: "5",
    name: "Transportasi Online",
    category: "Transport",
    type: "expense",
    amount: 150_000,
    date: new Date("2024-01-21"),
    wallet: "OVO",
  },
];

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function DashboardRecentTransactions() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>Transaksi terakhir Anda</CardDescription>
        </div>
        <Button className="gap-1" size="sm" variant="outline">
          Selengkapnya
          <ArrowUpRight className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
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
            {recentTransactions.map((transaction) => (
              <TableRow className="h-12" key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.name}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.type === "income" ? "success" : "destructive"
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
                  {format(transaction.date, "dd MMM yyyy", { locale: id })}
                </TableCell>
                <TableCell>{transaction.wallet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
