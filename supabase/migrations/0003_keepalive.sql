-- Keep-alive do Supabase (2026-10-13). Rodar no SQL editor do Supabase.
-- O plano gratuito pausa o projeto após cerca de 7 dias sem atividade. Um Vercel Cron
-- (app/api/cron/keepalive, todo dia às 09:00 UTC) insere uma linha aqui para gerar atividade.
-- Linhas com mais de 30 dias são apagadas pelo próprio cron.

create table if not exists keepalive_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  source text not null default 'vercel-cron'
);

alter table keepalive_log enable row level security;

create policy "keepalive insert" on keepalive_log for insert with check (true);
create policy "keepalive select" on keepalive_log for select using (true);
-- só linhas antigas podem ser apagadas
create policy "keepalive delete old" on keepalive_log for delete
  using (created_at < now() - interval '30 days');

-- Não adicionar à publicação do Realtime: ninguém precisa assinar esta tabela.
