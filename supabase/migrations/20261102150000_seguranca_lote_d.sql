-- EXA · segurança lote D (02/11/2026, aplicado no banco). Backup em public.seg_backup_20261102 (tipo 'loteD_policy').
-- 1) pedidos: "admins_cannot_modify_own_pedidos" era PERMISSIVE (FOR ALL, TO public) e, para anônimo, liberava ler/alterar/apagar
--    TODOS os pedidos. Recriada como RESTRITIVA, só para UPDATE e DELETE (a intenção original).
do $$ declare q text; begin
  select qual into q from pg_policies where schemaname='public' and tablename='pedidos' and policyname='admins_cannot_modify_own_pedidos';
  if q is null then return; end if;
  execute 'drop policy admins_cannot_modify_own_pedidos on public.pedidos';
  execute format('create policy admins_cannot_update_own_pedidos on public.pedidos as restrictive for update to public using (%s)', q);
  execute format('create policy admins_cannot_delete_own_pedidos on public.pedidos as restrictive for delete to public using (%s)', q);
end $$;
-- 2) agents: tokens (zapi_config, chaves) legíveis por qualquer visitante
alter policy "Public can read active agents" on public.agents using ((is_active = true) and public.exa_eh_equipe());
-- 3) RPCs do painel com dados de clientes e números da empresa: sem anônimo; as plpgsql exigem equipe
do $$ declare f record; d text; begin
  for f in select p.oid, p.oid::regprocedure sig, l.lanname from pg_proc p join pg_language l on l.oid=p.prolang
    where p.pronamespace='public'::regnamespace and p.prosecdef and p.proname = any(array['get_pedidos_com_clientes','get_user_stats','get_coupon_stats','generate_coupon_code','get_provider_benefits_stats_by_month','get_dashboard_stats','get_dashboard_stats_by_month','get_last_12_months_stats','get_monthly_comparison','get_approvals_stats'])
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.lanname = 'plpgsql' then
      d := pg_get_functiondef(f.oid);
      if position('exa_eh_equipe' in d) = 0 then
        execute regexp_replace(d, '\mBEGIN\M', 'BEGIN' || chr(10) || '  IF NOT public.exa_eh_equipe() THEN RAISE EXCEPTION ''não autorizado'' USING ERRCODE = ''42501''; END IF;', 'i');
      end if;
    end if;
  end loop;
end $$;
