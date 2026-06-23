# 🔥 Meu É Mais Pica

> O jogo de respostas mais pica da festa.

Cada rodada sorteia um **tema** e uma **letra**. Todo mundo escreve a melhor resposta com aquela letra. Depois, todos votam — e o que ganhar mais votos leva os pontos. No final, o ranking revela quem tem o melhor gosto da galera.

---

## Como jogar

1. Um jogador cria a sala e compartilha o código
2. Todos entram com o código
3. Com 3+ jogadores, o dono inicia o jogo
4. Cada rodada: escreva sua resposta → vote na melhor → veja o ranking
5. Quem acumular mais pontos vence 🏆

---

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Supabase** — banco de dados e realtime
- **Tailwind CSS v4** — estilo chunky com sombras e bordas
- **Fontes:** Fredoka (corpo) + Baloo 2 (títulos e botões)

---

## Rodar localmente

```bash
# instalar dependências
npm install

# variáveis de ambiente
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# subir
npm run dev
```

Acesse http://localhost:3000.

### Banco de dados

As migrations ficam em `supabase/migrations/`. Para aplicar:

```bash
npx supabase db push
```

---

## Testes

```bash
npm test
```

---

## Deploy

O projeto está configurado para Vercel. Basta importar o repositório em vercel.com/new e adicionar as variáveis de ambiente do Supabase.

---

Made with 🔥 by @gabrielbazante
