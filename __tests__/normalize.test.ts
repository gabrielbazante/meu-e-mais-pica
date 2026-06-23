import { describe, it, expect } from "vitest";
import { normalizeAnswer } from "@/lib/game/normalize";

describe("normalizeAnswer", () => {
  it("ignora maiúsculas e espaços nas pontas", () => {
    expect(normalizeAnswer(" Brigadeiro ")).toBe("brigadeiro");
    expect(normalizeAnswer("BRIGADEIRO")).toBe("brigadeiro");
  });

  it("remove acentos", () => {
    expect(normalizeAnswer("Brigadéiro")).toBe("brigadeiro");
    expect(normalizeAnswer("São Paulo")).toBe("sao paulo");
    expect(normalizeAnswer("açaí")).toBe("acai");
  });

  it("colapsa espaços internos", () => {
    expect(normalizeAnswer("São   Paulo")).toBe("sao paulo");
  });

  it("string vazia/branco vira vazio", () => {
    expect(normalizeAnswer("   ")).toBe("");
    expect(normalizeAnswer("")).toBe("");
  });
});
