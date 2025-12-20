import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  categories: many(category),
  wallets: many(wallet),
  transactions: many(transaction),
  goals: many(goal),
  goalTransactions: many(goalTransaction),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Category table
export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["income", "expense", "both"] }).notNull(),
    icon: text("icon"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("category_userId_idx").on(table.userId)],
);

// Wallet table
export const wallet = pgTable(
  "wallet",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["bank", "e-wallet", "cash"] }).notNull(),
    balance: integer("balance").default(0).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("wallet_userId_idx").on(table.userId)],
);

// Transaction table
export const transaction = pgTable(
  "transaction",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    amount: integer("amount").notNull(),
    date: timestamp("date").notNull(),
    description: text("description"),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    frequency: text("frequency", {
      enum: ["daily", "weekly", "monthly", "yearly"],
    }),
    receiptUrl: text("receipt_url"),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallet.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("transaction_userId_idx").on(table.userId),
    index("transaction_date_idx").on(table.date),
    index("transaction_categoryId_idx").on(table.categoryId),
    index("transaction_walletId_idx").on(table.walletId),
  ],
);

// Category relations
export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, {
    fields: [category.userId],
    references: [user.id],
  }),
  transactions: many(transaction),
}));

// Wallet relations
export const walletRelations = relations(wallet, ({ one, many }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
  }),
  transactions: many(transaction),
}));

// Transaction relations
export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  category: one(category, {
    fields: [transaction.categoryId],
    references: [category.id],
  }),
  wallet: one(wallet, {
    fields: [transaction.walletId],
    references: [wallet.id],
  }),
}));

// Goal table
export const goal = pgTable(
  "goal",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    targetAmount: integer("target_amount").notNull(),
    currentAmount: integer("current_amount").default(0).notNull(),
    targetDate: timestamp("target_date"),
    status: text("status", { enum: ["active", "completed", "cancelled"] })
      .default("active")
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("goal_userId_idx").on(table.userId),
    index("goal_status_idx").on(table.status),
  ],
);

// Milestone table
export const milestone = pgTable(
  "milestone",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    targetAmount: integer("target_amount").notNull(),
    targetDate: timestamp("target_date"),
    order: integer("order").notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    advice: text("advice"),
    goalId: text("goal_id")
      .notNull()
      .references(() => goal.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("milestone_goalId_idx").on(table.goalId),
    index("milestone_order_idx").on(table.order),
  ],
);

// Goal relations
export const goalRelations = relations(goal, ({ one, many }) => ({
  user: one(user, {
    fields: [goal.userId],
    references: [user.id],
  }),
  milestones: many(milestone),
  transactions: many(goalTransaction),
}));

// Milestone relations
export const milestoneRelations = relations(milestone, ({ one }) => ({
  goal: one(goal, {
    fields: [milestone.goalId],
    references: [goal.id],
  }),
}));

// Goal Transaction table
export const goalTransaction = pgTable(
  "goal_transaction",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id")
      .notNull()
      .references(() => goal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // positive for additions, negative for decreases
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("goalTransaction_goalId_idx").on(table.goalId),
    index("goalTransaction_userId_idx").on(table.userId),
    index("goalTransaction_createdAt_idx").on(table.createdAt),
  ],
);

// Goal Transaction relations
export const goalTransactionRelations = relations(
  goalTransaction,
  ({ one }) => ({
    goal: one(goal, {
      fields: [goalTransaction.goalId],
      references: [goal.id],
    }),
    user: one(user, {
      fields: [goalTransaction.userId],
      references: [user.id],
    }),
  }),
);
