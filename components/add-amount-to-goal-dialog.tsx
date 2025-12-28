"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BanknoteIcon, PlusCircleIcon, WalletIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const addAmountFormSchema = z.object({
  walletId: z.string().min(1, "Pilih dompet sumber"),
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

const walletTypeIcons = {
  bank: "🏦",
  "e-wallet": "📱",
  cash: "💵",
};

export function AddAmountToGoalDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: AddAmountToGoalDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch user's wallets
  const { data: wallets, isLoading: walletsLoading } = useQuery(
    trpc.wallet.getAll.queryOptions(),
  );

  const form = useForm<AddAmountFormValues>({
    resolver: zodResolver(addAmountFormSchema),
    defaultValues: {
      walletId: "",
      amount: "",
    },
  });

  const selectedWalletId = form.watch("walletId");
  const selectedWallet = wallets?.find((w) => w.id === selectedWalletId);

  const addAmountMutation = useMutation({
    ...trpc.goal.addAmount.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });

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
      walletId: values.walletId,
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

  const insufficientBalance =
    selectedWallet && newAmount > selectedWallet.balance;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Tambah Tabungan
          </DialogTitle>
          <DialogDescription className="text-left">
            Alokasikan dana dari dompet ke goal{" "}
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
            <p className="text-left text-xs text-muted-foreground">
              {currentProgress.toFixed(1)}% tercapai
            </p>
          </div>
        )}

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dompet Sumber</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={walletsLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih dompet">
                          {selectedWallet && (
                            <span className="flex items-center gap-2">
                              <span>
                                {walletTypeIcons[selectedWallet.type]}
                              </span>
                              <span>{selectedWallet.name}</span>
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!wallets || wallets.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <WalletIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Belum ada dompet</p>
                        </div>
                      ) : (
                        wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span className="flex items-center gap-2">
                                <span>{walletTypeIcons[w.type]}</span>
                                <span>{w.name}</span>
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatCurrency(w.balance)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedWallet && (
                    <FormDescription>
                      Saldo tersedia:{" "}
                      <span className="font-medium">
                        {formatCurrency(selectedWallet.balance)}
                      </span>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        className={cn(
                          "pl-10",
                          insufficientBalance && "border-destructive",
                        )}
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
                  {insufficientBalance ? (
                    <p className="text-xs text-destructive">
                      Saldo dompet tidak mencukupi
                    </p>
                  ) : (
                    <FormDescription>
                      Dana akan dipindahkan dari dompet ke goal ini.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {newAmount > 0 && goal && !insufficientBalance && (
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
                {selectedWallet && (
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BanknoteIcon className="h-3 w-3" />
                        Sisa saldo {selectedWallet.name}
                      </span>
                      <span>
                        {formatCurrency(selectedWallet.balance - newAmount)}
                      </span>
                    </div>
                  </div>
                )}
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
              <Button
                type="submit"
                disabled={
                  addAmountMutation.isPending ||
                  insufficientBalance ||
                  !selectedWalletId
                }
              >
                {addAmountMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" />
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
