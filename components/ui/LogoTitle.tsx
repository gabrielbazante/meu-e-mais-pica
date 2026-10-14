import type { ReactNode } from "react";

const SIZES = { lg: "text-4xl", md: "text-3xl", sm: "text-2xl" } as const;

// Título com as letras do logo (creme, contorno grosso, sombra dura), sempre em caixa alta.
export function LogoTitle({ as: Tag = "h1", size = "lg", className = "", children }: {
  as?: "h1" | "h2"; size?: keyof typeof SIZES; className?: string; children: ReactNode;
}) {
  return (
    <Tag className={`text-logo font-display font-extrabold uppercase leading-none text-center break-words ${SIZES[size]} ${className}`}>
      {children}
    </Tag>
  );
}
