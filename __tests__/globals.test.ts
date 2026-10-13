import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("globals.css (fundações A2)", () => {
  it("não usa mais Arial e aplica Fredoka no body", () => {
    expect(css).not.toMatch(/Arial/);
    expect(css).toMatch(/font-family:\s*var\(--font-fredoka\)/);
  });

  it("tem os tokens de cor do logo", () => {
    for (const t of [
      "--color-logo-pink: #ff1f8e",
      "--color-logo-purple: #8b2be2",
      "--color-logo-blue: #1e7be0",
      "--color-logo-gold: #ffc61a",
      "--color-cream: #fff6e6",
    ]) expect(css).toContain(t);
  });

  it("define as utilities text-logo, sticker e pill", () => {
    expect(css).toMatch(/@utility text-logo\s*\{/);
    expect(css).toMatch(/@utility sticker\s*\{/);
    expect(css).toMatch(/@utility pill\s*\{/);
  });

  it("só anima o confete quando o usuário não pediu menos movimento", () => {
    const m = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/);
    expect(m?.[1]).toMatch(/\.confetti-fall/);
  });

  it("não tem mais o tema escuro herdado do template", () => {
    expect(css).not.toMatch(/prefers-color-scheme: dark/);
  });
});
