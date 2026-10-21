import { describe, it, expect } from "vitest";
import { possibleDuplicates, duplicateGroups } from "@/lib/game/similarity";

describe("possibleDuplicates", () => {
  it("sinaliza 'Manchester United' x 'Man United' (compartilham 'united')", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Manchester United" },
      { playerId: "b", text: "Man United" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("falso positivo aceito: 'Manchester United' x 'Manchester City'", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Manchester United" },
      { playerId: "b", text: "Manchester City" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("sinaliza por substring: 'Fla' x 'Flamengo'", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Fla" },
      { playerId: "b", text: "Flamengo" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("nao sinaliza respostas sem palavra em comum nem substring", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Gato" },
      { playerId: "b", text: "Peixe" },
    ]);
    expect(flagged.size).toBe(0);
  });

  it("ignora texto vazio", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "" },
      { playerId: "b", text: "" },
    ]);
    expect(flagged.size).toBe(0);
  });
});

describe("duplicateGroups", () => {
  it("agrupa 'Manchester United' x 'Man United' em ordem de chegada", () => {
    expect(duplicateGroups([
      { playerId: "a", text: "Manchester United", submittedAt: 200 },
      { playerId: "b", text: "Man United", submittedAt: 100 },
    ])).toEqual([["b", "a"]]);
  });

  it("cadeia A~B, B~C com A≁C vira um grupo só, por horário", () => {
    expect(duplicateGroups([
      { playerId: "c", text: "Real Madrid", submittedAt: 30 },
      { playerId: "a", text: "Barcelona Santos", submittedAt: 10 },
      { playerId: "b", text: "Santos Madrid", submittedAt: 20 },
    ])).toEqual([["a", "b", "c"]]);
  });

  it("respostas sem relação retornam []", () => {
    expect(duplicateGroups([
      { playerId: "a", text: "Gato", submittedAt: 1 },
      { playerId: "b", text: "Peixe", submittedAt: 2 },
    ])).toEqual([]);
  });

  it("empate de horário desempata por playerId", () => {
    expect(duplicateGroups([
      { playerId: "z", text: "Man United", submittedAt: 5 },
      { playerId: "m", text: "Manchester United", submittedAt: 5 },
    ])).toEqual([["m", "z"]]);
  });

  it("ignora texto vazio", () => {
    expect(duplicateGroups([
      { playerId: "a", text: "", submittedAt: 1 },
      { playerId: "b", text: "", submittedAt: 2 },
    ])).toEqual([]);
  });
});
