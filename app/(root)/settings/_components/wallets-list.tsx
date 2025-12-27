"use client";

import {
  BuildingIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SmartphoneIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { DeleteWalletDialog } from "@/components/delete-wallet-dialog";
import { EditWalletDialog } from "@/components/edit-wallet-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type WalletsListProps = {
  wallets: WalletWithStats[];
  isLoading: boolean;
  onRowClick?: (wallet: WalletWithStats) => void;
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function WalletsList({
  wallets,
  isLoading,
  onRowClick,
}: WalletsListProps) {
  const [editWallet, setEditWallet] = useState<WalletWithStats | null>(null);
  const [deleteWallet, setDeleteWallet] = useState<WalletWithStats | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <WalletIcon className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-lg">Belum ada dompet</h3>
        <p className="text-muted-foreground text-sm">
          Tambahkan dompet pertama Anda untuk mulai mencatat transaksi.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Transaksi</TableHead>
            <TableHead className="text-right">Total Pemasukan</TableHead>
            <TableHead className="text-right">Total Pengeluaran</TableHead>
            <TableHead className="w-[120px] text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet) => {
            const Icon = walletTypeIcons[wallet.type];
            return (
              <TableRow
                key={wallet.id}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isClickable =
                    target.closest("button") ||
                    target.closest("[role='menuitem']") ||
                    target.closest("[data-radix-popper-content-wrapper]");
                  if (!isClickable && onRowClick) {
                    onRowClick(wallet);
                  }
                }}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {walletTypeLabels[wallet.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(wallet.balance)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {wallet.stats.totalTransactions}
                </TableCell>
                <TableCell className="text-right text-green-500">
                  {formatCurrency(wallet.stats.totalIncome)}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  {formatCurrency(wallet.stats.totalExpense)}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />
                        <span className="sr-only">Buka menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditWallet(wallet)}>
                        <PencilIcon className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteWallet(wallet)}
                      >
                        <Trash2Icon className="mr-2 text-destructive size-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <EditWalletDialog
        open={!!editWallet}
        onOpenChange={(open) => !open && setEditWallet(null)}
        wallet={editWallet}
      />

      <DeleteWalletDialog
        open={!!deleteWallet}
        onOpenChange={(open) => !open && setDeleteWallet(null)}
        wallet={deleteWallet}
      />
    </>
  );
}
