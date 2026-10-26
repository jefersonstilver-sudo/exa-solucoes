-- NANDO · CRM: atendimento assumido por humano (por telefone). Aditivo.
create table if not exists public.nando_atendimento (
  telefone          text primary key,
  modo              text not null default 'auto' check (modo in ('auto', 'humano')),
  humano_ate        timestamptz,
  assumido_por      uuid,
  assumido_por_nome text,
  atualizado_em     timestamptz not null default now()
);
alter table public.nando_atendimento enable row level security;   -- só service_role (nando-webhook / nando-crm)
