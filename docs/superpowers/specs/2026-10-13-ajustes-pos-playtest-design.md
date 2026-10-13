# Ajustes pós-playtest — Design

**Data:** 2026-10-13
**Status:** Em revisão (aguardando aprovação pra gerar o plano)
**Contexto:** Lista de ajustes levantados depois do primeiro jogo real. Mistura de
features novas e correções, várias mexendo no ciclo da rodada.

---

## Visão geral das mudanças

1. Desempate do **pior** (simétrico ao melhor, sequencial, rotulado).
2. Fim da rodada: mostrar **mais pica** e **pior** com quantos votos cada.
3. Dono **expulsa** jogador durante o jogo.
4. Quem **não preenche a tempo**: −1 ponto e não é votável (mas ainda vota).
5. **Reconexão** sem duplicar (recuperar cadeira pelo nome) + expulsar.
6. **Dica de repetida (fuzzy)**: destacar respostas parecidas; dono marca repetida.
7. **Tela de regras** antes da 1ª rodada.
8. Após confirmar voto: **lista de quem já votou** com um check (sem emoji).
9. **Contagem 3-2-1** sincronizada antes de cada rodada (tema só aparece ao começar).
10. Ranking do fim da rodada: **animação de troca de posição** + **pontos da rodada** ao lado.

---

## Ciclo da rodada (novo)

Fases de `rounds.phase` passam a ser:

```
lobby(status) → regras → contagem → preencher → votar → [desempate]* → resultado
                                        ↑                                     |
                                        └──────── (dono: próxima) → contagem ─┘
                                                                              |
                                                        (dono: encerrar) → podio(status=ended)
```

- **`regras`** (só na 1ª rodada): ao clicar "Começar", o dono cria a rodada 1 nessa
  fase. Todos veem a **tela de regras**. O dono clica "Bora!" → vai pra `contagem`.
- **`contagem`** (toda rodada): contagem **3-2-1 sincronizada** via `rounds.starts_at`.
  **O tema/letra ainda não existem** nessa fase (ficam `null`) — são sorteados só no
  fim da contagem, então ninguém consegue "espiar" o tema antes (à prova de vantagem).
  Tela mostra "Preparando…" e o 3, 2, 1 — sem nenhuma pista do tema.
- Ao fim da contagem, uma action sorteia tema+letra, define `ends_at` e muda pra
  `preencher`. Qualquer cliente dispara isso quando `starts_at` passa (idempotente;
  o dono é o garantidor, como já é no timer do preencher).
- **`resultado`**: só o **dono** clica "Próxima rodada" → cria a próxima em `contagem`.
  Todos veem a contagem juntos. O dono mantém "Encerrar partida".

> Observação sobre o "esperar todos": como a contagem é sincronizada pelo `starts_at`
> compartilhado, todos os clientes conectados começam a rodada no mesmo instante —
> ninguém larga na frente. Quem caiu/sumiu é resolvido pelo expulsar (#3).

---

## 1. Desempate do pior (simétrico + sequencial)

- Nova coluna `rounds.tiebreak_kind text` ('best' | 'worst' | null): pra quem é o
  desempate ativo. `rounds.tiebreak_candidates` (já existe) guarda os empatados do
  desempate ativo. Um desempate ativo por vez.
- Novas colunas `rounds.best_winner uuid` e `rounds.worst_loser uuid`: resultado já
  resolvido de cada lado (preenchidos conforme resolve).
- **Apuração** (`maybeTally`, fase `votar`), a partir dos votos principais:
  - `bestIds`, `worstIds` vêm de `tallyRound` (puro, já existe).
  - Se `bestIds.length > 1` → abre desempate do melhor: `phase='desempate'`,
    `tiebreak_kind='best'`, `tiebreak_candidates=bestIds`. (worst resolve depois.)
  - Senão, se `worstIds.length > 1` → abre desempate do pior direto:
    `tiebreak_kind='worst'`, `tiebreak_candidates=worstIds`, grava `best_winner`.
  - Senão → aplica pontos e vai pra `resultado`.
- **Apuração do desempate** (fase `desempate`, usa `tiebreak_kind`):
  - Votos do desempate reutilizam `votes.is_tiebreak=true` (um por vez).
  - `kind='best'`: resolve `best_winner` via `resolveTiebreak` (puro, já existe).
    Grava `best_winner`. Se o pior ainda empata (`worstIds>1`, recalculado dos votos
    principais) → **apaga os votos de desempate** e abre o desempate do pior
    (`tiebreak_kind='worst'`, candidatos=worstIds). Senão → aplica pontos → `resultado`.
  - `kind='worst'`: resolve `worst_loser` via `resolveTiebreak`. Aplica pontos → `resultado`.
- **Tela de votação** mostra o rótulo e o botão certos conforme `tiebreak_kind`:
  - best → "🔥 DESEMPATE — vote no MELHOR" (botão "Mais pica").
  - worst → "💩 DESEMPATE — vote no PIOR" (botão "Pior").
  - O orchestrator remonta o `Vote` ao trocar de desempate (key inclui `tiebreak_kind`).

## 2. Fim da rodada: mais pica + pior com votos

- Na tela de `resultado`, antes do ranking: dois destaques —
  - **Mais pica:** nome + resposta + **(n votos)**.
  - **Pior:** nome + resposta + **(n votos)**.
- Contagem vem dos votos principais (`is_tiebreak=false`). Em caso de desempate, o
  vencedor/perdedor final vem de `best_winner`/`worst_loser`; os "n votos" mostrados
  são os do voto principal.

## 3. Dono expulsa jogador

- Nova action `kickPlayer({ roomId, hostId, targetId })` — só o dono; apaga a linha
  do jogador (e suas respostas/votos caem por `on delete cascade`). O dono não pode
  se expulsar. Depois de expulsar, re-checa a fase: se a sala esperava o expulso
  (preencher/votar), re-roda `maybeAdvanceFromFill`/`maybeTally` pra destravar.
- UI: componente `ManagePlayers` (só pro dono) — lista de jogadores com um "×" ao
  lado de cada um (menos o próprio dono). Disponível no **Lobby** e nas telas de jogo
  (Fill, Vote, Result) via um botão discreto "Jogadores".

## 4. Sem resposta a tempo: −1 e não votável

- `maybeAdvanceFromFill`: **para de inserir respostas em branco**. Quem não enviou
  simplesmente não tem linha em `answers`.
- Candidatos da votação = quem tem resposta (não-vazia). Não-respondentes não
  aparecem como opção de voto.
- **Pontuação da rodada** (função pura nova `roundDeltas`, testável):
  - melhor = +10, pior = 0, respondeu e não é melhor/pior = +2, **não respondeu = −1**
    (piso em 0 no total — não deixa ficar negativo).
  - Não-respondentes **ainda votam** (continuam contando em `votePhaseComplete`).
- Borda: se ao fim do tempo houver **menos de 2 respostas**, pula a votação e vai
  direto pra `resultado` — o único que respondeu (se houver) leva +10; os demais −1.

## 5. Reconexão sem duplicar

- `joinRoom`: ao entrar com **mesmo nome (normalizado) + código**, se já existe um
  jogador com esse nome na sala, **assume a cadeira existente** — atualiza o `id`
  daquela linha pro id atual e `connected=true`, mantendo `total_points`. Se a cadeira
  era a do dono (`room.host_id` = id antigo), atualiza `room.host_id` pro novo id.
  Se não existe ninguém com o nome → insere normal.
  - *Trade-off aceito:* dois jogadores com exatamente o mesmo nome "brigam" pela
    cadeira. Em jogo de amigos é raro; fica documentado.
- Orchestrator (`sala/[code]/page.tsx`): se `meId` não está em `players` (caiu / foi
  expulso / perdeu o localStorage), em vez de virar "fantasma", mostra um card
  **"Entrar nesta sala"** (só o nome) que chama `joinRoom(code)` ali mesmo.

## 6. Dica de repetida (fuzzy) + dono marca

- Função pura nova `possibleDuplicates(answers)` (testável): marca pares de respostas
  "possivelmente iguais" se, após normalizar, **compartilham uma palavra de 4+ letras**
  (ex.: "Manchester United" × "Man United" compartilham "united") ou uma é substring
  da outra. É só **dica** — pode ter falso positivo (ex.: "Manchester United" ×
  "Manchester City" compartilham "manchester"); o dono decide.
- Na tela de votação, respostas sinalizadas ganham um destaque sutil ("parece repetida?").
- **Dono marca repetida:** controle só do dono que marca uma resposta como repetida de
  outra. A marcada sai dos candidatos de voto (fica a mais antiga). **Sem punição** —
  o autor da repetida leva os +2 de quem respondeu (ele respondeu, só coincidiu).
- Persistência: nova coluna `answers.voided boolean not null default false`. Marcar =
  `voided=true`. Votação ignora `voided`; a apuração trata o autor como respondente
  normal (+2), não como melhor/pior.

## 7. Tela de regras (antes da 1ª rodada)

- Fase `regras` (só rodada 1). Tela com as regras do jogo (texto curto e divertido):
  tema+letra, 1 min pra responder, não repetir palavra, votar melhor/pior sem votar em
  si, pontuação 10/0/2 e −1 pra quem não responde, empates viram desempate. O dono vê
  um botão "Bora! 🔥" que leva pra contagem. (Texto exato definido na implementação; é
  conteúdo estático.)

## 8. Lista de quem já votou (com check, sem emoji)

- Depois que o jogador confirma o voto, em vez de só "X/N votaram", mostra a **lista
  dos jogadores** com um **check** (caractere "✓", não emoji) ao lado de quem já votou
  e vazio pra quem falta. Atualiza em tempo real.

## 9. Contagem 3-2-1 sincronizada

- Coberto em "Ciclo da rodada": fase `contagem` com `starts_at`. Tela mostra
  "Preparando…" e 3, 2, 1 grandes, **sem tema no fundo**. Tema sorteado só no fim.

## 10. Ranking animado + pontos da rodada

- Guardar o delta da rodada por jogador em `rounds.round_scores jsonb`
  (`{ playerId: delta }`), gravado na apuração. É o delta **efetivamente aplicado**
  (depois do piso em 0), pra que `total − delta` reconstrua exatamente a ordem anterior.
- Na tela de `resultado`, o `Ranking` recebe os deltas e:
  - Renderiza **primeiro na ordem ANTIGA** (total − delta) e então transita pros novos
    totais → dispara a animação de **troca de posição** (o FLIP já existe no componente;
    hoje não anima porque monta direto na ordem nova, sem "antes").
  - Mostra **"+X"** (os pontos da rodada) ao lado de cada jogador.

---

## Migração SQL (rodar no Supabase)

```sql
alter table rounds alter column theme drop not null;
alter table rounds alter column letter drop not null;
alter table rounds add column starts_at timestamptz;
alter table rounds add column tiebreak_kind text;
alter table rounds add column best_winner uuid;
alter table rounds add column worst_loser uuid;
alter table rounds add column round_scores jsonb not null default '{}'::jsonb;
alter table answers add column voided boolean not null default false;
```

(Novos valores de `rounds.phase` — 'regras', 'contagem' — são texto livre, não precisam
de alteração de constraint. As tabelas já estão na publicação do Realtime.)

## Componentes / arquivos tocados

- **Pures novos (com testes):** `lib/game/scoring.ts` (`roundDeltas` com penalidade),
  `lib/game/similarity.ts` (`possibleDuplicates`). `tiebreak.ts`/`tally.ts` reaproveitados
  (sem mudança de assinatura).
- **Actions (`app/actions/`):** `game.ts` (startGame→regras, novo `startCountdown`/
  `beginRound`, `nextRound`→contagem, `maybeAdvanceFromFill` sem blanks + borda <2,
  `maybeTally` com desempate duplo + `round_scores`, `voidAnswer`), `room.ts`
  (`joinRoom` reclaim-by-name, `kickPlayer`).
- **Telas (`components/screens/`):** novo `Rules.tsx`, novo `Countdown.tsx`,
  `Fill.tsx` (texto), `Vote.tsx` (rótulo desempate best/worst, dica fuzzy, lista de
  votantes, marcar repetida), `Result.tsx` (destaques melhor/pior + deltas),
  `Ranking.tsx` (ordem antiga→nova + "+X"), `Lobby.tsx` (ManagePlayers).
- **Novos UI:** `components/ui/ManagePlayers.tsx`, `components/ui/VotersList.tsx`.
- **Orchestrator:** `app/sala/[code]/page.tsx` (fases `regras`/`contagem`, card de
  "entrar nesta sala" quando fora da sala, key do Vote inclui `tiebreak_kind`).
- **Tipos:** `lib/supabase/database.types.ts` (novas colunas), `lib/game/types.ts`
  (phases).

## Testes

- Unitários (Vitest) pros pures: `scoring.roundDeltas` (penalidade, melhor/pior,
  piso em 0, repetida=+2), `similarity.possibleDuplicates` (caso "Man United" ×
  "Manchester United"; falso positivo aceito). `tiebreak`/`tally` já cobertos.
- Fluxo (desempate duplo, contagem, expulsar, reconexão, ranking animado) verificado
  rodando na preview/deploy, como nos ciclos anteriores.

## Fora de escopo (YAGNI)

- IA pra equivalência semântica (opção C descartada).
- "Pronto" individual de cada jogador entre rodadas (ficou dono-avança).
- Penalizar o autor da resposta marcada como repetida.
- Placar-alvo / número fixo de rodadas (segue infinito até o dono encerrar).
