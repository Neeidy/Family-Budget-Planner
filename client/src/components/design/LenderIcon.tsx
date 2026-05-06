interface LenderIconProps {
  lender?: string;
  size?: number;
}

const VARIANTS = ["bank-blue", "bank-green", "bank-orange", "credit-card", "generic"] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickVariant(lender?: string): typeof VARIANTS[number] {
  if (!lender) return "generic";
  const lower = lender.toLowerCase();
  if (lower.includes("kredi kart") || lower.includes("credit card") || lower.includes("visa") || lower.includes("master")) return "credit-card";
  return VARIANTS[hashString(lower) % 4]; // 0..3 (skip last "generic")
}

function BankBlue({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      <rect x="6" y="22" width="36" height="20" rx="3" fill="oklch(0.62 0.16 245)" />
      <rect x="6" y="22" width="36" height="4" fill="oklch(0.50 0.18 245)" />
      <path d="M 8 22 L 24 8 L 40 22 Z" fill="oklch(0.55 0.17 245)" />
      <rect x="12" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="18" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="24" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="30" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <circle cx="24" cy="16" r="1.5" fill="oklch(0.99 0 0)" />
    </svg>
  );
}

function BankGreen({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      <rect x="6" y="22" width="36" height="20" rx="3" fill="oklch(0.62 0.17 155)" />
      <rect x="6" y="22" width="36" height="4" fill="oklch(0.50 0.18 155)" />
      <path d="M 8 22 L 24 8 L 40 22 Z" fill="oklch(0.55 0.17 155)" />
      <rect x="12" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="18" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="24" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="30" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <circle cx="24" cy="16" r="1.5" fill="oklch(0.99 0 0)" />
    </svg>
  );
}

function BankOrange({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      <rect x="6" y="22" width="36" height="20" rx="3" fill="oklch(0.7 0.17 55)" />
      <rect x="6" y="22" width="36" height="4" fill="oklch(0.58 0.18 55)" />
      <path d="M 8 22 L 24 8 L 40 22 Z" fill="oklch(0.62 0.18 55)" />
      <rect x="12" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="18" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="24" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <rect x="30" y="28" width="3" height="10" fill="oklch(0.99 0 0)" opacity="0.7" />
      <circle cx="24" cy="16" r="1.5" fill="oklch(0.99 0 0)" />
    </svg>
  );
}

function CreditCard({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      <rect x="4" y="12" width="40" height="26" rx="4" fill="oklch(0.32 0.02 265)" />
      <rect x="4" y="18" width="40" height="6" fill="oklch(0.20 0.02 265)" />
      <rect x="8" y="28" width="14" height="2" rx="1" fill="oklch(0.85 0.02 265)" opacity="0.7" />
      <rect x="8" y="32" width="22" height="2" rx="1" fill="oklch(0.85 0.02 265)" opacity="0.5" />
      <circle cx="34" cy="33" r="3" fill="oklch(0.7 0.17 55)" opacity="0.85" />
      <circle cx="38" cy="33" r="3" fill="oklch(0.65 0.22 25)" opacity="0.85" />
    </svg>
  );
}

function Generic({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
      <circle cx="24" cy="24" r="18" fill="oklch(0.6 0.04 250)" opacity="0.3" />
      <text x="24" y="32" fontSize="20" textAnchor="middle" fill="oklch(0.5 0.05 250)" fontWeight="700">€</text>
    </svg>
  );
}

export function LenderIcon({ lender, size = 40 }: LenderIconProps) {
  const variant = pickVariant(lender);
  switch (variant) {
    case "bank-blue":   return <BankBlue size={size} />;
    case "bank-green":  return <BankGreen size={size} />;
    case "bank-orange": return <BankOrange size={size} />;
    case "credit-card": return <CreditCard size={size} />;
    default:            return <Generic size={size} />;
  }
}
