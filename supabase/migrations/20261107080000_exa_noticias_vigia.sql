-- NOTÍCIAS: disparo confiável + vigia com diagnóstico (07/11/2026)
-- Problema: o agendador do GitHub Actions atrasa 4–7 h (05–07/11 as edições da manhã saíram às 13h55/16h55 ou nem saíram).
-- Solução: quem manda rodar é o pg_cron do Supabase (pontual), chamando o GitHub por workflow_dispatch (começa em ~1 min).
-- Vigia: 07h30–08h40 e 16h30–17h40 confere se Brasil e Foz subiram; se não, descobre o motivo pelo GitHub,
-- redispara uma vez e a Sofia avisa o CEO com o motivo e o que foi feito; avisa de novo quando resolver.
-- Precisa de exa2_config.github_token (token fine-grained só do repo exa-solucoes, permissão Actions: read/write).

create table if not exists public.exa_noticias_vigia (
  dia date not null,
  turno text not null,                 -- manha | tarde
  req_runs bigint,                     -- pedido pg_net da lista de rodadas no GitHub
  diagnostico text,
  redisparo_em timestamptz,
  avisado_em timestamptz,
  resolvido_em timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (dia, turno)
);
alter table public.exa_noticias_vigia enable row level security;

-- dispara a rodada das notícias no GitHub (workflow_dispatch). Retorna o id do pedido pg_net (ou null sem token).
create or replace function public.exa_noticias_disparar(p_quais text default 'brasil e foz')
returns bigint language plpgsql security definer set search_path = public as $$
declare tok text := (select valor from public.exa2_config where chave = 'github_token');
begin
  if tok is null or tok = '' then return null; end if;
  return net.http_post(
    url := 'https://api.github.com/repos/jefersonstilver-sudo/exa-solucoes/actions/workflows/noticias.yml/dispatches',
    headers := jsonb_build_object('Authorization', 'Bearer ' || tok, 'Accept', 'application/vnd.github+json',
      'User-Agent', 'exa-supabase', 'X-GitHub-Api-Version', '2022-11-28', 'Content-Type', 'application/json'),
    body := jsonb_build_object('ref', 'main', 'inputs', jsonb_build_object('publicar', 'sim', 'quais', p_quais)),
    timeout_milliseconds := 20000);
end; $$;

create or replace function public.exa_noticias_vigiar(p_forcar boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  agora_br timestamp := now() at time zone 'America/Sao_Paulo';
  hm int := extract(hour from agora_br)::int * 100 + extract(minute from agora_br)::int;
  vt text; inicio timestamptz; v record;
  tok text := (select valor from public.exa2_config where chave = 'github_token');
  ceo text := coalesce((select telefone from public.exa_alerts_directors where departamento = 'CEO' and ativo order by created_at limit 1), '45998090000');
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk';
  b_ok boolean; f_ok boolean; faltam text;
  resp record; runs jsonb; r jsonb; st text; conc text; criado timestamptz; url_run text;
  diag text; acao text := ''; texto text;
begin
  if hm between 730 and 840 then vt := 'manha'; inicio := (date_trunc('day', agora_br) + interval '6 hours') at time zone 'America/Sao_Paulo';
  elsif hm between 1630 and 1740 then vt := 'tarde'; inicio := (date_trunc('day', agora_br) + interval '15 hours') at time zone 'America/Sao_Paulo';
  elsif p_forcar then vt := case when hm < 1500 then 'manha' else 'tarde' end;
    inicio := (date_trunc('day', agora_br) + case when vt = 'manha' then interval '6 hours' else interval '15 hours' end) at time zone 'America/Sao_Paulo';
  else return jsonb_build_object('fora_do_horario', true); end if;

  select exists(select 1 from pedido_videos where pedido_id = 'c08f3154-e0dc-4c39-b8a2-721d8acdde7f' and is_base_video and created_at >= inicio) into b_ok;
  select exists(select 1 from pedido_videos where pedido_id = '9cb8da99-ddb3-491c-b58c-63871eadc4cb' and is_base_video and created_at >= inicio) into f_ok;
  insert into exa_noticias_vigia (dia, turno) values (agora_br::date, vt) on conflict do nothing;
  select * into v from exa_noticias_vigia where dia = agora_br::date and exa_noticias_vigia.turno = vt;

  if b_ok and f_ok then
    if v.avisado_em is not null and v.resolvido_em is null then
      perform net.http_post(url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zapi-send-message',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon, 'apikey', anon),
        body := jsonb_build_object('agentKey', 'sofia', 'phone', ceo, 'message',
          'Jeferson, aqui é a Sofia. ✅ *Notícias da ' || replace(vt, 'manha', 'manhã') || '* resolvidas: Brasil e Foz já estão no ar nas telas.'));
      update exa_noticias_vigia set resolvido_em = now(), atualizado_em = now() where dia = v.dia and exa_noticias_vigia.turno = v.turno;
    end if;
    return jsonb_build_object('turno', vt, 'ok', true);
  end if;
  faltam := concat_ws(' e ', case when not b_ok then 'Brasil' end, case when not f_ok then 'Foz' end);

  -- 1) pede ao GitHub a lista das últimas rodadas (resposta chega na próxima volta do vigia)
  if v.req_runs is null then
    update exa_noticias_vigia set atualizado_em = now(), req_runs = net.http_get(
      url := 'https://api.github.com/repos/jefersonstilver-sudo/exa-solucoes/actions/workflows/noticias.yml/runs?per_page=5',
      headers := case when tok is null then jsonb_build_object('User-Agent', 'exa-supabase', 'Accept', 'application/vnd.github+json')
                 else jsonb_build_object('User-Agent', 'exa-supabase', 'Accept', 'application/vnd.github+json', 'Authorization', 'Bearer ' || tok) end,
      timeout_milliseconds := 20000)
      where dia = v.dia and exa_noticias_vigia.turno = v.turno;
    return jsonb_build_object('turno', vt, 'faltam', faltam, 'etapa', 'consultando GitHub');
  end if;
  if v.avisado_em is not null and not p_forcar then return jsonb_build_object('turno', vt, 'faltam', faltam, 'ja_avisado', true); end if;

  -- 2) lê a resposta e monta o diagnóstico
  select status_code, content into resp from net._http_response where id = v.req_runs;
  if resp.status_code is null then return jsonb_build_object('turno', vt, 'etapa', 'aguardando GitHub'); end if;
  runs := coalesce((resp.content::jsonb)->'workflow_runs', '[]'::jsonb);
  select x into r from jsonb_array_elements(runs) x where (x->>'created_at')::timestamptz >= inicio - interval '30 minutes' order by (x->>'created_at') desc limit 1;
  if r is null then
    diag := 'a rodada das notícias não começou: o disparo automático não chegou ao GitHub' || case when tok is null then ' (falta o token do GitHub no sistema para o disparo pontual)' else '' end || '.';
  else
    st := r->>'status'; conc := r->>'conclusion'; criado := (r->>'created_at')::timestamptz; url_run := r->>'html_url';
    if st in ('queued', 'waiting', 'pending', 'requested') then diag := 'a rodada está na fila do GitHub desde ' || to_char(criado at time zone 'America/Sao_Paulo', 'HH24:MI') || ' (lentidão do GitHub).';
    elsif st = 'in_progress' then diag := 'a rodada começou às ' || to_char(criado at time zone 'America/Sao_Paulo', 'HH24:MI') || ' e ainda está gerando os vídeos.';
    elsif conc = 'success' then diag := 'a rodada terminou sem erro mas ' || faltam || ' não trocou: provavelmente a fonte (CNN / Portal da Cidade) não tinha matérias novas suficientes ou a publicação foi recusada. Detalhes: ' || url_run;
    else diag := 'a rodada das ' || to_char(criado at time zone 'America/Sao_Paulo', 'HH24:MI') || ' falhou (' || coalesce(conc, st) || '). Detalhes: ' || url_run;
    end if;
  end if;

  -- 3) resolve sozinho: redispara uma vez se não há rodada andando
  if v.redisparo_em is null and (r is null or (st = 'completed')) then
    if exa_noticias_disparar(case when b_ok then 'foz' when f_ok then 'brasil' else 'brasil e foz' end) is not null then
      acao := 'Já mandei gerar de novo agora; em uns 15 minutos deve estar no ar e eu te confirmo.';
      update exa_noticias_vigia set redisparo_em = now() where dia = v.dia and exa_noticias_vigia.turno = v.turno;
    else acao := 'Não consegui redisparar sozinha (sem token do GitHub). Peça ao Claude para disparar.'; end if;
  elsif st in ('queued', 'waiting', 'pending', 'requested', 'in_progress') then acao := 'Vou acompanhar e te aviso quando subir.';
  else acao := 'Já redisparei uma vez e não resolveu: precisa de uma olhada do Claude.'; end if;

  texto := 'Jeferson, aqui é a Sofia. 📰 *Notícias da ' || replace(vt, 'manha', 'manhã') || ' não subiram* (' || faltam || ').' || E'\n\n' ||
           '*Motivo:* ' || diag || E'\n\n' || acao;
  perform net.http_post(url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zapi-send-message',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon, 'apikey', anon),
    body := jsonb_build_object('agentKey', 'sofia', 'phone', ceo, 'message', texto), timeout_milliseconds := 30000);
  update exa_noticias_vigia set diagnostico = diag, avisado_em = now(), atualizado_em = now() where dia = v.dia and exa_noticias_vigia.turno = v.turno;
  return jsonb_build_object('turno', vt, 'faltam', faltam, 'diagnostico', diag, 'acao', acao);
end; $$;
revoke all on function public.exa_noticias_vigiar(boolean) from public, anon, authenticated;
revoke all on function public.exa_noticias_disparar(text) from public, anon, authenticated;

-- disparo pontual (UTC): 06h35 e 15h35 de Brasília
select cron.unschedule(jobname) from cron.job where jobname in ('exa-noticias-manha', 'exa-noticias-tarde', 'exa-noticias-vigia');
select cron.schedule('exa-noticias-manha', '35 9 * * *', $$select public.exa_noticias_disparar()$$);
select cron.schedule('exa-noticias-tarde', '35 18 * * *', $$select public.exa_noticias_disparar()$$);
-- vigia a cada 5 min (a função só age 07h30–08h40 e 16h30–17h40)
select cron.schedule('exa-noticias-vigia', '*/5 10,11,19,20 * * *', $$select public.exa_noticias_vigiar()$$);
