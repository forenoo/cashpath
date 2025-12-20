import { EventSchemas, Inngest } from "inngest";

// Define event types for type safety
type RecurringTransactionProcessEvent = {
  data: {
    transactionId: string;
    userId: string;
    name: string;
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    walletId: string;
    frequency: string | null;
    description: string | null;
    originalDate: string;
  };
};

type RecurringTransactionProcessUserEvent = {
  data: {
    userId: string;
  };
};

type Events = {
  "recurring-transaction/process": RecurringTransactionProcessEvent;
  "recurring-transaction/process-user": RecurringTransactionProcessUserEvent;
};

// Create the Inngest client with typed events
export const inngest = new Inngest({
  id: "cashpath",
  schemas: new EventSchemas().fromRecord<Events>(),
});
