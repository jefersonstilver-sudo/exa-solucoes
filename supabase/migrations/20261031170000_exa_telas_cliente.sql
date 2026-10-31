-- EXA · Telas novas — portal do restaurante e alertas de queda (31/10/2026)
-- O restaurante (dono do pedido "da casa" de um local comércio) conecta as próprias telas pelo código,
-- até o limite do pedido, escolhe layout e acompanha o monitor. Tudo passa pela função exa-tela
-- (ações cliente_*), que confere o dono — as tabelas continuam fechadas para clientes.

-- quantas telas o cliente pode conectar sozinho com este pedido (0 = só a EXA conecta)
alter table public.pedidos add column if not exists telas_comercio integer not null default 0;
comment on column public.pedidos.telas_comercio is 'Telas que o dono deste pedido (pedido da casa de um local comércio) pode conectar sozinho na área do cliente';

-- saúde enviada pelo aparelho a cada batimento e memória dos alertas de queda
alter table public.exa_telas add column if not exists saude jsonb;
alter table public.exa_telas add column if not exists offline_desde timestamptz;
alter table public.exa_telas add column if not exists alerta_offline_em timestamptz;
alter table public.exa_telas add column if not exists conectada_por text; -- 'equipe' | 'cliente'

-- vigia das telas a cada 5 min (mesmo token interno dos outros vigias)
select cron.unschedule('exa-telas-vigia') where exists (select 1 from cron.job where jobname = 'exa-telas-vigia');
select cron.schedule('exa-telas-vigia', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa-tela',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{"acao":"vigia"}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);
