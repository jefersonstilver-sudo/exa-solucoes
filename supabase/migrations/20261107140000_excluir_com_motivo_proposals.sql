-- 07/11/2026 — exclusão com motivo também para propostas (proposals): apaga views/logs e solta o vínculo dos pedidos.
create or replace function public.admin_excluir_com_motivo(p_tabela text, p_id text, p_motivo text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_dados jsonb; v_email text;
begin
  if not exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','super_admin')) then raise exception 'sem permissão'; end if;
  if p_tabela not in ('sindicos_interessados','contacts','sofia_contacts','proposals') then raise exception 'tabela não permitida'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'informe o motivo'; end if;
  execute format('select to_jsonb(t) from %I t where t.id::text = $1', p_tabela) into v_dados using p_id;
  if v_dados is null then raise exception 'registro não encontrado'; end if;
  select email into v_email from public.users where id = auth.uid();
  insert into public.admin_auditoria_log (tabela, registro_id, acao, motivo, dados, por, por_email)
  values (p_tabela, p_id, 'excluir', p_motivo, v_dados, auth.uid(), v_email);
  if p_tabela = 'contacts' then
    delete from public.contact_audit_logs where contact_id::text = p_id;
    delete from public.contact_files where contact_id::text = p_id;
    delete from public.contact_interactions where contact_id::text = p_id;
    delete from public.contact_notes where contact_id::text = p_id;
    delete from public.calendar_events where contact_id::text = p_id;
    update public.conversations set contact_id = null where contact_id::text = p_id;
    update public.email_threads set client_id = null where client_id::text = p_id;
    update public.emails set client_id = null where client_id::text = p_id;
  end if;
  if p_tabela = 'proposals' then
    update public.pedidos set proposal_id = null where proposal_id::text = p_id;
    delete from public.proposal_views where proposal_id::text = p_id;
    delete from public.proposal_logs where proposal_id::text = p_id;
  end if;
  execute format('delete from %I where id::text = $1', p_tabela) using p_id;
end $function$;
