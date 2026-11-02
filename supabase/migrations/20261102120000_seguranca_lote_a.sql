-- EXA · segurança lote A (02/11/2026). Tudo numa transação: se algo falhar, nada muda.
begin;

-- 1) Quem é equipe? (para as funções do painel admin). Chamada interna (cron, service role) passa.
create or replace function public.exa_eh_equipe(papeis text[] default array['super_admin','admin','admin_financeiro','admin_departamental','comercial'])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.role(),'') not in ('anon','authenticated')
      or exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role::text = any(papeis));
$$;
revoke all on function public.exa_eh_equipe(text[]) from public, anon;
grant execute on function public.exa_eh_equipe(text[]) to authenticated, service_role;

-- 2) Cadastro público não escolhe mais o próprio papel (antes: options.data.role='super_admin' virava super_admin)
do $$ declare d text; begin
  select pg_get_functiondef('public.handle_auth_user_created_unified()'::regprocedure) into d;
  if position($q$COALESCE(NEW.raw_user_meta_data->>'role', 'client')$q$ in d) = 0 then raise exception 'trigger de cadastro mudou; revisar'; end if;
  execute replace(d, $q$COALESCE(NEW.raw_user_meta_data->>'role', 'client')$q$, $q$COALESCE(NEW.raw_app_meta_data->>'role', 'client')$q$);
end $$;

-- 3) Funções internas sem checagem que qualquer um chamava pela API: só servidor (service role/cron) daqui pra frente
do $$ declare f record; n int := 0; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p
    where p.pronamespace='public'::regnamespace and p.prosecdef and p.proname = any(array['admin_check_user_exists','admin_get_all_user_ids','admin_insert_user','admin_mark_pedido_as_paid','archive_expired_proposals','audit_unauthorized_uploads','auto_cancel_expired_orders','auto_cancel_orders_5h','auto_cleanup_paid_attempts','auto_fix_lost_transactions','calcular_metricas_investimento','cancel_expired_orders','clean_old_navigation_history','cleanup_expired_blocked_ips','cleanup_expired_sessions','cleanup_expired_user_sessions','cleanup_old_logs','cleanup_orphaned_users','cleanup_unauthorized_uploads','criar_alerta_financeiro','daily_financial_reconciliation','detect_duplicate_payments','detect_financial_anomalies','detect_suspicious_financial_access','diagnose_user_system','emergency_financial_audit_and_fix','ensure_video_consistency','exa2_avisar_sync','extract_compliance_data','investigate_missing_transaction','limpar_codigos_expirados','log_payment_processing_secure','log_payment_status_change_secure','marcar_paineis_offline','mercadopago_reconciliation_check','migrate_orphaned_payments','notify_contracts_expiring_soon','process_mercadopago_webhook','process_mercadopago_webhook_enhanced','process_mercadopago_webhook_with_cleanup','refresh_dashboard_metrics','register_payment_processing','registrar_log_financeiro','resolve_email_conflicts','resolver_alerta_financeiro','safe_create_admin_user','switch_video_selection','update_device_alert_metadata','update_expired_contracts_daily','select_video_for_display','get_user_activity_summary','get_real_approval_stats','get_pending_approval_videos','get_recently_approved_videos'])
      and not exists (select 1 from pg_policies pp where coalesce(pp.qual,'')||coalesce(pp.with_check,'') ~ ('\m'||p.proname||'\M'))
      and not exists (select 1 from pg_views v where v.schemaname='public' and v.definition ~ ('\m'||p.proname||'\M'))
      and not exists (select 1 from pg_proc q where q.pronamespace='public'::regnamespace and not q.prosecdef and q.oid<>p.oid and q.prokind='f' and pg_get_functiondef(q.oid) ~ ('\m'||p.proname||'\M'))
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    n := n + 1;
  end loop;
  raise notice 'revogadas: %', n;
end $$;

-- 4) Funções do painel admin: anônimo não chama; logado só se for equipe
do $$ declare f record; d text; nd text; n int := 0; begin
  for f in select p.oid, p.oid::regprocedure sig, p.proname, l.lanname from pg_proc p join pg_language l on l.oid=p.prolang
    where p.pronamespace='public'::regnamespace and p.prosecdef and p.proname = any(array['approve_video','atualizar_dias_atraso_cobrancas','auto_recovery_system','calcular_impostos_mes','generate_secure_temp_password','gerar_cobrancas_mensais','gerar_fluxo_despesas_fixas','get_orders_stats_real','get_paid_orders_without_video','get_real_revenue','get_users_with_last_access','monitor_system_health','reject_video','reset_device_alert_metadata_for_rule'])
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.lanname = 'plpgsql' then
      d := pg_get_functiondef(f.oid);
      nd := regexp_replace(d, '\mBEGIN\M', 'BEGIN' || chr(10) || '  IF NOT public.exa_eh_equipe() THEN RAISE EXCEPTION ''não autorizado'' USING ERRCODE = ''42501''; END IF;', 'i');
      if nd <> d then execute nd; n := n + 1; end if;
    end if;
  end loop;
  raise notice 'protegidas: %', n;
end $$;

-- 5) Troca de papel: só super_admin de verdade (antes confiava no p_admin_id que vinha do navegador)
do $$ declare d text; nd text; begin
  for d in select pg_get_functiondef(p.oid) from pg_proc p where p.pronamespace='public'::regnamespace and p.proname='admin_update_user_role_secure' loop
    nd := regexp_replace(d, '\mBEGIN\M', 'BEGIN' || chr(10) || '  IF NOT public.exa_eh_equipe(array[''super_admin'']) THEN RAISE EXCEPTION ''não autorizado'' USING ERRCODE = ''42501''; END IF;', 'i');
    execute nd;
  end loop;
end $$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p where p.pronamespace='public'::regnamespace and p.proname='admin_update_user_role_secure'
  loop execute format('revoke execute on function %s from public, anon', f.sig); end loop;
end $$;

commit;
