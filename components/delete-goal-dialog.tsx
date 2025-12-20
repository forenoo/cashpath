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

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: DeleteGoalDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...trpc.goal.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      toast.success("Goal berhasil dihapus");
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
            <div className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus goal{" "}
                <span className="font-semibold text-foreground">
                  {goal?.name}
                </span>
                ?
              </p>
              {goal && goal.currentAmount > 0 && (
                <div className="mt-3 rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm">
                    Progress saat ini:{" "}
                    <span className="font-medium">
                      {formatCurrency(goal.currentAmount)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-medium">
                      {formatCurrency(goal.targetAmount)}
                    </span>{" "}
                    ({progress.toFixed(1)}%)
                  </p>
                </div>
              )}
              <p className="text-destructive text-sm">
                Tindakan ini tidak dapat dibatalkan. Semua milestone terkait
                juga akan dihapus.
              </p>
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
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
