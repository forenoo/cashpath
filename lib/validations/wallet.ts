import { z } from "zod";

export const walletTypeEnum = z.enum(["bank", "e-wallet", "cash"]);

export const createWalletSchema = z.object({
  name: z
    .string()
    .min(1, "Nama dompet wajib diisi")
    .max(50, "Nama dompet maksimal 50 karakter"),
  type: walletTypeEnum,
  balance: z.number().int().default(0),
});

export const updateWalletSchema = createWalletSchema.partial();

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type WalletType = z.infer<typeof walletTypeEnum>;
