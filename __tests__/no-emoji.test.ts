import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Emoji e pictogramas que não devem aparecer na interface (o app usa ícones SVG próprios).
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{2713}\u{2190}-\u{21FF}\u{23E9}-\u{23FA}\u{25B6}\u{D7}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}]/u;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return tsxFiles(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}

// Remove comentários (setas em comentário são permitidas), preservando as quebras de linha.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

describe("sem emoji na interface", () => {
  it("app/ e components/ não têm emoji fora de comentários", () => {
    const root = process.cwd();
    const hits: string[] = [];
    for (const f of [...tsxFiles(join(root, "app")), ...tsxFiles(join(root, "components"))]) {
      stripComments(readFileSync(f, "utf8")).split("\n").forEach((line, i) => {
        const m = line.match(EMOJI);
        if (m) hits.push(`${relative(root, f)}:${i + 1}: ${m[0]}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
