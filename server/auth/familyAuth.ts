import { createHmac } from "crypto";
import { SignJWT, jwtVerify } from "jose";

export const VIYANA_FAMILY_COOKIE = "viyana_family_session";

export type FamilyPerson = "Benim" | "Esim";

interface FamilySessionPayload {
  person: FamilyPerson;
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.FAMILY_COOKIE_SECRET ?? "");
}

/**
 * Fixed salt used for HMAC-SHA256 password hashing.
 * This avoids bcrypt's $ characters which break secrets systems.
 */
const PASSWORD_SALT = "viyana-family-salt-2026";

/**
 * Hashes a plaintext password with HMAC-SHA256.
 * Returns a 64-char hex string (no $ characters).
 */
export function hashPassword(plaintext: string): string {
  return createHmac("sha256", PASSWORD_SALT).update(plaintext).digest("hex");
}

/**
 * Verifies a plaintext password against the stored HMAC-SHA256 hash.
 */
export function verifyPassword(plaintext: string): boolean {
  const storedHash = process.env.FAMILY_PASSWORD_HASH ?? "";
  if (!storedHash) return false;
  const computedHash = hashPassword(plaintext);
  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Signs a JWT session token for the given family person.
 * Expires in 30 days.
 */
export async function signFamilySession(payload: FamilySessionPayload): Promise<string> {
  return new SignJWT({ person: payload.person })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

/**
 * Verifies a JWT session token.
 * Returns the payload if valid, null if invalid or expired.
 */
export async function verifyFamilySession(token: string): Promise<FamilySessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const person = payload.person as string;
    if (person !== "Benim" && person !== "Esim") return null;
    return { person: person as FamilyPerson };
  } catch {
    return null;
  }
}
