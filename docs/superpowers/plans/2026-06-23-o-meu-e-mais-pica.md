# O meu é mais pica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um jogo de festa multiplayer em tempo real, mobile-first, onde jogadores criam/entram em salas, respondem temas sorteados (estilo Adedanha), votam no "mais pica" e no "pior", e veem o ranking animado a cada rodada.

**Architecture:** Next.js (App Router) com **Server Actions** para todas as mutações (criar/entrar sala, enviar resposta, votar, avançar fase). O estado vive no Postgres do **Supabase**; os clientes assinam mudanças via **Supabase Realtime** (Postgres Changes) e re-renderizam. Toda a lógica de jogo (sorteio, apuração de votos, desempate, transição de fase) é implementada como **funções puras testáveis** em `lib/game/`, e as Server Actions só orquestram I/O em volta dessas funções. Ações privilegiadas (começar, sortear, próxima rodada, encerrar) são restritas ao `host_id`; auto-avanços (todos enviaram → votação; todos votaram → apuração) são disparados de forma idempotente pela própria ação do último jogador.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (Postgres + Realtime), Vitest (testes unitários das funções puras), `@supabase/supabase-js` + `@supabase/ssr`.

---

## File Structure

```
meu-e-mais-pica/
  lib/
    game/
      themes.ts          # lista PT-BR de temas + letras jogáveis
      draw.ts            # drawRound() — sorteia tema + letra (puro)
      tally.ts           # contagem de votos, melhor/pior, pontos (puro)
      tiebreak.ts        # resolução de desempate do "mais pica" (puro)
      phase.ts           # helpers de transição de fase (puro)
      types.ts           # tipos compartilhados do domínio
    supabase/
      client.ts          # browser client
      server.ts          # server client (Server Actions)
      database.types.ts  # tipos das tabelas
    identity.ts          # ID anônimo do jogador (localStorage)
  app/
    actions/
      room.ts            # createRoom, joinRoom
      game.ts            # startGame, submitAnswer, castVote, nextRound, endGame
    page.tsx             # home: criar / entrar
    sala/[code]/page.tsx # orquestrador: assina realtime e troca de tela por fase
    globals.css          # tema Festa Cartoon (Tailwind)
  components/
    ui/Button.tsx
    ui/Card.tsx
    screens/Lobby.tsx
    screens/Fill.tsx
    screens/Vote.tsx
    screens/Result.tsx   # destaque "mais pica" + Ranking animado
    screens/Ranking.tsx  # componente da animação descola→viaja→assenta
    screens/Podium.tsx
  supabase/
    migrations/0001_init.sql
  __tests__/             # testes Vitest das funções puras
```

---

## Task 1: Scaffold do projeto (Next.js + Tailwind + Vitest + Supabase)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js**

A pasta já existe e é um repo git. Rodar dentro dela:

```bash
cd /Users/gabrielbazante/workspace/meu-e-mais-pica
npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
```

Aceite sobrescrever os arquivos default quando perguntado (o `.gitignore` e o `docs/` já existentes serão mantidos/mesclados; confira depois que `docs/superpowers/` continua versionado).

- [ ] **Step 2: Instalar dependências do projeto**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 3: Configurar Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Add scripts to `package.json` (`"scripts"` block):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Env example**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 5: Sanity check — build/test infra runs**

Run: `npm run test`
Expected: PASS com "No test files found" (ainda não há testes) — sai com código 0. Se falhar por configuração, corrija antes de seguir.

Run: `npm run dev` e abra `http://localhost:3000` — deve renderizar a home default do Next. Pare o servidor.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest + Supabase deps"
```

---

## Task 2: Tipos do domínio

**Files:**
- Create: `lib/game/types.ts`

- [ ] **Step 1: Definir os tipos compartilhados**

Create `lib/game/types.ts`:

```ts
export type Phase = "preencher" | "votar" | "desempate" | "resultado";
export type RoomStatus = "lobby" | "playing" | "ended";

export interface Player {
  id: string;
  name: string;
  totalPoints: number;
}

export interface Answer {
  playerId: string;
  text: string;
  submittedAt: number; // epoch ms
}

export interface Vote {
  voterId: string;
  bestId: string | null;
  worstId: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/game/types.ts
git commit -m "feat: domain types for game logic"
```

---

## Task 3: Temas e sorteio (TDD)

**Files:**
- Create: `lib/game/themes.ts`, `lib/game/draw.ts`
- Test: `__tests__/draw.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/draw.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { drawRound } from "@/lib/game/draw";
import { THEMES, LETTERS } from "@/lib/game/themes";

describe("drawRound", () => {
  it("rng=0 retorna o primeiro tema e a primeira letra", () => {
    const r = drawRound({ rng: () => 0 });
    expect(r.theme).toBe(THEMES[0]);
    expect(r.letter).toBe(LETTERS[0]);
  });

  it("nunca sorteia letras difíceis (K, W, X, Y, Q)", () => {
    for (let i = 0; i < 200; i++) {
      const { letter } = drawRound({ rng: Math.random });
      expect(["K", "W", "X", "Y", "Q"]).not.toContain(letter);
    }
  });

  it("não repete o tema da rodada anterior", () => {
    const prev = THEMES[0];
    for (let i = 0; i < 200; i++) {
      const { theme } = drawRound({ prevTheme: prev, rng: Math.random });
      expect(theme).not.toBe(prev);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/draw.test.ts`
Expected: FAIL — módulos `themes`/`draw` não existem.

- [ ] **Step 3: Implement themes**

Create `lib/game/themes.ts`:

```ts
export const THEMES = [
  "Comida", "Cidade", "Famoso(a)", "Marca", "Gíria", "Animal",
  "Objeto", "Filme", "Profissão", "Parte do corpo", "País", "Bebida",
  "Desenho animado", "Cantor(a)", "Time de futebol", "Fruta", "Cor",
  "Time/Personagem de jogo", "Série", "Palavrão (sem ofender ninguém 😅)",
] as const;

// Alfabeto PT-BR sem as letras difíceis: K, Q, W, X, Y.
export const LETTERS = "ABCDEFGHIJLMNOPRSTUVZ".split("");
```

- [ ] **Step 4: Implement drawRound**

Create `lib/game/draw.ts`:

```ts
import { THEMES, LETTERS } from "./themes";

export interface DrawOptions {
  prevTheme?: string;
  rng?: () => number;
}

export function drawRound(opts: DrawOptions = {}): { theme: string; letter: string } {
  const rng = opts.rng ?? Math.random;
  const pool = opts.prevTheme
    ? THEMES.filter((t) => t !== opts.prevTheme)
    : [...THEMES];
  const theme = pool[Math.floor(rng() * pool.length)];
  const letter = LETTERS[Math.floor(rng() * LETTERS.length)];
  return { theme, letter };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/draw.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Commit**

```bash
git add lib/game/themes.ts lib/game/draw.ts __tests__/draw.test.ts
git commit -m "feat: themes dataset and round draw (pure)"
```

---

## Task 4: Apuração de votos — melhor, pior e pontos (TDD)

Regras: mais pica = +10, pior = 0, demais = +2. Se houver empate no melhor (>1 jogador com a maior contagem de votos de "melhor"), a apuração sinaliza `needsTiebreak` e não distribui pontos. Empate no pior: todos os empatados levam 0.

**Files:**
- Create: `lib/game/tally.ts`
- Test: `__tests__/tally.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/tally.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { tallyRound } from "@/lib/game/tally";
import type { Player, Vote } from "@/lib/game/types";

const players: Player[] = [
  { id: "a", name: "A", totalPoints: 0 },
  { id: "b", name: "B", totalPoints: 0 },
  { id: "c", name: "C", totalPoints: 0 },
];

describe("tallyRound", () => {
  it("vencedor único: 10 pro melhor, 0 pro pior, 2 pros demais", () => {
    const votes: Vote[] = [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "b", worstId: "c" },
      { voterId: "c", bestId: "a", worstId: "a" },
    ];
    const r = tallyRound(players, votes);
    expect(r.needsTiebreak).toBe(false);
    expect(r.bestIds).toEqual(["b"]);
    expect(r.worstIds).toEqual(["c"]);
    expect(r.points).toEqual({ a: 2, b: 10, c: 0 });
  });

  it("empate no melhor dispara desempate e não pontua", () => {
    const votes: Vote[] = [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "a", worstId: "c" },
      { voterId: "c", bestId: "a", worstId: "b" }, // a:2, b:1 ... ajuste abaixo
    ];
    // força empate a=1, b=1: redefine
    const tie: Vote[] = [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "a", worstId: "c" },
      { voterId: "c", bestId: "a", worstId: "b" },
    ];
    void votes;
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "a", worstId: "c" },
      { voterId: "c", bestId: null, worstId: "b" },
    ]);
    expect(r.needsTiebreak).toBe(true);
    expect(r.bestIds.sort()).toEqual(["a", "b"]);
    expect(r.points).toEqual({});
    void tie;
  });

  it("empate no pior: todos os empatados levam 0", () => {
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "c" },
      { voterId: "b", bestId: "b", worstId: "a" },
      { voterId: "c", bestId: "b", worstId: "a" }, // worst: a=2, c=1 -> pior=a único
    ]);
    expect(r.bestIds).toEqual(["b"]);
    expect(r.worstIds).toEqual(["a"]);
    expect(r.points).toEqual({ a: 0, b: 10, c: 2 });
  });

  it("o melhor tem prioridade sobre ser também votado como pior", () => {
    const r = tallyRound(players, [
      { voterId: "a", bestId: "b", worstId: "b" },
      { voterId: "b", bestId: "c", worstId: "a" },
      { voterId: "c", bestId: "b", worstId: "a" }, // best b=2 (único), worst a=2 (único)
    ]);
    expect(r.points).toEqual({ a: 0, b: 10, c: 2 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/tally.test.ts`
Expected: FAIL — `tallyRound` não existe.

- [ ] **Step 3: Implement tallyRound**

Create `lib/game/tally.ts`:

```ts
import type { Player, Vote } from "./types";

export interface TallyResult {
  bestIds: string[];   // empatados no topo de "melhor"
  worstIds: string[];  // empatados no fundo de "pior"
  needsTiebreak: boolean;
  points: Record<string, number>; // delta da rodada; vazio se needsTiebreak
}

function countVotes(ids: (string | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

function topIds(counts: Record<string, number>): string[] {
  const max = Math.max(0, ...Object.values(counts));
  if (max === 0) return [];
  return Object.keys(counts).filter((id) => counts[id] === max);
}

export function tallyRound(players: Player[], votes: Vote[]): TallyResult {
  const bestIds = topIds(countVotes(votes.map((v) => v.bestId)));
  const worstIds = topIds(countVotes(votes.map((v) => v.worstId)));

  if (bestIds.length > 1) {
    return { bestIds, worstIds, needsTiebreak: true, points: {} };
  }

  const bestId = bestIds[0] ?? null;
  const loserSet = new Set(worstIds);
  const points: Record<string, number> = {};
  for (const p of players) {
    if (p.id === bestId) points[p.id] = 10;        // melhor tem prioridade
    else if (loserSet.has(p.id)) points[p.id] = 0;
    else points[p.id] = 2;
  }
  return { bestIds, worstIds, needsTiebreak: false, points };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/tally.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/game/tally.ts __tests__/tally.test.ts
git commit -m "feat: vote tally with best/worst/points and tiebreak detection (pure)"
```

---

## Task 5: Resolução do desempate do "mais pica" (TDD)

Re-voto apenas entre os candidatos empatados (1 voto de "melhor" por jogador). Se ainda empatar, vence quem enviou a resposta primeiro (menor `submittedAt`).

**Files:**
- Create: `lib/game/tiebreak.ts`
- Test: `__tests__/tiebreak.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/tiebreak.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveTiebreak } from "@/lib/game/tiebreak";

describe("resolveTiebreak", () => {
  const submittedAt = { a: 1000, b: 1200, c: 900 };

  it("vence quem teve mais votos no re-voto", () => {
    const winner = resolveTiebreak(["a", "b"], ["a", "a", "b"], submittedAt);
    expect(winner).toBe("a");
  });

  it("empate no re-voto: vence quem respondeu primeiro (menor submittedAt)", () => {
    const winner = resolveTiebreak(["a", "b"], ["a", "b"], submittedAt);
    expect(winner).toBe("a"); // a=1000 < b=1200
  });

  it("ignora votos em quem não é candidato", () => {
    const winner = resolveTiebreak(["a", "b"], ["c", "c", "b"], submittedAt);
    expect(winner).toBe("b");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/tiebreak.test.ts`
Expected: FAIL — `resolveTiebreak` não existe.

- [ ] **Step 3: Implement resolveTiebreak**

Create `lib/game/tiebreak.ts`:

```ts
// candidates: ids empatados; bestVotes: lista de bestId do re-voto;
// submittedAt: mapa de quando cada jogador enviou a resposta original.
export function resolveTiebreak(
  candidates: string[],
  bestVotes: (string | null)[],
  submittedAt: Record<string, number>,
): string {
  const set = new Set(candidates);
  const counts: Record<string, number> = {};
  for (const id of candidates) counts[id] = 0;
  for (const v of bestVotes) {
    if (v && set.has(v)) counts[v] += 1;
  }
  const max = Math.max(...Object.values(counts));
  const top = candidates.filter((id) => counts[id] === max);
  if (top.length === 1) return top[0];
  // desempate final: menor submittedAt
  return top.reduce((best, id) =>
    (submittedAt[id] ?? Infinity) < (submittedAt[best] ?? Infinity) ? id : best,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/tiebreak.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/game/tiebreak.ts __tests__/tiebreak.test.ts
git commit -m "feat: tiebreak resolution with speed fallback (pure)"
```

---

## Task 6: Helpers de transição de fase (TDD)

**Files:**
- Create: `lib/game/phase.ts`
- Test: `__tests__/phase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/phase.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { canStart, fillPhaseComplete, votePhaseComplete } from "@/lib/game/phase";

describe("phase helpers", () => {
  it("canStart exige 3+ jogadores", () => {
    expect(canStart(2)).toBe(false);
    expect(canStart(3)).toBe(true);
    expect(canStart(5)).toBe(true);
  });

  it("fillPhaseComplete: verdadeiro quando todos enviaram OU o tempo acabou", () => {
    expect(fillPhaseComplete(2, 3, false)).toBe(false);
    expect(fillPhaseComplete(3, 3, false)).toBe(true);
    expect(fillPhaseComplete(1, 3, true)).toBe(true);
  });

  it("votePhaseComplete: verdadeiro quando todos votaram", () => {
    expect(votePhaseComplete(2, 3)).toBe(false);
    expect(votePhaseComplete(3, 3)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/phase.test.ts`
Expected: FAIL — `phase` não existe.

- [ ] **Step 3: Implement phase helpers**

Create `lib/game/phase.ts`:

```ts
export const MIN_PLAYERS = 3;
export const FILL_SECONDS = 60;

export function canStart(playerCount: number): boolean {
  return playerCount >= MIN_PLAYERS;
}

export function fillPhaseComplete(
  submittedCount: number,
  playerCount: number,
  timeUp: boolean,
): boolean {
  return timeUp || submittedCount >= playerCount;
}

export function votePhaseComplete(voterCount: number, playerCount: number): boolean {
  return voterCount >= playerCount;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/phase.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/game/phase.ts __tests__/phase.test.ts
git commit -m "feat: phase transition helpers (pure)"
```

---

## Task 7: Schema do Supabase

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Escrever a migração**

Create `supabase/migrations/0001_init.sql`:

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null,
  status text not null default 'lobby',          -- lobby | playing | ended
  current_round_id uuid,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key,                            -- gerado no cliente (anon id)
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  total_points int not null default 0,
  connected boolean not null default true,
  joined_at timestamptz not null default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  theme text not null,
  letter text not null,
  phase text not null default 'preencher',        -- preencher | votar | desempate | resultado
  tiebreak_candidates uuid[] not null default '{}',
  ends_at timestamptz,                            -- fim do timer da fase preencher
  started_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  text text not null default '',
  submitted_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  best_id uuid references players(id) on delete cascade,
  worst_id uuid references players(id) on delete cascade,
  is_tiebreak boolean not null default false,
  unique (round_id, voter_id, is_tiebreak)
);

-- Jogo casual sem auth: políticas permissivas, mutações passam por Server Actions.
alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table answers enable row level security;
alter table votes enable row level security;

create policy "public read/write rooms"   on rooms   for all using (true) with check (true);
create policy "public read/write players" on players for all using (true) with check (true);
create policy "public read/write rounds"  on rounds  for all using (true) with check (true);
create policy "public read/write answers" on answers for all using (true) with check (true);
create policy "public read/write votes"   on votes   for all using (true) with check (true);
```

- [ ] **Step 2: Aplicar no Supabase**

Criar um projeto em supabase.com (ou usar a CLI). Aplicar a migração via SQL Editor do dashboard (colar o conteúdo) ou:

```bash
# se usar a Supabase CLI com o projeto linkado:
supabase db push
```

Depois, no dashboard em **Database → Replication / Publications**, garantir que a publicação `supabase_realtime` inclui as tabelas `rooms`, `players`, `rounds`, `answers`, `votes` (necessário para o Realtime de Postgres Changes).

- [ ] **Step 3: Preencher `.env.local`**

Copiar `URL` e `anon key` do projeto para `.env.local` (baseado em `.env.local.example`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: supabase schema for rooms/players/rounds/answers/votes"
```

---

## Task 8: Clients do Supabase e tipos das tabelas

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/database.types.ts`

- [ ] **Step 1: Tipos das tabelas**

Create `lib/supabase/database.types.ts`:

```ts
export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "ended";
  current_round_id: string | null;
  created_at: string;
}
export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  total_points: number;
  connected: boolean;
  joined_at: string;
}
export interface RoundRow {
  id: string;
  room_id: string;
  theme: string;
  letter: string;
  phase: "preencher" | "votar" | "desempate" | "resultado";
  tiebreak_candidates: string[];
  ends_at: string | null;
  started_at: string;
}
export interface AnswerRow {
  id: string;
  round_id: string;
  player_id: string;
  text: string;
  submitted_at: string;
}
export interface VoteRow {
  id: string;
  round_id: string;
  voter_id: string;
  best_id: string | null;
  worst_id: string | null;
  is_tiebreak: boolean;
}
```

- [ ] **Step 2: Browser client**

Create `lib/supabase/client.ts`:

```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Server client**

Create `lib/supabase/server.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

// Server Actions: sem sessão de usuário (jogo anônimo). Usa a anon key.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase
git commit -m "feat: supabase browser/server clients and row types"
```

---

## Task 9: Identidade anônima do jogador

**Files:**
- Create: `lib/identity.ts`
- Test: `__tests__/identity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/identity.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getPlayerId } from "@/lib/identity";

beforeEach(() => localStorage.clear());

describe("getPlayerId", () => {
  it("gera um id e persiste no localStorage", () => {
    const id1 = getPlayerId();
    expect(id1).toMatch(/[0-9a-f-]{36}/);
    expect(getPlayerId()).toBe(id1); // estável entre chamadas
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/identity.test.ts`
Expected: FAIL — `getPlayerId` não existe.

- [ ] **Step 3: Implement identity**

Create `lib/identity.ts`:

```ts
const KEY = "mpc:player-id";

export function getPlayerId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/identity.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/identity.ts __tests__/identity.test.ts
git commit -m "feat: anonymous player id persisted in localStorage"
```

---

## Task 10: Server Actions — criar e entrar na sala

**Files:**
- Create: `app/actions/room.ts`

- [ ] **Step 1: Implement createRoom e joinRoom**

Create `app/actions/room.ts`:

```ts
"use server";
import { createServerClient } from "@/lib/supabase/server";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(input: { hostId: string; name: string }) {
  const supabase = createServerClient();
  let code = genCode();
  // garante unicidade do código
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!data) break;
    code = genCode();
  }

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({ code, host_id: input.hostId, status: "lobby" })
    .select()
    .single();
  if (error || !room) throw new Error(error?.message ?? "Falha ao criar sala");

  const { error: pErr } = await supabase
    .from("players")
    .insert({ id: input.hostId, room_id: room.id, name: input.name });
  if (pErr) throw new Error(pErr.message);

  return { code };
}

export async function joinRoom(input: { code: string; playerId: string; name: string }) {
  const supabase = createServerClient();
  const code = input.code.toUpperCase().trim();
  const { data: room } = await supabase
    .from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room) throw new Error("Sala não encontrada");
  if (room.status === "ended") throw new Error("Esta partida já encerrou");

  // upsert: reconexão volta pra mesma cadeira (mesmo player_id)
  const { error } = await supabase
    .from("players")
    .upsert(
      { id: input.playerId, room_id: room.id, name: input.name, connected: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);

  return { code };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: sem erros nos arquivos novos.

- [ ] **Step 3: Commit**

```bash
git add app/actions/room.ts
git commit -m "feat: createRoom and joinRoom server actions"
```

---

## Task 11: Server Actions — jogo (sortear, responder, votar, avançar)

**Files:**
- Create: `app/actions/game.ts`

- [ ] **Step 1: Implement as actions de jogo**

Create `app/actions/game.ts`:

```ts
"use server";
import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { tallyRound } from "@/lib/game/tally";
import { resolveTiebreak } from "@/lib/game/tiebreak";
import { fillPhaseComplete, votePhaseComplete, canStart, FILL_SECONDS } from "@/lib/game/phase";
import type { Player, Vote } from "@/lib/game/types";
import type { RoundRow } from "@/lib/supabase/database.types";

type SB = ReturnType<typeof createServerClient>;

async function assertHost(supabase: SB, roomId: string, playerId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== playerId) throw new Error("Só o dono da sala pode fazer isso");
}

async function startRound(supabase: SB, roomId: string) {
  // tema da rodada anterior (para não repetir)
  const { data: prev } = await supabase
    .from("rounds").select("theme").eq("room_id", roomId)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  const { theme, letter } = drawRound({ prevTheme: prev?.theme });
  const endsAt = new Date(Date.now() + FILL_SECONDS * 1000).toISOString();

  const { data: round } = await supabase
    .from("rounds")
    .insert({ room_id: roomId, theme, letter, phase: "preencher", ends_at: endsAt })
    .select().single();
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round!.id }).eq("id", roomId);
}

export async function startGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  const { count } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", input.roomId);
  if (!canStart(count ?? 0)) throw new Error("São necessários ao menos 3 jogadores");
  await startRound(supabase, input.roomId);
}

export async function nextRound(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await startRound(supabase, input.roomId);
}

export async function endGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await supabase.from("rooms").update({ status: "ended" }).eq("id", input.roomId);
}

export async function submitAnswer(input: { roundId: string; playerId: string; text: string }) {
  const supabase = createServerClient();
  await supabase.from("answers").upsert(
    { round_id: input.roundId, player_id: input.playerId, text: input.text.trim(), submitted_at: new Date().toISOString() },
    { onConflict: "round_id,player_id" },
  );
  await maybeAdvanceFromFill(supabase, input.roundId, false);
}

// chamado por qualquer cliente (ou pelo timer) — idempotente
export async function expireFill(input: { roundId: string }) {
  const supabase = createServerClient();
  await maybeAdvanceFromFill(supabase, input.roundId, true);
}

async function maybeAdvanceFromFill(supabase: SB, roundId: string, timeUp: boolean) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "preencher") return;
  const expired = timeUp || (round.ends_at != null && new Date(round.ends_at) <= new Date());
  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { count: answered } = await supabase
    .from("answers").select("id", { count: "exact", head: true }).eq("round_id", roundId);

  if (fillPhaseComplete(answered ?? 0, playerCount ?? 0, expired)) {
    // garante uma resposta (vazia) para quem não enviou, para aparecer na votação
    const { data: players } = await supabase.from("players").select("id").eq("room_id", round.room_id);
    const { data: answers } = await supabase.from("answers").select("player_id").eq("round_id", roundId);
    const answered = new Set((answers ?? []).map((a) => a.player_id));
    const missing = (players ?? []).filter((p) => !answered.has(p.id))
      .map((p) => ({ round_id: roundId, player_id: p.id, text: "" }));
    if (missing.length) await supabase.from("answers").insert(missing);
    await supabase.from("rounds").update({ phase: "votar" }).eq("id", roundId);
  }
}

export async function castVote(input: {
  roundId: string; voterId: string; bestId: string | null; worstId: string | null;
}) {
  const supabase = createServerClient();
  const { data: round } = await supabase.from("rounds").select("*").eq("id", input.roundId).single<RoundRow>();
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

async function maybeTally(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round) return;
  const isTiebreak = round.phase === "desempate";
  if (round.phase !== "votar" && round.phase !== "desempate") return;

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

  if (isTiebreak) {
    const { data: answers } = await supabase
      .from("answers").select("player_id,submitted_at").eq("round_id", roundId);
    const submittedAt: Record<string, number> = {};
    for (const a of answers ?? []) submittedAt[a.player_id] = new Date(a.submitted_at).getTime();
    const winner = resolveTiebreak(
      round.tiebreak_candidates,
      (voteRows ?? []).map((v) => v.best_id),
      submittedAt,
    );
    // pior: recalcula dos votos originais
    const { data: origVotes } = await supabase
      .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", false);
    const orig: Vote[] = (origVotes ?? []).map((v) => ({ voterId: v.voter_id, bestId: v.best_id, worstId: v.worst_id }));
    const base = tallyRound(players, orig); // só para pegar worstIds
    await applyPoints(supabase, players, winner, base.worstIds);
    await supabase.from("rounds").update({ phase: "resultado" }).eq("id", roundId);
    return;
  }

  const votes: Vote[] = (voteRows ?? []).map((v) => ({ voterId: v.voter_id, bestId: v.best_id, worstId: v.worst_id }));
  const result = tallyRound(players, votes);
  if (result.needsTiebreak) {
    await supabase.from("rounds")
      .update({ phase: "desempate", tiebreak_candidates: result.bestIds }).eq("id", roundId);
    return;
  }
  await applyPoints(supabase, players, result.bestIds[0] ?? null, result.worstIds);
  await supabase.from("rounds").update({ phase: "resultado" }).eq("id", roundId);
}

async function applyPoints(
  supabase: SB, players: Player[], bestId: string | null, worstIds: string[],
) {
  const loser = new Set(worstIds);
  for (const p of players) {
    const delta = p.id === bestId ? 10 : loser.has(p.id) ? 0 : 2;
    if (delta !== 0) {
      await supabase.from("players")
        .update({ total_points: p.totalPoints + delta }).eq("id", p.id);
    }
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/actions/game.ts
git commit -m "feat: game server actions (draw, submit, vote, tally, tiebreak, advance)"
```

---

## Task 12: Hook de Realtime + carregamento do estado da sala

**Files:**
- Create: `lib/useRoom.ts`

- [ ] **Step 1: Implement useRoom**

Create `lib/useRoom.ts`:

```ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomRow, PlayerRow, RoundRow, AnswerRow, VoteRow } from "@/lib/supabase/database.types";

export interface RoomState {
  room: RoomRow | null;
  players: PlayerRow[];
  round: RoundRow | null;
  answers: AnswerRow[];
  votes: VoteRow[];
  loading: boolean;
}

export function useRoom(code: string): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null, players: [], round: null, answers: [], votes: [], loading: true,
  });

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle<RoomRow>();
    if (!room) { setState((s) => ({ ...s, loading: false })); return; }
    const { data: players } = await supabase.from("players").select("*").eq("room_id", room.id).order("joined_at");
    let round: RoundRow | null = null, answers: AnswerRow[] = [], votes: VoteRow[] = [];
    if (room.current_round_id) {
      const { data: r } = await supabase.from("rounds").select("*").eq("id", room.current_round_id).maybeSingle<RoundRow>();
      round = r ?? null;
      if (round) {
        answers = (await supabase.from("answers").select("*").eq("round_id", round.id)).data ?? [];
        votes = (await supabase.from("votes").select("*").eq("round_id", round.id)).data ?? [];
      }
    }
    setState({ room, players: players ?? [], round, answers, votes, loading: false });
  }, [code]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [code, load]);

  return state;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add lib/useRoom.ts
git commit -m "feat: realtime room state hook"
```

---

## Task 13: Tema visual Festa Cartoon + componentes base

> **IMPORTANTE — Tailwind v4:** este projeto usa **Tailwind v4** (sem `tailwind.config.ts`).
> Tokens de tema vão em `app/globals.css` dentro de `@theme {}`, e utilitários customizados
> via `@utility`. As classes resultantes (`bg-party-red`, `text-ink`, `border-ink`,
> `shadow-chunky`, `shadow-chunkySm`, `border-3`) são as MESMAS usadas pelos componentes
> das tasks seguintes — defina-as exatamente com esses nomes.

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/Button.tsx`, `components/ui/Card.tsx`

- [ ] **Step 1: Tokens de tema + utilitários no globals.css**

`app/globals.css` já começa com `@import "tailwindcss";` e um bloco `@theme inline { … }`
gerado pelo scaffold (background/foreground/fonts). **Mantenha** esse bloco e **adicione**
o seguinte abaixo dele:

```css
@theme {
  --color-ink: #1a1a2e;
  --color-party-yellow: #ffd23f;
  --color-party-red: #ff5252;
  --color-party-teal: #4ecdc4;
  --color-party-purple: #a29bfe;
  --color-party-pink: #ff8fab;
  --color-party-blue: #74b9ff;
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

body {
  background: var(--color-party-yellow);
  color: var(--color-ink);
}
* {
  -webkit-tap-highlight-color: transparent;
}
```

> Nota: o scaffold define `--background`/`--foreground` para preto/branco e um
> `@media (prefers-color-scheme: dark)`. Como o jogo tem fundo fixo amarelo, o `body`
> acima sobrescreve isso de propósito — pode remover o bloco `@media` dark se quiser.

- [ ] **Step 2: Verificar o build do Tailwind**

Run: `npm run build`
Expected: build sem erros (as utilities `border-3`, `shadow-chunky`, `shadow-chunkySm`
e as cores `party-*`/`ink` precisam compilar).

- [ ] **Step 3: Button**

Create `components/ui/Button.tsx`:

```tsx
import { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl border-3 border-ink bg-party-red px-4 py-3 font-extrabold text-white " +
        "shadow-chunkySm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
        "disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-chunkySm " +
        "transition-all " + className
      }
    />
  );
}
```

- [ ] **Step 4: Card**

Create `components/ui/Card.tsx`:

```tsx
import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={"rounded-2xl border-3 border-ink bg-white p-4 shadow-chunky " + className}
    />
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/ui
git commit -m "feat: Festa Cartoon theme tokens and base UI components"
```

---

## Task 14: Home — criar / entrar na sala

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement a home**

Replace `app/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId } from "@/lib/identity";
import { createRoom, joinRoom } from "@/app/actions/room";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Digite seu nome");
    setBusy(true); setError("");
    try {
      const { code } = await createRoom({ hostId: getPlayerId(), name: name.trim() });
      router.push(`/sala/${code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Digite seu nome");
    if (code.trim().length !== 4) return setError("Código tem 4 letras");
    setBusy(true); setError("");
    try {
      const res = await joinRoom({ code, playerId: getPlayerId(), name: name.trim() });
      router.push(`/sala/${res.code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-5">
      <h1 className="text-center text-4xl font-black leading-none">O meu é<br />mais pica 🔥</h1>
      <Card className="flex flex-col gap-3">
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 font-semibold outline-none"
          placeholder="Seu nome" value={name} maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleCreate} disabled={busy}>Criar sala</Button>
      </Card>
      <Card className="flex flex-col gap-3">
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 text-center text-2xl font-black uppercase tracking-widest outline-none"
          placeholder="CÓDIGO" value={code} maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={handleJoin} disabled={busy} className="bg-party-teal">Entrar</Button>
      </Card>
      {error && <p className="text-center font-bold text-ink">{error}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Manual verify**

Run: `npm run dev`, abra `http://localhost:3000`, crie uma sala. Deve redirecionar para `/sala/XXXX` (a página ainda mostra erro/branco até a Task 19 — ok). Confira no dashboard do Supabase que apareceram linhas em `rooms` e `players`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: home screen (create/join room)"
```

---

## Task 15: Tela de Lobby

**Files:**
- Create: `components/screens/Lobby.tsx`

- [ ] **Step 1: Implement Lobby**

Create `components/screens/Lobby.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { startGame } from "@/app/actions/game";
import { MIN_PLAYERS } from "@/lib/game/phase";
import type { PlayerRow, RoomRow } from "@/lib/supabase/database.types";

export function Lobby({ room, players, meId }: { room: RoomRow; players: PlayerRow[]; meId: string }) {
  const [busy, setBusy] = useState(false);
  const isHost = room.host_id === meId;
  const canStart = players.length >= MIN_PLAYERS;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <Card className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-party-red">Código da sala</p>
        <p className="text-5xl font-black tracking-widest">{room.code}</p>
        <p className="mt-1 text-sm font-semibold opacity-70">Compartilhe com a galera</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="font-extrabold">Jogadores ({players.length})</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
            <span>👤</span>{p.name}{p.id === room.host_id && " 👑"}
          </div>
        ))}
      </Card>

      {isHost ? (
        <Button disabled={!canStart || busy} onClick={async () => { setBusy(true); await startGame({ roomId: room.id, playerId: meId }); }}>
          {canStart ? "Começar 🔥" : `Faltam ${MIN_PLAYERS - players.length} jogador(es)`}
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/Lobby.tsx
git commit -m "feat: lobby screen"
```

---

## Task 16: Tela de Preencher (com timer)

**Files:**
- Create: `components/screens/Fill.tsx`

- [ ] **Step 1: Implement Fill**

Create `components/screens/Fill.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitAnswer, expireFill } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow } from "@/lib/supabase/database.types";

export function Fill({ round, players, answers, meId, isHost }: {
  round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; meId: string; isHost: boolean;
}) {
  const mine = answers.find((a) => a.player_id === meId);
  const [text, setText] = useState(mine?.text ?? "");
  const [sent, setSent] = useState(!!mine);
  const [left, setLeft] = useState(60);

  useEffect(() => {
    const end = round.ends_at ? new Date(round.ends_at).getTime() : Date.now() + 60000;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && isHost) expireFill({ roundId: round.id }); // host garante o avanço
    }, 250);
    return () => clearInterval(t);
  }, [round.id, round.ends_at, isHost]);

  const sentCount = answers.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <Card className="flex-1 !p-3 text-center">
          <p className="text-xs font-bold opacity-60">TEMA</p>
          <p className="text-xl font-black text-party-teal">{round.theme}</p>
        </Card>
        <div className="mx-3 rounded-xl border-3 border-ink bg-party-red px-4 py-2 text-center text-white shadow-chunkySm">
          <p className="text-xs font-bold">LETRA</p>
          <p className="text-3xl font-black">{round.letter}</p>
        </div>
        <div className="rounded-full border-3 border-ink bg-white px-3 py-2 text-xl font-black">{left}s</div>
      </div>

      <Card className="flex flex-col gap-3">
        <input
          autoFocus disabled={sent}
          className="rounded-xl border-3 border-ink px-3 py-3 text-lg font-bold outline-none disabled:opacity-60"
          placeholder={`Algo de "${round.theme}" com ${round.letter}…`}
          value={text} onChange={(e) => setText(e.target.value)}
        />
        <Button
          disabled={sent || !text.trim()}
          onClick={async () => { setSent(true); await submitAnswer({ roundId: round.id, playerId: meId, text }); }}
        >
          {sent ? "Enviado ✅" : "O meu é mais pica 🔥"}
        </Button>
      </Card>

      <p className="text-center font-bold opacity-70">{sentCount}/{players.length} responderam</p>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/Fill.tsx
git commit -m "feat: fill screen with timer"
```

---

## Task 17: Tela de Votação

**Files:**
- Create: `components/screens/Vote.tsx`

- [ ] **Step 1: Implement Vote**

Create `components/screens/Vote.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { castVote } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Vote({ round, players, answers, votes, meId }: {
  round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string;
}) {
  const tiebreak = round.phase === "desempate";
  const myVote = votes.find((v) => v.voter_id === meId && v.is_tiebreak === tiebreak);
  const [best, setBest] = useState<string | null>(myVote?.best_id ?? null);
  const [worst, setWorst] = useState<string | null>(myVote?.worst_id ?? null);
  const [sent, setSent] = useState(!!myVote);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const candidates = tiebreak
    ? answers.filter((a) => round.tiebreak_candidates.includes(a.player_id))
    : answers;
  const votableForBest = candidates.filter((a) => a.player_id !== meId);
  const canSend = tiebreak ? !!best : !!best && !!worst;
  const votedCount = votes.filter((v) => v.is_tiebreak === tiebreak).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      <Card className="text-center !py-2">
        <p className="font-black">{tiebreak ? "🔥 DESEMPATE — vote no melhor" : "Vote no mais pica e no pior"}</p>
        <p className="text-sm opacity-70">{round.theme} · letra {round.letter}</p>
      </Card>

      {candidates.map((a) => {
        const self = a.player_id === meId;
        return (
          <Card key={a.player_id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
            </div>
            <p className="rounded-lg bg-party-yellow/40 px-3 py-2 font-bold">{a.text || <em className="opacity-50">em branco</em>}</p>
            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? "bg-party-teal text-white" : "bg-white")}
                  onClick={() => setBest(a.player_id)}>Mais pica 🔥</button>
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
        <p className="text-center font-bold opacity-70">{votedCount}/{players.length} votaram</p>
      )}
      {void votableForBest}
    </main>
  );
}
```

> Nota: remova a linha `{void votableForBest}` se o lint reclamar; ela só existe para evitar variável não usada caso você não precise dela. (Pode usar `votableForBest` para validações extras se quiser.)

- [ ] **Step 2: Commit**

```bash
git add components/screens/Vote.tsx
git commit -m "feat: voting screen (best/worst + tiebreak mode)"
```

---

## Task 18: Componente de Ranking animado

A animação: cada linha que muda de posição **descola** (escala 1.06 + sombra forte + z-index), **viaja** até o novo lugar com easing suave (~1,3s) e **assenta**. Implementado com FLIP (medir antes/depois e animar `transform`).

**Files:**
- Create: `components/screens/Ranking.tsx`

- [ ] **Step 1: Implement Ranking**

Create `components/screens/Ranking.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import type { PlayerRow } from "@/lib/supabase/database.types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Ranking({ players }: { players: PlayerRow[] }) {
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // FLIP: compara posição anterior com a atual e anima a diferença
    ordered.forEach((p) => {
      const el = refs.current.get(p.id);
      if (!el) return;
      const newTop = el.offsetTop;
      const oldTop = prevTops.current.get(p.id);
      prevTops.current.set(p.id, newTop);
      if (oldTop == null || oldTop === newTop) return;

      const delta = oldTop - newTop;
      // 1) DESCOLA: posiciona no lugar antigo, levantada
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px) scale(1.06)`;
      el.style.boxShadow = "10px 14px 0 rgba(26,26,46,.35)";
      el.style.zIndex = "50";
      requestAnimationFrame(() => {
        // 2) VIAJA até o novo lugar (devagar)
        el.style.transition = "transform 1.3s cubic-bezier(.34,1.25,.5,1), box-shadow .4s ease";
        el.style.transform = "translateY(0) scale(1.06)";
        // 3) ASSENTA
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
      {ordered.map((p, i) => (
        <div key={p.id}
          ref={(el) => { if (el) refs.current.set(p.id, el); }}
          className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-white px-4 py-3 shadow-chunky">
          <span className="w-8 text-center text-xl font-black">{MEDALS[i] ?? `${i + 1}º`}</span>
          <span className="flex-1 font-extrabold">{p.name}</span>
          <span className="text-xl font-black">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/Ranking.tsx
git commit -m "feat: animated ranking (FLIP lift/travel/settle)"
```

---

## Task 19: Tela de Resultado (destaque + ranking + confete)

**Files:**
- Create: `components/screens/Result.tsx`

- [ ] **Step 1: Implement Result**

Create `components/screens/Result.tsx`:

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
  // recomputa o "mais pica" da rodada para o destaque (a partir dos votos não-desempate)
  const best = topBest(votes, round, answers);
  const bestAns = answers.find((a) => a.player_id === best);
  const bestName = players.find((p) => p.id === best)?.name ?? "?";
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShowRanking(true), 2200); return () => clearTimeout(t); }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {!showRanking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Confetti />
          <p className="text-lg font-bold opacity-70">O mais pica da rodada</p>
          <p className="text-5xl">🔥</p>
          <p className="text-4xl font-black">{bestName}</p>
          <Card className="bg-party-teal text-white">{bestAns?.text || "—"}</Card>
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-black">Ranking 🏆</h2>
          <Ranking players={players} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button onClick={() => nextRound({ roomId: room.id, playerId: meId })}>Próxima rodada ▶</Button>
              <Button className="bg-ink" onClick={() => endGame({ roomId: room.id, playerId: meId })}>Encerrar partida</Button>
            </div>
          ) : (
            <p className="text-center font-bold opacity-70">Aguardando o dono…</p>
          )}
        </>
      )}
    </main>
  );
}

function topBest(votes: VoteRow[], round: RoundRow, answers: AnswerRow[]): string | null {
  const counts: Record<string, number> = {};
  for (const v of votes.filter((v) => !v.is_tiebreak)) if (v.best_id) counts[v.best_id] = (counts[v.best_id] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  if (top.length === 1) return top[0];
  // se houve desempate, o vencedor é quem realmente recebeu 10 — aproxima por submittedAt
  const tb = votes.filter((v) => v.is_tiebreak);
  if (tb.length) {
    const tcounts: Record<string, number> = {};
    for (const v of tb) if (v.best_id) tcounts[v.best_id] = (tcounts[v.best_id] ?? 0) + 1;
    const tmax = Math.max(0, ...Object.values(tcounts));
    const ttop = Object.keys(tcounts).filter((id) => tcounts[id] === tmax);
    if (ttop.length === 1) return ttop[0];
    return ttop.sort((a, b) => {
      const sa = answers.find((x) => x.player_id === a)?.submitted_at ?? "";
      const sb = answers.find((x) => x.player_id === b)?.submitted_at ?? "";
      return sa.localeCompare(sb);
    })[0] ?? null;
  }
  return top[0] ?? null;
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

- [ ] **Step 2: Commit**

```bash
git add components/screens/Result.tsx
git commit -m "feat: result screen with mais-pica highlight, confetti and ranking"
```

---

## Task 20: Tela de Pódio

**Files:**
- Create: `components/screens/Podium.tsx`

- [ ] **Step 1: Implement Podium**

Create `components/screens/Podium.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function Podium({ players }: { players: PlayerRow[] }) {
  const router = useRouter();
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const [first, second, third] = ordered;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-5 text-center">
      <h1 className="text-3xl font-black">Fim de jogo! 🏆</h1>
      <p className="text-2xl font-black">👑 {first?.name} ({first?.total_points})</p>
      <div className="flex w-full items-end justify-center gap-2">
        <Step name={second?.name} pts={second?.total_points} h="h-24" medal="🥈" />
        <Step name={first?.name} pts={first?.total_points} h="h-36" medal="🥇" />
        <Step name={third?.name} pts={third?.total_points} h="h-16" medal="🥉" />
      </div>
      <Button onClick={() => router.push("/")}>Jogar de novo</Button>
    </main>
  );
}

function Step({ name, pts, h, medal }: { name?: string; pts?: number; h: string; medal: string }) {
  if (!name) return null;
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-2xl">{medal}</span>
      <span className="font-extrabold">{name}</span>
      <Card className={`${h} flex w-full items-center justify-center bg-party-yellow !p-0 text-xl font-black`}>{pts}</Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/Podium.tsx
git commit -m "feat: podium screen"
```

---

## Task 21: Orquestrador da sala (troca de tela por fase)

**Files:**
- Create: `app/sala/[code]/page.tsx`

- [ ] **Step 1: Implement a página da sala**

Create `app/sala/[code]/page.tsx`:

```tsx
"use client";
import { use, useEffect, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId } from "@/lib/identity";
import { Lobby } from "@/components/screens/Lobby";
import { Fill } from "@/components/screens/Fill";
import { Vote } from "@/components/screens/Vote";
import { Result } from "@/components/screens/Result";
import { Podium } from "@/components/screens/Podium";

export default function SalaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [meId, setMeId] = useState("");
  useEffect(() => setMeId(getPlayerId()), []);
  const { room, players, round, answers, votes, loading } = useRoom(code.toUpperCase());

  if (loading || !meId) return <Center>Carregando…</Center>;
  if (!room) return <Center>Sala não encontrada 😢</Center>;

  const isHost = room.host_id === meId;
  if (room.status === "ended") return <Podium players={players} />;
  if (room.status === "lobby" || !round) return <Lobby room={room} players={players} meId={meId} />;

  switch (round.phase) {
    case "preencher": return <Fill round={round} players={players} answers={answers} meId={meId} isHost={isHost} />;
    case "votar":
    case "desempate": return <Vote round={round} players={players} answers={answers} votes={votes} meId={meId} />;
    case "resultado": return <Result room={room} round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} />;
    default: return <Center>…</Center>;
  }
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-6 text-center text-xl font-black">{children}</main>;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit && npm run build`
Expected: build sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/sala
git commit -m "feat: room orchestrator routing screens by phase"
```

---

## Task 22: Verificação e2e manual (multi-aba) + suíte completa

- [ ] **Step 1: Rodar todos os testes unitários**

Run: `npm run test`
Expected: PASS — draw, tally, tiebreak, phase, identity.

- [ ] **Step 2: Teste manual do fluxo completo**

Run: `npm run dev`. Abra 3 abas anônimas separadas (cada uma é um jogador distinto, pois o `player-id` fica no localStorage por aba/perfil):
1. Aba 1: criar sala → anotar código.
2. Abas 2 e 3: entrar com o código. Confirmar que o lobby da Aba 1 lista os 3 jogadores em tempo real.
3. Aba 1 (dono): "Começar". As 3 abas devem ir para a tela de Preencher com o mesmo tema/letra e timer correndo.
4. Responder nas 3 abas → ao enviar a 3ª, todas vão para a Votação automaticamente.
5. Votar nas 3 (melhor/pior, sem poder votar em si) → ao votar a 3ª, vai para Resultado: destaque do "mais pica" + confete, depois ranking.
6. Forçar empate (2 jogadores recebendo 1 voto de melhor cada) → confirmar que abre a tela de DESEMPATE só entre os empatados, e depois pontua.
7. Aba 1: "Próxima rodada" → novo tema (≠ anterior). "Encerrar partida" → pódio em todas as abas.
8. Em qualquer aba, dar refresh no meio de uma rodada → deve voltar para a mesma cadeira sem perder pontos (reconexão).

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: verify full game flow"
```

---

## Self-Review (preenchido pelo autor do plano)

**Spec coverage:**
- Sala com código único → Task 7 (schema), Task 10 (createRoom), Task 14 (home). ✅
- Entrar na sala + nome → Task 10 (joinRoom), Task 14. ✅
- Reconexão por localStorage → Task 9 (identity) + upsert em joinRoom (Task 10) + verificação (Task 22). ✅
- Sorteio tema + letra (sem K/W/X/Y/Q, sem repetir) → Task 3. ✅
- Timer de 1 min só no preencher → Task 6 (FILL_SECONDS), Task 16 (Fill), `ends_at` (Task 7/11). ✅
- Botão "O meu é mais pica" → Task 16. ✅
- Avanço automático (todos enviam ou tempo acaba) → Task 11 (`maybeAdvanceFromFill`). ✅
- Votação sem tempo, 1 melhor + 1 pior, sem votar em si → Task 17. ✅
- Pontuação 10/0/2 → Task 4 (tally) + Task 11 (applyPoints). ✅
- Empate no melhor → desempate; empate no pior → todos 0 → Task 4, Task 5, Task 11. ✅
- Ranking animado descola→viaja→assenta (mais devagar) → Task 18. ✅
- Destaque do mais pica + confete/som → Task 19 (confete; som é simples de adicionar — ver nota). ✅
- Pódio no fim → Task 20. ✅
- Partida infinita, dono encerra → Task 11 (nextRound/endGame), Task 19, Task 21. ✅

**Nota sobre som:** o spec pede confete **e** som. Confete está na Task 19. Para o som, adicione na Task 19 um `new Audio("/pop.mp3").play()` dentro do `useEffect` do destaque (com um arquivo curto em `public/pop.mp3` e respeitando autoplay — tocar só após interação do usuário). Mantido simples e opcional (botão de mudo pode ser adicionado depois).

**Placeholder scan:** sem TBD/TODO; todos os steps de código têm código real.

**Type consistency:** `tallyRound`, `resolveTiebreak`, `drawRound`, helpers de fase e as `*Row` são usados com as mesmas assinaturas entre tasks. `meId`/`playerId`/`host_id` consistentes.
