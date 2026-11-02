-- EXA · segurança (02/11/2026, 14h): já aplicado em produção pelo SQL Editor; registrado aqui para histórico.

-- 1) Token dos webhooks da Evolution (nando-webhook e evolution-webhook leem com service role; RLS sem política = ninguém mais lê).
--    O valor real foi gerado no banco e NÃO fica no repositório. Para trocar: gere outro valor e rode ?action=setup nas duas funções.
insert into public.exa2_config (chave, valor, updated_at)
select 'evo_webhook_token', encode(extensions.gen_random_bytes(24), 'hex'), now()
where not exists (select 1 from public.exa2_config where chave = 'evo_webhook_token');
-- '0' = transição (sem token passa com aviso no log); '1' = sem token é recusado. Token errado é sempre recusado.
insert into public.exa2_config (chave, valor, updated_at)
select 'evo_webhook_exigir', '0', now()
where not exists (select 1 from public.exa2_config where chave = 'evo_webhook_exigir');

-- 2) Recadastro das URLs na Evolution com o token (a chamada sai do banco; o token não aparece em lugar nenhum):
-- select net.http_post(url := '<SUPABASE_URL>/functions/v1/nando-webhook?action=setup',
--   headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')), body := '{}'::jsonb);
-- (idem para evolution-webhook)

-- 3) Correção do lote 5: as rotinas abaixo chamavam funções que passaram a exigir sistema, mas ainda mandavam só a anon key
--    e recebiam 401 desde ~11h15 até 14h13. Agora mandam x-exa2-cron. Comandos antigos em seg_backup_20261102 (tipo 'cron').
do $do$
declare j record; novo text;
begin
  for j in select jobid, command from cron.job
           where jobname in ('video-status-updater-job','sync-anydesk-auto','sync-notion-every-10min','sync-anydesk-status-every-5min','task-reminder-scheduler-cron')
             and command not ilike '%x-exa2-cron%' loop
    novo := regexp_replace(j.command, $r$(headers\s*:=\s*)('[^']*'::jsonb)$r$,
      $s$\1(\2 || jsonb_build_object('x-exa2-cron', (select valor from public.exa2_config where chave = 'cron_token')))$s$);
    if novo = j.command then
      novo := regexp_replace(j.command, $r$(headers\s*:=\s*jsonb_build_object\(\s*)$r$,
        $s$\1'x-exa2-cron', (select valor from public.exa2_config where chave = 'cron_token'), $s$);
    end if;
    if novo <> j.command then perform cron.alter_job(j.jobid, command := novo); end if;
  end loop;
end $do$;
