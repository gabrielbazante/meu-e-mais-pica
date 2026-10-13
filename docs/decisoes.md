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

## Commits sem linha `Co-Authored-By`
- **Decisão:** os commits desta entrega não levam `Co-Authored-By`.
- **Motivo:** instrução do usuário no plano.
- **Impacto:** nenhum no código; os commits não carregam atribuição de coautoria.
