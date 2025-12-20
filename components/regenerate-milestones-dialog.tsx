"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2Icon,
  RefreshCwIcon,
  RocketIcon,
  TargetIcon,
  TurtleIcon,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const regenerateFormSchema = z.object({
  pace: z.enum(["aggressive", "moderate", "relaxed"]),
  customMilestoneCount: z.string().optional(),
});

type RegenerateFormValues = z.infer<typeof regenerateFormSchema>;

type RegenerateMilestonesDialogProps = {
  goalId: string | null;
  goalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function RegenerateMilestonesDialog({
  goalId,
  goalName,
  open,
  onOpenChange,
  onSuccess,
}: RegenerateMilestonesDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<RegenerateFormValues>({
    resolver: zodResolver(regenerateFormSchema),
    defaultValues: {
      pace: "moderate",
      customMilestoneCount: "",
    },
  });

  const regenerateMutation = useMutation({
    ...trpc.goal.regenerateMilestones.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["goal"]] });
      toast.success("Milestone berhasil di-regenerate! 🎯", {
        description: "Milestone baru telah dibuat sesuai preferensimu.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal regenerate milestone");
    },
  });

  const onSubmit = (values: RegenerateFormValues) => {
    if (!goalId) return;

    regenerateMutation.mutate({
      goalId,
      pace: values.pace,
      customMilestoneCount: values.customMilestoneCount
        ? Number.parseInt(values.customMilestoneCount, 10)
        : undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCwIcon className="h-5 w-5" />
            Regenerate Milestone
          </DialogTitle>
          <DialogDescription>
            Generate ulang milestone untuk goal{" "}
            <span className="font-medium text-foreground">{goalName}</span>{" "}
            dengan pengaturan baru.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="pace"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Pace Milestone</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      {paceOptions.map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={`regen-pace-${option.value}`}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors font-normal",
                            field.value === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`regen-pace-${option.value}`}
                          />
                          <option.icon className="h-4 w-4 text-muted-foreground" />
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

            <FormField
              control={form.control}
              name="customMilestoneCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah Milestone Custom{" "}
                    <span className="font-normal text-muted-foreground">
                      (Opsional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      max={10}
                      placeholder="Kosongkan untuk menggunakan default dari pace"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Override jumlah milestone (2-10). Kosongkan untuk
                    menggunakan default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={regenerateMutation.isPending}>
                {regenerateMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Regenerate
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
