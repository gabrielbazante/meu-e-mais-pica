-- Ajustes pós-playtest (2026-10-13). Rodar no SQL editor do Supabase.

-- tema/letra agora são sorteados só ao fim da contagem (ficam null em regras/contagem)
alter table rounds alter column theme drop not null;
alter table rounds alter column letter drop not null;

-- contagem sincronizada, desempate sequencial, deltas da rodada
alter table rounds add column starts_at timestamptz;
alter table rounds add column tiebreak_kind text;      -- 'best' | 'worst' | null
alter table rounds add column best_winner uuid;
alter table rounds add column worst_loser uuid;
alter table rounds add column round_scores jsonb not null default '{}'::jsonb;

-- marcação de resposta repetida
alter table answers add column voided boolean not null default false;

-- Nao ha mudanca de FK: a reconexao por nome NAO muta players.id. O cliente
-- adota o id da cadeira existente (ver Task 9), entao as PKs/FKs ficam intactas.
-- Novos valores de rounds.phase ('regras','contagem') são texto livre: sem constraint a alterar.
