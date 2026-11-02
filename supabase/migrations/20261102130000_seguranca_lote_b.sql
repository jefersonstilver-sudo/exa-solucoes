-- EXA · segurança lote B (02/11/2026): tabelas internas que estavam com política "true".
-- Rodar DEPOIS do lote A (usa public.exa_eh_equipe). Tudo numa transação.
begin;

-- políticas de tabela que se aplicam a anônimo precisam poder avaliar a função (ela devolve false para anônimo)
grant execute on function public.exa_eh_equipe(text[]) to anon;

do $$
declare
  -- só a equipe usa (CRM, financeiro, Sofia admin, tarefas): leitura E escrita passam a exigir equipe
  so_equipe text[] := array['conversations','messages','extrato_bancario','knowledge_base','mp_transactions_cache','vendas',
    'contact_notes','contact_files','report_access_tokens','report_director_links','sofia_admin_sessions',
    'retornos_investimento','despesas_predios','signatarios_exa',
    'quick_replies','provider_alerts','conversation_heat_metrics','contact_scoring_config','contact_scoring_rules',
    'task_read_receipts','task_reminders','task_participantes','task_propostas','tarefas_geradas','juridico_prompts',
    'agent_knowledge_items','agent_sections','contact_types',
    'exclusividades_segmento','tarefa_regras','exa2_flags','configuracoes_sistema','categorias_despesas'];
  -- leitura continua como está (site, checkout, monitor público); só a escrita "true" passa a exigir equipe
  escrita_equipe text[] := array['painels','devices','device_groups','building_geocodes','incident_categories','paineis_status',
    'uptime_records','connection_history','generated_reports'];
  -- logs: gravação continua livre (triggers de ações de cliente gravam aqui); só LER passa a exigir equipe
  so_leitura text[] := array['events_log','active_sessions_monitor','conversation_events','contact_interactions','agent_logs','api_sync_logs','contact_audit_logs','notion_task_sync_logs','sofia_admin_access_logs','task_notification_queue','evolution_logs'];
  p record; n int := 0; cond text := 'public.exa_eh_equipe()';
begin
  for p in
    select pol.tablename t, pol.policyname nome, pol.cmd,
           trim(coalesce(pol.qual,'')) in ('true','(true)') q_true,
           trim(coalesce(pol.with_check,'')) in ('true','(true)') c_true
    from pg_policies pol
    where pol.schemaname='public' and pol.permissive='PERMISSIVE'
      and pol.roles && array['public','anon','authenticated']::name[]
      and (pol.tablename = any(so_equipe) or (pol.tablename = any(escrita_equipe) and pol.cmd <> 'SELECT') or (pol.tablename = any(so_leitura) and pol.cmd <> 'INSERT'))
      and (trim(coalesce(pol.qual,'')) in ('true','(true)') or trim(coalesce(pol.with_check,'')) in ('true','(true)'))
  loop
    if p.t = any(so_leitura) then
      if p.cmd in ('SELECT','DELETE') then execute format('alter policy %I on public.%I using (%s)', p.nome, p.t, cond);
      else execute format('alter policy %I on public.%I using (%s) with check (true)', p.nome, p.t, cond); end if;
    elsif p.cmd = 'INSERT' then
      execute format('alter policy %I on public.%I with check (%s)', p.nome, p.t, cond);
    elsif p.cmd in ('SELECT','DELETE') then
      execute format('alter policy %I on public.%I using (%s)', p.nome, p.t, cond);
    else -- UPDATE / ALL
      execute format('alter policy %I on public.%I using (%s) with check (%s)', p.nome, p.t, cond, cond);
    end if;
    n := n + 1;
  end loop;
  raise notice 'políticas fechadas: %', n;
end $$;

-- radar de conteúdo: o aviso por WhatsApp ia com a anon key; zapi-send-message agora exige chamada interna
do $$ declare d text; velho text := $v$'Authorization', 'Bearer ' || anon, 'apikey', anon)$v$;
  novo text := $v$'Authorization', 'Bearer ' || anon, 'apikey', anon, 'x-exa2-cron', (select valor from public.exa2_config where chave = 'cron_token'))$v$;
begin
  select pg_get_functiondef('public.exa_radar_conteudo_rodar(boolean,boolean)'::regprocedure) into d;
  if position(velho in d) = 0 then raise notice 'radar: trecho não encontrado, revisar à mão'; else execute replace(d, velho, novo); end if;
end $$;

commit;
