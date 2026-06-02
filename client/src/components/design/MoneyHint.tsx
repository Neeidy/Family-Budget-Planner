import { parseMoney } from "@/lib/format";
import { useFormatters } from "@/lib/useFormatters";

interface MoneyHintProps {
  raw: string;
}

/**
 * Live preview for currency inputs. Renders nothing when the input
 * is empty, unparseable, or non-positive — otherwise shows the
 * canonical formatted value below the input. Useful when users type
 * "1.500,50" or "1500.50" and want immediate confirmation that the
 * value parses to €1.500,50.
 */
export function MoneyHint({ raw }: MoneyHintProps) {
  const { fm } = useFormatters();
  const num = parseMoney(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 4,
        fontSize: 11,
        color: "var(--text-tertiary)",
        fontFeatureSettings: '"tnum"',
      }}
    >
      = {fm(num)}
    </span>
  );
}
