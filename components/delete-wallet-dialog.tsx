"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Wallet = {
  id: string;
  name: string;
  type: "bank" | "e-wallet" | "cash";
  balance: number;
  stats?: {
    totalTransactions: number;
  };
} | null;

type DeleteWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function DeleteWalletDialog({
  open,
  onOpenChange,
  wallet,
}: DeleteWalletDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...trpc.wallet.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      toast.success("Dompet berhasil dihapus");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus dompet");
    },
  });

  const handleDelete = () => {
    if (!wallet) return;
    deleteMutation.mutate({ id: wallet.id });
  };

  const hasTransactions = (wallet?.stats?.totalTransactions ?? 0) > 0;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Dompet</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus dompet{" "}
                <span className="font-semibold text-foreground">
                  {wallet?.name}
                </span>{" "}
                dengan saldo{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(wallet?.balance ?? 0)}
                </span>
                ?
              </p>
              {hasTransactions && (
                <p className="text-destructive">
                  Peringatan: Dompet ini memiliki{" "}
                  {wallet?.stats?.totalTransactions} transaksi. Semua transaksi
                  terkait akan ikut terhapus.
                </p>
              )}
              <p>Tindakan ini tidak dapat dibatalkan.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={deleteMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2Icon className="mr-2 size-4" />
                Hapus Dompet
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
