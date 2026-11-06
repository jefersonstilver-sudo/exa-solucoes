-- EXA (06/11/2026) — auditoria de cobrança por pedido (pedido do Jeferson: levantamento de quem deve, sem avisar o cliente).
-- Tabelas internas, separadas de `parcelas`: nada daqui aparece para o cliente, para a Sofia nem para a régua da exa2-cobranca.
-- Acesso só pela função exa2-auditoria-cobranca (service role); RLS ligada e sem policies.

create table if not exists public.cobranca_auditoria (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  numero integer not null,
  competencia text,
  data_vencimento date not null,
  valor numeric(12,2) not null,
  status text not null default 'aberto' check (status in ('aberto','pago','perdoado','cancelado')),
  pago_em timestamptz,
  valor_pago numeric(12,2),
  asaas_payment_id text,
  pix_transacao_id text,
  comprovante_url text,
  pagador text,
  observacao text,
  pix_lote_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pedido_id, numero)
);

create table if not exists public.cobranca_auditoria_pix (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  asaas_payment_id text unique,
  valor numeric(12,2) not null,
  vencimento date,
  status text not null default 'aberto' check (status in ('aberto','pago','cancelado')),
  invoice_url text,
  pix_copia_cola text,
  pix_qr_base64 text,
  parcelas integer[] not null default '{}',
  criado_por uuid,
  pago_em timestamptz,
  comprovante_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cobranca_auditoria_pedido on public.cobranca_auditoria (pedido_id, numero);
create index if not exists idx_cobranca_auditoria_pix_aberto on public.cobranca_auditoria_pix (status) where status = 'aberto';

alter table public.cobranca_auditoria enable row level security;
alter table public.cobranca_auditoria_pix enable row level security;
revoke all on public.cobranca_auditoria, public.cobranca_auditoria_pix from anon, authenticated;

-- 06/11/2026 (tarde): parcela de cortesia e liberação para a área do cliente (aba Contrato)
alter table public.cobranca_auditoria drop constraint if exists cobranca_auditoria_status_check;
alter table public.cobranca_auditoria add constraint cobranca_auditoria_status_check check (status in ('aberto','pago','perdoado','cancelado','cortesia'));
alter table public.cobranca_auditoria add column if not exists visivel_cliente boolean not null default false;
-- cobrança gerada pelo cliente (Pix ou boleto; Pix único das atrasadas com desconto)
alter table public.cobranca_auditoria_pix add column if not exists forma text not null default 'pix', add column if not exists desconto_pct numeric(5,2) not null default 0, add column if not exists boleto_url text, add column if not exists linha_digitavel text;
-- 06/11/2026 (noite): período gravado na parcela (cortesia de dias, mensalidade paga adiantada)
alter table public.cobranca_auditoria add column if not exists periodo_inicio date, add column if not exists periodo_fim date;
