import { describe, it, expect } from "vitest";
import { orderBySeed } from "@/lib/game/shuffle";

const keys = ["a", "b", "c", "d", "e", "f", "g", "h"];
const items = keys.map((id) => ({ id }));
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
const by = (x: { id: string }) => x.id;

describe("orderBySeed", () => {
  it("a mesma lista em outra ordem de entrada dá a mesma saída", () => {
    expect(ids(orderBySeed([...items].reverse(), "r", by))).toEqual(ids(orderBySeed(items, "r", by)));
  });

  it("remover um item mantém a ordem relativa dos demais", () => {
    const full = ids(orderBySeed(items, "r", by));
    const without = ids(orderBySeed(items.filter((x) => x.id !== "d"), "r", by));
    expect(without).toEqual(full.filter((x) => x !== "d"));
  });

  it("é determinístico e não muta a entrada", () => {
    const copy = [...items];
    expect(orderBySeed(items, "r", by)).toEqual(orderBySeed(items, "r", by));
    expect(items).toEqual(copy);
  });

  it("é uma permutação (sem perda)", () => {
    expect(ids(orderBySeed(items, "r", by)).sort()).toEqual(keys);
  });

  it("sementes diferentes mudam o primeiro elemento (não é só ordenar pela chave)", () => {
    const first0 = orderBySeed(items, "seed0", by)[0].id;
    const diff = ["s1", "s2", "s3", "s4", "s5"].filter((s) => orderBySeed(items, s, by)[0].id !== first0);
    expect(diff.length).toBeGreaterThanOrEqual(3);
  });

  it("lista vazia retorna vazia", () => {
    expect(orderBySeed([], "x", by)).toEqual([]);
  });
});
