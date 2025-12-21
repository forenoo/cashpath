"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Receipt } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import type { ScenarioItem } from "@/lib/validations/simulation";

const formSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  amount: z.string().min(1, "Jumlah harus diisi"),
  type: z.enum(["income", "expense"]),
});

type FormValues = z.infer<typeof formSchema>;

type ScenarioItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: ScenarioItem) => void;
  editItem?: ScenarioItem | null;
  defaultType?: "income" | "expense";
};

export function ScenarioItemDialog({
  open,
  onOpenChange,
  onSave,
  editItem,
  defaultType = "expense",
}: ScenarioItemDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      type: defaultType,
    },
  });

  // Reset form when dialog opens/closes or editItem changes
  useEffect(() => {
    if (open) {
      if (editItem) {
        form.reset({
          name: editItem.name,
          amount: editItem.amount.toString(),
          type: editItem.type,
        });
      } else {
        form.reset({
          name: "",
          amount: "",
          type: defaultType,
        });
      }
    }
  }, [open, editItem, defaultType, form]);

  const handleSubmit = (values: FormValues) => {
    const item: ScenarioItem = {
      id: editItem?.id ?? crypto.randomUUID(),
      name: values.name,
      amount: Number.parseInt(values.amount.replace(/\D/g, ""), 10) || 0,
      type: values.type,
    };

    onSave(item);
    onOpenChange(false);
    form.reset();
  };

  const isEditing = !!editItem;
  const watchType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Item" : "Tambah Item Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah detail item skenario"
              : "Tambahkan pemasukan atau pengeluaran baru ke skenario"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Type Selector */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange("income")}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 transition-all",
                        field.value === "income"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                          : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5",
                      )}
                    >
                      <Banknote className="size-5" />
                      <span className="font-medium">Pemasukan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("expense")}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 transition-all",
                        field.value === "expense"
                          ? "border-rose-500 bg-rose-500/10 text-rose-600"
                          : "border-border hover:border-rose-500/50 hover:bg-rose-500/5",
                      )}
                    >
                      <Receipt className="size-5" />
                      <span className="font-medium">Pengeluaran</span>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        watchType === "income"
                          ? "cth: Gaji Bulanan"
                          : "cth: Kopi Harian"
                      }
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
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        className="pl-10"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const formatted = value
                            ? Number.parseInt(value, 10).toLocaleString("id-ID")
                            : "";
                          field.onChange(formatted);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className={cn(
                  watchType === "income"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {isEditing ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

