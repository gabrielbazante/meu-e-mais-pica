# Contexto do projeto

## Estado atual
Jogo de festa multiplayer (Next.js + Supabase). A branch `feat/ajustes-playtest` implementa os 10 ajustes levantados no primeiro playtest. Spec: `docs/superpowers/specs/2026-10-13-ajustes-pos-playtest-design.md`. A migration `0002_ajustes_playtest.sql` precisa estar aplicada no banco. Falta o QA manual na preview e a abertura do PR para `main`.

## Fluxo da rodada
`lobby` → `regras` (só na 1ª rodada) → `contagem` (3-2-1, tema ainda nulo) → `preencher` (1 min) → `votar` → `desempate` (melhor, depois pior, se houver empate) → `resultado` → próxima rodada (`contagem`) ou fim da partida (pódio).

## Onde fica cada coisa
- `app/actions/game.ts` e `room.ts`: actions do jogo e da sala.
- `app/actions/engine.ts`: orquestração (fim do preencher, apuração, pontos). Sem `"use server"`.
- `lib/game/`: regras puras e testáveis (`scoring`, `tally`, `tiebreak`, `similarity`, `phase`).
- `components/screens/`: uma tela por fase. `components/ui/`: peças reutilizáveis.
- `app/sala/[code]/page.tsx`: orquestrador das telas por fase.
- `supabase/migrations/`: SQL do banco.

## Como testar
- `npm test`: testes unitários (Vitest) das regras puras.
- `npm run build`: build de produção e checagem de tipos.
- QA manual na preview com 2+ abas (3+ jogadores para iniciar): contagem sincronizada, desempate duplo, expulsar (inclusive candidato de desempate), reconexão pelo nome (inclusive do dono), marcar repetida e ranking animado.

## Pendências para o usuário decidir
Nenhuma no momento.
