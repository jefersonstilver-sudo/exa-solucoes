-- MÁQUINA DE ESTADOS OFICIAL DO PEDIDO
-- Fase 1: Criação da tabela de log de status

-- 1. Criar tabela de auditoria de status
CREATE TABLE IF NOT EXISTS pedido_status_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT NOT NULL,
  status_novo TEXT NOT NULL,
  disparado_por UUID, -- NULL = system
  origem TEXT NOT NULL CHECK (origem IN ('ui', 'webhook', 'cron', 'edge_function', 'migration')),
  motivo TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedido_status_log_pedido ON pedido_status_log(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_status_log_created ON pedido_status_log(created_at DESC);

-- 2. Migrar status legados antes de aplicar constraint
-- Migrar 'pago_pendente_video' para 'bloqueado'
UPDATE pedidos 
SET status = 'bloqueado'
WHERE status = 'pago_pendente_video';

-- Migrar 'pago' para 'aguardando_contrato'
UPDATE pedidos 
SET status = 'aguardando_contrato'
WHERE status = 'pago';

-- Registrar migrações no log
INSERT INTO pedido_status_log (pedido_id, status_anterior, status_novo, origem, motivo)
SELECT id, 'pago_pendente_video', 'bloqueado', 'migration', 'Migração de status legado - Máquina de Estados v1.0'
FROM pedidos WHERE status = 'bloqueado' AND id NOT IN (SELECT pedido_id FROM pedido_status_log WHERE motivo LIKE '%Migração%');

INSERT INTO pedido_status_log (pedido_id, status_anterior, status_novo, origem, motivo)
SELECT id, 'pago', 'aguardando_contrato', 'migration', 'Migração de status legado - Máquina de Estados v1.0'
FROM pedidos WHERE status = 'aguardando_contrato' AND id NOT IN (SELECT pedido_id FROM pedido_status_log WHERE motivo LIKE '%Migração%');

-- 3. Adicionar constraint de status válidos (somente após migração)
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos
ADD CONSTRAINT pedidos_status_check
CHECK (status IN (
  'pendente', 
  'aguardando_contrato', 
  'aguardando_video',
  'video_enviado', 
  'video_aprovado', 
  'ativo',
  'finalizado', 
  'cancelado', 
  'cancelado_automaticamente',
  'bloqueado'
));

-- 4. Criar função de trigger para log automático
CREATE OR REPLACE FUNCTION fn_log_pedido_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO pedido_status_log (
      pedido_id, 
      status_anterior, 
      status_novo,
      disparado_por, 
      origem
    ) VALUES (
      NEW.id, 
      COALESCE(OLD.status, 'novo'), 
      NEW.status,
      auth.uid(),
      'edge_function'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger
DROP TRIGGER IF EXISTS trg_pedido_status_log ON pedidos;
CREATE TRIGGER trg_pedido_status_log
AFTER UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_log_pedido_status_change();

-- 6. Atualizar/Criar RPC get_orders_stats_real (cálculo canônico)
CREATE OR REPLACE FUNCTION get_orders_stats_real()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM pedidos),
    'receita_confirmada', (
      SELECT COALESCE(SUM(valor_final), 0) 
      FROM parcelas 
      WHERE status = 'pago'
    ),
    'receita_prevista', (
      SELECT COALESCE(SUM(valor_final), 0) 
      FROM parcelas 
      WHERE status IN ('pago', 'pendente', 'atrasado', 'aguardando_pagamento')
    ),
    'pedidos_ativos', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status = 'ativo' 
      AND data_fim > CURRENT_DATE
    ),
    'pedidos_processando', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('aguardando_contrato', 'aguardando_video', 'video_enviado', 'video_aprovado')
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
      WHERE status = 'bloqueado'
    ),
    'pedidos_cancelados', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status IN ('cancelado', 'cancelado_automaticamente')
    ),
    'pedidos_finalizados', (
      SELECT COUNT(*) FROM pedidos 
      WHERE status = 'ativo' AND data_fim <= CURRENT_DATE
    ),
    'total_tentativas', (SELECT COUNT(*) FROM tentativas_compra),
    'valor_abandonado', (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM tentativas_compra
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS para tabela de log
ALTER TABLE pedido_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all status logs" ON pedido_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'admin_financeiro')
    )
  );

CREATE POLICY "System can insert status logs" ON pedido_status_log
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE pedido_status_log IS 'Auditoria de mudanças de status - Máquina de Estados Oficial v1.0';