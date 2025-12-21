import { z } from "zod";

export const goalStatusEnum = z.enum(["active", "completed", "cancelled"]);

export const milestonePaceEnum = z.enum(["aggressive", "moderate", "relaxed"]);

export const createGoalSchema = z.object({
  name: z
    .string()
    .min(1, "Nama goal wajib diisi")
    .max(100, "Nama goal maksimal 100 karakter"),
  targetAmount: z
    .number()
    .int("Target harus berupa bilangan bulat")
    .positive("Target harus lebih dari 0")
    .max(999999999999, "Target maksimal 999.999.999.999"),
  targetDate: z
    .date()
    .optional()
    .refine(
      (date) => !date || date > new Date(),
      "Target tanggal harus di masa depan",
    ),
  currentAmount: z.number().int().min(0).default(0),
  milestonePace: milestonePaceEnum.default("moderate"),
});

export const updateGoalSchema = z.object({
  name: z
    .string()
    .min(1, "Nama goal wajib diisi")
    .max(100, "Nama goal maksimal 100 karakter")
    .optional(),
  targetAmount: z
    .number()
    .int("Target harus berupa bilangan bulat")
    .positive("Target harus lebih dari 0")
    .max(999999999999, "Target maksimal 999.999.999.999")
    .optional(),
  targetDate: z.date().nullable().optional(),
  currentAmount: z.number().int().min(0).optional(),
  status: goalStatusEnum.optional(),
});

export const regenerateMilestonesSchema = z.object({
  goalId: z.string().min(1, "Goal ID wajib diisi"),
  pace: milestonePaceEnum.default("moderate"),
  customMilestoneCount: z.number().int().min(2).max(10).optional(),
});

export const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().int().positive().optional(),
  targetDate: z.date().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export const addAmountToGoalSchema = z.object({
  goalId: z.string().min(1, "Goal ID wajib diisi"),
  walletId: z.string().min(1, "Pilih dompet sumber"),
  amount: z
    .number()
    .int("Jumlah harus berupa bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
});

export const removeAmountFromGoalSchema = z.object({
  goalId: z.string().min(1, "Goal ID wajib diisi"),
  walletId: z.string().min(1, "Pilih dompet tujuan"),
  amount: z
    .number()
    .int("Jumlah harus berupa bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
});

export type GoalStatus = z.infer<typeof goalStatusEnum>;
export type MilestonePace = z.infer<typeof milestonePaceEnum>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type RegenerateMilestonesInput = z.infer<
  typeof regenerateMilestonesSchema
>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type AddAmountToGoalInput = z.infer<typeof addAmountToGoalSchema>;
export type RemoveAmountFromGoalInput = z.infer<
  typeof removeAmountFromGoalSchema
>;
