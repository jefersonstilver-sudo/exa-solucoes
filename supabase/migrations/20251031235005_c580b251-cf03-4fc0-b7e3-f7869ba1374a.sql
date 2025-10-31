-- ============================================
-- FASE 1: OTIMIZAÇÕES DE PERFORMANCE BACKEND
-- ============================================

-- ⚡ OTIMIZAÇÃO 4: Índices GIN para queries JSONB
-- ============================================

-- Índice para lista_predios (usado em TODAS as queries de campanhas)
CREATE INDEX IF NOT EXISTS idx_pedidos_lista_predios_gin 
ON public.pedidos USING GIN (lista_predios);

-- Índice composto para queries de campanhas ativas
CREATE INDEX IF NOT EXISTS idx_pedidos_status_data_fim 
ON public.pedidos (status, data_fim) 
WHERE status IN ('video_aprovado', 'pago_pendente_video', 'video_enviado', 'ativo', 'pago');

-- Índice para pedido_videos (queries de vídeos por pedido)
CREATE INDEX IF NOT EXISTS idx_pedido_videos_pedido_status 
ON public.pedido_videos (pedido_id, approval_status, is_active);

-- Índice para schedule rules (usado pela edge function)
CREATE INDEX IF NOT EXISTS idx_campaign_schedule_rules_active 
ON public.campaign_schedule_rules (is_active, days_of_week) 
WHERE is_active = true;

-- Índice para lista_paineis (usado pela playlist API)
CREATE INDEX IF NOT EXISTS idx_pedidos_lista_paineis_gin 
ON public.pedidos USING GIN (lista_paineis);

-- ⚡ OTIMIZAÇÃO 3: RPC Batch para vídeos atuais
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_display_videos_batch(
  p_pedido_ids uuid[]
)
RETURNS TABLE(
  pedido_id uuid,
  video_id uuid,
  is_scheduled boolean,
  priority_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH batch_results AS (
    SELECT 
      unnest(p_pedido_ids) as pid
  )
  SELECT 
    br.pid as pedido_id,
    cdv.video_id,
    cdv.is_scheduled,
    cdv.priority_type
  FROM batch_results br
  CROSS JOIN LATERAL (
    SELECT * FROM public.get_current_display_video(br.pid)
  ) cdv
  WHERE cdv.video_id IS NOT NULL;
END;
$function$;

-- ⚡ OTIMIZAÇÃO 8: RPC otimizada para playlist API
-- ============================================

CREATE OR REPLACE FUNCTION public.get_active_videos_for_panel(
  p_panel_id text
)
RETURNS TABLE(
  video_url text,
  video_nome text,
  video_duracao integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.url as video_url,
    v.nome as video_nome,
    v.duracao as video_duracao
  FROM public.pedidos p
  JOIN public.pedido_videos pv ON pv.pedido_id = p.id
  JOIN public.videos v ON v.id = pv.video_id
  WHERE p.lista_paineis @> ARRAY[p_panel_id]::text[]
    AND p.status IN ('video_aprovado', 'pago_pendente_video', 'video_enviado', 'ativo', 'pago')
    AND p.data_fim >= CURRENT_DATE
    AND pv.approval_status = 'approved'
    AND pv.is_active = true
  ORDER BY pv.slot_position ASC
  LIMIT 1;
END;
$function$;

-- Comentários explicativos
COMMENT ON INDEX idx_pedidos_lista_predios_gin IS 
  'FASE 1: Acelera queries que filtram por lista_predios (campanhas por prédio)';

COMMENT ON INDEX idx_pedidos_lista_paineis_gin IS 
  'FASE 1: Acelera queries que filtram por lista_paineis (playlist API)';

COMMENT ON FUNCTION get_current_display_videos_batch IS 
  'FASE 1: Retorna vídeos atuais para múltiplos pedidos em uma única chamada (elimina N+1)';

COMMENT ON FUNCTION get_active_videos_for_panel IS 
  'FASE 1: Retorna vídeo ativo para um painel específico (otimiza playlist API)';