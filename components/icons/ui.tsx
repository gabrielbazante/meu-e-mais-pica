import { Svg, type IconProps } from "./Svg";
import { INK, BLUE, PINK, RED, LILAC, WA_GREEN, GOLD, SILVER } from "./colors";

export function Play(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4.5v15l12-7.5Z" fill="#ffffff" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function Restart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5v5h5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Users(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.6" fill={BLUE} stroke={INK} strokeWidth="1.6" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0Z" fill={BLUE} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16.5" cy="9" r="3" fill={PINK} stroke={INK} strokeWidth="1.5" />
      <path d="M14 20a5 5 0 0 1 8 0Z" fill={PINK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

export function Kick(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={RED} stroke={INK} strokeWidth="1.8" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

export function WhatsApp(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Z" fill={WA_GREEN} stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.7 7.8c.3-.6.7-.6 1-.6h.6c.2 0 .4 0 .6.5l.9 2c.1.3 0 .5-.1.7l-.6.7c-.1.2-.2.3 0 .6.6 1 1.6 2 2.7 2.6.3.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.2.5.4 0 .8-.4 1.6-1.4 2-1 .4-2.2.3-4.3-.8-2.4-1.3-4.3-3.8-4.6-5.5-.2-1.1.2-2 .8-2.4Z" fill="#ffffff" />
    </Svg>
  );
}

export function Copy(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="8" y="8" width="13" height="13" rx="3" fill="#ffffff" stroke={INK} strokeWidth="1.8" />
      <rect x="3" y="3" width="13" height="13" rx="3" fill={LILAC} stroke={INK} strokeWidth="1.8" />
      <path d="M7 9.5h5M7 12.5h3.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function Alert(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5l10 17.5H2Z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.3" fill={INK} />
    </Svg>
  );
}

export function Exit(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 3h10v18H4Z" fill={LILAC} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="11" cy="12.5" r="1.1" fill={INK} />
      <path d="M15 12h6M18 9l3 3-3 3" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Sad(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={SILVER} stroke={INK} strokeWidth="1.8" />
      <circle cx="8.7" cy="10" r="1.3" fill={INK} />
      <circle cx="15.3" cy="10" r="1.3" fill={INK} />
      <path d="M8.5 16.5c2-1.8 5-1.8 7 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 12H5M11 5l-7 7 7 7" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
