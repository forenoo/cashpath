import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(50, "Nama maksimal 50 karakter"),
  image: z.string().url("URL gambar tidak valid").optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
