"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarIcon,
  RocketIcon,
  TargetIcon,
  TurtleIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { ScrollArea } from "./ui/scroll-area";

const goalFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama goal wajib diisi")
    .max(100, "Nama goal maksimal 100 karakter"),
  targetAmount: z.string().min(1, "Target tabungan wajib diisi"),
  targetDate: z.date().optional(),
  milestonePace: z.enum(["aggressive", "moderate", "relaxed"]),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

type AddGoalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (goalId: string) => void;
};

const paceOptions = [
  {
    value: "aggressive" as const,
    label: "Agresif",
    description: "3 milestone, tantangan lebih besar",
    icon: RocketIcon,
  },
  {
    value: "moderate" as const,
    label: "Moderat",
    description: "4 milestone, seimbang",
    icon: TargetIcon,
  },
  {
    value: "relaxed" as const,
    label: "Santai",
    description: "5 milestone, langkah kecil",
    icon: TurtleIcon,
  },
];

export function AddGoalSheet({
  open,
  onOpenChange,
  onSuccess,
}: AddGoalSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      targetDate: undefined,
      milestonePace: "moderate",
    },
  });

  const createMutation = useMutation({
    ...trpc.goal.create.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      toast.success("Goal berhasil dibuat! 🎯", {
        description: "Milestone telah di-generate otomatis.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.(data?.id ?? "");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat goal");
    },
  });

  const onSubmit = (values: GoalFormValues) => {
    createMutation.mutate({
      name: values.name,
      targetAmount: Number.parseInt(values.targetAmount.replace(/\D/g, ""), 10),
      targetDate: values.targetDate,
      milestonePace: values.milestonePace,
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
      <SheetContent side="right" className="w-full sm:max-w-md gap-0">
        <SheetHeader className="p-6">
          <SheetTitle className="text-xl">Buat Goal Baru</SheetTitle>
          <SheetDescription>
            Tetapkan target tabunganmu dan kami akan membuatkan milestone.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <Form {...form}>
            <form
              className="space-y-6 px-6"
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
                    <FormDescription>
                      Berapa jumlah yang ingin kamu capai?
                    </FormDescription>
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Kapan kamu ingin mencapai goal ini?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="milestonePace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pace Milestone</FormLabel>
                    <FormDescription>
                      Pilih tingkat kesulitan milestone yang akan di-generate.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {paceOptions.map((option) => (
                          <Label
                            key={option.value}
                            htmlFor={`pace-${option.value}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors font-normal",
                              field.value === option.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={`pace-${option.value}`}
                            />
                            <option.icon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {option.label}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {option.description}
                              </p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
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
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Membuat...
                    </>
                  ) : (
                    "Buat Goal"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
