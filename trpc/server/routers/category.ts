import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { category, transaction } from "@/db/schema";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import { createTRPCRouter, protectedProcedure } from "../init";

export const categoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.query.category.findMany({
      where: eq(category.userId, ctx.user.id),
      orderBy: (category, { asc }) => [asc(category.name)],
    });
    return categories;
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.query.category.findMany({
      where: eq(category.userId, ctx.user.id),
    });

    const stats = await Promise.all(
      categories.map(async (c) => {
        const [transactionStats] = await ctx.db
          .select({
            totalTransactions: sql<number>`count(*)::int`,
            totalAmount: sql<number>`COALESCE(SUM(${transaction.amount}), 0)::int`,
          })
          .from(transaction)
          .where(eq(transaction.categoryId, c.id));

        return {
          categoryId: c.id,
          totalTransactions: transactionStats?.totalTransactions ?? 0,
          totalAmount: transactionStats?.totalAmount ?? 0,
        };
      }),
    );

    return stats;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.category.findFirst({
        where: and(eq(category.id, input.id), eq(category.userId, ctx.user.id)),
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kategori tidak ditemukan",
        });
      }

      return result;
    }),

  create: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [newCategory] = await ctx.db
        .insert(category)
        .values({
          id,
          name: input.name,
          type: input.type,
          icon: input.icon,
          userId: ctx.user.id,
        })
        .returning();

      return newCategory;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateCategorySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.category.findFirst({
        where: and(eq(category.id, input.id), eq(category.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kategori tidak ditemukan",
        });
      }

      const [updated] = await ctx.db
        .update(category)
        .set(input.data)
        .where(eq(category.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.category.findFirst({
        where: and(eq(category.id, input.id), eq(category.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kategori tidak ditemukan",
        });
      }

      await ctx.db.delete(category).where(eq(category.id, input.id));

      return { success: true };
    }),
});
