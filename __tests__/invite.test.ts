import { describe, it, expect } from "vitest";
import { inviteUrl, whatsappShareUrl } from "@/lib/invite";

describe("inviteUrl", () => {
  it("monta o link sem barra final na origin", () => {
    expect(inviteUrl("https://app.com", "ABCD")).toBe("https://app.com/sala/ABCD");
  });
  it("remove a barra final da origin", () => {
    expect(inviteUrl("https://app.com/", "ABCD")).toBe("https://app.com/sala/ABCD");
  });
  it("código minúsculo vira maiúsculo", () => {
    expect(inviteUrl("https://app.com", "abcd")).toBe("https://app.com/sala/ABCD");
  });
});

describe("whatsappShareUrl", () => {
  const url = whatsappShareUrl("https://app.com/", "abcd");
  const text = decodeURIComponent(url.slice("https://wa.me/?text=".length));

  it("começa com o endpoint do wa.me", () => {
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
  });
  it("o texto decodificado contém o link e o código", () => {
    expect(text).toContain("https://app.com/sala/ABCD");
    expect(text).toContain("(código ABCD)");
  });
  it("codifica emoji, espaço e ?", () => {
    const payload = url.slice("https://wa.me/?text=".length);
    expect(payload).not.toContain("🔥");
    expect(payload).not.toContain(" ");
    expect(payload).not.toContain("?");
    expect(payload).toContain("%F0%9F%94%A5");
    expect(payload).toContain("%20");
  });
});
