import { describe, it, expect } from "vitest";
import { canStart, fillPhaseComplete, votePhaseComplete } from "@/lib/game/phase";

describe("phase helpers", () => {
  it("canStart exige 3+ jogadores", () => {
    expect(canStart(2)).toBe(false);
    expect(canStart(3)).toBe(true);
    expect(canStart(5)).toBe(true);
  });

  it("fillPhaseComplete: verdadeiro quando todos enviaram OU o tempo acabou", () => {
    expect(fillPhaseComplete(2, 3, false)).toBe(false);
    expect(fillPhaseComplete(3, 3, false)).toBe(true);
    expect(fillPhaseComplete(1, 3, true)).toBe(true);
  });

  it("votePhaseComplete: verdadeiro quando todos votaram", () => {
    expect(votePhaseComplete(2, 3)).toBe(false);
    expect(votePhaseComplete(3, 3)).toBe(true);
  });
});
