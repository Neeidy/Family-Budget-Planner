import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Family shared budget table - no auth required, accessed by familyId
export const familyBudget = mysqlTable("familyBudget", {
  id: int("id").autoincrement().primaryKey(),
  familyId: varchar("familyId", { length: 64 }).notNull().unique(),
  incomes: text("incomes").notNull(),
  expenses: text("expenses").notNull(),
  debts: text("debts").notNull(),
  annualPayments: text("annualPayments").notNull(),
  budgetLimits: text("budgetLimits").notNull(),
  savingsGoals: text("savingsGoals").notNull(),
  installments: text("installments").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyBudget = typeof familyBudget.$inferSelect;
export type InsertFamilyBudget = typeof familyBudget.$inferInsert;

// Family budget history snapshots — max 30 per family, oldest auto-deleted
export const familyBudgetHistory = mysqlTable("familyBudgetHistory", {
  id: int("id").autoincrement().primaryKey(),
  familyId: varchar("familyId", { length: 64 }).notNull(),
  snapshot: text("snapshot").notNull(), // full JSON of familyBudget data
  savedBy: varchar("savedBy", { length: 64 }), // person name who triggered save
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyBudgetHistory = typeof familyBudgetHistory.$inferSelect;
export type InsertFamilyBudgetHistory = typeof familyBudgetHistory.$inferInsert;
