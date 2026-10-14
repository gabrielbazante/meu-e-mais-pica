import type { CSSProperties } from "react";

// Confete geométrico nas cores do logo. Posições FIXAS (nada de Math.random no render):
// mesma saída no servidor e no cliente, e o lint react-hooks/purity fica satisfeito.

type Piece = { k: "tri" | "dot"; x: number; y: number; c: string; s: number; r: number };

const PINK = "#ff1f8e", PURPLE = "#8b2be2", BLUE = "#1e7be0", GOLD = "#ffc61a", CREAM = "#fff6e6";

const SUBTLE: Piece[] = [
  { k: "tri", x: 6, y: 5, c: PINK, s: 18, r: 20 },
  { k: "tri", x: 88, y: 9, c: BLUE, s: 18, r: -30 },
  { k: "dot", x: 93, y: 46, c: PURPLE, s: 10, r: 0 },
  { k: "dot", x: 4, y: 62, c: PINK, s: 8, r: 0 },
  { k: "tri", x: 82, y: 4, c: PURPLE, s: 12, r: 60 },
  { k: "tri", x: 9, y: 30, c: BLUE, s: 14, r: 110 },
  { k: "dot", x: 52, y: 2, c: CREAM, s: 6, r: 0 },
];

const COLORS = [PINK, PURPLE, BLUE, GOLD, CREAM];
const PARTY: Piece[] = Array.from({ length: 28 }, (_, i) => ({
  k: i % 3 === 0 ? "dot" : "tri",
  x: (i * 37) % 100,
  y: -((i * 13) % 30),
  c: COLORS[i % COLORS.length],
  s: 10 + ((i * 7) % 10),
  r: (i * 47) % 360,
}));

export function Confetti({ variant = "subtle" }: { variant?: "subtle" | "party" }) {
  const party = variant === "party";
  const pieces = party ? PARTY : SUBTLE;
  return (
    <div
      aria-hidden="true"
      className={(party ? "fixed inset-0 z-40" : "absolute inset-0 -z-10") + " pointer-events-none overflow-hidden"}
    >
      {pieces.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={p.s}
          height={p.s}
          className={party ? "confetti-fall absolute" : "absolute"}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            rotate: `${p.r}deg`,
            ...(party ? ({ "--dur": `${2 + (i % 5) * 0.35}s`, "--delay": `${(i % 7) * 0.15}s` } as CSSProperties) : {}),
          }}
        >
          {p.k === "tri"
            ? <polygon points="2,4 18,2 10,18" fill={p.c} stroke="#1a1a2e" strokeWidth="1.5" strokeLinejoin="round" />
            : <circle cx="10" cy="10" r="8" fill={p.c} stroke="#1a1a2e" strokeWidth="1.5" />}
        </svg>
      ))}
    </div>
  );
}
