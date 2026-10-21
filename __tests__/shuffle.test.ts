import { describe, it, expect } from "vitest";
import { shuffleBySeed } from "@/lib/game/shuffle";

const items = Array.from({ length: 10 }, (_, i) => i);

describe("shuffleBySeed", () => {
  it("a mesma semente dá a mesma ordem", () => {
    expect(shuffleBySeed(items, "rodada-1")).toEqual(shuffleBySeed(items, "rodada-1"));
  });

  it("é uma permutação: mesmos elementos e tamanho", () => {
    const out = shuffleBySeed(items, "x");
    expect(out).toHaveLength(items.length);
    expect([...out].sort((a, b) => a - b)).toEqual(items);
  });

  it("não muta o array original", () => {
    const copy = [...items];
    shuffleBySeed(items, "x");
    expect(items).toEqual(copy);
  });

  it("sementes diferentes dão ordens diferentes", () => {
    const pairs: [string, string][] = [["a", "b"], ["r1", "r2"], ["x", "y"], ["um", "dois"], ["s1", "s2"]];
    const some = pairs.some(([p, q]) => shuffleBySeed(items, p).join() !== shuffleBySeed(items, q).join());
    expect(some).toBe(true);
  });

  it("array vazio retorna array vazio", () => {
    expect(shuffleBySeed([], "x")).toEqual([]);
  });
});
