import { describe, it, expect } from "vitest";
import { aliveCandidates, resolveTiebreak } from "@/lib/game/tiebreak";

describe("resolveTiebreak", () => {
  const submittedAt = { a: 1000, b: 1200, c: 900 };

  it("vence quem teve mais votos no re-voto", () => {
    const winner = resolveTiebreak(["a", "b"], ["a", "a", "b"], submittedAt);
    expect(winner).toBe("a");
  });

  it("empate no re-voto com prefer latest: vence (perde) quem respondeu por ultimo", () => {
    expect(resolveTiebreak(["a", "b"], ["a", "b"], submittedAt, "latest")).toBe("b");
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

describe("aliveCandidates", () => {
  const ans = (player_id: string, text = "x", voided = false) => ({ player_id, text, voided });

  it("mantem candidatos com resposta valida, na ordem original", () => {
    expect(aliveCandidates(["a", "b", "c"], [ans("c"), ans("a"), ans("b")])).toEqual(["a", "b", "c"]);
  });

  it("remove candidato expulso (sem linha de resposta)", () => {
    expect(aliveCandidates(["a", "b"], [ans("a")])).toEqual(["a"]);
  });

  it("remove candidato com resposta anulada ou vazia", () => {
    expect(aliveCandidates(["a", "b", "c"], [ans("a", "x", true), ans("b", "  "), ans("c")])).toEqual(["c"]);
  });

  it("lista vazia quando ninguem sobrou", () => {
    expect(aliveCandidates(["a", "b"], [])).toEqual([]);
  });
});
