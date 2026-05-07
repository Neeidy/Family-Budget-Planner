import { ReactNode, CSSProperties } from "react";

// ── Primitives ─────────────────────────────────────────────

interface SkelBoxProps {
  w?: string | number;
  h?: string | number;
  r?: number;
  style?: CSSProperties;
}

export function SkelBox({ w, h = 12, r = 8, style }: SkelBoxProps) {
  return (
    <div
      className="skel"
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: r,
        ...(style ?? {}),
      }}
    />
  );
}

export function SkelLine({
  w = "100%",
  h = 12,
}: {
  w?: string | number;
  h?: number;
}) {
  return <SkelBox w={w} h={h} r={6} />;
}

export function SkelCircle({ size = 32 }: { size?: number }) {
  return <SkelBox w={size} h={size} r={999} />;
}

// ── Compound ───────────────────────────────────────────────

export function SkelRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "var(--bg-surface)",
        borderRadius: 12,
        border: "1px solid var(--border-faint)",
      }}
    >
      <SkelCircle size={36} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minWidth: 0,
        }}
      >
        <SkelLine w="40%" h={13} />
        <SkelLine w="25%" h={10} />
      </div>
      <SkelLine w={70} h={14} />
    </div>
  );
}

export function SkelCard({
  h = 120,
  children,
}: {
  h?: number;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: 20,
        minHeight: h,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {children ?? (
        <>
          <SkelLine w="40%" h={11} />
          <SkelLine w="65%" h={26} />
          <SkelLine w="30%" h={10} />
        </>
      )}
    </div>
  );
}

const CHART_BARS = [55, 72, 40, 88, 60, 75, 45, 90, 65, 50, 78, 62];

export function SkelChart({ h = 220 }: { h?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <SkelLine w="35%" h={14} />
        <div style={{ height: 8 }} />
        <SkelLine w="20%" h={10} />
      </div>
      <div
        style={{
          height: h,
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          padding: "12px 0 8px",
          borderBottom: "1px dashed var(--border-faint)",
        }}
      >
        {CHART_BARS.map((b, i) => (
          <div
            key={i}
            className="skel"
            style={{
              flex: 1,
              height: `${b}%`,
              borderRadius: "6px 6px 2px 2px",
              opacity: 0.6 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {[0, 1, 2, 3].map(i => (
          <SkelLine key={i} w={28} h={9} />
        ))}
      </div>
    </div>
  );
}

export function SkelHero() {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-card)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <SkelLine w="45%" h={12} />
      <SkelLine w="55%" h={50} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
        <SkelLine w={90} h={26} />
        <SkelLine w={110} h={26} />
        <SkelLine w={80} h={26} />
      </div>
    </div>
  );
}

// ── Page-level skeletons ────────────────────────────────────

export type SkeletonPage =
  | "ana"
  | "gelir"
  | "borc"
  | "birikim"
  | "rapor"
  | "ayar";

export function PageSkeleton({ page }: { page: SkeletonPage }) {
  const gap = 20;

  if (page === "ana") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        <SkelHero />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>
          <SkelCard h={140} />
          <SkelCard h={140} />
        </div>
        <SkelChart h={220} />
        <SkelCard h={180} />
      </div>
    );
  }

  if (page === "rapor") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        <div>
          <SkelLine w="30%" h={28} />
          <div style={{ height: 8 }} />
          <SkelLine w="40%" h={11} />
        </div>
        <SkelChart h={280} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>
          <SkelChart h={180} />
          <SkelChart h={180} />
        </div>
      </div>
    );
  }

  // gelir / borc / birikim / ayar — list view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      <div>
        <SkelLine w="30%" h={28} />
        <div style={{ height: 8 }} />
        <SkelLine w="35%" h={11} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap }}>
        <SkelCard h={110} />
        <SkelCard h={110} />
        <SkelCard h={110} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <SkelRow key={i} />
        ))}
      </div>
    </div>
  );
}
