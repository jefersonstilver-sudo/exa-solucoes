-- EXA (05/11/2026) — assinatura automática da EXA na ClickSign (termo auto_signature).
-- Guarda os dados do signatário EXA digitados pelo Jeferson no admin; a ClickSign confere CPF + nascimento + e-mail.
-- Só as funções (service role) leem: RLS ligado e sem política.
create table if not exists public.exa_assinatura_automatica (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  documento text not null,
  nascimento date not null,
  admin_email text not null,
  termo_id text,
  status text not null default 'solicitado' check (status in ('solicitado', 'ativo', 'substituido', 'desligado')),
  erro text,
  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.exa_assinatura_automatica enable row level security;
alter table public.predio_contrato_pedidos add column if not exists lembrete_em timestamptz;
