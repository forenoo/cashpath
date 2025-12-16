import { TRPCError } from "@trpc/server";
import { generatePresignedUploadUrl } from "@/lib/storage";
import { generateUploadUrlSchema } from "@/lib/validations/storage";
import { createTRPCRouter, protectedProcedure } from "../init";

export const storageRouter = createTRPCRouter({
  generateUploadUrl: protectedProcedure
    .input(generateUploadUrlSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const ext = input.filename.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const randomId = crypto.randomUUID().slice(0, 8);
        const key = `receipts/${ctx.user.id}/${timestamp}-${randomId}.${ext}`;

        const { uploadUrl, publicUrl } = await generatePresignedUploadUrl({
          key,
          contentType: input.contentType,
          expiresIn: 300,
        });

        return {
          uploadUrl,
          publicUrl,
          key,
        };
      } catch (error) {
        console.error("Failed to generate upload URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat URL upload",
        });
      }
    }),
});
