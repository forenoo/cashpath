import { createTRPCRouter } from "../init";
import { categoryRouter } from "./category";
import { goalRouter } from "./goal";
import { receiptRouter } from "./receipt";
import { simulationRouter } from "./simulation";
import { storageRouter } from "./storage";
import { transactionRouter } from "./transaction";
import { walletRouter } from "./wallet";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  goal: goalRouter,
  receipt: receiptRouter,
  simulation: simulationRouter,
  storage: storageRouter,
  transaction: transactionRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
