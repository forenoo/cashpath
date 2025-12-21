"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const editGoalFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama goal wajib diisi")
    .max(100, "Nama goal maksimal 100 karakter"),
  targetAmount: z.string().min(1, "Target tabungan wajib diisi"),
  targetDate: z.date().nullable().optional(),
  status: z.enum(["active", "completed", "cancelled"]),
});

type EditGoalFormValues = z.infer<typeof editGoalFormSchema>;

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  status: "active" | "completed" | "cancelled";
};

type EditGoalSheetProps = {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const statusLabels = {
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export function EditGoalSheet({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: EditGoalSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<EditGoalFormValues>({
    resolver: zodResolver(editGoalFormSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      targetDate: null,
      status: "active",
    },
  });

  // Update form when goal changes
  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        targetDate: goal.targetDate,
        status: goal.status,
      });
    }
  }, [goal, form]);

  const updateMutation = useMutation({
    ...trpc.goal.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      toast.success("Goal berhasil diperbarui!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui goal");
    },
  });

  const onSubmit = (values: EditGoalFormValues) => {
    if (!goal) return;

    updateMutation.mutate({
      id: goal.id,
      data: {
        name: values.name,
        targetAmount: Number.parseInt(
          values.targetAmount.replace(/\D/g, ""),
          10,
        ),
        targetDate: values.targetDate,
        status: values.status,
      },
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

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetContent className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-xl">Edit Goal</SheetTitle>
          <SheetDescription>Perbarui detail goal tabunganmu.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="p-6 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Goal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Dana Darurat, Liburan ke Jepang"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Tabungan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        className="pl-10"
                        inputMode="numeric"
                        placeholder="10.000.000"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatAmountInput(e.target.value);
                          field.onChange(formatted);
                        }}
                        value={formatDisplayAmount(field.value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Target Tanggal{" "}
                    <span className="font-normal text-muted-foreground">
                      (Opsional)
                    </span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: id })
                          ) : (
                            <span>Pilih tanggal target</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
