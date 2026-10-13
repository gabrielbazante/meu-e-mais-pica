import { describe, it, expect, beforeEach } from "vitest";
import { getPlayerId, setPlayerId } from "@/lib/identity";

beforeEach(() => localStorage.clear());

describe("getPlayerId", () => {
  it("gera um id e persiste no localStorage", () => {
    const id1 = getPlayerId();
    expect(id1).toMatch(/[0-9a-f-]{36}/);
    expect(getPlayerId()).toBe(id1); // estável entre chamadas
  });

  it("setPlayerId sobrescreve o id persistido (adotar cadeira recuperada)", () => {
    setPlayerId("seat-abc-123");
    expect(getPlayerId()).toBe("seat-abc-123");
  });
});
