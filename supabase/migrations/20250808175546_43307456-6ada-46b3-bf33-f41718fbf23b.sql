-- Function and index for counting current videos in display per building
-- 1) Performance index on pedidos.lista_predios
CREATE INDEX IF NOT EXISTS idx_pedidos_lista_predios_gin
ON public.pedidos USING GIN (lista_predios);

-- 2) RPC: get_buildings_current_video_count
CREATE OR REPLACE FUNCTION public.get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE(building_id uuid, current_videos_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  RETURN QUERY
  WITH target_buildings AS (
    SELECT unnest(p_building_ids) AS building_id
  ),
  pedidos_for_building AS (
    SELECT tb.building_id, p.id AS pedido_id
    FROM target_buildings tb
    JOIN public.pedidos p 
      ON (p.lista_predios @> ARRAY[tb.building_id::text])
    WHERE p.status IN ('ativo','video_aprovado','pago_pendente_video','video_enviado','pago')
      AND (p.data_inicio IS NULL OR p.data_inicio <= v_today)
      AND (p.data_fim IS NULL OR p.data_fim >= v_today)
  ),
  current_videos AS (
    SELECT pfb.building_id, gv.video_id
    FROM pedidos_for_building pfb
    LEFT JOIN LATERAL public.get_current_display_video(pfb.pedido_id) AS gv ON TRUE
  )
  SELECT building_id, COUNT(DISTINCT video_id)::int AS current_videos_count
  FROM current_videos
  WHERE video_id IS NOT NULL
  GROUP BY building_id;
END;
$$;

-- 3) Grant execute to authenticated (read-only usage from app)
GRANT EXECUTE ON FUNCTION public.get_buildings_current_video_count(uuid[]) TO anon, authenticated;

-- 4) Log
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('MIGRATION', 'Created RPC get_buildings_current_video_count and GIN index on pedidos.lista_predios');