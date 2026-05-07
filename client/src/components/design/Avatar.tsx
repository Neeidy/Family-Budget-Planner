import React from "react";

export type AvatarWho = "yigit" | "arzu" | "ev" | "tumu";

interface AvatarProps {
  who: AvatarWho;
  size?: number;
}

function OwlSvg({ s }: { s: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={s}
      height={s}
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="owl-body" cx="0.4" cy="0.35" r="0.85">
          <stop offset="0%" stopColor="oklch(0.78 0.06 250)" />
          <stop offset="60%" stopColor="oklch(0.55 0.10 250)" />
          <stop offset="100%" stopColor="oklch(0.35 0.08 250)" />
        </radialGradient>
        <radialGradient id="owl-belly" cx="0.5" cy="0.55" r="0.6">
          <stop offset="0%" stopColor="oklch(0.92 0.04 250)" />
          <stop
            offset="100%"
            stopColor="oklch(0.78 0.06 250)"
            stopOpacity={0}
          />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="34" ry="32" fill="url(#owl-body)" />
      <ellipse cx="50" cy="64" rx="22" ry="20" fill="url(#owl-belly)" />
      <path d="M 22 32 L 28 18 L 34 30 Z" fill="oklch(0.42 0.09 250)" />
      <path d="M 78 32 L 72 18 L 66 30 Z" fill="oklch(0.42 0.09 250)" />
      <ellipse cx="50" cy="44" rx="26" ry="24" fill="oklch(0.85 0.04 250)" />
      <circle cx="38" cy="44" r="11" fill="white" />
      <circle cx="62" cy="44" r="11" fill="white" />
      <circle cx="38" cy="44" r="7" fill="oklch(0.25 0.10 250)" />
      <circle cx="62" cy="44" r="7" fill="oklch(0.25 0.10 250)" />
      <circle cx="40" cy="42" r="2.2" fill="white" />
      <circle cx="64" cy="42" r="2.2" fill="white" />
      <path
        d="M 46 52 L 54 52 L 50 60 Z"
        fill="oklch(0.72 0.16 65)"
        stroke="oklch(0.45 0.12 60)"
        strokeWidth="1"
      />
      <path
        d="M 18 60 Q 22 76, 32 84"
        stroke="oklch(0.35 0.08 250)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 82 60 Q 78 76, 68 84"
        stroke="oklch(0.35 0.08 250)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PandaSvg({ s }: { s: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={s}
      height={s}
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="panda-head" cx="0.4" cy="0.35" r="0.85">
          <stop offset="0%" stopColor="white" />
          <stop offset="80%" stopColor="oklch(0.94 0.005 80)" />
          <stop offset="100%" stopColor="oklch(0.85 0.01 80)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="36" fill="url(#panda-head)" />
      <circle cx="22" cy="22" r="11" fill="oklch(0.20 0.02 300)" />
      <circle cx="78" cy="22" r="11" fill="oklch(0.20 0.02 300)" />
      <circle cx="22" cy="22" r="6" fill="oklch(0.55 0.18 320)" opacity={0.5} />
      <circle cx="78" cy="22" r="6" fill="oklch(0.55 0.18 320)" opacity={0.5} />
      <ellipse
        cx="36"
        cy="48"
        rx="9"
        ry="11"
        fill="oklch(0.20 0.02 300)"
        transform="rotate(-18 36 48)"
      />
      <ellipse
        cx="64"
        cy="48"
        rx="9"
        ry="11"
        fill="oklch(0.20 0.02 300)"
        transform="rotate(18 64 48)"
      />
      <circle cx="36" cy="49" r="3.5" fill="white" />
      <circle cx="64" cy="49" r="3.5" fill="white" />
      <circle cx="36" cy="49" r="2.2" fill="oklch(0.10 0 0)" />
      <circle cx="64" cy="49" r="2.2" fill="oklch(0.10 0 0)" />
      <circle cx="37" cy="48" r="0.8" fill="white" />
      <circle cx="65" cy="48" r="0.8" fill="white" />
      <ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="oklch(0.20 0.02 300)" />
      <path
        d="M 50 65 L 50 69 M 50 69 Q 46 72, 44 70 M 50 69 Q 54 72, 56 70"
        stroke="oklch(0.20 0.02 300)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="28" cy="62" r="4" fill="oklch(0.78 0.10 25)" opacity={0.4} />
      <circle cx="72" cy="62" r="4" fill="oklch(0.78 0.10 25)" opacity={0.4} />
    </svg>
  );
}

const OWNER_META: Record<
  AvatarWho,
  {
    color: string;
    soft: string;
    kind: "owl" | "panda" | "glyph";
    glyph?: string;
  }
> = {
  yigit: {
    color: "var(--owner-yigit)",
    soft: "var(--owner-yigit-soft)",
    kind: "owl",
  },
  arzu: {
    color: "var(--owner-arzu)",
    soft: "var(--owner-arzu-soft)",
    kind: "panda",
  },
  ev: {
    color: "var(--owner-ev)",
    soft: "var(--owner-ev-soft)",
    kind: "glyph",
    glyph: "🏠",
  },
  tumu: {
    color: "var(--owner-tumu)",
    soft: "var(--owner-tumu-soft)",
    kind: "glyph",
    glyph: "★",
  },
};

export function Avatar({ who, size = 32 }: AvatarProps) {
  const m = OWNER_META[who] ?? OWNER_META.yigit;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: m.soft,
        color: m.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
        boxShadow: `inset 0 0 0 1.5px ${m.color}`,
        overflow: "hidden",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      {m.kind === "owl" ? (
        <OwlSvg s={size * 0.92} />
      ) : m.kind === "panda" ? (
        <PandaSvg s={size * 0.92} />
      ) : (
        m.glyph
      )}
    </div>
  );
}
