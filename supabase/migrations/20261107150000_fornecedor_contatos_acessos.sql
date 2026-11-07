-- 07/11/2026 (Jeferson): empresas de elevador e provedores de internet com pessoas de contato e acessos (login/senha/link das contas).
create table if not exists public.fornecedor_contatos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  nome text not null,
  cargo text,
  telefone text,
  email text,
  principal boolean not null default false,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fornecedor_contatos_forn on public.fornecedor_contatos (fornecedor_id);

create table if not exists public.fornecedor_acessos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  rotulo text not null default 'Portal',
  url text,
  login text,
  senha text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fornecedor_acessos_forn on public.fornecedor_acessos (fornecedor_id);

alter table public.fornecedor_contatos enable row level security;
alter table public.fornecedor_acessos enable row level security;
revoke all on public.fornecedor_contatos from anon;
revoke all on public.fornecedor_acessos from anon;
drop policy if exists "Admins gerenciam contatos de fornecedores" on public.fornecedor_contatos;
create policy "Admins gerenciam contatos de fornecedores" on public.fornecedor_contatos for all
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin','super_admin')))
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin','super_admin')));
drop policy if exists "Admins gerenciam acessos de fornecedores" on public.fornecedor_acessos;
create policy "Admins gerenciam acessos de fornecedores" on public.fornecedor_acessos for all
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin','super_admin')))
  with check (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin','super_admin')));
grant select, insert, update, delete on public.fornecedor_contatos, public.fornecedor_acessos to authenticated;
select 'ok' as r;
