"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon, WalletIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
} | null;

type DeleteGoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  onSuccess?: () => void;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const walletTypeIcons: Record<string, string> = {
  bank: "🏦",
  "e-wallet": "📱",
  cash: "💵",
};

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: DeleteGoalDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch wallet allocations for this goal
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    ...trpc.goal.getWalletAllocations.queryOptions({
      goalId: goal?.id ?? "",
    }),
    enabled: open && !!goal?.id,
  });

  const deleteMutation = useMutation({
    ...trpc.goal.delete.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });

      const returnedTotal = Object.values(data.returnedAmounts || {}).reduce(
        (sum, amount) => sum + (amount as number),
        0,
      );

      if (returnedTotal > 0) {
        toast.success("Goal berhasil dihapus", {
          description: `${formatCurrency(returnedTotal)} dikembalikan ke dompet`,
        });
      } else {
        toast.success("Goal berhasil dihapus");
      }

      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus goal");
    },
  });

  const handleDelete = () => {
    if (!goal) return;
    deleteMutation.mutate({ id: goal.id });
  };

  const progress = goal
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Goal</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus goal{" "}
                <span className="font-semibold text-foreground">
                  {goal?.name}
                </span>
                ?
              </p>

              {goal && goal.currentAmount > 0 && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Dana yang akan dikembalikan:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>

                  {allocationsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : allocations && allocations.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <WalletIcon className="h-3 w-3" />
                        Pengembalian per dompet:
                      </p>
                      {allocations.map((allocation) => (
                        <div
                          key={allocation.wallet.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>
                              {walletTypeIcons[allocation.wallet.type] || "💳"}
                            </span>
                            <span>{allocation.wallet.name}</span>
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            +{formatCurrency(allocation.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tidak ada alokasi dompet yang tercatat
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-destructive text-sm">
                  ⚠️ Tindakan ini tidak dapat dibatalkan. Semua milestone dan
                  riwayat transaksi juga akan dihapus.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Hapus Goal
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
