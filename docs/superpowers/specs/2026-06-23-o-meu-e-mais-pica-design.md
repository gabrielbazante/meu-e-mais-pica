# O meu é mais pica — Design

**Data:** 2026-06-23
**Status:** Aprovado (aguardando plano de implementação)

## Visão geral

Jogo de festa multiplayer em tempo real, jogado pelo celular. Um jogador cria uma
sala com código único e compartilha com os amigos. A cada rodada é sorteado um tema
e uma letra; todos escrevem uma resposta (estilo Adedanha/Stop) dentro de 1 minuto.
Depois todos votam no "mais pica" (melhor) e no "pior", e o ranking é atualizado com
animação de troca de posições. A partida é infinita até o dono encerrar.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind**, hospedado na Vercel.
- **Supabase** (Postgres + Realtime) para estado da sala e sincronização em tempo real.
- **Mobile-first** — todos os jogadores usam o celular.
- **Identidade visual: "Festa Cartoon"** — cores vivas, bordas grossas (3px), sombra
  chunky offset estilo Jackbox, cantos arredondados.

## Identidade dos jogadores

- Sem login. O jogador entra digitando **nome + código da sala**.
- Um **ID anônimo** é gerado e guardado no `localStorage`.
- **Reconexão:** ao dar refresh ou cair a conexão, o jogador volta para a mesma
  cadeira (mesmo `player_id`) sem perder pontos da partida.
- **Mínimo de 3 jogadores** para iniciar uma rodada (a votação exige não votar em si).

## Fluxo do jogo

### Fases

1. **Lobby**
   - O dono cria a sala → gera código de 4 caracteres (ex.: `7Q9K`).
   - Compartilha link/código; vê a lista de quem entrou em tempo real.
   - Botão "Começar" (habilitado com 3+ jogadores).

2. **Sorteio**
   - Sorteia um **tema** de uma lista PT-BR embutida (Comida, Cidade, Famoso, Marca,
     Gíria, Animal, etc.).
   - Sorteia uma **letra jogável** — alfabeto PT-BR exceto K, W, Y, X, Q.

3. **Preencher**
   - Todos escrevem a resposta (palavra/frase do tema começando com a letra).
   - **Timer de 1 minuto** apenas nesta fase.
   - Botão "O meu é mais pica" envia a resposta.
   - **Palavra duplicada:** se dois jogadores enviam a mesma palavra (comparada de
     forma **normalizada** — sem maiúsculas/acentos/espaços nas pontas), vale a de
     **quem confirmou primeiro** (menor `submitted_at`; empate exato desempatado por
     `player_id`). A resposta do(s) jogador(es) posterior(es) é **recusada e apagada**,
     com aviso *"'X' já foi usada — manda outra!"*, e ele(s) reenvia(m). O timer **segue
     correndo**; quem não reenviar a tempo entra em branco.
   - Avança quando **todos enviam** (uma resposta válida, não recusada) OU **o tempo
     acaba** (respostas faltantes contam como enviadas em branco).

4. **Votar (sem tempo)**
   - As respostas ficam visíveis para todos, junto dos nomes.
   - Cada jogador vota em **1 melhor + 1 pior**, e **não pode votar em si mesmo**.
   - Sem timer — cada um defende a própria resposta oralmente (jogo presencial).
   - Avança quando **todos votam**.

5. **Apuração**
   - **Mais pica** (mais votos de melhor) = **+10 pontos**.
   - **Pior** (mais votos de pior) = **0 pontos**.
   - **Demais** = **+2 pontos**.
   - **Empate no melhor** → abre uma **nova votação só entre os empatados** (re-voto,
     1 voto por jogador, apenas nas respostas empatadas). Se persistir o empate, ganha
     quem clicou "O meu é mais pica" primeiro (menor `submitted_at`).
   - **Empate no pior** → todos os empatados levam 0 (sem mini-rodada).

6. **Destaque + Ranking**
   - Tela rápida coroando o "mais pica" da rodada (resposta + nome em destaque,
     **confete + som**).
   - **Ranking animado:** a linha que muda de posição **descola** (cresce + sombra
     forte + sobe na pilha), **viaja** até o novo lugar com easing suave (~1,3s) e
     **assenta** de volta ao tamanho normal. Os `+X` da rodada sobem em cada jogador
     antes da soma. Medalhas 🥇🥈🥉 no top 3.

7. **Próxima rodada / Encerrar**
   - Partida **infinita**: o dono clica "Próxima rodada" para sortear de novo.
   - O dono clica "Encerrar" a qualquer momento → tela de **pódio** top 3 com o campeão.

### Diagrama de estados

```
lobby → sorteio → preencher → votar → apuracao → [desempate → apuracao]* → resultado
                     ↑                                                          |
                     └──────────────── (dono: próxima rodada) ─────────────────┘
                                                                                |
                                                          (dono: encerrar) → podio
```

## Modelo de dados (Supabase / Postgres)

- **`rooms`** — `id`, `code` (único), `host_id`, `status` (`lobby` | `playing` | `ended`),
  `current_round_id`, `created_at`.
- **`players`** — `id`, `room_id`, `name`, `total_points`, `connected`, `joined_at`.
- **`rounds`** — `id`, `room_id`, `theme`, `letter`, `phase`
  (`preencher` | `votar` | `desempate` | `resultado`), `started_at`.
- **`answers`** — `id`, `round_id`, `player_id`, `text`, `submitted_at`.
- **`votes`** — `id`, `round_id`, `voter_id`, `best_id`, `worst_id`, `is_tiebreak`.

Sincronização via **Supabase Realtime** (Postgres Changes / Broadcast) em um canal por
sala. O **host é autoritativo** para o avanço de fase e o sorteio, evitando condições de
corrida e trapaça.

## Componentes (unidades isoladas e testáveis)

- **Máquina de estado da rodada** — transições entre fases
  (lobby → preencher → votar → [desempate] → resultado). Lógica pura, testável sem UI.
- **Apuração de votos** — função pura que recebe votos + respostas e devolve pontos por
  jogador, detecta empate de melhor (dispara desempate) e empate de pior. Fácil de testar
  isoladamente.
- **Sorteio** — função pura que escolhe tema + letra (com exclusão de letras difíceis e,
  idealmente, sem repetir o tema da rodada anterior).
- **Camada de Realtime** — hook que assina o canal da sala e devolve o estado atual.
- **Lista de temas** — dataset PT-BR embutido.
- **Telas:** Lobby, Rodada (Preencher), Votação, Destaque + Resultado/Ranking, Pódio.

## Decisões assumidas

- Timer de 1 min **somente** na fase de preencher; votação sem tempo.
- Host autoritativo para avanço de fase e sorteio.
- Respostas em branco (quem não enviou até o fim do timer) entram na votação vazias.
- Sons leves e **opcionais** (botão de mudo disponível).

## Fora de escopo (YAGNI por enquanto)

- Login / contas persistentes.
- Histórico de partidas anteriores.
- Temas customizados pelo dono (pode entrar depois).
- Modo "pode votar em si mesmo".
- Placar por pontuação-alvo ou número fixo de rodadas (partida é infinita).
