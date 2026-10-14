import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ className = "", icon, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      {...props}
      className={
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border-3 border-ink bg-party-red px-4 py-3 font-display font-extrabold text-white " +
        "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
        "disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-chunkySm " +
        "transition-all " + className
      }
    >
      {icon}
      {children}
    </button>
  );
}
