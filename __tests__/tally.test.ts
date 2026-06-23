import { describe, it, expect } from "vitest";
import { tallyRound } from "@/lib/game/tally";
import type { Player, Vote } from "@/lib/game/types";

const players: Player[] = [
  { id: "a", name: "A", totalPoints: 0 },
  { id: "b", name: "B", totalPoints: 0 },
  { id: "c", name: "C", totalPoints: 0 },
];

describe("tallyRound", () => {
  it("vencedor único: 10 pro melhor, 0 pro pior, 2 pros demais", () => {
    const votes: Vote[] = [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "b", worstId: "c" },
      { voterId: "c", bestId: "a", worstId: "a" },
    ];
    const r = tallyRound(players, votes);
    expect(r.needsTiebreak).toBe(false);
    expect(r.bestIds).toEqual(["b"]);
    expect(r.worstIds).toEqual(["c"]);
    expect(r.points).toEqual({ a: 2, b: 10, c: 0 });
  });

  it("empate no melhor dispara desempate e não pontua", () => {
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "a", worstId: "c" },
      { voterId: "c", bestId: null, worstId: "b" },
    ]);
    expect(r.needsTiebreak).toBe(true);
    expect(r.bestIds.sort()).toEqual(["a", "b"]);
    expect(r.points).toEqual({});
  });

  it("empate no pior: todos os empatados levam 0", () => {
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "b", worstId: "a" },
      { voterId: "c", bestId: "b", worstId: "a" },
    ]);
    expect(r.bestIds).toEqual(["b"]);
    expect(r.worstIds).toEqual(["a"]);
    expect(r.points).toEqual({ a: 0, b: 10, c: 2 });
  });

  it("o melhor tem prioridade sobre ser também votado como pior", () => {
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "b" },
      { voterId: "b", bestId: "c", worstId: "a" },
      { voterId: "c", bestId: "b", worstId: "a" },
    ]);
    expect(r.points).toEqual({ a: 0, b: 10, c: 2 });
  });
});
