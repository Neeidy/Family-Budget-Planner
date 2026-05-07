import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookies } from "cookie";
import {
  verifyFamilySession,
  VIYANA_FAMILY_COOKIE,
  type FamilyPerson,
} from "../auth/familyAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  family: { person: FamilyPerson } | null;
  isGuest: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

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
    user,
    family,
    isGuest,
  };
}
