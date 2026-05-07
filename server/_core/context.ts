import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookies } from "cookie";
import {
  verifyFamilySession,
  VIYANA_FAMILY_COOKIE,
  type FamilyPerson,
} from "../auth/familyAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  family: { person: FamilyPerson } | null;
  isGuest: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Parse family session cookie
  let family: { person: FamilyPerson } | null = null;
  try {
    const cookieHeader = opts.req.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies[VIYANA_FAMILY_COOKIE];
    if (token) {
      family = await verifyFamilySession(token);
    }
  } catch {
    family = null;
  }

  const isGuest = !!(opts.req as { isGuestRequest?: boolean }).isGuestRequest;

  return {
    req: opts.req,
    res: opts.res,
    family,
    isGuest,
  };
}
