import type { ReactNode } from "react";

export interface IconProps {
  size?: number;
  className?: string;
  // Sem title: ícone decorativo (o texto ao lado carrega o significado).
  title?: string;
}

export function Svg({ size = 24, className, title, children }: IconProps & { children: ReactNode }) {
  const a11y = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      focusable="false"
      style={{ flexShrink: 0 }}
      {...a11y}
    >
      {children}
    </svg>
  );
}
