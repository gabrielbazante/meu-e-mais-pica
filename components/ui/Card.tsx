import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={"rounded-2xl border-3 border-ink bg-white p-4 shadow-chunky " + className}
    />
  );
}
