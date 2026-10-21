import { describe, it, expect } from "vitest";
import { canSendVote } from "@/lib/game/vote";

const c = (tiebreak: boolean, eligibleCount: number, best: boolean, worst: boolean) =>
  canSendVote({ tiebreak, eligibleCount, best, worst });

describe("canSendVote", () => {
  it("desempate: basta o escolhido", () => {
    expect(c(true, 2, true, false)).toBe(true);
    expect(c(true, 2, false, false)).toBe(false);
  });
  it("2+ elegiveis: precisa de mais pica e pior", () => {
    expect(c(false, 2, true, true)).toBe(true);
    expect(c(false, 2, true, false)).toBe(false);
    expect(c(false, 3, false, true)).toBe(false);
  });
  it("1 elegivel: so o mais pica, pior ignorado", () => {
    expect(c(false, 1, true, false)).toBe(true);
    expect(c(false, 1, false, false)).toBe(false);
  });
  it("0 elegiveis: sempre pode enviar", () => {
    expect(c(false, 0, false, false)).toBe(true);
  });
});
