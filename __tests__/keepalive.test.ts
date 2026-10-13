import { describe, it, expect } from "vitest";
import { isAuthorized } from "@/lib/keepalive";

const SECRET = "segredo-de-teste";

describe("isAuthorized", () => {
  it("recusa quando o secret está ausente", () => {
    expect(isAuthorized(`Bearer ${SECRET}`, undefined)).toBe(false);
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });

  it("recusa header ausente", () => {
    expect(isAuthorized(null, SECRET)).toBe(false);
  });

  it("recusa Bearer errado de mesmo tamanho", () => {
    expect(isAuthorized("Bearer segredo-de-testX", SECRET)).toBe(false);
  });

  it("aceita o Bearer correto", () => {
    expect(isAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("recusa tamanho diferente sem lançar exceção", () => {
    expect(() => isAuthorized("Bearer curto", SECRET)).not.toThrow();
    expect(isAuthorized("Bearer curto", SECRET)).toBe(false);
    expect(isAuthorized(`Bearer ${SECRET}-e-mais-um-pouco`, SECRET)).toBe(false);
  });
});
