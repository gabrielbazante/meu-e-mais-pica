# Ajustes pós-playtest — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 10 ajustes pós-playtest no "O meu é mais pica" — novo ciclo de rodada (regras → contagem 3-2-1 → preencher → votar → desempate duplo sequencial → resultado), pontuação com penalidade, reconexão por nome, expulsão, dica de repetida e ranking animado.

**Architecture:** As regras puras ficam em `lib/game/*` (testadas com Vitest). A orquestração de estado (avanço de fase, apuração, finalização) sai dos arquivos `"use server"` para um módulo compartilhado `app/actions/engine.ts` (sem `"use server"`), para que `game.ts` e `room.ts` reutilizem os mesmos helpers sem expô-los como server actions. A sincronização de contagem e desempate usa colunas novas em `rounds`; o Realtime do Supabase já publica as tabelas.

**Tech Stack:** Next.js 16 (App Router, React 19, Server Actions), TypeScript, Tailwind v4 (tokens/utilities em `app/globals.css`), Supabase (Postgres + Realtime, anon key), Vitest.

**Spec:** docs/superpowers/specs/2026-10-13-ajustes-pos-playtest-design.md

## Global Constraints

- Next 16 tem breaking changes; antes de usar APIs do framework, consultar `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- Tailwind v4 sem config JS: tokens e utilities vivem em `app/globals.css` (`@theme`, `@utility`). Não criar `tailwind.config.ts`.
- Supabase acessado com anon key; RLS liberado (políticas `using(true)`), sem service role no cliente.
- A migração SQL (`supabase/migrations/0002_ajustes_playtest.sql`) é rodada no dashboard do Supabase **pelo usuário**; nenhum passo deve tentar aplicá-la automaticamente.
- UX e textos em PT-BR.
- O check da lista de votantes usa o caractere `"✓"` (U+2713), **não** emoji.
- Overrides de cor no Tailwind v4 precisam de `!` (ex.: `!bg-party-teal`, `!bg-ink`) — padrão já usado no projeto.
- Commits com a identidade Gabriel Bazante configurada no Git; **sem** linha de coautoria (ver `dev-team/gitflow.md`: "Não atribuir coautoria").

## Review Focus

As 5 classes de entrada/falha mais prováveis de machucar o usuário, implícitas no spec mas sem cobertura automática óbvia (mais provável primeiro). Cada uma tem o teste/guard acrescentado na task dona:

1. **Dono cai/sai no meio e trava o jogo** (ações são host-only: `dismissRules`, `beginRound` garantido, `nextRound`). Mitigação parcial: ao voltar com o mesmo nome, o cliente adota o id da cadeira do dono (Task 9) e reassume o host. Risco residual (dono some sem voltar) fica **documentado como limitação** — não há "promover novo dono" neste escopo.
2. **Todos marcados como repetidos / menos de 2 candidatos de voto** → pula votação e finaliza direto; o único respondente (se houver) leva +10, os demais caem na penalidade. Teste em `scoring.roundDeltas` (borda `worstId=null`, único `bestId`) na Task 2 e no guard de `maybeAdvanceFromFill` (Task 8).
3. **Corrida do `beginRound`** (vários clientes disparam ao fim da contagem) → sorteio duplo de tema. Guard: `beginRoundCore` só age com `phase='contagem'` e `starts_at<=now`, e grava via UPDATE condicional `.eq("phase","contagem")` (Postgres re-avalia o predicado sob lock → só um vencedor). Teste de unidade do guard de fase na Task 8; corrida real verificada na preview.
4. **Não-respondente com total 0 levando −1** deve ficar em 0, e `round_scores` precisa guardar o delta **efetivamente aplicado** (0, não −1), senão o ranking animado reconstrói a ordem antiga errada. Teste em `scoring.roundDeltas` (Task 2).
5. **Reclaim-by-name batendo na cadeira do dono** → o cliente que volta **adota o id da cadeira existente** (via `setPlayerId`) em vez de o servidor mutar `players.id`. Como `rooms.host_id` já aponta pro id daquela cadeira, o cliente reassume o host automaticamente — sem mutação de PK, de FK ou de `host_id`. Risco residual documentado: dois jogadores com exatamente o mesmo nome brigam pela cadeira. Comportamento verificado na preview (Task 9).

---

## File Structure

| Arquivo | Ação | Responsabilidade |
| --- | --- | --- |
| `supabase/migrations/0002_ajustes_playtest.sql` | Criar | Colunas novas em `rounds`/`answers` e `theme`/`letter` nullable. Rodada pelo usuário. |
| `lib/supabase/database.types.ts` | Modificar | Tipos das colunas novas; `theme`/`letter` nullable; `phase` com `regras`/`contagem`. |
| `lib/game/types.ts` | Modificar | `Phase` com `regras`/`contagem`. |
| `lib/game/phase.ts` | Modificar | `COUNTDOWN_SECONDS`. |
| `lib/game/scoring.ts` | Criar | `roundDeltas` (pontuação da rodada com penalidade e piso em 0). Puro, testado. |
| `lib/game/similarity.ts` | Criar | `possibleDuplicates` (dica fuzzy de repetida). Puro, testado. |
| `__tests__/scoring.test.ts` | Criar | Testes de `roundDeltas`. |
| `__tests__/similarity.test.ts` | Criar | Testes de `possibleDuplicates`. |
| `app/actions/engine.ts` | Criar | Orquestração compartilhada (sem `"use server"`): `assertHost`, `createCountdownRound`, `beginRoundCore`, `maybeAdvanceFromFill`, `finalizeRound`, `maybeTally`. |
| `app/actions/game.ts` | Modificar | Actions finas: `startGame`→regras, `dismissRules`, `beginRound`, `nextRound`→contagem, `endGame`, `submitAnswer`, `castVote`, `expireFill`, `voidAnswer`. |
| `app/actions/room.ts` | Modificar | `joinRoom` reclaim-by-name devolve o id da cadeira; `kickPlayer`. |
| `lib/identity.ts` | Modificar | `setPlayerId(id)` (grava a chave `mpc:player-id`) para o cliente adotar o id da cadeira recuperada. |
| `__tests__/identity.test.ts` | Modificar | Teste de `setPlayerId`. |
| `app/page.tsx` | Modificar | `handleJoin` adota o `playerId` retornado por `joinRoom`. |
| `components/screens/Rules.tsx` | Criar | Tela de regras (fase `regras`). |
| `components/screens/Countdown.tsx` | Criar | Contagem 3-2-1 sincronizada (fase `contagem`), dispara `beginRound`. |
| `components/ui/ManagePlayers.tsx` | Criar | Lista de jogadores com "×" para o dono expulsar. |
| `components/ui/VotersList.tsx` | Criar | Lista de quem já votou, com check `"✓"`. |
| `components/screens/Vote.tsx` | Modificar | Rótulo best/worst, dica fuzzy, marcar repetida (dono), lista de votantes. |
| `components/screens/Result.tsx` | Modificar | Destaques mais-pica/pior com votos; passa deltas ao Ranking. |
| `components/screens/Ranking.tsx` | Modificar | Ordem antiga→nova (anima FLIP) + "+X" por jogador. |
| `components/screens/Fill.tsx` | Modificar | Texto; botão "Jogadores" (ManagePlayers) para o dono. |
| `components/screens/Lobby.tsx` | Modificar | ManagePlayers para o dono. |
| `app/sala/[code]/page.tsx` | Modificar | Fases `regras`/`contagem`; card "Entrar nesta sala" quando `meId` não está em `players`; key do `Vote` inclui `tiebreak_kind`. |

---

## Task 1: Migração SQL e tipos

**Files:**
- Create: `supabase/migrations/0002_ajustes_playtest.sql`
- Modify: `lib/supabase/database.types.ts`
- Modify: `lib/game/types.ts`

- [ ] **Step 1: Escrever a migração**

Create `supabase/migrations/0002_ajustes_playtest.sql`:

```sql
-- Ajustes pós-playtest (2026-10-13). Rodar no SQL editor do Supabase.

-- tema/letra agora são sorteados só ao fim da contagem (ficam null em regras/contagem)
alter table rounds alter column theme drop not null;
alter table rounds alter column letter drop not null;

-- contagem sincronizada, desempate sequencial, deltas da rodada
alter table rounds add column starts_at timestamptz;
alter table rounds add column tiebreak_kind text;      -- 'best' | 'worst' | null
alter table rounds add column best_winner uuid;
alter table rounds add column worst_loser uuid;
alter table rounds add column round_scores jsonb not null default '{}'::jsonb;

-- marcação de resposta repetida
alter table answers add column voided boolean not null default false;

-- Nao ha mudanca de FK: a reconexao por nome NAO muta players.id. O cliente
-- adota o id da cadeira existente (ver Task 9), entao as PKs/FKs ficam intactas.
-- Novos valores de rounds.phase ('regras','contagem') são texto livre: sem constraint a alterar.
```

- [ ] **Step 2: Atualizar `database.types.ts`**

Replace the `RoundRow` and `AnswerRow` interfaces in `lib/supabase/database.types.ts` with:

```ts
export interface RoundRow {
  id: string;
  room_id: string;
  theme: string | null;
  letter: string | null;
  phase: "regras" | "contagem" | "preencher" | "votar" | "desempate" | "resultado";
  tiebreak_candidates: string[];
  tiebreak_kind: "best" | "worst" | null;
  best_winner: string | null;
  worst_loser: string | null;
  round_scores: Record<string, number>;
  starts_at: string | null;
  ends_at: string | null;
  started_at: string;
}
export interface AnswerRow {
  id: string;
  round_id: string;
  player_id: string;
  text: string;
  voided: boolean;
  submitted_at: string;
}
```

- [ ] **Step 3: Atualizar `lib/game/types.ts`**

Replace the `Phase` type:

```ts
export type Phase = "regras" | "contagem" | "preencher" | "votar" | "desempate" | "resultado";
```

- [ ] **Step 4: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: pode haver erros nos arquivos ainda não atualizados (game.ts/Fill etc.) por `theme` agora ser `string | null`; eles são resolvidos nas tasks seguintes. Não deve haver erro **dentro** dos três arquivos editados aqui.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_ajustes_playtest.sql lib/supabase/database.types.ts lib/game/types.ts
git commit -m "feat(schema): colunas de contagem/desempate/scores e tipos pos-playtest"
```

---

## Task 2: `roundDeltas` (pontuação da rodada) — TDD

**Files:**
- Create: `lib/game/scoring.ts`
- Test: `__tests__/scoring.test.ts`

**Interfaces:**
- Produces: `roundDeltas(input: RoundDeltasInput): Record<string, number>` onde
  `RoundDeltasInput = { playerIds: string[]; answeredIds: string[]; bestId: string | null; worstId: string | null; currentTotals: Record<string, number> }`.
- Consumes: nada (puro).

Regras: melhor = +10; pior = 0; respondeu e não é melhor/pior = +2; não respondeu = (`currentTotals[id] >= 1 ? -1 : 0`). `answeredIds` inclui autores de respostas `voided` (levam +2). O valor retornado é o delta **efetivamente aplicado** (já com piso em 0 no total).

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { roundDeltas } from "@/lib/game/scoring";

describe("roundDeltas", () => {
  it("melhor +10, pior 0, respondentes +2", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "c", "d"],
      answeredIds: ["a", "b", "c", "d"],
      bestId: "a",
      worstId: "d",
      currentTotals: { a: 0, b: 0, c: 0, d: 0 },
    });
    expect(d).toEqual({ a: 10, b: 2, c: 2, d: 0 });
  });

  it("nao-respondente com pontos leva -1", () => {
    const d = roundDeltas({
      playerIds: ["a", "e"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 4, e: 5 },
    });
    expect(d.e).toBe(-1);
  });

  it("nao-respondente com total 0 fica em 0 (nunca negativo)", () => {
    const d = roundDeltas({
      playerIds: ["a", "f"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 0, f: 0 },
    });
    expect(d.f).toBe(0);
  });

  it("autor de resposta anulada (em answeredIds) leva +2", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "g"],
      answeredIds: ["a", "b", "g"],
      bestId: "a",
      worstId: "b",
      currentTotals: { a: 0, b: 0, g: 0 },
    });
    expect(d.g).toBe(2);
  });

  it("borda <2 respostas: unico respondente +10, demais caem na penalidade", () => {
    const d = roundDeltas({
      playerIds: ["a", "b", "c"],
      answeredIds: ["a"],
      bestId: "a",
      worstId: null,
      currentTotals: { a: 3, b: 3, c: 0 },
    });
    expect(d).toEqual({ a: 10, b: -1, c: 0 });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run __tests__/scoring.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/scoring"`.

- [ ] **Step 3: Implementar o mínimo**

Create `lib/game/scoring.ts`:

```ts
export interface RoundDeltasInput {
  playerIds: string[];
  answeredIds: string[];   // inclui autores de respostas voided
  bestId: string | null;
  worstId: string | null;
  currentTotals: Record<string, number>;
}

// Delta efetivamente aplicado à pontuação total de cada jogador na rodada.
// melhor=+10, pior=0, respondeu=+2, nao respondeu=-1 (piso em 0 no total).
export function roundDeltas(input: RoundDeltasInput): Record<string, number> {
  const answered = new Set(input.answeredIds);
  const deltas: Record<string, number> = {};
  for (const id of input.playerIds) {
    if (id === input.bestId) deltas[id] = 10;
    else if (id === input.worstId) deltas[id] = 0;
    else if (answered.has(id)) deltas[id] = 2;
    else deltas[id] = (input.currentTotals[id] ?? 0) >= 1 ? -1 : 0;
  }
  return deltas;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run __tests__/scoring.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/game/scoring.ts __tests__/scoring.test.ts
git commit -m "feat(scoring): roundDeltas com penalidade e piso em 0"
```

---

## Task 3: `possibleDuplicates` (dica fuzzy) — TDD

**Files:**
- Create: `lib/game/similarity.ts`
- Test: `__tests__/similarity.test.ts`

**Interfaces:**
- Produces: `possibleDuplicates(answers: { playerId: string; text: string }[]): Set<string>`.
- Consumes: `normalizeAnswer` de `lib/game/normalize.ts`.

Regra: par é "possível repetida" se, após `normalizeAnswer`, compartilham uma palavra de 4+ letras OU uma string normalizada é substring da outra. Ignora texto normalizado vazio. É só dica — falso positivo aceito.

- [ ] **Step 1: Escrever o teste que falha**

Create `__tests__/similarity.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { possibleDuplicates } from "@/lib/game/similarity";

describe("possibleDuplicates", () => {
  it("sinaliza 'Manchester United' x 'Man United' (compartilham 'united')", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Manchester United" },
      { playerId: "b", text: "Man United" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("falso positivo aceito: 'Manchester United' x 'Manchester City'", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Manchester United" },
      { playerId: "b", text: "Manchester City" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("sinaliza por substring: 'Fla' x 'Flamengo'", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Fla" },
      { playerId: "b", text: "Flamengo" },
    ]);
    expect(flagged.has("a")).toBe(true);
    expect(flagged.has("b")).toBe(true);
  });

  it("nao sinaliza respostas sem palavra em comum nem substring", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "Gato" },
      { playerId: "b", text: "Peixe" },
    ]);
    expect(flagged.size).toBe(0);
  });

  it("ignora texto vazio", () => {
    const flagged = possibleDuplicates([
      { playerId: "a", text: "" },
      { playerId: "b", text: "" },
    ]);
    expect(flagged.size).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run __tests__/similarity.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/similarity"`.

- [ ] **Step 3: Implementar o mínimo**

Create `lib/game/similarity.ts`:

```ts
import { normalizeAnswer } from "./normalize";

// Dica fuzzy: marca pares de respostas "possivelmente repetidas". So sugestao
// para o dono decidir — aceita falso positivo (ex.: dois "Manchester ...").
export function possibleDuplicates(
  answers: { playerId: string; text: string }[],
): Set<string> {
  const flagged = new Set<string>();
  const norm = answers.map((a) => ({ playerId: a.playerId, n: normalizeAnswer(a.text) }));
  for (let i = 0; i < norm.length; i++) {
    for (let j = i + 1; j < norm.length; j++) {
      const a = norm[i];
      const b = norm[j];
      if (!a.n || !b.n || a.playerId === b.playerId) continue;
      if (sharesLongWord(a.n, b.n) || isSubstring(a.n, b.n)) {
        flagged.add(a.playerId);
        flagged.add(b.playerId);
      }
    }
  }
  return flagged;
}

function sharesLongWord(a: string, b: string): boolean {
  const wa = new Set(a.split(" ").filter((w) => w.length >= 4));
  return b.split(" ").some((w) => w.length >= 4 && wa.has(w));
}

function isSubstring(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npx vitest run __tests__/similarity.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/game/similarity.ts __tests__/similarity.test.ts
git commit -m "feat(similarity): possibleDuplicates para dica de repetida"
```

---

## Task 4: `COUNTDOWN_SECONDS`

**Files:**
- Modify: `lib/game/phase.ts`

- [ ] **Step 1: Adicionar a constante**

In `lib/game/phase.ts`, after `export const FILL_SECONDS = 60;`, add:

```ts
export const COUNTDOWN_SECONDS = 3;
```

- [ ] **Step 2: Rodar os testes existentes de phase**

Run: `npx vitest run __tests__/phase.test.ts`
Expected: PASS (nenhuma regressão).

- [ ] **Step 3: Commit**

```bash
git add lib/game/phase.ts
git commit -m "feat(phase): COUNTDOWN_SECONDS para a contagem sincronizada"
```

---

## Task 5: `engine.ts` — assertHost, createCountdownRound, beginRoundCore

**Files:**
- Create: `app/actions/engine.ts`

**Interfaces:**
- Produces:
  - `type SB = ReturnType<typeof createServerClient>`
  - `assertHost(supabase: SB, roomId: string, playerId: string): Promise<void>`
  - `createCountdownRound(supabase: SB, roomId: string): Promise<void>`
  - `beginRoundCore(supabase: SB, roundId: string): Promise<void>`
- Consumes: `createServerClient` (`@/lib/supabase/server`), `drawRound` (`@/lib/game/draw`), `FILL_SECONDS`, `COUNTDOWN_SECONDS` (`@/lib/game/phase`), `RoundRow` (`@/lib/supabase/database.types`).

Nota: este módulo **não** tem `"use server"` — são helpers chamados pelas actions, nunca expostos ao cliente.

- [ ] **Step 1: Criar o arquivo com os três primeiros helpers**

Create `app/actions/engine.ts`:

```ts
import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { FILL_SECONDS, COUNTDOWN_SECONDS } from "@/lib/game/phase";
import type { RoundRow } from "@/lib/supabase/database.types";

export type SB = ReturnType<typeof createServerClient>;

export async function assertHost(supabase: SB, roomId: string, playerId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== playerId) throw new Error("Só o dono da sala pode fazer isso");
}

// Cria a próxima rodada já em contagem (tema/letra ficam null até o fim da contagem).
export async function createCountdownRound(supabase: SB, roomId: string) {
  const startsAt = new Date(Date.now() + COUNTDOWN_SECONDS * 1000).toISOString();
  const { data: round, error } = await supabase
    .from("rounds")
    .insert({ room_id: roomId, phase: "contagem", starts_at: startsAt })
    .select().single();
  if (error || !round) throw new Error(error?.message ?? "Falha ao criar rodada");
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round.id }).eq("id", roomId);
}

// Idempotente: so sorteia tema+letra e abre "preencher" quando a contagem terminou.
// O UPDATE condicional (.eq phase='contagem') garante um unico vencedor sob corrida
// (Postgres re-avalia o predicado apos o lock da linha).
export async function beginRoundCore(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "contagem") return;
  if (!round.starts_at || new Date(round.starts_at) > new Date()) return;

  const { data: prev } = await supabase
    .from("rounds").select("theme").eq("room_id", round.room_id)
    .not("theme", "is", null)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();

  const { theme, letter } = drawRound({ prevTheme: prev?.theme ?? undefined });
  const endsAt = new Date(Date.now() + FILL_SECONDS * 1000).toISOString();
  await supabase.from("rounds")
    .update({ theme, letter, phase: "preencher", ends_at: endsAt })
    .eq("id", roundId).eq("phase", "contagem");
}
```

- [ ] **Step 2: Verificar typecheck do módulo**

Run: `npx tsc --noEmit`
Expected: sem erros novos em `app/actions/engine.ts` (erros em game.ts/room.ts ainda existem até as Tasks 7–8).

- [ ] **Step 3: Commit**

```bash
git add app/actions/engine.ts
git commit -m "feat(engine): assertHost, createCountdownRound, beginRoundCore"
```

---

## Task 6: `engine.ts` — finalizeRound

**Files:**
- Modify: `app/actions/engine.ts`

**Interfaces:**
- Produces: `finalizeRound(supabase: SB, round: RoundRow, bestId?: string | null, worstId?: string | null): Promise<void>`.
- Consumes: `roundDeltas` (`@/lib/game/scoring`).

Aplica os deltas, grava `round_scores` (delta efetivo), `best_winner`/`worst_loser`, e vai para `resultado`. Na borda `<2`, se `bestId` não veio e há exatamente 1 respondente, ele é o melhor.

- [ ] **Step 1: Adicionar o import**

At the top of `app/actions/engine.ts`, add to the imports:

```ts
import { roundDeltas } from "@/lib/game/scoring";
```

- [ ] **Step 2: Adicionar `finalizeRound`**

Append to `app/actions/engine.ts`:

```ts
// Finaliza a rodada: calcula deltas, aplica aos totais, grava round_scores e vai pra resultado.
export async function finalizeRound(
  supabase: SB, round: RoundRow, bestId: string | null = null, worstId: string | null = null,
) {
  const { data: playerRows } = await supabase
    .from("players").select("id,total_points").eq("room_id", round.room_id);
  const { data: answerRows } = await supabase
    .from("answers").select("player_id,text").eq("round_id", round.id);

  const playerIds = (playerRows ?? []).map((p) => p.id);
  const currentTotals: Record<string, number> = {};
  for (const p of playerRows ?? []) currentTotals[p.id] = p.total_points;
  // respondentes = tem linha com texto nao-vazio (inclui voided → +2)
  const answeredIds = (answerRows ?? []).filter((a) => a.text.trim() !== "").map((a) => a.player_id);

  // borda <2: se nao veio melhor explicito e so ha um respondente, ele leva +10
  let effectiveBest = bestId;
  if (effectiveBest == null && answeredIds.length === 1) effectiveBest = answeredIds[0];

  const deltas = roundDeltas({ playerIds, answeredIds, bestId: effectiveBest, worstId, currentTotals });

  for (const p of playerRows ?? []) {
    const d = deltas[p.id] ?? 0;
    if (d !== 0) {
      await supabase.from("players").update({ total_points: p.total_points + d }).eq("id", p.id);
    }
  }
  await supabase.from("rounds").update({
    phase: "resultado",
    round_scores: deltas,
    best_winner: effectiveBest,
    worst_loser: worstId,
  }).eq("id", round.id);
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos em `engine.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/actions/engine.ts
git commit -m "feat(engine): finalizeRound aplica deltas e grava round_scores"
```

---

## Task 7: `engine.ts` — maybeAdvanceFromFill + maybeTally (desempate duplo)

**Files:**
- Modify: `app/actions/engine.ts`

**Interfaces:**
- Produces:
  - `maybeAdvanceFromFill(supabase: SB, roundId: string, timeUp: boolean): Promise<void>`
  - `maybeTally(supabase: SB, roundId: string): Promise<void>`
- Consumes: `tallyRound` (`@/lib/game/tally`), `resolveTiebreak` (`@/lib/game/tiebreak`), `fillPhaseComplete`, `votePhaseComplete` (`@/lib/game/phase`), `Player`, `Vote` (`@/lib/game/types`), `finalizeRound` (mesma task 6).

- [ ] **Step 1: Adicionar imports**

Add to the imports at the top of `app/actions/engine.ts`:

```ts
import { tallyRound } from "@/lib/game/tally";
import { resolveTiebreak } from "@/lib/game/tiebreak";
import { fillPhaseComplete, votePhaseComplete } from "@/lib/game/phase";
import type { Player, Vote } from "@/lib/game/types";
```

(junte com os imports já existentes; não duplique o `import type { RoundRow }`).

- [ ] **Step 2: Adicionar `maybeAdvanceFromFill`**

Append to `app/actions/engine.ts`:

```ts
// Avanca de "preencher" para "votar" quando todos responderam ou o tempo acabou.
// NAO insere respostas em branco: quem nao enviou simplesmente nao tem linha.
// Borda: com menos de 2 candidatos votaveis, pula a votacao e finaliza direto.
export async function maybeAdvanceFromFill(supabase: SB, roundId: string, timeUp: boolean) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "preencher") return;
  const expired = timeUp || (round.ends_at != null && new Date(round.ends_at) <= new Date());

  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { count: answeredCount } = await supabase
    .from("answers").select("id", { count: "exact", head: true }).eq("round_id", roundId);
  if (!fillPhaseComplete(answeredCount ?? 0, playerCount ?? 0, expired)) return;

  // candidatos de voto = resposta nao-vazia e nao anulada
  const { data: answerRows } = await supabase
    .from("answers").select("player_id,text,voided").eq("round_id", roundId);
  const votable = (answerRows ?? []).filter((a) => a.text.trim() !== "" && !a.voided);

  if (votable.length < 2) {
    await finalizeRound(supabase, round);
    return;
  }
  await supabase.from("rounds").update({ phase: "votar" }).eq("id", roundId).eq("phase", "preencher");
}
```

- [ ] **Step 3: Adicionar `maybeTally`**

Append to `app/actions/engine.ts`:

```ts
// Apura votos. Em "votar": abre desempate do melhor (se empatar), senao do pior
// (guardando best_winner), senao finaliza. Em "desempate": resolve conforme
// tiebreak_kind, encadeando best→worst quando o pior ainda empata.
// Votos que apontam para respostas anuladas sao nulificados antes do tally.
export async function maybeTally(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round) return;
  if (round.phase !== "votar" && round.phase !== "desempate") return;
  const isTiebreak = round.phase === "desempate";

  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { data: voteRows } = await supabase
    .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", isTiebreak);
  if (!votePhaseComplete(voteRows?.length ?? 0, playerCount ?? 0)) return;

  const { data: playerRows } = await supabase
    .from("players").select("id,name,total_points").eq("room_id", round.room_id);
  const players: Player[] = (playerRows ?? []).map((p) => ({
    id: p.id, name: p.name, totalPoints: p.total_points,
  }));

  const { data: answerRows } = await supabase
    .from("answers").select("player_id,voided,submitted_at").eq("round_id", roundId);
  const voided = new Set((answerRows ?? []).filter((a) => a.voided).map((a) => a.player_id));
  const nullifyVoided = (id: string | null) => (id && voided.has(id) ? null : id);

  // --- votos principais ---
  if (!isTiebreak) {
    const votes: Vote[] = (voteRows ?? []).map((v) => ({
      voterId: v.voter_id, bestId: nullifyVoided(v.best_id), worstId: nullifyVoided(v.worst_id),
    }));
    const result = tallyRound(players, votes);

    if (result.bestIds.length > 1) {
      await supabase.from("rounds").update({
        phase: "desempate", tiebreak_kind: "best", tiebreak_candidates: result.bestIds,
      }).eq("id", roundId).eq("phase", "votar");
      return;
    }
    const bestId = result.bestIds[0] ?? null;
    if (result.worstIds.length > 1) {
      await supabase.from("rounds").update({
        phase: "desempate", tiebreak_kind: "worst", tiebreak_candidates: result.worstIds, best_winner: bestId,
      }).eq("id", roundId).eq("phase", "votar");
      return;
    }
    await finalizeRound(supabase, round, bestId, result.worstIds[0] ?? null);
    return;
  }

  // --- votos de desempate (campo best_id = alvo escolhido) ---
  const submittedAt: Record<string, number> = {};
  for (const a of answerRows ?? []) submittedAt[a.player_id] = new Date(a.submitted_at).getTime();
  const tbBest = (voteRows ?? []).map((v) => nullifyVoided(v.best_id));

  // recomputa o pior a partir dos votos principais
  const { data: origVoteRows } = await supabase
    .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", false);
  const origVotes: Vote[] = (origVoteRows ?? []).map((v) => ({
    voterId: v.voter_id, bestId: nullifyVoided(v.best_id), worstId: nullifyVoided(v.worst_id),
  }));
  const base = tallyRound(players, origVotes);

  if (round.tiebreak_kind === "best") {
    const winner = resolveTiebreak(round.tiebreak_candidates, tbBest, submittedAt);
    if (base.worstIds.length > 1) {
      await supabase.from("votes").delete().eq("round_id", roundId).eq("is_tiebreak", true);
      await supabase.from("rounds").update({
        phase: "desempate", tiebreak_kind: "worst", tiebreak_candidates: base.worstIds, best_winner: winner,
      }).eq("id", roundId).eq("phase", "desempate");
      return;
    }
    await finalizeRound(supabase, round, winner, base.worstIds[0] ?? null);
    return;
  }

  // tiebreak_kind === "worst"
  const worstLoser = resolveTiebreak(round.tiebreak_candidates, tbBest, submittedAt);
  await finalizeRound(supabase, round, round.best_winner, worstLoser);
}
```

- [ ] **Step 4: Verificar typecheck + testes puros (sem regressão)**

Run: `npx tsc --noEmit` (sem erros novos em `engine.ts`) e `npx vitest run` (todos os testes puros existentes passam).

- [ ] **Step 5: Commit**

```bash
git add app/actions/engine.ts
git commit -m "feat(engine): maybeAdvanceFromFill sem blanks e maybeTally com desempate duplo"
```

---

## Task 8: `game.ts` — ciclo novo de actions

**Files:**
- Modify: `app/actions/game.ts`

**Interfaces:**
- Produces (server actions): `startGame`, `dismissRules({roundId,playerId})`, `beginRound({roundId})`, `nextRound`, `endGame`, `submitAnswer`, `expireFill`, `castVote`, `voidAnswer({roundId,hostId,targetId})`.
- Consumes de `engine.ts`: `assertHost`, `createCountdownRound`, `beginRoundCore`, `maybeAdvanceFromFill`, `maybeTally`.

- [ ] **Step 1: Reescrever `app/actions/game.ts`**

Replace the entire contents of `app/actions/game.ts` with:

```ts
"use server";
import { createServerClient } from "@/lib/supabase/server";
import { canStart, COUNTDOWN_SECONDS } from "@/lib/game/phase";
import { isDuplicateLater } from "@/lib/game/dedup";
import {
  assertHost, createCountdownRound, beginRoundCore, maybeAdvanceFromFill, maybeTally,
} from "./engine";

export async function startGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  const { count } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", input.roomId);
  if (!canStart(count ?? 0)) throw new Error("São necessários ao menos 3 jogadores");

  // rodada 1 comeca na tela de regras
  const { data: round, error } = await supabase
    .from("rounds").insert({ room_id: input.roomId, phase: "regras" }).select().single();
  if (error || !round) throw new Error(error?.message ?? "Falha ao criar rodada");
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round.id }).eq("id", input.roomId);
}

// Dono fecha as regras → vai pra contagem sincronizada.
export async function dismissRules(input: { roundId: string; playerId: string }) {
  const supabase = createServerClient();
  const { data: round } = await supabase
    .from("rounds").select("room_id,phase").eq("id", input.roundId).single();
  if (!round || round.phase !== "regras") return;
  await assertHost(supabase, round.room_id, input.playerId);
  const startsAt = new Date(Date.now() + COUNTDOWN_SECONDS * 1000).toISOString();
  await supabase.from("rounds")
    .update({ phase: "contagem", starts_at: startsAt })
    .eq("id", input.roundId).eq("phase", "regras");
}

// Qualquer cliente dispara ao fim da contagem; idempotente (ver beginRoundCore).
export async function beginRound(input: { roundId: string }) {
  const supabase = createServerClient();
  await beginRoundCore(supabase, input.roundId);
}

export async function nextRound(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await createCountdownRound(supabase, input.roomId);
}

export async function endGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await supabase.from("rooms").update({ status: "ended" }).eq("id", input.roomId);
}

export async function submitAnswer(
  input: { roundId: string; playerId: string; text: string },
): Promise<{ taken: boolean; word?: string }> {
  const supabase = createServerClient();
  const word = input.text.trim();
  await supabase.from("answers").upsert(
    { round_id: input.roundId, player_id: input.playerId, text: word, submitted_at: new Date().toISOString() },
    { onConflict: "round_id,player_id" },
  );

  const { data: rows } = await supabase
    .from("answers").select("player_id,text,submitted_at").eq("round_id", input.roundId);
  const all = (rows ?? []).map((a) => ({
    playerId: a.player_id, text: a.text, submittedAt: new Date(a.submitted_at).getTime(),
  }));
  const me = all.find((a) => a.playerId === input.playerId);
  if (me && isDuplicateLater(me, all)) {
    await supabase.from("answers").delete()
      .eq("round_id", input.roundId).eq("player_id", input.playerId);
    return { taken: true, word };
  }

  await maybeAdvanceFromFill(supabase, input.roundId, false);
  return { taken: false };
}

export async function expireFill(input: { roundId: string }) {
  const supabase = createServerClient();
  await maybeAdvanceFromFill(supabase, input.roundId, true);
}

export async function castVote(input: {
  roundId: string; voterId: string; bestId: string | null; worstId: string | null;
}) {
  const supabase = createServerClient();
  const { data: round } = await supabase.from("rounds").select("phase").eq("id", input.roundId).single();
  if (!round) return;
  const isTiebreak = round.phase === "desempate";
  await supabase.from("votes").upsert(
    {
      round_id: input.roundId, voter_id: input.voterId,
      best_id: input.bestId, worst_id: input.worstId, is_tiebreak: isTiebreak,
    },
    { onConflict: "round_id,voter_id,is_tiebreak" },
  );
  await maybeTally(supabase, input.roundId);
}

// Dono marca uma resposta como repetida: sai dos candidatos de voto (sem punicao).
export async function voidAnswer(input: { roundId: string; hostId: string; targetId: string }) {
  const supabase = createServerClient();
  const { data: round } = await supabase
    .from("rounds").select("room_id,phase").eq("id", input.roundId).single();
  if (!round) return;
  await assertHost(supabase, round.room_id, input.hostId);
  await supabase.from("answers").update({ voided: true })
    .eq("round_id", input.roundId).eq("player_id", input.targetId);
  // revalida avanco/apuracao (voto ja dado que apontava pro anulado é ignorado no tally)
  await maybeAdvanceFromFill(supabase, input.roundId, false);
  await maybeTally(supabase, input.roundId);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros em `app/actions/game.ts` nem em `engine.ts`. (Podem restar erros em componentes que importam coisas removidas — resolvidos nas Tasks 10+.)

- [ ] **Step 3: Commit**

```bash
git add app/actions/game.ts
git commit -m "feat(game): ciclo regras→contagem→preencher→votar→desempate→resultado + voidAnswer"
```

---

## Task 9: `room.ts` — joinRoom reclaim-by-name + kickPlayer

**Files:**
- Modify: `app/actions/room.ts`

**Files (adicionais desta task):**
- Modify: `lib/identity.ts`, `__tests__/identity.test.ts`, `app/page.tsx`

**Interfaces:**
- Produces: `joinRoom(input): Promise<{ code: string; playerId: string }>` — devolve o id da cadeira (recuperada por nome, ou o próprio id no caminho normal); `kickPlayer({roomId,hostId,targetId})`; `setPlayerId(id: string): void` em `lib/identity.ts`.
- Consumes: `normalizeAnswer` (`@/lib/game/normalize`), `maybeAdvanceFromFill`, `maybeTally` (`./engine`); callers consomem `setPlayerId`/`getPlayerId` (`@/lib/identity`).

- [ ] **Step 1: Adicionar imports no topo de `app/actions/room.ts`**

After the existing `import { createServerClient } ...` line, add:

```ts
import { normalizeAnswer } from "@/lib/game/normalize";
import { maybeAdvanceFromFill, maybeTally } from "./engine";
```

- [ ] **Step 2: Substituir `joinRoom`**

Replace the whole `joinRoom` function with:

```ts
export async function joinRoom(
  input: { code: string; playerId: string; name: string },
): Promise<{ code: string; playerId: string }> {
  const supabase = createServerClient();
  const code = input.code.toUpperCase().trim();
  const { data: room } = await supabase
    .from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room) throw new Error("Sala não encontrada");
  if (room.status === "ended") throw new Error("Esta partida já encerrou");

  // Reconexao por nome: mesmo nome normalizado + mesma sala recupera a cadeira
  // existente (mantendo total_points e, se for a do dono, o host). NAO mutamos a
  // PK nem host_id — devolvemos o id da cadeira e o CLIENTE adota esse id (setPlayerId).
  const { data: existing } = await supabase
    .from("players").select("id,name").eq("room_id", room.id);
  const target = (existing ?? []).find(
    (p) => normalizeAnswer(p.name) === normalizeAnswer(input.name),
  );

  if (target && target.id !== input.playerId) {
    await supabase.from("players").update({ connected: true }).eq("id", target.id);
    return { code, playerId: target.id };
  }

  const { error } = await supabase
    .from("players")
    .upsert(
      { id: input.playerId, room_id: room.id, name: input.name, connected: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);
  return { code, playerId: input.playerId };
}
```

- [ ] **Step 3: Adicionar `kickPlayer` ao final do arquivo**

```ts
// Dono expulsa um jogador. Respostas/votos caem por ON DELETE CASCADE.
// Re-checa a fase: a saida do expulso pode destravar preencher/votar.
export async function kickPlayer(input: { roomId: string; hostId: string; targetId: string }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from("rooms").select("host_id,current_round_id").eq("id", input.roomId).maybeSingle();
  if (!room || room.host_id !== input.hostId) throw new Error("Só o dono da sala pode fazer isso");
  if (input.targetId === input.hostId) throw new Error("O dono não pode se expulsar");

  const { error } = await supabase.from("players")
    .delete().eq("id", input.targetId).eq("room_id", input.roomId);
  if (error) throw new Error(error.message);

  if (room.current_round_id) {
    await maybeAdvanceFromFill(supabase, room.current_round_id, false);
    await maybeTally(supabase, room.current_round_id);
  }
}
```

- [ ] **Step 4: Adicionar `setPlayerId` em `lib/identity.ts`**

Append to `lib/identity.ts` (mesma chave `KEY = "mpc:player-id"`):

```ts
export function setPlayerId(id: string): void {
  localStorage.setItem(KEY, id);
}
```

- [ ] **Step 5: Teste de `setPlayerId`**

In `__tests__/identity.test.ts`, update the import and add a test:

```ts
import { getPlayerId, setPlayerId } from "@/lib/identity";
```

```ts
it("setPlayerId sobrescreve o id persistido (adotar cadeira recuperada)", () => {
  setPlayerId("seat-abc-123");
  expect(getPlayerId()).toBe("seat-abc-123");
});
```

Run: `npx vitest run __tests__/identity.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 6: Caller — `app/page.tsx` adota o id retornado**

In `app/page.tsx`, change the identity import:

```tsx
import { getPlayerId, setPlayerId } from "@/lib/identity";
```

Replace `handleJoin` with:

```tsx
  async function handleJoin() {
    if (!name.trim()) return setError("Digite seu nome");
    if (code.trim().length !== 4) return setError("Código tem 4 letras");
    setBusy(true); setError("");
    try {
      const res = await joinRoom({ code, playerId: getPlayerId(), name: name.trim() });
      if (res.playerId !== getPlayerId()) setPlayerId(res.playerId); // adota a cadeira recuperada
      router.push(`/sala/${res.code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
```

- [ ] **Step 7: Verificar typecheck + testes**

Run: `npx tsc --noEmit` → sem erros em `app/actions/room.ts`, `lib/identity.ts`, `app/page.tsx`.
Run: `npx vitest run __tests__/identity.test.ts` → PASS.

- [ ] **Step 8: Commit**

```bash
git add app/actions/room.ts lib/identity.ts __tests__/identity.test.ts app/page.tsx
git commit -m "feat(room): reclaim-by-name devolve id da cadeira; cliente adota via setPlayerId; kickPlayer"
```

---

## Task 10: `Rules.tsx` (tela de regras)

**Files:**
- Create: `components/screens/Rules.tsx`

**Interfaces:**
- Produces: `Rules({ round, meId, isHost })` — `round: RoundRow`, `meId: string`, `isHost: boolean`.
- Consumes: `dismissRules` (`@/app/actions/game`).

- [ ] **Step 1: Criar o componente**

Create `components/screens/Rules.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { dismissRules } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

export function Rules({ round, meId, isHost }: { round: RoundRow; meId: string; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <h1 className="font-display text-center text-3xl font-black">Como joga 🔥</h1>
      <Card className="flex flex-col gap-3 font-semibold">
        <p>🎯 Sai um <b>tema</b> e uma <b>letra</b>. Responda algo do tema começando com a letra.</p>
        <p>⏱️ Você tem <b>1 minuto</b>. Não dá pra repetir palavra que já foi usada.</p>
        <p>🗳️ Depois todo mundo vota no <b>mais pica</b> e no <b>pior</b> (não dá pra votar em você).</p>
        <p>🏆 Pontos: <b>+10</b> pro melhor, <b>+2</b> pra quem respondeu, <b>0</b> pro pior e <b>−1</b> pra quem não respondeu.</p>
        <p>⚖️ Empatou? Rola <b>desempate</b>.</p>
      </Card>
      {isHost ? (
        <Button disabled={busy} onClick={async () => { setBusy(true); await dismissRules({ roundId: round.id, playerId: meId }); }}>
          Bora! 🔥
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros em `Rules.tsx` (ainda não é usado no orchestrator — isso vem na Task 16).

- [ ] **Step 3: Commit**

```bash
git add components/screens/Rules.tsx
git commit -m "feat(ui): tela de regras antes da primeira rodada"
```

---

## Task 11: `Countdown.tsx` (contagem 3-2-1 sincronizada)

**Files:**
- Create: `components/screens/Countdown.tsx`

**Interfaces:**
- Produces: `Countdown({ round })` — `round: RoundRow`.
- Consumes: `beginRound` (`@/app/actions/game`).

A tela mostra "Preparando…" e o número grande, **sem** o tema (que é null nesta fase). Ao chegar a 0, dispara `beginRound` (idempotente; todos os clientes podem chamar).

- [ ] **Step 1: Criar o componente**

Create `components/screens/Countdown.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { beginRound } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

export function Countdown({ round }: { round: RoundRow }) {
  const [left, setLeft] = useState(3);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const end = round.starts_at ? new Date(round.starts_at).getTime() : Date.now();
    const tick = () => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !fired) {
        setFired(true);
        beginRound({ roundId: round.id }); // idempotente
      }
    };
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [round.id, round.starts_at, fired]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xl font-black opacity-70">Preparando…</p>
      <p className="font-display text-[8rem] font-black leading-none text-party-red">{left > 0 ? left : "🔥"}</p>
    </main>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros em `Countdown.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/screens/Countdown.tsx
git commit -m "feat(ui): contagem 3-2-1 sincronizada sem revelar o tema"
```

---

## Task 12: `ManagePlayers.tsx` e `VotersList.tsx`

**Files:**
- Create: `components/ui/ManagePlayers.tsx`
- Create: `components/ui/VotersList.tsx`

**Interfaces:**
- `ManagePlayers({ roomId, players, meId, hostId })` — consome `kickPlayer` (`@/app/actions/room`).
- `VotersList({ players, votes, isTiebreak })` — puro de apresentação; usa o caractere `"✓"`.

- [ ] **Step 1: Criar `ManagePlayers.tsx`**

Create `components/ui/ManagePlayers.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
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
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border-3 border-ink bg-white px-3 py-2 text-sm font-bold shadow-chunkySm"
      >
        Jogadores
      </button>
      {open && (
        <Card className="flex flex-col gap-2">
          <p className="font-extrabold">Gerenciar jogadores</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
              <span>{p.name}{p.id === hostId && " 👑"}</span>
              {p.id !== hostId && (
                <button
                  disabled={busy}
                  aria-label={`Expulsar ${p.name}`}
                  className="rounded-lg border-3 border-ink bg-party-red px-3 py-1 font-black text-white disabled:opacity-50"
                  onClick={async () => { setBusy(true); await kickPlayer({ roomId, hostId: meId, targetId: p.id }); setBusy(false); }}
                >
                  ×
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

- [ ] **Step 2: Criar `VotersList.tsx`**

Create `components/ui/VotersList.tsx`:

```tsx
"use client";
import { Card } from "@/components/ui/Card";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

export function VotersList({ players, votes, isTiebreak }: {
  players: PlayerRow[]; votes: VoteRow[]; isTiebreak: boolean;
}) {
  const voted = new Set(votes.filter((v) => v.is_tiebreak === isTiebreak).map((v) => v.voter_id));
  return (
    <Card className="flex flex-col gap-2">
      <p className="font-extrabold">Quem já votou ({voted.size}/{players.length})</p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
          <span>{p.name}</span>
          <span className="w-6 text-center text-xl font-black text-party-teal">{voted.has(p.id) ? "✓" : ""}</span>
        </div>
      ))}
    </Card>
  );
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros nos dois arquivos.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ManagePlayers.tsx components/ui/VotersList.tsx
git commit -m "feat(ui): ManagePlayers (expulsar) e VotersList (check com ✓)"
```

---

## Task 13: `Vote.tsx` — rótulo best/worst, dica fuzzy, marcar repetida, votantes

**Files:**
- Modify: `components/screens/Vote.tsx`

**Interfaces:**
- Props novas: `isHost: boolean`, `roomId: string`.
- Consome: `possibleDuplicates` (`@/lib/game/similarity`), `voidAnswer` (`@/app/actions/game`), `VotersList`, `castVote`.
- No desempate (best **ou** worst), a escolha única vai no campo `bestId`; `worstId=null`.

- [ ] **Step 1: Substituir `components/screens/Vote.tsx`**

Replace the entire file with:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VotersList } from "@/components/ui/VotersList";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { castVote, voidAnswer } from "@/app/actions/game";
import { possibleDuplicates } from "@/lib/game/similarity";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Vote({ round, players, answers, votes, meId, isHost, roomId }: {
  round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[];
  meId: string; isHost: boolean; roomId: string;
}) {
  const tiebreak = round.phase === "desempate";
  const kind = round.tiebreak_kind; // 'best' | 'worst' | null
  const myVote = votes.find((v) => v.voter_id === meId && v.is_tiebreak === tiebreak);
  const [best, setBest] = useState<string | null>(myVote?.best_id ?? null);
  const [worst, setWorst] = useState<string | null>(myVote?.worst_id ?? null);
  const [sent, setSent] = useState(!!myVote);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const joinIndex = colorIndexByJoin(players);

  // candidatos: respostas nao-vazias e nao anuladas; no desempate, so os empatados
  const live = answers.filter((a) => a.text.trim() !== "" && !a.voided);
  const candidates = tiebreak ? live.filter((a) => round.tiebreak_candidates.includes(a.player_id)) : live;

  const dupFlags = possibleDuplicates(candidates.map((a) => ({ playerId: a.player_id, text: a.text })));

  const canSend = tiebreak ? !!best : !!best && !!worst;
  const header = tiebreak
    ? (kind === "worst" ? "💩 DESEMPATE — vote no PIOR" : "🔥 DESEMPATE — vote no MELHOR")
    : "Vote no mais pica e no pior";
  const pickLabel = tiebreak && kind === "worst" ? "Pior 💩" : "Mais pica 🔥";
  const pickColor = tiebreak && kind === "worst" ? "bg-party-red text-white" : "bg-party-teal text-white";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      <Card className="text-center !py-2">
        <p className="font-black">{header}</p>
        <p className="text-sm opacity-70">{round.theme} · letra {round.letter}</p>
      </Card>

      {candidates.map((a) => {
        const self = a.player_id === meId;
        const flagged = dupFlags.has(a.player_id);
        return (
          <Card key={a.player_id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BlockAvatar seed={a.player_id} size={32} colorIndex={joinIndex.get(a.player_id)} />
              <span className="font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
              {flagged && <span className="ml-auto text-xs font-bold text-party-red">parece repetida?</span>}
            </div>
            <p className="rounded-lg bg-party-yellow/40 px-3 py-2 font-bold">{a.text}</p>

            {isHost && !tiebreak && !self && (
              <button
                className="self-start rounded-lg border-3 border-ink bg-white px-2 py-1 text-xs font-bold"
                onClick={() => voidAnswer({ roundId: round.id, hostId: meId, targetId: a.player_id })}
              >
                marcar repetida
              </button>
            )}

            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? pickColor : "bg-white")}
                  onClick={() => setBest(a.player_id)}>{pickLabel}</button>
                {!tiebreak && (
                  <button disabled={self}
                    className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (worst === a.player_id ? "bg-party-red text-white" : "bg-white")}
                    onClick={() => setWorst(a.player_id)}>Pior 💩</button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {!sent ? (
        <Button disabled={!canSend}
          onClick={async () => { setSent(true); await castVote({ roundId: round.id, voterId: meId, bestId: best, worstId: tiebreak ? null : worst }); }}>
          Confirmar voto
        </Button>
      ) : (
        <VotersList players={players} votes={votes} isTiebreak={tiebreak} />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: erro apenas no `page.tsx` (ainda não passa `isHost`/`roomId` ao `Vote`) — resolvido na Task 16.

- [ ] **Step 3: Commit**

```bash
git add components/screens/Vote.tsx
git commit -m "feat(ui): Vote com desempate best/worst, dica fuzzy, marcar repetida e lista de votantes"
```

---

## Task 14: `Ranking.tsx` — ordem antiga→nova + "+X"

**Files:**
- Modify: `components/screens/Ranking.tsx`

**Interfaces:**
- Prop nova opcional: `deltas?: Record<string, number>`.
- Renderiza primeiro na ordem **antiga** (`total − delta`) e, após um tick, nos totais novos → o FLIP existente anima a troca de posição. Mostra `+X` ao lado.

- [ ] **Step 1: Substituir `components/screens/Ranking.tsx`**

Replace the entire file with:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import type { PlayerRow } from "@/lib/supabase/database.types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Ranking({ players, deltas }: { players: PlayerRow[]; deltas?: Record<string, number> }) {
  // comeca na ordem ANTIGA (total - delta), depois troca pros totais novos → anima FLIP
  const [useNew, setUseNew] = useState(!deltas);
  useEffect(() => {
    if (!deltas) return;
    const t = setTimeout(() => setUseNew(true), 400);
    return () => clearTimeout(t);
  }, [deltas]);

  const deltaOf = (id: string) => deltas?.[id] ?? 0;
  const scoreOf = (p: PlayerRow) => (useNew ? p.total_points : p.total_points - deltaOf(p.id));
  const ordered = [...players].sort((a, b) => scoreOf(b) - scoreOf(a));

  const joinIndex = colorIndexByJoin(players);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    ordered.forEach((p) => {
      const el = refs.current.get(p.id);
      if (!el) return;
      const newTop = el.offsetTop;
      const oldTop = prevTops.current.get(p.id);
      prevTops.current.set(p.id, newTop);
      if (oldTop == null || oldTop === newTop) return;

      const delta = oldTop - newTop;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px) scale(1.06)`;
      el.style.boxShadow = "10px 14px 0 rgba(26,26,46,.35)";
      el.style.zIndex = "50";
      requestAnimationFrame(() => {
        el.style.transition = "transform 1.3s cubic-bezier(.34,1.25,.5,1), box-shadow .4s ease";
        el.style.transform = "translateY(0) scale(1.06)";
        setTimeout(() => {
          el.style.transition = "transform .4s ease, box-shadow .4s ease";
          el.style.transform = "translateY(0) scale(1)";
          el.style.boxShadow = "4px 4px 0 #1a1a2e";
          el.style.zIndex = "1";
        }, 1350);
      });
    });
  }, [ordered]);

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((p, i) => {
        const d = deltaOf(p.id);
        return (
          <div key={p.id}
            ref={(el) => { if (el) refs.current.set(p.id, el); }}
            className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-white px-4 py-3 shadow-chunky">
            <span className="font-display w-8 text-center text-xl font-black">{MEDALS[i] ?? `${i + 1}º`}</span>
            <BlockAvatar seed={p.id} size={40} colorIndex={joinIndex.get(p.id)} />
            <span className="flex-1 font-extrabold">{p.name}</span>
            {deltas && (
              <span className={"font-display text-sm font-black " + (d > 0 ? "text-party-teal" : d < 0 ? "text-party-red" : "opacity-40")}>
                {d > 0 ? `+${d}` : d}
              </span>
            )}
            <span className="font-display text-xl font-black">{p.total_points}</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: `Podium.tsx` continua usando `<Ranking>`? Não — `Ranking` só é usado por `Result.tsx`. Sem erro novo aqui (`deltas` é opcional).

- [ ] **Step 3: Commit**

```bash
git add components/screens/Ranking.tsx
git commit -m "feat(ui): ranking anima ordem antiga→nova e mostra o delta da rodada"
```

---

## Task 15: `Result.tsx` — destaques mais-pica/pior com votos + deltas

**Files:**
- Modify: `components/screens/Result.tsx`

**Interfaces:**
- Usa `round.best_winner` / `round.worst_loser` para a identidade final, e conta votos principais (`is_tiebreak=false`) de cada um. Passa `round.round_scores` como `deltas` ao `Ranking`.

- [ ] **Step 1: Substituir `components/screens/Result.tsx`**

Replace the entire file with:

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Ranking } from "./Ranking";
import { nextRound, endGame } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Result({ room, round, players, answers, votes, meId, isHost }: {
  room: { id: string }; round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string; isHost: boolean;
}) {
  const [showRanking, setShowRanking] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowRanking(true), 2600); return () => clearTimeout(t); }, []);

  const mainVotes = votes.filter((v) => !v.is_tiebreak);
  const countFor = (id: string | null, field: "best_id" | "worst_id") =>
    id ? mainVotes.filter((v) => v[field] === id).length : 0;

  const bestId = round.best_winner;
  const worstId = round.worst_loser;
  const nameOf = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";
  const textOf = (id: string | null) => answers.find((a) => a.player_id === id)?.text ?? "—";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {!showRanking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Confetti />
          <div>
            <p className="text-lg font-bold opacity-70">O mais pica 🔥</p>
            <p className="font-display text-3xl font-black">{nameOf(bestId)}</p>
            <Card className="!bg-party-teal mt-1 text-white">{textOf(bestId)} <span className="opacity-80">({countFor(bestId, "best_id")} votos)</span></Card>
          </div>
          <div>
            <p className="text-lg font-bold opacity-70">O pior 💩</p>
            <p className="font-display text-2xl font-black">{nameOf(worstId)}</p>
            <Card className="!bg-party-red mt-1 text-white">{textOf(worstId)} <span className="opacity-80">({countFor(worstId, "worst_id")} votos)</span></Card>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-black">Ranking 🏆</h2>
          <Ranking players={players} deltas={round.round_scores} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button onClick={() => nextRound({ roomId: room.id, playerId: meId })}>Próxima rodada ▶</Button>
              <Button className="!bg-ink" onClick={() => endGame({ roomId: room.id, playerId: meId })}>Encerrar partida</Button>
            </div>
          ) : (
            <p className="text-center font-bold opacity-70">Aguardando o dono…</p>
          )}
        </>
      )}
    </main>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} style={{
          position: "absolute", left: `${Math.random() * 100}%`, top: "-10%",
          fontSize: 18 + Math.random() * 14,
          animation: `fall ${1.5 + Math.random() * 1.5}s linear ${Math.random()}s forwards`,
        }}>{["🎉", "✨", "🔥", "⭐"][i % 4]}</span>
      ))}
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(360deg);opacity:.2}}`}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros em `Result.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/screens/Result.tsx
git commit -m "feat(ui): Result com destaques mais-pica/pior (com votos) e deltas no ranking"
```

---

## Task 16: `Fill.tsx` + `Lobby.tsx` (ManagePlayers)

**Files:**
- Modify: `components/screens/Fill.tsx`
- Modify: `components/screens/Lobby.tsx`

- [ ] **Step 1: Adicionar `roomId` e o botão "Jogadores" no `Fill`**

In `components/screens/Fill.tsx`, change the import block to include `ManagePlayers`:

```tsx
import { ManagePlayers } from "@/components/ui/ManagePlayers";
```

Change the signature to receive `room` (para `roomId` e `host_id`). Replace the function signature line:

```tsx
export function Fill({ round, room, players, answers, meId, isHost }: {
  round: RoundRow; room: RoomRow; players: PlayerRow[]; answers: AnswerRow[]; meId: string; isHost: boolean;
}) {
```

Update the import of types to include `RoomRow`:

```tsx
import type { AnswerRow, PlayerRow, RoundRow, RoomRow } from "@/lib/supabase/database.types";
```

Guard against `round.theme` being nullable (é não-nulo em "preencher", mas o tipo é `string | null`): replace the two `{round.theme}` usages with `{round.theme ?? ""}` and `{round.letter ?? ""}`, and the placeholder string with:

```tsx
placeholder={`Algo de "${round.theme ?? ""}" com ${round.letter ?? ""}…`}
```

Add the ManagePlayers control just after the opening `<main ...>`:

```tsx
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={room.host_id} />
        </div>
      )}
```

- [ ] **Step 2: Adicionar `ManagePlayers` ao `Lobby`**

In `components/screens/Lobby.tsx`, add the import:

```tsx
import { ManagePlayers } from "@/components/ui/ManagePlayers";
```

Inside the host branch (`isHost ? (...)`), add `ManagePlayers` above the "Começar" button:

```tsx
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={room.host_id} />
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: erro apenas em `page.tsx` (ainda não passa `room` ao `Fill`) — resolvido na Task 17.

- [ ] **Step 4: Commit**

```bash
git add components/screens/Fill.tsx components/screens/Lobby.tsx
git commit -m "feat(ui): botao Jogadores (expulsar) no Lobby e no Fill; Fill lida com tema nullable"
```

---

## Task 17: Orchestrator `page.tsx` — regras/contagem, card de entrar, key do Vote

**Files:**
- Modify: `app/sala/[code]/page.tsx`

**Interfaces:**
- Novos ramos de fase: `regras` → `Rules`, `contagem` → `Countdown`.
- Card "Entrar nesta sala" (um input de nome chamando `joinRoom`) quando `meId` não está em `players` e a sala não encerrou.
- `Vote` recebe `isHost` e `roomId`; a `key` inclui `tiebreak_kind` para remontar ao trocar best↔worst. `Fill` recebe `room`.

- [ ] **Step 1: Substituir `app/sala/[code]/page.tsx`**

Replace the entire file with:

```tsx
"use client";
import { use, useEffect, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId, setPlayerId } from "@/lib/identity";
import { joinRoom } from "@/app/actions/room";
import { Lobby } from "@/components/screens/Lobby";
import { Rules } from "@/components/screens/Rules";
import { Countdown } from "@/components/screens/Countdown";
import { Fill } from "@/components/screens/Fill";
import { Vote } from "@/components/screens/Vote";
import { Result } from "@/components/screens/Result";
import { Podium } from "@/components/screens/Podium";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SalaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const upper = code.toUpperCase();
  const [meId, setMeId] = useState("");
  useEffect(() => setMeId(getPlayerId()), []);
  const { room, players, round, answers, votes, loading } = useRoom(upper);

  if (loading || !meId) return <Center>Carregando…</Center>;
  if (!room) return <Center>Sala não encontrada 😢</Center>;

  const isHost = room.host_id === meId;
  if (room.status === "ended") return <Podium players={players} />;

  // caiu / foi expulso / perdeu o localStorage: oferece reentrar pelo nome
  const inRoom = players.some((p) => p.id === meId);
  if (!inRoom) return <JoinSeat code={upper} meId={meId} onJoined={setMeId} />;

  if (room.status === "lobby" || !round) return <Lobby room={room} players={players} meId={meId} />;

  switch (round.phase) {
    case "regras": return <Rules round={round} meId={meId} isHost={isHost} />;
    case "contagem": return <Countdown round={round} />;
    case "preencher": return <Fill round={round} room={room} players={players} answers={answers} meId={meId} isHost={isHost} />;
    case "votar":
    case "desempate":
      // key inclui a fase e o tipo de desempate: remonta o Vote ao trocar best↔worst
      return <Vote key={`${round.id}:${round.phase}:${round.tiebreak_kind ?? ""}`}
        round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} roomId={room.id} />;
    case "resultado": return <Result room={room} round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} />;
    default: return <Center>…</Center>;
  }
}

function JoinSeat({ code, meId, onJoined }: { code: string; meId: string; onJoined: (id: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-5">
      <Card className="flex w-full flex-col gap-3 text-center">
        <p className="font-display text-2xl font-black">Entrar nesta sala</p>
        <p className="text-sm font-semibold opacity-70">Sala {code}. Use o mesmo nome pra recuperar sua pontuação.</p>
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 text-lg font-bold outline-none"
          placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)}
        />
        <Button disabled={busy || !name.trim()}
          onClick={async () => {
            setBusy(true); setErr("");
            try {
              const res = await joinRoom({ code, playerId: meId, name: name.trim() });
              // adota o id da cadeira (recuperada ou propria) e re-renderiza como esse jogador
              setPlayerId(res.playerId);
              onJoined(res.playerId);
            }
            catch (e) { setErr(e instanceof Error ? e.message : "Falha ao entrar"); setBusy(false); }
          }}>
          Entrar 🔥
        </Button>
        {err && <p className="font-bold text-party-red">{err}</p>}
      </Card>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-6 text-center text-xl font-black">{children}</main>;
}
```

- [ ] **Step 2: Verificar typecheck + build + testes**

Run: `npx tsc --noEmit` → sem erros.
Run: `npx vitest run` → todos os testes puros passam.
Run: `npx next build` → build de produção sem erros (consultar `node_modules/next/dist/docs/` se algum aviso do Next 16 aparecer).

- [ ] **Step 3: Commit**

```bash
git add app/sala/[code]/page.tsx
git commit -m "feat(sala): fases regras/contagem, card de reentrada por nome e key do Vote com tiebreak_kind"
```

---

## Verificação final (manual, na preview/deploy)

Os fluxos abaixo não têm teste automatizado (dependem de Supabase + múltiplos clientes). Rodar na preview como nos ciclos anteriores, **após o usuário aplicar a migração 0002 no Supabase**:

- [ ] Regras → "Bora!" → contagem 3-2-1 sincronizada em 2+ abas, tema só aparece ao começar.
- [ ] Rodada normal: pontuação 10/2/0; não-respondente perde 1 (e fica em 0 se já estava em 0).
- [ ] Borda <2 respostas: pula votação, único respondente leva +10.
- [ ] Desempate do melhor; desempate do pior; e encadeado best→worst (apaga votos de desempate entre eles).
- [ ] Marcar repetida: resposta some dos candidatos; autor ainda leva +2; voto que apontava pra ela é ignorado.
- [ ] Expulsar durante preencher/votar destrava a fase.
- [ ] Reconexão pelo mesmo nome recupera a cadeira e a pontuação (o cliente adota o id retornado); reconexão do dono reassume a coroa automaticamente.
- [ ] Resultado mostra mais-pica/pior com nº de votos; ranking anima da ordem antiga pra nova com "+X".
- [ ] Lista de votantes mostra "✓" (caractere, não emoji) em tempo real.

---

## Self-Review

**1. Cobertura dos 10 itens do spec (item → task):**

| # | Item | Task(s) |
| --- | --- | --- |
| 1 | Desempate do pior (sequencial, rotulado) | 7 (maybeTally), 13 (rótulo Vote) |
| 2 | Fim da rodada: mais-pica + pior com votos | 15 (Result) |
| 3 | Dono expulsa jogador | 9 (kickPlayer), 12 (ManagePlayers), 16, 17 |
| 4 | Sem resposta: −1 e não votável | 2 (roundDeltas), 7 (maybeAdvanceFromFill), 6 (finalizeRound) |
| 5 | Reconexão sem duplicar + card de reentrada | 9 (joinRoom devolve id + `setPlayerId`), 17 (JoinSeat/página inicial adotam o id) |
| 6 | Dica de repetida (fuzzy) + dono marca | 3 (possibleDuplicates), 8 (voidAnswer), 13 (Vote), 1 (coluna voided) |
| 7 | Tela de regras | 10 (Rules), 8 (startGame→regras), 17 |
| 8 | Lista de quem votou com "✓" | 12 (VotersList), 13 |
| 9 | Contagem 3-2-1 sincronizada | 4 (COUNTDOWN_SECONDS), 5 (beginRoundCore/createCountdownRound), 11 (Countdown), 8 |
| 10 | Ranking animado + pontos da rodada | 14 (Ranking), 15 (Result passa round_scores), 6/7 (grava round_scores) |

Migração e tipos (Task 1) sustentam itens 1,4,6,9,10. Todos os 10 itens têm task dona.

**2. Scan de placeholders:** nenhum passo usa "TBD/TODO/similar à Task N"; todo passo que altera código traz o código completo; comandos têm saída esperada. As verificações das tasks de servidor são declaradas como typecheck/build + manual na preview (não há como rodar testes de integração aqui — honestidade sobre o que foi verificado).

**3. Consistência de tipos entre tasks:**
- `RoundRow` (Task 1) usa `theme/letter: string | null`, `tiebreak_kind: 'best'|'worst'|null`, `best_winner/worst_loser: string|null`, `round_scores: Record<string,number>`, `starts_at: string|null` — consumidos coerentemente em 5,6,7,11,13,14,15,17.
- `roundDeltas` (Task 2): assinatura `{playerIds, answeredIds, bestId, worstId, currentTotals}` idêntica em `finalizeRound` (Task 6).
- `possibleDuplicates(answers: {playerId,text}[]): Set<string>` (Task 3) chamado com esse shape em Vote (Task 13).
- `maybeAdvanceFromFill(sb, roundId, timeUp)` e `maybeTally(sb, roundId)` (Task 7) chamados com essa assinatura em game.ts (Task 8) e room.ts (Task 9).
- `Vote` passa a exigir `isHost` e `roomId`; o orchestrator (Task 17) fornece ambos. `Fill` passa a exigir `room`; fornecido na Task 17.
- `castVote` mantém assinatura `{roundId,voterId,bestId,worstId}`; `tiebreak.ts`/`tally.ts` reaproveitados sem mudança de assinatura.
- `joinRoom` passa a devolver `{ code, playerId }` (antes só `{ code }`); consumido em `app/page.tsx` (Task 9) e no `JoinSeat` do orchestrator (Task 17), ambos adotando o id via `setPlayerId`. `setPlayerId(id: string): void` (Task 9) usado nos dois callers.

**4. Review Focus coberto:** (1) dono cai → mitigado pela adoção do id da cadeira do dono na reconexão (Task 9) + limitação documentada; (2) <2 candidatos → guard em Task 7 + teste de borda em Task 2; (3) corrida do beginRound → UPDATE condicional em Task 5 + guard de fase; (4) não-respondente total 0 → teste em Task 2 e delta efetivo gravado em Task 6; (5) reclaim na cadeira do dono → o cliente adota o id da cadeira via `setPlayerId` (Task 9); host reassumido automaticamente, sem mutação de PK, FK ou `host_id`, e a migração (Task 1) fica só com colunas.

**Decisão técnica a registrar (fora do spec):** o spec listava os helpers em `game.ts`/`room.ts`, mas `kickPlayer` (room.ts) precisa reaproveitar `maybeAdvanceFromFill`/`maybeTally`. Para não expor esses helpers como server actions e evitar duplicação, eles foram para `app/actions/engine.ts` (sem `"use server"`).

**Mudança de design na reconexão (aprovada pelo usuário):** em vez de o servidor mutar a PK `players.id` (que exigiria `ON UPDATE CASCADE` nos FKs), o `joinRoom` devolve o id da cadeira existente e o **cliente adota esse id** via `setPlayerId` (`lib/identity.ts`). Como `rooms.host_id` já aponta pra aquela cadeira, o cliente reassume o host automaticamente. Resultado: a migração 0002 fica só com colunas novas (sem alteração de FK) e não há mutação de `host_id` no servidor.
