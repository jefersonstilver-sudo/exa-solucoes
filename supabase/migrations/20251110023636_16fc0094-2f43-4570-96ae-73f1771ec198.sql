-- Sistema de Status Inteligente para Pedidos
-- Analisa o estado real dos vídeos e calcula o status correto

-- Função RPC para retornar pedidos com status inteligente
CREATE OR REPLACE FUNCTION get_pedidos_com_status_inteligente()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  correct_status text,
  valor_total numeric,
  lista_paineis text[],
  lista_predios text[],
  plano_meses integer,
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  cupom_id uuid,
  video_status text,
  has_active_video boolean,
  has_approved_video boolean,
  has_any_video boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.status,
    CASE
      -- Se tem vídeo ativo e aprovado = Em Exibição
      WHEN EXISTS (
        SELECT 1 FROM pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.is_active = true 
        AND pv.is_approved = true
      ) THEN 'em_exibicao'
      
      -- Se tem vídeo mas não está aprovado = Aguardando Aprovação
      WHEN EXISTS (
        SELECT 1 FROM pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.is_approved = false
      ) THEN 'aguardando_aprovacao'
      
      -- Se está pago mas não tem vídeo = Aguardando Vídeo
      WHEN p.status IN ('pago', 'pago_pendente_video') 
      AND NOT EXISTS (
        SELECT 1 FROM pedido_videos pv 
        WHERE pv.pedido_id = p.id
      ) THEN 'aguardando_video'
      
      -- Se está pendente = Aguardando Pagamento
      WHEN p.status = 'pendente' THEN 'aguardando_pagamento'
      
      -- Se foi cancelado = Cancelado
      WHEN p.status = 'cancelado' THEN 'cancelado'
      
      -- Se foi cancelado automaticamente = Cancelado Automaticamente
      WHEN p.status = 'cancelado_automaticamente' THEN 'cancelado_automaticamente'
      
      -- Se está bloqueado = Bloqueado
      WHEN p.status = 'bloqueado' THEN 'bloqueado'
      
      -- Fallback: manter status original
      ELSE p.status
    END as correct_status,
    p.valor_total,
    p.lista_paineis,
    p.lista_predios,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    p.created_at,
    p.updated_at,
    p.cupom_id,
    p.video_status,
    -- Flags úteis para debugging
    EXISTS (
      SELECT 1 FROM pedido_videos pv 
      WHERE pv.pedido_id = p.id 
      AND pv.is_active = true
    ) as has_active_video,
    EXISTS (
      SELECT 1 FROM pedido_videos pv 
      WHERE pv.pedido_id = p.id 
      AND pv.is_approved = true
    ) as has_approved_video,
    EXISTS (
      SELECT 1 FROM pedido_videos pv 
      WHERE pv.pedido_id = p.id
    ) as has_any_video
  FROM pedidos p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_pedidos_com_status_inteligente() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pedidos_com_status_inteligente() TO service_role;

COMMENT ON FUNCTION get_pedidos_com_status_inteligente() IS 'Retorna pedidos com status calculado dinamicamente baseado no estado dos vídeos';