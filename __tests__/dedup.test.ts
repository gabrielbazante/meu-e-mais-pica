import { describe, it, expect } from "vitest";
import { isDuplicateLater, type AnswerLite } from "@/lib/game/dedup";

const A = (playerId: string, text: string, submittedAt: number): AnswerLite => ({ playerId, text, submittedAt });

describe("isDuplicateLater", () => {
  it("recusa quando outro confirmou a mesma palavra antes", () => {
    const all = [A("a", "Brigadeiro", 1000), A("b", "brigadéiro", 1500)];
    expect(isDuplicateLater(all[1], all)).toBe(true); // b é o mais novo
    expect(isDuplicateLater(all[0], all)).toBe(false); // a é o mais antigo, mantém
  });

  it("palavras diferentes não conflitam", () => {
    const all = [A("a", "Brigadeiro", 1000), A("b", "Beijinho", 1500)];
    expect(isDuplicateLater(all[1], all)).toBe(false);
  });

  it("resposta em branco nunca é duplicata", () => {
    const all = [A("a", "", 1000), A("b", "   ", 1500)];
    expect(isDuplicateLater(all[1], all)).toBe(false);
  });

  it("empate exato no mesmo ms desempata por playerId (determinístico)", () => {
    const all = [A("a", "Bolo", 1000), A("b", "bolo", 1000)];
    expect(isDuplicateLater(all[0], all)).toBe(false); // 'a' < 'b' -> a mantém
    expect(isDuplicateLater(all[1], all)).toBe(true);  // 'b' perde
  });

  it("ignora a própria resposta na comparação", () => {
    const all = [A("a", "Bolo", 1000)];
    expect(isDuplicateLater(all[0], all)).toBe(false);
  });
});
