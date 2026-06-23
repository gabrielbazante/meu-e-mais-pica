import { describe, it, expect } from "vitest";
import { resolveTiebreak } from "@/lib/game/tiebreak";

describe("resolveTiebreak", () => {
  const submittedAt = { a: 1000, b: 1200, c: 900 };

  it("vence quem teve mais votos no re-voto", () => {
    const winner = resolveTiebreak(["a", "b"], ["a", "a", "b"], submittedAt);
    expect(winner).toBe("a");
  });

  it("empate no re-voto: vence quem respondeu primeiro (menor submittedAt)", () => {
    const winner = resolveTiebreak(["a", "b"], ["a", "b"], submittedAt);
    expect(winner).toBe("a"); // a=1000 < b=1200
  });

  it("ignora votos em quem não é candidato", () => {
    const winner = resolveTiebreak(["a", "b"], ["c", "c", "b"], submittedAt);
    expect(winner).toBe("b");
  });
});
