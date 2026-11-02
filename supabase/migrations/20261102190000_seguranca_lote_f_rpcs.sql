-- EXA · segurança lote F (02/11/2026): funções SECURITY DEFINER sem checagem que anônimo podia chamar.
-- Critério: nenhuma tela, função do Supabase, Sofia, painel ou NUC chama estas pelo navegador (grep no repositório).
-- Chamadas internas (outra função do banco, cron, service role) continuam funcionando: rodam como dono ou service_role.
begin;

-- backup das permissões e definições
insert into public.seg_backup_20261102 (tipo, nome, def)
select 'loteF_function', p.oid::regprocedure::text,
       jsonb_build_object('def', pg_get_functiondef(p.oid), 'acl', p.proacl::text)
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname = any (array[
    'calcular_metricas_investimento','calculate_conversation_heat','calculate_device_stats','check_panel_availability',
    'check_payment_already_processed','check_user_data_integrity','check_video_schedule_conflict','get_active_videos_for_panel',
    'get_building_names_public','get_current_display_videos_batch','increment_conversation_analytics','insert_system_log',
    'is_user_admin','log_system_activity','submit_lead_produtora','update_conversation_heat_metrics','user_autocomplete_upsert',
    'validate_cupom','validate_video_specs','validate_video_upload_permission','get_user_behavior_summary']);

-- 1) sem uso pelo navegador: só servidor
do $$
declare f record; n int := 0;
begin
  for f in select p.oid::regprocedure sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prosecdef
      and p.proname = any (array[
        'calcular_metricas_investimento','calculate_conversation_heat','calculate_device_stats','check_panel_availability',
        'check_payment_already_processed','check_user_data_integrity','check_video_schedule_conflict','get_active_videos_for_panel',
        'get_building_names_public','get_current_display_videos_batch','increment_conversation_analytics','insert_system_log',
        'is_user_admin','log_system_activity','submit_lead_produtora','update_conversation_heat_metrics','user_autocomplete_upsert',
        'validate_cupom','validate_video_specs','validate_video_upload_permission'])
      and not exists (select 1 from pg_policies pp where coalesce(pp.qual,'')||coalesce(pp.with_check,'') ~ ('\m'||p.proname||'\M'))
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    n := n + 1;
  end loop;
  raise notice 'lote F: % funcoes so para o servidor', n;
end $$;

-- 2) histórico de navegação: só o próprio usuário ou a equipe (antes qualquer um lia o de qualquer pessoa)
do $$
declare d text; nd text;
begin
  for d in select pg_get_functiondef(p.oid) from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname = 'get_user_behavior_summary' loop
    if position('exa_eh_equipe' in d) > 0 then continue; end if;
    nd := regexp_replace(d, '\mBEGIN\M',
      'BEGIN' || chr(10) || '  IF NOT (target_user_id = auth.uid() OR public.exa_eh_equipe()) THEN RAISE EXCEPTION ''não autorizado'' USING ERRCODE = ''42501''; END IF;', 'i');
    if nd = d then raise exception 'get_user_behavior_summary: BEGIN nao encontrado'; end if;
    execute nd;
  end loop;
end $$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p where p.pronamespace='public'::regnamespace and p.proname='get_user_behavior_summary'
  loop execute format('revoke execute on function %s from public, anon', f.sig); end loop;
end $$;

commit;
