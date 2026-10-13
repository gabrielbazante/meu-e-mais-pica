import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "@/components/icons";

const SIMPLE = [
  "Crown", "Trophy", "Flame", "Tomato", "Clock", "Target", "Ballot", "Scale", "Check", "Star",
  "Play", "Restart", "Users", "Kick", "WhatsApp", "Copy", "Alert", "Exit", "Sad", "ArrowLeft",
] as const;

describe("ícones", () => {
  it.each(SIMPLE)("%s renderiza um svg decorativo por padrão", (name) => {
    const Icon = Icons[name];
    const html = renderToStaticMarkup(<Icon />);
    expect(html).toMatch(/^<svg[^>]*viewBox="0 0 24 24"/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="24"');
    expect(html).not.toContain('role="img"');
  });

  it.each(SIMPLE)("%s com title vira imagem acessível", (name) => {
    const Icon = Icons[name];
    const html = renderToStaticMarkup(<Icon title="rótulo" size={40} />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="rótulo"');
    expect(html).toContain('width="40"');
    expect(html).not.toContain("aria-hidden");
  });

  it("Medal muda a cor e o número conforme o rank", () => {
    const gold = renderToStaticMarkup(<Icons.Medal rank={1} />);
    const silver = renderToStaticMarkup(<Icons.Medal rank={2} />);
    const bronze = renderToStaticMarkup(<Icons.Medal rank={3} />);
    expect(gold).toContain("#ffc61a");
    expect(silver).toContain("#d9dde3");
    expect(bronze).toContain("#e0a36b");
    expect(gold).toContain(">1<");
    expect(bronze).toContain(">3<");
  });

  it("Tomato é o ícone do pior (vermelho com folhas verdes)", () => {
    const html = renderToStaticMarkup(<Icons.Tomato />);
    expect(html).toContain("#ff5252");
    expect(html).toContain("#4ade80");
  });
});
