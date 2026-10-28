-- EXA 2.0 — telas_registrar_saude v2: passa a RESPONDER se gravou ('ok') ou por que ignorou.
-- Antes respondia vazio e o NUC mostrava "ENVIADO" mesmo quando a leitura era descartada (limite de 5 min).
-- Coletores antigos continuam funcionando (só olham se a resposta foi 200).
begin;
drop function if exists public.telas_registrar_saude(jsonb);
create function public.telas_registrar_saude(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id  text := p->>'cliente_id';
  v_nuc text := left(coalesce(p->>'nuc_id', ''), 40);
begin
  if v_id is null then return 'ignorado: sem cliente_id'; end if;
  if length(p::text) > 30000 then return 'ignorado: leitura grande demais'; end if;
  if not exists (select 1 from public.updates_clientes where cliente_id = v_id) then
    return 'ignorado: tela desconhecida';
  end if;
  -- no máx. 1 registro a cada 4 min por NUC (protege contra envio em laço; o agendado é de 15 em 15)
  if exists (select 1 from public.telas_saude where cliente_id = v_id and nuc_id = v_nuc and visto_em > now() - interval '4 minutes') then
    return 'ignorado: limite de 1 leitura a cada 4 min';
  end if;
  insert into public.telas_saude (cliente_id, nuc_id, anydesk_id, dados, visto_em) values (v_id, v_nuc, p->>'anydesk_id', p, now())
  on conflict (cliente_id, nuc_id) do update set dados = excluded.dados, anydesk_id = excluded.anydesk_id, visto_em = now();
  insert into public.telas_saude_log (cliente_id, nuc_id, dados) values (v_id, v_nuc, p);
  if random() < 0.01 then
    delete from public.telas_saude_log where visto_em < now() - interval '30 days';
  end if;
  return 'ok';
end $$;
revoke all on function public.telas_registrar_saude(jsonb) from public;
grant execute on function public.telas_registrar_saude(jsonb) to anon, authenticated, service_role;
commit;
