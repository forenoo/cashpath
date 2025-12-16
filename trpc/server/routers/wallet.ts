import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { wallet, transaction } from "@/db/schema";
import {
  createWalletSchema,
  updateWalletSchema,
} from "@/lib/validations/wallet";
import { createTRPCRouter, protectedProcedure } from "../init";

export const walletRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await ctx.db.query.wallet.findMany({
      where: eq(wallet.userId, ctx.user.id),
      orderBy: (wallet, { asc }) => [asc(wallet.name)],
    });
    return wallets;
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await ctx.db.query.wallet.findMany({
      where: eq(wallet.userId, ctx.user.id),
    });

    const stats = await Promise.all(
      wallets.map(async (w) => {
        const [transactionStats] = await ctx.db
          .select({
            totalTransactions: sql<number>`count(*)::int`,
            totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)::int`,
            totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)::int`,
          })
          .from(transaction)
          .where(eq(transaction.walletId, w.id));

        return {
          walletId: w.id,
          totalTransactions: transactionStats?.totalTransactions ?? 0,
          totalIncome: transactionStats?.totalIncome ?? 0,
          totalExpense: transactionStats?.totalExpense ?? 0,
        };
      }),
    );

    return stats;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.wallet.findFirst({
        where: and(eq(wallet.id, input.id), eq(wallet.userId, ctx.user.id)),
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      return result;
    }),

  create: protectedProcedure
    .input(createWalletSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const [newWallet] = await ctx.db
        .insert(wallet)
        .values({
          id,
          name: input.name,
          type: input.type,
          balance: input.balance,
          userId: ctx.user.id,
        })
        .returning();

      return newWallet;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateWalletSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wallet.findFirst({
        where: and(eq(wallet.id, input.id), eq(wallet.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      const [updated] = await ctx.db
        .update(wallet)
        .set(input.data)
        .where(eq(wallet.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wallet.findFirst({
        where: and(eq(wallet.id, input.id), eq(wallet.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      await ctx.db.delete(wallet).where(eq(wallet.id, input.id));

      return { success: true };
    }),

  updateBalance: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().int(),
        operation: z.enum(["add", "subtract"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wallet.findFirst({
        where: and(eq(wallet.id, input.id), eq(wallet.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      const newBalance =
        input.operation === "add"
          ? existing.balance + input.amount
          : existing.balance - input.amount;

      const [updated] = await ctx.db
        .update(wallet)
        .set({ balance: newBalance })
        .where(eq(wallet.id, input.id))
        .returning();

      return updated;
    }),
});
