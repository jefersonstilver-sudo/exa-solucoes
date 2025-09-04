
-- 1) Função segura para atualizar o nome (apelido) do pedido
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
  v_user uuid;
  v_allowed boolean;
  v_trimmed text;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Valida se o usuário pode acessar/alterar este pedido (dono, admin ou super_admin)
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

-- 2) Garantir que o realtime capte mudanças completas de linhas em "pedidos"
alter table public.pedidos replica identity full;

-- 3) Adicionar a tabela "pedidos" à publicação supabase_realtime caso ainda não esteja
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
