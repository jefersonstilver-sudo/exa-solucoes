-- EXA 2.0 — Auditoria diária + alertas da rede, enviados pela Sofia ao CEO.
-- Memória dos alertas (cada problema avisa 1x; lembra a cada 12 h; avisa quando volta ao normal).
create table if not exists public.exa2_monitor_estado (
  chave         text primary key,      -- ex.: offline:<device>, temp:<tela>, monitor:<tela>
  severidade    text not null,         -- critico | atencao
  predio        text,
  mensagem      text,
  primeiro_em   timestamptz not null default now(),
  ultimo_em     timestamptz not null default now(),
  notificado_em timestamptz,
  resolvido_em  timestamptz
);
alter table public.exa2_monitor_estado enable row level security;
drop policy if exists "Admins veem monitor" on public.exa2_monitor_estado;
create policy "Admins veem monitor" on public.exa2_monitor_estado for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

-- 07:30 (Brasília) = 10:30 UTC: relatório completo
do $$ begin perform cron.unschedule('exa2-auditoria-diaria'); exception when others then null; end $$;
select cron.schedule('exa2-auditoria-diaria', '30 10 * * *', $cron$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-auditoria-diaria',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{"modo":"diario"}'::jsonb,
    timeout_milliseconds := 120000);
$cron$);

-- a cada 10 min: só problemas críticos novos / normalizados
do $$ begin perform cron.unschedule('exa2-auditoria-alerta'); exception when others then null; end $$;
select cron.schedule('exa2-auditoria-alerta', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-auditoria-diaria',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{"modo":"alerta"}'::jsonb,
    timeout_milliseconds := 120000);
$cron$);

select 'OK: auditoria diaria 07:30 e alertas a cada 10 min' as resultado;
