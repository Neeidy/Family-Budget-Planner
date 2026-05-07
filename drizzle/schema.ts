import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Budget data table for cloud sync
export const budgetData = mysqlTable("budgetData", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentMonth: varchar("currentMonth", { length: 20 }).notNull(),
  incomes: text("incomes").notNull(),
  expenses: text("expenses").notNull(),
  debts: text("debts").notNull(),
  savings: text("savings").notNull(),
  annualPayments: text("annualPayments").notNull(),
  budgetLimits: text("budgetLimits").notNull(),
  savingsGoals: text("savingsGoals").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetData = typeof budgetData.$inferSelect;
export type InsertBudgetData = typeof budgetData.$inferInsert;

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
