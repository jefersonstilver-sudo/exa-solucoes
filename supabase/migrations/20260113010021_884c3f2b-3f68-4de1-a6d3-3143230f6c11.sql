-- =============================================
-- CORREÇÃO FINANCEIRA: Estatísticas Reais de Pedidos
-- =============================================

-- 1. Criar função RPC para estatísticas reais baseadas em parcelas pagas
CREATE OR REPLACE FUNCTION get_orders_stats_real()
RETURNS JSON AS $$
DECLARE
  result JSON;
  now_date DATE := CURRENT_DATE;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM pedidos),
    'receita_confirmada', (SELECT COALESCE(SUM(valor_final), 0) FROM parcelas WHERE status = 'pago'),
    'receita_prevista', (SELECT COALESCE(SUM(valor_final), 0) FROM parcelas WHERE status IN ('pago', 'aguardando_pagamento', 'pending')),
    'pedidos_ativos', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('ativo', 'video_aprovado') 
      AND data_fim > now_date
    ),
    'pedidos_finalizados', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('ativo', 'video_aprovado') 
      AND data_fim <= now_date
    ),
    'pedidos_processando', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('aguardando_video', 'video_enviado')
    ),
    'pedidos_aguardando_contrato', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status = 'aguardando_contrato'
    ),
    'pedidos_pendentes', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status = 'pendente'
    ),
    'pedidos_bloqueados', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('bloqueado', 'pago_pendente_video')
    ),
    'pedidos_cancelados', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status = 'cancelado'
    ),
    'total_tentativas', (SELECT COUNT(*) FROM tentativas_compra),
    'valor_abandonado', (SELECT COALESCE(SUM(valor_total), 0) FROM tentativas_compra)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir pedidos ativos com valor_total = 0 (buscar das parcelas)
UPDATE pedidos p
SET valor_total = (
  SELECT COALESCE(SUM(valor_final), 0) 
  FROM parcelas 
  WHERE pedido_id = p.id
)
WHERE valor_total = 0 
  AND status IN ('ativo', 'video_aprovado', 'aguardando_contrato', 'aguardando_video', 'video_enviado')
  AND EXISTS (SELECT 1 FROM parcelas WHERE pedido_id = p.id);

-- 3. Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION get_orders_stats_real() TO authenticated;