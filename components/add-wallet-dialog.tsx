"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Spinner } from "@/components/ui/spinner";
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

type AddWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (walletId: string) => void;
};

const typeLabels = {
  bank: "Bank",
  "e-wallet": "E-Wallet",
  cash: "Tunai",
};

export function AddWalletDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddWalletDialogProps) {
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

  const createMutation = useMutation({
    ...trpc.wallet.create.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Dompet berhasil ditambahkan");
      form.reset();
      onOpenChange(false);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan dompet");
    },
  });

  const onSubmit = (values: WalletFormValues) => {
    createMutation.mutate({
      name: values.name,
      type: values.type,
      balance: values.balance ? Number.parseInt(values.balance, 10) : 0,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const formatAmountInput = (value: string) => value.replace(/[^\d]/g, "");

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Dompet Baru</DialogTitle>
          <DialogDescription>
            Buat dompet atau rekening baru untuk mencatat sumber transaksi Anda.
          </DialogDescription>
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
                  <FormLabel>
                    Saldo Awal{" "}
                    <span className="font-normal text-muted-foreground">
                      (Opsional)
                    </span>
                  </FormLabel>
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
                  <FormDescription>
                    Masukkan saldo awal dompet Anda saat ini.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                disabled={createMutation.isPending}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Batal
              </Button>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Dompet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
