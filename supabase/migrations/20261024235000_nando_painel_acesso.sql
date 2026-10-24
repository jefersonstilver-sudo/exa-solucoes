-- Nando: codigos do WhatsApp e acessos do painel do sindico (ja aplicada no banco em 24/10/2026)
create table if not exists public.nando_codigos (
  id uuid primary key default gen_random_uuid(), telefone text not null, finalidade text not null default 'acesso',
  codigo_hash text not null, tentativas int not null default 0, usado boolean not null default false, sessao_id uuid,
  created_at timestamptz not null default now(), expira_em timestamptz not null
);
create index if not exists nando_codigos_tel on public.nando_codigos(telefone, created_at desc);
create table if not exists public.nando_sessoes (
  id uuid primary key default gen_random_uuid(), token_hash text not null unique, telefone text not null, aparelho text,
  lembrar boolean not null default false, alterar_ate timestamptz, revogada boolean not null default false,
  created_at timestamptz not null default now(), ultimo_uso timestamptz not null default now(), expira_em timestamptz not null
);
create index if not exists nando_sessoes_tel on public.nando_sessoes(telefone);
alter table public.nando_codigos enable row level security;
alter table public.nando_sessoes enable row level security;
revoke all on public.nando_codigos from anon, authenticated;
revoke all on public.nando_sessoes from anon, authenticated;
