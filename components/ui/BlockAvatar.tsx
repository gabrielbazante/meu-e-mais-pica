// Mascote em bloco no estilo da logo, gerado de forma determinística a partir do
// id do jogador: cor, olhos, boca e leve inclinação variam por pessoa.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Eyes({ style }: { style: number }) {
  if (style === 2) {
    // óculos escuros
    return <rect x="15" y="24" width="34" height="9" rx="3" fill="#1a1a2e" />;
  }
  if (style === 1) {
    // olhos felizes
    return (
      <g stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M20 31 q4 -6 8 0" />
        <path d="M36 31 q4 -6 8 0" />
      </g>
    );
  }
  // olhos redondos
  return (
    <g>
      <circle cx="24" cy="29" r="5" fill="#fff" stroke="#1a1a2e" strokeWidth="2" />
      <circle cx="40" cy="29" r="5" fill="#fff" stroke="#1a1a2e" strokeWidth="2" />
      <circle cx="25" cy="30" r="2.2" fill="#1a1a2e" />
      <circle cx="41" cy="30" r="2.2" fill="#1a1a2e" />
    </g>
  );
}

function Mouth({ style }: { style: number }) {
  if (style === 1) {
    // boca aberta sorrindo
    return <path d="M24 40 q8 11 16 0 z" fill="#1a1a2e" />;
  }
  if (style === 2) {
    // sorriso de lado
    return <path d="M23 43 q8 4 15 -2" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  // sorriso normal
  return <path d="M22 42 q10 8 20 0" stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round" />;
}

// colorIndex (opcional): quando informado (ex. ordem de entrada na sala), garante
// cores distintas entre jogadores. Sem ele, a cor vem do hash do seed.
export function BlockAvatar({ seed, size = 40, colorIndex }: { seed: string; size?: number; colorIndex?: number }) {
  const h = hash(seed || "x");
  const hue = ((colorIndex ?? h) % 12) * 30;
  const color = `hsl(${hue} 78% 63%)`; // 12 matizes vivos
  const eyeStyle = (h >> 3) % 3;
  const mouthStyle = (h >> 6) % 3;
  const tilt = ((h >> 9) % 2 === 0 ? -1 : 1) * (4 + (h % 5));

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style={{ flexShrink: 0 }}>
      <g transform={`rotate(${tilt} 32 32)`}>
        <rect x="8" y="9" width="48" height="48" rx="13" fill={color} stroke="#1a1a2e" strokeWidth="4" />
        {/* brilho */}
        <rect x="14" y="15" width="12" height="6" rx="3" fill="#ffffff" opacity="0.35" />
        <Eyes style={eyeStyle} />
        <Mouth style={mouthStyle} />
      </g>
    </svg>
  );
}
