import { Svg, type IconProps } from "./Svg";
import { INK, GOLD, PURPLE, PINK, BLUE, RED, TEAL, GREEN, SILVER, BRONZE, ORANGE } from "./colors";

export function Crown(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 7l5 4 5-7 5 7 5-4-2 12H4L2 7Z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12l1.6 2-1.6 2-1.6-2Z" fill={PURPLE} stroke={INK} strokeWidth=".8" />
    </Svg>
  );
}

export function Trophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 3h10v3h3v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A5 5 0 0 1 8.6 13 5 5 0 0 1 4 8V6h3V3Z" fill={GOLD} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6.5l1.2 1.6L12 9.7l-1.2-1.6Z" fill={PURPLE} />
    </Svg>
  );
}

const MEDAL_FILL = { 1: GOLD, 2: SILVER, 3: BRONZE } as const;

export function Medal({ rank, ...p }: IconProps & { rank: 1 | 2 | 3 }) {
  return (
    <Svg {...p}>
      <path d="M7 1h4l1.5 7h-4Z" fill={BLUE} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 1h4l-2.5 7h-4Z" fill={PINK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" fill={MEDAL_FILL[rank]} stroke={INK} strokeWidth="1.8" />
      <text x="12" y="18.6" textAnchor="middle" style={{ fontFamily: "var(--font-baloo2), sans-serif" }} fontWeight="800" fontSize="9" fill={INK}>{rank}</text>
    </Svg>
  );
}

export function Flame(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.2 2.6-5.4.2 1.8.9 3 2 3.4C10.6 8 11 5 12 2Z" fill={ORANGE} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12c.6 1.6 2.4 2.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.5.9-2.4 2.4-4.6Z" fill={GOLD} />
    </Svg>
  );
}

export function Tomato(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13.5" r="8.5" fill={RED} stroke={INK} strokeWidth="1.8" />
      <path d="M12 5.5c-1-2-3-2.5-4.5-2 1.3 1 2 1.6 2.2 2.6M12 5.5c1-2 3-2.5 4.5-2-1.3 1-2 1.6-2.2 2.6M12 5.5V3" stroke={INK} strokeWidth="1.5" fill={GREEN} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12.5l1.5 1.2M17 12.5l-1.5 1.2M9.3 17.5c1.6-1 3.8-1 5.4 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="16.5" cy="17" r="1.2" fill={PURPLE} />
    </Svg>
  );
}

export function Clock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill="#ffffff" stroke={INK} strokeWidth="1.8" />
      <path d="M12 2.5A9.5 9.5 0 0 1 21.5 12H12Z" fill={RED} opacity=".85" />
      <path d="M12 12V7M12 12l3.5 2" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function Target(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={PINK} stroke={INK} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.6" fill={PINK} stroke={INK} strokeWidth="1.3" />
    </Svg>
  );
}

export function Ballot(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="11" width="18" height="10" rx="2" fill={BLUE} stroke={INK} strokeWidth="1.8" />
      <rect x="7" y="3" width="10" height="11" rx="1.5" fill="#ffffff" stroke={INK} strokeWidth="1.6" transform="rotate(-6 12 8)" />
      <path d="M9.5 8.5l2 2 3.5-4" stroke={TEAL} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="13.5" width="12" height="1.8" rx=".9" fill={INK} />
    </Svg>
  );
}

export function Scale(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v17M6 20h12M4 6h16" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 6l-2.5 6a2.5 2.5 0 0 0 5 0ZM20 6l-2.5 6a2.5 2.5 0 0 0 5 0Z" fill={PURPLE} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

export function Check(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={TEAL} stroke={INK} strokeWidth="1.8" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Star(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2l2.6 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.6 6.2 20l1.6-6.6L2.6 8.9l6.8-.6Z" fill={GOLD} stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
    </Svg>
  );
}
