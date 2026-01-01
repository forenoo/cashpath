import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  handleRecurringTransaction,
  processRecurringTransactions,
  processUserRecurringTransactions,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  signingKey: process.env.INNGEST_SIGNING_KEY as string,
  client: inngest,
  functions: [
    processRecurringTransactions,
    handleRecurringTransaction,
    processUserRecurringTransactions,
  ],
});
