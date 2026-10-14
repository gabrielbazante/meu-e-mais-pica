# Decisões do projeto

Todas as decisões abaixo são de 2026-10-13 (ajustes pós-playtest, branch `feat/ajustes-playtest`).

## Helpers de orquestração em `app/actions/engine.ts`, sem `"use server"`
- **Decisão:** a lógica de orquestração da rodada (`finalizeRound`, `maybeTally`, `maybeAdvanceFromFill`, etc.) fica em `engine.ts`, sem `"use server"`.
- **Motivo:** em arquivos `"use server"` toda função exportada vira action chamável pelo cliente.
- **Impacto:** só as actions de `game.ts` e `room.ts` ficam expostas; os helpers são chamados apenas pelo servidor.

## Reconexão adota o id da cadeira no cliente (`setPlayerId`)
- **Decisão:** ao entrar com o mesmo nome na mesma sala, o cliente adota o id do jogador existente, em vez de mudar a PK da linha.
- **Motivo:** mudar a PK exigiria migração de FKs.
- **Impacto:** sem migração de FK; pontos, respostas e votos continuam ligados à cadeira, e o dono recupera a coroa automaticamente.

## Guardas de corrida com UPDATE condicional na fase
- **Decisão:** `beginRound`, `finalizeRound` (reivindica a transição antes de aplicar pontos) e a cadeia melhor→pior usam `UPDATE ... WHERE phase = <esperada>`.
- **Motivo:** vários clientes disparam a mesma transição ao mesmo tempo; sem guarda, os pontos seriam aplicados em dobro.
- **Impacto:** só um chamador vence a transição. Os pontos são aplicados logo após a reivindicação, sem transação, então há uma pequena janela entre os dois passos.

## Expulsar primeiro limpa os votos no expulso
- **Decisão:** `kickPlayer` zera os votos (`best_id`/`worst_id`) que apontam para o expulso antes de apagá-lo.
- **Motivo:** sem isso, o `on delete cascade` apagaria os votos de quem votou nele e travaria a votação.
- **Impacto:** quem votou no expulso precisa votar de novo. `leaveRoom` ainda tem o cascade antigo.

## `expireFill` confia só no relógio do servidor
- **Decisão:** o fim do tempo de resposta é decidido por `ends_at`, não pela flag enviada pelo cliente.
- **Motivo:** um cliente poderia encerrar a fase antes da hora.
- **Impacto:** chamadas antes de `ends_at` são ignoradas.

## Contagem e fim do preencher repetem até a fase mudar
- **Decisão:** o cliente repete `beginRound` e o fim do preencher (cerca de 1 s) até a fase mudar.
- **Motivo:** diferença de relógio entre cliente e servidor pode fazer a primeira chamada chegar cedo, e a rodada ficaria parada.
- **Impacto:** algumas chamadas extras, idempotentes.

## Cadeira nova por partida (`seatIdFor`)
- **Decisão:** `createRoom` e `joinRoom` devolvem o id da cadeira; se o id do aparelho já ocupa outra sala, o servidor gera um id novo e o cliente o adota (`setPlayerId`). Linha já existente na mesma sala só atualiza nome e conexão.
- **Motivo:** `players.id` é PK global; o insert colidia em `players_pkey` ("Jogar de novo") e o upsert movia a linha antiga carregando os pontos.
- **Impacto:** a partida antiga fica intacta (pódio preservado) e cada partida começa com 0 pontos. Voltar à sala antiga cai no card "Entrar nesta sala".

## Mais pica e pior nunca são a mesma pessoa
- **Decisão:** o pior é apurado excluindo o vencedor do melhor (`worstIdsExcluding`), na apuração e no encadeamento melhor→pior; se ninguém mais recebeu voto de pior, não há pior. A tela de voto também impede a mesma resposta como melhor e pior.
- **Motivo:** o mesmo jogador podia liderar os dois e a rodada perdia sentido.
- **Impacto:** se o vencedor já decidido for expulso durante o desempate do pior, os +10 ficam sem dono.

## Desempate do pior cai em quem respondeu por último
- **Decisão:** `resolveTiebreak` recebe `prefer`; no desempate do pior, o empate persistente perde quem respondeu por último; no do melhor segue quem respondeu primeiro.
- **Motivo:** antes o mais rápido era punido no pior.
- **Impacto:** a rapidez protege dos dois lados.

## Recarga automática ao detectar versão antiga (version skew)
- **Decisão:** `lib/staleDeploy.ts` reconhece o erro "Server Action ... was not found on the server" e recarrega a página (no máximo uma vez a cada 30 s, controlado por `sessionStorage`). Os botões da home e o card "Entrar nesta sala" tratam o erro; `StaleDeployGuard` (no layout) cobre as demais actions via `unhandledrejection` e `error`.
- **Motivo:** quem está com a aba aberta de um deploy anterior chama um ID de Server Action que o build novo não conhece (confirmado nos deploys de produção dos PRs #1 e #3). Ver "Version Skew" em `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`.
- **Alternativa:** "Skew Protection" da Vercel (Settings → Advanced) mantém o deploy antigo atendendo clientes antigos; disponibilidade e custo dependem do plano. Não foi configurada.
- **Impacto:** a ação que falhou não é reenviada; o usuário precisa repeti-la após a recarga. Se o `sessionStorage` estiver indisponível, não há recarga automática e o erro aparece.

## Keep-alive do Supabase por Vercel Cron
- **Decisão:** um Vercel Cron diário (`vercel.json`, 09:00 UTC) chama `/api/cron/keepalive`, que insere uma linha em `keepalive_log` e apaga as de mais de 30 dias. Autenticado por `CRON_SECRET` (comparação em tempo constante em `lib/keepalive.ts`).
- **Motivo:** o plano gratuito do Supabase pausa o projeto após cerca de 7 dias sem atividade.
- **Alternativas descartadas:** `pg_cron`: jobs internos do banco podem não contar como atividade do projeto; GitHub Actions desativa workflows agendados em repositório inativo.
- **Impacto:** exige rodar a migração `0003_keepalive.sql` manualmente. A tabela segue o padrão de RLS do projeto (anon key): insert e select livres, delete só de linhas com mais de 30 dias. `vercel.json` em vez de `vercel.ts` para não adicionar dependência.
- **Risco aceito:** a anon key consegue inserir linhas em `keepalive_log` (limitado pela policy: `source = 'vercel-cron'` e `created_at <= now()`), e qualquer um pode lê-las. Coerente com o restante do schema, que também usa a anon key com RLS aberta.

## 2026-10-13 — Visual A2: ícones próprios e identidade do logo

- **Decisão:** trocar todos os emojis por um conjunto próprio de ícones SVG (`components/icons/`) no estilo do logo, que tem preenchimento com as cores do logo e contorno escuro grosso. Os títulos usam as letras do logo (`text-logo`), o confete é geométrico (`Confetti`) e a fonte corrigida é Fredoka/Baloo 2 (antes o body forçava Arial). O "pior" é representado por um tomate podre.
- **Motivo:** o usuário pediu um visual elegante e profissional que mantivesse a essência do tema. Emojis variam por sistema (iOS/Android) e destoam do logo. Ícones de bibliotecas como Lucide e Phosphor são de traço fino e ficariam com cara de "app genérico".
- **Alternativas descartadas:** ilustrações com volume (B), visual clean minimalista (C), medalhas no boneco (A3) e uma biblioteca de ícones pronta.
- **Impacto:** nenhuma dependência nova e nenhuma mudança de regra ou dados. O teste `no-emoji` impede regressões. Spec: `docs/superpowers/specs/2026-10-13-visual-icones-a2-design.md`.

## 2026-10-13 — Contagem 3-2-1 com folga antes do 3

- **Decisão:** `starts_at` passa a ser `agora + 2,5 s (COUNTDOWN_LEAD_MS) + 3 s`, via `countdownStartsAt` em `lib/game/phase.ts`. Enquanto faltam mais de 3 s, o `Countdown` mostra só "Preparando…" (`countdownView`), e o 3-2-1 começa quando restam 3 s.
- **Causa:** o servidor calculava `starts_at = agora + 3 s` antes de gravar a rodada (INSERT, UPDATE em `rooms`, cada um um round trip Vercel iad1 para Supabase em São Paulo). Depois o Realtime e o `load()` do `useRoom` (5 consultas sequenciais, 0,35 a 0,78 s cada) consumiam cerca de 2 s, e o jogador via só o "1" e a chama.
- **Alternativa futura:** paralelizar as consultas do `load()` do `useRoom`, reduzindo a latência em vez de só compensá-la.
- **Impacto:** a contagem dura 2,5 s a mais até aparecer o 3. Lógica de retry do `beginRound` inalterada.

## 2026-10-13 — Encerrar a sala de verdade

- **Decisão:** `deleteRoom` virou `closeRoom`: marca `rooms.status = "closed"` e depois apaga a sala (cascade leva o resto). O dono dispara isso em "Jogar de novo" no pódio e em "Apagar sala e sair" no lobby. Os clientes tratam `status = "closed"`, ou a sala sumir depois de já ter existido (`lib/rooms.ts`), como encerramento e vão para `/?aviso=sala-encerrada`. O cron diário apaga também salas com `created_at` de mais de 24 h.
- **Motivo:** antes, `endGame` só marcava `ended` e tudo ficava no banco para sempre; e o Realtime não entrega DELETE em assinaturas com filtro, então o simples delete não avisava os outros jogadores (mesma causa do `touchRoom` no kick). O UPDATE antes do DELETE é o que dispara o aviso.
- **Alternativas descartadas:** apagar já em `endGame` (tiraria o pódio de quem ainda o olha); só depender do cron (dados ficam até 24 h e sem aviso).
- **Impacto:** sem migração (`rooms.status` é `text` sem constraint). O pódio some depois que o dono sai dele; o aviso na home é lido de `window.location.search` via `useSyncExternalStore`, evitando `Suspense`. Se o UPDATE se perder, o cliente ainda detecta pelo sumiço da sala no próximo reload.
- **Delete adiado:** o `closeRoom` só faz o UPDATE para `closed` e agenda o DELETE 5 s depois com `after()` (`CLOSE_DELETE_DELAY_MS`). Testado contra o Supabase real: apagar junto do UPDATE, com jogadores na sala, faz o cascade remover os `players` antes de o Realtime entregar o evento, e os outros clientes ficam presos no pódio; com 5 s de atraso o redirecionamento funciona. Se o `after()` não rodar, o cron apaga qualquer sala `closed`.
- **Limites:** o TTL de 24 h conta a partir da criação da sala (`created_at`). Encerrar é protegido como o resto do modelo anônimo (RLS aberta): não há autenticação real do dono. Erro de rede ao carregar a sala não conta como encerramento (o estado anterior é mantido).
