import { describe, expect, it, beforeAll } from "vitest";
import { createHmac } from "crypto";
import {
  verifyPassword,
  hashPassword,
  signFamilySession,
  verifyFamilySession,
  VIYANA_FAMILY_COOKIE,
} from "./auth/familyAuth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ---- Setup: inject env vars before tests ----
const TEST_PASSWORD = "test-family-password-2026";
const PASSWORD_SALT = "viyana-family-salt-2026";

beforeAll(() => {
  // Use HMAC-SHA256 hash (same as production)
  const TEST_HASH = createHmac("sha256", PASSWORD_SALT).update(TEST_PASSWORD).digest("hex");
  process.env.FAMILY_PASSWORD_HASH = TEST_HASH;
  process.env.FAMILY_COOKIE_SECRET = "test-secret-at-least-32-chars-long-abc123";
});

// ---- Helper: build a minimal TrpcContext ----
function makeCtx(cookieValue?: string): TrpcContext {
  const cookies: Record<string, string> = {};
  if (cookieValue) {
    cookies[VIYANA_FAMILY_COOKIE] = cookieValue;
  }
  const setCookies: Array<{ name: string; value: string; opts: Record<string, unknown> }> = [];
  const clearedCookies: string[] = [];

  return {
    user: null,
    family: null,
    req: {
      protocol: "https",
      headers: {
        cookie: cookieValue ? `${VIYANA_FAMILY_COOKIE}=${cookieValue}` : "",
      },
      cookies,
    } as unknown as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, opts: Record<string, unknown>) => {
        setCookies.push({ name, value, opts });
      },
      clearCookie: (name: string) => {
        clearedCookies.push(name);
      },
      _setCookies: setCookies,
      _clearedCookies: clearedCookies,
    } as unknown as TrpcContext["res"],
  };
}

// ---- familyAuth utility tests ----
describe("verifyPassword", () => {
  it("returns true for correct password", () => {
    const result = verifyPassword(TEST_PASSWORD);
    expect(result).toBe(true);
  });

  it("returns false for wrong password", () => {
    const result = verifyPassword("wrong-password");
    expect(result).toBe(false);
  });

  it("returns false when hash env is empty", () => {
    const original = process.env.FAMILY_PASSWORD_HASH;
    process.env.FAMILY_PASSWORD_HASH = "";
    const result = verifyPassword(TEST_PASSWORD);
    expect(result).toBe(false);
    process.env.FAMILY_PASSWORD_HASH = original;
  });
});

describe("signFamilySession / verifyFamilySession", () => {
  it("signs and verifies a valid token for Benim", async () => {
    const token = await signFamilySession({ person: "Benim" });
    const payload = await verifyFamilySession(token);
    expect(payload).not.toBeNull();
    expect(payload?.person).toBe("Benim");
  });

  it("signs and verifies a valid token for Esim", async () => {
    const token = await signFamilySession({ person: "Esim" });
    const payload = await verifyFamilySession(token);
    expect(payload?.person).toBe("Esim");
  });

  it("returns null for an invalid/tampered token", async () => {
    const result = await verifyFamilySession("invalid.token.here");
    expect(result).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.FAMILY_COOKIE_SECRET);
    const expiredToken = await new SignJWT({ person: "Benim" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secret);
    const result = await verifyFamilySession(expiredToken);
    expect(result).toBeNull();
  });
});

// ---- familyAuth router tests ----
describe("familyAuth.login", () => {
  it("sets cookie and returns ok:true on correct password", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller({ ...ctx, family: null });
    const result = await caller.familyAuth.login({
      password: TEST_PASSWORD,
      person: "Benim",
    });
    expect(result.ok).toBe(true);
    expect(result.person).toBe("Benim");
    const setCookies = (ctx.res as any)._setCookies as Array<{ name: string }>;
    expect(setCookies.some(c => c.name === VIYANA_FAMILY_COOKIE)).toBe(true);
  });

  it("throws UNAUTHORIZED on wrong password", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller({ ...ctx, family: null });
    await expect(
      caller.familyAuth.login({ password: "wrong", person: "Esim" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("familyAuth.logout", () => {
  it("clears the family cookie and returns ok:true", async () => {
    const ctx = makeCtx("some-token");
    const caller = appRouter.createCaller({ ...ctx, family: null });
    const result = await caller.familyAuth.logout();
    expect(result.ok).toBe(true);
    const cleared = (ctx.res as any)._clearedCookies as string[];
    expect(cleared).toContain(VIYANA_FAMILY_COOKIE);
  });
});

describe("familyAuth.me", () => {
  it("returns null when no cookie is present", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller({ ...ctx, family: null });
    const result = await caller.familyAuth.me();
    expect(result).toBeNull();
  });

  it("returns person when a valid cookie is present", async () => {
    const ctx = makeCtx();
    const ctxWithFamily = { ...ctx, family: { person: "Esim" as const } };
    const caller = appRouter.createCaller(ctxWithFamily);
    const result = await caller.familyAuth.me();
    expect(result).not.toBeNull();
    expect(result?.person).toBe("Esim");
  });

  it("returns null after logout (invalid/missing cookie)", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller({ ...ctx, family: null });
    const result = await caller.familyAuth.me();
    expect(result).toBeNull();
  });
});

describe("familyAuth.changePassword", () => {
  it("changes password successfully with correct current password", async () => {
    const ctx = makeCtx();
    const ctxWithFamily = { ...ctx, family: { person: "Benim" as const } };
    const caller = appRouter.createCaller(ctxWithFamily);
    const result = await caller.familyAuth.changePassword({
      currentPassword: TEST_PASSWORD,
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.ok).toBe(true);
    expect(result.newHash).toBeTruthy();
    expect(result.newHash).toHaveLength(64); // HMAC-SHA256 hex = 64 chars
    // Restore original hash for other tests
    process.env.FAMILY_PASSWORD_HASH = createHmac("sha256", PASSWORD_SALT).update(TEST_PASSWORD).digest("hex");
  });

  it("throws UNAUTHORIZED when current password is wrong", async () => {
    const ctx = makeCtx();
    const ctxWithFamily = { ...ctx, family: { person: "Benim" as const } };
    const caller = appRouter.createCaller(ctxWithFamily);
    await expect(
      caller.familyAuth.changePassword({
        currentPassword: "wrongpassword",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws BAD_REQUEST when new passwords do not match", async () => {
    const ctx = makeCtx();
    const ctxWithFamily = { ...ctx, family: { person: "Benim" as const } };
    const caller = appRouter.createCaller(ctxWithFamily);
    await expect(
      caller.familyAuth.changePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newpass123",
        confirmPassword: "differentpass",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("throws UNAUTHORIZED when not authenticated (no family in ctx)", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller({ ...ctx, family: null });
    await expect(
      caller.familyAuth.changePassword({
        currentPassword: TEST_PASSWORD,
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("VIYANA_FAMILY_COOKIE constant", () => {
  it("has the correct value", () => {
    expect(VIYANA_FAMILY_COOKIE).toBe("viyana_family_session");
  });
});
