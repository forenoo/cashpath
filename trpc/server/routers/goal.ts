import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { goal, goalTransaction, milestone } from "@/db/schema";
import {
  addAmountToGoalSchema,
  createGoalSchema,
  type MilestonePace,
  regenerateMilestonesSchema,
  updateGoalSchema,
  updateMilestoneSchema,
} from "@/lib/validations/goal";
import { createTRPCRouter, protectedProcedure } from "../init";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to generate milestone names and advice using Gemini AI
async function generateMilestoneNamesWithAI(
  goalName: string,
  milestoneData: Array<{
    percentage: number;
    amount: number;
    index: number;
    total: number;
  }>,
): Promise<Array<{ name: string; advice: string }>> {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback to default names if API key not configured
    return milestoneData.map((m) => ({
      name: getMilestoneName(m.percentage, m.index, m.total),
      advice: "",
    }));
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const milestonesInfo = milestoneData
      .map(
        (m) =>
          `Milestone ${m.index}: ${m.percentage}% progress (Rp ${m.amount.toLocaleString("id-ID")})`,
      )
      .join("\n");

    const prompt = `You are a financial goal motivation assistant. Generate creative, motivational milestone names and simple advice for a savings goal.

Goal Name: "${goalName}"

Milestones to name:
${milestonesInfo}

Requirements:
1. Generate exactly ${milestoneData.length} milestones with both name and advice
2. Each name should be motivational and relevant to the goal
3. Include emoji (1-2 emojis) at the start of each name
4. Names and advice should be in Indonesian language (Bahasa Indonesia)
5. Make names specific to the progress percentage and goal context
6. First milestone should celebrate starting the journey
7. Last milestone should build excitement for reaching the goal
8. Middle milestones should reflect progress milestones
9. Keep names concise (max 3-4 words + emoji)
10. Advice should be simple, actionable, and encouraging (1-2 sentences max)
11. Advice should be relevant to reaching that specific milestone amount
12. Make them personal and encouraging

Return ONLY a JSON array of objects, no markdown, no code blocks, just the array. Each object should have "name" and "advice" properties.

Example format:
[
  {"name": "🚀 Mulai Perjalanan", "advice": "Mulai dengan menabung secara konsisten setiap bulan, bahkan jika jumlahnya kecil."},
  {"name": "⭐ Seperempat Jalan", "advice": "Pertahankan momentum! Pertimbangkan untuk mengurangi pengeluaran tidak penting."},
  {"name": "🔥 Setengah Perjalanan", "advice": "Kamu sudah setengah jalan! Evaluasi kembali anggaran dan cari cara untuk meningkatkan tabungan."},
  {"name": "💪 Hampir Sampai", "advice": "Sedikit lagi! Tetap disiplin dan hindari godaan untuk menggunakan tabungan ini."}
]

Generate the milestone names and advice now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Try to parse JSON from the response
    let milestoneResults: Array<{ name: string; advice: string }> = [];
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleanedText);

      // Validate structure
      if (Array.isArray(parsed) && parsed.length === milestoneData.length) {
        milestoneResults = parsed.map((item: unknown) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "name" in item &&
            "advice" in item
          ) {
            return {
              name: String(item.name),
              advice: String(item.advice),
            };
          }
          // Fallback if structure is wrong
          const index = parsed.indexOf(item);
          return {
            name: getMilestoneName(
              milestoneData[index]?.percentage || 0,
              milestoneData[index]?.index || index + 1,
              milestoneData.length,
            ),
            advice: "",
          };
        });
      }
    } catch {
      // If JSON parsing fails, try to extract array from text
      const arrayMatch = text.match(/\[.*\]/s);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) {
            milestoneResults = parsed.map((item: unknown, index: number) => {
              if (
                typeof item === "object" &&
                item !== null &&
                "name" in item &&
                "advice" in item
              ) {
                return {
                  name: String(item.name),
                  advice: String(item.advice),
                };
              }
              return {
                name: getMilestoneName(
                  milestoneData[index]?.percentage || 0,
                  milestoneData[index]?.index || index + 1,
                  milestoneData.length,
                ),
                advice: "",
              };
            });
          }
        } catch {
          // Fallback to default
        }
      }
    }

    // Validate we have the right number of results
    if (milestoneResults.length === milestoneData.length) {
      return milestoneResults;
    }

    // Fallback if AI response is invalid
    return milestoneData.map((m) => ({
      name: getMilestoneName(m.percentage, m.index, m.total),
      advice: "",
    }));
  } catch (error) {
    console.error("Error generating milestone names with AI:", error);
    // Fallback to default names on error
    return milestoneData.map((m) => ({
      name: getMilestoneName(m.percentage, m.index, m.total),
      advice: "",
    }));
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

  const milestones: Array<{
    name: string;
    targetAmount: number;
    targetDate: Date | null;
    order: number;
    advice: string;
  }> = [];

  const amountDifference = targetAmount - currentAmount;
  const now = new Date();
  const dateDifference = targetDate
    ? targetDate.getTime() - now.getTime()
    : null;

  // First, calculate all milestone amounts and percentages
  const milestoneData: Array<{
    percentage: number;
    amount: number;
    index: number;
    total: number;
  }> = [];

  for (let i = 1; i <= milestoneCount; i++) {
    const progress = i / (milestoneCount + 1);
    const milestoneAmount = Math.round(
      currentAmount + amountDifference * progress,
    );
    const percentage = Math.round(progress * 100);

    milestoneData.push({
      percentage,
      amount: milestoneAmount,
      index: i,
      total: milestoneCount,
    });
  }

  // Generate milestone names and advice using AI
  const milestoneResults = await generateMilestoneNamesWithAI(
    goalName,
    milestoneData,
  );

  // Build final milestones array
  for (let i = 1; i <= milestoneCount; i++) {
    const progress = i / (milestoneCount + 1);

    // Calculate milestone amount
    const milestoneAmount = Math.round(
      currentAmount + amountDifference * progress,
    );

    // Calculate milestone date if target date exists
    let milestoneDate: Date | null = null;
    if (dateDifference && targetDate) {
      const milestoneTime = now.getTime() + dateDifference * progress;
      milestoneDate = new Date(milestoneTime);
    }

    const milestoneResult = milestoneResults[i - 1];

    milestones.push({
      name:
        milestoneResult?.name ||
        getMilestoneName(Math.round(progress * 100), i, milestoneCount),
      targetAmount: milestoneAmount,
      targetDate: milestoneDate,
      order: i,
      advice: milestoneResult?.advice || "",
    });
  }

  return milestones;
}

// Helper function to generate creative milestone names
function getMilestoneName(
  percentage: number,
  index: number,
  total: number,
): string {
  if (index === 1) {
    return "🚀 First Step";
  }
  if (index === total) {
    return "🎯 Almost There";
  }

  if (percentage <= 25) {
    return "🌱 Getting Started";
  }
  if (percentage <= 50) {
    return "⭐ Halfway Hero";
  }
  if (percentage <= 75) {
    return "🔥 On Fire";
  }
  return "💪 Final Push";
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

      // Create the goal
      await ctx.db.insert(goal).values({
        id: goalId,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount,
        targetDate: input.targetDate ?? null,
        status: "active",
        userId: ctx.user.id,
      });

      // Create initial transaction if currentAmount > 0
      if (input.currentAmount > 0) {
        await ctx.db.insert(goalTransaction).values({
          id: crypto.randomUUID(),
          goalId: goalId,
          userId: ctx.user.id,
          amount: input.currentAmount,
          description: "Initial balance",
        });
      }

      // Generate milestones
      const milestonesData = await generateMilestones(
        input.name,
        input.currentAmount,
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

  // Update goal
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

      // Check if currentAmount is being updated
      const amountChanged =
        input.data.currentAmount !== undefined &&
        input.data.currentAmount !== existing.currentAmount;

      const [updatedGoal] = await ctx.db
        .update(goal)
        .set({
          ...input.data,
        })
        .where(eq(goal.id, input.id))
        .returning();

      // Create transaction record if amount changed
      if (amountChanged && updatedGoal) {
        const difference = updatedGoal.currentAmount - existing.currentAmount;
        if (difference !== 0) {
          await ctx.db.insert(goalTransaction).values({
            id: crypto.randomUUID(),
            goalId: input.id,
            userId: ctx.user.id,
            amount: difference,
            description: "Balance updated",
          });
        }
      }

      return updatedGoal;
    }),

  // Delete goal (also deletes milestones via cascade)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
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

      await ctx.db.delete(goal).where(eq(goal.id, input.id));

      return { success: true };
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

  // Add amount to goal (update progress)
  addAmount: protectedProcedure
    .input(addAmountToGoalSchema)
    .mutation(async ({ ctx, input }) => {
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

      const newAmount = existing.currentAmount + input.amount;
      const isCompleted = newAmount >= existing.targetAmount;

      // Update goal amount
      await ctx.db
        .update(goal)
        .set({
          currentAmount: newAmount,
          status: isCompleted ? "completed" : "active",
        })
        .where(eq(goal.id, input.goalId));

      // Create transaction record
      await ctx.db.insert(goalTransaction).values({
        id: crypto.randomUUID(),
        goalId: input.goalId,
        userId: ctx.user.id,
        amount: input.amount,
        description: null,
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

  // Get transactions for a goal
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

      // Fetch transactions
      const transactions = await ctx.db.query.goalTransaction.findMany({
        where: and(...conditions),
        orderBy: (goalTransaction, { asc }) => [asc(goalTransaction.createdAt)],
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
        };
      });

      return dataPoints;
    }),
});
