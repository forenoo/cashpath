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

        console.log("[Storage Router] Generating presigned URL:", {
          key,
          contentType: input.contentType,
          userId: ctx.user.id,
        });

        const { uploadUrl, publicUrl } = await generatePresignedUploadUrl({
          key,
          contentType: input.contentType,
          expiresIn: 300,
        });

        console.log("[Storage Router] Presigned URL generated successfully:", {
          publicUrl,
          uploadUrlGenerated: !!uploadUrl,
        });

        return {
          uploadUrl,
          publicUrl,
          key,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${error}`,
        });
      }
    }),
});
