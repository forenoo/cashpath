"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ImageIcon,
  Loader2Icon,
  ScanIcon,
  UploadIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AddCategoryDialog } from "@/components/add-category-dialog";
import { AddWalletDialog } from "@/components/add-wallet-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Progress } from "@/components/ui/progress";
import {
  useReceiptScanner,
  type ReceiptScanResult,
} from "@/hooks/use-receipt-scanner";
import { useReceiptUpload } from "@/hooks/use-receipt-upload";
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
  SheetTrigger,
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

type AddTransactionSheetProps = {
  children: React.ReactNode;
  categories: Category[];
  wallets: Wallet[];
};

export function AddTransactionSheet({
  children,
  categories,
  wallets,
}: AddTransactionSheetProps) {
  const [open, setOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addWalletDialogOpen, setAddWalletDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    scanReceipt,
    scanProgress,
    isScanning,
    reset: resetScanner,
  } = useReceiptScanner();

  const {
    uploadReceipt,
    uploadProgress,
    isUploading,
    reset: resetUpload,
  } = useReceiptUpload();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    ...trpc.transaction.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["transaction"]] });
      queryClient.invalidateQueries({ queryKey: [["wallet"]] });
      toast.success("Transaksi berhasil ditambahkan");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan transaksi");
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

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file?.type.startsWith("image/")) {
        setReceiptFile(file);
        resetScanner();
        const reader = new FileReader();
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Prepare categories and wallets for scanner
        const categoriesInput = categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        }));
        const walletsInput = wallets.map((w) => ({
          id: w.id,
          name: w.name,
        }));

        // Auto-scan after a brief delay to let the preview load
        setTimeout(async () => {
          const result = await scanReceipt(file, categoriesInput, walletsInput);
          if (result) {
            // Auto-fill form with scanned data
            form.setValue("name", result.name);
            form.setValue("amount", result.amount.toString());
            form.setValue("type", result.type);

            // Parse and set date
            if (result.date) {
              const parsedDate = parse(result.date, "yyyy-MM-dd", new Date());
              if (!Number.isNaN(parsedDate.getTime())) {
                form.setValue("date", parsedDate);
              }
            }

            // Auto-fill category if matched
            if (result.categoryId) {
              form.setValue("categoryId", result.categoryId);
            }

            // Auto-fill wallet if matched
            if (result.walletId) {
              form.setValue("walletId", result.walletId);
            }

            // Auto-fill recurring transaction fields
            if (result.isRecurring) {
              form.setValue("isRecurring", true);
              if (result.frequency) {
                form.setValue("frequency", result.frequency);
              }
            }

            // Set description with merchant and items info
            let description = "";
            if (result.merchant) {
              description = result.merchant;
            }
            if (result.items && result.items.length > 0) {
              const itemsList = result.items
                .slice(0, 5)
                .map((item) => `${item.name} (${item.quantity}x)`)
                .join(", ");
              description = description
                ? `${description} - ${itemsList}`
                : itemsList;
            }
            if (result.description && !description) {
              description = result.description;
            }
            if (description) {
              form.setValue("description", description.slice(0, 500));
            }

            toast.success(
              "Struk berhasil dipindai! Form telah diisi otomatis.",
            );
          }
        }, 300);
      }
    },
    [scanReceipt, form, resetScanner, categories, wallets],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const removeReceipt = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreview(null);
    resetScanner();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetScanner]);

  const handleAIScan = useCallback(async () => {
    if (!receiptFile) return;

    // Prepare categories and wallets for scanner
    const categoriesInput = categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }));
    const walletsInput = wallets.map((w) => ({
      id: w.id,
      name: w.name,
    }));

    const result = await scanReceipt(
      receiptFile,
      categoriesInput,
      walletsInput,
    );
    if (result) {
      // Auto-fill form with scanned data
      form.setValue("name", result.name);
      form.setValue("amount", result.amount.toString());
      form.setValue("type", result.type);

      // Parse and set date
      if (result.date) {
        try {
          const parsedDate = parse(result.date, "yyyy-MM-dd", new Date());
          if (!Number.isNaN(parsedDate.getTime())) {
            form.setValue("date", parsedDate);
          }
        } catch {
          // Keep current date if parsing fails
        }
      }

      // Auto-fill category if matched
      if (result.categoryId) {
        form.setValue("categoryId", result.categoryId);
      }

      // Auto-fill wallet if matched
      if (result.walletId) {
        form.setValue("walletId", result.walletId);
      }

      // Auto-fill recurring transaction fields
      if (result.isRecurring) {
        form.setValue("isRecurring", true);
        if (result.frequency) {
          form.setValue("frequency", result.frequency);
        }
      }

      // Set description with merchant and items info
      let description = "";
      if (result.merchant) {
        description = result.merchant;
      }
      if (result.items && result.items.length > 0) {
        const itemsList = result.items
          .slice(0, 5)
          .map((item) => `${item.name} (${item.quantity}x)`)
          .join(", ");
        description = description ? `${description} - ${itemsList}` : itemsList;
      }
      if (result.description && !description) {
        description = result.description;
      }
      if (description) {
        form.setValue("description", description.slice(0, 500));
      }

      toast.success("Struk berhasil dipindai! Form telah diisi otomatis.");
    }
  }, [receiptFile, scanReceipt, form, categories, wallets]);

  const resetForm = useCallback(() => {
    form.reset();
    setReceiptFile(null);
    setReceiptPreview(null);
    resetScanner();
    resetUpload();
  }, [form, resetScanner, resetUpload]);

  const onSubmit = async (values: TransactionFormValues) => {
    let receiptUrl: string | undefined;

    // Upload receipt if exists
    if (receiptFile) {
      const uploadedUrl = await uploadReceipt(receiptFile);
      if (uploadedUrl) {
        receiptUrl = uploadedUrl;
      }
    }

    createMutation.mutate({
      name: values.name,
      type: values.type,
      amount: Number.parseInt(values.amount, 10),
      date: values.date,
      categoryId: values.categoryId,
      walletId: values.walletId,
      isRecurring: values.isRecurring,
      frequency: values.isRecurring ? values.frequency : undefined,
      description: values.description || undefined,
      receiptUrl,
    });
  };

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      setOpen(newOpen);
    },
    [resetForm],
  );

  const formatAmountInput = (value: string) => value.replace(/[^\d]/g, "");

  return (
    <>
      <Sheet onOpenChange={handleOpenChange} open={open}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="w-full p-0 sm:max-w-lg" side="right">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="text-xl">Tambah Transaksi Baru</SheetTitle>
            <SheetDescription>
              Catat transaksi keuangan Anda. Anda juga dapat memindai struk
              untuk mengisi data secara otomatis.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <Form {...form}>
              <form
                className="space-y-6 p-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* AI Receipt Scanner */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ScanIcon className="size-4" />
                    Scan Struk
                  </Label>
                  {receiptPreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-lg border-2 border-border border-solid">
                        <Image
                          alt="Receipt preview"
                          className="h-40 w-full rounded-lg object-cover"
                          height={1000}
                          src={receiptPreview}
                          width={1000}
                        />
                        <Button
                          className="absolute top-2 right-2 size-7"
                          onClick={removeReceipt}
                          size="icon"
                          type="button"
                          variant="destructive"
                          disabled={isScanning}
                        >
                          <XIcon className="size-4" />
                        </Button>
                        <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
                          <span className="rounded bg-black/60 px-2 py-1 text-white text-xs">
                            {receiptFile?.name}
                          </span>
                          {scanProgress.stage === "complete" ? (
                            <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white text-xs">
                              <CheckCircle2Icon className="size-3" />
                              Berhasil
                            </span>
                          ) : scanProgress.stage === "error" ? (
                            <span className="flex items-center gap-1 rounded bg-destructive px-2 py-1 text-white text-xs">
                              <XCircleIcon className="size-3" />
                              Gagal
                            </span>
                          ) : (
                            <Button
                              className="h-7 text-xs"
                              size="sm"
                              type="button"
                              variant="secondary"
                              onClick={handleAIScan}
                              disabled={isScanning}
                            >
                              {isScanning ? (
                                <>
                                  <Loader2Icon className="mr-1 size-3 animate-spin" />
                                  Memindai...
                                </>
                              ) : (
                                <>
                                  <ScanIcon className="mr-1 size-3" />
                                  Scan dengan AI
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Progress Bar */}
                      {(isScanning ||
                        scanProgress.stage === "complete" ||
                        scanProgress.stage === "error") && (
                        <div className="space-y-2">
                          <Progress
                            value={scanProgress.progress}
                            className={
                              scanProgress.stage === "error"
                                ? "[&>div]:bg-destructive"
                                : scanProgress.stage === "complete"
                                  ? "[&>div]:bg-green-500"
                                  : ""
                            }
                          />
                          <p
                            className={`text-xs ${scanProgress.stage === "error" ? "text-destructive" : scanProgress.stage === "complete" ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {scanProgress.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className={cn(
                        "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50",
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      type="button"
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                      <p className="mb-3 text-center text-muted-foreground text-sm">
                        Drag & drop gambar struk di sini, atau
                      </p>
                      <span className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 font-medium text-sm shadow-xs hover:bg-accent hover:text-accent-foreground">
                        <UploadIcon className="size-4" />
                        Pilih File
                      </span>
                      <input
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileInputChange}
                        ref={fileInputRef}
                        type="file"
                      />
                    </button>
                  )}
                </div>

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
                            htmlFor="expense"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="expense"
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
                            htmlFor="income"
                          >
                            <RadioGroupItem
                              className="sr-only"
                              id="income"
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

                {/* Frequency Selection (shown when recurring is enabled) */}
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

                {/* Description (Optional) */}
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
                    disabled={createMutation.isPending || isUploading}
                    onClick={() => setOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={createMutation.isPending || isUploading}
                    type="submit"
                  >
                    {isUploading ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Mengunggah struk...
                      </>
                    ) : createMutation.isPending ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Transaksi"
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
