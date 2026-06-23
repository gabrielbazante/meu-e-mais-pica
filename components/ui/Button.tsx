import { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl border-3 border-ink bg-party-red px-4 py-3 font-extrabold text-white " +
        "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
        "disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-chunkySm " +
        "transition-all " + className
      }
    />
  );
}
