import { describe, it, expect } from "vitest";
import { possibleDuplicates } from "@/lib/game/similarity";

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
