import { THEMES, LETTERS } from "./themes";

export interface DrawOptions {
  prevTheme?: string;
  rng?: () => number;
}

export function drawRound(opts: DrawOptions = {}): { theme: string; letter: string } {
  const rng = opts.rng ?? Math.random;
  const pool = opts.prevTheme
    ? THEMES.filter((t) => t !== opts.prevTheme)
    : [...THEMES];
  const theme = pool[Math.floor(rng() * pool.length)];
  const letter = LETTERS[Math.floor(rng() * LETTERS.length)];
  return { theme, letter };
}
