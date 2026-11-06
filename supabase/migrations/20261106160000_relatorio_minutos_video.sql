-- EXA (06/11/2026): o relatório do anunciante lia video_management_logs linha a linha (1 linha por minuto) e,
-- em pedidos grandes (ex.: Kammer), a leitura estourava o tempo e o relatório saía sem o histórico de trocas.
-- Índice + resumo por dia/vídeo feito no banco.
create index if not exists idx_video_management_logs_pedido_criado on public.video_management_logs (pedido_id, created_at);

create or replace function public.relatorio_minutos_video(p_pedido uuid)
returns table (dia date, video_from uuid, video_to uuid, minutos integer, horas integer[], dows integer[])
language sql
stable
security definer
set search_path = public
as $$
  select (l.created_at at time zone 'America/Sao_Paulo')::date as dia,
         l.video_from_id, l.video_to_id, count(*)::integer,
         array_agg(distinct extract(hour from l.created_at at time zone 'America/Sao_Paulo')::integer),
         array_agg(distinct extract(dow from l.created_at at time zone 'America/Sao_Paulo')::integer)
  from public.video_management_logs l
  where l.pedido_id = p_pedido
  group by 1, 2, 3
$$;
revoke all on function public.relatorio_minutos_video(uuid) from public, anon, authenticated;
grant execute on function public.relatorio_minutos_video(uuid) to service_role;
