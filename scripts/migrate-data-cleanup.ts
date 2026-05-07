/**
 * Idempotent data migration script.
 * - planned/actual → amount on Income and Expense
 * - urgency field removed from Expense
 * - BudgetLimit.owner: 'Eşim' → 'Esim', 'Ortak' → 'Ev'
 *
 * Usage:
 *   pnpm tsx scripts/migrate-data-cleanup.ts           # apply
 *   pnpm tsx scripts/migrate-data-cleanup.ts --dry-run # preview only
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { familyBudget, familyBudgetHistory } from "../drizzle/schema";
import { migrateData, type RawBudgetJson } from "../shared/migrateLogic";

const isDryRun = process.argv.includes("--dry-run");
const db = drizzle(process.env.DATABASE_URL!);

async function run() {
  console.log(
    `Starting data cleanup migration${isDryRun ? " (DRY RUN — no writes)" : ""}...`
  );

  const rows = await db.select().from(familyBudget);
  let updatedFamilyBudget = 0;
  for (const row of rows) {
    const result = migrateData(row as unknown as RawBudgetJson);
    if (result.changed) {
      if (!isDryRun) {
        await db.update(familyBudget).set({
          incomes: result.incomes,
          expenses: result.expenses,
          budgetLimits: result.budgetLimits,
        });
      }
      updatedFamilyBudget++;
    }
  }
  console.log(
    `familyBudget: ${updatedFamilyBudget} row(s) ${isDryRun ? "would be" : ""} updated`
  );

  const historyRows = await db.select().from(familyBudgetHistory);
  let updatedHistory = 0;
  for (const row of historyRows) {
    let snap: RawBudgetJson;
    try {
      snap = JSON.parse(row.snapshot);
    } catch {
      continue;
    }
    const result = migrateData(snap);
    if (result.changed) {
      if (!isDryRun) {
        const migratedSnap = { ...snap, ...result };
        delete (migratedSnap as any).changed;
        await db
          .update(familyBudgetHistory)
          .set({ snapshot: JSON.stringify(migratedSnap) })
          .where(eq(familyBudgetHistory.id, row.id));
      }
      updatedHistory++;
    }
  }
  console.log(
    `familyBudgetHistory: ${updatedHistory} row(s) ${isDryRun ? "would be" : ""} updated`
  );
  console.log("Migration complete.");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
