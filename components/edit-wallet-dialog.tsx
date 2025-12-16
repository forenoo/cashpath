"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";

const walletFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama dompet wajib diisi")
    .max(50, "Nama dompet maksimal 50 karakter"),
  type: z.enum(["bank", "e-wallet", "cash"], {
    message: "Tipe dompet wajib dipilih",
  }),
  balance: z.string().optional(),
});

type WalletFormValues = z.infer<typeof walletFormSchema>;

type Wallet = {
  id: string;
  name: string;
  type: "bank" | "e-wallet" | "cash";
  balance: number;
};

type EditWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
};

const typeLabels = {
  bank: "Bank",
  "e-wallet": "E-Wallet",
  cash: "Tunai",
};

export function EditWalletDialog({
  open,
  onOpenChange,
  wallet,
}: EditWalletDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: "",
      type: "bank",
      balance: "",
    },
  });

  // Reset form when wallet changes
  useEffect(() => {
    if (wallet) {
      form.reset({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance.toString(),
      });
    }
  }, [wallet, form]);

  const updateMutation = useMutation({
    ...trpc.wallet.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Dompet berhasil diperbarui");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui dompet");
    },
  });

  const onSubmit = (values: WalletFormValues) => {
    if (!wallet) return;

    updateMutation.mutate({
      id: wallet.id,
      data: {
        name: values.name,
        type: values.type,
        balance: values.balance ? Number.parseInt(values.balance, 10) : 0,
      },
    });
  };

  const formatAmountInput = (value: string) => value.replace(/[^\d]/g, "");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Dompet</DialogTitle>
          <DialogDescription>Perbarui informasi dompet Anda.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Dompet</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Bank BCA, GoPay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Dompet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        className="pl-10"
                        inputMode="numeric"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatAmountInput(e.target.value);
                          field.onChange(formatted);
                        }}
                        value={
                          field.value
                            ? Number.parseInt(field.value, 10).toLocaleString(
                              "id-ID",
                            )
                            : ""
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Saldo dompet saat ini.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                disabled={updateMutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Batal
              </Button>
              <Button disabled={updateMutation.isPending} type="submit">
                {updateMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
