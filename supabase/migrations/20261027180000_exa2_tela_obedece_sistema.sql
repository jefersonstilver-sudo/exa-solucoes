-- EXA 2.0 — "A tela obedece ao sistema"
-- 1) Gatilho: qualquer mudança em vídeos, programação, período ou prédios do pedido (site, Sofia, admin, SQL)
--    chama o sincronizador daquele pedido logo após o commit (pg_net é assíncrono: não atrasa a gravação).
--    Vários registros na mesma transação = 1 chamada só por pedido.
-- 2) Rede de segurança: o sincronizador roda para todos os pedidos a cada 5 min
--    (só chama a API das telas quando algo diverge do manifesto).

create extension if not exists pg_net;

create or replace function public.exa2_avisar_sync(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if p_pedido is null then return; end if;
  if current_setting('exa2.sync_' || replace(p_pedido::text, '-', ''), true) = '1' then return; end if;
  perform set_config('exa2.sync_' || replace(p_pedido::text, '-', ''), '1', true);
  select valor into v_token from public.exa2_config where chave = 'cron_token';
  if v_token is null then return; end if;
  perform net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-agenda-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-exa2-cron', v_token),
    body := jsonb_build_object('pedido_id', p_pedido, 'origem', 'gatilho'),
    timeout_milliseconds := 60000);
exception when others then
  raise warning 'exa2_avisar_sync: %', sqlerrm; -- nunca bloqueia a gravação
end $$;

create or replace function public.exa2_tg_pedido_videos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.exa2_avisar_sync(coalesce(new.pedido_id, old.pedido_id));
  return null;
end $$;

create or replace function public.exa2_tg_campaign_schedules()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pedido uuid;
begin
  select ca.pedido_id into v_pedido from public.campaigns_advanced ca where ca.id = coalesce(new.campaign_id, old.campaign_id);
  perform public.exa2_avisar_sync(v_pedido);
  return null;
end $$;

create or replace function public.exa2_tg_schedule_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pedido uuid;
begin
  select ca.pedido_id into v_pedido
    from public.campaign_video_schedules cvs join public.campaigns_advanced ca on ca.id = cvs.campaign_id
   where cvs.id = coalesce(new.campaign_video_schedule_id, old.campaign_video_schedule_id);
  -- (se o vínculo foi apagado junto, o gatilho do vínculo já avisou o pedido)
  perform public.exa2_avisar_sync(v_pedido);
  return null;
end $$;

drop trigger if exists exa2_sync_pedido_videos on public.pedido_videos;
create trigger exa2_sync_pedido_videos after insert or update or delete on public.pedido_videos
  for each row execute function public.exa2_tg_pedido_videos();

drop trigger if exists exa2_sync_campaign_schedules on public.campaign_video_schedules;
create trigger exa2_sync_campaign_schedules after insert or update or delete on public.campaign_video_schedules
  for each row execute function public.exa2_tg_campaign_schedules();

drop trigger if exists exa2_sync_schedule_rules on public.campaign_schedule_rules;
create trigger exa2_sync_schedule_rules after insert or update or delete on public.campaign_schedule_rules
  for each row execute function public.exa2_tg_schedule_rules();

-- pedido renovado / período alterado / prédios alterados / reativado -> a tela precisa receber os dados novos
create or replace function public.exa2_tg_pedidos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.data_inicio is distinct from old.data_inicio or new.data_fim is distinct from old.data_fim
     or new.lista_predios::text is distinct from old.lista_predios::text or new.status is distinct from old.status then
    perform public.exa2_avisar_sync(new.id);
  end if;
  return null;
end $$;

drop trigger if exists exa2_sync_pedidos on public.pedidos;
create trigger exa2_sync_pedidos after update on public.pedidos
  for each row execute function public.exa2_tg_pedidos();

-- rede de segurança a cada 5 min (substitui o de 6 em 6 h)
do $$ begin perform cron.unschedule('exa2-agenda-sync'); exception when others then null; end $$;
select cron.schedule('exa2-agenda-sync', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-agenda-sync',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000);
$cron$);

select 'OK: gatilhos criados e sincronizador a cada 5 min' as resultado;
