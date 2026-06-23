import { describe, it, expect } from "vitest";
import { drawRound } from "@/lib/game/draw";
import { THEMES, LETTERS } from "@/lib/game/themes";

describe("drawRound", () => {
  it("rng=0 retorna o primeiro tema e a primeira letra", () => {
    const r = drawRound({ rng: () => 0 });
    expect(r.theme).toBe(THEMES[0]);
    expect(r.letter).toBe(LETTERS[0]);
  });

  it("nunca sorteia letras difíceis (K, W, X, Y, Q)", () => {
    for (let i = 0; i < 200; i++) {
      const { letter } = drawRound({ rng: Math.random });
      expect(["K", "W", "X", "Y", "Q"]).not.toContain(letter);
    }
  });

  it("não repete o tema da rodada anterior", () => {
    const prev = THEMES[0];
    for (let i = 0; i < 200; i++) {
      const { theme } = drawRound({ prevTheme: prev, rng: Math.random });
      expect(theme).not.toBe(prev);
    }
  });
});
