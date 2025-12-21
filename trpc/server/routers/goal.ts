import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { goal, goalTransaction, milestone, wallet } from "@/db/schema";
import {
  addAmountToGoalSchema,
  createGoalSchema,
  type MilestonePace,
  regenerateMilestonesSchema,
  removeAmountFromGoalSchema,
  updateGoalSchema,
  updateMilestoneSchema,
} from "@/lib/validations/goal";
import { createTRPCRouter, protectedProcedure } from "../init";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to generate milestone data (name, advice, and target percentage) using Gemini AI
async function generateMilestonesWithAI(
  goalName: string,
  targetAmount: number,
  currentAmount: number,
  milestoneCount: number,
): Promise<Array<{ name: string; advice: string; targetPercentage: number }>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Gemini API key tidak dikonfigurasi. Tidak dapat membuat milestone.",
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a financial goal planning assistant. Generate ${milestoneCount} milestones for a savings goal.

Goal: "${goalName}"
Target Amount: Rp ${targetAmount.toLocaleString("id-ID")}
Current Savings: Rp ${currentAmount.toLocaleString("id-ID")}
Number of Milestones: ${milestoneCount}

Your task:
1. Generate exactly ${milestoneCount} milestones
2. For each milestone, provide:
   - "name": A motivational name with 1-2 emojis at the start (in Indonesian/Bahasa Indonesia)
   - "advice": A simple, actionable tip to reach this milestone (1-2 sentences, in Indonesian)
   - "targetPercentage": The percentage of the goal this milestone represents (between 10-95)

Requirements:
- Distribute targetPercentage values naturally across the range (don't just use evenly spaced values)
- First milestone should be around 15-25% (early win)
- Last milestone should be around 85-95% (almost there)
- Middle milestones should be spaced logically
- Each name should be unique, creative, and relevant to the savings goal context
- Advice should be specific and actionable for that stage of saving
- All text must be in Indonesian (Bahasa Indonesia)
- Keep names concise (max 3-4 words + emoji)

Return ONLY a valid JSON array, no markdown, no code blocks:
[
  {"name": "🚀 Langkah Pertama", "advice": "Mulai dengan menabung konsisten setiap minggu, sekecil apapun jumlahnya.", "targetPercentage": 20},
  {"name": "⭐ Momentum Terbentuk", "advice": "Pertahankan kebiasaan menabung dan hindari pengeluaran impulsif.", "targetPercentage": 40},
  {"name": "🔥 Lebih dari Setengah", "advice": "Evaluasi budget bulananmu dan cari peluang untuk menabung lebih.", "targetPercentage": 60},
  {"name": "💪 Hampir Sampai", "advice": "Tetap fokus! Jangan tergoda menggunakan tabungan ini untuk hal lain.", "targetPercentage": 85}
]

Generate the milestones now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse JSON from the response
    let milestoneResults: Array<{
      name: string;
      advice: string;
      targetPercentage: number;
    }> = [];

    // Remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);

      if (Array.isArray(parsed) && parsed.length === milestoneCount) {
        milestoneResults = parsed.map((item: unknown) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "name" in item &&
            "advice" in item &&
            "targetPercentage" in item
          ) {
            const percentage = Number(
              (item as { targetPercentage: unknown }).targetPercentage,
            );
            return {
              name: String((item as { name: unknown }).name),
              advice: String((item as { advice: unknown }).advice),
              targetPercentage: Math.max(10, Math.min(95, percentage)),
            };
          }
          throw new Error("Invalid milestone structure");
        });

        // Sort by targetPercentage to ensure proper order
        milestoneResults.sort(
          (a, b) => a.targetPercentage - b.targetPercentage,
        );

        return milestoneResults;
      }
    } catch {
      // Try to extract array from text
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed) && parsed.length === milestoneCount) {
          milestoneResults = parsed.map((item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "name" in item &&
              "advice" in item &&
              "targetPercentage" in item
            ) {
              const percentage = Number(
                (item as { targetPercentage: unknown }).targetPercentage,
              );
              return {
                name: String((item as { name: unknown }).name),
                advice: String((item as { advice: unknown }).advice),
                targetPercentage: Math.max(10, Math.min(95, percentage)),
              };
            }
            throw new Error("Invalid milestone structure");
          });

          milestoneResults.sort(
            (a, b) => a.targetPercentage - b.targetPercentage,
          );

          return milestoneResults;
        }
      }
    }

    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Error generating milestones with AI:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Gagal membuat milestone dengan AI. Silakan coba lagi.",
    });
  }
}

// Helper function to generate milestones based on pace
async function generateMilestones(
  goalName: string,
  currentAmount: number,
  targetAmount: number,
  targetDate: Date | null,
  pace: MilestonePace,
  customCount?: number,
): Promise<
  Array<{
    name: string;
    targetAmount: number;
    targetDate: Date | null;
    order: number;
    advice: string;
  }>
> {
  // Determine number of milestones based on pace
  const milestoneCount =
    customCount ?? (pace === "aggressive" ? 3 : pace === "moderate" ? 4 : 5);

  const now = new Date();
  const dateDifference = targetDate
    ? targetDate.getTime() - now.getTime()
    : null;

  // Generate milestones fully with AI (name, advice, and target percentage)
  const aiMilestones = await generateMilestonesWithAI(
    goalName,
    targetAmount,
    currentAmount,
    milestoneCount,
  );

  // Build final milestones array using AI-generated data
  const milestones = aiMilestones.map((aiMilestone, index) => {
    const progress = aiMilestone.targetPercentage / 100;

    // Calculate milestone amount based on AI-suggested percentage
    const milestoneAmount = Math.round(targetAmount * progress);

    // Calculate milestone date if target date exists
    let milestoneDate: Date | null = null;
    if (dateDifference && targetDate) {
      const milestoneTime = now.getTime() + dateDifference * progress;
      milestoneDate = new Date(milestoneTime);
    }

    return {
      name: aiMilestone.name,
      targetAmount: milestoneAmount,
      targetDate: milestoneDate,
      order: index + 1,
      advice: aiMilestone.advice,
    };
  });

  return milestones;
}

export const goalRouter = createTRPCRouter({
  // Get all goals for current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.query.goal.findMany({
      where: eq(goal.userId, ctx.user.id),
      orderBy: (goal, { desc }) => [desc(goal.createdAt)],
      with: {
        milestones: {
          orderBy: (milestone, { asc }) => [asc(milestone.order)],
        },
      },
    });
    return goals;
  }),

  // Get active goals only
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.query.goal.findMany({
      where: and(eq(goal.userId, ctx.user.id), eq(goal.status, "active")),
      orderBy: (goal, { desc }) => [desc(goal.createdAt)],
      with: {
        milestones: {
          orderBy: (milestone, { asc }) => [asc(milestone.order)],
        },
      },
    });
    return goals;
  }),

  // Get goal by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.user.id)),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      return result;
    }),

  // Create new goal with auto-generated milestones
  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goalId = crypto.randomUUID();

      // Create the goal (currentAmount always starts at 0, funds come from wallets)
      await ctx.db.insert(goal).values({
        id: goalId,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: 0,
        targetDate: input.targetDate ?? null,
        status: "active",
        userId: ctx.user.id,
      });

      // Generate milestones
      const milestonesData = await generateMilestones(
        input.name,
        0,
        input.targetAmount,
        input.targetDate ?? null,
        input.milestonePace,
      );

      // Insert milestones
      if (milestonesData.length > 0) {
        await ctx.db.insert(milestone).values(
          milestonesData.map((m) => ({
            id: crypto.randomUUID(),
            name: m.name,
            targetAmount: m.targetAmount,
            targetDate: m.targetDate,
            order: m.order,
            isCompleted: false,
            advice: m.advice || null,
            goalId: goalId,
          })),
        );
      }

      // Fetch the complete goal with milestones
      const completeGoal = await ctx.db.query.goal.findFirst({
        where: eq(goal.id, goalId),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      if (!completeGoal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat goal",
        });
      }

      return completeGoal;
    }),

  // Update goal (name, targetAmount, targetDate, status only - currentAmount managed via wallet transfers)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateGoalSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Don't allow direct currentAmount updates - must use addAmount/removeAmount
      const { currentAmount: _ignored, ...updateData } = input.data;

      const [updatedGoal] = await ctx.db
        .update(goal)
        .set(updateData)
        .where(eq(goal.id, input.id))
        .returning();

      return updatedGoal;
    }),

  // Delete goal - returns all funds to original wallets, then deletes
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.id), eq(goal.userId, ctx.user.id)),
        with: {
          transactions: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Calculate total amount per wallet from transactions
      const walletAmounts = new Map<string, number>();
      for (const tx of existing.transactions) {
        const current = walletAmounts.get(tx.walletId) || 0;
        walletAmounts.set(tx.walletId, current + tx.amount);
      }

      // Return money to each wallet
      for (const [walletId, amount] of walletAmounts) {
        if (amount > 0) {
          await ctx.db
            .update(wallet)
            .set({
              balance: sql`${wallet.balance} + ${amount}`,
            })
            .where(eq(wallet.id, walletId));
        }
      }

      // Delete the goal (cascades to milestones and transactions)
      await ctx.db.delete(goal).where(eq(goal.id, input.id));

      return {
        success: true,
        returnedAmounts: Object.fromEntries(walletAmounts),
      };
    }),

  // Regenerate milestones for a goal
  regenerateMilestones: protectedProcedure
    .input(regenerateMilestonesSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.goalId), eq(goal.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Delete existing milestones
      await ctx.db.delete(milestone).where(eq(milestone.goalId, input.goalId));

      // Generate new milestones
      const milestonesData = await generateMilestones(
        existing.name,
        existing.currentAmount,
        existing.targetAmount,
        existing.targetDate,
        input.pace,
        input.customMilestoneCount,
      );

      // Insert new milestones
      if (milestonesData.length > 0) {
        await ctx.db.insert(milestone).values(
          milestonesData.map((m) => ({
            id: crypto.randomUUID(),
            name: m.name,
            targetAmount: m.targetAmount,
            targetDate: m.targetDate,
            order: m.order,
            isCompleted: existing.currentAmount >= m.targetAmount,
            completedAt:
              existing.currentAmount >= m.targetAmount ? new Date() : null,
            advice: m.advice || null,
            goalId: input.goalId,
          })),
        );
      }

      // Return updated goal with new milestones
      const updatedGoal = await ctx.db.query.goal.findFirst({
        where: eq(goal.id, input.goalId),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      if (!updatedGoal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal regenerate milestone",
        });
      }

      return updatedGoal;
    }),

  // Add amount to goal (update progress) - deducts from wallet
  addAmount: protectedProcedure
    .input(addAmountToGoalSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify goal exists and belongs to user
      const existing = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.goalId), eq(goal.userId, ctx.user.id)),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Verify wallet exists and belongs to user
      const sourceWallet = await ctx.db.query.wallet.findFirst({
        where: and(
          eq(wallet.id, input.walletId),
          eq(wallet.userId, ctx.user.id),
        ),
      });

      if (!sourceWallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      // Check wallet has sufficient balance
      if (sourceWallet.balance < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Saldo dompet tidak mencukupi. Saldo tersedia: Rp ${sourceWallet.balance.toLocaleString("id-ID")}`,
        });
      }

      const newAmount = existing.currentAmount + input.amount;
      const isCompleted = newAmount >= existing.targetAmount;

      // Deduct from wallet
      await ctx.db
        .update(wallet)
        .set({
          balance: sql`${wallet.balance} - ${input.amount}`,
        })
        .where(eq(wallet.id, input.walletId));

      // Update goal amount
      await ctx.db
        .update(goal)
        .set({
          currentAmount: newAmount,
          status: isCompleted ? "completed" : "active",
        })
        .where(eq(goal.id, input.goalId));

      // Create transaction record with wallet reference
      await ctx.db.insert(goalTransaction).values({
        id: crypto.randomUUID(),
        goalId: input.goalId,
        userId: ctx.user.id,
        walletId: input.walletId,
        amount: input.amount,
        description: `Dari ${sourceWallet.name}`,
      });

      // Check and update milestone completion status
      const newlyCompletedMilestones: string[] = [];

      for (const m of existing.milestones) {
        if (!m.isCompleted && newAmount >= m.targetAmount) {
          await ctx.db
            .update(milestone)
            .set({
              isCompleted: true,
              completedAt: new Date(),
            })
            .where(eq(milestone.id, m.id));
          newlyCompletedMilestones.push(m.id);
        }
      }

      // Return updated goal with milestones
      const updatedGoal = await ctx.db.query.goal.findFirst({
        where: eq(goal.id, input.goalId),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      return {
        goal: updatedGoal,
        newlyCompletedMilestones,
        isGoalCompleted: isCompleted,
      };
    }),

  // Remove amount from goal - returns money to wallet
  removeAmount: protectedProcedure
    .input(removeAmountFromGoalSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify goal exists and belongs to user
      const existing = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.goalId), eq(goal.userId, ctx.user.id)),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Verify wallet exists and belongs to user
      const targetWallet = await ctx.db.query.wallet.findFirst({
        where: and(
          eq(wallet.id, input.walletId),
          eq(wallet.userId, ctx.user.id),
        ),
      });

      if (!targetWallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dompet tidak ditemukan",
        });
      }

      // Check goal has sufficient balance
      if (existing.currentAmount < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Saldo goal tidak mencukupi. Saldo tersedia: Rp ${existing.currentAmount.toLocaleString("id-ID")}`,
        });
      }

      const newAmount = existing.currentAmount - input.amount;

      // Return money to wallet
      await ctx.db
        .update(wallet)
        .set({
          balance: sql`${wallet.balance} + ${input.amount}`,
        })
        .where(eq(wallet.id, input.walletId));

      // Update goal amount
      await ctx.db
        .update(goal)
        .set({
          currentAmount: newAmount,
          status: newAmount >= existing.targetAmount ? "completed" : "active",
        })
        .where(eq(goal.id, input.goalId));

      // Create negative transaction record
      await ctx.db.insert(goalTransaction).values({
        id: crypto.randomUUID(),
        goalId: input.goalId,
        userId: ctx.user.id,
        walletId: input.walletId,
        amount: -input.amount,
        description: `Ke ${targetWallet.name}`,
      });

      // Update milestone completion status (may need to un-complete some)
      for (const m of existing.milestones) {
        if (m.isCompleted && newAmount < m.targetAmount) {
          await ctx.db
            .update(milestone)
            .set({
              isCompleted: false,
              completedAt: null,
            })
            .where(eq(milestone.id, m.id));
        }
      }

      // Return updated goal with milestones
      const updatedGoal = await ctx.db.query.goal.findFirst({
        where: eq(goal.id, input.goalId),
        with: {
          milestones: {
            orderBy: (milestone, { asc }) => [asc(milestone.order)],
          },
        },
      });

      return {
        goal: updatedGoal,
      };
    }),

  // Update a specific milestone
  updateMilestone: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateMilestoneSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the milestone belongs to a goal owned by the user
      const existingMilestone = await ctx.db.query.milestone.findFirst({
        where: eq(milestone.id, input.id),
        with: {
          goal: true,
        },
      });

      if (!existingMilestone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Milestone tidak ditemukan",
        });
      }

      if (existingMilestone.goal.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Anda tidak memiliki akses ke milestone ini",
        });
      }

      const [updatedMilestone] = await ctx.db
        .update(milestone)
        .set({
          ...input.data,
          completedAt: input.data.isCompleted ? new Date() : null,
        })
        .where(eq(milestone.id, input.id))
        .returning();

      return updatedMilestone;
    }),

  // Get transactions for a goal with wallet info
  getTransactions: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify goal belongs to user
      const goalExists = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.goalId), eq(goal.userId, ctx.user.id)),
      });

      if (!goalExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Build where conditions
      const conditions = [eq(goalTransaction.goalId, input.goalId)];

      if (input.startDate) {
        conditions.push(gte(goalTransaction.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(goalTransaction.createdAt, input.endDate));
      }

      // Fetch transactions with wallet info
      const transactions = await ctx.db.query.goalTransaction.findMany({
        where: and(...conditions),
        orderBy: (goalTransaction, { asc }) => [asc(goalTransaction.createdAt)],
        with: {
          wallet: true,
        },
      });

      // Calculate cumulative balance
      let runningBalance = 0;
      const dataPoints = transactions.map((transaction) => {
        runningBalance += transaction.amount;
        return {
          date: transaction.createdAt,
          amount: runningBalance,
          transactionAmount: transaction.amount,
          description: transaction.description,
          wallet: transaction.wallet
            ? {
                id: transaction.wallet.id,
                name: transaction.wallet.name,
                type: transaction.wallet.type,
              }
            : null,
        };
      });

      return dataPoints;
    }),

  // Get wallet allocation summary for a goal
  getWalletAllocations: protectedProcedure
    .input(z.object({ goalId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify goal belongs to user
      const goalExists = await ctx.db.query.goal.findFirst({
        where: and(eq(goal.id, input.goalId), eq(goal.userId, ctx.user.id)),
        with: {
          transactions: {
            with: {
              wallet: true,
            },
          },
        },
      });

      if (!goalExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal tidak ditemukan",
        });
      }

      // Calculate total amount per wallet
      const walletAllocations = new Map<
        string,
        { wallet: { id: string; name: string; type: string }; amount: number }
      >();

      for (const tx of goalExists.transactions) {
        const existing = walletAllocations.get(tx.walletId);
        if (existing) {
          existing.amount += tx.amount;
        } else {
          walletAllocations.set(tx.walletId, {
            wallet: {
              id: tx.wallet.id,
              name: tx.wallet.name,
              type: tx.wallet.type,
            },
            amount: tx.amount,
          });
        }
      }

      // Filter out wallets with zero or negative allocations
      const allocations = Array.from(walletAllocations.values()).filter(
        (a) => a.amount > 0,
      );

      return allocations;
    }),
});
