"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { useTRPC } from "@/trpc/client";
import WalletsList from "./wallets-list";

export default function WalletsTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const trpc = useTRPC();

  const { data: wallets, isLoading: isLoadingWallets } = useQuery(
    trpc.wallet.getAll.queryOptions(),
  );
  const { data: stats, isLoading: isLoadingStats } = useQuery(
    trpc.wallet.getStats.queryOptions(),
  );

  // Combine wallets with their stats
  const walletsWithStats =
    wallets?.map((wallet) => ({
      ...wallet,
      stats: stats?.find((s) => s.walletId === wallet.id) ?? {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpense: 0,
      },
    })) ?? [];

  const isLoading = isLoadingWallets || isLoadingStats;

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Daftar Dompet</CardTitle>
          <CardDescription>
            Kelola semua dompet dan rekening Anda di sini.
          </CardDescription>
        </div>
        <CardAction>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusIcon className="size-4" />
            Tambah Dompet
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <WalletsList wallets={walletsWithStats} isLoading={isLoading} />
      </CardContent>

      <AddWalletDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </Card>
  );
}
