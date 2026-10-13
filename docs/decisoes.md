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
