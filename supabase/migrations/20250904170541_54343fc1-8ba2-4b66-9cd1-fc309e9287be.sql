
-- 1) Função segura para permitir que o dono do pedido (ou admin) altere apenas o nome_pedido
create or replace function public.set_pedido_nome(p_pedido_id uuid, p_nome text)
returns table (id uuid, nome_pedido text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_is_admin boolean := false;
  v_new_name text;
begin
  -- Verifica se o usuário autenticado é admin/super_admin
  select exists(
    select 1 from public.users
    where users.id = auth.uid()
      and users.role in ('admin', 'super_admin')
  ) into v_is_admin;

  -- Busca o client_id do pedido
  select client_id
    into v_client_id
  from public.pedidos
  where id = p_pedido_id;

  if v_client_id is null then
    raise exception 'Pedido não encontrado';
  end if;

  -- Verifica se o usuário pode editar: dono do pedido OU admin
  if not v_is_admin and v_client_id <> auth.uid() then
    raise exception 'Acesso negado: você não pode alterar este pedido';
  end if;

  -- Nome normalizado (permite limpar nome passando vazio/null)
  v_new_name := nullif(btrim(coalesce(p_nome, '')), '');

  -- Atualiza somente o nome_pedido
  update public.pedidos
     set nome_pedido = v_new_name
   where id = p_pedido_id
  returning pedidos.id, pedidos.nome_pedido
    into id, nome_pedido;

  return;
end;
$$;

-- 2) Permitir execução da função para usuários autenticados
grant execute on function public.set_pedido_nome(uuid, text) to authenticated;

-- 3) Garantir Realtime na tabela pedidos (idempotente)
alter table public.pedidos replica identity full;

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'pedidos'
  ) then
    alter publication supabase_realtime add table public.pedidos;
  end if;
end
$$;
