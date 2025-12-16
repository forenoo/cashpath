import { createTRPCRouter } from "../init";
import { categoryRouter } from "./category";
import { receiptRouter } from "./receipt";
import { storageRouter } from "./storage";
import { transactionRouter } from "./transaction";
import { walletRouter } from "./wallet";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  receipt: receiptRouter,
  storage: storageRouter,
  transaction: transactionRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
