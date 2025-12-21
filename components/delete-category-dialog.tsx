"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  stats?: {
    totalTransactions: number;
    totalAmount: number;
  };
} | null;

type DeleteCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
};

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: DeleteCategoryDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...trpc.category.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["category"]] });
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      toast.success("Kategori berhasil dihapus");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menghapus kategori");
    },
  });

  const handleDelete = () => {
    if (!category) return;
    deleteMutation.mutate({ id: category.id });
  };

  const hasTransactions = (category?.stats?.totalTransactions ?? 0) > 0;

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus kategori{" "}
                <span className="font-semibold text-foreground">
                  {category?.name}
                </span>
                ?
              </p>
              {hasTransactions && (
                <p className="text-destructive">
                  Peringatan: Kategori ini memiliki{" "}
                  {category?.stats?.totalTransactions} transaksi. Semua
                  transaksi terkait akan ikut terhapus.
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
                <Spinner className="mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2Icon className="mr-2 size-4" />
                Hapus Kategori
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
