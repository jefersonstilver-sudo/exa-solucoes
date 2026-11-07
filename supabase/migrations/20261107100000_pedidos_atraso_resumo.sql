-- EXA (07/11/2026) — resumo do que está em atraso por pedido, para os cards da lista de pedidos do admin.
-- Fonte: cobranca_auditoria (a auditoria de cobrança feita cliente a cliente). Só equipe lê.
create or replace function public.pedidos_atraso_resumo()
returns table (
  pedido_id uuid,
  valor_atraso numeric,
  parcelas_atraso integer,
  dias_atraso integer,
  vencimento_mais_antigo date,
  proximo_vencimento date,
  valor_pago numeric,
  parcelas_pagas integer
)
language sql
security definer
set search_path = public
stable
as $$
  with eu as (
    select exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'super-admin')
    ) as ok
  ),
  hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
  select
    c.pedido_id,
    coalesce(sum(c.valor) filter (where c.status = 'aberto' and c.data_vencimento < hoje.d), 0) as valor_atraso,
    count(*) filter (where c.status = 'aberto' and c.data_vencimento < hoje.d)::integer as parcelas_atraso,
    coalesce(max(hoje.d - c.data_vencimento) filter (where c.status = 'aberto' and c.data_vencimento < hoje.d), 0)::integer as dias_atraso,
    min(c.data_vencimento) filter (where c.status = 'aberto' and c.data_vencimento < hoje.d) as vencimento_mais_antigo,
    min(c.data_vencimento) filter (where c.status = 'aberto' and c.data_vencimento >= hoje.d) as proximo_vencimento,
    coalesce(sum(coalesce(c.valor_pago, c.valor)) filter (where c.status = 'pago'), 0) as valor_pago,
    count(*) filter (where c.status = 'pago')::integer as parcelas_pagas
  from public.cobranca_auditoria c, hoje, eu
  where eu.ok
  group by c.pedido_id, hoje.d;
$$;
revoke all on function public.pedidos_atraso_resumo() from public;
grant execute on function public.pedidos_atraso_resumo() to authenticated;
