-- Nando: vigia dos painéis (05/11/2026). Controle de quais quedas já foram avisadas ao Jeferson/técnicos.
create table if not exists public.nando_paineis_alertas (
  id bigserial primary key,
  device_id uuid not null,
  inicio timestamptz not null,           -- started_at do device_offline_incidents
  avisado_em timestamptz,                -- null = queda de noite, vai no resumo das 7h
  noite boolean not null default false,
  resumo text,
  voltou_em timestamptz,
  fora_texto text,
  created_at timestamptz not null default now(),
  unique (device_id, inicio)
);
alter table public.nando_paineis_alertas enable row level security; -- só o service role (nando-cron) usa
create index if not exists nando_paineis_alertas_abertos on public.nando_paineis_alertas (device_id) where voltou_em is null;

-- quedas que já estavam abertas na estreia contam como conhecidas (o resumo das 7h lista as que seguem fora)
insert into public.nando_paineis_alertas (device_id, inicio, avisado_em, noite, resumo)
select device_id, started_at, now(), false, 'aberta antes da estreia do vigia do Nando'
from public.device_offline_incidents where resolved_at is null
on conflict (device_id, inicio) do nothing;

insert into public.nando_config (chave, valor) values ('vigia_paineis', 'desligado'), ('tecnicos', '[]') -- liga depois do teste: update nando_config set valor='ligado' where chave='vigia_paineis'
on conflict (chave) do nothing;
