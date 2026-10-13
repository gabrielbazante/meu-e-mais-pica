# 🔥 Meu É Mais Pica

> O jogo de respostas mais pica da festa.

Cada rodada sorteia um **tema** e uma **letra**. Todo mundo escreve a melhor resposta com aquela letra. Depois, todos votam no **mais pica** e no **pior**. No final, o ranking revela quem tem o melhor gosto da galera.

---

## Como jogar

1. Um jogador cria a sala e convida a galera: pelo **código**, por **link** (botão do WhatsApp ou "Copiar link") ou por **QR Code** no lobby. O link e o QR Code já caem na tela de entrar na sala, só falta digitar o nome.
2. Todos entram com o código ou pelo convite.
3. Com 3+ jogadores, o dono inicia o jogo.
4. Antes da primeira rodada aparece a **tela de regras**; o dono clica em "Bora!" para seguir.
5. Rola uma **contagem 3-2-1** igual para todo mundo. O tema só aparece quando a rodada começa, então ninguém sai na frente.
6. Você tem **1 minuto** para responder. Não vale repetir palavra que já foi usada.
7. Todos votam no **mais pica** e no **pior** (não dá para votar em si mesmo). Depois de votar, você vê a lista de quem já votou.
8. **Empatou?** Rola desempate: primeiro para o melhor, depois para o pior, um de cada vez. Se o desempate do melhor continuar empatado, vence quem respondeu primeiro; no do pior, perde quem respondeu por último (rapidez protege dos dois lados).
   - **Mais pica e pior nunca são a mesma pessoa:** o pior é apurado sem contar o vencedor do melhor. Se ninguém além dele recebeu voto de pior, a rodada fica sem pior.
9. O **resultado** mostra o mais pica e o pior com a quantidade de votos de cada, e um ranking animado com os pontos que cada jogador fez na rodada.
10. O dono segue para a próxima rodada ou encerra a partida. Quem acumular mais pontos vence 🏆

### Pontuação

| Situação na rodada | Pontos |
| --- | --- |
| Mais pica | +10 |
| Respondeu (nem melhor, nem pior) | +2 |
| Pior | 0 |
| Não respondeu a tempo | −1 |

O total nunca fica abaixo de 0. Quem não respondeu não aparece como opção de voto, mas continua votando.

### Controles do dono

- Iniciar o jogo, clicar em "Bora!", passar para a próxima rodada e encerrar a partida.
- **Expulsar jogadores** pelo botão "Jogadores".
- **Marcar uma resposta como repetida.** Ela sai da votação sem penalidade: o autor ainda ganha +2. O aviso "parece repetida?" na votação é só uma dica automática, pode errar; quem decide é o dono.

### Reconectando

Caiu, fechou a aba ou perdeu o acesso? Entre com o **mesmo nome na mesma sala** e você recupera sua cadeira e seus pontos. Se for o dono, ele também recupera a coroa. Quem não está mais na sala vê o card "Entrar nesta sala".

Ao criar ou entrar em outra sala depois de uma partida (por exemplo, "Jogar de novo"), você ganha uma **cadeira nova**, com zero pontos. A partida anterior continua intacta, com o pódio preservado.

---

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Supabase** — banco de dados e realtime
- **Tailwind CSS v4** — estilo chunky com sombras e bordas
- **[qrcode.react](https://github.com/zpao/qrcode.react) 4.2.0** — QR Code do convite
- **Fontes:** Fredoka (corpo) + Baloo 2 (títulos e botões)

---

## Rodar localmente

```bash
# instalar dependências
npm install

# variáveis de ambiente
cp .env.local.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# subir
npm run dev
```

Acesse http://localhost:3000.

### Banco de dados

As migrations ficam em `supabase/migrations/`:

- `0001_init.sql`: tabelas e configuração inicial.
- `0002_ajustes_playtest.sql`: colunas novas do pós-playtest (contagem, desempate do pior, pontos da rodada, resposta repetida). Tema e letra passam a poder ser nulos.
- `0003_keepalive.sql`: tabela `keepalive_log` usada pelo keep-alive diário (veja abaixo). Rode no **SQL editor** do Supabase; não é aplicada automaticamente.

Para aplicar, escolha uma opção:

```bash
npx supabase db push
```

ou copie o conteúdo de cada arquivo e rode, em ordem, no **SQL editor** do painel do Supabase.

### Keep-alive do Supabase

O plano gratuito do Supabase pausa o projeto após cerca de 7 dias sem atividade. Para evitar isso, um Vercel Cron chama `GET /api/cron/keepalive` todo dia às **09:00 UTC** (configurado em `vercel.json`), e a rota insere uma linha em `keepalive_log` e apaga as com mais de 30 dias.

- Rode a migração `0003_keepalive.sql` uma vez; sem ela a rota responde 500.
- Em produção, a Vercel precisa da variável `CRON_SECRET` (já criada no projeto). A Vercel a envia como `Authorization: Bearer ...` e a rota recusa (401) qualquer outra chamada.
- Para conferir, rode no SQL editor: `select * from keepalive_log order by created_at desc limit 5;`. Deve haver uma linha nova por dia.

---

## Testes

```bash
npm test
```

---

## Deploy

O projeto está configurado para Vercel. Basta importar o repositório em vercel.com/new e adicionar as variáveis de ambiente do Supabase.

---

## Limitações conhecidas

- Se o dono sair e não voltar, as ações só do dono param (não há promoção de novo dono).
- Dois jogadores com exatamente o mesmo nome disputam a mesma cadeira.
- Recuperar a cadeira pelo nome funciona mesmo com ela online; aceitável para um jogo entre amigos.
- Jogador expulso pode voltar pelo card "Entrar nesta sala", começando do zero.
- Não há tempo limite na votação: quem some trava a rodada até o dono expulsá-lo.
- Quem souber o código da sala e o nome do dono assume a cadeira do dono (aceito num jogo entre amigos).
- Se o vencedor do melhor, já decidido, for expulso durante o desempate do pior, os +10 ficam sem dono.
- Após um deploy novo, quem estava com o app aberto é recarregado automaticamente na próxima ação (no máximo uma vez a cada 30 s). Dá para evitar o recarregamento ativando o "Skew Protection" da Vercel, conforme o plano.

## Saiba mais

- [`docs/contexto-projeto.md`](docs/contexto-projeto.md): estado atual, fluxo da rodada, onde fica cada coisa e pendências.
- [`docs/decisoes.md`](docs/decisoes.md): decisões técnicas do pós-playtest e seus motivos.

---

Made with 🔥 by @gabrielbazante
