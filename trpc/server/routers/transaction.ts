import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, desc, sql, like } from "drizzle-orm";
import { z } from "zod";
import { transaction, wallet } from "@/db/schema";
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsSchema,
} from "@/lib/validations/transaction";
import { createTRPCRouter, protectedProcedure } from "../init";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        type,
        categoryId,
        walletId,
        startDate,
        endDate,
        search,
      } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(transaction.userId, ctx.user.id)];

      if (type) {
        conditions.push(eq(transaction.type, type));
      }

      if (categoryId) {
        conditions.push(eq(transaction.categoryId, categoryId));
      }

      if (walletId) {
        conditions.push(eq(transaction.walletId, walletId));
      }

      if (startDate) {
        conditions.push(gte(transaction.date, startDate));
      }

      if (endDate) {
        conditions.push(lte(transaction.date, endDate));
      }

      if (search) {
        conditions.push(like(transaction.name, `%${search}%`));
      }

      const whereClause = and(...conditions);

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(transaction)
        .where(whereClause);

      const totalCount = Number(countResult?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated data with relations
      const data = await ctx.db.query.transaction.findMany({
        where: whereClause,
        with: {
          category: true,
          wallet: true,
        },
        orderBy: [desc(transaction.date), desc(transaction.createdAt)],
        limit,
        offset,
      });

      return {
        data,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, input.id),
          eq(transaction.userId, ctx.user.id),
        ),
        with: {
          category: true,
          wallet: true,
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaksi tidak ditemukan",
        });
      }

      return result;
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();

      // Verify category belongs to user
      const categoryExists = await ctx.db.query.category.findFirst({
        where: and(
          eq(sql`id`, input.categoryId),
          eq(sql`user_id`, ctx.user.id),
        ),
      });

      if (!categoryExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kategori tidak valid",
        });
      }

      // Verify wallet belongs to user
      const walletExists = await ctx.db.query.wallet.findFirst({
        where: and(
          eq(wallet.id, input.walletId),
          eq(wallet.userId, ctx.user.id),
        ),
      });

      if (!walletExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dompet tidak valid",
        });
      }

      const [newTransaction] = await ctx.db
        .insert(transaction)
        .values({
          id,
          name: input.name,
          type: input.type,
          amount: input.amount,
          date: input.date,
          categoryId: input.categoryId,
          walletId: input.walletId,
          isRecurring: input.isRecurring,
          frequency: input.isRecurring ? input.frequency : null,
          description: input.description,
          receiptUrl: input.receiptUrl,
          userId: ctx.user.id,
        })
        .returning();

      // Update wallet balance
      const balanceChange =
        input.type === "income" ? input.amount : -input.amount;
      await ctx.db
        .update(wallet)
        .set({ balance: sql`${wallet.balance} + ${balanceChange}` })
        .where(eq(wallet.id, input.walletId));

      return newTransaction;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateTransactionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, input.id),
          eq(transaction.userId, ctx.user.id),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaksi tidak ditemukan",
        });
      }

      // If amount or type changed, update wallet balance
      const newAmount = input.data.amount ?? existing.amount;
      const newType = input.data.type ?? existing.type;
      const newWalletId = input.data.walletId ?? existing.walletId;

      // Revert old transaction effect on old wallet
      const oldBalanceChange =
        existing.type === "income" ? -existing.amount : existing.amount;
      await ctx.db
        .update(wallet)
        .set({ balance: sql`${wallet.balance} + ${oldBalanceChange}` })
        .where(eq(wallet.id, existing.walletId));

      // Apply new transaction effect on new wallet
      const newBalanceChange = newType === "income" ? newAmount : -newAmount;
      await ctx.db
        .update(wallet)
        .set({ balance: sql`${wallet.balance} + ${newBalanceChange}` })
        .where(eq(wallet.id, newWalletId));

      const [updated] = await ctx.db
        .update(transaction)
        .set({
          ...input.data,
          frequency:
            input.data.isRecurring === false ? null : input.data.frequency,
        })
        .where(eq(transaction.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, input.id),
          eq(transaction.userId, ctx.user.id),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaksi tidak ditemukan",
        });
      }

      // Revert wallet balance
      const balanceChange =
        existing.type === "income" ? -existing.amount : existing.amount;
      await ctx.db
        .update(wallet)
        .set({ balance: sql`${wallet.balance} + ${balanceChange}` })
        .where(eq(wallet.id, existing.walletId));

      await ctx.db.delete(transaction).where(eq(transaction.id, input.id));

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(transaction.userId, ctx.user.id)];

      if (input.startDate) {
        conditions.push(gte(transaction.date, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(transaction.date, input.endDate));
      }

      const whereClause = and(...conditions);

      const [incomeResult] = await ctx.db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(transaction)
        .where(and(whereClause, eq(transaction.type, "income")));

      const [expenseResult] = await ctx.db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(transaction)
        .where(and(whereClause, eq(transaction.type, "expense")));

      const totalIncome = Number(incomeResult?.total ?? 0);
      const totalExpense = Number(expenseResult?.total ?? 0);
      const balance = totalIncome - totalExpense;

      // Get transaction count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(transaction)
        .where(whereClause);

      return {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: Number(countResult?.count ?? 0),
      };
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.query.transaction.findMany({
        where: eq(transaction.userId, ctx.user.id),
        with: {
          category: true,
          wallet: true,
        },
        orderBy: [desc(transaction.date), desc(transaction.createdAt)],
        limit: input.limit,
      });

      return data;
    }),
});
