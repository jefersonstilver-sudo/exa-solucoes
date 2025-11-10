-- Corrigir a RPC get_buildings_current_video_count para lidar com lista_predios como TEXT[]
DROP FUNCTION IF EXISTS get_buildings_current_video_count(uuid[]);

CREATE OR REPLACE FUNCTION public.get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE(building_id uuid, current_videos_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest_id as building_id,
    COALESCE(COUNT(DISTINCT pv.video_id), 0)::bigint as current_videos_count
  FROM unnest(p_building_ids) as unnest_id
  LEFT JOIN pedidos p ON p.lista_predios @> ARRAY[unnest_id::text]
    AND p.status IN ('ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
    AND p.data_fim >= CURRENT_DATE
  LEFT JOIN pedido_videos pv ON pv.pedido_id = p.id
    AND pv.approval_status = 'approved'
    AND pv.is_active = true
    AND pv.selected_for_display = true
  GROUP BY unnest_id;
END;
$$;