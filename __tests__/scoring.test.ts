import { describe, it, expect } from "vitest";
import { roundDeltas } from "@/lib/game/scoring";

describe("roundDeltas", () => {
  it("melhor +10, pior 0, respondentes +2", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "c", "d"],
      answeredIds: ["a", "b", "c", "d"],
      bestId: "a",
      worstId: "d",
      currentTotals: { a: 0, b: 0, c: 0, d: 0 },
    });
    expect(d).toEqual({ a: 10, b: 2, c: 2, d: 0 });
  });

  it("nao-respondente com pontos leva -1", () => {
    const d = roundDeltas({
      playerIds: ["a", "e"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 4, e: 5 },
    });
    expect(d.e).toBe(-1);
  });

  it("nao-respondente com total 0 fica em 0 (nunca negativo)", () => {
    const d = roundDeltas({
      playerIds: ["a", "f"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 0, f: 0 },
    });
    expect(d.f).toBe(0);
  });

  it("autor de resposta anulada (em answeredIds) leva +2", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "g"],
      answeredIds: ["a", "b", "g"],
      bestId: "a",
      worstId: "b",
      currentTotals: { a: 0, b: 0, g: 0 },
    });
    expect(d.g).toBe(2);
  });

  it("borda <2 respostas: unico respondente +10, demais caem na penalidade", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "c"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 3, b: 3, c: 0 },
    });
    expect(d).toEqual({ a: 10, b: -1, c: 0 });
  });
});
