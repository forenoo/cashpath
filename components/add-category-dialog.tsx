"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";
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

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .max(50, "Nama kategori maksimal 50 karakter"),
  type: z.enum(["income", "expense", "both"], {
    message: "Tipe kategori wajib dipilih",
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "income" | "expense" | "both";
  onSuccess?: (categoryId: string) => void;
};

const typeLabels = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  both: "Keduanya",
};

export function AddCategoryDialog({
  open,
  onOpenChange,
  defaultType = "both",
  onSuccess,
}: AddCategoryDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: defaultType,
    },
  });

  const createMutation = useMutation({
    ...trpc.category.create.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["category"]] });
      toast.success("Kategori berhasil ditambahkan");
      form.reset();
      onOpenChange(false);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan kategori");
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    createMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({ name: "", type: defaultType });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kategori Baru</DialogTitle>
          <DialogDescription>
            Buat kategori baru untuk mengelompokkan transaksi Anda.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Makanan & Minuman" {...field} />
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
                  <FormLabel>Tipe Kategori</FormLabel>
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

            <DialogFooter className="gap-2 sm:gap-0">
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
                  "Simpan Kategori"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
