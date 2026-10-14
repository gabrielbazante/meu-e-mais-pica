import { describe, it, expect } from "vitest";
import {
  canStart,
  fillPhaseComplete,
  votePhaseComplete,
  countdownStartsAt,
  countdownView,
} from "@/lib/game/phase";

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

describe("contagem 3-2-1", () => {
  const startsAt = 5500;

  it("countdownStartsAt soma a folga de 2,5 s mais os 3 s da contagem", () => {
    expect(countdownStartsAt(0)).toBe(new Date(5500).toISOString());
  });

  it.each([
    [0, { kind: "prep" }],
    [2500, { kind: "number", n: 3 }],
    [2501, { kind: "number", n: 3 }],
    [3600, { kind: "number", n: 2 }],
    [4600, { kind: "number", n: 1 }],
    [5500, { kind: "go" }],
    [9999, { kind: "go" }],
  ])("countdownView com now=%i", (now, expected) => {
    expect(countdownView(startsAt, now)).toEqual(expected);
  });

  it("cliente que monta 2 s depois do servidor ve preparar e depois o 3 inteiro, nunca comeca no 1", () => {
    const serverNow = 1_000_000;
    const starts = new Date(countdownStartsAt(serverNow)).getTime();
    const seen: string[] = [];
    for (let t = serverNow + 2000; t <= starts + 200; t += 100) {
      const v = countdownView(starts, t);
      const label = v.kind === "number" ? String(v.n) : v.kind;
      if (seen[seen.length - 1] !== label) seen.push(label);
    }
    expect(seen).toEqual(["prep", "3", "2", "1", "go"]);
  });
});
