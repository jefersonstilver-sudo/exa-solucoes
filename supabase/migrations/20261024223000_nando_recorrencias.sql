-- Nando: avisos que se repetem (ja aplicada no banco em 24/10/2026)
create table if not exists public.nando_recorrencias (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  modelo_id uuid not null,
  regra jsonb not null,
  ativo boolean not null default true,
  ultima_inicio timestamptz,
  criado_por_tel text,
  criado_por_nome text,
  lote text,
  created_at timestamptz not null default now()
);
alter table public.nando_recorrencias enable row level security;
revoke all on public.nando_recorrencias from anon, authenticated;
create index if not exists nando_recorrencias_ativo on public.nando_recorrencias(ativo, building_id);
