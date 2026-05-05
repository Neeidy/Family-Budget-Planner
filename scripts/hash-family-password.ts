/**
 * CLI helper to generate a bcrypt hash for the family password.
 * Usage: pnpm tsx scripts/hash-family-password.ts <plaintext>
 * Copy the output to FAMILY_PASSWORD_HASH in your .env
 */
import bcrypt from "bcryptjs";

const plaintext = process.argv[2];

if (!plaintext) {
  console.error("Kullanım: pnpm tsx scripts/hash-family-password.ts <şifre>");
  process.exit(1);
}

const hash = await bcrypt.hash(plaintext, 12);
console.log(hash);
