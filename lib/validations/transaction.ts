import { z } from "zod";

export const transactionTypeEnum = z.enum(["income", "expense"]);
export const frequencyEnum = z.enum(["daily", "weekly", "monthly", "yearly"]);

export const createTransactionSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama transaksi wajib diisi")
      .max(100, "Nama transaksi maksimal 100 karakter"),
    type: transactionTypeEnum,
    amount: z.number().int().positive("Jumlah harus lebih dari 0"),
    date: z.coerce.date(),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    walletId: z.string().min(1, "Dompet wajib dipilih"),
    isRecurring: z.boolean().default(false),
    frequency: frequencyEnum.optional(),
    description: z
      .string()
      .max(500, "Deskripsi maksimal 500 karakter")
      .optional(),
    receiptUrl: z.string().url().optional(),
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

export const updateTransactionSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama transaksi wajib diisi")
      .max(100, "Nama transaksi maksimal 100 karakter")
      .optional(),
    type: transactionTypeEnum.optional(),
    amount: z.number().int().positive("Jumlah harus lebih dari 0").optional(),
    date: z.coerce.date().optional(),
    categoryId: z.string().min(1).optional(),
    walletId: z.string().min(1).optional(),
    isRecurring: z.boolean().optional(),
    frequency: frequencyEnum.optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    receiptUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isRecurring === true && !data.frequency) {
        return false;
      }
      return true;
    },
    {
      message: "Frekuensi wajib dipilih untuk transaksi berulang",
      path: ["frequency"],
    },
  );

export const getTransactionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  type: transactionTypeEnum.optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;
export type TransactionType = z.infer<typeof transactionTypeEnum>;
export type Frequency = z.infer<typeof frequencyEnum>;
