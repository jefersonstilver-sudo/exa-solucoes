-- ================================================
-- Correção de Pedidos Sem Parcelas e RPC de Stats Real v2
-- ================================================

-- 1. Criar parcela para pedido 83b0f0e4 (pago R$10 via ASAAS, sem parcela)
INSERT INTO parcelas (pedido_id, numero_parcela, valor_original, valor_final, status, data_vencimento, data_pagamento)
SELECT 
  '83b0f0e4-09b3-4608-ac77-1c8d100ff517', 
  1, 
  10.00,
  10.00, 
  'pago', 
  '2026-01-10'::date, 
  '2026-01-10'::date
WHERE NOT EXISTS (
  SELECT 1 FROM parcelas WHERE pedido_id = '83b0f0e4-09b3-4608-ac77-1c8d100ff517'
);

-- 2. Criar parcela para pedido 63e396d8 (pago R$10 via ASAAS, sem parcela)
INSERT INTO parcelas (pedido_id, numero_parcela, valor_original, valor_final, status, data_vencimento, data_pagamento)
SELECT 
  '63e396d8-5908-4e55-9eac-b7ffaba11beb', 
  1, 
  10.00,
  10.00, 
  'pago', 
  '2026-01-10'::date, 
  '2026-01-10'::date
WHERE NOT EXISTS (
  SELECT 1 FROM parcelas WHERE pedido_id = '63e396d8-5908-4e55-9eac-b7ffaba11beb'
);

-- 3. Atualizar valor_total dos pedidos com valor 0 ou NULL
UPDATE pedidos p
SET valor_total = subq.total_parcelas
FROM (
  SELECT pedido_id, COALESCE(SUM(valor_final), 0) as total_parcelas
  FROM parcelas
  GROUP BY pedido_id
) subq
WHERE p.id = subq.pedido_id
  AND (p.valor_total = 0 OR p.valor_total IS NULL)
  AND subq.total_parcelas > 0;

-- 4. Atualizar a função get_orders_stats_real com cálculos precisos
CREATE OR REPLACE FUNCTION get_orders_stats_real()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_receita_confirmada NUMERIC := 0;
  v_receita_prevista NUMERIC := 0;
  v_pedidos_ativos INTEGER := 0;
  v_pedidos_finalizados INTEGER := 0;
  v_pedidos_processando INTEGER := 0;
  v_pedidos_aguardando_contrato INTEGER := 0;
  v_pedidos_pendentes INTEGER := 0;
  v_pedidos_bloqueados INTEGER := 0;
  v_pedidos_cancelados INTEGER := 0;
  v_total_tentativas INTEGER := 0;
  v_valor_abandonado NUMERIC := 0;
  v_total_orders INTEGER := 0;
BEGIN
  -- Receita CONFIRMADA: Parcelas com status 'pago'
  SELECT COALESCE(SUM(valor_final), 0) INTO v_receita_confirmada
  FROM parcelas WHERE status = 'pago';
  
  -- Receita PREVISTA: Parcelas pagas + aguardando
  SELECT COALESCE(SUM(valor_final), 0) INTO v_receita_prevista
  FROM parcelas WHERE status IN ('pago', 'aguardando_pagamento');
  
  -- Total de pedidos
  SELECT COUNT(*) INTO v_total_orders FROM pedidos;
  
  -- Pedidos ATIVOS: Em exibição com data_fim > hoje
  SELECT COUNT(*) INTO v_pedidos_ativos
  FROM pedidos 
  WHERE status IN ('ativo', 'video_aprovado') 
    AND data_fim > CURRENT_DATE;
  
  -- Pedidos FINALIZADOS: Expirados
  SELECT COUNT(*) INTO v_pedidos_finalizados
  FROM pedidos 
  WHERE status IN ('ativo', 'video_aprovado') 
    AND data_fim <= CURRENT_DATE;
  
  -- Pedidos PROCESSANDO: Aguardando vídeo/aprovação
  SELECT COUNT(*) INTO v_pedidos_processando
  FROM pedidos 
  WHERE status IN ('aguardando_video', 'video_enviado');
  
  -- Pedidos AGUARDANDO CONTRATO
  SELECT COUNT(*) INTO v_pedidos_aguardando_contrato
  FROM pedidos WHERE status = 'aguardando_contrato';
  
  -- Pedidos PENDENTES (aguardando pagamento)
  SELECT COUNT(*) INTO v_pedidos_pendentes
  FROM pedidos WHERE status = 'pendente';
  
  -- Pedidos BLOQUEADOS (incluindo legados)
  SELECT COUNT(*) INTO v_pedidos_bloqueados
  FROM pedidos WHERE status IN ('bloqueado', 'pago_pendente_video');
  
  -- Pedidos CANCELADOS
  SELECT COUNT(*) INTO v_pedidos_cancelados
  FROM pedidos WHERE status IN ('cancelado', 'cancelado_automaticamente');
  
  -- TENTATIVAS
  SELECT COUNT(*) INTO v_total_tentativas FROM tentativas_compra;
  
  -- Valor abandonado
  SELECT COALESCE(SUM(valor_total), 0) INTO v_valor_abandonado 
  FROM tentativas_compra;
  
  SELECT json_build_object(
    'total_orders', v_total_orders,
    'receita_confirmada', v_receita_confirmada,
    'receita_prevista', v_receita_prevista,
    'pedidos_ativos', v_pedidos_ativos,
    'pedidos_finalizados', v_pedidos_finalizados,
    'pedidos_processando', v_pedidos_processando,
    'pedidos_aguardando_contrato', v_pedidos_aguardando_contrato,
    'pedidos_pendentes', v_pedidos_pendentes,
    'pedidos_bloqueados', v_pedidos_bloqueados,
    'pedidos_cancelados', v_pedidos_cancelados,
    'total_tentativas', v_total_tentativas,
    'valor_abandonado', v_valor_abandonado
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir acesso
GRANT EXECUTE ON FUNCTION get_orders_stats_real() TO authenticated;