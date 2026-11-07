-- Cotações dos parceiros de câmbio (K2 Câmbio, Fortuna Cambios · Caixa Aux. Jebai) lidas pela função cambio-parceiros.
create table if not exists public.cambio_parceiros (
  id text primary key,
  valores jsonb not null,
  atualizado_site text,          -- hora que o próprio site informa (Fortuna); K2 não informa
  mudou_em timestamptz not null default now(),   -- quando os valores mudaram pela última vez
  consultado_em timestamptz not null default now(),
  erro text
);
alter table public.cambio_parceiros enable row level security;
-- sem políticas: só a função (service role) lê e grava
