/**
 * CLI helper to generate an HMAC-SHA256 hash for the family password.
 * Usage: pnpm tsx scripts/hash-family-password.ts <plaintext>
 * Copy the output (64-char hex) to FAMILY_PASSWORD_HASH in your .env
 *
 * The hash algorithm MUST match server/auth/familyAuth.ts → hashPassword()
 * which uses HMAC-SHA256 with salt "viyana-family-salt-2026".
 */
import { createHmac } from "crypto";
import { createInterface } from "readline";

const PASSWORD_SALT = "viyana-family-salt-2026";

const plaintext = process.argv[2];

if (!plaintext) {
  console.error("Kullanım: pnpm tsx scripts/hash-family-password.ts <şifre>");
  process.exit(1);
}

// ─── Weak-password detection ─────────────────────────────────────────────────

const BANNED_SUBSTRINGS = [
  "viyana",
  "vienna",
  "budget",
  "family",
  "password",
  "123",
];

function isWeak(pw: string): { weak: boolean; reason: string } {
  if (pw.length < 12) {
    return {
      weak: true,
      reason: `Çok kısa (${pw.length} karakter) — en az 12 karakter önerilir`,
    };
  }
  if (/^[a-zA-Z0-9]+$/.test(pw)) {
    return {
      weak: true,
      reason: "Yalnızca harf ve rakam içeriyor — özel karakter ekleyin",
    };
  }
  const lower = pw.toLowerCase();
  for (const sub of BANNED_SUBSTRINGS) {
    if (lower.includes(sub)) {
      return { weak: true, reason: `Yaygın kelime içeriyor: "${sub}"` };
    }
  }
  return { weak: false, reason: "" };
}

async function confirmWeak(reason: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    process.stderr.write(
      `\x1b[31m⚠️  Zayıf şifre uyarısı: ${reason}\x1b[0m\n` +
        `Yine de devam etmek istiyor musunuz? [evet/hayır] `
    );
    rl.question("", answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "evet");
    });
  });
}

async function main() {
  const check = isWeak(plaintext);
  if (check.weak) {
    const confirmed = await confirmWeak(check.reason);
    if (!confirmed) {
      console.error("İptal edildi.");
      process.exit(1);
    }
  }

  const hash = createHmac("sha256", PASSWORD_SALT)
    .update(plaintext)
    .digest("hex");
  console.log(hash);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
