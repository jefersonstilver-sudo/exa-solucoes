-- EXA (05/11/2026) — pedidos de contrato dos prédios (o Nando pede pela ClickSign e acompanha a assinatura).
-- Só as funções (service role) leem/escrevem: RLS ligado e sem política.
create table if not exists public.predio_contrato_pedidos (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  origem text not null default 'admin' check (origem in ('admin', 'sindico')),
  status text not null default 'aguardando_dados'
    check (status in ('aguardando_dados', 'agendado', 'enviando', 'enviado', 'assinado', 'cancelado', 'erro')),
  condominio_nome text,
  condominio_cnpj text,
  condominio_endereco text,
  signatario_nome text,
  signatario_email text,
  signatario_telefone text,
  signatario_cargo text default 'Síndico(a)',
  qtd_paineis int default 1,
  agendado_para timestamptz,
  enviado_em timestamptz,
  assinado_em timestamptz,
  clicksign_envelope_id text,
  clicksign_documento_id text,
  pdf_path text,
  modelo text,
  erro text,
  pedido_por_tel text,
  pedido_por_nome text,
  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.predio_contrato_pedidos enable row level security;
create index if not exists predio_contrato_pedidos_fila on public.predio_contrato_pedidos (status, agendado_para);
create index if not exists predio_contrato_pedidos_predio on public.predio_contrato_pedidos (building_id, criado_em desc);
-- no máximo um pedido em andamento por prédio
create unique index if not exists predio_contrato_pedidos_um_aberto on public.predio_contrato_pedidos (building_id)
  where status in ('aguardando_dados', 'agendado', 'enviando', 'enviado');
