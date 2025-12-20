"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTRPC } from "@/trpc/client";

const addAmountFormSchema = z.object({
  amount: z.string().min(1, "Jumlah wajib diisi"),
});

type AddAmountFormValues = z.infer<typeof addAmountFormSchema>;

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
} | null;

type AddAmountToGoalDialogProps = {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: {
    newlyCompletedMilestones: string[];
    isGoalCompleted: boolean;
  }) => void;
};

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function AddAmountToGoalDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: AddAmountToGoalDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<AddAmountFormValues>({
    resolver: zodResolver(addAmountFormSchema),
    defaultValues: {
      amount: "",
    },
  });

  const addAmountMutation = useMutation({
    ...trpc.goal.addAmount.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });

      if (data.isGoalCompleted) {
        toast.success("🎉 Selamat! Goal tercapai!", {
          description: `Kamu berhasil mencapai target ${goal?.name}!`,
        });
      } else if (data.newlyCompletedMilestones.length > 0) {
        toast.success("🌟 Milestone tercapai!", {
          description: `${data.newlyCompletedMilestones.length} milestone baru selesai!`,
        });
      } else {
        toast.success("Tabungan berhasil ditambahkan!");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.({
        newlyCompletedMilestones: data.newlyCompletedMilestones,
        isGoalCompleted: data.isGoalCompleted,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan tabungan");
    },
  });

  const onSubmit = (values: AddAmountFormValues) => {
    if (!goal) return;

    addAmountMutation.mutate({
      goalId: goal.id,
      amount: Number.parseInt(values.amount.replace(/\D/g, ""), 10),
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const formatAmountInput = (value: string) => value.replace(/[^\d]/g, "");

  const formatDisplayAmount = (value: string) => {
    if (!value) return "";
    const numValue = Number.parseInt(value.replace(/\D/g, ""), 10);
    return Number.isNaN(numValue) ? "" : numValue.toLocaleString("id-ID");
  };

  const currentProgress = goal
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const amountValue = form.watch("amount");
  const newAmount = amountValue
    ? Number.parseInt(amountValue.replace(/\D/g, ""), 10) || 0
    : 0;
  const projectedTotal = (goal?.currentAmount ?? 0) + newAmount;
  const projectedProgress = goal
    ? Math.min((projectedTotal / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Tambah Tabungan
          </DialogTitle>
          <DialogDescription>
            Tambahkan jumlah tabungan untuk goal{" "}
            <span className="font-medium text-foreground">{goal?.name}</span>
          </DialogDescription>
        </DialogHeader>

        {goal && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress saat ini</span>
              <span className="font-medium">
                {formatCurrency(goal.currentAmount)} /{" "}
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <Progress value={currentProgress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              {currentProgress.toFixed(1)}% tercapai
            </p>
          </div>
        )}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Tabungan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        className="pl-10"
                        inputMode="numeric"
                        placeholder="100.000"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatAmountInput(e.target.value);
                          field.onChange(formatted);
                        }}
                        value={formatDisplayAmount(field.value)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Masukkan jumlah yang ingin kamu tabung.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {newAmount > 0 && goal && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Proyeksi setelah menabung:
                </p>
                <div className="flex justify-between text-sm">
                  <span>Total tabungan</span>
                  <span className="font-medium">
                    {formatCurrency(projectedTotal)}
                  </span>
                </div>
                <Progress value={projectedProgress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">
                  {projectedProgress.toFixed(1)}% tercapai
                  {projectedProgress >= 100 && " 🎉"}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={addAmountMutation.isPending}>
                {addAmountMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <PlusCircleIcon className="h-4 w-4" />
                    Tambah
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
