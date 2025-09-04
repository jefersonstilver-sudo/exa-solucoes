
-- Função segura para atualizar o apelido do pedido
create or replace function public.set_pedido_nome(
  p_pedido_id uuid,
  p_nome text
)
returns table (
  id uuid,
  nome_pedido text
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_allowed boolean;
  v_trimmed text;
begin
  -- Exigir usuário autenticado
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Verificar se o usuário pode acessar este pedido (dono ou admin/super_admin)
  v_allowed := public.can_access_pedido_secure(p_pedido_id);
  if not v_allowed then
    raise exception 'ACCESS_DENIED';
  end if;

  v_trimmed := nullif(trim(coalesce(p_nome, '')), '');

  return query
  update public.pedidos
     set nome_pedido = v_trimmed
   where id = p_pedido_id
  returning pedidos.id, pedidos.nome_pedido;
end;
$$;

-- Garantir permissão de execução para usuários autenticados
grant execute on function public.set_pedido_nome(uuid, text) to authenticated;

-- Garantir que realtime capture mudanças completas (idempotente)
alter table public.pedidos replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pedidos'
  ) then
    execute 'alter publication supabase_realtime add table public.pedidos';
  end if;
end $$;
