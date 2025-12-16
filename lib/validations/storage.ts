import { z } from "zod";

export const generateUploadUrlSchema = z.object({
  filename: z.string().min(1, "Nama file wajib diisi"),
  contentType: z.string().refine((val) => val.startsWith("image/"), {
    message: "Hanya file gambar yang diizinkan",
  }),
});

export type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlSchema>;
