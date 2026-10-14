import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { Button } from "@/components/ui/Button";
import { Play } from "@/components/icons";

describe("LogoTitle", () => {
  it("renderiza h1 com as letras do logo por padrão", () => {
    const html = renderToStaticMarkup(<LogoTitle>Fim de jogo!</LogoTitle>);
    expect(html).toMatch(/^<h1 /);
    expect(html).toContain("text-logo");
    expect(html).toContain("uppercase");
    expect(html).toContain("break-words");
    expect(html).toContain("Fim de jogo!");
  });

  it("aceita h2 e tamanho", () => {
    const html = renderToStaticMarkup(<LogoTitle as="h2" size="sm">Ranking</LogoTitle>);
    expect(html).toMatch(/^<h2 /);
    expect(html).toContain("text-2xl");
  });
});

describe("Confetti", () => {
  it("é decorativo e determinístico (mesma saída em dois renders)", () => {
    const a = renderToStaticMarkup(<Confetti variant="party" />);
    const b = renderToStaticMarkup(<Confetti variant="party" />);
    expect(a).toBe(b);
    expect(a).toContain('aria-hidden="true"');
    expect(a).toContain("pointer-events-none");
    expect(a).toContain("confetti-fall");
  });

  it("subtle fica atrás do conteúdo e não anima", () => {
    const html = renderToStaticMarkup(<Confetti />);
    expect(html).toContain("-z-10");
    expect(html).not.toContain("confetti-fall");
  });
});

describe("Button", () => {
  it("renderiza o ícone antes do texto", () => {
    const html = renderToStaticMarkup(<Button icon={<Play />}>Começar</Button>);
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("Começar"));
    expect(html).toContain("inline-flex");
  });

  it("continua funcionando sem ícone", () => {
    const html = renderToStaticMarkup(<Button disabled>Ok</Button>);
    expect(html).toContain("disabled");
    expect(html).not.toContain("<svg");
  });
});
