-- Sofia v98 — caixa de decisões do CEO.
-- Cada ocorrência que a Sofia abre vira uma pendência com código curto (A12). O CEO decide pelo WhatsApp
-- e a Sofia leva a decisão de volta à conversa do cliente. Só a função (service role) lê e escreve.
create table if not exists public.sofia_pendencias (
  id bigint generated always as identity primary key,
  codigo text generated always as ('A' || id::text) stored unique,
  conversation_id uuid references public.sofia_conversations(id) on delete set null,
  contact_id uuid references public.sofia_contacts(id) on delete set null,
  motivo text not null,
  resumo text,
  status text not null default 'aberta' check (status in ('aberta', 'decidida', 'cancelada')),
  decisao text,
  cliente_avisado boolean,
  mensagem_cliente text,
  decidido_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sofia_pendencias_status_idx on public.sofia_pendencias (status, created_at desc);
create index if not exists sofia_pendencias_contact_idx on public.sofia_pendencias (contact_id, created_at desc);
alter table public.sofia_pendencias enable row level security;
revoke all on public.sofia_pendencias from anon, authenticated;
