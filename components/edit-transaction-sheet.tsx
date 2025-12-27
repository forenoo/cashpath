"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Category = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
};

type Wallet = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

type Transaction = {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  date: Date;
  isRecurring: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  description: string | null;
  category: {
    id: string;
    name: string;
  };
  wallet: {
    id: string;
    name: string;
  };
};

const frequencies = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
] as const;

const transactionFormSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    name: z
      .string()
      .min(1, "Nama transaksi wajib diisi")
      .max(100, "Nama transaksi maksimal 100 karakter"),
    amount: z
      .string()
      .min(1, "Jumlah wajib diisi")
      .refine((val) => Number.parseInt(val, 10) > 0, {
        message: "Jumlah harus lebih dari 0",
      }),
    date: z.date(),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    walletId: z.string().min(1, "Sumber dompet wajib dipilih"),
    isRecurring: z.boolean(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
    description: z
      .string()
      .max(500, "Deskripsi maksimal 500 karakter")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.frequency) {
        return false;
      }
      return true;
    },
    {
      message: "Frekuensi wajib dipilih untuk transaksi berulang",
      path: ["frequency"],
    },
  );

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

type EditTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
};

export function EditTransactionSheet({
  open,
  onOpenChange,
  transaction,
  categories,
  wallets,
}: EditTransactionSheetProps) {
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addWalletDialogOpen, setAddWalletDialogOpen] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    ...trpc.transaction.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Transaksi berhasil diperbarui");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui transaksi");
    },
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      name: "",
      amount: "",
      date: new Date(),
      categoryId: "",
      walletId: "",
      isRecurring: false,
      frequency: undefined,
      description: "",
    },
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        name: transaction.name,
        amount: transaction.amount.toString(),
        date: new Date(transaction.date),
        categoryId: transaction.category.id,
        walletId: transaction.wallet.id,
        isRecurring: transaction.isRecurring,
        frequency: transaction.frequency || undefined,
        description: transaction.description || "",
      });
    }
  }, [transaction, form]);

  // Filter categories based on selected transaction type
  const transactionType = form.watch("type");
  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionType || cat.type === "both",
  );

  const isRecurring = form.watch("isRecurring");

  // Memoized options for combobox
  const categoryOptions = useMemo(
    () =>
      filteredCategories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    [filteredCategories],
  );

  const walletOptions = useMemo(
    () =>
      wallets.map((w) => ({
        value: w.id,
        label: w.name,
      })),
    [wallets],
  );

  const onSubmit = (values: TransactionFormValues) => {
    if (!transaction) return;

    updateMutation.mutate({
      id: transaction.id,
      data: {
        name: values.name,
        type: values.type,
        amount: Number.parseInt(values.amount, 10),
        date: values.date,
        categoryId: values.categoryId,
        walletId: values.walletId,
        isRecurring: values.isRecurring,
        frequency: values.isRecurring ? values.frequency : null,
        description: values.description || null,
      },
    });
  };

  const formatAmountInput = (value: string) => value.replace(/[^\d]/g, "");

  return (
    <>
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className="w-full p-0 sm:max-w-lg" side="right">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="text-xl">Edit Transaksi</SheetTitle>
            <SheetDescription>
              Perbarui informasi transaksi Anda.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <Form {...form}>
              <form
                className="space-y-6 p-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Transaction Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-3"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <Label
                            className={cn(
                              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors",
                              field.value === "expense"
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-muted hover:border-muted-foreground/50",
                            )}
                            htmlFor="edit-expense"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="edit-expense"
                              value="expense"
                            />
                            <ArrowDownIcon className="size-4" />
                            <span className="font-medium">Pengeluaran</span>
                          </Label>
                          <Label
                            className={cn(
                              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors",
                              field.value === "income"
                                ? "border-green-500 bg-green-500/10 text-green-500"
                                : "border-muted hover:border-muted-foreground/50",
                            )}
                            htmlFor="edit-income"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="edit-income"
                              value="income"
                            />
                            <ArrowUpIcon className="size-4" />
                            <span className="font-medium">Pemasukan</span>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transaction Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Transaksi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Belanja bulanan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
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
                            className="pl-10"
                            inputMode="numeric"
                            placeholder="0"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatAmountInput(
                                e.target.value,
                              );
                              field.onChange(formatted);
                            }}
                            value={
                              field.value
                                ? Number.parseInt(
                                    field.value,
                                    10,
                                  ).toLocaleString("id-ID")
                                : ""
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                              variant="outline"
                            >
                              <CalendarIcon className="mr-2 size-4" />
                              {field.value ? (
                                format(field.value, "dd MMMM yyyy", {
                                  locale: id,
                                })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            autoFocus
                            mode="single"
                            onSelect={field.onChange}
                            selected={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <FormControl>
                        <Combobox
                          options={categoryOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pilih kategori"
                          searchPlaceholder="Cari kategori..."
                          emptyText="Kategori tidak ditemukan."
                          addButtonText="Tambah Kategori"
                          onAddClick={() => setAddCategoryDialogOpen(true)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Wallet Source */}
                <FormField
                  control={form.control}
                  name="walletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sumber Dompet</FormLabel>
                      <FormControl>
                        <Combobox
                          options={walletOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pilih dompet"
                          searchPlaceholder="Cari dompet..."
                          emptyText="Dompet tidak ditemukan."
                          addButtonText="Tambah Dompet"
                          onAddClick={() => setAddWalletDialogOpen(true)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurring Transaction Toggle */}
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel>Transaksi Berulang</FormLabel>
                        <FormDescription>
                          Aktifkan jika transaksi ini berulang secara berkala
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Frequency Selection */}
                {isRecurring ? (
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frekuensi</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih frekuensi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {frequencies.map((freq) => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Deskripsi{" "}
                        <span className="font-normal text-muted-foreground">
                          (Opsional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          placeholder="Tambahkan catatan atau deskripsi..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    disabled={updateMutation.isPending}
                    onClick={() => onOpenChange(false)}
                    type="button"
                    variant="outline"
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={updateMutation.isPending}
                    type="submit"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Spinner className="mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddCategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        defaultType={transactionType}
        onSuccess={(categoryId) => {
          form.setValue("categoryId", categoryId);
        }}
      />

      <AddWalletDialog
        open={addWalletDialogOpen}
        onOpenChange={setAddWalletDialogOpen}
        onSuccess={(walletId) => {
          form.setValue("walletId", walletId);
        }}
      />
    </>
  );
}
