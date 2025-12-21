import { z } from "zod";

export const frequencyEnum = z.enum(["daily", "monthly"]);

// Scenario item schema (income or expense item)
export const scenarioItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama harus diisi"),
  amount: z.number().int().min(1, "Jumlah harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
});

// Schema for saving a scenario
export const saveScenarioSchema = z.object({
  name: z.string().min(1, "Nama skenario harus diisi").max(100),
  items: z.array(scenarioItemSchema).min(1, "Minimal 1 item"),
  frequency: frequencyEnum,
  netMonthly: z.number().int(),
  projection1Year: z.number().int(),
  projection5Years: z.number().int(),
});

// Schema for updating a scenario
export const updateScenarioSchema = saveScenarioSchema.extend({
  id: z.string(),
});

// Types
export type ScenarioItem = z.infer<typeof scenarioItemSchema>;
export type SaveScenarioInput = z.infer<typeof saveScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export type Frequency = z.infer<typeof frequencyEnum>;

// Helper to calculate projections
export function calculateProjections(
  netAmount: number,
  frequency: Frequency,
): {
  monthly: number;
  yearly: number;
  fiveYear: number;
  fiveYearWithInterest: number;
} {
  let monthly: number;
  let yearly: number;

  if (frequency === "daily") {
    monthly = netAmount * 30;
    yearly = netAmount * 365;
  } else {
    monthly = netAmount;
    yearly = netAmount * 12;
  }

  const fiveYear = yearly * 5;

  // Compound interest calculation (4% annual rate)
  // Future Value of Annuity: FV = P * ((1 + r)^n - 1) / r
  const annualRate = 0.04;
  const fiveYearWithInterest =
    yearly > 0
      ? Math.round(yearly * (((1 + annualRate) ** 5 - 1) / annualRate))
      : Math.round(yearly * 5); // No interest benefit for negative values

  return {
    monthly,
    yearly,
    fiveYear,
    fiveYearWithInterest,
  };
}
