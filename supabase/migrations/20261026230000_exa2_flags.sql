-- EXA 2.0 · chaves liga/desliga (aditivo)
create table if not exists public.exa2_flags (
  chave        text primary key,
  ativo_todos  boolean not null default false,
  usuarios     uuid[]  not null default '{}',
  atualizado_em timestamptz not null default now()
);
alter table public.exa2_flags enable row level security;
drop policy if exists "Logados leem flags" on public.exa2_flags;
create policy "Logados leem flags" on public.exa2_flags for select to authenticated using (true);
drop policy if exists "Admins gerenciam flags" on public.exa2_flags;
create policy "Admins gerenciam flags" on public.exa2_flags for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

-- Página nova do pedido: começa DESLIGADA para clientes, ligada só para a conta do Jeferson
insert into public.exa2_flags (chave, ativo_todos, usuarios)
select 'pedido_v2', false, coalesce(array_agg(id), '{}') from auth.users where email = 'jefersonstilver@gmail.com'
on conflict (chave) do nothing;

select chave, ativo_todos, cardinality(usuarios) contas_liberadas from public.exa2_flags;
