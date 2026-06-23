create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null,
  status text not null default 'lobby',
  current_round_id uuid,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  total_points int not null default 0,
  connected boolean not null default true,
  joined_at timestamptz not null default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  theme text not null,
  letter text not null,
  phase text not null default 'preencher',
  tiebreak_candidates uuid[] not null default '{}',
  ends_at timestamptz,
  started_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  text text not null default '',
  submitted_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  best_id uuid references players(id) on delete cascade,
  worst_id uuid references players(id) on delete cascade,
  is_tiebreak boolean not null default false,
  unique (round_id, voter_id, is_tiebreak)
);

alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table answers enable row level security;
alter table votes enable row level security;

create policy "public read/write rooms"   on rooms   for all using (true) with check (true);
create policy "public read/write players" on players for all using (true) with check (true);
create policy "public read/write rounds"  on rounds  for all using (true) with check (true);
create policy "public read/write answers" on answers for all using (true) with check (true);
create policy "public read/write votes"   on votes   for all using (true) with check (true);

-- Habilita o Realtime (Postgres Changes) nestas tabelas.
alter publication supabase_realtime add table rooms, players, rounds, answers, votes;
