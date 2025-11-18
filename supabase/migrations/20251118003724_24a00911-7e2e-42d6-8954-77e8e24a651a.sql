-- Fix timezone bug in get_buildings_current_video_count function
-- Replace (now() AT TIME ZONE 'America/Sao_Paulo')::date with CURRENT_DATE for consistency

CREATE OR REPLACE FUNCTION public.get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE(building_id uuid, current_videos_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH target_buildings AS (
    SELECT unnest(p_building_ids) AS bid
  ),
  pedidos_for_building AS (
    SELECT tb.bid AS building_id, p.id AS pedido_id
    FROM target_buildings tb
    JOIN pedidos p 
      ON (p.lista_predios @> ARRAY[tb.bid::text])
    WHERE p.status IN ('ativo','video_aprovado','pago_pendente_video','video_enviado','pago')
      AND (p.data_inicio IS NULL OR p.data_inicio <= CURRENT_DATE)
      AND (p.data_fim IS NULL OR p.data_fim >= CURRENT_DATE)
  ),
  current_videos AS (
    SELECT pfb.building_id, gv.video_id
    FROM pedidos_for_building pfb
    LEFT JOIN LATERAL get_current_display_video(pfb.pedido_id) AS gv ON TRUE
  )
  SELECT cv.building_id, COUNT(DISTINCT cv.video_id)::int AS current_videos_count
  FROM current_videos cv
  WHERE cv.video_id IS NOT NULL
  GROUP BY cv.building_id;
END;
$$;