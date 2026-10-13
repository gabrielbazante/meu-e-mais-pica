# Visual A2: ícones próprios e identidade do logo — Design

**Data:** 2026-10-13
**Status:** Design aprovado pelo usuário no chat. Spec escrita, aguardando revisão.
**Branch:** `feat/visual-icones-a2`, com PR direto para `main`.

## Objetivo

Deixar o app **elegante e profissional sem perder a essência do tema**. Para isso:

- **tirar todos os emojis** da interface e usar ícones/ilustrações próprios em SVG, com fundo transparente;
- aproximar as telas da identidade do logo (`public/logo.png`): letras creme com contorno grosso, rosa/roxo/azul ao lado do amarelo, coroa com gema roxa, confetes geométricos e os bonecos-bloco.

### Decisões do usuário (tomadas no brainstorming com mockups)

| Decisão | Escolha |
|---|---|
| Direção visual | **A2 · Chunky refinado com as cores do logo**. Descartadas: B (ilustrado com volume), C (clean minimalista) e A3 (medalhas no boneco). |
| Fonte dos ícones | **Conjunto próprio em SVG** no estilo A2, sem biblioteca. |
| Ícone do "pior" (substitui 💩) | **Tomate podre** |

### Mockups aprovados (referência visual com os paths SVG exatos)

- `docs/superpowers/specs/assets/2026-10-13-visual-a2/podio-a2.html`: pódio. Usar a variação **A2**; ignorar a A3 do mesmo arquivo.
- `docs/superpowers/specs/assets/2026-10-13-visual-a2/icones.html`: folha de ícones. No "pior", vale o **tomate**.
- `docs/superpowers/specs/assets/2026-10-13-visual-a2/telas-a2.html`: Regras, Votação e Resultado da rodada.

Os mockups são HTML estático para referência. A implementação é React/Tailwind. Os paths SVG dos mockups são a fonte dos ícones e podem ser refinados, desde que mantenham forma, cores e contorno.

## 1. Fundações visuais (`app/globals.css`, `app/layout.tsx`)

- **Fonte (bug atual):** o `body` declara `font-family: Arial, Helvetica, sans-serif`, então o texto corrido não usa Fredoka.
  - O texto passa a usar **Fredoka** (`--font-fredoka`, já carregada no layout).
  - Títulos, números e botões usam **Baloo 2** (`font-display`).
  - Remover o bloco `:root`/`prefers-color-scheme: dark` e o primeiro `body {}` herdados do template do Next, que não são usados (o app é sempre amarelo).
- **Paleta:** novos tokens no `@theme`. Os atuais permanecem.
  - `--color-logo-pink: #ff1f8e`
  - `--color-logo-purple: #8b2be2`
  - `--color-logo-blue: #1e7be0`
  - `--color-logo-gold: #ffc61a`
  - `--color-cream: #fff6e6`
- **Utilities novas** (`@utility`, padrão Tailwind v4 do projeto, sem `tailwind.config`):
  - `text-logo`: letra creme (`--color-cream`) com contorno de 2px na cor ink (`-webkit-text-stroke` + `paint-order: stroke fill`) e `text-shadow: 3px 3px 0` ink. Usada com `font-display font-extrabold uppercase`.
  - `sticker`: fundo branco, `border-3 border-ink`, `rounded-2xl`, `shadow-chunky`, padding horizontal; a inclinação leve (por exemplo `-rotate-2`) fica a cargo de quem usa.
- Overrides de cor continuam com `!` quando necessário (padrão do projeto).

## 2. Componentes novos

### 2.1 `components/icons/`

Um componente React por ícone, em SVG inline, com `viewBox="0 0 24 24"` e contorno `#1a1a2e` (cor ink).

- **Props:** `{ size?: number = 24; className?: string; title?: string }`.
- **Acessibilidade:** sem `title`, o ícone é decorativo (`aria-hidden="true"`). Com `title`, recebe `role="img"` e `aria-label`.
- **Exportação:** por um `index.ts`.

| Componente | Substitui | Uso |
|---|---|---|
| `Crown` | 👑 | dono da sala, campeão (gema roxa) |
| `Trophy` | 🏆 | ranking, regras de pontos |
| `Medal` (prop `rank: 1\|2\|3`) | 🥇🥈🥉 | ranking da rodada (ouro `#ffc61a`, prata `#d9dde3`, bronze `#e0a36b`; fita rosa/azul) |
| `Flame` | 🔥 | "mais pica", contagem no 0, envio da resposta |
| `Tomato` | 💩 | "pior" |
| `Clock` | ⏱️ | 1 minuto, timer do preencher |
| `Target` | 🎯 | tema + letra |
| `Ballot` | 🗳️ | votação |
| `Scale` | ⚖️ | desempate |
| `Check` | ✅ / ✓ | enviado, votou, copiado |
| `Star` | ⭐ / 🙌 | "sem pior", confete |
| `Play` | — | começar, "Bora!", próxima rodada |
| `Restart` | — | jogar de novo |
| `Users` | — | botão "Jogadores" |
| `Kick` | × | expulsar |
| `WhatsApp` | — | convite |
| `Copy` | — | copiar link |
| `Alert` | 😅 | palavra já usada, "parece repetida?", erros |
| `Exit` | — | sair da sala |
| `Sad` | 😢 | sala não encontrada |
| `ArrowLeft` | ← | "Quero criar uma sala" |

### 2.2 Outros componentes

- **`LogoTitle`** (`components/ui/LogoTitle.tsx`): `<h1|h2>` com `text-logo font-display uppercase`.
  - Props: `as?: "h1" | "h2"`, `size?: "lg" | "md" | "sm"`, `children`.
  - Quebra de linha natural: o texto não pode estourar 375px.
- **`Confetti`** (`components/ui/Confetti.tsx`): SVG absoluto e decorativo (`aria-hidden`, `pointer-events-none`) com triângulos e bolinhas nas cores do logo.
  - As posições são **fixas** (determinísticas), sem `Math.random` no render, o que elimina o erro de lint `react-hooks/purity`.
  - Prop `variant?: "subtle" | "party"`: `party` tem mais peças e uma animação CSS de queda suave para o resultado; `subtle` é estático, para o fundo das telas.
  - Respeita `prefers-reduced-motion` (sem animação).
- **`Button`**: nova prop opcional `icon?: React.ReactNode`, renderizada antes do texto com `gap-2`, em `inline-flex items-center justify-center`. Nenhum uso atual quebra.

## 3. Telas (todos os emojis saem; regras, fluxo e dados não mudam)

| Tela / componente | Mudanças |
|---|---|
| `app/page.tsx` (Home) | "Criar sala" com `Play`, "Entrar" com `Play`, "← Quero criar uma sala" com `ArrowLeft`, mensagens de erro com `Alert`. Logo inalterado. |
| `components/screens/Lobby.tsx` | Card do código: rótulo "SALA" e código grande em `font-display`. Coroa `Crown` no dono (lista e `ManagePlayers`). "Começar" com `Play`. "Sair da sala" com `Exit`. "Apagar sala e sair" sem ícone ou com `Kick`, a critério da implementação, mantendo o estilo escuro. Confete `subtle`. |
| `components/screens/Rules.tsx` | `LogoTitle` "COMO JOGA". Card com uma linha por regra: ícone de 26px à esquerda e texto à direita (`Target`, `Clock`, `Ballot`, `Trophy`, `Scale`). Texto das regras sem mudança. "Bora!" com `Play`. Confete `subtle`. |
| `components/screens/Countdown.tsx` | Número grande com `text-logo`. No 0 aparece `Flame` grande (cerca de 96px) no lugar do "🔥". "Preparando…" fica como está. |
| `components/screens/Fill.tsx` | Selos de TEMA (com `Target`) e LETRA no padrão novo. Timer com `Clock`. Botão de envio: "O meu é mais pica" com `Flame`; depois de enviado, "Enviado" com `Check`. Aviso de palavra usada com `Alert`, sem emoji. |
| `components/screens/Vote.tsx` | `LogoTitle` "HORA DE VOTAR" (desempate: "DESEMPATE" + `Scale`, com subtítulo "vote no MELHOR" / "vote no PIOR"). Selos de tema/letra. Botões "Mais pica" (`Flame`; selecionado: fundo `logo-pink`, texto branco) e "Pior" (`Tomato`; selecionado: fundo `logo-purple`, texto branco). "parece repetida?" com `Alert`. Resposta num bloco `cream`. |
| `components/ui/VotersList.tsx` | `Check` (SVG) no lugar do caractere "✓". O texto acessível continua dizendo quem votou. |
| `components/ui/ManagePlayers.tsx` | Botão "Jogadores" com `Users`. `Crown` no dono. Expulsar com `Kick`, mantendo `aria-label="Expulsar {nome}"`. |
| `components/screens/Result.tsx` | Destaques: `Flame` + `LogoTitle` "O MAIS PICA" + nome + card `logo-pink` (resposta · n votos); `Tomato` + "O PIOR" + card `logo-purple`. "Sem pior nesta rodada" com `Star`. `Confetti variant="party"` no lugar do confete de emoji. Ranking: título "RANKING" com `Trophy`. |
| `components/screens/Ranking.tsx` | `Medal rank={1\|2\|3}` no lugar de 🥇🥈🥉; do 4º em diante, "4º" como hoje. Animação FLIP e "+X" sem mudança. |
| `components/screens/Podium.tsx` | Conforme o mockup **A2**: `LogoTitle` "FIM DE JOGO!"; `sticker` com `Crown` + "{nome} venceu!"; `Crown` inclinada sobre o `BlockAvatar` do 1º; degraus `logo-blue` (2º), `logo-pink` (1º), `logo-purple` (3º) com o número da posição em `text-logo` e a pontuação num selinho branco; "Jogar de novo" com `Restart`; `Confetti variant="party"`. Com 1 ou 2 jogadores no pódio, renderizar só os degraus existentes (comportamento atual). |
| `components/ui/InviteShare.tsx` | "Compartilhar no WhatsApp" com `WhatsApp`; "Copiar link" com `Copy`; "Copiado" com `Check` (o caractere ✓ sai). O anúncio `aria-live` não muda. |
| `app/sala/[code]/page.tsx` | "Sala não encontrada" com `Sad`, sem 😢. JoinSeat: "Entrar" com `Play`, sem 🔥. |

## 4. Qualidade

- **Teste anti-emoji** (`__tests__/no-emoji.test.ts`): varre `app/**/*.tsx` e `components/**/*.tsx` com Node `fs`. Falha se encontrar emoji ou pictograma (faixas Unicode `\u{1F300}-\u{1FAFF}`, `\u{2600}-\u{27BF}`, `\u{2B50}`, `\u{2705}`, `\u{2713}`, `\u{2190}-\u{21FF}`, `\u{23E9}-\u{23FA}`). **Comentários** (`//` e `/* */`) ficam fora da varredura, porque setas em comentários são aceitáveis. O erro mostra arquivo:linha.
- **Teste dos ícones** (`__tests__/icons.test.tsx`, Testing Library/jsdom, se o projeto já tiver; senão `react-dom/server` `renderToStaticMarkup`):
  - cada ícone renderiza um `<svg>`;
  - sem `title`, fica `aria-hidden`;
  - com `title`, fica `role="img"` + `aria-label`;
  - `Medal` muda a cor por `rank`.
- `npx tsc --noEmit`, `npx vitest run` (os 62 atuais + os novos) e `npx next build` passam. O lint não ganha erros novos, e o `react-hooks/purity` do Result deve sumir.
- **QA manual (Marco) na preview**, com 4 jogadores em origens distintas:
  - todas as telas em 375px e em desktop, sem scroll horizontal;
  - títulos em caixa alta e nomes longos (16 caracteres) sem estourar;
  - contraste dos textos sobre rosa/roxo/azul;
  - leitor de tela: ícones decorativos ignorados, botões com nome correto;
  - `prefers-reduced-motion`;
  - fluxo completo, do lobby ao pódio.
- **Revisão:** Richard implementa. Gilfoyle revisa acessibilidade, performance (SVG inline leve, sem dependência nova) e regressões. Revisão independente por task.

## Fora de escopo

- Regras do jogo, fluxo, banco, server actions.
- Logo e ícones da tela de início (PR #5).
- Animações novas além do confete e da animação do ranking que já existe.
- Modo escuro.

## Riscos

- **`-webkit-text-stroke`:** suportado no Safari/Chrome atuais. Se algum navegador não suportar, o texto continua legível (creme com sombra escura).
- **Contraste de texto creme sobre amarelo:** o contorno e a sombra escura garantem a leitura. O QA confere.
- **Títulos em caixa alta ocupam mais largura:** o QA confere a quebra em 375px.
