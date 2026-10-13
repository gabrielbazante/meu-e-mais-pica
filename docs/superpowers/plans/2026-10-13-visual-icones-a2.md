# Visual A2 (ícones próprios e identidade do logo) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar todos os emojis da interface e aplicar a direção visual A2: ícones SVG próprios, letras e cores do logo, confete geométrico e fonte correta. Nenhuma regra do jogo muda.

**Architecture:**
- **Fundações em `app/globals.css`:** tokens de cor, utilities `text-logo`/`sticker`/`pill`, fonte e keyframes do confete.
- **Ícones:** componentes React em `components/icons/`. Todos usam a mesma base `Svg`, que resolve a acessibilidade.
- **Primitivos de UI:** `LogoTitle`, `Confetti` e `Button` com a nova prop `icon`.
- **Telas:** passam a usar esses primitivos. A lógica, as server actions e os dados não mudam.
- **Teste anti-emoji:** impede que emojis voltem ao código.

**Tech Stack:** Next.js 16 (App Router, React 19.2), TypeScript, Tailwind v4 (`@theme`/`@utility` em `app/globals.css`, sem `tailwind.config`), Vitest 3 + jsdom (`react-dom/server` `renderToStaticMarkup` para os testes de componente, sem Testing Library).

**Spec:** `docs/superpowers/specs/2026-10-13-visual-icones-a2-design.md`. Os mockups aprovados, com os paths SVG de origem, ficam em `docs/superpowers/specs/assets/2026-10-13-visual-a2/`.

## Global Constraints

- Nenhum emoji ou pictograma Unicode nas telas (`app/**/*.tsx`, `components/**/*.tsx`). Isso inclui `✓`, `✅`, `▶`, `←` e `×` como conteúdo visível. Setas em **comentários** são permitidas.
- O ícone do "pior" é o **Tomato** (tomate podre). Não use polegar nem lixeira.
- Cores do logo como tokens: `--color-logo-pink: #ff1f8e`, `--color-logo-purple: #8b2be2`, `--color-logo-blue: #1e7be0`, `--color-logo-gold: #ffc61a`, `--color-cream: #fff6e6`. Os tokens atuais (`ink`, `party-*`) continuam.
- Contorno dos ícones: `#1a1a2e` (ink). `viewBox="0 0 24 24"`.
- Fonte: texto corrido em **Fredoka** (`var(--font-fredoka)`), títulos, números e botões em **Baloo 2** (`font-display`). Arial sai.
- Ícone sem `title` → `aria-hidden="true"`. Com `title` → `role="img"` + `aria-label`.
- Nenhuma dependência nova. Nenhuma mudança em `app/actions/*`, `lib/game/*`, banco ou migrações.
- Tailwind v4: overrides de cor com `!` (por exemplo `!bg-logo-pink`), como o projeto já faz.
- UX e textos em PT-BR. O texto das regras não muda.
- Lint: hoje `npx eslint components app` dá 6 erros (4× `react-hooks/purity` em `Result.tsx`, 2× `react-hooks/set-state-in-effect`). Nenhum erro novo pode aparecer, e os de `purity` precisam sumir.
- Commits com a identidade configurada, **sem** linha Co-Authored-By. Não fazer push.
- Antes de usar API do Next, consultar `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Review Focus

As 5 entradas ou falhas mais prováveis de atrapalhar quem joga e que nenhum teste unitário cobre. Cada uma tem dono:

1. **Nome longo (16 caracteres) ou título em caixa alta estourando a 375px.** Esperado: o texto quebra dentro do card, sem scroll horizontal. `LogoTitle` usa `break-words` e as linhas de nome usam `min-w-0 break-words` (Tasks 3, 5, 7, 8 e 9). Verificar no QA em 375px.
2. **Leitor de tela lendo ícone decorativo ou botão sem nome.** Esperado: ícones ao lado de texto são ignorados, e botões só com ícone mantêm nome acessível (expulsar). Teste em `icons.test.tsx` (Task 2) e a checagem dos rótulos acessíveis (`votou`, `1º lugar`, `campeã(o)`) nas Tasks 5, 8 e 9. O `aria-label="Expulsar …"` é mantido no código da Task 5 e conferido no QA.
3. **Pódio com 1 ou 2 jogadores.** Esperado: só os degraus existentes aparecem, sem quebrar. Teste em `screens.test.tsx` (Task 9).
4. **`prefers-reduced-motion`.** Esperado: o confete fica parado. Teste em `globals.test.ts` (Task 1), que exige que a animação esteja dentro de `@media (prefers-reduced-motion: no-preference)`.
5. **Emoji reintroduzido no futuro, por exemplo um aviso novo.** Esperado: o teste quebra e mostra o arquivo e a linha. `no-emoji.test.ts` (Task 10).

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `app/globals.css` | Modificar | Fonte, tokens do logo, utilities `text-logo`/`sticker`/`pill`, keyframes do confete |
| `components/icons/Svg.tsx` | Criar | Base comum: tamanho, `viewBox`, acessibilidade |
| `components/icons/colors.ts` | Criar | Constantes de cor dos ícones |
| `components/icons/game.tsx` | Criar | Ícones de jogo: Crown, Trophy, Medal, Flame, Tomato, Clock, Target, Ballot, Scale, Check, Star |
| `components/icons/ui.tsx` | Criar | Ícones de ação: Play, Restart, Users, Kick, WhatsApp, Copy, Alert, Exit, Sad, ArrowLeft |
| `components/icons/index.ts` | Criar | Re-exporta tudo |
| `components/ui/LogoTitle.tsx` | Criar | Título com as letras do logo |
| `components/ui/Confetti.tsx` | Criar | Confete SVG determinístico |
| `components/ui/Button.tsx` | Modificar | Prop `icon` |
| `__tests__/globals.test.ts` | Criar | Fundações do CSS |
| `__tests__/icons.test.tsx` | Criar | Ícones |
| `__tests__/ui.test.tsx` | Criar | LogoTitle, Confetti, Button |
| `__tests__/screens.test.tsx` | Criar | Smoke de VotersList, Ranking e Podium |
| `__tests__/no-emoji.test.ts` | Criar | Varredura anti-emoji |
| `app/page.tsx`, `app/sala/[code]/page.tsx`, `components/ui/InviteShare.tsx` | Modificar | Home, entrada na sala, convite |
| `components/screens/Lobby.tsx`, `components/ui/ManagePlayers.tsx`, `components/ui/VotersList.tsx` | Modificar | Lobby e listas |
| `components/screens/Rules.tsx`, `Countdown.tsx`, `Fill.tsx` | Modificar | Regras, contagem, preencher |
| `components/screens/Vote.tsx` | Modificar | Votação |
| `components/screens/Result.tsx`, `Ranking.tsx` | Modificar | Resultado e ranking |
| `components/screens/Podium.tsx` | Modificar | Pódio A2 |
| `README.md`, `docs/decisoes.md` | Modificar | Docs |

---

## Task 1: Fundações visuais (`globals.css`)

**Files:**
- Modify: `app/globals.css`
- Test: `__tests__/globals.test.ts`

**Interfaces:**
- Produces (classes Tailwind, usadas a partir da Task 3):
  - cores `bg-logo-pink`, `bg-logo-purple`, `bg-logo-blue`, `bg-logo-gold`, `bg-cream` e as variantes `text-*`/`border-*`;
  - utilities `text-logo`, `sticker`, `pill`;
  - a classe `.confetti-fall` (animação, só com movimento permitido), que lê as variáveis CSS `--dur` e `--delay`.

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/globals.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("globals.css (fundações A2)", () => {
  it("não usa mais Arial e aplica Fredoka no body", () => {
    expect(css).not.toMatch(/Arial/);
    expect(css).toMatch(/font-family:\s*var\(--font-fredoka\)/);
  });

  it("tem os tokens de cor do logo", () => {
    for (const t of [
      "--color-logo-pink: #ff1f8e",
      "--color-logo-purple: #8b2be2",
      "--color-logo-blue: #1e7be0",
      "--color-logo-gold: #ffc61a",
      "--color-cream: #fff6e6",
    ]) expect(css).toContain(t);
  });

  it("define as utilities text-logo, sticker e pill", () => {
    expect(css).toMatch(/@utility text-logo\s*\{/);
    expect(css).toMatch(/@utility sticker\s*\{/);
    expect(css).toMatch(/@utility pill\s*\{/);
  });

  it("só anima o confete quando o usuário não pediu menos movimento", () => {
    const m = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/);
    expect(m?.[1]).toMatch(/\.confetti-fall/);
  });

  it("não tem mais o tema escuro herdado do template", () => {
    expect(css).not.toMatch(/prefers-color-scheme: dark/);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/globals.test.ts`
Expected: FAIL. Os 5 testes falham (Arial presente, tokens/utilities ausentes, tema escuro presente).

- [ ] **Step 3: Reescrever `app/globals.css`**

Replace the entire file with:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-fredoka);
  --font-display: var(--font-baloo2);
}

@theme {
  --color-ink: #1a1a2e;
  --color-party-yellow: #ffd23f;
  --color-party-red: #ff5252;
  --color-party-teal: #4ecdc4;
  --color-party-purple: #a29bfe;
  --color-party-pink: #ff8fab;
  --color-party-blue: #74b9ff;

  /* cores do logo (direção visual A2) */
  --color-logo-pink: #ff1f8e;
  --color-logo-purple: #8b2be2;
  --color-logo-blue: #1e7be0;
  --color-logo-gold: #ffc61a;
  --color-cream: #fff6e6;
}

@utility border-3 {
  border-width: 3px;
}
@utility shadow-chunky {
  box-shadow: 4px 4px 0 #1a1a2e;
}
@utility shadow-chunkySm {
  box-shadow: 3px 3px 0 #1a1a2e;
}

/* Letras no estilo do logo: creme com contorno grosso e sombra dura. */
@utility text-logo {
  color: var(--color-cream);
  -webkit-text-stroke: 2px var(--color-ink);
  paint-order: stroke fill;
  text-shadow: 3px 3px 0 var(--color-ink);
}

/* "Adesivo" branco com contorno e sombra dura (inclinação fica com quem usa). */
@utility sticker {
  background: #ffffff;
  border: 3px solid var(--color-ink);
  border-radius: 1rem;
  box-shadow: 4px 4px 0 var(--color-ink);
  padding: 0.25rem 0.75rem;
}

/* Selo pequeno arredondado (tema, letra, pontuação). */
@utility pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: #ffffff;
  border: 2.5px solid var(--color-ink);
  border-radius: 9999px;
  box-shadow: 2px 2px 0 var(--color-ink);
  padding: 0.125rem 0.625rem;
  font-weight: 700;
}

body {
  background: var(--color-party-yellow);
  color: var(--color-ink);
  font-family: var(--font-fredoka), ui-sans-serif, system-ui, sans-serif;
}
* {
  -webkit-tap-highlight-color: transparent;
}

@keyframes confetti-fall {
  from {
    transform: translateY(-15vh) rotate(0deg);
  }
  to {
    transform: translateY(115vh) rotate(540deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .confetti-fall {
    animation: confetti-fall var(--dur, 2.4s) linear var(--delay, 0s) forwards;
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run __tests__/globals.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Confirmar que o build compila as utilities**

Run: `npx next build`
Expected: build ok, sem erro de CSS.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css __tests__/globals.test.ts
git commit -m "feat(visual): fundacoes A2 (Fredoka, cores do logo, text-logo, sticker, pill)"
```

---

## Task 2: Conjunto de ícones SVG

**Files:**
- Create: `components/icons/Svg.tsx`, `components/icons/colors.ts`, `components/icons/game.tsx`, `components/icons/ui.tsx`, `components/icons/index.ts`
- Test: `__tests__/icons.test.tsx`

**Interfaces:**
- Produces: `import { Crown, Trophy, Medal, Flame, Tomato, Clock, Target, Ballot, Scale, Check, Star, Play, Restart, Users, Kick, WhatsApp, Copy, Alert, Exit, Sad, ArrowLeft, type IconProps } from "@/components/icons"`.
  - `IconProps = { size?: number; className?: string; title?: string }`, com `size` padrão 24.
  - `Medal` recebe `IconProps & { rank: 1 | 2 | 3 }`.
  - Todos renderizam `<svg viewBox="0 0 24 24">`.

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/icons.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/icons.test.tsx`
Expected: FAIL com `Failed to resolve import "@/components/icons"`.

- [ ] **Step 3: Criar `components/icons/colors.ts`**

```ts
// Cores dos ícones (mesmos valores dos tokens do logo em app/globals.css).
export const INK = "#1a1a2e";
export const GOLD = "#ffc61a";
export const PURPLE = "#8b2be2";
export const PINK = "#ff1f8e";
export const BLUE = "#1e7be0";
export const RED = "#ff5252";
export const TEAL = "#4ecdc4";
export const CREAM = "#fff6e6";
export const LILAC = "#a29bfe";
export const GREEN = "#4ade80";
export const WA_GREEN = "#25d366";
export const SILVER = "#d9dde3";
export const BRONZE = "#e0a36b";
export const ORANGE = "#ff5a1f";
```

- [ ] **Step 4: Criar `components/icons/Svg.tsx`**

```tsx
import type { ReactNode } from "react";

export interface IconProps {
  size?: number;
  className?: string;
  // Sem title: ícone decorativo (o texto ao lado carrega o significado).
  title?: string;
}

export function Svg({ size = 24, className, title, children }: IconProps & { children: ReactNode }) {
  const a11y = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      focusable="false"
      style={{ flexShrink: 0 }}
      {...a11y}
    >
      {children}
    </svg>
  );
}
```

- [ ] **Step 5: Criar `components/icons/game.tsx`**

```tsx
import { Svg, type IconProps } from "./Svg";
import { INK, GOLD, PURPLE, PINK, BLUE, RED, TEAL, GREEN, SILVER, BRONZE, ORANGE } from "./colors";

export function Crown(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 7l5 4 5-7 5 7 5-4-2 12H4L2 7Z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12l1.6 2-1.6 2-1.6-2Z" fill={PURPLE} stroke={INK} strokeWidth=".8" />
    </Svg>
  );
}

export function Trophy(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 3h10v3h3v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A5 5 0 0 1 8.6 13 5 5 0 0 1 4 8V6h3V3Z" fill={GOLD} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6.5l1.2 1.6L12 9.7l-1.2-1.6Z" fill={PURPLE} />
    </Svg>
  );
}

const MEDAL_FILL = { 1: GOLD, 2: SILVER, 3: BRONZE } as const;

export function Medal({ rank, ...p }: IconProps & { rank: 1 | 2 | 3 }) {
  return (
    <Svg {...p}>
      <path d="M7 1h4l1.5 7h-4Z" fill={BLUE} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 1h4l-2.5 7h-4Z" fill={PINK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" fill={MEDAL_FILL[rank]} stroke={INK} strokeWidth="1.8" />
      <text x="12" y="18.6" textAnchor="middle" fontFamily="var(--font-baloo2), sans-serif" fontWeight="800" fontSize="9" fill={INK}>{rank}</text>
    </Svg>
  );
}

export function Flame(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.2 2.6-5.4.2 1.8.9 3 2 3.4C10.6 8 11 5 12 2Z" fill={ORANGE} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12c.6 1.6 2.4 2.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.5.9-2.4 2.4-4.6Z" fill={GOLD} />
    </Svg>
  );
}

export function Tomato(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13.5" r="8.5" fill={RED} stroke={INK} strokeWidth="1.8" />
      <path d="M12 5.5c-1-2-3-2.5-4.5-2 1.3 1 2 1.6 2.2 2.6M12 5.5c1-2 3-2.5 4.5-2-1.3 1-2 1.6-2.2 2.6M12 5.5V3" stroke={INK} strokeWidth="1.5" fill={GREEN} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12.5l1.5 1.2M17 12.5l-1.5 1.2M9.3 17.5c1.6-1 3.8-1 5.4 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="16.5" cy="17" r="1.2" fill={PURPLE} />
    </Svg>
  );
}

export function Clock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill="#ffffff" stroke={INK} strokeWidth="1.8" />
      <path d="M12 2.5A9.5 9.5 0 0 1 21.5 12H12Z" fill={RED} opacity=".85" />
      <path d="M12 12V7M12 12l3.5 2" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function Target(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={PINK} stroke={INK} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="6" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.6" fill={PINK} stroke={INK} strokeWidth="1.3" />
    </Svg>
  );
}

export function Ballot(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="11" width="18" height="10" rx="2" fill={BLUE} stroke={INK} strokeWidth="1.8" />
      <rect x="7" y="3" width="10" height="11" rx="1.5" fill="#ffffff" stroke={INK} strokeWidth="1.6" transform="rotate(-6 12 8)" />
      <path d="M9.5 8.5l2 2 3.5-4" stroke={TEAL} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="13.5" width="12" height="1.8" rx=".9" fill={INK} />
    </Svg>
  );
}

export function Scale(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v17M6 20h12M4 6h16" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 6l-2.5 6a2.5 2.5 0 0 0 5 0ZM20 6l-2.5 6a2.5 2.5 0 0 0 5 0Z" fill={PURPLE} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

export function Check(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={TEAL} stroke={INK} strokeWidth="1.8" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Star(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2l2.6 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.6 6.2 20l1.6-6.6L2.6 8.9l6.8-.6Z" fill={GOLD} stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
    </Svg>
  );
}
```

- [ ] **Step 6: Criar `components/icons/ui.tsx`**

```tsx
import { Svg, type IconProps } from "./Svg";
import { INK, BLUE, PINK, RED, LILAC, WA_GREEN, GOLD, SILVER } from "./colors";

export function Play(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4.5v15l12-7.5Z" fill="#ffffff" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function Restart(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5v5h5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Users(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.6" fill={BLUE} stroke={INK} strokeWidth="1.6" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0Z" fill={BLUE} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16.5" cy="9" r="3" fill={PINK} stroke={INK} strokeWidth="1.5" />
      <path d="M14 20a5 5 0 0 1 8 0Z" fill={PINK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

export function Kick(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={RED} stroke={INK} strokeWidth="1.8" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

export function WhatsApp(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Z" fill={WA_GREEN} stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.7 7.8c.3-.6.7-.6 1-.6h.6c.2 0 .4 0 .6.5l.9 2c.1.3 0 .5-.1.7l-.6.7c-.1.2-.2.3 0 .6.6 1 1.6 2 2.7 2.6.3.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.2.5.4 0 .8-.4 1.6-1.4 2-1 .4-2.2.3-4.3-.8-2.4-1.3-4.3-3.8-4.6-5.5-.2-1.1.2-2 .8-2.4Z" fill="#ffffff" />
    </Svg>
  );
}

export function Copy(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="8" y="8" width="13" height="13" rx="3" fill="#ffffff" stroke={INK} strokeWidth="1.8" />
      <rect x="3" y="3" width="13" height="13" rx="3" fill={LILAC} stroke={INK} strokeWidth="1.8" />
      <path d="M7 9.5h5M7 12.5h3.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function Alert(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5l10 17.5H2Z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.3" fill={INK} />
    </Svg>
  );
}

export function Exit(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 3h10v18H4Z" fill={LILAC} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="11" cy="12.5" r="1.1" fill={INK} />
      <path d="M15 12h6M18 9l3 3-3 3" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function Sad(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" fill={SILVER} stroke={INK} strokeWidth="1.8" />
      <circle cx="8.7" cy="10" r="1.3" fill={INK} />
      <circle cx="15.3" cy="10" r="1.3" fill={INK} />
      <path d="M8.5 16.5c2-1.8 5-1.8 7 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 12H5M11 5l-7 7 7 7" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
```

- [ ] **Step 7: Criar `components/icons/index.ts`**

```ts
export type { IconProps } from "./Svg";
export { Crown, Trophy, Medal, Flame, Tomato, Clock, Target, Ballot, Scale, Check, Star } from "./game";
export { Play, Restart, Users, Kick, WhatsApp, Copy, Alert, Exit, Sad, ArrowLeft } from "./ui";
```

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run __tests__/icons.test.tsx`
Expected: PASS (42 testes: 20 + 20 + 2).

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 10: Commit**

```bash
git add components/icons __tests__/icons.test.tsx
git commit -m "feat(icons): conjunto proprio de icones SVG no estilo A2"
```

---

## Task 3: Primitivos de UI (`LogoTitle`, `Confetti`, `Button` com ícone)

**Files:**
- Create: `components/ui/LogoTitle.tsx`, `components/ui/Confetti.tsx`
- Modify: `components/ui/Button.tsx`
- Test: `__tests__/ui.test.tsx`

**Interfaces:**
- Consumes: as utilities da Task 1 (`text-logo`, `.confetti-fall`).
- Produces:
  - `LogoTitle({ as?: "h1" | "h2" = "h1", size?: "lg" | "md" | "sm" = "lg", className?: string, children })`
  - `Confetti({ variant?: "subtle" | "party" = "subtle" })`
    - `subtle` é `absolute inset-0 -z-10`. O pai precisa de `relative isolate overflow-hidden`.
    - `party` é `fixed inset-0 z-40`, por cima do conteúdo, com `pointer-events-none`.
  - `Button` aceita `icon?: React.ReactNode`, renderizado antes do texto. As demais props continuam iguais.

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/ui.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/ui.test.tsx`
Expected: FAIL com `Failed to resolve import "@/components/ui/LogoTitle"`.

- [ ] **Step 3: Criar `components/ui/LogoTitle.tsx`**

```tsx
import type { ReactNode } from "react";

const SIZES = { lg: "text-4xl", md: "text-3xl", sm: "text-2xl" } as const;

// Título com as letras do logo (creme, contorno grosso, sombra dura), sempre em caixa alta.
export function LogoTitle({ as: Tag = "h1", size = "lg", className = "", children }: {
  as?: "h1" | "h2"; size?: keyof typeof SIZES; className?: string; children: ReactNode;
}) {
  return (
    <Tag className={`text-logo font-display font-extrabold uppercase leading-none text-center break-words ${SIZES[size]} ${className}`}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: Criar `components/ui/Confetti.tsx`**

```tsx
import type { CSSProperties } from "react";

// Confete geométrico nas cores do logo. Posições FIXAS (nada de Math.random no render):
// mesma saída no servidor e no cliente, e o lint react-hooks/purity fica satisfeito.

type Piece = { k: "tri" | "dot"; x: number; y: number; c: string; s: number; r: number };

const PINK = "#ff1f8e", PURPLE = "#8b2be2", BLUE = "#1e7be0", GOLD = "#ffc61a", CREAM = "#fff6e6";

const SUBTLE: Piece[] = [
  { k: "tri", x: 6, y: 5, c: PINK, s: 18, r: 20 },
  { k: "tri", x: 88, y: 9, c: BLUE, s: 18, r: -30 },
  { k: "dot", x: 93, y: 46, c: PURPLE, s: 10, r: 0 },
  { k: "dot", x: 4, y: 62, c: PINK, s: 8, r: 0 },
  { k: "tri", x: 82, y: 4, c: PURPLE, s: 12, r: 60 },
  { k: "tri", x: 9, y: 30, c: BLUE, s: 14, r: 110 },
  { k: "dot", x: 52, y: 2, c: CREAM, s: 6, r: 0 },
];

const COLORS = [PINK, PURPLE, BLUE, GOLD, CREAM];
const PARTY: Piece[] = Array.from({ length: 28 }, (_, i) => ({
  k: i % 3 === 0 ? "dot" : "tri",
  x: (i * 37) % 100,
  y: -((i * 13) % 30),
  c: COLORS[i % COLORS.length],
  s: 10 + ((i * 7) % 10),
  r: (i * 47) % 360,
}));

export function Confetti({ variant = "subtle" }: { variant?: "subtle" | "party" }) {
  const party = variant === "party";
  const pieces = party ? PARTY : SUBTLE;
  return (
    <div
      aria-hidden="true"
      className={(party ? "fixed inset-0 z-40" : "absolute inset-0 -z-10") + " pointer-events-none overflow-hidden"}
    >
      {pieces.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={p.s}
          height={p.s}
          className={party ? "confetti-fall absolute" : "absolute"}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            rotate: `${p.r}deg`,
            ...(party ? ({ "--dur": `${2 + (i % 5) * 0.35}s`, "--delay": `${(i % 7) * 0.15}s` } as CSSProperties) : {}),
          }}
        >
          {p.k === "tri"
            ? <polygon points="2,4 18,2 10,18" fill={p.c} stroke="#1a1a2e" strokeWidth="1.5" strokeLinejoin="round" />
            : <circle cx="10" cy="10" r="8" fill={p.c} stroke="#1a1a2e" strokeWidth="1.5" />}
        </svg>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Substituir `components/ui/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ className = "", icon, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      {...props}
      className={
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border-3 border-ink bg-party-red px-4 py-3 font-display font-extrabold text-white " +
        "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
        "disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-chunkySm " +
        "transition-all " + className
      }
    >
      {icon}
      {children}
    </button>
  );
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run __tests__/ui.test.tsx`
Expected: PASS (6 testes).

- [ ] **Step 7: Typecheck e suíte**

Run: `npx tsc --noEmit` e `npx vitest run`
Expected: sem erros de tipo. Todos os testes passam (os anteriores mais os novos).

- [ ] **Step 8: Commit**

```bash
git add components/ui/LogoTitle.tsx components/ui/Confetti.tsx components/ui/Button.tsx __tests__/ui.test.tsx
git commit -m "feat(ui): LogoTitle, Confetti geometrico e Button com icone"
```

---

## Task 4: Home, entrada na sala e convite

**Files:**
- Modify: `app/page.tsx`, `app/sala/[code]/page.tsx`, `components/ui/InviteShare.tsx`

**Interfaces:**
- Consumes: `Play`, `ArrowLeft`, `Alert`, `Sad`, `WhatsApp`, `Copy`, `Check` (Task 2). `Button` com `icon` (Task 3).

- [ ] **Step 1: `app/page.tsx`: imports**

Add after the `Card` import line:

```tsx
import { Alert, ArrowLeft, Play } from "@/components/icons";
```

- [ ] **Step 2: `app/page.tsx`: botões, link de voltar e erro**

Replace `<Button onClick={handleCreate} disabled={busy || !name.trim()}>Criar sala</Button>` with:

```tsx
            <Button onClick={handleCreate} disabled={busy || !name.trim()} icon={<Play size={20} />}>Criar sala</Button>
```

Replace `<Button onClick={handleJoin} disabled={busy || !name.trim() || code.trim().length !== 4} className="!bg-party-teal">Entrar</Button>` with:

```tsx
            <Button onClick={handleJoin} disabled={busy || !name.trim() || code.trim().length !== 4} className="!bg-party-teal" icon={<Play size={20} />}>Entrar</Button>
```

Replace the "voltar" button (the one whose text is `← Quero criar uma sala`) with:

```tsx
            <button
              type="button"
              onClick={() => { setMode("create"); setError(""); }}
              className="mt-1 inline-flex items-center justify-center gap-1.5 text-center font-bold text-ink/70 underline underline-offset-4"
            >
              <ArrowLeft size={18} />
              Quero criar uma sala
            </button>
```

Replace `{error && <p className="text-center font-bold text-ink">{error}</p>}` with:

```tsx
      {error && (
        <p className="flex items-center justify-center gap-2 text-center font-bold text-ink">
          <Alert size={20} />
          {error}
        </p>
      )}
```

- [ ] **Step 3: `app/sala/[code]/page.tsx`: sala não encontrada, JoinSeat e Center**

Add after the `Card` import line:

```tsx
import { Alert, Play, Sad } from "@/components/icons";
```

Replace `if (!room) return <Center>Sala não encontrada 😢</Center>;` with:

```tsx
  if (!room) return <Center><Sad size={64} />Sala não encontrada</Center>;
```

Replace the line `          Entrar 🔥` (inside JoinSeat's `Button`) with `          Entrar`. Add `icon={<Play size={20} />}` to that same `<Button disabled={busy || !name.trim()}`. The opening tag becomes:

```tsx
        <Button disabled={busy || !name.trim()} icon={<Play size={20} />}
```

Replace `{err && <p className="font-bold text-party-red">{err}</p>}` with:

```tsx
        {err && (
          <p className="flex items-center justify-center gap-2 font-bold text-party-red">
            <Alert size={20} />
            {err}
          </p>
        )}
```

Replace the `Center` function with:

```tsx
function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center font-display text-xl font-extrabold">
      {children}
    </main>
  );
}
```

- [ ] **Step 4: `components/ui/InviteShare.tsx`: ícones nos botões**

Add after the `qrcode.react` import:

```tsx
import { Check, Copy, WhatsApp } from "@/components/icons";
```

Replace the `BTN` constant with:

```tsx
const BTN =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border-3 border-ink px-4 py-2.5 text-center font-display font-extrabold text-ink " +
  "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all";
```

Replace the WhatsApp anchor's text `          Compartilhar no WhatsApp` with:

```tsx
          <WhatsApp size={22} />
          Compartilhar no WhatsApp
```

Replace the copy button's inner expression `{status === "ok" ? "Copiado ✓" : status === "fail" ? "Não deu pra copiar" : "Copiar link"}` with:

```tsx
          {status === "ok" ? <Check size={20} /> : <Copy size={20} />}
          {status === "ok" ? "Copiado" : status === "fail" ? "Não deu pra copiar" : "Copiar link"}
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit`, then `npx vitest run`, then `npx eslint app components`.
Expected:
- tsc sem erros;
- todos os testes passam;
- eslint sem erro novo (continuam os 6 da base).

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx "app/sala/[code]/page.tsx" components/ui/InviteShare.tsx
git commit -m "feat(visual): icones na home, entrada na sala e convite"
```

---

## Task 5: Lobby, ManagePlayers e VotersList

**Files:**
- Modify: `components/screens/Lobby.tsx`, `components/ui/ManagePlayers.tsx`, `components/ui/VotersList.tsx`
- Test: `__tests__/screens.test.tsx` (criado aqui e ampliado nas Tasks 8 e 9)

**Interfaces:**
- Consumes: `Crown`, `Play`, `Exit`, `Kick`, `Users`, `Check` (Task 2); `Confetti` e `Button` com `icon` (Task 3).

- [ ] **Step 1: Escrever o teste que falha (VotersList)**

Create `__tests__/screens.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const player = (id: string, name: string, total_points = 0): PlayerRow => ({
  id, room_id: "r", name, total_points, connected: true, joined_at: `2026-10-13T00:00:0${id}Z`,
});
const vote = (voter_id: string): VoteRow => ({
  id: `v${voter_id}`, round_id: "x", voter_id, best_id: null, worst_id: null, is_tiebreak: false,
});

describe("VotersList", () => {
  it("marca quem votou com o ícone de check acessível, sem caractere ✓", async () => {
    const { VotersList } = await import("@/components/ui/VotersList");
    const html = renderToStaticMarkup(
      <VotersList players={[player("1", "Ana"), player("2", "Bia")]} votes={[vote("1")]} isTiebreak={false} />,
    );
    expect(html).toContain('aria-label="votou"');
    expect(html).toContain("ainda não votou");
    expect(html).not.toContain("✓");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: FAIL. Não há `aria-label="votou"` e o HTML contém "✓".

- [ ] **Step 3: Substituir `components/ui/VotersList.tsx`**

```tsx
"use client";
import { Card } from "@/components/ui/Card";
import { Check } from "@/components/icons";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

export function VotersList({ players, votes, isTiebreak }: {
  players: PlayerRow[]; votes: VoteRow[]; isTiebreak: boolean;
}) {
  const voted = new Set(votes.filter((v) => v.is_tiebreak === isTiebreak).map((v) => v.voter_id));
  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display font-extrabold">Quem já votou ({voted.size}/{players.length})</p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
          <span className="min-w-0 break-words">{p.name}</span>
          {voted.has(p.id)
            ? <Check size={24} title="votou" />
            : <span className="sr-only">ainda não votou</span>}
        </div>
      ))}
    </Card>
  );
}
```

- [ ] **Step 4: Substituir `components/ui/ManagePlayers.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Crown, Kick, Users } from "@/components/icons";
import { kickPlayer } from "@/app/actions/room";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function ManagePlayers({ roomId, players, meId, hostId }: {
  roomId: string; players: PlayerRow[]; meId: string; hostId: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (meId !== hostId) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border-3 border-ink bg-white px-3 py-2 text-sm font-bold shadow-chunkySm"
      >
        <Users size={20} />
        Jogadores
      </button>
      {open && (
        <Card className="flex flex-col gap-2">
          <p className="font-display font-extrabold">Gerenciar jogadores</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
              <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                {p.name}
                {p.id === hostId && <Crown size={20} title="dono da sala" />}
              </span>
              {p.id !== hostId && (
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Expulsar ${p.name}`}
                  className="rounded-full disabled:opacity-50"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await kickPlayer({ roomId, hostId: meId, targetId: p.id });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Kick size={30} />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
```

- [ ] **Step 5: `components/screens/Lobby.tsx`: imports, card do código, lista e botões**

Add after the `MIN_PLAYERS` import:

```tsx
import { Confetti } from "@/components/ui/Confetti";
import { Crown, Exit, Kick, Play } from "@/components/icons";
```

Replace the opening `<main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">` with:

```tsx
    <main className="relative isolate mx-auto flex min-h-screen max-w-md flex-col gap-5 overflow-hidden p-5">
      <Confetti />
```

Replace the code card's first two lines:

```tsx
        <p className="text-xs font-bold uppercase tracking-widest text-party-red">Código da sala</p>
        <p className="font-display text-5xl font-black tracking-widest">{room.code}</p>
```

with:

```tsx
        <p className="text-xs font-bold uppercase tracking-widest text-logo-pink">Sala</p>
        <p className="font-display text-5xl font-extrabold tracking-widest">{room.code}</p>
```

Replace the players list row:

```tsx
            <span>{p.name}{p.id === room.host_id && " 👑"}</span>
```

with:

```tsx
            <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
              {p.name}
              {p.id === room.host_id && <Crown size={20} title="dono da sala" />}
            </span>
```

Also change `<p className="font-extrabold">Jogadores ({players.length})</p>` to `<p className="font-display font-extrabold">Jogadores ({players.length})</p>`.

Replace the host buttons block:

```tsx
          <Button disabled={!canStart || busy} onClick={async () => { setBusy(true); await startGame({ roomId: room.id, playerId: meId }); }}>
            {canStart ? "Começar 🔥" : `Faltam ${MIN_PLAYERS - players.length} jogador(es)`}
          </Button>
          <Button disabled={busy} onClick={handleDelete} className="bg-ink! text-white">
            Apagar sala e sair
          </Button>
```

with:

```tsx
          <Button
            disabled={!canStart || busy}
            icon={canStart ? <Play size={20} /> : undefined}
            onClick={async () => { setBusy(true); await startGame({ roomId: room.id, playerId: meId }); }}
          >
            {canStart ? "Começar" : `Faltam ${MIN_PLAYERS - players.length} jogador(es)`}
          </Button>
          <Button disabled={busy} onClick={handleDelete} className="bg-ink! text-white" icon={<Kick size={20} />}>
            Apagar sala e sair
          </Button>
```

Replace the leave button:

```tsx
          <Button disabled={busy} onClick={handleLeave} className="bg-ink! text-white">
            Sair da sala
          </Button>
```

with:

```tsx
          <Button disabled={busy} onClick={handleLeave} className="bg-ink! text-white" icon={<Exit size={20} />}>
            Sair da sala
          </Button>
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: PASS (1 teste).

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npx eslint app components`.
Expected: sem erro de tipo, todos passam, eslint sem erro novo.

- [ ] **Step 8: Commit**

```bash
git add components/screens/Lobby.tsx components/ui/ManagePlayers.tsx components/ui/VotersList.tsx __tests__/screens.test.tsx
git commit -m "feat(visual): lobby, gerenciar jogadores e votantes com icones"
```

---

## Task 6: Regras, contagem e preencher

**Files:**
- Modify: `components/screens/Rules.tsx`, `components/screens/Countdown.tsx`, `components/screens/Fill.tsx`

**Interfaces:**
- Consumes: `Target`, `Clock`, `Ballot`, `Trophy`, `Scale`, `Play`, `Flame`, `Check`, `Alert` (Task 2); `LogoTitle`, `Confetti`, `Button` com `icon` (Task 3).

- [ ] **Step 1: Substituir `components/screens/Rules.tsx`**

```tsx
"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { Ballot, Clock, Play, Scale, Target, Trophy } from "@/components/icons";
import { dismissRules } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

function Rule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      {icon}
      <p className="min-w-0">{children}</p>
    </li>
  );
}

export function Rules({ round, meId, isHost }: { round: RoundRow; meId: string; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="relative isolate mx-auto flex min-h-screen max-w-md flex-col gap-5 overflow-hidden p-5">
      <Confetti />
      <LogoTitle>Como joga</LogoTitle>
      <Card className="font-semibold">
        <ul className="flex flex-col gap-3">
          <Rule icon={<Target size={28} />}>Sai um <b>tema</b> e uma <b>letra</b>. Responda algo do tema começando com a letra.</Rule>
          <Rule icon={<Clock size={28} />}>Você tem <b>1 minuto</b>. Não dá pra repetir palavra que já foi usada.</Rule>
          <Rule icon={<Ballot size={28} />}>Depois todo mundo vota no <b>mais pica</b> e no <b>pior</b> (não dá pra votar em você).</Rule>
          <Rule icon={<Trophy size={28} />}>Pontos: <b>+10</b> pro melhor, <b>+2</b> pra quem respondeu, <b>0</b> pro pior e <b>−1</b> pra quem não respondeu.</Rule>
          <Rule icon={<Scale size={28} />}>Empatou? Rola <b>desempate</b>.</Rule>
        </ul>
      </Card>
      {isHost ? (
        <Button
          disabled={busy}
          icon={<Play size={20} />}
          onClick={async () => {
            setBusy(true);
            try {
              await dismissRules({ roundId: round.id, playerId: meId });
            } catch {
              setBusy(false);
            }
          }}
        >
          Bora!
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: `components/screens/Countdown.tsx`: número e chama**

Add after the `beginRound` import:

```tsx
import { Flame } from "@/components/icons";
```

Replace the returned JSX:

```tsx
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xl font-black opacity-70">Preparando…</p>
      <p className="font-display text-[8rem] font-black leading-none text-party-red">{left > 0 ? left : "🔥"}</p>
    </main>
```

with:

```tsx
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-xl font-extrabold opacity-70">Preparando…</p>
      {left > 0
        ? <p className="text-logo font-display text-[8rem] font-extrabold leading-none">{left}</p>
        : <Flame size={128} title="Valendo!" />}
    </main>
```

- [ ] **Step 3: `components/screens/Fill.tsx`: imports**

Add after the `ManagePlayers` import:

```tsx
import { Alert, Check, Clock, Flame, Target } from "@/components/icons";
```

- [ ] **Step 4: `components/screens/Fill.tsx`: selos de tema e letra e o timer**

Replace the whole block from `<div className="flex items-center justify-between">` to its closing `</div>`, which contains the TEMA card, the LETRA box and `{left}s`, with:

```tsx
      <div className="flex items-stretch gap-3">
        <Card className="min-w-0 flex-1 !p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider opacity-60">
            <Target size={14} />
            Tema
          </p>
          <p className="break-words font-display text-xl font-extrabold text-logo-blue">{round.theme ?? ""}</p>
        </Card>
        <div className="rounded-2xl border-3 border-ink bg-logo-pink px-4 py-2 text-center shadow-chunkySm">
          <p className="text-xs font-bold uppercase tracking-wider text-white">Letra</p>
          <p className="text-logo font-display text-4xl font-extrabold leading-none">{round.letter ?? ""}</p>
        </div>
      </div>
      <p className="flex items-center justify-center gap-2 font-display text-2xl font-extrabold">
        <Clock size={30} />
        {left}s
      </p>
```

- [ ] **Step 5: `components/screens/Fill.tsx`: botão e aviso**

Replace `setWarn(\`"${res.word}" já foi usada — manda outra! 😅\`);` with:

```tsx
              setWarn(`"${res.word}" já foi usada. Manda outra!`);
```

Replace the button's children `{sent ? "Enviado ✅" : "O meu é mais pica 🔥"}` with `{sent ? "Enviado" : "O meu é mais pica"}`, and add to that `<Button` the prop:

```tsx
          icon={sent ? <Check size={22} /> : <Flame size={22} />}
```

Replace `{warn && <p className="text-center font-bold text-party-red">{warn}</p>}` with:

```tsx
        {warn && (
          <p className="flex items-center justify-center gap-2 text-center font-bold text-party-red">
            <Alert size={20} />
            {warn}
          </p>
        )}
```

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npx eslint app components`.
Expected: sem erro de tipo, todos passam, eslint sem erro novo.

- [ ] **Step 7: Commit**

```bash
git add components/screens/Rules.tsx components/screens/Countdown.tsx components/screens/Fill.tsx
git commit -m "feat(visual): regras, contagem e preencher no estilo A2"
```

---

## Task 7: Votação

**Files:**
- Modify: `components/screens/Vote.tsx`

**Interfaces:**
- Consumes: `Flame`, `Tomato`, `Scale`, `Target`, `Alert` (Task 2); `LogoTitle` (Task 3); as utilities `pill` e as cores `logo-*` (Task 1).

- [ ] **Step 1: Imports**

Add after the `possibleDuplicates` import:

```tsx
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Alert, Flame, Scale, Target, Tomato } from "@/components/icons";
```

- [ ] **Step 2: Rótulos derivados**

Replace these three declarations:

```tsx
  const header = tiebreak
    ? (kind === "worst" ? "💩 DESEMPATE — vote no PIOR" : "🔥 DESEMPATE — vote no MELHOR")
    : "Vote no mais pica e no pior";
  const pickLabel = tiebreak && kind === "worst" ? "Pior 💩" : "Mais pica 🔥";
  const pickColor = tiebreak && kind === "worst" ? "bg-party-red text-white" : "bg-party-teal text-white";
```

with:

```tsx
  const worstPick = tiebreak && kind === "worst";
  const pickLabel = worstPick ? "Pior" : "Mais pica";
  const pickIcon = worstPick ? <Tomato size={20} /> : <Flame size={20} />;
  const pickColor = worstPick ? "bg-logo-purple text-white" : "bg-logo-pink text-white";
```

- [ ] **Step 3: Cabeçalho**

Replace:

```tsx
      <Card className="text-center !py-2">
        <p className="font-black">{header}</p>
        <p className="text-sm opacity-70">{round.theme} · letra {round.letter}</p>
      </Card>
```

with:

```tsx
      <header className="flex flex-col items-center gap-2 text-center">
        {tiebreak ? (
          <>
            <Scale size={40} />
            <LogoTitle size="md">Desempate</LogoTitle>
            <p className="font-display text-lg font-extrabold">{worstPick ? "Vote no PIOR" : "Vote no MELHOR"}</p>
          </>
        ) : (
          <LogoTitle size="md">Hora de votar</LogoTitle>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="pill"><Target size={16} />{round.theme}</span>
          <span className="pill">Letra <b className="font-display text-base">{round.letter}</b></span>
        </div>
      </header>
```

- [ ] **Step 4: Linha do jogador, resposta e "parece repetida?"**

Replace:

```tsx
              <span className="font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
              {flagged && <span className="ml-auto text-xs font-bold text-party-red">parece repetida?</span>}
            </div>
            <p className="rounded-lg bg-party-yellow/40 px-3 py-2 font-bold">{a.text}</p>
```

with:

```tsx
              <span className="min-w-0 break-words font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
              {flagged && (
                <span className="ml-auto inline-flex flex-none items-center gap-1 text-xs font-bold text-party-red">
                  <Alert size={16} />
                  parece repetida?
                </span>
              )}
            </div>
            <p className="break-words rounded-lg border-2 border-ink bg-cream px-3 py-2 font-bold">{a.text}</p>
```

- [ ] **Step 5: Botões de voto**

Replace the whole `{!sent && ( <div className="flex gap-2"> … </div> )}` block with:

```tsx
            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? pickColor : "bg-white")}
                  onClick={() => { setBest(a.player_id); if (!tiebreak && worst === a.player_id) setWorst(null); }}>
                  {pickIcon}
                  {pickLabel}
                </button>
                {!tiebreak && (
                  <button disabled={self}
                    className={"inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (worst === a.player_id ? "bg-logo-purple text-white" : "bg-white")}
                    onClick={() => { setWorst(a.player_id); if (best === a.player_id) setBest(null); }}>
                    <Tomato size={20} />
                    Pior
                  </button>
                )}
              </div>
            )}
```

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npx eslint app components`.
Expected: sem erro de tipo, todos passam, eslint sem erro novo.

- [ ] **Step 7: Commit**

```bash
git add components/screens/Vote.tsx
git commit -m "feat(visual): votacao com chama, tomate e titulo do logo"
```

---

## Task 8: Resultado da rodada e ranking

**Files:**
- Modify: `components/screens/Result.tsx`, `components/screens/Ranking.tsx`
- Test: `__tests__/screens.test.tsx` (ampliar)

**Interfaces:**
- Consumes: `Flame`, `Tomato`, `Star`, `Trophy`, `Play`, `Medal` (Task 2); `LogoTitle`, `Confetti` (Task 3).
- `Ranking({ players, deltas? })`: a assinatura não muda.

- [ ] **Step 1: Escrever o teste que falha (Ranking)**

Append to `__tests__/screens.test.tsx`:

```tsx
describe("Ranking", () => {
  it("usa medalhas SVG para o top 3 e 'Nº' do 4º em diante, sem emoji", async () => {
    const { Ranking } = await import("@/components/screens/Ranking");
    const html = renderToStaticMarkup(
      <Ranking players={[player("1", "Ana", 30), player("2", "Bia", 20), player("3", "Caio", 10), player("4", "Duda", 5)]} />,
    );
    expect(html).toContain('aria-label="1º lugar"');
    expect(html).toContain('aria-label="3º lugar"');
    expect(html).toContain("4º");
    expect(html).not.toMatch(/[\u{1F947}-\u{1F949}]/u);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: FAIL. Não há `aria-label="1º lugar"` e o HTML ainda contém 🥇.

- [ ] **Step 3: `components/screens/Ranking.tsx`: medalhas**

Add after the `BlockAvatar` import:

```tsx
import { Medal } from "@/components/icons";
```

Delete the line `const MEDALS = ["🥇", "🥈", "🥉"];`.

Replace:

```tsx
            <span className="font-display w-8 text-center text-xl font-black">{MEDALS[i] ?? `${i + 1}º`}</span>
            <BlockAvatar seed={p.id} size={40} colorIndex={joinIndex.get(p.id)} />
            <span className="flex-1 font-extrabold">{p.name}</span>
```

with:

```tsx
            <span className="flex w-9 flex-none justify-center">
              {i < 3
                ? <Medal rank={(i + 1) as 1 | 2 | 3} size={34} title={`${i + 1}º lugar`} />
                : <span className="font-display text-xl font-extrabold">{i + 1}º</span>}
            </span>
            <BlockAvatar seed={p.id} size={40} colorIndex={joinIndex.get(p.id)} />
            <span className="min-w-0 flex-1 break-words font-extrabold">{p.name}</span>
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Substituir `components/screens/Result.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { Flame, Play, Star, Tomato, Trophy } from "@/components/icons";
import { Ranking } from "./Ranking";
import { nextRound, endGame } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Result({ room, round, players, answers, votes, meId, isHost }: {
  room: { id: string }; round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string; isHost: boolean;
}) {
  const [showRanking, setShowRanking] = useState(false);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }
  useEffect(() => { const t = setTimeout(() => setShowRanking(true), 2600); return () => clearTimeout(t); }, []);

  const mainVotes = votes.filter((v) => !v.is_tiebreak);
  const countFor = (id: string | null, field: "best_id" | "worst_id") =>
    id ? mainVotes.filter((v) => v[field] === id).length : 0;
  const votesLabel = (n: number) => `${n} ${n === 1 ? "voto" : "votos"}`;

  const bestId = round.best_winner;
  const worstId = round.worst_loser;
  const nameOf = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";
  const textOf = (id: string | null) => answers.find((a) => a.player_id === id)?.text ?? "—";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={meId} />
        </div>
      )}
      {!showRanking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <Confetti variant="party" />
          <section className="flex w-full flex-col items-center gap-2">
            <Flame size={52} />
            <LogoTitle as="h2" size="md">O mais pica</LogoTitle>
            <p className="break-words font-display text-3xl font-extrabold">{nameOf(bestId)}</p>
            <Card className="w-full break-words !bg-logo-pink font-bold text-white">
              {textOf(bestId)} <span className="opacity-85">· {votesLabel(countFor(bestId, "best_id"))}</span>
            </Card>
          </section>
          <section className="flex w-full flex-col items-center gap-2">
            {worstId == null ? (
              <>
                <Star size={44} />
                <p className="font-display text-xl font-extrabold">Sem pior nesta rodada</p>
              </>
            ) : (
              <>
                <Tomato size={46} />
                <LogoTitle as="h2" size="sm">O pior</LogoTitle>
                <p className="break-words font-display text-2xl font-extrabold">{nameOf(worstId)}</p>
                <Card className="w-full break-words !bg-logo-purple font-bold text-white">
                  {textOf(worstId)} <span className="opacity-85">· {votesLabel(countFor(worstId, "worst_id"))}</span>
                </Card>
              </>
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2">
            <Trophy size={36} />
            <LogoTitle as="h2" size="md">Ranking</LogoTitle>
          </div>
          <Ranking players={players} deltas={round.round_scores} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button disabled={busy} icon={<Play size={20} />} onClick={() => run(() => nextRound({ roomId: room.id, playerId: meId }))}>Próxima rodada</Button>
              <Button className="!bg-ink" disabled={busy} onClick={() => run(() => endGame({ roomId: room.id, playerId: meId }))}>Encerrar partida</Button>
            </div>
          ) : (
            <p className="text-center font-bold opacity-70">Aguardando o dono…</p>
          )}
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Verificar (os erros `react-hooks/purity` devem sumir)**

Run: `npx tsc --noEmit`, `npx vitest run`, `npx eslint app components`.
Expected: sem erro de tipo e todos passam. O eslint cai de 6 para **2 erros**, os `set-state-in-effect` da base, e nenhum `react-hooks/purity`.

- [ ] **Step 7: Commit**

```bash
git add components/screens/Result.tsx components/screens/Ranking.tsx __tests__/screens.test.tsx
git commit -m "feat(visual): resultado e ranking com chama, tomate, medalhas e confete SVG"
```

---

## Task 9: Pódio A2

**Files:**
- Modify: `components/screens/Podium.tsx`
- Test: `__tests__/screens.test.tsx` (ampliar)

**Interfaces:**
- Consumes: `Crown`, `Restart` (Task 2); `LogoTitle`, `Confetti`, `Button` com `icon` (Task 3); `BlockAvatar`, `colorIndexByJoin` (existentes).
- `Podium({ players: PlayerRow[] })`: a assinatura não muda.

- [ ] **Step 1: Escrever os testes que falham**

Append to `__tests__/screens.test.tsx`:

```tsx
describe("Podium", () => {
  it("mostra o campeão no selo com coroa e os degraus 1-2-3", async () => {
    const { Podium } = await import("@/components/screens/Podium");
    const html = renderToStaticMarkup(
      <Podium players={[player("1", "Júlia Branco", 68), player("2", "Marina", 66), player("3", "Rafael", 64)]} />,
    );
    expect(html).toContain("Júlia Branco venceu!");
    expect(html).toContain('aria-label="campeã(o)"');
    expect(html).toContain('data-rank="1"');
    expect(html).toContain('data-rank="2"');
    expect(html).toContain('data-rank="3"');
    expect(html).not.toMatch(/[\u{1F3C6}\u{1F451}\u{1F947}-\u{1F949}]/u);
  });

  it("com 2 jogadores renderiza só os degraus existentes", async () => {
    const { Podium } = await import("@/components/screens/Podium");
    const html = renderToStaticMarkup(<Podium players={[player("1", "Ana", 10), player("2", "Bia", 4)]} />);
    expect(html).toContain('data-rank="1"');
    expect(html).toContain('data-rank="2"');
    expect(html).not.toContain('data-rank="3"');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: FAIL. Não há "venceu!" nem `data-rank`.

- [ ] **Step 3: Substituir `components/screens/Podium.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { Crown, Restart } from "@/components/icons";
import type { PlayerRow } from "@/lib/supabase/database.types";

// Degraus no estilo A2: 1º rosa (mais alto), 2º azul, 3º roxo.
const STEP = {
  1: { h: "h-36", bg: "bg-logo-pink", num: "text-6xl" },
  2: { h: "h-24", bg: "bg-logo-blue", num: "text-5xl" },
  3: { h: "h-16", bg: "bg-logo-purple", num: "text-4xl" },
} as const;

export function Podium({ players }: { players: PlayerRow[] }) {
  const router = useRouter();
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const joinIndex = colorIndexByJoin(players);
  const [first, second, third] = ordered;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-5 text-center">
      <Confetti variant="party" />
      <LogoTitle>Fim de jogo!</LogoTitle>
      {first && (
        <p className="sticker inline-flex max-w-full -rotate-2 items-center gap-2 break-words font-display text-lg font-extrabold">
          <Crown size={26} />
          {first.name} venceu!
        </p>
      )}
      <div className="mt-4 flex w-full items-end justify-center gap-2">
        <Step player={second} rank={2} colorIndex={joinIndex.get(second?.id ?? "")} />
        <Step player={first} rank={1} colorIndex={joinIndex.get(first?.id ?? "")} />
        <Step player={third} rank={3} colorIndex={joinIndex.get(third?.id ?? "")} />
      </div>
      <Button onClick={() => router.push("/")} icon={<Restart size={20} />}>Jogar de novo</Button>
    </main>
  );
}

function Step({ player, rank, colorIndex }: { player?: PlayerRow; rank: 1 | 2 | 3; colorIndex?: number }) {
  if (!player) return null;
  const s = STEP[rank];
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <div className="relative">
        {rank === 1 && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 -rotate-12">
            <Crown size={36} title="campeã(o)" />
          </span>
        )}
        <BlockAvatar seed={player.id} size={48} colorIndex={colorIndex} />
      </div>
      <span className="w-full break-words font-extrabold leading-tight">{player.name}</span>
      <div
        data-rank={rank}
        className={`${s.h} ${s.bg} flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl rounded-b-lg border-3 border-ink pt-2 shadow-chunky`}
      >
        <span className={`text-logo font-display font-extrabold leading-none ${s.num}`}>{rank}</span>
        <span className="pill font-display text-sm">{player.total_points}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run __tests__/screens.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit`, `npx vitest run`, `npx eslint app components`.
Expected: sem erro de tipo, todos passam, eslint com 2 erros (os da base).

- [ ] **Step 6: Commit**

```bash
git add components/screens/Podium.tsx __tests__/screens.test.tsx
git commit -m "feat(visual): podio A2 com coroa, degraus nas cores do logo e confete"
```

---

## Task 10: Trava anti-emoji e documentação

**Files:**
- Create: `__tests__/no-emoji.test.ts`
- Modify: `README.md`, `docs/decisoes.md`

**Interfaces:**
- Consumes: todas as telas já convertidas (Tasks 4 a 9).

- [ ] **Step 1: Escrever o teste**

Create `__tests__/no-emoji.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Emoji e pictogramas que não devem aparecer na interface (o app usa ícones SVG próprios).
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{2713}\u{2190}-\u{21FF}\u{23E9}-\u{23FA}\u{25B6}]/u;

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
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `npx vitest run __tests__/no-emoji.test.ts`
Expected: PASS. Se falhar, a mensagem lista `arquivo:linha: emoji`. Corrija esses pontos usando o ícone correspondente da tabela da spec (seção 2.1) e rode de novo.

- [ ] **Step 3: Provar que o teste pega regressão**

Temporarily add the line `const x = "🔥";` at the end of `components/ui/Card.tsx`.
Run: `npx vitest run __tests__/no-emoji.test.ts`
Expected: FAIL listando `components/ui/Card.tsx:<linha>: 🔥`.
Then remove the line, re-run, and expect PASS. `git diff components/ui/Card.tsx` deve ficar vazio.

- [ ] **Step 4: README**

In `README.md`, inside the Stack section, add the bullet below after the line that mentions the fonts (Fredoka/Baloo 2). If there is no such line, add it at the end of the Stack section:

```markdown
- **Visual:** ícones SVG próprios em `components/icons/` (estilo do logo: preenchimento colorido e contorno escuro grosso), sem emoji na interface. O teste `__tests__/no-emoji.test.ts` impede que emojis voltem.
```

- [ ] **Step 5: `docs/decisoes.md`**

Append:

```markdown
## 2026-10-13 — Visual A2: ícones próprios e identidade do logo

- **Decisão:** trocar todos os emojis por um conjunto próprio de ícones SVG (`components/icons/`) no estilo do logo, que tem preenchimento com as cores do logo e contorno escuro grosso. Os títulos usam as letras do logo (`text-logo`), o confete é geométrico (`Confetti`) e a fonte corrigida é Fredoka/Baloo 2 (antes o body forçava Arial). O "pior" é representado por um tomate podre.
- **Motivo:** o usuário pediu um visual elegante e profissional que mantivesse a essência do tema. Emojis variam por sistema (iOS/Android) e destoam do logo. Ícones de bibliotecas como Lucide e Phosphor são de traço fino e ficariam com cara de "app genérico".
- **Alternativas descartadas:** ilustrações com volume (B), visual clean minimalista (C), medalhas no boneco (A3) e uma biblioteca de ícones pronta.
- **Impacto:** nenhuma dependência nova e nenhuma mudança de regra ou dados. O teste `no-emoji` impede regressões. Spec: `docs/superpowers/specs/2026-10-13-visual-icones-a2-design.md`.
```

- [ ] **Step 6: Verificação final completa**

Run: `npx tsc --noEmit`, then `npx vitest run`, then `npx next build`, then `npx eslint app components`.
Expected:
- tsc sem erros;
- todos os testes passam (62 da base + 5 de globals + 42 de ícones + 6 de ui + 4 de telas + 1 anti-emoji = **120**);
- build ok;
- eslint com 2 erros (os `set-state-in-effect` da base).

- [ ] **Step 7: Commit**

```bash
git add __tests__/no-emoji.test.ts README.md docs/decisoes.md
git commit -m "test(visual): trava anti-emoji; docs do visual A2"
```

---

## Verificação manual (QA na preview)

Com 4 jogadores em origens distintas (`localhost`, `a.localhost`, `b.localhost`, `c.localhost`), percorrer:
- Home
- Lobby (com convite)
- Regras
- Contagem
- Preencher (com palavra repetida)
- Votação (com "parece repetida?" e com desempate best→worst)
- Resultado ("sem pior" também)
- Ranking
- Pódio
- "Sala não encontrada"

Em cada tela:
- [ ] 375px: nenhum scroll horizontal; nome de 16 caracteres e títulos em caixa alta quebram dentro do card.
- [ ] Desktop: layout centralizado como hoje.
- [ ] Nenhum emoji visível. Os ícones batem com os mockups.
- [ ] Texto corrido em Fredoka (não Arial). Conferir com `getComputedStyle(document.body).fontFamily`.
- [ ] Leitor de tela (árvore de acessibilidade): ícones decorativos fora; "Expulsar {nome}", "votou", "1º lugar", "dono da sala" e "campeã(o)" presentes.
- [ ] `prefers-reduced-motion: reduce` (emulado): confete parado.
- [ ] Contraste: textos brancos sobre rosa/roxo legíveis; `text-logo` legível sobre o amarelo.

---

## Self-Review

**1. Cobertura da spec:**

| Spec | Task |
|---|---|
| §1 fonte, tokens, utilities, tema escuro removido | 1 |
| §2.1 ícones (21) + a11y | 2 |
| §2.2 LogoTitle, Confetti (determinístico, reduced-motion), Button `icon` | 1 (CSS), 3 |
| §3 Home, sala (Sad, JoinSeat), InviteShare | 4 |
| §3 Lobby, ManagePlayers, VotersList | 5 |
| §3 Regras, Contagem, Preencher | 6 |
| §3 Votação | 7 |
| §3 Resultado, Ranking | 8 |
| §3 Pódio | 9 |
| §4 teste anti-emoji, teste dos ícones, lint purity, QA | 2, 8, 10, Verificação manual |
| Docs (README/decisões) | 10 |

**2. Placeholders:** nenhum "TBD" ou "similar à Task N". Todo passo de código traz o código.

**3. Consistência de nomes e tipos:**
- `IconProps` e `Svg` (Task 2) são usados em `game.tsx`/`ui.tsx`.
- `Medal` recebe `rank: 1|2|3` (Tasks 2 e 8).
- `LogoTitle` recebe `as`/`size` (Task 3), com os valores `"md"`/`"sm"` usados em 7 e 8.
- `Confetti` recebe `variant` `"subtle"|"party"` (Task 3), usado em 5, 6, 8 e 9.
- `Button` recebe `icon` (Task 3), usado em 4 a 9.
- As utilities `pill`, `sticker`, `text-logo` e as cores `logo-*`/`cream` (Task 1) são usadas em 6 a 9.

**4. Review Focus:** cada item tem dono.
- Nome longo: `break-words` nas Tasks 3, 5, 7, 8 e 9, mais o QA.
- A11y: testes da Task 2 e `title`/`aria-label` testados nas Tasks 5, 8 e 9.
- Pódio com 2 jogadores: Task 9.
- Reduced motion: Task 1.
- Regressão de emoji: Task 10.

**Nota de ordem:** a Task 10 (anti-emoji) fica por último de propósito. Se viesse antes, ficaria vermelha até todas as telas serem convertidas.
