import { describe, it, expect } from "vitest";
import { tallyRound, worstIdsExcluding } from "@/lib/game/tally";
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

describe("worstIdsExcluding", () => {
  const v = (voterId: string, bestId: string | null, worstId: string | null): Vote => ({ voterId, bestId, worstId });

  it("A lidera melhor e pior: pior vira o proximo", () => {
    const votes = [v("a", "b", "c"), v("b", "a", "a"), v("c", "a", "a"), v("d", "a", "b")]; // a:2 piores, b:1, c:1
    expect(worstIdsExcluding(votes, "a").sort()).toEqual(["b", "c"]);
  });

  it("todos os votos de pior no vencedor: vazio", () => {
    const votes = [v("b", "a", "a"), v("c", "a", "a")];
    expect(worstIdsExcluding(votes, "a")).toEqual([]);
  });

  it("excludeId null: comportamento normal", () => {
    const votes = [v("b", "a", "a"), v("c", "a", "a"), v("d", "a", "b")];
    expect(worstIdsExcluding(votes, null)).toEqual(["a"]);
  });

  it("empate apos excluir: 2 ids", () => {
    const votes = [v("a", "b", "b"), v("b", "a", "c"), v("c", "a", "a"), v("d", "a", "a"), v("e", "a", "b"), v("f", "a", "c")];
    expect(worstIdsExcluding(votes, "a").sort()).toEqual(["b", "c"]);
  });
});
