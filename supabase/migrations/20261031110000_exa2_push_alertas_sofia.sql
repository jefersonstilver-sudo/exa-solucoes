-- EXA 2.0 · Todo alerta que a Sofia manda ao CEO no WhatsApp ([ALERTA] em sofia_messages) também vira
-- aviso no app do iPhone (exa2-push). Não mexe na sofia-agent. Falha aqui nunca impede a mensagem de gravar.
create or replace function public.exa2_push_alerta_sofia() returns trigger
language plpgsql security definer set search_path = public as $$
declare tok text; corpo text; titulo text; destino text; m text[];
begin
  if new.direction is distinct from 'out_bot' or new.body is null or left(new.body, 9) <> '[ALERTA] ' then return new; end if;
  select valor into tok from public.exa2_config where chave = 'cron_token';
  if tok is null then return new; end if;
  corpo := regexp_replace(substr(new.body, 10), '\s+', ' ', 'g');
  titulo := case
    when corpo ilike 'OCORR%' then 'Ocorrência da Sofia'
    when corpo ilike 'Venda conclu%' then 'Venda fechada'
    when corpo ilike '%V_DEO COM FALHA%' then 'Vídeo com falha'
    when corpo ilike '%pronto para%' or corpo ilike '%teste ENVIADO%' then 'Vídeo pronto'
    when corpo ilike '%aprova%' then 'Vídeo para aprovar'
    when corpo ilike 'ALERTA%' or corpo ilike 'BLOQUEADO%' or corpo ilike 'ATEN__O%' then 'Alerta da Sofia'
    else 'Sofia' end;
  m := regexp_match(corpo, 'examidia\.com\.br(/v/[0-9a-f-]{36})');
  destino := coalesce(m[1], case when corpo ilike '%super_admin/aprovacoes%' then '/super_admin/aprovacoes' else '/super_admin' end);
  perform net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-exa2-cron', tok),
    body := jsonb_build_object('action', 'enviar', 'para', 'ceo', 'titulo', titulo, 'corpo', left(corpo, 300),
                               'url', destino, 'tipo', 'sofia', 'tag', 'sofia-' || left(md5(corpo), 12)));
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists exa2_push_sofia on public.sofia_messages;
create trigger exa2_push_sofia after insert on public.sofia_messages
  for each row execute function public.exa2_push_alerta_sofia();
