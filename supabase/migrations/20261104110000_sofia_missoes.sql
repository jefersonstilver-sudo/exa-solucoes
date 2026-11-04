-- Missões da Sofia (v111, 04/11/2026): a Sofia puxa a conversa com um cliente existente,
-- identifica a pessoa, valida o código do e-mail, mostra o vídeo de boas-vindas, ensina o app
-- e leva a pessoa a usar a Sofia para os vídeos. Contatos em ordem: se um não der certo, passa ao próximo.
-- Aplicada pelo SQL Editor (não rodar pelo Lovable).
create table if not exists public.sofia_missoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'adesao_cliente',
  pedido_id uuid references public.pedidos(id) on delete set null,
  empresa text not null,
  objetivo text,
  contatos jsonb not null default '[]'::jsonb,   -- [{nome, telefone, papel, artigo}]
  idx int not null default 0,
  status text not null default 'pronta' check (status in ('pronta','ativa','pausada','concluida','falhou','cancelada')),
  contato_id uuid,
  conversa_id uuid,
  aberta_em timestamptz,
  lembrete_em timestamptz,
  concluida_em timestamptz,
  resultado text,
  log jsonb not null default '[]'::jsonb,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sofia_missoes enable row level security;
revoke all on public.sofia_missoes from anon, authenticated;
