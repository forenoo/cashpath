import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { scenario } from "@/db/schema";
import {
  calculateProjections,
  saveScenarioSchema,
  updateScenarioSchema,
} from "@/lib/validations/simulation";
import { createTRPCRouter, protectedProcedure } from "../init";

export const simulationRouter = createTRPCRouter({
  // Get all scenarios for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const scenarios = await ctx.db.query.scenario.findMany({
      where: eq(scenario.userId, ctx.user.id),
      orderBy: [desc(scenario.updatedAt)],
    });

    return scenarios;
  }),

  // Get a single scenario by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.scenario.findFirst({
        where: and(eq(scenario.id, input.id), eq(scenario.userId, ctx.user.id)),
      });

      return result ?? null;
    }),

  // Create a new scenario
  create: protectedProcedure
    .input(saveScenarioSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();

      const [newScenario] = await ctx.db
        .insert(scenario)
        .values({
          id,
          userId: ctx.user.id,
          name: input.name,
          items: input.items,
          frequency: input.frequency,
          netMonthly: input.netMonthly,
          projection1Year: input.projection1Year,
          projection5Years: input.projection5Years,
        })
        .returning();

      return newScenario;
    }),

  // Update an existing scenario
  update: protectedProcedure
    .input(updateScenarioSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedScenario] = await ctx.db
        .update(scenario)
        .set({
          name: input.name,
          items: input.items,
          frequency: input.frequency,
          netMonthly: input.netMonthly,
          projection1Year: input.projection1Year,
          projection5Years: input.projection5Years,
        })
        .where(and(eq(scenario.id, input.id), eq(scenario.userId, ctx.user.id)))
        .returning();

      return updatedScenario;
    }),

  // Delete a scenario
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(scenario)
        .where(
          and(eq(scenario.id, input.id), eq(scenario.userId, ctx.user.id)),
        );

      return { success: true };
    }),

  // Calculate projections (utility endpoint for client-side calculations)
  calculateProjections: protectedProcedure
    .input(
      z.object({
        netAmount: z.number(),
        frequency: z.enum(["daily", "monthly"]),
      }),
    )
    .query(({ input }) => {
      return calculateProjections(input.netAmount, input.frequency);
    }),
});
