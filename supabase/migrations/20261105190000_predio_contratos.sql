-- Contratos assinados de cada prédio (síndico x EXA), mostrados no Painel do Síndico (área Contratos).
-- O PDF fica no bucket PRIVADO "contratos-predios"; o painel só entrega link assinado de poucos minutos
-- para quem tem sessão válida e administra aquele prédio (nando-painel, acao "contratos").
create table if not exists public.predio_contratos (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  titulo text not null,
  arquivo_path text not null,                 -- caminho no bucket contratos-predios
  assinado_em timestamptz,
  assinante_nome text,
  assinante_email text,
  clicksign_envelope_id text,
  clicksign_documento_id text,
  ativo boolean not null default true,        -- false = substituído por um contrato mais novo
  criado_em timestamptz not null default now(),
  criado_por text
);
create index if not exists predio_contratos_building on public.predio_contratos(building_id) where ativo;
alter table public.predio_contratos enable row level security;  -- sem políticas: só as funções (service role) leem

insert into storage.buckets (id, name, public) values ('contratos-predios', 'contratos-predios', false)
on conflict (id) do nothing;
