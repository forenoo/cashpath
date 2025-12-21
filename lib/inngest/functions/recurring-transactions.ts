import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isBefore,
  startOfDay,
} from "date-fns";
import { and, eq, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { transaction, wallet } from "@/db/schema";
import { inngest } from "../client";

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Calculate the next occurrence date based on the frequency
 */
function getNextOccurrenceDate(lastDate: Date, frequency: Frequency): Date {
  switch (frequency) {
    case "daily":
      return addDays(lastDate, 1);
    case "weekly":
      return addWeeks(lastDate, 1);
    case "monthly":
      return addMonths(lastDate, 1);
    case "yearly":
      return addYears(lastDate, 1);
    default:
      return addMonths(lastDate, 1);
  }
}

/**
 * Check if a transaction should be processed today based on its frequency
 * Uses lastProcessedAt if available, otherwise falls back to date
 */
function shouldProcessToday(
  lastProcessedAt: Date | null,
  transactionDate: Date,
  frequency: Frequency,
  today: Date,
): boolean {
  const referenceDate = lastProcessedAt ?? transactionDate;
  const nextOccurrence = getNextOccurrenceDate(referenceDate, frequency);
  return (
    isBefore(nextOccurrence, today) ||
    startOfDay(nextOccurrence).getTime() === startOfDay(today).getTime()
  );
}

/**
 * Scheduled function that runs daily to process recurring transactions
 * Runs every day at 00:05 UTC
 */
export const processRecurringTransactions = inngest.createFunction(
  {
    id: "process-recurring-transactions",
    retries: 3,
  },
  { cron: "29 2 * * *" }, // Run at 00:05 UTC every day
  async ({ step }) => {
    const today = startOfDay(new Date());

    // Load all recurring transactions that need processing
    const recurringTransactions = await step.run(
      "load-recurring-transactions",
      async () => {
        return await db.query.transaction.findMany({
          where: and(
            eq(transaction.isRecurring, true),
            isNotNull(transaction.frequency),
            isNull(transaction.recurringTemplateId),
            lte(transaction.date, today),
          ),
          with: {
            category: true,
            wallet: true,
          },
        });
      },
    );

    if (recurringTransactions.length === 0) {
      return { processed: 0, message: "No recurring transactions to process" };
    }

    // Filter transactions that should be processed today
    const transactionsToProcess = recurringTransactions.filter((tx) => {
      if (!tx.frequency) return false;
      const txDate = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
      const lastProcessed = tx.lastProcessedAt
        ? typeof tx.lastProcessedAt === "string"
          ? new Date(tx.lastProcessedAt)
          : tx.lastProcessedAt
        : null;
      return shouldProcessToday(
        lastProcessed,
        txDate,
        tx.frequency as Frequency,
        today,
      );
    });

    if (transactionsToProcess.length === 0) {
      return {
        processed: 0,
        message: "No transactions due for processing today",
      };
    }

    // Send events for each transaction to be processed
    const events = transactionsToProcess.map((tx) => {
      const txDate = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
      return {
        name: "recurring-transaction/process" as const,
        data: {
          transactionId: tx.id,
          userId: tx.userId,
          name: tx.name,
          type: tx.type,
          amount: tx.amount,
          categoryId: tx.categoryId,
          walletId: tx.walletId,
          frequency: tx.frequency,
          description: tx.description,
          originalDate: txDate.toISOString(),
        },
      };
    });

    await step.sendEvent("fan-out-recurring-transactions", events);

    return {
      processed: events.length,
      message: `Queued ${events.length} recurring transactions for processing`,
    };
  },
);

/**
 * Event-triggered function to process a single recurring transaction
 * Creates a new transaction entry and updates wallet balance
 */
export const handleRecurringTransaction = inngest.createFunction(
  {
    id: "handle-recurring-transaction",
    retries: 3,
    concurrency: {
      limit: 10, // Process up to 10 transactions concurrently
    },
  },
  { event: "recurring-transaction/process" },
  async ({ event, step }) => {
    const {
      transactionId,
      userId,
      name,
      type,
      amount,
      categoryId,
      walletId,
      description,
    } = event.data;

    // Create new transaction for this occurrence
    const newTransactionId = await step.run(
      "create-transaction-entry",
      async () => {
        const id = crypto.randomUUID();
        const today = startOfDay(new Date());

        const [newTx] = await db
          .insert(transaction)
          .values({
            id,
            name,
            type: type as "income" | "expense",
            amount,
            date: today,
            categoryId,
            walletId,
            isRecurring: true,
            frequency: event.data.frequency as
              | "daily"
              | "weekly"
              | "monthly"
              | "yearly",
            recurringTemplateId: transactionId,
            description: description
              ? `${description} (Transaksi berulang)`
              : "Transaksi berulang otomatis",
            userId,
          })
          .returning({ id: transaction.id });

        return newTx?.id;
      },
    );

    // Update wallet balance
    await step.run("update-wallet-balance", async () => {
      const balanceChange = type === "income" ? amount : -amount;

      // Get current wallet balance and update
      const currentWallet = await db.query.wallet.findFirst({
        where: eq(wallet.id, walletId),
      });

      if (currentWallet) {
        await db
          .update(wallet)
          .set({
            balance: currentWallet.balance + balanceChange,
          })
          .where(eq(wallet.id, walletId));
      }
    });

    // Update the original recurring transaction's lastProcessedAt
    await step.run("update-last-processed-at", async () => {
      const now = new Date();
      await db
        .update(transaction)
        .set({
          lastProcessedAt: now,
          updatedAt: now,
        })
        .where(eq(transaction.id, transactionId));
    });

    return {
      success: true,
      newTransactionId,
      originalTransactionId: transactionId,
      message: `Created recurring transaction entry for ${name}`,
    };
  },
);

/**
 * Manual trigger function to process a specific user's recurring transactions
 * Can be called via event: "recurring-transaction/process-user"
 */
export const processUserRecurringTransactions = inngest.createFunction(
  {
    id: "process-user-recurring-transactions",
    retries: 2,
  },
  { event: "recurring-transaction/process-user" },
  async ({ event, step }) => {
    const { userId } = event.data;
    const today = startOfDay(new Date());

    // Load user's recurring transactions
    const recurringTransactions = await step.run(
      "load-user-recurring-transactions",
      async () => {
        return await db.query.transaction.findMany({
          where: and(
            eq(transaction.isRecurring, true),
            eq(transaction.userId, userId),
            isNotNull(transaction.frequency),
            isNull(transaction.recurringTemplateId),
          ),
        });
      },
    );

    if (recurringTransactions.length === 0) {
      return {
        processed: 0,
        message: "No recurring transactions found for user",
      };
    }

    // Filter and process
    const transactionsToProcess = recurringTransactions.filter((tx) => {
      if (!tx.frequency) return false;
      const txDate = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
      const lastProcessed = tx.lastProcessedAt
        ? typeof tx.lastProcessedAt === "string"
          ? new Date(tx.lastProcessedAt)
          : tx.lastProcessedAt
        : null;
      return shouldProcessToday(
        lastProcessed,
        txDate,
        tx.frequency as Frequency,
        today,
      );
    });

    if (transactionsToProcess.length === 0) {
      return {
        processed: 0,
        message: "No transactions due for processing",
      };
    }

    // Send events for processing
    const events = transactionsToProcess.map((tx) => {
      const txDate = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
      return {
        name: "recurring-transaction/process" as const,
        data: {
          transactionId: tx.id,
          userId: tx.userId,
          name: tx.name,
          type: tx.type,
          amount: tx.amount,
          categoryId: tx.categoryId,
          walletId: tx.walletId,
          frequency: tx.frequency,
          description: tx.description,
          originalDate: txDate.toISOString(),
        },
      };
    });

    await step.sendEvent("fan-out-user-recurring-transactions", events);

    return {
      processed: events.length,
      message: `Queued ${events.length} recurring transactions for user`,
    };
  },
);
