import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  guestSafeProcedure,
  router,
} from "./_core/trpc";
import { familyAuthRouter } from "./familyAuthRouter";
import {
  getBudgetData,
  saveBudgetData,
  getFamilyBudget,
  saveFamilyBudget,
  listFamilyBudgetHistory,
  getFamilyBudgetSnapshot,
} from "./db";
import { DEMO_FAMILY_BUDGET } from "./demo/demoBudget";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Sabit aile ID - sadece bu aile kullanıyor, giriş gerektirmez
export const FAMILY_ID = "uk-family-budget-2026";

// JSON array validation helper — max 100KB, must be valid JSON array
const jsonArrayString = z
  .string()
  .max(100_000, "Alan çok büyük")
  .refine(s => {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }, "Geçerli JSON dizisi olmalı");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Eski kullanıcı bazlı budget (artık kullanılmıyor)
  budget: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return await getBudgetData(ctx.user.id);
    }),
    save: protectedProcedure
      .input(
        z.object({
          currentMonth: z.string(),
          incomes: z.string(),
          expenses: z.string(),
          debts: z.string(),
          savings: z.string(),
          annualPayments: z.string(),
          budgetLimits: z.string(),
          savingsGoals: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        return await saveBudgetData(ctx.user.id, input);
      }),
  }),

  familyAuth: familyAuthRouter,
  // Yeni aile bazlı budget - aile şifresi gerektirir.
  // Demo subdomain (ctx.isGuest) için: queries DEMO_FAMILY_BUDGET döndürür,
  // mutations FORBIDDEN. Read-only showcase.
  familyBudget: router({
    get: guestSafeProcedure.query(async ({ ctx }) => {
      if (ctx.demoMode) return DEMO_FAMILY_BUDGET;
      return await getFamilyBudget(FAMILY_ID);
    }),
    save: guestSafeProcedure
      .input(
        z.object({
          incomes: jsonArrayString,
          expenses: jsonArrayString,
          debts: jsonArrayString,
          annualPayments: jsonArrayString,
          budgetLimits: jsonArrayString,
          savingsGoals: jsonArrayString,
          installments: jsonArrayString.optional().default("[]"),
          expectedUpdatedAt: z.string().datetime().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await saveFamilyBudget(
          FAMILY_ID,
          {
            incomes: input.incomes,
            expenses: input.expenses,
            debts: input.debts,
            annualPayments: input.annualPayments,
            budgetLimits: input.budgetLimits,
            savingsGoals: input.savingsGoals,
            installments: input.installments,
          },
          input.expectedUpdatedAt,
          ctx.family?.person ?? null
        );

        if ("conflict" in result) {
          console.warn("[conflict]", {
            expectedUpdatedAt: input.expectedUpdatedAt,
            serverUpdatedAt: result.serverUpdatedAt,
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: "Veriler başka bir cihazdan değiştirildi",
          });
        }
        return result;
      }),
    getUpdatedAt: guestSafeProcedure.query(async ({ ctx }) => {
      if (ctx.demoMode) return DEMO_FAMILY_BUDGET.updatedAt;
      const data = await getFamilyBudget(FAMILY_ID);
      return data ? data.updatedAt : null;
    }),
    history: router({
      list: guestSafeProcedure.query(async ({ ctx }) => {
        if (ctx.demoMode) return [];
        return await listFamilyBudgetHistory(FAMILY_ID);
      }),
      get: guestSafeProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ input, ctx }) => {
          if (ctx.demoMode) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Demo modunda yedek geçmişi yok",
            });
          }
          const snap = await getFamilyBudgetSnapshot(FAMILY_ID, input.id);
          if (!snap)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Snapshot bulunamadı",
            });
          return snap;
        }),
      restore: guestSafeProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            expectedUpdatedAt: z.string().datetime().nullable(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const snap = await getFamilyBudgetSnapshot(FAMILY_ID, input.id);
          if (!snap)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Snapshot bulunamadı",
            });

          let restoredData: Record<string, string>;
          try {
            restoredData = JSON.parse(snap.snapshot);
          } catch {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Snapshot verisi bozuk, geri yüklenemedi",
            });
          }

          const result = await saveFamilyBudget(
            FAMILY_ID,
            {
              incomes: restoredData.incomes ?? "[]",
              expenses: restoredData.expenses ?? "[]",
              debts: restoredData.debts ?? "[]",
              annualPayments: restoredData.annualPayments ?? "[]",
              budgetLimits: restoredData.budgetLimits ?? "[]",
              savingsGoals: restoredData.savingsGoals ?? "[]",
              installments: restoredData.installments ?? "[]",
            },
            input.expectedUpdatedAt,
            ctx.family?.person ?? null
          );

          if ("conflict" in result) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Geri yüklenemedi, veri başka cihazdan değişti",
            });
          }
          return result;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
