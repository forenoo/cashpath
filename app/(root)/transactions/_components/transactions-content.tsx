"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { DeleteTransactionDialog } from "@/components/delete-transaction-dialog";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { TransactionDetailsSheet } from "@/components/transaction-details-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { createColumns, type Transaction } from "./columns";
import { DataTable } from "./data-table";

export default function TransactionsContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<
    Transaction[]
  >([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Query for transactions (hydrated from server)
  const { data: transactionsData, isLoading } = useQuery(
    trpc.transaction.getAll.queryOptions({ page: 1, limit: 100 }),
  );

  // Query for categories (for the add/edit forms)
  const { data: categories } = useQuery(trpc.category.getAll.queryOptions());
  // Query for wallets (for the add/edit forms)
  const { data: wallets } = useQuery(trpc.wallet.getAll.queryOptions());

  // Delete mutation
  const deleteMutation = useMutation({
    ...trpc.transaction.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Transaksi berhasil dihapus");
      setDeletingTransaction(null);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus transaksi");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    ...trpc.transaction.duplicate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Transaksi berhasil diduplikat");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menduplikat transaksi");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    ...trpc.transaction.bulkDelete.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success(`${data.deletedCount} transaksi berhasil dihapus`);
      setSelectedTransactions([]);
      setShowBulkDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus transaksi");
    },
  });

  // Handle selection change from DataTable
  const handleSelectionChange = useCallback((rows: Transaction[]) => {
    setSelectedTransactions(rows);
  }, []);

  // Create columns with action handlers
  const tableColumns = useMemo(
    () =>
      createColumns({
        onEdit: (transaction) => setEditingTransaction(transaction),
        onDelete: (transaction) => setDeletingTransaction(transaction),
        onDuplicate: (transaction) => {
          duplicateMutation.mutate({ id: transaction.id });
        },
        onViewDetails: (transaction) => setSelectedTransaction(transaction),
      }),
    [duplicateMutation],
  );

  const transactions = transactionsData?.data ?? [];

  if (isLoading) {
    return (
      <>
        <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Skeleton className="size-12 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </header>
        <div className="pt-6 pb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header - matches dashboard/settings pattern */}
      <header className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between md:pt-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Image
            alt="transactions"
            className="shrink-0"
            height={48}
            src="/transactions.svg"
            width={48}
          />
          <div className="space-y-1">
            <h1 className="font-medium text-2xl md:text-3xl">
              Daftar Transaksi
            </h1>
            <p className="text-muted-foreground">
              Kelola semua transaksi keuangan Anda.
            </p>
          </div>
        </div>

        {/* Action button - right side */}
        <AddTransactionSheet
          categories={categories ?? []}
          wallets={wallets ?? []}
        >
          <Button>
            <PlusIcon className="size-4" />
            Catat Keuangan
          </Button>
        </AddTransactionSheet>
      </header>

      {/* Content - table in card */}
      <div className="pt-6 pb-12">
        <Card className="py-0 border-none md:border-solid md:py-6">
          <CardContent className="px-0 md:px-6">
            <DataTable
              columns={tableColumns}
              data={transactions}
              onBulkDelete={() => setShowBulkDeleteDialog(true)}
              onRowClick={setSelectedTransaction}
              onSelectionChange={handleSelectionChange}
              selectedCount={selectedTransactions.length}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Sheet */}
      <TransactionDetailsSheet
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        open={!!selectedTransaction}
        transaction={selectedTransaction}
      />

      {/* Edit Transaction Sheet */}
      <EditTransactionSheet
        categories={categories ?? []}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        open={!!editingTransaction}
        transaction={editingTransaction}
        wallets={wallets ?? []}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTransactionDialog
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingTransaction) {
            deleteMutation.mutate({ id: deletingTransaction.id });
          }
        }}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        open={!!deletingTransaction}
        transaction={deletingTransaction}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowBulkDeleteDialog}
        open={showBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selectedTransactions.length} Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua transaksi yang dipilih
              akan dihapus secara permanen dan saldo dompet akan diperbarui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                const ids = selectedTransactions.map((t) => t.id);
                bulkDeleteMutation.mutate({ ids });
              }}
            >
              {bulkDeleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
