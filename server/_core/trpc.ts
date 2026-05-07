import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Family auth middleware — requires valid viyana_family_session cookie
const requireFamily = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.family) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Aile oturumu gerekli" });
  }
  return next({ ctx: { ...ctx, family: ctx.family } });
});

export const familyProtectedProcedure = t.procedure.use(requireFamily);

/**
 * guestSafeProcedure — endpoints that read budget data.
 *  - Queries: pass if guest (demo subdomain) OR family-authed; sets ctx.demoMode flag.
 *  - Mutations: throw FORBIDDEN for guests, require family auth.
 * Used for familyBudget.get, .history.list, .history.get and the mutations
 * that should be blocked on demo (.save, .history.restore handled inline).
 */
const guestSafe = t.middleware(async ({ ctx, type, next }) => {
  if (type === "mutation") {
    if (ctx.isGuest) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Demo modunda değişiklik yapılamaz" });
    }
    if (!ctx.family) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Aile oturumu gerekli" });
    }
    return next({ ctx: { ...ctx, family: ctx.family, demoMode: false as const } });
  }
  if (ctx.isGuest) return next({ ctx: { ...ctx, demoMode: true as const } });
  if (ctx.family) return next({ ctx: { ...ctx, family: ctx.family, demoMode: false as const } });
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Aile oturumu gerekli" });
});

export const guestSafeProcedure = t.procedure.use(guestSafe);

/**
 * guestOnlyProcedure — endpoints that exist *only* on the demo subdomain.
 * Returns NOT_FOUND when not in guest mode. Used for the demo profile
 * picker and the bypass-login mutation.
 */
const guestOnly = t.middleware(async ({ ctx, next }) => {
  if (!ctx.isGuest) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return next({ ctx });
});

export const guestOnlyProcedure = t.procedure.use(guestOnly);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
