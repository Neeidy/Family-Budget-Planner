import { describe, expect, it, vi, beforeAll } from "vitest";

beforeAll(() => {
  process.env.FAMILY_COOKIE_SECRET =
    process.env.FAMILY_COOKIE_SECRET ||
    "demo-test-secret-at-least-32-chars-abc123";
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { DEMO_FAMILY_BUDGET, DEMO_PROFILES } from "./demo/demoBudget";

vi.mock("./db", () => ({
  getFamilyBudget: vi.fn(),
  saveFamilyBudget: vi.fn(),
  listFamilyBudgetHistory: vi.fn(),
  getFamilyBudgetSnapshot: vi.fn(),
  getBudgetData: vi.fn(),
  saveBudgetData: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import {
  getFamilyBudget,
  saveFamilyBudget,
  listFamilyBudgetHistory,
  getFamilyBudgetSnapshot,
} from "./db";

function makeCtx(opts: {
  isGuest: boolean;
  family: TrpcContext["family"];
}): TrpcContext {
  const setCookies: Array<{
    name: string;
    value: string;
    opts: Record<string, unknown>;
  }> = [];
  return {
    user: null,
    family: opts.family,
    isGuest: opts.isGuest,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, o: Record<string, unknown>) => {
        setCookies.push({ name, value, opts: o });
      },
      clearCookie: vi.fn(),
      _setCookies: setCookies,
    } as unknown as TrpcContext["res"],
  };
}

describe("demo mode — guest queries return DEMO_FAMILY_BUDGET", () => {
  it("familyBudget.get → DEMO_FAMILY_BUDGET when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.familyBudget.get();
    expect(result).toBe(DEMO_FAMILY_BUDGET);
    expect(getFamilyBudget).not.toHaveBeenCalled();
  });

  it("familyBudget.getUpdatedAt → DEMO_FAMILY_BUDGET.updatedAt when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.familyBudget.getUpdatedAt();
    expect(result).toEqual(DEMO_FAMILY_BUDGET.updatedAt);
  });

  it("familyBudget.history.list → empty array when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.familyBudget.history.list();
    expect(result).toEqual([]);
    expect(listFamilyBudgetHistory).not.toHaveBeenCalled();
  });

  it("familyBudget.history.get → NOT_FOUND when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.familyBudget.history.get({ id: 1 })).rejects.toThrow(
      /Demo modunda/
    );
    expect(getFamilyBudgetSnapshot).not.toHaveBeenCalled();
  });
});

describe("demo mode — guest mutations rejected with FORBIDDEN", () => {
  const validInput = {
    incomes: "[]",
    expenses: "[]",
    debts: "[]",
    annualPayments: "[]",
    budgetLimits: "[]",
    savingsGoals: "[]",
    installments: "[]",
    expectedUpdatedAt: null,
  };

  it("familyBudget.save → FORBIDDEN when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.familyBudget.save(validInput)).rejects.toThrow(
      /Demo modunda/
    );
    expect(saveFamilyBudget).not.toHaveBeenCalled();
  });

  it("familyBudget.history.restore → FORBIDDEN when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.familyBudget.history.restore({ id: 1, expectedUpdatedAt: null })
    ).rejects.toThrow(/Demo modunda/);
    expect(getFamilyBudgetSnapshot).not.toHaveBeenCalled();
    expect(saveFamilyBudget).not.toHaveBeenCalled();
  });
});

describe("demo mode — non-guest behaviour unchanged", () => {
  it("familyBudget.get on non-guest with no family → UNAUTHORIZED", async () => {
    const ctx = makeCtx({ isGuest: false, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.familyBudget.get()).rejects.toThrow(/Aile oturumu/);
  });

  it("familyBudget.get on non-guest with family → calls real DB", async () => {
    const fakeRow = {
      ...DEMO_FAMILY_BUDGET,
      familyId: "uk-family-budget-2026",
    };
    vi.mocked(getFamilyBudget).mockResolvedValue(fakeRow);
    const ctx = makeCtx({ isGuest: false, family: { person: "Benim" } });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.familyBudget.get();
    expect(getFamilyBudget).toHaveBeenCalledWith("uk-family-budget-2026");
    expect(result).toBe(fakeRow);
  });
});

describe("demo profile endpoints — only on demo subdomain", () => {
  it("getDemoProfiles → list when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    const profiles = await caller.familyAuth.getDemoProfiles();
    expect(profiles).toHaveLength(DEMO_PROFILES.length);
    expect(profiles[0]).toMatchObject({
      name: expect.any(String),
      emoji: expect.any(String),
    });
  });

  it("getDemoProfiles → NOT_FOUND when not guest", async () => {
    const ctx = makeCtx({ isGuest: false, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.familyAuth.getDemoProfiles()).rejects.toThrow();
  });

  it("loginAsDemoProfile → sets cookie and returns profile when isGuest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.familyAuth.loginAsDemoProfile({
      profileId: "demo-kerem",
    });
    expect(result).toMatchObject({ ok: true, person: "Benim", name: "Kerem" });
    const setCookies = (
      ctx.res as unknown as { _setCookies: Array<{ name: string }> }
    )._setCookies;
    expect(setCookies.length).toBe(1);
    expect(setCookies[0].name).toBe("viyana_family_session");
  });

  it("loginAsDemoProfile → NOT_FOUND when not guest", async () => {
    const ctx = makeCtx({ isGuest: false, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.familyAuth.loginAsDemoProfile({ profileId: "demo-kerem" })
    ).rejects.toThrow();
  });

  it("loginAsDemoProfile → NOT_FOUND for unknown profileId even if guest", async () => {
    const ctx = makeCtx({ isGuest: true, family: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.familyAuth.loginAsDemoProfile({ profileId: "demo-bogus" })
    ).rejects.toThrow(/bulunamadı/);
  });
});
