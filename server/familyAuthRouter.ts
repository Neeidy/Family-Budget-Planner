import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  verifyPassword,
  hashPassword,
  signFamilySession,
  VIYANA_FAMILY_COOKIE,
  type FamilyPerson,
} from "./auth/familyAuth";

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: isProduction,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export const familyAuthRouter = router({
  /**
   * Login with family password + person selection.
   * Sets httpOnly cookie on success.
   */
  login: publicProcedure
    .input(
      z.object({
        password: z.string().min(1).max(200),
        person: z.enum(["Benim", "Esim"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Always call verifyPassword even on wrong password (timing attack protection)
      const isValid = verifyPassword(input.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Şifre hatalı",
        });
      }

      const token = await signFamilySession({ person: input.person as FamilyPerson });

      ctx.res.cookie(VIYANA_FAMILY_COOKIE, token, getCookieOptions(ENV.isProduction));

      return { ok: true, person: input.person } as const;
    }),

  /**
   * Logout: clears the family session cookie.
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(VIYANA_FAMILY_COOKIE, {
      httpOnly: true,
      sameSite: "strict",
      secure: ENV.isProduction,
      path: "/",
      maxAge: -1,
    });
    return { ok: true } as const;
  }),

  /**
   * Returns current session person or null if not authenticated.
   * Uses ctx.family which is already parsed and verified in createContext.
   */
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.family) return null;
    return { person: ctx.family.person };
  }),

  /**
   * Change family password.
   * Requires current password for verification, then updates FAMILY_PASSWORD_HASH env.
   * Since env vars are managed by the platform, we store the new hash in a runtime
   * env override and return it so the user can update it via webdev_request_secrets.
   * For in-session use, we update process.env directly (lasts until next restart).
   */
  changePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(4).max(200),
        confirmPassword: z.string().min(4).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Must be authenticated
      if (!ctx.family) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Oturum açmanız gerekiyor" });
      }

      // Passwords must match
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Yeni şifreler eşleşmiyor" });
      }

      // Verify current password
      const isValid = verifyPassword(input.currentPassword);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Mevcut şifre hatalı" });
      }

      // Hash new password
      const newHash = hashPassword(input.newPassword);

      // Update in-process env so it works immediately without restart
      process.env.FAMILY_PASSWORD_HASH = newHash;

      return { ok: true, newHash } as const;
    }),
});
