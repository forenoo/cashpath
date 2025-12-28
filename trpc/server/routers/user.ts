import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { updateProfileSchema } from "@/lib/validations/user";
import { createTRPCRouter, protectedProcedure } from "../init";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return profile;
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(user)
        .set({
          name: input.name,
          image: input.image,
        })
        .where(eq(user.id, ctx.user.id))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        });

      return updated;
    }),
});
